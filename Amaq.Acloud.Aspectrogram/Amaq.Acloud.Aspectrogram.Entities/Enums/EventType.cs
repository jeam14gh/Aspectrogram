namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    /// <summary>
    /// Tipos de evento que puede grabar el sistema Asdaq
    /// </summary>
    public enum EventType
    {
        /// <summary>
        /// Evento programado por el usuario
        /// </summary>
        Scheduled = 1,
        /// <summary>
        /// Evento por arranque o parada basado en medidas de velocidad
        /// </summary>
        Rpm = 2,
        /// <summary>
        /// Evento por cambio de estado de condición
        /// </summary>
        ConditionStatus = 3
    }
}
