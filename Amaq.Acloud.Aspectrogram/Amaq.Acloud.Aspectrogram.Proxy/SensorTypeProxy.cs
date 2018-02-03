namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Reflection;
    using System.Net.Http;
    using System.Text;
    using Newtonsoft.Json;
    using Entities;
    using Acloud.Proxy;
    using Acloud.Proxy.Models;
    using System;

    /// <summary>
    /// Proxy SensorType
    /// </summary>
    public class SensorTypeProxy : GenericProxy<SensorType>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/SensorType/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public SensorTypeProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        public SensorType Update(SensorType asdaq)
        {
            string postBody = JsonConvert.SerializeObject(asdaq);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<SensorType>(path, Url, _userState, content);
        }
    }
}
