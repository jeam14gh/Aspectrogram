namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Acloud.Business;
    using Data;
    using Entities;
    using Entities.Dtos;
    using System.Linq;
    using System.Collections.Generic;
    using MongoDB.Bson;
    using System.Threading.Tasks;
    using System;
    using Entities.Enums;
    using Entities.ValueObjects;
    using System.IO;
    using log4net;
    using System.Reflection;

    /// <summary>
    /// Lógica de negocio MdVariableExtension
    /// </summary>
    public class MdVariableExtensionBl : CoreBl<MdVariableExtension>
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        private MdVariableExtensionRepository _mdVariableExtensionRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public MdVariableExtensionBl(string coreDbUrl) : base(coreDbUrl)
        {
            _mdVariableExtensionRepository = new MdVariableExtensionRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene las mdVariable asociadas al Id de Asset especificado.
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns>Listado de MdVariableExtension</returns>
        public List<MdVariableExtension> GetByAssetId(string assetId)
        {
            return _mdVariableExtensionRepository.GetByAssetId(assetId);
        }

        /// <summary>
        /// Obtiene las mdVariable asociadas al Id de Asset especificado.
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns>Listado de MdVariableExtension</returns>
        public List<MdVariableExtension> GetMeasurementPointsByAsset(string assetId)
        {
            List<MdVariableExtension> mdVariableList = new List<MdVariableExtension>();
            mdVariableList = _mdVariableExtensionRepository.GetByAssetId(assetId);
            var mdVariableIdList = mdVariableList.AsParallel().Select(m => m.Id).ToList();
            var subVariables = new SubVariableExtensionBl(CoreDbUrl).GetByMdVariableId(mdVariableIdList);
            var pair = new XYMeasurementPointPairBl(CoreDbUrl).GetXYPairByAssetId(assetId);
            Parallel.ForEach(mdVariableList, currentItem =>
            {
                currentItem.SubVariables = subVariables.Where(s => s.ParentId == currentItem.Id).ToList();
                var resp = currentItem.SubVariables.Where(s => (s.MeasureType == MeasureType.Amplitude1x) || (s.MeasureType == MeasureType.Phase1x)).ToList();
                if (resp.Count > 0)
                {
                    currentItem.CompAmp1X = (resp[0].MeasureType == MeasureType.Amplitude1x) ? resp[0].ReferenceCompesation : resp[1].ReferenceCompesation;
                    currentItem.CompPhase1X = (resp[0].MeasureType == MeasureType.Phase1x) ? resp[0].ReferenceCompesation : resp[1].ReferenceCompesation;
                }
                if (pair.Count(s => s.XMdVariableId == currentItem.Id) > 0)
                {
                    currentItem.AssociatedMeasurementPointId = pair.Where(s => s.XMdVariableId == currentItem.Id).FirstOrDefault().YMdVariableId;
                    var sclOpts = pair.Where(s => s.XMdVariableId == currentItem.Id).FirstOrDefault().SclOptions;
                    currentItem.Clearance = (sclOpts != null) ? sclOpts.XClearance : 0;
                    currentItem.GapReference = (sclOpts != null) ? sclOpts.XGapReference : 0;
                    currentItem.ClearanceStartingPosition = (sclOpts != null) ? (int)sclOpts.StartingPoint : 0;
                    //currentItem.Orientation = SensorOrientation.X;
                }
                else if (pair.Count(s => s.YMdVariableId == currentItem.Id) > 0)
                {
                    currentItem.AssociatedMeasurementPointId = pair.Where(s => s.YMdVariableId == currentItem.Id).FirstOrDefault().XMdVariableId;
                    var sclOpts = pair.Where(s => s.YMdVariableId == currentItem.Id).FirstOrDefault().SclOptions;
                    currentItem.Clearance = (sclOpts != null) ? sclOpts.YClearance : 0;
                    currentItem.GapReference = (sclOpts != null) ? sclOpts.YGapReference : 0;
                    currentItem.ClearanceStartingPosition = (sclOpts != null) ? (int)sclOpts.StartingPoint : 0;
                    //currentItem.Orientation = SensorOrientation.Y;
                }
            });
            return mdVariableList;
        }

        /// <summary>
        /// Obtiene las mdVariable asociadas con cualquiera de los id asset especificados
        /// </summary>
        /// <param name="assetIdList">Lista de id asset</param>
        /// <returns>Lista de objetos de tipo MdVariableExtension</returns>
        public List<MdVariableExtension> GetByAssetId(List<string> assetIdList)
        {
            return _mdVariableExtensionRepository.GetByAssetId(assetIdList);
        }

        /// <summary>
        /// Obtiene las subVariables con valor tipo Amaq Stream asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<MeasurementPointDto> GetSignal(List<string> mdVariableIdList)
        {
            List<SubVariableExtension> subVariables = new SubVariableExtensionBl(CoreDbUrl).GetSignal(mdVariableIdList);
            List<MeasurementPointDto> measurementPointsDto = new List<MeasurementPointDto>();
            XYMeasurementPointPairBl xyMeasurementPointPairBl = new XYMeasurementPointPairBl(CoreDbUrl);

            mdVariableIdList.ForEach(mdVariableId =>
            {
                var xyPair = xyMeasurementPointPairBl.GetXYPair(mdVariableId);
                var measuresDto = subVariables.Where(s => s.ParentId == mdVariableId)
                                              .Select(s => new MeasureDto(s.Id, s.TimeStamp, (byte[])s.Value, s.Units)).ToList();
                measurementPointsDto.Add(new MeasurementPointDto(mdVariableId, xyPair, measuresDto));
            });

            return measurementPointsDto;
        }

        /// <summary>
        /// Obtiene las subVariables con medidas globales asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<MeasurementPointDto> GetOverallMeasure(List<string> mdVariableIdList)
        {
            List<SubVariableExtension> subVariables = new SubVariableExtensionBl(CoreDbUrl).GetOverallMeasure(mdVariableIdList);
            List<MeasurementPointDto> measurementPointsDto = new List<MeasurementPointDto>();
            XYMeasurementPointPairBl xyMeasurementPointPairBl = new XYMeasurementPointPairBl(CoreDbUrl);

            mdVariableIdList.ForEach(mdVariableId =>
            {
                var xyPair = xyMeasurementPointPairBl.GetXYPair(mdVariableId);
                var measuresDto = subVariables.Where(s => s.ParentId == mdVariableId)
                                              .Select(s => new MeasureDto(s.Id, s.TimeStamp, s.Value, s.Units)).ToList();
                measurementPointsDto.Add(new MeasurementPointDto(mdVariableId, xyPair, measuresDto));
            });

            return measurementPointsDto;
        }

        /// <summary>
        /// 
        /// </summary>
        public List<MdVariableExtension> GetTagById(List<string> mdVariableIdList)
        {
            return _mdVariableExtensionRepository.GetTagById(mdVariableIdList);
        }

        /// <summary>
        /// Elimina un punto de medición, sus SubVariables, el Node asociado a el por medio de su Id, la relación con un canal Asdaq si la tiene y su par XY si existe.
        /// </summary>
        public void DeleteMany(List<MdVariableExtension> mdVariables)
        {
            foreach (var md in mdVariables)
            {
                new NodeBl(CoreDbUrl).DeleteById(md.NodeId);
                _mdVariableExtensionRepository.Delete(md.Id);
                new SubVariableExtensionBl(CoreDbUrl).DeleteByParentId(md.Id);

                // Elimina la relación de un punto de medición asociado a un canal Asdaq
                new AsdaqBl(CoreDbUrl).SetDisassociateOnTrueInAiChannels(new List<MdVariableExtension>() { md }, "point");
                new AtrBl(CoreDbUrl).SetDisassociateOnTrueInAiChannels(new List<MdVariableExtension>() { md }, "point");

                // Elimina un par XY si existe 
                new XYMeasurementPointPairBl(CoreDbUrl).DeleteByMdVariableId(md.Id);
            }
        }

        /// <summary>
        /// Actualiza un punto de medición incluyendo la propiedad ParameterValues
        /// </summary>
        public void UpdateIncludingParameterValues(MdVariableExtension mdVariable)
        {
            if (mdVariable.AiMeasureMethod != null)
            {
                var parameterTypes = mdVariable.AiMeasureMethod.ParameterTypes;
                if (parameterTypes != null)
                {
                    for (int i = 0; i < parameterTypes.Count; i++)
                    {
                        if (parameterTypes[i].StartsWith("System.Double"))
                            mdVariable.AiMeasureMethod.ParameterValues[i] = Convert.ToDouble(mdVariable.AiMeasureMethod.ParameterValues[i].ToString().Replace('.', ','));
                    }
                }
                else
                {
                    mdVariable.AiMeasureMethod.ParameterTypes = null;
                    mdVariable.AiMeasureMethod.ParameterValues = null;
                }
            }

            _mdVariableExtensionRepository.UpdateIncludingParameterValues(mdVariable);
            CalculateAgainMandB(mdVariable);
        }

        /// <summary>
        /// Retorna un punto de medición por medio de su NodeId
        /// </summary>
        public MdVariableExtension GetByNodeId(string nodeId)
        {
            return _mdVariableExtensionRepository.GetByNodeId(nodeId);
        }

        /// <summary>
        /// Retorna una lista de puntos de medición atravez de una lista de nodeId
        /// </summary>
        public List<MdVariableExtension> GetByNodeId(List<string> nodeIdList)
        {
            if (nodeIdList != null)
                return _mdVariableExtensionRepository.GetByNodeId(nodeIdList);
            else
                return null;
        }

        /// <summary>
        /// Elimina varios puntos de medición, Subvaribles asociadas a cada punto, relación con canales Asdaq y pares XY si existen.
        /// </summary>
        public void DeleteManyByIdAndSubVaribles(List<MdVariableExtension> mdVariableList)
        {
            if (mdVariableList != null)
            {
                // Elimina la relación de puntos de medición asociados a canales Asdaq y Atr
                new AsdaqBl(CoreDbUrl).SetDisassociateOnTrueInAiChannels(mdVariableList, "assetOrLocation");
                new AtrBl(CoreDbUrl).SetDisassociateOnTrueInAiChannels(mdVariableList, "assetOrLocation");

                var mdVariableIdList = mdVariableList.Select(s => s.Id).ToList();
                _mdVariableExtensionRepository.DeleteManyById(mdVariableIdList);

                // new AsdaqBl(CoreDbUrl).UpdateMdVaraibleIdOfAiChannel(mdVariableIdList);


                for (int i = 0; i < mdVariableIdList.Count; i++)
                {
                    new SubVariableExtensionBl(CoreDbUrl).DeleteByParentId(mdVariableIdList[i]);
                    // Elimina un par XY si existe
                    new XYMeasurementPointPairBl(CoreDbUrl).DeleteByMdVariableId(mdVariableIdList[i]);
                }
            }
        }

        /// <summary>
        /// Actualiza el objeto AiMeasureMethod de una lista de puntos de medición cuando éstos son relacionados con canales Asdaq
        /// </summary>
        /// <param name="channels">Lista canales con puntos de medición</param>
        /// <param name="isAcelerometerChannel">Indica si el tipo de canal es aceleración o no de un módulo de un Asdaq</param>
        /// <param name="aiCurrentExcitationValue">Valor de corriente de excitación del módulo Asdaq</param>
        public void UpdateAiMeasureMethod(List<NiAiChannel> channels, bool isAcelerometerChannel, double aiCurrentExcitationValue)
        {
            var unit = string.Empty;
            for (int i = 0; i < channels.Count; i++)
            {
                var mdVariable = _mdVariableExtensionRepository.GetById(channels[i].MdVariableId);

                // Verificamos el tipo de unidad que tendrá el objecto "ParameterValues" del AiMeasureMethod. 
                if ((mdVariable.SensorTypeCode == 4) && (isAcelerometerChannel == true))
                {
                    unit = "G";
                }
                else if (mdVariable.SensorTypeCode == 4)
                {
                    unit = "Volts";
                }
                else
                {
                    unit = "FromCustomScale";
                }

                // Validamos el tipo de "AiMeasureMethod" que tendrá el punto, a partir si es un Acelerometer o no.
                if (isAcelerometerChannel)
                {
                    // Valida si mantiene la misma fuente de excitación
                    var excitationSource = channels[i].ExcitationIEPE ? "Internal" : "None";
                    var excitationValue = channels[i].ExcitationIEPE ? aiCurrentExcitationValue : 0.0;

                    mdVariable.AiMeasureMethod = new AiMeasureMethod
                    {
                        AiMethodId = null,
                        Name = "CreateAccelerometerChannel",
                        ParameterTypes = new List<string>(new string[] {
                            "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "NationalInstruments.DAQmx.AITerminalConfiguration, NationalInstruments.DAQmx, Version=14.5.45.122, Culture=neutral, PublicKeyToken=4febd62461bf11a4",
                            "System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "NationalInstruments.DAQmx.AIAccelerometerSensitivityUnits, NationalInstruments.DAQmx, Version=14.5.45.122, Culture=neutral, PublicKeyToken=4febd62461bf11a4",
                            "NationalInstruments.DAQmx.AIExcitationSource, NationalInstruments.DAQmx, Version=14.5.45.122, Culture=neutral, PublicKeyToken=4febd62461bf11a4",
                            "System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "NationalInstruments.DAQmx.AIAccelerationUnits, NationalInstruments.DAQmx, Version=14.5.45.122, Culture=neutral, PublicKeyToken=4febd62461bf11a4"
                        }),
                        ParameterValues = new List<object>(new object[] { "", "", "Pseudodifferential", -5.0, 5.0, 1.0, "VoltsPerG", excitationSource, excitationValue, unit }),
                        M = mdVariable.AiMeasureMethod == null ? 1 : mdVariable.AiMeasureMethod.M,
                        B = mdVariable.AiMeasureMethod == null ? 0 : mdVariable.AiMeasureMethod.B,
                        /*Garantizar el nivel DC para el GAP en sensores de proximidad*/
                        AiCoupling = (mdVariable.SensorTypeCode == 1 || mdVariable.SensorTypeCode == 4) ? "DC" : "AC"
                    };

                    _mdVariableExtensionRepository.UpdateAiMeasureMethod(mdVariable);
                }
                else
                {
                    mdVariable.AiMeasureMethod = new AiMeasureMethod
                    {
                        AiMethodId = null,
                        Name = "CreateVoltageChannel",
                        ParameterTypes = new List<string>(new string[] {
                            "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "NationalInstruments.DAQmx.AITerminalConfiguration, NationalInstruments.DAQmx, Version=14.5.45.122, Culture=neutral, PublicKeyToken=4febd62461bf11a4",
                            "System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089",
                            "NationalInstruments.DAQmx.AIVoltageUnits, NationalInstruments.DAQmx, Version=14.5.45.122, Culture=neutral, PublicKeyToken=4febd62461bf11a4"
                        }),
                        ParameterValues = new List<object>(new object[] { "", "", "Rse", -10.0, 10.0, unit }),
                        M = mdVariable.AiMeasureMethod == null ? 1 : mdVariable.AiMeasureMethod.M,
                        B = mdVariable.AiMeasureMethod == null ? 0 : mdVariable.AiMeasureMethod.B,
                    };

                    _mdVariableExtensionRepository.UpdateAiMeasureMethod(mdVariable);
                }
            }
        }

        /// <summary>
        /// Calcula los parametros M y B de cada punto de medición a partir de una lista obtenida en la configuración de canales de un Asdaq
        /// </summary>
        public void CalculateMandB(List<MdVariableUpdateMBDto> mdVariablesDto, string processType)
        {
            if (mdVariablesDto != null)
            {
                // Se hace un orderBy que liste primero los puntos de medición que se deben recalcular (estado original antes de cualquier relacion con un canal Asdaq) 
                // su M y B, ya que pueden existir puntos duplicados pero cada uno hace un calculo diferente.
                var mdVarsDto = mdVariablesDto.OrderByDescending(o => o.Recalculate).ToList();

                for (int m = 0; m < mdVarsDto.Count; m++)
                {
                    var mdVariable = _mdVariableExtensionRepository.GetById(mdVarsDto[m].MdVariableId);
                    if (mdVariable.AiMeasureMethod != null)
                    {
                        // Si es true indica que no hay Aconditioner asociado al canal Asdaq y los parametros M y B deben volver al valor original.
                        if (mdVarsDto[m].Recalculate)
                        {
                            mdVariable.AiMeasureMethod.B = mdVariable.AiMeasureMethod.B + (mdVarsDto[m].Displacement / mdVarsDto[m].Gain) * mdVariable.AiMeasureMethod.M; // B= B' + ( O / G ) * M
                            mdVariable.AiMeasureMethod.M = mdVariable.AiMeasureMethod.M * mdVarsDto[m].Gain; // M= M * G
                            _mdVariableExtensionRepository.UpdateAiMeasureMethod(mdVariable);

                            if ((mdVariable.AiMeasureMethod.M == 0) || (Double.IsNaN(mdVariable.AiMeasureMethod.M)) || (Double.IsNaN(mdVariable.AiMeasureMethod.B)))
                                RegisterInLog(mdVariable, true, processType, "CalculateMandB");

                            continue;
                        }
                        else
                        {
                            var B = mdVariable.AiMeasureMethod.B;
                            var M = mdVariable.AiMeasureMethod.M;

                            mdVariable.AiMeasureMethod.B = B - (mdVarsDto[m].Displacement / mdVarsDto[m].Gain) * M; // B'= B - ( O / G ) * M
                            mdVariable.AiMeasureMethod.M = M / mdVarsDto[m].Gain; // M'= M / G
                            _mdVariableExtensionRepository.UpdateAiMeasureMethod(mdVariable);

                            if ((mdVariable.AiMeasureMethod.M == 0) || (Double.IsNaN(mdVariable.AiMeasureMethod.M)) || (Double.IsNaN(mdVariable.AiMeasureMethod.B)))
                                RegisterInLog(mdVariable, false, processType, "CalculateMandB");

                            continue;
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Actuliza el AiMeasureMethod de los paramatros M y B de varios puntos de medición
        /// </summary>
        public void UpdateAiMeasureMethodOfMB(List<string> idList)
        {
            foreach (var id in idList)
            {
                var mdVariable = _mdVariableExtensionRepository.GetById(id);
                _mdVariableExtensionRepository.UpdateAiMeasureMethodOfMB(mdVariable);
            }
        }

        /// <summary>
        /// Actualiza el AngularReferenceId de un punto de medición
        /// </summary>
        public void UpdateAngularReferenceId(string mdVariableId, string angularReferenceId)
        {
            _mdVariableExtensionRepository.UpdateAngularReferenceId(mdVariableId, angularReferenceId);
        }

        /// <summary>
        /// Actualiza una lista de puntos de acuerdo a la posicion que tenga en el listbox
        /// </summary>
        public void UpdateOrderPositionPoints(List<MdVariableExtension> mdVariables)
        {
            foreach (var m in mdVariables)
            {
                _mdVariableExtensionRepository.UpdateOrderPositionPoints(m);
            }
        }

        /// <summary>
        /// Setea en null todas las propiedades que estan en el objeto AiMeasureMethod, excepto la M y B de un punto de medición
        /// </summary>
        public void setPropertiesAiMeasureMethod(MdVariableExtension mdVariable)
        {
            mdVariable.AiMeasureMethod.AiMethodId = null;
            mdVariable.AiMeasureMethod.Name = null;
            mdVariable.AiMeasureMethod.ParameterTypes = null;
            mdVariable.AiMeasureMethod.ParameterValues = null;
            mdVariable.AiMeasureMethod.AiCoupling = null;

            _mdVariableExtensionRepository.UpdateAiMeasureMethod(mdVariable);
        }

        /// <summary>
        /// Actualiza el nombre de un punto de medición
        /// </summary>
        public void UpdateName(string id, string name)
        {
            _mdVariableExtensionRepository.UpdateName(id, name);
        }

        /// <summary>
        /// Actualiza una lista de puntos de medición en algunas de sus propiedades y en la subVariable directa si existe 
        /// </summary>
        public void UpdatePoints(List<MdVariableExtension> points)
        {
            if (points != null)
            {
                foreach (var p in points)
                {
                    if (p.AiMeasureMethod != null)
                    {
                        if (p.AiMeasureMethod.ParameterTypes != null)
                        {
                            if (p.AiMeasureMethod.ParameterTypes.Count == 1)
                                p.AiMeasureMethod.ParameterTypes = null;
                        }

                        if (p.AiMeasureMethod.ParameterValues != null)
                        {
                            if (p.AiMeasureMethod.ParameterValues.Count == 1)
                                p.AiMeasureMethod.ParameterValues = null;
                        }

                        if ((p.AiMeasureMethod.M == 0) || (Double.IsNaN(p.AiMeasureMethod.M)) || (Double.IsNaN(p.AiMeasureMethod.B)))
                            RegisterInLog(p, false, "Edición de punto de medición", "UpdatePoints");
                    }

                    _mdVariableExtensionRepository.UpdateProperties(p);
                    // Buscamos si el punto de medición está asociado a un canal Asdaq para recalcular de nuevo su M y B
                    CalculateAgainMandB(p);

                    var direct = p.SubVariables.Where(w => w.IsDefaultValue).FirstOrDefault();

                    if (direct != null)
                        new SubVariableExtensionBl(CoreDbUrl).UpdateDirect(direct);
                }
            }
        }

        /// <summary>
        /// Retorna todas las referencias angulares
        /// </summary>
        public List<MdVariableExtension> GetAllReferenceAngular()
        {
            return _mdVariableExtensionRepository.Where(x => x.SensorTypeCode == 4).ToList();
        }

        /// <summary>
        /// Cálcula de nuevo la M y B de un punto de medición anteriormente editado, si éste está relacionado con un canal Asdaq.
        /// </summary>
        public void CalculateAgainMandB(MdVariableExtension mdVar)
        {
            var exist = false;
            var dto = new List<MdVariableUpdateMBDto>();
            var asdaq = new AsdaqBl(CoreDbUrl).GetAll();

            foreach (var a in asdaq)
            {
                if (exist)
                    break;

                foreach (var c in a.NiCompactDaqs.SelectMany(s => s.CSeriesModules).ToList())
                {
                    var channel = c.AiChannels.Where(w => w.MdVariableId == mdVar.Id).FirstOrDefault();
                    if (channel != null)
                    {
                        var aconditioner = a.Aconditioners.Where(ac => ac.Serial == channel.SerialAcon).FirstOrDefault();

                        if (aconditioner != null)
                        {
                            if ((aconditioner.AconChannels.Count > 0) && (aconditioner.AconChannels != null))
                            {
                                var acon = aconditioner.AconChannels.Where(w => w.Number == channel.AconChannel).FirstOrDefault();

                                if ((mdVar.AiMeasureMethod != null) && (acon != null))
                                {
                                    var B = mdVar.AiMeasureMethod.B;
                                    var M = mdVar.AiMeasureMethod.M;

                                    mdVar.AiMeasureMethod.B = B - (acon.Displacement / acon.Gain) * M; // B'= B - ( O / G ) * M
                                    mdVar.AiMeasureMethod.M = M / acon.Gain; // M'= M / G
                                    _mdVariableExtensionRepository.UpdateAiMeasureMethod(mdVar);
                                    exist = true;

                                    if ((mdVar.AiMeasureMethod.M == 0) || (Double.IsNaN(mdVar.AiMeasureMethod.M)) || (Double.IsNaN(mdVar.AiMeasureMethod.B)))
                                        RegisterInLog(mdVar, false, "Edición de punto de medición", "CalculateAgainMandB");

                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Registra todos lo errores de cálculos respecto a la M y B de un punto de medición en un archivo de texto plano.
        /// </summary>
        public void RegisterInLog(MdVariableExtension mdVar, bool recalculate, string processType, string metod)
        {
            try
            {
                var _text = "NAME: " + mdVar.Name +
                    ", ID: " + mdVar.Id +
                    ", PARENTID: " + mdVar.ParentId +
                    ", RECÁLCULADO: " + recalculate +
                    ", PROCESO: " + processType +
                    ", M: " + mdVar.AiMeasureMethod.M +
                    ", B: " + mdVar.AiMeasureMethod.B +
                    ", SENSIBILITY: " + mdVar.Sensibility +
                    ", MÉTODO: " + metod;

                log.Info(_text);
            }
            catch (Exception e)
            {
                log.Info(e.Message + " ::: EXCEPCIÓN AL REGISTRAR UN ERROR DE CÁLCULO DE UN PUNTO DE MEDICIÓN.");
            }
        }
    }
}
