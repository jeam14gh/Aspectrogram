
namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Amaq.Libraries.MongoRepository.Attributes;
    using MongoDB.Bson.Serialization.Attributes;
    /// <summary>
    /// Representa la clase base de un canal análogo de entrada
    /// </summary>
    public class AiChannelBase
    {
        /// <summary>
        /// Corresponde al nombre físico del canal usado por National Instruments
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// Si es true, indica que el sistema va a adquirir por dicho canal pero no lo va incluir en la lógica de negocio.
        /// Un canal en estado bypass permite que se pueda verificar si el canal está bueno
        /// </summary>
        public bool ByPassed { get; set; }
        /// <summary>
        /// Si es false, indica que el sistema no va a hacer nada con el canal
        /// </summary>
        public bool Enabled { get; set; }
        /// <summary>
        /// Relación uno a uno con MdVariable
        /// </summary>
        public string MdVariableId { get; set; }

        /// <summary>
        /// Factor de preamplificación del A-CONDITIONER, si el canal no está conectado a un A-CONDITIONER el valor por defecto debe ser 1
        /// </summary>
        public double AconditionerFactor { get; set; }

        /// <summary>
        /// Tag de MdVariable
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public string MdVariableTag { get; set; }

        /// <summary>
        /// AssetId que representa el parentId de la MdVariableId
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public string AssetId { get; set; }

        /// <summary>
        /// Si es verdadero, indica que el punto de medición asociado al canal debe desligarse de éste
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public bool Disassociate { get; set; }

        /// <summary>
        /// Serial único de un Aconditioner
        /// </summary>
        [BsonIgnoreIfNull]
        public string SerialAcon { get; set; }

        /// <summary>
        /// Número del canal de un Aconditioner
        /// </summary>
        [BsonIgnoreIfNull]
        public int? AconChannel { get; set; }

        /// <summary>
        /// 
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public bool ExcitationIEPE { get; set; }

        /// <summary>
        /// Código del tipo de sensor de un punto de medición
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public int SensorTypeCode { get; set; }
    }
}
