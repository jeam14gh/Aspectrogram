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
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Puntos de medicion de la grafica
            _measurementPoints,
            // Referencia a las subvariables del punto de medicion (directa, amplitud 1x, fase 1x)
            _subvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Mantiene la lista de los diferentes tipos de medida a mostrar en el listbox de measures
            _distinctMeasures,
            // Contenedor HTML del dropDownList de tipos de medida
            _measureListContainer,
            // Id del control dropDownList de tipos de medida
            _dropDownListMeasuresId,
            // Listado de puntos de medicion configurados para mostrar
            _filteredMeasurementPoints,
            // Rango en el eje x con el cual se debe resetear el zoom
            _xRange,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            _selectedMeasureBySensor,
            _timeStamp,
            _dict,
            _labels,
            // Colores de estado de condicion de cada subVariable que se esta graficando
            _statusColorList,
            _xLabelIndex,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que crea el DIV contenedor de las leyendas a mostrar del grafico
            _appendLegendDiv,
            // Metodo privado para gestionar la visibilidad de los puntos de medicion agrupados por sensor
            _addSensorAndMeasuresPanel,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado para gestionar una pre-configuracion para construir el chart
            _preBuildGraph,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado para gestionar la visualizacion del menu contextual de filtro
            _showFilterMenu,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
            // Listado de subvariables filtradas por el tipo valor y segun el listado de puntos de medicion configurados (_filteredMeasurementPoints)
            _filteredSubVariables = [],
            // Método privado que crea el aspectrogramWidget con el chart
            _show,
            _lastTimeStamp;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _this = this;
        _movableGrid = false;
        _pause = false;
        _graphType = "bar";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _subvariables = {};
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

        _addSensorAndMeasuresPanel = function (sensorType, measures) {
            var
                measureTypesContainer,
                panelHeading,
                panelBody,
                radioGroupName,
                i,
                selectedMeasureType,
                fromIntegratedWaveform,
                checked,
                measureOption,
                newPanel;

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
                        radioObj,
                        sensorTypeCode,
                        measureType;

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
                i;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "filterMenuItem":
                    _showFilterMenu();
                    break;
                case "saveImageBar" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" +_widgetId:
                    labels = [];
                    if (timeMode == 0) {
                        name = "Tiempo Real, Gráfico de barras: " + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico,  Gráfico de barras: " + _assetData.Name;
                    }
                    contId = "tableToExcelBarChartGraph" + _widgetId;
                    for (i = 0; i < _chart.user_attrs_.labels.length; i += 1) {
                        labels.push(_chart.user_attrs_.labels[i]);
                    }
                    createTableToExcel(_container, contId, name, labels, _chart.file_, true);
                    tableToExcel("tableToExcelBarChartGraph" + _widgetId, name);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
            }
        };

        _showFilterMenu = function () {
            var
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                group, i;

            $("#barFilterAreaDialog").css("display", "block");
            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 500, height: 250 };
            //dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            group = new ej.DataManager(_distinctMeasures).executeLocal(new ej.Query().group("SensorType"));
            for (i = 0; i < group.length; i += 1) {
                _addSensorAndMeasuresPanel(group[i].key, group[i].items);
            }
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
                actionButtons: ["close", "collapsible"]
                //position: {
                //    X: dialogPosition.left,
                //    Y: dialogPosition.top
                //}
            });
            // Botono cancel
            $("#barFilterAreaDialog #btnCancel").click(function (e) {
                e.preventDefault();
                $("#barFilter").ejDialog("close");
            });
            // Boton aceptar
            $("#barFilterAreaDialog #btnFilter").click(function (e) {
                var
                    filteredSubVariables,
                    filteredMeasurementPoints,
                    lastTimeStamp;

                e.preventDefault();
                filteredSubVariables = [];
                // Obtener las subVariables que cumplan con los criterios de tipos de sensor y medida seleccionada por cada tipo
                for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                    if (_selectedMeasureBySensor[i].selectedMeasureType > -1) {
                        filteredSubVariables.pushArray(ej.DataManager(_subvariables).executeLocal(new ej.Query().where(
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

                // Actualizar la lista de subVariables actuales
                _filteredSubVariables = clone(filteredSubVariables);
                _subVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));

                // Si no se ha creado el widget con el chart, entonces se crea y se muestra
                if (!_aWidget) {
                    _show();
                }

                if (!_newDataSubscription) {
                    // Se suscribe a la notificacion de llegada de nuevos datos.
                    _subscribeToNewData(_subVariableIdList);
                }
                else {
                    // Remover las subvariables especificadas dentro de la suscripcion
                    _newDataSubscription.detachItems(currentSubVariableIdList);

                    // Eliminar de la cache las subVariables a consultar en el servidor
                    _aWidget.manageCache(currentSubVariableIdList, "delete");
                }

                switch (timeMode) {
                    case 0:
                        // Actualizar en la cache las subVariables a consultar en el servidor
                        _aWidget.manageCache(_subVariableIdList, "update");
                        // Actualizar las nuevas subvariables a la suscripcion
                        _newDataSubscription.updateItems(_subVariableIdList);
                        break;
                    case 1:
                        lastTimeStamp = /*_chart.*/_lastTimeStamp;
                        break;
                    default:
                        console.log("Modo no soportado.");
                }
                _preBuildGraph(filteredSubVariables, _subVariableIdList, lastTimeStamp);
                $("#barFilter").ejDialog("close");
            });
            $("#barFilter").ejDialog("open");
        };

        _preBuildGraph = function (filteredSubVariables, subVariableIdList, timeStamp) {
            var
                i,
                maximum,
                minimum,
                initialData,
                subVar,
                measureSelected;

            maximum = ej.max(filteredSubVariables, "Maximum").Maximum;
            minimum = ej.min(filteredSubVariables, "Minimum").Minimum;
            initialData = [];
            _dict = [];
            $("#t" + _widgetId).empty();
            for (i = 0; i < subVariableIdList.length; i += 1) {
                subVar = new ej.DataManager(filteredSubVariables).executeLocal(
                    new ej.Query().where("Id", "equal", subVariableIdList[i], false))[0];
                measureSelected = new ej.DataManager(_filteredMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", subVar.ParentId, false))[0].Name;
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
            // Construir y mostrar grafica.
            _buildGraph(initialData, maximum, minimum, "[" + filteredSubVariables[0].Units + "]", timeStamp, subVariableIdList);
        }

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (initialData, maximum, minimum, units, timeStamp, subVariableIdList) {
            if (_chart) {
                _chart.destroy();
            }

            var
                key,
                defaultLabelHTML,
                customInteractionModel,
                headerHeigth;

            _labels = [];
            for (key in _dict) {
                if (_dict.hasOwnProperty(key)) {
                    _labels.push(key);
                }
            }

            _xLabelIndex = -1;
            _xRange = [-1, initialData.length];
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
                    labels: ["Sensor", "Valor"],
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
                        //
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
                        _mouseover = false;
                    },
                    interactionModel: customInteractionModel,
                    axes: {
                        x: {
                            ticker: function (min, max, pixels, opts, dygraph, vals) {
                                var
                                    arr,
                                    i, j;

                                arr = [];
                                i = 0;
                                for (j = min; j < max; ++j) {
                                    if (j == min) {
                                        continue;
                                    }
                                    arr.push({ v: j, label: _labels[i] });
                                    i += 1;
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
                headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigth) + "%";
                setTimeout(function () {
                    _chart.resize();
                }, 100);
            });
            _chart.ready(function () {
                if (timeMode === 1) {
                    _getHistoricalData(timeStamp, subVariableIdList);
                }
            });
            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });
        };

        _getHistoricalData = function (timeStamp, subVariableIdList) {
            var
                // Contadores
                i, j,
                // Id de subvariables no almacenadas
                notStored,
                // Informacion completa necesaria para graficar
                data;

            timeStamp = new Date(timeStamp).getTime();
            if (!Number.isNaN(timeStamp)) {
                aidbManager.GetNumericBySubVariableIdAndTimeStampList(subVariableIdList, [timeStamp], _assetData.NodeId, function (resp) {
                    data = [];
                    notStored = clone(subVariableIdList);
                    for (i = 0; i < resp.length; i += 1) {
                        j = subVariableIdList.indexOf(resp[i].subVariableId);
                        data[j] = {
                            Id: resp[i].subVariableId,
                            TimeStamp: new Date(timeStamp).toISOString(),
                            RawTimeStamp: new Date(timeStamp),
                            Value: clone(resp[i].value),
                            StatusColor: resp[i].statusColor
                        };
                        j = notStored.indexOf(resp[i].subVariableId);
                        notStored.splice(j, 1);
                    }
                    for (i = 0; i < notStored.length; i += 1) {
                        j = subVariableIdList.indexOf(notStored[i]);
                        data[j] = {
                            Id: notStored[i],
                            TimeStamp: new Date(timeStamp).toISOString(),
                            RawTimeStamp: new Date(timeStamp),
                            Value: null,
                            StatusColor: "#999999"
                        };
                    }
                    _refresh(data);
                });
            } else {
                console.log("Fecha no valida.");
            }
        };

        /*
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (subVariableIdList) {
            var
                // Contadores
                index, i,
                // Id de subvariables no almacenadas
                notStored,
                // Informacion completa necesaria para graficar
                data,
                current;

            // Subscripcion a evento para refrescar datos de grafica segun timeMode
            switch (timeMode) {
                case 0: // Tiempo Real
                    _newDataSubscription = PublisherSubscriber.subscribe("/realtime/refresh", subVariableIdList, function (pdata) {
                        data = [];

                        for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                            current = ej.DataManager(_filteredSubVariables).executeLocal(
                                new ej.Query().where("ParentId", "equal", _filteredMeasurementPoints[i].Id)
                            )[0];

                            if (current) {
                                data[i] = {
                                    Id: current.Id,
                                    TimeStamp: pdata[current.Id].RawTimeStamp.toISOString(),
                                    RawTimeStamp: pdata[current.Id].RawTimeStamp,
                                    Value: pdata[current.Id].Value,
                                    StatusColor: pdata[current.Id].StatusColor
                                };
                            }
                        }

                        _refresh(data);
                    });
                    break;
                case 1: // Historico
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!isNaN(currentTimeStamp)) {
                            aidbManager.GetNumericBySubVariableIdAndTimeStampList(subVariableIdList, [currentTimeStamp], _assetData.NodeId, function (resp) {
                                notStored = clone(subVariableIdList);
                                data = [];
                                for (i = 0; i < resp.length; i += 1) {
                                    index = subVariableIdList.indexOf(resp[i].subVariableId);
                                    data[index] = {
                                        Id: resp[i].subVariableId,
                                        TimeStamp: new Date(currentTimeStamp).toISOString(),
                                        RawTimeStamp: new Date(currentTimeStamp),
                                        Value: clone(resp[i].value),
                                        StatusColor: resp[i].statusColor
                                    };
                                    index = notStored.indexOf(resp[i].subVariableId);
                                    notStored.splice(index, 1);
                                }
                                for (i = 0; i < notStored.length; i += 1) {
                                    index = subVariableIdList.indexOf(notStored[i]);
                                    data[index] = {
                                        Id: notStored[i],
                                        TimeStamp: new Date(currentTimeStamp).toISOString(),
                                        RawTimeStamp: new Date(currentTimeStamp),
                                        Value: null,
                                        StatusColor: "#999999"
                                    };
                                }
                                _refresh(data);
                            });
                        }
                    });
                    break;
                default:
                    console.log("Modo no soportado por la aplicación.");
            }
        };

        /*
         * Actualiza los valores a graficar
         */
        _refresh = function (data) {
            if (!_pause) {
                var
                    // Formateo de datos para ser mostrados en la grafica
                    dataSrc,
                    // Valores maximo y minimo en todos los puntos a graficar
                    max, min,
                    // Valor actual del punto de medicion
                    currentValue,
                    // Contador
                    i,
                    txt;

                // Inicializar la lista de datos a "refrescar" en la grafica
                dataSrc = [];
                // Limpiar listado de colores de estado de condicion de las subVariables
                _statusColorList = [];
                max = 0;
                min = 0;
                for (i = 0; i < data.length; i += 1) {
                    dataSrc.push([i, data[i].Value]);
                    max = (max > Math.abs(data[i].Value)) ? max : data[i].Value;
                    min = [min, data[i].Value].min();
                    // Color de estado de condicion actual
                    _statusColorList.push(data[i].StatusColor);
                    currentValue = (data[i].Value === null) ? 0 : data[i].Value;
                    $("#textAfterTitle" + _widgetId).text(" (" + formatDate(data[i].RawTimeStamp) + ")");
                    txt = currentValue.toFixed(2) + " " + _dict[_filteredMeasurementPoints[i].Name].Units;
                    $("#" + _filteredMeasurementPoints[i].Name + _widgetId).children().eq(2).text(txt);
                    $("#" + _filteredMeasurementPoints[i].Name + _widgetId).children().eq(0).css("color", data[i].StatusColor);
                }
                /*_chart.*/_lastTimeStamp = data[0].TimeStamp;
                _chart.updateOptions({
                    "file": dataSrc,
                    "valueRange": [min * 1.2, max * 1.2],
                });

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
                setTimeout(function () {
                    _chart.resize();
                }, 100);
                if (_mouseover) {
                    _chart.mouseMove_(_lastMousemoveEvt);
                }
            });
        }

        _show = function () {
            var
                // Menu de opciones para la grafica
                settingsMenu;

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtro", "filterMenuItem"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageBar" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

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
                timeMode: timeMode,
                asdaqId: _assetData.AsdaqId,
                atrId: _assetData.AtrId,
                subVariableIdList: _subVariableIdList,
                asset: _assetData.Name,
                pause: (timeMode == 0) ? true : false,
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
            // Abrir AspectrogramWidget
            _aWidget.open();
            // Crear el DIV de las leyendas
            _appendLegendDiv();
            // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
            _subscribeToResizeChart();
        }

        this.Show = function (measurementPointId, timeStamp) {
            var
                // Punto de medicion en la seleccion historica
                measurementPoint,
                // Agrupacion de subvariables por tipo de sensor
                group,
                // Contador
                i; 

            switch (timeMode) {
                case 0: // RT
                    _assetData = selectedAsset;

                    // Si el asset no tiene un asdaq asociado, significa que no se estan actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    if (!_assetData.AsdaqId && !_assetData.AtrId) {
                        popUp("info", "No hay datos tiempo real para el activo seleccionado.");
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

            _measurementPoints = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("ParentId", "equal", _assetData.AssetId));
            if (_measurementPoints.length === 0) {
                popUp("info", "El activo no tiene puntos de medición relacionados.");
                return;
            }

            _subvariables = [];
            for (i = 0; i < _measurementPoints.length; i += 1) {
                _subvariables.pushArray(ej.DataManager(_measurementPoints[i].SubVariables).executeLocal(
                        new ej.Query().where("ValueType", "equal", 1)));
            }
            _selectedMeasureBySensor = [];
            group = new ej.DataManager(_subvariables).executeLocal(new ej.Query().group("SensorTypeCode"));
            // Inicializar medida seleccionada por cada distinto sensor
            for (i = 0; i < group.length; i += 1) {
                _selectedMeasureBySensor.push({
                    sensorTypeCode: group[i].key,
                    selectedMeasureType: group[i].items[0].MeasureType,
                    fromIntegratedWaveform: group[i].items[0].FromIntegratedWaveform
                });
            }
            _statusColorList = [];
            _distinctMeasures = ej.DataManager(distinctMeasures).executeLocal(
                new ej.Query().sortBy("SensorTypeCode", ej.sortOrder.Ascending, false));
            if (_distinctMeasures.length > 0) {
                _filteredSubVariables = [];
                // Obtener las subVariables que cumplan con los criterios de tipos de sensor y medida seleccionada por cada tipo
                for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                    if (_selectedMeasureBySensor[i].selectedMeasureType > -1) {
                        _filteredSubVariables.pushArray(ej.DataManager(_subvariables).executeLocal(new ej.Query().where(
                            ej.Predicate("SensorTypeCode", "equal", _selectedMeasureBySensor[i].sensorTypeCode)
                                .and("MeasureType", "equal", _selectedMeasureBySensor[i].selectedMeasureType)
                                .and("FromIntegratedWaveform", "equal", _selectedMeasureBySensor[i].fromIntegratedWaveform)
                            )));
                    }
                }
                _filteredMeasurementPoints = [];
                for (i = 0; i < _filteredSubVariables.length; i += 1) {
                    _filteredMeasurementPoints.push(ej.DataManager(_measurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", _filteredSubVariables[i].ParentId))[0]);
                }
                _subVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));



                _lastTimeStamp = timeStamp;

            // Crear y mostrar modal de filtro
            _showFilterMenu();
            }
        };

        this.Close = function () {
            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }

            if (_playerSubscription) {
                // Eliminar suscripcion de reproductor.
                _playerSubscription.remove();
            }

            if (_resizeChartSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }

            var
                el;

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

    return BarChartGraph;
})();