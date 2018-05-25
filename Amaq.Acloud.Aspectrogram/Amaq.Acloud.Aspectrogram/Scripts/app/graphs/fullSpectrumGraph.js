/*
 * fullSpectrumGraph.js
 * Gestiona todo lo relacionado a la grafica del espectro de la orbita.
 * @author Jorge Calderon
 */

/* globals Dygraph, windowing, ImageExport, createTableToExcel, tableToExcel, SerieSynchronizer, globalsReport, Cursors, ej, mainCache,
   xCoordinateUnits, DygraphOps, PublisherSubscriber, enableFilter, stopFrequency, aidbManager, HistoricalTimeMode, selectedAsset,
   cursorType, clone, formatDate, AspectrogramWidget, HammingWindow, HanningWindow, popUp, isEmpty, FourierTransform, GetBSIFactor,
   document, parseAng, arrayColumn, chartScaleY, selectedMeasurementPoint, spectrumTypes, GetFullSpectrumWithBin*/

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
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase SpectrumGraph
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
            // Objeto cuyas propiedades corresponden a informacion relacionada a los puntos de medicion (x, y)
            _measurementPoints,
            // Referencia a las subvariables del punto de medicion en X (forma de onda, directa, fase 1x, amplitud 1x)
            _xSubvariables,
            // Referencia a las subvariables del punto de medicion en Y (forma de onda, directa, fase 1x, amplitud 1x)
            _ySubvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
            _rotn,
            // Referencia a los ultimos datos que se han graficado
            _currentData,
            // Bandera que indica si la grafica se debe autoescalar
            _autoscale,
            // Valor maximo en Y de todos los graficos del mismo tipo de sensor abiertos
            _largestY,
            // Valor maximo en la escala manual Y
            _scaleY,
            // Tipo de ventaneo con que se grafica el espectro
            _windowing,
            // Ultima grafica donde se efectuo clic
            _lastClickedGraph,
            // Unidad en la que se representa el eje de las abscisas
            _xCoordinateUnit,
            // Referencia a la instancia de cursores
            _cursor,
            // Tipo de cursor seleccionado
            _cursorType,
            // Tipo de espectro seleccionado para mostrar en la grafica
            _selectedSpectrumType,
            // Array de los diferentes armonicos en la grafica
            _nxArray,
            // Valor que determina la cantidad de armonicos que se muestran por el cursor armonico
            _harmonicCount,
            // Valor que determina la cantidad de bandas que se muestran por el cursor de bandeamiento
            _sidebandCount,
            // Posicion inicial del cursor armonico
            _harmonicIni,
            // Posicion inicial del cursor de bandeamiento
            _sidebandIni,
            // Ancho del cursor de bandeamiento
            _sidebandWidth,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Referencia a la suscripcion para aplicar filtro dinamico
            _dynamicFilterSubscription,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Referencia a la suscripcion que realiza realiza el escalado segun el valor maximo de las graficas abiertas del mismo tipo
            _scaleChartDisplacement,
            // Referencia a la suscripcion que realiza realiza el escalado segun el valor maximo de las graficas abiertas del mismo tipo
            _scaleChartVelocity,
            // Referencia a la suscripcion que realiza realiza el escalado segun el valor maximo de las graficas abiertas en aceleracion
            _scaleChartAcceleration,
            // Metodo privado que realiza un ajuste del eje
            _adjustAxis,
            // Metodo privado que aplica una derivativa antes de graficar segun seleccion del usuario. (Ninguna, Integral, Derivar)
            _applyDerivative,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que calcula el factor necesario para realizar la derivacion (basado en las unidades actual/destino)
            _computeFactorToDerive,
            // Metodo privado que calcula el factor necesario para realizar la integracion (basado en las unidades actual/destino)
            _computeFactorToIntegrate,
            // Metodo privado para gestionar/configurar el tipo de cursor mostrado
            _configureCursor,
            // Metodo privado que genera el menu de las diferentes unidades del eje de abscisas gestionables en el grafico
            _createAbscissaUnitsMenu,
            // Metodo privado que genera el menu de los diferentes cursores gestionables en el grafico
            _createCursorMenu,
            // Metodo privado que genera el menu de los diferentes tipos de espectro gestionables en el grafico
            _createSpectrumTypeMenu,
            // Metodo privado que genera el menu de los diferentes ventaneos aplicables al grafico
            _createWindowingMenu,
            // Metodo privado que gestiona los cambios de tipo de cursor por accion de usuario
            _cursorTypeManagement,
            // Metodo privado que obtiene los valores correspondientes al espectro de aceleracion segun el tipo de sensor y las unidades configuradas
            _getAccelerationSpectrum,
            // Obtiene las unidades del valor en amplitud mostrado en la grafica, dependiendo del tipo de sensor y el tipo de espectro seleccionado
            _getCurrentYUnits,
            // Metodo privado que obtiene los valores correspondientes al espectro de desplazamiento segun el tipo de sensor y las unidades configuradas
            _getDisplacementSpectrum,
            // Metodo privado que calcula el espectro total (Full Spectrum) a mostrar
            _getFullSpectrum,
            // Metodo privado para calcular los armonicos en los limites del grafico
            _getHarmonicLimits,
            // Metodo privado que obtiene los valores correspondientes al espectro de velocidad segun el tipo de sensor y las unidades configuradas
            _getVelocitySpectrum,
            // Metodo privado para calcular el porcentaje de ajuste
            _offsetToPercentage,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que permite re-dibujar nuevamente el grafico
            _redrawGraph,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona los cambios de tipo de espectro por accion de usuario
            _spectrumTypeManagement,
            _serieSynchronizer,
            // Metodo privado que realiza la suscripcion al publisher para aplicar filtro dinamico
            _subscribeToDynamicFilter,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que realiza el escalado segun el valor maximo de las graficas abiertas del mismo tipo
            _subscribeToScaleChart,
            // Metodo privado que gestiona los cambios de tipo de ventaneo por accion de usuario
            _windowingManagement,
            // Metodo privado que gestiona los cambios de unidad del eje X por accion de usuario
            _xCoordinateUnitManagement,
            // Metodo privado para la interaccion del control de zoom de la grafica
            _zoom,
            // Metodo privado que genera el menú de escalas del gráfico
            _createScaleYMenu,
            // Método privado que gestiona la escala en Y del gráfico automaticamente
            _autoScaleYManagement,
            // Método privado que gestiona manualmente la escala en Y del gráfico.
            _manualScaleYManagement,
            // Valor de escala en Y del gráfico de manera manual
            _yScaleValue;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _pause = false;
        _movableGrid = false;
        _autoscale = true;
        _this = this;
        _graphType = "fullSpectrum";
        _widgetId = Math.floor(Math.random() * 100000);
        _measurementPoints = {};
        _xSubvariables = {};
        _ySubvariables = {};
        _windowing = clone(windowing.Hanning);
        _lastClickedGraph = null;
        _cursorType = cursorType.None;
        _xCoordinateUnit = clone(xCoordinateUnits.Cpm);
        _harmonicCount = 5;
        _sidebandCount = 5;
        _yScaleValue = null;

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
                labels;

            target = $(evt.currentTarget);
            menuItem = target.attr("data-value");
            switch (menuItem) {
                case "saveImage" + _widgetId:
                    // RECORDAR INCLUIR TAMBIEN LOS CURSORES
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "velocitySpectrum" + _widgetId:
                case "accelerationSpectrum" + _widgetId:
                    _spectrumTypeManagement(target, menuItem);
                    break;
                case "xCoordinateCpm" + _widgetId:
                case "xCoordinateOrder" + _widgetId:
                case "xCoordinateHertz" + _widgetId:
                    _xCoordinateUnitManagement(target, menuItem);
                    break;
                case "noneCursor" + _widgetId:
                case "normalCursor" + _widgetId:
                case "harmonicCursor" + _widgetId:
                case "sidebandCursor" + _widgetId:
                    _cursorTypeManagement(target, menuItem);
                    break;
                case "cfgCursor" + _widgetId:
                    _configureCursor();
                    break;
                case "noneWindow" + _widgetId:
                case "hammingWindow" + _widgetId:
                case "hanningWindow" + _widgetId:
                    _windowingManagement(target, menuItem);
                    break;
                case "exportToExcel" + _widgetId:
                    if (timeMode === 0) {
                        name = "Tiempo Real, Espectro de amplitud: " + _assetData.Name;
                    } else if (timeMode === 1) {
                        name = "Histórico, Espectro de amplitud: " + _assetData.Name;
                    }
                    contId = "tableToExcelFullSpectrumGraph" + _widgetId;
                    labels = [_chart.user_attrs_.xlabel, _chart.user_attrs_.ylabel];
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false);
                    tableToExcel("tableToExcelFullSpectrumGraph" + _widgetId, name);
                    break;
                //case "manualScaleY" +_widgetId:
                //    var labelY = $("#fullSpectrumBody" + _widgetId).find(".dygraph-ylabel").text();
                //    _manualScaleYManagement(target, menuItem, labelY, _widgetId);
                //    break;
                case "autoScaleY" + _widgetId:
                    _autoScaleYManagement(target, menuItem);
                    break;
                case "manualScaleY" + _widgetId:
                    var labelY = $("#fullSpectrumBody" + _widgetId).find(".dygraph-ylabel").text();
                    _manualScaleYManagement(target, menuItem, labelY, _widgetId);
                    break;
                default:
                    console.log("Opción de menú no implementada.");
            }
            return false;
        };

        _spectrumTypeManagement = function (target, menuItem) {
            var
                children,
                i;

            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
            switch (menuItem) {
                case "displacementSpectrum" + _widgetId:
                    _selectedSpectrumType = clone(spectrumTypes.Displacement);
                    break;
                case "velocitySpectrum" + _widgetId:
                    _selectedSpectrumType = clone(spectrumTypes.Velocity);
                    break;
                case "accelerationSpectrum" + _widgetId:
                    _selectedSpectrumType = clone(spectrumTypes.Acceleration);
                    break;
            }
            _redrawGraph();
        };

        _xCoordinateUnitManagement = function (target, menuItem) {
            var
                children,
                i;

            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
            switch (menuItem) {
                case "xCoordinateCpm" + _widgetId:
                    _xCoordinateUnit = clone(xCoordinateUnits.Cpm);
                    break;
                case "xCoordinateOrder" + _widgetId:
                    _xCoordinateUnit = clone(xCoordinateUnits.Order);
                    break;
                case "xCoordinateHertz" + _widgetId:
                    _xCoordinateUnit = clone(xCoordinateUnits.Hertz);
                    break;
            }
            _chart.updateOptions({
                "xlabel": "Frecuencia [" + _xCoordinateUnit.Text + "]"
            });
            _redrawGraph();
        };

        _cursorTypeManagement = function (target, menuItem) {
            var
                velocityValue,
                children,
                i;

            velocityValue = 0;
            if (_angularSubvariable && _angularSubvariable.Value !== null) {
                velocityValue = _angularSubvariable.Value;
            }
            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
            $("[data-value=\"cfgCursor" + _widgetId + "\"]").hide();
            switch (menuItem) {
                case "noneCursor" + _widgetId:
                    _cursorType = clone(cursorType.None);
                    _cursor.clearCursor();
                    _cursor.detachLabels();
                    break;
                case "normalCursor" + _widgetId:
                    _cursorType = clone(cursorType.Normal);
                    _cursor.normalCursor((velocityValue / 60) * _xCoordinateUnit.Factor, _xCoordinateUnit);
                    break;
                case "harmonicCursor" + _widgetId:
                    _cursorType = clone(cursorType.Harmonic);
                    $("[data-value=\"cfgCursor" + _widgetId + "\"]").show();
                    _harmonicIni = (velocityValue / 60) * _xCoordinateUnit.Factor;
                    _cursor.harmonicCursor(_harmonicIni, _harmonicCount);
                    break;
                case "sidebandCursor" + _widgetId:
                    _cursorType = clone(cursorType.SideBand);
                    $("[data-value=\"cfgCursor" + _widgetId + "\"]").show();
                    _sidebandIni = (velocityValue / 60) * _xCoordinateUnit.Factor;
                    _cursor.sidebandCursor(_sidebandIni, _sidebandCount);
                    break;
            }
        };

        _windowingManagement = function (target, menuItem) {
            var
                children,
                i;

            children = target.parent().parent().children();
            for (i = 0; i < children.length; i += 1) {
                children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            }
            target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
            switch (menuItem) {
                case "noneWindow" + _widgetId:
                    _windowing = clone(windowing.None);
                    break;
                case "hammingWindow" + _widgetId:
                    _windowing = clone(windowing.Hamming);
                    break;
                case "hanningWindow" + _widgetId:
                    _windowing = clone(windowing.Hanning);
                    break;
            }
            _currentData = _getFullSpectrum(_xSubvariables.waveform, _ySubvariables.waveform);
            _redrawGraph();
        };

        _configureCursor = function () {
            var
                configParameters,
                configContainer,
                i,
                cursorIni,
                cursorCount;

            // Obtener los valores de configuracion del cursor
            if (_cursorType === cursorType.Harmonic) {
                configParameters = _cursor.getHarmonicConfig();
                _harmonicCount = configParameters.count;
                _harmonicIni = configParameters.initial;
            } else {
                configParameters = _cursor.getSidebandConfig();
                _sidebandCount = configParameters.count;
                _sidebandIni = configParameters.initial;
                _sidebandWidth = configParameters.width;
            }
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = "cfgCursor" + _widgetId;
            $("#" + _container.id).append(configContainer);
            i = "#" + configContainer[0].id + " > div.graphConfigArea > div > form";
            // Configurar posicion inicial
            cursorIni = (_cursorType === cursorType.Harmonic) ? "harmonicIni" + _widgetId : "sidebandIni" + _widgetId;
            $(i).append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $(i + " > div:nth-child(1) > div").append("<div class=\"col-md-5\"><label for=\"" + cursorIni +
                  "\" style=\"font-size:12px;\">Posici&oacute;n inicial</label></div>");
            $(i + " > div:nth-child(1) > div").append("<div class=\"col-md-7\"><input type=\"number\" id=\"" + cursorIni + "\" " +
              "name=\"" + cursorIni + "\" style=\"width:100%;\"></div>");
            // Configurar la cantidad de armonicos/bandas segun tipo
            cursorCount = (_cursorType === cursorType.Harmonic) ? "harmonicNumber" + _widgetId : "sidebandNumber" + _widgetId;
            $(i).append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $(i + " > div:nth-child(2) > div").append("<div class=\"col-md-5\"><label for=\"" + cursorCount + "\" style=\"font-size:12px;\">" +
                  "N&uacute;mero de arm&oacute;nicos</label></div>");
            $(i + " > div:nth-child(2) > div").append("<div class=\"col-md-7\"><input type=\"number\" id=\"" + cursorCount + "\" " +
              "name=\"" + cursorCount + "\" style=\"width:100%;\"></div>");
            // Configurar el ancho de las bandas (solo para cursor de bandeamiento)
            $(i).append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            if (_cursorType === cursorType.Harmonic) {
                $(i + " > div:nth-child(3)").hide();
                $("#harmonicNumber" + _widgetId).val(_harmonicCount);
                $("#harmonicIni" + _widgetId).val(_harmonicIni);
            } else {
                $(i + " > div:nth-child(3) > div").append("<div class=\"col-md-5\"><label for=\"bandWidth" + _widgetId + "\" style=\"font-size:12px;\">" +
                  "Ancho de las bandas</label></div>");
                $(i + " > div:nth-child(3) > div").append("<div class=\"col-md-7\"><input type=\"number\" id=\"bandWidth" + _widgetId + "\" " +
                  "name=\"bandWidth" + _widgetId + "\" style=\"width:100%;\"></div>");
                $("#sidebandNumber" + _widgetId).val(_sidebandCount);
                $("#sidebandIni" + _widgetId).val(_sidebandIni);
                $("#bandWidth" + _widgetId).val(_sidebandWidth * _xCoordinateUnit.Factor);
            }
            $(i).append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
            $(i + " > div:nth-child(4) > div").append("<div style=\"text-align: center;\"></div>");
            $(i + " > div:nth-child(4) > div > div:nth-child(1)").append("\n<a id=\"btnSaveCount" + _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveCount" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $(i + " > div:nth-child(4) > div > div:nth-child(1)").append("\n<a id=\"btnCancelCount" + _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelCount" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#" + configContainer[0].id + " > div.graphConfigArea").attr("title", "Configurar Cursor");
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                enableResize: false,
                title: "Configurar Cursor",
                width: "auto",
                height: "auto",
                zIndex: 20000,
                close: function () {
                    $("#btnCancelCount" + _widgetId).off("click");
                    $("#btnSaveCount" + _widgetId).off("click");
                    $("#" + configContainer[0].id).remove();
                },
                content: "#" + configContainer[0].id,
                tooltip: {
                    close: "Cerrar"
                },
                actionButtons: ["close"],
                position: { X: 0, Y: 0 }
            });
            // Abrir dialogo
            $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
            // Boton cancelar
            $("#btnCancelCount" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            // Boton aceptar
            $("#btnSaveCount" + _widgetId).click(function (e) {
                if (_cursorType === cursorType.Harmonic) {
                    _harmonicCount = parseFloat($("#harmonicNumber" + _widgetId).val());
                    _harmonicCount = (_harmonicCount > 13) ? 13 : _harmonicCount;
                    _harmonicIni = parseFloat($("#harmonicIni" + _widgetId).val());
                    _cursor.setHarmonicConfig(_harmonicCount, _harmonicIni);
                    _cursor.updateHarmonicPositions(_xCoordinateUnit);
                } else {
                    _sidebandCount = parseFloat($("#sidebandNumber" + _widgetId).val());
                    _sidebandCount = (_sidebandCount > 13) ? 13 : _sidebandCount;
                    _sidebandIni = parseFloat($("#sidebandIni" + _widgetId).val());
                    _sidebandWidth = parseFloat($("#bandWidth" + _widgetId).val());
                    _cursor.setSidebandConfig(_sidebandCount, _sidebandIni, _sidebandWidth);
                    _cursor.updateSidebandPositions(_xCoordinateUnit);
                }
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labels) {
            var
                // Porcentaje de altura del contenendor superior a la grafica
                headerHeigth,
                // Contador
                i,
                // Texto a mostrar de forma dinamica
                txt,
                // Valor de velocidad
                velocity;

            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            _chart = new Dygraph(
                _contentBody,
                [[0, 0, 0]],
                {
                    colors: ["#006ACB", "#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Frecuencia [" + ((_xCoordinateUnit.Text === "X") ? "Orden" : _xCoordinateUnit.Text) + "]",
                    ylabel: "Amplitud [" + _xSubvariables.overall.Units + "]",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: labels,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    underlayCallback: function (canvas, area, g) {
                        var
                            left,
                            right;

                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                        left = g.toDomCoords(enableFilter ? -stopFrequency * _xCoordinateUnit.Factor : 0, -20);
                        right = g.toDomCoords(enableFilter ? stopFrequency * _xCoordinateUnit.Factor : 0, +20);
                        left = left[0];
                        right = right[0];
                        canvas.fillStyle = "rgba(255, 255, 102, 1.0)";
                        canvas.fillRect(left, area.y, right - left, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        txt = {};
                        for (i = 0; i < pts.length; i += 1) {
                            if (pts[i].name === "Reverse") {
                                txt.Reverse = "<b>" + pts[i].name + "</b> " + ": " + (pts[i].yval < 0 ? "" : "&nbsp;") + pts[i].yval.toFixed(2);
                                txt.Reverse += " " + _getCurrentYUnits() + " @ ";
                                if (_xCoordinateUnit.Value === xCoordinateUnits.Order.Value) {
                                    if ((_angularSubvariable && _angularSubvariable.Value !== null)) {
                                        txt.Reverse += parseFloat(pts[i].xval.toFixed(2) / (_angularSubvariable.Value / 60)).toFixed(2);
                                        txt.Reverse += " " + _xCoordinateUnit.Text;
                                    } else {
                                        txt.Reverse += "--";
                                    }
                                } else {
                                    txt.Reverse += pts[i].xval.toFixed(2) + " " + _xCoordinateUnit.Text;
                                }
                            } else {
                                txt.Forward = "<b>" + pts[i].name + "</b> " + ": " + (pts[i].yval < 0 ? "" : "&nbsp;") + pts[i].yval.toFixed(2);
                                txt.Forward += " " + _getCurrentYUnits() + " @ ";
                                if (_xCoordinateUnit.Value === xCoordinateUnits.Order.Value) {
                                    if ((_angularSubvariable && _angularSubvariable.Value !== null)) {
                                        txt.Forward += parseFloat(pts[i].xval.toFixed(2) / (_angularSubvariable.Value / 60)).toFixed(2);
                                        txt.Forward += " " + _xCoordinateUnit.Text;
                                    } else {
                                        txt.Forward += "--";
                                    }
                                } else {
                                    txt.Forward += pts[i].xval.toFixed(2) + " " + _xCoordinateUnit.Text;
                                }
                            }
                        }
                        if (txt.Reverse === undefined) {
                            txt.Reverse = "<b>Reverse</b>: -- @ --";
                        }
                        if (txt.Forward === undefined) {
                            txt.Forward = "<b>Forward</b>: -- @ --";
                        }
                        $("#Reverse" + _widgetId).html(txt.Reverse);
                        $("#Forward" + _widgetId).html(txt.Forward);
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    drawCallback: function (g, initial) {
                        var
                            nDoc,
                            // DIVs contenedores de los labels en los ejes X e Y de la grafica
                            axisLabelDivs,
                            //
                            i;

                        if (initial) {
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
                                nDoc.style.width = "auto";
                                nDoc.style.height = $(this).css("height");
                                nDoc.style.zIndex = 1055;
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
                                nDoc.style.zIndex = 1055;
                                nDoc.innerHTML = "Forward";
                                return $(nDoc);
                            });
                            if (_angularSubvariable && _angularSubvariable.Value !== null) {
                                velocity = _angularSubvariable.Value;
                            } else {
                                velocity = 0;
                            }
                            _cursor = new Cursors(g, _xCoordinateUnit, _getCurrentYUnits(), velocity);
                            $("[data-value=\"cfgCursor" + _widgetId + "\"]").hide();
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + ylabel
                        $("#" + _contentBody.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1025);
                        $("#" + _contentBody.id + " .dygraph-ylabel").eq(0).parent().parent().css("z-index", 1025);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _contentBody.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1025);
                        }
                    },
                    drawHighlightPointCallback: function (g, serie, ctx, cx, cy, color, p) {
                        for (i = 0; i < g.selPoints_.length; i += 1) {
                            if (Number.isNaN(g.selPoints_[i].yval)) {
                                g.selPoints_.splice(i, 1);
                            }
                        }
                        Dygraph.Circles.DEFAULT(g, serie, ctx, cx, cy, color, p);
                    },
                    interactionModel: _customInteractionModel
                }
            );
            $(".grid-stack-item").on("resizestop", function () {
                headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigth) + "%";
                if (_angularSubvariable && _angularSubvariable.Value !== null) {
                    velocity = _angularSubvariable.Value;
                } else {
                    velocity = 0;
                }
                setTimeout(function () {
                    _chart.resize();
                    $("#Reverse" + _widgetId).css("width", _contentBody.style.width);
                    $("#Reverse" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                    $("#Forward" + _widgetId).css("width", _contentBody.style.width);
                    $("#Forward" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                    _cursor.resizeCanvas();
                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions(_xCoordinateUnit);
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions(_xCoordinateUnit);
                    }
                }, 100);
            });
            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });

          
        };

        _redrawGraph = function () {
            var
                // Indica si la grafica esta en modo auto
                auto,
                // Indica si es un espectro de aceleracion
                accelerationSprectum,
                // Indica si es un espectro de velocidad 
                velocitySprectum,
                // Datos a graficar
                xyData,
                // Valor de velocidad
                velocity,
                // Armonico 1x base
                nxBase,
                // Valor maximo de amplitud
                maximumY,
                // 
                scaleY,
                // Fila de la seleccion actual
                row,
                // Posicion inicial de la ventana a mostar del grafico sobre el eje X
                xIni,
                // Posicion final de la ventana a mostar del grafico sobre el eje X
                xEnd,
                // Texto dinamico a desplegar del sensor en X
                txtX,
                // Texto dinamico a desplegar del sensor en Y
                txtY;

            auto = $("li>a[data-value= autoScaleY" + _widgetId + "]>i").hasClass("fa-check-square");
            // Determinamos si el tipo de espectro (aceleracion, velocidad... en caso de no ser ninguno, el por defecto)
            accelerationSprectum = $("li>a[data-value=accelerationSpectrum" + _widgetId + "]>i").hasClass("fa-check-square");
            velocitySprectum = $("li>a[data-value=velocitySpectrum" + _widgetId + "]>i").hasClass("fa-check-square");
            // Aplicar la operacion necesaria segun el tipo de espectro seleccionado
            xyData = _applyDerivative();
            _nxArray = [];
            velocity = 0;
            if (_angularSubvariable && _angularSubvariable.Value !== null) {
                velocity = Math.round((_angularSubvariable.Value / 60 + 0.00001) * 100) / 100;
            }
            nxBase = (velocity === 0) ? 0 : velocity;
            // Crear array de las diferentes posiciones de armonicos
            if (nxBase > 0) {
                for (row = nxBase; row < xyData.length / 2; row += nxBase) {
                    _nxArray.push(row);
                }
            }
            // Calculamos maximo y minimo de la grafica
            if (xyData.length > 0) {
                maximumY = [arrayColumn(xyData, 1).max(), arrayColumn(xyData, 2).max()].max();
            }
            // Redefinimos los valores maximo y minimo de la grafica basado en todas las graficas abiertas
            if (_largestY === 0) {
                _largestY = maximumY;
            }
            // Gestiona la escala en Y manual o auto de la grafica
            if (_yScaleValue && !_autoscale) {
                _largestY = _yScaleValue;
            } else {
                if (_scaleY !== undefined) {
                    scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(_widgetId, "WidgetId"));
                    if (scaleY.length == 1) {
                        if (velocitySprectum && (scaleY[0].Velocity !== null)) {
                            _largestY = scaleY[0].Velocity;
                        } else if (accelerationSprectum && (scaleY[0].Acceleration !== null)) {
                            _largestY = scaleY[0].Acceleration;
                        } else {
                            _largestY = scaleY[0].Proximity;
                        }
                    }
                }
            }

            xIni = -(xyData.length * _xCoordinateUnit.Factor / 2);
            xEnd = (xyData.length * _xCoordinateUnit.Factor / 2);
            if (_chart.boundaryIds_[0][0] !== _chart.boundaryIds_[0][1]) {
                xIni = xyData[_chart.boundaryIds_[0][0]][0];
                xEnd = xyData[_chart.boundaryIds_[1][1]][0];
            }
            _chart.updateOptions({
                "file": xyData,
                "ylabel": _chart.user_attrs_.ylabel,
                "xlabel": "Frecuencia [" + ((_xCoordinateUnit.Text === "X") ? "Orden" : _xCoordinateUnit.Text) + "]",
                "valueRange": [0, _largestY * (_autoscale ? 1.1 : 1)],
                "dateWindow": [xIni, xEnd]
            });
            // Texto a mostrar del sensor X
            txtX = _measurementPoints.x.Name + "&nbsp;&nbsp;Ang:&nbsp;";
            txtY = _measurementPoints.y.Name + "&nbsp;&nbsp;Ang:&nbsp;";
            switch (_selectedSpectrumType.Value) {
                case spectrumTypes.Displacement.Value:
                    txtX += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
                    txtX += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;";
                    txtY += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
                    txtY += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;";
                    chartScaleY.AttachGraph(_graphType + "/displacement", _widgetId, _measurementPoints.x.SensorTypeCode, 0, maximumY);
                    break;
                case spectrumTypes.Velocity.Value:
                    if (_measurementPoints.x.SensorTypeCode === 2) {
                        // ACELEROMETRO MOSTRANDO UNIDADES DE VELOCIDAD (INTEGRAR)
                        txtX += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
                        txtX += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;";
                        txtY += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
                        txtY += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;";
                    } else if (_measurementPoints.x.SensorTypeCode === 3 && !_measurementPoints.x.Integrate) {
                        // VELOCIMETRO MOSTRANDO UNIDADES GLOBALES
                        txtX += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
                        txtX += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;";
                        txtY += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
                        txtY += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;";
                    } else if (_measurementPoints.x.SensorTypeCode === 3 && _measurementPoints.x.Integrate) {
                        // VELOCIMETRO MOSTRANDO UNIDADES ORIGINALES
                        txtX += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.original.Name + ": ";
                        txtX += _xSubvariables.original.Value.toFixed(2) + " " + _xSubvariables.original.Units + ", &nbsp;";
                        txtY += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.original.Name + ": ";
                        txtY += _ySubvariables.original.Value.toFixed(2) + " " + _ySubvariables.original.Units + ", &nbsp;";
                    }
                    chartScaleY.AttachGraph(_graphType + "/velocity", _widgetId, _measurementPoints.x.SensorTypeCode, 0, maximumY);
                    break;
                case spectrumTypes.Acceleration.Value:
                    if (_measurementPoints.x.SensorTypeCode === 2 && _measurementPoints.x.Integrate) {
                        // ACELEROMETRO MOSTRANDO UNIDADES ORIGINALES
                        txtX += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.original.Name + ": ";
                        txtX += _xSubvariables.original.Value.toFixed(2) + " " + _xSubvariables.original.Units + ", &nbsp;";
                        txtY += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.original.Name + ": ";
                        txtY += _ySubvariables.original.Value.toFixed(2) + " " + _ySubvariables.original.Units + ", &nbsp;";
                    } else if (_measurementPoints.x.SensorTypeCode === 2 && !_measurementPoints.x.Integrate) {
                        // ACELEROMETRO MOSTRANDO UNIDADES GLOBALES
                        txtX += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
                        txtX += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;";
                        txtY += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
                        txtY += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;";
                    } else if (_measurementPoints.x.SensorTypeCode === 3) {
                        // VELOCIMETRO MOSTRANDO UNIDADES DE ACELERACION (DERIVAR)
                    }
                    chartScaleY.AttachGraph(_graphType + "/acceleration", _widgetId, _measurementPoints.x.SensorTypeCode, 0, maximumY);
                    break;
            }
            // Concatenar la estampa de tiempo actual de la grafica y la velocidad del activo
            txtX += _currentTimeStamp;
            if ((_angularSubvariable && _angularSubvariable.Value !== null)) {
                txtX += ", " + _angularSubvariable.Value.toFixed(0) + " RPM";
            }
            txtY += _currentTimeStamp;
            if ((_angularSubvariable && _angularSubvariable.Value !== null)) {
                txtY += ", " + _angularSubvariable.Value.toFixed(0) + " RPM";
            }
            $("#point" + _measurementPoints.x.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txtX);
            $("#point" + _measurementPoints.y.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txtY);
            // Inicializamos caso no exista el valor lastx_
            if (typeof _chart.lastx_ === "undefined") {
                _chart.lastx_ = 0;
            }
            // Reposicionar el cursor visible
            if (_cursorType === 1) {
                _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
            } else if (_cursorType === 2) {
                _cursor.updateHarmonicPositions(_xCoordinateUnit);
            } else if (_cursorType === 3) {
                _cursor.updateSidebandPositions(_xCoordinateUnit);
            }
            if (_mouseover) {
                _chart.mouseMove_(_lastMousemoveEvt);
            } else {
                DygraphOps.dispatchMouseMove(_chart, 0, 0);
            }
        };

        _customInteractionModel = {
            mousedown: Dygraph.defaultInteractionModel.mousedown,
            mousemove: function (e, g, ctx) {
                _serieSynchronizer.YReflection(e, g, ctx);
            },
            mouseup: function (e, g, ctx) {
                var
                    velocity;

                velocity = 0;
                if (_angularSubvariable && _angularSubvariable.Value !== null) {
                    velocity = Math.round((_angularSubvariable.Value / 60 + 0.00001) * 100) / 100;
                }
                if (ctx.isPanning) {
                    Dygraph.endPan(e, g, ctx);
                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                    } else if (_cursorType === 2) {
                        ctx.customFlag = true;
                        _cursor.updateHarmonicPositions(_xCoordinateUnit);
                    } else if (_cursorType === 3) {
                        ctx.customFlag = true;
                        _cursor.updateSidebandPositions(_xCoordinateUnit);
                    }
                } else if (ctx.isZooming) {
                    Dygraph.endZoom(e, g, ctx);
                    if (ctx.regionHeight > 0 && ctx.regionWidth > 0) {
                        ctx.customFlag = true;
                    }

                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions(_xCoordinateUnit);
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions(_xCoordinateUnit);
                    }
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                return false;
            },
            click: function (e, g, ctx) {
                _lastClickedGraph = g;
                e.preventDefault();
                e.stopPropagation();
            },
            dblclick: function (e, g, ctx) {
                var
                    velocity;

                velocity = 0;
                if (_angularSubvariable && _angularSubvariable.Value !== null) {
                    velocity = Math.round((_angularSubvariable.Value / 60 + 0.00001) * 100) / 100;
                }
                g.updateOptions({
                    "valueRange": [0, _largestY * (_autoscale ? 1.1 : 1)],
                    "dateWindow": [-(g.file_.length * _xCoordinateUnit.Factor / 2), (g.file_.length * _xCoordinateUnit.Factor / 2)]
                });
                if (_cursorType === 1) {
                    _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                } else if (_cursorType === 2) {
                    _cursor.updateHarmonicPositions(_xCoordinateUnit);
                } else if (_cursorType === 3) {
                    _cursor.updateSidebandPositions(_xCoordinateUnit);
                }
            },
            mousewheel: function (e, g, ctx) {
                var
                    normal,
                    percentage,
                    percentages,
                    xPct, yPct,
                    velocity;

                if (_lastClickedGraph !== g) {
                    return;
                }
                velocity = 0;
                if (_angularSubvariable && _angularSubvariable.Value !== null) {
                    velocity = Math.round((_angularSubvariable.Value / 60 + 0.00001) * 100) / 100;
                }
                normal = e.detail ? e.detail * -1 : e.wheelDelta / 40;
                percentage = normal / 50;
                if (!(e.offsetX && e.offsetY)) {
                    e.offsetX = e.layerX - e.target.offsetLeft;
                    e.offsetY = e.layerY - e.target.offsetTop;
                }
                percentages = _offsetToPercentage(g, e.offsetX, e.offsetY);
                xPct = percentages[0];
                yPct = percentages[1];
                _zoom(g, percentage, xPct, yPct);
                if (_cursorType === 1) {
                    _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                } else if (_cursorType === 2) {
                    _cursor.updateHarmonicPositions(_xCoordinateUnit);
                } else if (_cursorType === 3) {
                    _cursor.updateSidebandPositions(_xCoordinateUnit);
                }
                e.preventDefault();
                e.stopPropagation();
            },
            touchstart: function (e, g, ctx) {
                var
                    touches,
                    i, t,
                    closestTouchP,
                    selectionChanged,
                    initialAngle;

                // Impedir que IOS haga su propio comportamiento zoom/tactil,
                // e impedir que el nodo tambien sea seleccionado
                e.preventDefault();
                if (e.touches.length > 1) {
                    // Si el usuario coloca dos dedos, no es un doble toque
                    ctx.startTimeForDoubleTapMs = null;
                }
                touches = [];
                for (i = 0; i < e.touches.length; i += 1) {
                    t = e.touches[i];
                    // Prescindir de "dragGetX_" porque todos los TouchBrowsers son compatibles con pageX
                    touches.push({
                        pageX: t.pageX,
                        pageY: t.pageY,
                        dataX: g.toDataXCoord(t.pageX),
                        dataY: g.toDataYCoord(t.pageY)
                    });
                }
                ctx.initialTouches = touches;
                if (touches.length == 1) {
                    // Indica que es solo un golpe al touch
                    ctx.initialPinchCenter = touches[0];
                    ctx.touchDirections = {
                        x: true,
                        y: true
                    };
                    // ADDITION - esto requiere seleccionar los puntos
                    closestTouchP = g.findClosestPoint(touches[0].pageX, touches[0].pageY);
                    if (closestTouchP) {
                        selectionChanged = g.setSelection(closestTouchP.row, closestTouchP.seriesName);
                    }
                    g.mouseMove_(e);
                } else if (touches.length >= 2) {
                    // En caso de encontrar 3 o mas toques, ignoramos todos excepto los "primeros" dos.
                    ctx.initialPinchCenter = {
                        pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
                        pageY: 0.5 * (touches[0].pageY + touches[1].pageY),
                        // TODO(danvk): remove 
                        dataX: 0.5 * (touches[0].dataX + touches[1].dataX),
                        dataY: 0.5 * (touches[0].dataY + touches[1].dataY)
                    };
                    // Realiza "pinches" en una franja de 45 grados alrededor de cualquier zoom de 1 dimension
                    initialAngle = 180 / Math.PI * Math.atan2(
                        ctx.initialPinchCenter.pageY - touches[0].pageY,
                        touches[0].pageX - ctx.initialPinchCenter.pageX);
                    // Usar simetria para obtener el primer cuadrante
                    initialAngle = Math.abs(initialAngle);
                    if (initialAngle > 90) {
                        initialAngle = 90 - initialAngle;
                    }
                    ctx.touchDirections = {
                        x: (initialAngle < (90 - 45 / 2)),
                        y: (initialAngle > 45 / 2)
                    };
                }
            },
            touchend: Dygraph.defaultInteractionModel.touchend,
            touchmove: Dygraph.defaultInteractionModel.touchmove
        };

        _offsetToPercentage = function (g, offsetX, offsetY) {
            var
                xOffset,
                yar0,
                yOffset,
                x, y,
                w, h,
                xPct,
                yPct;

            xOffset = g.toDomCoords(g.xAxisRange()[0], null)[0];
            yar0 = g.yAxisRange(0);
            yOffset = g.toDomCoords(null, yar0[1])[1];
            x = offsetX - xOffset;
            y = offsetY - yOffset;
            w = g.toDomCoords(g.xAxisRange()[1], null)[0] - xOffset;
            h = g.toDomCoords(null, yar0[0])[1] - yOffset;
            xPct = w === 0 ? 0 : (x / w);
            yPct = h === 0 ? 0 : (y / h);
            return [xPct, (1 - yPct)];
        };

        _zoom = function (g, zoomInPercentage, xBias, yBias) {
            xBias = xBias || 0.5;
            yBias = yBias || 0.5;

            var
                yAxes,
                newYAxes,
                i;

            yAxes = g.yAxisRanges();
            newYAxes = [];
            for (i = 0; i < yAxes.length; i += 1) {
                newYAxes[i] = _adjustAxis(yAxes[i], zoomInPercentage, yBias);
            }
            g.updateOptions({
                dateWindow: _adjustAxis(g.xAxisRange(), zoomInPercentage, xBias),
                valueRange: newYAxes[0]
            });
        };

        _adjustAxis = function (axis, zoomInPercentage, bias) {
            var
                delta,
                increment,
                foo;

            delta = axis[1] - axis[0];
            increment = delta * zoomInPercentage;
            foo = [increment * bias, increment * (1 - bias)];
            return [axis[0] + foo[0], axis[1] - foo[1]];
        };

        /*
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (timeStamp, subVariableIdList) {
            var
                mdVariableIdList,
                // Forma de onda del sensor en X
                waveformX,
                // Forma de onda del sensor en Y
                waveformY,
                // Listado de Ids de medidas o subvariables
                idList,
                // Contador
                i;

            timeStamp = new Date(timeStamp).getTime().toString();
            subVariableIdList = (timeMode === 0) ? subVariableIdList : [_xSubvariables.waveform.Id, _ySubvariables.waveform.Id];
            // Subscripcion a evento para refrescar datos de grafica segun timeMode
            switch (timeMode) {
                case 0: // Tiempo Real
                    _newDataSubscription = PublisherSubscriber.subscribe("/realtime/refresh", subVariableIdList, function (data) {
                        waveformX = data[_xSubvariables.waveform.Id];
                        waveformY = data[_ySubvariables.waveform.Id];
                        if (isEmpty(waveformX) || isEmpty(waveformY) || isEmpty(waveformX.RawValue) || isEmpty(waveformY.RawValue)) {
                            console.error("No se encontró datos de forma de onda.");
                            return;
                        }
                        // Forma de onda en X
                        _xSubvariables.waveform.RawValue = clone(waveformX.RawValue);
                        _xSubvariables.waveform.SampleRate = clone(waveformX.SampleRate);
                        // Forma de onda en Y
                        _ySubvariables.waveform.RawValue = clone(waveformY.RawValue);
                        _ySubvariables.waveform.SampleRate = clone(waveformY.SampleRate);
                        if (data[_xSubvariables.overall.Id]) {
                            _xSubvariables.overall.Value = clone(data[_xSubvariables.overall.Id].Value);
                            _xSubvariables.overall.RawTimeStamp = clone(data[_xSubvariables.overall.Id].RawTimeStamp);
                            _xSubvariables.overall.TimeStamp = clone(data[_xSubvariables.overall.Id].TimeStamp);
                        }
                        if (data[_ySubvariables.overall.Id]) {
                            _ySubvariables.overall.Value = clone(data[_ySubvariables.overall.Id].Value);
                            _ySubvariables.overall.RawTimeStamp = clone(data[_ySubvariables.overall.Id].RawTimeStamp);
                            _ySubvariables.overall.TimeStamp = clone(data[_ySubvariables.overall.Id].TimeStamp);
                        }
                        if (_xSubvariables.original && data[_xSubvariables.original.Id]) {
                            _xSubvariables.original.Value = clone(data[_xSubvariables.original.Id].Value);
                            _xSubvariables.original.RawTimeStamp = clone(data[_xSubvariables.original.Id].RawTimeStamp);
                            _xSubvariables.original.TimeStamp = clone(data[_xSubvariables.original.Id].TimeStamp);
                        }
                        if (_ySubvariables.original && data[_ySubvariables.original.Id]) {
                            _ySubvariables.original.Value = clone(data[_ySubvariables.original.Id].Value);
                            _ySubvariables.original.RawTimeStamp = clone(data[_ySubvariables.original.Id].RawTimeStamp);
                            _ySubvariables.original.TimeStamp = clone(data[_ySubvariables.original.Id].TimeStamp);
                        }
                        if (_angularSubvariable) {
                            if (data[_angularSubvariable.Id]) {
                                _angularSubvariable.Value = clone(data[_angularSubvariable.Id].Value);
                                _angularSubvariable.RawTimeStamp = clone(data[_angularSubvariable.Id].RawTimeStamp);
                                _angularSubvariable.TimeStamp = clone(data[_angularSubvariable.Id].TimeStamp);
                            }
                        }
                        _refresh(waveformX, waveformY);
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
                        waveformX = data[_xSubvariables.waveform.Id][timeStamp];
                        waveformY = data[_ySubvariables.waveform.Id][timeStamp];
                        if (isEmpty(waveformX) || isEmpty(waveformY)) {
                            console.error("No se encontró datos de forma de onda");
                            return;
                        }
                        // Forma de onda en X
                        _xSubvariables.waveform.RawValue = clone(waveformX.RawValue);
                        _xSubvariables.waveform.SampleRate = clone(waveformX.SampleRate);
                        // Forma de onda en Y
                        _ySubvariables.waveform.RawValue = clone(waveformY.RawValue);
                        _ySubvariables.waveform.SampleRate = clone(waveformY.SampleRate);
                        // Listado de Ids a consultar
                        idList = [];
                        if (_xSubvariables.overall) {
                            idList.push(_xSubvariables.overall.Id);
                        }
                        if (_xSubvariables.original) {
                            idList.push(_xSubvariables.original.Id);
                        }
                        if (_ySubvariables.overall) {
                            idList.push(_ySubvariables.overall.Id);
                        }
                        if (_ySubvariables.original) {
                            idList.push(_ySubvariables.original.Id);
                        }
                        if (_angularSubvariable) {
                            idList.push(_angularSubvariable.Id);
                        }
                        if (idList.length > 0) {
                            aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [parseInt(timeStamp)], _assetData.NodeId, function (resp) {
                                for (i = 0; i < resp.length; i += 1) {
                                    if (_xSubvariables.overall && resp[i].subVariableId === _xSubvariables.overall.Id) {
                                        _xSubvariables.overall.Value = clone(resp[i].value);
                                    } else if (_xSubvariables.original && resp[i].subVariableId === _xSubvariables.original.Id) {
                                        _xSubvariables.original.Value = clone(resp[i].value);
                                    } else if (_ySubvariables.overall && resp[i].subVariableId === _ySubvariables.overall.Id) {
                                        _ySubvariables.overall.Value = clone(resp[i].value);
                                    } else if (_ySubvariables.original && resp[i].subVariableId === _ySubvariables.original.Id) {
                                        _ySubvariables.original.Value = clone(resp[i].value);
                                    } else if (_angularSubvariable && resp[i].subVariableId === _angularSubvariable.Id) {
                                        _angularSubvariable.Value = clone(resp[i].value);
                                    }
                                }
                                _refresh(waveformX, waveformY);
                            });
                        } else {
                            _refresh(waveformX, waveformY);
                        }
                    });
                    mdVariableIdList = [_measurementPoints.x.Id, _measurementPoints.y.Id];
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData(mdVariableIdList, _assetData.NodeId, subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!Number.isNaN(currentTimeStamp)) {
                            aidbManager.GetStreamBySubVariableIdAndTimeStampList(subVariableIdList, [currentTimeStamp], _assetData.NodeId, function (data) {
                                for (i = 0; i < data.length; i += 1) {
                                    if (data[i].subVariableId === _xSubvariables.waveform.Id) {
                                        waveformX = {
                                            TimeStamp: formatDate(new Date(data[i].timeStamp)),
                                            SampleTime: clone(data[i].sampleTime),
                                            RawValue: clone(data[i].value),
                                            SampleRate: (data[i].value.length / data[i].sampleTime)
                                        };
                                    } else if (data[i].subVariableId === _ySubvariables.waveform.Id) {
                                        waveformY = {
                                            TimeStamp: formatDate(new Date(data[i].timeStamp)),
                                            SampleTime: clone(data[i].sampleTime),
                                            RawValue: clone(data[i].value),
                                            SampleRate: (data[i].value.length / data[i].sampleTime)
                                        };
                                    }
                                }
                                if (isEmpty(waveformX) || isEmpty(waveformY)) {
                                    console.error("No se encontró datos de forma de onda");
                                    return;
                                }
                                // Forma de onda en X
                                _xSubvariables.waveform.RawValue = clone(waveformX.RawValue);
                                _xSubvariables.waveform.SampleRate = clone(waveformX.SampleRate);
                                // Forma de onda en Y
                                _ySubvariables.waveform.RawValue = clone(waveformY.RawValue);
                                _ySubvariables.waveform.SampleRate = clone(waveformY.SampleRate);
                                // Listado de Ids a consultar
                                idList = [];
                                if (_xSubvariables.overall) {
                                    idList.push(_xSubvariables.overall.Id);
                                }
                                if (_xSubvariables.original) {
                                    idList.push(_xSubvariables.original.Id);
                                }
                                if (_ySubvariables.overall) {
                                    idList.push(_ySubvariables.overall.Id);
                                }
                                if (_ySubvariables.original) {
                                    idList.push(_ySubvariables.original.Id);
                                }
                                if (_angularSubvariable) {
                                    idList.push(_angularSubvariable.Id);
                                }
                                if (idList.length > 0) {
                                    aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [timeStamp], _assetData.NodeId, function (resp) {
                                        for (i = 0; i < resp.length; i += 1) {
                                            if (_xSubvariables.overall && resp[i].subVariableId === _xSubvariables.overall.Id) {
                                                _xSubvariables.overall.Value = clone(resp[i].value);
                                            } else if (_xSubvariables.original && resp[i].subVariableId === _xSubvariables.original.Id) {
                                                _xSubvariables.original.Value = clone(resp[i].value);
                                            } else if (_ySubvariables.overall && resp[i].subVariableId === _ySubvariables.overall.Id) {
                                                _ySubvariables.overall.Value = clone(resp[i].value);
                                            } else if (_ySubvariables.original && resp[i].subVariableId === _ySubvariables.original.Id) {
                                                _ySubvariables.original.Value = clone(resp[i].value);
                                            } else if (_angularSubvariable && resp[i].subVariableId === _angularSubvariable.Id) {
                                                _angularSubvariable.Value = clone(resp[i].value);
                                            }
                                        }
                                        _refresh(waveformX, waveformY);
                                    });
                                } else {
                                    _refresh(waveformX, waveformY);
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
        _refresh = function (xWaveform, yWaveform) {
            var
                // Datos a graficar
                xyData;

            if (!_pause) {
                if ((xWaveform.TimeStamp === yWaveform.TimeStamp) && (_currentTimeStamp !== xWaveform.TimeStamp)) {
                    // Estampa de tiempo actual de graficacion
                    _currentTimeStamp = xWaveform.TimeStamp;
                    // Informacion del grafico
                    xyData = _getFullSpectrum(xWaveform, yWaveform);
                    // Mantener en memoria el valor del ultimo espectro mostrado
                    _currentData = clone(xyData);
                    _redrawGraph();
                }
            }
        };

        _getFullSpectrum = function (xWaveform, yWaveform) {
            var
                bin,
                realX,
                imagX,
                realY,
                imagY,
                xData,
                yData,
                windowFactor,
                i,
                bSi,
                Xn,
                Yn,
                alpha,
                beta,
                rotnSign,
                resp;
            
            // Bin o espaciamiento de los espectros
            bin = xWaveform.SampleRate / xWaveform.RawValue.length;
            realX = [];
            imagX = [];
            realY = [];
            imagY = [];
            xData = clone(xWaveform.RawValue);
            yData = clone(yWaveform.RawValue);
            windowFactor = { value: 1 };
            switch (_windowing.Value) {
                case windowing.Hamming.Value:
                    HammingWindow(xData, windowFactor);
                    HammingWindow(yData, windowFactor);
                    break;
                case windowing.Hanning.Value:
                    HanningWindow(xData, windowFactor);
                    HanningWindow(yData, windowFactor);
                    break;
                case windowing.None.Value:
                    break;
                default:
                    console.log("Tipo de ventaneo no soportado.");
            }
            for (i = 0; i < xData.length; i += 1) {
                realX[i] = xData[i];
                imagX[i] = 0;
                realY[i] = yData[i];
                imagY[i] = 0;
            }
            new FourierTransform().Forward(realX, imagX);
            new FourierTransform().Forward(realY, imagY);
            // Factor basado en el tipo de medida (pico-pico, cero-pico o RMS)
            bSi = GetBSIFactor(_xSubvariables.overall.MeasureType, realX.length);
            Xn = [];
            Yn = [];
            alpha = [];
            beta = [];
            for (i = 0; i < (realX.length / 2); i += 1) {
                Xn[i] = bSi * Math.sqrt(Math.pow(realX[i], 2) + Math.pow(imagX[i], 2)) * windowFactor.value;
                alpha[i] = Math.atan2(imagX[i], realX[i]);
                Yn[i] = bSi * Math.sqrt(Math.pow(realY[i], 2) + Math.pow(imagY[i], 2)) * windowFactor.value;
                beta[i] = Math.atan2(imagY[i], realY[i]);
            }
            rotnSign = (_rotn === "CW") ? -1 : 1;
            resp = { Reverse: [], Forward: [] };
            // Calcular reverse y forward
            for (i = 0; i < (realX.length / 2); i += 1) {
                resp.Reverse.push(Math.sqrt(Math.pow(Xn[i], 2) + Math.pow(Yn[i], 2) - rotnSign * 2 * Xn[i] * Yn[i] * Math.sin(alpha[i] - beta[i])));
                resp.Forward.push(Math.sqrt(Math.pow(Xn[i], 2) + Math.pow(Yn[i], 2) + rotnSign * 2 * Xn[i] * Yn[i] * Math.sin(alpha[i] - beta[i])));
            }
            resp.Reverse.reverse();
            return GetFullSpectrumWithBin(resp, bin);
        };

        _subscribeToDynamicFilter = function () {
            _dynamicFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                _redrawGraph();
            });
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
            var
                sensorCode,
                minMaxArray;

            sensorCode = _measurementPoints.x.SensorTypeCode;
            if (sensorCode === 1) {
                _scaleChartDisplacement = PublisherSubscriber.subscribe("/scale/" + _graphType + "/displacement", [sensorCode], function (data) {
                    if (data[sensorCode] && _selectedSpectrumType.Value === spectrumTypes.Displacement.Value) {
                        if (_autoscale) {
                            minMaxArray = data[sensorCode];
                            if (_largestY !== minMaxArray[1]) {
                                _largestY = minMaxArray[1];
                                _chart.updateOptions({
                                    "valueRange": [0, _largestY * 1.1]
                                });
                            }
                        }
                    }
                });
            } else {
                _scaleChartDisplacement = PublisherSubscriber.subscribe("/scale/" + _graphType + "/displacement", [sensorCode], function (data) {
                    if (data[sensorCode] && _selectedSpectrumType.Value === spectrumTypes.Displacement.Value) {
                        if (_autoscale) {
                            minMaxArray = data[sensorCode];
                            if (_largestY !== minMaxArray[1]) {
                                _largestY = minMaxArray[1];
                                _chart.updateOptions({
                                    "valueRange": [0, _largestY * 1.1]
                                });
                            }
                        }
                    }
                });
                _scaleChartVelocity = PublisherSubscriber.subscribe("/scale/" + _graphType + "/velocity", [sensorCode], function (data) {
                    if (data[sensorCode] && _selectedSpectrumType.Value === spectrumTypes.Velocity.Value) {
                        if (_autoscale) {
                            minMaxArray = data[sensorCode];
                            if (_largestY !== minMaxArray[1]) {
                                _largestY = minMaxArray[1];
                                _chart.updateOptions({
                                    "valueRange": [0, _largestY * 1.1]
                                });
                            }
                        }
                    }
                });
                _scaleChartAcceleration = PublisherSubscriber.subscribe("/scale/" + _graphType + "/acceleration", [sensorCode], function (data) {
                    if (data[sensorCode] && _selectedSpectrumType.Value === spectrumTypes.Acceleration.Value) {
                        if (_autoscale) {
                            minMaxArray = data[sensorCode];
                            if (_largestY !== minMaxArray[1]) {
                                _largestY = minMaxArray[1];
                                _chart.updateOptions({
                                    "valueRange": [0, _largestY * 1.1]
                                });
                            }
                        }
                    }
                });
            }
        };

        _applyDerivative = function () {
            var
                title,
                yLabel,
                xyData;

            // Titulo superior de la grafica
            title = $(_contentHeader).children().eq(0).text().split(" (");
            if (title.length > 1) {
                if (_selectedSpectrumType.Value === spectrumTypes.Displacement.Value) {
                    title = title[0] + title[1].split(") ")[1];
                } else {
                    title = title[0] + " (" + _selectedSpectrumType.Text + ") " + title[1].split(") ")[1];
                }
                $(_contentHeader).children().eq(0).text(title);
            }
            // Label removiendo las unidades
            yLabel = _chart.user_attrs_.ylabel.split(" ")[0];
            xyData = [];
            switch (_selectedSpectrumType.Value) {
                case spectrumTypes.Displacement.Value:
                    xyData = _getDisplacementSpectrum(xyData, yLabel);
                    break;
                case spectrumTypes.Velocity.Value:
                    xyData = _getVelocitySpectrum(xyData, yLabel);
                    break;
                case spectrumTypes.Acceleration.Value:
                    xyData = _getAccelerationSpectrum(xyData, yLabel);
                    break;
            }
            return xyData;
        };

        _getDisplacementSpectrum = function (xyData, yLabel) {
            var
                currentUnit,
                unitToConvert,
                factor,
                i,
                yVal1,
                yVal2;

            if (_measurementPoints.x.SensorTypeCode === 3 && !_measurementPoints.x.Integrate) {
                // Velocimetro no-integrado mostrando unidades de desplazamiento (Integrar)
                currentUnit = _xSubvariables.overall.Units;
                unitToConvert = _xSubvariables.original.Units;
                // Calcular el factor de conversion necesario para la integracion
                factor = _computeFactorToIntegrate(currentUnit.toLowerCase(), unitToConvert.toLowerCase());
                // Generar espectro de desplazamiento
                for (i = 0; i < _currentData.length; i += 1) {
                    yVal1 = (_currentData[i][1] / (2 * Math.PI * _currentData[i][0])) * factor;
                    yVal2 = (_currentData[i][2] / (2 * Math.PI * _currentData[i][0])) * factor;
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, yVal1, yVal2]);
                }
            } else if ((_measurementPoints.x.SensorTypeCode === 1) || (_measurementPoints.x.SensorTypeCode === 3 && _measurementPoints.x.Integrate)) {
                // Proximidad mostrando unidades de desplazamiento o velocimetro integrado mostrando unidades de desplazamiento
                currentUnit = _xSubvariables.overall.Units;
                // Generar espectro de desplazamiento
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1], _currentData[i][2]]);
                }
            }
            yLabel += " [" + currentUnit + "]";
            _chart.user_attrs_.ylabel = yLabel;
            return xyData;
        };

        _getVelocitySpectrum = function (xyData, yLabel) {
            var
                currentUnit,
                unitToConvert,
                factor,
                i,
                yVal1,
                yVal2;

            if (_measurementPoints.x.SensorTypeCode === 2 && _measurementPoints.x.Integrate) {
                // Acelerometro integrado mostrando unidades de velocidad
                currentUnit = _xSubvariables.overall.Units;
                // Debido a que el sensor es integrado, los valores de forma de onda son de velocidad
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1], _currentData[i][2]]);
                }
            } else if (_measurementPoints.x.SensorTypeCode === 3 && !_measurementPoints.x.Integrate) {
                // Velocimetro no-integrado mostrando unidades de velocidad
                currentUnit = _xSubvariables.overall.Units;
                // Debido a que el sensor no es integrado, los valores de forma de onda son de velocidad
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1], _currentData[i][2]]);
                }
            } else if (_measurementPoints.x.SensorTypeCode === 2 && !_measurementPoints.x.Integrate) {
                // Acelerometro no-integrado mostrando unidades de velocidad (Integrar)
                currentUnit = _xSubvariables.overall.Units;
                // Calcular el factor de conversion necesario para la integracion
                factor = _computeFactorToIntegrate(currentUnit.toLowerCase(), unitToConvert);
                // Generar espectro de velocidad
                for (i = 0; i < _currentData.length; i += 1) {
                    yVal1 = (_currentData[i][1] / (2 * Math.PI * _currentData[i][0])) * factor;
                    yVal2 = (_currentData[i][2] / (2 * Math.PI * _currentData[i][0])) * factor;
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, yVal1, yVal2]);
                }
            } else if (_measurementPoints.x.SensorTypeCode === 3 && _measurementPoints.x.Integrate) {
                // Velocimetro integrado mostrando unidades de velocidad (Derivar)
                currentUnit = _xSubvariables.overall.Units;
                unitToConvert = _xSubvariables.original.Units;
                // Calcular el factor de conversion necesario para la derivacion
                factor = _computeFactorToDerive(currentUnit.toLowerCase(), unitToConvert);
                // Generar espectro de velocidad (Derivar)
                for (i = 0; i < _currentData.length; i += 1) {
                    yVal1 = 2 * Math.PI * _currentData[i][1] * _currentData[i][0] * factor;
                    yVal2 = 2 * Math.PI * _currentData[i][2] * _currentData[i][0] * factor;
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, yVal1, yVal2]);
                }
            }
            yLabel += " [" + currentUnit + "]";
            _chart.user_attrs_.ylabel = yLabel;
            return xyData;
        };

        _getAccelerationSpectrum = function (xyData, yLabel) {
            var
                currentUnit,
                unitToConvert,
                factor,
                i,
                yVal1,
                yVal2;

            if (_measurementPoints.x.SensorTypeCode === 2 && !_measurementPoints.x.Integrate) {
                // Acelerometro no-integrado mostrando unidades de aceleracion
                currentUnit = _xSubvariables.overall.Units;
                // Debido a que el sensor no es integrado, los valores de forma de onda son de aceleracion
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1], _currentData[i][2]]);
                }
            } else if (_measurementPoints.x.SensorTypeCode === 2 && _measurementPoints.x.Integrate) {
                // Acelerometro integrado mostrando unidades de aceleracion (Derivar)
                currentUnit = _xSubvariables.overall.Units;
                unitToConvert = _xSubvariables.original.Units;
                // Calcular el factor de conversion necesario para la derivacion
                factor = _computeFactorToDerive(currentUnit.toLowerCase(), unitToConvert);
                // Generar espectro de aceleracion (Derivar)
                for (i = 0; i < _currentData.length; i += 1) {
                    yVal1 = 2 * Math.PI * _currentData[i][1] * _currentData[i][0] * factor;
                    yVal2 = 2 * Math.PI * _currentData[i][2] * _currentData[i][0] * factor;
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, yVal1, yVal2]);
                }
            } else if (_measurementPoints.x.SensorTypeCode === 3 && !_measurementPoints.x.Integrate) {
                // Velocimetro no-integrado mostrando unidades de aceleracion (Derivar)
                currentUnit = _xSubvariables.overall.Units;
                // Calcular el factor de conversion necesario para la derivacion
                factor = _computeFactorToDerive(currentUnit.toLowerCase(), unitToConvert);
                for (i = 0; i < _currentData.length; i += 1) {
                    yVal1 = 2 * Math.PI * _currentData[i][1] * _currentData[i][0] * factor;
                    yVal2 = 2 * Math.PI * _currentData[i][2] * _currentData[i][0] * factor;
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, yVal1, yVal2]);
                }
            }
            yLabel += " [" + currentUnit + "]";
            _chart.user_attrs_.ylabel = yLabel;
            return xyData;
        };

        // Algoritmo que determina el factor que se debe aplicar para la derivacion
        _computeFactorToIntegrate = function (currentUnit, unitToConvert) {
            var
                factor;

            // Crear array del valor de unidad donde la primer parte corresponde a la unidad,
            // mientras la segunda parte corresponde al tipo de medida (pk-pk, 0-pk, RMS).
            currentUnit = currentUnit.split(" ");
            switch (currentUnit[0]) {
                case "g":
                    if (unitToConvert === undefined) {
                        // Seleccionar la unidad a a convertir por defecto
                        unitToConvert = "m/s" + " " + currentUnit[1];
                    }
                    unitToConvert = unitToConvert.toLowerCase().split(" ");
                    switch (unitToConvert[0]) {
                        case "m/s":
                            factor = 9.8067;
                            break;
                        case "mm/s":
                            factor = 9806.7;
                            break;
                        default:
                            console.log("Unidad a convertir no definida");
                    }
                    break;
                case "mg":
                    if (unitToConvert === undefined) {
                        // Seleccionar la unidad a a convertir por defecto
                        unitToConvert = "mm/s" + " " + currentUnit[1];
                    }
                    unitToConvert = unitToConvert.toLowerCase().split(" ");
                    switch (unitToConvert[0]) {
                        case "mm/s":
                            factor = 9.8067;
                            break;
                        case "m/s":
                            factor = 9.8067 / 1000;
                            break;
                        default:
                            console.log("Unidad a convertir no definida");
                    }
                    break;
                case "mm/s":
                    if (unitToConvert === undefined) {
                        // Seleccionar la unidad a a convertir por defecto
                        unitToConvert = "mm" + " " + currentUnit[1];
                    }
                    unitToConvert = unitToConvert.toLowerCase().split(" ");
                    switch (unitToConvert[0]) {
                        case "mm":
                            factor = 1.0;
                            break;
                        case "um":
                            factor = 1000;
                            break;
                        default:
                            console.log("Unidad a convertir no definida");
                    }
                    break;
                default:
                    factor = 1.0;
                    console.log("Unidad de conversión desconocida.");
            }
            // Aplica un factor adicional en caso de que las unidades de origen y destino no sean iguales
            if (currentUnit[1] !== unitToConvert[1]) {
                if (currentUnit[1] === "0-pk" && unitToConvert[1] === "rms") {
                    factor *= 0.707;
                } else if (currentUnit[1] === "rms" && unitToConvert[1] === "0-pk") {
                    factor /= 0.707;
                }
            }
            return factor;
        };

        _computeFactorToDerive = function (currentUnit, unitToConvert) {
            var
                factor;

            // Crear array del valor de unidad donde la primer parte corresponde a la unidad,
            // mientras la segunda parte corresponde al tipo de medida (pk-pk, 0-pk, RMS).
            currentUnit = currentUnit.split(" ");
            switch (currentUnit[0]) {
                case "mm":
                    if (unitToConvert === undefined) {
                        // Seleccionar la unidad a a convertir por defecto
                        unitToConvert = "mm/s" + " " + currentUnit[1];
                    }
                    unitToConvert = unitToConvert.toLowerCase().split(" ");
                    switch (unitToConvert[0]) {
                        case "mm/s":
                            factor = 1.0;
                            break;
                        default:
                            console.log("Unidad a convertir no definida");
                    }
                    break;
                case "um":
                    if (unitToConvert === undefined) {
                        // Seleccionar la unidad a a convertir por defecto
                        unitToConvert = "mm/s" + " " + currentUnit[1];
                    }
                    unitToConvert = unitToConvert.toLowerCase().split(" ");
                    switch (unitToConvert[0]) {
                        case "mm/s":
                            factor = 1 / 1000.0;
                            break;
                        default:
                            console.log("Unidad a convertir no definida");
                    }
                    break;
                case "mm/s":
                    if (unitToConvert === undefined) {
                        // Seleccionar la unidad a a convertir por defecto
                        unitToConvert = "mg" + " " + currentUnit[1];
                    }
                    unitToConvert = unitToConvert.toLowerCase().split(" ");
                    switch (unitToConvert[0]) {
                        case "g":
                            factor = 1 / 9806.7;
                            break;
                        case "mg":
                            factor = 1 / 9.8067;
                            break;
                        default:
                            console.log("Unidad a convertir no definida");
                    }
                    break;
                default:
                    factor = 1.0;
                    console.log("Unidad de conversión desconocida.");
            }
            // Aplica un factor adicional en caso de que las unidades de origen y destino no sean iguales
            if (currentUnit[1] !== unitToConvert[1]) {
                if (currentUnit[1] === "0-pk" && unitToConvert[1] === "rms") {
                    factor *= 0.707;
                } else if (currentUnit[1] === "rms" && unitToConvert[1] === "0-pk") {
                    factor /= 0.707;
                }
            }
            return factor;
        };

        _getCurrentYUnits = function () {
            var
                unit;

            switch (_selectedSpectrumType.Value) {
                case spectrumTypes.Displacement.Value:
                    unit = _xSubvariables.overall.Units;
                    break;
                case spectrumTypes.Velocity.Value:
                    if (_measurementPoints.x.SensorTypeCode === 3 && _measurementPoints.x.Integrate) {
                        // VELOCIMETRO MOSTRANDO UNIDADES ORIGINALES
                        unit = _xSubvariables.original.Units;
                    } else {
                        unit = _xSubvariables.overall.Units;
                    }
                    break;
                case spectrumTypes.Acceleration.Value:
                    if (_measurementPoints.x.SensorTypeCode === 2 && _measurementPoints.x.Integrate) {
                        // ACELEROMETRO MOSTRANDO UNIDADES ORIGINALES
                        unit = _xSubvariables.original.Units;
                    } else {
                        unit = _xSubvariables.overall.Units;
                    }
                    break;
            }
            return unit;
        };

        _getHarmonicLimits = function (min, max) {
            var
                lowIdx,
                highIdx,
                i;

            for (i = 0; i < _nxArray.length; i += 1) {
                if (_nxArray[i] > min) {
                    lowIdx = i;
                    break;
                }
            }
            if (_nxArray[_nxArray.length - 1] < max) {
                highIdx = _nxArray.length - 1;
            } else {
                for (i = lowIdx + 1; i < _nxArray.length; i += 1) {
                    if (_nxArray[i] > max) {
                        highIdx = i;
                        break;
                    }
                }
            }
            return { lowIdx: lowIdx, highIdx: highIdx, totalPoints: highIdx - lowIdx };
        };

        this.Show = function (measurementPointId, timeStamp, currentColor, pairedColor) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Punto de medicion de referencia en el par (x, y)
                measurementPoint,
                // Labels
                labels,
                // Sensor de referencia angular
                angularReference,
                // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                subVariableIdList,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion con el valor global y su tipo de medida
                overallUnits,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion con el valor original y su tipo de medida
                originalUnits,
                // Titulo de la grafica
                title,
                // Menu de opciones para la grafica
                settingsMenu,
                // Sub-menu de opciones para los tipos de espectro (solo aplica para acelerometro, velocimetro)
                settingsSubmenu;

            _serieSynchronizer = new SerieSynchronizer();

            switch (timeMode) {
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
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                        new ej.Query().where("AssetId", "equal", measurementPoint.ParentId, false))[0];
                    break;
                default:
                    console.log("Modo no soportado por la aplicación.");
            }
            if (measurementPoint.AssociatedMeasurementPointId !== null) {
                if (measurementPoint.Orientation === 1) {
                    // Punto de medicion X
                    _measurementPoints.x = measurementPoint;
                    // Punto de medicion Y
                    _measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false))[0];
                    // Colores
                    _measurementPoints.x.Color = (timeMode === 0) ? "#C68E17" : currentColor;
                    _measurementPoints.y.Color = (timeMode === 0) ? "#8D38C9" : pairedColor;
                } else {
                    // Punto de medicion X
                    _measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false))[0];
                    // Punto de medicion Y
                    _measurementPoints.y = measurementPoint;
                    // Colores
                    _measurementPoints.x.Color = (timeMode === 0) ? "#C68E17" : pairedColor;
                    _measurementPoints.y.Color = (timeMode === 0) ? "#8D38C9" : currentColor;
                }
                subVariableIdList = [];
                // Total subvariables para el punto de medicion en X
                subVariables = _measurementPoints.x.SubVariables;
                // SubVariable que contiene la forma de onda en X
                _xSubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_xSubvariables.waveform) {
                    subVariableIdList.push(_xSubvariables.waveform.Id);
                } else {
                    popUp("info", "No existe una subvariable configurada para forma de onda.");
                    return;
                }
                // SubVariable que contiene el valor global del sensor en X
                _xSubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                overallUnits = "";
                if (_xSubvariables.overall) {
                    subVariableIdList.push(_xSubvariables.overall.Id);
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
                originalUnits = "";
                if (_measurementPoints.x.Integrate) {
                    // SubVariable que contiene el valor original del punto de medicion en X
                    _xSubvariables.original = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where(ej.Predicate("FromIntegratedWaveform", "equal", false, false).and("ValueType", "equal", 1)))[0]);
                    if (_xSubvariables.original) {
                        subVariableIdList.push(_xSubvariables.original.Id);
                        switch (_xSubvariables.original.MeasureType) {
                            case 1:
                                originalUnits = " 0-pk";
                                break;
                            case 2:
                                originalUnits = " pk-pk";
                                break;
                            case 3:
                                originalUnits = " RMS";
                                break;
                        }
                        _xSubvariables.original.Units += originalUnits;
                    }
                }
                // Total subvariables para el punto de medicion en Y
                subVariables = _measurementPoints.y.SubVariables;
                // Subvariable que contiene la forma de onda en Y
                _ySubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_ySubvariables.waveform) {
                    subVariableIdList.push(_ySubvariables.waveform.Id);
                } else {
                    popUp("info", "No existe una subvariable configurada para forma de onda.");
                    return;
                }
                // SubVariable que contiene el valor global del sensor en Y
                _ySubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                overallUnits = "";
                if (_ySubvariables.overall) {
                    subVariableIdList.push(_ySubvariables.overall.Id);
                    switch (_ySubvariables.overall.MeasureType) {
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
                    _ySubvariables.overall.Units += overallUnits;
                }
                originalUnits = "";
                if (_measurementPoints.y.Integrate) {
                    // SubVariable que contiene el valor original del punto de medicion en X
                    _ySubvariables.original = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where(ej.Predicate("FromIntegratedWaveform", "equal", false, false).and("ValueType", "equal", 1)))[0]);
                    if (_ySubvariables.original) {
                        subVariableIdList.push(_ySubvariables.original.Id);
                        switch (_ySubvariables.original.MeasureType) {
                            case 1:
                                originalUnits = " 0-pk";
                                break;
                            case 2:
                                originalUnits = " pk-pk";
                                break;
                            case 3:
                                originalUnits = " RMS";
                                break;
                        }
                        _ySubvariables.original.Units += originalUnits;
                    }
                }
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false))[0];
                if (!angularReference) {
                    popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    _rotn = "CW";
                } else {
                    _rotn = (angularReference.RotationDirection == 1) ? "CW" : "CCW";
                    _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(
                        new ej.Query().where("MeasureType", "equal", 9, false))[0]);
                }
                // SubVariable que corresponde al punto de referencia angular
                if (_angularSubvariable) {
                    subVariableIdList.push(_angularSubvariable.Id);
                }
                if (_xSubvariables.overall.Units !== _ySubvariables.overall.Units) {
                    popUp("info", "Unidades de las subvariable con valor global es diferente para el par de puntos de medición.");
                    return;
                }
                _seriesName = ["Reverse", "Forward"];
                // Creamos el titulo de la grafica
                title = "Espectro de órbita";
                // Agregamos los items al menu de opciones para la grafica
                settingsMenu = [];
                // Para los tipos de sensor (2) Acelerometro y (3) Velocimetro se crea un menu que permite intercambiar entre los tipos de espectro
                if (_measurementPoints.x.SensorTypeCode === 2 || _measurementPoints.x.SensorTypeCode === 3) {
                    _createSpectrumTypeMenu(settingsMenu, settingsSubmenu);
                    title += " (" + _selectedSpectrumType.Text + ")";
                } else {
                    _selectedSpectrumType = clone(spectrumTypes.Displacement);
                }
                // Menu para cambiar entre diferentes unidades en el eje de las abscisas
                _createAbscissaUnitsMenu(settingsMenu, settingsSubmenu);
                // Menu relacionado a los cursores que permiten realizar analisis de la grafica
                _createCursorMenu(settingsMenu, settingsSubmenu);
                // Menu que permite seleccionar entre los diferentes tipos de ventaneo
                _createWindowingMenu(settingsMenu, settingsSubmenu);
                // Menu de exportar los datos de la grafica como una imagen
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
                // Menu de exportar los datos de la grafica como Excel
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));
                //settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Zoom", "zoom" + _widgetId));

                // Menu que permite seleccionar entre manual o auto la escala en Y de la gráfica
                _createScaleYMenu(settingsMenu, settingsSubmenu);

                /*
                 * Creamos la referencia al AspectrogramWidget.
                 */
                _aWidget = new AspectrogramWidget({
                    widgetId: _widgetId,
                    parentId: "awContainer",
                    content: _container,
                    title: title,
                    width: width,
                    minWidth: 3,
                    height: height,
                    minHeight: 3,
                    aspectRatio: aspectRatio,
                    graphType: _graphType,
                    timeMode: timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: subVariableIdList,
                    asset: _assetData.Name,
                    seriesName: [],
                    measurementPointList: [_measurementPoints.x.Name.replace(/\s|\W|[#$%^&*()]/g, ""),
                        _measurementPoints.y.Name.replace(/\s|\W|[#$%^&*()]/g, "")],
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
                        var headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                        _contentBody.style.height = (100 - headerHeigth) + "%";
                        if (_angularSubvariable && _angularSubvariable.Value !== null) {
                            var velocity = _angularSubvariable.Value;
                        } else {
                            velocity = 0;
                        }
                        setTimeout(function () {
                            $("#Reverse" + _widgetId).css("width", _contentBody.style.width);
                            $("#Reverse" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                            $("#Forward" + _widgetId).css("width", _contentBody.style.width);
                            $("#Forward" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                            _cursor.resizeCanvas();
                            if (_cursorType === 1) {
                                _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                            } else if (_cursorType === 2) {
                                _cursor.updateHarmonicPositions(_xCoordinateUnit);
                            } else if (_cursorType === 3) {
                                _cursor.updateSidebandPositions(_xCoordinateUnit);
                            }
                        }, 500);
                    },
                    onMinimize: function () {
                        cancelFullscreen();
                        setTimeout(function () {
                            $("#Reverse" + _widgetId).css("width", _contentBody.style.width);
                            $("#Reverse" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                            $("#Forward" + _widgetId).css("width", _contentBody.style.width);
                            $("#Forward" + _widgetId).css("top", $("#" + _contentBody.id + " > div > div > div.dygraph-xlabel").parent().css("top"));
                            _cursor.resizeCanvas();
                            if (_cursorType === 1) {
                                _cursor.updateNormalCursor(_xCoordinateUnit, _getCurrentYUnits(), velocity);
                            } else if (_cursorType === 2) {
                                _cursor.updateHarmonicPositions(_xCoordinateUnit);
                            } else if (_cursorType === 3) {
                                _cursor.updateSidebandPositions(_xCoordinateUnit);
                            }
                        }, 300);
                    }
                });

                labels = ["Estampa de tiempo", _seriesName[0], _seriesName[1]];
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
            } else {
                popUp("info", "El punto de medición no tiene asociado ningún par.");
            }
           

        };

        _createSpectrumTypeMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            if ((_measurementPoints.x.Integrate && _measurementPoints.x.SensorTypeCode === 2) ||
                !_measurementPoints.x.Integrate && _measurementPoints.x.SensorTypeCode === 3) {
                // ACELEROMETRO INTEGRADO O VELOCIMETRO SIN INTEGRAR
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Espectro Velocidad",
                    "velocitySpectrum" + _widgetId
                ));
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Espectro Aceleración",
                    "accelerationSpectrum" + _widgetId
                ));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Tipo Espectro", "spectrumType" + _widgetId, settingsSubmenu));
                _selectedSpectrumType = clone(spectrumTypes.Velocity);
            } else if ((!_measurementPoints.x.Integrate && _measurementPoints.x.SensorTypeCode === 2)) {
                // ACELEROMETRO SIN INTEGRAR
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Espectro Aceleración",
                    "accelerationSpectrum" + _widgetId
                ));
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Espectro Velocidad",
                    "velocitySpectrum" + _widgetId
                ));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Tipo Espectro", "spectrumType" + _widgetId, settingsSubmenu));
                _selectedSpectrumType = clone(spectrumTypes.Acceleration);
            } else if ((!_measurementPoints.x.Integrate && _measurementPoints.x.SensorTypeCode === 3)) {
                // VELOCIMETRO INTEGRADO
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Espectro Desplazamiento",
                    "displacementSpectrum" + _widgetId
                ));
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                    "item",
                    "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Espectro Velocidad",
                    "velocitySpectrum" + _widgetId
                ));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Tipo Espectro", "spectrumType" + _widgetId, settingsSubmenu));
                _selectedSpectrumType = clone(spectrumTypes.Displacement);
            }
        };

        _createAbscissaUnitsMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> CPM",
                "xCoordinateCpm" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Orden",
                "xCoordinateOrder" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Hertz",
                "xCoordinateHertz" + _widgetId
            ));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Cambiar unidad abscisa", "abscissaUnit" + _widgetId, settingsSubmenu));
        };

        _createCursorMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Ninguno",
                "noneCursor" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Normal",
                "normalCursor" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Armónico",
                "harmonicCursor" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Bandeamiento",
                "sidebandCursor" + _widgetId
            ));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Cursor", "cursorType" + _widgetId, settingsSubmenu));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Config. cursor", "cfgCursor" + _widgetId));
        };

        _createWindowingMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Ninguno",
                "noneWindow" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Hamming",
                "hammingWindow" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Hanning",
                "hanningWindow" + _widgetId
            ));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Tipo de ventaneo", "windowing" + _widgetId, settingsSubmenu));
        };

        this.Close = function () {
            var
                el;

            // Elimina el objeto en memoria de la escala en "Y" manual, si esta existe.
            ej.DataManager(_scaleY).remove("WidgetId", _widgetId, _scaleY);

            if (_scaleChartDisplacement) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                chartScaleY.DetachGraph(_graphType + "/displacement", _widgetId, _measurementPoints.x.SensorTypeCode);
                _scaleChartDisplacement.remove();
            }
            if (_scaleChartVelocity) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                chartScaleY.DetachGraph(_graphType + "/velocity", _widgetId, _measurementPoints.x.SensorTypeCode);
                _scaleChartVelocity.remove();
            }
            if (_scaleChartAcceleration) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                chartScaleY.DetachGraph(_graphType + "/acceleration", _widgetId, _measurementPoints.x.SensorTypeCode);
                _scaleChartAcceleration.remove();
            }
            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }
            if (_playerSubscription) {
                // Eliminar suscripcion de notificacion de llegada de datos por medio del player
                _playerSubscription.remove();
            }
            if (_dynamicFilterSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar filtro dinámico a la forma de onda
                _dynamicFilterSubscription.remove();
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

            _autoscale = true;
            _redrawGraph();
        };

        document.body.addEventListener("keydown", function (e) {
            if (_mouseover && _lastMousemoveEvt.isTrusted) {
                _chart = _chart;
                if (e.keyCode == 37) {
                    _cursor.applyKeyEvent(_cursorType, 1, e);
                } else if (e.keyCode == 39) {
                    _cursor.applyKeyEvent(_cursorType, 2, e);
                }
                if (_cursorType === 0 && (e.keyCode === 37 || e.keyCode === 39)) {
                    _serieSynchronizer.YReflectionKey(e, _chart);
                }
            }
        });

        _manualScaleYManagement = function (target, menuItem, labelText, widgetId) {
            var
                maxScaleY,
                modalDiv,
                acceleration,
                velocity,
                scaleY;
            
            // Obtenemos el valor maximo de la escala en "Y" del grafico
            maxScaleY = _chart.yAxisRange().max();
            // Creamos el contenido de la modal a presentar al usuario
            modalDiv = "<div id=\"ejdManualScaleYFullSpectrum\" class=\"hidden\"><div class=\"container-fluid cf\"><div class=\"row\">" +
                "<label id=\"lblScaleYFullSpectrum\"></label><input type=\"text\" id=\"txtScaleYFullSpectrum\"></div><br />" +
                "<div class=\"row\"><button id=\"btnAcceptScaleYFullSpectrum\"> Aceptar</button>" +
                "<button id=\"btnCancelScaleYFullSpectrum\"> Cancelar</button></div></div></div>";
            $(".treeViewFilter").append(modalDiv);
            scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(widgetId, "WidgetId"));
            acceleration = $("li>a[data-value=accelerationSpectrum" + widgetId + "]>i").hasClass('fa-check-square');
            velocity = $("li>a[data-value=velocitySpectrum" + widgetId + "]>i").hasClass('fa-check-square');
            $("#lblScaleYFullSpectrum").text(labelText);
            $("#lblScaleYFullSpectrum").data("widgetId", widgetId);

            // JHC: Se debe limitar el ingresar un numero mayor al -input text-
            $("#txtScaleYFullSpectrum").ejNumericTextbox({
                width: "90%",
                value: maxScaleY,
                minValue: 0.05,
                decimalPlaces: 2,
            });

            $("#btnAcceptScaleYFullSpectrum").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-checkmark",
                click: function (args) {
                    _yScaleValue = $("#txtScaleYFullSpectrum").ejNumericTextbox("getValue");
                    if (scaleY.length === 0) {
                        _scaleY.push({
                            Velocity: velocity ? _yScaleValue : null,
                            Acceleration: acceleration ? _yScaleValue : null,
                            Proximity: (!velocity && !acceleration) ? _yScaleValue : null,
                            WidgetId: widgetId
                        });
                    } else {
                        if (velocity) {
                            scaleY[0].Velocity = _yScaleValue;
                        } else if (acceleration) {
                            scaleY[0].Acceleration = _yScaleValue;
                        } else {
                            scaleY[0].Proximity = _yScaleValue;
                        }
                    }
                    _autoscale = false;
                    _redrawGraph();
                    _yScaleValue = null;
                    $("li>a[data-value=autoScaleY" + widgetId + "]>i").removeClass("fa-check-square").addClass("fa-square-o");
                    $("li>a[data-value=manualScaleY" + widgetId + "]>i").addClass("fa-check-square").removeClass("fa-square-o");
                    $("#ejdManualScaleYFullSpectrum").addClass("hidden");
                    $("#ejdManualScaleYFullSpectrum").ejDialog("close");
                },
            });

            $("#btnCancelScaleYFullSpectrum").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-cancel",
                click: function (args) {
                    $("#ejdManualScaleYFullSpectrum").addClass("hidden");
                    $("#ejdManualScaleYFullSpectrum").ejDialog("close");
                }
            });

            $("#ejdManualScaleYFullSpectrum").ejDialog({
                showOnInit: false,
                isResponsive: true,
                title: "Escala en Y",
                allowDraggable: true,
                enableAnimation: true,
                width: "15%", height: "25%",
                enableResize: true,
                showHeader: true,
                enableModal: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) {
                    var
                        value;

                    value = _largestY;
                    if (scaleY.length == 1) {
                        if (acceleration) {
                            value = (scaleY[0].Acceleration === null) ? value : scaleY[0].Acceleration;
                        }
                        if (velocity) {
                            value = (scaleY[0].Velocity === null) ? value : scaleY[0].Velocity;
                        }
                    }
                    $("#txtScaleYFullSpectrum").ejNumericTextbox({ value: value });
                },
                close: function (args) {
                    //$("#btnAcceptScaleYFullSpectrum").off("click"); // Necesario desasociar el evento
                    //$("#btnCancelScaleYFullSpectrum").off("click"); // Necesario desasociar el evento
                    $("#ejdManualScaleYFullSpectrum").addClass("hidden");
                    $("#txtScaleYFullSpectrum").ejNumericTextbox("destroy");
                    $("#btnAcceptScaleYFullSpectrum").ejButton("destroy");
                    $("#btnCancelScaleYFullSpectrum").ejButton("destroy");
                }
            });

            $("#ejdManualScaleYFullSpectrum").removeClass("hidden");
            $("#ejdManualScaleYFullSpectrum").ejDialog("open");
        };
        
    };

    return FullSpectrumGraph;
})();