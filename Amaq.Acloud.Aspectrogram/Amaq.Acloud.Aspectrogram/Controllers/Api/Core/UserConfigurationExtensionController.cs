namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Core
{
    using Acloud.Entities.Core;
    using Attributes;
    using Business.Core;
    using Models.Business;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using System.Web;
    using System.Web.Http;
    using WebSite.Controllers.Api;

    /// <summary>
    /// Controlador UserConfiguration
    /// </summary>
    [CustomAuthorize]
    public class UserConfigurationExtensionController : GenericController<UserConfiguration>
    {
        
        //[HttpGet]
        //[Roles("Admin")]
        //public async Task<IHttpActionResult> GetByUserId()
        //{
        //    return await Task.FromResult(Ok(new UserConfigurationBl().GetByUserId()));
        //}

        /// <summary>
        /// 
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateByUser(UserConfiguration userConfiguration)
        {
            new UserConfigurationExtensionBl(CoreDbUrl).UpdateByUser(userConfiguration);
            return await Task.FromResult(Ok());
        }
    }
}