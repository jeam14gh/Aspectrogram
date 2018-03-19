namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers
{
    using System;
    using System.Web.Mvc;
    using Newtonsoft.Json;
    using System.Collections.Generic;
    using Proxy;
    using Acloud.Proxy.Core;
    using Entities.Dtos;
    using Entities;
    using Aspectrogram.Models;
    using System.Linq;
    using Acloud.Entities.Core;
    using System.Web.SessionState;
    using System.Threading.Tasks;
    using System.IO;
    using System.Net;
    using Acloud.Proxy.Administration;
    using Entities.ValueObjects;
    using Acloud.Entities.Dtos;

    /// <summary>
    /// Controlador base del sistema
    /// </summary>
    [Authorize]
    [SessionState(SessionStateBehavior.ReadOnly)]
    public class HomeController : Controller
    {
        /// <summary>
        /// Vista por defecto del sistema Aspectrogram
        /// </summary>
        /// <returns></returns>

        public ActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Vista para mostrar los reportes
        /// </summary>
        /// <returns></returns>
        public ActionResult Editor3d(string selectedId)
        {
            ViewBag.selectedId = selectedId;
            return View();
        }

        /// <summary>
        /// Obtiene datos de formas de onda en tiempo real para los Id de MdVariable especificados.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de MdVariable</param>
        /// <returns>Datos de formas de onda en tiempo real</returns>
        [HttpPost]
        public async Task<JsonResult> GetSignalRealTime(List<string> mdVariableIdList)
        {
            if (mdVariableIdList != null)
            {
                var signalData = new MdVariableExtensionProxy(Properties.AppUserState).GetSignal(mdVariableIdList);

                return await Task.FromResult(new JsonResult
                {
                    Data = JsonConvert.SerializeObject(signalData),
                    ContentType = "application/json",
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                    MaxJsonLength = int.MaxValue
                });
            }
            return await Task.FromResult(Json("[]", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene la lista de nodos concernientes al usuario.
        /// </summary>
        /// <returns>Listado de nodos</returns>
        [HttpGet]
        public async Task<JsonResult> GetNodes()
        {
            return await Task.FromResult(Json(new NodeProxy(Properties.AppUserState).GetConcerningTree(), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene el listado de MdVariables de un activo especifico
        /// </summary>
        /// <param name="nodeId">Id del nodo correspondiente al activo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetMdVariableExtension(string nodeId)
        {
            var asset = new AssetProxy(Properties.AppUserState).FindByNodeId(nodeId);
            if (asset.Equals(null))
            {
                return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
            }
            return await Task.FromResult(Json(new MdVariableExtensionProxy(Properties.AppUserState).GetByAssetId(asset.Id), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene los measurement points con sus respectivas subVariables del asset con el Id especificado
        /// </summary>
        /// <param name="assetId">Id nodo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetMeasurementPointsByAsset(string assetId)
        {
            var measurementPoints = new MdVariableExtensionProxy(Properties.AppUserState).GetMeasurementPointsByAsset(assetId);
            return await Task.FromResult(Json(measurementPoints, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene los measurement points con sus respectivas subVariables del asset con el Id especificado
        /// </summary>
        /// <param name="assetIdList">Listado de Ids de activo</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> GetMeasurementPointsByAssetList(List<string> assetIdList)
        {
            List<MdVariableExtension> measurementPoints = new List<MdVariableExtension>();
            for (int i = 0; i < assetIdList.Count; i++)
            {
                measurementPoints.AddRange(new MdVariableExtensionProxy(Properties.AppUserState).GetMeasurementPointsByAsset(assetIdList[i]));
            }
            return await Task.FromResult(Json(measurementPoints, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene el id y el asdaqId del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id de nodo</param>
        [HttpGet]
        public async Task<JsonResult> GetAssetIdAndAsdaqId(string nodeId)
        {
            var result = new AssetExtensionProxy(Properties.AppUserState).GetIdAndAsdaqIdByNode(nodeId);
            if (result != null)
            {
                return await Task.FromResult(Json(result, JsonRequestBehavior.AllowGet));
            }

            return await Task.FromResult(Json("[]", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene el conjunto de estados del Corp riesgo
        /// </summary>
        /// <returns>Lista de objetos de tipo StatusExtension</returns>
        [HttpGet]
        public async Task<JsonResult> GetSetOfRiskStates()
        {
            return await Task.FromResult(Json(new StatusExtensionProxy(Properties.AppUserState).GetSetOfRiskStates(), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene datos tiempo real de las subVariables con los id especificados.
        /// </summary>
        /// <param name="realTimeRequestsByAsdaqList">Listado de solicitudes de subVariables tiempo real agrupadas por asdaq</param>
        /// <param name="realTimeRequestsByAtrList">Listado de solicitudes de subVariables tiempo real agrupadas por atr</param>
        /// <returns>Datos tiempo real</returns>
        [HttpPost]
        public async Task<JsonResult> GetRealTimeData(/*List<string> subVariableIdList*/List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList, List<RealTimeRequestsByAtrDto> realTimeRequestsByAtrList)
        {
            //if (subVariableIdList != null)
            //{
            //    var realTimeData = new SubVariableExtensionProxy(Properties.BearerAccessToken).GetRealTimeData(subVariableIdList);

            //    return new JsonResult
            //    {
            //        Data = JsonConvert.SerializeObject(realTimeData),
            //        ContentType = "application/json",
            //        JsonRequestBehavior = JsonRequestBehavior.AllowGet,
            //        MaxJsonLength = int.MaxValue
            //    };
            //}

            if (realTimeRequestsByAsdaqList != null || realTimeRequestsByAtrList != null)
            {
                var realTimeData = new SubVariableExtensionProxy(Properties.AppUserState).GetRealTimeData(realTimeRequestsByAsdaqList, realTimeRequestsByAtrList);

                return await Task.FromResult(new JsonResult
                {
                    Data = JsonConvert.SerializeObject(realTimeData),
                    ContentType = "application/json",
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                    MaxJsonLength = int.MaxValue
                });
            }

            return await Task.FromResult(Json("[]", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene todos los tipos de sensor registrados en el sistema Aspectrogram
        /// </summary>
        /// <returns>Lista de objetos de tipo SensorType</returns>
        [HttpGet]
        public async Task<JsonResult> GetAllSensorTypes()
        {
            return await Task.FromResult(Json(new SensorTypeProxy(Properties.AppUserState).GetAll(), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Elimina un Asset por medio de su NodeId
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> DeleteAssetByNodeId(string nodeId)
        {
            new AssetExtensionProxy(Properties.AppUserState).DeleteByNodeId(nodeId);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Elimina los nodos del árbol con los id especificados
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> DeleteMany(List<NodeToDeleteDto> nodes, string nodeId)
        {
            new NodeExtensionProxy(Properties.AppUserState).DeleteMany(nodes);

            if (!string.IsNullOrEmpty(nodeId))
                new NodeExtensionProxy(Properties.AppUserState).UpdateHasChild(nodeId, false);

            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtine una lista de nodos con su parentId y StatusId
        /// </summary>
        /// <param name="mdVariableIdList"></param>
        /// <param name="principalAssetNodeIdList"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> GetStatusById(List<string> mdVariableIdList, List<string> principalAssetNodeIdList)
        {
            List<StatusAndParentIdDto> statusByMdVariable = null;
            List<Node> rTPropertiesByPrincipalAssetNode = null;

            if ((mdVariableIdList != null) && (mdVariableIdList.Count > 0))
            {
                statusByMdVariable = new NodeProxy(Properties.AppUserState).GetStatusById(mdVariableIdList);
            }

            if ((principalAssetNodeIdList != null) && (principalAssetNodeIdList.Count > 0))
            {
                rTPropertiesByPrincipalAssetNode = 
                    new NodeProxy(Properties.AppUserState).GetRTPropertiesByPrincipalAssetNode(principalAssetNodeIdList);
            }
            return await Task.FromResult(new JsonResult
            {
                Data = JsonConvert.SerializeObject(new { StatusByMdVariable = statusByMdVariable, RTPropertiesByPrincipalAssetNode = rTPropertiesByPrincipalAssetNode }),
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                MaxJsonLength = int.MaxValue
            });
        }

        /// <summary>
        /// Retorna una MdVariable por medio de su id
        /// </summary>
        [HttpGet]
        public async Task<JsonResult> GetMdVariableById(string id)
        {
            return await Task.FromResult(Json(new MdVariableExtensionProxy(Properties.AppUserState).GetById(id), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Retorna un node por medio de su id
        /// </summary>
        [HttpGet]
        public async Task<JsonResult> GetNodeById(string id)
        {
            JsonResult result = null;

            if (string.IsNullOrEmpty(id))            
                return await Task.FromResult(result);
            else
                return await Task.FromResult(Json(new NodeExtensionProxy(Properties.AppUserState).GetById(id), JsonRequestBehavior.AllowGet));
        }

        /// <summary> 
        /// Copia un punto de medición,su nodo asociado e incluye las subVariables si éste tiene.
        /// </summary>
        /// <returns>Nodo, punto de medición y subVariables</returns>
        [HttpPost]
        public async Task<JsonResult> CopyNodeAndMdVariable(NodeAndMdVariableDto nodeAndMdVariableDto)
        {
            var dtoData = new NodeExtensionProxy(Properties.AppUserState).CopyNode(nodeAndMdVariableDto);
            return await Task.FromResult(Json(dtoData, JsonRequestBehavior.AllowGet));
        }

        ///// <summary>
        ///// Obtiene los datos numericos historicos de la lista de MdVariables especificadas y segun el rango de fechas.
        ///// </summary>
        ///// <param name="mdVariableIdList">Listado de Ids de mdVariable a consultar</param>
        ///// <param name="startDate">Fecha de inicio desde el cual se desea filtrar el historico</param>
        ///// <param name="endDate">Fecha de fin hasta la cual se desea filtrar el historico</param>
        ///// <param name="limit">Limite de valores a consultar en la base de datos</param>
        ///// <param name="skip">Cursor de partida para la consulta de datos en la DB</param>
        ///// <returns>Datos numericos historicos de la lista de MdVariables especificada en un rango de tiempo</returns>
        //[HttpPost]
        //public JsonResult GetNumericHistoricalData(List<string> mdVariableIdList, string startDate, string endDate, int limit, string skip)
        //{
        //    DateTime sDate = DateTime.Parse(startDate).ToUniversalTime();
        //    DateTime eDate = DateTime.Parse(endDate).ToUniversalTime();
        //    List<Acloud.Entities.Enums.ValueType> valueTypes = new List<Acloud.Entities.Enums.ValueType> { Acloud.Entities.Enums.ValueType.Numeric };
        //    List<int> arrayWaterfall = new List<int>();
        //    var data = new HistoricalDataProxy(Properties.AppUserState).GetHistoricalData(mdVariableIdList, valueTypes, sDate, eDate, limit, skip, arrayWaterfall);

        //    return new JsonResult
        //    {
        //        Data = JsonConvert.SerializeObject(data),
        //        ContentType = "application/json",
        //        JsonRequestBehavior = JsonRequestBehavior.AllowGet,
        //        MaxJsonLength = int.MaxValue
        //    };
        //}

        /// <summary>
        /// Obtiene los datos numericos historicos de la lista de MdVariables especificadas y segun una lista de fechas.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de los puntos de medicion</param>
        /// <param name="startDate">Fecha de inicio desde el cual se desea filtrar el historico</param>
        /// <param name="endDate">Fecha fin hasta la cual se desea filtrar el historico</param>
        /// <param name="limit">Limite de valores a consultar en la base de datos</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> GetNumericHistoricalData(List<string> mdVariableIdList, string startDate, string endDate, int limit)
        {
            DateTime sDate = DateTime.Parse(startDate).ToUniversalTime();
            DateTime eDate = DateTime.Parse(endDate).ToUniversalTime();
            List<Acloud.Entities.Enums.ValueType> valueTypes = new List<Acloud.Entities.Enums.ValueType> { Acloud.Entities.Enums.ValueType.Numeric };
            var data = new HistoricalDataProxy(Properties.AppUserState).GetHistoricalDataRange(mdVariableIdList, valueTypes, sDate, eDate, limit);

            return await Task.FromResult(new JsonResult
            {
                Data = JsonConvert.SerializeObject(data),
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                MaxJsonLength = int.MaxValue
            });
        }

        /// <summary>
        /// Cuenta la cantidad de datos numericos historicos de la lista de MdVariables especificadas y segun el rango de fechas.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de mdVariable a consultar</param>
        /// <param name="startDate">Fecha de inicio desde el cual se desea filtrar el historico</param>
        /// <param name="endDate">Fecha de fin hasta la cual se desea filtrar el historico</param>
        /// <returns>Cantidad de datos que coinciden con la consulta</returns>
        [HttpGet]
        public async Task<JsonResult> CountNumericHistoricalData(List<string> mdVariableIdList, string startDate, string endDate)
        {
            var count = new HistoricalDataProxy(Properties.AppUserState).CountNumericHistoricalData(mdVariableIdList, startDate, endDate);
            return await Task.FromResult(Json(count, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene las diferentes estampas de tiempo por principalAssetId
        /// </summary>
        /// <param name="principalAssetId">Id del activo principal</param>
        /// <param name="startDate">Fecha de inicio de la busqueda</param>
        /// <param name="endDate">Fecha fin de la busqueda</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetDistinctTimeStamp(string principalAssetId, string startDate, string endDate)
        {
            var timeStampArray = new HistoricalDataProxy(Properties.AppUserState).GetDistinctTimeStamp(principalAssetId, startDate, endDate);
            return await Task.FromResult(Json(timeStampArray, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene el dato dinamico historico de la lista de MdVariables para la fecha especifica.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de mdVariable a consultar</param>
        /// <param name="timeStamp">Fecha especifica a consultar en el historico</param>
        /// <returns>Dato dinamico historico de la lista de MdVariables para la fecha especifica</returns>
        [HttpPost]
        public async Task<JsonResult> GetSingleDynamicHistoricalData(List<string> mdVariableIdList, string timeStamp)
        {
            DateTime sDate = DateTime.Parse(timeStamp).ToUniversalTime();
            List<Acloud.Entities.Enums.ValueType> valueTypes = new List<Acloud.Entities.Enums.ValueType> { Acloud.Entities.Enums.ValueType.Waveform };
            var data = new HistoricalDataProxy(Properties.AppUserState).GetHistoricalDataRange(mdVariableIdList, valueTypes, sDate, sDate, 1);

            return await Task.FromResult(new JsonResult
            {
                Data = JsonConvert.SerializeObject(data),
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                MaxJsonLength = int.MaxValue
            });
        }

        /// <summary>
        /// Obtiene un rango de datos dinamicos historicos de la lista de MdVariables especificadas y segun un listado de fechas especificas.
        /// </summary>
        /// <param name="mdVariableIdList">Listado de Ids de mdVariable a consultar</param>
        /// <param name="timeStampArray">Listado de fechas a consultar en formato de cadena de texto</param>
        /// <returns>Datos numericos historicos de la lista de MdVariables especificada en un rango de tiempo</returns>
        [HttpPost]
        public async Task<JsonResult> GetDynamicHistoricalData(List<string> mdVariableIdList, List<string> timeStampArray)
        {
            List<DateTime> timeStampList = new List<DateTime>();
            foreach (var currentDate in timeStampArray)
            {
                timeStampList.Add(DateTime.Parse(currentDate).ToUniversalTime());
            }
            var data = new HistoricalDataProxy(Properties.AppUserState).GetDynamicHistoricalData(mdVariableIdList, timeStampList);

            return await Task.FromResult(new JsonResult
            {
                Data = data,
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                MaxJsonLength = int.MaxValue
            });
        }

        /// <summary>
        /// Obtiene el listado de eventos segun el Id del activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetEventList(string assetId)
        {
            var data = new RecordedEventProxy(Properties.AppUserState).GetByAssetId(assetId);
            return await Task.FromResult(Json(JsonConvert.SerializeObject(data), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene la cabecera del evento con toda la informacion relacionada al mismo
        /// </summary>
        /// <param name="eventId">Id del evento</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetEventHeader(string eventId)
        {
            var data = new RecordedEventProxy(Properties.AppUserState).GetEventHeader(eventId);
            return await Task.FromResult(Json(JsonConvert.SerializeObject(data), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene tanto el paquete de globales como el de formas de onda segun los Ids especificados
        /// </summary>
        /// <param name="overallPackageId">Id del paquete de valores globales a obtener</param>
        /// <param name="waveformPackageId">Id del paquete de formas de onda a obtener</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetPackages(string overallPackageId, string waveformPackageId)
        {
            var data = new RecordedEventProxy(Properties.AppUserState).GetPackages(overallPackageId, waveformPackageId);
            return await Task.FromResult(new JsonResult
            {
                Data = JsonConvert.SerializeObject(data),
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                MaxJsonLength = int.MaxValue
            });
        }

        /// <summary>
        /// Obtiene listado de historicos para una estampa de tiempo especifica y una lista de Variables Md
        /// </summary>
        /// <param name="timeStamp">Estampa de tiempo objetivo</param>
        /// <param name="mdVariableIdList">Listado de Ids de Variables Md</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> GetHistoricByTimeStampAndMdVariableList(string timeStamp, List<string> mdVariableIdList)
        {
            var data = new HistoricalDataProxy(Properties.AppUserState).GetByTimeStampAndMdVariableList(DateTime.Parse(timeStamp), mdVariableIdList);
            return await Task.FromResult(new JsonResult
            {
                Data = JsonConvert.SerializeObject(data),
                ContentType = "application/json",
                JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                MaxJsonLength = int.MaxValue
            });
        }

        /// <summary>
        /// Actualiza un punto de medición incluyendo la propiedad ParameterValues y su respectivo Nodo asociado a éste.
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> UpdateMdVariableAndNode(MdVariableExtension mdVariable)
        {
            var nodeDto = new NodeToUpdateDto { Id = mdVariable.NodeId, Name = mdVariable.Name, Description = mdVariable.Description };
            new MdVariableExtensionProxy(Properties.AppUserState).UpdateIncludingParameterValues(mdVariable);
            new NodeExtensionProxy(Properties.AppUserState).UpdateNameAndDescription(nodeDto);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Elimina una lista de puntos de medición y toda su descendencia (Nodo y SubVariables), mas relación con canales Asdaq o Atr y su par XY
        /// </summary>
        [HttpPost]
        public JsonResult DeleteManyMdVariable(List<MdVariableExtension> mdVariables)
        {
            new MdVariableExtensionProxy(Properties.AppUserState).DeleteMany(mdVariables);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Actualiza una lista de SubVariables
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> UpdateSubVariables(List<SubVariableExtension> subVariables)
        {
            new SubVariableExtensionProxy(Properties.AppUserState).UpdateMany2(subVariables);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Define las diferentes opciones de visualizacion del SCL, como Gaps de referencias,
        /// diametros de clearance y punto de inicio del clearance plot.
        /// </summary>
        /// <param name="sclOptModel">Opciones del Shaft Centerline</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> SetSclOptions(SclOptionsModel sclOptModel)
        {
            var resp = new XYMeasurementPointPairProxy(Properties.AppUserState).SetSclOptions(
                sclOptModel.SclOptions, sclOptModel.XMdVariableId, sclOptModel.YMdVariableId);
            return await Task.FromResult(Json(resp, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="mdVariableId">Id de la MdVariable a compensar</param>
        /// <param name="amplitude">Amplitud 1X de compensacion</param>
        /// /// <param name="phase">Fase 1X de compensacion</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> SetCompesation(string mdVariableId, double amplitude, double phase)
        {
            var resp = new SubVariableExtensionProxy(Properties.AppUserState).SetCompesation(mdVariableId, amplitude, phase);
            return await Task.FromResult(Json(resp, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Elimina una subvariable por medio de su Id
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> DeleteSubVariableById(string id)
        {
            new SubVariableExtensionProxy(Properties.AppUserState).DeleteById(id);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Crea un nuevo node, punto de medición y su respectivas subVariables
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> CreateNodeMdVariableAndSubVariables(NodeAndMdVariableDto nodeAndMdVariableDto, List<SubVariableExtension> subVariables)
        {
            var _node = new NodeExtensionProxy(Properties.AppUserState).Create(nodeAndMdVariableDto.NodeDto);
            nodeAndMdVariableDto.MdVariableDto.NodeId = _node.Id;
            var _mdVariable = new MdVariableExtensionProxy(Properties.AppUserState).Create(nodeAndMdVariableDto.MdVariableDto);
            subVariables.Select(s => { s.ParentId = _mdVariable.Id; return s; }).ToList();
            var _listSubVariableId = new SubVariableExtensionProxy(Properties.AppUserState).Create(subVariables);
            var data = new { node = _node, mdVariable = _mdVariable, listSubVariableId = _listSubVariableId };
            return await Task.FromResult(Json(data, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Retorna un asset por medio de su id
        /// </summary>
        [HttpGet]
        public async Task<JsonResult> GetAssetById(string id)
        {
            return await Task.FromResult(Json(new AssetExtensionProxy(Properties.AppUserState).GetById(id), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// 
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> CreateNodeAndAsset(Node node, AssetExtension asset, bool updateHasChild)
        {
            var _nodeId = new NodeExtensionProxy(Properties.AppUserState).ToCopyNode(node);
            asset.NodeId = _nodeId;

            if (updateHasChild)
                new NodeExtensionProxy(Properties.AppUserState).UpdateHasChild(node.ParentId, updateHasChild);

            var _assetId = new AssetExtensionProxy(Properties.AppUserState).AddSingle(asset);
            var data = new { assetId = _assetId, nodeId = _nodeId };
            return await Task.FromResult(Json(data, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Actualiza nombre y descripción (nodo y activo) e intervalo normal (activo)
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> UpdateNodeAndAsset(AssetExtension asset)
        {
            var _node = new NodeToUpdateDto { Id = asset.NodeId, Name = asset.Name, Description = asset.Description };
            new NodeExtensionProxy(Properties.AppUserState).UpdateNameAndDescription(_node);
            var _asset = new AssetToUpdateDto { Id = asset.Id, Name = asset.Name, Description = asset.Description, NormalInterval = asset.NormalInterval, TransientStatusTimeout = asset.TransientStatusTimeout, TripMultiply = asset.TripMultiply };
            new AssetExtensionProxy(Properties.AppUserState).UpdateNameAndDescription(_asset);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Copia y pega toda la descendencia de un Activo apartir del nodo relacionado a éste. 
        /// </summary>
        /// <returns>Un listado de nodos, activos, puntos de medicion y subvariables</returns>
        [HttpPost]
        public async Task<JsonResult> PasteNodeAndAsset(Node node, bool isPrincipal, string pplAssetId, List<XYMeasurementPointPair> pairsXY, List<string> updateNode)
        {
            var dto = new NodeExtensionProxy(Properties.AppUserState).Paste(node, isPrincipal, pplAssetId, pairsXY);

            if (updateNode != null)
            {
                if (updateNode.Count > 0)
                    new NodeExtensionProxy(Properties.AppUserState).UpdateHasChild(updateNode[0], Convert.ToBoolean(updateNode[1]));
            }

            return await Task.FromResult(Json(dto, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Crea y retorna un nuevo nodo
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> CreateNode(Node node)
        {
            return await Task.FromResult(Json(new NodeExtensionProxy(Properties.AppUserState).Create(node), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Actualiza el nombre y descripción de un Nodo
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> UpdateNameAndDescriptionOfNode(NodeToUpdateDto nodeDto)
        {
            new NodeExtensionProxy(Properties.AppUserState).UpdateNameAndDescription(nodeDto);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Elimina una ubicación y toda su descendencia (Nodos, Activos, Puntos de medición y SubVaribales)
        /// </summary>
        /// <param name="nodeIdList">Lista de nodos por Id</param>
        /// <param name="nodeIdListAsset">Lista de nodos por Id de tipo Asset</param>
        /// <param name="nodeIdListMdVariable">Lista de nodos por Id de tipo MdVariable</param>
        [HttpPost]
        public async Task<JsonResult> DeleteLocation(List<string> nodeIdList, List<string> nodeIdListAsset, List<string> nodeIdListMdVariable)
        {
            new NodeExtensionProxy(Properties.AppUserState).Delete_Many(nodeIdList);
            new AssetExtensionProxy(Properties.AppUserState).DeleteManyByNodeId(nodeIdListAsset);
            var mdVariableList = new MdVariableExtensionProxy(Properties.AppUserState).GetByNodeId(nodeIdListMdVariable);
            new MdVariableExtensionProxy(Properties.AppUserState).DeleteManyByIdAndSubVaribles(mdVariableList);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad EventVelocity de un activo principal
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> SaveEventVelocity(AssetExtension asset, bool hasChanges)
        {
            new AssetExtensionProxy(Properties.AppUserState).SaveEventVelocity(asset);

            if (hasChanges)
            {
                var changesRequestDto = new ChangeRequestsDto(null, new List<ChangeRequest> { new ChangeRequest(asset.Id) });
                new AsdaqProxy(Properties.AppUserState).UpdateChangeRequests(asset.AsdaqId, changesRequestDto);
            }

            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }


        /// <summary>
        /// Gestiona la descarga de archivos
        /// </summary>
        /// <param name="id">Lista de nodos por Id</param>
        [HttpPost]
        public async Task<JsonResult> UploadFile(string id)
        {

            try
            {
                foreach (string file in Request.Files)
                {
                    var fileContent = Request.Files[file];
                    if (fileContent != null && fileContent.ContentLength > 0)
                    {
                        // get a stream
                        var stream = fileContent.InputStream;
                        // and optionally write the file to disk
                        var fileName = Path.GetFileName(file);
                        string path1 = Server.MapPath("~/Content/STL/" + id);
                        var path2 = Path.Combine(Server.MapPath("~/Content/STL/" + id + "/"), fileName);
                        if (!System.IO.Directory.Exists(path1))
                        {
                            System.IO.Directory.CreateDirectory(path1);

                        }
                        var path = Path.Combine(Server.MapPath("~/Content/STL/" + id + "/"), fileName);


                        using (var fileStream = System.IO.File.Create(path))
                        {
                            stream.CopyTo(fileStream);
                        }
                    }
                }
            }
            catch (Exception)
            {
                Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return await Task.FromResult(Json("Upload failed"));
            }

            return await Task.FromResult(Json("File uploaded successfully"));
        }

        /// <summary>
        /// Obtiene las propiedades 3d del activo con el id especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetAssetProperties3d(string assetId)
        {
            if (string.IsNullOrEmpty(assetId))
            {
                return await Task.FromResult(Json(""));
            }

            var result = new AssetProxy(Properties.AppUserState).GetProperties3d(assetId);
            return await Task.FromResult(Json(result ?? "", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene las propiedades 3d del activo con el id especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo del activo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetAssetProperties3dByNode(string nodeId)
        {
            if (string.IsNullOrEmpty(nodeId))
            {
                return await Task.FromResult(Json(""));
            }

            var result = new AssetProxy(Properties.AppUserState).GetProperties3dByNode(nodeId);
            return await Task.FromResult(Json(result ?? "", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene el Path del activo con el id del nodo especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo del activo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetPath(string nodeId)
        {

            var result = new NodeProxy(Properties.AppUserState).GetPath(nodeId);
            return await Task.FromResult(Json(result, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene las propiedades 3d del activo con el id especificado
        /// </summary>
        /// <param name="mdVariableId">Id del activo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<JsonResult> GetMdVariableProperties3d(string mdVariableId)
        {
            if (string.IsNullOrEmpty(mdVariableId))
            {
                return await Task.FromResult(Json(""));
            }
            var result = new MdVariableProxy(Properties.AppUserState).GetProperties3d(mdVariableId);
            return await Task.FromResult(Json(result ?? "", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Establece el valor de la propiedad properties3d para el activo con el assetId especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <param name="properties3d">Cadena de texto con el JSON de propiedades 3d</param>
        [HttpPost]
        public async Task<JsonResult> SetAssetProperties3d(string assetId, string properties3d)
        {
            //properties3d = "";
            new AssetProxy(Properties.AppUserState).SetProperties3d(assetId, properties3d);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));

        }

        /// <summary>
        /// Actualiza las mdVariables con las Properties3d creadas desde el Editor3d
        /// </summary>
        /// <param name="properties3dList">Lista de properties3d</param>
        [HttpPost]
        public async Task<JsonResult> UpdateManyMdVariableProperties3d(List<Properties3dDto> properties3dList)
        {
            new MdVariableProxy(Properties.AppUserState).UpdateManyMdVariableProperties3d(properties3dList);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Encuentra todos los usuarios asociados a la empresa del usuario logueado actualmente
        /// </summary>
        public async Task<JsonResult> GetByCurrentCompany()
        {
            return await Task.FromResult(Json(new UserProxy(Properties.AppUserState).GetByCurrentCompany(), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad ConditionStatusEventsConfig de un activo principal
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> SaveConditionStatusEventsConfig(AssetExtension asset, bool hasChanges)
        {
            new AssetExtensionProxy(Properties.AppUserState).SaveConditionStatusEventsConfig(asset);

            if (hasChanges)
            {
                var changesRequestDto = new ChangeRequestsDto(null, new List<ChangeRequest> { new ChangeRequest(asset.Id) });
                new AsdaqProxy(Properties.AppUserState).UpdateChangeRequests(asset.AsdaqId, changesRequestDto);
            }

            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Elimina todos los pares XY relacionados con un AssetId y guarda una lista de pares XY
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<JsonResult> DeleteAndSaveXYMeasurementPointPair(string assetId, List<XYMeasurementPointPair> pairsXY)
        {
            new XYMeasurementPointPairProxy(Properties.AppUserState).DeleteAndSaveXYMeasurementPointPair(assetId, pairsXY);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Retorna una lista de activos a partir de una lista de nodeId
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> GetAssetsByNodeId(List<string> nodeIdList)
        {
            return await Task.FromResult(Json(new AssetExtensionProxy(Properties.AppUserState).GetByNodeId(nodeIdList), JsonRequestBehavior.AllowGet));
        }
        
        /// <summary>
        /// Actualiza una lista de puntos de acuerdo a la posicion que tenga en el listbox
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> UpdateOrderPositionPoints(List<MdVariableExtension> mdVariables)
        {
            new MdVariableExtensionProxy(Properties.AppUserState).UpdateOrderPositionPoints(mdVariables);
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Actualiza el nombre de un nodo
        /// </summary>
        [HttpPost]
        public async Task<JsonResult> UpdateNameInTreeNode(NodeToUpdateDto nodeDto)
        {
            new NodeExtensionProxy(Properties.AppUserState).UpdateName(nodeDto);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene todos los tipos de sensor registrados en el sistema Aspectrogram
        /// </summary>
        /// <returns>Lista de objetos de tipo SensorType</returns>
        [HttpGet]
        public JsonResult GetAllAssetLib3d()
        {
            return Json(new AssetLib3dProxy(Properties.AppUserState).GetAll(), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene todos los tipos de sensor registrados en el sistema Aspectrogram
        /// </summary>
        /// <returns>Lista de objetos de tipo SensorType</returns>
        [HttpGet]
        public JsonResult GetAssetIdLib3d(string assetLibId)
        {
            if (string.IsNullOrEmpty(assetLibId))
            {
                return Json("");
            }
            var result = new AssetLib3dProxy(Properties.AppUserState).GetProperties3dLibAssetById(assetLibId);
            return Json(result ?? "", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene todos los tipos de sensor registrados en el sistema Aspectrogram
        /// </summary>
        /// <returns>Lista de objetos de tipo SensorType</returns>
        [HttpGet]
        public JsonResult GetAllSubAssetLib3d()
        {
            return Json(new SubAssetLib3dProxy(Properties.AppUserState).GetAll(), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene todos los tipos de sensor registrados en el sistema Aspectrogram
        /// </summary>
        /// <returns>Lista de objetos de tipo SensorType</returns>
        [HttpGet]
        public JsonResult GetSubAssetIdLib3d(string subAssetLibId)
        {
            if (string.IsNullOrEmpty(subAssetLibId))
            {
                return Json("");
            }
            var result = new SubAssetLib3dProxy(Properties.AppUserState).GetProperties3dLibSubAssetById(subAssetLibId);
            return Json(result ?? "", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Crea y retorna una nueva categoria
        /// </summary>
        [HttpPost]
        public JsonResult CreateCategory(CategoryLib3d category)
        {
            return Json(new CategoryLib3dProxy(Properties.AppUserState).CreateCategoryLib3d(category), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Elimina un punto de medición, sus SubVariables y el Node asociado a el por medio de su Id
        /// </summary>
        [HttpPost]
        public JsonResult DeleteCategory(string categoryId)
        {
            new CategoryLib3dProxy(Properties.AppUserState).DeleteById(categoryId);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Crea y retorna una nuevo activo 3D para la librería
        /// </summary>
        [HttpPost]
        public JsonResult CreateAssetLib3d(AssetLib3d assetLib)
        {
            return Json(new AssetLib3dProxy(Properties.AppUserState).CreateAssetLib3d(assetLib), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Crea y retorna una nuevo activo 3D para la librería
        /// </summary>
        [HttpPost]
        public JsonResult CreateSubAssetLib3d(SubAssetLib3d subAssetLib)
        {
            return Json(new SubAssetLib3dProxy(Properties.AppUserState).CreateSubAssetLib3d(subAssetLib), JsonRequestBehavior.AllowGet);
        }      

        /// <summary>
        /// Obtiene todos los tipos de sensor registrados en el sistema Aspectrogram
        /// </summary>
        /// <returns>Lista de objetos de tipo SensorType</returns>
        [HttpGet]
        public JsonResult GetAllCategoriesLib3d()
        {
            return Json(new CategoryLib3dProxy(Properties.AppUserState).GetAll(), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Actualiza una lista de activos y puntos de medición
        /// </summary>
        [HttpPost]
        public JsonResult UpdateSummaryView(List<MdVariableExtension> points, List<AssetExtension> assets)
        {
            new AssetExtensionProxy(Properties.AppUserState).UpdateMany(assets);
            new MdVariableExtensionProxy(Properties.AppUserState).UpdatePoints(points);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Retorna la ruta completa de un nodo
        /// </summary>
        [HttpGet]
        public JsonResult GetPathNode(string id)
        {
            return Json(new NodeProxy(Properties.AppUserState).GetPath(id), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Retorna todas las referencias angulares
        /// </summary>
        [HttpGet]
        public JsonResult GetAllReferenceAngular()
        {
            return Json(new MdVariableExtensionProxy(Properties.AppUserState).GetAllReferenceAngular(), JsonRequestBehavior.AllowGet);
        }
    }
}