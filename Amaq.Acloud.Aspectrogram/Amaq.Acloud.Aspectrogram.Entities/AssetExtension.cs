namespace Amaq.Acloud.Aspectrogram.Entities
{
    using System;
    using System.Collections.Generic;
    using Acloud.Entities.Core;
    using MongoDB.Bson.Serialization.Attributes;
    using ValueObjects;
    using Libraries.MongoRepository.Attributes;
    using MongoDB.Bson;
    using Newtonsoft.Json;
    using Enums;
    /// <summary>
    /// Extensión de la entidad Asset
    /// </summary>
    public class AssetExtension : Asset
    {
        /// <summary>
        /// Id del Asdaq asociado a un asset gestionado con el sistema Asdaq / Aspectrogram
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AsdaqId { get; set; }

        /// <summary>
        /// Propiedades de los ejes de la maquina
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public List<AxesProperties> AxesProperties { get; set; }


        /// <summary>
        /// Velocidad Nominal del activo
        /// </summary>
        [BsonIgnoreIfDefault]
        public double NominalVelocity { get; set; }

        /// <summary>
        /// Intervalo de tiempo en minutos que indica cada cuanto tiempo se suben datos históricos de las subVariables de los measurementPoints del asset
        /// </summary>
        [BsonIgnoreIfDefault]
        public double NormalInterval { get; set; }

        /// <summary>
        /// Lista de configuración de eventos por estado de condición
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public List<ConditionStatusEventConfig> ConditionStatusEventsConfig { get; set; }

        /// <summary>
        /// Configuración de almacenamiento datos por transitorios de velocidad (Cambios de velocidad)
        /// </summary>
        [BsonIgnoreIfNull]
        public RpmEventConfig RpmEventConfig { get; set; }

        /// <summary>
        /// Lista de eventos programados por el usuario para grabarse en fechas y horas especificas.
        /// Esta lista es depurada a medida que el sistema Asdaq va disparando la grabación de los eventos
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public List<ScheduledEvent> ScheduledEvents { get; set; }

        /// <summary>
        /// Valor lógico que indica si el asset es el asset principal en una jerarquía de assets
        /// </summary>
        public bool IsPrincipal { get; set; }

        /// <summary>
        /// Id del asset principal en la jerarquía de assets, es decir el id del primer asset de la jerarquía
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string PrincipalAssetId { get; set; }

        /// <summary>
        /// Opción de multiplicación para los umbrales de estado de condición en etapas transientes de un activo de tipo maquinaria rotativa(Arranque/Parada).
        /// </summary>
        [BsonDefaultValue(TripMultiply.None)]
        public TripMultiply TripMultiply { get; set; }

        /// <summary>
        /// Cuando el activo deje de cambiar su velocidad, cuanto tiempo en segundos se va a seguir asumiendo que el activo está en estado transitorio o transiente.
        /// </summary>
        public double TransientStatusTimeout { get; set; }

        /// <summary>
        /// Estampa de tiempo del último cambio de rpm detectado
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public DateTime LastChangeOfRpm { get; set; }

        /// <summary>
        /// Estampa de tiempo de la última vez que se detectó evento por intervalo normal
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public DateTime? LastNormalInterval { get; set; }

        /// <summary>
        /// Intervalo en segundos entre adquisiciones de señales para la unidad de adquisición asociada al asset
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public double SecondsBetweenAcquisitions { get; set; }

        /// <summary>
        /// Cantidad máxima de registros de tiempo antes que debe mantener el activo
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public int BufferCapacity { get; set; }

        /// <summary>
        /// Valor lógico que indica si el asset cumple los requisitos para la detección de eventos por cambios de rpm
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public bool CanDetectRpmEvent { get; set; }

        /// <summary>
        /// Último delta de Rpm detectado
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public double? LastDeltaRpmTriggered { get; set; }

        /// <summary>
        /// Valor lógico que indica si el asset está girando o no
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public bool IsRotating { get; set; }

        /// <summary>
        /// Id del Atr asociado a un asset gestionado con el sistema Atr / Aspectrogram
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AtrId { get; set; }

        /// <summary>
        /// Cantidad limite de registros de datos históricos que se suben al servidor principal por cada transacción
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public int HistoricalDataUploadLimit { get; set; }
    }
}
