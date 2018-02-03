namespace Amaq.Acloud.Aspectrogram
{
    using Acloud.Proxy.Models;
    using CrossCutting.Helpers;
    using System.Collections.Generic;
    using System.Configuration;
    using System.Linq;
    using System.Security.Claims;
    using System.Threading;

    /// <summary>
    /// Propiedades generales del sistema
    /// </summary>
    public static class Properties
    {
        /// <summary>
        /// Url servidor mongo
        /// </summary>
        public static string MongoUrlBase
        {
            get
            {
                // Realizamos el decriptado de la informacion de conexion en el Web.Config
                var keyPhrase = "amaqAcloud2016";
                var strToDecode = ConfigurationManager.AppSettings["MongoUrlBase"].ToString();
                return AesEnDecryption.DecryptWithPassword(strToDecode, keyPhrase);
            }
        }
        
        /// <summary>
        /// Informacion de la identidad del usuario en el servicio Web API
        /// </summary>
        public static AppUserState AppUserState
        {
            get
            {
                var current = Thread.CurrentPrincipal.Identity;
                var tmp = (current as ClaimsIdentity).FindFirst("accessToken");
                string token = (tmp != null) ? tmp.Value : null;
                tmp = (current as ClaimsIdentity).FindFirst("dbName");
                string dbName = (tmp != null) ? tmp.Value : null;
                List<string> roles = new List<string>();
                if (token != null)
                {
                    tmp = (current as ClaimsIdentity).FindFirst("roles");
                    roles = (tmp != null)? tmp.Value.Split(',').ToList() : roles;
                }
                string userId = (current as ClaimsIdentity).FindFirst(ClaimTypes.NameIdentifier).Value;
                return new AppUserState()
                {
                    AccessToken = token,
                    DbName = dbName,
                    Roles = roles,
                    UserId = userId
            };
            }
        }
    }
}
