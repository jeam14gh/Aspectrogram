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
            // Contenedor HTML para el menu contextual
            _contextMenuContainer,
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
            _bodeData,
            // Array que permite gestionar la visualizacion de las diferentes series en la grafica
            _seriesVisibility,
            // Variable que define en que numero de caja se encuentra la fase
            _boxPhaseChart,
            // Tipo de anotacion/label seleccionada para mostrar (Ninguna, Velocidad, Tiempo)
            _selectedTag,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion del reproductor de tendencia
            _playerSubscription,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que gestiona la creacion del menu contextual usado para definir la referencia de la grafica
            _createContextMenu,
            // Metodo privado que gestiona la creacion del menu que permite intercambiar los tags a graficar
            _createTagMenu,
            // Metodo privado que gestiona la creacion de etiquetas en el grafico
            _createTags,
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
            // Agrupa segun los diferentes estados de la maquina (arranque, parada, estable)
            _groupVelocityStates,
            // Metodo privado como manejador de eventos de KeyDown
            _keyDownEventHandler,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona la creacion de un nuevo punto de referencia en el grafico
            _setReferencePoint,
            // Metodo para seleccionar/deseleccioanr las series que se quieran ver en el Bode
            _showHideSeries,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que administra los tags o etiquetas de la grafica
            _tagsManagement,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _movableGrid = false;
        _this = this;
        _graphType = "bode";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _subvariables = {};
        _selectedTag = clone(TagTypes.None);
        _amplitudeReference = 0;
        _phaseReference = 0;
        _cursorLock = false;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "bodeGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "bodeHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "bodeBody" + _widgetId;
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
                i,
                data;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "showSeries":
                    _showHideSeries();
                    break;
                case TagTypes.None.Text + _widgetId:
                case TagTypes.Velocity.Text + _widgetId:
                case TagTypes.TimeStamp.Text + _widgetId:
                    _tagsManagement(target, menuItem);
                    break;
                case "saveImage" + _widgetId:
                    imgExport = new ImageExport(_chartAmplitude, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" +_widgetId:
                    var serieVisible = _seriesVisibility;
                    labels = _chartAmplitude.getLabels(); // Obtenemos los labes del char de amplitud
                    var labelsPhase = _chartPhase.getLabels(); // Obtenemos los lables del char de fase
                    data = JSON.parse(JSON.stringify(_chartAmplitude.file_));
                    var dataPhase = JSON.parse(JSON.stringify(_chartPhase.file_));

                    // Si la Directa está desmarcada se elimina ese elemento del labels
                    if (!serieVisible[2].Visible) {
                        labels.pop();
                    }

                    // Si la 1XComp está marcada se elimina la 1X y se agrega FaseCompensada, sino hace lo contrario
                    if (serieVisible[1].Visible) {
                        labels.removeAt(1);
                        labels.push(labelsPhase[2]);
                    } else {
                        labels.removeAt(2);
                        labels.push(labelsPhase[1]);
                    }

                    // Recorremos el "data" para organizarlo dependiendo de la configuración Series del gráfico.
                    for (var a = 0; a < data.length; a++) {
                        if (!serieVisible[2].Visible) { // Directa está desmarcada
                            data[a].removeAt(3); // Elimina directa
                        }

                        if (serieVisible[1].Visible) { // 1XComp está marcada
                            data[a].removeAt(1); // Elimina 1X
                            data[a].push(dataPhase[a][2]); // Agrega FaseCompensada                            
                        } else {
                            data[a].removeAt(2); // Elimina 1XComp
                            data[a].push(dataPhase[a][1]); // Agrega fase                         
                        }
                    }

                    name = "Histórico, Bode : " + _assetData.Name;
                    contId = "tableToExcelBodeGraph" + _widgetId;
                    createTableToExcel(_container, contId, name, labels, data, true);
                    tableToExcel("tableToExcelBodeGraph" + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
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
            _chartAmplitude.updateOptions({
                "valueRange": _chartAmplitude.axes_[0].valueRange,
                "dateWindow": _chartAmplitude.dateWindow_
            });
            _chartPhase.updateOptions({
                "valueRange": _chartPhase.axes_[0].valueRange,
                "dateWindow": _chartPhase.dateWindow_
            });
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labelsAmp, labelsPha, timeStampArray, rpmPositions) {
            var
                // Contador
                i,
                // Texto a mostrar de forma dinamica
                txt,
                // Valor de la altura del rotulo de la grafica
                headerHeigth,
                // Valor de la fase aplicada la compensacion
                phaseCompensate;

            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            _cursor = new Cursors(null);
            _createContextMenu();
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
                    case _subvariables.overall.Name:
                        _seriesVisibility[2] = {
                            Id: 2,
                            Name: _seriesName[i],
                            Visible: true
                        };
                        break;
                    default:
                        console.log("Serie desconocida.");
                }
            }
            _chartPhase = new Dygraph(
                _phaseContainer,
                [[0, 0, 0]],
                {
                    colors: ["#006ACB", "#002547"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    avoidMinZero: true,
                    xRangePad: 1,
                    ylabel: "Fase [" + _subvariables.phase.Units + "]",
                    labels: labelsPha,
                    labelsDivWidth: 0,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row) {
                        if (_cursorLock) {
                            return;
                        }
                        _lastIdx = pts[0].idx;
                        _cursor.followCursor(pts);
                        for (i = 0; i < pts.length; i += 1) {
                            if (!_bodeData || !_bodeData[pts[i].idx]) {
                                return;
                            }
                            if (!Number.isNaN(pts[i].yval) && (pts[i].name === labelsPha[1] || pts[i].name === labelsPha[2])) {
                                phaseCompensate = _bodeData[pts[i].idx].phase - _phaseReference;
                                phaseCompensate = (phaseCompensate < 0) ? phaseCompensate + 360 : phaseCompensate;
                                if (_amplitudeReference > 0 && _phaseReference > 0) {
                                    txt = _seriesVisibility[1].Name;
                                } else {
                                    txt = _seriesVisibility[0].Name;
                                }
                                txt += ": " + (_bodeData[pts[i].idx].amplitude - _amplitudeReference).toFixed(2) + " ";
                                txt += _subvariables.overall.Units + " &ang;" + phaseCompensate.toFixed(2) + "&deg;";
                                if (_amplitudeReference > 0 && _phaseReference > 0) {
                                    txt += "&nbsp;(<span style=\"color:#002547;font-weight:bold;\">" + _amplitudeReference.toFixed(2);
                                    txt += " &ang;" + _phaseReference.toFixed(2) + "&deg;</span>)";
                                }
                                txt += ",&nbsp;" + _bodeData[pts[i].idx].velocity.toFixed(0) + " RPM, " + _bodeData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
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
                    visibility: [true, false]
                }
            );
            _chartAmplitude = new Dygraph(
                _ampContainer,
                [[0, 0, 0, 0]],
                {
                    colors: ["#006ACB", "#002547", "#008000"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    avoidMinZero: true,
                    xRangePad: 1,
                    xlabel: "RPM",
                    ylabel: "Amplitud [" + _subvariables.overall.Units + "]",
                    labels: labelsAmp,
                    labelsDivWidth: 0,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row) {
                        if (_cursorLock) {
                            return;
                        }
                        _lastIdx = pts[0].idx;
                        _cursor.followCursor(pts);
                        for (i = 0; i < pts.length; i += 1) {
                            if (!_bodeData || !_bodeData[pts[i].idx]) {
                                return;
                            }
                            if (!Number.isNaN(pts[i].yval) && (pts[i].name === labelsAmp[1] || pts[i].name === labelsAmp[2])) {
                                phaseCompensate = _bodeData[pts[i].idx].phase - _phaseReference;
                                phaseCompensate = (phaseCompensate < 0) ? phaseCompensate + 360 : phaseCompensate;
                                if (_amplitudeReference > 0 && _phaseReference > 0) {
                                    txt = _seriesVisibility[1].Name;
                                } else {
                                    txt = _seriesVisibility[0].Name;
                                }
                                txt += ": " + (_bodeData[pts[i].idx].amplitude - _amplitudeReference).toFixed(2) + " ";
                                txt += _subvariables.overall.Units + " &ang;" + phaseCompensate.toFixed(2) + "&deg;";
                                if (_amplitudeReference > 0 && _phaseReference > 0) {
                                    txt += "&nbsp;(<span style=\"color:#002547;font-weight:bold;\">" + _amplitudeReference.toFixed(2);
                                    txt += " &ang;" + _phaseReference.toFixed(2) + "&deg;</span>)";
                                }
                                txt += ",&nbsp;" + _bodeData[pts[i].idx].velocity.toFixed(0) + " RPM, " + _bodeData[pts[i].idx].timeStamp;
                                $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                            } else if (pts[i].name === labelsAmp[3] && !Number.isNaN(pts[i].yval)) {
                                if (!_bodeData || !_bodeData[pts[i].idx]) {
                                    return;
                                }
                                txt = "<span style=\"color:#008000;\">" + _seriesName[1] + "</span>: " + _bodeData[pts[i].idx].overall.toFixed(2);
                                txt += " " + _subvariables.overall.Units + ",&nbsp;" + _bodeData[pts[i].idx].velocity.toFixed(0) + " RPM, ";
                                txt += _bodeData[pts[i].idx].timeStamp;
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
                        _createTags();
                    },
                    visibility: [true, false, true]
                }
            );
            Dygraph.synchronize([_chartAmplitude, _chartPhase], {
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
            configContainer[0].id = _widgetId + "polar";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"amp1x" +
                _widgetId + "\" " + "style=\"font-size:12px;\">Amplitud:</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"text\" id=\"amp1x" +
                _widgetId + "\" " + "name=\"amplitude" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-5\"><label for=\"pha1x" +
                _widgetId + "\" " + "style=\"font-size:12px;\">Fase:</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-7\">" +
                "<input type=\"text\" id=\"pha1x" + _widgetId + "\" name=\"phase" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\">" +
              "<div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnSave" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSave" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnCancel" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancel" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#amp1x" + _widgetId).val(_bodeData[_chartAmplitude.lastRow_].amplitude.toFixed(2));
            $("#pha1x" + _widgetId).val(_bodeData[_chartAmplitude.lastRow_].phase.toFixed(2));
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
                _cursorLock = false;
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            $("#btnSave" + _widgetId).click(function (evt) {
                evt.preventDefault();
                _amplitudeReference = Number(Number($("#amp1x" + _widgetId).val()).toFixed(2));
                _phaseReference = Number(Number($("#pha1x" + _widgetId).val()).toFixed(2));
                if (!_seriesVisibility[1].Visible) {
                    _seriesVisibility[0].Visible = false;
                    _seriesVisibility[1].Visible = true;
                    _chartAmplitude.setVisibility(0, _seriesVisibility[0].Visible);
                    _chartPhase.setVisibility(0, _seriesVisibility[0].Visible);
                }
                _chartAmplitude.setVisibility(1, _seriesVisibility[1].Visible);
                _chartPhase.setVisibility(1, _seriesVisibility[1].Visible);
                _refresh();
                _cursorLock = false;
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
                $(_contextMenuContainer).css("top", (e.offsetY + $(g.canvas_).parent().parent()[0].offsetTop));
                $(_contextMenuContainer).css("left", (e.offsetX + _contentBody.offsetLeft));
                $(_contextMenuContainer).css("display", "block");
                return false;
            },
            click: function (e, g, ctx) {
                var
                    closestPoint,
                    chartArray;

                e.preventDefault();
                $(_contextMenuContainer).css("display", "none");
                //closestPoint = _findClosestPoint(g.eventToDomCoords(e)[0], g.eventToDomCoords(e)[1], g.layout_);
                //_chartAmplitude.selectedRow_ = closestPoint.row;
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
                notStored,
                txt;

            _bodeData = [];
            idList = [_subvariables.overall.Id, _subvariables.amplitude.Id, _subvariables.phase.Id];
            if (_angularSubvariable) {
                idList.push(_angularSubvariable.Id);
            }
            aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, timeStampArray, _assetData.NodeId, function (resp) {
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
                // Agrupar los datos segun: arranque, parada y estado estable, con base a los cambios de velocidad
                _groupVelocityStates();
                // Realizar la graficacion de los datos
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
                X: [minValue - 5, maxValue * 1.01]
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
            for (i = 0; i < _bodeData.length; i += 1) {
                if (Number(_bodeData[i].velocity) === 0) {
                    amplitudeValues[i] = 0;
                } else {
                    amplitudeValues[i] = Number(_bodeData[i].amplitude);
                }
                ampData.push([Number(_bodeData[i].velocity.toFixed(4)), amplitudeValues[i], amplitudeValues[i] - _amplitudeReference, Number(_bodeData[i].overall)]);
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
            if (_bodeData.length > 0) {
                phaseValues[0] = Number(_bodeData[0].phase);
                phaData.push([Number(_bodeData[0].velocity.toFixed(4)), phaseValues[0], phaseValues[0] - _phaseReference]);
            }
            for (i = 1; i < _bodeData.length; i += 1) {
                if (Number(_bodeData[i].velocity) === 0) {
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
                    phaseValues[i] = Number(_bodeData[i].phase + 360 * _boxPhaseChart);
                }
                phaData.push([Number(_bodeData[i].velocity.toFixed(4)), phaseValues[i], phaseValues[i] - _phaseReference]);
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
            txt += "(" + _bodeData[0].timeStamp + " - " + _bodeData[_bodeData.length - 1].timeStamp + ")";
            $("#point" + _measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
            xyData = _getAmplitudeData();
            _graphRange.amplitude = _getValueRanges(xyData);
            _chartAmplitude.is_initial_draw_ = true;
            _chartAmplitude.updateOptions({
                "file": xyData,
                "valueRange": _graphRange.amplitude.Y,
                "dateWindow": _graphRange.amplitude.X
            });
            
            xyData = _getPhaseData();
            _graphRange.phase = _getValueRanges(xyData, true);
            _chartPhase.is_initial_draw_ = true;
            _chartPhase.updateOptions({
                "file": xyData,
                "valueRange": _graphRange.phase.Y,
                "dateWindow": _graphRange.phase.X
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

        _createTags = function () {
            var
                // Variable que contiene el contexto 2D del canvas del chart de amplitud
                ampCtx,
                // Variable que contiene el contexto 2D del canvas del chart de fase
                phaCtx,
                // Puntos visibles en la serie en el chart de amplitud
                ampPoints,
                // Puntos visibles en la serie en el chart de fase
                phaPoints,
                // Contadores
                i, j,
                // Valores X,Y sobre el canvas de cada punto visible en la serie
                domx, domy,
                // Area de graficacion
                area,
                // Texto a mostrar
                txt,
                // Ancho del texto
                txtWidth,
                // Alto del texto
                txtHeight,
                // Array de anotaciones visibles
                showedTags;

            // Caso no se encuentre creado aun el chart, no realizar ninguna accion
            if (!_chartAmplitude) {
                return;
            }
            // Validamos el tipo de tag seleccionado
            if (_selectedTag.Value === TagTypes.None.Value) {
                // No es necesario realizar ninguna accion adicional
                return;
            }
            // Capturamos los contextos tanto del grafico de amplitud, como de fase
            ampCtx = _chartAmplitude.hidden_ctx_;
            phaCtx = _chartPhase.hidden_ctx_;
            // Capturamos los puntos correspondientes a los puntos visibles tanto del grafico de amplitud, como de fase
            ampPoints = _chartAmplitude.layout_.points[0];
            phaPoints = _chartPhase.layout_.points[0];
            // Creamos la primer etiqueta en el primero de todos los puntos
            domx = ampPoints[0].canvasx;
            domy = ampPoints[0].canvasy;
            switch (_selectedTag.Value) {
                case TagTypes.Velocity.Value:
                    txt = _bodeData[ampPoints[0].idx].velocity.toFixed(0);
                    break;
                case TagTypes.TimeStamp.Value:
                    txt = _bodeData[ampPoints[0].idx].timeStamp.split(" ")[1];
                    break;
                default:
                    console.log("Tipo de anotación o label desconocido.");
            }
            area = _chartAmplitude.plotter_.area;
            // Definir los valores de stroke & fill
            ampCtx.strokeStyle = "#000000";
            ampCtx.fillStyle = "#000000";
            phaCtx.strokeStyle = "#000000";
            phaCtx.fillStyle = "#000000";
            txtWidth = ampCtx.measureText(txt).width;
            txtHeight = parseInt(ampCtx.font) * 1.0;
            showedTags = [];
            ampCtx.textAlign = "left";
            phaCtx.textAlign = "left";
            if ((domx) > (area.x) && (domx + txtWidth) < (area.x + area.w)) {
                ampCtx.beginPath();
                ampCtx.strokeText(txt, domx, domy - txtHeight / 2);
                showedTags.push({
                    xMin: domx - 5,
                    xMax: domx + 5 + txtWidth,
                    yMin: domy - 3 * txtHeight / 2 - 5,
                    yMax: domy - txtHeight / 2 + 5
                });
                ampCtx.arc(domx, domy, 2, 0, 2 * Math.PI, false);
                ampCtx.fill();
                ampCtx.stroke();
                ampCtx.closePath();
                // Fase
                domx = phaPoints[0].canvasx;
                domy = phaPoints[0].canvasy;
                phaCtx.beginPath();
                phaCtx.strokeText(txt, domx, domy - txtHeight / 2);
                phaCtx.arc(domx, domy, 2, 0, 2 * Math.PI, false);
                phaCtx.fill();
                phaCtx.stroke();
                phaCtx.closePath();
            }
            // Recorrer todos los puntos para determinar la separacion de los labels basado en la distancia en Y de los puntos
            loop1:
                for (i = 0; i < ampPoints.length; i += 1) {
                    domx = ampPoints[i].canvasx;
                    domy = ampPoints[i].canvasy;
                    switch (_selectedTag.Value) {
                        case TagTypes.Velocity.Value:
                            txt = _bodeData[ampPoints[i].idx].velocity.toFixed(0);
                            break;
                        case TagTypes.TimeStamp.Value:
                            txt = _bodeData[ampPoints[i].idx].timeStamp.split(" ")[1];
                            break;
                    }
                    txtWidth = ampCtx.measureText(txt).width;
                    if ((domx) < (area.x) && (domx + txtWidth) > (area.x + area.w)) {
                        continue loop1;
                    }
                    // Se valida si la etiqueta se debe mostrar o no
                    loop2:
                        for (j = 0; j < showedTags.length; j += 1) {
                            if (domx < showedTags[j].xMax) {
                                continue loop1;
                            }
                        }
                    ampCtx.beginPath();
                    ampCtx.strokeText(txt, domx, domy - txtHeight / 2);
                    showedTags.push({
                        xMin: domx - 5,
                        xMax: domx + 5 + txtWidth,
                        yMin: domy - 3 * txtHeight / 2 - 5,
                        yMax: domy - txtHeight / 2 + 5
                    });
                    ampCtx.arc(domx, domy, 2, 0, 2 * Math.PI, false);
                    ampCtx.fill();
                    ampCtx.stroke();
                    ampCtx.closePath();
                    // Fase
                    domx = phaPoints[i].canvasx;
                    domy = phaPoints[i].canvasy;
                    phaCtx.beginPath();
                    phaCtx.strokeText(txt, domx, domy - txtHeight / 2);
                    phaCtx.arc(domx, domy, 2, 0, 2 * Math.PI, false);
                    phaCtx.fill();
                    phaCtx.stroke();
                    phaCtx.closePath();
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
                    } else {
                        _seriesVisibility[2].Visible = args.isChecked;
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
                e.preventDefault();
                var
                    visibleCheckList,
                    seriesCount;

                e.preventDefault();
                for (i = 0; i < _seriesVisibility.length; i += 1) {
                    _seriesVisibility[i].Visible = false;
                }
                visibleCheckList = $("#seriesCheckList" + _widgetId).ejListBox("getCheckedItems");
                for (i = 0; i < visibleCheckList.length; i += 1) {
                    _seriesVisibility[visibleCheckList[i].index].Visible = true;
                }
                seriesCount = _chartAmplitude.attributes_.labels_.length;
                for (i = 0; i < seriesCount; i += 1) {
                    _chartAmplitude.setVisibility(i, _seriesVisibility[i].Visible);
                }
                seriesCount = _chartPhase.attributes_.labels_.length;
                for (i = 0; i < seriesCount; i += 1) {
                    _chartPhase.setVisibility(i, _seriesVisibility[i].Visible);
                }
                _refresh();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
        };

        /*
        * Agrupar los diferentes estados de velocidad
        */
        _groupVelocityStates = function () {
            var
                velocityArray,
                maxVelocity,
                stable,
                startUp,
                shutDown,
                i;

            velocityArray = arrayColumn(_bodeData, "velocity");
            maxVelocity = velocityArray.max();
            stable = [];
            startUp = [];
            shutDown = [];
            for (i = 1; i < velocityArray.length; i++) {
                if ((velocityArray[i - 1] >= (maxVelocity - 10))) {
                    stable.push(_bodeData[i - 1]);
                    if (i === velocityArray.length - 1) {
                        stable.push(_bodeData[i]);
                    }
                } else {
                    if (velocityArray[i - 1] < velocityArray[i]) {
                        startUp.push(_bodeData[i - 1]);
                        if (i === velocityArray.length - 1) {
                            startUp.push(_bodeData[i]);
                        }
                    } else if (velocityArray[i - 1] > velocityArray[i]) {
                        shutDown.push(_bodeData[i - 1]);
                        if (i === velocityArray.length - 1) {
                            shutDown.push(_bodeData[i]);
                        }
                    }
                }
            }
            // Ordenamos de forma ascendente con base a la velocidad
            _bodeData = ej.DataManager(startUp).executeLocal(
                    new ej.Query().sortBy("velocity", ej.sortOrder.Ascending, false));
            // El estado estable no se ordena de por velocidad, se deja el orden de estampa de tiempo
            _bodeData.pushArray(stable);
            // Ordenamos de forma descendente con base a la velocidad
            _bodeData.pushArray(ej.DataManager(shutDown).executeLocal(
                    new ej.Query().sortBy("velocity", ej.sortOrder.Descending, false)));
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
                // Sub-menu de opciones para los menus que requieren sub-menus asociados
                settingsSubmenu,
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
            _measurementPoint.Color = currentColor;
            // Agregamos los items al menu de opciones para la grafica.
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Series", "showSeries"));
            _createTagMenu(settingsMenu, settingsSubmenu);
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

            labelAmp = ["RPM", "Amplitud", "AmplitudCompensada", _subvariables.overall.Name];
            labelPha = ["RPM", "Fase", "FaseCompensada"];
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Construir y mostrar grafica.
            _buildGraph(labelAmp, labelPha, timeStampArray, rpmPositions);
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