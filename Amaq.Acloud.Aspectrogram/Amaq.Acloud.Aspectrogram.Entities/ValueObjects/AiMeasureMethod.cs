namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using MongoDB.Bson.Serialization.Attributes;
    using System;
    using System.Collections.Generic;
    using System.Text;

    /// <summary>
    /// Representa la configuración necesaria para la llamada dinámica a un método AiChannel de National Instruments
    /// </summary>
    public class AiMeasureMethod
    {
        /// <summary>
        /// Relación uno a uno con AiChannelMethod
        /// </summary>
        public string AiMethodId { get; set; }
        /// <summary>
        /// Nombre del método
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// El tipo de cada parámetro, necesario para convertir el valor de dicho parámetro a su tipo original
        /// </summary>
        public List<string> ParameterTypes { get; set; }
        /// <summary>
        /// Valores de cada parámetro del método
        /// </summary>
        public List<object> ParameterValues { get; set; }
        /// <summary>
        /// Parámetro m de la ecuación y = mx + b
        /// </summary>
        public double M { get; set; }
        /// <summary>
        /// Parámetro b de la ecuación y = mx + b
        /// </summary>
        public double B { get; set; }
        /// <summary>
        /// Acople DC ó AC dependiendo de si la tarjeta de adquisición o módulo de cDAQ tiene característica de acople
        /// </summary>
        public string AiCoupling { get; set; }
    }
}
