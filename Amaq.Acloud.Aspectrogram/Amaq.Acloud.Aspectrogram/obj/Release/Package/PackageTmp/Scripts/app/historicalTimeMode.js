/*
 * AMAQ 2016
 * Consulta el historico de subvariables
 * @author ACLOUD TEAM
 */

/* globals StreamParser, mainCache, clone, PublisherSubscriber, AjaxErrorHandling, aidbManager, ej, Concurrent,
   arrayObjectStatus, GetKeyphasorOnTime, formatDate, GetXYDataOnTime*/

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
            _initializeHistoricalData,
            _getNumericHistoricalData,
            _getStreamHistoricalData,
            _saveNumericLocal,
            _saveStreamLocal,
            _getNumericIntervalLocal,
            _getNumericIntervalRemote,
            _getStreamIntervalLocal,
            _getStreamIntervalRemote;

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
                TimeStampArray: [],
                Data: []
            };
            return historicalData;
        };

        /*
         * Obtiene los datos numericos en modo historico de un grupo de MdVariables
         * @param {Array} mdVariableIdList Listado de MdVariables a consultar en modo historico
         */
        this.GetNumericHistoricalData = function (mdVarIdList, subVarIdList, assetNodeId, principalAssetId, startDate, endDate, widgetId) {
            var
                historicalData,
                i,
                factor,
                iterations,
                notLocalTimeStamp;

            historicalData = _initializeHistoricalData(mdVarIdList, widgetId, 1);
            $.ajax({
                url: "/Home/GetDistinctTimeStamp",
                method: "GET",
                data: {
                    principalAssetId: principalAssetId,
                    startDate: startDate,
                    endDate: endDate
                },
                success: function (timeStampList) {
                    timeStampList = JSON.parse(timeStampList);
                    if (timeStampList.length > 0) {
                        for (i = 0; i < timeStampList.length; i += 1) {
                            timeStampList[i] = new Date(timeStampList[i] + "+00:00").getTime();
                        }
                        historicalData[widgetId].TimeStampArray = clone(timeStampList);
                        // AQUI CON UN ALGORITMO DIVIDO LA BUSQUEDA DE INFORMACION SI EL RANGO ES DEMASIADO GRANDE
                        factor = Math.floor(5000 / mdVarIdList.length);
                        factor = (5000 % mdVarIdList.length === 0) ? factor : factor + 1;
                        iterations = Math.floor(timeStampList.length / factor) + 1;
                        i = 0;
                        notLocalTimeStamp = [];
                        _getNumericIntervalLocal(i, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
                    } else {
                        PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                    }
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _getNumericIntervalLocal = function (position, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId) {
            var
                timeStampRange,
                group,
                notStored,
                i, j;

            if (position + 1 > iterations) {
                // Significa que se cumplieron todas las iteraciones
                if (notLocalTimeStamp.length > 0) {
                    iterations = Math.floor(notLocalTimeStamp.length / factor) + 1;
                    i = 0;
                    _getNumericIntervalRemote(i, factor, iterations, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
                }
                return;
            } else if (position + 1 === iterations) {
                timeStampRange = timeStampList.slice(position * factor, timeStampList.length);
            } else {
                timeStampRange = timeStampList.slice(position * factor, (position + 1) * factor);
            }
            aidbManager.GetNumericBySubVariableIdAndTimeStampList(subVarIdList, timeStampRange, assetNodeId, function (resp) {
                // Si se encuentran los valores, se publican, de lo contrario, se solicitan al servidor
                group = ej.DataManager(resp).executeLocal(new ej.Query().group("timeStamp"));
                notStored = clone(timeStampRange);
                for (i = 0; i < group.length; i += 1) {
                    j = notStored.indexOf(group[i].key);
                    notStored.splice(j, 1);
                }
                // Publicar datos existentes
                historicalData[widgetId].Data = resp;
                PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                // Consultar datos faltantes
                if (notStored.length > 0) {
                    for (i = 0; i < notStored.length; i += 1) {
                        notLocalTimeStamp.push(new Date(notStored[i]).toISOString());
                    }
                }
                position += 1;
                _getNumericIntervalLocal(position, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
            });
        };

        _getNumericIntervalRemote = function (position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId) {
            var
                timeStampRange,
                startDate,
                endDate,
                limit;

            if (position + 1 > iterations) {
                // Significa que se cumplieron todas las iteraciones
                return;
            } else if (position + 1 === iterations) {
                timeStampRange = timeStampList.slice(position * factor, timeStampList.length);
            } else {
                timeStampRange = timeStampList.slice(position * factor, (position + 1) * factor);
            }
            // Consultar datos faltantes
            startDate = timeStampRange[0];
            endDate = timeStampRange[timeStampRange.length - 1];
            limit = timeStampRange.length;
            _getNumericHistoricalData(mdVarIdList, startDate, endDate, limit, historicalData, widgetId, subVarIdList, assetNodeId);
            setTimeout(function () {
                position += 1;
                _getNumericIntervalRemote(position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
            }, 500);
        };

        _getNumericHistoricalData = function (mdVarIdList, startDate, endDate, limit, historicalData, widgetId, subVarIdList, assetNodeId) {
            var
                response;

            $.ajax({
                url: "/Home/GetNumericHistoricalData",
                method: "POST",
                data: {
                    mdVariableIdList: mdVarIdList,
                    startDate: startDate,
                    endDate: endDate,
                    limit: limit
                },
                success: function (resp) {
                    response = JSON.parse(resp);
                    //_saveNumericLocal(response, historicalData, widgetId, subVarIdList, assetNodeId);
                    Concurrent.Thread.create(_saveNumericLocal, response, historicalData, widgetId, subVarIdList, assetNodeId);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _saveNumericLocal = function (response, historicalData, widgetId, subVariableIdList, assetNodeId) {
            var
                i, j, k,
                idx,
                currentSubVariable,
                dataByTimeStamp,
                statusColor,
                dataArray,
                tmpArray;

            dataArray = [];
            tmpArray = [];
            for (i = 0; i < response.length; i += 1) {
                currentSubVariable = response[i].HistoricalBySubVariable;
                for (j = 0; j < currentSubVariable.length; j += 1) {
                    dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                    for (k = 0; k < dataByTimeStamp.length; k += 1) {
                        if (dataByTimeStamp[k].StatusId !== "") {
                            statusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                new ej.Query().where("Id", "equal", dataByTimeStamp[k].StatusId))[0].Color;
                        } else {
                            statusColor = "#999999";
                        }
                        idx = subVariableIdList.indexOf(currentSubVariable[j].SubVariableId);
                        if (idx > -1) {
                            tmpArray.push({
                                subVariableId: currentSubVariable[j].SubVariableId,
                                timeStamp: new Date(dataByTimeStamp[k].TimeStamp + "+00:00").getTime(),
                                value: dataByTimeStamp[k].Value,
                                statusColor: statusColor,
                                isChangeOfRpm: dataByTimeStamp[k].IsChangeOfRpm,
                                isEvent: dataByTimeStamp[k].IsEvent,
                                isNormal: dataByTimeStamp[k].IsNormal
                            });
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

            aidbManager.AddNumericItemList(dataArray, assetNodeId);
            historicalData[widgetId].Data = tmpArray;
            PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
        };

        this.GetSingleDynamicHistoricalData = function (mdVariableIdList, assetNodeId, subVariableIdList, timeStamp, widgetId) {
            var
                response,
                dataArray,
                dataItem,
                currentSubVariable,
                stream,
                refPositions,
                i, j;

            aidbManager.GetStreamBySubVariableIdAndTimeStampList(subVariableIdList, [parseInt(timeStamp)], assetNodeId, function (data) {
                if (data.length === subVariableIdList.length) {
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
                                    if (currentSubVariable[j].SubVariableDataList[0].StatusId !== "") {
                                        dataItem.StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                            new ej.Query().where("Id", "equal", currentSubVariable[j].SubVariableDataList[0].StatusId))[0].Color;
                                    } else {
                                        dataItem.StatusColor = "#999999";
                                    }
                                    // En caso de que la informacion no se encuentre correctamente almacenada
                                    if (currentSubVariable[j].SubVariableDataList[0].Value === null) {
                                        continue;
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
                                    }, assetNodeId);

                                    dataArray[currentSubVariable[j].SubVariableId] = [];
                                    dataArray[currentSubVariable[j].SubVariableId][timeStamp] = dataItem;
                                    dataArray[currentSubVariable[j].SubVariableId].WidgetId = widgetId;
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
                                    }, assetNodeId);
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

        this.GetDynamicHistoricalData = function (mdVarIdList, subVarIdList, assetNodeId, timeStampList, widgetId) {
            var
                historicalData,
                factor,
                iterations,
                index,
                notLocalTimeStamp;

            historicalData = _initializeHistoricalData(mdVarIdList, widgetId, 3);
            historicalData[widgetId].TimeStampArray = timeStampList;
            // Dividir la busqueda de informacion si el rango es demasiado grande
            factor = Math.floor(1000 / mdVarIdList.length);
            factor = (1000 % mdVarIdList.length === 0) ? factor : factor + 1;
            iterations = Math.floor(timeStampList.length / factor) + 1;
            index = 0;
            notLocalTimeStamp = [];
            _getStreamIntervalLocal(index, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
        };

        _getStreamIntervalLocal = function (position, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId) {
            var
                timeStampRange,
                pubData,
                group,
                notStored,
                i, j;

            if (position + 1 > iterations) {
                // Significa que se cumplieron todas las iteraciones
                if (notLocalTimeStamp.length > 0) {
                    iterations = Math.floor(notLocalTimeStamp.length / factor) + 1;
                    i = 0;
                    _getStreamIntervalRemote(i, factor, iterations, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
                }
                return;
            } else if (position + 1 === iterations) {
                timeStampRange = timeStampList.slice(position * factor, timeStampList.length);
            } else {
                timeStampRange = timeStampList.slice(position * factor, (position + 1) * factor);
            }
            pubData = [];
            aidbManager.GetStreamBySubVariableIdAndTimeStampList(subVarIdList, timeStampRange, assetNodeId, function (resp) {
                // Si se encuentran los valores, se publican, de lo contrario, se solicitan al servidor
                group = ej.DataManager(resp).executeLocal(new ej.Query().group("timeStamp"));
                notStored = clone(timeStampRange);
                for (i = 0; i < group.length; i += 1) {
                    if (group[i].items.length === subVarIdList.length) {
                        j = notStored.indexOf(group[i].key);
                        notStored.splice(j, 1);
                        pubData.pushArray(group[i].items);
                    }
                }
                // Publicar datos existentes
                if (pubData.length > 0) {
                    historicalData[widgetId].Data = pubData;
                    PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
                }
                // Consultar datos faltantes
                if (notStored.length > 0) {
                    for (i = 0; i < notStored.length; i += 1) {
                        notLocalTimeStamp.push(new Date(notStored[i]).toISOString());
                    }
                }
                position += 1;
                _getStreamIntervalLocal(position, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
            });
        };

        _getStreamIntervalRemote = function (position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId) {
            var
                timeStampRange;

            if (position + 1 > iterations) {
                // Significa que se cumplieron todas las iteraciones
                return;
            } else if (position + 1 === iterations) {
                timeStampRange = timeStampList.slice(position * factor, timeStampList.length);
            } else {
                timeStampRange = timeStampList.slice(position * factor, (position + 1) * factor);
            }
            // Consultar datos faltantes
            _getStreamHistoricalData(mdVarIdList, timeStampRange, assetNodeId, historicalData, widgetId, subVarIdList);
            setTimeout(function () {
                position += 1;
                _getStreamIntervalRemote(position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, widgetId);
            }, 1000);
        };

        _getStreamHistoricalData = function (mdVarIdList, timeStampRange, assetNodeId, historicalData, widgetId, subVarIdList) {
            var
                response;

            $.ajax({
                url: "/Home/GetDynamicHistoricalData",
                method: "POST",
                data: {
                    mdVariableIdList: mdVarIdList,
                    timeStampArray: timeStampRange
                },
                success: function (resp) {
                    response = JSON.parse(resp);
                    //_saveStreamLocal(response, historicalData, widgetId, subVarIdList, assetNodeId, _streamParser);
                    Concurrent.Thread.create(_saveStreamLocal, response, historicalData, widgetId, subVarIdList, assetNodeId, _streamParser);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _saveStreamLocal = function (response, historicalData, widgetId, subVarIdList, assetNodeId, streamParser) {
            var
                i, j, k,
                idx,
                tmpArray,
                currentSubVariable,
                dataByTimeStamp,
                statusColor,
                stream;

            tmpArray = [];
            for (i = 0; i < response.length; i += 1) {
                currentSubVariable = response[i].HistoricalBySubVariable;
                for (j = 0; j < currentSubVariable.length; j += 1) {
                    dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                    for (k = 0; k < dataByTimeStamp.length; k += 1) {
                        if (currentSubVariable[j].SubVariableDataList[0].StatusId !== "") {
                            statusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                new ej.Query().where("Id", "equal", currentSubVariable[j].SubVariableDataList[0].StatusId))[0].Color;
                        } else {
                            statusColor = "#999999";
                        }
                        // En caso de que la informacion no se encuentre correctamente almacenada
                        if (currentSubVariable[j].SubVariableDataList[0].Value === null) {
                            continue;
                        }
                        stream = streamParser.GetWaveForm(dataByTimeStamp[k].Value);
                        idx = subVarIdList.indexOf(currentSubVariable[j].SubVariableId);
                        if (idx > -1) {
                            tmpArray.push({
                                subVariableId: currentSubVariable[j].SubVariableId,
                                timeStamp: new Date(dataByTimeStamp[k].TimeStamp + "+00:00").getTime(),
                                value: stream.waveform,
                                sampleTime: stream.sampleTime,
                                referencePositions: stream.keyphasor,
                                statusColor: statusColor,
                                isChangeOfRpm: dataByTimeStamp[k].IsChangeOfRpm,
                                isEvent: dataByTimeStamp[k].IsEvent,
                                isNormal: dataByTimeStamp[k].IsNormal
                            });
                        }
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
                        }, assetNodeId);
                    }
                }
            }

            // Publicamos la informacion
            historicalData[widgetId].Data = tmpArray;
            PublisherSubscriber.publish("/historicTrend/refresh", historicalData);
        };
    };

    return HistoricalTimeMode;
})();