namespace Amaq.Acloud.AsdaqService.Business
{
    using System.Collections.Generic;
    using System.Linq;
    using Aspectrogram.Entities;
    using Aspectrogram.Proxy;
    using System.Threading.Tasks;
    using Aspectrogram.Entities.Enums;
    using Aspectrogram.Entities.ValueObjects;
    using Helpers;
    using Aspectrogram.Entities.Dtos;
    using Models;
    using NationalInstruments.DAQmx;
    using Helpers.CircularBuffer;
    using Entities.Enums;
    using log4net;
    using Proxy.Core;
    using Entities.Core;
    using System.Security;
    using Libraries.FIRFilter;
    using Libraries.FIRFilter.Enum;

    /// <summary>
    /// Lógica de negocio para measurement points
    /// </summary>
    internal class MeasurementPointBl
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Método para setear dinámicamente el AiMeasureMethod a una MdVariable. Este es un método de prueba,
        /// que solo sirve como contingencia, aunque se puede tomar como referencia cuando se cree el catálogo de configuración
        /// </summary>
        public void SetAiMeasureMethodTest()
        {
            // Tarea dummie para conocer los parámetros y tipos de parámetro para una función de creación de AiChannel específica
            //var task = new NationalInstruments.DAQmx.Task();
            //task.AIChannels.CreateAccelerometerChannel()

            var mdVariableExtensionProxy = new MdVariableExtensionProxy(SecurityBl.AppUserState);

            var x = mdVariableExtensionProxy.GetById("57f80e03691ddf29a26be5b4");

            x.AiMeasureMethod = new AiMeasureMethod()
            {
                Name = "CreateAccelerometerChannel",
                ParameterTypes = new List<string>()
                {
                    typeof(string).AssemblyQualifiedName,
                    typeof(string).AssemblyQualifiedName,
                    typeof(AITerminalConfiguration).AssemblyQualifiedName,
                    typeof(double).AssemblyQualifiedName,
                    typeof(double).AssemblyQualifiedName,
                    typeof(double).AssemblyQualifiedName, // Sensitivity,
                    typeof(AIAccelerometerSensitivityUnits).AssemblyQualifiedName,
                    typeof(AIExcitationSource).AssemblyQualifiedName,
                    typeof(double).AssemblyQualifiedName, // CurrentExcitationValue
                    typeof(AIAccelerationUnits).AssemblyQualifiedName
                },
                ParameterValues = new List<object>()
                {
                    "Dev1/ai0",
                    "",
                    AITerminalConfiguration.Pseudodifferential.ToString(),
                    -5.0,
                    5.0,
                    1.0,
                    AIAccelerometerSensitivityUnits.MillivoltsPerG.ToString(),
                    AIExcitationSource.Internal.ToString(), // Opción IEPE
                    0.002, // Si IEPE es igual a Internal, entonces se utiliza este valor en amperios
                    AIAccelerationUnits.FromCustomScale.ToString()
                },
                M = 10.0,
                B = 0.0
            };

            mdVariableExtensionProxy.Update(x);
        }

