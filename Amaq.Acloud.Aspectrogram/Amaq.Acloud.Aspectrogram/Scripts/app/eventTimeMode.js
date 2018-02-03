/*
 * AMAQ 2016
 * Consulta los eventos especificos de un activo o maquina
 * @author ACLOUD TEAM
 */

var EventTimeMode = {};

EventTimeMode = function () {
    "use strict";

    var
        _this,
        _streamParser,
        _xhrArray,
        _historicalCount,
        _initializeHistoricalData,
        _getStreamHistoricalData,
        _saveStreamLocal,
        _getTimeStampToRequest,
        _currentHistoricalLength;

    _streamParser = new StreamParser();
    _this = this;
    _xhrArray = [];

    /*
     * Inicializa la variable HistoricalData con la lista de subvariables segun el tipo de valor y
     * para la lista de puntos de medicion solicitado
     */
    _initializeHistoricalData = function (mdVariableIdList, widgetId, valueType) {
        var
            i, j,
            allSubVariables,
            typedSubVariables,
            historicalData;

        historicalData = [];
        allSubVariables = [];
        typedSubVariables = [];
        for (i = 0; i < mdVariableIdList.length; i += 1) {
            allSubVariables.pushArray(new ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", mdVariableIdList[i], false).select("SubVariables"))[0]);
        }
        typedSubVariables.pushArray(new ej.DataManager(allSubVariables).executeLocal(new ej.Query().where("ValueType", "equal", valueType, false).select("Id")));
        for (i = 0; i < typedSubVariables.length; i += 1) {
            if (!subVariableHTList[typedSubVariables[i]]) {
                subVariableHTList[typedSubVariables[i]] = [];
            }
        }
        historicalData[widgetId] = {
            SubVariableIdList: typedSubVariables,
            TimeStampArray: []
        };
        return historicalData;
    };

    /*
     * Determina si las estampas de tiempo a buscar ya se encuentran de forma local
     * Si la estampa no existe localmente se agrega a un array de estampas a consultar
     */
    _getTimeStampToRequest = function (timeStampList, historicalData, widgetId) {
        var
            i, j,
            timeStamp,
            subVariables,
            tmpTimeStampList;

        tmpTimeStampList = [];
        subVariables = historicalData[widgetId].SubVariableIdList;
        for (i = 0; i < timeStampList.length; i += 1) {
            timeStamp = new Date(timeStampList[i]).getTime();
            for (j = 0; j < subVariables.length; j += 1) {
                if (!subVariableHTList[subVariables[j]].hasOwnProperty(timeStamp)) {
                    tmpTimeStampList.push(timeStampList[i]);
                    break;
                }
            }
        }
        return tmpTimeStampList;
    };

    this.GetAllValues = function (mdVariableIdList, timeStampList, playerId) {
        var
            historicalData,
            factor,
            iterations,
            interval, i,
            timeStampRange;

        historicalData = _initializeHistoricalData(mdVariableIdList, playerId, 3);
        historicalData[playerId].TimeStampArray = timeStampList;
        timeStampList = _getTimeStampToRequest(timeStampList, historicalData, playerId);
        _historicalCount = timeStampList.length;
        if (_historicalCount === 0) {
            PublisherSubscriber.publish("/historicValues/refresh", historicalData);
            return;
        }

        _currentHistoricalLength = 0;
        factor = Math.floor(100 / mdVariableIdList.length);
        factor = (100 % mdVariableIdList.length === 0) ? factor : factor + 1;
        iterations = Math.floor(timeStampList.length / factor) + 1;
        i = 0;
        interval = setInterval(function () {
            if (i >= iterations) {
                return clearInterval(interval);
            }
            if (i + 1 === iterations) {
                if (timeStampList.length - i * factor <= 0) {
                    return clearInterval(interval);
                }
                timeStampRange = timeStampList.slice(i * factor, timeStampList.length);
            } else {
                timeStampRange = timeStampList.slice(i * factor, (i + 1) * factor);
            }
            _xhrArray[i] = _getStreamHistoricalData(mdVariableIdList, timeStampRange, playerId, historicalData, i);
            i += 1;
        }, 2000);
    };

    _getStreamHistoricalData = function (mdVariableIdList, timeStampRange, widgetId, historicalData, t) {
        var
            xhr,
            response;

        xhr = $.ajax({
            url: "/Home/GetDynamicHistoricalData",
            method: "POST",
            data: {
                mdVariableIdList: mdVariableIdList,
                timeStampArray: timeStampRange
            },
            success: function (resp) {
                response = JSON.parse(resp);
                delete _xhrArray[t];
                _currentHistoricalLength += timeStampRange.length;
                //_saveStreamLocal(response, historicalData, timeStampRange, widgetId, _xhrArray, _streamParser);
                Concurrent.Thread.create(_saveStreamLocal, response, historicalData, timeStampRange, widgetId, _xhrArray, _streamParser);
            },
            error: function (jqXHR, textStatus) {
                console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
            }
        });
    };

    _saveStreamLocal = function (response, historicalData, timeStampArray, widgetId, xhrArray, streamParser) {
        var
            currentSubVariable,
            dataByTimeStamp,
            timeStamp,
            stream,
            i, j, k;

        for (i = 0; i < response.length; i += 1) {
            currentSubVariable = response[i].HistoricalBySubVariable;
            for (j = 0; j < currentSubVariable.length; j += 1) {
                dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                for (k = 0; k < dataByTimeStamp.length; k++) {
                    dataByTimeStamp[k].RawTimeStamp = new Date(dataByTimeStamp[k].TimeStamp + "+00:00");
                    timeStamp = dataByTimeStamp[k].RawTimeStamp.getTime();
                    dataByTimeStamp[k].TimeStamp = formatDate(dataByTimeStamp[k].RawTimeStamp);
                    if (!subVariableHTList[currentSubVariable[j].SubVariableId]) {
                        subVariableHTList[currentSubVariable[j].SubVariableId] = [];
                    }
                    if (dataByTimeStamp[k].StatusId != "") {
                        dataByTimeStamp[k].StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                            new ej.Query().where("Id", "equal", dataByTimeStamp[k].StatusId))[0].Color;
                    } else {
                        dataByTimeStamp[k].StatusColor = "#999999";
                    }

                    stream = streamParser.GetWaveForm(dataByTimeStamp[k].Value);
                    if (stream.keyphasor.length > 0) {
                        dataByTimeStamp[k].KeyphasorPositionsOnTime = GetKeyphasorOnTime(stream.keyphasor, stream.sampleTime, stream.signalLength);
                        dataByTimeStamp[k].KeyphasorPositions = stream.keyphasor;
                    }

                    dataByTimeStamp[k].Value = GetXYDataOnTime(stream.waveform, stream.sampleTime);
                    dataByTimeStamp[k].RawValue = stream.waveform;
                    dataByTimeStamp[k].SampleRate = stream.signalLength / stream.sampleTime;

                    subVariableHTList[currentSubVariable[j].SubVariableId][timeStamp] = dataByTimeStamp[k];
                }
            }
        }

        historicalData[widgetId].TimeStampArray = timeStampArray;
        // Si ya fueron cargados todos los datos notificarlo
        PublisherSubscriber.publish("/historicValues/refresh", historicalData);
    };

    this.Stop = function () {
        var
            i;

        for (i = 1; i < _xhrArray.length; i += 1) {
            if (_xhrArray[i]) {
                _xhrArray[i].abort();
            }
        }
        _xhrArray = [];
    };
};
