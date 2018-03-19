namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using System;
    using System.Collections.Generic;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;
    using Acloud.Entities.Serializers;
    using Enums;
    using Newtonsoft.Json;

    /// <summary>
    /// Representa la configuración de grabación de evento para un estado de condición específico
    /// </summary>
    public class ConditionStatusEventConfig
    {
        /// <summary>
        /// Id del estado
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string StatusId { get; set; }

        /// <summary>
        /// Activar o desactivar la grabación de este tipo de evento
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Intervalo de tiempo en minutos que indica cada cuanto se graba un evento de este tipo
        /// en caso de que se repita el estado muy frecuentemente
        /// </summary>
        public double Interval { get; set; }

        /// <summary>
        /// Máxima cantidad de minutos antes de ocurrir el evento que se van a guardar
        /// </summary>
        public double MinutesBefore { get; set; }

        /// <summary>
        /// Máxima cantidad de minutos despues de ocurrir el evento que se van a guardar
        /// </summary>
        public double MinutesAfter { get; set; }

        /// <summary>
        /// Lista de usuarios notificados por el disparo de este evento
        /// </summary>
        public List<NotificationReceiver> NotifyList { get; set; }

        /// <summary>
        /// Estampa de tiempo del último evento grabado
        /// </summary>
        //[Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        //[BsonIgnore]
        [BsonIgnoreIfNull]
        public DateTime? LastSavedEvent { get; set; }

        ///// <summary>
        ///// Valor lógico que indica si los minutos antes para el evento ya fueron guardados en la base de datos
        ///// </summary>
        //[Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        //[BsonIgnore]
        //public bool MinutesBeforeStored { get; set; }

        /// <summary>
        /// Accion dinámica sobre la configuración del evento
        /// </summary>
        [Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public DynamicActionOnEvent DynamicActionOnEvent { get; set; }

        /// <summary>
        /// Cambios en la configuración del evento que deben aplicarse. Solo aplica si DynamicActoinOnEvent es igual a Update
        /// </summary>
        [Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public ConditionStatusEventConfig ConfigChanges { get; set; }

        /// <summary>
        /// Plantilla del correo en la configuración de eventos por estados de condición de un activo principal
        /// </summary>
        [BsonIgnoreIfNull]
        public MailLayout MailLayout { get; set; }

        /// <summary>
        /// Cosntructor vacio por defecto
        /// </summary>
        public ConditionStatusEventConfig() { }

        /// <summary>
        /// Inicializa una nueva instancia de EventConfiguration
        /// </summary>
        /// <param name="statusId">Id de estado</param>
        /// <param name="enabled">Activar o desactivar la grabación de este tipo de evento</param>
        /// <param name="interval">Intervalo de tiempo en minutos que indica cada cuanto se graba un evento de este tipo 
        /// en caso de que se repita el estado muy frecuentemente</param>
        /// <param name="minutesBefore">Máxima cantidad de minutos antes de ocurrir el evento que se van a guardar</param>
        /// <param name="minutesAfter">Máxima cantidad de minutos despues de ocurrir el evento que se van a guardar</param>
        public ConditionStatusEventConfig(string statusId, bool enabled, double interval, double minutesBefore, double minutesAfter)
        {
            StatusId = statusId;
            Enabled = enabled;
            Interval = interval;
            MinutesBefore = minutesBefore;
            MinutesAfter = minutesAfter;
        }
    }

    /// <summary>
    /// Representa la configuración de grabación de evento por transitorios de rpm (Cambios de velocidad)
    /// </summary>
    public class RpmEventConfig
    {
        /// <summary>
        /// Id de la MdVariable que actúa como referencia angular
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string AngularReferenceId { get; set; }

        /// <summary>
        /// Activar o desactivar la grabación de este tipo de evento
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Delta de Rpm, que al superarse o igualarse dispara la grabación detallada
        /// </summary>
        public double DeltaRpm { get; set; }

        /// <summary>
        /// Determina el valor mínimo de Rpm de arranque donde se considera que el asset está en estado transitorio
        /// </summary>
        public double LowRpm { get; set; }

        /// <summary>
        /// Determina el valor máximo de Rpm de arranque donde se considera que el asset está en estado transitorio
        /// </summary>
        public double UpperRpm { get; set; }

        /// <summary>
        /// Máxima cantidad de minutos antes, que se van a grabar luego de dispararse la eventualidad
        /// </summary>
        public double MinutesBefore { get; set; }

        /// <summary>
        /// Máxima cantidad de minutos despues, que se van a grabar luego de dispararse la eventualidad
        /// </summary>
        public double MinutesAfter { get; set; }

        /// <summary>
        /// Lista de usuarios notificados por el disparo de este evento
        /// </summary>
        public List<NotificationReceiver> NotifyList { get; set; }

        /// <summary>
        /// Estampa de tiempo del último cambio de velocidad detectado por el  sistema
        /// </summary>
        [Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public DateTime LastEvent { get; set; }

        ///// <summary>
        ///// Valor lógico que indica si los minutos antes para el evento ya fueron guardados en la base de datos
        ///// </summary>
        //[Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        //[BsonIgnore]
        //public bool MinutesBeforeStored { get; set; }

        /// <summary>
        /// Accion dinámica sobre la configuración del evento
        /// </summary>
        [Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public DynamicActionOnEvent DynamicActionOnEvent { get; set; }

        /// <summary>
        /// Cambios en la configuración del evento que deben aplicarse. Solo aplica si DynamicActoinOnEvent es igual a Update
        /// </summary>
        [Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public RpmEventConfig ConfigChanges { get; set; }

        /// <summary>
        /// Constructor RpmEventConfig por defecto
        /// </summary>
        public RpmEventConfig() { }

        /// <summary>
        /// Inicializa una nueva instancia de EventConfiguration
        /// </summary>
        /// <param name="angularReferenceId">Id de la MdVariable que actúa como referencia angular</param>
        /// <param name="enabled">Activar o desactivar la grabación de este tipo de evento</param>
        /// <param name="rpmDelta">Delta de Rpm, que al superarse o igualarse dispara la grabación detallada</param>
        /// <param name="minutesBefore">Máxima cantidad de minutos antes, que se van a grabar luego de dispararse la eventualidad</param>
        /// <param name="minutesAfter">Máxima cantidad de minutos despues, que se van a grabar luego de dispararse la eventualidad</param>
        public RpmEventConfig(string angularReferenceId, bool enabled, double rpmDelta, double minutesBefore, double minutesAfter)
        {
            AngularReferenceId = angularReferenceId;
            Enabled = enabled;
            DeltaRpm = rpmDelta;
            MinutesBefore = minutesBefore;
            MinutesAfter = minutesAfter;
        }
    }

    /// <summary>
    /// Representa un evento programado por el usuario para ser grabado en una fecha y hora específica
    /// </summary>
    public class ScheduledEvent
    {
        /// <summary>
        /// Fecha y hora en la cual se va a comezar a grabar el evento
        /// </summary>
        [BsonSerializer(typeof(TimeStampSerializer))]
        public DateTime StartingTimeStamp { get; set; }

        /// <summary>
        /// Duración total en minutos que se va a grabar. El valor por defecto es 0, el cual indica que el evento solo se 
        /// detendrá por acción de usuario que indica detener la grabación del evento
        /// </summary>
        public double Duration { get; set; }
    }
}
