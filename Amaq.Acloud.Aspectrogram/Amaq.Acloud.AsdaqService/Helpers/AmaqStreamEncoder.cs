namespace Amaq.Acloud.AsdaqService.Helpers
{
    using Aspectrogram.Entities.Enums;
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Representa un codificador Amaq Stream de cierta información como señales, posiciones de keyphasor y valores globales derivados de señal.
    /// Amaq Stream es un formato estandar de Amaq para la interoperabilidad en la comunicación de señales, keyphasor y valores globales entre diferentes sistemas
    /// </summary>
    public static class AmaqStreamEncoder
    {
        private const byte SIGNAL_VERSION = 1; // Versión actual del stream para señales
        private const byte SPECTRUM_VERSION = 2; // Versión actual del stream para espectros

        /// <summary>
        /// Escala una forma de onda de valores double a una forma de onda de valores uint16
        /// </summary>
        /// <param name="waveform">Forma de onda</param>
        /// <param name="minimumValue">Valor mínimo de la forma de onda</param>
        /// <param name="pkpk">Valor picopico de la forma de onda</param>
        /// <param name="scaleFactor"></param>
        /// <param name="minimum"></param>
        /// <returns></returns>
        private static ushort[] ScaleWaveformToUInt16(double[] waveform, double minimumValue, double pkpk, out double scaleFactor, out double minimum)
        {
            const double FULL_RANGE = ushort.MaxValue * 0.48;
            var spamMinimum = minimumValue;
            var spamMaximum = minimumValue + pkpk;
            var length = waveform.Length;
            var UInt16Waveform = new ushort[length];

            scaleFactor = pkpk / FULL_RANGE; // Factor de escalamiento de la señal
            minimum = spamMinimum;

            if((spamMaximum -spamMinimum) < 0.0001)
            {
                return UInt16Waveform;
            }

            var currentValue = 0.0;

            for (int i = 0; i < length; i++)
            {
                currentValue = waveform[i];

                if(currentValue < spamMinimum)
                {
                    currentValue = spamMinimum; // Limitar al spam mínimo
                }
                else if(currentValue > spamMaximum)
                {
                    currentValue = spamMaximum; // Limitar al spam máximo
                }

                UInt16Waveform[i] = (ushort)((currentValue - spamMinimum) / (spamMaximum - spamMinimum) * FULL_RANGE); // Escalamiento
            }

            return UInt16Waveform;
        }

        /// <summary>
        /// Codifica en formato Stream Amaq la señal y las posiciones de keyphasor especificadas
        /// </summary>
        /// <param name="waveform">Señal</param>
        /// <param name="minimumValue">Valor mínimo de la señal</param>
        /// <param name="pkpk">Valor picopico de la señal</param>
        /// <param name="sampleRate">Frecuencia de muestreo de la señal</param>
        /// <param name="signalAveraging">Promedio de la señal</param>
        /// <param name="timeStamp">Estampa de tiempo</param>
        /// <param name="streamType">Tipo de Stream</param>
        /// <param name="keyphasorPositions">Posiciones keyphasor en el eje x de la señal</param>
        /// <param name="zeroCrossPositions">Posiciones de cruce por cero de la señal integrado (SOLO APLICA PARA FLUJO MAGNETICO)</param>
        /// <returns></returns>
        public static byte[] Encode(double[] waveform, double minimumValue, double pkpk, double sampleRate, double signalAveraging,
            DateTime timeStamp, StreamType streamType, uint[] keyphasorPositions = null, uint[] zeroCrossPositions = null)
        {
            double scaleFactor = 1.0;
            ushort[] UInt16Signal = null;
            var signalDataType = AmaqDataType.Double;
            var average = signalAveraging;
            var minimum = 0.0;

            if (AsdaqProperties.ScaleWaveformToUInt16)
            {
                signalDataType = AmaqDataType.UnsignedInt16;
                UInt16Signal = ScaleWaveformToUInt16(waveform, minimumValue, pkpk, out scaleFactor, out minimum);
            }
                     
            var byteList = new List<byte>();

            byteList.Add(SIGNAL_VERSION);
            byteList.Add((byte)streamType);
            byteList.Add((byte)signalDataType); // Tipo de dato de los valores de la señal
            byteList.AddRange(Guid.Empty.ToByteArray()); // Id VariableMd
            byteList.AddRange(BitConverter.GetBytes(timeStamp.ToBinary())); // Estampa de tiempo
            byteList.Add(0); // Cantidad de valores globales
            byteList.AddRange(BitConverter.GetBytes(scaleFactor)); // Factor de escala de la señal
            byteList.AddRange(BitConverter.GetBytes(average)); // Promedio de la señal
            byteList.AddRange(BitConverter.GetBytes(minimum)); // Valor mínimo de la señal. Solo aplica si es escalada a entero
            byteList.AddRange(BitConverter.GetBytes(waveform.Length)); // Longitud de la señal
            byteList.Add(1); // Dimensión del array de señales. Si solo tiene los valores en y entonces es de 1 dimensión, pero si tiene también los valores en x entonces tiene 2 dimensiones
            byteList.AddRange(BitConverter.GetBytes((waveform.Length / sampleRate))); // Tiempo total de la señal
            byteList.AddRange(BitConverter.GetBytes((uint)((keyphasorPositions != null) ? keyphasorPositions.Length : 0))); // Longitud del array de posiciones de keyphasor
            if (streamType == StreamType.MagenticFlux)
            {
                // Longitud del array de posiciones de cruce por cero
                byteList.AddRange(BitConverter.GetBytes((uint)((zeroCrossPositions != null) ? zeroCrossPositions.Length : 0)));
            }

            if (AsdaqProperties.ScaleWaveformToUInt16)
            {
                foreach (var s in UInt16Signal)
                {
                    byteList.AddRange(BitConverter.GetBytes(s));
                }
            }
            else
            {
                foreach (var s in waveform)
                {
                    byteList.AddRange(BitConverter.GetBytes(s));
                }
            }

            if (keyphasorPositions != null)
            {
                foreach (var k in keyphasorPositions)
                {
                    byteList.AddRange(BitConverter.GetBytes(k));
                }
            }
            if (streamType == StreamType.MagenticFlux && zeroCrossPositions != null)
            {
                foreach (var z in zeroCrossPositions)
                {
                    byteList.AddRange(BitConverter.GetBytes(z));
                }
            }
            return byteList.ToArray();
        }
    }
}
