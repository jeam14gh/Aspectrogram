namespace Amaq.Acloud.AsdaqService.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Representa el conjunto de todos los valores de subVariables de todos los measurementPoint de un asset para estampa de tiempo determinada
    /// </summary>
    public class ValuesByTime
    {
        /// <summary>
        /// Estampa de tiempo
        /// </summary>
        public DateTime TimeStamp { get; set; }
        /// <summary>
        /// Conjunto de valores
        /// </summary>
        public List<object> Values { get; set; }
    }
}
