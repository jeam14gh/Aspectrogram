namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using Enums;

    /// <summary>
    /// Entidad asset
    /// </summary>
    public class AssetToUpdateDto
    {
        /// <summary>
        /// Id del asset
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Nombre del asset
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Descripción del asset
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Intervalo de tiempo en minutos que indica cada cuanto tiempo se suben datos históricos de las subVariables de los measurementPoints del asset
        /// </summary>
        public double NormalInterval { get; set; }

        /// <summary>
        /// Opciones de multiplicación para los umbrales de estado de condición en etapas transientes de una máquina(Arranque/Parada).
        /// </summary>
        public TripMultiply TripMultiply { get; set; }

        /// <summary>
        /// Cuando el activo deje de cambiar su velocidad, cuanto tiempo en segundos se va a seguir asumiendo que el activo está en estado transitorio o transiente.
        /// </summary>
        public double TransientStatusTimeout { get; set; }
    }
}
