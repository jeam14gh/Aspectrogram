/*
 * barChartGraph.js
 * Gestiona todo lo relacionado a la grafica de barras.
 * @author Jorge Calderon
 */

var BarChartGraph = {};

BarChartGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    BarChartGraph = function (timeMode, width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor especifico del chart a graficar
            _contentBody,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Modo: Tiempo real (0), historico (1)
            _timeMode,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase SignalGraph
            _this,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Referencia a la variable que fue seleccionada en el momento de abrir la grafica
            _subVariableIdList,
            // Rango en el eje x con el cual se debe resetear el zoom
            _xRange,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Mantiene la lista de measurement points del asset seleccionado al momento de abrir la grafica
            _measurementPoints,
            // Mantiene la lista de subVariables de cada uno de los measurement point del asset seleccionado al momento de abrir la grafica
            _subVariables,
            // Conjunto de subVariables que coinciden con la measure seleccionada en el listbox de measures
            _currentSubVariables,
            // Mantiene la lista de los diferentes tipos de medida a mostrar en el listbox de measures
            _distinctMeasures,
            // Contenedor HTML del dropDownList de tipos de medida
            _measureListContainer,
            // Id del control dropDownList de tipos de medida
            _dropDownListMeasuresId,
            // Listado de subvariables filtradas por el tipo valor y segun el listado de puntos de medicion configurados
            _filteredSubVariables,
            _filteredMeasurementPoints,
            _addSensorAndMeasuresPanel,
            _selectedMeasureBySensor,
            _assetData,
            _timeStamp,
            _dict,
            _labels,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Colores de estado de condicion de cada subVariable que se esta graficando
            _statusColorList,
            _xLabelIndex,
            _appendLegendDiv,
            // Referencia a la suscripción para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            _playerSubscription,
            // Método privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            _getHistoricalData;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _pause = false;
        _movableGrid = false;
        _this = this;
        _graphType = "bar";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _dict = [];

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "barGraph" + _widgetId;
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
        _contentBody.style.height = "94%";
        // Agregar clase que gestiona el estilo de labels verticales en el eje x de la grafica
        $(_contentBody).addClass("vertical-x-labels");
        $(_container).append(_contentBody);

        /*
         * Crea un DIV al lado del contenedor de la grafica para mostrar las
         * etiquetas de las diferentes sieres en la grafica
         */
        _appendLegendDiv = function () {
            var width, headerHeigthPercentage;
            width = 86.9;
            $(_contentBody).css("width", width + "%");
            $(_contentBody).css("display", "inline-block");
            headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            $(_contentBody).parent().append("<div class=\"statusBar\" id=\"t" + _widgetId + "\" style=\"width:" + (100 - width) +
                "%;height:" + (99.9 - parseFloat(headerHeigthPercentage)) + "%;\"></div>");
        };

        /*
         * Callback de evento click sobre algun item del menu de opciones
         *@param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var
                target,
                settingsMenuItem,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                i,
                measureTypesGroupBySensorType;

            target = $(event.currentTarget);
            settingsMenuItem = target.attr("data-value");
            switch (settingsMenuItem) {
                case "filterMenuItem":
                    $("#barFilterAreaDialog").css("display", "block");
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 500, height: 250 };
                    dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };

                    measureTypesGroupBySensorType = new ej.DataManager(_distinctMeasures).executeLocal(new ej.Query().group("SensorType"));

                    for (i = 0; i < measureTypesGroupBySensorType.length; i += 1) {
                        _addSensorAndMeasuresPanel(measureTypesGroupBySensorType[i].key, measureTypesGroupBySensorType[i].items);
                    }

                    $("#barFilterAreaDialog #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#barFilter").ejDialog("close");
                    });

                    $("#barFilterAreaDialog #btnFilter").click(function (e) {
                        var
                            filteredSubVariables,
                            selectedMeasure,
                            maximum,
                            minimum,
                            mdVariableIdList,
                            initialData,
                            filteredMeasurementPoints;

                        e.preventDefault();
                        filteredSubVariables = [];
                        
                        // Obtener las subVariables que cumplan con los criterios de tipos de sensor y medida seleccionada por cada tipo
                        for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                            if (_selectedMeasureBySensor[i].selectedMeasureType > -1) {
                                filteredSubVariables.pushArray(ej.DataManager(_subVariables).executeLocal(new ej.Query().where(
                                    ej.Predicate("SensorTypeCode", "equal", _selectedMeasureBySensor[i].sensorTypeCode)
                                        .and("MeasureType", "equal", _selectedMeasureBySensor[i].selectedMeasureType)
                                        .and("FromIntegratedWaveform", "equal", _selectedMeasureBySensor[i].fromIntegratedWaveform)
                                    )));
                            }
                        }

                        filteredMeasurementPoints = [];
                        for (var i = 0; i < filteredSubVariables.length; i += 1) {
                            filteredMeasurementPoints.push(ej.DataManager(_measurementPoints).executeLocal(
                                new ej.Query().where("Id", "equal", filteredSubVariables[i].ParentId))[0]);
                        }
                        _filteredMeasurementPoints = filteredMeasurementPoints;

                        // Actualizar la lista de subVariables actuales
                        var currentSubVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));
                        // Eliminar de la cache las subVariables a consultar en el servidor
                        _aWidget.manageCache(currentSubVariableIdList, "delete");
                        // Remover las subvariables especificadas dentro de la suscripcion
                        _subscription.detachItems(currentSubVariableIdList);
                        // Actualizar la lista de subVariables actuales
                        _filteredSubVariables = clone(filteredSubVariables);
                        _subVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));
                        // Actualizar en la cache las subVariables a consultar en el servidor
                        _aWidget.manageCache(_subVariableIdList, "update");
                        // Agrega las nuevas subvariables a la suscripcion
                        _subscription.attachItems(_subVariableIdList);

                        var subVariablesGroupBySensor = new ej.DataManager(_subVariables).executeLocal(new ej.Query().group("SensorTypeCode"));
                        _selectedMeasureBySensor = [];

                        // Inicializar medida seleccionada por cada distinto sensor
                        for (i = 0; i < subVariablesGroupBySensor.length; i += 1) {
                            _selectedMeasureBySensor.push({
                                sensorTypeCode: subVariablesGroupBySensor[i].key,
                                selectedMeasureType: subVariablesGroupBySensor[i].items[0].MeasureType,
                                fromIntegratedWaveform: subVariablesGroupBySensor[i].items[0].FromIntegratedWaveform
                            });
                        }

                        maximum = ej.max(filteredSubVariables, "Maximum").Maximum;
                        minimum = ej.min(filteredSubVariables, "Minimum").Minimum;
                        initialData = [];
                        _dict = [];
                        $("#t" + _widgetId).empty();
                        var subVar, measureSelected;

                        for (i = 0; i < _subVariableIdList.length; i += 1) {
                            subVar = new ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().where("Id", "equal", _subVariableIdList[i], false))[0];
                            measureSelected = new ej.DataManager(_filteredMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", subVar.ParentId, false))[0].Name;
                            _dict[measureSelected] = {
                                Id: subVar.Id,
                                Units: subVar.Units,
                                MeasureType: subVar.MeasureType
                            };
                            $("#t" + _widgetId).append("<div id=\"" + measureSelected + _widgetId + "\"></div>");
                            $("#" + measureSelected + _widgetId).append("<span style=\"color:black;\">&#8212;</span>");
                            $("#" + measureSelected + _widgetId).append("<span>&nbsp;" + measureSelected + ":</span>");
                            $("#" + measureSelected + _widgetId).append("<span>&nbsp;</span>");
                            initialData.push([i, null]);
                        }

                        switch (_timeMode) {
                            case 1: // HT
                                mdVariableIdList = ej.DataManager(_filteredMeasurementPoints).executeLocal(new ej.Query().select("Id"));
                                new HistoricalTimeMode().GetDataByTimeStamp(mdVariableIdList, _subVariableIdList, _timeStamp, _widgetId);
                                break;
                        }

                        // Construir y mostrar grafica.
                        _buildGraph(initialData, maximum, minimum, "[" + _filteredSubVariables[0].Units + "]");
                        $("#barFilter").ejDialog("close");
                    });

                    $("#barFilter").ejDialog({
                        enableResize: false,
                        width: dialogSize.width,
                        height: "auto",
                        zIndex: 2000,
                        close: function () {
                            $("#barFilterAreaDialog #measureTypesContainer").empty();
                            $("#barFilterAreaDialog #btnFilter").off("click");
                            $("#barFilterAreaDialog #btnCancel").off("click");
                            $("#barFilterAreaDialog").css("display", "none");
                        },
                        content: "#barFilterAreaDialog",
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

                    $("#barFilter").ejDialog("open");
                    break;
                case "saveImageBar" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" +_widgetId:
                    var contId, name, labels = [];
                    if (timeMode == 0) {
                        name = 'Tiempo Real, Gráfico de barras: ' + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = 'Histórico,  Gráfico de barras: ' + _assetData.Name;
                    }
                    contId = 'tableToExcelWaveformGraph' + _widgetId;

                    for (var j = 0; j < _chart.user_attrs_.labels.length; j++) {
                        labels.push(_chart.user_attrs_.labels[j]);
                    }

                    createTableToExcel(_container, contId, name, labels, _chart.file_, true)
                    tableToExcel('tableToExcelWaveformGraph' + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
                    break;
            }
        };

        _addSensorAndMeasuresPanel = function (sensorType, measures) {
            var
                measureTypesContainer,
                newPanel,
                panelHeading,
                panelBody,
                measureOption,
                i,
                radioGroupName,
                selectedMeasureType,
                fromIntegratedWaveform,
                checked;

            measureTypesContainer = $("#barFilterAreaDialog #measureTypesContainer");

            panelHeading = $("<div class=\"panel-heading\" style=\"padding-top:5px !important;padding-bottom:5px !important;\"></div>");
            panelHeading.append("<h3 class=\"panel-title\">{0}</h3>".JsFormat(sensorType));

            panelBody = $("<div class=\"panel-body\" style=\"padding-top:0 !important;padding-bottom:0 !important;\"></div>");

            if (measures.length > 0) {
                radioGroupName = "sensor_" + measures[0].SensorTypeCode;

                for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                    if (_selectedMeasureBySensor[i].sensorTypeCode == measures[0].SensorTypeCode) {
                        selectedMeasureType = _selectedMeasureBySensor[i].selectedMeasureType;
                        fromIntegratedWaveform = _selectedMeasureBySensor[i].fromIntegratedWaveform;
                        break;
                    }
                }

                for (i = 0; i < measures.length; i += 1) {
                    checked = "";

                    if ((measures[i].MeasureType == selectedMeasureType) && (measures[i].FromIntegratedWaveform == fromIntegratedWaveform)) {
                        checked = "checked";
                    }

                    measureOption = $("<div class=\"radio\"></div>");
                    measureOption.append(
                        "<label><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} {3}></input>{4}</label>".JsFormat(
                            radioGroupName,
                            measures[i].MeasureType,
                            (measures[i].FromIntegratedWaveform) ? "fromintegratedwaveform" : "",
                            checked,
                            measures[i].Name));

                    panelBody.append(measureOption);
                }

                checked = (selectedMeasureType == -1) ? "checked" : "";

                // Opcion "Ninguno"
                measureOption = $("<div class=\"radio\"></div>");
                measureOption.append(
                    "<label><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} {3}></input>{4}</label>".JsFormat(
                        radioGroupName,
                        -1,
                        "",
                        checked,
                        "Ninguno"));

                panelBody.append(measureOption);
            }

            newPanel = $("<div class=\"panel panel-default custom-panel-filter\"></div>");
            newPanel.append(panelHeading);
            newPanel.append(panelBody);

            measureTypesContainer.append(newPanel);

            if (radioGroupName) {
                $("input[name=\"{0}\"]:radio".JsFormat(radioGroupName)).change(function () {
                    var
                        i,
                        radioObj,
                        sensorTypeCode,
                        measureType,
                        fromIntegratedWaveform;

                    radioObj = $(this);
                    sensorTypeCode = parseInt(radioObj[0].name.split("_")[1]);
                    measureType = parseInt(radioObj.val());
                    fromIntegratedWaveform = radioObj.is("[fromintegratedwaveform]");

                    for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                        if (_selectedMeasureBySensor[i].sensorTypeCode == sensorTypeCode) {
                            _selectedMeasureBySensor[i].selectedMeasureType = measureType;
                            _selectedMeasureBySensor[i].fromIntegratedWaveform = fromIntegratedWaveform;
                            break;
                        }
                    }
                });
            }
        };

        /*
         * Construye la grafica, caso no exista.
         * @param {Array} initialData
         */
        _buildGraph = function (initialData, maximum, minimum, units, timeStamp) {
            if (_chart) {
                _chart.destroy();
            }

            var
                defaultLabelHTML,
                customInteractionModel;

            _labels = [];

            for (var key in _dict) {
                if (_dict.hasOwnProperty(key)) {
                    _labels.push(key);
                }
            }

            _xLabelIndex = -1;
            _xRange = [-1, initialData.length];
            //$("<div id=\"plotOpts" + _widgetId + "\"><span>&nbsp;</span></div>").insertBefore("#textAfterTitle" + _widgetId);

            customInteractionModel = clone(Dygraph.defaultInteractionModel);
            customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                return false;
            };
            customInteractionModel.click = function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            };
            _chart = new Dygraph(
                _contentBody,                
                initialData,
                {
                    colors: ["#006ACB"],
                    xAxisHeight: 50, // Para darle un margen a los label verticales
                    labels: ["Point", "Value"],
                    includeZero: true,
                    dateWindow: _xRange,
                    valueRange: [minimum, maximum],
                    digitsAfterDecimal: 4,
                    axisLabelFontSize: 10,
                    ylabel: "Amplitud",
                    drawAxesAtZero: false,
                    drawCallback: function (me, initial) {
                        if (initial) {
                            defaultLabelHTML = document.getElementById("t" + _widgetId).innerHTML;
                        }
                        if (!initial && !me.isZoomed()) {
                            this.updateOptions(
                            {
                                dateWindow: _xRange
                            });
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                        
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        _lastMousemoveEvt = e;
                        _mouseover = true;

                    },
                    unhighlightCallback: function (e) {
                        //_mouseover = false;
                    },
                    interactionModel: customInteractionModel,
                    axes: {
                        x: {
                            ticker: function (min, max, pixels, opts, dygraph, vals) {
                                var arr = [];
                                var i = 0;
                                for (var y = min; y < max; ++y) {
                                    if (y == min) {
                                        continue;
                                    }

                                    arr.push({ v: y, label: _labels[i] });
                                    i++;
                                }
                                return arr;
                            },
                            valueFormatter: function (ms) {
                                return "";
                            },
                            drawGrid: false
                        },
                        y: {
                            pixelsPerLabel: 20,
                            valueFormatter: function (ms) {
                                return ms;
                            }
                        }
                    },
                    plotter: function (e) {
                        Dygraph.Plugins.Plotter.prototype.barChartPlotter(e, _statusColorList);
                    },
                    legend: "never"
                }
            );

            $(".grid-stack-item").on("resizestop", function () {
                var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
                setTimeout(function () {
                    _chart.resize();
                }, 100);
            });

            _chart.ready(function () {
                if (timeMode === 1) {
                    _getHistoricalData(timeStamp);
                }
            });

            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });
        };

        _getHistoricalData = function (timeStamp) {
            var
                i,
                dataArray;

            _timeStamp = new Date(timeStamp).getTime().toString();
            dataArray = [];
            for (i = 0; i < _filteredSubVariables.length; i += 1) {
                dataArray[_filteredSubVariables[i].Id] = clone(subVariableHTList[_filteredSubVariables[i].Id][_timeStamp]);
            }
            _refresh(dataArray, false, formatDate(new Date(parseInt(_timeStamp))));
        };

        /*
         * Suscribe el chart al dato segun el Modo definido
         */
        _subscribeToRefresh = function (mdVariableIdList, timeStamp) {
            _timeStamp = new Date(timeStamp).getTime().toString();
            // Subscripcion a evento para refrescar datos de grafica segun _timeMode
            switch (_timeMode) {
                case 0: // Tiempo Real
                    _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                        if (data) {
                            if (timeStamp !== data[_subVariableIdList[0]].TimeStamp) {
                                timeStamp = data[_subVariableIdList[0]].TimeStamp;
                                _refresh(data, _pause, timeStamp);
                            }
                        }
                    });
                    break;
                case 1: // Historico
                //    _subscription = PublisherSubscriber.subscribe("/historic/refresh", _subVariableIdList, function (data) {
                //        if (data) {
                //            var
                //                dataSrc,
                //                index;

                //            dataSrc = [];
                //            for (index in data) {
                //                if (data.hasOwnProperty(index)) {
                //                    if (data[index].WidgetId != _widgetId) {
                //                        return;
                //                    }

                //                    dataSrc[index] = data[index][_timeStamp];
                //                }
                //            }
                //            _refresh(dataSrc, _pause, enableFilter, stopFrecuency, _chart, formatDate(new Date(parseInt(_timeStamp))));
                //        }
                //    });
                //    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoint.Id], _subVariableIdList, _timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        var
                            i,
                            dataSrc;

                        if (!isNaN(currentTimeStamp)) {
                            dataSrc = [];
                            for (i = 0; i < _filteredSubVariables.length; i += 1) {
                                if (subVariableHTList[_filteredSubVariables[i].Id][currentTimeStamp]) {
                                    dataSrc[_filteredSubVariables[i].Id] = clone(subVariableHTList[_filteredSubVariables[i].Id][currentTimeStamp]);
                                } else {
                                    dataSrc[_filteredSubVariables[i].Id] = {
                                        Value: 0.0,
                                        StatusColor: ""
                                    };
                                }
                            }
                            _refresh(dataSrc, _pause, enableFilter, stopFrecuency, _chart, formatDate(new Date(parseInt(currentTimeStamp))));
                        }
                    });
                    break;
                default:
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {String} data Informacion obtenida del poll
         */
        _refresh = function (data, pause, timeStamp) {
            if (!pause) {
                var
                    // Formateo de datos para ser mostrados en la grafica
                    dataSrc,
                    // Objecto de la actual subvariable en el loop
                    current,
                    // Valor actual del punto de medicion
                    currentValue,
                    // Contador
                    i, max, min;

                // Inicializar la lista de datos a "refrescar" en la grafica
                dataSrc = [];
                // Limpiar listado de colores de estado de condición de las subVariables
                _statusColorList = [];
                max = 0;
                min = 0;
                for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                    current = ej.DataManager(_filteredSubVariables).executeLocal(
                        new ej.Query().where("ParentId", "equal", _filteredMeasurementPoints[i].Id)
                    )[0];

                    dataSrc.push([i, data[current.Id].Value]);
                    max = (max > Math.abs(data[current.Id].Value)) ? max : data[current.Id].Value;
                    min = [min, data[current.Id].Value].min();
                    // Color de estado de condicion actual
                    _statusColorList.push(data[current.Id].StatusColor);
                    currentValue = (data[current.Id].Value === undefined) ? 0.0 : data[current.Id].Value;
                    $("#textAfterTitle" + _widgetId).text(" (" + timeStamp + ")");
                    $("#" + _filteredMeasurementPoints[i].Name + _widgetId).children().eq(2).text(currentValue.toFixed(2) + " " + current.Units);
                    $("#" + _filteredMeasurementPoints[i].Name + _widgetId).children().eq(0).css("color", data[current.Id].StatusColor);
                }
                //var max = chart.axes_[0].valueRange.max() * 1.2;
                //var min = chart.axes_[0].valueRange.min();
                _chart.updateOptions({
                    "file": dataSrc,
                    "valueRange": [min * 1.2, max * 1.2],
                });

                if (_mouseover) {
                    _chart.mouseMove_(_lastMousemoveEvt);
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
                }, 100);
                if (_mouseover) {
                    _chart.mouseMove_(_lastMousemoveEvt);
                }
            });
        }

        this.Show = function (measurementPointId, timeStamp) {
            var
                // Menu de opciones para la grafica
                settingsMenu,
                measureSelected,
                filteredSubVariables,
                filteredMeasurementPoints,
                maximum,
                minimum,
                initialData,
                subVar,
                subVariablesGroupBySensor,
                mdVariableListId,
                i;

            switch (_timeMode) {
                case 0: // RT
                    _assetData = selectedAsset;
                    break;
                case 1: // HT
                    measureSelected = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", measureSelected.ParentId, false))[0];
                    break;
                default:
                    break;
            }

            // Si el asset no tiene un asdaq asociado, significa que no se están actualizando los datos tiempo real de las subVariables
            // de sus diferentes measurement points
            if (!_assetData.AsdaqId && !_assetData.AtrId) {
                popUp("info", "No hay datos tiempo real para el activo seleccionado.");
                return;
            }

            _measurementPoints = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("ParentId", "equal", _assetData.AssetId));
            if (_measurementPoints.length === 0) {
                popUp("info", "El activo no tiene puntos de medición relacionados.");
                return;
            }

            _selectedMeasureBySensor = [];
            //_currentSubVariables = clone(subVariableList);
            _filteredSubVariables = [];
            _filteredMeasurementPoints = [];
            _subVariables = [];
            _statusColorList = [];
            _distinctMeasures = ej.DataManager(distinctMeasures).executeLocal(new ej.Query().sortBy("SensorTypeCode", ej.sortOrder.Ascending, false));

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtro", "filterMenuItem"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageBar" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            for (i = 0; i < _measurementPoints.length; i += 1) {
                _subVariables.pushArray(_measurementPoints[i].SubVariables);
            }

            if (_distinctMeasures.length > 0) {
                measureSelected = _distinctMeasures[0];
                filteredSubVariables = ej.DataManager(_subVariables).executeLocal(new ej.Query().where(
                    ej.Predicate("SensorTypeCode", "equal", measureSelected.SensorTypeCode).and("MeasureType", "equal", measureSelected.MeasureType)
                ));

                filteredMeasurementPoints = [];
                for (i = 0; i < filteredSubVariables.length; i += 1) {
                    filteredMeasurementPoints.push(ej.DataManager(_measurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", filteredSubVariables[i].ParentId))[0]);
                }
                _filteredMeasurementPoints = filteredMeasurementPoints;
                // Actualizar la lista de subVariables actuales
                _filteredSubVariables = clone(filteredSubVariables);
                _subVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));
                mdVariableListId = ej.DataManager(_filteredMeasurementPoints).executeLocal(new ej.Query().select("Id"));

                subVariablesGroupBySensor = new ej.DataManager(_subVariables).executeLocal(new ej.Query().group("SensorTypeCode"));

                // Inicializar medida seleccionada por cada distinto sensor
                for (i = 0; i < subVariablesGroupBySensor.length; i += 1) {
                    _selectedMeasureBySensor.push({
                        sensorTypeCode: subVariablesGroupBySensor[i].key,
                        selectedMeasureType: subVariablesGroupBySensor[i].items[0].MeasureType,
                        fromIntegratedWaveform: subVariablesGroupBySensor[i].items[0].FromIntegratedWaveform
                    });
                }

                maximum = ej.max(filteredSubVariables, "Maximum").Maximum;
                minimum = ej.min(filteredSubVariables, "Minimum").Minimum;
                initialData = [];

                /*
                 * Creamos la referencia al AspectrogramWidget.
                 */
                _aWidget = new AspectrogramWidget({
                    widgetId: _widgetId,
                    parentId: "awContainer",
                    content: _container,
                    title: "Gráfico de barras",
                    width: width,
                    height: height,
                    aspectRatio: aspectRatio,
                    graphType: _graphType,
                    timeMode: _timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: _subVariableIdList,
                    asset: _assetData.Name,
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
                // Abrir AspectrogramWidget.
                _aWidget.open();
                _appendLegendDiv();

                for (i = 0; i < _subVariableIdList.length; i += 1) {
                    subVar = new ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().where("Id", "equal", _subVariableIdList[i], false))[0];
                    measureSelected = new ej.DataManager(_filteredMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", subVar.ParentId, false))[0].Name;
                    _dict[measureSelected] = {
                        Id: subVar.Id,
                        Units: subVar.Units,
                        MeasureType: subVar.MeasureType
                    };
                    $("#t" + _widgetId).append("<div id=\"" + measureSelected + _widgetId + "\"></div>");
                    $("#" + measureSelected + _widgetId).append("<span style=\"color:black;\">&#8212;</span>");
                    $("#" + measureSelected + _widgetId).append("<span>&nbsp;" + measureSelected + ":</span>");
                    $("#" + measureSelected + _widgetId).append("<span>&nbsp;</span>");
                    initialData.push([i, null]);
                }

                // Se suscribe a la notificacion de llegada de nuevos datos.
                _subscribeToRefresh(mdVariableListId, timeStamp);
                // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Construir y mostrar grafica.
                _buildGraph(initialData, maximum, minimum, "[" + filteredSubVariables[0].Units + "]", timeStamp);
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
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
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

            _pause = true;
        };
    };

    return BarChartGraph;
})();