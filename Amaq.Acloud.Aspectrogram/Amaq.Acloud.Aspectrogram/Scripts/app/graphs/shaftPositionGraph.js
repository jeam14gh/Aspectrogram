/*
 * shaftPositionGraph.js
 * Gestiona todo lo relacionado a la grafica de posicion del eje (shaft centerline).
 * @author Jorge Calderon
 */

/* globals Dygraph, ImageExport, createTableToExcel, tableToExcel, formatDate, parseAng, AspectrogramWidget,
   clone, globalsReport, ej, mainCache, AjaxErrorHandling, HistoricalTimeMode, aidbManager, popUp,
   GetOrbitFull, PublisherSubscriber, isEmpty, DygraphOps, selectedMeasurementPoint, selectedAsset*/

var ShaftPositionGraph = {};

ShaftPositionGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ShaftPositionGraph = function (timeMode, width, height, aspectRatio) {
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
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase ShaftPositionGraph
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
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Mantiene la ultima estampa de tiempo que se actualizo en la grafica
            _currentTimeStamp,
            // Bandera que define si se esta realizando un escalado manual o automatico de la grafica
            _autoScale,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Objeto cuyas propiedades corresponden a informacion relacionada a los puntos de medicion (x, y)
            _measurementPoints,
            // Referencia a las subvariables del punto de medicion en X (forma de onda, directa, gap)
            _xSubvariables,
            // Referencia a las subvariables del punto de medicion en Y (forma de onda, directa, gap)
            _ySubvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Valor de referencia de gap del sensor en X
            _gapRefX,
            // Valor de referencia de gap del sensor en Y
            _gapRefY,
            // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
            _rotn,
            // Mantiene en memoria la configuracion en caso de mostrar la orbita
            _orbitConfig,
            // Mantiene en memoria la configuracion del grafico ShaftCenterLine (SCL)
            _clearanceConfig,
            // Mantiene en memoria la informacion necesaria para construir el grafico
            _shaftData,
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
            // Metodo privado que configura los valores maximos y minimos de la grafica basado en los valores graficados y el ancho y alto configurado
            _configureGraphRange,
            // Metodo privado que gestiona la creacion de etiquetas en el grafico
            _createTags,
            // Metodo privado que gestiona la creacion del menu contextual usado para definir la referencia de la grafica
            _createContextMenu,
            // Metodo privado que gestiona la creacion del menu que permite intercambiar los tags a graficar
            _createTagMenu,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo privado que obtine los valores de la orbita a graficar
            _drawOrbit,
            // Metodo privado que realiza el zoom cuadrado necesario para mantener la proporcion del grafico
            _drawZoomSquare,
            // Metodo privado que dibuja el contorno del cojinete
            _drawBoundaries,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Metodo privado que obtiene la informacion relacionada a la orbita de una estampa de tiempo especifica
            _getOrbitData,
            // Metodo privado que obtiene los valores de la posicion del eje a graficar
            _getShaftPositions,
            // Metodo privado que determina si el clic realizo, esta siendo usado para zoom o solo corresponde a la operacion de clic
            _maybeTreatMouseOpAsClick,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que permite configurar el ancho y alto del grid, asi como el contorno del cojinete
            _openSclConfig,
            // Metodo privado que obtiene las coordenadas en X del evento
            _pageX,
            // Metodo privado que obtiene las coordenadas en Y del evento
            _pageY,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que calcula las margenes para que las dimensiones del canvas sean las de un cuadrado
            _setMargins,
            // Metodo privado que gestiona la creacion de un nuevo punto de referencia en el grafico
            _setReferencePoint,
            // Metodo privado que gestiona el mostrar/ocultar la orbita en la grafica
            _showHideOrbit,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que administra los tags o etiquetas de la grafica
            _tagsManagement,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _pause = (timeMode === 0) ? false : true;
        _movableGrid = false;
        _this = this;
        _graphType = "shaft";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _measurementPoints = {};
        _xSubvariables = {};
        _ySubvariables = {};
        _orbitConfig = [];
        _clearanceConfig = {
            enable: false,
            start: clone(clearanceStartPosition.Bottom),
            x: 0,
            y: 0
        };
        _selectedTag = clone(TagTypes.None);
        _gapRefX = 0;
        _gapRefY = 0;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "shaftGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "shaftHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "shaftBody" + _widgetId;
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
            $(ulEl).append("<li id=\"menuShowOrbit" + _widgetId + "\" class=\"menuShowOrbit\">Ver órbita</li>");
            $(ulEl).append("<li id=\"menuHideOrbit" + _widgetId + "\" class=\"disabled\">Ocultar órbita</li>");
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
                    case "menuShowOrbit" + _widgetId:
                        _showHideOrbit(true);
                        break;
                    case "menuHideOrbit" + _widgetId:
                        _showHideOrbit(false);
                        break;
                }
                // Cerramos el menu contextual
                $(_contextMenuContainer).css("display", "none");
            });
        };

        _openSclConfig = function () {
            var
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer,
                i;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 250, height: 250 };
            dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = "configGrid" + _widgetId;
            $("#awContainer").append(configContainer);
            i = "#" + configContainer[0].id + ">div.graphConfigArea>div>form";
            $(i).append("<fieldset><legend>Escala:</legend><div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div></fieldset>");
            $(i + ">fieldset>div>div").append("<div class=\"col-md-6\"><label for=\"xMin" + _widgetId + "\" style=\"font-size:12px;\">" +
                "Xmin</label><input id=\"xMin" + _widgetId + "\" style=\"width:100%;\" type=\"number\" /></div>");
            $(i + ">fieldset>div>div").append("<div class=\"col-md-6\"><label for=\"xMax" + _widgetId + "\" " +
                "style=\"font-size:12px;\">Xmax</label><input id=\"xMax" + _widgetId + "\" style=\"width:100%;\" type=\"number\" /></div>");
            $(i + ">fieldset>div").append("<div class=\"row\"></div>");
            $(i + ">fieldset>div>div:nth-child(2)").append("<div class=\"col-md-6\"><label for=\"yMin" + _widgetId + "\" " +
                "style=\"font-size:12px;\">Ymin</label><input id=\"yMin" + _widgetId + "\" style=\"width:100%;\" type=\"number\" /></div>");
            $(i + ">fieldset>div>div:nth-child(2)").append("<div class=\"col-md-6\"><label for=\"yMax" + _widgetId + "\" " +
                "style=\"font-size:12px;\">Ymax</label><input id=\"yMax" + _widgetId + "\" style=\"width:100%;\" type=\"number\" /></div>");
            $(i).append("<fieldset><legend>Contorno de cojinete:</legend><div class=\"form-group\" " +
                "style=\"margin-bottom:0px;margin-top:10px;\"></div></fieldset>");
            $(i + ">fieldset:nth-child(2)>div").append("<div class=\"row\"><div class=\"col-md-6\"></div><div class=\"col-md-6\"></div></div>");
            $(i + ">fieldset:nth-child(2)>div>div>div:nth-child(1)").append("<label for=\"enableBoundary" + _widgetId + "\" style=\"font-size:12px;\">" +
                "Habilitar</label><input id=\"enableBoundary" + _widgetId + "\" type=\"checkbox\" style=\"width:100%;\" />");
            $(i + ">fieldset:nth-child(2)>div>div>div:nth-child(1)").append("<label for=\"startPosition" + _widgetId + "\" style=\"font-size:12px;\">" +
                "Punto inicial</label><select id=\"startPosition" + _widgetId + "\" style=\"width:100%;\" disabled></select>");
            $(i + ">fieldset:nth-child(2)>div>div>div:nth-child(2)").append("<label for=\"xClearance" + _widgetId + "\" style=\"font-size:12px;\">" +
                "Diametro X</label><input id=\"xClearance" + _widgetId + "\" style=\"width:100%;\" type=\"number\" disabled/>");
            $(i + ">fieldset:nth-child(2)>div>div>div:nth-child(2)").append("<label for=\"yClearance" + _widgetId + "\" style=\"font-size:12px;\">" +
                "Diametro Y</label><input id=\"yClearance" + _widgetId + "\" style=\"width:100%;\" type=\"number\" disabled/>");
            $(i).append("<div class=\"form-group\" style=\"margin-bottom:0px;margin-top:10px;\"><div class=\"row\"></div></div>");
            $(i + ">div:nth-child(3)>div").append("<div style=\"text-align:center;\"></div>");
            $(i + ">div:nth-child(3)>div>div").append("\n<a id=\"btnSave" + _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSave" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $(i + ">div:nth-child(3)>div>div").append("\n<a id=\"btnCancel" + _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancel" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            // Se agregan los valores pre-existentes de las escalas en el grafico
            $("#xMin" + _widgetId).val(Number(_graphRange.xMin.toFixed(2)));
            $("#xMax" + _widgetId).val(Number(_graphRange.xMax.toFixed(2)));
            $("#yMin" + _widgetId).val(Number(_graphRange.yMin.toFixed(2)));
            $("#yMax" + _widgetId).val(Number(_graphRange.yMax.toFixed(2)));
            // Se crea el listado de posiciones iniciales del contorno del cojinete soportados por el sistema
            $("#startPosition" + _widgetId).ejDropDownList({
                watermarkText: "Seleccione",
                dataSource: Object.keys(clearanceStartPosition).map(function (key) {
                    return clearanceStartPosition[key];
                }),
                fields: { id: "Value", text: "Text", value: "Value" },
                selectedIndex: _clearanceConfig.start.Value,
                width: "100%",
                change: function (args) {
                    switch (args.selectedValue) {
                        case clearanceStartPosition.Bottom.Value:
                            _clearanceConfig.start = clone(clearanceStartPosition.Bottom);
                            break;
                        case clearanceStartPosition.Center.Value:
                            _clearanceConfig.start = clone(clearanceStartPosition.Center);
                            break;
                        case clearanceStartPosition.Top.Value:
                            _clearanceConfig.start = clone(clearanceStartPosition.Top);
                            break;
                        case clearanceStartPosition.Left.Value:
                            _clearanceConfig.start = clone(clearanceStartPosition.Left);
                            break;
                        case clearanceStartPosition.Right.Value:
                            _clearanceConfig.start = clone(clearanceStartPosition.Right);
                            break;
                        default:
                            console.log("Valor de posición inicial desconocido.");
                    }
                }
            });
            $("#xClearance" + _widgetId).val(Number(_clearanceConfig.x.toFixed(2)));
            $("#yClearance" + _widgetId).val(Number(_clearanceConfig.y.toFixed(2)));
            // Monitorea los cambios en la opcion del checkbox (habilita/deshabilita)
            $("#enableBoundary" + _widgetId).change(function () {
                if ($(this).prop("checked") === true) {
                    // HABILITA
                    $("#startPosition" + _widgetId).ejDropDownList("enable");
                    $("#xClearance" + _widgetId).prop("disabled", false);
                    $("#yClearance" + _widgetId).prop("disabled", false);
                } else {
                    // DESHABILITA
                    $("#startPosition" + _widgetId).ejDropDownList("disable");
                    $("#xClearance" + _widgetId).prop("disabled", true);
                    $("#yClearance" + _widgetId).prop("disabled", true);
                }
            });
            $("#" + configContainer[0].id + ">div.graphConfigArea").attr("title", "Configurar Grid");
            $("#" + configContainer[0].id + ">div.graphConfigArea").ejDialog({
                enableResize: false,
                title: "Configurar Grid",
                width: "auto",
                height: "auto",
                zIndex: 20000,
                close: function () {
                    $("#startPosition" + _widgetId).ejDropDownList("destroy");
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
                    X: 0,
                    Y: dialogPosition.top
                }
            });
            // Abrir dialogo
            $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
            // Validamos si se deben habilitar los controles de contorno del cojiente
            $("#enableBoundary" + _widgetId).prop("checked", _clearanceConfig.enable).trigger("change");
            // Boton cancelar
            $("#btnCancel" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            // Boton aceptar
            $("#btnSave" + _widgetId).click(function (e) {
                var
                    largest,
                    xDelta,
                    yDelta;

                // Obtenemos los valores maximos y minimos ingresados manualmente
                _graphRange.xMin = Number(Number($("#xMin" + _widgetId).val()).toFixed(2));
                _graphRange.xMax = Number(Number($("#xMax" + _widgetId).val()).toFixed(2));
                _graphRange.yMin = Number(Number($("#yMin" + _widgetId).val()).toFixed(2));
                _graphRange.yMax = Number(Number($("#yMax" + _widgetId).val()).toFixed(2));
                // Configuracion de los valores del contorno del cojinete
                _clearanceConfig.enable = $("#enableBoundary" + _widgetId).prop("checked");
                _clearanceConfig.x = Number(Number($("#xClearance" + _widgetId).val()).toFixed(2));
                _clearanceConfig.y = Number(Number($("#yClearance" + _widgetId).val()).toFixed(2));
                // Validamos que los valores ingresado manualmente sean proporcionales para ambos ejes coordenados
                largest = [(_graphRange.xMax - _graphRange.xMin), (_graphRange.yMax - _graphRange.yMin)].max();
                xDelta = Number(((largest - (_graphRange.xMax - _graphRange.xMin)) / 2).toFixed(2));
                yDelta = Number(((largest - (_graphRange.yMax - _graphRange.yMin)) / 2).toFixed(2));
                // Agregamos el valor delta necesario para igualar ambos ejes coordenados
                _graphRange.xMin -= xDelta;
                _graphRange.xMax += xDelta;
                _graphRange.yMin -= yDelta;
                _graphRange.yMax += yDelta;
                // Indica que se debe ignorar el calcular de forma automatica los limites de la grafica
                _autoScale = false;
                _chart.updateOptions({
                    "valueRange": [_graphRange.yMin, _graphRange.yMax],
                    "dateWindow": [_graphRange.xMin, _graphRange.xMax]
                });
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
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
                labels;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case TagTypes.None.Text + _widgetId:
                case TagTypes.Velocity.Text + _widgetId:
                case TagTypes.TimeStamp.Text +_widgetId:
                    _tagsManagement(target, menuItem);
                    break;
                case "configureGrid" + _widgetId:
                    _openSclConfig();
                    break;
                case "saveImage" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    if (timeMode === 0) {
                        name = "Tiempo Real, Posición del eje: " + _assetData.Name;
                    } else if (timeMode === 1) {
                        name = "Histórico, Posición del eje: " + _assetData.Name;
                    }
                    contId = "tableToExcelShaftGraph" + _widgetId;
                    labels = ["GapX", "GapY"];
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false);
                    tableToExcel("tableToExcelShaftGraph" + _widgetId, name);
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
                case TagTypes.None.Text +_widgetId:
                    _selectedTag = clone(TagTypes.None);
                    break;
                case TagTypes.Velocity.Text +_widgetId:
                    _selectedTag = clone(TagTypes.Velocity);
                    break;
                case TagTypes.TimeStamp.Text +_widgetId:
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
                // Configuracion de las series en el grafico
                series,
                // Contador
                i;

            _createContextMenu();
            _setMargins();
            series = [];
            series[labels[1]] = {
                plotter: function (e) {
                    Dygraph.Plugins.Plotter.prototype.drawSensorPositions(e, _measurementPoints.x.SensorAngle,
                        _measurementPoints.y.SensorAngle, _rotn, _measurementPoints.x.Color, _measurementPoints.y.Color);
                    Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, _rotn);
                    Dygraph.Plugins.Plotter.prototype.smoothPlotter(e, 0.35);
                    _drawBoundaries();
                    _createTags();
                    _drawOrbit();
                }
            };
            _chart = new Dygraph(
                _contentBody,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Amplitud [" + _xSubvariables.overall.Units + "]",
                    ylabel: "Amplitud [" + _ySubvariables.overall.Units + "]",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: labels,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        for (i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === labels[1] && !Number.isNaN(pts[i].yval)) {
                                if (!_shaftData || !_shaftData[pts[i].idx]) {
                                    return;
                                }
                                txt = "<b style=\"color:" + _measurementPoints.x.Color + ";\">" + _measurementPoints.x.Name + "</b>";
                                txt += "&nbsp;Ang:&nbsp;" + parseAng(_measurementPoints.x.SensorAngle) + "&deg; Gap: ";
                                txt += (pts[i].xval < 0 ? "" : "+") + pts[i].xval.toFixed(2) + " " + _xSubvariables.overall.Units;
                                txt += " (" + _shaftData[pts[i].idx].gapX.toFixed(2) + " - (" + _gapRefX.toFixed(2) + ") = ";
                                txt += (_shaftData[pts[i].idx].gapX.toFixed(2) - _gapRefX.toFixed(2)).toFixed(2) + " V)";
                                $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                                txt = "<b style=\"color:" + _measurementPoints.y.Color + ";\">" + _measurementPoints.y.Name + "</b>";
                                txt += "&nbsp;Ang:&nbsp;" + parseAng(_measurementPoints.y.SensorAngle) + "&deg; Gap: ";
                                txt += (pts[i].yval < 0 ? "" : "+") + pts[i].yval.toFixed(2) + " " + _ySubvariables.overall.Units;
                                txt += " (" + _shaftData[pts[i].idx].gapX.toFixed(2) + " - (" + _gapRefY.toFixed(2) + ") = ";
                                txt += (_shaftData[pts[i].idx].gapX.toFixed(2) - _gapRefY.toFixed(1)).toFixed(2) + " V)";
                                $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                                txt = _shaftData[pts[i].idx].velocity.toFixed(0) + " RPM, " + _shaftData[pts[i].idx].timeStamp;
                                if (_shaftData.length > 1) {
                                    txt += " (" + _shaftData[0].timeStamp + " - " + _shaftData[_shaftData.length - 1].timeStamp + ")";
                                }
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
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + ylabel
                        $("#" + _contentBody.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1050);
                        $("#" + _contentBody.id + " .dygraph-ylabel").eq(0).parent().parent().css("z-index", 1050);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _contentBody.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1050);
                        }
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        x: {
                            pixelsPerLabel: 30
                        },
                        y: {
                            pixelsPerLabel: 30,
                            axisLabelWidth: 34
                        }
                    },
                    series: series
                }
            );
            $(".grid-stack-item").on("resizestop", function () {
                setTimeout(function () {
                    _setMargins();
                    _chart.resize();
                }, 100);
            });
            _chart.ready(function () {
                if (timeMode === 1) {
                    _getHistoricalData(timeStampArray);
                }
            });
            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
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
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"gapY" +
                _widgetId + "\" " + "style=\"font-size:12px;\">Gap X:</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"text\" id=\"gapX" +
                _widgetId + "\" " + "name=\"gapX" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-5\"><label for=\"gapY" +
                _widgetId + "\" " + "style=\"font-size:12px;\">Gap Y:</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-7\">" +
                "<input type=\"text\" id=\"gapY" + _widgetId + "\" name=\"gapY" + _widgetId + "\" style=\"width:100%;\" readonly></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\">" +
              "<div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnSave" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSave" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnCancel" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancel" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#gapX" + _widgetId).val(_shaftData[_chart.lastRow_].gapX.toFixed(2)/* + " " + _xSubvariables.gap.Units*/);
            $("#gapY" + _widgetId).val(_shaftData[_chart.lastRow_].gapY.toFixed(2)/* + " " + _ySubvariables.gap.Units*/);
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
                _gapRefX = Number(Number($("#gapX" + _widgetId).val()).toFixed(2));
                _gapRefY = Number(Number($("#gapY" + _widgetId).val()).toFixed(2));
                _autoScale = true;
                _refresh();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
        };

        _showHideOrbit = function (visibility) {
            var
                i, exist,
                idList,
                mdVarList,
                timeStamp;

            if (typeof _chart.selectedRow_ === "undefined") {
                return;
            }
            exist = false;
            for (i = 0; i < _orbitConfig.length; i += 1) {
                if (_orbitConfig[i].row === _chart.selectedRow_) {
                    _orbitConfig[i].visibility = visibility;
                    exist = true;
                    break;
                }
            }
            if (!exist) {
                _orbitConfig.push({
                    row: _chart.selectedRow_,
                    visibility: visibility
                });
            }
            if (visibility && timeMode === 1) {
                idList = [_xSubvariables.waveform.Id, _ySubvariables.waveform.Id];
                mdVarList = [_measurementPoints.x.Id, _measurementPoints.y.Id];
                timeStamp = _shaftData[_chart.selectedRow_].rawTimeStamp.getTime();
                new HistoricalTimeMode().GetSingleDynamicHistoricalData(mdVarList, _assetData.NodeId, idList, timeStamp, _widgetId);
                return;
            }
            _chart.updateOptions({
                "valueRange": _chart.axes_[0].valueRange,
                "dateWindow": _chart.dateWindow_
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
        _updateSelection = function () {
            _chart.cascadeEvents_("select", {
                selectedRow: _chart.lastRow_,
                selectedX: _chart.lastx_,
                selectedPoints: _chart.selPoints_
            });

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
                    // Cordenadas X,Y del evento
                    xyCoords,
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
                    xyCoords = g.eventToDomCoords(e);
                    row = _findClosestPoint(xyCoords[0], xyCoords[1], g.layout_).row;
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
                    }
                    ctx.dragStartX = null;
                    ctx.dragStartY = null;
                } else if (ctx.isPanning) {
                    Dygraph.endPan(e, g, ctx);
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                _chart.selectedRow_ = g.lastRow_;
                $(_contextMenuContainer).css("top", (e.offsetY + _contentBody.offsetTop));
                $(_contextMenuContainer).css("left", (e.offsetX + _contentBody.offsetLeft));
                $(_contextMenuContainer).css("display", "block");
                return false;
            },
            click: function (e, g, ctx) {
                $(_contextMenuContainer).css("display", "none");
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

        _getHistoricalData = function (timeStampArray) {
            var
                idList,
                group,
                i, j, k,
                items,
                tmpData,
                notStored;

            _shaftData = [];
            idList = [_xSubvariables.gap.Id, _ySubvariables.gap.Id];
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
                            TimeStamp: formatDate(new Date(group[i].key)),
                            RawTimeStamp: new Date(group[i].key),
                            Value: items[j].value
                        };
                        k = notStored.indexOf(items[j].subVariableId);
                        notStored.splice(k, 1);
                    }
                    for (j = 0; j < notStored.length; j += 1) {
                        k = idList.indexOf(notStored[j]);
                        tmpData[k] = {
                            TimeStamp: formatDate(new Date(group[i].key)),
                            RawTimeStamp: new Date(group[i].key),
                            Value: null
                        };
                    }
                    // AQUI ES NECESARIO GARANTIZAR LA REGLA DE VARIACION DE DATOS RELEVANTES EN LA GRAFICA
                    if (tmpData[0].Value !== null && tmpData[1].Value !== null) {
                        _shaftData.push({
                            gapX: tmpData[0].Value,
                            gapY: tmpData[1].Value,
                            velocity: tmpData[2].Value,
                            timeStamp: tmpData[0].TimeStamp,
                            rawTimeStamp: tmpData[0].RawTimeStamp
                        });
                    }
                }
                // Ordenamos por estampas de tiempo la informacion
                _shaftData = ej.DataManager(_shaftData).executeLocal(
                    new ej.Query().sortBy("timeStamp", ej.sortOrder.Ascending, false));
                _autoScale = true;
                _refresh();
            });
        };

        _getOrbitData = function (row) {
            var
                // Valores de la forma de onda sin transformar
                u, v,
                // Posiciones de marca de paso
                positions,
                // Datos de la orbita y formas de ondas
                xyData,
                // Angulo en radianes del sensor en X
                phiX,
                // Angulo en radianes del sensor en Y
                phiY,
                // Contadores
                i, j, k,
                // Punto de inicio y fin de la grafica
                start, end,
                // Valores de la transformacion de cordenadas
                x, y;

            u = _orbitConfig[row].xValue;
            v = _orbitConfig[row].yValue;
            positions = _orbitConfig[row].positions;
            if (_rotn === "CW") {
                phiX = _measurementPoints.x.SensorAngle * Math.PI / 180;
                phiY = _measurementPoints.y.SensorAngle * Math.PI / 180;
            } else {
                phiX = -_measurementPoints.x.SensorAngle * Math.PI / 180;
                phiY = -_measurementPoints.y.SensorAngle * Math.PI / 180;
            }
            _orbitConfig[row].laps = (positions.length > _orbitConfig[row].laps) ? _orbitConfig[row].laps : positions.length - 1;
            _orbitConfig[row].laps = (positions.length === 0) ? 1 : _orbitConfig[row].laps;
            xyData = [];
            for (i = 0; i < _orbitConfig[row].laps; i += 1) {
                end = (positions.length > 1) ? positions[i + 1] : u.length;
                //end = (_filtered1x) ? Math.round(end * 0.96) : end;
                start = (positions.length > 1) ? positions[i] : 0;
                for (j = start; j < end; j += 1) {
                    x = -u[j] * Math.sin(phiX) - v[j] * Math.sin(phiY);
                    y = u[j] * Math.cos(phiX) + v[j] * Math.cos(phiY);
                    xyData.push([x, y]);
                }
                xyData.push([null, null]);
            }
            return xyData;
        };

        _drawOrbit = function () {
            var
                ctx,
                orbit,
                i, j,
                xVal,
                yVal;

            if (!_chart) {
                // Caso no se exista aun la referencia al chart
                return;
            }
            ctx = _chart.hidden_ctx_;
            for (i = 0; i < _orbitConfig.length; i += 1) {
                if (!_orbitConfig[i].visibility) {
                    // No es necesario realizar ninguna accion
                    continue;
                }
                orbit = _getOrbitData(i);
                // Grafica los puntos de la orbita
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#4FB25E";
                xVal = _chart.toDomXCoord(orbit[0][0]);
                yVal = _chart.toDomYCoord(orbit[0][1]);
                ctx.moveTo(xVal, yVal);
                for (j = 1; j < orbit.length; j += 1) {
                    if (Number.isNaN(orbit[j][0]) || orbit[j][0] === null) {
                        break;
                    }
                    xVal = _chart.toDomXCoord(orbit[j][0]);
                    yVal = _chart.toDomYCoord(orbit[j][1]);
                    ctx.lineTo(xVal, yVal);
                    ctx.stroke();
                }
                ctx.closePath();
            }
        };

        _drawBoundaries = function () {
            var
                ctx,
                xVal,
                yVal,
                i, j;

            // Validamos si se debe mostrar o no el contorno
            if (!_clearanceConfig.enable) {
                return;
            }
            // Contexto de canvas 2D
            ctx = _chart.hidden_ctx_;
            switch (_clearanceConfig.start.Value) {
                case clearanceStartPosition.Bottom.Value:
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    xVal = (_clearanceConfig.x / 2) * Math.cos(0);
                    yVal = (_clearanceConfig.y / 2) * (Math.sin(0) + 1);
                    xVal = _chart.toDomXCoord(xVal);
                    yVal = _chart.toDomYCoord(yVal);
                    ctx.moveTo(xVal, yVal);
                    for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                        xVal = (_clearanceConfig.x / 2) * Math.cos(i);
                        yVal = (_clearanceConfig.y / 2) * (Math.sin(i) + 1);
                        xVal = _chart.toDomXCoord(xVal);
                        yVal = _chart.toDomYCoord(yVal);
                        if (j === 1) {
                            ctx.lineTo(xVal, yVal);
                            ctx.strokeStyle = "#B3B3B3";
                            ctx.stroke();
                            ctx.closePath();
                            j = -1;
                        } else {
                            ctx.moveTo(xVal, yVal);
                        }
                        j += 1;
                    }
                    ctx.strokeStyle = "#B3B3B3";
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case clearanceStartPosition.Center.Value:
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    xVal = (_clearanceConfig.x / 2) * Math.cos(0);
                    yVal = (_clearanceConfig.y / 2) * (Math.sin(0));
                    xVal = _chart.toDomXCoord(xVal);
                    yVal = _chart.toDomYCoord(yVal);
                    ctx.moveTo(xVal, yVal);
                    for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                        xVal = (_clearanceConfig.x / 2) * Math.cos(i);
                        yVal = (_clearanceConfig.y / 2) * (Math.sin(i));
                        xVal = _chart.toDomXCoord(xVal);
                        yVal = _chart.toDomYCoord(yVal);
                        if (j === 1) {
                            ctx.lineTo(xVal, yVal);
                            ctx.strokeStyle = "#B3B3B3";
                            ctx.stroke();
                            ctx.closePath();
                            j = -1;
                        } else {
                            ctx.moveTo(xVal, yVal);
                        }
                        j += 1;
                    }
                    ctx.strokeStyle = "#B3B3B3";
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case clearanceStartPosition.Top.Value:
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    xVal = (_clearanceConfig.x / 2) * Math.cos(0);
                    yVal = (_clearanceConfig.y / 2) * (Math.sin(0) - 1);
                    xVal = _chart.toDomXCoord(xVal);
                    yVal = _chart.toDomYCoord(yVal);
                    ctx.moveTo(xVal, yVal);
                    for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                        xVal = (_clearanceConfig.x / 2) * Math.cos(i);
                        yVal = (_clearanceConfig.y / 2) * (Math.sin(i) - 1);
                        xVal = _chart.toDomXCoord(xVal);
                        yVal = _chart.toDomYCoord(yVal);
                        if (j === 1) {
                            ctx.lineTo(xVal, yVal);
                            ctx.strokeStyle = "#B3B3B3";
                            ctx.stroke();
                            ctx.closePath();
                            j = -1;
                        } else {
                            ctx.moveTo(xVal, yVal);
                        }
                        j += 1;
                    }
                    ctx.strokeStyle = "#B3B3B3";
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case clearanceStartPosition.Left.Value:
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    xVal = (_clearanceConfig.x / 2) * (Math.cos(0) - 1);
                    yVal = (_clearanceConfig.y / 2) * Math.sin(0);
                    xVal = _chart.toDomXCoord(xVal);
                    yVal = _chart.toDomYCoord(yVal);
                    ctx.moveTo(xVal, yVal);
                    for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                        xVal = (_clearanceConfig.x / 2) * (Math.cos(i) - 1);
                        yVal = (_clearanceConfig.y / 2) * Math.sin(i);
                        xVal = _chart.toDomXCoord(xVal);
                        yVal = _chart.toDomYCoord(yVal);
                        if (j === 1) {
                            ctx.lineTo(xVal, yVal);
                            ctx.strokeStyle = "#B3B3B3";
                            ctx.stroke();
                            ctx.closePath();
                            j = -1;
                        } else {
                            ctx.moveTo(xVal, yVal);
                        }
                        j += 1;
                    }
                    ctx.strokeStyle = "#B3B3B3";
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case clearanceStartPosition.Right.Value:
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    xVal = (_clearanceConfig.x / 2) * (Math.cos(0) + 1);
                    yVal = (_clearanceConfig.y / 2) * Math.sin(0);
                    xVal = _chart.toDomXCoord(xVal);
                    yVal = _chart.toDomYCoord(yVal);
                    ctx.moveTo(xVal, yVal);
                    for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                        xVal = (_clearanceConfig.x / 2) * (Math.cos(i) + 1);
                        yVal = (_clearanceConfig.y / 2) * Math.sin(i);
                        xVal = _chart.toDomXCoord(xVal);
                        yVal = _chart.toDomYCoord(yVal);
                        if (j === 1) {
                            ctx.lineTo(xVal, yVal);
                            ctx.strokeStyle = "#B3B3B3";
                            ctx.stroke();
                            ctx.closePath();
                            j = -1;
                        } else {
                            ctx.moveTo(xVal, yVal);
                        }
                        j += 1;
                    }
                    ctx.strokeStyle = "#B3B3B3";
                    ctx.stroke();
                    ctx.closePath();
                    break;
                default:
                    console.log("Posición de inicio para el gráfico desconocida.");
            }
        };

        /*
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (subVariableIdList) {
            var
                // Estampa de tiempo correspondiente a
                timeStamp;

            subVariableIdList = (timeMode === 0) ? subVariableIdList : [_xSubvariables.waveform.Id, _ySubvariables.waveform.Id];
            // Subscripcion a evento para refrescar datos de grafica segun timeMode
            switch (timeMode) {
                case 0: // Tiempo Real
                    _newDataSubscription = PublisherSubscriber.subscribe("/realtime/refresh", subVariableIdList, function (data) {
                        if (!_pause) {
                            if (!isEmpty(data[_xSubvariables.gap.Id]) && !isEmpty(data[_ySubvariables.gap.Id])) {
                                _shaftData = [];
                                _shaftData[0] = {
                                    gapX: data[_xSubvariables.gap.Id].Value,
                                    gapY: data[_ySubvariables.gap.Id].Value
                                };
                                if (_angularSubvariable) {
                                    _shaftData[0].velocity = data[_angularSubvariable.Id].Value;
                                } else {
                                    _shaftData[0].velocity = 0;
                                }
                                // Informacion de estampa de tiempo mas reciente
                                _shaftData[0].timeStamp = formatDate(new Date(data[_xSubvariables.gap.Id].TimeStamp + "+00:00"));
                                _shaftData[0].rawTimeStamp = new Date(data[_xSubvariables.gap.Id].TimeStamp + "+00:00");
                                // Informacion de las formas de onda correspondientes a la estampa de tiempo mas reciente
                                _xSubvariables.waveform.RawValue = clone(data[_xSubvariables.waveform.Id].RawValue);
                                _xSubvariables.waveform.KeyphasorPositions = clone(data[_xSubvariables.waveform.Id].KeyphasorPositions);
                                _ySubvariables.waveform.RawValue = clone(data[_ySubvariables.waveform.Id].RawValue);
                                _ySubvariables.waveform.KeyphasorPositions = clone(data[_ySubvariables.waveform.Id].KeyphasorPositions);
                                _autoScale = true;
                                _refresh();
                            }
                        }
                    });
                    break;
                case 1: // Historico
                    _newDataSubscription = PublisherSubscriber.subscribe("/historic/refresh", subVariableIdList, function (data) {
                        if (Object.keys(data).length === 0) {
                            return;
                        }
                        if (data[Object.keys(data)[0]].WidgetId !== _widgetId) {
                            return;
                        }
                        timeStamp = _shaftData[_orbitConfig[_orbitConfig.length - 1].row].rawTimeStamp.getTime();
                        if (!isEmpty(data[_xSubvariables.waveform.Id][timeStamp]) && !isEmpty(data[_ySubvariables.waveform.Id][timeStamp])) {
                            _orbitConfig[_orbitConfig.length - 1].xValue = clone(data[_xSubvariables.waveform.Id][timeStamp].RawValue);
                            _orbitConfig[_orbitConfig.length - 1].yValue = clone(data[_ySubvariables.waveform.Id][timeStamp].RawValue);
                            _orbitConfig[_orbitConfig.length - 1].positions = clone(data[_xSubvariables.waveform.Id][timeStamp].KeyphasorPositions);
                            _orbitConfig[_orbitConfig.length - 1].laps = (_orbitConfig[_orbitConfig.length - 1].positions.length > 4)
                                ? 4 : (_orbitConfig[_orbitConfig.length - 1].positions.length - 1);
                            _chart.updateOptions({
                                "valueRange": _chart.axes_[0].valueRange,
                                "dateWindow": _chart.dateWindow_
                            });
                        } else {
                            _orbitConfig[_orbitConfig.length - 1].visibility = false;
                            console.log("No fue posible leer la información dinamica de las formas de onda.");
                        }
                    });
                    break;
            }
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

            if ((timeMode === 0 && _currentTimeStamp !== _shaftData[0].timeStamp) || timeMode === 1) {
                _currentTimeStamp = _shaftData[0].timeStamp;
                xyData = _getShaftPositions();
                txt = "<b style=\"color:" + _measurementPoints.x.Color + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;";
                txt += "Ang:&nbsp;" + parseAng(_measurementPoints.x.SensorAngle) + "&deg;";
                $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                txt = "<b style=\"color:" + _measurementPoints.y.Color + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;";
                txt += "Ang:&nbsp;" + parseAng(_measurementPoints.y.SensorAngle) + "&deg;";
                $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                _chart.updateOptions({
                    "file": xyData,
                    "valueRange": [_graphRange.yMin, _graphRange.yMax],
                    "dateWindow": [_graphRange.xMin, _graphRange.xMax]
                });
                if (_mouseover) {
                    _chart.mouseMove_(_lastMousemoveEvt);
                } else {
                    DygraphOps.dispatchMouseMove(_chart, 0, 0);
                }
            }
        };

        _configureGraphRange = function (xyData) {
            var
                // Seleccion de datos temporal, usado para los valores en X e Y
                arrayData,
                // Valor maximo y minimo en el eje X
                xMax, xMin,
                // Valor maximo y minimo en el eje Y
                yMax, yMin,
                // Mayor valor entre ambos ejes coordenados
                largest,
                // Valor de diferencia del maximo/minimo en X con el mayor valor de ambos ejes
                deltaX,
                // Valor de diferencia del maximo/minimo en Y con el mayor valor de ambos ejes
                deltaY;

            if (_autoScale) {
                // Valores en X
                arrayData = arrayColumn(xyData, 0);
                xMax = arrayData.max();
                xMin = arrayData.min();
                // Valores en Y
                arrayData = arrayColumn(xyData, 1);
                yMax = arrayData.max();
                yMin = arrayData.min();
                // Calculo de valor maximo entre ambos ejes coordenados
                largest = [(xMax - xMin), (yMax - yMin)].max();
                largest = (largest === 0) ? 5 : largest;
                deltaX = (1.2 * largest - (xMax - xMin)) / 2;
                deltaY = (1.2 * largest - (yMax - yMin)) / 2;
                // Definimos los rangos maximos y minimos, tanto del eje X como el eje Y
                _graphRange.xMin = xMin - deltaX;
                _graphRange.xMax = xMax + deltaX;
                _graphRange.yMin = yMin - deltaY;
                _graphRange.yMax = yMax + deltaY;
            }
        };

        _getShaftPositions = function () {
            var
                // Valores X,Y a graficar
                xyData,
                // Sensibilidad del sensor en X
                sensX,
                // Sensibilidad del sensor en Y
                sensY,
                // Angulo del sensor en X, conversion a radianes para operaciones
                phiX,
                // Angulo del sensor en Y, conversion a radianes para operaciones
                phiY,
                // Contador
                i,
                // Valor de la coordenada en X
                x,
                // Valor de la coordenada en Y
                y;

            xyData = [];
            sensX = _measurementPoints.x.Sensibility;
            sensY = _measurementPoints.y.Sensibility;
            if (_rotn === "CW") {
                phiX = _measurementPoints.x.SensorAngle * Math.PI / 180;
                phiY = _measurementPoints.y.SensorAngle * Math.PI / 180;
            } else {
                phiX = -_measurementPoints.x.SensorAngle * Math.PI / 180;
                phiY = -_measurementPoints.y.SensorAngle * Math.PI / 180;
            }
            for (i = 0; i < _shaftData.length; i += 1) {
                x = (-(_shaftData[i].gapX - _gapRefX) * Math.sin(phiX) - (_shaftData[i].gapY - _gapRefY) * Math.sin(phiY)) * 1000 / sensX;
                y = ((_shaftData[i].gapX - _gapRefX) * Math.cos(phiX) + (_shaftData[i].gapY - _gapRefY) * Math.cos(phiY)) * 1000 / sensY;
                xyData.push([x, y]);
            }
            // Configuramos los valores maximos y minimos de la grafica basado en los valores a graficar
            _configureGraphRange(xyData);
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
                    txt = _shaftData[points[0].idx].velocity.toFixed(0);
                    break;
                case TagTypes.TimeStamp.Value:
                    txt = _shaftData[points[0].idx].timeStamp.split(" ")[1];
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
            // Adicionalmente se etiquetan los bucles para un mayor control (loop1 y loop2)
            loop1: for (i = 0; i < points.length; i += 1) {
                domx = points[i].canvasx;
                domy = points[i].canvasy;
                switch (_selectedTag.Value) {
                    case TagTypes.Velocity.Value:
                        txt = _shaftData[points[i].idx].velocity.toFixed(0);
                        break;
                    case TagTypes.TimeStamp.Value:
                        txt = _shaftData[points[i].idx].timeStamp.split(" ")[1];
                        break;
                }
                txtWidth = ctx.measureText(txt).width;
                // VALIDAR SI ESTA ETIQUETA SE MUESTRA O NO
                loop2: for (j = 0; j < showedTags.length; j += 1) {
                    if ((domy > showedTags[j].yMin && domy < showedTags[j].yMax)) {
                        // CASO SE ENCUENTRE ENTRE LAS POSICIONES DE MAXIMO Y MINIMO EN Y,
                        // SERA POSIBLE GRAFICARLO SOLO SI ESTA ALEJADO LO SUFICIENTE EN X
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

        this.Show = function (measurementPointId, currentColor, pairedColor, timeStampArray) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Punto de medicion de referencia en el par (x, y)
                measurementPoint,
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

            switch (timeMode) {
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
            }

            if (measurementPoint.AssociatedMeasurementPointId !== null) {
                subVariableIdList = [];
                if (measurementPoint.Orientation === 1) {
                    // Punto de medicion X
                    _measurementPoints.x = measurementPoint;
                    // Punto de medicion Y.
                    _measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false))[0];
                    // Colores
                    _measurementPoints.x.Color = (timeMode === 0) ? "green" : currentColor;
                    _measurementPoints.y.Color = (timeMode === 0) ? "indigo" : pairedColor;
                } else {
                    // Punto de medicion X
                    _measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false))[0];
                    // Punto de medicion Y
                    _measurementPoints.y = measurementPoint;
                    // Colores
                    _measurementPoints.x.Color = (timeMode === 0) ? "green" : pairedColor;
                    _measurementPoints.y.Color = (timeMode === 0) ? "indigo" : currentColor;
                }
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false))[0];
                if (!angularReference) {
                    popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    _rotn = "CW";
                    //return;
                } else {
                    _rotn = (angularReference.RotationDirection === 1) ? "CW" : "CCW";
                    _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(
                        new ej.Query().where("MeasureType", "equal", 9, false))[0]);
                }
                // SubVariable que corresponde al punto de referencia angular
                if (_angularSubvariable) {
                    subVariableIdList.push(_angularSubvariable.Id);
                }
                // Total subvariables para el punto de medicion en X
                subVariables = _measurementPoints.x.SubVariables;
                // SubVariable que contiene el valor gap en X
                _xSubvariables.gap = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 7, false))[0]);
                if (_xSubvariables.gap) {
                    subVariableIdList.push(_xSubvariables.gap.Id);
                }
                _xSubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_xSubvariables.waveform) {
                    subVariableIdList.push(_xSubvariables.waveform.Id);
                }
                // SubVariable que contiene el valor global del punto de medicion en X
                _xSubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                overallUnits = "";
                if (_xSubvariables.overall) {
                    switch (_xSubvariables.overall.MeasureType) {
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
                    _xSubvariables.overall.Units += overallUnits;
                }
                // Total subvariables para el punto de medicion en Y
                subVariables = _measurementPoints.y.SubVariables;
                // SubVariable que contiene el valor gap en Y
                _ySubvariables.gap = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 7, false))[0]);
                if (_ySubvariables.gap) {
                    subVariableIdList.push(_ySubvariables.gap.Id);
                }
                _ySubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_ySubvariables.waveform) {
                    subVariableIdList.push(_ySubvariables.waveform.Id);
                }
                // SubVariable que contiene el valor global del punto de medicion en X
                _ySubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                _ySubvariables.overall.Units += overallUnits;
                _seriesName = ["Positions"];

                // Agregamos los items al menu de opciones para la grafica
                settingsMenu = [];
                _createTagMenu(settingsMenu, settingsSubmenu);
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Configurar Grid", "configureGrid" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

                /*
                 * Creamos la referencia al AspectrogramWidget.
                 */
                _aWidget = new AspectrogramWidget({
                    widgetId: _widgetId,
                    parentId: "awContainer",
                    content: _container,
                    title: "Posición del eje",
                    width: width,
                    height: height,
                    aspectRatio: aspectRatio,
                    graphType: _graphType,
                    timeMode: timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: subVariableIdList,
                    asset: _assetData.Name,
                    seriesName: _seriesName,
                    measurementPointList: [_measurementPoints.x.Name.replace(/\s/g, ""), _measurementPoints.y.Name.replace(/\s/g, "")],
                    pause: (timeMode === 0) ? true : false,
                    settingsMenu: settingsMenu,
                    onSettingsMenuItemClick: _onSettingsMenuItemClick,
                    onClose: function () {
                        _this.Close();
                    },
                    onPause: function () {
                        _pause = !_pause;
                    },
                    onMove: function () {
                        var
                            grid;

                        _movableGrid = !_movableGrid;
                        grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                        $(".grid-stack").data("gridstack").movable(grid, _movableGrid);
                    }
                });

                labels = ["GapX", "GapY"];
                // Abrir AspectrogramWidget.
                _aWidget.open();
                // Se suscribe a la notificacion de llegada de nuevos datos
                _subscribeToNewData(subVariableIdList);
                // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Construir y mostrar grafica.
                _buildGraph(labels, timeStampArray);
            } else {
                popUp("info", "El punto de medición no tiene asociado ningún par.");
            }
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

            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }
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

    return ShaftPositionGraph;
})();
