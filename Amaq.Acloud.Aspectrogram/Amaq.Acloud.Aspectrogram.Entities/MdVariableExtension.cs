namespace Amaq.Acloud.Aspectrogram.Entities
{
    using System.Collections.Generic;
    using Acloud.Entities.Core;
    using MongoDB.Bson.Serialization.Attributes;
    using ValueObjects;
    using MongoDB.Bson;
    using Libraries.MongoRepository.Attributes;
    using Enums;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Converters;

    /// <summary>
    /// Extensión de la entidad MdVariable
    /// </summary>
    public class MdVariableExtension : MdVariable
    {
        /// <summary>
        ///  Configuración necesaria para la llamada dinámica a un método AiChannel de National Instruments
        /// </summary>
        [BsonIgnoreIfNull]
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public AiMeasureMethod AiMeasureMethod { get; set; }
        
        /// <summary>
        /// Valor de sensibilidad del sensor asociado al punto de medición, siempre está en milivoltios/unidad
        /// </summary>
        //[IgnoreDefaultProperty]
        [BsonIgnoreIfDefault]
        public double Sensibility { get; set; }

        /// <summary>
        /// Código del tipo de sensor
        /// </summary>
        public int SensorTypeCode { get; set; }

        /// <summary>
        /// Angulo (degrees) segun fue posicionado el sensor
        /// </summary>
        public double SensorAngle { get; set; }

        /// <summary>
        /// Valor lógico que indica si el punto de medición es o no una marca de paso
        /// </summary>
        public bool IsAngularReference { get; set; }

        /// <summary>
        /// Configuracion de parametros de referencia angular o marca de paso
        /// </summary>
        [BsonIgnoreIfNull]
        public AngularReferenceConfig AngularReferenceConfig { get; set; }

        /// <summary>
        /// Valor lógico que indica si la forma de onda se debe integrar con la regla trapezoidal.
        /// Esta opción solo aplica para acelerómetros y velocímetros
        /// </summary>
        [BsonRepresentation(BsonType.Boolean)]
        public bool Integrate { get; set; }

        /// <summary>
        /// Id de la MdVariable que actúa como sensor de referencia angular para el punto de medición
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AngularReferenceId { get; set; }

        /// <summary>
        /// Sentido de giro del eje.
        /// Esta propiedad se debe configurar unicamente para el sensor de referencia angular,
        /// esto debido a que una maquina puede tener varios ejes.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter))]
        [BsonIgnoreIfDefault]
        [BsonRepresentation(BsonType.String)]
        public RotationDirection RotationDirection { get; set; }

        /// <summary>
        /// Valor numerico que indica cuantas muestras de las muestras adquiridas se van a almacenar en la base de datos. El valor debe ser un número menor o igual
        /// que SamplesToRead, si el valor es menor, entonces la resolución de la señal disminuye
        /// </summary>
        public int SamplesToDb { get; set; }
   
        /// <summary>
        /// Unidad en la que se expresa el valor de la MdVariable.
        /// </summary>
        [BsonElement("Units")]
        [BsonRepresentation(BsonType.String)]
        public string Units { get; set; }

        #region IgnoredProperties

        /// <summary>
        /// CAT: COMENTAR
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonIgnore]
        public string SamplesAcquiredFullId { get; set; }

        /// <summary>
        /// Nombre del dispositivo National Instruments donde se van a buscar las muestras adquiridas para la MdVariable
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonIgnore]
        public string SamplesAcquiredDeviceId { get; set; }

        /// <summary>
        /// Indice para buscar las muestras adquiridas para la MdVariable
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonIgnore]
        public int SamplesAcquiredIndex { get; set; }

        /// <summary>
        /// Últimas muestras adquiridas
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [BsonIgnore]
        public double[] SamplesAcquired { get; set; }

        /// <summary>
        /// Forma de onda integrada. Solo aplica si el sensor en acelerómetro y velocímetro
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public double[] IntegratedWaveform { get; set; }

        /// <summary>
        /// Lista de subVariables asociados al punto de medicion
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public List<SubVariableExtension> SubVariables { get; set; }

        /// <summary>
        /// Id del punto de medicion asociado (Par)
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public string AssociatedMeasurementPointId { get; set; }

        /// <summary>
        /// Clearence del punto de medicion
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public double Clearance { get; set; }

        /// <summary>
        /// Referencia de Gap
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public double GapReference { get; set; }

        /// <summary>
        /// Referencia de Amplitud 1X (Compensacion). Aplica solo para MeasureType = Amplitude1X
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public double CompAmp1X { get; set; }

        /// <summary>
        /// Referencia de Fase 1X (Compensacion). Aplica solo para MeasureType = Phase1X
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public double CompPhase1X { get; set; }

        /// <summary>
        /// Posicion inicial de graficacion del clearance
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public int ClearanceStartingPosition { get; set; }

        /// <summary>
        /// Orientacion del punto de medicion
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public SensorOrientation Orientation { get; set; }

        /// <summary>
        /// Id del asset principal padre
        /// </summary>
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        [IgnoreProperty]
        [BsonIgnore]
        public string PrincipalAssetId { get; set; }

        /// <summary>
        /// Posición del primer flanco de referencia angular
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public uint[] AngularPositions { get; set; }
        
        /// <summary>
        /// Cantidad de señales entre el primer flanco y el último flanco, necesario para los cálculos de
        /// Rpm, Amplitud 1x y fase 1x.
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public int Step { get; set; }
        
        #endregion

        /// <summary>
        /// Representa los parámetros de un sensor RTD
        /// </summary>        
        [BsonIgnoreIfNull]
        public RTDParams RtdParams { get; set; }

        /// <summary>
        /// Representa los parámetros de un sensor de corriente
        /// </summary>        
        [BsonIgnoreIfNull]
        public CurrentParams CurrentParams { get; set; }

        /// <summary>
        /// Representa los parámetros de un sensor de voltaje
        /// </summary>        
        [BsonIgnoreIfNull]
        public VoltageParams VoltageParams { get; set; }

        /// <summary>
        /// Representa los parámetros de un sensor de flujo magnético
        /// </summary>
        [BsonIgnoreIfNull]
        public MagneticFlowParams MagneticFlowParams { get; set; }

        /// <summary>
        /// Posición del punto de medición con relación al listBox
        /// </summary>
        public int OrderPosition { get; set; }
    }
}
