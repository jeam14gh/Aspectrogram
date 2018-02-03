namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using Acloud.Entities.ValueObjects;
    using System;

    /// <summary>
    /// Representa un Threshold con Severity como propiedad adicional para facilitar el cálculo de estados de condición
    /// </summary>
    public class BandWithSeverity : Band
    {
        /// <summary>
        /// Severidad
        /// </summary>
        public int Severity { get; set; }

        /// <summary>
        /// Estampa de tiempo de la última superación del umbral(Threshold)
        /// </summary>
        public DateTime? LastTriggering { get; set; }
    }
}