        /// <summary>
        /// Obtiene los measurement points asociados con ai channels del asdaq especificado
        /// </summary>
        /// <param name="asdaq">Objeto Asdaq</param>
        /// <returns></returns>
        public List<MdVariableExtension> GetByAsdaq(ref Asdaq asdaq)
        {
            var currentAsdaq = asdaq;

            var mdVariablesUsedByDevs = new List<MdVariableExtension>();
            var mdVariablesUsedByCDaqs = new List<MdVariableExtension>();

            if (currentAsdaq.NiDevices.Count > 0)
            {
                try
                {
                    mdVariablesUsedByDevs =
                    new MdVariableExtensionProxy(SecurityBl.AppUserState).GetById(asdaq.NiDevices.SelectMany(d => d.AiChannels).Select(ch => ch.MdVariableId).Where(id => !string.IsNullOrEmpty(id)).ToList());
                }
                catch (SecurityException ex)
                {
                    SecurityBl.Login();
                    log.Debug(ex.Message);
                    mdVariablesUsedByDevs =
                    new MdVariableExtensionProxy(SecurityBl.AppUserState).GetById(asdaq.NiDevices.SelectMany(d => d.AiChannels).Select(ch => ch.MdVariableId).Where(id => !string.IsNullOrEmpty(id)).ToList());
                }

                for (int d = 0; d < currentAsdaq.NiDevices.Count; d++)
                    for (int ch = 0; ch < currentAsdaq.NiDevices[d].AiChannels.Count; ch++)
                    {
                        var mdVariableId = currentAsdaq.NiDevices[d].AiChannels[ch].MdVariableId;
                        var mdVariableUsed = mdVariablesUsedByDevs.Where(v => v.Id == mdVariableId).FirstOrDefault();
                        mdVariableUsed.SamplesAcquiredDeviceId = currentAsdaq.NiDevices[d].Name;
                        mdVariableUsed.SamplesAcquiredFullId = currentAsdaq.NiDevices[d].Name;
                        mdVariableUsed.SamplesAcquiredIndex = ch;

                        asdaq.NiDevices[d].AiChannels[ch].AiMeasureMethod = mdVariableUsed.AiMeasureMethod;
                    }
            }

            if (currentAsdaq.NiCompactDaqs.Count > 0)
            {
                try
                {
                    mdVariablesUsedByCDaqs =
                    new MdVariableExtensionProxy(SecurityBl.AppUserState).GetById(
                            currentAsdaq.NiCompactDaqs.SelectMany(d => d.CSeriesModules).SelectMany(m => m.AiChannels).Select(ch => ch.MdVariableId).Where(id => !string.IsNullOrEmpty(id)).ToList()
                        );
                }
                catch (SecurityException ex)
                {
                    SecurityBl.Login();
                    log.Debug(ex.Message);
                    mdVariablesUsedByCDaqs =
                    new MdVariableExtensionProxy(SecurityBl.AppUserState).GetById(
                            currentAsdaq.NiCompactDaqs.SelectMany(d => d.CSeriesModules).SelectMany(m => m.AiChannels).Select(ch => ch.MdVariableId).Where(id => !string.IsNullOrEmpty(id)).ToList()
                        );
                }
                //var index = 0;

                for (int d = 0; d < currentAsdaq.NiCompactDaqs.Count; d++)
                {
                    // Agrupar módulos por TaskIndex
                    var cSeriesModulesByTaskIndex =
                        currentAsdaq.NiCompactDaqs[d].CSeriesModules
                            .GroupBy(cSeriesModule => cSeriesModule.TaskIndex)
                            .ToList();

                    // Recorrer grupos de módulos por TaskIndex
                    cSeriesModulesByTaskIndex.ForEach(cSeriesModuleGroup =>
                    {
                        var index = 0;

                        // Recorrer módulos del grupo
                        cSeriesModuleGroup
                            .ToList()
                            .ForEach(cSeriesModule =>
                        {
                            // Recorrer aichannels del módulo
                            for (int ch = 0; ch < cSeriesModule.AiChannels.Count; ch++)
                            {
                                var mdVariableId = cSeriesModule.AiChannels[ch].MdVariableId;
                                var mdVariableUsed = mdVariablesUsedByCDaqs.Where(v => v.Id == mdVariableId).FirstOrDefault();
                                mdVariableUsed.SamplesAcquiredDeviceId = currentAsdaq.NiCompactDaqs[d].Name;

                                mdVariableUsed.SamplesAcquiredFullId =
                                    currentAsdaq.NiCompactDaqs[d].Name + cSeriesModule.TaskIndex.ToString();

                                mdVariableUsed.SamplesAcquiredIndex = index;

                                cSeriesModule.AiChannels[ch].AiMeasureMethod = mdVariableUsed.AiMeasureMethod;

                                index++;
                            }
                        });
                    });
                }
                //for (int m = 0; m < asdaq.NiCompactDaqs[d].CSeriesModules.Count; m++)
                //    for (int ch = 0; ch < asdaq.NiCompactDaqs[d].CSeriesModules[m].AiChannels.Count; ch++)
                //    {
                //        var mdVariableId = asdaq.NiCompactDaqs[d].CSeriesModules[m].AiChannels[ch].MdVariableId;
                //        var mdVariableUsed = mdVariablesUsedByCDaqs.Where(v => v.Id == mdVariableId).FirstOrDefault();
                //        mdVariableUsed.SamplesAcquiredDeviceId = asdaq.NiCompactDaqs[d].Name;
                //        mdVariableUsed.SamplesAcquiredIndex = index;

                //        asdaq.NiCompactDaqs[d].CSeriesModules[m].AiChannels[ch].AiMeasureMethod = mdVariableUsed.AiMeasureMethod;
                //        index++;
                //    }

                //for (int d = 0; d < asdaq.NiCompactDaqs.Count; d++)
                //    for (int m = 0; m < asdaq.NiCompactDaqs[d].CSeriesModules.Count; m++)
                //        for (int ch = 0; ch < asdaq.NiCompactDaqs[d].CSeriesModules[m].AiChannels.Count; ch++)
                //        {
                //            var mdVariableId = asdaq.NiCompactDaqs[d].CSeriesModules[m].AiChannels[ch].MdVariableId;
                //            var mdVariableUsed = mdVariablesUsedByCDaqs.Where(v => v.Id == mdVariableId).FirstOrDefault();
                //            mdVariableUsed.SamplesAcquiredDeviceId = asdaq.NiCompactDaqs[d].Name;
                //            mdVariableUsed.SamplesAcquiredIndex = index;

                //            asdaq.NiCompactDaqs[d].CSeriesModules[m].AiChannels[ch].AiMeasureMethod = mdVariableUsed.AiMeasureMethod;
                //            index++;
                //        }

            }

            var measurementPoints = mdVariablesUsedByDevs.Concat(mdVariablesUsedByCDaqs).ToList();
            GetSubVariablesByMeasurementPoint(ref measurementPoints); // Anexar a cada measurementPoint las subVariables asociadas

            asdaq.RelatedMeasurementPoints = measurementPoints;

            return measurementPoints;
        }

