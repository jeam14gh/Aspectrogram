namespace Amaq.Acloud.AsdaqService.Models
{
    using System.IO;

    /// <summary>
    /// Representa un paquete de un evento
    /// </summary>
    public class EventPackage
    {
        /// <summary>
        /// La parte del paquete donde se almacenan los datos globales
        /// </summary>
        public BinaryWriter OverallsPart { get; set; }

        /// <summary>
        /// La parte del paquete donde se almacenan las formas de onda
        /// </summary>
        public BinaryWriter WaveformsPart { get; set; }

        /// <summary>
        /// Escribe en el paquete los bytes de overalls y waveforms especificados
        /// </summary>
        /// <param name="overallsBytes">Flujo de bytes de datos globales</param>
        /// <param name="waveformsBytes">Flujo de bytes de formas de onda</param>
        public void Write(byte[] overallsBytes, byte[] waveformsBytes)
        {
            OverallsPart.Write(overallsBytes);
            WaveformsPart.Write(waveformsBytes);
        }

        /// <summary>
        /// Guarda cambios y cierra las partes del paquete
        /// </summary>
        public void Close()
        {
            OverallsPart.Flush();
            OverallsPart.Close();
            WaveformsPart.Flush();
            WaveformsPart.Close();
        }
    }
}
