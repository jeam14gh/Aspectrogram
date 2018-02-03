namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using Entities.Dtos;
    using Acloud.Entities.Core;
    using Acloud.Proxy;
    using Newtonsoft.Json;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Reflection;
    using System.Text;
    using System;
    using Acloud.Proxy.Models;
    using Entities;

    public class NodeExtensionProxy : GenericProxy<Node>
    {
        private AppUserState _userState = null;
        private const string CONTROLLER_NAME = "api/Node/";

        /// <summary>
        /// Inicializa el Proxy generico.
        /// </summary>
        /// <param name="userState">Informacion del usuario</param>
        /// <param name="isToHMI">Valor lógico que indica si el proxy se va a conectar a una instancia de Acloud local en un Asdaq la cual actua como Human Machine Interface</param>
        public NodeExtensionProxy(AppUserState userState, bool isToHMI = false) :
            base(userState, (isToHMI) ? Properties.UrlLocalApiForHMI : Properties.UrlLocalApi)
        {
            if (string.IsNullOrEmpty(userState.AccessToken))
            {
                throw new ArgumentException("El token usado no puede ser un valor nulo.", "accesstoken");
            }
            _userState = userState;
        }

        /// <summary>
        /// Elimina un Node por medio de su Id
        /// </summary>
        public void DeleteById(string id)
        {
            StringContent content = new StringContent("", Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path + "?id=" + id, Url, _userState, content);
        }

        /// <summary>
        /// Elimina varios nodes
        /// </summary>
        public void DeleteMany(List<NodeToDeleteDto> nodes)
        {
            string postBody = JsonConvert.SerializeObject(nodes);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Retorna un nuevo Id a partir de un nodo copiado
        /// </summary>
        public string ToCopyNode(Node node)
        {
            string postBody = JsonConvert.SerializeObject(node);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza los estados de los nodos tipo MdVariable especificados
        /// </summary>
        /// <param name="mdVariableNodeStatusDtoList">Lista de nodos tipo MdVariable con el nuevo estado</param>
        public void UpdateManyMdVariableStatus(List<MdVariableNodeStatusDto> mdVariableNodeStatusDtoList)
        {
            string postBody = JsonConvert.SerializeObject(mdVariableNodeStatusDtoList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza el nombre y la descripción de un node
        /// </summary>
        public void UpdateNameAndDescription(NodeToUpdateDto nodeDto)
        {
            string postBody = JsonConvert.SerializeObject(nodeDto);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Retorna el node anteriormente creado en base de datos 
        /// </summary>
        public Node Create(Node node)
        {
            string postBody = JsonConvert.SerializeObject(node);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<Node>(path, Url, _userState, content);
        }

        /// <summary>
        /// Copia y pega toda la descendencia de un Activo apartir del nodo relacionado a éste.   
        /// </summary>
        /// <returns>Un listado de nodos, activos, puntos de medicion y subvariables</returns>
        public NodeAssetMdVarAndSubVarDto Paste(Node node, bool isPrincipal, string pplAssetId, List<XYMeasurementPointPair> pairsXY)
        {
            string postBody = JsonConvert.SerializeObject(new { node, isPrincipal, pplAssetId, pairsXY });
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<NodeAssetMdVarAndSubVarDto>(path, Properties.UrlLocalApi, _userState, content);
        }

        /// <summary>
        /// Elimina varios nodos por medio de una lista de Id
        /// </summary>
        public void Delete_Many(List<string> nodeIdList)
        {
            string postBody = JsonConvert.SerializeObject(nodeIdList);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary> 
        /// Copia un punto de medición,su nodo asociado e incluye las subVariables si éste tiene.
        /// </summary>
        /// <returns>Nodo, punto de medición y subVariables</returns>
        public NodeAndMdVariableDto CopyNode(NodeAndMdVariableDto nodeAndMdVariableDto)
        {
            string postBody = JsonConvert.SerializeObject(nodeAndMdVariableDto);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            return HttpPost<NodeAndMdVariableDto>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza la propiedad HasChild de un nodo
        /// </summary>
        public void UpdateHasChild(string id, bool hasChild)
        {
            string postBody = JsonConvert.SerializeObject(new { id, hasChild });
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }

        /// <summary>
        /// Actualiza el nombre de un nodo
        /// </summary>
        public void UpdateName(NodeToUpdateDto node)
        {
            string postBody = JsonConvert.SerializeObject(node);
            StringContent content = new StringContent(postBody, Encoding.UTF8, "application/json");
            string path = string.Format("{0}{1}", CONTROLLER_NAME, MethodBase.GetCurrentMethod().Name);
            HttpPost<string>(path, Url, _userState, content);
        }
    }
}
