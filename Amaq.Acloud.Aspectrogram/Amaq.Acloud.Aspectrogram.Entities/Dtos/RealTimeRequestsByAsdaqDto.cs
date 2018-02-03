namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using System.Collections.Generic;

    /// <summary>
    /// Representa la lista de subVariables tiempo real solicitadas para un asdaq específico
    /// </summary>
    public class RealTimeRequestsByAsdaqDto
    {
        /// <summary>
        /// Id de asdaq
        /// </summary>
        public string AsdaqId { get; set; }

        /// <summary>
        /// Lista de id de subVariables
        /// </summary>
        public List<string> SubVariableIdList { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de RealTimeRequestsByAsdaq
        /// </summary>
        public RealTimeRequestsByAsdaqDto()
        {

        }

        /// <summary>
        /// Inicializa una nueva instancia de RealTimeRequestsByAsdaq
        /// </summary>
        /// <param name="asdaqId"></param>
        /// <param name="subVariableIdList"></param>
        public RealTimeRequestsByAsdaqDto(string asdaqId, List<string> subVariableIdList)
        {
            AsdaqId = asdaqId;
            SubVariableIdList = subVariableIdList;
        }
    }
}
