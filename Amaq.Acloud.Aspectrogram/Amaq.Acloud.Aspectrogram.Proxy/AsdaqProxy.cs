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
    using Entities.Dtos;
    using Entities.ValueObjects;
    using Acloud.Proxy.Models;

    /// <summary>
    /// Proxy Asdaq
    /// </summary>
    public class AsdaqProxy : GenericProxy<Asdaq>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/Asdaq/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public AsdaqProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Obtiene que indica si el Asdaq debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        /// <returns></returns>
        public bool ShouldReconfigure(string asdaqId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(asdaqId), asdaqId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<bool>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del asdaq con el Id especificado
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        public void ResetReconfigureFlag(string asdaqId)
        {
            string postBody = JsonConvert.SerializeObject(asdaqId);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza el Alias y MailAccountConfiguration de un Asdaq
        /// </summary>
        public void UpdateAliasAndMailAccountAsdaq(Asdaq asdaq)
        {
            string postBody = JsonConvert.SerializeObject(asdaq);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Reconfigura un asdaq
        /// </summary>
        public void Reconfigure(Asdaq asdaq)
        {
            string postBody = JsonConvert.SerializeObject(asdaq);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene toda la coleccion Asdaq con el nombre de la mdVariable asociada a un Aichannel y no su MdVariableId.
        /// </summary>
        /// <returns></returns>
        public List<AsdaqConfigDto> GetAllWithMdVariableTag()
        {
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<AsdaqConfigDto>>(path, Url, _userState,null);
        }

        /// <summary>
        /// Actualiza todos los dispositivos de adquisición (NiDevices y NiCompactDaqs) asociados a un Asdaq con su respectivo Id
        /// </summary>        
        public List<MdVariableExtension> UpdateDevice(string asdaqId, List<NiDeviceDto> devices)
        {
            string postBody = JsonConvert.SerializeObject(devices);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);            
            return HttpPost<List<MdVariableExtension>>(path + "?asdaqId=" + asdaqId, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        public List<RealTimeRequest> GetRealTimeRequests(string asdaqId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(asdaqId), asdaqId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<RealTimeRequest>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Actualiza las solicitudes tiempo real de los asdaq especificados
        /// </summary>
        /// <param name="realTimeRequestsByAsdaqList">Lista de solicitudes tiempo por asdaq</param>
        public void UpdateRealTimeRequests(List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList)
        {
            string postBody = JsonConvert.SerializeObject(realTimeRequestsByAsdaqList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        public void DeleteRealTimeRequests(string asdaqId, List<string> subVariableIdList)
        {
            string postBody = JsonConvert.SerializeObject(subVariableIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?asdaqId=" + asdaqId, Url, _userState, content);
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal
        /// </summary>
        public void DeleteRelationshipMdVariableWithAiChannels(string asdaqId, NiDeviceDto device)
        {
            string postBody = JsonConvert.SerializeObject(device);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?asdaqId=" + asdaqId, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        public ChangeRequestsDto GetChangeRequests(string asdaqId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(asdaqId), asdaqId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<ChangeRequestsDto>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Actualiza las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="changeRequests">Objeto con las solicitudes de cambio de subVariables y assets</param>
        public void UpdateChangeRequests(string asdaqId, ChangeRequestsDto changeRequests)
        {
            string postBody = JsonConvert.SerializeObject(changeRequests);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?asdaqId=" + asdaqId, Url, _userState, content);
        }

        /// <summary>
        /// Elimina todas las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        public void DeleteAllChangeRequests(string asdaqId)
        {
            StringContent content = new StringContent("", Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?asdaqId=" + asdaqId, Url, _userState, content);
        }

        /// <summary>
        /// Elimina las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="changeRequests">Lista de id de subVariables a eliminar de la lista SubVariableChangeRequests</param>
        public void DeleteChangeRequests(string asdaqId, ChangeRequestsDto changeRequests)
        {
            string postBody = JsonConvert.SerializeObject(changeRequests);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?asdaqId=" + asdaqId, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza una lista de Aconditioners relacionados a un Asdaq y los parámetros
        /// M y B de los puntos de medición que influyan en cambios de ganancia o desplazamiento que estén relacionados a canales Asdaq
        /// </summary>
        public List<MdVariableExtension> UpdateAconditionerByAsdaq(string asdaqId, List<Aconditioner> aconditioners, List<MdVariableUpdateMBDto> mdVariablesToUpdate)
        {
            string postBody = JsonConvert.SerializeObject(new { asdaqId, aconditioners, mdVariablesToUpdate });
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<MdVariableExtension>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina un Aconditioner relacionado a un Asdaq por medio del serial y los canales Asdaq que estén relacionados 
        /// </summary>
        public List<MdVariableExtension> DeleteAconditionerBySerial(string asdaqId, string serial, List<NiDeviceDto> niDevices)
        {
            string postBody = JsonConvert.SerializeObject(new { asdaqId, serial, niDevices });
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<MdVariableExtension>>(path, Url, _userState, content);
        }
    }
}
