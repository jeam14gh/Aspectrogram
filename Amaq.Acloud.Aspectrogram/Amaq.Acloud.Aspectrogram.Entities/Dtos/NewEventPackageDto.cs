namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using Enums;

    /// <summary>
    /// Representa la información necesaria para registrar un paquete de evento en el servidor
    /// </summary>
    public class NewEventPackageDto
    {
        /// <summary>
        /// Id de RecordedEvent
        /// </summary>
        public string RecordedEventId { get; set; }
        /// <summary>
        /// Estado del evento
        /// </summary>
        public EventStatus EventStatus { get; set; }
        /// <summary>
        /// Valor lógico que indica si el paquete actual representa el final del evento
        /// </summary>
        public bool EndOfEvent { get; set; }
        /// <summary>
        /// Indice o consecutivo del paquete de evento
        /// </summary>
        public int PackageIndex { get; set; }
        /// <summary>
        /// Duración en minutos del paquete de evento
        /// </summary>
        public double PackageDuration { get; set; }
        /// <summary>
        /// Flujo de bytes de los datos globales del paquete
        /// </summary>
        public byte[] OverallsPart { get; set; }
        /// <summary>
        /// Flujo de bytes de las formas de onda del paquete
        /// </summary>
        public byte[] WaveformsPart { get; set; }
    }

    /// <summary>
    /// Utilidad para recuperar de forma individual un parte del paquete almacenado (overall + waveform)
    /// </summary>
    public class SingleEventPackageDto
    {
        /// <summary>
        /// Flujo de bytes de los datos globales del paquete
        /// </summary>
        public byte[] OverallPart { get; set; }
        /// <summary>
        /// Flujo de bytes de las formas de onda del paquete
        /// </summary>
        public byte[] WaveformPart { get; set; }
    }
}
