namespace Amaq.Acloud.AsdaqService.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Representa el estado de condición actual para un elemento(Asset, MdVariable, etc...)
    /// </summary>
    public class CurrentStatus
    {
        /// <summary>
        /// Id de estado
        /// </summary>
        public string StatusId { get; set; }

        /// <summary>
        /// Severidad
        /// </summary>
        public int Severity { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de CurrentStatus
        /// </summary>
        public CurrentStatus()
        {

        }

        /// <summary>
        /// Incializa una nueva instancia de CurrentStatus
        /// </summary>
        /// <param name="statusId">Id de estado</param>
        /// <param name="severity">Severidad</param>
        public CurrentStatus(string statusId, int severity)
        {
            StatusId = statusId;
            Severity = severity;
        }
    }

    /// <summary>
    /// Representa el estado de condición actual para un asset
    /// </summary>
    public class CurrentStatusByAsset
    {
        /// <summary>
        /// Id de estado
        /// </summary>
        public string StatusId { get; set; }
        /// <summary>
        /// Estampa de tiempo del estado de condición actual
        /// </summary>
        public DateTime? TimeStamp { get; set; }

        /// <summary>
        /// Estado de condición actual para cada uno de los measurementPoint asociados al asset
        /// </summary>
        public Dictionary<string, CurrentStatus> CurrentStatusByMeasurementPoint { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de CurrentStatus
        /// </summary>
        /// <param name="statusId">Id de estado</param>
        /// <param name="timeStamp">Estampa de tiempo</param>
        /// <param name="currentStatusByMeasurementPoint">Diccionario de estado de condición por measurementPoint</param>
        public CurrentStatusByAsset(string statusId, DateTime? timeStamp, Dictionary<string, CurrentStatus> currentStatusByMeasurementPoint)
        {
            StatusId = statusId;
            TimeStamp = timeStamp;
            CurrentStatusByMeasurementPoint = currentStatusByMeasurementPoint;
        }
    }
}
