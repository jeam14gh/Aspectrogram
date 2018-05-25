namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Text;
    using System.Reflection;
    using Newtonsoft.Json;
    using Entities;
    using Entities.Dtos;
    using Acloud.Proxy;
    using Acloud.Proxy.Models;
    using System;

    /// <summary>
    /// Proxy SubVariableExtension
    /// </summary>
    public class SubVariableExtensionProxy : GenericProxy<SubVariableExtension>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/SubVariableExtension/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public SubVariableExtensionProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Obtiene las subVariables asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <param name="includeRealTimeData">Indica si se incluyen los datos tiempo real en el resultado(Value y TimeStamp)</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetByMdVariableId(List<string> mdVariableIdList, bool includeRealTimeData = false)
        {
            string postBody = JsonConvert.SerializeObject(mdVariableIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<SubVariableExtension>>(path + "?includeRealTimeData = " + includeRealTimeData, Url, _userState, content);
        }

        public SubVariableExtension Update(SubVariableExtension subVariableExtension)
        {
            string postBody = JsonConvert.SerializeObject(subVariableExtension);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<SubVariableExtension>(path, Url, _userState, content);
        }

        public void UpdateMany(List<SubVariableExtension> subVariableExtensionList)
        {
            string postBody = JsonConvert.SerializeObject(subVariableExtensionList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene datos tiempo real de las subVariables con los id especificados.
        /// </summary>
        /// <param name="realTimeRequestsByAsdaqList">Listado de solicitudes de subVariables tiempo real agrupadas por asdaq</param>
        /// <param name="realTimeRequestsByAtrList">Listado de solicitudes de subVariables tiempo real agrupadas por atr</param>
        /// <returns>Datos tiempo real</returns>
        public List<RealTimeDataItemDto> GetRealTimeData(List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList, List<RealTimeRequestsByAtrDto> realTimeRequestsByAtrList)
        {
            //string postBody = JsonConvert.SerializeObject(realTimeRequestsByAsdaqList);
            string postBody = JsonConvert.SerializeObject(new { realTimeRequestsByAsdaqList,realTimeRequestsByAtrList });
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<RealTimeDataItemDto>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza las subVariables con la información especificada para cada una, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeDataList">Lista de subVariables con los datos a actualizar</param>
        public void UpdateManyRealTimeData(List<RealTimeDataItemDto> realTimeDataList)
        {
            string postBody = JsonConvert.SerializeObject(realTimeDataList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza la subVariable con la información especificada, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeData">SubVariable con los datos a actualizar</param>
        public RealTimeDataItemDto UpdateRealTimeData(RealTimeDataItemDto realTimeData)
        {
            string postBody = JsonConvert.SerializeObject(realTimeData);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<RealTimeDataItemDto>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza una lista de SubVariables
        /// </summary>
        public List<SubVariableExtension> UpdateMany2(List<SubVariableExtension> subVariables)
        {
            string postBody = JsonConvert.SerializeObject(subVariables);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<SubVariableExtension>>(path, Url, _userState, content);
        }

        public string SetCompesation(string mdVariableId, double amplitude, double phase)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(mdVariableId), mdVariableId);
            parameters.Add(nameof(amplitude), amplitude.ToString().Replace(",", "."));
            parameters.Add(nameof(phase), phase.ToString().Replace(",", "."));
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<string>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Elimina una subvariable por medio de su Id
        /// </summary>
        public void DeleteById(string subVariableId)
        {
            StringContent content = new StringContent("", Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?subVariableId=" + subVariableId, Url, _userState, content);
        }

        /// <summary>
        /// Guarda y retorna una lista de Id's de subVariables
        /// </summary>
        public List<string> Create(List<SubVariableExtension> subVariables)
        {
            string postBody = JsonConvert.SerializeObject(subVariables);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<string>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina una lista de subVariables 
        /// </summary>
        public void DeleteMany(List<SubVariableExtension> subVariables)
        {
            string postBody = JsonConvert.SerializeObject(subVariables);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }
    }
}
