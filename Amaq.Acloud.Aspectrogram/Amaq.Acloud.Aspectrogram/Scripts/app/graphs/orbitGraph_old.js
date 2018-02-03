/*
 * orbitGraph.js
 * Gestiona todo lo relacionado a la grafica de orbitas.
 * @author Jorge Calderon
 */

var OrbitGraph = {};

OrbitGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    OrbitGraph = function (timeMode, width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor especifico del chart a graficar
            _contentBody,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Modo: Tiempo real (0), historico (1) o evento (2)
            _timeMode,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase OrbitGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Dimension del cuadrado
            _side,
            // Instancia del control de seleccion sobre el canvas
            _selector,
            // Rango maximo y minimo del grafico, tanto en el eje X como en el eje Y
            _graphRange,
            // Mantiene la ultima estampa de tiempo que se actualizo en la grafica
            _currentTimeStamp,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Objeto cuyas propiedades corresponden a informacion relacionada a los puntos de medicion (x, y)
            _measurementPoints,
            // Objeto cuyas propiedades corresponden a informacion relacionada a las formas de onda del par de sensores (x, y)
            _waveforms,
            // Mantiene el valor de la subVariable de global del sensor en X
            _overallXValue,
            // Mantiene el valor de la subVariable de global del sensor en Y
            _overallYValue,
            // Mantiene el valor de la subVariable de velocidad que corresponde a la referencia angular en memoria
            _velocityValue,
            // Bandera que identifica si se esta mostrando la grafica filtrada 1x o sin filtre
            _filtered1x,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection,
            // Metodo privado que calcula las margenes para que el tamaño del canvas sea un cuadrado
            _setMargins,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Referencia a la suscripción para aplicar filtro dinámico
            _applyFilterSubscription,
            // Método privado que realiza la suscripción al publisher para aplicar filtro dinámico
            _subscribeToApplyFilter,
            // Método privado que aplica filtro dinámico a la forma de onda y refresca el chart
            _applyFilter,
            // Referencia a los últimos datos en X que se han graficado
            _currentDataX,
            // Referencia a los últimos datos en Y que se han graficado
            _currentDataY,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            _laps,
            _xColor,
            _yColor,
            _colorSerie,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Método privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            _subscribeToScaleChart,
            _scaleChartSubscription,
            _autoscale,
            _largestXY,
            _largestDifference;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _pause = (_timeMode == 0) ? false : true;
        _movableGrid = false;
        _autoscale = false;
        _filtered1x = false;
        _this = this;
        _graphType = "orbit";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _waveforms = {};
        _measurementPoints = {};
        _overallXValue = 0;
        _overallYValue = 0;
        _velocityValue = 0;
        _laps = 1;
        _largestDifference = 0;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "orbitGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "orbitHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "orbitBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        _contentBody.style.cssFloat = "right";
        $(_container).append(_contentBody);

        /*
         * Define las margenes del DIV contenedor segun el ancho y alto del widget para que
         * la grafica siempre sea cuadrada
         */
        _setMargins = function () {
            var w, h, mrg, width, headerHeigthPercentage;
            headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
            w = _container.clientWidth;
            h = _container.clientHeight - (_contentHeader.clientHeight + 4);
            _side = [w, h].min();
            mrg = ([w, h].max() - _side) / 2;
            width = (w == _side) ? (_side * 100) / w : ((_side * 1) * 100) / w;
            $(_contentBody).css("width", width + "%");
            $(_contentBody).css("height", ((_side * 100) / h - headerHeigthPercentage) + "%");
            if (w == _side) {
                $(_contentBody).css("margin-top", (mrg * 100) / h + "%");
                $(_contentBody).css("margin-right", "0%");
            } else {
                $(_contentBody).css("margin-right", (mrg * 99.02) / w + "%");
                $(_contentBody).css("margin-top", "0%");
            }
        };

        /*
         * Callback de evento click sobre algun item del menu de opciones
         *@param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var
                target,
                i, configContainer,
                settingsMenuItem,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition;

            target = $(event.currentTarget);
            settingsMenuItem = target.attr("data-value");
            switch (settingsMenuItem) {
                case "setOrbitLaps":
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 350, height: 150 };
                    dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                    configContainer = $("#graphConfigAreaDialog").clone();
                    configContainer.css("display", "block");
                    configContainer[0].id = _widgetId + "orbit";
                    $("#awContainer").append(configContainer);
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"orbitLapsToShow\" " +
                      "style=\"font-size:12px;\">N&uacute;mero de vueltas</label></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"number\" " +
                      "id=\"orbitLapsToShow\" name=\"orbitLapsToShow\" style=\"width:100%;\"></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div style=\"text-align: center;\"></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnSaveLaps" + _widgetId +
                      "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                    $("#btnSaveLaps" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnCancelLaps" + _widgetId +
                      "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                    $("#btnCancelLaps" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
                    $("#orbitLapsToShow").val(_laps);
                    $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                        enableResize: false,
                        width: dialogSize.width,
                        height: dialogSize.height,
                        zIndex: 2000,
                        close: function () {
                            $("#btnCancelLaps" + _widgetId).off("click");
                            $("#btnSaveLaps" + _widgetId).off("click");
                            $("#" + configContainer[0].id).remove();
                        },
                        content: "#" + configContainer[0].id,
                        tooltip: {
                            close: "Cerrar"
                        },
                        actionButtons: ["close"/*, "collapsible", "minimize", "pin"*/],
                        position: {
                            X: dialogPosition.left,
                            Y: dialogPosition.top
                        }
                    });

                    $("#btnCancelLaps" + _widgetId).click(function (e) {
                        e.preventDefault();
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                    });

                    $("#btnSaveLaps" + _widgetId).click(function (e) {
                        e.preventDefault();
                        _laps = parseFloat($("#orbitLapsToShow").val());
                        if (_laps < 1) {
                            return;
                        }
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                        switch (timeMode) {
                            case 1:
                                var
                                    x, y,
                                    waveformX,
                                    waveformY,
                                    data;

                                x = clone(_currentDataX);
                                y = clone(_currentDataY);
                                if (_filtered1x) {
                                    data = GetOrbit1X(x.RawValue, y.RawValue, x.KeyphasorPositions, y.KeyphasorPositions, _chart.phiX_, _chart.phiY_, _laps);
                                } else {
                                    waveformX = enableFilter ? GetFilterSignal(x.RawValue, stopFrecuency, Math.round(x.SampleRate)) : x.RawValue;
                                    waveformY = enableFilter ? GetFilterSignal(y.RawValue, stopFrecuency, Math.round(y.SampleRate)) : y.RawValue;
                                    data = GetOrbitFull(waveformX, waveformY, x.KeyphasorPositions, y.KeyphasorPositions, _chart.phiX_, _chart.phiY_, _laps);
                                }
                                _graphRange.X = data.rangeX;
                                _graphRange.Y = data.rangeY;
                                _chart.updateOptions({
                                    "file": data.value,
                                    "dateWindow": [_graphRange.X[0] - _largestDifference / 2, _graphRange.X[1] + _largestDifference / 2],
                                    "valueRange": [_graphRange.Y[0] - _largestDifference / 2, _graphRange.Y[1] + _largestDifference / 2]
                                });
                                break;
                            default:
                                break;
                        }
                    });
                    break;
                case "filteredOrbit" + _widgetId:
                    var
                        x, y,
                        data;

                    x = clone(_currentDataX);
                    y = clone(_currentDataY);
                    data = GetOrbit1X(x.RawValue, y.RawValue, x.KeyphasorPositions, y.KeyphasorPositions, _chart.phiX_, _chart.phiY_, _laps);
                    _graphRange.X = data.rangeX;
                    _graphRange.Y = data.rangeY;
                    _chart.updateOptions({
                        "file": data.value,
                        "dateWindow": [_graphRange.X[0] - _largestDifference / 2, _graphRange.X[1] + _largestDifference / 2],
                        "valueRange": [_graphRange.Y[0] - _largestDifference / 2, _graphRange.Y[1] + _largestDifference / 2]
                    });
                    target[0].innerHTML = "Sin filtrar";
                    target.attr("data-value", "unfilteredOrbit" + _widgetId);
                    _filtered1x = true;
                    break;
                case "unfilteredOrbit" + _widgetId:
                    var
                        x, y,
                        data;

                    x = clone(_currentDataX);
                    y = clone(_currentDataY);
                    data = GetOrbitFull(x.RawValue, y.RawValue, x.KeyphasorPositions, y.KeyphasorPositions, _chart.phiX_, _chart.phiY_, _laps);
                    _graphRange.X = data.rangeX;
                    _graphRange.Y = data.rangeY;
                    _chart.updateOptions({
                        "file": data.value,
                        "dateWindow": [_graphRange.X[0] - _largestDifference / 2, _graphRange.X[1] + _largestDifference / 2],
                        "valueRange": [_graphRange.Y[0] - _largestDifference / 2, _graphRange.Y[1] + _largestDifference / 2]
                    });
                    target[0].innerHTML = "Filtrar órbita";
                    target.attr("data-value", "filteredOrbit" + _widgetId);
                    _filtered1x = false;
                    break;
                case "saveImageOrbit" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    var
                        contId,
                        name,
                        labels;

                    labels = [];
                    if (timeMode == 0) {
                        name = "Tiempo Real, Órbita: " + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Órbita: " + _assetData.Name;
                    }
                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    labels = ["Amplitud X", "Amplitud Y"];
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false)
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);

                    break;
                default:
                    console.log("Opción de menú no implementada.");
                    break;
            }
        };

        /*
         * Construye la grafica, caso no exista.
         * @param {Array} labels
         */
        _buildGraph = function (labels, waveformUnits, rotn) {
            var
                // Dato inicial necesario para graficar
                initialData,
                // Personalizacion de los eventos de interaccion dentro de la grafica
                customInteractionModel,
                // Dato dinamico por accion de movimiento del mouse sobre la grafica
                dynamicData;

            _colorSerie = "#006ACB";
            initialData = [];
            initialData.push([0, 0]);
            _setMargins();
            _chart = new Dygraph(
                _contentBody,
                initialData,
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    labels: labels,
                    axisLabelFontSize: 10,
                    labelsDivWidth: 0,
                    hideOverlayOnMouseOut: false,
                    axes: {
                        x: {
                            pixelsPerLabel: 30,
                        },
                        y: {
                            pixelsPerLabel: 30,
                        }
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        if (pts.length > 0) {
                            _chart.colorsMap_["Amplitud"] = _colorSerie;
                            dynamicData = "Amplitud X: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " " + waveformUnits;
                            dynamicData += ", Amplitud Y: " + pts[0].xval.toFixed(2) + " " + waveformUnits;
                            dynamicData += isNaN(_velocityValue) ? "" : ", " + _velocityValue.toFixed(0) + " RPM";
                            $("#" + pts[0].name + _widgetId + " > span").html(dynamicData);
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                        Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, _colorSerie, p);
                    },
                    series: {
                        "Amplitud": {
                            plotter: function (e) {
                                var
                                    thetaA,
                                    thetaB;

                                thetaA = clone(_measurementPoints.x.SensorAngle);
                                thetaB = clone(_measurementPoints.y.SensorAngle);
                                Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, rotn);
                                Dygraph.Plugins.Plotter.prototype.drawSensorPositions(e, thetaA, thetaB, rotn, _xColor, _yColor);
                                _colorSerie = Dygraph.Plugins.Plotter.prototype.drawOrbit(e, rotn, _laps);
                            },
                        },
                    },
                    interactionModel: _customInteractionModel
                }
            );

            $(".grid-stack-item").on("resizestop", function () {
                setTimeout(function () {
                    _setMargins();
                    _chart.resize();
                }, 100);
            });

            _chart.ready(function () {
                _selector = $(_contentBody).imgAreaSelect({ instance: true });
                _selector.setOptions({ disable: true });
                _selector.update();
            });

            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });

        };

        _findClosestPoint = function (domX, domY, layout) {
            var minDist = Infinity;
            var dist, dx, dy, point, closestPoint, closestSeries, closestRow;
            for (var setIdx = layout.points.length - 1 ; setIdx >= 0 ; --setIdx) {
                var pts = layout.points[setIdx];
                for (var i = 0; i < pts.length; ++i) {
                    point = pts[i];
                    if (!Dygraph.isValidPoint(point)) continue;
                    dx = point.canvasx - domX;
                    dy = point.canvasy - domY;
                    dist = dx * dx + dy * dy;
                    if (dist < minDist) {
                        minDist = dist;
                        closestPoint = point;
                        closestSeries = setIdx;
                        closestRow = point.idx;
                    }
                }
            }
            var name = layout.setNames[closestSeries];
            return {
                row: closestRow,
                seriesName: name,
                point: closestPoint
            };
        };

        _updateSelection = function () {
            _chart.cascadeEvents_("select", {
                selectedRow: _chart.lastRow_,
                selectedX: _chart.lastx_,
                selectedPoints: _chart.selPoints_
            });

            // Clear the previously drawn vertical, if there is one
            var
                i,
                ctx,
                px1,
                px2;

            ctx = _chart.canvas_ctx_;
            if (_chart.previousVerticalX_ >= 0) {
                // Determine the maximum highlight circle size.
                var maxCircleSize = 0;
                var labels = _chart.attr_("labels");
                for (i = 1; i < labels.length; i += 1) {
                    var r = _chart.getNumericOption("highlightCircleSize", labels[i]);
                    if (r > maxCircleSize) maxCircleSize = r;
                }
                ctx.clearRect(0, 0, _chart.width_, _chart.height_);
            }

            if (_chart.isUsingExcanvas_ && _chart.currentZoomRectArgs_) {
                Dygraph.prototype.drawZoomRect_.apply(_chart, _chart.currentZoomRectArgs_);
            }

            if (_chart.selPoints_.length > 0) {
                // Draw colored circles over the center of each selected point
                var canvasx = _chart.selPoints_[0].canvasx;
                ctx.save();
                for (i = 0; i < _chart.selPoints_.length; i += 1) {
                    var pt = _chart.selPoints_[i];
                    if (!Dygraph.isOK(pt.canvasy)) continue;

                    var circleSize = _chart.getNumericOption("highlightCircleSize", pt.name);
                    var callback = _chart.getFunctionOption("drawHighlightPointCallback", pt.name);
                    if (!callback) {
                        callback = Dygraph.Circles.DEFAULT;
                    }
                    ctx.lineWidth = _chart.getNumericOption("strokeWidth", pt.name);
                    ctx.strokeStyle = _colorSerie;
                    ctx.fillStyle = _colorSerie;
                    callback.call(_chart, _chart, pt.name, ctx, pt.canvasx, pt.canvasy, _colorSerie, circleSize, pt.idx);
                }
                ctx.restore();

                _chart.previousVerticalX_ = canvasx;
            }
        };

        _customInteractionModel = {
            mousedown: function (event, g, context) {
                if (_pause) {
                    // Click derecho no inicializa zoom.
                    if (event.button && event.button == 2) return;

                    context.initializeMouseDown(event, g, context);

                    if (event.altKey || event.shiftKey || event.ctrlKey) {
                        _selector.setOptions({ disable: true });
                        _selector.update();
                        Dygraph.startPan(event, g, context);
                    } else {
                        Dygraph.startZoom(event, g, context);
                        _selector.setOptions({ enable: true });
                        _selector.update();
                    }
                }
            },
            mousemove: function (event, g, context) {
                if (_pause) {
                    if (context.isZooming) {
                        _selector.setOptions({
                            aspectRatio: "4:4",
                            autoHide: true,
                            onSelectEnd: function (div, opts) {
                                if (opts.width > 0) {
                                    var xmin, xmax, ymin, ymax, p1, p2;
                                    // Coordenadas del punto 1
                                    p1 = g.toDataCoords(opts.x1, opts.y1);
                                    // Coordenadas del punto 2
                                    p2 = g.toDataCoords(opts.x2, opts.y2);
                                    // Valores minimo y maximo en el eje X
                                    xmin = [p1[0], p2[0]].min();
                                    xmax = [p1[0], p2[0]].max();
                                    // Valores minimo y maximo en el eje Y
                                    ymin = [p1[1], p2[1]].min();
                                    ymax = [p1[1], p2[1]].max();
                                    g.updateOptions({
                                        "valueRange": [ymin, ymax],
                                        "dateWindow": [xmin, xmax]
                                    });
                                    Dygraph.endZoom(event, g, context);
                                    _selector.setOptions({ disable: true });
                                    _selector.update();
                                }
                            }
                        });
                    } else if (context.isPanning) {
                        Dygraph.movePan(event, g, context);
                    } else {
                        var selectionChanged = false;
                        var canvasCoords = g.eventToDomCoords(event);
                        var closestPoint = _findClosestPoint(canvasCoords[0], canvasCoords[1], g.layout_);
                        var row = closestPoint.row;
                        var point;
                        if (row != _chart.lastRow_) selectionChanged = true;
                        _chart.lastRow_ = row;
                        _chart.selPoints_ = [];
                        for (var setIdx = 0; setIdx < _chart.layout_.points.length; ++setIdx) {
                            var points = _chart.layout_.points[setIdx];
                            var setRow = row - _chart.getLeftBoundary_(setIdx);
                            if (!points[setRow]) {
                                // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                                continue;
                            }
                            if (setRow < points.length && points[setRow].idx == row) {
                                point = points[setRow];
                                if (point.yval !== null && !isNaN(point.yval)) _chart.selPoints_.push(point);
                            } else {
                                for (pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                                    point = points[pointIdx];
                                    if (point.idx == row) {
                                        if (point.yval !== null && !isNaN(point.yval)) {
                                            _chart.selPoints_.push(point);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        if (_chart.selPoints_.length) {
                            _chart.lastx_ = _chart.selPoints_[0].xval;
                        } else {
                            _chart.lastx_ = -1;
                        }
                        if (selectionChanged) {
                            _updateSelection(undefined);
                        }
                        var callback = _chart.getFunctionOption("highlightCallback");
                        if (callback && selectionChanged) {
                            callback.call(_chart, event,
                                _chart.lastx_,
                                _chart.selPoints_,
                                _chart.lastRow_,
                                _chart.highlightSet_);
                        }
                    }
                }
            },
            dblclick: function (event, g, context) {
                if (context.cancelNextDblclick) {
                    context.cancelNextDblclick = false;
                    return;
                }
                if (event.altKey || event.shiftKey || event.ctrlKey) {
                    return;
                }

                g.updateOptions({
                    "dateWindow": [_graphRange.X[0] - _largestDifference / 2, _graphRange.X[1] + _largestDifference / 2],
                    "valueRange": [_graphRange.Y[0] - _largestDifference / 2, _graphRange.Y[1] + _largestDifference / 2]
                });
            },
            mouseup: function (event, g, context) {
                if (context.isZooming) {
                    Dygraph.endZoom(event, g, context);
                } else if (context.isPanning) {
                    Dygraph.endPan(event, g, context);
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                return false;
            },
            click: function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            },
        };

        /*
         * Suscribe el chart al dato segun el Modo definido
         */
        _subscribeToRefresh = function (mdVariableIdList, overallXId, overallYId, velocity, overallName, overallUnits, timeStamp) {
            timeStamp = new Date(timeStamp).getTime().toString();
            // Subscripcion a evento para refrescar datos de grafica segun _timeMode
            switch (_timeMode) {
                case 0: // Tiempo Real
                    _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                        var
                            phiX,
                            phiY,
                            waveformX,
                            waveformY;

                        waveformX = data[_waveforms.x.Id];
                        waveformY = data[_waveforms.y.Id];
                        if (waveformX && waveformY) {
                            if (!waveformX.KeyphasorPositions) {
                                waveformX.KeyphasorPositions = [];
                                waveformY.KeyphasorPositions = [];
                            }
                            _overallXValue = clone(data[overallXId].Value);
                            _overallYValue = clone(data[overallYId].Value);
                            if (velocity) {
                                _velocityValue = clone(data[velocity.Id].Value);
                            } else {
                                _velocityValue = NaN;
                            }
                            phiX = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            phiY = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            _chart.phiX_ = clone(phiX);
                            _chart.phiY_ = clone(phiY);
                            _refresh(waveformX, waveformY, _pause, enableFilter, stopFrecuency, _chart, phiX, phiY, overallName, overallUnits);
                        }
                    });
                    break;
                case 1: // Historico
                    _subscription = PublisherSubscriber.subscribe("/historic/refresh", _subVariableIdList, function (data) {
                        var
                            phiX,
                            phiY,
                            waveformX,
                            waveformY;

                        waveformX = data[_waveforms.x.Id][timeStamp];
                        waveformY = data[_waveforms.y.Id][timeStamp];
                        if (waveformX && waveformY) {
                            if (!waveformX.KeyphasorPositions) {
                                waveformX.KeyphasorPositions = [];
                                waveformY.KeyphasorPositions = [];
                            }
                            _overallXValue = clone(subVariableHTList[overallXId][timeStamp].Value);
                            _overallYValue = clone(subVariableHTList[overallYId][timeStamp].Value);
                            if (velocity) {
                                _velocityValue = clone(subVariableHTList[velocity.Id][timeStamp].Value);
                            } else {
                                _velocityValue = NaN;
                            }
                            phiX = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            phiY = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            _chart.phiX_ = clone(phiX);
                            _chart.phiY_ = clone(phiY);
                            _refresh(waveformX, waveformY, false, enableFilter, stopFrecuency, _chart, phiX, phiY, overallName, overallUnits);
                        }
                    });
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoints.x.Id, _measurementPoints.y.Id], _subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        var
                            xWaveform,
                            yWaveform,
                            xPhi,
                            yPhi;

                        if (!isNaN(currentTimeStamp)) {
                            _overallXValue = NaN;
                            _overallYValue = NaN;
                            _velocityValue = NaN;
                            if (subVariableHTList[_waveforms.x.Id][currentTimeStamp]) {
                                xWaveform = clone(subVariableHTList[_waveforms.x.Id][currentTimeStamp]);
                            } else {
                                console.error("No se encontró datos de forma de onda en X.");
                                return;
                            }
                            if (subVariableHTList[_waveforms.y.Id][currentTimeStamp]) {
                                yWaveform = clone(subVariableHTList[_waveforms.y.Id][currentTimeStamp]);
                            } else {
                                console.error("No se encontró datos de forma de onda en Y.");
                                return;
                            }

                            if (subVariableHTList[velocity.Id][currentTimeStamp]) {
                                _velocityValue = clone(subVariableHTList[velocity.Id][currentTimeStamp].Value);
                            }

                            if (subVariableHTList[overallXId][currentTimeStamp]) {
                                _overallXValue = clone(subVariableHTList[overallXId][currentTimeStamp].Value);
                            }

                            if (subVariableHTList[overallYId][currentTimeStamp]) {
                                _overallYValue = clone(subVariableHTList[overallYId][currentTimeStamp].Value);
                            }

                            if (!xWaveform.KeyphasorPositions) {
                                xWaveform.KeyphasorPositions = [];
                                yWaveform.KeyphasorPositions = [];
                            }

                            xPhi = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            yPhi = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            _chart.phiX_ = clone(xPhi);
                            _chart.phiY_ = clone(yPhi);
                            _refresh(xWaveform, yWaveform, false, enableFilter, stopFrecuency, _chart, xPhi, yPhi, overallName, overallUnits);
                        }
                    });
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {String} data Informacion obtenida del poll
         */
        _refresh = function (x, y, pause, isEnabledFilter, fc, chart, phiX, phiY, overallName, overallUnits) {
            if (!pause) {
                // Realizamos una copia del actual valor de las formas de onda para las operaciones disponibles para la orbita.
                // Por ejemplo, filtrado dinamico, filtro de 1x y numero de vueltas de orbita.
                _currentDataX = clone(x);
                _currentDataY = clone(y);
                var
                    waveformX,
                    waveformY,
                    data,
                    overallData;

                if (_currentTimeStamp !== x.TimeStamp) {
                    _currentTimeStamp = x.TimeStamp;
                    overallData = "<b style=\"color:" + _xColor + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                    overallData += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", ";
                    overallData += overallName + ": " + _overallXValue.toFixed(2) + " " + overallUnits + ", &nbsp;" + _currentTimeStamp;
                    $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(overallData);
                    overallData = "<b style=\"color:" + _yColor + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                    overallData += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", ";
                    overallData += overallName + ": " + _overallYValue.toFixed(2) + " " + overallUnits + ", &nbsp;" + _currentTimeStamp;
                    $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(overallData);
                    waveformX = isEnabledFilter ? GetFilterSignal(x.RawValue, fc, Math.round(x.SampleRate)) : x.RawValue;
                    waveformY = isEnabledFilter ? GetFilterSignal(y.RawValue, fc, Math.round(y.SampleRate)) : y.RawValue;
                    if (_filtered1x) {
                        data = GetOrbit1X(waveformX, waveformY, x.KeyphasorPositions, y.KeyphasorPositions, phiX, phiY, _laps);
                    } else {
                        data = GetOrbitFull(waveformX, waveformY, x.KeyphasorPositions, y.KeyphasorPositions, phiX, phiY, _laps);
                    }
                    _graphRange.X = data.rangeX;
                    _graphRange.Y = data.rangeY;

                    _largestXY = data.rangeY[1] - data.rangeY[0];

                    chart.updateOptions({
                        "file": data.value,
                        "dateWindow": [_graphRange.X[0] - _largestDifference / 2, _graphRange.X[1] + _largestDifference / 2],
                        "valueRange": [_graphRange.Y[0] - _largestDifference / 2, _graphRange.Y[1] + _largestDifference / 2]
                    });
                    chartScaleY.AttachGraph(_graphType, _widgetId, _measurementPoints.x.SensorTypeCode, _largestXY);
                }
            }
        };

        _subscribeToApplyFilter = function () {
            _applyFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                if (_currentDataX && _currentDataX.Value !== null) {
                    _applyFilter(_currentDataX, _currentDataY, enableFilter, stopFrecuency, _chart);
                }
            });
        };

        _applyFilter = function (x, y, isEnabledFilter, fc, chart) {
            var
                waveformX,
                waveformY,
                data;

            waveformX = isEnabledFilter ? GetFilterSignal(x.RawValue, fc, Math.round(x.SampleRate)) : x.RawValue;
            waveformY = isEnabledFilter ? GetFilterSignal(y.RawValue, fc, Math.round(y.SampleRate)) : y.RawValue;
            data = GetOrbitFull(waveformX, waveformY, x.KeyphasorPositions, y.KeyphasorPositions, chart.phiX_, chart.phiY_, _laps);

            _graphRange.X = data.rangeX;
            _graphRange.Y = data.rangeY;

            chart.updateOptions({
                "file": data.value,
                "dateWindow": _graphRange.X,
                "valueRange": _graphRange.Y,
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
                _chart.resize();
                gridStack.batchUpdate();
                gridStack.resize(grid, w, h);
                gridStack.commit();
                setTimeout(function () {
                    _chart.resize();
                }, 50);
            });
        };

        _subscribeToScaleChart = function () {
            var
                dateWindow,
                valueRange;

            _scaleChartSubscription = PublisherSubscriber.subscribe("/scale/" + _graphType, [_measurementPoints.x.SensorTypeCode], function (data) {
                if (data[_measurementPoints.x.SensorTypeCode]) {
                    if (!_autoscale && data[_measurementPoints.x.SensorTypeCode] > _largestXY) {
                        _largestDifference = data[_measurementPoints.x.SensorTypeCode] - _largestXY;
                        if (_largestDifference === 0) {
                            return;
                        }
                        dateWindow = [_graphRange.X[0] - _largestDifference / 2, _graphRange.X[1] + _largestDifference / 2];
                        valueRange = [_graphRange.Y[0] - _largestDifference / 2, _graphRange.Y[1] + _largestDifference / 2];
                        _chart.updateOptions({
                            "dateWindow": dateWindow,
                            "valueRange": valueRange
                        });
                    }
                }
            });
        };

        this.Show = function (measurementPointId, timeStamp, currentColor, pairedColor) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Punto de medicion de referencia en el par (x, y)
                measurementPoint,
                // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
                rotn,
                // Labels
                labels;

            switch (_timeMode) {
                case 0: // RT
                    measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;

                    // Si el asset no tiene un asdaq asociado, significa que no se están actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    if (!_assetData.AsdaqId && !_assetData.AtrId) {
                        popUp("info", "No hay datos tiempo real activo seleccionado.");
                        return;
                    }
                    break;
                case 1: // HT
                    measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                        new ej.Query().where("AssetId", "equal", measurementPoint.ParentId, false))[0];
                    break;
                default:
                    break;
            }

            if (measurementPoint.AssociatedMeasurementPointId != null) {
                var
                    // Sensor de referencia angular
                    angularReference,
                    // Menu de opciones para la grafica
                    settingsMenu,
                    // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                    overallUnits,
                    // SubVariable global en X configurada en el sistema
                    overallXSubVariable,
                    // SubVariable global en Y configurada en el sistema
                    overallYSubVariable,
                    // SubVariable de velocidad de la referencia angular
                    velocitySubVariable,
                    // Listado de Ids de variables a suscribir
                    mdVariableListId;

                if (measurementPoint.Orientation == "X") {
                    // Punto de medicion X
                    _measurementPoints.x = measurementPoint;

                    // Punto de medicion Y.
                    _measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];

                    _xColor = (_timeMode === 0) ? "#C68E17" : currentColor;
                    _yColor = (_timeMode === 0) ? "#8D38C9" : pairedColor;
                } else {
                    // Punto de medicion X
                    _measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];

                    // Punto de medicion Y
                    _measurementPoints.y = measurementPoint;

                    _xColor = (_timeMode === 0) ? "#C68E17" : pairedColor;
                    _yColor = (_timeMode === 0) ? "#8D38C9" : currentColor;
                }
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false)
                )[0];
                if (!angularReference) {
                    popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    angularReference = { RotationDirection: 1 };
                }

                rotn = (angularReference.RotationDirection == 1) ? "CW" : "CCW";
                subVariables = _measurementPoints.x.SubVariables;
                // SubVariable que contiene la forma de onda en X
                _waveforms.x = ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
                if (_waveforms.x) {
                    _subVariableIdList.push(_waveforms.x.Id);
                }
                // SubVariable que contiene el valor global del sensor en X
                overallXSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
                if (overallXSubVariable) {
                    _subVariableIdList.push(overallXSubVariable.Id);
                }

                subVariables = _measurementPoints.y.SubVariables;
                // Subvariable que contiene la forma de onda en Y
                _waveforms.y = ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
                if (_waveforms.y) {
                    _subVariableIdList.push(_waveforms.y.Id);
                }
                // SubVariable que contiene el valor global del sensor en Y
                overallYSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
                if (overallYSubVariable) {
                    _subVariableIdList.push(overallYSubVariable.Id);
                }
                velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
                if (velocitySubVariable) {
                    _subVariableIdList.push(velocitySubVariable.Id);
                }

                _seriesName = ["Amplitud"];
                if (overallXSubVariable.Units !== overallYSubVariable.Units) {
                    popUp("info", "Unidades de las subvariable con valor global es diferente para el par de puntos de medición.");
                    return;
                }
                overallUnits = overallXSubVariable.Units;
                switch (overallXSubVariable.MeasureType) {
                    case 1:
                        overallUnits += " p";
                        break;
                    case 2:
                        overallUnits += " pp";
                        break;
                    case 3:
                        overallUnits += " rms";
                        break;
                    default:
                        break;
                }

                // Agregamos los items al menu de opciones para la grafica
                settingsMenu = [];
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Número de vueltas...", "setOrbitLaps"));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtrar órbita", "filteredOrbit" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageOrbit" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

                /*
                 * Creamos la referencia al AspectrogramWidget.
                 */
                _aWidget = new AspectrogramWidget({
                    widgetId: _widgetId,
                    parentId: "awContainer",
                    content: _container,
                    title: "Órbita",
                    width: width,
                    height: height,
                    aspectRatio: aspectRatio,
                    graphType: _graphType,
                    timeMode: _timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: _subVariableIdList,
                    asset: _assetData.Name,
                    seriesName: _seriesName,
                    measurementPointList: [_measurementPoints.x.Name.replace(/\s/g, ""), _measurementPoints.y.Name.replace(/\s/g, "")],
                    pause: (_timeMode == 0) ? true : false,
                    settingsMenu: settingsMenu,
                    onSettingsMenuItemClick: _onSettingsMenuItemClick,
                    onClose: function () {
                        _this.Close();
                    },
                    onPause: function () {
                        _pause = !_pause;
                        if (!_pause) {
                            _selector.setOptions({ disable: true });
                            _selector.update();
                        }
                    },
                    onMove: function () {
                        _movableGrid = !_movableGrid;
                        var gridStack = $(".grid-stack").data("gridstack");
                        var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                        gridStack.movable(grid, _movableGrid);
                    }
                });

                labels = ["Estampa de tiempo"];
                labels.pushArray(_seriesName);
                mdVariableListId = [_measurementPoints.x.Id, _measurementPoints.y.Id, angularReference.Id];
                // Abrir AspectrogramWidget.
                _aWidget.open();
                // Se suscribe a la notificacion de llegada de nuevos datos.
                _subscribeToRefresh(mdVariableListId, overallXSubVariable.Id, overallYSubVariable.Id,
                                    velocitySubVariable, overallXSubVariable.Name, overallUnits, timeStamp);
                // Se suscribe a la notificación de aplicación de filtro dinámico para la forma de onda
                _subscribeToApplyFilter();
                // Se suscribe a la notificación de aplicación de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Se suscribe a la notificacion escala en XY por mayor valor.
                _subscribeToScaleChart();
                // Construir y mostrar grafica.
                _buildGraph(labels, overallUnits, rotn);
            } else {
                popUp("info", "El punto de medición no tiene asociado ningún par.");
            }
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
            }

            if (_playerSubscription) {
                // Eliminar suscripcion de reproductor.
                _playerSubscription.remove();
            }

            if (_applyFilterSubscription) {
                // Eliminar suscripción de notificaciones para aplicar filtro dinámico a la forma de onda
                _applyFilterSubscription.remove();
            }

            if (_resizeChartSubscription) {
                // Eliminar suscripción de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }

            if (_scaleChartSubscription) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                _scaleChartSubscription.remove();
                chartScaleY.DetachGraph(_graphType, _widgetId, _measurementPoints.x.SensorTypeCode);
            }

            var grid, el;
            if (_chart) _chart.destroy();
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();

            $.each(globalsReport.elemDygraph, function (i) {
                if (globalsReport.elemDygraph[i].id === _container.id) {
                    globalsReport.elemDygraph.splice(i, 1);
                    return false;
                }
            });
        };
    };

    return OrbitGraph;
})();
