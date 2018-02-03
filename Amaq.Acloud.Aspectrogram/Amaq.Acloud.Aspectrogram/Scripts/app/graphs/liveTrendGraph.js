/*
 * liveTrendGraph.js
 * Generacion de grafico para tendencia instantanea.
 * @author ACLOUD TEAM
 */

var LiveTrendGraph = {};

LiveTrendGraph = (function ()
{
    "use strict";

    /*
     * Constructor.
     */
    LiveTrendGraph = function (width, height, aspectRatio)
    {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor especifico del chart a graficar
            _contentBody,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Modo: Tiempo real (0)
            _timeMode,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase LiveTrendGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Colores para cada vez que se agregue una nueva serie a un chart
            _seriesColors,
            // Objeto con las etiquetas de cada punto de medicion como indice, contiene informacion como Id y Unidades a mostrar
            _dict,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Mantiene la lista de measurement points del asset seleccionado al momento de abrir la gráfica
            _measurementPoints = [],
            // Mantiene la lista de subVariables de cada uno de los measurement point del asset seleccionado al momento de abrir la gráfica
            _subVariables = [],
            // Listado de puntos de medicion de los cuales se desea tener la informacion
            _filteredMeasurementPoints = [],
            // Listado de subvariables filtradas por el tipo valor y segun el listado de puntos de medicion configurados (_filteredMeasurementPoints)
            _filteredSubVariables = [],
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            _appendLegendDiv,
            _title,
            _assetData,
            // Mantiene en memoria todos los datos que se están graficando en el chart
            _buffer,
            // Vector con las etiquetas de cada punto de medición
            _labels,
            // Estampa de tiempo de los datos actuales
            _currentTimeStamp,
            // Valor lógico que indica si se muestra o no el eje "y2" correspondiente al eje de Velocidad
            _y2AxisVisible,
            // Metodo privado que gestiona la funcionalidad de mostrar/ocultar el eje y2, que corresponde al eje de Velocidad
            _showHideY2Axis,
            // Callback de evento click sobre algún item del menú de opciones
            _onSettingsMenuItemClick,
            // Mantiene la lista de los diferentes tipos de medida de los diferentes tipos de sensor del activo seleccionado
            _distinctMeasures = [],
            _addSensorAndMeasuresPanel,
            _selectedMeasureBySensor,
            // Opciones iniciales para cada serie, principalmente se usa para indicar en cual de los dos ejes "y" se gráfica cada serie
            _seriesOptions,
            // Referencia a la suscripción para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Método privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            //creación de Modal para filtro
            _createFilterMenu, 
            // Texto para el eje Y
            _ylabel;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = 0;  // Exclusivo para modo tiempo real
        _pause = false;
        _movableGrid = false;
        _this = this;
        _graphType = "livetrend";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _buffer = [];
        _dict = [];
        _ylabel = "";

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "liveTrendGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "liveTrendHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "liveTrendBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        $(_container).append(_contentBody);

        /*
         * Set de colores para las diferentes series dentro de la grafica
         */
        _seriesColors = [
            "#5A4DB2", "#54A4AF", "#FC8A15", "#1EE494", "#623448",
            "#8C7676", "#D62B70", "#D8D95C", "#415865", "#F677F7",
            "#49157C", "#90F2FF", "#83B271", "#AB1212", "#0092CA",
            "#388E3C", "#FBB448", "#8C7676", "#D62B70", "#D8D95C",
            "#6A5C55", "#FF4545", "#141829", "#191BA9", "#FEBFB3"
        ];

        /*
         * Crea un DIV al lado del contenedor de la grafica para mostrar las
         * etiquetas de las diferentes sieres en la grafica
         */
        _appendLegendDiv = function () {
            var width, headerHeigthPercentage;
            width = 88.9;
            $(_contentBody).css("width", width + "%");
            $(_contentBody).css("display", "inline-block");
            headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            $(_contentBody).parent().append("<div class=\"statusTrend\" id=\"t" + _widgetId + "\" style=\"width:" + (100 - width) +
                "%;height:" + (99.9 - headerHeigthPercentage) + "%;\"></div>");
        };

        /*
         * Callback de evento click sobre algún item del menú de opciones
         *@param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var $target = $(event.currentTarget),
                settingsMenuItem = $target.attr("data-value"),
                i, count,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                presetDateRanges,
                allMeasurementPointList,
                measureTypesGroupBySensorType,
                subVar,
                currentMdVariable,
                anyDifferent,
                current;

            // Gestión de la acción correspondiente a la opción de menú seleccionada por el usuario
            switch (settingsMenuItem) {
                // Mostrar/ocultar series en la gráfica de tendencia
                case "measurementPointsMenuItem":
                    $("#trendSeriesVisibilityAreaDialog #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#trendSeriesVisibility").ejDialog("close");
                    });

                    $("#trendSeriesVisibilityAreaDialog #btnSave").click(function (e) {
                        var
                            visibleCheckList;

                        e.preventDefault();
                        for (i = 0; i < _filteredMeasurementPoints.length; i++) {
                            _filteredMeasurementPoints[i].Visible = false;
                        }
                        visibleCheckList = $("#measurementPointCheckList").ejListBox("getCheckedItems");
                        for (i = 0; i < visibleCheckList.length; i += 1) {
                            if (visibleCheckList[i].index > 0) {
                                _filteredMeasurementPoints[visibleCheckList[i].index - 1].Visible = true;
                            }
                        }
                        for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                            _chart.setVisibility(i, _filteredMeasurementPoints[i].Visible);
                            if (_filteredMeasurementPoints[i].IsAngularReference) {
                                _y2AxisVisible = _filteredMeasurementPoints[i].Visible;
                            }
                        }
                        _showHideY2Axis();
                        $("#trendSeriesVisibility").ejDialog("close");
                    });

                    $("#trendSeriesVisibilityAreaDialog").css("display", "block");
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 280, height: 390 };
                    dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };

                    $("#trendSeriesVisibility").ejDialog({
                        enableResize: false,
                        width: dialogSize.width,
                        height: dialogSize.height,
                        zIndex: 2000,
                        close: function () {
                            $("#measurementPointCheckList").ejListBox("destroy"); // Destruir objeto Listbox Syncfusion
                            $("#trendSeriesVisibilityAreaDialog #btnSave").off("click"); // Necesario desasociar el evento
                            $("#trendSeriesVisibilityAreaDialog #btnCancel").off("click"); // Necesario desasociar el evento
                            $("#trendSeriesVisibilityAreaDialog").css("display", "none"); // Ocultar de nuevo el html de la modal
                        },
                        content: "#trendSeriesVisibilityAreaDialog",
                        actionButtons: ["close"],
                        position: { X: dialogPosition.left, Y: dialogPosition.top } // Posicionar el ejDialog
                    });

                    $("#trendSeriesVisibility").ejDialog("open");
                    count = 0;
                    for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                        if (_filteredMeasurementPoints[i].Visible) {
                            count += 1;
                        }
                    }
                    allMeasurementPointList = [{ Id: 0, Name: "Mostrar/Ocultar Todos", Visible: (count === _filteredMeasurementPoints.length) }];
                    allMeasurementPointList.pushArray(_filteredMeasurementPoints);
                    $("#measurementPointCheckList").ejListBox({
                        dataSource: allMeasurementPointList,
                        fields: { id: "Id", text: "Name", value: "Id", checkBy: "Visible" },
                        height: "280",
                        showCheckbox: true,
                        checkChange: function (args) {
                            if (args.data.Id === 0 && args.data.Visible) {
                                $("#measurementPointCheckList").ejListBox("uncheckAll");
                                args.data.Visible = false;
                            } else if (args.data.Id === 0 && !args.data.Visible) {
                                $("#measurementPointCheckList").ejListBox("checkAll");
                                args.data.Visible = true;
                            } else {
                                count = $("#measurementPointCheckList").ejListBox("getCheckedItems").length;
                                if (count === _filteredMeasurementPoints.length) {
                                    $("#measurementPointCheckList").ejListBox("checkItemByIndex", 0);
                                    $("#measurementPointCheckList").ejListBox("getItemByIndex", 0).data.Visible = true;
                                } else if (count === 1) {
                                    $("#measurementPointCheckList").ejListBox("uncheckItemByIndex", 0);
                                    $("#measurementPointCheckList").ejListBox("getItemByIndex", 0).data.Visible = false;
                                }
                            }
                        }
                    });
                    break;
                case "filterMenuItem":
                    _createFilterMenu();
                    break;
                case "saveImageLive" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    var contId, name, labels = [];
                    name = 'Tiempo Real, Tendencia' + assetData.Name;
                    contId = 'tableToExcelWaveformGraph' + _widgetId;

                    for (var j = 0; j < _chart.user_attrs_.labels.length; j++) {
                        labels.push(_chart.user_attrs_.labels[j]);
                    }

                    createTableToExcel(_container, contId, name, labels, _chart.file_, true)
                    tableToExcel('tableToExcelWaveformGraph' + _widgetId, name);

                    break;
                default:
                    console.log("Opcion de menu no implementada");
            }
        };

        /*
         * Construye la grafica, caso no exista.
         * @param {Array} dict
         */
        _buildGraph = function (dict, initialData) {
            var anyDifferent,
                current;

            if (_chart) {
                _chart.destroy();
            }
            var
                customInteractionModel;

            _seriesOptions = {};
            _labels = [];

            anyDifferent = false;

            for (var key in dict) {
                if (dict.hasOwnProperty(key)) {
                    _labels.push(key);

                    if (dict[key].MeasureType) {
                        if (dict[key].MeasureType == 9) {
                            _y2AxisVisible = true;
                            _seriesOptions[key] = { axis: "y2" }; // Si es el valor de RPM de la referencia angular, entonces se gráfica en el segundo eje "y"
                        }
                        else {
                            _seriesOptions[key] = { axis: "y" }; // Eje "y" principal o primario

                            if (!current) {
                                current = dict[key];
                            }
                            else {
                                if (dict[key].SensorTypeCode != current.SensorTypeCode || dict[key].MeasureType != current.MeasureType) {
                                    anyDifferent = true;
                                }
                            }
                        }
                    }
                }
            }

            // Si hay sensores y/o medidas diferentes entre puntos de medición, entonces la etiquete del eje Y es "Valor"
            if (anyDifferent) {
                _ylabel = "Valor";
            }
            else {
                if (current) {
                    _ylabel = current.Name + ' [' + current.Units + ']';
                }
            }

            _appendLegendDiv();
            customInteractionModel = Dygraph.defaultInteractionModel;
            customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                return false;
            };
            customInteractionModel.click = function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            };

            var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigthPercentage) + "%";

            _chart = new Dygraph(
              _contentBody,
              initialData,
              {
                  colors: _seriesColors,
                  legend: "always",
                  xlabel: "Estampa de tiempo",
                  ylabel: _ylabel,
                  y2label: "Velocidad [Rpm]",
                  labels: _labels,
                  series: _seriesOptions,
                  labelsDiv: document.getElementById("t" + _widgetId),
                  axisLabelFontSize: 10,
                  labelsSeparateLines: true,
                  digitsAfterDecimal: 2,
                  hideOverlayOnMouseOut: false,
                  highlightSeriesOpts: {
                      strokeWidth: 2,
                      strokeBorderWidth: 1,
                      highlightCircleSize: 3,
                  },
                  zoomCallback: function (minDate, maxDate, yRange) {
                      _showHideY2Axis();
                  },
                  highlightCallback: function (e, x, pts, row) {
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
                  valueFormatter: function (val, opts, seriesName, d, row, col) {
                      var formattedValue;

                      if (seriesName == "Estampa de tiempo") {
                          return formatDate(new Date(val));
                      } else {
                          // Si es un valor de RPM
                          if (_dict[seriesName].MeasureType == 9) {
                              // Un valor de RPM no debe tener decimales
                              formattedValue = val.toFixed(0);
                          }
                          else {
                              // Para las variables que manejamos, es suficiente con 2 decimales
                              formattedValue = val.toFixed(2);
                          }

                          return formattedValue + " " + _dict[seriesName].Units;
                      }
                  },
                  axes: {
                      x: {
                          axisLabelWidth: 100,
                          axisLabelFormatter: function (d, gran, opts) {
                              return Dygraph.dateAxisLabelFormatter(new Date(d.getTime()), gran, opts);
                          },
                      },
                      y: {
                          axisLabelWidth: 40,
                      },
                      y2: {
                          digitsAfterDecimal: 1,
                          includeZero: true,
                          drawAxesAtZero: true,
                          independentTicks: true,
                          axisLabelWidth: 40
                      }
                  },
                  interactionModel: customInteractionModel
              }
            );

            _showHideY2Axis();

            $(".grid-stack-item").on("resizestop", function () {
                var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
                setTimeout(function () {
                    _chart.resize();
                }, 100);
            });

            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });
        };

        _subscribeToRefresh = function () {
            _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                var
                    current,
                    lastTimeStamp,
                    currentPosition,
                    i, j;

                // Si no existe ninguna estampa de tiempo, se verifica la maxima para con esta poder verificar si realmente llegan datos nuevos.
                if (!_currentTimeStamp) {
                    lastTimeStamp = data[_subVariableIdList[0]].RawTimeStamp.getTime();
                    for (i = 0; i < _subVariableIdList.length; i += 1) {
                        if (data[_subVariableIdList[i]].RawTimeStamp.getTime() > lastTimeStamp) {
                            lastTimeStamp = data[_subVariableIdList[i]].RawTimeStamp.getTime();
                        }
                    }
                    _currentTimeStamp = lastTimeStamp;
                    return;
                }

                // Se restringe a un maximo de 1000 datos por serie para mantener graficado 
                // y en RAM
                if (_buffer.length > 1000) {
                    _buffer.splice(0, 2);
                }
                
                for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                    current = ej.DataManager(_filteredSubVariables).executeLocal(
                        new ej.Query().where("ParentId", "equal", _filteredMeasurementPoints[i].Id)
                    )[0];

                    if (i === 0) {
                        currentPosition = _buffer.length;
                    }
                    if (current) {
                        if (data[current.Id].RawTimeStamp.getTime() > _currentTimeStamp) {
                            if (!_buffer[currentPosition]) {
                                _buffer[currentPosition] = [new Date(data[current.Id].RawTimeStamp.getTime())];
                                for (j = 0; j < _filteredMeasurementPoints.length; j += 1) {
                                    _buffer[currentPosition][j + 1] = null;
                                }
                            }
                            _buffer[currentPosition][i + 1] = data[current.Id].Value;
                            lastTimeStamp = data[current.Id].RawTimeStamp.getTime();
                        }
                    }
                }
                if (lastTimeStamp) {
                    _currentTimeStamp = lastTimeStamp;
                }

                if (_buffer.length > 0) {
                    _refresh(_buffer, _pause, _chart);
                }
            });
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {String} data Informacion obtenida del poll
         */
        _refresh = function (data, pause, chart) {
            if (!pause) {
                chart.updateOptions({
                    "file": data,
                    "labels": _labels,
                    "series": _seriesOptions,
                    "ylabel": _ylabel
                });

                //for (i = 0; i < _filteredMeasurementPoints.length; i++) {
                //    _filteredMeasurementPoints[i].Visible = true; // Por defecto visibles las series de todos los puntos de medición en el chart
                //    chart.setVisibility(i, true);
                //}

                _showHideY2Axis();

                if (_mouseover) {
                    chart.mouseMove_(_lastMousemoveEvt);
                }
            }
        };

        /*
         * Muestra/oculta el eje Y2 o eje de Velocidad
         */
        _showHideY2Axis = function () {
            if (_y2AxisVisible) {
                $("#" + _container.id + " .dygraph-axis-label-y2").show();
                $("#" + _container.id + " .dygraph-y2label").show();
            }
            else {
                $("#" + _container.id + " .dygraph-axis-label-y2").hide();
                $("#" + _container.id + " .dygraph-y2label").hide();
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

            measureTypesContainer = $("#liveTrendFilterAreaDialog #measureTypesContainer");

            panelHeading = $("<div class=\"panel-heading\" style=\"padding-top:5px !important;padding-bottom:5px !important;\"></div>");
            panelHeading.append("<h3 class=\"panel-title\">{0}</h3>".JsFormat(sensorType));

            panelBody = $("<div class=\"panel-body\" style=\"padding-top:0 !important;padding-bottom:0 !important;\"></div>");

            if (measures.length > 0) {
                radioGroupName = "sensor_" + measures[0].SensorTypeCode;

                for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                    if (_selectedMeasureBySensor[i].sensorTypeCode == measures[0].SensorTypeCode) {
                        selectedMeasureType = _selectedMeasureBySensor[i].selectedMeasureType; // Medida seleccionada actualmente para el tipo de sensor
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
                        '<label><input type="radio" name="{0}" value="{1}" {2} {3}></input>{4}</label>'.JsFormat(
                            radioGroupName,
                            measures[i].MeasureType,
                            (measures[i].FromIntegratedWaveform) ? 'fromintegratedwaveform' : '',
                            checked,
                            measures[i].Name));

                    panelBody.append(measureOption);
                }

                checked = (selectedMeasureType == -1) ? "checked" : ""; // -1=Ninguno

                // Opción "Ninguno"
                measureOption = $("<div class=\"radio\"></div>");
                measureOption.append(
                    '<label><input type="radio" name="{0}" value="{1}" {2} {3}></input>{4}</label>'.JsFormat(
                        radioGroupName,
                        -1,
                        '',
                        checked,
                        "Ninguno"));

                panelBody.append(measureOption);
                // Opción "Ninguno"
            }

            newPanel = $("<div class=\"panel panel-default\"></div>");
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
                    fromIntegratedWaveform = radioObj.is('[fromintegratedwaveform]');

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

        _createFilterMenu = function () {
            var $target = $(event.currentTarget),
                settingsMenuItem = $target.attr("data-value"),
                i,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                presetDateRanges,
                measureTypesGroupBySensorType,
                subVar,
                currentMdVariable,
                anyDifferent,
                current;
            $("#liveTrendFilterAreaDialog").css("display", "block");

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 250, height: 500 };
            dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };

            measureTypesGroupBySensorType = new ej.DataManager(_distinctMeasures).executeLocal(new ej.Query().group("SensorType"));

            for (var i = 0; i < measureTypesGroupBySensorType.length; i += 1) {
                _addSensorAndMeasuresPanel(measureTypesGroupBySensorType[i].key, measureTypesGroupBySensorType[i].items);
            }

            $("#liveTrendFilterAreaDialog #btnCancel").click(function (e) {
                e.preventDefault();
                $("#liveTrendFilter").ejDialog("close");
            });

            $("#liveTrendFilterAreaDialog #btnFilter").click(function (e) {
                var
                    mdVariableIdList,
                    endDate,
                    filteredSubVariables,
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
                for (i = 0; i < filteredSubVariables.length; i += 1) {
                    filteredMeasurementPoints.push(ej.DataManager(_measurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", filteredSubVariables[i].ParentId))[0]);
                }
                _filteredMeasurementPoints = filteredMeasurementPoints;

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

                _dict = [];
                _dict["Estampa de tiempo"] = {};
                var initialData = [];

                for (i = 0; i < _subVariableIdList.length; i += 1) {
                    subVar = new ej.DataManager(_subVariables).executeLocal(new ej.Query().where("Id", "equal", _subVariableIdList[i], false))[0];
                    currentMdVariable = new ej.DataManager(_measurementPoints).executeLocal(new ej.Query().where("Id", "equal", subVar.ParentId, false))[0];

                    _dict[currentMdVariable.Name] = {
                        Id: subVar.Id,
                        Units: subVar.Units,
                        Name: subVar.Name,
                        MeasureType: subVar.MeasureType,
                        SensorTypeCode: currentMdVariable.SensorTypeCode
                    };

                    if (i == 0) {
                        initialData[0] = [];
                        initialData[0][0] = new Date();
                        initialData[0][i + 1] = 0;
                    }
                    initialData[0][i + 1] = null;
                }

                _seriesOptions = {};
                _labels = [];

                anyDifferent = false;

                for (var key in _dict) {
                    if (_dict.hasOwnProperty(key)) {
                        _labels.push(key);

                        if (_dict[key].MeasureType) {
                            if (_dict[key].MeasureType == 9) {
                                _y2AxisVisible = true;
                                _seriesOptions[key] = { showInRangeSelector: true, axis: "y2" }; // Si es el valor de RPM de la referencia angular, entonces se gráfica en el segundo eje "y"
                            }
                            else {
                                _seriesOptions[key] = { showInRangeSelector: true, axis: "y" }; // Eje "y" principal o primario

                                if (!current) {
                                    current = _dict[key];
                                }
                                else {
                                    if (_dict[key].SensorTypeCode != current.SensorTypeCode || _dict[key].MeasureType != current.MeasureType) {
                                        anyDifferent = true;
                                    }
                                }
                            }
                        }
                    }
                }

                // Si hay sensores y/o medidas diferentes entre puntos de medición, entonces la etiquete del eje Y es "Valor"
                if (anyDifferent) {
                    _ylabel = "Valor";
                }
                else {
                    if (current) {
                        _ylabel = current.Name + ' [' + current.Units + ']';
                    }
                }

                $("#t" + _widgetId).remove();
                _buildGraph(_dict, initialData);

                $("#liveTrendFilter").ejDialog("close");
            });

            $("#liveTrendFilter").ejDialog({
                enableResize: false,
                width: dialogSize.width,
                height: /*dialogSize.height*/ "auto",
                zIndex: 2000,
                close: function () {
                    $("#liveTrendFilterAreaDialog #measureTypesContainer").empty();
                    $("#liveTrendFilterAreaDialog #btnFilter").off("click"); // Necesario desasociar el evento
                    $("#liveTrendFilterAreaDialog #btnCancel").off("click"); // Necesario desasociar el evento
                    $("#liveTrendFilterAreaDialog").css("display", "none"); // Ocultar de nuevo el html de la modal
                },
                content: "#liveTrendFilterAreaDialog",
                actionButtons: ["close"],
                position: { X: dialogPosition.left, Y: dialogPosition.top } // Posicionar el ejDialog
            });

            $("#liveTrendFilter").ejDialog("open");
        };

        this.Show = function () {
            if (!selectedAsset) {
                popUp("info", "No se ha seleccionado un activo.");
                return;
            }

            // Si el asset no tiene un asdaq asociado, significa que no se están actualizando los datos tiempo real de las subVariables
            // de sus diferentes measurement points
            if (!selectedAsset.AsdaqId && !selectedAsset.AtrId) {
                popUp("info", "No hay datos tiempo real para el activo seleccionado.");
                return;
            }

            _measurementPoints = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("ParentId", "equal", selectedAsset.AssetId));
            if (_measurementPoints.length === 0) {
                popUp("info", "El activo no tiene puntos de medición relacionados.");
                return;
            }


            var
                initialData,
                subVar,
                i,
                // Menu de opciones para la grafica
                settingsMenu,
                subVariablesGroupBySensor,
                currentMdVariable;

            _distinctMeasures = clone(distinctMeasures);
            _subVariables = clone(subVariableList);

            // Aqui realizamos el filtrado de los puntos de medicion a graficar (por defecto: todos)
            _filteredMeasurementPoints.pushArray(mdVariableList);

            // Inicializar todas las series como visibles
            for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                _filteredMeasurementPoints[i].Visible = true;
            }

            // Por el momento solo vamos a graficar de cada punto de medición su valor global,
            // es decir la subVariable con la propiedad IsDefaultValue = true.
            _filteredSubVariables = ej.DataManager(_subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true));
            _subVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));

            _selectedMeasureBySensor = [];
            subVariablesGroupBySensor = new ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().group("SensorTypeCode"));

            // Inicializar medida seleccionada por cada distinto sensor
            for (i = 0; i < subVariablesGroupBySensor.length; i += 1) {
                _selectedMeasureBySensor.push({
                    sensorTypeCode: subVariablesGroupBySensor[i].key,
                    selectedMeasureType: subVariablesGroupBySensor[i].items[0].MeasureType,
                    fromIntegratedWaveform: subVariablesGroupBySensor[i].items[0].FromIntegratedWaveform
                });
            }
           
            // Los nombres de los puntos de medicion son los label para cada una de las series, incluyendo la estampa de tiempo
            initialData = [];
            _dict["Estampa de tiempo"] = {};

            for (i = 0; i < _subVariableIdList.length; i += 1) {
                subVar = new ej.DataManager(_subVariables).executeLocal(new ej.Query().where("Id", "equal", _subVariableIdList[i], false))[0];
                currentMdVariable = new ej.DataManager(_measurementPoints).executeLocal(new ej.Query().where("Id", "equal", subVar.ParentId, false))[0];

                _dict[currentMdVariable.Name] = {
                    Id: subVar.Id,
                    Units: subVar.Units,
                    Name: subVar.Name,
                    MeasureType: subVar.MeasureType,
                    SensorTypeCode: currentMdVariable.SensorTypeCode
                };

                if (i == 0) {
                    initialData[0] = [];
                    initialData[0][0] = new Date();
                    initialData[0][i + 1] = 0;
                }
                initialData[0][i + 1] = null;
            }

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Puntos de medición...", "measurementPointsMenuItem"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtro...", "filterMenuItem"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageLive" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

            _assetData = selectedAsset;
            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Tendencia",
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: _timeMode,
                asdaqId: selectedAsset.AsdaqId,
                atrId: selectedAsset.AtrId,
                subVariableIdList: _subVariableIdList,
                asset: selectedAsset.Name,
                pause: true,
                reload: true,
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
                },
                onReload: function () {
                    _buffer = [];
                }
            });

            

            // Abrir AspectrogramWidget.
            _aWidget.open();
            //Se crea modal con filtro filtro
            _createFilterMenu();
            // Se suscribe a la notificacion de llegada de nuevos datos tiempo real
            _subscribeToRefresh();
            // Se suscribe a la notificación de aplicación de resize para el chart Dygraph
            _subscribeToResizeChart();
            
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

            $.each(globalsReport.elemDygraph, function (i) {
                if (globalsReport.elemDygraph[i].id === _container.id) {
                    globalsReport.elemDygraph.splice(i, 1);
                    return false;
                }
            });

            _pause = true;
        };
    }

    return LiveTrendGraph;
})();