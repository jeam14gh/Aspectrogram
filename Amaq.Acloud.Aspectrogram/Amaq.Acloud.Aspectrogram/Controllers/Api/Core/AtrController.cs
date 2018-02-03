namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using System.Web.Http;
    using System.Collections.Generic;
    using Entities;
    using Aspectrogram.Models.Business;
    using Aspectrogram.Controllers.Api.Attributes;

    /// <summary>
    /// Controlador Atransmitter
    /// </summary>
    [CustomAuthorize]
    public class AtrController : GenericController<Atr>
    {
        /// <summary>
        /// Obtiene que indica si el Atransmitter debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="atrId">Id Atransmitter</param>
        /// <returns></returns>
        [HttpGet]
        [Roles("Admin")]
        public IHttpActionResult ShouldReconfigure(string atrId)
        {
            return Ok(new AtrBl(CoreDbUrl).ShouldReconfigure(atrId));
        }

        /// <summary>
        /// Obtiene los cambios hechos en cada uno de sus modulos y canales de la A-transmitter seleccionada
        /// </summary>
        /// <param name="atrId">Id Atransmitter</param>
        /// <param name="modules">Lista de modulos</param>
        /// <returns></returns>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult UpdateModule(string atrId, [FromBody] List<AtrModule> modules)
        {            
            new AtrBl(CoreDbUrl).UpdateModule(atrId,modules);
            return Ok();
        }

        /// <summary>
        /// Obtiebe todos los Atr con el nombre de la MdVariable asociada con un canal.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public IHttpActionResult GetAllWithMdVariableTag()
        {
            return Ok(new AtrBl(CoreDbUrl).GetAllWithMdVariableTag());
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult DeleteRelationshipMdVariableWithAiChannels(string atrId, List<AtrModule> modules)
        {
            new AtrBl(CoreDbUrl).DeleteRelationshipMdVariableWithAiChannels(atrId, modules);
            return Ok();
        }

        /// <summary>
        /// Actualiza la propiedad Reconfigure de un Atr
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult UpdateReconfigure(Atr atr)
        {
            new AtrBl(CoreDbUrl).UpdateReconfigure(atr);
            return Ok();
        }

        /// <summary>
        /// Actualiza el alias y la descripción de un Atransmitter
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult UpdateAliasAndDescription(Atr atr)
        {
            new AtrBl(CoreDbUrl).UpdateAliasAndDescription(atr);
            return Ok();
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del atr con el Id especificado
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult ResetReconfigureFlag([FromBody]string atrId)
        {
            new AtrBl(CoreDbUrl).ResetReconfigureFlag(atrId);
            return Ok();
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del atr con el id especificado
        /// </summary>
        [HttpGet]
        public IHttpActionResult GetRealTimeRequests(string atrId)
        {
            return Ok(new AtrBl(CoreDbUrl).GetRealTimeRequests(atrId));
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del atr con el id especificado
        /// </summary>
        /// <param name="atrId">Id de atr</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult DeleteRealTimeRequests(string atrId, List<string> subVariableIdList)
        {
            new AtrBl(CoreDbUrl).DeleteRealTimeRequests(atrId, subVariableIdList);
            return Ok();
        }
    }
}
