namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Core
{
    using System.Web.Http;
    using Models.Business;
    using Entities;
    using Attributes;
    using WebSite.Controllers.Api;
    using Entities.Dtos;

    /// <summary>
    /// Controlador Api RecordedEvent
    /// </summary>
    [CustomAuthorize]
    public class RecordedEventController : GenericController<RecordedEvent>
    {
        /// <summary>
        /// Registra un nuevo evento en el servidor
        /// </summary>
        /// <param name="recordedEventDto">Objeto con los datos necesarios para el registro del evento</param>
        /// <returns>Id del evento en el servidor o una cadena vacía si ocurre algún error</returns>
        [HttpPost]
        public IHttpActionResult Add([FromBody] NewRecordedEventDto recordedEventDto)
        {
            return Ok(new RecordedEventBl(CoreDbUrl).Add(recordedEventDto));
        }

        /// <summary>
        /// Registra un nuevo paquete de evento en el servidor
        /// </summary>
        /// <param name="newEventPackageDto">Objeto con la información necesaria para registrar un paquete de evento en el servidor</param>
        /// <returns>Valor lógico que indica si el paquete fue guardado correctamente o no</returns>
        [HttpPost]
        public IHttpActionResult AddPackage([FromBody] NewEventPackageDto newEventPackageDto)
        {
            return Ok(new RecordedEventBl(CoreDbUrl).AddPackage(newEventPackageDto));
        }

        /// <summary>
        /// Obtiene la cabecera del evento con toda la informacion relacionada al mismo
        /// </summary>
        /// <param name="eventId">Id del evento</param>
        /// <returns></returns>
        [HttpGet]
        public IHttpActionResult GetEventHeader(string eventId)
        {
            return Ok(new RecordedEventBl(CoreDbUrl).GetEventHeader(eventId));
        }

        /// <summary>
        /// Obtiene el listado de eventos segun el Id del activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        [HttpGet]
        public IHttpActionResult GetByAssetId(string assetId)
        {
            return Ok(new RecordedEventBl(CoreDbUrl).GetByAssetId(assetId));
        }

        /// <summary>
        /// Obtiene tanto el paquete de globales como el de formas de onda segun los Ids especificados
        /// </summary>
        /// <param name="overallPackageId">Id del paquete de valores globales a obtener</param>
        /// <param name="waveformPackageId">Id del paquete de formas de onda a obtener</param>
        /// <returns></returns>
        [HttpGet]
        public IHttpActionResult GetPackages(string overallPackageId, string waveformPackageId)
        {
            return Ok(new RecordedEventBl(CoreDbUrl).GetPackages(overallPackageId, waveformPackageId));
        }
    }
}
