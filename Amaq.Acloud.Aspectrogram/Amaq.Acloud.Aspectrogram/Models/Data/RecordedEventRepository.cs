namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using MongoDB.Driver;
    using Acloud.Data;

    /// <summary>
    /// Repository RecordedEvent
    /// </summary>
    public class RecordedEventRepository : CoreRepository<RecordedEvent>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public RecordedEventRepository(string dbUrl): base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene la cabecera del evento con toda la informacion relacionada al mismo
        /// </summary>
        /// <param name="eventId">Id del evento</param>
        /// <returns></returns>
        public string GetEventHeader(string eventId)
        {
            var filter = builder.Eq(r => r.Id, eventId);
            var projection = Builders<RecordedEvent>.Projection.Include(r => r.AssetInfoJsonFileId);
            return collection.Find(filter).Project<RecordedEvent>(projection).FirstOrDefault().AssetInfoJsonFileId;
        }

        /// <summary>
        /// Obtiene el listado de eventos segun el Id del activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        public List<RecordedEvent> GetByAssetId(string assetId)
        {
            var filter = builder.Eq(r => r.AssetId, assetId);
            var projection = Builders<RecordedEvent>.Projection.Exclude(r => r.AssetId).Exclude(r => r.AssetInfoJsonFileId);
            return collection.Find(filter).Project<RecordedEvent>(projection).ToList();
        }
    }
}
