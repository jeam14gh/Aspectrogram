/*
 * streamParser.js
 * Realiza la interpretacion de los diferentes tipos de stream conocidos
 * @author AMAQ TEAM
 */

var StreamParser = {};

StreamParser = (function () {
    "use strict";

    /*
     * Constructor.
     */
    StreamParser = function () {
        var
            // Auto-referencia a la clase AmaqStreamDecoder
            _this,
            // Referencia a la clase de lectura de datos binarios.
            _binaryReader,
            // Objeto de respuesta al decodificar el Stream
            _response,
            _parseWaveForm;

        this.pkgSeconds = 0;

        _parseWaveForm = function () {
            var
                resp,
                data,
                // Tipo de dato de la señal.
                signalDataType,
                // Longitud de la señal.
                signalLength,
                // Tiempo total de la señal.
                sampleTime,
                // Longitud de las posiciones de referencia angular
                keyphasorPositionsLength,
                // Longitud de las posiciones de referencia angular
                zeroCrossPositionsLength,
                i,
                // Promedio de la forma de onda
                avg,
                // Factor de escalamiento de la señal
                scaleFactor,
                // Tipo de Stream
                streamType,
                minimum,
                bytes,
                kp,
                zc;

            resp = {};
            bytes = [];
            zeroCrossPositionsLength = 0;
            _binaryReader.readByte();                                 // Version.
            streamType = _binaryReader.readByte();                    // Tipo stream.
            signalDataType = _binaryReader.readByte();                // Tipo de datos.
            for (i = 0; i < 16; i += 1) {
                bytes.push(_binaryReader.readByte());
            }
            _binaryReader.readDouble();                               // Estampa de tiempo. (Portabilidad)
            _binaryReader.readByte();                                 // Cantidad de valores globales.
            scaleFactor = _binaryReader.readDouble();                 // Factor de escala de la señal.
            avg = _binaryReader.readDouble();                         // Promedio de la señal.
            minimum = _binaryReader.readDouble();                     // Valor mínimo de la señal. Solo aplica si la señal está escalada
            signalLength = _binaryReader.readInt32();                 // Longitud de la señal.
            _binaryReader.readByte();                                 // Dimension del array de señales.
            sampleTime = _binaryReader.readDouble();                  // Tiempo total de la señal.
            keyphasorPositionsLength = _binaryReader.readUInt32();    // Longitud del vector de posiciones de keyphasor.
            if (streamType == 3) {
                // Longitud del vector de posiciones de cruces por cero en flujo magnetico.
                zeroCrossPositionsLength = _binaryReader.readUInt32();
            }
            data = [];
            switch (signalDataType) {
                case 7:
                    for (i = 0; i < signalLength; i += 1) {
                        data.push(parseFloat(_binaryReader.readDouble()) - parseFloat(avg));
                    }
                    break;
                case 2:
                    for (i = 0; i < signalLength; i += 1) {
                        data.push(parseFloat(_binaryReader.readUInt16()) * parseFloat(scaleFactor) - parseFloat(avg) + parseFloat(minimum));
                    }
                    break;
                default:
                    break;
            }

            kp = [];
            if (keyphasorPositionsLength > 0) {
                // Vector de posiciones de keyphasor
                for (i = 0; i < keyphasorPositionsLength; i += 1) {
                    kp.push(_binaryReader.readUInt32());
                }
            }
            zc = [];
            if (zeroCrossPositionsLength > 0) {
                // Vector de posiciones de cruces por cero
                for (i = 0; i < zeroCrossPositionsLength; i += 1) {
                    zc.push(_binaryReader.readUInt32());
                }
            }

            resp.waveform = data;
            resp.keyphasor = kp;
            resp.zeroCross = zc;
            resp.sampleTime = sampleTime;
            resp.signalLength = signalLength;
            return resp;
        };

        this.GetWaveForm = function (value) {
            _binaryReader = new BinaryReader(atob(value));
            return _parseWaveForm();
        };

        this.GetOverallPackage = function (value, eventId) {
            _response = [];
            _binaryReader = new BinaryReader(atob(value));
            var
                pkgSize,
                pkgSeconds,
                timeStamp,
                readBytes,
                currentDataType,
                i, j;

            pkgSize = _binaryReader.getSize();
            for (i = 0, pkgSeconds = 0; i < pkgSize; i += readBytes, pkgSeconds += 1) {
                timeStamp = new Date(_binaryReader.readDouble()).getTime().toString();
                readBytes = 8;
                _response[timeStamp] = [];
                for (j = 0; j < eventSubVariables[eventId].Overall.length; j += 1) {
                    currentDataType = eventSubVariables[eventId].Overall[j].DataType;
                    switch (currentDataType) {
                        case 0:
                            _response[timeStamp].push({ Value: _binaryReader.readUInt8() });
                            readBytes += 1;
                            break;
                        case 1:
                            _response[timeStamp].push({ Value: _binaryReader.readInt8() });
                            readBytes += 1;
                            break;
                        case 2:
                            _response[timeStamp].push({ Value: _binaryReader.readUInt16() });
                            readBytes += 2;
                            break;
                        case 3:
                            _response[timeStamp].push({ Value: _binaryReader.readInt16() });
                            readBytes += 2;
                            break;
                        case 4:
                            _response[timeStamp].push({ Value: _binaryReader.readUInt32() });
                            readBytes += 4;
                            break;
                        case 5:
                            _response[timeStamp].push({ Value: _binaryReader.readInt32() });
                            readBytes += 4;
                            break;
                        case 6:
                            _response[timeStamp].push({ Value: _binaryReader.readFloat() });
                            readBytes += 8;
                            break;
                        case 7:
                            _response[timeStamp].push({ Value: _binaryReader.readDouble() });
                            readBytes += 8;
                            break;
                        default:
                            break;
                    }
                }
            }
            this.pkgSeconds = pkgSeconds;
            return _response;
        };

        this.GetWaveFormPackage = function (value, eventId) {
            _response = [];
            _binaryReader = new BinaryReader(atob(value));
            var
                pkgSize,
                timeStamp,
                readBytes,
                currentLength,
                stream,
                i, j;

            pkgSize = _binaryReader.getSize();
            for (i = 0; i < pkgSize; i += readBytes) {
                timeStamp = new Date(_binaryReader.readDouble()).getTime().toString();
                readBytes = 8;
                _response[timeStamp] = [];
                for (j = 0; j < eventSubVariables[eventId].Waveform.length; j += 1) {
                    currentLength = _binaryReader.readInt32();
                    readBytes += 4;
                    // Aqui empezamos a leer el stream de forma de onda
                    stream = _parseWaveForm();
                    _response[timeStamp].push({
                        Value: GetXYDataOnTime(stream.waveform, stream.sampleTime),
                        RawValue: stream.waveform,
                        SampleRate: stream.signalLength / stream.sampleTime,
                    });
                    readBytes += currentLength;
                }
            }
            return _response;
        };
    };

    return StreamParser;
})();
