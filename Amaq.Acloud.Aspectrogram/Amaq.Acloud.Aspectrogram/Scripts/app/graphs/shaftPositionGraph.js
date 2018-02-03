/*
 * shaftPositionGraph.js
 * Gestiona todo lo relacionado a la grafica de posicion del eje (shaft centerline).
 * @author Jorge Calderon
 */

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
            // Auto-referencia a la clase ShaftPositionGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Listado de subvariables a consultar (para agregar al publish/subscribe)
            _subVariableIdList,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Dimension del cuadrado
            _side,
            // Instancia del control de seleccion sobre el canvas
            _selector,
            // Rango maximo y minimo del grafico, tanto en el eje X como en el eje Y
            _graphRange,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Mantiene la ultima estampa de tiempo que se actualizo en la grafica
            _currentTimeStamp,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Objeto cuyas propiedades corresponden a informacion relacionada a los puntos de medicion (x, y)
            _measurementPoints,
            // Objeto cuyas propiedades corresponden a informacion relacionada a las formas de onda del par de sensores (x, y)
            _gaps,
            // Mantiene en memoria el numero que determina cada cuantos datos se muestran las etiquetas
            _tagVariation,
            // Bandera que define si el click que se realizo fue sobre un punto especifico de la serie
            _pointClick,
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
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            _createAnnotations,
            _gapX,
            _gapY,
            _waveformXId,
            _waveformYId,
            _velocity,
            // Informacion de las anotaciones
            _annotations,
            // Tipo de anotacion a mostrar (0 = Ninguna, 1 = Rpm, 2 = Tiempo)
            _annotationType,
            _startPlot,
            _clearanceX,
            _clearanceY,
            _xGapReference,
            _yGapReference,
            _xColor,
            _yColor,
            _laps,
            _axisTransform,
            // Referencia a la suscripción para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Método privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            _drawOrbit;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _pause = (_timeMode == 0) ? false : true;
        _movableGrid = false;
        _this = this;
        _graphType = "shaft";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _gaps = {};
        _measurementPoints = {};
        _pointClick = false;
        _velocity = [];
        _laps = 1;
        _tagVariation = 1;
        _annotationType = 0; // None

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
                width,
                headerHeigthPercentage;

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
                case "showTagsScl":
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
                            for (i = 0; i < _gapX.length; i += _tagVariation) {
                                _annotations[i] = {
                                    x: _chart.file_[i][0],
                                    y: _chart.file_[i][1],
                                    rpm: _velocity[i].Value,
                                    time: formatDate(new Date(_gapX[i].TimeStamp + "+00:00"))
                                };
                            }
                        } else {
                            _annotations = [];
                        }
                        _createAnnotations();
                    });
                    break;
                case "saveImageShaft" + _widgetId:
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
                        name = "Tiempo Real, Posición del eje" + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Posición del eje" + _assetData.Name;
                    }
                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    labels = ["X", "Y"];
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false)
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);

                    break;
                default:
                    console.log("Opción de menú no implementada.");
                    break;
            }
        };

        /*
         * Construye la grafica, caso no exista
         * @param {Array} labels
         */
        _buildGraph = function (labels, rotn, overallUnits, timeMode, velocity, historicalRange, rpmPositions) {
            var
                // Dato inicial necesario para graficar
                initialData,
                // Dato dinamico por accion de movimiento del mouse sobre la grafica
                dynamicData,
                index,
                refGapX,
                refGapY,
                gapX,
                gapY,
                gapValue,
                // Menu contextual
                contextMenuContainer,
                // Elementos del menu
                ulEl,
                refGap,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition;

            contextMenuContainer = document.createElement("div");
            contextMenuContainer.id = "shaftCtxMenu" + _widgetId;
            contextMenuContainer.className = "customContextMenu";
            ulEl = document.createElement("ul");
            $(ulEl).append("<li id=\"menuReferencePoint" + _widgetId + "\" class=\"menuReferencePoint\">Definir como referencia</li>");
            $(ulEl).append("<li id=\"menuShowOrbit" + _widgetId + "\" class=\"menuShowOrbit\">Ver órbita</li>");
            $(ulEl).append("<li id=\"menuHideOrbit" + _widgetId + "\" class=\"disabled\">Ocultar órbita</li>");
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
                            $("#btnCancelReference").click(function (e) {
                                e.preventDefault();
                                $("#setShaftReference").ejDialog("close");
                                _pointClick = false;
                            });

                            $("#btnSaveReference").click(function (e) {
                                e.preventDefault();
                                if (typeof _chart.selectedRow_ === "undefined") {
                                    return;
                                }
                                var
                                    shaftData,
                                    updateData,
                                    dataManger;

                                _clearanceX = parseFloat($("#xDiameter").val());
                                _clearanceY = parseFloat($("#yDiameter").val());
                                _startPlot = parseFloat($("#StartPointClearance_hidden").val());
                                _xGapReference = _gapX[_chart.selectedRow_].Value;
                                _yGapReference = _gapY[_chart.selectedRow_].Value;

                                $.ajax({
                                    url: "/Home/SetSclOptions",
                                    method: "POST",
                                    data: {
                                        SclOptions: {
                                            XClearance: _clearanceX.toString().replace(".", ","),
                                            YClearance: _clearanceY.toString().replace(".", ","),
                                            XGapReference: _xGapReference.toString().replace(".", ","),
                                            YGapReference: _yGapReference.toString().replace(".", ","),
                                            StartingPoint: isNaN(_startPlot) ? null : _startPlot
                                        },
                                        XMdVariableId: _measurementPoints.x.Id,
                                        YMdVariableId: _measurementPoints.y.Id,
                                    },
                                    success: function (response) {
                                        shaftData = {
                                            gapReferenceX: _xGapReference,
                                            gapReferenceY: _yGapReference,
                                            phiX: _measurementPoints.x.SensorAngle * Math.PI / 180,
                                            phiY: _measurementPoints.y.SensorAngle * Math.PI / 180,
                                            sensibility: _measurementPoints.x.Sensibility,
                                            clearanceX: _clearanceX,
                                            clearanceY: _clearanceY,
                                            startPlot: isNaN(_startPlot) ? 0 : _startPlot
                                        };
                                        _refresh(_gapX, _gapY, _velocity, shaftData, _chart);
                                        updateData = clone(_measurementPoints.x);
                                        updateData.ClearanceStartingPosition = isNaN(_startPlot) ? 0 : _startPlot;
                                        updateData.Clearance = _clearanceX;
                                        updateData.GapReference = _xGapReference;
                                        dataManger = ej.DataManager(mainCache.loadedMeasurementPoints);
                                        dataManger.update("Id", updateData, mainCache.loadedMeasurementPoints);
                                        updateData = clone(_measurementPoints.y);
                                        updateData.ClearanceStartingPosition = isNaN(_startPlot) ? 0 : _startPlot;
                                        updateData.Clearance = _clearanceY;
                                        updateData.GapReference = _yGapReference;
                                        dataManger = ej.DataManager(mainCache.loadedMeasurementPoints);
                                        dataManger.update("Id", updateData, mainCache.loadedMeasurementPoints);
                                        $("#setShaftReference").ejDialog("close");
                                        _pointClick = false;
                                    },
                                    error: function (jqXHR, textStatus) {
                                        console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                                    }
                                });
                            });

                            $("#shaftReferenceName").text(_assetData.Name + " (" + _measurementPoints.x.Name + ", " + _measurementPoints.y.Name + ")");
                            $("#StartPointClearance").ejDropDownList({
                                watermarkText: "Seleccione",
                                selectedIndex: (_startPlot - 1),
                                width: "100%"
                            });

                            $("#xDiameter").val(+_clearanceX);
                            $("#yDiameter").val(+_clearanceY);
                            $("#xReferenceGap").parent().parent().children().children()[0].innerText = "Ref " + _measurementPoints.x.Name;
                            $("#yReferenceGap").parent().parent().children().children()[0].innerText = "Ref " + _measurementPoints.y.Name;
                            $("#xReferenceGap").val(+_chart.selectedXGap_.toFixed(3));
                            $("#yReferenceGap").val(+_chart.selectedYGap_.toFixed(3));
                            $("#StartPointClearance_wrapper").css("display", "inline-block");
                            $("#StartPointClearance_wrapper").css("vertical-align", "middle");
                            $("#setShaftReferenceAreaDialog").css("display", "block");
                            widgetWidth = $("#" + _container.id).width();
                            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                            dialogSize = { width: 350, height: 355 };
                            dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                            $("#setShaftReference").ejDialog({
                                enableResize: false,
                                width: dialogSize.width,
                                height: dialogSize.height,
                                zIndex: 2000,
                                close: function () {
                                    $("#btnCancelReference").off("click");
                                    $("#btnSaveReference").off("click");
                                    _pointClick = false;
                                },
                                content: "#setShaftReferenceAreaDialog",
                                actionButtons: ["close", "collapsible"],
                                position: {
                                    X: dialogPosition.left,
                                    Y: dialogPosition.top
                                }
                            });

                            $("#setShaftReference").ejDialog("open");
                            _pointClick = true;
                            break;
                        case "menuShowOrbit" + _widgetId:
                            $("#btnCancelShowOrbit").click(function (e) {
                                e.preventDefault();
                                $("#showOrbitArea").ejDialog("close");
                                _pointClick = false;
                            });

                            $("#btnSaveShowOrbit").click(function (e) {
                                e.preventDefault();
                                if (typeof _chart.selectedRow_ === "undefined") {
                                    return;
                                }
                                var
                                    resp,
                                    i, j,
                                    subVar,
                                    timeStamp,
                                    subVariableIdList,
                                    shaftData;

                                _laps = parseInt($("#orbitLapsOnShaft").val());
                                if (_laps < 1) {
                                    return;
                                }
                                switch (timeMode) {
                                    case 0:
                                        subVariableIdList = clone(_subVariableIdList);
                                        // Eliminar de la cache las subVariables a consultar en el servidor
                                        _aWidget.manageCache(_subVariableIdList, "delete");
                                        // Remover las subvariables especificadas dentro de la suscripcion
                                        _subscription.detachItems(subVariableIdList);
                                        _subVariableIdList = subVariableIdList;
                                        _subVariableIdList.pushArray([_waveformXId, _waveformYId]);
                                        // Actualizar en la cache las subVariables a consultar en el servidor
                                        _aWidget.manageCache(_subVariableIdList, "update");
                                        // Agrega las nuevas subvariables a la suscripcion
                                        _subscription.attachItems(_subVariableIdList);
                                        $("#showOrbitArea").ejDialog("close");
                                        $("#menuHideOrbit" + _widgetId).removeClass("disabled");
                                        $("#menuHideOrbit" + _widgetId).addClass("menuHideOrbit");
                                        _pointClick = false;
                                        break;
                                    case 1:
                                        subVariableIdList = [_waveformXId, _waveformYId];
                                        timeStamp = new Date(_gapX[_chart.selectedRow_].TimeStamp + "+00:00").getTime();
                                        new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoints.x.Id, _measurementPoints.y.Id], subVariableIdList, timeStamp, _widgetId);
                                        $("#showOrbitArea").ejDialog("close");
                                        $("#menuHideOrbit" + _widgetId).removeClass("disabled");
                                        $("#menuHideOrbit" + _widgetId).addClass("menuHideOrbit");
                                        _pointClick = false;
                                        //$.ajax({
                                        //    url: "/Home/GetHistoricalData",
                                        //    method: "POST",
                                        //    data: {
                                        //        mdVariableIdList: [_measurementPoints.x.Id, _measurementPoints.y.Id],
                                        //        subVariableIdList: [_waveformXId, _waveformYId],
                                        //        startDate: formatDate(new Date(_gapX[_chart.selectedRow_].TimeStamp + "+00:00"), true),
                                        //        endDate: formatDate(new Date(_gapX[_chart.selectedRow_].TimeStamp + "+00:00"), true),
                                        //        isChangeOfRpm: false
                                        //    },
                                        //    success: function (response) {
                                        //        resp = JSON.parse(response);
                                        //        for (i = 0; i < resp.length; i += 1) {
                                        //            subVar = resp[i].HistoricalBySubVariable;
                                        //            for (j = 0; j < subVar.length; j += 1) {
                                        //                if (subVar[j].SubVariableId === _waveformXId) {
                                        //                    var stream = new StreamParser().GetWaveForm(subVar[j].Historical[0].Value);
                                        //                    var dataItem = {};
                                        //                    if (stream.keyphasor.length > 0) {
                                        //                        dataItem.KeyphasorPositions = stream.keyphasor;
                                        //                    }
                                        //                    dataItem.RawValue = stream.waveform;
                                        //                    _chart.waveformX_ = dataItem;
                                        //                } else if (subVar[j].SubVariableId === _waveformYId) {
                                        //                    var stream = new StreamParser().GetWaveForm(subVar[j].Historical[0].Value);
                                        //                    var dataItem = {};
                                        //                    if (stream.keyphasor.length > 0) {
                                        //                        dataItem.KeyphasorPositions = stream.keyphasor;
                                        //                    }
                                        //                    dataItem.RawValue = stream.waveform;
                                        //                    _chart.waveformY_ = dataItem;
                                        //                }
                                        //            }
                                        //        }
                                        //        _chart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                                        //        _chart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
                                        //        _chart.currentGapX_ = +_chart.file_[_chart.selectedRow_][0].toFixed(2);
                                        //        _chart.currentGapY_ = +_chart.file_[_chart.selectedRow_][1].toFixed(2);

                                        //        shaftData = {
                                        //            gapReferenceX: _xGapReference,
                                        //            gapReferenceY: _yGapReference,
                                        //            phiX: _measurementPoints.x.SensorAngle * Math.PI / 180,
                                        //            phiY: _measurementPoints.y.SensorAngle * Math.PI / 180,
                                        //            sensibility: _measurementPoints.x.Sensibility,
                                        //            clearanceX: _clearanceX,
                                        //            clearanceY: _clearanceY,
                                        //            startPlot: isNaN(_startPlot) ? 0 : _startPlot
                                        //        };
                                        //        _refresh(_gapX, _gapY, _velocity, shaftData, _chart);
                                        //        $("#showOrbitArea").ejDialog("close");
                                        //        $("#menuHideOrbit" + _widgetId).removeClass("disabled");
                                        //        $("#menuHideOrbit" + _widgetId).addClass("menuHideOrbit");
                                        //        _pointClick = false;
                                        //    },
                                        //    error: function (jqXHR, textStatus) {
                                        //        console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                                        //    }
                                        //});
                                        break;
                                    default:
                                        break;
                                }
                            });

                            $("#orbitLapsOnShaft").val(_laps);
                            $("#showOrbitAreaDialog").css("display", "block");
                            widgetWidth = $("#" + _container.id).width();
                            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                            dialogSize = { width: 350, height: 145 };
                            dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                            $("#showOrbitArea").ejDialog({
                                enableResize: false,
                                width: dialogSize.width,
                                height: dialogSize.height,
                                zIndex: 2000,
                                close: function () {
                                    $("#btnSaveShowOrbit").off("click");
                                    $("#btnCancelShowOrbit").off("click");
                                    _pointClick = false;
                                },
                                content: "#showOrbitAreaDialog",
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

                            $("#showOrbitArea").ejDialog("open");
                            _pointClick = true;
                            break;
                        case "menuHideOrbit" + _widgetId:
                            _chart.waveformX_ = undefined;
                            _chart.waveformY_ = undefined;

                            switch (timeMode) {
                                case 0:
                                    subVariableIdList = clone(_subVariableIdList);
                                    // Eliminar de la cache las subVariables a consultar en el servidor
                                    _aWidget.manageCache(_subVariableIdList, "delete");
                                    // Remover las subvariables especificadas dentro de la suscripcion
                                    _subscription.detachItems(subVariableIdList);
                                    _subVariableIdList = subVariableIdList;
                                    index = _subVariableIdList.indexOf(_waveformXId);
                                    if (index > -1) {
                                        _subVariableIdList.splice(index, 1);
                                    }
                                    index = _subVariableIdList.indexOf(_waveformYId);
                                    if (index > -1) {
                                        _subVariableIdList.splice(index, 1);
                                    }
                                    // Actualizar en la cache las subVariables a consultar en el servidor
                                    _aWidget.manageCache(_subVariableIdList, "update");
                                    // Agrega las nuevas subvariables a la suscripcion
                                    _subscription.attachItems(_subVariableIdList);
                                    break;
                                default:
                                    break;
                            }

                            var shaftData = {
                                gapReferenceX: _xGapReference,
                                gapReferenceY: _yGapReference,
                                phiX: _measurementPoints.x.SensorAngle * Math.PI / 180,
                                phiY: _measurementPoints.y.SensorAngle * Math.PI / 180,
                                sensibility: _measurementPoints.x.Sensibility,
                                clearanceX: _clearanceX,
                                clearanceY: _clearanceY,
                                startPlot: isNaN(_startPlot) ? 0 : _startPlot
                            };
                            _refresh(_gapX, _gapY, _velocity, shaftData, _chart);
                            $("#menuHideOrbit" + _widgetId).removeClass("menuHideOrbit");
                            $("#menuHideOrbit" + _widgetId).addClass("disabled");
                            break;
                        default:
                            break;
                    }
                    // Cerramos el menu contextual
                    $(contextMenuContainer).css("display", "none");
                }
            });

            initialData = [];
            initialData.push([0, 0]);
            _customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                var gapVal;
                if (!_pointClick) {
                    gapVal = _axisTransform(_gapX[g.lastRow_].Value, _measurementPoints.x.SensorAngle, _gapY[g.lastRow_].Value, _measurementPoints.y.SensorAngle);
                    _chart.selectedXGap_ = gapVal.x;
                    _chart.selectedYGap_ = gapVal.y;
                    _chart.selectedRow_ = g.lastRow_;
                    $(contextMenuContainer).css("top", (e.offsetY + _contentBody.offsetTop));
                    $(contextMenuContainer).css("left", (e.offsetX + _contentBody.offsetLeft));
                    $(contextMenuContainer).css("display", "block");
                }
                return false;
            };
            _customInteractionModel.click = function (e, g, ctx) {
                $(contextMenuContainer).css("display", "none");
            };

            _setMargins();
            _chart = new Dygraph(
                _contentBody,
                initialData,
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    hideOverlayOnMouseOut: false,
                    axisLabelFontSize: 10,
                    labels: labels,
                    labelsDivWidth: 0,
                    axes: {
                        x: {
                            pixelsPerLabel: 30,
                        },
                        y: {
                            pixelsPerLabel: 30,
                            axisLabelWidth: 32,
                        }
                    },
                    interactionModel: _customInteractionModel,
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        for (var i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === "Positions" && !isNaN(pts[i].yval) && _gapX && _gapY) {
                                dynamicData = "<b style=\"color:" + _xColor + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;Ang:&nbsp;";
                                dynamicData += parseAng(_measurementPoints.x.SensorAngle) + "&deg; Gap: ";
                                dynamicData += (pts[i].xval < 0 ? "" : "+") + pts[i].xval.toFixed(1) + " " + overallUnits;
                                gapX = _gapX[pts[i].idx].Value;
                                gapY = _gapY[pts[i].idx].Value;
                                gapValue = _axisTransform(gapX, _measurementPoints.x.SensorAngle, gapY, _measurementPoints.y.SensorAngle);
                                refGap = _axisTransform(_xGapReference, _measurementPoints.x.SensorAngle, _yGapReference, _measurementPoints.y.SensorAngle);
                                dynamicData += " (" + gapValue.x.toFixed(1) + " - (" + refGap.x.toFixed(1) + ") = ";
                                dynamicData += (gapValue.x.toFixed(1) - refGap.x.toFixed(1)).toFixed(1) + " V)";
                                $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(dynamicData);
                                dynamicData = "<b style=\"color:" + _yColor + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;Ang:&nbsp;";
                                dynamicData += parseAng(_measurementPoints.y.SensorAngle) + "&deg; Gap: ";
                                dynamicData += (pts[i].yval < 0 ? "" : "+") + pts[i].yval.toFixed(1) + " " + overallUnits;
                                dynamicData += " (" + gapValue.y.toFixed(1) + " - (" + refGap.y.toFixed(1) + ") = ";
                                dynamicData += (gapValue.y.toFixed(1) - refGap.y.toFixed(1)).toFixed(1) + " V)";
                                $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(dynamicData);
                                dynamicData = _velocity[pts[i].idx].Value.toFixed(0) + " RPM, ";
                                if (_gapX[pts[i].idx].RawTimeStamp) {
                                    dynamicData += _gapX[pts[i].idx].TimeStamp;
                                } else {
                                    dynamicData += formatDate(new Date(_gapX[pts[i].idx].TimeStamp + "+00:00")) + " (";
                                    dynamicData += formatDate(new Date(_gapX[0].TimeStamp + "+00:00")) + " - ";
                                    dynamicData += formatDate(new Date(_gapX[_gapX.length - 1].TimeStamp + "+00:00")) + ")";
                                }
                                $("#" + _seriesName[0] + _widgetId + " > span").html(dynamicData);
                            }
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    series: {
                        "Positions": {
                            plotter: function (e) {
                                var
                                    thetaA,
                                    thetaB;

                                thetaA = clone(_measurementPoints.x.SensorAngle);
                                thetaB = clone(_measurementPoints.y.SensorAngle);
                                Dygraph.Plugins.Plotter.prototype.drawSensorPositions(e, thetaA, thetaB, rotn, _xColor, _yColor);
                                Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, rotn);
                                Dygraph.Plugins.Plotter.prototype.drawShaftPosition(e, _annotations, _startPlot, _clearanceX, _clearanceY, rotn);
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
                if (timeMode === 1) {
                    _getHistoricalData(velocity, historicalRange, rpmPositions);
                }
            });

            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });

        };

        _axisTransform = function (x, alpha, y, beta) {
            var obj = {};
            alpha = alpha * Math.PI / 180;
            beta = beta * Math.PI / 180;
            obj.x = -x * Math.sin(alpha) - y * Math.sin(beta);
            obj.y = x * Math.cos(alpha) + y * Math.cos(beta);
            return obj;
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
                    var color = _chart.plotter_.colors[pt.name];
                    if (!callback) {
                        callback = Dygraph.Circles.DEFAULT;
                    }
                    ctx.lineWidth = _chart.getNumericOption("strokeWidth", pt.name);
                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;
                    callback.call(_chart, _chart, pt.name, ctx, pt.canvasx, pt.canvasy, color, circleSize, pt.idx);
                }
                ctx.restore();

                _chart.previousVerticalX_ = canvasx;
            }
        };

        _customInteractionModel = {
            mousedown: function (event, g, context) {
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
            },
            mousemove: function (event, g, context) {
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
            },
        };

        _getHistoricalData = function (velocity, historicalRange, rpmPositions) {
            var
                i,
                timeStamp,
                shaftData;

            _gapX = [];
            _gapY = [];
            for (i = 0; i < historicalRange.length; i += 1) {
                timeStamp = new Date(historicalRange[i]).getTime();
                _gapX.push(subVariableHTList[_gaps.x.Id][timeStamp]);
                _gapY.push(subVariableHTList[_gaps.y.Id][timeStamp]);
                if (velocity) {
                    _velocity.push(subVariableHTList[velocity.Id][timeStamp]);
                } else {
                    _velocity.push(0);
                }
            }
            _startPlot = _measurementPoints.x.ClearanceStartingPosition;
            _clearanceX = _measurementPoints.x.Clearance;
            _clearanceY = _measurementPoints.y.Clearance;
            _xGapReference = _measurementPoints.x.GapReference;
            _yGapReference = _measurementPoints.y.GapReference;

            shaftData = {
                gapReferenceX: _xGapReference,
                gapReferenceY: _yGapReference,
                phiX: _measurementPoints.x.SensorAngle * Math.PI / 180,
                phiY: _measurementPoints.y.SensorAngle * Math.PI / 180,
                sensibility: _measurementPoints.x.Sensibility,
                clearanceX: _clearanceX,
                clearanceY: _clearanceY,
                startPlot: _startPlot
            };
            _refresh(_gapX, _gapY, _velocity, shaftData, _chart);
        };

        _drawOrbit = function (waveformX, waveformY, phiX, phiY, gapX, gapY, rotn) {
            if (waveformX && waveformY) {
                var
                    orbit,
                    sum,
                    i, j,
                    ctx,
                    xVal,
                    yVal,
                    signalX,
                    signalY,
                    orbitColor,
                    orbitRotation;

                sum = 0;
                signalX = waveformX.RawValue;
                signalY = waveformY.RawValue;
                // Se inicializan las variables
                ctx = _chart.canvas_ctx_;

                if (!waveformX.KeyphasorPositions) {
                    waveformX.KeyphasorPositions = [];
                    waveformY.KeyphasorPositions = [];
                }
                orbit = GetOrbitFull(signalX, signalY, waveformX.KeyphasorPositions, waveformY.KeyphasorPositions, phiX, phiY, _laps, gapX, gapY).value;
                for (j = 0; j < _laps; j += 1) {
                    // Grafica los puntos de la orbita
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    xVal = _chart.toDomXCoord(orbit[j][0]);
                    yVal = _chart.toDomYCoord(orbit[j][1]);
                    ctx.moveTo(xVal, yVal);
                    for (i = (j + 1) ; i < orbit.length; i += 1) {
                        if (isNaN(orbit[i][0]) || orbit[i][0] === null) {
                            break;
                        }
                        xVal = _chart.toDomXCoord(orbit[i][0]);
                        yVal = _chart.toDomYCoord(orbit[i][1]);
                        ctx.lineTo(xVal, yVal);
                        sum += (orbit[i][0] - orbit[i - 1][0]) * (orbit[i][1] + orbit[i - 1][1]);
                    }
                    orbitRotation = (sum > 0) ? "CW" : "CCW";
                    orbitColor = (orbitRotation == rotn) ? "#008000" : "#FF0000";
                    ctx.strokeStyle = orbitColor;
                    ctx.stroke();
                    ctx.closePath();

                    //Grafica el High Spot de la orbita
                    ctx.beginPath();
                    ctx.fillStyle = orbitColor;
                    xVal = _chart.toDomXCoord(orbit[j][0]);
                    yVal = _chart.toDomYCoord(orbit[j][1]);
                    ctx.arc(xVal, yVal, 4, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.closePath();
                    sum = 0;
                }
            }
        };

        /*
         * Suscribe el chart al dato segun el Modo definido
         */
        _subscribeToRefresh = function (mdVariableIdList, velocity, rotn) {
            switch (_timeMode) {
                case 0: // Tiempo Real
                    _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                        if (!_pause) {
                            var
                                gX,
                                gY,
                                // Datos shaft
                                shaftData;

                            gX = data[_gaps.x.Id];
                            gY = data[_gaps.y.Id];
                            if (gX && gY) {
                                _gapX = [gX];
                                _gapY = [gY];
                                if (velocity) {
                                    _velocity = [data[velocity.Id]];
                                } else {
                                    _velocity = [{ Value: 0 }];
                                }

                                if (data[_waveformXId] && data[_waveformYId]) {
                                    _chart.waveformX_ = data[_waveformXId];
                                    _chart.waveformY_ = data[_waveformYId];
                                    _chart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                                    _chart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
                                    _chart.currentGapX_ = 0;
                                    _chart.currentGapY_ = 0;
                                    if (_chart.selectedRow_ && _chart.file_[_chart.selectedRow_].length > 1) {
                                        _chart.currentGapX_ = +_chart.file_[_chart.selectedRow_][0].toFixed(2);
                                        _chart.currentGapY_ = +_chart.file_[_chart.selectedRow_][1].toFixed(2);
                                    }
                                }

                                _startPlot = _measurementPoints.x.ClearanceStartingPosition;
                                _clearanceX = _measurementPoints.x.Clearance;
                                _clearanceY = _measurementPoints.y.Clearance;
                                _xGapReference = _measurementPoints.x.GapReference;
                                _yGapReference = _measurementPoints.y.GapReference;

                                shaftData = {
                                    gapReferenceX: _xGapReference,
                                    gapReferenceY: _yGapReference,
                                    phiX: _measurementPoints.x.SensorAngle * Math.PI / 180,
                                    phiY: _measurementPoints.y.SensorAngle * Math.PI / 180,
                                    sensibility: _measurementPoints.x.Sensibility,
                                    clearanceX: _clearanceX,
                                    clearanceY: _clearanceY,
                                    startPlot: _startPlot
                                };
                                _refresh(_gapX, _gapY, _velocity, shaftData, _chart);
                            }
                        }
                    });
                    break;
                case 1: // Historico
                    //sDate = new Date(sDate).toISOString();
                    //eDate = new Date(eDate).toISOString();
                    //// Subscripcion a evento para refrescar datos de grafica
                    _subscription = PublisherSubscriber.subscribe("/historic/refresh", [_waveformXId, _waveformYId], function (data) {
                        var
                            waveformX,
                            waveformY,
                            timeStamp,
                            phiX, phiY,
                            gapX, gapY;

                        waveformX = data[_waveformXId];
                        waveformY = data[_waveformYId];
                        for (timeStamp in waveformX) {
                            if (waveformX.hasOwnProperty(timeStamp) && timeStamp !== "WidgetId") {
                                waveformX = waveformX[timeStamp];
                                waveformY = waveformY[timeStamp];
                                break;
                            }
                        }

                        if (waveformX && waveformY) {
                            phiX = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            phiY = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            gapX = clone(subVariableHTList[_gaps.x.Id][timeStamp].Value);
                            gapY = clone(subVariableHTList[_gaps.y.Id][timeStamp].Value);
                            _drawOrbit(waveformX, waveformY, phiX, phiY, gapX, gapY, rotn);
                        }
                    //    if (data[_gaps.x.Id].WidgetId === _widgetId) {
                    //        var
                    //            historicalCount,
                    //            // Datos shaft
                    //            shaftData,
                    //            i;

                    //        _gapX = data[_gaps.x.Id].Historical;
                    //        _gapY = data[_gaps.y.Id].Historical;
                    //        if (_gapX && _gapY) {
                    //            historicalCount = _gapX.length;
                    //            if (velocity) {
                    //                _velocity = data[velocity.Id].Historical;
                    //            } else {
                    //                _velocity = [];
                    //                for (i = 0; i < historicalCount; i += 1) {
                    //                    _velocity[i] = 0;
                    //                }
                    //            }

                    //            _startPlot = _measurementPoints.x.ClearanceStartingPosition;
                    //            _clearanceX = _measurementPoints.x.Clearance;
                    //            _clearanceY = _measurementPoints.y.Clearance;
                    //            _xGapReference = _measurementPoints.x.GapReference;
                    //            _yGapReference = _measurementPoints.y.GapReference;

                    //            shaftData = {
                    //                gapReferenceX: _xGapReference,
                    //                gapReferenceY: _yGapReference,
                    //                phiX: _measurementPoints.x.SensorAngle * Math.PI / 180,
                    //                phiY: _measurementPoints.y.SensorAngle * Math.PI / 180,
                    //                sensibility: _measurementPoints.x.Sensibility,
                    //                clearanceX: _clearanceX,
                    //                clearanceY: _clearanceY,
                    //                startPlot: _startPlot
                    //            };
                    //            _refresh(_gapX, _gapY, _velocity, shaftData, _chart);
                    //        }
                    //    }
                    });
                    //new HistoricalTimeMode().GetHistoricTrend(mdVariableIdList, _subVariableIdList, sDate, eDate, false, _widgetId);
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {Array} gapX Informacion obtenida del poll
         * @param {Array} gapY Informacion obtenida del poll
         * @param {Object} chart Referencia al grafico (necesario para actualizar los valores)
         */
        _refresh = function (gapX, gapY, velocity, shaftData, chart) {
            var
                // Datos a graficar en el chart
                buffer,
                // Descripcion de la grafica
                baseTitle,
                // Largest
                largest,
                delta,
                // Datos globales
                overallData,
                //currentRpm,
                i;

            if ((_timeMode === 0 && _currentTimeStamp !== gapX[0].TimeStamp) || _timeMode === 1) {
                _currentTimeStamp = gapX[0].TimeStamp;
                buffer = GetShaftPosition(gapX, gapY, shaftData);
                if (shaftData.clearanceX !== 0 && shaftData.clearanceY !== 0 && shaftData.startPlot !== 0) {
                    largest = [shaftData.clearanceX / 2, shaftData.clearanceY / 2].max();
                    switch (shaftData.startPlot) {
                        case 1: // Bottom
                            delta = (2 * largest - _clearanceX) / 2;
                            _graphRange.X = [-(largest + 7) - delta, (largest + 7) - delta];
                            delta = (2 * largest - _clearanceY) / 2;
                            _graphRange.Y = [-10 - delta, 2 * largest + 4 - delta];
                            break;
                        case 2: // Center
                            _graphRange.X = [-(largest + 7), (largest + 7)];
                            _graphRange.Y = [-(largest + 7), (largest + 7)];
                            break;
                        case 3: // Top
                            _graphRange.X = [-largest, largest];
                            _graphRange.Y = [-largest, largest];
                            break;
                        case 4: // Left
                            _graphRange.X = [-largest, largest];
                            _graphRange.Y = [-largest, largest];
                            break;
                        case 5: // Right
                            _graphRange.X = [-largest, largest];
                            _graphRange.Y = [-largest, largest];
                            break;
                        default:
                            break;
                    }
                } else {
                    _graphRange.X = buffer.rangeX;
                    _graphRange.Y = buffer.rangeY;
                }
                overallData = "<b style=\"color:" + _xColor + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;";
                overallData += "Ang: " + _measurementPoints.x.SensorAngle + "&deg;";
                $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(overallData);
                overallData = "<b style=\"color:" + _yColor + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;";
                overallData += "Ang: " + _measurementPoints.y.SensorAngle + "&deg;";
                $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(overallData);
                _annotations = [];
                if (_annotationType > 0) {
                    for (i = 0; i < gapX.length; i += 1) {
                        _annotations[i] = {
                            x: buffer.value[i][0],
                            rpm: velocity[i].Value,
                            time: formatDate(new Date(gapX[i].TimeStamp + "+00:00"))
                        };
                    }
                }
                chart.updateOptions({
                    "file": buffer.value,
                    "dateWindow": _graphRange.X,
                    "valueRange": _graphRange.Y,
                });
                _createAnnotations();

                if (_mouseover) {
                    chart.mouseMove_(_lastMousemoveEvt);
                } else {
                    DygraphOps.dispatchMouseMove(chart, 0, 0);
                }
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
                                shortText: _annotations[i].rpm.toFixed(0),
                                text: _annotations[i].rpm.toFixed(2),
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
            if (_chart.waveformX_) {
                if (!_chart.waveformX_.KeyphasorPositions) {
                    return;
                }
            }
            _chart.setAnnotations(annotations);
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
        }

        this.Show = function (measurementPointId, currentColor, pairedColor, historicalRange, rpmPositions) {
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
                    // Unidades del valor global de los puntos de medicion
                    overallUnits,
                    // Subvariable de forma de onda del punto de medicion en X
                    waveformX,
                    // Subvariable de forma de onda del punto de medicion en Y
                    waveformY,
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

                    _xColor = (_timeMode === 0) ? "green" : currentColor;
                    _yColor = (_timeMode === 0) ? "indigo" : pairedColor;
                } else {
                    // Punto de medicion X
                    _measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];

                    // Punto de medicion Y
                    _measurementPoints.y = measurementPoint;

                    _xColor = (_timeMode === 0) ? "green" : pairedColor;
                    _yColor = (_timeMode === 0) ? "indigo" : currentColor;
                }
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false)
                )[0];
                if (!angularReference) {
                    //popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    return;
                }

                rotn = (angularReference.RotationDirection == 1) ? "CW" : "CCW";
                subVariables = _measurementPoints.x.SubVariables;
                // SubVariable que contiene el valor gap en X
                _gaps.x = ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 7, false))[0];
                if (_gaps.x) {
                    _subVariableIdList.push(_gaps.x.Id);
                }
                waveformX = ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
                if (waveformX) {
                    _waveformXId = waveformX.Id;
                }

                subVariables = _measurementPoints.y.SubVariables;
                // SubVariable que contiene el valor gap en Y
                _gaps.y = ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 7, false))[0];
                if (_gaps.y) {
                    _subVariableIdList.push(_gaps.y.Id);
                }
                waveformY = ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
                if (waveformY) {
                    _waveformYId = waveformY.Id;
                }

                velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
                if (velocitySubVariable) {
                    _subVariableIdList.push(velocitySubVariable.Id);
                }

                _seriesName = ["Positions"];
                overallUnits = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0].Units;

                // Agregamos los items al menu de opciones para la grafica
                settingsMenu = [];
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Ver etiquetas...", "showTagsScl"));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageShaft" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));
                //if (timeMode === 0 && waveformX && waveformY) {
                //    _subVariableIdList.pushArray([_waveformXId, _waveformYId]);
                //}

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
                    timeMode: _timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: _subVariableIdList,
                    asset: _assetData.Name,
                    seriesName: _seriesName,
                    measurementPointList: [_measurementPoints.x.Name.replace(/\s/g, ""), _measurementPoints.y.Name.replace(/\s/g, "")],
                    pause: (_timeMode === 0) ? true : false,
                    settingsMenu: settingsMenu,
                    onSettingsMenuItemClick: _onSettingsMenuItemClick,
                    onClose: function () {
                        _this.Close();
                    },
                    onPause: function () {
                        _pause = !_pause;
                    },
                    onMove: function () {
                        _movableGrid = !_movableGrid;
                        var gridStack = $(".grid-stack").data("gridstack");
                        var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                        gridStack.movable(grid, _movableGrid);
                    }
                });

                labels = ["Estampa de tiempo", _seriesName[0]];
                mdVariableListId = [_measurementPoints.x.Id, _measurementPoints.y.Id, angularReference.Id];
                // Abrir AspectrogramWidget.
                _aWidget.open();
                // Se suscribe a la notificacion de llegada de nuevos datos.
                _subscribeToRefresh(mdVariableListId, velocitySubVariable, rotn);
                // Se suscribe a la notificación de aplicación de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Construir y mostrar grafica.
                _buildGraph(labels, rotn, overallUnits, _timeMode, velocitySubVariable, historicalRange, rpmPositions);
            } else {
                popUp("info", "El punto de medición no tiene asociado ningún par.");
            }
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
            }

            if (_resizeChartSubscription) {
                // Eliminar suscripción de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }

            var grid, el;
            if (_chart) _chart.destroy();
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();
        };
    };

    return ShaftPositionGraph;
})();
