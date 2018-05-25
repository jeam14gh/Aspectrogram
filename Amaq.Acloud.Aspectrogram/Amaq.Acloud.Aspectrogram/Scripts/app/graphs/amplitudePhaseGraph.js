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
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Rangos maximos y minimos del grafico, tanto en el eje X como en el eje Y
            _graphRange,
            // Referencia al cursor
            _cursor,
            // Ultimo indice sobre el que el cursor estuvo en la grafica
            _lastIdx,
            // Bandera que indica si el cursor esta bloqueado o siguiendo el movimiento del mouse
            _cursorLock,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Objeto cuyas propiedades corresponden a informacion relacionada al puntos de medicion
            _measurementPoint,
            // Referencia a las subvariables del punto de medicion (directa, fase 1x, amplitud 1x)
            _subvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Valor de referencia de la posicion en el eje coordenado X
            _amplitudeReference,
            // Valor de referencia de la posicion en el eje coordenado Y
            _phaseReference,
            // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
            _rotn,
            // Array de los diferentes valores de amplitud, fase, velocidad y valor global en la grafica
            _amplitudePhaseData,
            // Array que permite gestionar la visualizacion de las diferentes series en la grafica
            _seriesVisibility,
            // Variable que define en que numero de caja se encuentra la fase
            _boxPhaseChart,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion del reproductor de tendencia
            _playerSubscription,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Obtiene la informacion a graficar en el grafico de amplitud
            _getAmplitudeData,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Obtiene la informacion a graficar en el grafico de fase
            _getPhaseData,
            // Metodo privado que obtiene la informacion de los puntos seleccionados en el conjunto de graficas
            _getSelectedPoints,
            // Obtiene los valores maximos y minimos para cada grafico
            _getValueRanges,
            // Metodo privado como manejador de eventos de KeyDown
            _keyDownEventHandler,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo para seleccionar/deseleccioanr las series que se quieran ver en el Bode
            _showHideSeries,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _movableGrid = false;
        _this = this;
        _graphType = "amplitudePhase";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _subvariables = {};
        _cursorLock = false;

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
            var
                target,
                menuItem,
                imgExport,
                name,
                contId,
                labels,
                i, j,
                data;

            evt.preventDefault();
            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "showSeries":
                    _showHideSeries();
                    break;
                case "saveImage" + _widgetId:
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
                // Contador
                i,
                // Texto a mostrar de forma dinamica
                txt,
                // Valor de la altura del rotulo de la grafica
                headerHeigth;

            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            _cursor = new Cursors(null);
            _seriesVisibility = [];
            for (i = 0; i < _seriesName.length; i += 1) {
                switch (_seriesName[i]) {
                    case "1X":
                        _seriesVisibility[0] = {
                            Id: 0,
                            Name: _seriesName[i],
                            Visible: true
                        };
                        break;
                    case _subvariables.overall.Name:
                        _seriesVisibility[1] = {
                            Id: 1,
                            Name: _seriesName[i],
                            Visible: false
                        };
                        break;
                    default:
                        console.log("Serie desconocida.");
                }
            }
            _chartPhase = new Dygraph(
                _phaseContainer,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    avoidMinZero: true,
                    xRangePad: 1,
                    ylabel: "Fase [" + _subvariables.phase.Units + "]",
                    labels: labelPha,
                    labelsDivWidth: 0,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row) {
                        if (_cursorLock || pts.length === 0) {
                            return;
                        }
                        _lastIdx = pts[0].idx;
                        _cursor.followCursor(pts);
                        for (i = 0; i < pts.length; i += 1) {
                            if (!_amplitudePhaseData || !_amplitudePhaseData[pts[i].idx]) {
                                return;
                            }
                            if (!Number.isNaN(pts[i].yval) && pts[i].name === labelPha[1]) {
                                txt = "<span style=\"color:" + _chartPhase.plotter_.colors[pts[i].name] + "\">" + _seriesName[0] + "</span>:&nbsp;";
                                txt += _amplitudePhaseData[pts[i].idx].amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += " &ang;+" + _amplitudePhaseData[pts[i].idx].phase.toFixed(2) + "&deg;, ";
                                txt += _amplitudePhaseData[pts[i].idx].velocity.toFixed(0) + " RPM, " + _amplitudePhaseData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                                txt = _subvariables.overall.Name + ":&nbsp;" + _amplitudePhaseData[pts[i].idx].overall.toFixed(2) + " ";
                                txt += _subvariables.overall.Units + ", " + _amplitudePhaseData[pts[i].idx].velocity.toFixed(0) + " RPM, ";
                                txt += _amplitudePhaseData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[1] + _widgetId + " > span").html(txt);
                            }
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    drawCallback: function (g, is_initial) {
                        var
                            // DIVs contenedores de los labels en los ejes X e Y de la grafica
                            axisLabelDivs;

                        if (is_initial) {
                            _cursor.attachCanvas(g);
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + ylabel
                        $("#" + _phaseContainer.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1050);
                        $("#" + _phaseContainer.id + " .dygraph-ylabel").eq(0).parent().css("z-index", 1050);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _phaseContainer.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1050);
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, pointSize) {
                        if (_cursorLock) {
                            // Necesario para que no se dibuje el circulo de seleccion cuando el cursor se encuentre bloqueado
                            pointSize = 0;
                        }
                        Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, pointSize);
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: _customInteractionModel,
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
                    plotter: function (e) {
                        Dygraph.Plugins.Plotter.prototype.smoothPlotter(e, 0.35);
                    },
                    visibility: [true]
                }
            );
            _chartAmplitude = new Dygraph(
                _ampContainer,
                [[0, 0, 0]],
                {
                    colors: ["#006ACB", "#008000"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    avoidMinZero: true,
                    xRangePad: 1,
                    xlabel: "Estampa de tiempo",
                    ylabel: "Amplitud [" + _subvariables.overall.Units + "]",
                    labels: labelAmp,
                    labelsDivWidth: 0,
                    includeZero: true,
                    yRangePad: 3,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row) {
                        if (_cursorLock || pts.length === 0) {
                            return;
                        }
                        _lastIdx = pts[0].idx;
                        _cursor.followCursor(pts);
                        for (i = 0; i < pts.length; i += 1) {
                            if (!_amplitudePhaseData || !_amplitudePhaseData[pts[i].idx]) {
                                return;
                            }
                            if (!Number.isNaN(pts[i].yval) && pts[i].name === labelAmp[1]) {
                                txt = "<span style=\"color:" + _chartPhase.plotter_.colors[pts[i].name] + "\">" + _seriesName[0] + "</span>:&nbsp;";
                                txt += _amplitudePhaseData[pts[i].idx].amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += " &ang;+" + _amplitudePhaseData[pts[i].idx].phase.toFixed(2) + "&deg;, ";
                                txt += _amplitudePhaseData[pts[i].idx].velocity.toFixed(0) + " RPM, " + _amplitudePhaseData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                                txt = _subvariables.overall.Name + ":&nbsp;" + _amplitudePhaseData[pts[i].idx].overall.toFixed(2) + " ";
                                txt += _subvariables.overall.Units + ", " + _amplitudePhaseData[pts[i].idx].velocity.toFixed(0) + " RPM, ";
                                txt += _amplitudePhaseData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[1] + _widgetId + " > span").html(txt);
                            }
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    drawCallback: function (g, is_initial) {
                        var
                            // DIVs contenedores de los labels en los ejes X e Y de la grafica
                            axisLabelDivs;

                        if (is_initial) {
                            _cursor.attachCanvas(g);
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + ylabel
                        $("#" + _ampContainer.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1050);
                        $("#" + _ampContainer.id + " .dygraph-ylabel").eq(0).parent().css("z-index", 1050);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _ampContainer.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1050);
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, pointSize) {
                        if (_cursorLock) {
                            // Necesario para que no se dibuje el circulo de seleccion cuando el cursor se encuentre bloqueado
                            pointSize = 0;
                        }
                        Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, pointSize);
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        x: {
                            pixelsPerLabel: 40
                        },
                        y: {
                            pixelsPerLabel: 20,
                            axisLabelWidth: 38
                        }
                    },
                    plotter: function (e) {
                        Dygraph.Plugins.Plotter.prototype.smoothPlotter(e, 0.35);
                    },
                    visibility: [true, false]
                }
            );
            Dygraph.synchronize([_chartPhase, _chartAmplitude], {
                zoom: true,
                selection: false,
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
                document.body.addEventListener("keydown", _keyDownEventHandler);
            });
        };

        /*
         * Permite encontrar el punto mas proximo del evento hover generado por el mouse
         */
        _findClosestPoint = function (domX, domY, layout) {
            var
                minDist,
                setIdx,
                pts, i,
                dist, dx, dy,
                closestPoint,
                closestSeries,
                closestRow;

            minDist = Infinity;
            for (setIdx = layout.points.length - 1; setIdx >= 0; --setIdx) {
                pts = layout.points[setIdx];
                for (i = 0; i < pts.length; ++i) {
                    if (!Dygraph.isValidPoint(pts[i])) {
                        continue;
                    }
                    dx = pts[i].canvasx - domX;
                    dy = pts[i].canvasy - domY;
                    dist = dx * dx + dy * dy;
                    if (dist < minDist) {
                        minDist = dist;
                        closestPoint = pts[i];
                        closestSeries = setIdx;
                        closestRow = pts[i].idx;
                    }
                }
            }
            return {
                row: closestRow,
                seriesName: layout.setNames[closestSeries],
                point: closestPoint
            };
        };

        /*
         * Metodo usado para actualizar el punto seleccionado
         * Invacodo por la funcion _findClosestPoint
         */
        _updateSelection = function (chartArray) {
            var
                i, j,
                ctx,
                maxCircleSize,
                labels,
                currentRatio,
                canvasx,
                point,
                colorSerie,
                circleSize,
                callback;

            for (i = 0; i < chartArray.length; i += 1) {
                chartArray[i].cascadeEvents_("select", {
                    selectedRow: chartArray[i].lastRow_,
                    selectedX: chartArray[i].lastx_,
                    selectedPoints: chartArray[i].selPoints_
                });

                // Contexto de canvas
                ctx = chartArray[i].canvas_ctx_;
                if (chartArray[i].previousVerticalX_ >= 0) {
                    // Determinar el radio maximo del circulo resaltado
                    maxCircleSize = 0;
                    labels = chartArray[i].attr_("labels");
                    for (j = 1; j < labels.length; j += 1) {
                        currentRatio = chartArray[i].getNumericOption("highlightCircleSize", labels[j]);
                        if (currentRatio > maxCircleSize) {
                            maxCircleSize = currentRatio;
                        }
                    }
                    ctx.clearRect(0, 0, chartArray[i].width_, chartArray[i].height_);
                }

                if (chartArray[i].isUsingExcanvas_ && chartArray[i].currentZoomRectArgs_) {
                    Dygraph.prototype.drawZoomRect_.apply(chartArray[i], chartArray[i].currentZoomRectArgs_);
                }

                if (chartArray[i].selPoints_.length > 0) {
                    // Dibuja circulos de colores sobre el centro de cada punto seleccionado
                    canvasx = chartArray[i].selPoints_[0].canvasx;
                    ctx.save();
                    for (j = 0; j < chartArray[i].selPoints_.length; j += 1) {
                        point = chartArray[i].selPoints_[j];
                        if (point) {
                            if (!Dygraph.isOK(point.canvasy)) {
                                continue;
                            }
                            circleSize = chartArray[i].getNumericOption("highlightCircleSize", point.name);
                            callback = chartArray[i].getFunctionOption("drawHighlightPointCallback", point.name);
                            if (!callback) {
                                callback = Dygraph.Circles.DEFAULT;
                            }
                            colorSerie = chartArray[i].colorsMap_[point.name];
                            ctx.lineWidth = chartArray[i].getNumericOption("strokeWidth", point.name);
                            ctx.strokeStyle = colorSerie;
                            ctx.fillStyle = colorSerie;
                            callback.call(chartArray[i], chartArray[i], point.name, ctx, point.canvasx, point.canvasy, colorSerie, circleSize, point.idx);
                        }
                    }
                    ctx.restore();
                    chartArray[i].previousVerticalX_ = canvasx;
                }
            }
        };

        _getSelectedPoints = function (row, chartArray) {
            var
                i,
                setIdx,
                points,
                setRow,
                point,
                pointIdx;

            for (i = 0; i < chartArray.length; i += 1) {
                chartArray[i].lastRow_ = row;
                chartArray[i].selPoints_ = [];
                for (setIdx = 0; setIdx < chartArray[i].layout_.points.length; setIdx += 1) {
                    points = chartArray[i].layout_.points[setIdx];
                    setRow = row - chartArray[i].getLeftBoundary_(setIdx);
                    if (!points[setRow]) {
                        // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                        continue;
                    }
                    if (setRow < points.length && points[setRow].idx === row) {
                        point = points[setRow];
                        if (point.yval !== null && !Number.isNaN(point.yval)) {
                            chartArray[i].selPoints_.push(point);
                        }
                    } else {
                        for (pointIdx = 0; pointIdx < points.length; pointIdx += 1) {
                            point = points[pointIdx];
                            if (point.idx === row) {
                                if (point.yval !== null && !Number.isNaN(point.yval)) {
                                    chartArray[i].selPoints_.push(point);
                                }
                                break;
                            }
                        }
                    }
                }
                if (chartArray[i].selPoints_.length) {
                    chartArray[i].lastx_ = chartArray[i].selPoints_[0].xval;
                } else {
                    chartArray[i].lastx_ = -1;
                }
            }
        };

        _customInteractionModel = {
            mousedown: function (e, g, ctx) {
                // Evita que el clic derecho inicialice el zoom
                if (e.button && e.button === 2) {
                    return;
                }
                ctx.initializeMouseDown(e, g, ctx);
                if (e.altKey || e.shiftKey || e.ctrlKey) {
                    Dygraph.startPan(e, g, ctx);
                } else {
                    Dygraph.startZoom(e, g, ctx);
                }
            },
            mousemove: function (e, g, ctx) {
                var
                    closestPoint,
                    selectionChanged,
                    chartArray,
                    callback;

                if (ctx.isZooming) {
                    Dygraph.moveZoom(e, g, ctx);
                } else if (ctx.isPanning) {
                    Dygraph.movePan(e, g, ctx);
                } else {
                    if (!_cursorLock) {
                        closestPoint = _findClosestPoint(g.eventToDomCoords(e)[0], g.eventToDomCoords(e)[1], g.layout_);
                        selectionChanged = (closestPoint.row !== g.lastRow_);
                        _chartAmplitude.row = g.lastRow_;
                        _chartPhase.row = g.lastRow_;
                        chartArray = [_chartAmplitude, _chartPhase];
                        _getSelectedPoints(closestPoint.row, chartArray);
                        if (selectionChanged) {
                            _updateSelection(chartArray, "mouseEvent");
                        }
                        callback = _chartAmplitude.getFunctionOption("highlightCallback");
                        if (callback && selectionChanged) {
                            callback.call(_chartAmplitude, e, _chartAmplitude.lastx_, _chartAmplitude.selPoints_, _chartAmplitude.row);
                        }
                    }
                }
            },
            mouseup: function (e, g, ctx) {
                if (ctx.isZooming) {
                    Dygraph.endZoom(e, g, ctx);
                } else if (ctx.isPanning) {
                    Dygraph.endPan(e, g, ctx);
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                _cursorLock = true;
                _chartAmplitude.selectedRow_ = _chartAmplitude.lastRow_;
                return false;
            },
            click: function (e, g, ctx) {
                var
                    closestPoint,
                    chartArray;

                e.preventDefault();
                _cursorLock = !_cursorLock;
                chartArray = [_chartAmplitude, _chartPhase];
                _getSelectedPoints(_chartAmplitude.selectedRow_, chartArray);
                _updateSelection(chartArray, "mouseEvent");
                return false;
            },
            dblclick: function (event, g, context) {
                var
                    xRange,
                    yRange;

                if (context.cancelNextDblclick) {
                    context.cancelNextDblclick = false;
                    return;
                }
                if (event.altKey || event.shiftKey || event.ctrlKey) {
                    return;
                }
                switch ($(g.canvas_).parent().parent()[0].id) {
                    case _ampContainer.id:
                        xRange = _graphRange.amplitude.X;
                        yRange = _graphRange.amplitude.Y;
                        break;
                    case _phaseContainer.id:
                        xRange = _graphRange.phase.X;
                        yRange = _graphRange.phase.Y;
                        break;
                }
                g.updateOptions({
                    "dateWindow": xRange,
                    "valueRange": yRange
                });
                _cursorLock = false;
            }
        };

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
                notStored;

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
                    // Filtramos unicamente los datos con amplitud 1X mayor que cero
                    if (tmpData[1].Value !== null) {
                        _amplitudePhaseData.push({
                            overall: tmpData[0].Value,
                            amplitude: tmpData[1].Value,
                            phase: tmpData[2].Value,
                            velocity: tmpData[3].Value,
                            timeStamp: formatDate(tmpData[0].RawTimeStamp),
                            rawTimeStamp: tmpData[0].RawTimeStamp
                        });
                    }
                }
                _refresh();
                _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                    var
                        row,
                        ampSubVar;

                    if (!Number.isNaN(currentTimeStamp)) {
                        // PENDIENTE POR DESARROLLO
                    }
                });
            });
        };

        _getValueRanges = function (data, inverted) {
            var
                minValue,
                maxValue,
                ranges,
                i,
                tmpValue;

            inverted = inverted || false;
            minValue = arrayColumn(data, 0).min();
            maxValue = arrayColumn(data, 0).max();
            ranges = {
                X: [minValue, maxValue]
            };
            minValue = undefined;
            maxValue = undefined;
            for (i = 1; i < data[0].length; i += 1) {
                if (_seriesVisibility[i - 1].Visible) {
                    tmpValue = arrayColumn(data, i).min();
                }
                if (!minValue || tmpValue < minValue) {
                    minValue = tmpValue;
                }
                if (_seriesVisibility[i - 1].Visible) {
                    tmpValue = arrayColumn(data, i).max();
                }
                if (!maxValue || tmpValue > maxValue) {
                    maxValue = tmpValue;
                }
            }
            if (inverted) {
                ranges.Y = [maxValue * 1.1, minValue * (minValue > 0 ? 0.9 : 1.1)];
            } else {
                if (minValue > 0) {
                    minValue = 0;
                }
                ranges.Y = [minValue * 0.9, maxValue * 1.1];
            }
            return ranges;
        };

        _getAmplitudeData = function () {
            var
                amplitudeValues,
                ampData,
                i;

            amplitudeValues = [];
            ampData = [];
            for (i = 0; i < _amplitudePhaseData.length; i += 1) {
                amplitudeValues[i] = Number(_amplitudePhaseData[i].amplitude);
                ampData.push([_amplitudePhaseData[i].rawTimeStamp, amplitudeValues[i], Number(_amplitudePhaseData[i].overall)]);
            }
            return ampData;
        };

        _getPhaseData = function () {
            var
                phaseValues,
                phaData,
                i,
                step;

            phaseValues = [];
            phaData = [];
            _boxPhaseChart = 0;
            if (_amplitudePhaseData.length > 0) {
                phaseValues[0] = Number(_amplitudePhaseData[0].phase);
                phaData.push([_amplitudePhaseData[0].rawTimeStamp, phaseValues[0]]);
            }
            for (i = 1; i < _amplitudePhaseData.length; i += 1) {
                step = _amplitudePhaseData[i].phase - _amplitudePhaseData[i - 1].phase;
                if (step > 180 && (_amplitudePhaseData[i - 1].phase !== 0 || phaseValues[i] !== 0)) {
                    _boxPhaseChart -= 1;
                } else if (step < -180 && (_amplitudePhaseData[i - 1].phase !== 0 || phaseValues[i] !== 0)) {
                    _boxPhaseChart += 1;
                } else if (step > -180 || step < 180) {
                    _boxPhaseChart = _boxPhaseChart;
                }
                phaseValues[i] = Number(_amplitudePhaseData[i].phase + 360 * _boxPhaseChart);
                phaData.push([_amplitudePhaseData[i].rawTimeStamp, phaseValues[i]]);
            }
            return phaData;
        };
       
        /*
         * Actualiza los valores a graficar
         */
        _refresh = function () {
            var
                // Valores X,Y a graficar
                xyData,
                // Texto a mostrar de forma dinamica
                txt;

            txt = "<b style=\"color:" + _measurementPoint.Color + ";\">" + _measurementPoint.Name + "</b>&nbsp;";
            txt += "Ang:&nbsp;" + parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
            txt += "(" + _amplitudePhaseData[0].timeStamp + " - " + _amplitudePhaseData[_amplitudePhaseData.length - 1].timeStamp + ")";
            $("#point" + _measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
            // Informacion de amplitud
            xyData = _getAmplitudeData();
            _graphRange.amplitude = _getValueRanges(xyData);
            _chartAmplitude.is_initial_draw_ = true;
            _chartAmplitude.updateOptions({
                "file": xyData,
                "valueRange": _graphRange.amplitude.Y,
                "dateWindow": _graphRange.amplitude.X,
                "visibility": [_seriesVisibility[0].Visible, _seriesVisibility[1].Visible]
            });
            // Informacion de fase
            xyData = _getPhaseData();
            _graphRange.phase = _getValueRanges(xyData, true);
            _chartPhase.is_initial_draw_ = true;
            _chartPhase.updateOptions({
                "file": xyData,
                "valueRange": _graphRange.phase.Y,
                "dateWindow": _graphRange.phase.X,
                "visibility": [_seriesVisibility[0].Visible]
            });
            if (_mouseover) {
                _chartAmplitude.mouseMove_(_lastMousemoveEvt);
                _chartPhase.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(_chartAmplitude, 0, 0);
                DygraphOps.dispatchMouseMove(_chartPhase, 0, 0);
            }
        };

        _keyDownEventHandler = function (e) {
            var
                ppalChart,
                chartArray,
                i, j,
                callback;

            if (e.keyCode === 37 || e.keyCode === 39) {
                if (!_cursorLock && _mouseover && _lastMousemoveEvt.isTrusted) {
                    // Necesario para evitar la propagacion del evento keydown en otros graficos
                    // (Principalmente ocurre con tiempo real).
                    chartArray = [_chartAmplitude, _chartPhase];
                    for (i = 0; i < chartArray.length; i += 1) {
                        if (e.keyCode === 37) {
                            chartArray[i].lastRow_ -= 1;
                        } else if (e.keyCode === 39) {
                            chartArray[i].lastRow_ += 1;
                        }
                        chartArray[i].row = chartArray[i].lastRow_;
                        chartArray[i].lastx_ = chartArray[i].file_[chartArray[i].row][0];
                        for (j = 0; j < chartArray[i].selPoints_.length; j += 1) {
                            chartArray[i].selPoints_[j] = chartArray[i].layout_.points[j][chartArray[i].row];
                        }
                    }
                    ppalChart = chartArray[0];
                    _updateSelection(chartArray);
                    callback = ppalChart.getFunctionOption("highlightCallback");
                    callback.call(ppalChart, e, ppalChart.lastx_, ppalChart.selPoints_, ppalChart.row);
                }
            }
        };

        /*
        * Mostrar u ocultar las diferentes series de la grafica
        */
        _showHideSeries = function () {
            var
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer,
                x, y,
                phaseIni,
                sampleTime,
                positions;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 350, height: 150 };
            dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "bodeConfig";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-12\"><ul id=\"seriesCheckList" +
                _widgetId + "\"></ul></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnSaveVisibility" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveVisibility" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnCancelVisibility" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelVisibility" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#seriesCheckList" + _widgetId).ejListBox({
                dataSource: [_seriesVisibility[1]],
                fields: { id: "Id", text: "Name", value: "Id", checkBy: "Visible" },
                height: "auto",
                showCheckbox: true
            });
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                enableResize: false,
                width: "auto",
                height: "auto",
                zIndex: 2000,
                close: function () {
                    // Destruir objeto Listbox Syncfusion
                    $("#seriesCheckList" + _widgetId).ejListBox("destroy");
                    // Desasociar el evento clic
                    $("#btnCancelVisibility" + _widgetId).off("click");
                    $("#btnSaveVisibility" + _widgetId).off("click");
                    $("#" + configContainer[0].id).remove();
                },
                content: "#" + configContainer[0].id,
                tooltip: {
                    close: "Cerrar"
                },
                actionButtons: ["close"],
                position: {
                    X: dialogPosition.left,
                    Y: dialogPosition.top
                }
            });
            // Abrir el dialogo
            $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
            // Boton cancelar
            $("#btnCancelVisibility" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            // Botono aceptar
            $("#btnSaveVisibility" + _widgetId).click(function (e) {
                var
                    visibleCheckList,
                    seriesCount;

                e.preventDefault();
                _seriesVisibility[1].Visible = false;
                visibleCheckList = $("#seriesCheckList" + _widgetId).ejListBox("getCheckedItems");
                if (visibleCheckList.length > 0) {
                    _seriesVisibility[1].Visible = true;
                }
                _refresh();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
        };
        
        _subscribeToResizeChart = function () {
            _resizeChartSubscription = PublisherSubscriber.subscribe("/resizechart", null, function () {
                var
                    // Ancho y alto actual del grid
                    h, w,
                    // Referencia global de gridStack
                    gridStack,
                    // Referencia al grid actual
                    grid;

                gridStack = $(".grid-stack").data("gridstack");
                grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                h = parseInt(grid[0].attributes["data-gs-height"].value);
                w = parseInt(grid[0].attributes["data-gs-width"].value);

                gridStack.batchUpdate();
                gridStack.resize(grid, 2, 2);
                gridStack.commit();
                _chartAmplitude.resize();
                _chartPhase.resize();
                gridStack.batchUpdate();
                gridStack.resize(grid, w, h);
                gridStack.commit();
                setTimeout(function () {
                    _chartAmplitude.resize();
                    _chartPhase.resize();
                }, 50);
            });
        };

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
            _measurementPoint.Color = currentColor;
            // Agregamos los items al menu de opciones para la grafica.
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Series", "showSeries"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
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
                },
                onMaximize: function () {
                    launchFullScreen(_container.id);
                },
                onMinimize: function () {
                    cancelFullscreen();
                }
            });

            labelAmp = ["EstampaTiempo", "Amplitud", "Directa"];
            labelPha = ["EstampaTiempo", "Fase"];
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Construir y mostrar grafica.
            _buildGraph(labelAmp, labelPha, timeStampArray, rpmPositions);
        };

        this.Close = function () {
            var
                el;

            // Remover el evento manejador de KeyDown
            document.body.removeEventListener("keydown", _keyDownEventHandler);
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