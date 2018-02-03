namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    /// <summary>
    /// Tipos de medida derivados de una señal
    /// </summary>
    public enum MeasureType
    {
        /// <summary>
        /// Valor pico(pk)
        /// </summary>
        Peak = 1,
        /// <summary>
        /// Valor pico pico(pkpk)
        /// </summary>
        PeakToPeak = 2,
        /// <summary>
        /// Valor RMS
        /// </summary>
        Rms = 3,
        /// <summary>
        /// Valor de amplitud 1x
        /// </summary>
        Amplitude1x = 4,
        /// <summary>
        /// Valor de fase
        /// </summary>
        Phase = 5,
        /// <summary>
        /// Valor de fase 1x
        /// </summary>
        Phase1x = 6,
        /// <summary>
        /// Valor GAP en voltios
        /// </summary>
        Gap = 7,
        /// <summary>
        /// Valor promedio
        /// </summary>
        Average = 8,
        /// <summary>
        /// Valor de velocidad en Rpm. Solo aplica para los puntos de medición de referencia angular
        /// </summary>
        Rpm = 9,
        /// <summary>
        /// Valor de desplazamiento axial para análisis Thrust Bearing
        /// </summary>
        AxialPosition = 10,
        /// <summary>
        /// Amplitud de flujo magnetico
        /// </summary>
        MagneticFluxAmplitude = 11,
        /// <summary>
        /// Fase de flujo magnetico
        /// </summary>
        MagneticFluxPhase = 12
    }
}
