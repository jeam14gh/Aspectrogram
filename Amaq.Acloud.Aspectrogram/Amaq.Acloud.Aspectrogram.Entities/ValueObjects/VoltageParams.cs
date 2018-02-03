using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Representa los parametros de un sensor de voltaje
    /// </summary>
    public class VoltageParams
    {
        /// <summary>
        /// Voltaje máximo
        /// </summary>
        public double Vmax { get; set; }
        /// <summary>
        /// Voltaje mínimo
        /// </summary>
        public double Vmin { get; set; }
        /// <summary>
        /// Valor máximo en las unidades del sensor
        /// </summary>
        public double Xmax { get; set; }
        /// <summary>
        /// Valor mínimo en las unidades del sensor
        /// </summary>
        public double Xmin { get; set; }
    }
}
