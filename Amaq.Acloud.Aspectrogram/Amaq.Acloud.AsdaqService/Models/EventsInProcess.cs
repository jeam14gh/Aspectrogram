namespace Amaq.Acloud.AsdaqService.Models
{
    using Amaq.Acloud.Aspectrogram.Entities.ValueObjects;

    /// <summary>
    /// Representa los eventos que se están procesando para un asset
    /// </summary>
    public class EventsInProcess
    {
        /// <summary>
        /// Valor lógico que indica si se está almacenando actualmente el tiempo antes para el evento actual
        /// </summary>
        public bool StoringMinutesBefore { get; set; }

        /// <summary>
        /// Valor lógico que indica si ya se almacenó o no el tiempo antes para el evento actual
        /// </summary>
        public bool MinutesBeforeStored { get; set; }

        /// <summary>
        /// Evento por estado de condición en proceso
        /// </summary>
        public ConditionStatusEventConfig ConditionStatusEvent { get; set; }

        /// <summary>
        /// Evento por cambios de Rpm en proceso
        /// </summary>
        public RpmEventConfig RpmEvent { get; set; }

        /// <summary>
        /// Valor lógico que indica si el registro se generó por un cambio de RPM
        /// </summary>
        public bool IsChangeOfRpm { get; set; }

        /// <summary>
        /// Valor lógico que indica si el registro se generó por un cambio de estado de condición
        /// </summary>
        public bool IsChangeOfConditionStatus { get; set; }

        /// <summary>
        /// Valor lógico que indica si el registro se generó por cumplir la validación de NormalInterval
        /// </summary>
        public bool IsNormal { get; set; }
    }
}
