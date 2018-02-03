namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Collections.Generic;
    using System.Reflection;
    using Entities;
    using Acloud.Proxy;
    using Acloud.Proxy.Models;
    using System;

    /// <summary>
    /// Proxy StatusExtension
    /// </summary>
    public class StatusExtensionProxy : GenericProxy<StatusExtension>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/StatusExtension/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public StatusExtensionProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Obtiene el conjunto de estados del Corp riesgo
        /// </summary>
        /// <returns>Lista de objetos de tipo StatusExtension</returns>
        public List<StatusExtension> GetSetOfRiskStates()
        {
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<StatusExtension>>(path, Url, _userState);
        }
    }
}
