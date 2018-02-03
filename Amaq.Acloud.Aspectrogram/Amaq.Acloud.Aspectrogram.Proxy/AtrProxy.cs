namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Collections.Generic;
    using System.Reflection;
    using System.Net.Http;
    using System.Text;
    using Newtonsoft.Json;
    using Entities;
    using Acloud.Proxy;
    using System;
    using Acloud.Proxy.Models;
    using Entities.ValueObjects;

    /// <summary>
    /// Proxy Atr
    /// </summary>
    public class AtrProxy : GenericProxy<Atr>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/Atr/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public AtrProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="atrId"></param>
        /// <param name="modules"></param>
        public void UpdateModule(string atrId, List<AtrModule> modules)
        {
            string postBody = JsonConvert.SerializeObject(modules);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?atrId=" + atrId, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene que indica si el Atransmitter debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="atrId">Id Atransmitter</param>
        /// <returns></returns>
        public bool ShouldReconfigure(string atrId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(atrId), atrId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<bool>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Obtiene la lista completa de los Atransmitter con el nombre de la mdVariable asociada a un Aichannel y no su Id.
        /// </summary>
        /// <returns></returns>
        public List<Atr> GetAllWithMdVariableTag()
        {            
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<Atr>>(path, Url, _userState, null);
        }

        /// <summary>
        /// Actualiza un Atransmitter
        /// </summary>
        public Atr Update(Atr atr)
        {
            string postBody = JsonConvert.SerializeObject(atr);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return  HttpPost<Atr>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal
        /// </summary>
        public void DeleteRelationshipMdVariableWithAiChannels(string atrId, List<AtrModule> modules)
        {
            string postBody = JsonConvert.SerializeObject(modules);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?atrId=" + atrId, Properties.UrlLocalApi, _userState, content);
        }

        /// <summary>
        /// Actualiza la propiedad Reconfigure de un Atr
        /// </summary>
        public void UpdateReconfigure(Atr atr)
        {
            string postBody = JsonConvert.SerializeObject(atr);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<Atr>(path, Properties.UrlLocalApi, _userState, content);
        }

        /// <summary>
        /// Actualiza el alias y la descripción de un Atransmitter
        /// </summary>
        public void UpdateAliasAndDescription(Atr atr)
        {
            string postBody = JsonConvert.SerializeObject(atr);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<Atr>(path, Properties.UrlLocalApi, _userState, content);
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del atr con el Id especificado
        /// </summary>
        public void ResetReconfigureFlag(string atrId)
        {
            string postBody = JsonConvert.SerializeObject(atrId);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Properties.UrlLocalApi, _userState, content);
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del atr con el id especificado
        /// </summary>
        public List<RealTimeRequest> GetRealTimeRequests(string atrId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(atrId), atrId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<RealTimeRequest>>(path, Properties.UrlLocalApi, _userState, parameters);
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del atr con el id especificado
        /// </summary>
        /// <param name="atrId">Id de atr</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        public void DeleteRealTimeRequests(string atrId, List<string> subVariableIdList)
        {
            string postBody = JsonConvert.SerializeObject(subVariableIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?atrId=" + atrId, Url, _userState, content);
        }
    }
}