        /// <summary>
        /// Cálcula la medida correspondiente a cada subVariable de cada measurementPoint
        /// </summary>
        /// <param name="measurementPoints">Lista de measurementPoint</param>
        /// <param name="timeStamp">Estampa de tiempo</param>
        /// <param name="sampleRate">Frecuencia de muestreo</param>
        /// <param name="acquisitionBuffer">Buffer de adquisición necesario que se requieren para integracion trapezoidal y calculo de bajas RPM</param>
        /// <param name="hpfFir">Referencia a los parametros del filtro pasa altos FIR</param>
        /// <param name="numCoeff">Numero de coeficientes del filtro</param>
        public void CalculateMeasures(ref List<MdVariableExtension> measurementPoints, System.DateTime timeStamp, double sampleRate,
            Dictionary<string, Dictionary<string, CircularBuffer<BufferDataItem>>> acquisitionBuffer, ref HighPass hpfFir, int numCoeff)
        {
            int sensorType;
            string id;
            uint[] zeroCrossPositions = null;
            // Aplicar filtro pasa altos con frecuencia de corte 10Hz
            // => omegaC = 2 * fc / sampleRate
            double omegaC = 20.0 / sampleRate;
            var highPass = hpfFir;

            // Solo integra acelerómetros si al menos hay una señal en el búfer
            if (acquisitionBuffer[measurementPoints[0].PrincipalAssetId].Values.ElementAt(0).Count > 0)
            {
                // Listamos todas las variables de tipo acelerometro y marcado para integrar
                var integratedAccelerometers = measurementPoints.Where(p => p.SensorTypeCode == 2 && p.Integrate).ToList();
                if (integratedAccelerometers != null)
                {
                    // Procesamiento en paralelo para agilizar la integracion
                    Parallel.ForEach(integratedAccelerometers, (integratedAccelerometer) =>
                    {
                        // Definimos que tipo sensor es para realizar conversiones de ser necesario
                        sensorType = integratedAccelerometer.SensorTypeCode;
                        id = integratedAccelerometer.Id;

                        var waveform =  Libraries.DSPFourier.Filter.HighPass(integratedAccelerometer.SamplesAcquired, 10);

                        //var waveform = highPass.Filter(numCoeff, omegaC, WindowType.KAISER, 3.2, integratedAccelerometer.SamplesAcquired, id, false);
                        // Integrar y setear forma de onda integrada
                        integratedAccelerometer.IntegratedWaveform = IntegrateHelper.Trapezoidal(waveform, sampleRate, sensorType);
                    });
                    //foreach (var integratedAccelerometer in integratedAccelerometers)
                    //{
                    //    // Definimos que tipo sensor es para realizar conversiones de ser necesario
                    //    sensorType = integratedAccelerometer.SensorTypeCode;
                    //    id = integratedAccelerometer.Id;

                    //    var waveform = hpfFir.Filter(numCoeff, omegaC, WindowType.KAISER, 3.2, integratedAccelerometer.SamplesAcquired, id, false);
                    //    // Integrar y setear forma de onda integrada
                    //    integratedAccelerometer.IntegratedWaveform = IntegrateHelper.Trapezoidal(waveform, sampleRate, sensorType);
                    //}
                }

                // Listamos todas las variables de tipo flujo magnetico
                var magneticFluxSensors = measurementPoints.Where(p => p.SensorTypeCode == 10).ToList();
                if (magneticFluxSensors != null && magneticFluxSensors.Count > 0)
                {
                    string filePath = @"C:\Users\Jorge\Desktop\leerArray.csv";
                    System.IO.StreamReader sr = new System.IO.StreamReader(filePath);
                    var dataList = new List<double>();
                    int row = 0;
                    while (!sr.EndOfStream)
                    {
                        double[] line = System.Array.ConvertAll(sr.ReadLine().Split(';'), double.Parse);
                        dataList.Add(line[1]);
                        row++;
                    }
                    var data = dataList.ToArray();
                    Parallel.ForEach(magneticFluxSensors, (mgfSensor) =>
                    {
                        sensorType = mgfSensor.SensorTypeCode;
                        id = mgfSensor.Id;

                        // Simulamos la señal de flujo magnetico
                        mgfSensor.SamplesAcquired = data;
                        // Aplicar filtro pasa altos con frecuencia de corte 10Hz
                        var waveform = highPass.Filter(numCoeff, omegaC, WindowType.KAISER, 3.2, mgfSensor.SamplesAcquired, id, false);
                        // Integrar y setear forma de onda integrada
                        mgfSensor.IntegratedWaveform = IntegrateHelper.Trapezoidal(waveform, sampleRate, sensorType);
                        zeroCrossPositions = OverallMeasureHelper.GetZeroCrossPositions(mgfSensor.IntegratedWaveform);
                    });
                    //foreach (var mgfSensor in magneticFluxSensors)
                    //{
                    //    sensorType = mgfSensor.SensorTypeCode;
                    //    id = mgfSensor.Id;

                    //    // Simulamos la señal de flujo magnetico
                    //    mgfSensor.SamplesAcquired = data;
                    //    // Aplicar filtro pasa altos con frecuencia de corte 10Hz
                    //    var waveform = hpfFir.Filter(numCoeff, omegaC, WindowType.KAISER, 3.2, mgfSensor.SamplesAcquired, id, false);
                    //    // Integrar y setear forma de onda integrada
                    //    mgfSensor.IntegratedWaveform = IntegrateHelper.Trapezoidal(waveform, sampleRate, sensorType);
                    //    zeroCrossPositions = OverallMeasureHelper.GetZeroCrossPositions(mgfSensor.IntegratedWaveform);
                    //}
                }
            }

            // Solo calcula valores si hay más de dos señales por punto de medición en el búfer, esto principalmente se necesita para
            // los acelerómetros integrados
            if (acquisitionBuffer[measurementPoints[0].PrincipalAssetId].Values.ElementAt(0).Count > 2)
            {
                //var squareWave = new double[(int)sampleRate];
                //for (int i = 0; i < (int)sampleRate; i++)
                //{
                //    squareWave[i] = (System.Math.Sin((2 * System.Math.PI * i * 10) / sampleRate + System.Math.PI / 4) >= 0) ? 0.3 : -1;
                //}
                var angularReferences = measurementPoints.Where(p => p.IsAngularReference && p.AngularReferenceConfig != null).ToList();
                if (angularReferences != null)
                {
                    Parallel.ForEach(angularReferences, (angularReference) =>
                    {
                        //// Simular valor adquirido
                        //angularReference.SamplesAcquired = squareWave;
                        var average = OverallMeasureHelper.CalculateAverage(angularReference.SamplesAcquired);
                        var minimumValue = 0.0;
                        var pkpk = OverallMeasureHelper.CalculatePeakToPeak(angularReference.SamplesAcquired, out minimumValue);

                        var waveformSubVariable = angularReference.SubVariables.Where(s => s.ValueType == ValueType.Waveform).FirstOrDefault();

                        if (waveformSubVariable != null)
                        {
                            waveformSubVariable.TimeStamp = timeStamp;

                            // Como valor de la subVariable tipo waveform se setea la señal codificada como Waveform
                            waveformSubVariable.Value =
                                    AmaqStreamEncoder.Encode(
                                        angularReference.SamplesAcquired,
                                        minimumValue,
                                        pkpk,
                                        sampleRate,
                                        average,
                                        timeStamp,
                                        StreamType.Signal
                                    );

                            var rpmSubVariable = angularReference.SubVariables.Where(s => s.MeasureType == MeasureType.Rpm).FirstOrDefault();

                            if (rpmSubVariable != null)
                            {
                                rpmSubVariable.TimeStamp = timeStamp;
                                rpmSubVariable.Value = 0.0; // Inicializar
                            }

                            var angularReferencePositionsSubVariable =
                                angularReference.SubVariables.Where(s => s.ValueType == ValueType.AngularReferencePositions).FirstOrDefault();

                            if ((angularReferencePositionsSubVariable != null))
                            {
                                // Inicializar
                                angularReference.Step = 0;
                                angularReference.AngularPositions = new List<uint>().ToArray();
                                angularReferencePositionsSubVariable.TimeStamp = timeStamp;
                                angularReferencePositionsSubVariable.AngularReferencePositions = null;
                                angularReferencePositionsSubVariable.Value = null;

                                var samplesToRead = angularReference.SamplesAcquired.Length;

                                // Hallar flancos de marca de paso de los valores adquiridos actuales
                                var angularReferencePositions = AngularReferenceHelper.GetAngularReferencePositions(
                                            angularReference.SamplesAcquired,
                                            angularReference.AngularReferenceConfig.MinimumNoiseInVolts,
                                            angularReference.AngularReferenceConfig.TresholdPercentage,
                                            angularReference.AngularReferenceConfig.HysteresisTresholdPercentage);

                                angularReferencePositionsSubVariable.AngularReferencePositions = angularReferencePositions;
                                angularReferencePositionsSubVariable.Value = angularReferencePositions.AsQueryable().SelectMany(p => System.BitConverter.GetBytes(p)).ToArray();

                                if (angularReferencePositions.Length >= 2)
                                {
                                    angularReference.Step = 0;
                                    angularReference.AngularPositions = angularReferencePositions;
                                }
                                else
                                {
                                    var aReferenceAcquisitionBuffer = acquisitionBuffer[angularReference.PrincipalAssetId][angularReference.Id];
                                    var baseIndex = aReferenceAcquisitionBuffer.Head;
                                    int index = baseIndex % aReferenceAcquisitionBuffer.Capacity;
                                    var limit = AsdaqProperties.WINDOW_IN_SECONDS > aReferenceAcquisitionBuffer.Count ?
                                                aReferenceAcquisitionBuffer.Count : (int)AsdaqProperties.WINDOW_IN_SECONDS;
                                    index -= limit - 1;
                                    // Control de indices negativos
                                    if (index < 0)
                                    {
                                        index += aReferenceAcquisitionBuffer.Capacity;
                                    }
                                    double[] joinedWaveform = null;
                                    for (int i = 0; i < limit; i++)
                                    {
                                        if (joinedWaveform == null)
                                        {
                                            joinedWaveform = aReferenceAcquisitionBuffer.getAtPosition(index).Waveform;
                                        }
                                        else
                                        {
                                            joinedWaveform = joinedWaveform.Concat(aReferenceAcquisitionBuffer.getAtPosition(index).Waveform).ToArray();
                                        }
                                        index = (index + 1) % aReferenceAcquisitionBuffer.Capacity; // Incremento del indice
                                        // Control de indices negativos
                                        if (index < 0)
                                        {
                                            index += aReferenceAcquisitionBuffer.Capacity;
                                        }
                                    }
                                    if (joinedWaveform == null)
                                    {
                                        joinedWaveform = angularReference.SamplesAcquired;
                                    }
                                    else
                                    {
                                        joinedWaveform = joinedWaveform.Concat(angularReference.SamplesAcquired).ToArray();
                                    }
                                    // Hallar flancos de marca de paso de los valores adquiridos en una ventana de 6seg
                                    var allPositions = AngularReferenceHelper.GetAngularReferencePositions(
                                        joinedWaveform,
                                        angularReference.AngularReferenceConfig.MinimumNoiseInVolts,
                                        angularReference.AngularReferenceConfig.TresholdPercentage,
                                        angularReference.AngularReferenceConfig.HysteresisTresholdPercentage);
                                    if (allPositions.Length >= 2)
                                    {
                                        angularReference.Step = limit;
                                        angularReference.AngularPositions = allPositions;
                                    }
                                    else
                                    {
                                        angularReference.Step = 0;
                                        angularReference.AngularPositions = new List<uint>().ToArray();
                                    }
                                }

                                // Cálculo de velocidad en Rpm
                                rpmSubVariable.Value =
                                            AngularReferenceHelper.CalculateRpm(
                                                angularReference.AngularPositions,
                                                sampleRate,
                                                samplesToRead);
                            }
                        }

                        // Demás subVariables de la marca de paso
                        angularReference.SubVariables
                                .Where(s => s.MeasureType != MeasureType.Rpm && s.ValueType != ValueType.Waveform && s.ValueType != ValueType.AngularReferencePositions)
                                .ToList()
                                .ForEach(subVariable =>
                                {
                                    subVariable.TimeStamp = timeStamp; // Estampa de tiempo

                                    switch (subVariable.MeasureType)
                                    {
                                        case MeasureType.Peak:
                                            subVariable.Value = pkpk / 2;
                                            break;
                                        case MeasureType.PeakToPeak:
                                            subVariable.Value = pkpk;
                                            break;
                                        case MeasureType.Rms:
                                            subVariable.Value = OverallMeasureHelper.CalculateRMS(angularReference.SamplesAcquired, average);
                                            break;
                                        case MeasureType.Gap:
                                            subVariable.Value = OverallMeasureHelper.CalculateGAP(average, angularReference.Sensibility, subVariable.GapCalibrationValue);
                                            break;
                                        case MeasureType.Average:
                                            subVariable.Value = average;
                                            break;
                                        default:
                                            break;
                                    }
                                });

                    });
                }

                var mPoints = measurementPoints.Where(p => !p.IsAngularReference).ToList();

                if (mPoints != null)
                {
                    // Procesamiento en paralelo para agilizar el cálculo de las medidas
                    Parallel.ForEach(mPoints, (measurementPoint) =>
                    {
                        var averageFromOriginalWaveform = OverallMeasureHelper.CalculateAverage(measurementPoint.SamplesAcquired);
                        var averageFromIntegratedWaveform = 0.0;
                        var freq1x = 0.0;

                        var minimumValue = 0.0;
                        var pkpk = OverallMeasureHelper.CalculatePeakToPeak(
                                (measurementPoint.Integrate) ? measurementPoint.IntegratedWaveform : measurementPoint.SamplesAcquired,
                                out minimumValue);

                        var relatedAngularReference = angularReferences.Where(
                            angularReference => angularReference.Id == measurementPoint.AngularReferenceId).FirstOrDefault();

                        if (measurementPoint.Integrate)
                        {
                            averageFromIntegratedWaveform = OverallMeasureHelper.CalculateAverage(measurementPoint.IntegratedWaveform);

                            if (relatedAngularReference != null)
                            {
                                // Necesario para el cálculo de la Amplitud 1x
                                freq1x = (double)relatedAngularReference.SubVariables.Where(s => s.MeasureType == MeasureType.Rpm).FirstOrDefault().Value / 60;
                            }
                        }

                        Parallel.ForEach(measurementPoint.SubVariables, (subVariable) =>
                        {
                            if (subVariable.ValueType == ValueType.Numeric)
                            {
                                var subVariableValue = 0.0;
                                subVariable.TimeStamp = timeStamp; // Estampa de tiempo

                                var average = (subVariable.FromIntegratedWaveform) ? averageFromIntegratedWaveform : averageFromOriginalWaveform;
                                var waveform = (subVariable.FromIntegratedWaveform) ? measurementPoint.IntegratedWaveform : measurementPoint.SamplesAcquired;

                                switch (subVariable.MeasureType)
                                {
                                    case MeasureType.Peak:
                                        subVariableValue = (measurementPoint.Integrate && subVariable.FromIntegratedWaveform) ? pkpk / 2 : OverallMeasureHelper.CalculatePeak(waveform);
                                        break;
                                    case MeasureType.PeakToPeak:
                                        subVariableValue = (measurementPoint.Integrate && subVariable.FromIntegratedWaveform) ? pkpk : OverallMeasureHelper.CalculatePeakToPeak(waveform);
                                        break;
                                    case MeasureType.Rms:
                                        subVariableValue = OverallMeasureHelper.CalculateRMS(waveform, average);
                                        break;
                                    case MeasureType.Amplitude1x:
                                        if (relatedAngularReference != null)
                                        {
                                            var refPosA = relatedAngularReference;
                                            subVariableValue =
                                                (refPosA.AngularPositions.Length > 0) ?
                                                    OverallMeasureHelper.CalculateAmplitude1x(
                                                        waveform,
                                                        refPosA.AngularPositions,
                                                        acquisitionBuffer[measurementPoint.PrincipalAssetId][measurementPoint.Id],
                                                        refPosA.Step) : 0;


                                            if (subVariable.FromIntegratedWaveform && subVariableValue > 0)
                                            {
                                                // Conversión de Amplitud 1x de aceleración a velocidad
                                                subVariableValue = subVariableValue * 9.8 * 2 / (2 * System.Math.PI * freq1x);
                                            }

                                            var factor = 0.0;

                                            switch (measurementPoint.SubVariables.Where(s => s.IsDefaultValue).FirstOrDefault().MeasureType)
                                            {
                                                case MeasureType.Peak:
                                                    factor = 1 / 2;
                                                    break;
                                                case MeasureType.Rms:
                                                    factor = 1 / 0.707;
                                                    break;
                                                default:
                                                    factor = 1.0;
                                                    break;
                                            }

                                            subVariableValue = subVariableValue * factor;
                                        }
                                        break;
                                    case MeasureType.Phase:
                                        subVariableValue = OverallMeasureHelper.CalculatePhase(waveform);
                                        break;
                                    case MeasureType.Phase1x:
                                        if (relatedAngularReference != null)
                                        {
                                            var refPosB = relatedAngularReference;
                                            subVariableValue =
                                                (refPosB.AngularPositions.Length > 0) ?
                                                    OverallMeasureHelper.CalculatePhase1x(
                                                        waveform,
                                                        refPosB.AngularPositions,
                                                        acquisitionBuffer[measurementPoint.PrincipalAssetId][measurementPoint.Id],
                                                        refPosB.Step) : 0;

                                            if (subVariable.FromIntegratedWaveform)
                                            {
                                                // La integración realiza un corrimiento de fase de 180 grados, asi que, hay que compensarlos nuevamente
                                                subVariableValue = subVariableValue + System.Math.PI;
                                            }
                                        }
                                        break;
                                    case MeasureType.Gap:
                                        subVariableValue = OverallMeasureHelper.CalculateGAP(average, measurementPoint.Sensibility, subVariable.GapCalibrationValue);
                                        break;
                                    case MeasureType.Average:
                                        subVariableValue = average;
                                        break;
                                    case MeasureType.AxialPosition:
                                        subVariableValue = OverallMeasureHelper.CalculateAxialPosition(average, measurementPoint.Sensibility, subVariable.GapCalibrationValue, subVariable.InitialAxialPosition);
                                        break;
                                    case MeasureType.MagneticFluxAmplitude:
                                        // AQUI REQUIERO EL VALOR DE LA SEÑAL INTEGRADA Y MAS EXACTAMENTE LAS POSICIONES DE CRUCE POR CERO DE LA MISMA
                                        subVariableValue = OverallMeasureHelper.CalculateMagneticFluxAmplitude(waveform);
                                        break;
                                    case MeasureType.MagneticFluxPhase:
                                        // AQUI REQUIERO EL VALOR DE LA SEÑAL INTEGRADA Y MAS EXACTAMENTE LAS POSICIONES DE CRUCE POR CERO DE LA MISMA
                                        subVariableValue = OverallMeasureHelper.CalculateMagneticFluxPhase(waveform);
                                        break;
                                    default:
                                        break;
                                }

                                // Validación para no almacenar datos basura
                                var max = subVariable.Maximum;
                                var min = subVariable.Minimum;

                                // Si en realidad están configurados adecuadamente las propiedades Maximum y Minimum, es decir que al menos es diferente
                                // el máximo del mínimo
                                if (max != min)
                                {
                                    if (subVariableValue < min)
                                    {
                                        subVariable.Value = min; // Limitar al mínimo
                                    }
                                    else if (subVariableValue > max)
                                    {
                                        subVariable.Value = max; // Limitar al máximo
                                    }
                                    else
                                    {
                                        subVariable.Value = subVariableValue;
                                    }
                                }
                                else
                                {
                                    subVariable.Value = subVariableValue;
                                }
                            }
                            else if (subVariable.ValueType == ValueType.Waveform)
                            {
                                subVariable.TimeStamp = timeStamp; // Estampa de tiempo

                                uint[] angularReferencePositions = null;

                                if (relatedAngularReference != null)
                                {
                                    angularReferencePositions =
                                        relatedAngularReference.SubVariables
                                            .Where(s => s.ValueType == ValueType.AngularReferencePositions)
                                            .FirstOrDefault()
                                            .AngularReferencePositions;
                                }

                                double[] realWaveform = null;

                                // Si es un acelerómetro y la forma de onda se está integrando
                                if ((measurementPoint.SensorTypeCode == 2) &&
                                        (measurementPoint.Integrate))
                                {
                                    var realWaveformLength = measurementPoint.SamplesAcquired.Length;

                                    // Quitar la primera mitad de la forma de onda, ya que está forma de onda tiene el doble de tamaño
                                    // para que máximo en la primera mitad quede la respuesta del filtro pasa altos
                                    realWaveform =
                                            measurementPoint.IntegratedWaveform;
                                    //.Skip(realWaveformLength).Take(realWaveformLength).ToArray();
                                }
                                else
                                {
                                    realWaveform = measurementPoint.SamplesAcquired;
                                }

                                // Como valor de la subVariable tipo Amaq Stream se setea la señal codificada como Amaq Stream
                                if (measurementPoint.SensorTypeCode == 10)
                                {
                                    subVariable.Value =
                                        AmaqStreamEncoder.Encode(
                                            realWaveform,
                                            minimumValue,
                                            pkpk,
                                            sampleRate,
                                            (measurementPoint.Integrate) ? averageFromIntegratedWaveform : averageFromOriginalWaveform,
                                            timeStamp,
                                            StreamType.MagenticFlux,
                                            angularReferencePositions,
                                            zeroCrossPositions
                                        );
                                }
                                else
                                {
                                    subVariable.Value =
                                        AmaqStreamEncoder.Encode(
                                            realWaveform,
                                            minimumValue,
                                            pkpk,
                                            sampleRate,
                                            (measurementPoint.Integrate) ? averageFromIntegratedWaveform : averageFromOriginalWaveform,
                                            timeStamp,
                                            StreamType.Signal,
                                            angularReferencePositions
                                        );
                                }
                            }
                        });
                    });
                }
            }
        }

