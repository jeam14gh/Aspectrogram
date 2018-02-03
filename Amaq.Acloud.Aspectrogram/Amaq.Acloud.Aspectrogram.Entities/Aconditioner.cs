namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Amaq.Libraries.MongoDbRepository;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;
    using System.Collections.Generic;

    /// <summary>
    /// Representa un dispositivo Aconditioner desarrollado por A-MAQ
    /// </summary>
    public class Aconditioner
    {
        /// <summary>
        /// Id de un tipo Aconditioner
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AconditionerTypeId { get; set; }

        /// <summary>
        /// Serial de un dispositivo Aconditioner
        /// </summary>
        public string Serial { get; set; }

        /// <summary>
        /// Nombre del Aconditioner de un Asdaq
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Descripción del Aconditioner de un Asdaq
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Lista de canales Aconditioner de un Asdaq
        /// </summary>
        public List<Channel> AconChannels { get; set; }
    }
}
