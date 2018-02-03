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
    using System;
    using Acloud.Proxy.Models;

    /// <summary>
    /// Proxy MdVariableExtension
    /// </summary>
    public class MdVariableExtensionProxy : GenericProxy<MdVariableExtension>
    {
        private AppUserState _userState;
        private const string CONTROLLER_NAME = "api/MdVariableExtension/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public MdVariableExtensionProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Obtiene las mdVariable asociadas con cualquiera de los id asset especificados
        /// </summary>
        /// <param name="assetIdList">Lista de id asset</param>
        /// <returns>Lista de objetos de tipo MdVariableExtension</returns>
        public List<MdVariableExtension> GetByAssetId(List<string> assetIdList)
        {
            string postBody = JsonConvert.SerializeObject(assetIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<MdVariableExtension>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene una entidad basado en su Id.
        /// </summary>
        /// <param name="assetId">Id del activo padre</param>
        /// <returns>Listado de MdVariableExtension</returns>
        public List<MdVariableExtension> GetByAssetId(string assetId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(assetId), assetId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<MdVariableExtension>>(path, Url, _userState, parameters);
        }

        public List<MdVariableExtension> GetMeasurementPointsByAsset(string assetId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(assetId), assetId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<MdVariableExtension>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Actualiza la entidad de MdVariableExtension con los parametros definidos como no nulos.
        /// </summary>
        /// <param name="mdVariableExtension"></param>
        /// <returns></returns>
        public MdVariableExtension Update(MdVariableExtension mdVariableExtension)
        {
            string postBody = JsonConvert.SerializeObject(mdVariableExtension);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<MdVariableExtension>(path, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene las subVariables con medidas globales asociadas a cualquiera de los Id de MdVariable especificados.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de MdVariable</param>
        /// <returns>Listado de MeasurementPointDto con la informacion de valores globales</returns>
        public List<MeasurementPointDto> GetOverallMeasure(List<string> mdVariableIdList)
        {
            string postBody = JsonConvert.SerializeObject(mdVariableIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<MeasurementPointDto>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Obtiene las subVariables de tipo AmaqStream asociadas a cualquiera de los Id de MdVariable especificados.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de MdVariable</param>
        /// <returns>Listado de MeasurementPointDto con la informacion de valores globales</returns>
        public List<MeasurementPointDto> GetSignal(List<string> mdVariableIdList)
        {
            string postBody = JsonConvert.SerializeObject(mdVariableIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<MeasurementPointDto>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina una lista de puntos de medición y toda su descendencia (Nodo y SubVariables), mas relación con canales Asdaq o Atr y su par XY
        /// </summary>
        public void DeleteMany(List<MdVariableExtension> mdVariables)
        {
            string postBody = JsonConvert.SerializeObject(mdVariables);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza un punto de medición incluyendo la propiedad ParameterValues
        /// </summary>
        public void UpdateIncludingParameterValues(MdVariableExtension mdVariable)
        {
            string postBody = JsonConvert.SerializeObject(mdVariable);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Retorna el punto de medición anteriormente creado en base de datos
        /// </summary>
        public MdVariableExtension Create(MdVariableExtension mdVariable)
        {
            string postBody = JsonConvert.SerializeObject(mdVariable);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<MdVariableExtension>(path, Url, _userState, content);
        }

        /// <summary>
        /// Retorna una lista de puntos de medición a través de una lista de nodeId
        /// </summary>
        public List<MdVariableExtension> GetByNodeId(List<string> nodeIdList)
        {
            string postBody = JsonConvert.SerializeObject(nodeIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<MdVariableExtension>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina varios puntos de medición y las Subvaribles asociadas a cada punto
        /// </summary>
        public void DeleteManyByIdAndSubVaribles(List<MdVariableExtension> mdVariableList)
        {
            string postBody = JsonConvert.SerializeObject(mdVariableList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Calcula los parametros M y B de cada punto de medición a partir de una lista obtenida en la configuración de canales de un Asdaq
        /// </summary>
        public void CalculateMandB(List<MdVariableUpdateMBDto> mdVariablesDto)
        {
            string postBody = JsonConvert.SerializeObject(mdVariablesDto);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Properties.UrlLocalApi, _userState, content);
        }

        /// <summary>
        /// Actualiza una lista de puntos de acuerdo a la posicion que tenga en el listbox
        /// </summary>
        public void UpdateOrderPositionPoints(List<MdVariableExtension> mdVariables)
        {
            string postBody = JsonConvert.SerializeObject(mdVariables);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza una lista de puntos de medición
        /// </summary>
        public void UpdatePoints(List<MdVariableExtension> points)
        {
            string postBody = JsonConvert.SerializeObject(points);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }
    }
}
