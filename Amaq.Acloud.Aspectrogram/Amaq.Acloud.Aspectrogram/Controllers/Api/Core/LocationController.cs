namespace Amaq.Acloud.Aspectrogram.Controllers.Api
{
    using Acloud.Entities.Core;
    using Attributes;
    using Models.Business;
    using System.Threading.Tasks;
    using System.Web.Http;
    using WebSite.Controllers.Api;

    /// <summary>
    /// Controlador Api Location
    /// </summary>
    [CustomAuthorize]
    public class LocationController : GenericController<Location>
    {
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteByNodeId(string nodeId)
        {
            new LocationBl(CoreDbUrl).DeleteByNodeId(nodeId);
            return await Task.FromResult(Ok());
        }
    }
}