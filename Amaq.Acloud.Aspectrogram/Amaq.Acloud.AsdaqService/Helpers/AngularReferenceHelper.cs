namespace Amaq.Acloud.AsdaqService.Helpers
{
    using Aspectrogram.Entities;
    using CircularBuffer;
    using Models;
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Representa un conjunto de funcionalidades para el tratamiento de señales de tacómetro
    /// </summary>
    public static class AngularReferenceHelper
    {        
        /// <summary>
        /// Obtiene el vector de posiciones de referencia angular
        /// </summary>
        /// <param name="waveformInVolts">Forma de onda de la marca de paso en voltios</param>
        /// <param name="minimumNoiseInVolts">Ruido en voltios a partir del cual se detectan flancos</param>
        /// <param name="thresholdPercentage">Umbral en porcentaje</param>
        /// <param name="hysteresisThresholdPercentage">Umbral de histeresis en porcentaje</param>
        /// <returns></returns>
        public static uint[] GetAngularReferencePositions(double[] waveformInVolts, double minimumNoiseInVolts, double thresholdPercentage, double hysteresisThresholdPercentage)
        {
            var angularReferencePositions = new List<uint>();
            //for (int i = 0; i < waveformInVolts.Length; i++)
            //{
            //    waveformInVolts[i] = Math.Abs(waveformInVolts[i]);
            //}
            var noiseInVolts = OverallMeasureHelper.CalculatePeakToPeak(waveformInVolts);
            var minimum = waveformInVolts.Min();
            var threshold = minimum + (noiseInVolts * thresholdPercentage);
            var hysteresisThreshold = minimum + (noiseInVolts * hysteresisThresholdPercentage);
            //for (int i = 0; i < waveformInVolts.Length; i++)
            //{
            //    waveformInVolts[i] = Math.Abs(waveformInVolts[i]);
            //}

            if (noiseInVolts >= minimumNoiseInVolts)
            {
                if (threshold > hysteresisThreshold) // Validar reset en bajada
                {
                    var falling = false;
                    for (uint i = 0; i < waveformInVolts.Length - 1; i++)
                    {
                        if (waveformInVolts[i] >= threshold)
                        {
                            falling = true;
                        }
                        if((falling) && (waveformInVolts[i + 1]) < hysteresisThreshold)
                        {
                            falling = false;
                            angularReferencePositions.Add(i);
                        }
                    }
                }
                else // Validar reset en subida
                {
                    var raising = false;
                    for (uint i = 0; i < waveformInVolts.Length - 1; i++)
                    {
                        if (waveformInVolts[i] <= threshold)
                        {
                            raising = true;
                        }
                        if ((raising) && (waveformInVolts[i + 1]) > hysteresisThreshold)
                        {
                            raising = false;
                            angularReferencePositions.Add(i);
                        }
                    }
                }
            }

            return angularReferencePositions.ToArray();
        }

        /// <summary>
        /// Calcula la velocidad en Rpm
        /// </summary>
        /// <param name="numberOfFlanks">Cantidad de flancos</param>
        /// <param name="firstFlank">Posición primer flanco</param>
        /// <param name="lastFlank">Posición último flanco</param>
        /// <param name="sampleRate">Frecuencia de muestreo con la que se están adquiriendo las formas de onda</param>
        /// <param name="samplesToRead">Número de muestras</param>
        /// <param name="step">Cantidad de señales entre el primer flanco y el último flanco</param>
        /// <returns></returns>
        public static double CalculateRpm(int numberOfFlanks, int firstFlank, int lastFlank, double sampleRate, int samplesToRead,
            int step)
        {             
            //double rpmMinimum = 2.0 / WINDOW_IN_SECONDS * 60.0; // Velocidad mínima: 20 rpm.
            var rpm = 0.0;

            if (numberOfFlanks <= 1)
                return rpm;

            var lastF = (int)(lastFlank + (AsdaqProperties.WINDOW_IN_SECONDS - 1) * samplesToRead);
            var firstF = (int)(firstFlank + (AsdaqProperties.WINDOW_IN_SECONDS - 1 - step) * samplesToRead);

            var T = (lastF - firstF) / sampleRate;

            rpm = (numberOfFlanks - 1) / T * 60;

            return rpm;
        }

        /// <summary>
        /// Resuelve el primer flanco, el último flanco y la cantidad de flancos entre el primero y el último en un máximo de 6 segundos
        /// de formas de onda(Ventana de 6 segundos con la cual se cálcula una velocidad mínima de 20 rpm)
        /// </summary>
        /// <param name="samplesToRead">Número de muestras por forma de onda</param>
        /// <param name="sampleRate">Frecuencia de muestreo</param>
        /// <param name="currentAngularReferencePositions"></param>
        /// <param name="angularReferenceAcquisitionBuffer">Búfer de adquisición de la referencia angular</param>
        /// <param name="angularReference">Referencia angular</param>
        public static void ResolveFirstAndLastFlank(int samplesToRead, double sampleRate, uint[] currentAngularReferencePositions, CircularBuffer<BufferDataItem> angularReferenceAcquisitionBuffer, ref MdVariableExtension angularReference)
        {
            //angularReference.FirstFlank = 0; // Inicializar
            //angularReference.LastFlank = 0; // Inicialzar
            //angularReference.NumberOfFlanks = 0; // Inicialzar

            //var secondsBetweenAcquisitions = samplesToRead / sampleRate;
            //var numberOfWaveforms = (int)Math.Round(WINDOW_IN_SECONDS / secondsBetweenAcquisitions);
            //var availableWaveforms = angularReferenceAcquisitionBuffer.Count;

            //// Si hay menos de 6 segundos en el búfer
            //if (availableWaveforms < numberOfWaveforms)
            //{
            //    numberOfWaveforms = availableWaveforms;
            //}

            //var baseIndex = angularReferenceAcquisitionBuffer.Head;

            //// Control de indices negativos
            //if (baseIndex < 0)
            //{
            //    baseIndex += angularReferenceAcquisitionBuffer.Capacity;
            //}

            //var index = baseIndex % angularReferenceAcquisitionBuffer.Capacity; // Indice basado en la capacidad máxima del búfer

            //// Recorrido de lo mas reciente a lo más viejo
            //for (int j = 0; j < numberOfWaveforms; j++)
            //{
            //    uint[] angularReferencePositions = null;

            //    if (j == 0)
            //    {
            //        angularReferencePositions = currentAngularReferencePositions;
            //    }
            //    else
            //    {
            //        angularReferencePositions = angularReferenceAcquisitionBuffer[index].AngularReferencePositons;
            //    }

            //    if ((angularReferencePositions != null) && (angularReferencePositions.Length > 0))
            //    {
            //        if (angularReference.NumberOfFlanks == 0)
            //        {
            //            angularReference.LastFlank =
            //                (int)(angularReferencePositions.Last() + (WINDOW_IN_SECONDS - 1 - j) * samplesToRead);

            //            angularReference.NumberOfFlanks += angularReferencePositions.Length;
            //        }
            //        else
            //        {
            //            angularReference.FirstFlank =
            //                (int)(angularReferencePositions.Last() + (WINDOW_IN_SECONDS - 1 - j) * samplesToRead);

            //            return; // Terminar función
            //        }
            //    }

            //    if (j > 0)
            //    {
            //        index = (index - 1) % angularReferenceAcquisitionBuffer.Capacity; // Decremento del indice

            //        // Control de indices negativos
            //        if (index < 0)
            //        {
            //            index += angularReferenceAcquisitionBuffer.Capacity;
            //        }

            //        System.Diagnostics.Debug.WriteLine("index: " + index.ToString());
            //    }
            //}
        }
    }
}
