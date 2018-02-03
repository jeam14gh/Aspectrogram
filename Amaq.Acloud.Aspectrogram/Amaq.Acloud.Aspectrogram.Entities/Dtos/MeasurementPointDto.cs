namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Representa una medida de un measurement point, ya sea un valor global o una señal
    /// </summary>
    public class MeasureDto
    {
        /// <summary>
        /// Id de SubVariable
        /// </summary>
        public string SubVariableId { get; set; }
        /// <summary>
        /// Estampa de tiempo de la medida
        /// </summary>
        public DateTime TimeStamp { get; set; }
        /// <summary>
        /// Valor de la medida que puede ser un número, un objeto Amaq Stream, etc..
        /// </summary>
        public object Value { get; set; }

        /// <summary>
        /// Unidades en las que la SubVariable es medida.
        /// </summary>
        public string Units { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de MeasureDto
        /// </summary>
        /// <param name="subVariableId"></param>
        /// <param name="timeStamp"></param>
        /// <param name="value"></param>
        /// <param name="units"></param>
        public MeasureDto(string subVariableId, DateTime timeStamp, object value, string units)
        {
            SubVariableId = subVariableId;
            TimeStamp = timeStamp;
            Value = value;
            Units = units;
        }
    }

    /// <summary>
    /// Representa un punto de medición con una lista de medidas(Valores globales y/o señal)
    /// </summary>
    public class MeasurementPointDto
    {
        /// <summary>
        /// Id de MdVariable
        /// </summary>
        public string MdVariableId { get; set; }

        /// <summary>
        /// Relacion del par de MdVariables caso exista dicha relacion.
        /// </summary>
        public XYMeasurementPointPair XYPair { get; set; }

        /// <summary>
        /// Lista de medidas asociadas al punto de medición
        /// </summary>
        public List<MeasureDto> Measures { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de MeasurementPointDto
        /// </summary>
        /// <param name="mdVariableId"></param>
        /// <param name="measures"></param>
        /// <param name="xyPair"></param>
        public MeasurementPointDto(string mdVariableId, XYMeasurementPointPair xyPair, List<MeasureDto> measures)
        {
            MdVariableId = mdVariableId;
            XYPair = xyPair;
            Measures = measures;
        }
    }
}
