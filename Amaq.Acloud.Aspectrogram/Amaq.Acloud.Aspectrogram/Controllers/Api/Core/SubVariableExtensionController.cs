namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using System.Web.Http;
    using System.Collections.Generic;
    using Entities;
    using Aspectrogram.Models.Business;
    using System;
    using Aspectrogram.Controllers.Api.Attributes;
    using Entities.Dtos;
    using System.Threading.Tasks;

    /// <summary>
    /// Controlador Api SubVariableExtension
    /// </summary>
    [CustomAuthorize]
    public class SubVariableExtensionController : GenericController<SubVariableExtension>
    {
        /// <summary>
        /// Obtiene las subVariables asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <param name="includeRealTimeData">Indica si se incluyen los datos tiempo real en el resultado(Value y TimeStamp)</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        [HttpPost]
        public async Task<IHttpActionResult> GetByMdVariableId(List<string> mdVariableIdList, bool includeRealTimeData = false)
        {
            return await Task.FromResult(Ok(new SubVariableExtensionBl(CoreDbUrl).GetByMdVariableId(mdVariableIdList, includeRealTimeData)));
        }

        /// <summary>
        /// Actualizar varios documentos de una entidad.
        /// </summary>
        /// <param name="subVariableExtensionList">Listado de subvariables a actualizar</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateMany([FromBody]List<SubVariableExtension> subVariableExtensionList)
        {
            // Los vectores de bytes enviados a traves de la web son codificados como Base64,
            // por lo cual para recuperar tales bytes se realiza lo siguiente:
            subVariableExtensionList.ForEach(s =>
            {
                if (s.ValueType == Acloud.Entities.Enums.ValueType.Waveform || s.ValueType == Acloud.Entities.Enums.ValueType.AngularReferencePositions)
                    s.Value = Convert.FromBase64String(s.Value.ToString());
            });

            new SubVariableExtensionBl(CoreDbUrl).Update(subVariableExtensionList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Obtiene datos tiempo real de las subVariables con los id especificados.
        /// </summary>
        /// <param name="model">Listado de solicitudes de subVariables tiempo real agrupadas por asdaq y atr</param>
        /// <returns>Datos tiempo real</returns>
        //public IHttpActionResult GetRealTimeData(List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList, List<RealTimeRequestsByAtrDto> realTimeRequestsByAtrList)
        [HttpPost]
        public async Task<IHttpActionResult> GetRealTimeData(dynamic model)
        {
            //return Ok(new SubVariableExtensionBl(CoreDbUrl).GetRealTimeData(realTimeRequestsByAsdaqList,realTimeRequestsByAtrList));
            var rtRequestsByAsdaqList= model.realTimeRequestsByAsdaqList?.ToObject<List<RealTimeRequestsByAsdaqDto>>();
            var rtRequestsByAtrList = model.realTimeRequestsByAtrList?.ToObject<List<RealTimeRequestsByAtrDto>>();
            return await Task.FromResult(Ok(new SubVariableExtensionBl(CoreDbUrl).GetRealTimeData(rtRequestsByAsdaqList, rtRequestsByAtrList)));
        }

        /// <summary>
        /// Actualiza las subVariables con la información especificada para cada una, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeDataList">Lista de subVariables con los datos a actualizar</param>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateManyRealTimeData([FromBody]List<RealTimeDataItemDto> realTimeDataList)
        {
            new SubVariableExtensionBl(CoreDbUrl).UpdateManyRealTimeData(realTimeDataList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza la subVariable con la información especificada, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeData">SubVariable con los datos a actualizar</param>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateRealTimeData([FromBody]RealTimeDataItemDto realTimeData)
        {
            new SubVariableExtensionBl(CoreDbUrl).UpdateRealTimeData(realTimeData);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza una lista de SubVariables
        /// </summary>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateMany2(List<SubVariableExtension> subVariables)
        {            
            return await Task.FromResult(Ok(new SubVariableExtensionBl(CoreDbUrl).UpdateMany(subVariables)));
        }

        /// <summary>
        /// Define los valores de referencia/compensacion de Amplitud y Fase 1x
        /// Usado para compensar Bode y Polar
        /// </summary>
        /// <param name="mdVariableId">Id de la MdVariable a compensar</param>
        /// <param name="amplitude">Amplitud 1X de referencia</param>
        /// <param name="phase">Fase 1X de referencia</param>
        [HttpGet]
        public async Task<IHttpActionResult> SetCompesation(string mdVariableId, double amplitude, double phase)
        {
            new SubVariableExtensionBl(CoreDbUrl).SetCompesation(mdVariableId, amplitude, phase);
            return await Task.FromResult(Ok("Ok"));
        }

        /// <summary>
        /// Elimina una subvariable por medio de su Id
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteById(string subVariableId)
        {
            new SubVariableExtensionBl(CoreDbUrl).DeleteById(subVariableId);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Guarda una lista de subVariables en base de datos
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Create(List<SubVariableExtension> subVariables)
        {            
            return await Task.FromResult(Ok(new SubVariableExtensionBl(CoreDbUrl).Create(subVariables)));
        }

        /// <summary>
        /// Elimina una lista de subVariables 
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteMany(List<SubVariableExtension> subVariables)
        {
            new SubVariableExtensionBl(CoreDbUrl).DeleteMany(subVariables);
            return await Task.FromResult(Ok());
        }
    }
}
