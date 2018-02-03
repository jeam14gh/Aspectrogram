using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Representa los parámetros de un sensor de flujo magnético 
    /// </summary>
    public class MagneticFlowParams : CurrentParams
    {
        /// <summary>
        /// Cantidad de polos
        /// </summary>
        public int PolesCount { get; set; }

        /// <summary>
        /// Ángulo del polo 1 respecto de la muesca de referencia angular
        /// </summary>
        public double Pole1Angle { get; set; }

        /// <summary>
        /// Rango de la gráfica polar en Teslas (Es un solo valor debido a que el rango es simétrico)
        /// </summary>
        public double PolarGraphRange { get; set; }
    }
}
