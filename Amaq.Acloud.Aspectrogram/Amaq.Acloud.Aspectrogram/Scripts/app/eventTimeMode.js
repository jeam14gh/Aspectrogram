/*
 * AMAQ 2016
 * Consulta los eventos especificos de un activo o maquina
 * @author ACLOUD TEAM
 */

var EventTimeMode = {};

EventTimeMode = (function () {
    "use strict";

    /*
     * Constructor.
     */
    EventTimeMode = function () {
        // Propiedades privadas
        var
            // Auto-referencia de la clase EventTimeMode
            _this,
            _streamParser,
            _historicalCount,
            _initializeHistoricalData,
            _getStreamInterval,
            _getStreamHistoricalData,
            _saveStreamLocal,
            _currentHistoricalLength;

        _streamParser = new StreamParser();
        _this = this;

        /*
         * Inicializa la variable HistoricalData con la lista de subvariables segun el tipo de valor y
         * para la lista de puntos de medicion solicitado
         */
        _initializeHistoricalData = function (mdVariableIdList, playerId, valueType) {
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
            historicalData[playerId] = {
                SubVariableIdList: typedSubVariables,
                TimeStampArray: []
            };
            return historicalData;
        };

        //this.GetAllValues = function (mdVariableIdList, assetId, timeStampList, playerId) {
        //    var
        //        historicalData,
        //        factor,
        //        iterations,
        //        interval, i,
        //        subVariables,
        //        index,
        //        timeStampRange;

        //    historicalData = _initializeHistoricalData(mdVariableIdList, playerId, 3);
        //    for (i = 0; i < timeStampList.length; i += 1) {
        //        historicalData[playerId].TimeStampArray[i] = new Date(timeStampList[i]).toISOString();
        //    }
        //    subVariables = historicalData[playerId].SubVariableIdList;
        //    aidbManager.GetStreamsNotStored(subVariables, historicalData[playerId].TimeStampArray, assetId, function (timeStampArray) {
        //        _historicalCount = timeStampArray.length;
        //        if (_historicalCount === 0) {
        //            PublisherSubscriber.publish("/historicValues/refresh", historicalData);
        //            return;
        //        } else {
        //            for (i = 0; i < _historicalCount; i += 1) {
        //                index = historicalData[playerId].TimeStampArray.indexOf(timeStampArray[i]);
        //                if (index > -1) {
        //                    historicalData[playerId].TimeStampArray.splice(index, 1);
        //                }
        //            }
        //            PublisherSubscriber.publish("/historicValues/refresh", historicalData);
        //        }

        //        _currentHistoricalLength = 0;
        //        factor = Math.floor(100 / mdVariableIdList.length);
        //        factor = (100 % mdVariableIdList.length === 0) ? factor : factor + 1;
        //        iterations = Math.floor(timeStampArray.length / factor) + 1;
        //        i = 0;
        //        interval = setInterval(function () {
        //            if (i >= iterations) {
        //                return clearInterval(interval);
        //            }
        //            if (i + 1 === iterations) {
        //                if (timeStampArray.length - i * factor <= 0) {
        //                    return clearInterval(interval);
        //                }
        //                timeStampRange = timeStampArray.slice(i * factor, timeStampArray.length);
        //            } else {
        //                timeStampRange = timeStampArray.slice(i * factor, (i + 1) * factor);
        //            }
        //            _getStreamHistoricalData(mdVariableIdList, timeStampRange, playerId, historicalData, i, assetId);
        //            i += 1;
        //        }, 2000);
        //    });
        //};

        //_getStreamHistoricalData = function (mdVariableIdList, timeStampRange, widgetId, historicalData, t, assetId) {
        //    var
        //        response;

        //    $.ajax({
        //        url: "/Home/GetDynamicHistoricalData",
        //        method: "POST",
        //        data: {
        //            mdVariableIdList: mdVariableIdList,
        //            timeStampArray: timeStampRange
        //        },
        //        success: function (resp) {
        //            response = JSON.parse(resp);
        //            _currentHistoricalLength += timeStampRange.length;
        //            Concurrent.Thread.create(_saveStreamLocal, response, historicalData, timeStampRange, widgetId, assetId, _streamParser);
        //        },
        //        error: function (jqXHR, textStatus) {
        //            console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
        //        }
        //    });
        //};

        //_saveStreamLocal = function (response, historicalData, timeStampArray, widgetId, assetId, streamParser) {
        //    var
        //        currentSubVariable,
        //        dataByTimeStamp,
        //        timeStamp,
        //        statusColor,
        //        stream,
        //        i, j, k;

        //    for (i = 0; i < response.length; i += 1) {
        //        currentSubVariable = response[i].HistoricalBySubVariable;
        //        for (j = 0; j < currentSubVariable.length; j += 1) {
        //            dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
        //            for (k = 0; k < dataByTimeStamp.length; k += 1) {
        //                if (currentSubVariable[j].SubVariableDataList[0].StatusId != "") {
        //                    statusColor = ej.DataManager(arrayObjectStatus).executeLocal(
        //                        new ej.Query().where("Id", "equal", currentSubVariable[j].SubVariableDataList[0].StatusId))[0].Color;
        //                } else {
        //                    statusColor = "#999999";
        //                }
        //                stream = streamParser.GetWaveForm(dataByTimeStamp[k].Value);
        //                aidbManager.AddStreamItem({
        //                    subVariableId: currentSubVariable[j].SubVariableId,
        //                    timeStamp: new Date(dataByTimeStamp[k].TimeStamp + "+00:00").getTime(),
        //                    value: stream.waveform,
        //                    sampleTime: stream.sampleTime,
        //                    referencePositions: stream.keyphasor,
        //                    statusColor: statusColor,
        //                    isChangeOfRpm: dataByTimeStamp[k].IsChangeOfRpm,
        //                    isEvent: dataByTimeStamp[k].IsEvent,
        //                    isNormal: dataByTimeStamp[k].IsNormal
        //                }, assetId);
        //            }
        //        }
        //    }
        //    historicalData[widgetId].TimeStampArray = timeStampArray;
        //    // Si ya fueron cargados todos los datos notificarlo
        //    PublisherSubscriber.publish("/historicValues/refresh", historicalData);
        //};

        this.GetDynamicHistoricalData = function (mdVarIdList, assetNodeId, timeStampList, playerId) {
            var
                historicalData,
                subVarIdList,
                factor,
                iterations,
                index;

            historicalData = _initializeHistoricalData(mdVarIdList, playerId, 3);
            historicalData[playerId].TimeStampArray = timeStampList;
            subVarIdList = historicalData[playerId].SubVariableIdList;
            // Dividir la busqueda de informacion si el rango es demasiado grande
            factor = Math.floor(5000 / mdVarIdList.length);
            factor = (5000 % mdVarIdList.length === 0) ? factor : factor + 1;
            iterations = Math.floor(timeStampList.length / factor) + 1;
            index = 0;
            _getStreamInterval(index, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
        };

        _getStreamInterval = function (position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId) {
            var
                timeStampRange,
                group,
                notStored,
                i, j;

            if (position + 1 > iterations) {
                // Significa que se cumplieron todas las iteraciones
                return;
            } else if (position + 1 === iterations) {
                timeStampRange = timeStampList.slice(position * factor, timeStampList.length);
            } else {
                timeStampRange = timeStampList.slice(position * factor, (position + 1) * factor);
            }
            notStored = clone(timeStampRange);
            aidbManager.GetStoredStreams(subVarIdList, timeStampRange, assetNodeId, function (resp) {
                // Si se encuentra la informacion almacenda, se publica que esas estampas existen
                for (i = 0; i < resp.length; i += 1) {
                    j = notStored.indexOf(resp[i]);
                    if (j > -1) {
                        notStored.splice(j, 1);
                    }
                }
                // Publicar datos existentes
                if (resp.length > 0) {
                    historicalData[playerId].TimeStampArray = resp;
                    PublisherSubscriber.publish("/historicValues/refresh", historicalData);
                }
                // Consultar datos faltantes
                if (notStored.length > 0) {
                    historicalData[playerId].TimeStampArray = notStored;
                    timeStampRange = [];
                    for (i = 0; i < notStored.length; i += 1) {
                        timeStampRange[i] = new Date(notStored[i]).toISOString();
                    }
                    _getStreamHistoricalData(mdVarIdList, timeStampRange, assetNodeId, historicalData, playerId, subVarIdList);
                    sleep(500).then(function () {
                        position += 1;
                        _getStreamInterval(position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
                    });
                } else {
                    position += 1;
                    _getStreamInterval(position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
                }
            });
        };

        _getStreamHistoricalData = function (mdVarIdList, timeStampRange, assetNodeId, historicalData, playerId, subVarIdList) {
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
                    //_saveStreamLocal(response, historicalData, playerId, subVarIdList, assetNodeId, _streamParser);
                    Concurrent.Thread.create(_saveStreamLocal, response, historicalData, playerId, subVarIdList, assetNodeId, _streamParser);
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _saveStreamLocal = function (response, historicalData, playerId, subVarIdList, assetNodeId, streamParser) {
            var
                dataArray,
                i, j, k,
                currentSubVariable,
                dataByTimeStamp,
                statusColor,
                stream;

            dataArray = [];
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
                        if (dataByTimeStamp[k].Value === null) {
                            continue;
                        }
                        stream = streamParser.GetWaveForm(dataByTimeStamp[k].Value);
                        dataArray.push({
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
                }
            }
            aidbManager.AddStreamItemList(dataArray, assetNodeId);
            PublisherSubscriber.publish("/historicValues/refresh", historicalData);
        };

        this.Stop = function () {
            // REVISAR QUE OPCIONES SE COLOCAN AQUI
        };
    }

    return EventTimeMode;
})();
