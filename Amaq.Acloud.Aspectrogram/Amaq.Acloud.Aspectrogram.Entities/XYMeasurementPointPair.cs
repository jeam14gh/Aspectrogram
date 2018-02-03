namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Libraries.MongoDbRepository;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;
    using Newtonsoft.Json;
    using ValueObjects;

    /// <summary>
    /// Representa la relación de un par de puntos de medición XY, necesario para algunos gráficos de análisis
    /// como Orbital, SCL, etc...
    /// </summary>
    public class XYMeasurementPointPair : Entity
    {
        /// <summary>
        /// Id del Asset al que pertenece el punto de medicion
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssetId { get; set; }
        /// <summary>
        /// Id MdVariable en X
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string XMdVariableId { get; set; }
        /// <summary>
        /// Id MdVariable en Y
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string YMdVariableId { get; set; }

        /// <summary>
        /// Diferentes opciones para la graficacion de la posicion del eje (shaft centerline)
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonIgnoreIfNull]
        public SclOptions SclOptions { get; set; }
    }
}