        /// <summary>
        /// Resuelve el estado de cada measurementPoint
        /// </summary>
        /// <param name="assets">Lista de assets</param>
        /// <param name="measurementPoints">Lista de measurementPoint</param>
        /// <param name="currentStatusByAsset">Diccionario de estado de condición actual para cada asset y sus measurementPoints</param>
        public void StatusResolve(List<AssetExtension> assets, ref List<MdVariableExtension> measurementPoints, ref Dictionary<string, CurrentStatusByAsset> currentStatusByAsset)
        {
            var now = System.DateTime.Now;
            var currentStatusByAssetList = currentStatusByAsset;

            // Procesamiento en paralelo para agilizar la resolución de estados
            Parallel.ForEach(measurementPoints, (measurementPoint) =>
            {
                var tripMultiplyFactor = 1;
                var asset = assets.Where(a => a.Id == measurementPoint.PrincipalAssetId).FirstOrDefault();

                // Si es un sensor de vibración(Proximidad, Acelerómetro ó Velocímetro)
                if (measurementPoint.SensorTypeCode <= 3)
                {
                    // Si está activado el trip multiply y la máquina está en estado transitorio(Arranque o Parada)
                    if ((asset.TripMultiply != TripMultiply.None) && ((now - asset.LastChangeOfRpm).TotalSeconds < asset.TransientStatusTimeout))
                    {
                        tripMultiplyFactor = (int)asset.TripMultiply; // Trip Multiplier
                    }
                }

                // Resolver estados solo de las subVariables que tengan Bands configuradas y que sean numéricas               
                Parallel.ForEach(
                    measurementPoint.SubVariables.
                        Where(s => ((s.ValueType == ValueType.Numeric) && (s.Bands != null) && (s.Bands.Count > 0))).ToList(),
                    (subVariable) =>
                {
                    // El multiplyFactor solo se aplica al UpperThreshold, ya que es la aplicación de trip multiply, el cual solo se aplica
                    // a sensores de vibración diferentes de thrust bearing, los cuales solo interesa validar hacia arriba
                    var bandExceeded = subVariable.BandsOrderBySeverityDesc.Where(b =>
                        (b.UpperThreshold != null && System.Convert.ToDouble(subVariable.Value) >= (b.UpperThreshold.Value * tripMultiplyFactor))
                        ||
                        (b.LowerThreshold != null && System.Convert.ToDouble(subVariable.Value) <= b.LowerThreshold.Value)).FirstOrDefault();

                    if (bandExceeded != null)
                    {
                        if (bandExceeded.LastTriggering == null)
                            bandExceeded.LastTriggering = System.DateTime.Now; // Estampa de tiempo de la superación de la banda

                        // Las demas bandas quedan con estampa de tiempo null
                        subVariable.BandsOrderBySeverityDesc.
                            Except(new List<BandWithSeverity>() { bandExceeded }).ToList().
                            Select(t => t.LastTriggering = null);

                        // Validar si el estado actual se ha mantenido por el tiempo de latencia configurado
                        if ((subVariable.ThresholdLatency <= 0) ||
                            ((now - bandExceeded.LastTriggering).Value.TotalMilliseconds >= subVariable.ThresholdLatency))
                        {
                            subVariable.Status = new List<string> { bandExceeded.StatusId }; // Nuevo estado de la subVariable
                            subVariable.StatusSeverity = bandExceeded.Severity;
                            bandExceeded.LastTriggering = now; // Estampa de tiempo de la superación de la banda
                        }
                    }
                    else // Setear estado por defecto
                    {
                        subVariable.Status = new List<string> { AsdaqProperties.DefaultRiskStatus.Id };
                        subVariable.StatusSeverity = AsdaqProperties.DefaultRiskStatus.Severity;
                    }
                });

                // El estado del measurementPoint es el estado de la subVariable de directa con mayor severidad o criticidad.
                // La subVariable de directa se identifica por tener la propiedad IsDefaultValue en true
                var moreCriticalSubVariable =
                    measurementPoint.SubVariables
                        .Where(s => s.IsDefaultValue)
                        .OrderByDescending(s => s.StatusSeverity).FirstOrDefault();

                if (moreCriticalSubVariable != null)
                {
                    var currentStatusMeasurementPoint = currentStatusByAssetList[/*measurementPoint.ParentId*/measurementPoint.PrincipalAssetId]
                        .CurrentStatusByMeasurementPoint[measurementPoint.Id];

                    currentStatusMeasurementPoint.StatusId = moreCriticalSubVariable.Status[0]; // Nuevo estado de condición del measurementPoint
                    currentStatusMeasurementPoint.Severity = moreCriticalSubVariable.StatusSeverity; // Severidad para facilitar cálculo de estado de asset            
                }
            });
        }

