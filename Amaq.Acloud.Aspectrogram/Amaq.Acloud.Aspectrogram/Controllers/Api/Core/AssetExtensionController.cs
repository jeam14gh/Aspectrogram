namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using System.Web.Http;
    using Models.Business;
    using Entities;
    using Aspectrogram.Controllers.Api.Attributes;
    using Entities.Dtos;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    /// <summary>
    /// Controlador AssetExtension
    /// </summary>
    [CustomAuthorize]
    public class AssetExtensionController : GenericController<AssetExtension>
    {
        /// <summary>
        /// Obtiene los asset con el asdaqId especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns>Lista de objetos de tipo AssetExtension</returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetByAsdaq(string asdaqId)
        {
            return await Task.FromResult(Ok(new AssetExtensionBl(CoreDbUrl).GetByAsdaq(asdaqId)));
        }

        /// <summary>
        /// Obtiene el Id del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetAssetIdByNode(string nodeId)
        {
            return await Task.FromResult(Ok(new AssetExtensionBl(CoreDbUrl).GetAssetIdByNode(nodeId)));
        }

        /// <summary>
        /// Obtiene el id y el asdaqId del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id de nodo</param>
        /// <returns></returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetIdAndAsdaqIdByNode(string nodeId)
        {
            return await Task.FromResult(Ok(new AssetExtensionBl(CoreDbUrl).GetIdAndAsdaqIdByNode(nodeId)));
        }

        /// <summary>
        /// Actualiza algunas propiedades de un activo
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateNameAndDescription(AssetToUpdateDto asset)
        {
            new AssetExtensionBl(CoreDbUrl).UpdateNameAndDescription(asset);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// 
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Clone(AssetExtension asset)
        {
            new AssetExtensionBl(CoreDbUrl).Clone(asset);
            return await Task.FromResult(Ok());
        }


        /// <summary>
        /// Elimina varios activos por medio de una lista de NodeId
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteManyByNodeId (List<string> nodeIdList)
        {
            new AssetExtensionBl(CoreDbUrl).DeleteManyByNodeId(nodeIdList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad EventVelocity de un activo principal
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> SaveEventVelocity(AssetExtension asset)
        {
            new AssetExtensionBl(CoreDbUrl).SaveEventVelocity(asset);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad ConditionStatusEventsConfig de un activo principal
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> SaveConditionStatusEventsConfig(AssetExtension asset)
        {
            new AssetExtensionBl(CoreDbUrl).SaveConditionStatusEventsConfig(asset);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Retorna una lista de activos a partir de una lista de nodeId
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> GetByNodeId(List<string> nodeIdList)
        {
            return await Task.FromResult(Ok(new AssetExtensionBl(CoreDbUrl).GetByNodeId(nodeIdList)));
        }

        /// <summary>
        /// Actualiza la fecha del último evento generado para el estado de condición y el activo especificado
        /// </summary>
        /// <param name="lastSavedEventDto">Objeto que especifica el activo, el estado de condición y la estampa de tiempo del último evento generado</param>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateLastSavedEvent(LastSavedEventDto lastSavedEventDto)
        {
            new AssetExtensionBl(CoreDbUrl).UpdateLastSavedEvent(lastSavedEventDto);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza una lista de activos de la vista resumen
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult UpdateMany(List<AssetExtension> assets)
        {
            new AssetExtensionBl(CoreDbUrl).UpdateMany(assets);
            return Ok();
        }
    }
}
