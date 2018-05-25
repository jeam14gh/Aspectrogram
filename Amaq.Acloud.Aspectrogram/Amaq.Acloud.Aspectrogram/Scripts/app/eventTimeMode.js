/*
 * AMAQ 2016
 * Consulta los eventos especificos de un activo o maquina
 * @author ACLOUD TEAM
 */

/* globals StreamParser, ej, mainCache, clone, aidbManager, PublisherSubscriber, Concurrent, AjaxErrorHandling, arrayObjectStatus*/

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
            _steps,
            _initializeHistoricalData,
            _getStreamIntervalLocal,
            _getStreamIntervalRemote,
            _getStreamHistoricalData,
            _saveStreamLocal;

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

        this.GetDynamicHistoricalData = function (mdVarIdList, assetNodeId, timeStampList, playerId) {
            var
                historicalData,
                subVarIdList,
                factor,
                iterations,
                index,
                notLocalTimeStamp;

            historicalData = _initializeHistoricalData(mdVarIdList, playerId, 3);
            historicalData[playerId].TimeStampArray = timeStampList;
            subVarIdList = historicalData[playerId].SubVariableIdList;
            // Dividir la busqueda de informacion si el rango es demasiado grande
            factor = Math.floor(5000 / mdVarIdList.length);
            factor = (5000 % mdVarIdList.length === 0) ? factor : factor + 1;
            iterations = Math.floor(timeStampList.length / factor) + 1;
            index = 0;
            notLocalTimeStamp = [];
            _getStreamIntervalLocal(index, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
        };

        _getStreamIntervalLocal = function (position, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId) {
            var
                timeStampRange,
                notStored,
                i, j;

            if (position + 1 > iterations) {
                // Significa que se cumplieron todas las iteraciones
                if (notLocalTimeStamp.length > 0) {
                    iterations = Math.floor(notLocalTimeStamp.length / factor) + 1;
                    i = 0;
                    _getStreamIntervalRemote(i, factor, iterations, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
                }
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
                    for (i = 0; i < notStored.length; i += 1) {
                        notLocalTimeStamp.push(new Date(notStored[i]).toISOString());
                    }
                }
                position += 1;
                _getStreamIntervalLocal(position, factor, iterations, timeStampList, notLocalTimeStamp, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
            });
        };

        _getStreamIntervalRemote = function (position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId) {
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
            _getStreamHistoricalData(mdVarIdList, timeStampRange, assetNodeId, historicalData, playerId, subVarIdList);
            setTimeout(function () {
                position += 1;
                _getStreamIntervalRemote(position, factor, iterations, timeStampList, mdVarIdList, subVarIdList, assetNodeId, historicalData, playerId);
            }, 1000);
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
                    _steps(response, _streamParser, _saveStreamLocal, subVarIdList, assetNodeId, undefined, playerId).then(function () {
                        // Publicamos la informacion
                        PublisherSubscriber.publish("/historicValues/refresh", historicalData);
                    });
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _steps = function (response, streamParser, streamProcessData, subVarIdList, assetNodeId, timeStamp, playerId) {
            var
                deferred,
                dataArray,
                mdVariableStep,
                i, j, k,
                currentSubVariable,
                subVariableStep,
                dataItem,
                stream,
                dataByTimeStamp,
                timeStampStep;

            deferred = $.Deferred();
            dataArray = [];
            i = 0;
            mdVariableStep = function () {
                if (i < response.length) {
                    currentSubVariable = response[i].HistoricalBySubVariable;
                    j = 0;
                    subVariableStep = function () {
                        if (j < currentSubVariable.length) {
                            dataByTimeStamp = currentSubVariable[j].SubVariableDataList;
                            k = 0;
                            timeStampStep = function () {
                                if (k < dataByTimeStamp.length) {
                                    dataItem = {};
                                    dataItem.RawTimeStamp = new Date(dataByTimeStamp[k].TimeStamp + "+00:00");
                                    dataItem.TimeStamp = formatDate(dataItem.RawTimeStamp);
                                    if (dataByTimeStamp[k].StatusId !== "") {
                                        dataItem.StatusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                                            new ej.Query().where("Id", "equal", dataByTimeStamp[k].StatusId))[0].Color;
                                    } else {
                                        dataItem.StatusColor = "#999999";
                                    }
                                    // En caso de que los datos obtenidos sean nulos, no los procesamos
                                    if (dataByTimeStamp[k].Value === null) {
                                        k += 1;
                                        timeStampStep();
                                    }
                                    streamParser.GetWaveForm(dataByTimeStamp[k].Value, function onComplete(data) {
                                        var
                                            subVariableId,
                                            idx;

                                        subVariableId = currentSubVariable[j].SubVariableId;
                                        dataItem.IsChangeOfRpm = dataByTimeStamp[k].IsChangeOfRpm;
                                        dataItem.IsEvent = dataByTimeStamp[k].IsEvent;
                                        dataItem.IsNormal = dataByTimeStamp[k].IsNormal;
                                        dataItem = streamProcessData(dataItem, streamParser, data, subVariableId, assetNodeId);
                                        idx = subVarIdList.indexOf(subVariableId);
                                        if (idx > -1) {
                                            if (timeStamp !== undefined) {
                                                dataArray[subVariableId] = [];
                                                dataArray[subVariableId][timeStamp] = dataItem;
                                                dataArray[subVariableId].WidgetId = playerId;
                                            } else {
                                                dataArray.push({
                                                    subVariableId: subVariableId,
                                                    timeStamp: dataItem.RawTimeStamp.getTime(),
                                                    value: dataItem.RawValue,
                                                    sampleTime: dataItem.SampleTime,
                                                    referencePositions: dataItem.KeyphasorPositions,
                                                    statusColor: dataItem.StatusColor,
                                                    isChangeOfRpm: dataItem.IsChangeOfRpm,
                                                    isEvent: dataItem.IsEvent,
                                                    isNormal: dataItem.IsNormal
                                                });
                                            }
                                        }
                                        k += 1;
                                        timeStampStep();
                                    });
                                } else {
                                    j += 1;
                                    subVariableStep();
                                }
                            };
                            timeStampStep();
                        } else {
                            i += 1;
                            mdVariableStep();
                        }
                    };
                    subVariableStep();
                } else {
                    deferred.resolve(dataArray);
                }
            };
            mdVariableStep();
            return deferred.promise();
        };

        _saveStreamLocal = function (dataItem, streamParser, data, subVariableId, assetNodeId) {
            var
                stream;

            stream = streamParser.ParseWaveForm(data);
            dataItem.KeyphasorPositions = stream.keyphasor;
            if (stream.keyphasor.length > 0) {
                dataItem.KeyphasorPositionsOnTime = GetKeyphasorOnTime(stream.keyphasor, stream.sampleTime, stream.signalLength);
            } else {
                dataItem.KeyphasorPositionsOnTime = [];
            }
            dataItem.SampleTime = stream.sampleTime;
            dataItem.Value = GetXYDataOnTime(stream.waveform, stream.sampleTime);
            dataItem.RawValue = stream.waveform;
            dataItem.SampleRate = stream.signalLength / stream.sampleTime;
            aidbManager.AddStreamItem({
                subVariableId: subVariableId,
                timeStamp: dataItem.RawTimeStamp.getTime(),
                value: dataItem.RawValue,
                sampleTime: dataItem.SampleTime,
                referencePositions: dataItem.KeyphasorPositions,
                statusColor: dataItem.StatusColor,
                isChangeOfRpm: dataItem.IsChangeOfRpm,
                isEvent: dataItem.IsEvent,
                isNormal: dataItem.IsNormal
            }, assetNodeId);
            return dataItem;
        };

        this.Stop = function () {
            // REVISAR QUE OPCIONES SE COLOCAN AQUI
        };
    };

    return EventTimeMode;
})();
