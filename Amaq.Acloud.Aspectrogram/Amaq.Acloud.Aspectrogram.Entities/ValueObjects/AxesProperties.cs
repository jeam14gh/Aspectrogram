namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;

    /// <summary>
    /// Diferentes propiedades que pueden estar relacionadas a un eje
    /// </summary>
    public class AxesProperties
    {
        /// <summary>
        /// Id de la referencia angular asociada al eje
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AngularReferenceId { get; set; }

        /// <summary>
        /// Velocidad maxima que puede ser alcanzada mecanicamente segun el fabricante
        /// </summary>
        public int MaximumVelocity { get; set; }
    }
}
