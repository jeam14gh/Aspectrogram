namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using System;

    /// <summary>
    /// Representa la información necesaria para especificar la estampa de tiempo del último evento generado
    /// para determinado estado de condición de un activo
    /// </summary>
    public class LastSavedEventDto
    {
        /// <summary>
        /// Id del activo
        /// </summary>
        public string AssetId { get; set; }

        /// <summary>
        /// Id del estado de condición
        /// </summary>
        public string StatusId { get; set; }

        /// <summary>
        /// Estampa de tiempo del último evento generado
        /// </summary>
        public DateTime? LastSavedEvent { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de LastSavedEventDto
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <param name="statusId">Id del estado de condición</param>
        /// <param name="lastSavedEvent">Estampa de tiempo del último evento generado</param>
        public LastSavedEventDto(string assetId, string statusId, DateTime? lastSavedEvent)
        {
            AssetId = assetId;
            StatusId = statusId;
            LastSavedEvent = lastSavedEvent;
        }
    }
}
