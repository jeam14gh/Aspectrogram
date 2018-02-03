namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    using System.ComponentModel.DataAnnotations;

    /// <summary>
    /// Cuando se visualize el trazado de la posicion del eje se toma como punto de partida,
    /// los puntos sobre el clearance Abajo, Centro, Arriba, Izquierda y Derecha
    /// </summary>
    public enum ClearanceStartingPoint
    {
        /// <summary>
        /// Referencia de arranque en la parte inferior del clearance (por defecto para maquinas horizontales)
        /// </summary>
        [Display(Name = "Abajo")]
        Bottom = 1,

        /// <summary>
        /// Referencia de arranque en la parte central del clearance
        /// </summary>
        [Display(Name = "Centro")]
        Center = 2,

        /// <summary>
        /// Referencia de arranque en la parte superior del clearance
        /// </summary>
        [Display(Name = "Arriba")]
        Top = 3,

        /// <summary>
        /// Referencia de arranque en la parte izquierda del clearance
        /// </summary>
        [Display(Name = "Izquierda")]
        Left = 4,

        /// <summary>
        /// Referencia de arranque en la parte derecha del clearance
        /// </summary>
        [Display(Name = "Derecha")]
        Right = 5
    }
}
