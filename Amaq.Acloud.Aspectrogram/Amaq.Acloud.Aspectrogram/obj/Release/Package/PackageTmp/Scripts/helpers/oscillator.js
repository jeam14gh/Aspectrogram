/*
 * oscillator.js
 * Realiza las operaciones relacionadas con la transformada rapida de Fourier.
 */

var Oscillator = (function ()
{
    /*
    Constructor
    Inicializa las variables necesarias para el calculo de la transformada.
    @param {Number} bufferSize Capacidad del buffer
    @param {Number} sampleRate Tasa de muestreo
    */
    var Oscillator = function (frequency, amplitude, bufferSize, sampleRate, phase)
    {
        // Propiedades privadas
        var
            // Frecuencia
            _frequency,
            // Amplitud
            _amplitude,
            // Capacidad del buffer
            _bufferSize,
            // Tasa de muestreo
            _sampleRate,
            // Contador de tramas
            _frameCount,
            // Fase
            _phase,
            // Tabla de ondas
            _waveTableLength,
            // Ciclos por muestra
            _cyclesPerSample,
            // Senhal
            _signal,
            // Funcion de entrada al oscilador
            _func,
            // Tabla...
            _waveTable;

        _frequency = frequency;
        _amplitude = amplitude;
        _bufferSize = bufferSize;
        _sampleRate = sampleRate;
        _frameCount = 0;
        _phase = phase;

        _waveTableLength = 2048;
        _cyclesPerSample = frequency / sampleRate;
        _signal = new Float64Array(bufferSize);

        _waveTable = {};

        _generateWaveTable = function () {
            var waveTableTime, waveTableHz, i;
            _waveTable[_func] = new Float64Array(2048);
            waveTableTime = _waveTableLength / _sampleRate;
            waveTableHz = 1 / waveTableTime;

            for (i = 0; i < _waveTableLength; i++) {
                _waveTable[_func][i] = _func(i * waveTableHz / _sampleRate);
            }

            _waveTable = _waveTable[_func];
        };

        this.Sine = function (step) {
            return Math.sin(2 * Math.PI * step + _phase);
        }

        this.Square = function (step) {
            return step < 0.5 ? 1 : -1;
        }

        this.Saw = function (step) {
            return 2 * (step - Math.round(step));
        }

        this.Triangle = function (step) {
            return 1 - 4 * Math.abs(Math.round(step) - step);
        }

        this.Generate = function () {
            var frameOffset, step, offset, i;
            frameOffset = _frameCount * _bufferSize;
            step = _waveTableLength * _frequency / _sampleRate;

            for (i = 0; i < _bufferSize; i++) {
                offset = Math.round((frameOffset + i) * step);
                _signal[i] = _waveTable[offset % _waveTableLength] * _amplitude;
            }

            _frameCount++;

            return _signal;
        }

        _func = this.Sine;
        _generateWaveTable();
    }

    return Oscillator;
})();