namespace Amaq.Acloud.Aspectrogram.Controllers.Api
{
    using System.Web.Http;
    using Models.Business;
    using WebSite.Controllers.Api;
    using Entities;
    using Attributes;

    /// <summary>
    /// Controlador Api StatusExtension
    /// </summary>
    [CustomAuthorize]
    public class StatusExtensionController : GenericController<StatusExtension>
    {
        /// <summary>
        /// Obtiene el conjunto de estados del Corp riesgo
        /// </summary>
        /// <returns>Lista de objetos de tipo StatusExtension</returns>
        [HttpGet]
        public IHttpActionResult GetSetOfRiskStates()
        {
            return Ok(new StatusExtensionBl(CoreDbUrl).GetSetOfRiskStates());
        }
    }
}
