namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    /// <summary>
    /// Estado de un evento
    /// </summary>
    public enum EventStatus
    {
        /// <summary>
        /// El evento actualmente se está grabando
        /// </summary>
        Recording = 1,
        /// <summary>
        /// El evento está grabado completamente pero está siendo transferido desde el asdaq hacia el servidor
        /// </summary>
        Uploading = 2,
        /// <summary>
        /// El evento está grabado completamente pero no ha sido leido por un usuario
        /// </summary>
        Unread = 3,
        /// <summary>
        /// El evento está grabado completamente y ha sido leido por un usuario
        /// </summary>
        Read = 4,
    }
}
