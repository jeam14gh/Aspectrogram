namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using Enums;

    /// <summary>
    /// Representa la información necesaria para registrar en el servidor un nuevo evento grabado 
    /// </summary>
    public class NewRecordedEventDto
    {
        /// <summary>
        /// Id de asset
        /// </summary>
        public string AssetId { get; set; }

        /// <summary>
        /// Id de estado de condición. Solo aplica para los eventos por cambio de estado de condición
        /// </summary>
        public string StatusId { get; set; }

        /// <summary>
        /// Estampa de tiempo del comienzo del evento
        /// </summary>
        public DateTime TimeStamp { get; set; }

        /// <summary>
        /// Tipo de evento
        /// </summary>
        public EventType EventType { get; set; }

        /// <summary>
        /// Espaciamiento en segundos entre cada dato del evento
        /// </summary>
        public double Step { get; set; }

        /// <summary>
        /// Estado del evento
        /// </summary>
        public EventStatus EventStatus { get; set; }

        /// <summary>
        /// Flujo de bytes del archivo assetInfo.json
        /// </summary>
        public byte[] AssetInfoJsonBytes { get; set; }
    }
}
