namespace Amaq.Acloud.Aspectrogram.Controllers.Api
{
    using System.Web.Http;
    using Models.Business;
    using WebSite.Controllers.Api;
    using Entities;
    using Attributes;
    using Entities.ValueObjects;
    using System.Collections.Generic;
    using System.Threading.Tasks;

    /// <summary>
    /// Controlador Api XYMeasurementPointPair
    /// </summary>
    [CustomAuthorize]
    public class XYMeasurementPointPairController : GenericController<XYMeasurementPointPair>
    {
        /// <summary>
        /// Obtiene el conjunto de puntos XY de la mdVariable indicada
        /// </summary>
        /// <returns>Lista de objetos de tipo XYMeasurementPointPair</returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetXYPair(string mdVariableId)
        {
            return await Task.FromResult(Ok(new XYMeasurementPointPairBl(CoreDbUrl).GetXYPair(mdVariableId)));
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables pasada como parametro.
        /// </summary>
        /// <param name="assetId">Id del Asset</param>
        /// <returns>Lista de objetos de tipo XYMeasurementPointPair</returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetXYPairByAssetId(string assetId)
        {
            return await Task.FromResult(Ok(new XYMeasurementPointPairBl(CoreDbUrl).GetXYPairByAssetId(assetId)));
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables para los activos con los id especificados.
        /// </summary>
        /// <param name="assetIdList">Lista de id de asset</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<IHttpActionResult> GetXYPairByAssetId(List<string> assetIdList)
        {
            return await Task.FromResult(Ok(new XYMeasurementPointPairBl(CoreDbUrl).GetXYPairByAssetId(assetIdList)));
        }

        /// <summary>
        /// Define las diferentes opciones de visualizacion del SCL, como Gaps de referencias,
        /// diametros de clearance y punto de inicio del clearance plot.
        /// </summary>
        /// <param name="model">Opciones del Shaft Centerline</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<IHttpActionResult> SetSclOptions([FromBody]dynamic model)
        {
            SclOptions sclOpts = model.sclOpts.ToObject<SclOptions>();
            string xMdVariableId = model.xMdVariableId.ToObject<string>();
            string yMdVariableId = model.yMdVariableId.ToObject<string>();
            return await Task.FromResult(Ok(new XYMeasurementPointPairBl(CoreDbUrl).SetSclOptions(sclOpts, xMdVariableId, yMdVariableId)));
        }

        /// <summary>
        /// Elimina todos los pares XY relacionados con un AssetId y guarda una lista de pares XY
        /// </summary>
        [HttpPost]
        public async Task<IHttpActionResult> DeleteAndSaveXYMeasurementPointPair(string assetId, List<XYMeasurementPointPair> pairsXY)
        {
            new XYMeasurementPointPairBl(CoreDbUrl).DeleteAndSaveXYMeasurementPointPair(assetId, pairsXY);
            return await Task.FromResult(Ok());
        }
    }
}
