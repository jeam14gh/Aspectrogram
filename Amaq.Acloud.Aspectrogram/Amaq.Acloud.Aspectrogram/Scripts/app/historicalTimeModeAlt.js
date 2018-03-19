/*
 * AMAQ 2016
 * Consulta el historico de subvariables
 * @author ACLOUD TEAM
 */

var HistoricalTimeMode = {};

HistoricalTimeMode = (function () {
    "use strict";

    /*
     * Constructor.
     */
    HistoricalTimeMode = function () {
        // Propiedades privadas
        var
            _streamParser,
            _historicalCount,
            _initializeHistoricalData,
            _getNumericHistoricalData,
            _getStreamHistoricalData,
            _saveNumericLocal,
            _saveStreamLocal,
            _getTimeStampToRequest,
            _currentHistoricalLength;

        _streamParser = new StreamParser();

        /*
         * Inicializa la variable HistoricalData con la lista de subvariables segun el tipo de valor y
         * para la lista de puntos de medicion solicitado
         */
        _initializeHistoricalData = function (mdVariableIdList, widgetId, valueType) {
            var
                i,
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
            typedSubVariables.pushArray(new ej.DataManager(allSubVariables).executeLocal(
                new ej.Query().where("ValueType", "equal", valueType, false).select("Id")));
            historicalData[widgetId] = {
                SubVariableIdList: typedSubVariables,
                TimeStampArray: []
            };
            return historicalData;
        };

        /*
         * Obtiene los datos numericos en modo historico de un grupo de MdVariables
         * @param {Array} mdVariableIdList Listado de MdVariables a consultar en modo historico
         */
        this.GetNumericHistoricalData = function (mdVariableIdList, assetId, principalAssetId, startDate, endDate, widgetId) {
            if (!mdVariableIdList || !principalAssetId) return;

            var
                historicalData,
                i, index,
                subVariables,
                factor,
                iterations,
                interval,
                timeStampRange,
                limit;

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
                            historicalData[widgetId].TimeStampArray[i] = new Date(timeStampList[i] + "+00:00").getTime();
                        }
                        subVariables = historicalData[widgetId].SubVariableIdList;
                        aidbManager.GetNumericsNotStored(subVariables, historicalData[widgetId].TimeStampArray, assetId, function (timeStampArray) {
                            _historicalCount = timeStampArray.length;
                            if (_historicalCount === 0) {
                                PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                                return;
                            }
                            for (i = 0; i < _historicalCount; i += 1) {
                                timeStampArray[i] = new Date(timeStampArray[i]).toISOString();
                            }
                            _currentHistoricalLength = 0;
                            factor = Math.floor(5000 / mdVariableIdList.length);
                            factor = (5000 % mdVariableIdList.length === 0) ? factor : factor + 1;
                            iterations = Math.floor(timeStampArray.length / factor) + 1;
                            i = 0;
                            interval = setInterval(function () {
                                if (i >= iterations) {
                                    return clearInterval(interval);
                                }
                                if (i + 1 === iterations) {
                                    limit = timeStampArray.length - i * factor;
                                    if (limit <= 0) {
                                        return clearInterval(interval);
                                    }
                                    timeStampRange = timeStampArray.slice(i * factor, timeStampArray.length);
                                } else {
                                    limit = factor;
                                    timeStampRange = timeStampArray.slice(i * factor, (i + 1) * factor);
                                }
                                startDate = timeStampRange[0];
                                endDate = timeStampRange[timeStampRange.length - 1];
                                _getNumericHistoricalData(mdVariableIdList, assetId, startDate, endDate, limit, timeStampRange, historicalData, i);
                                i += 1;
                            }, 2000);
                        });
                    } else {
                        PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                    }
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _getNumericHistoricalData = function (mdVariableIdList, assetId, startDate, endDate, limit, timeStampRange, historicalData, t) {
            var
                response,
                flag;

            $.ajax({
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
                    flag = (_currentHistoricalLength >= _historicalCount);
                    //_saveNumericLocal(response, flag, historicalData, timeStampRange, assetId);
                    Concurrent.Thread.create(_saveNumericLocal, response, flag, historicalData, timeStampRange, assetId);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _saveNumericLocal = function (response, flag, historicalData, timeStampArray, assetId) {
            var
                i, j, k,
                currentSubVariable,
                dataByTimeStamp,
                statusColor,
                dataArray;

            dataArray = [];
            for (i = 0; i < response.length; i += 1) {
                currentSubVariable = response[i].HistoricalBySubVariable;
                for (j = 0; j < currentSubVariable.length; j += 1) {
                    dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                    for (k = 0; k < dataByTimeStamp.length; k += 1) {
                        if (dataByTimeStamp[k].StatusId != "") {
                            statusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                new ej.Query().where("Id", "equal", dataByTimeStamp[k].StatusId))[0].Color;
                        } else {
                            statusColor = "#999999";
                        }
                        dataArray.push({
                            subVariableId: currentSubVariable[j].SubVariableId,
                            timeStamp: new Date(dataByTimeStamp[k].TimeStamp + "+00:00").getTime(),
                            value: dataByTimeStamp[k].Value,
                            statusColor: statusColor,
                            isChangeOfRpm: dataByTimeStamp[k].IsChangeOfRpm,
                            isEvent: dataByTimeStamp[k].IsEvent,
                            isNormal: dataByTimeStamp[k].IsNormal
                        });
                    }
                }
            }

            aidbManager.AddNumericItemList(dataArray, assetId);

            // Si ya fueron cargados todos los datos notificarlo
            if (flag) {
                PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
            }
        };

        this.GetSingleDynamicHistoricalData = function (mdVariableIdList, assetId, subVariableIdList, timeStamp, widgetId) {
            var
                response,
                dataArray,
                dataItem,
                currentSubVariable,
                stream,
                refPositions,
                i, j;

            aidbManager.GetStreamBySubVariableIdAndTimeStampList(subVariableIdList, [parseInt(timeStamp)], assetId, function (data) {
                if (data.length > 0) {
                    dataArray = [];
                    for (i = 0; i < data.length; i += 1) {
                        dataArray[data[i].subVariableId] = [];
                        refPositions = (data[i].referencePositions.length > 0) ?
                            GetKeyphasorOnTime(data[i].referencePositions, data[i].sampleTime, data[i].value.length) : [];
                        dataArray[data[i].subVariableId][timeStamp] = {
                            TimeStamp: formatDate(new Date(data[i].timeStamp)),
                            SampleTime: clone(data[i].sampleTime),
                            RawValue: clone(data[i].value),
                            Value: GetXYDataOnTime(data[i].value, data[i].sampleTime),
                            SampleRate: data[i].value.length / data[i].sampleTime,
                            KeyphasorPositions: data[i].referencePositions,
                            KeyphasorPositionsOnTime: refPositions
                        };
                        dataArray[data[i].subVariableId].WidgetId = widgetId;
                    }
                    // Publicamos la informacion ya que existe localmente
                    PublisherSubscriber.publish("/historic/refresh", dataArray);
                } else {
                    // Consultamos la informacion de las subvariables, para almacenarlas posteriormente
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
                                currentSubVariable = response[i].HistoricalBySubVariable;
                                for (j = 0; j < currentSubVariable.length; j += 1) {
                                    dataItem = {};
                                    dataItem.RawTimeStamp = new Date(currentSubVariable[j].SubVariableDataList[0].TimeStamp + "+00:00");
                                    dataItem.TimeStamp = formatDate(dataItem.RawTimeStamp);
                                    if (currentSubVariable[j].SubVariableDataList[0].StatusId != "") {
                                        dataItem.StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                            new ej.Query().where("Id", "equal", currentSubVariable[j].SubVariableDataList[0].StatusId))[0].Color;
                                    } else {
                                        dataItem.StatusColor = "#999999";
                                    }
                                    stream = _streamParser.GetWaveForm(currentSubVariable[j].SubVariableDataList[0].Value);
                                    dataItem.KeyphasorPositions = stream.keyphasor;
                                    if (stream.keyphasor.length > 0) {
                                        dataItem.KeyphasorPositionsOnTime = GetKeyphasorOnTime(stream.keyphasor, stream.sampleTime, stream.signalLength);
                                    } else {
                                        dataItem.KeyphasorPositionsOnTime = [];
                                    }

                                    dataItem.Value = GetXYDataOnTime(stream.waveform, stream.sampleTime);
                                    dataItem.RawValue = stream.waveform;
                                    dataItem.SampleRate = stream.signalLength / stream.sampleTime;
                                    aidbManager.AddStreamItem({
                                        subVariableId: currentSubVariable[j].SubVariableId,
                                        timeStamp: dataItem.RawTimeStamp.getTime(),
                                        value: dataItem.RawValue,
                                        sampleTime: stream.sampleTime,
                                        referencePositions: stream.keyphasor,
                                        statusColor: dataItem.StatusColor,
                                        isChangeOfRpm: currentSubVariable[j].SubVariableDataList[0].IsChangeOfRpm,
                                        isEvent: currentSubVariable[j].SubVariableDataList[0].IsEvent,
                                        isNormal: currentSubVariable[j].SubVariableDataList[0].IsNormal
                                    }, assetId);
                                    
                                    dataArray[currentSubVariable[j].SubVariableId] = [];
                                    dataArray[currentSubVariable[j].SubVariableId][timeStamp] = dataItem;
                                    dataArray[currentSubVariable[j].SubVariableId].WidgetId = widgetId
                                }
                            }

                            for (i = 0; i < subVariableIdList.length; i += 1) {
                                if (!dataArray.hasOwnProperty(subVariableIdList[i])) {
                                    dataArray[subVariableIdList[i]] = [];
                                    dataArray[subVariableIdList[i]][timeStamp] = {};
                                    dataArray[subVariableIdList[i]].WidgetId = widgetId;
                                    aidbManager.AddStreamItem({
                                        subVariableId: subVariableIdList[i],
                                        timeStamp: timeStamp,
                                        value: null
                                    }, assetId);
                                }
                            }

                            PublisherSubscriber.publish("/historic/refresh", dataArray);
                        },
                        error: function (jqXHR, textStatus) {
                            console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                        }
                    });
                }
            });
        };

        this.GetDynamicHistoricalData = function (mdVariableIdList, assetId, timeStampList, widgetId) {
            var
                historicalData,
                subVariables,
                index,
                factor,
                iterations,
                interval, i,
                timeStampRange;

            historicalData = _initializeHistoricalData(mdVariableIdList, widgetId, 3);
            historicalData[widgetId].TimeStampArray = timeStampList;
            subVariables = historicalData[widgetId].SubVariableIdList;
            aidbManager.GetStreamsNotStored(subVariables, historicalData[widgetId].TimeStampArray, assetId, function (timeStampArray) {
                _historicalCount = timeStampArray.length;
                if (_historicalCount === 0) {
                    PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                    return;
                }
                for (i = 0; i < _historicalCount; i += 1) {
                    index = historicalData[widgetId].TimeStampArray.indexOf(timeStampArray[i]);
                    if (index > -1) {
                        historicalData[widgetId].TimeStampArray.splice(index, 1);
                    }
                    timeStampArray[i] = new Date(timeStampArray[i]).toISOString();
                }
                PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                _currentHistoricalLength = 0;
                factor = Math.floor(500 / mdVariableIdList.length);
                factor = (500 % mdVariableIdList.length === 0) ? factor : factor + 1;
                iterations = Math.floor(timeStampArray.length / factor) + 1;
                i = 0;
                interval = setInterval(function () {
                    if (i >= iterations) {
                        return clearInterval(interval);
                    }
                    if (i + 1 === iterations) {
                        if (timeStampArray.length - i * factor <= 0) {
                            return clearInterval(interval);
                        }
                        timeStampRange = timeStampArray.slice(i * factor, timeStampArray.length);
                    } else {
                        timeStampRange = timeStampArray.slice(i * factor, (i + 1) * factor);
                    }
                    _getStreamHistoricalData(mdVariableIdList, assetId, timeStampRange, historicalData, i);
                    i += 1;
                }, 2000);
            });
        };

        _getStreamHistoricalData = function (mdVariableIdList, assetId, timeStampRange, historicalData, t) {
            var
                flag,
                response;

            $.ajax({
                url: "/Home/GetDynamicHistoricalData",
                method: "POST",
                data: {
                    mdVariableIdList: mdVariableIdList,
                    timeStampArray: timeStampRange
                },
                success: function (resp) {
                    response = JSON.parse(resp);
                    _currentHistoricalLength += timeStampRange.length;
                    flag = (_currentHistoricalLength >= _historicalCount);
                    //_saveStreamLocal(response, flag, historicalData, assetId, _streamParser);
                    Concurrent.Thread.create(_saveStreamLocal, response, flag, historicalData, assetId, _streamParser);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _saveStreamLocal = function (response, flag, historicalData, assetId, streamParser) {
            var
                i, j, k,
                currentSubVariable,
                dataByTimeStamp,
                timeStamp,
                statusColor,
                stream;

            for (i = 0; i < response.length; i += 1) {
                currentSubVariable = response[i].HistoricalBySubVariable;
                for (j = 0; j < currentSubVariable.length; j += 1) {
                    dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                    for (k = 0; k < dataByTimeStamp.length; k += 1) {
                        if (currentSubVariable[j].SubVariableDataList[0].StatusId != "") {
                            statusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                new ej.Query().where("Id", "equal", currentSubVariable[j].SubVariableDataList[0].StatusId))[0].Color;
                        } else {
                            statusColor = "#999999";
                        }
                        stream = streamParser.GetWaveForm(dataByTimeStamp[k].Value);
                        aidbManager.AddStreamItem({
                            subVariableId: currentSubVariable[j].SubVariableId,
                            timeStamp: new Date(dataByTimeStamp[k].TimeStamp + "+00:00").getTime(),
                            value: stream.waveform,
                            sampleTime: stream.sampleTime,
                            referencePositions: stream.keyphasor,
                            statusColor: statusColor,
                            isChangeOfRpm: dataByTimeStamp[k].IsChangeOfRpm,
                            isEvent: dataByTimeStamp[k].IsEvent,
                            isNormal: dataByTimeStamp[k].IsNormal
                        }, assetId);
                    }
                }
            }

            // Si ya fueron cargados todos los datos notificarlo
            if (flag) {
                PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
            }
        };
    };

    return HistoricalTimeMode;
})();