        /// <summary>
        /// Actualiza el tiempo real de los measurementPoints en la base de datos
        /// </summary>
        /// <param name="measurementPoints">Lista de measurementPoint</param>
        /// <param name="currentStatusByAsset">Lista de estados de activos y puntos de medición</param>
        /// <param name="principalAssests">Lista de activos principales</param>
        /// <param name="isToHMI">Valor lógico que indica si la actualización de tiempo real es o no es para la instancia HMI</param>
        public void UpdateRealTime(List<MdVariableExtension> measurementPoints, Dictionary<string, CurrentStatusByAsset> currentStatusByAsset,
            List<AssetExtension> principalAssests, bool isToHMI = false)
        {
            if (isToHMI)
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

            var now = System.DateTime.Now;
            List<RealTimeRequest> realTimeRequests = new List<RealTimeRequest>();

            try
            {
                realTimeRequests = new AsdaqProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).GetRealTimeRequests(AsdaqProperties.AsdaqId);
            }
            catch (SecurityException ex)
            {
                log.Debug(ex.Message);

                if (isToHMI)
                {
                    SecurityBl.LoginForHMI();
                }
                else
                {
                    SecurityBl.Login();
                }

                realTimeRequests = new AsdaqProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).GetRealTimeRequests(AsdaqProperties.AsdaqId);
            }

            if ((realTimeRequests != null) && (realTimeRequests.Count > 0))
            {
                // Procesamiento en segundo plano
                //new TaskFactory().StartNew(() =>
                //{
                var expiredRealTimeRequests =
                    realTimeRequests
                        .Where(realTimeRequest => (now - realTimeRequest.TimeStamp.ToLocalTime()).TotalSeconds >= AsdaqProperties.TimeoutOfRealTimeRequests)
                        .ToList();

                if ((expiredRealTimeRequests != null) && (expiredRealTimeRequests.Count > 0))
                {
                    // Quedan solo las solicitudes tiempo real vigentes, es decir, que no han caido en timeout
                    realTimeRequests = realTimeRequests.Except(expiredRealTimeRequests).ToList();

                    new AsdaqProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).DeleteRealTimeRequests(
                        AsdaqProperties.AsdaqId,
                        expiredRealTimeRequests.Select(expiredRealTimeRequest => expiredRealTimeRequest.SubVariableId).ToList());
                }

                //}).GetAwaiter().GetResult();

                if ((realTimeRequests != null) && (realTimeRequests.Count > 0))
                {
                    var realTimeDataList = new List<RealTimeDataItemDto>();

                    measurementPoints.SelectMany(m => m.SubVariables).ToList().ForEach(s =>
                    {
                        var hasRealTimeRequest = realTimeRequests.Any(realTimeRequest => realTimeRequest.SubVariableId == s.Id);

                        // Almacena los datos tiempo real para la subVariable solo si está siendo solicitada por algún cliente (Estrategia OnDemand)
                        if (hasRealTimeRequest)
                        {
                            realTimeDataList.Add(
                                new RealTimeDataItemDto(
                                    s.Id,
                                    s.Value,
                                    s.TimeStamp.ToLocalTime(),
                                    (s.Status != null) ? s.Status[0] : string.Empty,
                                    s.ValueType));
                        }
                    });

                    try
                    {
                        new SubVariableExtensionProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).UpdateManyRealTimeData(realTimeDataList);
                    }
                    catch (SecurityException ex)
                    {
                        log.Debug(ex.Message);

                        if (isToHMI)
                        {
                            SecurityBl.LoginForHMI();
                        }
                        else
                        {
                            SecurityBl.Login();
                        }

                        new SubVariableExtensionProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).UpdateManyRealTimeData(realTimeDataList);
                    }
                }
            }
            else
            {
                var toHMI = "";

                if (isToHMI)
                {
                    toHMI = " PARA LA HMI";
                }

                log.Debug("ACTUALMENTE NO HAY SOLICITUDES TIEMPO REAL DE LOS CLIENTES" + toHMI);
            }

            var mdVariableNodeStatusList = new List<MdVariableNodeStatusDto>();

            measurementPoints.ForEach(m =>
            {
                var currentStatusMeasurementPoint =
                    currentStatusByAsset[/*m.ParentId*/m.PrincipalAssetId].CurrentStatusByMeasurementPoint[m.Id];

                mdVariableNodeStatusList.Add(new MdVariableNodeStatusDto()
                {
                    NodeId = m.NodeId,
                    StatusId = currentStatusMeasurementPoint.StatusId
                });
            });

            // Actualización de estados de los nodos tipo MdVariable, ya que el árbol en el navegador resuelve estados
            // a partir de los nodos mdVariable
            try
            {
                new NodeExtensionProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).UpdateManyMdVariableStatus(mdVariableNodeStatusList);
            }
            catch (SecurityException ex)
            {
                log.Debug(ex.Message);

                if (isToHMI)
                {
                    SecurityBl.LoginForHMI();
                }
                else
                {
                    SecurityBl.Login();
                }

                new NodeExtensionProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).UpdateManyMdVariableStatus(mdVariableNodeStatusList);
            }
            var principalAssetNodes =
                principalAssests?.Select(pa => new Node() { Id = pa.NodeId, IsRotating = pa.IsRotating, LastRealTimeModify = now }).ToList();

            new NodeProxy((isToHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, isToHMI).UpdateRTPropertiesByPrincipalAssetNode(principalAssetNodes);
        }

        static string GetString(byte[] bytes)
        {
            char[] chars = new char[bytes.Length];
            System.Buffer.BlockCopy(bytes, 0, chars, 0, bytes.Length);
            return new string(chars);
        }

        private void GetSubVariablesByMeasurementPoint(ref List<MdVariableExtension> measurementPoints)
        {
            var subVariableExtensionProxy = new SubVariableExtensionProxy(SecurityBl.AppUserState);
            List<SubVariableExtension> subVariables = new List<SubVariableExtension>();
            try
            {
                subVariables = subVariableExtensionProxy.GetByMdVariableId(measurementPoints.Select(p => p.Id).ToList());
            }
            catch (SecurityException ex)
            {
                SecurityBl.Login();
                log.Debug(ex.Message);
                subVariableExtensionProxy = new SubVariableExtensionProxy(SecurityBl.AppUserState);
                subVariables = subVariableExtensionProxy.GetByMdVariableId(measurementPoints.Select(p => p.Id).ToList());
            }

            // Setear estados por defecto para las subVariables al iniciar el sistema
            subVariables.ForEach(s =>
            {
                s.StatusSeverity = AsdaqProperties.DefaultRiskStatus.Severity;

                if (s.Status != null)
                {
                    s.Status[0] = AsdaqProperties.DefaultRiskStatus.Id;
                }
                else
                {
                    s.Status = new List<string>() { AsdaqProperties.DefaultRiskStatus.Id };
                }
            });

            measurementPoints.ForEach(p =>
            {
                p.SubVariables = subVariables.Where(s => s.ParentId == p.Id).ToList();
                p.SubVariables
                    .Where(s => ((s.ValueType == ValueType.Numeric) && (s.Bands != null) && (s.Bands.Count > 0))).ToList()
                    .ForEach(s =>
                {
                    var bandsWithSeverity = new List<BandWithSeverity>(); // Band con propiedad Severity para facilitar los cálculos de estados

                    s.Bands.ForEach(t =>
                    {
                        // Mapeo de objeto Threshold a objeto ThresholdWithServerity
                        bandsWithSeverity.Add(
                            new BandWithSeverity()
                            {
                                LowerThreshold = t.LowerThreshold,
                                UpperThreshold = t.UpperThreshold,
                                StatusId = t.StatusId,
                                Severity = AsdaqProperties.RiskStatus.Where(rs => rs.Id == t.StatusId).FirstOrDefault().Severity,
                                SaveHistoric = t.SaveHistoric
                            });
                    });

                    // Asignar lista de threshold ordenados de forma descendente por la propiedad Severity
                    s.BandsOrderBySeverityDesc = bandsWithSeverity.OrderByDescending(t => t.Severity).ToList();
                });
            });
        }
    }
}
