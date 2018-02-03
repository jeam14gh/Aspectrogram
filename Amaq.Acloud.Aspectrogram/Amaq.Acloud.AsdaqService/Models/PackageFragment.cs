namespace Amaq.Acloud.AsdaqService.Models
{
    /// <summary>
    /// Representa un fragmento de un paquete de evento(EventPackage)
    /// </summary>
    public class PackageFragment
    {
        /// <summary>
        /// Flujo de bytes de datos globales
        /// </summary>
        public byte[] OverallsBuffer { get; set; }
        /// <summary>
        /// Flujo de bytes de formas de onda
        /// </summary>
        public byte[] WaveformsBuffer { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de PackageFragment
        /// </summary>
        /// <param name="overallsBuffer">Flujo de bytes de valores globales</param>
        /// <param name="waveformsBuffer">Flujo de bytes de formas de onda</param>
        public PackageFragment(byte[] overallsBuffer, byte[] waveformsBuffer)
        {
            OverallsBuffer = overallsBuffer;
            WaveformsBuffer = waveformsBuffer;
        }
    }
}
