namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Data;
    using Acloud.Business;
    using Acloud.Entities.Core;
    using Acloud.Entities.Enums;
    using Acloud.Entities.ValueObjects;
    using MongoDB.Bson;
    using WebSite.Models.Business;
    using System.Collections.Generic;
    using Entities.Dtos;
    using System.Linq;
    using Entities;

    /// <summary>
    /// Logica de negocio NodeExtension
    /// </summary>
    public class NodeBl : CoreBl<Node>
    {
        /// <summary>
        /// Contiene una referencia al repositorio de NodeRepository y sus metodos/atributos.
        /// </summary>
        private NodeRepository _nodeRepository = null;
        /// <summary>
        /// Lista de nodos 
        /// </summary>
        private List<Node> listNodes = new List<Node>();
        /// <summary>
        /// Lista de activos 
        /// </summary>
        private List<AssetExtension> listAssets = new List<AssetExtension>();
        /// <summary>
        /// Lista de puntos de medición
        /// </summary>
        private List<MdVariableExtension> listMdVariables = new List<MdVariableExtension>();
        /// <summary>
        /// Lista de subvariables
        /// </summary>
        private List<SubVariableExtension> listSubvariables = new List<SubVariableExtension>();
        /// <summary>
        /// 
        /// </summary>
        private static string assetNodeId;
        /// <summary>
        /// Lista de pares XY del activo copiado
        /// </summary>
        private List<XYMeasurementPointPair> listPairsXY = new List<XYMeasurementPointPair>();

        /// <summary>
        /// Lista de puntos de medición a los cuales se les debe actualizar su propiedad AngularReferenceId
        /// </summary>
        private List<UpdateAngularReferenceIdDto> listPointsByUpdate = new List<UpdateAngularReferenceIdDto>();

        /// <summary>
        /// Lista de activos principales a los cuales dentro del objeto RpmEventConfig se les debe actualizar su propiedad AngularReferenceId
        /// </summary>
        private List<UpdateAngularReferenceIdDto> listAssetsByUpdate = new List<UpdateAngularReferenceIdDto>();

        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public NodeBl(string coreDbUrl) : base(coreDbUrl)
        {
            _nodeRepository = new NodeRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
            assetNodeId = null;
        }

        /// <summary>
        /// Elimina varios nodos y su tipo de entidad (Asset o MdVariable)
        /// </summary>
        public void DeleteMany(List<NodeToDeleteDto> nodes)
        {
            if (nodes != null)
            {
                var nodeIdAssets = nodes.Where(a => a.EntityType == EntityType.Asset).Select(s => s.Id).ToList();
                var nodeIdMdVariables = nodes.Where(a => a.EntityType == EntityType.MdVariable).Select(s => s.Id).ToList();

                if (nodeIdAssets != null)
                {
                    new AssetExtensionBl(CoreDbUrl).DeleteManyByNodeId(nodeIdAssets);
                }
                if (nodeIdMdVariables != null)
                {
                    var listMdvar = new List<MdVariableExtension>();
                    for (int m = 0; m < nodeIdMdVariables.Count; m++)
                    {
                        var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).GetByNodeId(nodeIdMdVariables[m]);
                        listMdvar.Add(_mdVariable);
                    }

                    new MdVariableExtensionBl(CoreDbUrl).DeleteManyByIdAndSubVaribles(listMdvar);

                    if (listMdvar.Count > 0)
                    {
                        var listMdVariableId = listMdvar.Select(s => s.Id).ToList();
                        foreach (var id in listMdVariableId)
                        {
                            new XYMeasurementPointPairBl(CoreDbUrl).DeleteByMdVariableId(id);
                        }
                    }

                }
                _nodeRepository.DeleteMany(nodes.Select(s => s.Id).ToList());
            }
        }

        /// <summary>
        /// Elimina un Node por medio de su id
        /// </summary>
        public void DeleteById(string id)
        {
            _nodeRepository.Delete(new ObjectId(id));
        }

        /// <summary>
        /// Actualiza los estados de los nodos tipo MdVariable especificados
        /// </summary>
        /// <param name="mdVariableNodeStatusDtoList">Lista de nodos tipo MdVariable con el nuevo estado</param>
        public void UpdateManyMdVariableStatus(List<MdVariableNodeStatusDto> mdVariableNodeStatusDtoList)
        {
            try
            {
                // Mapeo de Dto a entidad
                var mdVariableNodeStatusList =
                    mdVariableNodeStatusDtoList.Select(mdVariableNodeStatus =>
                        new Node()
                        {
                            Id = mdVariableNodeStatus.NodeId,
                            Status = new List<StatusNode>() { new StatusNode() { Corp = Corp.Risk, StatusId = mdVariableNodeStatus.StatusId } },
                        }).ToList();

                _nodeRepository.UpdateManyMdVariableStatus(mdVariableNodeStatusList);
            }
            catch (System.Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Actualiza el nombre y la descripción de un node
        /// </summary>
        public void UpdateNameAndDescription(NodeToUpdateDto nodeDto)
        {
            _nodeRepository.UpdateNameAndDescription(nodeDto);
        }

        /// <summary>
        /// Obtiene los nodos hijos usando el parentLevel
        /// se van a buscar
        /// </summary>
        /// <param name="parentLevel">Cadena de texto que representa el Level del nodo. Ejemplo: "1.1"</param>
        /// <returns></returns>
        public List<Node> GetChildren(string parentLevel)
        {
            return _nodeRepository.GetChildren(parentLevel);
        }

        /// <summary>
        /// Elimina varios nodos por medio de una lista de Id
        /// </summary>
        public void Delete_Many(List<string> nodeIdList)
        {
            _nodeRepository.DeleteMany(nodeIdList);
        }

        /// <summary>
        /// Copia y pega toda la descendencia de un Activo apartir del nodo relacionado a éste.   
        /// </summary>
        /// <returns>Un listado de nodos, activos, puntos de medicion y subvariables</returns>
        public NodeAssetMdVarAndSubVarDto Paste(Node node, bool isPrincipal, string pplAssetId, List<XYMeasurementPointPair> pairsXY)
        {
            listPairsXY = pairsXY;
            ResolveHierarchy(node, null, isPrincipal, pplAssetId);

            // Guarda los pares XY que existan en la descendencia del activo copiado
            if (listPairsXY != null)
                new XYMeasurementPointPairBl(CoreDbUrl).AddMany(listPairsXY);

            //new code ::: Buscamos todos los puntos de medicion a los cuales se le debe actualizar su AngularReferenceId
            foreach (var p in listPointsByUpdate)
            {
                if (!string.IsNullOrEmpty(p.AngularReferenceIdOld))
                {
                    var point = listPointsByUpdate.Where(w => w.IdOld == p.AngularReferenceIdOld).FirstOrDefault();
                    if (point != null)
                    {
                        new MdVariableExtensionBl(CoreDbUrl).UpdateAngularReferenceId(p.IdNew, point.IdNew);
                        // Buscamos el punto de medición en la lista a retornar y reemplazamos el valor de AngularReferenceId
                        listMdVariables.Where(w => w.Id == p.IdNew).
                            Select(s => { s.AngularReferenceId = point.IdNew; return s; }).ToList();
                    }
                }
            }

            // Buscamos todos los activos a los cuales se le debe actualizar su AngularReferenceId
            foreach (var a in listAssetsByUpdate)
            {
                var point = listPointsByUpdate.Where(w => w.IdOld == a.AngularReferenceIdOld).FirstOrDefault();
                if (point != null)
                {
                    new AssetExtensionBl(CoreDbUrl).UpdateAngularReferenceId(a.IdNew, point.IdNew);

                    // Buscamos el activo en la lista a retornar y reemplazamos el valor de AngularReferenceId
                    listAssets.Where(w => w.Id == a.IdNew).
                        Select(s => { s.RpmEventConfig.AngularReferenceId = point.IdNew; return s; }).ToList();
                }
            }
            // end code new

            return new NodeAssetMdVarAndSubVarDto { Nodes = listNodes, Assets = listAssets, MdVariables = listMdVariables, SubVariables = listSubvariables };
        }

        /// <summary>
        /// Resuelve la jerarquía de un Nodo y su tipo de entidad
        /// </summary>
        private void ResolveHierarchy(Node node, string assetId, bool isPrincipal, string pplAssetId)
        {
            // NodeId viejo
            var oldNodeId = node.Id;
            node.Id = null;
            node.Status = new List<StatusNode>() { new StatusNode { Corp = Corp.Risk, StatusId = null } };
            node.Properties3d = null;
            var newNode = _nodeRepository.Add(node);

            if (node.Type == EntityType.Asset)
            {
                var asset = new AssetExtensionBl(CoreDbUrl).GetByNodeId(oldNodeId);
                asset.Name = node.Name;
                asset.Description = node.Description;
                asset.NodeId = newNode.Id;
                asset.AsdaqId = null;
                asset.Id = null;
                if(asset.Properties3d != null) 
                asset.Properties3d = asset.Properties3d.Replace("\"isCloned\":false", "\"isCloned\":true");
                var oldAngularReferenceId = string.Empty;

                // Validamos cada activo para asignarle el valor respectivo en su descendencia en sus propiedades IsPrincipal y PrincipalAssetId
                if (isPrincipal == true)
                {
                    asset.IsPrincipal = true;
                    asset.PrincipalAssetId = null;
                    isPrincipal = false;
                    assetNodeId = asset.NodeId;
                    //code new
                    if (asset.RpmEventConfig != null)
                    {
                        oldAngularReferenceId = asset.RpmEventConfig.AngularReferenceId;
                        asset.RpmEventConfig.AngularReferenceId = null;
                    }
                    //end code new
                }
                else
                {
                    asset.IsPrincipal = false;
                    if (string.IsNullOrEmpty(pplAssetId))
                        asset.PrincipalAssetId = new AssetExtensionBl(CoreDbUrl).GetByNodeId(assetNodeId).Id;
                    else
                        asset.PrincipalAssetId = pplAssetId;
                }

                var newAsset = new AssetExtensionBl(CoreDbUrl).Add(asset);

                //code new ::: Agregamos en una lista todos los activos principales a los cuales se les halla configurado un evento de velocidad
                if (!string.IsNullOrEmpty(oldAngularReferenceId))
                    listAssetsByUpdate.Add(new UpdateAngularReferenceIdDto(newAsset.Id, oldAngularReferenceId));
                //end code new

                assetId = newAsset.Id;
                listAssets.Add(newAsset);
            }
            else if (node.Type == EntityType.MdVariable)
            {
                var mdVariable = new MdVariableExtensionBl(CoreDbUrl).GetByNodeId(oldNodeId);

                // code new
                var oldAngularReferenceId = mdVariable.AngularReferenceId;
                mdVariable.AngularReferenceId = null;
                //end code new

                mdVariable.NodeId = newNode.Id;
                var mdVarIdOld = mdVariable.Id;
                var parentIdOld = mdVariable.ParentId;

                mdVariable.ParentId = assetId;
                // Lista de subVariables 
                var subVariables = new SubVariableExtensionBl(CoreDbUrl).GetByParentId(mdVariable.Id);
                mdVariable.Id = null;
                var newMdVariable = new MdVariableExtensionBl(CoreDbUrl).Add(mdVariable);

                //code new ::: Agregamos en una lista todos los puntos de medición copiados 
                listPointsByUpdate.Add(new UpdateAngularReferenceIdDto(mdVarIdOld, mdVariable.SensorTypeCode, newMdVariable.Id, oldAngularReferenceId));
                // end code new

                // Modifica una lista de pares XY encontrados del activo copiado y crea una nueva lista para insertar en base de datos
                if (listPairsXY != null)
                {
                    for (int p = 0; p < listPairsXY.Count; p++)
                    {
                        if (mdVariable.Orientation == Entities.Enums.SensorOrientation.X)
                        {
                            if (listPairsXY[p].XMdVariableId == mdVarIdOld)
                            {
                                listPairsXY[p].AssetId = mdVariable.ParentId;
                                listPairsXY[p].XMdVariableId = newMdVariable.Id;
                                break;
                            }
                        }
                        else if (mdVariable.Orientation == Entities.Enums.SensorOrientation.Y)
                        {
                            if (listPairsXY[p].YMdVariableId == mdVarIdOld)
                            {
                                listPairsXY[p].AssetId = mdVariable.ParentId;
                                listPairsXY[p].YMdVariableId = newMdVariable.Id;
                                break;
                            }
                        }
                    }
                }

                listMdVariables.Add(newMdVariable);

                // Seteamos cada una de las subvariables su parentId por el nuevo
                foreach (var s in subVariables)
                {
                    s.ParentId = newMdVariable.Id;
                    s.Status = null;
                    s.Id = null;
                    listSubvariables.Add(new SubVariableExtensionBl(CoreDbUrl).Add(s));
                }
            }

            listNodes.Add(newNode);
            var children = _nodeRepository.Where(a => a.ParentId == oldNodeId).ToList();

            // Elimina el nuevo nodo si exite dentro de la lista de hijos
            if (children.Exists(e => e.Id == newNode.Id))
            {
                children.RemoveAll(r => r.Id == newNode.Id);
            }

            foreach (var _node in children)
            {
                _node.ParentId = newNode.Id;
                // Cada node tipo Asset se le setea su nuevo level
                if (_node.Type == EntityType.Asset)
                {
                    _node.Level = newNode.Level + "." + _node.Level.Split('.')[(_node.Level.Split('.').Length - 1)];
                }

                // Llamada recursiva
                ResolveHierarchy(_node, assetId, isPrincipal, pplAssetId);
            }
            listNodes.OrderBy(d => d.Level).ToList();
        }

        /// <summary> 
        /// Copia un punto de medición,su nodo asociado e incluye las subvariables si éste tiene.
        /// </summary>
        /// <returns>Nodo, punto de medición y subVariables</returns>
        public NodeAndMdVariableDto CopyNode(NodeAndMdVariableDto nodeAndMdVariableDto)
        {
            var _subVariables = new List<SubVariableExtension>();
            var _nodeAndMdVariableDto = new NodeAndMdVariableDto();

            // Obtenemos el nodo a copiar y le seteamos algunas propiedades para crear uno nuevo.
            var _getNode = new NodeBl(CoreDbUrl).GetById(nodeAndMdVariableDto.NodeDto.Id);
            _getNode.Id = null;
            _getNode.Status = new List<StatusNode>() { new StatusNode { Corp = Corp.Risk, StatusId = null } };
            _getNode.ParentId = nodeAndMdVariableDto.NodeDto.ParentId;
            _getNode.Name = nodeAndMdVariableDto.NodeDto.Name;
            var _node = new NodeBl(CoreDbUrl).Add(_getNode);

            // Obtenemos el punto de medición a copiar y le seteamos algunas propiedades para crear uno nuevo.
            var _getMdVar = new MdVariableExtensionBl(CoreDbUrl).GetById(nodeAndMdVariableDto.MdVariableDto.Id);
            _getMdVar.Id = null;
            _getMdVar.NodeId = _node.Id;

            // Si el parentId del punto copiado es diferente, el AngularReferenceId es null
            if (_getMdVar.ParentId != nodeAndMdVariableDto.MdVariableDto.ParentId)
                _getMdVar.AngularReferenceId = null;

            _getMdVar.ParentId = nodeAndMdVariableDto.MdVariableDto.ParentId;
            _getMdVar.Name = nodeAndMdVariableDto.MdVariableDto.Name;
            _getMdVar.OrderPosition = nodeAndMdVariableDto.MdVariableDto.OrderPosition;
            var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).Add(_getMdVar);

            // Obtenemos las suvbariables asociadas del punto de medicion a copiar y le seteamos su nuevo parentId a cada una de ellas para ser creadas.
            var _subVars = new SubVariableExtensionBl(CoreDbUrl).GetByParentId(nodeAndMdVariableDto.MdVariableDto.Id);
            for (int s = 0; s < _subVars.Count; s++)
            {
                _subVars[s].Id = null;
                _subVars[s].ParentId = _mdVariable.Id;

                if (_subVars[s].ValueType == ValueType.Numeric)
                    _subVars[s].Value = 0.0;
                else
                    _subVars[s].Value = null;

                _subVariables.Add(new SubVariableExtensionBl(CoreDbUrl).Add(_subVars[s]));
            }

            _nodeAndMdVariableDto.NodeDto = _node;
            _nodeAndMdVariableDto.MdVariableDto = _mdVariable;
            _nodeAndMdVariableDto.MdVariableDto.SubVariables = _subVariables;

            return _nodeAndMdVariableDto;
        }

        /// <summary>
        /// Retorna todos los nodos con el mismo parentId
        /// </summary>
        public List<Node> GetByParentId(string parentId)
        {
            return _nodeRepository.GetByParentId(parentId);
        }

        /// <summary>
        /// Actualiza la propiedad HasChild de un nodo
        /// </summary>
        public void UpdateHasChild(string id, bool hasChild)
        {
            _nodeRepository.UpdateHasChild(id, hasChild);
        }

        /// <summary>
        /// Actualiza el nombre de un nodo
        /// </summary>
        public void UpdateName(NodeToUpdateDto node)
        {
            _nodeRepository.UpdateName(node);

            if (node.EntityType == 2)
                new AssetExtensionBl(CoreDbUrl).UpdateName(node.EntityId, node.Name);
            else if (node.EntityType == 3)
                new MdVariableExtensionBl(CoreDbUrl).UpdateName(node.EntityId, node.Name);
        }
    }
}
