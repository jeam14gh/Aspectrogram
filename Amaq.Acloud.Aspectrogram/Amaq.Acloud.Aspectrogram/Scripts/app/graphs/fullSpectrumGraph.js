/*
 * fullSpectrumGraph.js
 * Gestiona todo lo relacionado a la grafica del espectro de la orbita.
 * @author Jorge Calderon
 */

var FullSpectrumGraph = {};

FullSpectrumGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    FullSpectrumGraph = function (timeMode, width, height, aspectRatio) {
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
            // Auto-referencia a la clase SpectrumGraph
            _this,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
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
            _waveforms,
            // Mantiene el valor de la subVariable de global del sensor en X
            _overallXValue,
            // Mantiene el valor de la subVariable de global del sensor en Y
            _overallYValue,
            // Mantiene el valor de la subVariable de velocidad que corresponde a la referencia angular en memoria
            _velocityValue,
            // Tipo de ventaneo con que se grafica el espectro
            _windowing,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Referencia a la suscripción para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Método privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            _subscribeToScaleChart,
            _autoscale,
            _largestY,
            _largestDifference,
            _scaleChartSubscription;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _pause = false;
        _movableGrid = false;
        _this = this;
        _graphType = "fullSpectrum";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _waveforms = {};
        _measurementPoints = {};
        _overallXValue = 0;
        _overallYValue = 0;
        _velocityValue = 0;
        _windowing = windowing.Hanning;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "fullSpectrumGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "fullSpectrumHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "fullSpectrumBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        $(_container).append(_contentBody);

        /*
         * Callback de evento click sobre algun item del menu de opciones
         *@param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var
                target,
                settingsMenuItem;

            target = $(event.currentTarget);
            settingsMenuItem = target.attr("data-value");
            switch (settingsMenuItem) {
                case "saveImageFullSpectrum" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    var contId, name, labels = [];
                    if (timeMode == 0) {
                        name = 'Tiempo Real, Espectro de órbita: ' + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = 'Histórico, Espectro de órbita: ' + _assetData.Name;
                    }
                    contId = 'tableToExcelWaveformGraph' + _widgetId;

                    labels.push(_chart.user_attrs_.xlabel);
                    labels.push("Reverse - " + _chart.user_attrs_.ylabel);
                    labels.push("Forward - " + _chart.user_attrs_.ylabel);
                    
                    createTableToExcel(_container, contId, name, labels, _chart.file_, true)
                    tableToExcel('tableToExcelWaveformGraph' + _widgetId, name);
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
        _buildGraph = function (labels, waveformUnits) {
            var
                // Dato inicial necesario para graficar
                initialData,
                // Personalizacion de los eventos de interaccion dentro de la grafica
                customInteractionModel,
                // Referencia a la clase de sincronizacion de series
                synchronizer,
                i;

            synchronizer = new SerieSynchronizer();
            customInteractionModel = clone(Dygraph.defaultInteractionModel);
            customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                return false;
            };
            customInteractionModel.click = function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            };
            customInteractionModel.dblclick = function (e, g, ctx) {
                g.updateOptions({
                    "valueRange": [-(_largestY + _largestDifference) * 0.02, (_largestY + _largestDifference) * 1.02],
                    "dateWindow": [-(g.file_.length / 2), (g.file_.length / 2)]
                });
            };
            customInteractionModel.mousemove = synchronizer.YReflection;

            //$("<div id=\"plotOpts" + _widgetId + "\"><span>&nbsp;</span></div>").insertBefore("#" + _seriesName[0] + _widgetId);
            var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigthPercentage) + "%";

            initialData = [];
            initialData.push([1, 0, 0]);
            _chart = new Dygraph(
                _contentBody,
                initialData,
                {
                    colors: ["#006ACB", "#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Frecuencia [Hz]",
                    ylabel: "Amplitud",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: labels,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    drawCallback: function (me, initial) {
                        if (initial) {
                            var nDoc;
                            // Esta opcion permite remover el manejador del evento mousemove propio de dygraph
                            // Removemos el manejador para darle manejo personalizado
                            Dygraph.removeEvent(this.mouseEventElement_, "mousemove", this.mouseMoveHandler_);
                            $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().after(function () {
                                nDoc = document.createElement("div");
                                nDoc.id = "Reverse" + _widgetId;
                                nDoc.style.position = $(this).css("position");
                                nDoc.style.top = $(this).css("top");
                                nDoc.style.left = (parseFloat($(this).css("left")) + 20) + "px";
                                nDoc.style.textAlign = "left";
                                nDoc.style.fontSize = "12px";
                                nDoc.style.width = $(this).css("width");
                                nDoc.style.height = $(this).css("height");
                                nDoc.innerHTML = "Reverse";
                                return $(nDoc);
                            });
                            $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().after(function () {
                                nDoc = document.createElement("div");
                                nDoc.id = "Forward" + _widgetId;
                                nDoc.style.position = $(this).css("position");
                                nDoc.style.top = $(this).css("top");
                                nDoc.style.left = "-" + (parseFloat($(this).css("left")) + 20) + "px";
                                nDoc.style.textAlign = "right";
                                nDoc.style.fontSize = "12px";
                                nDoc.style.width = $(this).css("width");
                                nDoc.style.height = $(this).css("height");
                                nDoc.innerHTML = "Forward";
                                return $(nDoc);
                            });
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                        for (i = 0; i < g.selPoints_.length; i += 1) {
                            if (isNaN(g.selPoints_[i].yval)) {
                                g.selPoints_.splice(i, 1);
                            }
                        }
                        Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, p);
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        var
                            dynamicData,
                            i;

                        dynamicData = {};
                        for (i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === "Reverse") {
                                dynamicData.Reverse = "<b>" + pts[i].name + "</b> " + ": " + (pts[i].yval < 0 ? "" : "&nbsp;") + pts[i].yval.toFixed(2) + " ";
                                dynamicData.Reverse += waveformUnits + " @ " + (pts[i].xval < 0 ? "" : "+") + pts[i].xval.toFixed(2) + " Hz&nbsp;&nbsp;";
                            } else {
                                dynamicData.Forward = "<b>" + pts[i].name + "</b> " + ": " + (pts[i].yval < 0 ? "" : "&nbsp;") + pts[i].yval.toFixed(2) + " ";
                                dynamicData.Forward += waveformUnits + " @ " + (pts[i].xval < 0 ? "" : "+") + pts[i].xval.toFixed(2) + " Hz&nbsp;&nbsp;";
                            }
                        }
                        if (dynamicData.Reverse === undefined) {
                            dynamicData.Reverse = "<b>Reverse</b>: -- @ --";
                        }
                        if (dynamicData.Forward === undefined) {
                            dynamicData.Forward = "<b>Forward</b>: -- @ --";
                        }
                        $("#Reverse" + _widgetId).html(dynamicData.Reverse);
                        $("#Forward" + _widgetId).html(dynamicData.Forward);
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    interactionModel: customInteractionModel
                }
            );

            $(".grid-stack-item").on("resizestop", function () {
                var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
                setTimeout(function () {
                    _chart.resize();
                    $("#Reverse" + _widgetId).css("width", _contentBody.style.width);
                    $("#Reverse" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                    $("#Forward" + _widgetId).css("width", _contentBody.style.width);
                    $("#Forward" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                }, 100);
            });

            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });
        };

        /*
         * Suscribe el chart al dato segun el modo definido
         */
        _subscribeToRefresh = function (mdVariableIdList, overallXData, overallYData, velocityId, overallUnits, timeStamp) {
            var
                waveformX,
                waveformY;

            timeStamp = new Date(timeStamp).getTime().toString();
            // Subscripcion a evento para refrescar datos de grafica segun _timeMode
            switch (_timeMode) {
                case 0: // Tiempo Real
                    _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                        waveformX = data[_waveforms.x.Id];
                        waveformY = data[_waveforms.y.Id];
                        if (!isEmpty(waveformX) && !isEmpty(waveformY)) {
                            _overallXValue = clone(data[overallXData.Id].Value);
                            _overallYValue = clone(data[overallYData.Id].Value);

                            _velocityValue = NaN;
                            if (velocityId) {
                                _velocityValue = clone(data[velocityId].Value);
                            }
                            _refresh(waveformX, waveformY, _pause, enableFilter, stopFrecuency, _chart, overallXData, overallYData, overallUnits);
                        }
                    });
                    break;
                case 1: // Historico
                    _subscription = PublisherSubscriber.subscribe("/historic/refresh", _subVariableIdList, function (data) {
                        waveformX = data[_waveforms.x.Id][timeStamp];
                        waveformY = data[_waveforms.y.Id][timeStamp];
                        if (!isEmpty(waveformX) && !isEmpty(waveformY)) {
                            _overallXValue = clone(subVariableHTList[overallXData.Id][timeStamp].Value);
                            _overallYValue = clone(subVariableHTList[overallYData.Id][timeStamp].Value);

                            _velocityValue = NaN;
                            if (velocityId) {
                                _velocityValue = clone(subVariableHTList[velocityId][timeStamp].Value);
                            }
                            _refresh(waveformX, waveformY, _pause, enableFilter, stopFrecuency, _chart, overallXData, overallYData, overallUnits);
                        }
                    });
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoints.x.Id, _measurementPoints.y.Id], _subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!isNaN(currentTimeStamp)) {
                            _velocityValue = NaN;
                            _overallXValue = NaN;
                            _overallYValue = NaN;
                            if (subVariableHTList[velocityId][currentTimeStamp]) {
                                _velocityValue = clone(subVariableHTList[velocityId][currentTimeStamp].Value);
                            }

                            if (subVariableHTList[overallXData.Id][currentTimeStamp]) {
                                _overallXValue = clone(subVariableHTList[overallXData.Id][currentTimeStamp].Value);
                            }
                            if (subVariableHTList[overallYData.Id][currentTimeStamp]) {
                                _overallYValue = clone(subVariableHTList[overallYData.Id][currentTimeStamp].Value);
                            }

                            if (!isEmpty(subVariableHTList[_waveforms.x.Id][currentTimeStamp]) && !isEmpty(subVariableHTList[_waveforms.y.Id][currentTimeStamp])) {
                                waveformX = clone(subVariableHTList[_waveforms.x.Id][currentTimeStamp]);
                                waveformY = clone(subVariableHTList[_waveforms.y.Id][currentTimeStamp]);
                            } else {
                                console.error("No se encontró datos de forma de onda.");
                                return;
                            }

                            _refresh(waveformX, waveformY, false, enableFilter, stopFrecuency, _chart, overallXData, overallYData, overallUnits);
                        }
                    });
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {Array} data Informacion obtenida del poll
         */
        _refresh = function (x, y, pause, isEnabledFilter, fc, chart, overallXData, overallYData, overallUnits) {
            if (!pause) {
                var data, yLabelBase, txt, xFilter, yFilter;
                if (_currentTimeStamp !== x.TimeStamp) {
                    data = GetFullSpectrum(x.RawValue, y.RawValue, x.SampleRate, _waveforms.x.MeasureType, _windowing.Value);
                    yLabelBase = chart.user_attrs_.ylabel.split(" [")[0];
                    _currentTimeStamp = x.TimeStamp;
                    txt = _measurementPoints.x.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ",&nbsp;";
                    txt += overallXData.Name + ": " + _overallXValue.toFixed(2) + " " + overallUnits + ",&nbsp;" + x.TimeStamp;
                    $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                    txt = _measurementPoints.y.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ",&nbsp;";
                    txt += overallYData.Name + ": " + _overallYValue.toFixed(2) + " " + overallUnits + ",&nbsp;" + y.TimeStamp;
                    if (!isNaN(_velocityValue)) {
                        txt += ", " + _velocityValue.toFixed(2) + " RPM";
                    }
                    $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);

                    if (data.length > 0) {
                        _largestY = arrayColumn(data, 1).max();
                    }
                    chart.updateOptions({
                        "file": data,
                        "ylabel": yLabelBase + " [" + overallUnits.split(" ")[0] + "]",
                        "valueRange": [-(_largestY + _largestDifference) * 0.02, (_largestY + _largestDifference) * 1.02]
                    });

                    if (_mouseover) {
                        chart.mouseMove_(_lastMousemoveEvt);
                    } else {
                        DygraphOps.dispatchMouseMove(chart, 0, 0);
                    }
                    chartScaleY.AttachGraph(_graphType, _widgetId, _measurementPoints.x.SensorTypeCode, _largestY);
                }
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

        _subscribeToScaleChart = function () {
            _scaleChartSubscription = PublisherSubscriber.subscribe("/scale/" + _graphType, [_measurementPoints.x.SensorTypeCode], function (data) {
                if (data[_measurementPoints.x.SensorTypeCode]) {
                    if (!_autoscale && data[_measurementPoint.SensorTypeCode] > _largestY) {
                        _largestDifference = data[_measurementPoint.SensorTypeCode] - _largestY;
                        if (_largestDifference === 0) {
                            return;
                        }
                        _chart.updateOptions({
                            "valueRange": [-(_largestY + _largestDifference) * 0.02, (_largestY + _largestDifference) * 1.02]
                        });
                    }
                }
            });
        };

        this.Show = function (measurementPointId, timeStamp) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Punto de medicion de referencia en el par (x, y)
                measurementPoint,
                // Listado de Ids de variables a suscribir
                mdVariableListId,
                // Labels
                labels;

            switch (_timeMode) {
                case 0: // RT
                    measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;

                    // Si el asset no tiene un asdaq asociado, significa que no se están actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    if (!_assetData.AsdaqId && !_assetData.AtrId) {
                        popUp("info", "No hay datos tiempo real para el activo seleccionado.");
                        return;
                    }
                    break;
                case 1: // HT
                    measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", measurementPoint.ParentId, false))[0];
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
                    // Concatena las unidades configuradas para la SubVariable de valor global con el tipo de medida (peak-peak, zero-peak, rms)
                    overallUnits,
                    // SubVariable global en X configurada en el sistema
                    overallXSubVariable,
                    // SubVariable global en Y configurada en el sistema
                    overallYSubVariable,
                    // SubVariable de velocidad de la referencia angular
                    velocitySubVariable,
                    // Id de la SubVariable de velocidad
                    velocitySubVariableId;

                if (measurementPoint.Orientation == "X") {
                    // Punto de medicion X
                    _measurementPoints.x = measurementPoint;

                    // Punto de medicion Y.
                    _measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                } else {
                    // Punto de medicion X
                    _measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];

                    // Punto de medicion Y
                    _measurementPoints.y = measurementPoint;
                }
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false)
                )[0];
                if (!angularReference) {
                    popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    //return;
                }

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
                velocitySubVariable = (angularReference) ? ej.DataManager(angularReference.SubVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 9, false))[0] : undefined;

                if (velocitySubVariable) {
                    _subVariableIdList.push(velocitySubVariable.Id);
                    velocitySubVariableId = velocitySubVariable.Id;
                }

                _seriesName = ["Reverse", "Forward"];
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
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageFullSpectrum" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

                /*
                 * Creamos la referencia al AspectrogramWidget.
                 */
                _aWidget = new AspectrogramWidget({
                    widgetId: _widgetId,
                    parentId: "awContainer",
                    content: _container,
                    title: "Espectro de órbita",
                    width: width,
                    height: height,
                    aspectRatio: aspectRatio,
                    graphType: _graphType,
                    timeMode: _timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: _subVariableIdList,
                    asset: _assetData.Name,
                    seriesName: [],
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
                _subscribeToRefresh(mdVariableListId, overallXSubVariable, overallYSubVariable, velocitySubVariableId, overallUnits, timeStamp);
                // Se suscribe a la notificación de aplicación de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Se suscribe a la notificacion escala en Y por mayor valor.
                _subscribeToScaleChart();
                // Construir y mostrar grafica.
                _buildGraph(labels, overallUnits);
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

            $.each(globalsReport.elemDygraph, function (i) {
                if (globalsReport.elemDygraph[i].id === _container.id) {
                    globalsReport.elemDygraph.splice(i, 1);
                    return false;
                }
            });

            var grid, el;
            if (_chart) _chart.destroy();
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();
            _pause = true;
        };
    };

    return FullSpectrumGraph;
})();