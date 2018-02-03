/*
 * fourierTransform.js
 * Transformada de Fourier (Fourier Transform)
 * Realiza las operaciones relacionadas con la transformada de Fourier.
 * @author Jorge Calderon
 */

var FourierTransform = {};

FourierTransform = (function () {
    "use strict";

    /*
     * Constructor.
     */
    FourierTransform = function () {
        // Propiedades privadas
        var
            // Auto-referencia a la propia clase
            _this,
            // Transformada basada en vectores de longitud potencia de 2
            _transformRadix2,
            // Transformada basada en vectores de longitud arbitraria
            _transformBluestein,
            // Devuelve el numero entero cuyo valor es el inverso de los bits menos significativos del entero dado
            _reverseBits,
            // Convolucion de complejos
            _convolveComplex;

        // Auto-referencia a la clase FourierTransform
        _this = this;

        /*
         * Calcula la transformada de Fourier discreta (o la transformada rapida de ser posible) del vector complejo dado.
         * El resultado se almacena de nuevo en el mismo vector.
         */
        this.Forward = function (real, imag) {
            if (real.length != imag.length) {
                throw "Longitud del vector complejo no coincide.";
            }
            var
                n;

            n = real.length;
            if (n === 0) {
                return;
            } else if ((n & (n - 1)) === 0) { // Potencia de 2
                _transformRadix2(real, imag);
            } else { // Algoritmo complejo para longitud de array arbitraria
                _transformBluestein(real, imag);
            }
        };

        /* 
         * Calcula la transformada de Fourier inversa del vector complejo dado.
         * El vector puede tener cualquier longitud.
         * Esta transformada no realiza escala, por lo que la inversa no es una verdadera inversa.
         */
        this.Backward = function (real, imag) {
            _this.Forward(imag, real);
        };

        /*
         * Calcula la transformada de Fourier basado en que la longitud del vector es una potencia de 2.
         * Utiliza el algoritmo de Cooley-Tukey Radix-2 para diezmado en el tiempo.
         */
        _transformRadix2 = function (real, imag) {
            if (real.length !== imag.length) {
                throw "Longitud del vector complejo no coincide.";
            }

            var
                n,
                levels,
                i,
                cosTable,
                sinTable,
                j,
                temp,
                size,
                k,
                halfsize,
                tablestep,
                tpre,
                tpim;

            n = real.length;
            if (n == 1) return; // Transformada trivial
            levels = -1;
            for (i = 0; i < 32; i += 1) {
                if (1 << i == n) {
                    levels = i; // Log2(n)
                }
            }
            if (levels == -1) {
                throw "La longitud del vector no es una potencia de 2.";
            }

            // Tablas trigonometricas
            cosTable = new Array(n / 2);
            sinTable = new Array(n / 2);
            for (i = 0; i < n / 2; i += 1) {
                cosTable[i] = Math.cos(2 * Math.PI * i / n);
                sinTable[i] = Math.sin(2 * Math.PI * i / n);
            }

            // Permutamiento de bits
            for (i = 0; i < n; i += 1) {
                j = _reverseBits(i, levels);
                if (j > i) {
                    temp = real[i];
                    real[i] = real[j];
                    real[j] = temp;
                    temp = imag[i];
                    imag[i] = imag[j];
                    imag[j] = temp;
                }
            }

            // Diezmado en el tiempo (Cooley-Tukey Radix-2)
            for (size = 2; size <= n; size *= 2) {
                halfsize = size / 2;
                tablestep = n / size;
                for (i = 0; i < n; i += size) {
                    for (j = i, k = 0; j < i + halfsize; j += 1, k += tablestep) {
                        tpre = real[j + halfsize] * cosTable[k] + imag[j + halfsize] * sinTable[k];
                        tpim = -real[j + halfsize] * sinTable[k] + imag[j + halfsize] * cosTable[k];
                        real[j + halfsize] = real[j] - tpre;
                        imag[j + halfsize] = imag[j] - tpim;
                        real[j] += tpre;
                        imag[j] += tpim;
                    }
                }
            }
        };

        /*
         * Calcula la transformada de Fourier para una longitud cualquiera del vector.
         * Requiere la funcion de convolucion, que a su vez usa la transformada Radix-2.
         * Utiliza el algoritmo de Bluestein's chirp z-transform.
         */
        _transformBluestein = function (real, imag) {
            if (real.length !== imag.length) {
                throw "Longitud del vector complejo no coincide.";
            }

            var
                n,
                m,
                cosTable,
                sinTable,
                i,
                j,
                areal,
                aimag,
                breal,
                bimag,
                creal,
                cimag;

            n = real.length;
            m = 1;
            // Encontrar una longitud m de convolucion potencia de 2 tal que m >= n * 2 + 1
            while (m < n * 2 + 1) {
                m *= 2;
            }

            // Tablas trigonometricas
            cosTable = new Array(n);
            sinTable = new Array(n);
            for (i = 0; i < n; i += 1) {
                j = i * i % (n * 2);
                cosTable[i] = Math.cos(Math.PI * j / n);
                sinTable[i] = Math.sin(Math.PI * j / n);
            }

            // Vectores temporales y preprocesamiento
            areal = new Array(m);
            aimag = new Array(m);
            for (i = 0; i < n; i += 1) {
                areal[i] = real[i] * cosTable[i] + imag[i] * sinTable[i];
                aimag[i] = -real[i] * sinTable[i] + imag[i] * cosTable[i];
            }
            for (i = n; i < m; i += 1) {
                areal[i] = aimag[i] = 0;
            }

            breal = new Array(m);
            bimag = new Array(m);
            breal[0] = cosTable[0];
            bimag[0] = sinTable[0];
            for (i = 1; i < n; i += 1) {
                breal[i] = breal[m - i] = cosTable[i];
                bimag[i] = bimag[m - i] = sinTable[i];
            }
            for (i = n; i <= m - n; i += 1) {
                breal[i] = bimag[i] = 0;
            }

            // Convolucion
            creal = new Array(m);
            cimag = new Array(m);
            _convolveComplex(areal, aimag, breal, bimag, creal, cimag);

            // Pos-procesamiento
            for (i = 0; i < n; i += 1) {
                real[i] = creal[i] * cosTable[i] + cimag[i] * sinTable[i];
                imag[i] = -creal[i] * sinTable[i] + cimag[i] * cosTable[i];
            }
        };

        /*
         * Calcula la convolucion circular de los vectores complejos dados.
         * La longitud de cada vector debe ser la misma.
         */
        _convolveComplex = function (xreal, ximag, yreal, yimag, outreal, outimag) {
            if (xreal.length != ximag.length || xreal.length != yreal.length || yreal.length != yimag.length || xreal.length != outreal.length || outreal.length != outimag.length) {
                throw "Longitud de los vectores complejos no coincide.";
            }

            var
                n,
                i,
                temp;

            n = xreal.length;
            xreal = xreal.slice();
            ximag = ximag.slice();
            yreal = yreal.slice();
            yimag = yimag.slice();

            _this.Forward(xreal, ximag);
            _this.Forward(yreal, yimag);
            for (i = 0; i < n; i += 1) {
                temp = xreal[i] * yreal[i] - ximag[i] * yimag[i];
                ximag[i] = ximag[i] * yreal[i] + xreal[i] * yimag[i];
                xreal[i] = temp;
            }
            _this.Backward(xreal, ximag);
            // Finalmente realizamos un escalamiento
            for (i = 0; i < n; i += 1) {
                outreal[i] = xreal[i] / n;
                outimag[i] = ximag[i] / n;
            }
        };

        /*
         * Devuelve el numero entero cuyo valor es el inverso del bit menos significativo del entero "x".
         */
        _reverseBits = function (x, bits) {
            var
                // Valor del inverso del bit menos significativo de x
                y,
                // Contador
                i;

            y = 0;
            for (i = 0; i < bits; i += 1) {
                y = (y << 1) | (x & 1);
                x >>>= 1;
            }
            return y;
        };
    };

    return FourierTransform;
})();