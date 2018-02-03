﻿namespace Amaq.Acloud.AsdaqService.Helpers
{
    using CircularBuffer;
    using Models;
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Representa un conjunto de funcionalidades para cálculo de valores globales derivados de señales
    /// </summary>
    public static class OverallMeasureHelper
    {
        /// <summary>
        /// Calcula el valor promedio de una señal
        /// </summary>
        /// <param name="signal">Señal</param>
        /// <returns></returns>
        public static double CalculateAverage(double[] signal)
        {
            return signal.Average();
        }

        /// <summary>
        /// Calcula el valor pico(pk) de una señal
        /// </summary>
        /// <param name="signal">Señal</param>
        /// <returns></returns>
        public static double CalculatePeak(double[] signal)
        {
            var minimumValue = 0.0;
            return CalculatePeakToPeak(signal, out minimumValue) / 2;
        }

        /// <summary>
        /// Calcula el valor pico pico(pkpk) 
        /// </summary>
        /// <param name="signal">Señal</param>
        /// <param name="minimumValue">Valor mínimo de la señal</param>
        /// <returns></returns>
        public static double CalculatePeakToPeak(double[] signal, out double minimumValue)
        {
            minimumValue = signal.Min();
            return signal.Max() - minimumValue;
        }

        /// <summary>
        /// Calcula el valor pico pico(pkpk) 
        /// </summary>
        /// <param name="signal">Señal</param>
        /// <returns></returns>
        public static double CalculatePeakToPeak(double[] signal)
        {
            return signal.Max() - signal.Min();
        }

        /// <summary>
        /// Calcula el valor RMS
        /// </summary>
        /// <param name="signal">Señal</param>
        /// <param name="offset">Promedio de la señal</param>
        /// <returns></returns>
        public static double CalculateRMS(double[] signal, double offset)
        {
            var sum = 0.0;

            for (int i = 0; i < signal.Length; i++)
                sum += Math.Pow(signal[i] - offset, 2);

            return Math.Sqrt(sum / (signal.Length - 1));
        }

        /// <summary>
        /// Calcula el valor de amplitud 1x
        /// </summary>
        /// <param name="waveform">Forma de onda</param>
        /// <param name="firstFlank">Primer flanco</param>
        /// <param name="lastFlank">Último flanco</param>
        /// <param name="numberOfFlanks">Cantidad de flancos</param>
        /// <param name="mPointAcquisitionBuffer">Búfer de adquisición del punto de medición</param>
        /// <param name="step">Cantidad de señales entre el primer flanco y el último flanco</param>
        /// <returns></returns>
        public static double CalculateAmplitude1x(double[] waveform, int firstFlank, int lastFlank, int numberOfFlanks,
            CircularBuffer<BufferDataItem> mPointAcquisitionBuffer, int step)
        {
            if (numberOfFlanks < 2)
            {
                return 0;
            }

            int decrement = 0;
            int samplesToRead = waveform.Length;
            int j = 0;

            var lastF = (int)(lastFlank + (AsdaqProperties.WINDOW_IN_SECONDS - 1) * samplesToRead);
            var firstF = (int)(firstFlank + (AsdaqProperties.WINDOW_IN_SECONDS - 1 - step) * samplesToRead);

            var length = lastF - firstF + 1;
            double sumX = 0;
            double sumY = 0;
            double arg = -2.0 * Math.PI / length;

            var baseIndex = mPointAcquisitionBuffer.Head;

            // Control de indices negativos
            if (baseIndex < 0)
            {
                baseIndex += mPointAcquisitionBuffer.Capacity;
            }

            var index = baseIndex % mPointAcquisitionBuffer.Capacity; // Indice basado en la capacidad máxima del búfer

            for (int n = firstF; n < lastF; n++)
            {
                // Cantidad de posiciones a retroceder en el búfer de adquisición
                decrement = (int)(AsdaqProperties.WINDOW_IN_SECONDS - 1 - (n / samplesToRead));

                // Hallar el indice con base en el búfer circular
                index = (index - decrement) % mPointAcquisitionBuffer.Capacity; // Decremento del indice

                // Control de indices negativos
                if (index < 0)
                {
                    index += mPointAcquisitionBuffer.Capacity;
                }

                j = n % samplesToRead;

                // Es necesario para el calculo de la fase (el coseno y el seno deben arrancar en 0)
                var k = n - firstF;
                var isCurrentWaveform = (decrement == 0);
                sumX += ((isCurrentWaveform) ? waveform[j] : mPointAcquisitionBuffer.getAtPosition(index).Waveform[j]) * Math.Cos(arg * k * (numberOfFlanks - 1));
                sumY += ((isCurrentWaveform) ? waveform[j] : mPointAcquisitionBuffer.getAtPosition(index).Waveform[j]) * Math.Sin(arg * k * (numberOfFlanks - 1));
            }
            var bSi = 2 / (double)length;
            return 2 * bSi * Math.Sqrt(sumX * sumX + sumY * sumY);
        }

        /// <summary>
        /// Calcula el valor de fase
        /// </summary>
        /// <param name="signal">Señal</param>
        /// <returns></returns>
        public static double CalculatePhase(double[] signal)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Calcula el valor de fase 1x
        /// </summary>
        /// <param name="waveform">Forma de onda</param>       
        /// <param name="firstFlank">Primer flanco</param>
        /// <param name="lastFlank">Último flanco</param>
        /// <param name="numberOfFlanks">Cantidad de flancos</param>
        /// <param name="mPointAcquisitionBuffer">Búfer de adquisición del punto de medición</param>
        /// <param name="step">Cantidad de señales entre el primer flanco y el último flanco</param>
        /// <returns></returns>
        public static double CalculatePhase1x(double[] waveform, int firstFlank, int lastFlank, int numberOfFlanks,
            CircularBuffer<BufferDataItem> mPointAcquisitionBuffer, int step)
        {
            if (numberOfFlanks < 2)
            {
                return 0;
            }

            int decrement = 0;
            int samplesToRead = waveform.Length;
            int j = 0;

            var lastF = (int)(lastFlank + (AsdaqProperties.WINDOW_IN_SECONDS - 1) * samplesToRead);
            var firstF = (int)(firstFlank + (AsdaqProperties.WINDOW_IN_SECONDS - 1 - step) * samplesToRead);

            var length = lastF - firstF + 1;
            double sumX = 0;
            double sumY = 0;
            // Argumento para la transformada directa => e^(-jwt), w=2*pi/N
            double omega = 2.0 * Math.PI / length;

            var baseIndex = mPointAcquisitionBuffer.Head;

            // Control de indices negativos
            if (baseIndex < 0)
            {
                baseIndex += mPointAcquisitionBuffer.Capacity;
            }

            // Indice basado en la capacidad maxima del bufer
            var index = baseIndex % mPointAcquisitionBuffer.Capacity;

            for (int n = firstF; n < lastF; n++)
            {
                // Cantidad de posiciones a retroceder en el búfer de adquisición
                decrement = (int)(AsdaqProperties.WINDOW_IN_SECONDS - 1 - (n / samplesToRead));

                // Hallar el indice con base en el búfer circular
                index = (index - decrement) % mPointAcquisitionBuffer.Capacity; // Decremento del indice

                // Control de indices negativos
                if (index < 0)
                {
                    index += mPointAcquisitionBuffer.Capacity;
                }

                j = n % samplesToRead;

                // Es necesario para el calculo de la fase (el coseno y el seno deben arrancar en 0)
                var k = n - firstF;
                var isCurrentWaveform = (decrement == 0);
                // e^(-jwt) = cos(wt) - j * sin(wt)
                sumX += ((isCurrentWaveform) ? waveform[j] : mPointAcquisitionBuffer.getAtPosition(index).Waveform[j]) * Math.Cos(omega * k * (numberOfFlanks - 1));
                sumY += ((isCurrentWaveform) ? waveform[j] : mPointAcquisitionBuffer.getAtPosition(index).Waveform[j]) * (-1) * Math.Sin(omega * k * (numberOfFlanks - 1));
            }
            double pha1x = Math.Atan2(-sumY, sumX) * (180 / Math.PI);
            return (pha1x < 0) ? pha1x + 360 : pha1x;
        }

        /// <summary>
        /// Calcula el valor GAP en voltios
        /// </summary>
        /// <param name="average">Valor promedio de la señal</param>
        /// <param name="sensibility">Valor de sensibilidad del measurement point</param>
        /// <param name="gapCalibrationValue">Valor de calibración del GAP</param>
        /// <returns></returns>
        public static double CalculateGAP(double average, double sensibility, double gapCalibrationValue)
        {
            return (((average * sensibility) / 1000) + (gapCalibrationValue));
        }

        /// <summary>
        /// Calcula el valor de desplazamiento axial para los análisis Thrust Bearing
        /// </summary>
        /// <param name="average">Valor promedio de la señal</param>
        /// <param name="sensibility">Valor de sensibilidad del measurement point</param>
        /// <param name="gapCalibrationValue">Valor de calibración del GAP</param>
        /// <param name="initialAxialPosition">Valor de gap inicial, es decir el offset a partir del cual se va a medir desplazamiento axial</param>
        /// <returns></returns>
        public static double CalculateAxialPosition(double average, double sensibility, double gapCalibrationValue, double initialAxialPosition)
        {
            var gap = CalculateGAP(average, sensibility, gapCalibrationValue);
            return (gap - initialAxialPosition) * 1000 / sensibility;
        }

        /// <summary>
        /// Calcula el valor de la amplitud para un sensor de flujo magnetico
        /// RECORDAR AQUI TAMBIEN USAR EL ARRAY DE POSICIONES EN CRUCE POR CERO DE LA SEÑAL INTEGRADA
        /// </summary>
        /// <param name="waveform"></param>
        /// <returns></returns>
        public static double CalculateMagneticFluxAmplitude(double[] waveform)
        {
            return 0.0;
        }

        /// <summary>
        /// Calcula el valor de la fase para un sensor de flujo magnetico
        /// RECORDAR AQUI TAMBIEN USAR EL ARRAY DE POSICIONES EN CRUCE POR CERO DE LA SEÑAL INTEGRADA
        /// </summary>
        /// <param name="waveform"></param>
        /// <returns></returns>
        public static double CalculateMagneticFluxPhase(double[] waveform)
        {
            return 0.0;
        }

        /// <summary>
        /// Obtiene los cruces por cero de una forma de onda
        /// </summary>
        /// <param name="waveform">Forma de onda a determinar cruces por cero</param>
        /// <returns></returns>
        public static uint[] GetZeroCrossPositions(double[] waveform)
        {
            List<uint> zeroCrossPositions = new List<uint>();
            bool reset = false;
            double max = waveform.Max();
            double min = waveform.Min();
            for (uint i = 0; i < waveform.Length; i++)
            {
                if (waveform[i] < 0)
                {
                    waveform[i] = (waveform[i] < min / 2) ? Math.Abs(min / 2) : Math.Abs(waveform[i]);
                }
                else
                {
                    waveform[i] = (waveform[i] > max / 2) ? max / 2 : waveform[i];
                }
            }
            double seed = (max / 2 < Math.Abs(min / 2)) ? max / 2 : Math.Abs(min / 2);
            for (uint i = 1; i < waveform.Length; i++)
            {
                if (waveform[i] < seed)
                {
                    seed = waveform[i];
                }
                if (waveform[i] < waveform[i - 1])
                {
                    reset = true;
                }
                else
                {
                    if (reset)
                    {
                        zeroCrossPositions.Add((waveform[i - 1] > waveform[i]) ? i : i - 1);
                        seed = (max / 2 < Math.Abs(min / 2)) ? max / 2 : Math.Abs(min / 2);
                        reset = false;
                    }
                }
            }
            return zeroCrossPositions.ToArray();
        }
    }
}