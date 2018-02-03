namespace Amaq.Acloud.AsdaqService.Helpers
{
    /// <summary>
    /// Representa un conjunto de funcionalidades para la integración de formas de onda
    /// </summary>
    public static class IntegrateHelper
    {
        /// <summary>
        /// Integra una forma de onda con la regla trapezoidal
        /// </summary>
        /// <param name="waveform">Forma de onda</param>
        /// <param name="sampleRate">Frecuencia de muestreo de la forma de onda</param>
        /// <param name="sensorType">Determina el tipo de sensor para realizar conversiones si necesario</param>
        /// <returns>Forma de onda integrada</returns>
        public static double[] Trapezoidal(double[] waveform, double sampleRate, int sensorType)
        {
            int N = waveform.Length;
            // ts = (1 / fs) => donde fs corresponde a la frecuencia de muestreo
            double ts = 1 / sampleRate;
            var temp = new double[N];
            var integratedWaveform = new double[N];

            switch (sensorType)
            {
                case 2:
                    // Convertir a mm/s^2
                    for (int i = 0; i < N; i++)
                    {
                        temp[i] = waveform[i] * 9.806;
                    }
                    break;
                default:
                    for (int i = 0; i < N; i++)
                    {
                        temp[i] = waveform[i];
                    }
                    break;
            }
            
            // El primer dato se integra sin conocer el valor anterior
            integratedWaveform[0] = (ts / 2) * temp[0];
            for (int i = 1; i < N - 1; i++)
            {
                // y[i] = y[i-1] + (ts/2)*(u[i] + u[i-1])
                integratedWaveform[i] = integratedWaveform[i - 1] + (ts / 2) * (temp[i] + temp[i - 1]);
            }
            integratedWaveform[N - 1] = (ts / 2) * temp[N - 1];

            return integratedWaveform; // Retornar forma de onda integrada
        }

        /// <summary>
        /// Integra una forma de onda con la regla rectangular
        /// </summary>
        /// <param name="waveform">Forma de onda</param>
        /// <param name="sampleRate">Frecuencia de muestreo de la forma de onda</param>
        /// <returns>Forma de onda integrada</returns>
        public static double[] Rectangular(double[] waveform, double sampleRate)
        {
            int N = waveform.Length;
            // ts = (1 / fs) => donde fs corresponde a la frecuencia de muestreo
            double ts = 1 / sampleRate;
            var temp = new double[N];
            var integratedWaveform = new double[N];
            
            for (int i = 0; i < N; i++)
            {
                // Convertir a mm/s^2
                temp[i] = waveform[i] * 9806.65;
            }

            integratedWaveform[0] = ts * temp[0];
            for (int i = 1; i < N - 1; i++)
            {
                // y[i] = y[i-1] + ts*u[i]
                integratedWaveform[i] = integratedWaveform[i - 1] + ts * temp[i];
            }
            return integratedWaveform;
        }
    }
}
