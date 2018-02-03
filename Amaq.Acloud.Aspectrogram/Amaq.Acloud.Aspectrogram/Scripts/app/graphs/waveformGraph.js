/*
 * waveformGraph.js
 * Gestiona todo lo relacionado a la grafica de formas de onda.
 * @author Jorge Calderon
 */
var WaveformGraph = {};

WaveformGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    WaveformGraph = function (timeMode, width, height, aspectRatio) {
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
            // Auto-referencia a la clase SignalGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Referencia a la clase que administra los menus contextuales
            _ctxMenu,
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
            // Punto de medicion de la grafica
            _measurementPoint,
            // Mantiene la subVariable de la forma de onda en memoria
            _waveformSubVariable,
            // Mantiene el valor de la subVariable de global en memoria
            _overallValue,
            // Mantiene el valor de la subVariable de velocidad que corresponde a la referencia angular en memoria
            _velocityValue,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
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
            // Referencia a la suscripción para aplicar filtro dinámico
            _applyFilterSubscription,
            // Método privado que realiza la suscripción al publisher para aplicar filtro dinámico
            _subscribeToApplyFilter,
            // Método privado que aplica filtro dinámico a la forma de onda y refresca el chart
            _applyFilter,
            // Referencia a los últimos datos que se han graficado
            _currentData,
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
        _autoscale = false;
        _this = this;
        _graphType = "waveform";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _ctxMenu = new CustomContextMenu();
        _overallValue = 0;
        _velocityValue = NaN;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "waveformGraph" + _widgetId;
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
                case "saveImageWave" +_widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" +_widgetId:
                    var contId, name, labels = [], data = [];
                    if (timeMode == 0) {
                        name = "Tiempo Real, Forma de Onda : "  + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Forma de Onda : " + _assetData.Name;
                    }
                    contId = "tableToExcelWaveformGraph" + _widgetId;

                    labels.push(_chart.user_attrs_.xlabel);
                    labels.push(_chart.user_attrs_.ylabel);
                    labels.push("Marca de Paso");

                    for (var i = 0; i < _chart.file_.length; i++) {
                        data.push([_chart.file_[i][0], _chart.file_[i][1], '']);
                        for (var j = 0; j < _chart.annotations_.length; j++) {
                            if (_chart.file_[i][0].toFixed(2) == _chart.annotations_[j].x.toFixed(2)) {
                                data[i] = [_chart.file_[i][0], _chart.file_[i][1], _chart.file_[i][1]];
                            }
                        }
                    }
                    createTableToExcel(_container, contId, name, labels, data, true)
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
        _buildGraph = function (labels, waveformUnits) {
            var
            // Dato inicial necesario para graficar
                initialData,
                // Personalizacion de los eventos de interaccion dentro de la grafica
                customInteractionModel,
                headerHeigthPercentage,
                dynamicData;

            customInteractionModel = Dygraph.defaultInteractionModel;
            customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                return false;
            };
            customInteractionModel.click = function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            };

            headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigthPercentage) + "%";

            initialData = [];
            initialData.push([1, 0]);
            _chart = new Dygraph(
                _contentBody,
                initialData, {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 6,
                    legend: "never",
                    xlabel: "Tiempo [ms]",
                    ylabel: "Amplitud",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: labels,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row) {
                        if (pts.length > 0) {
                            dynamicData = "Amplitud: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " " + waveformUnits;
                            dynamicData += ", Tiempo: " + pts[0].xval.toFixed(2) + " ms";
                            dynamicData += isNaN(_velocityValue) ? "" : ", " + _velocityValue.toFixed(0) + " RPM";
                            $("#" + pts[0].name.replace(/\s/g, "") + _widgetId + " > span").html(dynamicData);
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: customInteractionModel,
                    width: 728,
                    height: 367
                }
            );

            $(".grid-stack-item").on("resizestop", function () {
                var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
                setTimeout(function () {
                    _chart.resize();
                }, 200);
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
        _subscribeToRefresh = function (mdVariableIdList, overall, velocity, overallUnits, timeStamp) {
            var
                waveform;

            timeStamp = new Date(timeStamp).getTime().toString();
            // Subscripcion a evento para refrescar datos de grafica segun _timeMode
            switch (_timeMode) {
                case 0: // Tiempo Real
                    _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                        waveform = data[_waveformSubVariable.Id];
                        if (!isEmpty(waveform) && waveform.Value !== null) {
                            _overallValue = clone(data[overall.Id].Value);
                            if (velocity) {
                                _velocityValue = clone(data[velocity.Id].Value);
                            } else {
                                _velocityValue = NaN;
                            }
                            _refresh(waveform, _pause, enableFilter, stopFrecuency, _chart, overallUnits, overall.Name);
                        }
                    });
                    break;
                case 1: // Historico
                    _subscription = PublisherSubscriber.subscribe("/historic/refresh", [_waveformSubVariable.Id], function (data) {
                        waveform = data[_waveformSubVariable.Id][timeStamp];
                        if (!isEmpty(waveform)) {
                            _overallValue = clone(subVariableHTList[overall.Id][timeStamp].Value);
                            if (velocity) {
                                _velocityValue = clone(subVariableHTList[velocity.Id][timeStamp].Value);
                            } else {
                                _velocityValue = NaN;
                            }
                            _refresh(waveform, _pause, enableFilter, stopFrecuency, _chart, overallUnits, overall.Name);
                        }
                    });
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoint.Id], [_waveformSubVariable.Id], timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!isNaN(currentTimeStamp)) {                            
                            waveform = clone(subVariableHTList[_waveformSubVariable.Id][currentTimeStamp]);
                            if (isEmpty(waveform)) {
                                console.error("No se encontró datos de forma de onda.");
                                return;
                            }
                            _velocityValue = NaN;
                            _overallValue = NaN;
                            if (velocity && subVariableHTList[velocity.Id][currentTimeStamp]) {
                                _velocityValue = clone(subVariableHTList[velocity.Id][currentTimeStamp].Value);
                            }
                            if (subVariableHTList[overall.Id][currentTimeStamp]) {
                                _overallValue = clone(subVariableHTList[overall.Id][currentTimeStamp].Value);
                            }
                            _refresh(waveform, false, enableFilter, stopFrecuency, _chart, overallUnits, overall.Name);
                        }
                    });
                    break;
                default:
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {Array} data Informacion obtenida del poll
         */
        _refresh = function (data, pause, isEnabledFilter, fc, chart, overallUnits, overallName) {
            if (!pause) {
                var
                    dataSrc,
                    baseTitle,
                    yLabelBase,
                    maximumY,
                    minimumY,
                    sampleRate,
                    sampleTime, k,
                    overallData,
                    yUnit;

                // Mantener en RAM la ultima forma de onda, para poder usarla en el metodo _applyFilter
                _currentData = data;
                if (_currentTimeStamp !== data.TimeStamp) {
                    sampleRate = Math.round(data.SampleRate);
                    sampleTime = (data.Value.length / data.SampleRate);
                    dataSrc = isEnabledFilter ? GetXYDataOnTime(GetFilterSignal(data.RawValue, fc), sampleTime) : data.Value;
                    _currentTimeStamp = data.TimeStamp;
                    yLabelBase = chart.user_attrs_.ylabel.split(" [")[0];
                    overallData = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                    overallData += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                    overallData += overallName + ": " + _overallValue.toFixed(2) + " " + overallUnits + ", &nbsp;" + _currentTimeStamp;
                    $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(overallData);
                    yUnit = (_measurementPoint.SensorTypeCode === 4) ? "V" : overallUnits.split(" ")[0];

                    if (dataSrc.length > 0) {
                        maximumY = arrayColumn(dataSrc, 1).max();
                        minimumY = arrayColumn(dataSrc, 1).min();
                        _largestY = [Math.abs(maximumY), Math.abs(minimumY)].max();
                    }
                    chart.updateOptions({
                        "file": dataSrc,
                        "ylabel": yLabelBase + " [" + yUnit + "]",
                        "valueRange": [-(_largestY + _largestDifference) * 1.2, (_largestY + _largestDifference) * 1.2]
                    });

                    var keyphasorAnnotations = [];
                    if (data.KeyphasorPositionsOnTime) {
                        if (data.KeyphasorPositionsOnTime.length > 0) {
                            for (k = 0; k < data.KeyphasorPositionsOnTime.length; k += 1) {
                                keyphasorAnnotations.push({
                                    series: _seriesName[0],
                                    x: data.KeyphasorPositionsOnTime[k],
                                    width: 10,
                                    height: 10,
                                    text: data.KeyphasorPositionsOnTime[k].toString(),
                                    cssClass: "keyphasor-annotation"
                                });
                            }
                        }
                    }
                    chart.setAnnotations(keyphasorAnnotations);
                    if (_mouseover) {
                        chart.mouseMove_(_lastMousemoveEvt);
                    } else {
                        DygraphOps.dispatchMouseMove(chart, 0, 0);
                    }
                    chartScaleY.AttachGraph(_graphType, _widgetId, _measurementPoint.SensorTypeCode, _largestY);
                }
            }
        };

        _subscribeToApplyFilter = function () {
            _applyFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                if (_currentData && _currentData.Value !== null) {
                    _applyFilter(_currentData, enableFilter, stopFrecuency, _chart);
                }
            });
        };

        _applyFilter = function (currentData, isEnabledFilter, fc, chart) {
            var dataSrc, sampleRate, sampleTime, k;

            if (typeof currentData.SampleRate !== "undefined") {
                sampleRate = Math.round(currentData.SampleRate);
                sampleTime = (currentData.Value.length / currentData.SampleRate);
                dataSrc = isEnabledFilter ? GetXYDataOnTime(GetFilterSignal(currentData.RawValue, fc), sampleTime) : currentData.Value;

                chart.updateOptions({
                    "file": dataSrc
                });

                var keyphasorAnnotations = [];
                if (currentData.KeyphasorPositionsOnTime) {
                    if (currentData.KeyphasorPositionsOnTime.length > 2) {
                        for (k = 0; k < currentData.KeyphasorPositionsOnTime.length; k += 1) {
                            keyphasorAnnotations.push({
                                series: _seriesName[0],
                                x: currentData.KeyphasorPositionsOnTime[k],
                                width: 10,
                                height: 10,
                                cssClass: "keyphasor-annotation"
                            });
                        }
                    }
                }
                chart.setAnnotations(keyphasorAnnotations);
                if (_mouseover) {
                    chart.mouseMove_(_lastMousemoveEvt);
                } else {
                    DygraphOps.dispatchMouseMove(chart, 0, 0);
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
                _chart.resize();
            });
        };

        _subscribeToScaleChart = function () {
            var
                currentLargest;

            _scaleChartSubscription = PublisherSubscriber.subscribe("/scale/" + _graphType, [_measurementPoint.SensorTypeCode], function (data) {
                if (data[_measurementPoint.SensorTypeCode]) {
                    if (!_autoscale && data[_measurementPoint.SensorTypeCode] > _largestY) {
                        _largestDifference = data[_measurementPoint.SensorTypeCode] - _largestY;
                        currentLargest = (_chart.axes_[0].maxyval - _chart.axes_[0].minyval) / 2;
                        if (_largestDifference === 0 && currentLargest === _largestY) {
                            return;
                        }
                        _chart.updateOptions({
                            "valueRange": [-(_largestY + _largestDifference) * 1.2, (_largestY + _largestDifference) * 1.2]
                        });
                    }
                }
            });
        };

        this.Show = function (measurementPointId, timeStamp) {
            var
                // Sensor de referencia angular
                angularReference,
                // Menu de opciones para la grafica
                settingsMenu,
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // SubVariable global configurada en el sistema
                overallSubVariable,
                // SubVariable de velocidad de la referencia angular
                velocitySubVariable,
                // Minimo ancho del grid
                minWidth,
                // Minimo ancho del grid
                minHeight,
                // Labels
                labels,
                // Listado de Ids de variables a suscribir
                mdVariableListId,
                // Concatena las unidades configuradas para la SubVariable de valor global con el tipo de medida (peak-peak, zero-peak, rms)
                overallUnits;

            switch (_timeMode) {
                case 0: // RT
                    _measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;

                    // Si el asset no tiene un asdaq asociado, significa que no se estan actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    //if (!_assetData.AsdaqId && !_assetData.AtrId) {
                    //    popUp("info", "No hay datos tiempo real para el activo seleccionado.");
                    //    return;
                    //}
                    break;
                case 1: // HT
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
                    break;
                default:
                    break;
            }
            if (_measurementPoint.SensorTypeCode !== 4) {
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false)
                )[0];
            }
            subVariables = _measurementPoint.SubVariables;

            minWidth = 2;
            minHeight = 2;

            // SubVariables necesarias para la grafica
            _waveformSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
            overallSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
            if (angularReference) {
                velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
            }

            if (!_waveformSubVariable) {
                popUp("info", "No existe una subvariable configurada para forma de onda.");
                return;
            }
            _subVariableIdList.push(_waveformSubVariable.Id);

            if (overallSubVariable) {
                _subVariableIdList.push(overallSubVariable.Id);
                overallUnits = overallSubVariable.Units;
                switch (overallSubVariable.MeasureType) {
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
            }
            if (velocitySubVariable) {
                _subVariableIdList.push(velocitySubVariable.Id);
            }

            _seriesName = ["Amplitud"];

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageWave" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Forma de onda",
                width: width,
                minWidth: minWidth,
                height: height,
                minHeight: minHeight,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: _timeMode,
                asdaqId: _assetData.AsdaqId, // Id del asdaq asociado al asset
                atrId: _assetData.AtrId, // Id del atr asociado al asset
                subVariableIdList: _subVariableIdList,
                asset: _assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s/g, "")],
                pause: (_timeMode == 0) ? true : false,
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

            labels = ["Estampa de tiempo"];
            labels.pushArray(_seriesName);
            mdVariableListId = [_measurementPoint.Id];
            if (angularReference) {
                mdVariableListId.push(angularReference.Id);
            }
            // Se suscribe a la notificacion de llegada de nuevos datos.
            _subscribeToRefresh(mdVariableListId, overallSubVariable, velocitySubVariable, overallUnits, timeStamp);
            // Se suscribe a la notificación de aplicación de filtro dinámico para la forma de onda
            _subscribeToApplyFilter();
            // Se suscribe a la notificación de aplicación de resize para el chart Dygraph
            _subscribeToResizeChart();
            // Se suscribe a la notificacion escala en Y por mayor valor.
            _subscribeToScaleChart();
            // Re-definir las unidades para el valor global en el caso de una referencia angular
            overallUnits = (_measurementPoint.SensorTypeCode === 4) ? "V" : overallSubVariable.Units;
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Construir y mostrar grafica.
            _buildGraph(labels, overallUnits);
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
            }

            if (_playerSubscription) {
                // Eliminar suscripcion de notificacion de llegada de datos por medio del player
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
                chartScaleY.DetachGraph(_graphType, _widgetId, _measurementPoint.SensorTypeCode);
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

    return WaveformGraph;
})();