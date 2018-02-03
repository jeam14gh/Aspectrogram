namespace Amaq.Acloud.AsdaqService.Models
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    /// <summary>
    /// Representa los datos de una subVariable en el búfer
    /// </summary>
    public class BufferSubVariableItem
    {
        /// <summary>
        /// Id de la subVariable
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Id del estado de la subVariable
        /// </summary>
        public string StatusId { get; set; }

        /// <summary>
        /// Valor de la subVariable
        /// </summary>
        public object Value { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de BufferSubVariableItem
        /// </summary>
        /// <param name="statusId"></param>
        /// <param name="value"></param>
        /// <param name="id"></param>
        public BufferSubVariableItem(string id, string statusId, object value)
        {
            Id = id;
            StatusId = statusId;
            Value = value;
        }
    }

    /// <summary>
    /// Representa los datos adquiridos y procesados en un punto en el tiempo para las diferentes subVariables de un measurementPoint
    /// </summary>
    public class BufferDataItem
    {
        /// <summary>
        /// Valor lógico que indica si el registro se generó por un cambio de RPM
        /// </summary>
        public bool IsChangeOfRpm { get; set; }

        /// <summary>
        /// Valor lógico que indica si el registro se generó por un cambio de estado de condición
        /// </summary>
        public bool IsChangeOfConditionStatus { get; set; }

        /// <summary>
        /// Valor lógico que indica si el registro se generó por cumplir la validación de NormalInterval
        /// </summary>
        public bool IsNormal { get; set; }

        /// <summary>
        /// Valor lógico que indica si el registro ya fué almacenado o no en la base de datos
        /// </summary>
        public bool StoredInBD { get; set; }

        /// <summary>
        /// Estampa de tiempo
        /// </summary>
        public DateTime TimeStamp { get; set; }

        /// <summary>
        /// Mantiene la forma de onda cruda en memoria. Solo aplica si el punto de medición es acelerómetro o velocímetro
        /// </summary>
        public double[] RawWaveform { get; set; }

        /// <summary>
        /// Mantiene la forma de onda cruda en memoria
        /// </summary>
        public double[] Waveform { get; set; }

        /// <summary>
        /// Mantiene el dato de velocidad en Rpm
        /// </summary>
        public double Rpm { get; set; }

        /// <summary>
        /// Valor
        /// </summary>
        public List<BufferSubVariableItem> Values { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de BufferDataItem
        /// </summary>
        public BufferDataItem(DateTime timeStamp, List<BufferSubVariableItem> values, double[] rawWaveform, double[] waveform, double rpm,
             bool isNormal, bool isChangeOfRpm, bool isChangeOfConditionStatus, bool storedInBD)
        {
            TimeStamp = timeStamp;
            Values = values;
            RawWaveform = rawWaveform;
            Waveform = waveform;
            Rpm = rpm;
            IsNormal = isNormal;
            IsChangeOfRpm = isChangeOfRpm;
            IsChangeOfConditionStatus = isChangeOfConditionStatus;
            StoredInBD = storedInBD;
        }

        /// <summary>
        /// Incializa una nueva instancia de BufferDataItem
        /// </summary>
        public BufferDataItem()
        {

        }
    }
}
