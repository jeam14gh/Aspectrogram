/*
 * AMAQ 2016
 * Consulta el tiempo real de subvariables
 * @author ACLOUD TEAM
 */

var RealTimeMode = {};

RealTimeMode = function () {
    var
        // Tiempo entre refrescado de datos.
        _interval,
        // Referencia al interprete de datos tipo Stream
        _streamParser,
        // Detener el polling de datos.
        _stop;

    _interval = 1500;
    _stop = false;
    _streamParser = new StreamParser();

    var _poll = function () {
        var
            // Estampa de tiempo actual para validar si el dato es realmente nuevo
            currentTimeStamp, // <== FALTA IMPLEMENTAR (JHC)
            i;

        if (realTimeRequestsByAsdaqList.length > 0 || realTimeRequestsByAtrList.length > 0) {
            $.ajax({
                url: "/Home/GetRealTimeData",
                method: "POST",
                data: {
                    realTimeRequestsByAsdaqList: realTimeRequestsByAsdaqList, realTimeRequestsByAtrList: realTimeRequestsByAtrList
                },
                success: function (response) {
                    var
                        resp,
                        _realTimeData,
                        realTimeDataItem;

                    response = JSON.parse(response);
                    _realTimeData = [];

                    for (i = 0; i < response.length; i += 1) {
                        realTimeDataItem = response[i];
                        realTimeDataItem.RawTimeStamp = new Date(realTimeDataItem.TimeStamp + "+00:00");
                        realTimeDataItem.TimeStamp = formatDate(realTimeDataItem.RawTimeStamp); // Formato de estampa de tiempo

                        if ((realTimeDataItem.StatusId) && (realTimeDataItem.StatusId != "")) {
                            realTimeDataItem.StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                new ej.Query().where("Id", "equal", realTimeDataItem.StatusId))[0].Color;
                        } else {
                            realTimeDataItem.StatusColor = "#999999"; // gris por defecto sino tiene un estado seteado
                        }

                        if (realTimeDataItem.ValueType == 3 && realTimeDataItem.Value) {
                            _streamParser.GetWaveForm(realTimeDataItem.Value, function (decompressedArray) {
                                resp = _streamParser.ParseWaveForm(decompressedArray);
                                if (resp.keyphasor.length > 0) {
                                    realTimeDataItem.KeyphasorPositionsOnTime = GetKeyphasorOnTime(resp.keyphasor, resp.sampleTime, resp.signalLength);
                                    realTimeDataItem.KeyphasorPositions = resp.keyphasor;
                                }

                                realTimeDataItem.Value = GetXYDataOnTime(resp.waveform, resp.sampleTime);
                                realTimeDataItem.RawValue = resp.waveform;
                                realTimeDataItem.SampleRate = resp.signalLength / resp.sampleTime; // Necesario para hallar el bin del espectro
                                if (resp.keyphasor.length > 0) {
                                    realTimeDataItem.KeyphasorPositionsOnTime = GetKeyphasorOnTime(resp.keyphasor, resp.sampleTime, resp.signalLength);
                                    realTimeDataItem.KeyphasorPositions = resp.keyphasor;
                                }

                                realTimeDataItem.Value = GetXYDataOnTime(resp.waveform, resp.sampleTime);
                                realTimeDataItem.RawValue = resp.waveform;
                                realTimeDataItem.SampleRate = resp.signalLength / resp.sampleTime; // Necesario para hallar el bin del espectro
                                _realTimeData[realTimeDataItem.SubVariableId] = realTimeDataItem;
                            });
                        } else {
                            _realTimeData[realTimeDataItem.SubVariableId] = realTimeDataItem;
                        }
                    }
                    // Se notifica la llegada de nuevos datos tiempo real
                    PublisherSubscriber.publish("/realtime/refresh", _realTimeData);
                },
                complete: function () {
                    if (!_stop) setTimeout(_poll, _interval);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        } else {
            if (!_stop) setTimeout(_poll, _interval);
        }
    };

    this.Start = function () {
        _poll();
    };

    this.Stop = function () {
        _stop = true;
    };
};