namespace Amaq.Acloud.Aspectrogram.Entities
{
    using System;
    using System.Collections.Generic;
    using Libraries.MongoDbRepository;
    using MongoDB.Bson.Serialization.Attributes;
    using Acloud.Entities.Serializers;
    using Enums;
    using MongoDB.Bson;
    using Newtonsoft.Json;
    using Libraries.MongoRepository.Attributes;
    using ValueObjects;
    /// <summary>
    /// Representa un evento grabado de condición u otro tipo
    /// </summary>
    public class RecordedEvent : Entity
    {
        /// <summary>
        /// Id de asset
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssetId { get; set; }

        /// <summary>
        /// Id de estado de condición. Solo aplica para los eventos por cambio de estado de condición
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string StatusId { get; set; }

        /// <summary>
        /// Estampa de tiempo del comienzo del evento
        /// </summary>
        [BsonSerializer(typeof(TimeStampSerializer))]
        public DateTime TimeStamp { get; set; }

        /// <summary>
        /// Tipo de evento
        /// </summary>
        public EventType EventType { get; set; }

        /// <summary>
        /// Duración total del evento en minutos. Desde la interfaz de usuario se le debe dar manejo para mostrar en diferentes unidades de tiempo
        /// o formato
        /// </summary>
        public double Duration { get; set; }

        /// <summary>
        /// Estado del evento
        /// </summary>
        public EventStatus Status { get; set; }

        /// <summary>
        /// Espaciamiento en segundos entre cada dato del evento
        /// </summary>
        public double Step { get; set; }

        /// <summary>
        /// Id del archivo assetInfo.json en GridFS
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssetInfoJsonFileId { get; set; }

        /// <summary>
        /// Lista de ids de los paquetes del evento en GridFS
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public List<EventPackageFilesId> PackageFileIdList { get; set; }

        /// <summary>
        /// Propiedad usada exclusivamente para obtener la informacion del evento en la misma consulta
        /// de los valores generales de duracion, tipo de evento, etc.
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public string AssetInfoJson { get; set; }
    }
}
