/*
 * bodeGraph.js
 * Gestiona todo lo relacionado al grafico de bode.
 * @author Jorge Calderon
 */

var BodeGraph = {};

BodeGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    BodeGraph = function (timeMode, width, height, aspectRatio) {
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
            // Modo: Tiempo real (0), historico (1) o evento (2)
            _timeMode,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _dragAndResizeGrid,
            // Auto-referencia a la clase SignalGraph
            _this,
            // Referencia al chart de amplitud
            _chartAmplitude,
            // Referencia al chart de fase
            _chartPhase,
            // Referencia al Id del widget
            _widgetId,
            // Ids de subvariables tipificado por amplitud, fase y velocidad
            _subVariableIdObj,
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
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Valor maximo en Rpm a graficar
            _maxRpm,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Punto de medicion de la grafica
            _measurementPoint,
            // Bandera que identifica si el grafico cuenta con compensacion o no
            _compensated,
            // Amplitud de referencia para el bode
            _ampReference,
            // Fase de referencia para el bode
            _phaReference,
            // Mantiene el valor de la subVariable de global en memoria
            _overallValue,
            // Mantiene el valor de la subVariable de velocidad que corresponde a la referencia angular en memoria
            _velocityValue,
            // Referencia al cursor
            _cursor,
            // Bandera que indica si el cursor esta bloqueado o siguiendo el movimiento del mouse
            _cursorLock,
            // Referencia a la suscripcion del reproductor de tendencia
            _playerSubscription,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Metodo privado que muestra las diferentes anotaciones configuradas
            _createAnnotations,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Callback de evento click sobre algun item del menu de opciones
            _onSettingsMenuItemClick;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _dragAndResizeGrid = false;
        _compensated = false;
        _this = this;
        _graphType = "bode";
        _subVariableIdObj = {};
        _widgetId = Math.floor(Math.random() * 100000);
        _msColor = "#000000";
        _overallValue = 0;
        _velocityValue = 0;
        _tagVariation = 1;
        _annotationType = 0;
        _ampReference = 0;
        _phaReference = 0;
        _cursorLock = false;
        _cursor = new Cursors(null);

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
                case "showTagsBode":
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
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                        if (_annotationType > 0 && parseFloat($("#tagVariation").val()) > 0) {
                            _tagVariation = parseFloat($("#tagVariation").val());
                            _annotations = [];
                            for (i = 0; i < _buffer.length; i += _tagVariation) {
                                _annotations[i] = {
                                    x: _chartAmplitude.file_[i][0],
                                    y: _chartAmplitude.file_[i][1],
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
                case "saveImageBode" + _widgetId:
                    //imgExport = new ImageExport(_chartAmplitude, _graphType);
                    //imgExport.asPNG();
                    break;
                case "exportToExcel" +_widgetId:
                    var
                        contId,
                        name,
                        labels,
                        j;

                    if (timeMode == 0) {
                        name = "Tiempo Real, Bode : " + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Bode : " + _assetData.Name;
                    }
                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    labels = ["RPM", "1X", "Directa", "1XComp", "RPM", "Fase 1X", "Fase 1X Comp"];

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

                    createTableToExcel(_container, contId, name, labels, data, true)
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
            }
        };

        /*
         * Construye la grafica, caso no exista.
         * @param {Array} labelAmp
         */
        _buildGraph = function (labelAmp, labelPha, overallUnits, historicalRange, rpmPositions) {
            var
                dynamicData,
                // Menu contextual
                contextMenuContainer,
                // Elementos del menu
                ulEl,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition;

            contextMenuContainer = document.createElement("div");
            contextMenuContainer.id = "bodeCtxMenu" + _widgetId;
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
                }
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
                        $("#amp" + _widgetId).val(_buffer[_chartAmplitude.selectedRow_].amplitude.toFixed(2) + " " + overallUnits);
                        $("#pha" + _widgetId).val(_buffer[_chartAmplitude.selectedRow_].phase.toFixed(2) + "°");
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
                                $("#btnCancel" + _widgetId).off("click");
                                $("#btnSave" + _widgetId).off("click");
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
                                ampData,
                                phaData,
                                updateData,
                                dataManger,
                                txt,
                                i;

                            _ampReference = parseFloat($("#amp" + _widgetId).val());
                            _phaReference = parseFloat($("#pha" + _widgetId).val());
                            x = _ampReference * Math.cos(_phaReference * Math.PI / 180);
                            y = _ampReference * Math.sin(_phaReference * Math.PI / 180);
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
                                    ampData = [];
                                    phaData = [];
                                    _maxRpm = 0;
                                    for (i = 0; i < _buffer.length; i += 1) {
                                        if (currentRpm !== _buffer[i].velocity) {
                                            currentRpm = _buffer[i].velocity;
                                            currentX = _buffer[i].amplitude * Math.cos(_buffer[i].phase * Math.PI / 180) - x;
                                            currentY = _buffer[i].amplitude * Math.sin(_buffer[i].phase * Math.PI / 180) - y;
                                            normalizedPhase = Math.atan2(currentY, currentX) * 180 / Math.PI;
                                            _buffer[i].compAmp = Math.sqrt(currentX * currentX + currentY * currentY);
                                            _buffer[i].compPha = (normalizedPhase < 0) ? normalizedPhase + 360 : normalizedPhase;
                                            ampData.push([currentRpm, _buffer[i].amplitude, _buffer[i].overall, _buffer[i].compAmp]);
                                            phaData.push([currentRpm, _buffer[i].phase, _buffer[i].compPha]);
                                            _maxRpm = (currentRpm > _maxRpm) ? currentRpm : _maxRpm;
                                        }
                                    }
                                    updateData = clone(_measurementPoint);
                                    updateData.CompAmp1X = _ampReference;
                                    updateData.CompPhase1X = _phaReference;
                                    dataManger = ej.DataManager(mainCache.loadedMeasurementPoints);
                                    dataManger.update("Id", updateData, mainCache.loadedMeasurementPoints);

                                    _compensated = true;
                                    txt = "<b style=\"color:" + _msColor + ";\">" + _measurementPoint.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                                    txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                                    txt += "(" + _buffer[0].timeStamp + " - " + _buffer[_buffer.length - 1].timeStamp + ")";
                                    txt += ", Ref: " + _ampReference.toFixed(2) + "&ang;+" + _phaReference.toFixed(2) + "&deg;";
                                    $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                                    _maxRpm += 50;
                                    _chartAmplitude.is_initial_draw_ = true;
                                    _chartAmplitude.dateMaxWindow_ = [0, _maxRpm];
                                    _chartAmplitude.updateOptions({
                                        "file": ampData,
                                        "dateWindow": [0, _maxRpm]
                                    });
                                    _chartPhase.is_initial_draw_ = true;
                                    _chartPhase.dateMaxWindow_ = [0, _maxRpm];
                                    _chartPhase.updateOptions({
                                        "file": phaData,
                                        "dateWindow": [0, _maxRpm],
                                        "valueRange": [380, 0]
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
                }
            });

            _customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                var offsetTop = (g.maindiv_.id === _ampContainer.id) ? _ampContainer.offsetTop : _phaseContainer.offsetTop;
                _chartAmplitude.selectedRow_ = (g.maindiv_.id === _ampContainer.id) ? _chartAmplitude.lastRow_ : _chartPhase.lastRow_;
                $(contextMenuContainer).css("top", (e.offsetY + offsetTop));
                $(contextMenuContainer).css("left", (e.offsetX + _contentBody.offsetLeft));
                $(contextMenuContainer).css("display", "block");
                return false;
            };
            _customInteractionModel.click = function (e, g, ctx) {
                $(contextMenuContainer).css("display", "none");
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
                    "dateWindow": [0, _maxRpm]
                });
            };
            var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigthPercentage) + "%";

            _chartPhase = new Dygraph(
                _phaseContainer,
                [[0, 0, null]],
                {
                    colors: ["#006ACB", "#F70D1A"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    ylabel: "Fase [°]",
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
                            if (pts[i].name === "1X" && !isNaN(pts[i].yval)) {
                                color = _chartAmplitude.plotter_.colors[pts[i].name];
                                if (!_buffer || !_buffer[pts[i].idx]) { return; }
                                current = clone(_buffer[pts[i].idx]);
                                dynamicData = "<span style=\"color:" + color + "\">" + pts[i].name + "</span>:&nbsp;";
                                dynamicData += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + overallUnits;
                                dynamicData += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                                if (_compensated) {
                                    dynamicData += "<span style=\"color:" + _chartAmplitude.plotter_.colors["1XComp"] + "\">" + (current.compAmp < 0 ? "" : "&nbsp;");
                                    dynamicData += "(" + current.compAmp.toFixed(2) + " " + overallUnits + " &ang;+" + current.compPha.toFixed(2) + "&deg;)</span>";
                                }
                                dynamicData += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + pts[i].name + _widgetId + " > span").html(dynamicData);
                                color = _chartAmplitude.plotter_.colors["Directa"];
                                dynamicData = "<span style=\"color:" + color + "\">Directa</span>:&nbsp;";
                                dynamicData += (current.overall < 0 ? "" : "&nbsp;") + current.overall.toFixed(2) + " " + overallUnits;
                                dynamicData += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#Directa" + _widgetId + " > span").html(dynamicData);
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
                [[0, 0, 0, null]],
                {
                    colors: ["#006ACB", "#008000", "#F70D1A"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "RPM",
                    ylabel: "Amplitud [" + overallUnits + "]",
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
                            if (pts[i].name === "Directa" && !isNaN(pts[i].yval)) {
                                color = _chartAmplitude.plotter_.colors[pts[i].name];
                                dynamicData = "<span style=\"color:" + color + "\">" + pts[i].name + "</span>:&nbsp;";
                                dynamicData += (pts[i].yval < 0 ? "" : "&nbsp;") + pts[i].yval.toFixed(2) + " " + overallUnits;
                                dynamicData += ", " + pts[i].xval.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + pts[i].name.replace(/\s/g, "") + _widgetId + " > span").html(dynamicData);
                            } else if (pts[i].name === "1X" && !isNaN(pts[i].yval)) {
                                color = _chartAmplitude.plotter_.colors[pts[i].name];
                                if (!_buffer || !_buffer[pts[i].idx]) { return; }
                                current = clone(_buffer[pts[i].idx]);
                                dynamicData = "<span style=\"color:" + color + "\">" + pts[i].name + "</span>:&#09;";
                                dynamicData += (current.amplitude < 0 ? "" : "&nbsp;") + current.amplitude.toFixed(2) + " " + overallUnits;
                                dynamicData += " &ang;+" + current.phase.toFixed(2) + "&deg; ";
                                if (_compensated) {
                                    dynamicData += "<span style=\"color:" + _chartAmplitude.plotter_.colors["1XComp"] + "\">" + (current.compAmp < 0 ? "" : "&nbsp;");
                                    dynamicData += "(" + current.compAmp.toFixed(2) + " " + overallUnits + " &ang;+" + current.compPha.toFixed(2) + "&deg;)</span>";
                                }
                                dynamicData += ", " + current.velocity.toFixed(0) + " RPM, " + current.timeStamp;
                                $("#" + pts[i].name.replace(/\s/g, "") + _widgetId + " > span").html(dynamicData);
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

            Dygraph.synchronize([_chartPhase, _chartAmplitude], {
                zoom: true,
                selection: true,
                range: false
            });

            $(".grid-stack-item").on("resizestop", function () {
                headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
                setTimeout(function () {
                    _chartPhase.resize();
                    _chartAmplitude.resize();
                }, 100);
            });

            _chartPhase.ready(function () {
                _getHistoricalData(historicalRange, rpmPositions);
            });
        };

        _customInteractionModel = clone(Dygraph.defaultInteractionModel);

        /*
         * Obtiene la informacion asociada al grafico
         */
        _getHistoricalData = function (historicalRange, rpmPositions) {
            var
                i,
                timeStamp,
                // Texto informativo sobre el punto de medicion
                txt,
                // Fecha de inicio real, esto es segun el primer dato ordenado por estampa de tiempo que coincide con la consulta
                startDate,
                // Fecha de fin real, esto es segun el ultimo dato ordenado por estampa de tiempo que coincide con la consulta
                endDate,
                // Valor del historico de la amplitud
                amplitude,
                // Valor del historico de la fase
                phase,
                // Valor del historico del valor global (Directa)
                overall,
                // Valor del historico de velocidad
                velocity;

            amplitude = [];
            phase = [];
            overall = [];
            velocity = [];
            for (i = 0; i < historicalRange.length; i += 1) {
                timeStamp = new Date(historicalRange[i]).getTime();
                amplitude.push(subVariableHTList[_subVariableIdObj["amplitude"]][timeStamp]);
                phase.push(subVariableHTList[_subVariableIdObj["phase"]][timeStamp]);
                velocity.push(subVariableHTList[_subVariableIdObj["velocity"]][timeStamp]);
                if (_subVariableIdObj["overall"]) {
                    overall.push(subVariableHTList[_subVariableIdObj["overall"]][timeStamp]);
                } else {
                    overall.push(0);
                }
            }
            
            startDate = new Date(historicalRange[0]);
            endDate = new Date(historicalRange[historicalRange.length - 1]);
            txt = "<b style=\"color:" + _msColor + ";\">" + _measurementPoint.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
            txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
            txt += "(" + formatDate(startDate) + " - " + formatDate(endDate) + ")";
            _ampReference = _measurementPoint.CompAmp1X;
            _phaReference = _measurementPoint.CompPhase1X;
            _compensated = (_ampReference !== 0.0 && _phaReference !== 0.0) ? true : false;
            txt += (_compensated) ? ", Ref: " + _ampReference.toFixed(2) + "&ang;+" + _phaReference.toFixed(2) + "&deg;" : "";
            $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);

            _refresh(amplitude, phase, overall, velocity, _chartAmplitude, _chartPhase);

            _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                var
                    row,
                    ampSubVar;

                if (!isNaN(currentTimeStamp)) {
                    if (subVariableHTList[_subVariableIdObj["amplitude"]][currentTimeStamp]) {
                        ampSubVar = clone(subVariableHTList[_subVariableIdObj["amplitude"]][currentTimeStamp]);
                    }
                    for (row = 0; row < _chartAmplitude.file_.length; row += 1) {
                        if (_chartAmplitude.file_[row][1] === ampSubVar.Value) {
                            _chartPhase.setSelection(row);
                            _cursorLock = true;
                            _cursor.followCursor(_chartPhase.selPoints_);
                            break;
                        }
                    }
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
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {String} data Informacion obtenida del poll
         */
        _refresh = function (amplitude, phase, overall, velocity, chartAmp, chartPhase) {
            var
                currentRpm,
                ampData,
                phaData,
                phaseValues,
                phaseRange,
                step,
                index,
                refX, refY,
                refAmp, refPhase,
                currentX, currentY,
                i;

            currentRpm = -1;
            _maxRpm = 0;
            _buffer = [];
            ampData = [];
            phaData = [];
            phaseValues = [];

            if (phase.length > 0) {
                phaseValues[0] = phase[0].Value;
            }

            for (i = 0; i < amplitude.length; i += 1) {
                //if (currentRpm !== velocity[i].Value) {
                    currentRpm = velocity[i].Value;
                    refAmp = null;
                    refPhase = null;

                    if (i >= 1) {
                        step = phase[i].Value - phaseValues[i - 1];
                        phaseValues[i] = phase[i].Value;
                        if (step > 0) {
                            if (Math.abs(step) > 40 && (phase[1].Value - phase[0].Value) < 0) {
                                phaseValues[i] -= 360;
                            }
                        } else {
                            if (Math.abs(step) > 40 && (phase[1].Value - phase[0].Value) > 0) {
                                phaseValues[i] += 360;
                            }
                        }
                    }

                    if (_compensated) {
                        refX = _ampReference * Math.cos(_phaReference * Math.PI / 180);
                        refY = _ampReference * Math.sin(_phaReference * Math.PI / 180);
                        currentX = amplitude[i].Value * Math.cos(phaseValues[i] * Math.PI / 180) - refX;
                        currentY = amplitude[i].Value * Math.sin(phaseValues[i] * Math.PI / 180) - refY;
                        refAmp = Math.sqrt(currentX * currentX + currentY * currentY);
                        refPhase = Math.atan2(currentY, currentX) * 180 / Math.PI;
                        refPhase = (refPhase < 0) ? refPhase + 360 : refPhase;
                    }
                    ampData.push([currentRpm, amplitude[i].Value, overall[i].Value, refAmp]);
                    phaData.push([currentRpm, phaseValues[i], refPhase]);
                    _buffer.push({
                        amplitude: amplitude[i].Value,
                        phase: phaseValues[i],
                        compAmp: refAmp,
                        compPha: refPhase,
                        overall: overall[i].Value,
                        velocity: currentRpm,
                        timeStamp: formatDate(new Date(amplitude[i].TimeStamp + "+00:00"))
                    });
                    _maxRpm = (currentRpm > _maxRpm) ? currentRpm : _maxRpm;
                //}
            }

            //var minVal = phaseValues.min();
            //if (minVal < 0) {
            //    for (i = 0; i < phaseValues.length; i += 1) {
            //        phaData[i][1] = phaseValues[i] + 360;
            //        _buffer[i].phase = phaseValues[i] + 360;
            //        phaseValues[i] += 360;
            //    }
            //}

            index = ej.DataManager(velocity).executeLocal(new ej.Query().select("Value")).indexOf(_maxRpm);

            if (index === 0) {
                // Parada
                _buffer.reverse();
                amplitude.reverse();
                phase.reverse();
                overall.reverse();
                velocity.reverse();
            } else if (index === (phase.length - 1)) {
                // Arranque
            } else {
                // Arranque + Parada
                //=> Aqui ya miro si lo desfaso 360 basado en el rango maximo del phaseValues
                var xx = phaseValues[0];
                var yy = phaseValues[index];
                if (Math.abs(xx - yy) < 200) {
                    for (i = index + 1; i < phaData.length; i += 1) {
                        phaData[i][1] = phaseValues[i] + 360;
                        _buffer[i].phase = phaseValues[i] + 360;
                        phaseValues[i] += 360;
                    }
                }
            }

            _maxRpm += 50;
            chartAmp.is_initial_draw_ = true;
            chartAmp.dateMaxWindow_ = [0, _maxRpm];
            chartAmp.updateOptions({
                "file": ampData,
                "dateWindow": [0, _maxRpm]
            });
            chartPhase.is_initial_draw_ = true;
            chartPhase.dateMaxWindow_ = [0, _maxRpm];

            //if (phaseValues.min() < 0) {
            //    phaseRange = [380, -380];
            //} else {
            //    phaseRange = [380, 0];
            //}

            chartPhase.updateOptions({
                "file": phaData,
                "dateWindow": [0, _maxRpm],
                "valueRange": phaseRange
            });
            _createAnnotations();
            if (_mouseover) {
                chartAmp.mouseMove_(_lastMousemoveEvt);
                chartPhase.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(chartAmp, 0, 0);
                DygraphOps.dispatchMouseMove(chartPhase, 0, 0);
            }
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
                                series: _seriesName[0],
                                x: _annotations[i].x,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm,
                                text: _annotations[i].rpm,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _seriesName[0],
                                x: _annotations[i].x,
                                width: 30,
                                height: 14,
                                shortText: _annotations[i].rpm,
                                text: _annotations[i].rpm,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _seriesName[1],
                                x: _buffer[i].velocity,
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
                            annotationsPha.push({
                                series: _seriesName[0],
                                x: _annotations[i].x,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _seriesName[0],
                                x: _annotations[i].x,
                                width: 32,
                                height: 14,
                                shortText: _annotations[i].time.split(" ")[1],
                                text: _annotations[i].time,
                                tickHeight: 0,
                                cssClass: "rpmChangesAnnotation"
                            });
                            annotationsAmp.push({
                                series: _seriesName[1],
                                x: _buffer[i].velocity,
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

        this.Show = function (measurementPointId, currentColor, historicalRange, rpmPositions) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
                rotn,
                // Sensor de referencia angular
                angularReference,
                // SubVariable global configurada en el sistema
                overallSubVariable,
                // SubVariable de amplitud 1X configurada en el sistema
                amp1xSubVariable,
                // SubVariable de fase 1X configurada en el sistema
                pha1xSubVariable,
                // SubVariable de velocidad de la referencia angular
                velocitySubVariable,
                // Label de Amplitud
                labelAmp,
                // Label de Fase
                labelPha,
                // Menu de opciones para la grafica
                settingsMenu,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                overallUnits;

            switch (_timeMode) {
                case 0: // RT
                    _measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;
                    break;
                case 1: // HT
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
                    break;
                default:
                    break;
            }
            // Referencia angular.
            angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false)
            )[0];
            if (!angularReference) {
                popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                return;
            }

            rotn = (angularReference.RotationDirection == 1) ? "CW" : "CCW";
            subVariables = _measurementPoint.SubVariables;
            // SubVariables necesarias para la grafica.
            amp1xSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0];
            pha1xSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 6, false))[0];
            overallSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
            if (angularReference) {
                velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
            }
            if (!pha1xSubVariable || !amp1xSubVariable || !velocitySubVariable) {
                var msgError = "No existen subvariables configuradas para ";
                msgError += (!velocitySubVariable) ? "velocidad, " : "";
                msgError += (!pha1xSubVariable) ? "fase, " : "";
                msgError += (!amp1xSubVariable) ? "amplitud, " : "";

                popUp("info", msgError.slice(0, -2) + " 1X.");
                return;
            }

            _subVariableIdObj["amplitude"] = amp1xSubVariable.Id;
            _subVariableIdObj["phase"] = pha1xSubVariable.Id;
            _subVariableIdObj["velocity"] = velocitySubVariable.Id;
            if (overallSubVariable) {
                _subVariableIdObj["overall"] = overallSubVariable.Id;
                overallUnits = overallSubVariable.Units;
            }

            _msColor = currentColor;
            _seriesName = ["1X", "Directa"];
            // Agregamos los items al menu de opciones para la grafica.
            settingsMenu = [];
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
                timeMode: _timeMode,
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
                    _dragAndResizeGrid = !_dragAndResizeGrid;
                    var gridStack = $(".grid-stack").data("gridstack");
                    var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    gridStack.movable(grid, _dragAndResizeGrid);
                    //gridStack.resizable(grid, _dragAndResizeGrid);
                }
            });

            labelAmp = ["RPM", _seriesName[0], _seriesName[1], "1XComp"];
            labelPha = ["RPM", _seriesName[0], "1XComp"];

            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Construir y mostrar grafica.
            _buildGraph(labelAmp, labelPha, overallUnits, historicalRange, rpmPositions);
        };

        this.Close = function () {
            if (_playerSubscription) {
                // Eliminar suscripcion de reproductor.
                _playerSubscription.remove();
            }

            var grid, el;
            if (_chartAmplitude) {
                _chartAmplitude.destroy();
            }
            if (_chartPhase) {
                _chartPhase.destroy();
            }
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();
        };
    };

    return BodeGraph;
})();