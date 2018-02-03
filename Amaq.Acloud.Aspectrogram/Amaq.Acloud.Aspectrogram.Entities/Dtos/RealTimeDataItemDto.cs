namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using Acloud.Entities.Enums;

    /// <summary>
    /// Representa un item de datos tiempo real
    /// </summary>
    public class RealTimeDataItemDto
    {
        /// <summary>
        /// Id de la SubVariable
        /// </summary>
        public string SubVariableId { get; set; }
        /// <summary>
        /// Tipo de valor que indica como tratar la propiedad Value
        /// </summary>
        public ValueType ValueType { get; set; }
        /// <summary>
        /// Valor que puede ser un número, un objeto Amaq Stream, etc..
        /// </summary>
        public object Value { get; set; }
        /// <summary>
        /// Estampa de tiempo
        /// </summary>
        public System.DateTime TimeStamp { get; set; }
        /// <summary>
        /// Id del estado de condición de la subVariable
        /// </summary>
        public string StatusId { get; set; }
        /*
        /// <summary>
        /// Valor de sensibilidad del sensor asociado al punto de medicion
        /// </summary>
        public double Sensibility { get; set; }
        */

        /// <summary>
        /// Constructor por defecto.
        /// </summary>
        public RealTimeDataItemDto()
        {

        }
        
        /// <summary>
        /// Inicializa una nueva instancia de RealTimeDataItemDto
        /// </summary>
        /// <param name="subVariableId">Id de subVariable</param>
        /// <param name="valueType">Tipo de valor</param>
        /// <param name="value">Valor</param>
        /// <param name="timeStamp">Estampa de tiempo</param>
        /// <param name="statusId">Id de estado</param>
        public RealTimeDataItemDto(string subVariableId, object value, System.DateTime timeStamp, string statusId, Amaq.Acloud.Entities.Enums.ValueType valueType)
        {
            SubVariableId = subVariableId;           
            Value = value;
            TimeStamp = timeStamp;
            StatusId = statusId;
            ValueType = valueType;
        }
    }
}
