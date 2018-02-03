namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using System;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;
    using Acloud.Entities.Serializers;

    /// <summary>
    /// Representa la configuración de almacenamiento de datos históricos por estado de condición
    /// </summary>
    public class HistoricalConfigurationByStatus
    {
        /// <summary>
        /// Id del estado
        /// </summary>
        [BsonRepresentation(BsonType.ObjectId)]
        public string StatusId { get; set; }

        /// <summary>
        /// Activar o desactivar
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Intervalo de tiempo en minutos que indica cada cuanto se suben datos históricos para el mismo estado de condición
        /// </summary>
        public double Interval { get; set; }

        /// <summary>
        /// Estampa de tiempo de los últimos datos históricos guardados debido el estado de condición
        /// </summary>
        [Amaq.Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public DateTime? LastSavedHistorical { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de HistoricalConfigurationByStatus
        /// </summary>
        /// <param name="statusId">Id de estado</param>
        /// <param name="enabled">Activar o desactivar la grabación de este tipo de evento</param>
        /// <param name="interval">Intervalo de tiempo en minutos que indica cada cuanto se suben datos históricos para el mismo estado de condición</param>
        public HistoricalConfigurationByStatus(string statusId, bool enabled, double interval)
        {
            StatusId = statusId;
            Enabled = enabled;
            Interval = interval;
        }
    }
}
