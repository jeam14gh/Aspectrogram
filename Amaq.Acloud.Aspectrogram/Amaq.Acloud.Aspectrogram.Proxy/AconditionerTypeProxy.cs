using Amaq.Acloud.Aspectrogram.Entities;
using Amaq.Acloud.Proxy;
using Amaq.Acloud.Proxy.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Proxy
{
    public class AconditionerTypeProxy : GenericProxy<AconditionerType>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/AconditionerType/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        public AconditionerTypeProxy(AppUserState userState) : base(userState, Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }
    }
}
