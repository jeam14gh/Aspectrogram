/*
 * historicalTrendGraph.js
 * Generacion de grafico para tendencia historica.
 * @author Jorge Calderon
 */

var HistoricalTrendGraph = {};

HistoricalTrendGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    HistoricalTrendGraph = function (width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor especifico del chart a graficar
            _contentBody,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Modo: Historico (1)
            _timeMode,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase HistoricalTrendGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Referencia a la clase que administra los menus contextuales
            _ctxMenu,
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Referencia a la suscripcion que sincroniza el chart con la estampa de tiempo del reproductor
            _playerSubscription,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Path del activo
            _path,
            // Colores para cada vez que se agregue una nueva serie a un chart
            _seriesColors,
            // Objeto con las etiquetas de cada punto de medicion como indice, contiene informacion como Id y Unidades a mostrar
            _dict,
            // Listado de puntos de medicion de los cuales se desea tener la informacion
            _filteredMeasurementPoints,
            // Listado de subvariables filtradas por el tipo valor y segun el listado de puntos de medicion configurados (_filteredMeasurementPoints)
            _filteredSubVariables,
            // Bandera que define si el click que se realizo fue sobre un punto especifico de la serie
            _pointClick,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Callback de evento click sobre algun item del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado para la creacion del div que contiene los tags de las series
            _appendLegendDiv,
            // Valor lógico que indica si se muestra o no el eje "y2" correspondiente al eje de Velocidad
            _y2AxisVisible,
            // Metodo privado que gestiona la funcionalidad de mostrar/ocultar el eje y2, que corresponde al eje de Velocidad
            _showHideY2Axis,
            // (0=Hoy, 1=Última semana, 2=Último mes, 3=Último año, 4=Personalizado)
            _presetDateRangeIndex,
            // Fecha inicio actual
            _startDate,
            // Fecha fin actual
            _endDate,
            // Mantiene la lista de los diferentes tipos de medida de los diferentes tipos de sensor del activo seleccionado
            _distinctMeasures = [],
            _addSensorAndMeasuresPanel,
            _selectedMeasureBySensor,
            // Listado de puntos de medicion correspondientes al activo seleccionado
            _measurementPoints,
            // Mantiene la lista de subVariables de cada uno de los measurement point del asset seleccionado al momento de abrir la grafica
            _subVariables = [],
            // Referencia a AspectrogramWidget
            _aWidget,
            _labels,
            _labelsExcel = [],
            // Opciones iniciales para cada serie, principalmente se usa para indicar en cual de los dos ejes "y" se gráfica cada serie
            _seriesOptions,
            // Gestiona el efecto gráfico de cargando...
            _loading,
            // Muestra la gráfica de tendencia luega de que la carga se ha completado
            _loadComplete,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Referencia a la suscripcion para responder a la opcion de recarga del reproductor
            _playerReloadSubcription,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            _cursor,
            _cursorLock,
            _historicalChangeOfRpmList,
            _principalAssetId,
            // Array con la informacion de las diferentes estampas de tiempo en el historico
            _fullTimeStampArray,
            // Texto para el eje Y
            _ylabel;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = 1;  // Exclusivo para modo historico
        _movableGrid = false;
        _this = this;
        _graphType = "historicaltrend";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _pointClick = false;
        _ctxMenu = new CustomContextMenu();
        _cursorLock = false;
        _historicalChangeOfRpmList = [];
        _fullTimeStampArray = [];
        _ylabel = "";

        /*
         * Creamos el contenedor HTML basado en el divId recibido como parametro.
         */
        _container = document.createElement("div");
        _container.id = "historicalTrendGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "historicTrendHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "historicTrendBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        $(_container).append(_contentBody);

        $(_container).append("<div class=\"trendLoadingIndicator text-center\"><i class=\"fa fa-spinner fa-pulse fa-2x\"></i></div>");

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
            var
                // Div que contiene la informacion de la serie
                legendDiv,
                // Porcentaje de altura del DIV que contiene el titulo
                headerHeigthPercentage,
                // Porcentaje de ancho predeterminado de la grafica
                width;

            width = 89;
            headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;

            legendDiv = document.createElement("div");
            legendDiv.id = "t" + _widgetId;
            legendDiv.className = "statusTrend";
            $(legendDiv).css("width", (100 - width) + "%");
            $(legendDiv).css("height", (99.9 - headerHeigthPercentage) + "%");
            $(_contentBody).css("width", width + "%");
            $(_contentBody).css("display", "inline-block");
            $(_contentBody).parent().append(legendDiv);
            $(_contentBody).parent()[0].style.overflow = "hidden";
        };

        /*
         * Callback de evento clic sobre algún item del menú de opciones
         *@param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var
                $target,
                settingsMenuItem,
                i, j, count,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                presetDateRanges,
                today,
                currentYear,
                timeStampArray,
                mdVariableIdList,
                currentMonth,
                currentDay,
                allMeasurementPointList,
                measureTypesGroupBySensorType,
                subVar,
                currentMdVariable,
                anyDifferent,
                current;

            $target = $(event.currentTarget);
            settingsMenuItem = $target.attr("data-value");
            // Gestión de la acción correspondiente a la opción de menú seleccionada por el usuario
            switch (settingsMenuItem) {
                // Mostrar/ocultar series en la grafica de tendencia
                case "measurementPointsMenuItem":
                    $("#trendSeriesVisibilityAreaDialog #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#trendSeriesVisibility").ejDialog("close");
                    });

                    $("#trendSeriesVisibilityAreaDialog #btnSave").click(function (e) {
                        var
                            visibleCheckList,
                            seriesOptions;

                        e.preventDefault();
                        seriesOptions = {};
                        for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
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
                            // Importante para el range selector
                            seriesOptions[_filteredMeasurementPoints[i].Name] = {
                                showInRangeSelector: _filteredMeasurementPoints[i].Visible
                            };
                        }
                        // Actualizar el range selector solo con las series visibles
                        _chart.updateOptions({
                            series: seriesOptions
                        });
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
                    today = new Date();
                    currentYear = today.getFullYear();
                    currentMonth = today.getMonth();
                    currentDay = today.getDate();
                    $("#historicalTrendFilterAreaDialog").css("display", "block");
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 500, height: 500 };
                    dialogPosition = { top: widgetPosition.top, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                    measureTypesGroupBySensorType = new ej.DataManager(_distinctMeasures).executeLocal(new ej.Query().group("SensorType"));
                    for (i = 0; i < measureTypesGroupBySensorType.length; i += 1) {
                        _addSensorAndMeasuresPanel(measureTypesGroupBySensorType[i].key, measureTypesGroupBySensorType[i].items);
                    }
                    $("#historicalTrendFilterAreaDialog #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#historicalTrendFilter").ejDialog("close");
                    });
                    $("#historicalTrendFilterAreaDialog #btnFilter").click(function (e) {
                        var
                            presetDateRangeObj,
                            startDateObj,
                            endDateObj,
                            mdVariableIdList,
                            endDate, key,
                            filteredSubVariables,
                            filteredMeasurementPoints;

                        e.preventDefault();
                        presetDateRangeObj = $("#presetDateRange").data("ejDropDownList");
                        startDateObj = $("#startDate").data("ejDatePicker");
                        endDateObj = $("#endDate").data("ejDatePicker");
                        _presetDateRangeIndex = presetDateRangeObj.selectedIndexValue;
                        _startDate = new Date(startDateObj.getValue()); // Obtener la fecha seleccionada
                        endDate = new Date(endDateObj.getValue()); // Obtener la fecha seleccionada
                        // Garantizar hasta el final del día, es decir la media noche.
                        _endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);
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
                            for (j = 0; j < _filteredMeasurementPoints.length; j += 1) {
                                if (filteredMeasurementPoints[i].Id === _filteredMeasurementPoints[j].Id) {
                                    filteredMeasurementPoints[i].Visible = _filteredMeasurementPoints[j].Visible;
                                    break;
                                }
                            }
                            if (filteredMeasurementPoints[i].IsAngularReference) {
                                _y2AxisVisible = filteredMeasurementPoints[i].Visible;
                            }
                            _seriesOptions[filteredMeasurementPoints[i].Name] = {
                                showInRangeSelector: filteredMeasurementPoints[i].Visible
                            };
                        }

                        // Actualizar la lista de puntos de medicion actuales
                        _filteredMeasurementPoints = clone(filteredMeasurementPoints);
                        // Actualizar la lista de subVariables actuales
                        _filteredSubVariables = clone(filteredSubVariables);

                        _dict = [];
                        _dict["Estampa de tiempo"] = {};
                        for (i = 0; i < _filteredSubVariables.length; i += 1) {
                            subVar = new ej.DataManager(_subVariables).executeLocal(new ej.Query().where("Id", "equal", _filteredSubVariables[i].Id, false))[0];
                            currentMdVariable = new ej.DataManager(_measurementPoints).executeLocal(new ej.Query().where("Id", "equal", subVar.ParentId, false))[0];

                            _dict[currentMdVariable.Name] = {
                                Id: subVar.Id,
                                Units: subVar.Units,
                                Name: subVar.Name,
                                MeasureType: subVar.MeasureType,
                                SensorTypeCode: currentMdVariable.SensorTypeCode
                            };
                        }
                        _seriesOptions = {};
                        _labels = [];

                        anyDifferent = false;

                        for (key in _dict) {
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

                        mdVariableIdList = [];
                        mdVariableIdList.pushArray(ej.DataManager(_filteredMeasurementPoints).executeLocal(new ej.Query().select("Id")));
                        _loading();
                        new HistoricalTimeMode().GetNumericHistoricalData(mdVariableIdList, _principalAssetId, _startDate.toISOString(), _endDate.toISOString(), _widgetId);
                        $("#historicalTrendFilter").ejDialog("close");
                    });

                    $("#historicalTrendFilter").ejDialog({
                        enableResize: false,
                        width: dialogSize.width,
                        height: /*dialogSize.height*/ "auto",
                        zIndex: 2000,
                        close: function () {
                            $("#historicalTrendFilterAreaDialog #measureTypesContainer").empty();
                            $("#presetDateRange").ejDropDownList("destroy");
                            $("#historicalTrendFilterAreaDialog #btnFilter").off("click"); // Necesario desasociar el evento
                            $("#historicalTrendFilterAreaDialog #btnCancel").off("click"); // Necesario desasociar el evento
                            $("#historicalTrendFilterAreaDialog").css("display", "none"); // Ocultar de nuevo el html de la modal
                        },
                        content: "#historicalTrendFilterAreaDialog",
                        actionButtons: ["close"],
                        position: { X: dialogPosition.left, Y: dialogPosition.top } // Posicionar el ejDialog
                    });

                    presetDateRanges = [
                        { id: "1", text: "Hoy" },
                        { id: "2", text: "Última semana" },
                        { id: "3", text: "Último mes" },
                        { id: "4", text: "Último año" },
                        { id: "5", text: "Personalizado" },
                    ]

                    $("#presetDateRange").ejDropDownList({
                        dataSource: presetDateRanges,
                        selectedIndex: _presetDateRangeIndex,
                        width: "90%",
                        watermarkText: "Seleccione un rango",
                        fields: { id: "id", text: "text", value: "id" },
                        change: function (args) {
                            var
                                startDate,
                                endDate,
                                startDateObj,
                                endDateObj;

                            startDate = today;
                            endDate = today;
                            startDateObj = $("#startDate").data("ejDatePicker");
                            endDateObj = $("#endDate").data("ejDatePicker");

                            switch (args.selectedValue) {
                                case "1":
                                    startDateObj.option({ enabled: false });
                                    startDateObj.setModel({ value: startDate });
                                    endDateObj.option({ enabled: false });
                                    endDateObj.setModel({ value: endDate });
                                    break;
                                case "2": // Última semana
                                    startDateObj.option({ enabled: false });
                                    startDateObj.setModel({ value: new Date(currentYear, currentMonth, currentDay - 7) });
                                    endDateObj.option({ enabled: false });
                                    endDateObj.setModel({ value: endDate });
                                    break;
                                case "3": // Último mes
                                    startDateObj.option({ enabled: false });
                                    startDateObj.setModel({ value: new Date(currentYear, currentMonth - 1, currentDay) });
                                    endDateObj.option({ enabled: false });
                                    endDateObj.setModel({ value: endDate });
                                    break;
                                case "4": // Último año
                                    startDateObj.option({ enabled: false });
                                    startDateObj.setModel({ value: new Date(currentYear - 1, currentMonth, currentDay) });
                                    endDateObj.option({ enabled: false });
                                    endDateObj.setModel({ value: endDate });
                                    break;
                                default:
                                    startDateObj.option({ enabled: true });
                                    startDateObj.setModel({ value: startDate });
                                    endDateObj.option({ enabled: true });
                                    endDateObj.setModel({ value: endDate });
                            }
                        }
                    });

                    $("#startDate").ejDatePicker({
                        enabled: (_presetDateRangeIndex == 4),
                        width: "90%",
                        value: _startDate,
                        allowEdit: false,
                        dateFormat: "MM/dd/yyyy"
                    });

                    $("#endDate").ejDatePicker({
                        enabled: (_presetDateRangeIndex == 4),
                        width: "90%",
                        value: _endDate,
                        allowEdit: false,
                        dateFormat: "MM/dd/yyyy"
                    });

                    $("#historicalTrendFilter").ejDialog("open");
                    break;
                case "saveImageHistoric" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    var
                        contId,
                        name,
                        labels;

                    labels = [];
                    name = "Histórico, Tendencia: "  + selectedAsset.Name;
                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    for (i = 0; i < _chart.user_attrs_.labels.length; i += 1) {
                        labels.push(_chart.user_attrs_.labels[i]);
                    }
                    createTableToExcel(_container, contId, name, labels, _chart.file_, true)
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);
                    break;
                case "eventPlayer" + _widgetId:
                    $("#mainTreeContainer").data("ejSplitter").collapse(2);
                    timeStampArray = _fullTimeStampArray.slice(_chart.boundaryIds_[0][0], _chart.boundaryIds_[0][1]);
                    mdVariableIdList = ej.DataManager(_measurementPoints).executeLocal(new ej.Query().where(
                                                ej.Predicate("SensorTypeCode", "equal", 1, true).
                                                    or("SensorTypeCode", "equal", 2, true).or("SensorTypeCode", "equal", 3, true)).select("Id"));
                    // Necesario para darle tiempo al ejSplitter de colapsarse antes de volver a expandirse
                    sleep(500).then(() => {
                        eventPlayerObj.Create(_path, timeStampArray, mdVariableIdList, _widgetId);
                    });
                    break;
                default:
                    console.log("Opcion de menú no implementada");
            }
        };

        /*
         * Construye la grafica, caso no exista.
         * @param {Array} dict
         */
        _buildGraph = function (dict, initialData) {
            var
                historicalRpmPositions,
                customInteractionModel,
                historicalRange,
                currentPoint,
                pairPoint,
                offsetX,
                offsetY,
                colorA,
                colorB,
                key, i,
                anyDifferent,
                current;

            _seriesOptions = {};
            _labels = [];

            anyDifferent = false;

            for (key in dict) {
                if (dict.hasOwnProperty(key)) {
                    _labels.push(key);
                    if (dict[key].MeasureType) {
                        if (dict[key].MeasureType == 9) {
                            _y2AxisVisible = true;
                            // Si es el valor de RPM de la referencia angular, entonces se gráfica en el segundo eje "y"
                            _seriesOptions[key] = { axis: "y2" };
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

            _ctxMenu.CreateMenuByTimeStamp($(_contentBody).parent());
            _ctxMenu.CreateMenuByRange($(_contentBody).parent());
            _appendLegendDiv();
            customInteractionModel = Dygraph.defaultInteractionModel;
            customInteractionModel.contextmenu = function (e, g, ctx) {
                e.preventDefault();
                currentPoint = ej.DataManager(_filteredMeasurementPoints).executeLocal(
                    new ej.Query().where("Name", "equal", g.highlightSet_, false))[0];
                pairPoint = ej.DataManager(_filteredMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", currentPoint.AssociatedMeasurementPointId, false))[0];
                historicalRpmPositions = [];
                historicalRange = _historicalChangeOfRpmList.slice(g.boundaryIds_[0][0], g.boundaryIds_[0][1]);
                for (i = 0; i < historicalRange.length; i += 1) {
                    if (historicalRange[i]) {
                        historicalRpmPositions.push(i + g.boundaryIds_[0][0]);
                    }
                }
                historicalRange = _fullTimeStampArray.slice(g.boundaryIds_[0][0], g.boundaryIds_[0][1]);
                $(".customContextMenu").css("display", "none");
                colorA = g.plotter_.colors[currentPoint.Name];
                colorB = (pairPoint) ? g.plotter_.colors[pairPoint.Name] : "";
                offsetX = (e.offsetX + _contentBody.offsetLeft);
                offsetY = (e.offsetY + _contentBody.offsetTop);
                _ctxMenu.OpenMenuByRange(offsetY, offsetX, currentPoint.Id, colorA, colorB, historicalRange, historicalRpmPositions);
                return false;
            };
            customInteractionModel.click = function (e, g, ctx) {
                if (!_pointClick) {
                    $(".customContextMenu").css("display", "none");
                    _cursorLock = false;
                } else {
                    _cursorLock = true;
                }
                _pointClick = false;
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
                  digitsAfterDecimal: 2, // Para las variables que manejamos, es suficiente con 2 decimales
                  hideOverlayOnMouseOut: false,
                  highlightSeriesOpts: {
                      strokeWidth: 2,
                      strokeBorderWidth: 1,
                      highlightCircleSize: 3,
                  },
                  highlightCallback: function (e, x, pts, row) {
                      if (!_cursorLock) {
                          _cursor.followCursor(pts);
                      }
                  },
                  drawCallback: function (g, is_initial) {
                      if (is_initial) {
                          if (_cursor) {
                              _cursor.clearCursor();
                          }
                          _cursor = new Cursors(g);
                          g.canvas_.style.zIndex = 1;
                      }
                  },
                  zoomCallback: function (minDate, maxDate, yRange) {
                      _showHideY2Axis();
                  },
                  pointClickCallback: function (e, p) {
                      e.preventDefault();
                      var
                        currentPoint,
                        pairPoint,
                        colorA,
                        colorB,
                        offsetX,
                        offsetY,
                        time;
                      $(".customContextMenu").css("display", "none");
                      _pointClick = true;
                      currentPoint = ej.DataManager(_filteredMeasurementPoints).executeLocal(
                          new ej.Query().where("Name", "equal", p.name, false))[0];
                      pairPoint = ej.DataManager(_filteredMeasurementPoints).executeLocal(
                          new ej.Query().where("Id", "equal", currentPoint.AssociatedMeasurementPointId, false))[0];
                      colorA = _chart.plotter_.colors[currentPoint.Name];
                      colorB = (pairPoint) ? _chart.plotter_.colors[pairPoint.Name] : "";
                      time = new Date(p.xval).toISOString();
                      offsetX = (e.offsetY + _contentBody.offsetTop);
                      offsetY = (e.offsetX + _contentBody.offsetLeft);
                      _ctxMenu.OpenMenuByTimeStamp(offsetX, offsetY, currentPoint.Id, time, colorA, colorB);
                      return false;
                  },
                  underlayCallback: function (canvas, area, g) {
                      canvas.strokeStyle = "black";
                      //if (!_y2AxisVisible) {
                      //    $(".grid-stack").data("gridstack").resize($(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent(), 12, 5);
                      //}
                      canvas.strokeRect(area.x, area.y, area.w, area.h);
                  },
                  drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                      if (!_cursorLock) {
                          Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, p);
                      }
                  },
                  plotter: function (e) {
                      Dygraph.Plugins.Plotter.prototype.smoothPlotter(e, 0.0);
                  },
                  showRangeSelector: true,
                  interactionModel: customInteractionModel,
                  xRangePad: 2,
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
                  }
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
            _subscription = PublisherSubscriber.subscribe("/historicTrend/refresh", [_widgetId], function (data) {
                var
                    // Indice de la posicion de data
                    index,
                    // SubVariables retornadas en la consulta de historico
                    subvariables;
                
                for (index in data) {
                    if (data.hasOwnProperty(index)) {
                        if (index != _widgetId) {
                            return;
                        }
                        _fullTimeStampArray = clone(data[index].TimeStampArray);
                        subvariables = clone(data[index].SubVariableIdList);
                    }
                }
                Concurrent.Thread.create(function (subVariables, fullTimeStamp) {
                    var
                        // Contadores
                        i, j,
                        currentTimeStamp,
                        historicalData;

                    for (i = 0; i < subVariables.length; i += 1) {
                        for (j = 0; j < fullTimeStamp.length; j += 1) {
                            currentTimeStamp = new Date(fullTimeStamp[j]).getTime();
                            historicalData = subVariableHTList[subVariables[i]][currentTimeStamp];
                            if (!historicalData) {
                                historicalData = {
                                    HasStream: false,
                                    IsChangeOfRpm: false,
                                    IsEvent: false,
                                    IsNormal: false,
                                    StatusColor: "#999999",
                                    StatusId: "",
                                    TimeStamp: formatDate(new Date(currentTimeStamp), true),
                                    Value: 0.0
                                };
                                subVariableHTList[subVariables[i]][currentTimeStamp] = historicalData;
                            }
                        }
                    }
                }, subvariables, _fullTimeStampArray);
                _refresh(_fullTimeStampArray);
                _loadComplete();
            });
            var
                mdVariableIdList,
                today, row,
                currentYear,
                currentMonth,
                currentDay;

            mdVariableIdList = [];
            mdVariableIdList.pushArray(ej.DataManager(_measurementPoints).executeLocal(new ej.Query().select("Id")));

            today = new Date(); // Fecha actual
            currentYear = today.getFullYear();
            currentMonth = today.getMonth();
            currentDay = today.getDate();

            // Por defecto se consulta tendencia del día actual
            _presetDateRangeIndex = 0;
            _endDate = new Date(currentYear, currentMonth, currentDay, 23, 59, 59); // Garantizar hasta el final del día, es decir la media noche.
            _startDate = new Date(currentYear, currentMonth, currentDay);

            new HistoricalTimeMode().GetNumericHistoricalData(mdVariableIdList, _principalAssetId, _startDate.toISOString(), _endDate.toISOString(), _widgetId);
            _playerSubscription = PublisherSubscriber.subscribe("/player/timeStamp", [_widgetId], function (data) {
                // Primer paso es encontrar la columna que corresponde al valor del timeStamp
                row = _chart.findClosestRow(_chart.toDomXCoord(data[_widgetId]));
                _chart.setSelection(row);
                _cursorLock = true;
                _cursor.followCursor(_chart.selPoints_);
            });
            _playerReloadSubcription = PublisherSubscriber.subscribe("/playerReload/refresh", [_widgetId], function (data) {
                var
                    mdVariableIdList,
                    i,
                    timeStampArray;

                if (data[_widgetId]) {
                    data = [];
                    timeStampArray = [];
                    if ((_chart.boundaryIds_[0][1] - _chart.boundaryIds_[0][0]) > 0) {
                        for (i = _chart.boundaryIds_[0][0]; i <= _chart.boundaryIds_[0][1]; i += 1) {
                            if ((i > _chart.boundaryIds_[0][0]) && (_chart.file_[i][0] > _chart.file_[i - 1][0])) {
                                timeStampArray.push(_chart.file_[i][0].toISOString());
                            }
                        }
                    }
                    data[_widgetId] = timeStampArray;
                    PublisherSubscriber.publish("/newTrendRange/refresh", data);
                }
            });
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {Object} data Informacion obtenida del poll
         * @param {Array} fullTimeStampArray Informacion de la estampa de tiempo completa del rango de historico abierto
         * @param {Object} chart Referencia al grafico (necesario para actualizar los valores)
         */
        _refresh = function (fullTimeStampArray) {
            var
                // Valor del historico en cada una de las iteraciones
                historicalData,
                // Datos a graficar en el chart
                buffer,
                currentTimeStamp,
                subVar,
                angularReferenceCount,
                // Contadores
                i, j, k;

            buffer = [];
            _historicalChangeOfRpmList = [];
            k = buffer.length;
            for (i = 0; i < _filteredSubVariables.length; i += 1) {
                for (j = 0; j < fullTimeStampArray.length; j += 1) {
                    currentTimeStamp = new Date(fullTimeStampArray[j]);
                    if (i == 0) {
                        buffer[j + k] = [];
                        buffer[j + k][0] = currentTimeStamp;
                        currentTimeStamp = currentTimeStamp.getTime();
                        historicalData = subVariableHTList[_filteredSubVariables[i].Id][currentTimeStamp];
                        if (historicalData) {
                            _historicalChangeOfRpmList.push(historicalData.IsChangeOfRpm);
                            buffer[j + k][i + 1] = historicalData.Value;
                        } else {
                            _historicalChangeOfRpmList.push(false);
                            buffer[j + k][i + 1] = 0.0;
                        }
                    } else {
                        currentTimeStamp = currentTimeStamp.getTime();
                        historicalData = subVariableHTList[_filteredSubVariables[i].Id][currentTimeStamp];
                        if (historicalData) {
                            buffer[j + k][i + 1] = historicalData.Value;
                        } else {
                            buffer[j + k][i + 1] = 0.0;
                        }
                    }
                }
            }

            if (buffer.length == 0) {
                for (i = 0; i < _filteredSubVariables.length; i += 1) {
                    if (i == 0) {
                        buffer[0] = [];
                        buffer[0][0] = new Date();
                        buffer[0][i + 1] = 0;
                    }
                    buffer[0][i + 1] = null;
                }
            }
            _chart.is_initial_draw_ = true;
            Concurrent.Thread.create(function (buffer, labels, seriesOptions, chart, ylabel) {
                chart.updateOptions({
                    "file": buffer,
                    "labels": labels,
                    "series": seriesOptions,
                    "ylabel": ylabel
                });
            }, buffer, _labels, _seriesOptions, _chart, _ylabel);

            angularReferenceCount = 0;
            for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                _chart.setVisibility(i, _filteredMeasurementPoints[i].Visible);
                if (_filteredMeasurementPoints[i].IsAngularReference) {
                    angularReferenceCount += 1;
                }
            }
            // En caso de seleccionar por medio del filtro de tendencia que no se muestre
            // ningun valor asociado a referencia angular, _y2AxisVisible = false
            _y2AxisVisible = (angularReferenceCount === 0) ? false : _y2AxisVisible;
            _showHideY2Axis();
            _aWidget.setTextAfterTitle(" (" + formatDate(_startDate, false, false) + " - " + formatDate(_endDate, false, false) + ")");
        };

        /*
         * Muestra/oculta el eje Y2 o eje de Velocidad
         */
        _showHideY2Axis = function () {
            if (_y2AxisVisible) {
                $("#" + _container.id + " .dygraph-axis-label-y2").show();
                $("#" + _container.id + " .dygraph-y2label").show();
            } else {
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

            measureTypesContainer = $("#historicalTrendFilterAreaDialog #measureTypesContainer");

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
                        "<label><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} {3}></input>{4}</label>".JsFormat(
                            radioGroupName,
                            measures[i].MeasureType,
                            (measures[i].FromIntegratedWaveform) ? "fromintegratedwaveform" : "",
                            checked,
                            measures[i].Name));

                    panelBody.append(measureOption);
                }

                checked = (selectedMeasureType == -1) ? "checked" : ""; // -1=Ninguno

                // Opción "Ninguno"
                measureOption = $("<div class=\"radio\"></div>");
                measureOption.append(
                    "<label><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} {3}></input>{4}</label>".JsFormat(
                        radioGroupName,
                        -1,
                        "",
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

        _loading = function () {
            $(_contentBody).hide();
            $("#t" + _widgetId).hide();
            $("#" + "historicalTrendGraph" + _widgetId + " .trendLoadingIndicator").show();
        }

        _loadComplete = function () {
            $("#" + "historicalTrendGraph" + _widgetId + " .trendLoadingIndicator").hide();
            $(_contentBody).show();
            $("#t" + _widgetId).show();
        }

        this.Show = function () {
            if (!selectedAsset) {
                popUp("info", "No se ha seleccionado un activo.");
                return;
            }

            _measurementPoints = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("ParentId", "equal", selectedAsset.AssetId));
            if (_measurementPoints.length === 0) {
                popUp("info", "El activo no tiene puntos de medición relacionados.");
                return;
            }
            _principalAssetId = (selectedAsset.IsPrincipal) ? selectedAsset.AssetId : selectedAsset.PrincipalAssetId;

            var
                i,
                subVar,
                initialData,
                // Menu de opciones para la gráfica
                settingsMenu,
                subVariablesGroupBySensor,
                currentMdVariable;

            _filteredMeasurementPoints = [];
            _filteredSubVariables = [];
            settingsMenu = [];

            _distinctMeasures = clone(distinctMeasures);
            _subVariables = clone(subVariableList);

            // Aqui realizamos el filtrado de los puntos de medicion a graficar (por defecto: todos)
            _filteredMeasurementPoints.pushArray(mdVariableList);
            _path = selectedAsset.Name;
            if (!selectedAsset.IsPrincipal) {
                _path = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("Id", "equal", selectedAsset.ParentId))[0].Name + "\\" + _path;
            }
            var tmpList = {};
            var count = 0;

            // Inicializar todas las series como visibles
            for (i = 0; i < _filteredMeasurementPoints.length; i += 1) {
                if (_filteredMeasurementPoints[i].AngularReferenceId !== null && !tmpList.hasOwnProperty(_filteredMeasurementPoints[i].AngularReferenceId)) {
                    tmpList[_filteredMeasurementPoints[i].AngularReferenceId] = true;
                    count = ej.DataManager(_filteredMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", _filteredMeasurementPoints[i].AngularReferenceId)).length;
                    if (count === 0) {
                        _filteredMeasurementPoints.pushArray(ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                            new ej.Query().where("Id", "equal", _filteredMeasurementPoints[i].AngularReferenceId)));
                        _subVariables.pushArray(_filteredMeasurementPoints[_filteredMeasurementPoints.length - 1].SubVariables);
                    }
                }
                _filteredMeasurementPoints[i].Visible = true;
            }

            // Aqui realizamos el filtrado de las subVariables a graficar (por defecto: aquellas donde IsDefaultValue = true)
            _filteredSubVariables = ej.DataManager(_subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true));
            if (_filteredSubVariables.length === 0) {
                popUp("info", "No hay subvariables marcadas para valor por defecto.");
                return;
            }
            // Obtenemos la lista de los Ids de subvariable a graficar
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

            initialData = [];
            _dict = [];
            _dict["Estampa de tiempo"] = {};
            for (i = 0; i < _filteredSubVariables.length; i += 1) {
                subVar = new ej.DataManager(_subVariables).executeLocal(new ej.Query().where("Id", "equal", _filteredSubVariables[i].Id, false))[0];
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
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageHistoric" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Reproductor", "eventPlayer" + _widgetId));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

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
                subVariableIdList: _subVariableIdList,
                asset: selectedAsset.Name,
                pause: false,
                reload: true,
                settingsMenu: settingsMenu,
                onSettingsMenuItemClick: _onSettingsMenuItemClick,
                onClose: function () {
                    _this.Close();
                },
                onMove: function () {
                    _movableGrid = !_movableGrid;
                    var gridStack = $(".grid-stack").data("gridstack");
                    var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    gridStack.movable(grid, _movableGrid);
                },
                onReload: function () {
                    var
                        mdVariableIdList;

                    mdVariableIdList = [];

                    // *********************************************************************************************************
                    // NO OLVIDAR QUE PODEMOS OPTIMIZAR ESTO MAS, SI VALIDAMOS LAS ESTAMPAS EXISTENTES Y SOLO CONSULTAR LO NUEVO
                    // *********************************************************************************************************

                    mdVariableIdList.pushArray(ej.DataManager(_filteredMeasurementPoints).executeLocal(new ej.Query().select("Id")));
                    new HistoricalTimeMode().GetNumericHistoricalData(mdVariableIdList, _principalAssetId, _startDate.toISOString(), _endDate.toISOString(), _widgetId);
                }
            });

            // Abrir AspectrogramWidget.
            _aWidget.open();
            
            _buildGraph(_dict, initialData);
            _loading();

            // Se suscribe a la notificacion de llegada de los datos
            _subscribeToRefresh();
            // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
            _subscribeToResizeChart();
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
            }
            if (_resizeChartSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }
            if (_playerReloadSubcription) {
                _playerReloadSubcription.remove();
            }
            if (_playerSubscription) {
                _playerSubscription.remove();
            }

            var
                grid,
                el,
                data;

            data = [];
            data[_widgetId] = true;
            PublisherSubscriber.publish("/historicClose/refresh", data);

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
    }

    return HistoricalTrendGraph;
})();