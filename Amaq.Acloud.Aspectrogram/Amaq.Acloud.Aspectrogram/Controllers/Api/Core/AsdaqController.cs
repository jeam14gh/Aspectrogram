namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using System.Web.Http;
    using Entities;
    using Aspectrogram.Models.Business;
    using Aspectrogram.Controllers.Api.Attributes;
    using Entities.Dtos;
    using System.Collections.Generic;
    using Entities.ValueObjects;
    using System.Threading.Tasks;

    /// <summary>
    /// Controlador Asdaq
    /// </summary>
    [CustomAuthorize]
    public class AsdaqController : GenericController<Asdaq>
    {
        /// <summary>
        /// Obtiene que indica si el Asdaq debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        /// <returns></returns>
        [HttpGet]
        [Roles("Admin")]
        public async Task<IHttpActionResult> ShouldReconfigure(string asdaqId)
        {
            return await Task.FromResult(Ok(new AsdaqBl(CoreDbUrl).ShouldReconfigure(asdaqId)));
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del asdaq con el Id especificado
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> ResetReconfigureFlag([FromBody]string asdaqId)
        {
            new AsdaqBl(CoreDbUrl).ResetReconfigureFlag(asdaqId);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Obtiene toda la coleccion Asdaq con el nombre de la mdVariable asociada a un Aichannel y no su MdVariableId.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetAllWithMdVariableTag()
        {
            return await Task.FromResult(Ok(new AsdaqBl(CoreDbUrl).GetAllWithMdVariableTag()));
        }

        /// <summary>
        /// Actualiza todos los dispositivos de adquisición (NiDevices y NiCompactDaqs) asociados a un AsdaqId
        /// </summary>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateDevice(string asdaqId, List<NiDeviceDto> devices)
        {
            new AsdaqBl(CoreDbUrl).UpdateDevice(asdaqId, devices);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetRealTimeRequests(string asdaqId)
        {
            return await Task.FromResult(Ok(new AsdaqBl(CoreDbUrl).GetRealTimeRequests(asdaqId)));
        }

        /// <summary>
        /// Actualiza las solicitudes tiempo real de los asdaq especificados
        /// </summary>
        /// <param name="realTimeRequestsByAsdaqList">Lista de solicitudes tiempo por asdaq</param>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateRealTimeRequests(List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList)
        {
            new AsdaqBl(CoreDbUrl).UpdateRealTimeRequests(realTimeRequestsByAsdaqList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteRealTimeRequests(string asdaqId, List<string> subVariableIdList)
        {
            new AsdaqBl(CoreDbUrl).DeleteRealTimeRequests(asdaqId, subVariableIdList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteRelationshipMdVariableWithAiChannels(string asdaqId, NiDeviceDto device)
        {
            new AsdaqBl(CoreDbUrl).DeleteRelationshipMdVariableWithAiChannels(asdaqId, device);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Obtiene las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        [HttpGet]
        [Roles("Admin")]
        public async Task<IHttpActionResult> GetChangeRequests(string asdaqId)
        {
            return await Task.FromResult(Ok(new AsdaqBl(CoreDbUrl).GetChangeRequests(asdaqId)));
        }

        /// <summary>
        /// Actualiza las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="changeRequests">Objeto con las solicitudes de cambio de subVariables y assets</param>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateChangeRequests(string asdaqId, ChangeRequestsDto changeRequests)
        {
            new AsdaqBl(CoreDbUrl).UpdateChangeRequests(asdaqId, changeRequests);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Elimina todas las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteAllChangeRequests(string asdaqId)
        {
            new AsdaqBl(CoreDbUrl).DeleteAllChangeRequests(asdaqId);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Elimina las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="changeRequests">Lista de id de subVariables a eliminar de la lista SubVariableChangeRequests</param>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteChangeRequests(string asdaqId, ChangeRequestsDto changeRequests)
        {
            new AsdaqBl(CoreDbUrl).DeleteChangeRequests(asdaqId, changeRequests);
            return await Task.FromResult(Ok());
        }
        /// <summary>
        /// Reconfigura un Asdaq
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Reconfigure(Asdaq asdaq)
        {
            new AsdaqBl(CoreDbUrl).Reconfigure(asdaq);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza el Alias y MailAccountConfiguration de un Asdaq
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateAliasAndMailAccountAsdaq(Asdaq asdaq)
        {
            new AsdaqBl(CoreDbUrl).UpdateAliasAndMailAccountAsdaq(asdaq);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza una lista de Aconditioners relacionados a un Asdaq y los parámetros
        /// M y B de los puntos de medición que influyan en cambios de ganancia o desplazamiento que estén relacionados a canales Asdaq
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateAconditionerByAsdaq([FromBody]dynamic model)
        {
            var asdaqId = model.asdaqId.ToObject<string>();
            var aconditioners = model.aconditioners.ToObject<List<Aconditioner>>();
            var mdVariablesToUpdate = model.mdVariablesToUpdate.ToObject<List<MdVariableUpdateMBDto>>();
            new AsdaqBl(CoreDbUrl).UpdateAconditionerByAsdaq(asdaqId,aconditioners,mdVariablesToUpdate);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Elimina un Aconditioner relacionado a un Asdaq por medio del serial y los canales Asdaq que estén relacionados 
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteAconditionerBySerial([FromBody]dynamic model)
        {
            string asdaqId = model.asdaqId.ToObject<string>();
            string serial = model.serial.ToObject<string>();
            var niDevices = model.niDevices.ToObject<List<NiDeviceDto>>();
            new AsdaqBl(CoreDbUrl).DeleteAconditionerBySerial(asdaqId, serial, niDevices);
            return await Task.FromResult(Ok());
        }
    }
}
