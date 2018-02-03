namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using Libraries.MongoRepository.Attributes;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;

    /// <summary>
    /// Representa la configuración de notificaciones de un usuario para un evento de activo en particular
    /// </summary>
    public class NotificationReceiver
    {
        /// <summary>
        /// Id del usuario
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; }

        /// <summary>
        /// Valor lógico que indica si se envían o no correos electrónicos de notificación de evento al usuario
        /// </summary>
        public bool SendMail { get; set; }

        /// <summary>
        /// Valor lógico que indica si se envían o no mensajes SMS de notificación de evento al usuario
        /// </summary>
        public bool SendSms { get; set; }

        /// <summary>
        /// Correo electrónico donde se envían las notificaciones
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public string Email { get; set; }

        /// <summary>
        /// Número de celular donde se envían las notificaciones
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public string Cellphone { get; set; }
    }
}
