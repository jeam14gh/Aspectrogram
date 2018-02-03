namespace Amaq.Acloud.AsdaqService.Business
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Aspectrogram.Entities;
    using Models;
    using Helpers;
    using Helpers.CircularBuffer;
    using log4net;
    using Aspectrogram.Entities.ValueObjects;
    using Aspectrogram.Entities.Enums;
    using Entities.Core;
    using Entities.ValueObjects;
    using Proxy.Core;
    using System.Security;
    using Entities.Mappers;
    using Libraries.FIRFilter;

    internal class AcquisitionBl
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private Asdaq _asdaqConfiguration = null;
        private List<AcquisitionUnit> _niAdquisitionUnits = null;
        private const double _DEFAULT_MINUTES_BEFORE = 1.0;
        private object _locker = new object();
        public volatile static HighPass hpfFir = new HighPass();
        public int numCoeff = 0;

        // Búfer principal del sistema que mantiene siempre una cantidad determinada de datos adquiridos por cada Asset
        private volatile Dictionary<string, Dictionary<string, CircularBuffer<BufferDataItem>>> _acquisitionBuffer = null;

        // Mantiene los estados de condición actual para cada asset y cada measurementPoint asociado al asset
        private Dictionary<string, CurrentStatusByAsset> _currentStatusByAsset = null;

        // Mantiene una referencia del evento en proceso por cada asset. Solo se puede grabar un evento al tiempo por cada asset
        private Dictionary<string, EventsInProcess> _eventsInProcessByAsset = null;

        public AcquisitionBl(Asdaq asdaqConfiguration)
        {
            _asdaqConfiguration = asdaqConfiguration;
        }

        /// <summary>
        /// Aplica los cambios dinamicamente en las entidades especificadas, sin detener la adquisición
        /// </summary>
        /// <param name="changedEntities">Objeto con las entidades que han cambiado</param>
        public void ApplyChanges(ChangedEntities changedEntities)
        {
            changedEntities.SubVariables?
                .ForEach(changedSubVariable =>
                {
                    var subVariable =
                        _asdaqConfiguration.RelatedMeasurementPoints.SelectMany(m => m.SubVariables).Where(s => s.Id == changedSubVariable.Id).FirstOrDefault();

                    if (subVariable != null)
                    {
                        subVariable.Maximum = changedSubVariable.Maximum;
                        subVariable.Minimum = changedSubVariable.Minimum;
                        subVariable.DeadBand = changedSubVariable.DeadBand;
                        subVariable.MinimumHistoricalDataBand = changedSubVariable.MinimumHistoricalDataBand;
                        subVariable.InitialAxialPosition = changedSubVariable.InitialAxialPosition;
                        subVariable.ThresholdLatency = changedSubVariable.ThresholdLatency;
                        subVariable.Bands = changedSubVariable.Bands;

                        if(changedSubVariable.Bands == null)
                        {
                            subVariable.BandsOrderBySeverityDesc = null;
                        }
                        else
                        {
                            List<BandWithSeverity> bandsWithSeverity = subVariable.BandsOrderBySeverityDesc;

                            changedSubVariable.Bands
                                .ForEach(changedBand =>
                                {
                                    var bandWithSeverity = bandsWithSeverity.Where(b => b.StatusId == changedBand.StatusId).FirstOrDefault();

                                    if (bandWithSeverity != null)
                                    {
                                        bandWithSeverity.LowerThreshold = changedBand.LowerThreshold;
                                        bandWithSeverity.UpperThreshold = changedBand.UpperThreshold;
                                    }
                                    else
                                    {
                                        bandsWithSeverity.Add(new BandWithSeverity()
                                        {
                                            LowerThreshold = changedBand.LowerThreshold,
                                            UpperThreshold = changedBand.UpperThreshold,
                                            StatusId = changedBand.StatusId,
                                            Severity = AsdaqProperties.RiskStatus.Where(rs => rs.Id == changedBand.StatusId).FirstOrDefault().Severity
                                        });
                                    }
                                });

                            bandsWithSeverity.RemoveAll(
                                bws => !changedSubVariable.Bands.Select(b => b.StatusId).ToList().Contains(bws.StatusId));

                            // Asignar lista de threshold ordenados de forma descendente por la propiedad Severity
                            subVariable.BandsOrderBySeverityDesc = bandsWithSeverity.OrderByDescending(t => t.Severity).ToList();
                        }                   
                    }
                });

            changedEntities.Assets?
                .ForEach(changedAsset =>
                {
                    var asset =
                        _asdaqConfiguration.RelatedPrincipalAssets.Where(pa => pa.Id == changedAsset.Id).FirstOrDefault();

                    if (asset != null)
                    {
                        asset.NormalInterval = changedAsset.NormalInterval;
                        AssetBl.ChangeRpmEventConfig(asset.RpmEventConfig, changedAsset.RpmEventConfig);
                        AssetBl.ChangeConditionStatusEventsConfig(asset.ConditionStatusEventsConfig, changedAsset.ConditionStatusEventsConfig);                
                    }
                });
        }

        /// <summary>
        /// Configura e inicia las unidades de adquisición de señales
        /// </summary>
        public void ConfigureAndStart()
        {
            Configure();
            numCoeff = hpfFir.GetFactors(AsdaqProperties.SamplesToRead).OrderBy(x => Math.Abs(x - 1000)).First();

            // Se registra por cada unidad de adquisición un event handler donde se notifican las muestras adquiridas por cada Ai Channel configurado
            _niAdquisitionUnits.ForEach(au => au.NiAcquisition.AdquisitionDone +=
                (object sender, List<NiSamplesAcquired> e) =>
                {
                    // Procesar señales solo si el procesador de señales para la actual AcquisitionUnit está disponible                            
                    if ((au.Processor == null) || (au.Processor.IsCompleted))
                    {
                        au.Processor = new TaskFactory().StartNew(() =>
                        {
                            try
                            {
                                log.Debug("1. ADQUISICION COMPLETADA");

                                var assets = _asdaqConfiguration.RelatedPrincipalAssets;
                                var measurementPoints = new List<MdVariableExtension>();
                                var measurementPointBl = new MeasurementPointBl();

                                var locker = new object();

                                // Por cada device
                                Parallel.ForEach(e, (s) =>
                                {
                                    var measurementPointsByDevice = _asdaqConfiguration.RelatedMeasurementPoints.Where(v => v.SamplesAcquiredFullId == s.FullId).ToList();

                                    // Setear a cada measurementPoint las muestras adquiridas
                                    Parallel.ForEach(measurementPointsByDevice, (v) =>
                                        {
                                            v.SamplesAcquired = s.Samples.SliceRow(v.SamplesAcquiredIndex).ToArray();
                                            var samplesCount = v.SamplesAcquired.Length;

                                            if ((v.SamplesToDb <= 0) || (v.SamplesToDb > samplesCount))
                                            {
                                                //log.Debug("SamplesToDb debe ser un numero mayor que 0 y menor o igual que SamplesToRead");
                                            }
                                            else
                                            {
                                                if (v.SamplesToDb < samplesCount)
                                                {
                                                    // Recorta las muestras
                                                    v.SamplesAcquired = v.SamplesAcquired.Take(v.SamplesToDb).ToArray();
                                                }
                                            }
                                        });

                                    //var assetBuffer = _acquisitionBuffer[/*measurementPointsByDevice[0].ParentId*/measurementPointsByDevice[0].PrincipalAssetId];

                                    //if (assetBuffer[measurementPointsByDevice[0].Id].Count >= 2)
                                    //{
                                        new TaskFactory().StartNew(() =>
                                        {
                                            measurementPointBl.CalculateMeasures(ref measurementPointsByDevice, s.TimeStamp, s.SampleRate, _acquisitionBuffer, ref hpfFir, numCoeff);
                                            log.Debug("2. CALCULO DE MEDIDAS COMPLETADO PARA DEVICE " + s.DeviceId);
                                        })
                                        .GetAwaiter().GetResult();
                                    //}

                                    // Protección de acceso concurrente al objeto
                                    lock (locker)
                                    {
                                        measurementPoints.AddRange(measurementPointsByDevice);
                                    }
                                });

                                // Solo comienza a tomar decisiones con la medidas y señales si hay 2 o más señales en el buffer
                                // esto principalmente es para los sensores que requieren integración de la señal, ya que el
                                // filtro pasa altos que se le debe aplicar se demora x cantidad de muestras para responder
                                // y por esto se requiere al menos 2 señales en el buffer, las cuales son suficientes para desechar
                                // la respuesta del filtro
                                if (_acquisitionBuffer[/*measurementPoints[0].ParentId*/measurementPoints[0].PrincipalAssetId][measurementPoints[0].Id].Count >= 2)
                                {
                                    //var assets = _asdaqConfiguration.RelatedPrincipalAssets; //_asdaqConfiguration.RelatedAssets;

                                    new TaskFactory().StartNew(() =>
                                    {
                                        try
                                        {
                                            new AssetBl().StatusResolve(ref assets, measurementPoints, ref _currentStatusByAsset);
                                            log.Debug("3. RESOLUCION DE ESTADO DE LOS ASSET Y SUS MEASUREMENT POINTS COMPLETADO");
                                        }
                                        catch (Exception ex)
                                        {
                                            log.Error("Ha ocurrido un error en StatusResolve", ex);
                                        }
                                    })
                                    .GetAwaiter().GetResult();

                                    if (AsdaqProperties.UseRedundantAcloudForHMI)
                                    {
                                        if ((au.UpdateRealtimeProcessorForHMI == null) || (au.UpdateRealtimeProcessorForHMI.IsCompleted))
                                        {
                                            au.UpdateRealtimeProcessorForHMI = new TaskFactory().StartNew(() =>
                                            {
                                                try
                                                {
                                                    measurementPointBl.UpdateRealTime(measurementPoints, _currentStatusByAsset, assets, true);
                                                    log.Debug("4. ACTUALIZACION DE DATOS TIEMPO REAL PARA HMI COMPLETADO");
                                                }
                                                catch (Exception ex)
                                                {
                                                    log.Error("Ha ocurrido un error en UpdateRealTime para HMI", ex);
                                                }
                                            });
                                        }
                                    }

                                    // Solo se usa un subproceso de actualización de datos en tiempo real en el servidor por cada
                                    // unidad de adquisición, ya que no suba tiempo real si está ocupado el subproceso
                                    if ((au.UpdateRealtimeProcessor == null) || (au.UpdateRealtimeProcessor.IsCompleted))
                                    {
                                        au.UpdateRealtimeProcessor = new TaskFactory().StartNew(() =>
                                        {
                                            try
                                            {
                                                measurementPointBl.UpdateRealTime(measurementPoints, _currentStatusByAsset, assets);
                                                log.Debug("4. ACTUALIZACION DE DATOS TIEMPO REAL EN SERVIDOR COMPLETADO");
                                            }
                                            catch (Exception ex)
                                            {
                                                log.Error("Ha ocurrido un error en UpdateRealTime", ex);
                                            }
                                        });
                                    }

                                    //// Se pasa _aquisitionBuffer como parámetro xq en pruebas de concepto se comprobó que así es la única manera
                                    //// de que esta variable no cambie durante el procesamiento del Thread
                                    //if ((au.HistoricalDataProcessor == null) || (au.HistoricalDataProcessor.IsCompleted))
                                    //{
                                    //    au.HistoricalDataProcessor = new TaskFactory().StartNew((state) =>
                                    //    {
                                    //        try
                                    //        {
                                    //            // Conversión al tipo del búfer de adquisición
                                    //            var acquisitionBuffer = (Dictionary<string, Dictionary<string, CircularBuffer<BufferDataItem>>>)state;

                                    //            new AssetBl().ManageHistoricalData(ref assets, ref measurementPoints, acquisitionBuffer,
                                    //                ref _eventsInProcessByAsset, _currentStatusByAsset, _asdaqConfiguration.MailAccountConfiguration);
                                    //            log.Debug("5. GESTION DE DATOS HISTORICOS COMPLETADO");
                                    //        }
                                    //        catch (Exception ex)
                                    //        {
                                    //            log.Error("Ha ocurrido un error en ManageHistoricalData", ex);
                                    //        }
                                    //    }, _acquisitionBuffer);
                                    //}
                                    //else
                                    //{
                                    //    log.Debug("Paquete perdido en evento :(");
                                    //}
                                }

                                new TaskFactory().StartNew(() =>
                                {
                                    try
                                    {
                                        // Actualizar búfer con los nuevos datos adquiridos
                                        measurementPoints.GroupBy(p => p.PrincipalAssetId).ToList().ForEach(measurementPointGroup =>
                                            {
                                                // Obtener eventos en proceso del asset actual
                                                var eventsInProcess = _eventsInProcessByAsset[measurementPointGroup.Key];
                                                //var tmpIsNormal = eventsInProcess.IsNormal;
                                                //var tmpIsChangeOfRpm = eventsInProcess.IsChangeOfRpm;
                                                //var tmpIsChangeOfConditionStatus = eventsInProcess.IsChangeOfConditionStatus;
                                                
                                                measurementPointGroup.ToList().ForEach(p =>
                                                {
                                                    double[] rawWaveform = null;
                                                    double[] waveform = null;
                                                    double rpm = 0.0;

                                                    if ((p.SensorTypeCode == 2) &&
                                                        (p.Integrate))
                                                    {
                                                        rawWaveform = p.SamplesAcquired;
                                                        waveform = p.IntegratedWaveform;
                                                    }
                                                    else
                                                    {
                                                        waveform = p.SamplesAcquired;
                                                    }

                                                    if ((p.IsAngularReference))
                                                    {
                                                        var objectValue =
                                                            p.SubVariables
                                                                .Where(s => s.MeasureType == MeasureType.Rpm)
                                                                .First().Value;
                                                        rpm =
                                                            (objectValue != null)
                                                            ?
                                                            (double)p.SubVariables
                                                                .Where(s => s.MeasureType == MeasureType.Rpm)
                                                                .First().Value
                                                            :
                                                            0.0;
                                                    }

                                                    // [AssetId][MeasurementPointId]
                                                    lock (_locker)
                                                    {
                                                        //if (tmpIsNormal != eventsInProcess.IsNormal)
                                                        //{
                                                        //    log.Info("Cambio IsNormal para el punto de medicion " + p.Name);
                                                        //}
                                                        _acquisitionBuffer[measurementPointGroup.Key][p.Id].Enqueue(
                                                        new BufferDataItem(
                                                            p.SubVariables[0].TimeStamp,
                                                            p.SubVariables.Select(
                                                                s => new BufferSubVariableItem(
                                                                    s.Id,
                                                                    (s.Status != null) ? s.Status[0] : string.Empty,
                                                                    s.Value)).ToList(),
                                                            rawWaveform,
                                                            waveform,
                                                            rpm,
                                                            false,
                                                            false,
                                                            false,
                                                            //eventsInProcess.IsNormal,
                                                            //eventsInProcess.IsChangeOfRpm,
                                                            //eventsInProcess.IsChangeOfConditionStatus,
                                                            false));
                                                    }
                                                });
                                                
                                                // Resetear banderas de evento para que sean definidas en la próxima adquisición
                                                //eventsInProcess.IsNormal = false;
                                                //eventsInProcess.IsChangeOfRpm = false;
                                                //eventsInProcess.IsChangeOfConditionStatus = false;
                                            });


                                        if (_acquisitionBuffer[measurementPoints[0].PrincipalAssetId][measurementPoints[0].Id].Count >= 2)
                                        {
                                            // Se pasa _aquisitionBuffer como parámetro xq en pruebas de concepto se comprobó que así es la única manera
                                            // de que esta variable no cambie durante el procesamiento del Thread
                                            if ((au.HistoricalDataProcessor == null) || (au.HistoricalDataProcessor.IsCompleted))
                                            {
                                                au.HistoricalDataProcessor = new TaskFactory().StartNew((state) =>
                                                {
                                                    try
                                                    {
                                                        // Conversión al tipo del búfer de adquisición
                                                        var acquisitionBuffer = (Dictionary<string, Dictionary<string, CircularBuffer<BufferDataItem>>>)state;

                                                        new AssetBl().ManageHistoricalData(ref assets, ref measurementPoints, acquisitionBuffer,
                                                            ref _eventsInProcessByAsset, _currentStatusByAsset, _asdaqConfiguration.MailAccountConfiguration);
                                                        log.Debug("5. GESTION DE DATOS HISTORICOS COMPLETADO");
                                                    }
                                                    catch (Exception ex)
                                                    {
                                                        log.Error("Ha ocurrido un error en ManageHistoricalData", ex);
                                                    }
                                                }, _acquisitionBuffer);
                                            }
                                            else
                                            {
                                                log.Info("Paquete perdido en evento :(");
                                            }
                                        }

                                        log.Debug("6. ACTUALIZACION DE BUFER DE DATOS ADQUIRIDOS COMPLETADO");
                                    }
                                    catch (Exception ex)
                                    {
                                        log.Error("Ha ocurrido un error actualizando el bufer de datos adquiridos", ex);
                                    }
                                });
                                //.GetAwaiter().GetResult();
                            }
                            catch (Exception ex)
                            {
                                log.Error("Error en AdquisitionDone", ex);
                            }
                        });
                    }
                    else
                    {
                        log.Info("Paquete perdido :(");
                    }
                });

            _acquisitionBuffer = new Dictionary<string, Dictionary<string, CircularBuffer<BufferDataItem>>>();

            for (int i = 0; i < _asdaqConfiguration.RelatedMeasurementPoints.Count; i++)
            {
                var relatedMeasurementPoint = _asdaqConfiguration.RelatedMeasurementPoints[i];

                if (relatedMeasurementPoint.IsAngularReference)
                {
                    relatedMeasurementPoint.Step = 0;
                    relatedMeasurementPoint.FirstFlank = -1; // Inicializar en -1 para validación en algoritmo de cálculo de velocidad
                    relatedMeasurementPoint.LastFlank = -1; // Inicializar en -1 para validación en algoritmo de cálculo de velocidad
                }
            }

            // Crear búfer en memoria RAM Basado en el mayor tiempo antes de los eventos configurados para el Asset o un valor por defecto
            // si no hay eventos configurados o si el mayor tiempo antes es igual a 0
            _asdaqConfiguration.RelatedMeasurementPoints
                .GroupBy(p => /*p.ParentId*/ p.PrincipalAssetId).ToList()
                .ForEach(measurementPointsGroup =>
                {
                    var assetParent = _asdaqConfiguration.RelatedPrincipalAssets.Where(a => a.Id == measurementPointsGroup.Key).First();
                    //_asdaqConfiguration.RelatedAssets.Where(a => a.Id == measurementPointsGroup.Key).First();

                    var minutesBefore1 = (assetParent.RpmEventConfig != null) ? assetParent.RpmEventConfig.MinutesBefore : 0.0;
                    var minutesBefore2 = (assetParent.ConditionStatusEventsConfig != null) ? assetParent.ConditionStatusEventsConfig.Max(ec => ec.MinutesBefore) : 0.0;

                    // Se almacena el mayor tiempo antes de los eventos en proceso
                    var maxMinutesBefore = (minutesBefore1 >= minutesBefore2) ? minutesBefore1 : minutesBefore2;

                    var deviceConfiguration = GetNiDevice(measurementPointsGroup.ToList()[0].SamplesAcquiredDeviceId);
                    assetParent.SecondsBetweenAcquisitions = deviceConfiguration.SamplesToRead / deviceConfiguration.SampleRate;
                    var bufferSizeInMinutes = (maxMinutesBefore > 0.0) ? maxMinutesBefore : _DEFAULT_MINUTES_BEFORE;

                    // Convertir de minutos a la cantidad de datos basado en el tiempo entre adquisiciones.
                    // La unidad de tiempo entre adquisiciones es segundos
                    var bufferSize = (int)Math.Round((bufferSizeInMinutes * 60) / assetParent.SecondsBetweenAcquisitions);
                    assetParent.BufferCapacity = bufferSize;

                    // Triplicar el tamaño del búfer, para administrar los eventos desde el búfer garantizando en lo posible
                    // que no se sobreescriban registros que no hayan sido almacenados en la base de datos
                    bufferSize *= 2; 
                    
                    var measuremenPointDictionary = new Dictionary<string, CircularBuffer<BufferDataItem>>();
                    
                    measurementPointsGroup.ToList().ForEach(m =>
                    {
                        measuremenPointDictionary.Add(m.Id, new CircularBuffer<BufferDataItem>(bufferSize));
                    });

                    _acquisitionBuffer.Add(measurementPointsGroup.Key, measuremenPointDictionary);
                });

            _currentStatusByAsset = new Dictionary<string, CurrentStatusByAsset>();

            // Incializar el objeto _currentStatusByAsset que mantiene el estado de condición actual del asset y sus measurementPoint
            _asdaqConfiguration.RelatedMeasurementPoints
                .GroupBy(p => /*p.ParentId*/ p.PrincipalAssetId).ToList()
                .ForEach(measurementPointsGroup =>
                {
                    var currentStatusByMeasurementPoint = new Dictionary<string, CurrentStatus>();

                    measurementPointsGroup.ToList().ForEach(m =>
                    {
                        currentStatusByMeasurementPoint.Add(m.Id, new CurrentStatus(string.Empty, 0));
                    });

                    _currentStatusByAsset.Add(
                        measurementPointsGroup.Key, 
                        new CurrentStatusByAsset(string.Empty, null, currentStatusByMeasurementPoint));
                });

            _eventsInProcessByAsset = new Dictionary<string, EventsInProcess>();

            // Inicializar el objeto _eventInProcessByAsset que mantiene la referencia del evento que se está grabando por cada asset
            //_asdaqConfiguration.RelatedAssets.ForEach(a =>
            _asdaqConfiguration.RelatedPrincipalAssets.ForEach(a =>
            {
                _eventsInProcessByAsset.Add(a.Id, new EventsInProcess());
            });

            // Iniciar adquisiciones
            _niAdquisitionUnits.ForEach(a => a.NiAcquisition.Start());

            // Subproceso que se encarga de registrar en la base de datos los datos del búfer de adquisición que estén marcados
            // para ser registrados en HistoricalData
            new TaskFactory().StartNew(() =>
            {
                var hasStreams = true;

                while (true)
                {
                    try
                    {
                        // Si por ejemplo es un Asdaq Móvil no se usa la conexión redundante y aunque se esté almacenando la
                        // información localmente, se está haciendo en el sevidor principal de una vez.
                        if (AsdaqProperties.UseRedundantAcloudForHMI)
                        {
                            if (SecurityBl.AppUserStateForHMI == null)
                            {
                                SecurityBl.LoginForHMI();
                            }
                        }
                        else
                        {
                            if (SecurityBl.AppUserState == null)
                            {
                                SecurityBl.Login();
                            }
                        }

                        var localHistoricalDataList = new List<HistoricalData>();
                        var bufferToStore = new List<BufferDataItem>();
                        var acquisitionBuffer = _acquisitionBuffer;

                        acquisitionBuffer
                            .ToList()
                            .ForEach(assetB =>
                            {
                                assetB.Value
                                    .ToList()
                                    .ForEach(measurementPointB =>
                                    {
                                        var data =
                                            measurementPointB.Value
                                                .Where(dataItem => (dataItem.IsNormal || dataItem.IsChangeOfRpm || dataItem.IsChangeOfConditionStatus)
                                                       && (!dataItem.StoredInBD) && (dataItem.TimeStamp != DateTime.MinValue))
                                                .ToList();

                                        if ((data != null) && (data.Count > 0))
                                        {
                                            bufferToStore.AddRange(data);

                                            var measurementPoint =
                                                _asdaqConfiguration.RelatedMeasurementPoints
                                                    .Where(rm => rm.Id == measurementPointB.Key).FirstOrDefault();

                                            var numericSubVariableIdList =
                                                measurementPoint.SubVariables?
                                                    .Where(s => s.ValueType == Entities.Enums.ValueType.Numeric)?
                                                    .Select(s => s.Id).ToList();

                                            var streamSubVariableIdList =
                                                measurementPoint.SubVariables?
                                                    .Where(s => s.ValueType == Entities.Enums.ValueType.Waveform)?
                                                    .Select(s => s.Id).ToList();

                                            localHistoricalDataList.AddRange(
                                            data
                                                .Select(dataItem =>
                                                    new HistoricalData(
                                                        measurementPointB.Key,
                                                        dataItem.TimeStamp,
                                                        (numericSubVariableIdList != null) ? dataItem.Values
                                                            .Where(v => numericSubVariableIdList.Contains(v.Id))?
                                                            .Select(v => new NumericDataItem(v.Id, v.StatusId, (double)v.Value)).ToList() : null,
                                                        (streamSubVariableIdList != null) ? dataItem.Values
                                                            .Where(v => streamSubVariableIdList.Contains(v.Id))?
                                                            .Select(v => new StreamDataItem(v.Id, v.StatusId, (byte[])v.Value)).ToList() : null,
                                                        dataItem.IsChangeOfConditionStatus,
                                                        dataItem.IsNormal,
                                                        dataItem.IsChangeOfRpm,
                                                        hasStreams,
                                                        assetB.Key)));
                                        }
                                    });
                            });

                        if (localHistoricalDataList.Count > 0)
                        {
                            var localHistoricalDataAsc = localHistoricalDataList.OrderBy(h => h.TimeStamp).ToList();

                            try
                            {
                                new HistoricalDataProxy(
                                    (AsdaqProperties.UseRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                    AsdaqProperties.UseRedundantAcloudForHMI)
                                        .AddMany(localHistoricalDataAsc/*.Map().ToList()*/);
                            }
                            catch (SecurityException ex)
                            {
                                log.Debug(ex.Message);

                                if (AsdaqProperties.UseRedundantAcloudForHMI)
                                {
                                    SecurityBl.LoginForHMI();
                                }
                                else
                                {
                                    SecurityBl.Login();
                                }

                                new HistoricalDataProxy(
                                    (AsdaqProperties.UseRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                    AsdaqProperties.UseRedundantAcloudForHMI)
                                        .AddMany(localHistoricalDataAsc/*.Map().ToList()*/);
                            }

                            // Marcar en el búfer de adquisición los datos que fueron almacenados en la base de datos
                            localHistoricalDataList.ForEach(lh =>
                            {
                                var current = _acquisitionBuffer[lh.PrincipalAssetId][lh.MdVariableId].ToList().Where(s => s.TimeStamp == lh.TimeStamp).FirstOrDefault();

                                if (current != null)
                                {
                                    current.StoredInBD = true;
                                }
                            });
                            //bufferToStore.ForEach(dataItem => { dataItem.StoredInBD = true; });


                            log.Debug("Datos registrados correctamente en HistoricalData desde el bufer de adquisicion");
                        }
                    }
                    catch (Exception ex)
                    {
                        log.Error("Ha ocurrido un error registrando en HistoricalData desde el bufer de adquisicion", ex);
                    }

                    System.Threading.Thread.Sleep(3000); // Descanso de 3 segundos para el procesador
                }
            }, TaskCreationOptions.LongRunning);
        }

        /// <summary>
        /// Detiene todas las unidades de adquisición de señales
        /// </summary>
        public void Stop()
        {
            if (_niAdquisitionUnits != null)
                _niAdquisitionUnits.ForEach(a => a.NiAcquisition.Stop());
        }

        public void Dispose()
        {
            Stop();
        }

        // Configurar adquisición
        private void Configure()
        {
            _niAdquisitionUnits = new List<AcquisitionUnit>();

            if (_asdaqConfiguration.NiDevices.Count > 0)
            {
                var isolatedNiDevices = _asdaqConfiguration.NiDevices.Where(d => !d.IsMasterNiDevice && string.IsNullOrEmpty(d.MasterNiDeviceName)).ToList();
                var syncronizedNiDevices = _asdaqConfiguration.NiDevices.Except(isolatedNiDevices).ToList();

                if (isolatedNiDevices.Count > 0)
                    isolatedNiDevices.ForEach(d =>
                    {
                        _niAdquisitionUnits.Add(
                            new AcquisitionUnit(new NiAcquisition(d))
                        );
                    });

                if (syncronizedNiDevices.Count > 0)
                {
                    var masterNiDevices = syncronizedNiDevices.Where(d => d.IsMasterNiDevice).ToList();

                    masterNiDevices.ForEach(md =>
                    {
                        var niDevs = syncronizedNiDevices.Where(d => d.MasterNiDeviceName.Equals(md.Name)).ToList();
                        niDevs.Add(md); // Agregar el NiDevice maestro

                        // Instanciar una adquisición maestro/esclavo
                        _niAdquisitionUnits.Add(
                            new AcquisitionUnit(new NiAcquisition(niDevs))
                        );
                    });
                }
            }

            if (_asdaqConfiguration.NiCompactDaqs.Count > 0)
                _asdaqConfiguration.NiCompactDaqs.ForEach(cdaq =>
                {
                    _niAdquisitionUnits.Add(
                        new AcquisitionUnit(new NiAcquisition(cdaq.Name, cdaq.CSeriesModules))
                    );
                });
        }

        /// <summary>
        /// Obtiene el NiDevie con el name especificado
        /// </summary>
        /// <param name="name">Nombre del dispositivo Ni que equivale al deviceId de National Instruments</param>
        /// <returns></returns>
        private NiDevice GetNiDevice(string name)
        {
            var dev = _asdaqConfiguration.NiDevices.Where(d => d.Name == name).FirstOrDefault();

            if (dev != null)
                return dev;

            dev = _asdaqConfiguration.NiCompactDaqs.Where(d => d.Name == name).FirstOrDefault().CSeriesModules[0];

            return dev;
        }
    }
}
