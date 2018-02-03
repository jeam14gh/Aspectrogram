namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Libraries.MongoDbRepository;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;

    /// <summary>
    /// Representa un tipo de sensor, el cual influye en el tratamiento de la señal adquirida
    /// </summary>
    public class SensorType : Entity
    {
        /// <summary>
        /// Código del tipo de sensor, normalmente debe ser un consecutivo
        /// </summary>
        public int Code { get; set; }
        /// <summary>
        /// Nombre con el cual se identifica al tipo de sensor
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// Descripción detallada del tipo de sensor
        /// </summary>
        public string Description { get; set; }
    }
}
