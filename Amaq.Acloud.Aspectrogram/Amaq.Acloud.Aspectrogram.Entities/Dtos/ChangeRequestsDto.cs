namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using System.Collections.Generic;
    using ValueObjects;

    /// <summary>
    /// Representa un conjunto de solicitudes de cambio de información de subVariables y assets que un Asdaq Service debe
    /// tomar dinamicamente
    /// </summary>
    public class ChangeRequestsDto
    {
        /// <summary>
        /// Solicitudes de cambio de información de subVariables
        /// </summary>
        public List<ChangeRequest> SubVariableChangeRequests { get; set; }

        /// <summary>
        /// Solicitudes de cambio de información de assets
        /// </summary>
        public List<ChangeRequest> AssetChangeRequests { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de ChangeRequests
        /// </summary>
        /// <param name="subVariableChangeRequests"></param>
        /// <param name="assetChangeRequests"></param>
        public ChangeRequestsDto(List<ChangeRequest> subVariableChangeRequests, List<ChangeRequest> assetChangeRequests)
        {
            SubVariableChangeRequests = subVariableChangeRequests;
            AssetChangeRequests = assetChangeRequests;
        }

        public ChangeRequestsDto()
        {
        }
    }
}
