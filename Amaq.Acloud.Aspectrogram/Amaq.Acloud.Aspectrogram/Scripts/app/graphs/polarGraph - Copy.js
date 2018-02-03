/*
 * polarGraph.js
 * Gestiona todo lo relacionado a la grafica polar.
 * @author Jorge Calderon
 */

var PolarGraph = {};

PolarGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    PolarGraph = function (timeMode, width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor especifico del chart a graficar
            _contentBody,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase PolarGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Listado de subvariables a consultar (para agregar al publish/subscribe)
            _subVariableIdList,
            // Array de los diferentes valores de amplitud, fase, velocidad y valor global en la grafica
            _buffer,
            // Color del punto de medicion
            _msColor,
            // Mantiene en memoria el numero que determina cada cuantos datos se muestran las etiquetas
            _tagVariation,
            // Informacion de las anotaciones
            _annotations,
            // Tipo de anotacion a mostrar (0 = Ninguna, 1 = Rpm, 2 = Tiempo)
            _annotationType,
            // Punto de medicion
            _measurementPoint,
            // Bandera que identifica si el grafico cuenta con compensacion o no
            _compensated,
            // Amplitud de referencia para el bode
            _ampReference,
            // Fase de referencia para el bode
            _phaReference,
            // Rango maximo y minimo del grafico, tanto en el eje X como en el eje Y
            _graphRange,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Referencia a la clase de sincronizacion de series
            _synchronizer,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Dimension del cuadrado
            _side,
            // Metodo privado que calcula las margenes para que el tamaño del canvas sea un cuadrado
            _setMargins,
            // Metodo privado que muestra las diferentes anotaciones configuradas
            _createAnnotations,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Instancia del control de seleccion sobre el canvas
            _selector,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh;

        /*
         * Inicializar el modo, la auto-referencia y demas valores por defecto.
         */
        _this = this;
        _pause = (timeMode == 0) ? false : true;
        _movableGrid = false;
        _compensated = false;
        _graphType = "polar";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _msColor = "#000000";
        _tagVariation = 1;
        _annotationType = 0;
        _synchronizer = new SerieSynchronizer();

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
                case "showTagsPolar":
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 350, height: 180 };
                    dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                    configContainer = $("#graphConfigAreaDialog").clone();
                    configContainer.css("display", "block");
                    configContainer[0].id = _widgetId + "shaft";
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

                    $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");

                    $("#btnCancelTag" + _widgetId).click(function (e) {
                        e.preventDefault();
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                    });

                    $("#btnSaveTag" + _widgetId).click(function (e) {
                        e.preventDefault();
                        _annotationType = parseFloat($("#tagType_hidden").val());
                        _tagVariation = parseFloat($("#tagVariation").val());
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                        if (_annotationType > 0) {
                            _annotations = [];
                            for (i = 0; i < _buffer.length; i += _tagVariation) {
                                _annotations[i] = {
                                    x: _chart.file_[i][0],
                                    y: _chart.file_[i][1],
                                    rpm: _buffer[i].velocity.toFixed(0),
                                    time: _buffer[i].timeStamp
                                };
                            }
                        } else {
                            _annotations = [];
                        }
                        _createAnnotations();
                    });
                    break;
                case "saveImagePolar" + _widgetId:
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
                        name = "Tiempo Real, Polar" +  _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Polar" + _assetData.Name;
                    }
                    contId = "tableToExcelWaveformGraph" + _widgetId;

                    for (var j = 0; j < _chart.user_attrs_.labels.length; j++) {
                        labels.push(_chart.user_attrs_.labels[j]);
                    }

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
        _buildGraph = function (labels, overallName, overallUnits, rotn, angularReferenceAngle) {
            var
                // Dato inicial necesario para graficar
                initialData,
                txt,
                // Menu contextual
                contextMenuContainer,
                // Elementos del menu
                ulEl,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition;

            contextMenuContainer = document.createElement("div");
            contextMenuContainer.id = "polarCtxMenu" + _widgetId;
            contextMenuContainer.className = "customContextMenu";
            ulEl = document.createElement("ul");
            $(ulEl).append("<li id=\"menuReferencePoint" + _widgetId + "\" class=\"menuReferencePoint\">Compensar</li>");
            $(contextMenuContainer).append(ulEl);
            // Agregamos el contenedor del menu contextual al DOM
            $(_container).append(contextMenuContainer);
            $(contextMenuContainer).click(function (e) {
                // Si la opcion esta desactivada, no hacer nada
                if (e.target.className == "disabled") {
                    return false;
                } else {
                    // Gestionamos la accion especifica

                    switch (e.target.id) {
                        case "menuReferencePoint" + _widgetId:
                            $("#graphConfigArea > div > form").html("");
                            $("#graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
                            $("#graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"amp" + _widgetId + "\" " +
                              "style=\"font-size:12px;\">Amplitud 1X</label></div>");
                            $("#graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"text\" id=\"amp" + _widgetId + "\" " +
                              "name=\"amp" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
                            $("#graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
                            $("#graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-5\"><label for=\"pha" + _widgetId + "\" " +
                              "style=\"font-size:12px;\">Fase 1X</label></div>");
                            $("#graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-7\"><input type=\"text\" id=\"pha" + _widgetId +
                              "\" name=\"pha" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
                            $("#graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
                            $("#graphConfigArea > div > form > div:nth-child(3) > div").append("<div style=\"text-align: center;\"></div>");
                            $("#graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnSave" + _widgetId +
                              "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                            $("#btnSave" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
                            $("#graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnCancel" + _widgetId +
                              "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                            $("#btnCancel" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
                            $("#amp" + _widgetId).val(_buffer[_chart.selectedRow_].amplitude.toFixed(2) + " " + overallUnits);
                            $("#pha" + _widgetId).val(_buffer[_chart.selectedRow_].phase.toFixed(2) + "°");
                            $("#graphConfigAreaDialog").css("display", "block");
                            $("#graphConfigArea").attr("title", "Compensar Amplitud/Fase 1X");
                            widgetWidth = $("#" + _container.id).width();
                            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                            dialogSize = { width: 350, height: 180 };
                            dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                            $("#graphConfigArea").ejDialog({
                                enableResize: false,
                                title: "Compensar Amplitud/Fase 1X",
                                width: dialogSize.width,
                                height: dialogSize.height,
                                zIndex: 2000,
                                close: function () {
                                    $("#btnCancelLaps" + _widgetId).off("click");
                                    $("#btnSaveLaps" + _widgetId).off("click");
                                    $("#graphConfigArea > div > form").html("");
                                },
                                content: "#graphConfigAreaDialog",
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

                            $("#graphConfigArea").ejDialog("open");

                            $("#btnCancel" + _widgetId).click(function (e) {
                                e.preventDefault();
                                $("#graphConfigArea").ejDialog("close");
                            });

                            $("#btnSave" + _widgetId).click(function (e) {
                                e.preventDefault();
                                var
                                    normalizedPhase,
                                    x, y,
                                    currentX,
                                    currentY,
                                    currentRpm,
                                    maxAmp,
                                    data,
                                    updateData,
                                    dataManger,
                                    txt,
                                    i;

                                _ampReference = parseFloat($("#amp" + _widgetId).val());
                                _phaReference = parseFloat($("#pha" + _widgetId).val());
                                x = _ampReference * Math.cos((_phaReference + _measurementPoint.SensorAngle) * Math.PI / 180);
                                y = _ampReference * Math.sin((_phaReference + _measurementPoint.SensorAngle) * Math.PI / 180);
                                $.ajax({
                                    url: "/Home/SetCompesation",
                                    method: "GET",
                                    data: {
                                        mdVariableId: _measurementPoint.Id,
                                        amplitude: _ampReference,
                                        phase: _phaReference
                                    },
                                    success: function (response) {
                                        // Realizar el Redraw

                                        currentRpm = 0;
                                        maxAmp = 0;
                                        data = [];
                                        for (i = 0; i < _buffer.length; i += 1) {
                                            if (maxAmp < _buffer[i].amplitude) {
                                                maxAmp = _buffer[i].amplitude;
                                            }
                                            currentRpm = _buffer[i].velocity;
                                            currentX = _buffer[i].amplitude * Math.cos((_buffer[i].phase + _measurementPoint.SensorAngle) * Math.PI / 180) - x;
                                            currentY = _buffer[i].amplitude * Math.sin((_buffer[i].phase + _measurementPoint.SensorAngle) * Math.PI / 180) - y;
                                            normalizedPhase = Math.atan2(currentY, currentX) * 180 / Math.PI;
                                            _buffer[i].compAmp = Math.sqrt(currentX * currentX + currentY * currentY);
                                            _buffer[i].compPha = (normalizedPhase < 0) ? normalizedPhase + 360 : normalizedPhase;
                                            data[i] = [_chart.file_[i][0], _chart.file_[i][1], null];
                                            data[i + _buffer.length] = [currentX, null, currentY];
                                        }
                                        updateData = clone(_measurementPoint);
                                        updateData.CompAmp1X = _ampReference;
                                        updateData.CompPhase1X = _phaReference;
                                        dataManger = ej.DataManager(mainCache.loadedMeasurementPoints);
                                        dataManger.update("Id", updateData, mainCache.loadedMeasurementPoints);

                                        txt = "<b style=\"color:" + _msColor + ";\">" + _measurementPoint.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                                        txt += _measurementPoint.SensorAngle + "&deg;";
                                        txt += ", (" + _buffer[0].timeStamp + " - " + _buffer[_buffer.length - 1].timeStamp + ")";
                                        _compensated = true;
                                        txt += ", Ref: " + _ampReference.toFixed(2) + "&ang;+" + _phaReference.toFixed(2) + "&deg;";
                                        $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                                        _chart.maxRadiusSize_ = maxAmp * 1.06;
                                        _graphRange.X = [-maxAmp * 1.3, maxAmp * 1.3];
                                        _graphRange.Y = [-maxAmp * 1.3, maxAmp * 1.3];
                                        _chart.updateOptions({
                                            "file": data,
                                            "dateWindow": _graphRange.X,
                                            "valueRange": _graphRange.Y,
                                        });
                                        _createAnnotations();
                                        $("#graphConfigArea").ejDialog("close");
                                    },
                                    error: function (jqXHR, textStatus) {
                                        console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                                    }
                                });
                            });
                            break;
                        default:
                            break;
                    }
                }
            });

            _customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                _chart.selectedRow_ = _chart.lastRow_ % (_chart.file_.length / 2);
                $(contextMenuContainer).css("top", (e.offsetY + _contentBody.offsetTop));
                $(contextMenuContainer).css("left", (e.offsetX + _contentBody.offsetLeft));
                $(contextMenuContainer).css("display", "block");
                return false;
            };
            _customInteractionModel.click = function (e, g, ctx) {
                $(contextMenuContainer).css("display", "none");
            };

            initialData = [[0, 0, null]];
            _setMargins();
            _chart = new Dygraph(
                _contentBody,
                initialData,
                {
                    colors: ["#006ACB", "#F70D1A"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    hideOverlayOnMouseOut: false,
                    axisLabelFontSize: 10,
                    labels: labels,
                    labelsDivWidth: 0,
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
                    interactionModel: _customInteractionModel,
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        var
                            color,
                            current,
                            i;

                        for (i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === "1X" && !isNaN(pts[i].yval)) {
                                color = _chart.plotter_.colors[pts[i].name];
                                if (!_buffer || !_buffer[pts[i].idx]) return;
                                current = clone(_buffer[pts[i].idx]);
                                txt = "<span style=\"color:" + color + "\">" + pts[i].name + "</span>:&nbsp;";
                                txt += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + overallUnits;
                                txt += " &ang;+" + current.phase.toFixed(2) + "&deg;&nbsp;";
                                if (_compensated) {
                                    txt += "<span style=\"color:" + _chart.plotter_.colors["Comp1X"] + "\">" + "(" + current.compAmp.toFixed(2);
                                    txt += "&nbsp;" + overallUnits + " &ang;+" + current.compPha.toFixed(2) + "&deg;)</span>";
                                }
                                txt += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp + ", " + overallName + ": ";
                                txt += current.overall.toFixed(2) + " " + overallUnits;
                                $("#" + _seriesName[0].replace(/\s/g, "") + _widgetId + " > span").html(txt);
                            }
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    series: {
                        "1X": {
                            plotter: function (e) {
                                Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, rotn);
                                Dygraph.Plugins.Plotter.prototype.drawPolar(e, _measurementPoint.SensorAngle, rotn, _annotations);
                            },
                        },
                        "Comp1X": {
                            plotter: function (e) {
                                Dygraph.Plugins.Plotter.prototype.drawCompPolar(e, _annotations, _compensated);
                            },
                        },
                    },
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
                        _synchronizer.ReflectByIndex(event, g, context);
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
                    "valueRange": _graphRange.Y,
                    "dateWindow": _graphRange.X
                });
            },
            mouseup: function (event, g, context) {
                if (context.isZooming) {
                    Dygraph.endZoom(event, g, context);
                } else if (context.isPanning) {
                    Dygraph.endPan(event, g, context);
                }
            }
        };

        /*
         * Suscribe el chart al dato segun el Modo definido
         */
        _subscribeToRefresh = function (mdVariableIdList, amp1xId, pha1xId, overallId, velocityId, sDate, eDate, rotn) {
            switch (timeMode) {
                case 0: // Tiempo Real
                    break;
                case 1: // Historico
                    sDate = new Date(sDate).toISOString();
                    eDate = new Date(eDate).toISOString();
                    _subscription = PublisherSubscriber.subscribe("/historicTrend/refresh", _subVariableIdList, function (data) {
                        var
                            amp1x,
                            pha1x,
                            velocityData,
                            overallData;

                        if (data[amp1xId].WidgetId === _widgetId) {
                            _ampReference = _measurementPoint.CompAmp1X;
                            _phaReference = _measurementPoint.CompPhase1X;
                            _compensated = (_ampReference !== 0.0 && _phaReference !== 0.0) ? true : false;
                            amp1x = data[amp1xId].Historical;
                            pha1x = data[pha1xId].Historical;
                            overallData = data[overallId].Historical;
                            velocityData = data[velocityId].Historical;
                            _refresh(amp1x, pha1x, overallData, velocityData, _chart, rotn);
                        }
                    });
                    new HistoricalTimeMode().GetHistoricTrend(mdVariableIdList, _subVariableIdList, sDate, eDate, true, _widgetId);
                    break;
                default:
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {String} signal Informacion obtenida del poll
         */
        _refresh = function (amplitude, phase, overall, velocity, chart, rotn) {
            var
                refX,
                refY,
                refAmp,
                refPha,
                maxAmp,
                txt,
                sAngle,
                x, y,
                data,
                i, count;

            data = [];
            _buffer = [];
            _chart.dataCompensed_ = [];
            maxAmp = 0;
            count = amplitude.length;
            for (i = 0; i < count; i += 1) {
                if (maxAmp < amplitude[i].Value) {
                    maxAmp = amplitude[i].Value;
                }
                sAngle = ((rotn === "CW") ? _measurementPoint.SensorAngle + 90 : -_measurementPoint.SensorAngle + 90);
                x = amplitude[i].Value * Math.cos((phase[i].Value + sAngle) * Math.PI / 180);
                y = amplitude[i].Value * Math.sin((phase[i].Value + sAngle) * Math.PI / 180);
                if (_compensated) {
                    refX = x - _ampReference * Math.cos((_phaReference + sAngle) * Math.PI / 180);
                    refY = y - _ampReference * Math.sin((_phaReference + sAngle) * Math.PI / 180);
                    refAmp = Math.sqrt(refX * refX + refY * refY);
                    refPha = Math.atan2(refY, refX);
                    refPha = (refPha < 0) ? refPha + 360 : refPha;
                    chart.dataCompensed_.push([refX, refY]);
                }
                _buffer[i] = {
                    amplitude: amplitude[i].Value,
                    phase: phase[i].Value,
                    compAmp: refAmp,
                    compPha: refPha,
                    overall: overall[i].Value,
                    velocity: velocity[i].Value,
                    timeStamp: formatDate(new Date(amplitude[i].TimeStamp + "+00:00"))
                };
                data[i] = [x, y, null];
                data[i + count] = [refX, null, refY];
            }
            txt = "<b style=\"color:" + _msColor + ";\">" + _measurementPoint.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
            txt += _measurementPoint.SensorAngle + "&deg;";
            txt += ", (" + _buffer[0].timeStamp + " - " + _buffer[_buffer.length - 1].timeStamp + ")";
            txt += (_compensated) ? ", Ref: " + _ampReference.toFixed(2) + "&ang;+" + _phaReference.toFixed(2) + "&deg;" : "";
            $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
            txt = velocity[0].Value.toFixed(0) + " RPM, " + _buffer[0].timeStamp;
            $("#" + _seriesName[0].replace(/\s/g, "") + _widgetId + " > span").html(txt);
            chart.maxRadiusSize_ = maxAmp * 1.06;
            _graphRange.X = [-maxAmp * 1.3, maxAmp * 1.3];
            _graphRange.Y = [-maxAmp * 1.3, maxAmp * 1.3];
            chart.updateOptions({
                "file": data,
                "dateWindow": _graphRange.X,
                "valueRange": _graphRange.Y,
            });
            _createAnnotations();
            if (_mouseover) {
                chart.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(chart, 0, 0);
            }
        };

        _createAnnotations = function () {
            var
                annotations,
                i;

            annotations = [];
            switch (_annotationType) {
                case 1: // Rpm
                    for (i = 0; i < _annotations.length; i += 1) {
                        if (_annotations[i]) {
                            annotations.push({
                                series: _seriesName[0],
                                x: _annotations[i].x,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm,
                                text: _annotations[i].rpm,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                        }
                    }
                    break;
                case 2: // TimeStamp
                    for (i = 0; i < _annotations.length; i += 1) {
                        if (_annotations[i]) {
                            annotations.push({
                                series: _seriesName[0],
                                x: _annotations[i].x,
                                width: 46,
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
            _chart.setAnnotations(annotations);
        };

        this.Show = function (measurementPointId, sDate, eDate, currentColor) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Informacion del activo al que estan relacionados los puntos de medicion
                assetData,
                // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
                rotn,
                // Labels
                labels,
                // Sensor de referencia angular
                angularReference,
                // Menu de opciones para la grafica
                settingsMenu,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                overallUnits,
                // SubVariable global en X configurada en el sistema
                overallSubVariable,
                // SubVariable de amplitud 1X configurada en el sistema
                amp1xSubVariable,
                // SubVariable de fase 1X configurada en el sistema
                pha1xSubVariable,
                // SubVariable de velocidad de la referencia angular
                velocitySubVariable,
                // Listado de Ids de variables a suscribir
                mdVariableListId;

            switch (timeMode) {
                case 0: // RT
                    _measurementPoint = selectedMeasurementPoint;
                    assetData = selectedAsset;
                    break;
                case 1: // HT
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
                    break;
                default:
                    break;
            }
            // Referencia angular
            angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false)
            )[0];
            if (!angularReference) {
                popUp("info", "No se a configurado un sensor de referencia angular para " + assetData.Name);
                return;
            }

            rotn = (angularReference.RotationDirection == 1) ? "CW" : "CCW";
            subVariables = _measurementPoint.SubVariables;
            // SubVariable que contiene el valor amplitud 1X
            amp1xSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0];
            // SubVariable que contiene el valor fase 1x
            pha1xSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 6, false))[0];
            if (pha1xSubVariable) {
                _subVariableIdList.push(pha1xSubVariable.Id);
            }
            // SubVariable que contiene la velocidad de giro
            velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
            if (velocitySubVariable) {
                _subVariableIdList.push(velocitySubVariable.Id);
            }
            if (!amp1xSubVariable || !pha1xSubVariable || !velocitySubVariable) {
                var msgError = "No existen subvariables configuradas para ";
                msgError += (!velocitySubVariable) ? "velocidad, " : "";
                msgError += (!pha1xSubVariable) ? "fase, " : "";
                msgError += (!amp1xSubVariable) ? "amplitud, " : "";

                popUp("info", msgError.slice(0, -2) + " 1X.");
                return;
            } else {
                _subVariableIdList.push(amp1xSubVariable.Id);
                _subVariableIdList.push(pha1xSubVariable.Id);
                _subVariableIdList.push(velocitySubVariable.Id);
                amp1xSubVariable = amp1xSubVariable.Id;
                pha1xSubVariable = pha1xSubVariable.Id;
                velocitySubVariable = velocitySubVariable.Id;
            }
            // SubVariable que contiene el valor global del sensor en X
            overallSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
            if (overallSubVariable) {
                _subVariableIdList.push(overallSubVariable.Id);
                overallUnits = overallSubVariable.Units;
            }

            _msColor = currentColor;
            _seriesName = ["1X"];
            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Ver etiquetas...", "showTagsPolar"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImagePolar" + _widgetId));
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
                timeMode: timeMode,
                asdaqId: assetData.AsdaqId,
                atrId: assetData.AtrId,
                subVariableIdList: _subVariableIdList,
                asset: assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name],
                pause: false,
                settingsMenu: settingsMenu,
                onSettingsMenuItemClick: _onSettingsMenuItemClick,
                onClose: function () {
                    _this.Close();
                },
                onMove: function () {
                    _movableGrid = !_movableGrid;
                    var gridStack = $(".grid-stack").data("gridstack");
                    var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    gridStack.movable(grid, _movableGrid);
                }

            });

            // Abrir AspectrogramWidget.
            _aWidget.open();
            mdVariableListId = [_measurementPoint.Id, angularReference.Id];
            _seriesName.push("Comp1X");
            labels = ["Componente X"];
            labels.pushArray(_seriesName);
            // Se suscribe a la notificacion de llegada de nuevos datos.
            _subscribeToRefresh(mdVariableListId, amp1xSubVariable, pha1xSubVariable, overallSubVariable.Id, velocitySubVariable, sDate, eDate, rotn);
            // Construir y mostrar grafica.
            _buildGraph(labels, overallSubVariable.Name, overallUnits, rotn, angularReference.SensorAngle);


            _assetData = assetData;
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
            }
            var grid, el;
            if (_chart) _chart.destroy();
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();
        };
    };

    return PolarGraph;
})();