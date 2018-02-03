namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Representa los id de los dos archivos que conforman un paquete de evento
    /// </summary>
    public class EventPackageFilesId
    {
        /// <summary>
        /// Id en GridFS del archivo que contiene los datos globales del paquete de evento
        /// </summary>
        public string OverallsPartId { get; set; }
        /// <summary>
        /// Id en GridFS del archivo que contiene las formas de onda del paquete de evento
        /// </summary>
        public string WaveformsPartId { get; set; }
    }
}
