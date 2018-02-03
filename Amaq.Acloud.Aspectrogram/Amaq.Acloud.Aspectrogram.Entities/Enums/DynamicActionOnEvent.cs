namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    /// <summary>
    /// Acciones dinámicas que se pueden realizar sobre la configuración de eventos de estado de condición o cambio de velocidad
    /// </summary>
    public enum DynamicActionOnEvent
    {
        /// <summary>
        /// Ninguna
        /// </summary>
        None = 1,

        /// <summary>
        /// Actualizar configuración del evento
        /// </summary>
        Update = 2,

        /// <summary>
        /// Eliminar la configuración del evento
        /// </summary>
        Delete = 3
    }
}
