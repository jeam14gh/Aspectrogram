namespace Amaq.Acloud.AsdaqService.Models
{
    using System.Threading.Tasks;
    using Helpers;

    /// <summary>
    /// Representa una unidad de adquisición de señales
    /// </summary>
    internal class AcquisitionUnit
    {
        /// <summary>
        /// Unidad de adquisición National Instruments
        /// </summary>
        public NiAcquisition NiAcquisition { get; set; }
        /// <summary>
        /// Subproceso que se encarga de procesar las señales adquiridas
        /// </summary>
        public Task Processor { get; set; }

        /// <summary>
        /// Subproceso que se encarga de actualizar los datos tiempo real en la base de datos
        /// </summary>
        public Task UpdateRealtimeProcessor { get; set; }

        /// <summary>
        /// Subproceso que se encarga de actualizar los datos tiempo real en la base de datos HMI
        /// </summary>
        public Task UpdateRealtimeProcessorForHMI { get; set; }

        /// <summary>
        /// Subproceso que se encarga de la gestión de datos históricos
        /// </summary>
        public Task HistoricalDataProcessor { get; set; }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="niAcquisition">Unidad de adquisición National Instruments</param>
        public AcquisitionUnit(NiAcquisition niAcquisition)
        {
            NiAcquisition = niAcquisition;
        }
    }
}
