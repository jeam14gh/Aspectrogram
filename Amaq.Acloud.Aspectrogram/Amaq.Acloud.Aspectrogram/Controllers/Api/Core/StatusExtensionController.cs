namespace Amaq.Acloud.Aspectrogram.Controllers.Api
{
    using System.Web.Http;
    using Models.Business;
    using WebSite.Controllers.Api;
    using Entities;
    using Attributes;
    using System.Threading.Tasks;

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
        public async Task<IHttpActionResult> GetSetOfRiskStates()
        {
            return await Task.FromResult(Ok(new StatusExtensionBl(CoreDbUrl).GetSetOfRiskStates()));
        }
    }
}
