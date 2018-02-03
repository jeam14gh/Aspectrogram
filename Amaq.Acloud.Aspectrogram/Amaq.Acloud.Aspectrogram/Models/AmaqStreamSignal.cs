namespace Amaq.Acloud.Aspectrogram.Models
{
    using Entities.Enums;
    using System.Collections.Generic;

    /// <summary>
    /// Representa un dato XY
    /// </summary>
    public class XYData
    {
        /// <summary>
        /// Dato en X
        /// </summary>
        public double X { get; set; }
        /// <summary>
        /// Dato en Y
        /// </summary>
        public double Y { get; set; }

        public XYData(double x, double y)
        {
            X = x;
            Y = y;
        }
    }

    /// <summary>
    /// Representa un objeto Amaq Stream de señal
    /// </summary>
    public class AmaqStreamSignal
    {
        /// <summary>
        /// Versión actual del formato
        /// </summary>
        public byte Version { get { return 1; } }
        /// <summary>
        /// Tipo de información dinámica almacenada
        /// </summary>
        public StreamType StreamType { get { return StreamType.Signal; } }
        /// <summary>
        /// Tiempo total de la señal
        /// </summary>
        public double SampleTime { get; set; }
        /// <summary>
        /// Datos de señal
        /// </summary>
        public List<XYData> SignalData { get; set; }
        /// <summary>
        /// Lista de posiciones en X de keyphasor que marcan el final de cada ciclo de la señal
        /// </summary>
        public List<uint> KeyphasorPositions { get; set; }

        /// <summary>
        /// Inicializa una nueva instancia de AmaqStreamSignal
        /// </summary>
        /// <param name="signalData"></param>
        /// <param name="sampleTime"></param>
        /// <param name="keyphasorPositions"></param>
        public AmaqStreamSignal(List<XYData> signalData, double sampleTime, List<uint> keyphasorPositions)
        {
            SignalData = signalData;
            SampleTime = sampleTime;
            KeyphasorPositions = keyphasorPositions;
        }
    }
}
