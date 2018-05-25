/*
 * amplitudePhaseGraph.js
 * Gestiona todo lo relacionado al grafico de fase 1X.
 */

/* globals Cursors, ImageExport, createTableToExcel, tableToExcel, Dygraph, clone, aidbManager, ej, formatDate, parseAng,
   PublisherSubscriber, DygraphOps, selectedMeasurementPoint, selectedAsset, mainCache, popUp, AspectrogramWidget*/

var AmplitudePhaseGraph = {};

AmplitudePhaseGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    AmplitudePhaseGraph = function (timeMode, width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML principal de las graficas
            _container,
            // Contenedor HTML especifico de los chart a graficar
            _contentBody,
            // Contenedor HTML de las medidas a mostrar en la parte superior de las graficas
            _contentHeader,
            // Contenedor HTML de la grafica de Amplitud 1X
            _ampContainer,
            // Contenedor HTML de la grafica de Fase 1X
            _phaseContainer,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase SignalGraph
            _this,
            // Referencia al chart de amplitud
            _chartAmplitude,
            // Referencia al chart de fase
            _chartPhase,
            // Referencia al Id del widget
            _widgetId,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Array de los diferentes valores de amplitud, fase, velocidad y valor global en la grafica
            _amplitudePhaseData,
            // Color del punto de medicion
            _msColor,
            // Punto de medicion de la grafica
            _measurementPoint,
            // Referencia a las subvariables del punto de medicion (directa, amplitud 1x, fase 1x)
            _subvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Referencia al cursor
            _cursor,
            // Bandera que indica si el cursor esta bloqueado o siguiendo el movimiento del mouse
            _cursorLock,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Variable que define en que numero de caja se encuentra la fase
            _boxPhaseChart,
            // Referencia a la suscripcion del reproductor de tendencia
            _playerSubscription,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Metodo para el calculo de la fase a graficar
            _getDataForPhaseChart,
            _keyEvent,
            _lastIdx,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Callback de evento click sobre algun item del menu de opciones
            _onSettingsMenuItemClick;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _this = this;
        _movableGrid = false;
        _graphType = "amplitudePhase";
        _widgetId = Math.floor(Math.random() * 100000);
        _subvariables = {};
        _msColor = "#000000";
        _cursorLock = false;
        _cursor = new Cursors(null);
        _boxPhaseChart = 0;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "amplitudePhaseGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "waveformHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "waveformBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        $(_container).append(_contentBody);
        _phaseContainer = document.createElement("div");
        _phaseContainer.id = "phase" + _widgetId;
        _phaseContainer.style.height = "46%";
        $(_contentBody).append(_phaseContainer);
        $(_contentBody).append("<div style=\"height:4%\"></div>");
        _ampContainer = document.createElement("div");
        _ampContainer.id = "amplitude" + _widgetId;
        _ampContainer.style.height = "50%";
        $(_contentBody).append(_ampContainer);

        /*
         * Callback de evento click sobre algun item del menu de opciones
         *@param {Object} evt Argumentos del evento
         */
        _onSettingsMenuItemClick = function (evt) {
            evt.preventDefault();
            var
                target,
                menuItem,
                imgExport,
                name,
                contId,
                labels,
                i, j,
                data;

            target = $(event.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "saveImagePhase" + _widgetId:
                    imgExport = new ImageExport(_chartAmplitude, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    if (timeMode === 0) {
                        name = "Tiempo Real, Amplitud-Fase : " + _assetData.Name;
                    } else if (timeMode === 1) {
                        name = "Histórico, Amplitud-Fase : " + _assetData.Name;
                    }
                    contId = "tableToExcelAmplitudePhaseGraph" + _widgetId;
                    labels = ["RPM", "Directa", "Fase 1X", "Amplitud 1X"];
                    for (i = 0; i < _chartAmplitude.file_.length; i += 1) {
                        data.push([]);
                        for (j = 0; j < _chartAmplitude.file_[0].length; j += 1) {
                            data[i].push(_chartAmplitude.file_[i][j]);
                        }
                    }
                    for (i = 0; i < _chartPhase.file_.length; i += 1) {
                        for (j = _chartAmplitude.file_[0].length; j < _chartPhase.file_[0].length + _chartAmplitude.file_[0].length - 1; j += 1) {
                            data[i].push(_chartPhase.file_[i][j - _chartAmplitude.file_[0].length]);
                        }
                    }
                    createTableToExcel(_container, contId, name, labels, data, true);
                    tableToExcel("tableToExcelAmplitudePhaseGraph" + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
            }
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labelAmp, labelPha, timeStampArray, rpmPositions) {
            var
                // Texto a mostrar de forma dinamica
                txt,
                // Valor de la altura del rotulo de la grafica
                headerHeigth,
                // Dato inicial a graficar
                initData;

            _customInteractionModel.click = function (e, g, ctx) {
                _cursorLock = !_cursorLock;
            };
            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            initData = [[new Date(), 0]];
            _chartPhase = new Dygraph(
                _phaseContainer,
                initData,
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    ylabel: "Fase [" + _subvariables.phase.Units + "]",
                    labels: labelPha,
                    labelsDivWidth: 0,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    includeZero: true,
                    yRangePad: 3,
                    axes: {
                        x: {
                            pixelsPerLabel: 40,
                            drawAxis: false
                        },
                        y: {
                            pixelsPerLabel: 20,
                            axisLabelWidth: 38
                        }
                    },
                    highlightCallback: function (e, x, pts, row) {
                        var
                            color,
                            current,
                            i;

                        _lastIdx = pts[0].idx;

                        for (i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === "Fase" && !Number.isNaN(pts[i].yval)) {
                                color = _chartPhase.plotter_.colors[pts[i].name];
                                if (!_amplitudePhaseData || !_amplitudePhaseData[pts[i].idx]) { return; }
                                current = clone(_amplitudePhaseData[pts[i].idx]);
                                txt = "<span style=\"color:" + color + "\">" + _seriesName[0] + "</span>:&nbsp;";
                                txt += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                                txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                                color = "#000000";
                                txt = "<span style=\"color:" + color + "\">" + _subvariables.overall.Name + "</span>:&nbsp;";
                                txt += (current.overall < 0 ? "" : "&nbsp;") + current.overall.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[1] + _widgetId + " > span").html(txt);
                            }
                        }
                        if (!_cursorLock) {
                            _cursor.followCursor(pts);
                        }
                    },
                    drawCallback: function (g, is_initial) {
                        if (is_initial) {
                            _cursor.attachCanvas(g);
                            g.canvas_.style.zIndex = 1;
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                        if (!_cursorLock) {
                            Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, p);
                        }
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: _customInteractionModel
                }
            );
            _chartAmplitude = new Dygraph(
                _ampContainer,
                [[0, 0, 0]],
                {
                    colors: ["#006ACB", "#008000"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Estampa de tiempo",
                    ylabel: "Amplitud [" + _subvariables.overall.Units + "]",
                    labels: labelAmp,
                    labelsDivWidth: 0,
                    includeZero: true,
                    yRangePad: 3,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    axes: {
                        x: {
                            pixelsPerLabel: 40
                        },
                        y: {
                            pixelsPerLabel: 20,
                            axisLabelWidth: 38
                        }
                    },
                    highlightCallback: function (e, x, pts, row) {
                        var
                            color,
                            current,
                            i;

                        _lastIdx = pts[0].idx;
                        for (i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === "Amplitud" && !Number.isNaN(pts[i].yval)) {
                                color = _chartAmplitude.plotter_.colors[pts[i].name];
                                if (!_amplitudePhaseData || !_amplitudePhaseData[pts[i].idx]) { return; }
                                current = clone(_amplitudePhaseData[pts[i].idx]);
                                txt = "<span style=\"color:" + color + "\">" + _seriesName[0] + "</span>:&#09;";
                                txt += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                                txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                                color = "#000000";
                                txt = "<span style=\"color:" + color + "\">" + _subvariables.overall.Name + "</span>:&nbsp;";
                                txt += (current.overall < 0 ? "" : "&nbsp;") + current.overall.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[1] + _widgetId + " > span").html(txt);
                            }
                        }
                        if (!_cursorLock) {
                            _cursor.followCursor(pts);
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    drawCallback: function (g, is_initial) {
                        if (is_initial) {
                            _cursor.attachCanvas(g);
                            g.canvas_.style.zIndex = 1;
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                        if (!_cursorLock) {
                            Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, p);
                        }
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: _customInteractionModel
                }
            );
            Dygraph.synchronize([_chartPhase, _chartAmplitude], {
                zoom: true,
                selection: true,
                range: false
            });
            $(".grid-stack-item").on("resizestop", function () {
                headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigth) + "%";
                setTimeout(function () {
                    _chartPhase.resize();
                    _chartAmplitude.resize();
                }, 100);
            });
            _chartPhase.ready(function () {
                _getHistoricalData(timeStampArray, rpmPositions);
            });
        };

        _customInteractionModel = clone(Dygraph.defaultInteractionModel);

        /*
         * Obtiene la informacion asociada al grafico
         */
        _getHistoricalData = function (timeStampArray, rpmPositions) {
            var
                i, j, k,
                idList,
                group,
                items,
                tmpData,
                notStored,
                txt;

            _amplitudePhaseData = [];
            idList = [_subvariables.overall.Id, _subvariables.amplitude.Id, _subvariables.phase.Id];
            if (_angularSubvariable) {
                idList.push(_angularSubvariable.Id);
            }
            aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, timeStampArray, _assetData.NodeId, function (resp) {
                group = ej.DataManager(resp).executeLocal(new ej.Query().group("timeStamp"));
                for (i = 0; i < group.length; i += 1) {
                    items = group[i].items;
                    tmpData = [];
                    notStored = clone(idList);
                    for (j = 0; j < items.length; j += 1) {
                        k = idList.indexOf(items[j].subVariableId);
                        tmpData[k] = {
                            Id: items[j].subVariableId,
                            TimeStamp: new Date(group[i].key).toISOString(),
                            RawTimeStamp: new Date(group[i].key),
                            Value: items[j].value
                        };
                        k = notStored.indexOf(items[j].subVariableId);
                        notStored.splice(k, 1);
                    }
                    for (j = 0; j < notStored.length; j += 1) {
                        k = idList.indexOf(notStored[j]);
                        tmpData[k] = {
                            Id: notStored[j],
                            TimeStamp: new Date(group[i].key).toISOString(),
                            RawTimeStamp: new Date(group[i].key),
                            Value: null
                        };
                    }
                    _amplitudePhaseData.push({
                        overall: tmpData[0].Value,
                        amplitude: tmpData[1].Value,
                        phase: tmpData[2].Value,
                        velocity: tmpData[3].Value,
                        timeStamp: formatDate(tmpData[0].RawTimeStamp),
                        rawTimeStamp: tmpData[0].RawTimeStamp
                    });
                }
                txt = "<b style=\"color:" + _msColor + ";\">" + _measurementPoint.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                txt += "(" + _amplitudePhaseData[0].timeStamp + " - " + _amplitudePhaseData[_amplitudePhaseData.length - 1].timeStamp + ")";
                $("#point" + _measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
                _refresh();
                _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                    var
                        row,
                        ampSubVar;

                    if (!Number.isNaN(currentTimeStamp)) {
                        //data = data[_measurementPoint.Id];
                        //if (data && data.SubVariables.length > 0) {
                        //    ampSubVar = new ej.DataManager(data.SubVariables).executeLocal(new ej.Query().where("Id", "equal", amp1xId));
                        //    if (ampSubVar && ampSubVar.length > 0) {
                        //        for (row = 0; row < _chartAmplitude.file_.length; row += 1) {
                        //            if (_chartAmplitude.file_[row][1] === ampSubVar[0].Value) {
                        //                _chartPhase.setSelection(row);
                        //                _cursorLock = true;
                        //                _cursor.followCursor(_chartPhase.selPoints_);
                        //                break;
                        //            }
                        //        }
                        //    }
                        //}
                    }
                });
            });
        };

        /*
         * Algoritmo para graficado de fase
         */
        _getDataForPhaseChart = function () {
            var
                currentRpm,
                ampData,
                phaData,
                phaseValues,
                maxPhase,
                minPhase,
                dataObj,
                step,
                currentTimeStamp,
                i;

            ampData = [];
            phaData = [];
            phaseValues = [];
            maxPhase = 0;
            minPhase = 0;
            dataObj = {
                ampData: [],
                phaData: [],
                maxPhase: 0,
                minPhase: 0
            };

            if (_amplitudePhaseData.length > 0) {
                phaseValues[0] = -_amplitudePhaseData[0].phase;
            }
            for (i = 0; i < _amplitudePhaseData.length; i += 1) {
                currentRpm = _amplitudePhaseData[i].velocity;
                currentTimeStamp = _amplitudePhaseData[i].rawTimeStamp;
                if (i > 0) {
                    if (currentRpm === 0) {
                        phaseValues[i] = 0;
                        _boxPhaseChart = 0;
                    } else {
                        step = _amplitudePhaseData[i].phase - _amplitudePhaseData[i - 1].phase;
                        if (step > 180 && (_amplitudePhaseData[i - 1].phase !== 0 || phaseValues[i] !== 0)) {
                            _boxPhaseChart -= 1;
                        } else if (step < -180 && (_amplitudePhaseData[i - 1].phase !== 0 || phaseValues[i] !== 0)) {
                            _boxPhaseChart += 1;
                        } else if (step > -180 || step < 180) {
                            _boxPhaseChart = _boxPhaseChart;
                        }
                        phaseValues[i] = _amplitudePhaseData[i].phase + 360 * _boxPhaseChart;
                    }
                } else {
                    if (currentRpm === 0) {
                        phaseValues[i] = 0;
                        _boxPhaseChart = 0;
                    } else {
                        step = _amplitudePhaseData[i + 1].phase - _amplitudePhaseData[i].phase;
                        if (step > 180 && (_amplitudePhaseData[i].phase !== 0 || phaseValues[i] !== 0)) {
                            _boxPhaseChart -= 1;
                        } else if (step < -180 && (_amplitudePhaseData[i].phase !== 0 || phaseValues[i] !== 0)) {
                            _boxPhaseChart += 1;
                        } else if (step > -180 || step < 180) {
                            _boxPhaseChart = _boxPhaseChart;
                        }
                        phaseValues[i] = _amplitudePhaseData[i].phase + 360 * _boxPhaseChart;
                    }
                }


                if (phaseValues[i] < minPhase) {
                    minPhase = phaseValues[i];
                } else if (phaseValues[i] > maxPhase) {
                    maxPhase = phaseValues[i];
                }
                ampData.push([currentTimeStamp, _amplitudePhaseData[i].amplitude, _amplitudePhaseData[i].overall]);
                phaData.push([currentTimeStamp, phaseValues[i]]);
            }
            dataObj.ampData = ampData;
            dataObj.phaData = phaData;
            dataObj.minPhase = minPhase;
            dataObj.maxPhase = maxPhase;
            return dataObj;
        };
       
        /*
         * Actualiza los valores a graficar
         */
        _refresh = function () {
            var
                // Objeto que contiene la informacion a graficar
                dataObj;

            dataObj = _getDataForPhaseChart();
            _chartAmplitude.is_initial_draw_ = true;
            _chartAmplitude.updateOptions({
                "file": dataObj.ampData
            });
            _chartPhase.is_initial_draw_ = true;
            _chartPhase.updateOptions({
                "file": dataObj.phaData,
                "valueRange": [dataObj.maxPhase * 1.1, dataObj.minPhase * 1.1]
            });
            if (_mouseover) {
                _chartAmplitude.mouseMove_(_lastMousemoveEvt);
                _chartPhase.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(_chartAmplitude, 0, 0);
                DygraphOps.dispatchMouseMove(_chartPhase, 0, 0);
            }
        };

        document.body.addEventListener("keydown", function (e) {

            var callback,
                pts = [],
                color,
                txt,
                current,
                i
            ;
            if (e.keyCode == 37) {
                if (_lastIdx > 0) {
                    pts = [_chartPhase.layout_.points[0][_lastIdx--]];
                } else {
                    pts = [_chartPhase.layout_.points[0][1]];
                }
            }else if (e.keyCode == 39) {
                if (_lastIdx < _chartPhase.layout_.points[0].length - 1) {
                    pts = [_chartPhase.layout_.points[0][_lastIdx++]];
                } else {
                    pts = [_chartPhase.layout_.points[0][_chartPhase.layout_.points[0].length - 2]];
                }
                
            }
            if (e.keyCode == 37 || e.keyCode == 39) {
                for (i = 0; i < pts.length; i += 1) {
                    if (pts[i].name === "Fase" && !Number.isNaN(pts[i].yval)) {
                        color = _chartPhase.plotter_.colors[pts[i].name];
                        if (!_amplitudePhaseData || !_amplitudePhaseData[pts[i].idx]) { return; }
                        current = clone(_amplitudePhaseData[pts[i].idx]);
                        txt = "<span style=\"color:" + color + "\">" + _seriesName[0] + "</span>:&nbsp;";
                        txt += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                        txt += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                        txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                        $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                        color = "#000000";
                        txt = "<span style=\"color:" + color + "\">" + _subvariables.overall.Name + "</span>:&nbsp;";
                        txt += (current.overall < 0 ? "" : "&nbsp;") + current.overall.toFixed(2) + " " + _subvariables.overall.Units;
                        txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                        $("#" + _seriesName[1] + _widgetId + " > span").html(txt);
                    }
                }
            }
            if (!_cursorLock) {
                _cursor.followCursor(pts);
            }
        });




        this.Show = function (measurementPointId, currentColor, timeStampArray, rpmPositions) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
                rotn,
                // Labels para el grafico de amplitud
                labelAmp,
                // Labels para el grafico de fase
                labelPha,
                // Sensor de referencia angular
                angularReference,
                // Menu de opciones para la grafica
                settingsMenu,
                // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                subVariableIdList,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                overallUnits;

            switch (timeMode) {
                case 0: // RT
                    _measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;
                    break;
                case 1: // HT
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                        new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
                    break;
            }
            subVariableIdList = [];
            // Referencia angular
            angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false)
            )[0];
            if (!angularReference) {
                popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                rotn = "CW";
                return;
            } else {
                rotn = (angularReference.RotationDirection === 1) ? "CW" : "CCW";
                _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 9, false))[0]);
            }
            // SubVariable que corresponde al punto de referencia angular
            if (_angularSubvariable) {
                subVariableIdList.push(_angularSubvariable.Id);
            }
            // Total subvariables para el punto de medicion
            subVariables = _measurementPoint.SubVariables;
            // SubVariable que contiene el valor de directa
            _subvariables.overall = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
            if (_subvariables.overall) {
                subVariableIdList.push(_subvariables.overall.Id);
            }
            // SubVariable que contiene el valor de amplitud 1x
            _subvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0]);
            if (_subvariables.amplitude) {
                subVariableIdList.push(_subvariables.amplitude.Id);
            }
            // SubVariable que contiene el valor de fase 1x
            _subvariables.phase = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 6, false))[0]);
            if (_subvariables.phase) {
                subVariableIdList.push(_subvariables.phase.Id);
            }
            if (!_subvariables.amplitude || !_subvariables.phase || !_angularSubvariable) {
                var msgError = "No existen subvariables configuradas para ";
                msgError += (!_angularSubvariable) ? "velocidad, " : "";
                msgError += (!_subvariables.phase) ? "fase, " : "";
                msgError += (!_subvariables.amplitude) ? "amplitud, " : "";

                popUp("info", msgError.slice(0, -2) + " 1X.");
                return;
            }
            _seriesName = ["1X", _subvariables.overall.Name];
            overallUnits = "";
            switch (_subvariables.overall.MeasureType) {
                case 1:
                    overallUnits = " 0-pk";
                    break;
                case 2:
                    overallUnits = " pk-pk";
                    break;
                case 3:
                    overallUnits = " RMS";
                    break;
            }
            _subvariables.overall.Units += overallUnits;
            _msColor = currentColor;
            // Agregamos los items al menu de opciones para la grafica.
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImagePhase" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Amplitud-Fase",
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: timeMode,
                asset: _assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "")],
                pause: false,
                settingsMenu: settingsMenu,
                onSettingsMenuItemClick: _onSettingsMenuItemClick,
                onClose: function () {
                    _this.Close();
                },
                onMove: function () {
                    var
                            grid;

                    _movableGrid = !_movableGrid;
                    grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    $(".grid-stack").data("gridstack").movable(grid, _movableGrid);
                }
            });

            labelAmp = ["TimeStamp", "Amplitud", "Directa"];
            labelPha = ["TimeStamp", "Fase"];

            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Construir y mostrar grafica.
            _buildGraph(labelAmp, labelPha, timeStampArray, rpmPositions);
        };

        this.Close = function () {
            var
                el;

            if (_playerSubscription) {
                // Eliminar suscripcion de reproductor.
                _playerSubscription.remove();
            }
            if (_chartAmplitude) {
                _chartAmplitude.destroy();
            }
            if (_chartPhase) {
                _chartPhase.destroy();
            }
            el = $(_container).parents().eq(2);
            $(".grid-stack").data("gridstack").removeWidget(el);
            $(_container).remove();
        };
    };

    return AmplitudePhaseGraph;
})();