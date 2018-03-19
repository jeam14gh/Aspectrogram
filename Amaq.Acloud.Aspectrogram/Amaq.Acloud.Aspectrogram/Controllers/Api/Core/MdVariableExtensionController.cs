namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using System.Web.Http;
    using System.Collections.Generic;
    using Aspectrogram.Models.Business;
    using Entities;
    using Aspectrogram.Controllers.Api.Attributes;
    using Entities.Dtos;
    using System.Threading.Tasks;

    /// <summary>
    /// Controlador Api MdVariableExtension
    /// </summary>
    [CustomAuthorize]
    public class MdVariableExtensionController : GenericController<MdVariableExtension>
    {
        /// <summary>
        /// Obtiene las mdVariable asociadas al Id de Asset especificado.
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns>Listado de MdVariableExtension</returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetByAssetId(string assetId)
        {
            return await Task.FromResult(Ok(new MdVariableExtensionBl(CoreDbUrl).GetByAssetId(assetId)));
        }

        /// <summary>
        /// Obtiene las mdVariable asociadas con cualquiera de los id asset especificados
        /// </summary>
        /// <param name="assetIdList">Lista de id asset</param>
        /// <returns>Lista de objetos de tipo MdVariableExtension</returns>
        [HttpPost]
        public async Task<IHttpActionResult> GetByAssetId(List<string> assetIdList)
        {
            return await Task.FromResult(Ok(new MdVariableExtensionBl(CoreDbUrl).GetByAssetId(assetIdList)));
        }

        /// <summary>
        /// Obtiene los puntos de medicion asociados a un activo,
        /// asi como la informacion de subvariables por punto de medicion.
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns>Lista de objetos de tipo MdVariableExtension</returns>
        [HttpGet]
        public async Task<IHttpActionResult> GetMeasurementPointsByAsset(string assetId)
        {
            return await Task.FromResult(Ok(new MdVariableExtensionBl(CoreDbUrl).GetMeasurementPointsByAsset(assetId)));
        }

        /// <summary>
        /// Obtiene las subVariables con medidas globales asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo MeasurementPointDto</returns>
        [HttpPost]
        public async Task<IHttpActionResult> GetOverallMeasure(List<string> mdVariableIdList)
        {
            return await Task.FromResult(Ok(new MdVariableExtensionBl(CoreDbUrl).GetOverallMeasure(mdVariableIdList)));
        }

        /// <summary>
        /// Obtiene las subVariables con valor tipo Amaq Stream asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo MeasurementPointDto</returns>
        [HttpPost]
        public async Task<IHttpActionResult> GetSignal(List<string> mdVariableIdList)
        {
            return await Task.FromResult(Ok(new MdVariableExtensionBl(CoreDbUrl).GetSignal(mdVariableIdList)));
        }

        /// <summary>
        /// Elimina una lista de puntos de medición y toda su descendencia (Nodo y SubVariables), mas relación con canales Asdaq o Atr y su par XY
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult DeleteMany(List<MdVariableExtension> mdVariables)
        {
            new MdVariableExtensionBl(CoreDbUrl).DeleteMany(mdVariables);
            return Ok();
        }

        /// <summary>
        /// Actualiza un punto de medición incluyendo la propiedad ParameterValues
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateIncludingParameterValues(MdVariableExtension mdVariable)
        {
            new MdVariableExtensionBl(CoreDbUrl).UpdateIncludingParameterValues(mdVariable);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Retorna el punto de medición anteriormente creado en base de datos
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> Create(MdVariableExtension mdVariable)
        {
            var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).Add(mdVariable);
            return await Task.FromResult(Ok(_mdVariable));
        }

        /// <summary>
        /// Retorna una lista de puntos de medición a través de una lista de nodeId
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> GetByNodeId(List<string> nodeIdList)
        {
            return await Task.FromResult(Ok(new MdVariableExtensionBl(CoreDbUrl).GetByNodeId(nodeIdList)));
        }

        /// <summary>
        /// Elimina varios puntos de medición y las Subvaribles asociadas a cada punto
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> DeleteManyByIdAndSubVaribles(List<MdVariableExtension> mdVariableList)
        {
            new MdVariableExtensionBl(CoreDbUrl).DeleteManyByIdAndSubVaribles(mdVariableList);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Calcula los parametros M y B de cada punto de medición a partir de una lista obtenida en la configuración de canales de un Asdaq
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> CalculateMandB(List<MdVariableUpdateMBDto> mdVariablesDto)
        {
            new MdVariableExtensionBl(CoreDbUrl).CalculateMandB(mdVariablesDto,"Relación punto de medición - canal Asdaq");
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza una lista de puntos de acuerdo a la posicion que tenga en el listbox
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public async Task<IHttpActionResult> UpdateOrderPositionPoints(List<MdVariableExtension> mdVariables)
        {
            new MdVariableExtensionBl(CoreDbUrl).UpdateOrderPositionPoints(mdVariables);
            return await Task.FromResult(Ok());
        }

        /// <summary>
        /// Actualiza una lsita de puntos de medición
        /// </summary>
        [HttpPost]
        [Roles("Admin")]
        public IHttpActionResult UpdatePoints(List<MdVariableExtension> points)
        {
            new MdVariableExtensionBl(CoreDbUrl).UpdatePoints(points);
            return Ok();
        }

        /// <summary>
        /// Retorna todas las referencias angulares
        /// </summary>
        [HttpGet]
        [Roles("Admin")]
        public IHttpActionResult GetAllReferenceAngular()
        {
            return Ok(new MdVariableExtensionBl(CoreDbUrl).GetAllReferenceAngular());
        }
    }
}
