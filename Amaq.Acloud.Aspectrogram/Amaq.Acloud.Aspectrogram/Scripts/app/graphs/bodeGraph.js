/*
 * bodeGraph.js
 * Gestiona todo lo relacionado al grafico de bode.
 * @author Jorge Calderon
 */

/* globals Dygraph, ej, clone, aidbManager, formatDate, PublisherSubscriber, mainCache, AspectrogramWidget, ImageExport,
   Cursors, createTableToExcel, tableToExcel, parseAng, DygraphOps, popUp */

var BodeGraph = {};

BodeGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    BodeGraph = function (width, height, aspectRatio) {
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
            _bodeData,
            //Arrays con las velocidades ordenadas
            _arraysBodeData,
            // Color del punto de medicion
            _msColor,
            //arrays Con datos de estado transitorio y velocida nominal de la máquina
            _arraysVelocityState,
            // Mantiene en memoria el numero que determina cada cuantos datos se muestran las etiquetas
            _tagVariation,
            // Informacion de las anotaciones
            _annotations,
            // Tipo de anotacion a mostrar (0 = Ninguna, 1 = Rpm, 2 = Tiempo)
            _annotationType,
            // Punto de medicion de la grafica
            _measurementPoint,
            // Referencia a las subvariables del punto de medicion (directa, amplitud 1x, fase 1x)
            _subvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Bandera que identifica si el grafico cuenta con compensacion o no
            _compensated,
            // Bandera que identifica si el grafico cuenta con compensacion o no
            _viewCompensated,
            // Amplitud de referencia para el bode
            _ampReference,
            // Fase de referencia para el bode
            _phaReference,
            // Rango maximo y minimo del grafico, tanto en el eje X como en el eje Y
            _graphRange,
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
            // Metodo privado que muestra las diferentes anotaciones configuradas
            _createAnnotations,
            // Metodo privado que muestra el menu que permite definir que etiquetas mostrar en el grafico
            _showTags,
            //banderas para control de visualizacion de series
            _flagsSeries,
            // Variable que define en que numero de caja se encuentra la fase
            _boxPhaseChart,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Metodo para el calculo de la fase a graficar
            _getDataForPhaseChart,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona la creacion de un nuevo punto de referencia en el grafico
            _setReferencePoint,
            //Método para seleccionar/deseleccioanr las series que se quieran ver en el Bode
            _showHideSeries,
            //Ordenar y filtrar array BodeData, dependiendo de los estados de velocidad de la máquina
            _orderBodeArray,
            //identifica si la máquina está en estado trnsitorio, o en la veloidad nominal
            _resolveVelocityStates,
            // Callback de evento click sobre algun item del menu de opciones
            _onSettingsMenuItemClick;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _this = this;
        _movableGrid = false;
        _compensated = false;
        _viewCompensated = false;
        _graphType = "bode";
        _widgetId = Math.floor(Math.random() * 100000);
        _subvariables = {};
        _graphRange = {};
        _msColor = "#000000";
        _tagVariation = 1;
        _annotationType = 0;
        _cursorLock = false;
        _cursor = new Cursors(null);
        _boxPhaseChart = 0;
        _flagsSeries = {
            S1X: {visible: true, index: 0},
            S1XComp: { visible: false, index: 1},
            Direct: {visible: true, index: 2}
        };
        _arraysVelocityState = [];
        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "bodeGraph" + _widgetId;
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
                contId,
                name,
                labels,
                i, j,
                data;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "showSeries":
                    _showHideSeries();
                    break;
                case "showTagsBode":
                    _showTags();
                    break;
                case "saveImageBode" + _widgetId:
                    imgExport = new ImageExport(_chartAmplitude, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    name = "Histórico, Bode : " + _assetData.Name;
                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    labels = ["RPM", "1X", "Directa", "1XComp", "RPM", "Fase 1X", "Fase 1X Comp"];
                    data = [];
                    for (i = 0; i < _chartAmplitude.file_.length; i += 1) {
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
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
            }
        };

        _showTags = function () {
            var
                i,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer,
                currentRpm;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 350, height: 180 };
            dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "bode";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"tagType\" " +
              "style=\"font-size:12px;\">Tipo de etiqueta</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><select id=\"tagType\"></select></div>");
            $("#tagType").append("<option value=\"0\">Ninguno</option>");
            $("#tagType").append("<option value=\"1\">Rpm</option>");
            $("#tagType").append("<option value=\"2\">Tiempo</option>");
            $("#tagType").ejDropDownList({
                watermarkText: "Seleccione",
                selectedIndex: _annotationType,
                width: "100%"
            });
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-5\">" +
              "<label for=\"tagVariation\" style=\"font-size:12px;\">Cada n datos</label></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-7\">" +
              "<input type=\"number\" id=\"tagVariation\" name=\"tagVariation\" value=\"" + _tagVariation + "\" style=\"width:100%;\"></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(3) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnSaveTag" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveTag" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnCancelTag" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelTag" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#" + configContainer[0].id + " > div.graphConfigArea").attr("title", "Configurar Etiquetas");
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                enableResize: false,
                title: "Configurar Etiquetas",
                width: dialogSize.width,
                height: dialogSize.height,
                zIndex: 2000,
                close: function () {
                    $("#btnCancelTag" + _widgetId).off("click");
                    $("#btnSaveTag" + _widgetId).off("click");
                    $("#tagType").ejDropDownList("destroy");
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
            $("#btnCancelTag" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            // Boton aceptar
            $("#btnSaveTag" + _widgetId).click(function (e) {
                e.preventDefault();
                _annotationType = $("#tagType")[0].selectedIndex;
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                if (_annotationType > 0 && parseFloat($("#tagVariation").val()) > 0) {
                    _tagVariation = parseFloat($("#tagVariation").val());
                    _annotations = [];
                    switch (_annotationType) {
                        case 1:
                            for (i = 0; i < _bodeData.length; i += _tagVariation) {
                                _annotations[i] = {
                                    rpm: _bodeData[i].velocity,
                                    time: _bodeData[i].timeStamp
                                };
                            }
                            break;
                        case 2:
                            currentRpm = 0;
                            for (i = 0; i < _bodeData.length; i += 1) {
                                if (Math.abs(_bodeData[i].velocity.toFixed(0) - currentRpm) > _tagVariation) {
                                    currentRpm = _bodeData[i].velocity;
                                    _annotations.push({
                                        rpm: currentRpm,
                                        time: _bodeData[i].timeStamp
                                    });
                                }
                            }
                            break;
                        default:
                            console.log("Tipo de anotación no soportada.");
                    }
                } else {
                    _annotations = [];
                }
                _createAnnotations();
            });
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labelAmp, labelPha, timeStampArray, rpmPositions) {
            var
                // Texto a mostrar de forma dinamica
                txt,
                // DIV asociado al menu contextual
                ctxMenuDiv,
                // Elementos del menu
                ulEl,
                // Valor de la altura del rotulo de la grafica
                headerHeigth;

            ctxMenuDiv = document.createElement("div");
            ctxMenuDiv.id = "bodeCtxMenu" + _widgetId;
            ctxMenuDiv.className = "customContextMenu";
            ulEl = document.createElement("ul");
            $(ulEl).append("<li id=\"menuReferencePoint" + _widgetId + "\" class=\"menuReferencePoint\">Compensar</li>");
            $(ctxMenuDiv).append(ulEl);
            // Agregamos el contenedor del menu contextual al DOM
            $(_container).append(ctxMenuDiv);
            $(ctxMenuDiv).click(function (e) {
                // Si la opcion esta desactivada, no hacer nada
                if (e.target.className == "disabled") {
                    return false;
                }
                switch (e.target.id) {
                    case "menuReferencePoint" + _widgetId:
                        _setReferencePoint();
                        break;
                }
            });
            _customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                if (g.maindiv_.id === _ampContainer.id) {
                    _chartAmplitude.selectedRow_ = _chartAmplitude.lastRow_;
                    $(ctxMenuDiv).css("top", (e.offsetY + _ampContainer.offsetTop));
                    $(ctxMenuDiv).css("left", (e.offsetX + _contentBody.offsetLeft));
                    $(ctxMenuDiv).css("display", "block");
                } else {
                    $(ctxMenuDiv).css("display", "none");
                }
                return false;
            };
            _customInteractionModel.click = function (e, g, ctx) {
                $(ctxMenuDiv).css("display", "none");
                _cursorLock = !_cursorLock;
            };
            _customInteractionModel.dblclick = function (event, g, context) {
                if (context.cancelNextDblclick) {
                    context.cancelNextDblclick = false;
                    return;
                }
                if (event.altKey || event.shiftKey || event.ctrlKey) {
                    return;
                }
                g.updateOptions({
                    "dateWindow": _graphRange.amplitude.X
                });
                _cursorLock = false;
            };
            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            _chartPhase = new Dygraph(
                _phaseContainer,
                [[0, 0, 0]],
                {
                    colors: ["#006ACB", "#FF0000"],
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

                        for (i = 0; i < pts.length; i += 1) {
                            if (_cursorLock) {
                                continue;
                            }
                            if (pts[i].name === "Fase" || pts[i].name === "Fase Compensada" && !Number.isNaN(pts[i].yval)) {
                                if (!_bodeData || !_bodeData[pts[i].idx]) {
                                    return;
                                }
                                txt = "";
                                if (_flagsSeries.S1X.visible) {
                                    color = _chartPhase.plotter_.colors[ _chartPhase.attributes_.labels_[0]];
                                    current = clone(_bodeData[pts[i].idx]);
                                    txt += "<span style=\"color:" + color + "\">" + _seriesName[0] + "</span>:&nbsp;";
                                    txt += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                    txt += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                                }
                                if (_flagsSeries.S1XComp.visible) {
                                    color = _chartPhase.plotter_.colors[_chartPhase.attributes_.labels_[1]];
                                    current = clone(_bodeData[pts[i].idx]);
                                    txt += "<span style=\"color:" + color + "\">" + _seriesName[0] + " Comp</span>:&nbsp;";
                                    txt += (current.amplitude < 0 ? "" : "&nbsp;") + (current.amplitude - _ampReference).toFixed(2) + " " + _subvariables.overall.Units;
                                    txt += " &ang;+" + (current.phase - _phaReference).toFixed(0) + "&deg; ";
                                }
                                
                                //txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[0].replace(/\s/g, "") + _widgetId + " > span").html(txt);
                                color = _chartAmplitude.plotter_.colors[_subvariables.overall.Name];
                                txt = "<span style=\"color:" + color + "\">" + _subvariables.overall.Name + "</span>:&nbsp;";
                                txt += (current.overall < 0 ? "" : "&nbsp;") + current.overall.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[1].replace(/\s/g, "") + _widgetId + " > span").html(txt);
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
                [[0, 0, 0, 0]],
                {
                    colors: ["#006ACB", "#FF0000", "#008000"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "RPM",
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

                        for (i = 0; i < pts.length; i += 1) {
                            if (_cursorLock) {
                                continue;
                            }
                            if (pts[i].name === _subvariables.overall.Name && !Number.isNaN(pts[i].yval)) {
                                if (!_bodeData || !_bodeData[pts[i].idx]) {
                                    return;
                                }
                                color = _chartAmplitude.plotter_.colors[pts[i].name];
                                current = clone(_bodeData[pts[i].idx]);
                                txt = "<span style=\"color:" + color + "\">" + pts[i].name + "</span>:&nbsp;";
                                txt += (pts[i].yval < 0 ? "" : "&nbsp;") + pts[i].yval.toFixed(2) + " " + _subvariables.overall.Units;
                                txt += ", " + pts[i].xval.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[1].replace(/\s/g, "") + _widgetId + " > span").html(txt);
                            } else if (pts[i].name === "Amplitud" || pts[i].name === "Amplitud Compensada" && !Number.isNaN(pts[i].yval)) {
                                if (!_bodeData || !_bodeData[pts[i].idx]) {
                                    return;
                                }

                                txt = "";
                                if (_flagsSeries.S1X.visible) {
                                    color = _chartAmplitude.plotter_.colors[_chartAmplitude.attributes_.labels_[0]];
                                    current = clone(_bodeData[pts[i].idx]);
                                    txt += "<span style=\"color:" + color + "\">" + _seriesName[0] + "</span>:&#09;";
                                    txt += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + _subvariables.overall.Units;
                                    txt += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                                }
                                if (_flagsSeries.S1XComp.visible) {
                                    color = _chartAmplitude.plotter_.colors[_chartAmplitude.attributes_.labels_[1]];
                                    current = clone(_bodeData[pts[i].idx]);
                                    txt += "<span style=\"color:" + color + "\">" + _seriesName[0] +  " Comp"+ "</span>:&#09;";
                                    txt += (current.amplitude < 0 ? "" : "&nbsp;") + (current.amplitude - _ampReference).toFixed(2) + " " + _subvariables.overall.Units;
                                    txt += " &ang;+" + (current.phase - _phaReference).toFixed(0) + "&deg; ";
                                }
                                //txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + _seriesName[0].replace(/\s/g, "") + _widgetId + " > span").html(txt);
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

        _setReferencePoint = function () {
            var
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 350, height: 180 };
            dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "bode";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div>div").append("<div class=\"col-md-5\"><label for=\"amp" +
                _widgetId + "\" style=\"font-size:12px;\">Amplitud 1X</label></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div>div").append("<div class=\"col-md-7\"><input type=\"text\" " +
                "id=\"amp" + _widgetId + "\" name=\"amp" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(2)>div").append("<div class=\"col-md-5\">" +
                "<label for=\"pha" + _widgetId + "\" style=\"font-size:12px;\">Fase 1X</label></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(2)>div").append("<div class=\"col-md-7\">" +
                "<input type=\"text\" id=\"pha" + _widgetId + "\" name=\"pha" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form").append("<div class=\"form-group zeroMarginBottom\">" +
                "<div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(3)>div").append("<div style=\"text-align:center;\"></div>");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(3)>div>div:nth-child(1)").append("\n<a id=\"btnSaveReference" +
                _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveReference" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + ">div.graphConfigArea>div>form>div:nth-child(3)>div>div:nth-child(1)").append("\n<a id=\"btnCancelReference" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelReference" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#amp" + _widgetId).val(Number(_bodeData[_chartAmplitude.selectedRow_].amplitude.toFixed(2)));
            $("#pha" + _widgetId).val(Number(_bodeData[_chartAmplitude.selectedRow_].phase.toFixed(2)));
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                enableResize: false,
                title: "Compensar Amplitud/Fase 1X",
                width: dialogSize.width,
                height: dialogSize.height,
                zIndex: 2000,
                close: function () {
                    $("#btnCancelReference" + _widgetId).off("click");
                    $("#btnSaveReference" + _widgetId).off("click");
                    $("#" + configContainer[0].id).remove();
                },
                content: "#" + configContainer[0].id,
                tooltip: {
                    close: "Cerrar",
                    collapse: "Colapsar",
                    expand: "Expandir"
                },
                actionButtons: ["close", "collapsible"],
                position: {
                    X: dialogPosition.left,
                    Y: dialogPosition.top
                }
            });
            // Abrir el dialogo
            $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
            // Boton cancelar
            $("#btnCancelReference" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            // Boton aceptar
            $("#btnSaveReference" + _widgetId).click(function (e) {
                e.preventDefault();
                _ampReference = parseFloat($("#amp" + _widgetId).val());
                _phaReference = parseFloat($("#pha" + _widgetId).val());
                _compensated = true;
                if (_compensated) {
                    _flagsSeries.S1X.visible = false;
                    _flagsSeries.S1XComp.visible = true;
                } else {
                    _flagsSeries.S1X.visible = true;
                    _flagsSeries.S1XComp.visible = false;
                }
                _refresh();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
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
				velocity,
                group,
                items,
                tmpData,
                notStored,
                txt;

            _bodeData = [];
            idList = [_subvariables.overall.Id, _subvariables.amplitude.Id, _subvariables.phase.Id];
            if (_angularSubvariable) {
                idList.push(_angularSubvariable.Id);
            }
            aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, timeStampArray, _assetData.NodeId, function (resp) {
				velocity = [];
                group = ej.DataManager(resp).executeLocal(new ej.Query().sortBy("timeStamp", ej.sortOrder.Ascending, false).group("timeStamp"));
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
                    if (tmpData[1].Value !== null && tmpData[1].Value > 0) {
						// Capturamos el vector de velocidad que permite determinar las categorias de arranque, parada y estable
						velocity.push(tmpData[3].Value);
                        _bodeData.push({
                            overall: tmpData[0].Value,
                            amplitude: tmpData[1].Value,
                            phase: tmpData[2].Value,
                            velocity: tmpData[3].Value,
                            timeStamp: formatDate(tmpData[0].RawTimeStamp),
                            rawTimeStamp: tmpData[0].RawTimeStamp
                        });
                    }
                }
                _resolveVelocityStates();

                txt = "<b style=\"color:" + _msColor + ";\">" + _measurementPoint.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                txt += "(" + _bodeData[0].timeStamp + " - " + _bodeData[_bodeData.length - 1].timeStamp + ")";
                _ampReference = _measurementPoint.CompAmp1X;
                _phaReference = _measurementPoint.CompPhase1X;
                _compensated = (_ampReference !== 0.0 && _phaReference !== 0.0) ? true : false;
                txt += (_compensated) ? ", Ref: " + _ampReference.toFixed(2) + "&ang;+" + _phaReference.toFixed(2) + "&deg;" : "";
                $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);

                
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
                // Informacion a graficar de amplitud
                ampData,
                // Informacion a graficar de fase
                phaData,
                phaseValues,
                currentRpm,
                //factor para graficar Amplitud
                factAmp,
                //factor para graficar fase
                factPha,
                //factor para graficar Rpm
                factRpm,
                // Valor maximo de amplitud
                maxAmp,
                // Valor maximo de fase
                maxPha,
                // Valor maximo de velocidad/rpm del conjunto de datos
                maxRpm,
                // Valor minimo de velocidad/rpm del conjunto de datos
                minRpm,
                // Valor minimo de amplitud
                minAmp,
                // Valor minimo de fase
                minPha,
                dataObj,
                step,
                // Contador
                i;


            ampData = [];
            phaData = [];
            phaseValues = [];
            maxAmp = 0;
            maxPha = 0;
            maxRpm = 0;
            factRpm = 0;

           
            if (_bodeData.length > 0) {
                phaseValues[0] = -_bodeData[0].phase;
            }

            for (i = 0; i < _bodeData.length; i += 1) {

                if (i > 0) {
                    if (currentRpm === 0) {
                        phaseValues[i] = 0;
                        _boxPhaseChart = 0;
                    } else {
                        step = _bodeData[i].phase - _bodeData[i - 1].phase;
                        if (step > 180 && (_bodeData[i - 1].phase !== 0 || phaseValues[i] !== 0)) {
                            _boxPhaseChart -= 1;
                        } else if (step < -180 && (_bodeData[i - 1].phase !== 0 || phaseValues[i] !== 0)) {
                            _boxPhaseChart += 1;
                        } else if (step > -180 || step < 180) {
                            _boxPhaseChart = _boxPhaseChart;
                        }
                        phaseValues[i] = _bodeData[i].phase + 360 * _boxPhaseChart;
                    }
                } else {
                    
                    if (currentRpm === 0) {
                        phaseValues[i] = 0;
                        _boxPhaseChart = 0;
                    } else {
                        if (i > 0) {
                            step = _bodeData[i + 1].phase - _bodeData[i].phase;
                            if (step > 180 && (_bodeData[i].phase !== 0 || phaseValues[i] !== 0)) {
                                _boxPhaseChart += 1;
                            } else if (step < -180 && (_bodeData[i].phase !== 0 || phaseValues[i] !== 0)) {
                                _boxPhaseChart -= 1;
                            } else if (step > -180 || step < 180) {
                                _boxPhaseChart = _boxPhaseChart;
                            }
                            phaseValues[i] = _bodeData[i].phase + 360 * _boxPhaseChart;
                        }                      
                    }
                }

                maxRpm = (_bodeData[i].velocity > maxRpm) ? _bodeData[i].velocity : maxRpm;

                ampData.push([_bodeData[i].velocity, _bodeData[i].amplitude, _bodeData[i].amplitude - _ampReference, _bodeData[i].overall]);
                phaData.push([_bodeData[i].velocity, phaseValues[i], phaseValues[i] - _phaReference]);
                if (_flagsSeries.S1XComp.visible) {
                    if (maxAmp < _bodeData[i].amplitude - _ampReference) {
                        maxAmp = _bodeData[i].amplitude - _ampReference;
                    }
                    if (maxPha < phaseValues[i] - _phaReference) {
                        maxPha = phaseValues[i] - _phaReference;
                    }
                }
                if (maxAmp < _bodeData[i].amplitude) {
                    maxAmp = _bodeData[i].amplitude;
                }
                if (maxPha < phaseValues[i]) {
                    maxPha = phaseValues[i];
                }
                if (maxAmp < _bodeData[i].overall) {
                    maxAmp = _bodeData[i].overall;
                }
            }

            minRpm = maxRpm;
            minPha = maxPha;
            minAmp = maxAmp;

            for (i = 0; i < _bodeData.length; i += 1) {
                if (minRpm > _bodeData[i].velocity) {
                    minRpm = _bodeData[i].velocity;
                }
                if (_flagsSeries.S1XComp.visible) {
                    if (minAmp > _bodeData[i].amplitude - _ampReference) {
                        minAmp = _bodeData[i].amplitude - _ampReference;
                    }
                    if (minPha > phaseValues[i] - _phaReference) {
                        minPha = phaseValues[i] - _phaReference;
                    }
                }

                if (minAmp > _bodeData[i].amplitude) {
                    minAmp = _bodeData[i].amplitude;
                }
                if (minPha > phaseValues[i]) {
                    minPha = phaseValues[i];
                }
                if (minAmp > _bodeData[i].overall) {
                    minAmp = _bodeData[i].overall;
                }
            }

            factRpm = (maxRpm - minRpm) * 0.08 + 0.3;
            factAmp = (maxAmp - minAmp) * 0.12 + 0.3;
            factPha = (maxPha - minPha) * 0.12 + 0.3;

            maxRpm = maxRpm + factRpm;
            minRpm = minRpm - factRpm;
            maxAmp = maxAmp + factAmp;
            minAmp = minAmp - factAmp;
            maxPha = maxPha + factPha;
            minPha = minPha - factPha;

            dataObj = {
                ampData: ampData,
                phaData: phaData,
                maxPha: maxPha,
                minPha: minPha,
                maxAmp: maxAmp,
                minAmp: minAmp,
                maxRpm: maxRpm,
                minRpm: minRpm
            };

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
            _graphRange.amplitude = { X: [dataObj.minRpm, dataObj.maxRpm], Y: [dataObj.minAmp, dataObj.maxAmp] };
            _chartAmplitude.is_initial_draw_ = true;
            _chartAmplitude.updateOptions({
                "file": dataObj.ampData,
                "valueRange": _graphRange.amplitude.Y,
                "dateWindow": _graphRange.amplitude.X
            });
            
            _chartAmplitude.setVisibility(_flagsSeries.S1X.index, _flagsSeries.S1X.visible);
            _chartPhase.setVisibility(_flagsSeries.S1X.index, _flagsSeries.S1X.visible);
            _chartAmplitude.setVisibility(_flagsSeries.S1XComp.index, _flagsSeries.S1XComp.visible);
            _chartPhase.setVisibility(_flagsSeries.S1XComp.index, _flagsSeries.S1XComp.visible);
            _chartAmplitude.setVisibility(_flagsSeries.Direct.index, _flagsSeries.Direct.visible);

            _graphRange.phase = { X: [dataObj.minRpm, dataObj.maxRpm], Y: [dataObj.maxPha * 1.1, dataObj.minPha * 0.9] };
            _chartPhase.is_initial_draw_ = true;
            _chartPhase.updateOptions({
                "file": dataObj.phaData,
                "valueRange": _graphRange.phase.Y,
                "dateWindow": _graphRange.phase.X
            });
            _createAnnotations();
            if (_mouseover) {
                _chartAmplitude.mouseMove_(_lastMousemoveEvt);
                _chartPhase.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(_chartAmplitude, 0, 0);
                DygraphOps.dispatchMouseMove(_chartPhase, 0, 0);
            }

            Dygraph.synchronize([_chartPhase, _chartAmplitude], {
                zoom: true,
                selection: true,
                range: false
            });
        };

        _createAnnotations = function () {
            var
                annotationsPha,
                annotationsAmp,
                i;

            annotationsPha = [];
            annotationsAmp = [];
            switch (_annotationType) {
                case 1: // Rpm
                    for (i = 0; i < _annotations.length; i += 1) {
                        if (_annotations[i]) {
                            annotationsPha.push({
                                series: _chartPhase.attributes_.labels_[0],
                                x: _annotations[i].rpm,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm.toFixed(0),
                                text: _annotations[i].rpm.toFixed(0),
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsPha.push({
                                series: _chartPhase.attributes_.labels_[1],
                                x: _annotations[i].rpm,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm.toFixed(0),
                                text: _annotations[i].rpm.toFixed(0),
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _chartAmplitude.attributes_.labels_[0],
                                x: _annotations[i].rpm,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm.toFixed(0),
                                text: _annotations[i].rpm.toFixed(0),
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _chartAmplitude.attributes_.labels_[1],
                                x: _annotations[i].rpm,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm.toFixed(0),
                                text: _annotations[i].rpm.toFixed(0),
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _chartAmplitude.attributes_.labels_[2],
                                x: _annotations[i].rpm,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm.toFixed(0),
                                text: _annotations[i].rpm.toFixed(0),
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                        }
                    }
                    break;
                case 2: // TimeStamp
                    for (i = 0; i < _annotations.length; i += 1) {
                        if (_annotations[i]) {
                            annotationsPha.push({
                                series: _chartPhase.attributes_.labels_[0],
                                x: _annotations[i].rpm,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsPha.push({
                                series: _chartPhase.attributes_.labels_[1],
                                x: _annotations[i].rpm,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _chartAmplitude.attributes_.labels_[0],
                                x: _annotations[i].rpm,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _chartAmplitude.attributes_.labels_[1],
                                x: _annotations[i].rpm,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _chartAmplitude.attributes_.labels_[2],
                                x: _annotations[i].rpm,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                        }
                    }
                    break;
                default:
                    break;
            }
            _chartAmplitude.setAnnotations(annotationsAmp);
            _chartPhase.setAnnotations(annotationsPha);
        };

        /*
        * Muestra-oculta las series 1X - 1X Compensada - Directa
        */
        _showHideSeries = function (navHeight) {
            var
                // Ancho del DIV padre
                parentWidth,
                // Ancho del widget
                widgetWidth,
                // Posicion del widget
                widgetPosition,
                // Definicion de ancho y alto del dialgo
                dialogSize,
                // Posicionamiento del dialogo
                dialogPosition,
                // Contadores
                 i,
                // Listado completo de puntos
                allSeriesList;

            parentWidth = $("#" + _container.id).parents(".grid-stack-item").parent().width() - 22;
            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 250, height: "auto" };
            dialogPosition = {
                X: widgetPosition.left - (parentWidth - widgetWidth) / 2 + dialogSize.width / 2,
                Y: widgetPosition.top - navHeight
            };
            $("#bodeSeriesVisibilityAreaDialog").css("display", "block");
            $("#bodeSeriesVisibility").ejDialog({
                enableResize: false,
                width: dialogSize.width,
                height: dialogSize.height,
                zIndex: 20000,
                close: function () {
                    // Destruir objeto Listbox Syncfusion
                    $("#seriesCheckList").ejListBox("destroy");
                    // Desasociar el evento clic
                    $('#bodeSeriesVisibilityAreaDialog #btnSave').off("click");
                    $('#bodeSeriesVisibilityAreaDialog #btnCancel').off("click");
                    $("#bodeSeriesVisibilityAreaDialog").css("display", "none");
                },
                open: function () {
                    /*
                    if (_flagsSeries.S1X) {
                        $("#seriesCheckList").ejListBox("checkItemByIndex", 1);
                    } else {
                        $("#seriesCheckList").ejListBox("uncheckItemByIndex", 1);
                    }
                    if (_flagsSeries.S1XComp) {
                        $("#seriesCheckList").ejListBox("checkItemByIndex", 2);
                    } else {
                        $("#seriesCheckList").ejListBox("uncheckItemByIndex", 2);
                    }*/
                },
                content: "#bodeSeriesVisibilityAreaDialog",
                tooltip: {
                    close: "Cerrar"
                },
                actionButtons: ["close"],
                position: dialogPosition
            });

            allSeriesList = [
            { Id: 1, Name: "S1X", Text: "1X", Visible: _flagsSeries.S1X.visible },
            { Id: 2, Name: "S1XComp", Text: "1X Compensada", Visible: _flagsSeries.S1XComp.visible },
            { Id: 3, Name: "Direct", Text: "Directa", Visible: _flagsSeries.Direct.visible }];
            //allSeriesList.pushArray(_filteredMeasurementPoints);
            $("#seriesCheckList").ejListBox({
                dataSource: allSeriesList,
                fields: { id: "Id", text: "Text", name: "Name", value: "Id", checkBy: "Visible" },
                height: "100",
                showCheckbox: true,
                checkChange: function (args) {
                    console.log(args);
                    _flagsSeries[args.data.Name].visible = args.isChecked;
                    _refresh();
                }
            });

            // Abrir el dialogo
            $("#bodeSeriesVisibility").ejDialog("open");
            // Boton cancelar
            $("#bodeSeriesVisibilityAreaDialog #btnCancel").click(function (e) {
                e.preventDefault();
                $("#bodeSeriesVisibility").ejDialog("close");
            });
            // Boton aceptar
            $("#bodeSeriesVisibilityAreaDialog #btnSave").click(function (e) {
                e.preventDefault();
                _refresh();

                $("#bodeSeriesVisibility").ejDialog("close");
            });
        };

        /*
        * Actualiza los valores a graficar
        */
        _resolveVelocityStates = function () {

            var velocityState,
                velArray,
                stateArray,
                prevVel,
                actualVel;

            stateArray = [null];
            prevVel = _bodeData[0].velocity;

            for (var i = 1; i < _bodeData.length; i++) {
                actualVel = _bodeData[i].velocity;
                
                if (actualVel < prevVel * 1.02 && actualVel > prevVel * 0.98) {
                    stateArray.push(0);
                    if (stateArray[i] != stateArray[i - 1]) {
                        _arraysVelocityState.push({ type: "nominal", index: i} );
                    }                 
                } else if (actualVel < prevVel ) {
                    stateArray.push(-1);
                    if (stateArray[i] != stateArray[i - 1]) {
                        _arraysVelocityState.push({ type: "stop", index: i });
                    }
                } else if (actualVel > prevVel) {
                    stateArray.push(1);
                    if (stateArray[i] != stateArray[i - 1]) {
                        _arraysVelocityState.push({ type: "start", index: i });
                    }
                }
                prevVel = _bodeData[i].velocity;
            }
            _arraysVelocityState[0].index = 0;
            stateArray[0] = stateArray[1] = stateArray[2];
            _orderBodeArray();
        };

        /*
        * Ordena los valores de velocidad, depensiendo si es un arranque, parada, o está en estado nominal, y elimina las velocidades repetidas
        */
        _orderBodeArray = function () {

            var i, j,
                tempArray,
                newArray,
                tempBodeData;

            tempBodeData = [];
            newArray = [];

            for (i = 0; i < _arraysVelocityState.length; i++) {
                if (i < _arraysVelocityState.length - 1) {
                    tempArray = _bodeData.slice(_arraysVelocityState[i].index, _arraysVelocityState[i + 1].index);
                    
                } else {
                    tempArray = _bodeData.slice(_arraysVelocityState[i].index, _bodeData.length - 1);
                }
                if (_arraysVelocityState[i].type == "start" || _arraysVelocityState[i].type == "nominal") {
                    tempArray.sort(function (a, b) {
                        return a.velocity - b.velocity;
                    });
                } else {
                    tempArray.sort(function (a, b) {
                        return b.velocity - a.velocity;
                    });
                }
                for (j = 1; j < tempArray.length; j++) {
                    if (tempArray[j].velocity === tempArray[j - 1].velocity) {
                        tempArray = tempArray.splice(j, 1);
                    }
                }
                newArray.push(tempArray);
            }

            for (i = 0; i < newArray.length; i++) {
                for (j = 0; j < newArray[i].length; j++) {
                    if (newArray[i][j].velocity) {
                        tempBodeData.push(newArray[i][j]);
                    }
                }
            }

            _bodeData = tempBodeData;
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
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Series", "showSeries"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Ver etiquetas...", "showTagsBode"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageBode" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Bode",
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: 1,
                asset: _assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s/g, "")],
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

            labelAmp = ["RPM", "Amplitud", "Amplitud Compensada", _subvariables.overall.Name];
            labelPha = ["RPM", "Fase", "Fase Compensada"];

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

    return BodeGraph;
})();