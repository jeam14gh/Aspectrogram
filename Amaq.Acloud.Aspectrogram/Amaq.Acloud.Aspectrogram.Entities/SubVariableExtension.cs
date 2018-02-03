namespace Amaq.Acloud.Aspectrogram.Entities
{
    using System.Collections.Generic;
    using MongoDB.Bson.Serialization.Attributes;
    using Libraries.MongoRepository.Attributes;
    using Acloud.Entities.Core;
    using Enums;
    using ValueObjects;

    /// <summary>
    /// Extensión de la entidad SubVariable
    /// </summary>
    public class SubVariableExtension : SubVariable
    {
        /// <summary>
        /// Tipo de medida derivado de una señal
        /// </summary>
        [BsonIgnoreIfDefault]
        public MeasureType MeasureType { get; set; }

        /// <summary>
        /// Valor lógico que indica si una medida se va a derivar o no de la forma de onda integrada. Solo aplica para
        /// subVariables con ValueType.Numeric y mdVariable padre con propiedad Integrate = true.
        /// </summary>
        public bool FromIntegratedWaveform { get; set; }

        /// <summary>
        /// Valor de calibración del GAP. Aplica solo si MeasureType = Gap
        /// </summary>
        public double GapCalibrationValue { get; set; }

        /// <summary>
        /// Valor de desplazamiento inicial en Voltios. Aplica solo si MeasureType = AxialPosition
        /// </summary>
        public double InitialAxialPosition { get; set; }

        /// <summary>
        /// Valor de referencia para la compensacion. Aplica solo si MeasureType = Amplitude1x y Phase1x
        /// </summary>
        public double ReferenceCompesation { get; set; }

        /// <summary>
        /// Lista de threshold cada uno con la propiedad Severity para facilitar los cálculos de estados en Asdaq
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public List<BandWithSeverity> BandsOrderBySeverityDesc { get; set; }

        /// <summary>
        /// Severidad del estado actual de la subVariable para facilitar los cálculos de estados en Asdaq
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public int StatusSeverity { get; set; }

        /// <summary>
        /// Último valor que superó la banda muerta
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public double? LastValueByDeadBand { get; set; }

        /// <summary>
        /// Vector de posiciones de referencia angular. Solo aplica si el punto de medición es referencia angular
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public uint[] AngularReferencePositions { get; set; }
    }
}
