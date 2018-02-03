using Amaq.Acloud.Aspectrogram.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Representa los parametros de un sensor RTD
    /// </summary>
    public class RTDParams
    {
        /// <summary>
        /// Tipo de material del sensor
        /// </summary>
        public MaterialType MaterialType { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public double Ro { get; set; }
        /// <summary>
        /// Coeficiente de temperatura
        /// </summary>
        public double Coefficient { get; set; }
        /// <summary>
        /// 
        /// </summary>
        public double Iex { get; set; }

    }
}
