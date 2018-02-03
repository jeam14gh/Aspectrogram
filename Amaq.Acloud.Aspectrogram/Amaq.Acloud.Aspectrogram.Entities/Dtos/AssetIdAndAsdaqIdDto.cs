using Amaq.Acloud.Aspectrogram.Entities.Enums;
using Amaq.Acloud.Aspectrogram.Entities.ValueObjects;
using System.Collections.Generic;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Representa la información de id de asset y asdaqId para un asset específico
    /// </summary>
    public class AssetIdAndAsdaqIdDto
    {
        /// <summary>
        /// Id de asset
        /// </summary>
        public string AssetId { get; set; }
        /// <summary>
        /// Id de asdaq
        /// </summary>
        public string AsdaqId { get; set; }

        /// <summary>
        /// Indica si el activo es principal en la jerarquia de activos
        /// </summary>
        public bool IsPrincipal { get; set; }

        /// <summary>
        /// Id del Nodo
        /// </summary>
        public string NodeId { get; set; }

        /// <summary>
        /// Id del activo principal
        /// </summary>
        public string PrincipalAssetId { get; set; }

        /// <summary>
        /// Representa la configuración de grabación de evento por transitorios de rpm (Cambios de velocidad)
        /// </summary>
        public RpmEventConfig RpmEventConfig { get; set; }

        /// <summary>
        /// Representa la configuración de grabación de evento para un estado de condición específico
        /// </summary>
        public List<ConditionStatusEventConfig> ConditionStatusEventsConfig { get; set; }

        /// <summary>
        /// Intervalo de tiempo en minutos que indica cada cuanto tiempo se suben datos históricos de las subVariables de los measurementPoints del asset
        /// </summary>
        public double NormalInterval { get; set; }

        /// <summary>
        /// Id de Atr
        /// </summary>
        public string AtrId { get; set; }

        /// <summary>
        /// Opciones de multiplicación para los umbrales de estado de condición en etapas transientes de una máquina(Arranque/Parada).
        /// </summary>
        public TripMultiply TripMultiply { get; set; }

        /// <summary>
        /// Cuando el activo deje de cambiar su velocidad, cuanto tiempo en segundos se va a seguir asumiendo que el activo está en estado transitorio o transiente.
        /// </summary>
        public double TransientStatusTimeout { get; set; }

        /// <summary>
        /// Descripción del activo
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Velocidad nominal de la máquina
        /// </summary>
        public double NominalVelocity { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de AssetIdAndAsdaqIdDto
        /// </summary>
        public AssetIdAndAsdaqIdDto()
        {

        }

        /// <summary>
        /// Incializa una nueva instancia de AssetIdAndAsdaqIdDto
        /// </summary>
        /// <param name="assetId">Id de asset</param>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="isPrincipal">Idica si el activo es principal</param>
        /// <param name="nodeId">Id del nodo en el arbol</param>
        /// <param name="principalAssetId">Id del activo principal</param>
        /// <param name="rpmEventConfig">Cambios de velocidad</param>
        /// <param name="conditionStatusEventsConfig">Estado de condición específico</param>
        /// <param name="normalInterval">Intervalo normal</param>
        /// <param name="atrId">Id de atr</param>
        public AssetIdAndAsdaqIdDto(string assetId, string asdaqId, bool isPrincipal, string nodeId, string principalAssetId,RpmEventConfig rpmEventConfig, List<ConditionStatusEventConfig> conditionStatusEventsConfig, double normalInterval,string atrId, TripMultiply tripMultiply, double transientStatusTimeout, string description, double nominalVelocity)
        {
            AssetId = assetId;
            AsdaqId = asdaqId;
            IsPrincipal = isPrincipal;
            NodeId = nodeId;
            PrincipalAssetId = principalAssetId;
            RpmEventConfig = rpmEventConfig;
            ConditionStatusEventsConfig = conditionStatusEventsConfig;
            NormalInterval = normalInterval;
            AtrId = atrId;
            TripMultiply = tripMultiply;
            TransientStatusTimeout = transientStatusTimeout;
            Description = description;
            NominalVelocity = nominalVelocity;
        }
    }
}
