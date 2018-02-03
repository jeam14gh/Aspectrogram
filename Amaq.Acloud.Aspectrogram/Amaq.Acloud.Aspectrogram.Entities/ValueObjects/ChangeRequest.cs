namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using MongoDB.Bson.Serialization.Attributes;

    /// <summary>
    /// Representa una solicitud de cambio de información de subVariable o asset que un Asdaq Service debe
    /// tomar dinamicamente
    /// </summary>
    public class ChangeRequest
    {
        /// <summary>
        /// Id de la entidad
        /// </summary>
        [BsonRepresentation(MongoDB.Bson.BsonType.ObjectId)]
        public string EntityId { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de ChangeRequest
        /// </summary>
        /// <param name="entityId"></param>
        public ChangeRequest(string entityId)
        {
            EntityId = entityId;
        }
    }
}
