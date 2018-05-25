/*
 * fftFilter.js
 * Filtro que se basa en la FFT
 * Realiza las funciones de filtrado Pasa-Bajos, Pasa-Altos y Pasa-Bandas
 * @author Jorge Calderon
 */

var FFTFilter = {};

FFTFilter = (function () {
    "use strict";

    /*
     * Constructor.
     */
    FFTFilter = function () {
        // Propiedades privadas
        var
            // Auto-referencia a la propia clase
            _this,
            // Referencia a la clase FourierTransform
            _fft;

        _this = this;
        _fft = new FourierTransform();

        /*
         * Filtro Pasa-Bajos de Fourier que es basado en la manipulacion de componentes de frecuencia especificas de una señal.
         */
        this.LowPass = function (real, imag, cutoff) {
            var
                // Representa la longitud del vector complejo
                n,
                // Contador
                i;

            // Calculamos la transformada directa
            _fft.Forward(real, imag);
            n = real.length;
            for (i = cutoff; i < (n - cutoff) ; i += 1) {
                real[i] = 0;
                imag[i] = 0;
            }
            _fft.Backward(real, imag);
            for (i = 0; i < n; i += 1) {
                real[i] = real[i] / n;
                real[i] = (real[i] > -0.0000001 && real[i] < 0.0000001) ? 0 : real[i];
            }
        };

        /*
         * Filtro Pasa-altos de Fourier que es basado en la manipulacion de componentes de frecuencia especificas de una señal.
         */
        this.HighPass = function (real, imag, cutoff) {
            var
                // Representa la longitud del vector complejo
                n,
                // Contador
                i;

            // Calculamos la transformada directa
            _fft.Forward(real, imag);
            n = real.length;
            for (i = 0; i < cutoff ; i += 1) {
                real[i] = 0;
                imag[i] = 0;
            }
            for (i = n / 2; i < n; i++) {
                real[i] = 0;
                imag[i] = 0;
            }
            _fft.Backward(real, imag);
            for (i = 0; i < n; i += 1) {
                real[i] = real[i] / (n / 2);
                real[i] = (real[i] > -0.0000001 && real[i] < 0.0000001) ? 0 : real[i];
            }
        };

        /*
         * Filtro Pasa-Banda de Fourier que es basado en la manipulacion de componentes de frecuencia especificas de una señal.
         * @param {Array} real Parte real de la forma de onda
         * @param {Array} imag Parte imaginaria de la forma de onda
         * @param {Integer} fl Frecuencia de corte en la banda inferior
         * @param {Integer} fh Frecuencia de corte en la banda superior
         */
        this.BandPass = function (real, imag, fl, fh) {
            var
                // Representa la longitud del vector complejo
                n,
                // Contador
                i;

            // Calculamos la transformada directa
            _fft.Forward(real, imag);
            n = real.length;
            for (i = 0; i < fl ; i += 1) {
                real[i] = 0;
                imag[i] = 0;
            }
            for (i = fh; i < n ; i += 1) {
                real[i] = 0;
                imag[i] = 0;
            }
            _fft.Backward(real, imag);
            for (i = 0; i < n; i += 1) {
                real[i] = real[i] / (n / 2);
                real[i] = (real[i] > -0.0000001 && real[i] < 0.0000001) ? 0 : real[i];
            }
        };
    };

    return FFTFilter;
})();