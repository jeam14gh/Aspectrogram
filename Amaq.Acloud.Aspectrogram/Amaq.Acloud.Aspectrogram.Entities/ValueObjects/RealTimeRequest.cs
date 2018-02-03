namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using System;
    using Acloud.Entities.Serializers;
    using MongoDB.Bson.Serialization.Attributes;

    /// <summary>
    /// Representa una solicitud de datos tiempo real de una subVariable específica
    /// </summary>
    public class RealTimeRequest
    {
        /// <summary>
        /// Id de la subVariable
        /// </summary>
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string SubVariableId { get; set; }

        /// <summary>
        /// Estampa de tiempo de la última solicitud
        /// </summary>
        [BsonSerializer(typeof(TimeStampSerializer))]
        public DateTime TimeStamp { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de RealTimeRequest
        /// </summary>
        /// <param name="subVariableId">Id de la subVariable</param>
        /// <param name="timeStamp">Estampa de tiempo de la última solicitud</param>
        public RealTimeRequest(string subVariableId, DateTime timeStamp)
        {
            SubVariableId = subVariableId;
            TimeStamp = timeStamp;
        }
    }
}
