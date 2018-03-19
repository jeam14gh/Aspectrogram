namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using Entities.Dtos;
    using Aspectrogram.Models.Business;
    using System.Collections.Generic;
    using System.Web.Http;
    using Acloud.Entities.Core;
    using Aspectrogram.Controllers.Api.Attributes;
    using Entities;
    using System.Threading.Tasks;

    /// <summary>
    /// Controlador Api Node
    /// </summary>
    [CustomAuthorize]
    public class NodeController : GenericController<Node>
    {
        /// <summary>
        /// Elimina un nodo por Id
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteById(string id)
        {
            new NodeBl(CoreDbUrl).DeleteById(id);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Elimina los nodos del árbol con los id especificados y sus respectivos tipos de entidades
        /// </summary>
        [Roles("Admin")]
        [HttpPost]
        public async Task<IHttpActionResult> DeleteMany([FromBody] List<NodeToDeleteDto> nodes)
        {
            new NodeBl(CoreDbUrl).DeleteMany(nodes);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza los estados de los nodos tipo MdVariable especificados
        /// </summary>
        /// <param name="mdVariableNodeStatusDtoList">Lista de nodos tipo MdVariable con el nuevo estado</param>
        [HttpPost]
        public async Task<IHttpActionResult> UpdateManyMdVariableStatus(List<MdVariableNodeStatusDto> mdVariableNodeStatusDtoList)
        {
            new NodeBl(CoreDbUrl).UpdateManyMdVariableStatus(mdVariableNodeStatusDtoList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Retorna un nuevo Id a partir de un nodo copiado
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> ToCopyNode(Node node)
        {
            return await Task.FromResult(Ok(new NodeBl(CoreDbUrl).AddSingle(node)));
        }

        /// <summary>
        /// Actualiza el nombre y la descripción de un node
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateNameAndDescription(NodeToUpdateDto nodeDto)
        {
            new NodeBl(CoreDbUrl).UpdateNameAndDescription(nodeDto);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Retorna el node anteriormente creado en base de datos 
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Create(Node node)
        {
            return await Task.FromResult(Ok(new NodeBl(CoreDbUrl).Add(node)));
        }

        /// <summary>
        /// Copia y pega toda la descendencia de un Activo apartir del nodo relacionado a éste.   
        /// </summary>
        /// <returns>Un listado de nodos, activos, puntos de medicion y subvariables</returns>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Paste(dynamic model)
        {
            var node = model.node.ToObject<Node>();
            var isPrincipal = (bool)model.isPrincipal;
            var pplAssetId = (string)model.pplAssetId;
            var pairsXY = model.pairsXY.ToObject<List<XYMeasurementPointPair>>();
            return await Task.FromResult(Ok(new NodeBl(CoreDbUrl).Paste(node, isPrincipal, pplAssetId, pairsXY)));
        }

        /// <summary>
        /// Elimina varios nodos por medio de una lista de Id
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Delete_Many([FromBody] List<string> nodeIdList)
        {
            new NodeBl(CoreDbUrl).Delete_Many(nodeIdList);
            return await Task.FromResult(Ok());
        }

        /// <summary> 
        /// Copia un punto de medición,su nodo asociado e incluye las subVariables si éste tiene.
        /// </summary>
        /// <returns>Nodo, punto de medición y subVariables</returns>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> CopyNode(NodeAndMdVariableDto nodeAndMdVariableDto)
        {
            return await Task.FromResult(Ok(new NodeBl(CoreDbUrl).CopyNode(nodeAndMdVariableDto)));
        }

        /// <summary>
        /// Actualiza la propiedad HasChild de un nodo
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateHasChild(dynamic model)
        {
            var id= (string)model.id;
            var hasChild = (bool)model.hasChild;
            new NodeBl(CoreDbUrl).UpdateHasChild(id, hasChild);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza el nombre de un nodo
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateName(NodeToUpdateDto node)
        {
            new NodeBl(CoreDbUrl).UpdateName(node);
            return await Task.FromResult(Ok());
        }
    }
}
