/*
 * polarGraph.js
 * Gestiona todo lo relacionado a la grafica polar.
 * @author Jorge Calderon
 */

/* globals Dygraph, ej, clone, aidbManager, formatDate, PublisherSubscriber, mainCache, AspectrogramWidget, ImageExport */

var PolarGraph = {};

PolarGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    PolarGraph = function (width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor HTML para el menu contextual
            _contextMenuContainer,
            // Contenedor especifico del chart a graficar
            _contentBody,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase PolarGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Dimension del cuadrado
            _side,
            // Rangos maximos y minimos del grafico, tanto en el eje X como en el eje Y
            _graphRange,
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
            _xReference,
            // Valor de referencia de la posicion en el eje coordenado Y
            _yReference,
            // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
            _rotn,
            // Array de los diferentes valores de amplitud, fase, velocidad y valor global en la grafica
            _polarData,
            // Array que permite gestionar la visualizacion de las diferentes series en la grafica
            _seriesVisibility,
            // Tipo de anotacion/label seleccionada para mostrar (Ninguna, Velocidad, Tiempo)
            _selectedTag,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que permite limpiar el sobreado gris claro, causado por el efecto de zoom
            _clearZoomSquare,
            // Metodo privado que gestiona la creacion del menu contextual usado para definir la referencia de la grafica
            _createContextMenu,
            // Metodo privado que gestiona la creacion del menu que permite intercambiar los tags a graficar
            _createTagMenu,
            // Metodo privado que gestiona la creacion de etiquetas en el grafico
            _createTags,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo privado que dibuja la ubicacion del sensor de referencia angular
            _drawAngularSensor,
            // Metodo privado que dibuja el rotulo de la grafica
            _drawTickets,
            // Metodo privado que realiza el zoom cuadrado necesario para mantener la proporcion del grafico
            _drawZoomSquare,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Metodo privado que obtiene los valores de la posicion del eje a graficar
            _getCartesianCoordiantes,
            // Metodo privado como manejador de eventos de KeyDown
            _keyDownEventHandler,
            // Metodo privado que determina si el clic realizo, esta siendo usado para zoom o solo corresponde a la operacion de clic
            _maybeTreatMouseOpAsClick,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que obtiene las coordenadas en X del evento
            _pageX,
            // Metodo privado que obtiene las coordenadas en Y del evento
            _pageY,
            // Metodo privado que ubica el texto del rotulo segun el angulo indicado
            _positionateText,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que calcula las margenes para que las dimensiones del canvas sean las de un cuadrado
            _setMargins,
            // Metodo privado que gestiona la creacion de un nuevo punto de referencia en el grafico
            _setReferencePoint,
            // Metodo para seleccionar/deseleccioanr las series que se quieran ver en el Bode
            _showHideSeries,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que administra los tags o etiquetas de la grafica
            _tagsManagement,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection;

        /*
         * Inicializar el modo, la auto-referencia y demas valores por defecto.
         */
        _movableGrid = false;
        _this = this;
        _graphType = "polar";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _subvariables = {};
        _selectedTag = clone(TagTypes.None);
        _xReference = 0;
        _yReference = 0;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "polarGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "polarHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "polarBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        _contentBody.style.cssFloat = "right";
        $(_container).append(_contentBody);

        /*
         * Define las margenes del DIV contenedor segun el ancho y alto del widget para que
         * la grafica siempre sea cuadrada
         */
        _setMargins = function () {
            var
                w, h,
                mrg,
                widthContent,
                headerHeigth;

            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            w = _container.clientWidth;
            h = _container.clientHeight - (_contentHeader.clientHeight + 4);
            _side = [w, h].min();
            mrg = ([w, h].max() - _side) / 2;
            widthContent = (w === _side) ? (_side * 100) / w : ((_side * 1) * 100) / w;
            $(_contentBody).css("width", widthContent + "%");
            $(_contentBody).css("height", ((_side * 100) / h - headerHeigth) + "%");
            if (w === _side) {
                $(_contentBody).css("margin-top", (mrg * 100) / h + "%");
                $(_contentBody).css("margin-right", "0%");
            } else {
                $(_contentBody).css("margin-right", (mrg * 99.02) / w + "%");
                $(_contentBody).css("margin-top", "0%");
            }
        };

        _createContextMenu = function () {
            var
                ulEl;

            _contextMenuContainer = document.createElement("div");
            _contextMenuContainer.id = "shaftCtxMenu" + _widgetId;
            _contextMenuContainer.className = "customContextMenu";
            ulEl = document.createElement("ul");
            $(ulEl).append("<li id=\"menuReferencePoint" + _widgetId + "\" class=\"menuReferencePoint\">Definir como referencia</li>");
            $(_contextMenuContainer).append(ulEl);
            // Agregamos el contenedor del menu contextual al DOM
            $(_container).append(_contextMenuContainer);
            $(_contextMenuContainer).click(function (e) {
                // Si la opcion esta desactivada, no hacer nada
                if (e.target.className === "disabled") {
                    return false;
                }
                // Gestionamos la accion especifica
                switch (e.target.id) {
                    case "menuReferencePoint" + _widgetId:
                        _setReferencePoint();
                        break;
                }
                // Cerramos el menu contextual
                $(_contextMenuContainer).css("display", "none");
            });
        };

        /*
         * Callback de evento click sobre algun item del menu de opciones
         */
        _onSettingsMenuItemClick = function (evt) {
            evt.preventDefault();
            var
                target,
                menuItem,
                imgExport,
                contId,
                name,
                labels,
                i;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "showSeries" + _widgetId:
                    _showHideSeries();
                    break;
                case TagTypes.None.Text + _widgetId:
                case TagTypes.Velocity.Text + _widgetId:
                case TagTypes.TimeStamp.Text + _widgetId:
                    _tagsManagement(target, menuItem);
                    break;
                case "saveImage" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    labels = ["Amplitud, Fase"];
                    name = "Histórico, Polar" + _assetData.Name;
                    contId = "tableToExcelPolarGraph" + _widgetId;
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false);
                    tableToExcel("tableToExcelPolarGraph" + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
                    break;
            }
        };

        _tagsManagement = function (target, menuItem) {
            var
                children,
                i;

            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
            switch (menuItem) {
                case TagTypes.None.Text + _widgetId:
                    _selectedTag = clone(TagTypes.None);
                    break;
                case TagTypes.Velocity.Text + _widgetId:
                    _selectedTag = clone(TagTypes.Velocity);
                    break;
                case TagTypes.TimeStamp.Text + _widgetId:
                    _selectedTag = clone(TagTypes.TimeStamp);
                    break;
            }
            _chart.updateOptions({
                "valueRange": _chart.axes_[0].valueRange,
                "dateWindow": _chart.dateWindow_
            });
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labels, timeStampArray) {
            var
                // Texto a mostrar de forma dinamica
                txt,
                // Contador
                i;

            _createContextMenu();
            _setMargins();
            _seriesName.push("1XComp");
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
                    case "1XComp":
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
            _chart = new Dygraph(
                _contentBody,
                [[0, 0, 0]],
                {
                    colors: ["#006ACB", "#002547"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: labels,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row, customFlag) {
                        var
                            needRestoreLock,
                            ampReference,
                            phaseReference,
                            phaseCompensated;

                        needRestoreLock = false;
                        // Permitir mover el cursor usando el teclado, mientras se encuentre bloqueado para el hover del mouse
                        if (customFlag !== undefined && _cursorLock) {
                            _cursorLock = !_cursorLock;
                            needRestoreLock = true;
                        }
                        if (_cursorLock || pts.length === 0) {
                            _mouseover = true;
                            return;
                        }
                        for (i = 0; i < pts.length; i += 1) {
                            if (!_polarData || !_polarData[pts[i].idx]) {
                                return;
                            }
                            if (!Number.isNaN(pts[i].yval) && (pts[i].name === labels[1] || pts[i].name === labels[2])) {
                                if (_seriesVisibility[0].Visible) {
                                    txt = "<span style=\"color:#006ACB;font-weight:bold;\">" + _seriesVisibility[0].Name + "</span>: ";
                                    txt += _polarData[pts[i].idx].amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                    txt += " &ang;" + _polarData[pts[i].idx].phase.toFixed(2) + "&deg;";
                                } else {
                                    ampReference = Math.sqrt(_xReference * _xReference + _yReference * _yReference);
                                    phaseReference = Math.atan2(_yReference, _xReference);
                                    phaseReference = (phaseReference < 0) ? phaseReference + 360 : phaseReference;
                                    txt = "<span style=\"color:#002547;font-weight:bold;\">" + _seriesVisibility[1].Name + "</span>: ";
                                    txt += (_polarData[pts[i].idx].amplitude - ampReference).toFixed(2);
                                    phaseCompensated = _polarData[pts[i].idx].phase - phaseReference;
                                    phaseCompensated = (phaseCompensated < 0) ? phaseCompensated + 360 : phaseCompensated;
                                    txt += " " + _subvariables.overall.Units + " &ang;" + phaseCompensated.toFixed(2) + "&deg;";
                                    txt += "&nbsp;(<span style=\"font-weight:bold;\">" + ampReference.toFixed(2);
                                    txt += " &ang;" + phaseReference.toFixed(2) + "&deg;</span>)";
                                }
                                txt += ",&nbsp;" + _polarData[pts[i].idx].velocity.toFixed(0) + " RPM, " + _polarData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[0] + _widgetId + ">span").html(txt);
                            }
                        }
                        // Restaurar el bloqueo para el hover del mouse
                        if (needRestoreLock) {
                            _cursorLock = !_cursorLock;
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
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + ylabel
                        $("#" + _contentBody.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1025);
                        $("#" + _contentBody.id + " .dygraph-ylabel").eq(0).parent().parent().css("z-index", 1025);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _contentBody.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1025);
                        }
                        if (_chart !== undefined) {
                            _chart.setSelection(clone(_chart.selectedRow_));
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, pointSize) {
                        if (_cursorLock) {
                            //// Necesario para que no se dibuje el circulo de seleccion cuando el cursor se encuentre bloqueado
                            //pointSize = 0;
                        }
                        Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, pointSize);
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        x: {
                            drawAxis: false,
                            drawGrid: false,
                            pixelsPerLabel: 0,
                        },
                        y: {
                            drawAxis: false,
                            drawGrid: false,
                            pixelsPerLabel: 0,
                        }
                    },
                    plotter: function (e) {
                        Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, _rotn);
                        Dygraph.Plugins.Plotter.prototype.smoothPlotter(e, 0.35);
                        _drawTickets();
                        _drawAngularSensor();
                        _createTags();
                    },
                    visibility: [true, false]
                }
            );
            $(".grid-stack-item").on("resizestop", function () {
                setTimeout(function () {
                    _setMargins();
                    _chart.resize();
                    _chart.setSelection(clone(_chart.selectedRow_));
                }, 100);
            });
            _chart.ready(function () {
                _getHistoricalData(timeStampArray);
                document.body.addEventListener("keydown", _keyDownEventHandler);
            });
        };

        _setReferencePoint = function () {
            var
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer,
                sAngle,
                amplitude,
                phase;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 350, height: 180 };
            dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "polar";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"amplitude" +
                _widgetId + "\" " + "style=\"font-size:12px;\">Amplitud:</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"text\" id=\"amplitude" +
                _widgetId + "\" " + "name=\"amplitude" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-5\"><label for=\"phase" +
                _widgetId + "\" " + "style=\"font-size:12px;\">Fase:</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-7\">" +
                "<input type=\"text\" id=\"phase" + _widgetId + "\" name=\"phase" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\">" +
              "<div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnSave" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSave" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnCancel" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancel" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#amplitude" + _widgetId).val(_polarData[_chart.lastRow_].amplitude.toFixed(2)/* + " " + _subvariables.amplitude.Units*/);
            $("#phase" + _widgetId).val(_polarData[_chart.lastRow_].phase.toFixed(2)/* + " " + _subvariables.phase.Units*/);
            $("#" + configContainer[0].id + " > div.graphConfigArea").attr("title", "Compensar");
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                enableResize: false,
                title: "Compensar",
                width: dialogSize.width,
                height: dialogSize.height,
                zIndex: 2000,
                close: function () {
                    $("#btnCancel" + _widgetId).off("click");
                    $("#btnSave" + _widgetId).off("click");
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

            $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
            $("#btnCancel" + _widgetId).click(function (evt) {
                evt.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            $("#btnSave" + _widgetId).click(function (evt) {
                evt.preventDefault();
                amplitude = Number(Number($("#amplitude" + _widgetId).val()).toFixed(2));
                phase = Number(Number($("#phase" + _widgetId).val()).toFixed(2));
                sAngle = ((_rotn === "CW") ? _measurementPoint.SensorAngle + 90 : -_measurementPoint.SensorAngle + 90);
                _xReference = amplitude * Math.cos((phase + sAngle) * Math.PI / 180);
                _yReference = amplitude * Math.sin((phase + sAngle) * Math.PI / 180);
                if (!_seriesVisibility[1].Visible) {
                    _seriesVisibility[0].Visible = false;
                    _seriesVisibility[1].Visible = true;
                }
                _refresh();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
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
            for (setIdx = layout.points.length - 1; setIdx >= 0; setIdx -= 1) {
                pts = layout.points[setIdx];
                for (i = 0; i < pts.length; i += 1) {
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
        _updateSelection = function () {
            // Limpiar la vertical dibujada previamente, caso exista una
            var
                ctx, i,
                maxCircleSize,
                labels,
                currentRatio,
                canvasx,
                point,
                colorSerie,
                circleSize,
                callback;

            _chart.cascadeEvents_("select", {
                selectedRow: _chart.lastRow_,
                selectedX: _chart.lastx_,
                selectedPoints: _chart.selPoints_
            });

            // Contexto de canvas
            ctx = _chart.canvas_ctx_;
            if (_chart.previousVerticalX_ >= 0) {
                // Determinar el radio maximo del circulo resaltado
                maxCircleSize = 0;
                labels = _chart.attr_("labels");
                for (i = 1; i < labels.length; i += 1) {
                    currentRatio = _chart.getNumericOption("highlightCircleSize", labels[i]);
                    if (currentRatio > maxCircleSize) {
                        maxCircleSize = currentRatio;
                    }
                }
                ctx.clearRect(0, 0, _chart.width_, _chart.height_);
            }

            if (_chart.isUsingExcanvas_ && _chart.currentZoomRectArgs_) {
                Dygraph.prototype.drawZoomRect_.apply(_chart, _chart.currentZoomRectArgs_);
            }

            if (_chart.selPoints_.length > 0) {
                // Dibuja circulos de colores sobre el centro de cada punto seleccionado
                canvasx = _chart.selPoints_[0].canvasx;
                ctx.save();
                for (i = 0; i < _chart.selPoints_.length; i += 1) {
                    point = _chart.selPoints_[i];
                    if (!Dygraph.isOK(point.canvasy)) {
                        continue;
                    }
                    circleSize = _chart.getNumericOption("highlightCircleSize", point.name);
                    callback = _chart.getFunctionOption("drawHighlightPointCallback", point.name);
                    colorSerie = _chart.plotter_.colors[point.name];
                    if (!callback) {
                        callback = Dygraph.Circles.DEFAULT;
                    }
                    ctx.lineWidth = _chart.getNumericOption("strokeWidth", point.name);
                    ctx.strokeStyle = colorSerie;
                    ctx.fillStyle = colorSerie;
                    callback.call(_chart, _chart, point.name, ctx, point.canvasx, point.canvasy, colorSerie, circleSize, point.idx);
                }
                ctx.restore();
                _chart.previousVerticalX_ = canvasx;
            }
        };

        _customInteractionModel = {
            mousedown: function (e, g, ctx) {
                // Click derecho no inicializa zoom o paneo.
                if (e.button && e.button === 2) {
                    return;
                }
                ctx.initializeMouseDown(e, g, ctx);
                if (e.altKey || e.shiftKey || e.ctrlKey) {
                    Dygraph.startPan(e, g, ctx);
                } else {
                    ctx.isZooming = true;
                    ctx.zoomMoved = false;
                }
            },
            mousemove: function (e, g, ctx) {
                var
                    // Bandera que define si se cambia o no la seleccion del punto
                    selChanged,
                    // Fila mas proxima al evento de seleccion
                    row,
                    // Contadores
                    i, j,
                    // Puntos del layout
                    points,
                    // Fila del evento de la seleccion dentro de los puntos del layout
                    setRow,
                    // Llamado a la funcion "highlightCallback"
                    callback;

                if (ctx.isZooming) {
                    ctx.zoomMoved = true;
                    ctx.dragEndX = _pageX(e) - ctx.px;
                    ctx.dragEndY = _pageY(e) - ctx.py;
                    if (Math.abs(ctx.dragStartX - ctx.dragEndX) > Math.abs(ctx.dragStartY - ctx.dragEndY)) {
                        ctx.dragEndY = (ctx.dragEndY > ctx.dragStartY) ? Math.abs(ctx.dragStartX - ctx.dragEndX) : -Math.abs(ctx.dragStartX - ctx.dragEndX);
                        ctx.dragEndY = ctx.dragStartY + ctx.dragEndY;
                    } else {
                        ctx.dragEndX = (ctx.dragEndX > ctx.dragStartX) ? Math.abs(ctx.dragStartY - ctx.dragEndY) : -Math.abs(ctx.dragStartY - ctx.dragEndY);
                        ctx.dragEndX = ctx.dragStartX + ctx.dragEndX;
                    }
                    _drawZoomSquare(ctx.dragStartX, ctx.dragEndX, ctx.dragStartY, ctx.dragEndY);
                } else if (ctx.isPanning) {
                    Dygraph.movePan(e, g, ctx);
                } else {
                    selChanged = false;
                    if (_cursorLock) {
                        row = clone(_chart.selectedRow_);
                    } else {
                        row = _findClosestPoint(g.eventToDomCoords(e)[0], g.eventToDomCoords(e)[1], g.layout_).row;
                    }
                    if (row !== _chart.lastRow_) {
                        selChanged = true;
                    }
                    _chart.lastRow_ = row;
                    _chart.selPoints_ = [];
                    for (i = 0; i < _chart.layout_.points.length; i += 1) {
                        points = _chart.layout_.points[i];
                        setRow = row - _chart.getLeftBoundary_(i);
                        if (!points[setRow]) {
                            // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                            continue;
                        }
                        if (setRow < points.length && points[setRow].idx === row) {
                            if (points[setRow].yval !== null && !Number.isNaN(points[setRow].yval)) {
                                _chart.selPoints_.push(points[setRow]);
                            }
                        } else {
                            for (j = 0; j < points.length; j += 1) {
                                if (points[j].idx === row) {
                                    if (points[j].yval !== null && !Number.isNaN(points[j].yval)) {
                                        _chart.selPoints_.push(points[j]);
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
                    if (selChanged) {
                        _updateSelection();
                    }
                    _chart.selectedRow_ = clone(g.lastRow_);
                    callback = _chart.getFunctionOption("highlightCallback");
                    if (callback && selChanged) {
                        callback.call(_chart, e,
                            _chart.lastx_,
                            _chart.selPoints_,
                            _chart.lastRow_,
                            _chart.highlightSet_);
                    }
                }
            },
            mouseup: function (e, g, ctx) {
                var
                    xStart,
                    xEnd,
                    yStart,
                    yEnd;

                if (ctx.isZooming) {
                    _clearZoomSquare();
                    ctx.isZooming = false;
                    ctx.justClick = false;
                    _maybeTreatMouseOpAsClick(e, g, ctx);
                    if (ctx.regionWidth >= 10 && ctx.regionHeight >= 10) {
                        xStart = g.toDataXCoord(ctx.dragStartX);
                        xEnd = g.toDataXCoord(ctx.dragEndX);
                        yStart = g.toDataYCoord(ctx.dragStartY);
                        yEnd = g.toDataYCoord(ctx.dragEndY);
                        g.updateOptions({
                            "dateWindow": [Math.min(xStart, xEnd), Math.max(xStart, xEnd)],
                            "valueRange": [Math.min(yStart, yEnd), Math.max(yStart, yEnd)]
                        });
                        ctx.cancelNextDblclick = true;
                    } else {
                        ctx.justClick = true;
                    }
                    ctx.dragStartX = null;
                    ctx.dragStartY = null;
                } else if (ctx.isPanning) {
                    Dygraph.endPan(e, g, ctx);
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                _cursorLock = true;
                $(_contextMenuContainer).css("top", (e.offsetY + _contentBody.offsetTop));
                $(_contextMenuContainer).css("left", (e.offsetX + _contentBody.offsetLeft));
                $(_contextMenuContainer).css("display", "block");
                return false;
            },
            click: function (e, g, ctx) {
                e.preventDefault();
                if (ctx.justClick) {
                    _cursorLock = !_cursorLock;
                }
                $(_contextMenuContainer).css("display", "none");
                return false;
            },
            dblclick: function (e, g, ctx) {
                if (ctx.cancelNextDblclick) {
                    ctx.cancelNextDblclick = false;
                    return;
                }
                if (e.altKey || e.shiftKey || e.ctrlKey) {
                    return;
                }
                g.updateOptions({
                    "valueRange": [_graphRange.yMin, _graphRange.yMax],
                    "dateWindow": [_graphRange.xMin, _graphRange.xMax]
                });
                _cursorLock = false;
            }
        };

        _pageX = function (evt) {
            if (evt.pageX) {
                return (!evt.pageX || evt.pageX < 0) ? 0 : evt.pageX;
            } else {
                return evt.clientX + (document.scrollLeft || document.body.scrollLeft) - (document.clientLeft || 0);
            }
        };

        _pageY = function (evt) {
            if (evt.pageY) {
                return (!evt.pageY || evt.pageY < 0) ? 0 : evt.pageY;
            } else {
                return evt.clientY + (document.scrollTop || document.body.scrollTop) - (document.clientTop || 0);
            }
        };

        _maybeTreatMouseOpAsClick = function (e, g, ctx) {
            var
                regionWidth,
                regionHeight;

            ctx.dragEndX = _pageX(e) - ctx.px;
            ctx.dragEndY = _pageY(e) - ctx.py;
            if (Math.abs(ctx.dragStartX - ctx.dragEndX) > Math.abs(ctx.dragStartY - ctx.dragEndY)) {
                ctx.dragEndY = (ctx.dragEndY > ctx.dragStartY) ? Math.abs(ctx.dragStartX - ctx.dragEndX) : -Math.abs(ctx.dragStartX - ctx.dragEndX);
                ctx.dragEndY = ctx.dragStartY + ctx.dragEndY;
            } else {
                ctx.dragEndX = (ctx.dragEndX > ctx.dragStartX) ? Math.abs(ctx.dragStartY - ctx.dragEndY) : -Math.abs(ctx.dragStartY - ctx.dragEndY);
                ctx.dragEndX = ctx.dragStartX + ctx.dragEndX;
            }
            regionWidth = Math.abs(ctx.dragEndX - ctx.dragStartX);
            regionHeight = Math.abs(ctx.dragEndY - ctx.dragStartY);
            ctx.regionWidth = regionWidth;
            ctx.regionHeight = regionHeight;
        };

        _drawZoomSquare = function (startX, endX, startY, endY) {
            _clearZoomSquare();
            // Dibuja un cuadrado gris claro para mostrar la nueva area de visualizacion
            _chart.canvas_ctx_.fillStyle = "rgba(128,128,128,0.33)";
            _chart.canvas_ctx_.fillRect(
                Math.min(startX, endX), Math.min(startY, endY), Math.abs(endX - startX), Math.abs(endY - startY));
        };

        _clearZoomSquare = function () {
            _chart.canvas_ctx_.clearRect(0, 0, _chart.width_, _chart.height_);
        };

        /*
         * Obtiene la informacion asociada al grafico
         */
        _getHistoricalData = function (timeStampArray) {
            var
                i, j, k,
                idList,
                group,
                items,
                tmpData,
                notStored;

            _polarData = [];
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
                    // AQUI ES NECESARIO GARANTIZAR LA REGLA DE VARIACION DE DATOS RELEVANTES EN LA GRAFICA
                    if (tmpData[1].Value !== null && tmpData[1].Value > 0) {
                        _polarData.push({
                            overall: tmpData[0].Value,
                            amplitude: tmpData[1].Value,
                            phase: tmpData[2].Value,
                            velocity: tmpData[3].Value,
                            timeStamp: formatDate(tmpData[0].RawTimeStamp),
                            rawTimeStamp: tmpData[0].RawTimeStamp
                        });
                    }
                }
                // Ordenamos por estampas de tiempo la informacion
                _polarData = ej.DataManager(_polarData).executeLocal(
                    new ej.Query().sortBy("timeStamp", ej.sortOrder.Ascending, false));
                _refresh();
            });
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
            txt += "(" + _polarData[0].timeStamp + " - " + _polarData[_polarData.length - 1].timeStamp + ")";
            $("#point" + _measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
            xyData = _getCartesianCoordiantes();
            _chart.updateOptions({
                "file": xyData,
                "valueRange": [_graphRange.yMin, _graphRange.yMax],
                "dateWindow": [_graphRange.xMin, _graphRange.xMax],
                "visibility": [_seriesVisibility[0].Visible, _seriesVisibility[1].Visible]
            });
            if (_mouseover) {
                _chart.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(_chart, 0, 0);
            }
        };

        _drawAngularSensor = function () {
            var
                // Variable que contiene el contexto 2D del canvas
                ctx,
                a, b,
                theta,
                cx,
                cy;

            if (!_chart) {
                return;
            }
            ctx = _chart.hidden_ctx_;
            a = 10;
            b = 6;
            theta = ((_rotn === "CW") ? Number(_angularSubvariable.SensorAngle) + 90 : -Number(_angularSubvariable.SensorAngle) + 90) * Math.PI / 180;
            //theta = (90 - Number(_angularSubvariable.SensorAngle)) * Math.PI / 180;
            cx = _chart.toDomXCoord((_chart.maxRadiusSize_) * Math.cos(theta));
            cy = _chart.toDomYCoord((_chart.maxRadiusSize_) * Math.sin(theta));
            // Guardar el contexto canvas para restaurarlo facilmente despues de las transformaciones
            ctx.save();
            // Mover (trasladar) el origen, al centro de donde vamos a dibujar el rectangulo
            ctx.translate(cx, cy);
            // Cualquier transformacion aplicada de aqui en adelante sera relativa al origen (a,b)
            ctx.rotate(-theta);
            // La diferencia radica en que las coordenadas son relativas al origen
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.fillRect(-(a / 2), -(b / 2), a, b);
            ctx.closePath();
            // Restaurar el contexto canvas para que los posteriores trazos no se transformen
            ctx.restore();
        };

        _drawTickets = function () {
            var
                // Variable que contiene el contexto 2D del canvas
                ctx,
                color,
                xIni,
                yIni,
                sAngle,
                canvasx,
                canvasy,
                i, j,
                even,
                angleDirection,
                reference;

            if (!_chart) {
                return;
            }
            ctx = _chart.hidden_ctx_;
            color = "#808080";
            if (_chart.maxRadiusSize_) {
                xIni = _chart.plotter_.area.x + _chart.plotter_.area.w / 2;
                yIni = _chart.plotter_.area.y + _chart.plotter_.area.w / 2 + 1;
                sAngle = ((_rotn === "CW") ? _measurementPoint.SensorAngle + 90 : -_measurementPoint.SensorAngle + 90);
                sAngle *= Math.PI / 180;
                for (i = 1; i < 4; i += 1) {
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * i / 3) * Math.cos(0));
                    canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * i / 3) * Math.sin(0));
                    ctx.moveTo(canvasx, canvasy);
                    even = true;
                    for (j = Math.PI / 30; j <= 2 * Math.PI; j += Math.PI / 30) {
                        if (even) {
                            canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * i / 3) * Math.cos(j));
                            canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * i / 3) * Math.sin(j));
                            ctx.lineTo(canvasx, canvasy);
                            ctx.strokeStyle = color;
                            ctx.stroke();
                            ctx.closePath();
                            even = false;
                        } else {
                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * i / 3) * Math.cos(j));
                            canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * i / 3) * Math.sin(j));
                            ctx.moveTo(canvasx, canvasy);
                            even = true;
                        }
                    }
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    ctx.closePath();
                }

                ctx.beginPath();
                ctx.lineWidth = 1;
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle));
                ctx.moveTo(canvasx, canvasy);
                reference = _positionateText(sAngle, _chart.maxRadiusSize_);
                ctx.fillText("0°", reference[0], reference[1]);
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + Math.PI));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + Math.PI));
                ctx.lineTo(canvasx, canvasy);
                reference = _positionateText(sAngle + Math.PI, _chart.maxRadiusSize_);
                ctx.fillText("180°", reference[0], reference[1]);
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.closePath();

                ctx.beginPath();
                ctx.lineWidth = 1;
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + Math.PI / 4));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + Math.PI / 4));
                ctx.moveTo(canvasx, canvasy);
                angleDirection = (_rotn === "CW") ? sAngle + Math.PI / 4 : sAngle - Math.PI / 4;
                reference = _positionateText(angleDirection, _chart.maxRadiusSize_);
                ctx.fillText("45°", reference[0], reference[1]);
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 5 * Math.PI / 4));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 5 * Math.PI / 4));
                ctx.lineTo(canvasx, canvasy);
                angleDirection = (_rotn === "CW") ? sAngle + 5 * Math.PI / 4 : sAngle - 5 * Math.PI / 4;
                reference = _positionateText(angleDirection, _chart.maxRadiusSize_);
                ctx.fillText("225°", reference[0], reference[1]);
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.closePath();

                ctx.beginPath();
                ctx.lineWidth = 1;
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 3 * Math.PI / 4));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 3 * Math.PI / 4));
                ctx.moveTo(canvasx, canvasy);
                angleDirection = (_rotn === "CW") ? sAngle + 3 * Math.PI / 4 : sAngle - 3 * Math.PI / 4;
                reference = _positionateText(angleDirection, _chart.maxRadiusSize_);
                ctx.fillText("135°", reference[0], reference[1]);
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 7 * Math.PI / 4));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 7 * Math.PI / 4));
                ctx.lineTo(canvasx, canvasy);
                angleDirection = (_rotn === "CW") ? sAngle + 7 * Math.PI / 4 : sAngle - 7 * Math.PI / 4;
                reference = _positionateText(angleDirection, _chart.maxRadiusSize_);
                ctx.fillText("315°", reference[0], reference[1]);
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.closePath();

                ctx.beginPath();
                ctx.lineWidth = 1;
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + Math.PI / 2));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + Math.PI / 2));
                ctx.moveTo(canvasx, canvasy);
                angleDirection = (_rotn === "CW") ? sAngle + Math.PI / 2 : sAngle - Math.PI / 2;
                reference = _positionateText(angleDirection, _chart.maxRadiusSize_);
                ctx.fillText("90°", reference[0], reference[1]);
                canvasx = _chart.toDomXCoord((_chart.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 3 * Math.PI / 2));
                canvasy = _chart.toDomYCoord((_chart.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 3 * Math.PI / 2));
                ctx.lineTo(canvasx, canvasy);
                angleDirection = (_rotn === "CW") ? sAngle + 3 * Math.PI / 2 : sAngle - 3 * Math.PI / 2;
                reference = _positionateText(angleDirection, _chart.maxRadiusSize_);
                ctx.fillText("270°", reference[0], reference[1]);
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.closePath();
            }
        };

        _positionateText = function (angle, rMax) {
            var
                reference,
                xval,
                yval;

            reference = ((angle < 0) ? angle + 2 * Math.PI : angle) * 180 / Math.PI;
            reference = Math.round(reference) % 360;
            if (reference < 90) {
                xval = _chart.toDomXCoord((rMax * 1.06) * Math.cos(angle));
                yval = _chart.toDomYCoord((rMax * 1.03) * Math.sin(angle));
            } else if (reference < 180) {
                xval = _chart.toDomXCoord((rMax * 1.18) * Math.cos(angle));
                yval = _chart.toDomYCoord((rMax * 1.04) * Math.sin(angle));
            } else if (reference < 270) {
                xval = _chart.toDomXCoord((rMax * 1.2) * Math.cos(angle));
                yval = _chart.toDomYCoord((rMax * 1.12) * Math.sin(angle));
            } else {
                xval = _chart.toDomXCoord((rMax * 1.06) * Math.cos(angle));
                yval = _chart.toDomYCoord((rMax * 1.12) * Math.sin(angle));
            }
            if ((reference >= 85 && reference <= 95) || (reference >= 265 && reference <= 275)) {
                xval -= 6;
            }
            return [xval, yval];
        };

        _getCartesianCoordiantes = function () {
            var
                // Valores X,Y a graficar
                xyData,
                // Amplitud maxima del grafico
                maxRadius,
                // Contador
                i,
                // Angulo inicial
                sAngle,
                // Valor de la coordenada en X
                x,
                // Valor de la coordenada en Y
                y;

            xyData = [];
            maxRadius = 0;
            for (i = 0; i < _polarData.length; i += 1) {
                if (maxRadius < _polarData[i].amplitude) {
                    maxRadius = _polarData[i].amplitude;
                }
                // SE DEBE TENER EN CUENTA LA COMPENSACION AQUI
                sAngle = ((_rotn === "CW") ? _measurementPoint.SensorAngle + 90 : -_measurementPoint.SensorAngle + 90);
                x = _polarData[i].amplitude * Math.cos((_polarData[i].phase + sAngle) * Math.PI / 180);
                y = _polarData[i].amplitude * Math.sin((_polarData[i].phase + sAngle) * Math.PI / 180);
                if (_seriesVisibility[0].Visible) {
                    xyData.push([x, y, null]);
                } else if (_seriesVisibility[1].Visible) {
                    x -= _xReference;
                    y -= _yReference;
                    xyData.push([x, null, y]);
                }
            }
            // Configuramos el valor maximo en coordenadas polares (radio maximo)
            _chart.maxRadiusSize_ = maxRadius * 1.06;
            // Definimos los rangos maximos y minimos, tanto del eje X como el eje Y
            _graphRange.xMin = -maxRadius * 1.3;
            _graphRange.xMax = maxRadius * 1.3;
            _graphRange.yMin = -maxRadius * 1.3;
            _graphRange.yMax = maxRadius * 1.3;
            return xyData;
        };

        _createTags = function () {
            var
                // Variable que contiene el contexto 2D del canvas
                ctx,
                // Puntos visibles en la serie
                points,
                // Contadores
                i, j,
                // Valores X,Y sobre el canvas de cada punto visible en la serie
                domx, domy,
                // Texto a mostrar
                txt,
                closestLeft,
                closestRight,
                txtWidth,
                txtHeight,
                side,
                showedTags;

            // Caso no se encuentre creado aun el chart, no realizar ninguna accion
            if (!_chart) {
                return;
            }
            ctx = _chart.hidden_ctx_;
            if (_selectedTag.Value === TagTypes.None.Value) {
                // No es necesario realizar ninguna accion adicional
                return;
            }
            // Puntos correspondientes a los puntos visibles en la serie
            points = _chart.layout_.points[0];
            // Creamos la primer etiqueta en el primero de todos los puntos
            domx = points[0].canvasx;
            domy = points[0].canvasy;
            switch (_selectedTag.Value) {
                case TagTypes.Velocity.Value:
                    txt = _polarData[points[0].idx].velocity.toFixed(0);
                    break;
                case TagTypes.TimeStamp.Value:
                    txt = _polarData[points[0].idx].timeStamp.split(" ")[1];
                    break;
                default:
                    console.log("Tipo de anotación o label desconocido.");
            }
            closestLeft = _findClosestPoint(domx - 10, domy, _chart.layout_);
            closestRight = _findClosestPoint(domx + 10, domy, _chart.layout_);
            ctx.beginPath();
            ctx.strokeStyle = "#000000";
            ctx.fillStyle = "#000000";
            txtWidth = ctx.measureText(txt).width;
            txtHeight = parseInt(ctx.font) * 1.0;
            showedTags = [];
            if (closestLeft.row > closestRight.row) {
                ctx.textAlign = "left";
            } else {
                ctx.textAlign = "right";
            }
            side = (ctx.textAlign === "left") ? 5 : -5;
            ctx.strokeText(txt, domx + side, domy + txtHeight / 2);
            showedTags.push({
                xMin: (ctx.textAlign === "left") ? domx : domx + side * 2 - txtWidth,
                xMax: (ctx.textAlign === "left") ? domx + txtWidth : domx + side * 2,
                yMin: domy - txtHeight / 2 - 5,
                yMax: domy + txtHeight / 2 + 5
            });
            ctx.arc(domx, domy, 2, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            // Recorrer todos los puntos para determinar la separacion de los labels basado en la distancia en Y de los puntos
            loop1:
                for (i = 0; i < points.length; i += 1) {
                    domx = points[i].canvasx;
                    domy = points[i].canvasy;
                    switch (_selectedTag.Value) {
                        case TagTypes.Velocity.Value:
                            txt = _polarData[points[i].idx].velocity.toFixed(0);
                            break;
                        case TagTypes.TimeStamp.Value:
                            txt = _polarData[points[i].idx].timeStamp.split(" ")[1];
                            break;
                    }
                    txtWidth = ctx.measureText(txt).width;
                    // Se valida si la etiqueta se debe mostrar o no
                    loop2:
                        for (j = 0; j < showedTags.length; j += 1) {
                            if ((domy > showedTags[j].yMin && domy < showedTags[j].yMax)) {
                                // Caso se encuentre entre las posiciones de maximo y minimo en Y,
                                // sera posible graficarlo solo si esta alejado lo suficiente en X
                                if (domx + 10 > showedTags[j].xMin && showedTags[j].xMax > domx - 10 - txtWidth) {
                                    continue loop1;
                                }
                            }
                        }
                    closestLeft = _findClosestPoint(domx - 10, domy, _chart.layout_);
                    closestRight = _findClosestPoint(domx + 10, domy, _chart.layout_);
                    ctx.beginPath();
                    if (Math.abs(closestLeft.row - i) > Math.abs(closestRight.row - i)) {
                        ctx.textAlign = "left";
                    } else {
                        ctx.textAlign = "right";
                    }
                    side = (ctx.textAlign === "left") ? 5 : -5;
                    ctx.strokeText(txt, domx + side, domy + txtHeight / 2);
                    showedTags.push({
                        xMin: (ctx.textAlign === "left") ? domx : domx + side * 2 - txtWidth,
                        xMax: (ctx.textAlign === "left") ? domx + txtWidth : domx + side * 2,
                        yMin: domy - txtHeight / 2 - 5,
                        yMax: domy + txtHeight / 2 + 5
                    });
                    ctx.arc(domx, domy, 2, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.stroke();
                    ctx.closePath();
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
                configContainer;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 350, height: 150 };
            dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "polarConfig";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div>div").append("<div class=\"col-md-12\"><ul id=\"seriesCheckList" +
                _widgetId + "\"></ul></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(2)>div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(2)>div>div:nth-child(1)").append("\n<a id=\"btnSaveVisibility" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveVisibility" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(2)>div>div:nth-child(1)").append("\n<a id=\"btnCancelVisibility" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelVisibility" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#seriesCheckList" + _widgetId).ejListBox({
                dataSource: _seriesVisibility,
                fields: { id: "Id", text: "Name", value: "Id", checkBy: "Visible" },
                height: "auto",
                showCheckbox: true,
                checkChange: function (args) {
                    var
                        idxList,
                        i;

                    idxList = [];
                    if (args.data.Id === 0) {
                        _seriesVisibility[0].Visible = args.isChecked;
                        _seriesVisibility[1].Visible = !args.isChecked;
                    } else if (args.data.Id === 1) {
                        _seriesVisibility[1].Visible = args.isChecked;
                        _seriesVisibility[0].Visible = !args.isChecked;
                    }
                    for (i = 0; i < _seriesVisibility.length; i += 1) {
                        if (_seriesVisibility[i].Visible) {
                            $("#seriesCheckList" + _widgetId).ejListBox("checkItemByIndex", i);
                            $("#seriesCheckList" + _widgetId).ejListBox("getItemByIndex", i).data.Visible = true;
                        } else {
                            $("#seriesCheckList" + _widgetId).ejListBox("uncheckItemByIndex", i);
                            $("#seriesCheckList" + _widgetId).ejListBox("getItemByIndex", i).data.Visible = false;
                        }
                    }
                }
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
                    visibleCheckList;

                e.preventDefault();
                for (i = 0; i < _seriesVisibility.length; i += 1) {
                    _seriesVisibility[i].Visible = false;
                }
                visibleCheckList = $("#seriesCheckList" + _widgetId).ejListBox("getCheckedItems");
                for (i = 0; i < visibleCheckList.length; i += 1) {
                    _seriesVisibility[visibleCheckList[i].index].Visible = true;
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
                _chart.resize();
                gridStack.batchUpdate();
                gridStack.resize(grid, w, h);
                gridStack.commit();
                setTimeout(function () {
                    _chart.resize();
                }, 50);
            });
        };

        _keyDownEventHandler = function (e) {
            var
                chart,
                i,
                callback;

            if (e.keyCode === 37 || e.keyCode === 39) {
                if (_mouseover && _lastMousemoveEvt.isTrusted) {
                    // Necesario para evitar la propagacion del evento keydown en otros graficos
                    // (Principalmente ocurre con tiempo real).
                    chart = [_chart];
                    chart = chart[0];
                    if (e.keyCode === 37) {
                        chart.selectedRow_ -= 1;
                    } else if (e.keyCode === 39) {
                        chart.selectedRow_ += 1;
                    }
                    // Validacion de valores fuera de rango
                    if (chart.selectedRow_ < 0) {
                        chart.selectedRow_ = 0;
                    }
                    if (chart.selectedRow_ >= chart.file_.length) {
                        chart.selectedRow_ = chart.file_.length - 1;
                    }
                    chart.lastRow_ = clone(chart.selectedRow_);
                    chart.row = chart.lastRow_;
                    chart.lastx_ = chart.file_[chart.row][0];
                    for (i = 0; i < chart.selPoints_.length; i += 1) {
                        chart.selPoints_[i] = chart.layout_.points[i][chart.row];
                    }
                    _updateSelection();
                    callback = chart.getFunctionOption("highlightCallback");
                    callback.call(chart, e, chart.lastx_, chart.selPoints_, chart.row, true);
                }
            }
        };

        this.Show = function (measurementPointId, currentColor, timeStampArray, rpmPositions) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                subVariableIdList,
                // Sensor de referencia angular
                angularReference,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                overallUnits,
                // Menu de opciones para la grafica
                settingsMenu,
                // Sub-menu de opciones para los menus que requieren sub-menus asociados
                settingsSubmenu,
                // Labels
                labels;

            _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
            _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
            subVariableIdList = [];
            // Referencia angular
            angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false)
            )[0];
            if (!angularReference) {
                popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                _rotn = "CW";
                return;
            } else {
                _rotn = (angularReference.RotationDirection === 1) ? "CW" : "CCW";
                _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 9, false))[0]);
            }
            // SubVariable que corresponde al punto de referencia angular
            if (_angularSubvariable) {
                subVariableIdList.push(_angularSubvariable.Id);
                _angularSubvariable.SensorAngle = angularReference.SensorAngle;
            }
            // Total subvariables para el punto de medicion
            subVariables = _measurementPoint.SubVariables;
            // SubVariable que contiene el valor de directa
            _subvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
            overallUnits = "";
            if (_subvariables.overall) {
                subVariableIdList.push(_subvariables.overall.Id);
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
            }
            // SubVariable que contiene el valor de amplitud 1x
            _subvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(
                new ej.Query().where("MeasureType", "equal", 4, false))[0]);
            if (_subvariables.amplitude) {
                subVariableIdList.push(_subvariables.amplitude.Id);
            }
            // SubVariable que contiene el valor de fase 1x
            _subvariables.phase = clone(ej.DataManager(subVariables).executeLocal(
                new ej.Query().where("MeasureType", "equal", 6, false))[0]);
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
            _seriesName = ["1X"];
            _measurementPoint.Color = currentColor;
            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            _createTagMenu(settingsMenu, settingsSubmenu);
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Series", "showSeries" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Polar",
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: 1,
                asdaqId: _assetData.AsdaqId,
                atrId: _assetData.AtrId,
                subVariableIdList: subVariableIdList,
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

            labels = ["X", "Y1", "Y2"];
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
            _subscribeToResizeChart();
            // Construir y mostrar grafica.
            _buildGraph(labels, timeStampArray);
        };

        _createTagMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> " + TagTypes.None.Text,
                    TagTypes.None.Text + _widgetId
                ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> " + TagTypes.Velocity.Text,
                TagTypes.Velocity.Text + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> " + TagTypes.TimeStamp.Text,
                TagTypes.TimeStamp.Text + _widgetId
            ));
            settingsMenu.push(
                AspectrogramWidget.createSettingsMenuElement("submenu", "Ver etiquetas", "showTags" + _widgetId, settingsSubmenu));
        };

        this.Close = function () {
            var
                el;

            // Remover el evento manejador de KeyDown
            document.body.removeEventListener("keydown", _keyDownEventHandler);
            if (_resizeChartSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }
            if (_chart) {
                _chart.destroy();
            }
            el = $(_container).parents().eq(2);
            $(".grid-stack").data("gridstack").removeWidget(el);
            $(_container).remove();

            $.each(globalsReport.elemDygraph, function (i) {
                if (globalsReport.elemDygraph[i].id === _container.id) {
                    globalsReport.elemDygraph.splice(i, 1);
                    return false;
                }
            });
        };
    };

    return PolarGraph;
})();