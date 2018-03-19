namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Acloud.Business;
    using Data;
    using Entities;
    using Entities.Dtos;
    using System.Collections.Generic;
    using System.Linq;
    using Acloud.Entities.Enums;
    using MongoDB.Bson;

    /// <summary>
    /// Lógica de negocio SubVariableExtension
    /// </summary>
    public class SubVariableExtensionBl : CoreBl<SubVariableExtension>
    {
        private SubVariableExtensionRepository _subVariableExtensionRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public SubVariableExtensionBl(string coreDbUrl) : base(coreDbUrl)
        {
            _subVariableExtensionRepository = new SubVariableExtensionRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene las subVariables asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <param name="includeRealTimeData">Indica si se incluyen los datos tiempo real en el resultado(Value y TimeStamp)</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetByMdVariableId(List<string> mdVariableIdList, bool includeRealTimeData = false)
        {
            return _subVariableExtensionRepository.GetByMdVariableId(mdVariableIdList, includeRealTimeData);
        }

        /// <summary>
        /// Obtiene las subVariables con valor de tipo Amaq Stream asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetSignal(List<string> mdVariableIdList)
        {
            return _subVariableExtensionRepository.GetSignal(mdVariableIdList);
        }

        /// <summary>
        /// Obtiene las subVariables con medidas globales asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetOverallMeasure(List<string> mdVariableIdList)
        {
            return _subVariableExtensionRepository.GetOverallMeasure(mdVariableIdList);
        }

        /// <summary>
        /// Obtiene datos tiempo real de las subVariables con los id especificados.
        /// </summary>
        /// <param name="realTimeRequestsByAsdaqList">Listado de solicitudes de subVariables tiempo real agrupadas por asdaq</param>
        /// <param name="realTimeRequestsByAtrList">Listado de solicitudes de subVariables tiempo real agrupadas por atr</param>
        /// <returns>Datos tiempo real</returns>
        public List<RealTimeDataItemDto> GetRealTimeData(List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList, List<RealTimeRequestsByAtrDto> realTimeRequestsByAtrList)
        {
            // Notificar a los asdaq las subVariables solicitadas en tiempo real, todo esto a traves de Mongo
            var subVariableIdList = new List<string>();
            if (realTimeRequestsByAsdaqList != null)
            {
                if (realTimeRequestsByAsdaqList[0].AsdaqId != null)
                    new AsdaqBl(CoreDbUrl).UpdateRealTimeRequests(realTimeRequestsByAsdaqList);

                var rtRequestsByAsdaqList = realTimeRequestsByAsdaqList.SelectMany(realTimeRequestsByAsdaq => realTimeRequestsByAsdaq.SubVariableIdList).ToList();
                subVariableIdList.AddRange(rtRequestsByAsdaqList);
            }

            if (realTimeRequestsByAtrList != null)
            {
                if (realTimeRequestsByAtrList[0].AtrId != null)
                    new AtrBl(CoreDbUrl).UpdateRealTimeRequests(realTimeRequestsByAtrList);

                var rtRequestsByAtrList = realTimeRequestsByAtrList.SelectMany(realTimeRequestsByAtr => realTimeRequestsByAtr.SubVariableIdList).ToList();
                subVariableIdList.AddRange(rtRequestsByAtrList);
            }

            return
                _subVariableExtensionRepository.GetRealTimeData(subVariableIdList)
                    .Select(s =>
                        new RealTimeDataItemDto(
                            s.Id,
                            (s.ValueType == ValueType.Waveform || s.ValueType == ValueType.AngularReferencePositions) ? (byte[])s.Value : s.Value,
                            s.TimeStamp,
                            (s.Status != null) ? s.Status[0] : string.Empty,
                            s.ValueType
                         )
                     ).ToList();
            //// Notificar a los asdaq las subVariables solicitadas en tiempo real, todo esto a traves de Mongo
            //// Temporalmente y mientras el ATR se acoge a una estrategia de on-demand

            //if (realTimeRequestsByAsdaqList[0].AsdaqId != null)
            //{
            //    new AsdaqBl(CoreDbUrl).UpdateRealTimeRequests(realTimeRequestsByAsdaqList);
            //}

            //var subVariableIdList =
            //    realTimeRequestsByAsdaqList
            //        .SelectMany(realTimeRequestsByAsdaq => realTimeRequestsByAsdaq.SubVariableIdList)
            //        .ToList();


            //return
            //    _subVariableExtensionRepository.GetRealTimeData(subVariableIdList)
            //        .Select(s =>
            //            new RealTimeDataItemDto(
            //                s.Id,
            //                (s.ValueType == ValueType.Waveform || s.ValueType == ValueType.AngularReferencePositions) ? (byte[])s.Value : s.Value,
            //                s.TimeStamp,
            //                (s.Status != null) ? s.Status[0] : string.Empty,
            //                s.ValueType
            //             )
            //         ).ToList();
        }

        /// <summary>
        /// Actualiza las subVariables con la información especificada para cada una, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeDataList">Lista de subVariables con los datos a actualizar</param>
        public void UpdateManyRealTimeData(List<RealTimeDataItemDto> realTimeDataList)
        {
            try
            {
                if (realTimeDataList == null)
                {
                    return;
                }

                // Mapeo de Dto a entidad
                var subVariablesRT =
                    realTimeDataList.Select(rt =>
                        new SubVariableExtension()
                        {
                            Id = rt.SubVariableId,
                            TimeStamp = rt.TimeStamp,
                            Value = ((rt.ValueType == ValueType.Waveform || rt.ValueType == ValueType.AngularReferencePositions) && (rt.Value != null)) ? System.Convert.FromBase64String(rt.Value.ToString()) : rt.Value,
                            Status = new List<string>() { rt.StatusId }
                        }).ToList();

                _subVariableExtensionRepository.UpdateManyRealTimeData(subVariablesRT);
            }
            catch (System.Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Actualiza la subVariable con la información especificada, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeData">SubVariable con los datos a actualizar</param>
        public void UpdateRealTimeData(RealTimeDataItemDto realTimeData)
        {
            // Mapeo de Dto a entidad
            var subVariableRT =
                new SubVariableExtension()
                {
                    Id = realTimeData.SubVariableId,
                    TimeStamp = realTimeData.TimeStamp,
                    Value = (realTimeData.ValueType == ValueType.Waveform || realTimeData.ValueType == ValueType.AngularReferencePositions) ? System.Convert.FromBase64String(realTimeData.Value.ToString()) : realTimeData.Value,
                    Status = new List<string>() { realTimeData.StatusId }
                };

            _subVariableExtensionRepository.UpdateRealTimeData(subVariableRT);
        }

        /// <summary>
        /// Elimina las SubVariables que su parentId sea igual
        /// </summary>
        public void DeleteByParentId(string parentId)
        {
            _subVariableExtensionRepository.DeleteByParentId(parentId);
        }

        /// <summary>
        /// Actualiza una lista de SubVariables
        /// </summary>
        public void UpdateMany(List<SubVariableExtension> subVariables)
        {
            if (subVariables != null)
            {
                for (int s = 0; s < subVariables.Count; s++)
                {
                    if (subVariables[s].Id.Length != 24)
                    {
                        subVariables[s].Id = null;
                        _subVariableExtensionRepository.Add(subVariables[s]);
                        subVariables.RemoveAt(s);
                        s--;
                    }
                }
                _subVariableExtensionRepository.UpdateMany(subVariables);
            }
        }

        /// <summary>
        /// Elimina una subvariable por medio de su Id
        /// </summary>
        public void DeleteById(string subVariableId)
        {
            _subVariableExtensionRepository.Delete(subVariableId);
        }

        /// <summary>
        /// Define los valores de referencia/compensacion de Amplitud y Fase 1x
        /// Usado para compensar Bode y Polar
        /// </summary>
        /// <param name="mdVariableId">Id de la MdVariable a compensar</param>
        /// <param name="amplitude">Amplitud 1X de referencia</param>
        /// <param name="phase">Fase 1X de referencia</param>
        public void SetCompesation(string mdVariableId, double amplitude, double phase)
        {
            _subVariableExtensionRepository.SetCompesation(mdVariableId, amplitude, phase);
        }

        /// <summary>
        /// Guarda y retorna una lista de Id's de subVariables
        /// </summary>
        public List<string> Create(List<SubVariableExtension> subVariables)
        {
            if (subVariables != null)
            {
                for (int i = 0; i < subVariables.Count; i++)
                {
                    if (subVariables[i].ValueType == ValueType.Numeric)
                        subVariables[i].Value = 0.0;
                    else
                        subVariables[i].Value = null;

                    if (subVariables[i].ValueType == ValueType.Waveform)
                        subVariables[i].Value = new byte[] { };
                }
                return _subVariableExtensionRepository.AddMany(subVariables);
            }
            else
                return new List<string>();
        }

        /// <summary>
        /// Retorna una lista de subvariables por medio de su parentId
        /// </summary>
        public List<SubVariableExtension> GetByParentId(string parentId)
        {
            return _subVariableExtensionRepository.Where(s => s.ParentId == parentId).ToList();
        }

        /// <summary>
        /// Elimina una lista de subVariables 
        /// </summary>
        public void DeleteMany(List<SubVariableExtension> subVariables)
        {
            _subVariableExtensionRepository.DeleteMany(subVariables.Select(s => s.Id).ToList());
        }

        /// <summary>
        /// Actualiza la subvariable de Directa
        /// </summary>
        public void UpdateDirect(SubVariableExtension subVariable)
        {
            var bands = subVariable.Bands;
            if (bands != null)
            {
                for (int s = 0; s < bands.Count; s++)
                {
                    if (bands[s] != null)
                    {
                        if (bands[s].LowerThreshold != null)
                        {
                            double? lowerThreshold = bands[s].LowerThreshold.Value;
                            if (!lowerThreshold.HasValue || lowerThreshold == 0)
                                bands[s].LowerThreshold = null;
                        }

                        if (bands[s].UpperThreshold != null)
                        {
                            double? upperThreshold = bands[s].UpperThreshold.Value;
                            if (!upperThreshold.HasValue || upperThreshold == 0)
                                bands[s].UpperThreshold = null;
                        }
                    }
                    else
                    {
                        bands = null;
                        break;
                    }
                }
            }

            _subVariableExtensionRepository.UpdateDirect(subVariable, bands);
        }
    }
}
