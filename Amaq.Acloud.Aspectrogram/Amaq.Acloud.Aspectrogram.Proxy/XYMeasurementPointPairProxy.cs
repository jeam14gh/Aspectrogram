namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Collections.Generic;
    using System.Reflection;
    using Entities;
    using Acloud.Proxy;
    using Entities.ValueObjects;
    using System.Net.Http;
    using Newtonsoft.Json;
    using System.Text;
    using Acloud.Proxy.Models;
    using System;

    /// <summary>
    /// Proxy StatusExtension
    /// </summary>
    public class XYMeasurementPointPairProxy : GenericProxy<XYMeasurementPointPair>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/XYMeasurementPointPair/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public XYMeasurementPointPairProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables pasada como parametro.
        /// </summary>
        /// <param name="assetId">Id del Asset</param>
        /// <returns>Lista de objetos de tipo XYMeasurementPointPair</returns>
        public List<XYMeasurementPointPair> GetXYPairByAssetId(string assetId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(assetId), assetId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<XYMeasurementPointPair>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables para los activos con los id especificados.
        /// </summary>
        /// <param name="assetIdList">Lista de id de asset</param>
        /// <returns></returns>
        public List<XYMeasurementPointPair> GetXYPairByAssetId(List<string> assetIdList)
        {
            string postBody = JsonConvert.SerializeObject(assetIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<List<XYMeasurementPointPair>>(path, Url, _userState, content);
        }

        /// <summary>
        /// Define las diferentes opciones de visualizacion del SCL, como Gaps de referencias,
        /// diametros de clearance y punto de inicio del clearance plot.
        /// </summary>
        /// <param name="sclOpts">Opciones del Shaft Centerline</param>
        /// <param name="xMdVariableId">Id de la MdVariable orientada en X</param>
        /// <param name="yMdVariableId">Id de la MdVariable orientada en Y</param>
        /// <returns></returns>
        public string SetSclOptions(SclOptions sclOpts, string xMdVariableId, string yMdVariableId)
        {
            string postBody = JsonConvert.SerializeObject(new { sclOpts, xMdVariableId, yMdVariableId });
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Elimina todos los pares XY relacionados con un AssetId y guarda una lista de pares XY
        /// </summary>
        public void DeleteAndSaveXYMeasurementPointPair(string assetId, List<XYMeasurementPointPair> pairsXY)
        {
            string postBody = JsonConvert.SerializeObject(pairsXY);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?assetId=" + assetId, Url, _userState, content);
        }
    }
}
