/*
 * waveformGraph.js
 * Gestiona todo lo relacionado a la grafica de formas de onda.
 * @author Jorge Calderon
 */

/* globals Dygraph, ImageExport, createTableToExcel, tableToExcel, globalsReport, PublisherSubscriber, isEmpty, AspectrogramWidget,
   clone, enableFilter, stopFrequency, aidbManager, HistoricalTimeMode, formatDate, GetXYDataOnTime, GetKeyphasorOnTime, chartScaleY,
   GetFilterSignal, parseAng, arrayColumn, DygraphOps, DygraphOps, selectedMeasurementPoint, selectedAsset, popUp, ej, mainCache*/

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
            // Referencia a las subvariables del punto de medicion (forma de onda, directa, fase 1x, amplitud 1x)
            _subvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Referencia a los ultimos datos que se han graficado
            _currentData,
            // Bandera que indica si la grafica se debe autoescalar
            _autoscale,
            // Valor maximo en Y de todos los graficos del mismo tipo de sensor abiertos
            _largestY,
            // Valor minimo en Y de todos los graficos del mismo tipo de sensor abiertos
            _shortestY,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Referencia a la suscripcion para aplicar filtro dinamico
            _dynamicFilterSubscription,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Referencia a la suscripcion que realiza realiza el escalado segun el valor maximo de las graficas abiertas del mismo tipo
            _scaleChartSubscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que aplica filtro dinamico a la forma de onda y refresca el chart
            _dynamicFilter,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que realiza la suscripcion al publisher para aplicar filtro dinamico
            _subscribeToDynamicFilter,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que realiza el escalado segun el valor maximo de las graficas abiertas del mismo tipo
            _subscribeToScaleChart,
            // Método privado que gestiona la escala en Y del gráfico automaticamente
            _autoScaleYManagement,
            // Método privado que gestiona manualmente la escala en Y del gráfico.
            _manualScaleYManagement,
            // Valor de escala en Y del gráfico de manera manual
            _yScaleValue,
            // Metodo privado que genera el menu de los diferentes ventaneos aplicables al grafico
            _createScaleYMenu;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _pause = false;
        _movableGrid = false;
        _autoscale = true;
        _this = this;
        _graphType = "waveform";
        _widgetId = Math.floor(Math.random() * 100000);
        _subvariables = {};
        _largestY = 0;
        _shortestY = 0;

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
        _onSettingsMenuItemClick = function (evt) {
            evt.preventDefault();
            var
                target,
                menuItem,
                imgExport,
                contId,
                name,
                labels,
                data,
                i, j;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "saveImage" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    if (timeMode === 0) {
                        name = "Tiempo Real, Forma de onda: " + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Forma de onda: " + _assetData.Name;
                    }
                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    labels = [_chart.user_attrs_.xlabel, _chart.user_attrs_.ylabel, "Marca de Paso"];
                    data = [];
                    for (i = 0; i < _chart.file_.length; i += 1) {
                        data.push([_chart.file_[i][0], _chart.file_[i][1], ""]);
                        for (j = 0; j < _chart.annotations_.length; j += 1) {
                            if (_chart.file_[i][0].toFixed(2) == _chart.annotations_[j].x.toFixed(2)) {
                                data[i] = [_chart.file_[i][0], _chart.file_[i][1], _chart.file_[i][1]];
                            }
                        }
                    }
                    createTableToExcel(_container, contId, name, labels, data, true);
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);
                    break;
                case "autoScaleY" + _widgetId:
                    _autoScaleYManagement(target, menuItem);
                    break;
                case "manualScaleY" + _widgetId:
                    var labelY = $("#waveformBody" + _widgetId).find(".dygraph-ylabel").text();
                    _manualScaleYManagement(target, menuItem, labelY, _widgetId);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
            }
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labels) {
            var
                // Personalizacion de los eventos de interaccion dentro de la grafica
                customInteractionModel,
                // Porcentaje de altura del contenendor superior a la grafica
                headerHeigth,
                // Texto a mostrar de forma dinamica
                txt,
                // Valor de velocidad
                velocityValue;

            customInteractionModel = Dygraph.defaultInteractionModel;
            customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                return false;
            };
            customInteractionModel.click = function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            };
            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            _chart = new Dygraph(
                _contentBody,
                [[1, 0]],
                {
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
                            velocityValue = (_angularSubvariable && _angularSubvariable.Value !== null) ? _angularSubvariable.Value : NaN;
                            txt = "Amplitud: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " " + _subvariables.overall.Units;
                            txt += ", Tiempo: " + pts[0].xval.toFixed(2) + " ms";
                            txt += (!Number.isNaN(velocityValue)) ? ", " + _angularSubvariable.Value.toFixed(0) + " RPM" : "";
                            $("#" + pts[0].name + _widgetId + " > span").html(txt);
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
                    interactionModel: customInteractionModel
                }
            );
            $(".grid-stack-item").on("resizestop", function () {
                headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigth) + "%";
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
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (timeStamp, subVariableIdList) {
            var
                waveform,
                idList,
                i;

            timeStamp = new Date(timeStamp).getTime().toString();
            subVariableIdList = (timeMode === 0) ? subVariableIdList : [_subvariables.waveform.Id];
            // Subscripcion a evento para refrescar datos de grafica segun timeMode
            switch (timeMode) {
                case 0: // Tiempo Real
                    _newDataSubscription = PublisherSubscriber.subscribe("/realtime/refresh", subVariableIdList, function (data) {
                        waveform = data[_subvariables.waveform.Id];
                        if (isEmpty(waveform) || isEmpty(waveform.RawValue)) {
                            console.error("No se encontró datos de forma de onda.");
                            return;
                        }
                        if (_subvariables.overall) {
                            _subvariables.overall.Value = 0;
                            _subvariables.overall.Value = clone(data[_subvariables.overall.Id].Value);
                        }
                        if (_subvariables.phase) {
                            _subvariables.phase.Value = 0;
                            _subvariables.phase.Value = clone(data[_subvariables.phase.Id].Value);
                        }
                        if (_subvariables.amplitude) {
                            _subvariables.amplitude.Value = 0;
                            _subvariables.amplitude.Value = clone(data[_subvariables.amplitude.Id].Value);
                        }
                        if (_angularSubvariable) {
                            _angularSubvariable.Value = clone(data[_angularSubvariable.Id].Value);
                        }
                        _refresh(waveform);
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
                        waveform = data[_subvariables.waveform.Id][timeStamp];
                        if (!isEmpty(waveform)) {
                            idList = [];
                            if (_subvariables.overall) {
                                idList.push(_subvariables.overall.Id);
                                _subvariables.overall.Value = 0;
                            }
                            if (_subvariables.phase) {
                                idList.push(_subvariables.phase.Id);
                                _subvariables.phase.Value = 0;
                            }
                            if (_subvariables.amplitude) {
                                idList.push(_subvariables.amplitude.Id);
                                _subvariables.amplitude.Value = 0;
                            }
                            if (_angularSubvariable) {
                                idList.push(_angularSubvariable.Id);
                            }
                            if (idList.length > 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [parseInt(timeStamp)], _assetData.NodeId, function (resp) {
                                    for (i = 0; i < resp.length; i += 1) {
                                        if (_subvariables.overall && resp[i].subVariableId === _subvariables.overall.Id) {
                                            _subvariables.overall.Value = clone(resp[i].value);
                                        } else if (_subvariables.phase && resp[i].subVariableId === _subvariables.phase.Id) {
                                            _subvariables.phase.Value = clone(resp[i].value);
                                        } else if (_subvariables.amplitude && resp[i].subVariableId === _subvariables.amplitude.Id) {
                                            _subvariables.amplitude.Value = clone(resp[i].value);
                                        } else if (_angularSubvariable && resp[i].subVariableId === _angularSubvariable.Id) {
                                            _angularSubvariable.Value = clone(resp[i].value);
                                        }
                                    }
                                    _refresh(waveform);
                                });
                            } else {
                                _refresh(waveform);
                            }
                        }
                    });
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoint.Id], _assetData.NodeId, subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!Number.isNaN(currentTimeStamp)) {
                            aidbManager.GetStreamBySubVariableIdAndTimeStamp(_subvariables.waveform.Id, currentTimeStamp, _assetData.NodeId, function (data) {
                                if (data.length > 0) {
                                    waveform = {
                                        TimeStamp: formatDate(new Date(data[0].timeStamp)),
                                        SampleTime: clone(data[0].sampleTime),
                                        RawValue: clone(data[0].value),
                                        Value: GetXYDataOnTime(data[0].value, data[0].sampleTime),
                                        SampleRate: (data[0].value.length / data[0].sampleTime),
                                        KeyphasorPositionsOnTime: data[0].referencePositions ?
                                            GetKeyphasorOnTime(data[0].referencePositions, data[0].sampleTime, data[0].value.length) : []
                                    };
                                }
                                if (isEmpty(waveform)) {
                                    console.error("No se encontró datos de forma de onda.");
                                    return;
                                }
                                idList = [];
                                if (_subvariables.overall) {
                                    _subvariables.overall.Value = 0;
                                    idList.push(_subvariables.overall.Id);
                                }
                                if (_subvariables.phase) {
                                    _subvariables.phase.Value = 0;
                                    idList.push(_subvariables.phase.Id);
                                }
                                if (_subvariables.amplitude) {
                                    _subvariables.amplitude.Value = 0;
                                    idList.push(_subvariables.amplitude.Id);
                                }
                                if (_angularSubvariable) {
                                    idList.push(_angularSubvariable.Id);
                                }
                                if (idList.length > 0) {
                                    aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [currentTimeStamp], _assetData.NodeId, function (resp) {
                                        for (i = 0; i < resp.length; i += 1) {
                                            if (_subvariables.overall && resp[i].subVariableId === _subvariables.overall.Id) {
                                                _subvariables.overall.Value = clone(resp[i].value);
                                            } else if (_subvariables.phase && resp[i].subVariableId === _subvariables.phase.Id) {
                                                _subvariables.phase.Value = clone(resp[i].value);
                                            } else if (_subvariables.amplitude && resp[i].subVariableId === _subvariables.amplitude.Id) {
                                                _subvariables.amplitude.Value = clone(resp[i].value);
                                            } else if (_angularSubvariable && resp[i].subVariableId === _angularSubvariable.Id) {
                                                _angularSubvariable.Value = clone(resp[i].value);
                                            }
                                        }
                                        _refresh(waveform);
                                    });
                                } else {
                                    _refresh(waveform);
                                }
                            });
                        }
                    });
                    break;
            }
        };

        /*
         * Actualiza los valores a graficar
         */
        _refresh = function (waveform) {
            var
                // Texto dinamico a desplegar
                txt,
                // Tiempo total de graficacion de la forma de onda
                sampleTime,
                // Datos a graficar
                xyData,
                // Valor minimo de amplitud
                minimumY,
                // Valor maximo de amplitud
                maximumY,
                // Descripcion de label del eje Y
                yLabelBase,
                // Unidades a mostrar en el eje Y
                yUnit,
                // Etiquetas de la forma de onda
                annotations,
                // Contador
                i,
                // Valores del rango de la escala del gráfico
                valueRange,
                // Indica si el gráfico está en escala manual
                manual,
                scaleY;

            if (!_pause) {
                if (_currentTimeStamp !== waveform.TimeStamp) {
                    // Estampa de tiempo actual de graficacion
                    _currentTimeStamp = waveform.TimeStamp;
                    // Informacion de texto a mostrar
                    txt = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.overall.Name + ": ";
                    txt += _subvariables.overall.Value.toFixed(2) + " " + _subvariables.overall.Units + ", &nbsp;" + _currentTimeStamp;
                    $("#point" + _measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
                    // Mantener en memoria la ultima forma de onda mostrada
                    _currentData = clone(waveform);
                    // Calculamos el tiempo de muestreo
                    sampleTime = (waveform.Value.length / waveform.SampleRate);
                    // Dato de la forma de onda a graficar
                    xyData = enableFilter ? GetXYDataOnTime(GetFilterSignal(waveform.RawValue, stopFrequency), sampleTime) : waveform.Value;
                    // Calculamos maximo y minimo de la grafica
                    if (xyData.length > 0) {
                        minimumY = arrayColumn(xyData, 1).min();
                        maximumY = arrayColumn(xyData, 1).max();

                        // Guardamos los valores manuales para cuando se desea cambiar a esta escala.
                        scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(_widgetId, "WidgetId"));
                        if (scaleY.length == 0) {
                            _scaleY.push({
                                Auto: { MinY: minimumY, MaxY: maximumY },
                                WidgetId: _widgetId
                            });
                        } else {
                            scaleY[0].Auto.MinY = minimumY;
                            scaleY[0].Auto.MaxY = maximumY;
                        }
                    }
                    if (_shortestY === 0 && _largestY === 0) {
                        _shortestY = minimumY;
                        _largestY = maximumY;
                    }
                    yLabelBase = _chart.user_attrs_.ylabel.split(" [")[0];
                    yUnit = (_measurementPoint.SensorTypeCode === 4) ? "V" : _subvariables.overall.Units;

                    // Valida si el gráfico debe mantener la escala manual o auto y setear la propiedad "valueRange" del _chart
                    manual = $("li>a[data-value= manualScaleY" + _widgetId + "]>i").hasClass('fa-check-square');
                    if (manual && !_autoscale)
                        valueRange = [-scaleY[0].Manual, scaleY[0].Manual];
                    else
                        valueRange = [_shortestY * 1.2, _largestY * 1.2];

                    _chart.updateOptions({
                        "file": xyData,
                        "ylabel": yLabelBase + " [" + yUnit + "]",
                        "valueRange": valueRange
                    });

                    annotations = [];
                    if (waveform.KeyphasorPositionsOnTime) {
                        if (waveform.KeyphasorPositionsOnTime.length > 0) {
                            for (i = 0; i < waveform.KeyphasorPositionsOnTime.length; i += 1) {
                                annotations.push({
                                    series: _seriesName[0],
                                    x: waveform.KeyphasorPositionsOnTime[i],
                                    width: 10,
                                    height: 10,
                                    text: waveform.KeyphasorPositionsOnTime[i].toString(),
                                    cssClass: "keyphasor-annotation"
                                });
                            }
                        }
                    }
                    _chart.setAnnotations(annotations);
                    if (_mouseover) {
                        _chart.mouseMove_(_lastMousemoveEvt);
                    } else {
                        DygraphOps.dispatchMouseMove(_chart, 0, 0);
                    }
                    chartScaleY.AttachGraph(_graphType, _widgetId, _measurementPoint.SensorTypeCode, minimumY, maximumY);
                }
            }
        };

        _subscribeToDynamicFilter = function () {
            _dynamicFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                if (_currentData && _currentData.Value !== null) {
                    _dynamicFilter();
                }
            });
        };

        _dynamicFilter = function () {
            var
                sampleTime,
                xyData,
                annotations,
                i;

            if (typeof _currentData.SampleRate !== "undefined") {
                sampleTime = (_currentData.Value.length / _currentData.SampleRate);
                xyData = enableFilter ? GetXYDataOnTime(GetFilterSignal(_currentData.RawValue, stopFrequency), sampleTime) : _currentData.Value;
                _chart.updateOptions({
                    "file": xyData
                });
                annotations = [];
                if (_currentData.KeyphasorPositionsOnTime) {
                    if (_currentData.KeyphasorPositionsOnTime.length > 2) {
                        for (i = 0; i < _currentData.KeyphasorPositionsOnTime.length; i += 1) {
                            annotations.push({
                                series: _seriesName[0],
                                x: _currentData.KeyphasorPositionsOnTime[i],
                                width: 10,
                                height: 10,
                                cssClass: "keyphasor-annotation"
                            });
                        }
                    }
                }
                _chart.setAnnotations(annotations);
                if (_mouseover) {
                    _chart.mouseMove_(_lastMousemoveEvt);
                } else {
                    DygraphOps.dispatchMouseMove(_chart, 0, 0);
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
                minMaxArray;

            _scaleChartSubscription = PublisherSubscriber.subscribe("/scale/" + _graphType, [_measurementPoint.SensorTypeCode], function (data) {
                if (data[_measurementPoint.SensorTypeCode]) {
                    if (_autoscale) {
                        minMaxArray = data[_measurementPoint.SensorTypeCode];
                        if (_shortestY !== minMaxArray[0] || _largestY !== minMaxArray[1]) {
                            _shortestY = minMaxArray[0];
                            _largestY = minMaxArray[1];
                            _chart.updateOptions({
                                "valueRange": [_shortestY * 1.2, _largestY * 1.2]
                            });
                        }
                    }
                }
            });
        };

        this.Show = function (measurementPointId, timeStamp) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Labels
                labels,
                // Sensor de referencia angular
                angularReference,
                // Menu de opciones para la grafica
                settingsMenu,
                // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                subVariableIdList,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion con el valor global y su tipo de medida
                overallUnits,
                // Sub-menu de opciones para los tipos de espectro (solo aplica para acelerometro, velocimetro)
                settingsSubmenu;

            switch (timeMode) {
                case 0: // RT
                    _measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;

                    // Si el asset no tiene un asdaq asociado, significa que no se estan actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    if (!_assetData.AsdaqId && !_assetData.AtrId) {
                        popUp("info", "No hay datos tiempo real para el activo seleccionado.");
                        return;
                    }
                    break;
                case 1: // HT
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                        new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
                    break;
                default:
                    console.log("Modo no soportado.");
            }
            if (_measurementPoint.SensorTypeCode !== 4) {
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false))[0];
            }
            if (angularReference) {
                _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(
                        new ej.Query().where("MeasureType", "equal", 9, false))[0]);
            }
            subVariableIdList = [];
            // Total subvariables para el punto de medicion
            subVariables = _measurementPoint.SubVariables;
            // SubVariable que contiene la forma de onda
            _subvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(
                new ej.Query().where("ValueType", "equal", 3, false))[0]);
            if (_subvariables.waveform) {
                subVariableIdList.push(_subvariables.waveform.Id);
            } else {
                popUp("info", "No existe una subvariable configurada para forma de onda.");
                return;
            }
            // SubVariable que contiene el valor global del punto de medicion
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
            // SubVariable que contiene el valor de fase del punto de medicion
            _subvariables.phase = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 6, false))[0]);
            if (_subvariables.phase) {
                subVariableIdList.push(_subvariables.phase.Id);
            }
            // SubVariable que contiene el valor de amplitud del punto de medicion
            _subvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0]);
            if (_subvariables.amplitude) {
                subVariableIdList.push(_subvariables.amplitude.Id);
            }
            // SubVariable que corresponde al punto de referencia angular
            if (_angularSubvariable) {
                subVariableIdList.push(_angularSubvariable.Id);
            }
            _seriesName = ["Amplitud"];

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            // Menu que permite seleccionar entre manual o auto la escala en Y de la gráfica
            _createScaleYMenu(settingsMenu, settingsSubmenu);
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Forma de onda",
                width: width,
                minWidth: 2,
                height: height,
                minHeight: 2,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: timeMode,
                asdaqId: _assetData.AsdaqId,
                atrId: _assetData.AtrId,
                subVariableIdList: subVariableIdList,
                asset: _assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "")],
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
                },
                onMaximize: function () {
                    launchFullScreen(_container.id);
                },
                onMinimize: function () {
                    cancelFullscreen();
                }
            });

            labels = ["Estampa de tiempo", _seriesName[0]];
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Se suscribe a la notificacion de llegada de nuevos datos.
            _subscribeToNewData(timeStamp, subVariableIdList);
            // Se suscribe a la notificacion de aplicacion de filtro dinamico para la forma de onda
            _subscribeToDynamicFilter();
            // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
            _subscribeToResizeChart();
            // Se suscribe a la notificacion escala en Y por mayor valor.
            _subscribeToScaleChart();
            // Construir y mostrar grafica.
            _buildGraph(labels);
        };

        this.Close = function () {
            var
                el;

            // Elimina el objeto en memoria de la escala en "Y" manual, si esta existe.
            ej.DataManager(_scaleY).remove("WidgetId", _widgetId, _scaleY);

            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }
            if (_playerSubscription) {
                // Eliminar suscripcion de notificacion de llegada de datos por medio del player
                _playerSubscription.remove();
            }
            if (_dynamicFilterSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar filtro dinamico a la forma de onda
                _dynamicFilterSubscription.remove();
            }
            if (_resizeChartSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }
            if (_scaleChartSubscription) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                _scaleChartSubscription.remove();
                chartScaleY.DetachGraph(_graphType, _widgetId, _measurementPoint.SensorTypeCode);
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

        _createScaleYMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Auto",
                "autoScaleY" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Manual",
                "manualScaleY" + _widgetId
            ));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Escala en Y", "windowing" + _widgetId, settingsSubmenu));
        };

        _autoScaleYManagement = function (target, menuItem) {
            var
                children,
                i;

            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");

            var scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(_widgetId, "WidgetId"));

            _chart.updateOptions({
                "valueRange": [scaleY[0].Auto.MinY, scaleY[0].Auto.MaxY],
            });
            _autoscale = true;
        };

        _manualScaleYManagement = function (target, menuItem, labelText, widgetId) {
            $(".treeViewFilter").append("<div id='ejdManualScaleYWaveform' class='hidden'>" +
                    "<div class='container-fluid cf'>" +
                        "<div class='row'>" +
                            "<label id='lblScaleYWaveform'></label>" +
                            "<input type='text' id='txtYScaleValueWaveform'>" +
                        "</div>" +
                        "<br />" +
                        "<div class='row'>" +
                            "<button id='btnAcceptScaleYWaveform'> Aceptar</button>" +
                            "<button id='btnCancelScaleYWaveform'> Cancelar</button>" +
                        "</div>" +
                    "</div>" +
                "</div>");

            var
                // Obtenemos el valor máximo de la escala en "Y" del gráfico.
                maxScaleY = _chart.yAxisRange().max(),
                children,
                //yScaleValue = $("div[data-id=" + widgetId + "] div.dygraph-axis-label-y:last").text(),
                //scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(widgetId, "WidgetId")),
                i;

            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");

            $("#lblScaleYWaveform").text(labelText);
            $("#lblScaleYWaveform").data("widgetId", widgetId);

            $("#txtYScaleValueWaveform").ejNumericTextbox({
                width: "90%",
                value: maxScaleY,
                //value: (scaleY.length == 0) ? maxScaleY : scaleY[0].Manual,
                minValue: 0.05,
                decimalPlaces: 2,
            });

            $("#btnAcceptScaleYWaveform").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-checkmark",
                click: function (args) {
                    var widgetId = $("#lblScaleYWaveform").data("widgetId");
                    _yScaleValue = $("#txtYScaleValueWaveform").ejNumericTextbox("getValue");

                    var scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(widgetId, "WidgetId"));
                    if (scaleY.length == 0) {
                        _scaleY.push({
                            Manual: _yScaleValue,
                            WidgetId: widgetId
                        });
                    } else {
                        scaleY[0].Manual = _yScaleValue;
                    }

                    _chart.updateOptions({
                        "valueRange": [-_yScaleValue, _yScaleValue],
                    });

                    _autoscale = false;
                    _yScaleValue = null;
                    $("#ejdManualScaleYWaveform").addClass("hidden");
                    $("#ejdManualScaleYWaveform").ejDialog("close");
                },
            });

            $("#btnCancelScaleYWaveform").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-cancel",
                click: function (args) {
                    $("#ejdManualScaleYWaveform").addClass("hidden");
                    $("#ejdManualScaleYWaveform").ejDialog("close");
                }
            });

            $("#ejdManualScaleYWaveform").ejDialog({
                showOnInit: false,
                isResponsive: true,
                title: "Escala en Y",
                allowDraggable: true,
                enableAnimation: true,
                width: "15%", height: "25%",
                //maxWidth: "20%", maxHeight: "28%",
                enableResize: true,
                showHeader: true,
                enableModal: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                close: function (args) {
                    //$("#btnAcceptScaleYWaveform").off("click"); // Necesario desasociar el evento
                    //$("#btnCancelScaleYWaveform").off("click"); // Necesario desasociar el evento
                    $("#ejdManualScaleYWaveform").addClass('hidden');
                    $("#txtYScaleValueWaveform").ejNumericTextbox("destroy");
                    $("#btnAcceptScaleYWaveform").ejButton("destroy");
                    $("#btnCancelScaleYWaveform").ejButton("destroy");
                },
            });

            $("#ejdManualScaleYWaveform").removeClass('hidden');
            $("#ejdManualScaleYWaveform").ejDialog("open");
        };
    };

    return WaveformGraph;
})();