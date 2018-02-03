namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Text;
    using System.Reflection;
    using Entities;
    using Acloud.Proxy;
    using System;
    using Entities.Dtos;
    using Acloud.Proxy.Models;
    using Newtonsoft.Json;

    /// <summary>
    /// Proxy AssetExtension
    /// </summary>
    public class AssetExtensionProxy : GenericProxy<AssetExtension>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/AssetExtension/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public AssetExtensionProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Obtiene los asset con el asdaqId especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns>Lista de objetos de tipo AssetExtension</returns>
        public List<AssetExtension> GetByAsdaq(string asdaqId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(asdaqId), asdaqId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<AssetExtension>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Obtiene el Id del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo</param>
        /// <returns></returns>
        public string GetAssetIdByNode(string nodeId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(nodeId), nodeId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<string>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Obtiene el id y el asdaqId del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id de nodo</param>
        /// <returns></returns>
        public List<AssetIdAndAsdaqIdDto> GetIdAndAsdaqIdByNode(string nodeId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(nodeId), nodeId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<AssetIdAndAsdaqIdDto>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Elimina un Asset por medio de su NodeId
        /// </summary>
        public void DeleteByNodeId(string nodeId)
        {
            StringContent content = new StringContent("", Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?nodeId=" + nodeId, Url, _userState,content);
        }

        /// <summary>
        /// Actualiza nombre, descripción e intervalo noraml de un activo
        /// </summary>
        public void UpdateNameAndDescription(AssetToUpdateDto asset)
        {
            string postBody = JsonConvert.SerializeObject(asset);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Clona un asset y toda su descendencia, tanto sus hijos y puntos de medicion pertenecientes a éstos
        /// </summary>
        /// <returns>Una lista de asset's y los hijos de éste</returns>
        public AssetExtension Clone(AssetExtension asset)
        {
            string postBody = JsonConvert.SerializeObject(asset);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<AssetExtension>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina varios activos por medio de una lista de NodeId
        /// </summary>
        public void DeleteManyByNodeId(List<string> nodeIdList)
        {
            string postBody = JsonConvert.SerializeObject(nodeIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad EventVelocity de un activo principal
        /// </summary>
        public void SaveEventVelocity(AssetExtension asset)
        {
            string postBody = JsonConvert.SerializeObject(asset);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad ConditionStatusEventsConfig de un activo principal
        /// </summary>
        public void SaveConditionStatusEventsConfig(AssetExtension asset)
        {
            string postBody = JsonConvert.SerializeObject(asset);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Retorna todos los activos principales a partir del nodeId de una ubicación
        /// </summary>
        public List<AssetExtension> GetAssetsByLocationNodeId(string nodeId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(nodeId), nodeId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<AssetExtension>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Retorna una lista de activos a partir de una lista de nodeId
        /// </summary>
        public List<AssetExtension> GetByNodeId( List<string> nodeIdList)
        {
            string postBody = JsonConvert.SerializeObject(nodeIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<AssetExtension>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza la fecha del último evento generado para el estado de condición y el activo especificado
        /// </summary>
        /// <param name="lastSavedEventDto">Objeto que especifica el activo, el estado de condición y la estampa de tiempo del último evento generado</param>
        public void UpdateLastSavedEvent(LastSavedEventDto lastSavedEventDto)
        {
            string postBody = JsonConvert.SerializeObject(lastSavedEventDto);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        public void UpdateMany(List<AssetExtension> assets)
        {            
            string postBody = JsonConvert.SerializeObject(assets);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }
    }
}
