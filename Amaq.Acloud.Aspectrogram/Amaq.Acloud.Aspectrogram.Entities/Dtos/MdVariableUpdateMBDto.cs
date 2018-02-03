using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Calcula y actualiza los parametros M y B de un punto de medición que está relacionado con un canal Aconditioner
    /// </summary>
    public class MdVariableUpdateMBDto
    {
        /// <summary>
        /// Id del punto de medición
        /// </summary>
        public string MdVariableId { get; set; }

        /// <summary>
        /// Ganancia de un canal Aconditioner
        /// </summary>
        public double Gain { get; set; }

        /// <summary>
        /// Desplazameniento de un canal Aconditioner
        /// </summary>
        public double Displacement { get; set; }

        /// <summary>
        /// Indica si los parametros M y B de un punto de medición deben ser Recalculados (Pasar de M' a M y B' a B o viceversa)
        /// </summary>
        public bool Recalculate { get; set; }

        /// <summary>
        /// Serial del Aconditioner relacionado a un Asdaq
        /// </summary>
        public string Serial { get; set; }

        /// <summary>
        /// Número del canal Aconditioner
        /// </summary>
        public int Channel { get; set; }
    }
}
