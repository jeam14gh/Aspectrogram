namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using System.ComponentModel.DataAnnotations;
    /// <summary>
    /// Representa la configuración para una MdVariable con la propiedad IsAngularReference con valor true
    /// </summary>
    public class AngularReferenceConfig
    {
        /// <summary>
        /// Ruido en voltios a partir del cual se detectan flancos
        /// </summary>
        
        public double MinimumNoiseInVolts { get; set; }

        /// <summary>
        /// Primer umbral del Schmitt Trigger
        /// </summary>
        public double TresholdPercentage { get; set; }

        /// <summary>
        /// Umbral de histeresis del Schmitt Trigger
        /// </summary>
        public double HysteresisTresholdPercentage { get; set; }
    }
}
