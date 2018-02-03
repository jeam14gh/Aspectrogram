/*
 * firFilter.js
 * Filtro FIR
 * Realiza las funciones de filtrado Pasa-Bajos, Pasa-Altos y Pasa-Bandas
 * @author Jorge Calderon
 */

var FIRFilter = {};

FIRFilter = (function () {
    "use strict";

    /*
     * Constructor.
     */
    FIRFilter = function () {
        // Propiedades privadas
        var
            // Auto-referencia a la propia clase
            _this,
            // Tipo de filtro
            _filterType,
            // Obtiene los coeficientes necesarios para el filtro
            _getCoeff,
            // Metodo privado que calcula la respuesta al impulso
            _impulseResponse,
            _invert,
            _filter,
            _lpReg,
            _hpReg,
            _bpReg;

        _this = this;
        _lpReg = [];
        _hpReg = [];
        _bpReg = [];

        /*
         * Filtro Pasa-Bajos.
         */
        this.LowPass = function (input, order, fs, fc) {
            var
                coeff;

            _filterType = 0;
            coeff = _getCoeff(order, fs, fc);
            _lpReg = (_lpReg.length > 0) ? _lpReg : clone(coeff);
            return _filter(coeff, input, register);
        };

        /*
         * Filtro Pasa-altos.
         */
        this.HighPass = function (input, order, fs, fc) {
            var
                coeff;

            _filterType = 1;
            coeff = _getCoeff(order, fs, fc);
            _hpReg = (_hpReg.length > 0) ? _hpReg : clone(coeff);
            return _filter(coeff, input, _hpReg);
        };

        var runMultiFilter = function (input, d, doStep, f, overwrite) {
            var out = [];
            if (overwrite) {
                out = input;
            }
            var i;
            for (i = 0; i < input.length; i++) {
                out[i] = doStep(input[i], d, f);
            }
            return out;
        };

        var initZero = function (cnt) {
            var r = [];
            var i;
            for (i = 0; i < cnt; i++) {
                r.push(0);
            }
            return {
                buf: r,
                pointer: 0
            };
        };

        var doStep = function (input, d, f) {
            d.buf[d.pointer] = input;
            var cnt;
            var out = 0;
            for (cnt = 0; cnt < d.buf.length; cnt++) {
                out += (f[cnt] * d.buf[(d.pointer + cnt) % d.buf.length]);
            }
            d.pointer = (d.pointer + 1) % (d.buf.length);
            return out;
        };

        /*
         * Filtro Pasa-Banda.
         */
        this.BandPass = function (input, order, fs, fc1, fc2) {
            //var
            //    coeff,
            //    register;

            //_filterType = 2;
            //coeff = _getCoeff(order, fs, fc1, fc2);
            ////_bpReg = (_bpReg.length > 0) ? _bpReg : clone(coeff);
            ////return _filter(coeff, input, _bpReg);
            //var tempF = initZero(coeff.length - 1);
            //return runMultiFilter(input, tempF, doStep, coeff);
            var xxx = calcBiquad("bandpass", fc1, fs, 0.7071, 6);
            var param = {
                a0: xxx[0],
                a1: xxx[1],
                a2: xxx[2],
                b0: xxx[3],
                b1: xxx[4],
                b2: xxx[5]
            };
            var regX1, regX2, regY1, regY2;

            regX1 = regX2 = regY1 = regY2 = 0;
            var y, buffer;
            buffer = [];
            for (var i = 0; i < input.length; i++) {
                y = sectorCalculator(input[i], param, regX1, regX2, regY1, regY2);
                buffer[i] = y;
            }
            return buffer;
        };

        _getCoeff = function (order, fs, fc1, fc2) {
            var
                i,
                lp, hp,
                response;

            response = [];
            switch (_filterType) {
                case 0: // LP
                    response = _impulseResponse(order, fs, fc1);
                    break;
                case 1: // HP
                    response = _invert(_impulseResponse(order, fs, fc1));
                    break;
                case 2: // BP
                    lp = _impulseResponse(order, fs, fc2);
                    hp = _invert(_impulseResponse(order, fs, fc1));
                    response = [];
                    for (i = 0; i < lp.length; i += 1) {
                        response.push(lp[i] + hp[i])
                    }
                    break;
            }
            return response;
        };

        var calcBiquad = function (type, Fc, Fs, Q, peakGain) {
            var
                a0, a1, a2,
                b0, b1, b2,
                norm,
                V, K;

            V = Math.pow(10, Math.abs(peakGain) / 20);
            K = Math.tan(Math.PI * Fc / Fs);
            switch (type) {
                case "lowpass":
                    norm = 1 / (1 + K / Q + K * K);
                    b0 = K * K * norm;
                    b1 = 2 * b0;
                    b2 = b0;
                    a1 = 2 * (K * K - 1) * norm;
                    a2 = (1 - K / Q + K * K) * norm;
                    break;
                case "highpass":
                    norm = 1 / (1 + K / Q + K * K);
                    b0 = 1 * norm;
                    b1 = -2 * b0;
                    b2 = b0;
                    a0 = 1;
                    a1 = 2 * (K * K - 1) * norm;
                    a2 = (1 - K / Q + K * K) * norm;
                    break;
                case "bandpass":
                    norm = 1 / (1 + K / Q + K * K);
                    b0 = K / Q * norm;
                    b1 = 0;
                    b2 = -b0;
                    a0 = 1;
                    a1 = 2 * (K * K - 1) * norm;
                    a2 = (1 - K / Q + K * K) * norm;
                    break;
                case "notch":
                    norm = 1 / (1 + K / Q + K * K);
                    b0 = (1 + K * K) * norm;
                    b1 = 2 * (K * K - 1) * norm;
                    b2 = b0;
                    a0 = 1;
                    a1 = b1;
                    a2 = (1 - K / Q + K * K) * norm;
                    break;
                case "peak":
                    if (peakGain >= 0) {
                        norm = 1 / (1 + 1 / Q * K + K * K);
                        b0 = (1 + V / Q * K + K * K) * norm;
                        b1 = 2 * (K * K - 1) * norm;
                        b2 = (1 - V / Q * K + K * K) * norm;
                        a0 = 1;
                        a1 = b1;
                        a2 = (1 - 1 / Q * K + K * K) * norm;
                    } else {
                        norm = 1 / (1 + V / Q * K + K * K);
                        b0 = (1 + 1 / Q * K + K * K) * norm;
                        b1 = 2 * (K * K - 1) * norm;
                        b2 = (1 - 1 / Q * K + K * K) * norm;
                        a0 = 1;
                        a1 = b1;
                        a2 = (1 - V / Q * K + K * K) * norm;
                    }
                    break;
                case "lowShelf":
                    if (peakGain >= 0) {
                        norm = 1 / (1 + Math.SQRT2 * K + K * K);
                        b0 = (1 + Math.sqrt(2 * V) * K + V * K * K) * norm;
                        b1 = 2 * (V * K * K - 1) * norm;
                        b2 = (1 - Math.sqrt(2 * V) * K + V * K * K) * norm;
                        a0 = 1;
                        a1 = 2 * (K * K - 1) * norm;
                        a2 = (1 - Math.SQRT2 * K + K * K) * norm;
                    } else {
                        norm = 1 / (1 + Math.sqrt(2 * V) * K + V * K * K);
                        b0 = (1 + Math.SQRT2 * K + K * K) * norm;
                        b1 = 2 * (K * K - 1) * norm;
                        b2 = (1 - Math.SQRT2 * K + K * K) * norm;
                        a0 = 1;
                        a1 = 2 * (V * K * K - 1) * norm;
                        a2 = (1 - Math.sqrt(2 * V) * K + V * K * K) * norm;
                    }
                    break;
                case "highShelf":
                    if (peakGain >= 0) {
                        norm = 1 / (1 + Math.SQRT2 * K + K * K);
                        b0 = (V + Math.sqrt(2 * V) * K + K * K) * norm;
                        b1 = 2 * (K * K - V) * norm;
                        b2 = (V - Math.sqrt(2 * V) * K + K * K) * norm;
                        a0 = 1;
                        a1 = 2 * (K * K - 1) * norm;
                        a2 = (1 - Math.SQRT2 * K + K * K) * norm;
                    } else {
                        norm = 1 / (V + Math.sqrt(2 * V) * K + K * K);
                        b0 = (1 + Math.SQRT2 * K + K * K) * norm;
                        b1 = 2 * (K * K - 1) * norm;
                        b2 = (1 - Math.SQRT2 * K + K * K) * norm;
                        a0 = 1;
                        a1 = 2 * (K * K - V) * norm;
                        a2 = (V - Math.sqrt(2 * V) * K + K * K) * norm;
                    }
                    break;
                default:
                    console.log("No implementado tipo de filtro");
                    break;
            }
            return [a0, a1, a2, b0, b1, b2];
        };

        var sectorCalculator = function (x, params, regX1, regX2, regY1, regY2) {
            var
                cTap,
                y;

            cTap = x * params.b0 + params.b1 * regX1 + params.b2 * regX2;
            y = params.a0 * cTap - params.a1 * regY1 - params.a2 * regY2;
            regX2 = clone(regX1);
            regX1 = clone(x);
            regY2 = clone(regY1);
            regY1 = clone(y);
            return y;
        };

        _impulseResponse = function (order, fs, fc) {
            var
                i,
                omega,
                dc,
                resp;

            omega = 2 * Math.PI * fc / fs;
            i = 0;
            dc = 0;
            resp = [];
            // La funcion Sinc function es considerada la respuesta ideal al impulso
            for (i = 0; i <= order; i += 1) {
                if (i - order / 2 === 0) {
                    resp[i] = omega;
                } else {
                    resp[i] = Math.sin(omega * (i - order / 2)) / (i - order / 2);
                    // Hamming window
                    resp[i] *= (0.54 - 0.46 * Math.cos(2 * Math.PI * i / order));
                }
                dc = dc + resp[i];
            }
            // Normalizacion
            for (i = 0; i <= order; i += 1) {
                resp[i] /= dc;
            }
            return resp;
        };

        _invert = function (input) {
            var i;
            for (i = 0; i < input.length; i += 1) {
                input[i] = -input[i];
            }
            input[(input.length - 1) / 2]++;
            return input;
        };

        _filter = function (coeff, input, register) {
            var
                numCoeff,
                numSigPts,
                filteredSignal,
                top, n, y,
                i, j;

            numCoeff = coeff.length;
            numSigPts = input.length;
            filteredSignal = [];
            top = 0;

            for (i = 0; i < numSigPts; i += 1)
            {
                register[top] = input[i];
                y = 0.0;
                n = 0;
                for (j = top; j >= 0; j -= 1)
                {
                    y += coeff[n] * register[j];
                    n += 1;
                }
                for (j = numCoeff - 1; j > top; j -= 1)
                {
                    y += coeff[n] * register[j];
                    n += 1;
                }
                filteredSignal[i] = y;
                top += 1;
                if (top >= numCoeff)
                {
                    top = 0;
                }
            }
            return filteredSignal;
        };
    };

    return FIRFilter;
})();