using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Representa la lista de subVariables tiempo real solicitadas para un atr específico
    /// </summary>
    public class RealTimeRequestsByAtrDto
    {
        /// <summary>
        /// Id de atr
        /// </summary>
        public string AtrId { get; set; }

        /// <summary>
        /// Lista de id de subvariables
        /// </summary>
        public List<string> SubVariableIdList { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de RealTimeRequestsByAtr
        /// </summary>
        public RealTimeRequestsByAtrDto() { }

        /// <summary>
        /// Inicializa una nueva instancia de RealTimeRequestsByAtr
        /// </summary>
        /// <param name="atrId"></param>
        /// <param name="subVariableIdList"></param>
        public RealTimeRequestsByAtrDto(string atrId, List<string> subVariableIdList) {
            AtrId = atrId;
            SubVariableIdList = subVariableIdList;
        }
    }
}
