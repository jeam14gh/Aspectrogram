using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Representa los parametros de un sensor de corriente
    /// </summary>
    public class CurrentParams
    {
        /// <summary>
        /// Corriente máxima
        /// </summary>
        public double Imax { get; set; }
        /// <summary>
        /// Corriente mínima
        /// </summary>
        public double Imin { get; set; }
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
