/*
 * AMAQ 2016
 * Consulta el historico de subvariables
 * @author ACLOUD TEAM
 */

var HistoricalTimeMode = {};

HistoricalTimeMode = function () {
    "use strict";

    var
        _streamParser,
        _xhrArray,
        _subVariablesGroup,
        _historicalCount,
        _initializeHistoricalData,
        _getNumericHistoricalData,
        _getStreamHistoricalData,
        _saveNumericLocal,
        _saveStreamLocal,
        _getTimeStampToRequest,
        _currentHistoricalLength;

    _streamParser = new StreamParser();
    _subVariablesGroup = {
        Numeric: [],
        Stream: []
    };

    /*
     * Inicializa la variable HistoricalData con la lista de subvariables segun el tipo de valor y
     * para la lista de puntos de medicion solicitado
     */
    _initializeHistoricalData = function (mdVariableIdList, widgetId, valueType) {
        var
            allSubVariables,
            typedSubVariables,
            i, j,
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

    /*
     * Obtiene los datos numericos en modo historico de un grupo de MdVariables
     * @param {Array} mdVariableIdList Listado de MdVariables a consultar en modo historico
     */
    this.GetNumericHistoricalData = function (mdVariableIdList, principalAssetId, startDate, endDate, widgetId) {
        if (!mdVariableIdList || !principalAssetId) return;

        var
            factor,
            interval,
            timeStampRange,
            historicalData,
            limit,
            iterations,
            i;

        _xhrArray = [];
        historicalData = _initializeHistoricalData(mdVariableIdList, widgetId, 1);
        $.ajax({
            url: "/Home/GetDistinctTimeStamp",
            method: "GET",
            data: {
                principalAssetId: principalAssetId,
                startDate: startDate,
                endDate: endDate,
            },
            success: function (timeStampList) {
                if (timeStampList.length > 0) {
                    for (i = 0; i < timeStampList.length; i += 1) {
                        historicalData[widgetId].TimeStampArray[i] = new Date(timeStampList[i] + "+00:00").toISOString();
                    }
                    timeStampList = _getTimeStampToRequest(historicalData[widgetId].TimeStampArray, historicalData, widgetId);
                    _historicalCount = timeStampList.length;
                    if (_historicalCount === 0) {
                        PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                        return;
                    }

                    _currentHistoricalLength = 0;
                    factor = Math.floor(5000 / mdVariableIdList.length);
                    factor = (5000 % mdVariableIdList.length === 0) ? factor : factor + 1;
                    iterations = Math.floor(timeStampList.length / factor) + 1;
                    i = 0;
                    interval = setInterval(function () {
                        if (i >= iterations) {
                            return clearInterval(interval);
                        }
                        if (i + 1 === iterations) {
                            limit = timeStampList.length - i * factor;
                            if (limit <= 0) {
                                return clearInterval(interval);
                            }
                            timeStampRange = timeStampList.slice(i * factor, timeStampList.length);
                        } else {
                            limit = factor;
                            timeStampRange = timeStampList.slice(i * factor, (i + 1) * factor);
                        }
                        startDate = timeStampRange[0];
                        endDate = timeStampRange[timeStampRange.length - 1];
                        _xhrArray[i] = _getNumericHistoricalData(mdVariableIdList, startDate, endDate, limit, timeStampRange, widgetId, historicalData, i);
                        i += 1;
                    }, 2000);
                } else {
                    PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                }
            },
            error: function (jqXHR, textStatus) {
                console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
            }
        });
    };

    _getNumericHistoricalData = function (mdVariableIdList, startDate, endDate, limit, timeStampRange, widgetId, historicalData, t) {
        var
            response,
            xhr;

        xhr = $.ajax({
            url: "/Home/GetNumericHistoricalData",
            method: "POST",
            data: {
                mdVariableIdList: mdVariableIdList,
                startDate: startDate,
                endDate: endDate,
                limit: limit
            },
            success: function (resp) {
                response = JSON.parse(resp);
                _currentHistoricalLength += limit;
                //_saveNumericLocal(response, (_currentHistoricalLength >= _historicalCount), historicalData, timeStampRange, _xhrArray);
                Concurrent.Thread.create(_saveNumericLocal, response, (_currentHistoricalLength >= _historicalCount), historicalData, timeStampRange, _xhrArray);
            },
            error: function (jqXHR, textStatus) {
                console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                //_getNumericHistoricalData(mdVariableIdList, startDate, endDate, widgetId, limit, skip, historicalData, t);
            }
        });
        return xhr;
    };

    _saveNumericLocal = function (response, flag, historicalData, timeStampArray, xhrArray) {
        var
            currentSubVariable,
            dataByTimeStamp,
            timeStamp,
            i, j, k;

        for (i = 0; i < response.length; i += 1) {
            currentSubVariable = response[i].HistoricalBySubVariable;
            for (j = 0; j < currentSubVariable.length; j += 1) {
                dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                for (k = 0; k < dataByTimeStamp.length; k += 1) {
                    dataByTimeStamp[k].RawTimeStamp = new Date(dataByTimeStamp[k].TimeStamp + "+00:00");
                    timeStamp = dataByTimeStamp[k].RawTimeStamp.getTime();
                    dataByTimeStamp[k].TimeStamp = formatDate(dataByTimeStamp[k].RawTimeStamp);
                    if (dataByTimeStamp[k].StatusId != "") {
                        dataByTimeStamp[k].StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                            new ej.Query().where("Id", "equal", dataByTimeStamp[k].StatusId))[0].Color;
                    } else {
                        dataByTimeStamp[k].StatusColor = "#999999";
                    }
                    subVariableHTList[currentSubVariable[j].SubVariableId][timeStamp] = dataByTimeStamp[k];
                }
            }
        }

        // Si ya fueron cargados todos los datos notificarlo
        if (flag) {
            PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
        }
    };

    this.GetSingleDynamicHistoricalData = function (mdVariableIdList, subVariableIdList, timeStamp, widgetId) {
        var
            response,
            temp,
            stream,
            listId,
            dataArray,
            dataItem,
            historicalBySubVariable,
            i, j;

        temp = [];
        listId = clone(subVariableIdList);
        for (i = 0; i < subVariableIdList.length; i += 1) {
            if (subVariableHTList.hasOwnProperty(subVariableIdList[i])) {
                if (subVariableHTList[subVariableIdList[i]].hasOwnProperty(timeStamp)) {
                    temp[subVariableIdList[i]] = [];
                    temp[subVariableIdList[i]][timeStamp] = subVariableHTList[subVariableIdList[i]][timeStamp];
                    listId.splice(i, 1);
                }
            }
        }

        // Publicamos la informacion que ya exista en memoria
        if (temp.length > 0 && listId.length == 0) {
            PublisherSubscriber.publish("/historic/refresh", temp);
            // Resetear el listado de Ids
            subVariableIdList = [];
        }

        // Consultamos las subvariables que no existen en memoria, para almacenarlas posteriormente
        if (subVariableIdList.length > 0) {
            $.ajax({
                url: "/Home/GetSingleDynamicHistoricalData",
                method: "POST",
                data: {
                    mdVariableIdList: mdVariableIdList,
                    timeStamp: new Date(parseInt(timeStamp)).toISOString()
                },
                success: function (resp) {
                    response = JSON.parse(resp);
                    dataArray = [];

                    for (i = 0; i < response.length; i += 1) {
                        historicalBySubVariable = response[i].HistoricalBySubVariable;
                        for (j = 0; j < historicalBySubVariable.length; j += 1) {
                            dataItem = {};
                            dataItem.RawTimeStamp = new Date(historicalBySubVariable[j].SubVariableDataList[0].TimeStamp + "+00:00");
                            dataItem.TimeStamp = formatDate(dataItem.RawTimeStamp);
                            if (historicalBySubVariable[j].SubVariableDataList[0].StatusId != "") {
                                dataItem.StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                    new ej.Query().where("Id", "equal", historicalBySubVariable[j].SubVariableDataList[0].StatusId))[0].Color;
                            } else {
                                dataItem.StatusColor = "#999999";
                            }
                            stream = _streamParser.GetWaveForm(historicalBySubVariable[j].SubVariableDataList[0].Value);
                            if (stream.keyphasor.length > 0) {
                                dataItem.KeyphasorPositionsOnTime = GetKeyphasorOnTime(stream.keyphasor, stream.sampleTime, stream.signalLength);
                                dataItem.KeyphasorPositions = stream.keyphasor;
                            }

                            dataItem.Value = GetXYDataOnTime(stream.waveform, stream.sampleTime);
                            dataItem.RawValue = stream.waveform;
                            dataItem.SampleRate = stream.signalLength / stream.sampleTime;

                            if (!subVariableHTList[historicalBySubVariable[j].SubVariableId]) {
                                subVariableHTList[historicalBySubVariable[j].SubVariableId] = [];
                            }
                            subVariableHTList[historicalBySubVariable[j].SubVariableId][timeStamp] = dataItem;
                            dataArray[historicalBySubVariable[j].SubVariableId] = [];
                            dataArray[historicalBySubVariable[j].SubVariableId][timeStamp] = dataItem;
                            dataArray[historicalBySubVariable[j].SubVariableId].WidgetId = widgetId
                        }
                    }

                    for (i = 0; i < subVariableIdList.length; i += 1) {
                        if (!dataArray.hasOwnProperty.call(dataArray, subVariableIdList[i])) {
                            dataArray[subVariableIdList[i]] = [];
                            dataArray[subVariableIdList[i]][timeStamp] = {};
                            dataArray[subVariableIdList[i]].WidgetId = widgetId
                        }
                    }

                    PublisherSubscriber.publish("/historic/refresh", dataArray);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        }
    };

    this.GetDynamicHistoricalData = function (mdVariableIdList, timeStampList, widgetId) {
        var
            historicalData,
            factor,
            iterations,
            interval, i,
            timeStampRange;

        _xhrArray = [];
        historicalData = _initializeHistoricalData(mdVariableIdList, widgetId, 3);
        historicalData[widgetId].TimeStampArray = timeStampList;
        timeStampList = _getTimeStampToRequest(timeStampList, historicalData, widgetId);
        _historicalCount = timeStampList.length;
        if (_historicalCount === 0) {
            PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
            return;
        }

        _currentHistoricalLength = 0;
        factor = Math.floor(500 / mdVariableIdList.length);
        factor = (500 % mdVariableIdList.length === 0) ? factor : factor + 1;
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
            _xhrArray[i] = _getStreamHistoricalData(mdVariableIdList, timeStampRange, widgetId, historicalData, i);
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
                _currentHistoricalLength += timeStampRange.length;
                //_saveStreamLocal(response, (_currentHistoricalLength >= _historicalCount), historicalData, _xhrArray);
                Concurrent.Thread.create(_saveStreamLocal, response, (_currentHistoricalLength >= _historicalCount), historicalData, _xhrArray, _streamParser);
            },
            error: function (jqXHR, textStatus) {
                console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
            }
        });
    };

    _saveStreamLocal = function (response, flag, historicalData, xhrArray, streamParser) {
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
                    timeStamp = new Date(dataByTimeStamp[k].TimeStamp + "+00:00").getTime();
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

        // Si ya fueron cargados todos los datos notificarlo
        if (flag) {
            PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
        }
    };
};
