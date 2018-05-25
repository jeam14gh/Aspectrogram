using Amaq.Acloud.Entities.Core;
using Amaq.Acloud.Proxy;
using Amaq.Acloud.Proxy.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Proxy
{
    public class UserConfigurationExtensionProxy: GenericProxy<UserConfiguration>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/UserConfigurationExtension/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public UserConfigurationExtensionProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        //public UserConfiguration GetByUserId()
        //{
        //    string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
        //    return HttpGet<UserConfiguration>(path, Url, _userState);
        //}

        /// <summary>
        /// Actualiza el UserConfiguration de una base datos
        /// </summary>
        public void UpdateByUser(UserConfiguration userConfiguration)
        {
            string postBody = JsonConvert.SerializeObject(userConfiguration);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }
    }
}
