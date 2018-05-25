namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using Entities;
    using Acloud.Proxy;
    using Acloud.Proxy.Models;
    using System;

    public class BearingFaultFrequencyProxy : GenericProxy<BearingFaultFrequency>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/BearingFaultFrequency/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public BearingFaultFrequencyProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }
    }
}
