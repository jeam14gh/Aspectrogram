namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Text;
    using System.Reflection;
    using Newtonsoft.Json;
    using Entities;
    using Acloud.Proxy;
    using Entities.Dtos;
    using Entities.ValueObjects;
    using System;
    using Acloud.Proxy.Models;

    /// <summary>
    /// Proxy RecordedEvent
    /// </summary>
    public class RecordedEventProxy : GenericProxy<AssetExtension>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/RecordedEvent/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public RecordedEventProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Registra un nuevo evento en el servidor
        /// </summary>
        /// <param name="recordedEventDto">Objeto con los datos necesarios para el registro del evento</param>
        /// <returns>Id del evento en el servidor o una cadena vacía si ocurre algún error</returns>
        public string Add(NewRecordedEventDto recordedEventDto)
        {
            string postBody = JsonConvert.SerializeObject(recordedEventDto);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Registra un nuevo paquete de evento en el servidor
        /// </summary>
        /// <param name="newEventPackageDto">Objeto con la información necesaria para registrar un paquete de evento en el servidor</param>
        /// <returns>Valor lógico que indica si el paquete fue guardado correctamente o no</returns>
        public bool AddPackage(NewEventPackageDto newEventPackageDto)
        {
            //string postBody = JsonConvert.SerializeObject(newEventPackageDto);
            //StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<bool>(path, Url, _userState, newEventPackageDto);
        }

        /// <summary>
        /// Obtiene el listado de eventos segun el Id del activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        public AssetInfo GetEventHeader(string eventId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(eventId), eventId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<AssetInfo>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Obtiene el listado de eventos segun el Id del activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        public List<RecordedEvent> GetByAssetId(string assetId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(assetId), assetId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<List<RecordedEvent>>(path, Url, _userState, parameters);
        }

        /// <summary>
        /// Obtiene tanto el paquete de globales como el de formas de onda segun los Ids especificados
        /// </summary>
        /// <param name="overallPackageId">Id del paquete de valores globales a obtener</param>
        /// <param name="waveformPackageId">Id del paquete de formas de onda a obtener</param>
        /// <returns></returns>
        public SingleEventPackageDto GetPackages(string overallPackageId, string waveformPackageId)
        {
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add(nameof(overallPackageId), overallPackageId);
            parameters.Add(nameof(waveformPackageId), waveformPackageId);
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpGet<SingleEventPackageDto>(path, Url, _userState, parameters);
        }
    }
}
