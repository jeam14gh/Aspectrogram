/*
 * spectrumGraph.js
 * Gestiona todo lo relacionado a la grafica de espectros.
 * @author Jorge Calderon
 */

/* globals Dygraph, clone, windowing, cursorType, ImageExport, createTableToExcel, tableToExcel, GetHalfSpectrum, enableFilter, ej, jsonTree,
   stopFrequency, Cursors, globalsReport, PublisherSubscriber, isEmpty, aidbManager, HistoricalTimeMode, formatDate, popUp, mainCache,
   GetXYDataOnTime, GetKeyphasorOnTime, parseAng, arrayColumn, DygraphOps, chartScaleY, selectedMeasurementPoint, selectedAsset, AspectrogramWidget*/

var SpectrumGraph = {};

SpectrumGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    SpectrumGraph = function (timeMode, width, height, aspectRatio) {
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
            //Bandera que indica que el mouse pasó por encima de la gráfica
            _flagMouseOver,
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
            _applyFilterSubscription,
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
            // Metodo privado que genera el menu de los diferentes ventaneos aplicables al grafico
            _createScaleYMenu,
            // Método privado que gestiona manualmente la escala en Y del gráfico.
            _manualScaleYManagement,
            // Método privado que gestiona la escala en Y del gráfico automaticamente
            _autoScaleYManagement,
            // Valor de escala en Y del gráfico de manera manual
            _yScaleValue,
            // Metodo privado que gestiona los cambios de tipo de cursor por accion de usuario
            _cursorTypeManagement,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo privado que obtiene los valores correspondientes al espectro de aceleracion segun el tipo de sensor y las unidades configuradas
            _getAccelerationSpectrum,
            // Obtiene las unidades del valor en amplitud mostrado en la grafica, dependiendo del tipo de sensor y el tipo de espectro seleccionado
            _getCurrentYUnits,
            // Metodo privado que aplica el metodo de derivacion por frecuencia
            _getDerivativeValue,
            // Metodo privado que obtiene los valores correspondientes al espectro de desplazamiento segun el tipo de sensor y las unidades configuradas
            _getDisplacementSpectrum,
            // Metodo privado que calcula el espectro (Half Spectrum) a mostrar
            _getHalfSpectrum,
            // Metodo privado para calcular los armonicos en los limites del grafico
            _getHarmonicLimits,
            // Metodo privado que aplica el metodo de integracion por frecuencia
            _getIntegratedValue,
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
            // Metodo privado que realiza la suscripcion al publisher para aplicar filtro dinamico
            _subscribeToApplyFilter,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo privado que realiza el escalado segun el valor maximo de las graficas abiertas del mismo tipo
            _subscribeToScaleChart,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection,
            // Metodo privado que actualiza el label que indica el valor de frecuencia y amplitud actual
            _upgradeLabels,
            // Metodo privado que gestiona los cambios de tipo de ventaneo por accion de usuario         
            _windowingManagement,
            // Metodo privado que gestiona los cambios de unidad del eje X por accion de usuario
            _xCoordinateUnitManagement,
            // Metodo privado para la interaccion del control de zoom de la grafica
            _zoom;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _pause = false;
        _movableGrid = false;
        _autoscale = true;
        _this = this;
        _graphType = "spectrum";
        _widgetId = Math.floor(Math.random() * 100000);
        _subvariables = {};
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
        _container.id = "spectrumGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "spectrumHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "spectrumBody" + _widgetId;
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
                i,
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
                    contId = "tableToExcelSpectrumGraph" + _widgetId;
                    labels = [_chart.user_attrs_.xlabel, _chart.user_attrs_.ylabel];
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false);
                    tableToExcel("tableToExcelSpectrumGraph" + _widgetId, name);
                    break;
                case "autoScaleY" + _widgetId:
                    _autoScaleYManagement(target, menuItem);
                    break;
                case "manualScaleY" + _widgetId:
                    var labelY = $("#spectrumBody" + _widgetId).find(".dygraph-ylabel").text();
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
                    _cursor.normalCursor((velocityValue / 60) * _xCoordinateUnit.Factor);
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
            _currentData = _getHalfSpectrum(_subvariables.waveform);
            _redrawGraph();
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

        _manualScaleYManagement = function (target, menuItem, labelText, widgetId) {
            $(".treeViewFilter").append("<div id='ejdManualScaleYSpectrum' class='hidden'>" +
                    "<div class='container-fluid cf'>" +
                        "<div class='row'>" +
                            "<label id='lblScaleY'></label>" +
                            "<input type='text' id='txtScaleYSpectrum'>" +
                        "</div>" +
                        "<br />" +
                        "<div class='row'>" +
                            "<button id='btnAcceptScaleYSpectrum'> Aceptar</button>" +
                            "<button id='btnCancelScaleYSpectrum'> Cancelar</button>" +
                        "</div>" +
                    "</div>" +
                "</div>");

            var
                // Obtenemos el valor máximo de la escala en "Y" del gráfico.
                maxScaleY = _chart.yAxisRange().max(),
                //yScaleValue = $("div[data-id=" + widgetId + "] div.dygraph-axis-label-y:last").text(),
                children,
                acceleration,
                velocity,
                widgetId,
                scaleY,
                i;

            scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(widgetId, "WidgetId"));
            widgetId = widgetId;
            acceleration = $("li>a[data-value=accelerationSpectrum" + widgetId + "]>i").hasClass('fa-check-square');
            velocity = $("li>a[data-value=velocitySpectrum" + widgetId + "]>i").hasClass('fa-check-square');

            //children = target.parent().parent().children();
            //for (i = 0; i < children.length; i += 1) {
            //    children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
            //}
            //target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");

            //_autoscale = false;

            $("#lblScaleY").text(labelText);
            $("#lblScaleY").data("widgetId", widgetId);

            $("#txtScaleYSpectrum").ejNumericTextbox({
                width: "90%",
                value: maxScaleY,
                //value: yScaleValue,
                minValue: 0.05,
                decimalPlaces: 2,
            });

            $("#btnAcceptScaleYSpectrum").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-checkmark",
                click: function (args) {
                    //var widgetId = $("#lblScaleY").data("widgetId");
                    _yScaleValue = $("#txtScaleYSpectrum").ejNumericTextbox("getValue");

                    //var acceleration = $("li>a[data-value=accelerationSpectrum" + widgetId + "]>i").hasClass('fa-check-square');
                    //var velocity = $("li>a[data-value=velocitySpectrum" + widgetId + "]>i").hasClass('fa-check-square');

                    //var scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(widgetId, "WidgetId"));
                    if (scaleY.length == 0) {
                        _scaleY.push({
                            Velocity: velocity ? _yScaleValue : null,
                            Acceleration: acceleration ? _yScaleValue : null,
                            WidgetId: widgetId
                        });
                    } else {
                        if (velocity)
                            scaleY[0].Velocity = _yScaleValue;

                        if (acceleration)
                            scaleY[0].Acceleration = _yScaleValue;
                    }

                    _autoscale = false;
                    _redrawGraph();
                    _yScaleValue = null;
                    $("li>a[data-value=autoScaleY" + widgetId + "]>i").removeClass('fa-check-square').addClass("fa-square-o");
                    $("li>a[data-value=manualScaleY" + widgetId + "]>i").addClass('fa-check-square').removeClass("fa-square-o");
                    $("#ejdManualScaleYSpectrum").addClass("hidden");
                    $("#ejdManualScaleYSpectrum").ejDialog("close");
                },
            });

            $("#btnCancelScaleYSpectrum").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-cancel",
                click: function (args) {
                    $("#ejdManualScaleYSpectrum").addClass("hidden");
                    $("#ejdManualScaleYSpectrum").ejDialog("close");
                }
            });

            $("#ejdManualScaleYSpectrum").ejDialog({
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
                open: function (args) {
                    //var widgetId = $("#lblScaleY").data("widgetId"),
                    var value = _largestY * 1.1;
                    //var scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(widgetId, "WidgetId"));
                    //ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("WidgetId", "equal", widgetId, true).and("EntityType", "equal", 2, true)))
                    if (scaleY.length == 1) {
                        if (acceleration) {
                            value = (scaleY[0].Acceleration == null) ? value : scaleY[0].Acceleration;
                        }
                        if (velocity) {
                            value = (scaleY[0].Velocity == null) ? value : scaleY[0].Velocity;
                        }
                        value *= 1.1;
                    }

                    $("#txtScaleYSpectrum").ejNumericTextbox({ value: value });
                },
                close: function (args) {
                    //$("#btnAcceptScaleYSpectrum").off("click"); // Necesario desasociar el evento
                    //$("#btnCancelScaleYSpectrum").off("click"); // Necesario desasociar el evento
                    $("#ejdManualScaleYSpectrum").addClass('hidden');
                    $("#txtScaleYSpectrum").ejNumericTextbox("destroy");
                    $("#btnAcceptScaleYSpectrum").ejButton("destroy");
                    $("#btnCancelScaleYSpectrum").ejButton("destroy");
                },
            });

            $("#ejdManualScaleYSpectrum").removeClass('hidden');
            $("#ejdManualScaleYSpectrum").ejDialog("open");
        };

        _configureCursor = function () {
            var
                widgetHeight,
                configParameters,
                configContainer,
                i,
                cursorIni,
                cursorCount;

            // Obtener los valores de configuracion del cursor
            if (_cursorType === cursorType.Harmonic) {
                configParameters = _cursor.getHarmonicConfig();
                _harmonicCount = Number(Number(configParameters.count).toFixed(0));
                _harmonicIni = Number(Number(configParameters.initial).toFixed(2));
            } else {
                configParameters = _cursor.getSidebandConfig();
                _sidebandCount = Number(Number(configParameters.count).toFixed(0));
                _sidebandIni = Number(Number(configParameters.initial).toFixed(2));
                _sidebandWidth = Number(Number(configParameters.width).toFixed(2));
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
                $("#harmonicIni" + _widgetId).val(_harmonicIni.toFixed(2));
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
                    _harmonicCount = Number(Number($("#harmonicNumber" + _widgetId).val()).toFixed(0));
                    _harmonicCount = (_harmonicCount > 12) ? 12 : _harmonicCount;
                    _harmonicIni = Number(Number($("#harmonicIni" + _widgetId).val()).toFixed(2));
                    _cursor.setHarmonicConfig(_harmonicCount, _harmonicIni);
                    _cursor.updateHarmonicPositions(_xCoordinateUnit);
                } else {
                    _sidebandCount = Number(Number($("#sidebandNumber" + _widgetId).val()).toFixed(0));
                    _sidebandCount = (_sidebandCount > 12) ? 12 : _sidebandCount;
                    _sidebandIni = Number(Number($("#sidebandIni" + _widgetId).val()).toFixed(2));
                    _sidebandWidth = Number(Number($("#bandWidth" + _widgetId).val()).toFixed(2));
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
                // Texto a mostrar de forma dinamica
                txt,
                // Valor de velocidad
                velocity;

            headerHeigth = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigth) + "%";
            _chart = new Dygraph(
                _contentBody,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Frecuencia [" + _xCoordinateUnit.Text + "]",
                    ylabel: "Amplitud [" + _subvariables.overall.Units + "]",
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
                        left = g.toDomCoords(0, -20);
                        right = g.toDomCoords(enableFilter ? stopFrequency : 0, +20);
                        left = left[0];
                        right = right[0];
                        canvas.fillStyle = "rgba(255, 255, 102, 1.0)";
                        canvas.fillRect(left, area.y, right - left, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        _lastMousemoveEvt = e;
                        _mouseover = true;
                        _upgradeLabels(pts);
                    },
                    unhighlightCallback: function (e) {
                        _mouseover = false;
                    },
                    drawCallback: function (g, is_initial) {
                        var
                            // DIVs contenedores de los labels en los ejes X e Y de la grafica
                            axisLabelDivs,
                            // Contador
                            i;

                        if (is_initial) {
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
                            ticker: function (min, max, pixels, opts, dygraph, vals) {
                                var
                                    ticks,
                                    dataArray,
                                    i, step;

                                if (min !== max) {
                                    if (_xCoordinateUnit.Value === xCoordinateUnits.Order.Value) {
                                        dataArray = [];
                                        ticks = _getHarmonicLimits(min, max);
                                        if (ticks.totalPoints === 0) {
                                            return dataArray;
                                        }
                                        if (ticks.totalPoints <= 8) {
                                            for (i = ticks.lowIdx; i < ticks.highIdx; i += 1) {
                                                dataArray.push({ v: parseFloat(_nxArray[i]), label: (i + 1).toString() + _xCoordinateUnit.Text });
                                            }
                                        } else {
                                            step = Math.floor((ticks.lowIdx + ticks.highIdx) / 6);
                                            for (i = ticks.lowIdx; i < ticks.highIdx; i += step) {
                                                dataArray.push({ v: parseFloat(_nxArray[i]), label: (i + 1).toString() + _xCoordinateUnit.Text });
                                            }
                                        }
                                        return dataArray;
                                    }
                                }
                                return Dygraph.numericLinearTicks(min, max, pixels, opts, dygraph, vals);
                            }
                        }
                    }
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

            document.body.addEventListener("keydown", function (e) {
                if (_mouseover) {
                    if (e.keyCode == 37) {
                        _updateSelection("keyboardEvent", 1, e);
                    } else if (e.keyCode == 39) {
                        _updateSelection("keyboardEvent", 2, e);
                    }
                }
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
        _updateSelection = function (type, selectedKey, e) {

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


            _chart.cascadeEvents_("select", {
                selectedRow: _chart.lastRow_,
                selectedX: _chart.lastx_,
                selectedPoints: _chart.selPoints_
            });

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
            colorSerie = (_chart && _chart.colors_ && _chart.colors_.length > 0) ? _chart.colors_[0] : "#006ACB";
            if (_chart.selPoints_.length > 0) {
                // Dibuja circulos de colores sobre el centro de cada punto seleccionado
                canvasx = _chart.selPoints_[0].canvasx;
                ctx.save();
                for (i = 0; i < _chart.selPoints_.length; i += 1) {
                    if (type == "mouseEvent") {
                        point = _chart.selPoints_[i];
                    } else if (type == "keyboardEvent" && _cursorType == 0) {
                        if (selectedKey == 1) {
                            point = _chart.layout_.points[i][_chart.lastRow_ - 1];
                            _chart.lastRow_ = _chart.lastRow_ - 1;
                        } else if (selectedKey == 2) {
                            point = _chart.layout_.points[i][_chart.lastRow_ + 1];
                            _chart.lastRow_ = _chart.lastRow_ + 1;
                        }
                        if (point) {
                            _chart.xval_ = point.xval;
                            _chart.selPoints_[i] = point;
                            canvasx = point.canvasx;
                            _upgradeLabels(_chart.selPoints_);
                        }
                    }

                    if (point) {
                        if (!Dygraph.isOK(point.canvasy)) {
                            continue;
                        }
                        circleSize = _chart.getNumericOption("highlightCircleSize", point.name);
                        callback = _chart.getFunctionOption("drawHighlightPointCallback", point.name);
                        if (!callback) {
                            callback = Dygraph.Circles.DEFAULT;
                        }
                        ctx.lineWidth = _chart.getNumericOption("strokeWidth", point.name);
                        ctx.strokeStyle = colorSerie;
                        ctx.fillStyle = colorSerie;
                        callback.call(_chart, _chart, point.name, ctx, point.canvasx, point.canvasy, colorSerie, circleSize, point.idx);
                    }
                }
                if (type == "keyboardEvent" && _cursorType == 0) {
                    _chart.cascadeEvents_("select", {
                        selectedRow: _chart.lastRow_,
                        selectedX: _chart.lastx_,
                        selectedPoints: _chart.selPoints_
                    });
                }
                ctx.restore();
                _chart.previousVerticalX_ = canvasx;
            }
            if (type == "keyboardEvent") {
                _cursor.applyKeyEvent(_cursorType, selectedKey, e);
            }

        };

        _redrawGraph = function () {
            var
                // Texto dinamico a desplegar
                txt,
                // Datos a graficar
                xyData,
                // Valor de velocidad
                velocity,
                // Armonico 1x base
                nxBase,
                // Valor maximo de amplitud
                maximumY,
                // Fila de la seleccion actual
                row,
                // Posicion inicial de la ventana a mostar del grafico sobre el eje X
                xIni,
                // Posicion final de la ventana a mostar del grafico sobre el eje X
                xEnd,
                // Indica si la gráfica está en modo auto
                auto,
                // Indica si el gráfico está en escala manual
                manual,
                // Indica si es un espectro de aceleración
                accelerationSprectum,
                // Indica si es un espectro de velocidad 
                velocitySprectum;

            auto = $("li>a[data-value= autoScaleY" + _widgetId + "]>i").hasClass('fa-check-square');
            manual = $("li>a[data-value= manualScaleY" + _widgetId + "]>i").hasClass('fa-check-square');
            accelerationSprectum = $("li>a[data-value=accelerationSpectrum" + _widgetId + "]>i").hasClass('fa-check-square');
            velocitySprectum = $("li>a[data-value=velocitySpectrum" + _widgetId + "]>i").hasClass('fa-check-square');
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
                for (row = nxBase; row < xyData.length; row += nxBase) {
                    _nxArray.push(row);
                }
            }
            // Calculamos maximo y minimo de la grafica
            if (xyData.length > 0) {
                maximumY = arrayColumn(xyData, 1).max();
            }

            // Redefinimos los valores maximo y minimo de la grafica basado en todas las graficas abiertas
            if (_largestY === 0) {
                _largestY = maximumY;
            }

            //auto = $("li>a[data-value= autoScaleY" + _widgetId + "]>i").hasClass('fa-check-square');
            // Gestiona la escala en Y manual o auto de la gráfica
            if (_yScaleValue && !_autoscale) {
                _largestY = _yScaleValue;
            } else {
                if (auto && _autoscale) {
                    _largestY = maximumY;
                } else {
                    var scaleY = ej.DataManager(_scaleY).executeLocal(ej.Query().search(_widgetId, "WidgetId"));
                    if (scaleY.length == 1) {
                        //accelerationSprectum = $("li>a[data-value=accelerationSpectrum" + _widgetId + "]>i").hasClass('fa-check-square');
                        //velocitySprectum = $("li>a[data-value=velocitySpectrum" + _widgetId + "]>i").hasClass('fa-check-square');

                        if (velocitySprectum && (scaleY[0].Velocity != null)) {
                            _largestY = scaleY[0].Velocity;
                        }
                        else if (accelerationSprectum && (scaleY[0].Acceleration != null)) {
                            _largestY = scaleY[0].Acceleration;
                        }
                        else {
                            if (manual) {
                                $("li>a[data-value=manualScaleY" + _widgetId + "]>i").removeClass('fa-check-square').addClass("fa-square-o");
                                $("li>a[data-value=autoScaleY" + _widgetId + "]>i").addClass('fa-check-square').removeClass("fa-square-o");
                                _autoscale = true;
                            }
                            _largestY = maximumY;
                        }
                    }
                    else {
                        _largestY = maximumY;
                    }
                }
            }

            xIni = 0;
            xEnd = xyData.length * _xCoordinateUnit.Factor;
            if (_chart.boundaryIds_[0][0] !== _chart.boundaryIds_[0][1]) {
                xIni = xyData[_chart.boundaryIds_[0][0]][0];
                xEnd = xyData[_chart.boundaryIds_[0][1]][0];
            }

            _chart.updateOptions({
                "file": xyData,
                "ylabel": _chart.user_attrs_.ylabel,
                "valueRange": [0, _largestY * 1.1],
                "dateWindow": [xIni, xEnd]
            });
            // Texto a mostrar
            txt = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
            switch (_selectedSpectrumType.Value) {
                case spectrumTypes.Displacement.Value:
                    txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.overall.Name + ": ";
                    txt += _subvariables.overall.Value.toFixed(2) + " " + _subvariables.overall.Units + ", &nbsp;";
                    chartScaleY.AttachGraph(_graphType + "/displacement", _widgetId, _measurementPoint.SensorTypeCode, 0, maximumY);
                    break;
                case spectrumTypes.Velocity.Value:
                    if (_measurementPoint.SensorTypeCode === 2) {
                        // ACELEROMETRO MOSTRANDO UNIDADES DE VELOCIDAD (INTEGRAR)
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.overall.Name + ": ";
                        txt += _subvariables.overall.Value.toFixed(2) + " " + _subvariables.overall.Units + ", &nbsp;";
                    } else if (_measurementPoint.SensorTypeCode === 3 && !_measurementPoint.Integrate) {
                        // VELOCIMETRO MOSTRANDO UNIDADES GLOBALES
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.overall.Name + ": ";
                        txt += _subvariables.overall.Value.toFixed(2) + " " + _subvariables.overall.Units + ", &nbsp;";
                    } else if (_measurementPoint.SensorTypeCode === 3 && _measurementPoint.Integrate) {
                        // VELOCIMETRO MOSTRANDO UNIDADES ORIGINALES
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.original.Name + ": ";
                        txt += _subvariables.original.Value.toFixed(2) + " " + _subvariables.original.Units + ", &nbsp;";
                    }
                    chartScaleY.AttachGraph(_graphType + "/velocity", _widgetId, _measurementPoint.SensorTypeCode, 0, maximumY);
                    break;
                case spectrumTypes.Acceleration.Value:
                    if (_measurementPoint.SensorTypeCode === 2 && _measurementPoint.Integrate) {
                        // ACELEROMETRO MOSTRANDO UNIDADES ORIGINALES
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.original.Name + ": ";
                        txt += _subvariables.original.Value.toFixed(2) + " " + _subvariables.original.Units + ", &nbsp;";
                    } else if (_measurementPoint.SensorTypeCode === 2 && !_measurementPoint.Integrate) {
                        // ACELEROMETRO MOSTRANDO UNIDADES GLOBALES
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", " + _subvariables.overall.Name + ": ";
                        txt += _subvariables.overall.Value.toFixed(2) + " " + _subvariables.overall.Units + ", &nbsp;";
                    } else if (_measurementPoint.SensorTypeCode === 3) {
                        // VELOCIMETRO MOSTRANDO UNIDADES DE ACELERACION (DERIVAR)
                    }
                    chartScaleY.AttachGraph(_graphType + "/acceleration", _widgetId, _measurementPoint.SensorTypeCode, 0, maximumY);
                    break;
            }
            // Concatenar la estampa de tiempo actual de la grafica
            txt += _currentTimeStamp;
            $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
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
            mousedown: function (e, g, ctx) {
                ctx.initializeMouseDown(e, g, ctx);
                ctx.customFlag = false;
                if (e.ctrlKey || e.shiftKey) {
                    if (_cursorType === 2) {
                        _cursor.clearCursor();
                    }
                    Dygraph.startPan(e, g, ctx);
                } else {
                    Dygraph.startZoom(e, g, ctx);
                }
            },
            mousemove: function (e, g, ctx) {
                var
                    points,
                    selectionChanged,
                    canvasCoords,
                    row,
                    setIdx,
                    setRow,
                    point,
                    pointIdx,
                    callback;

                if (ctx.isPanning) {
                    Dygraph.movePan(e, g, ctx);
                } else if (ctx.isZooming) {
                    Dygraph.moveZoom(e, g, ctx);
                } else {
                    // VALIDAR SI LA SELECCION CAMBIO ANTES DE LLAMAR LA FUNCION
                    points = g.layout_.points;
                    if (points === undefined || points === null) {
                        return;
                    }
                    selectionChanged = false;
                    canvasCoords = g.eventToDomCoords(e);
                    row = _findClosestPoint(canvasCoords[0], canvasCoords[1], g.layout_).row;
                    if (row !== _chart.lastRow_) {
                        selectionChanged = true;
                    }
                    _chart.lastRow_ = row;
                    _chart.selPoints_ = [];
                    for (setIdx = 0; setIdx < _chart.layout_.points.length; ++setIdx) {
                        points = _chart.layout_.points[setIdx];
                        setRow = row - _chart.getLeftBoundary_(setIdx);
                        if (!points[setRow]) {
                            // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                            continue;
                        }
                        if (setRow < points.length && points[setRow].idx === row) {
                            point = points[setRow];
                            if (point.yval !== null && !Number.isNaN(point.yval)) {
                                _chart.selPoints_.push(point);
                            }
                        } else {
                            for (pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                                point = points[pointIdx];
                                if (point.idx === row) {
                                    if (point.yval !== null && !Number.isNaN(point.yval)) {
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
                        _updateSelection("mouseEvent");
                    }
                    callback = _chart.getFunctionOption("highlightCallback");
                    if (callback && selectionChanged) {
                        callback.call(_chart, event,
                            _chart.lastx_,
                            _chart.selPoints_,
                            _chart.lastRow_,
                            _chart.highlightSet_);
                    }
                }
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
                    "valueRange": [0, _largestY * 1.1],
                    "dateWindow": [0, g.file_.length * _xCoordinateUnit.Factor]
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
            touchmove: Dygraph.defaultInteractionModel.touchmove,
            mouseout: function (e, g, ctx) {
                _flagMouseOver = false;
            }
            //,
            //touchstart: newDygraphTouchstart,
            //touchend: Dygraph.defaultInteractionModel.touchend,
            //touchmove: Dygraph.defaultInteractionModel.touchmove
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
         * Suscribe el chart al dato segun el Modo definido
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
                        if (isEmpty(waveform)) {
                            console.error("No se encontró datos de forma de onda.");
                            return;
                        }
                        if (_subvariables.overall) {
                            _subvariables.overall.Value = clone(data[_subvariables.overall.Id].Value);
                        }
                        if (_subvariables.original) {
                            _subvariables.original.Value = clone(data[_subvariables.original.Id].Value);
                        }
                        if (_angularSubvariable) {
                            _angularSubvariable.Value = clone(data[_angularSubvariable.Id].Value);
                        }
                        _subvariables.waveform.RawValue = clone(waveform.RawValue);
                        _subvariables.waveform.SampleRate = clone(waveform.SampleRate);
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
                        if (isEmpty(waveform)) {
                            console.error("No se encontró datos de forma de onda.");
                            return;
                        }
                        idList = [];
                        if (_subvariables.overall) {
                            idList.push(_subvariables.overall.Id);
                        }
                        if (_subvariables.original) {
                            idList.push(_subvariables.original.Id);
                        }
                        if (_angularSubvariable) {
                            idList.push(_angularSubvariable.Id);
                        }
                        _subvariables.waveform.RawValue = clone(waveform.RawValue);
                        _subvariables.waveform.SampleRate = clone(waveform.SampleRate);
                        if (idList.length > 0) {
                            aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [parseInt(timeStamp)], _assetData.NodeId, function (resp) {
                                for (i = 0; i < resp.length; i += 1) {
                                    if (_subvariables.overall && resp[i].subVariableId === _subvariables.overall.Id) {
                                        _subvariables.overall.Value = clone(resp[i].value);
                                    } else if (_subvariables.original && resp[i].subVariableId === _subvariables.original.Id) {
                                        _subvariables.original.Value = clone(resp[i].value);
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
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoint.Id], _assetData.NodeId, subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        aidbManager.GetStreamBySubVariableIdAndTimeStamp(_subvariables.waveform.Id, currentTimeStamp, _assetData.NodeId, function (data) {
                            if (data.length > 0) {
                                waveform = {
                                    TimeStamp: formatDate(new Date(data[0].timeStamp)),
                                    SampleTime: clone(data[0].sampleTime),
                                    RawValue: clone(data[0].value),
                                    SampleRate: (data[0].value.length / data[0].sampleTime)
                                };
                            }
                            if (isEmpty(waveform)) {
                                console.error("No se encontró datos de forma de onda.");
                                return;
                            }
                            idList = [];
                            if (_subvariables.overall) {
                                idList.push(_subvariables.overall.Id);
                            }
                            if (_subvariables.original) {
                                idList.push(_subvariables.original.Id);
                            }
                            if (_angularSubvariable) {
                                idList.push(_angularSubvariable.Id);
                            }
                            _subvariables.waveform.Value = clone(waveform.Value);
                            _subvariables.waveform.RawValue = clone(waveform.RawValue);
                            _subvariables.waveform.SampleRate = clone(waveform.SampleRate);
                            if (idList.length > 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [currentTimeStamp], _assetData.NodeId, function (resp) {
                                    for (i = 0; i < resp.length; i += 1) {
                                        if (_subvariables.overall && resp[i].subVariableId === _subvariables.overall.Id) {
                                            _subvariables.overall.Value = clone(resp[i].value);
                                        } else if (_subvariables.original && resp[i].subVariableId === _subvariables.original.Id) {
                                            _subvariables.original.Value = clone(resp[i].value);
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
                    });
                    break;
            }
        };

        /*
         * Actualiza los valores a graficar
         */
        _refresh = function (waveform) {
            var
                // Datos a graficar
                xyData;

            if (!_pause) {
                //if (_currentTimeStamp !== waveform.TimeStamp) {
                // Estampa de tiempo actual de graficacion
                _currentTimeStamp = waveform.TimeStamp;
                // Informacion del grafico
                xyData = _getHalfSpectrum(waveform);
                // Mantener en memoria el valor del ultimo espectro mostrado
                _currentData = clone(xyData);
                _redrawGraph();
                //}
            }
        };

        _getHalfSpectrum = function (waveform) {
            var
                bin,
                real,
                imag,
                data,
                windowFactor,
                bSi,
                resp;

            // Bin o espaciamiento de los espectros
            bin = waveform.SampleRate / waveform.RawValue.length;
            real = [];
            imag = [];
            data = clone(waveform.RawValue);
            windowFactor = { value: 1 };
            switch (_windowing.Value) {
                case windowing.Hamming.Value:
                    HammingWindow(data, windowFactor);
                    break;
                case windowing.Hanning.Value:
                    HanningWindow(data, windowFactor);
                    break;
                case windowing.None.Value:
                    break;
                default:
                    console.log("Tipo de ventaneo no conocido.");
            }
            for (i = 0; i < data.length; i += 1) {
                real[i] = data[i];
                imag[i] = 0;
            }
            new FourierTransform().Forward(real, imag);
            // Factor basado en el tipo de medida (pico-pico, cero-pico o RMS)
            bSi = GetBSIFactor(_subvariables.overall.MeasureType, real.length);
            resp = [];
            for (i = 0; i < (real.length / 2) ; i += 1) {
                resp.push([i * bin, bSi * Math.sqrt(Math.pow(real[i], 2) + Math.pow(imag[i], 2)) * windowFactor.value]);
            }
            return resp;
        };

        _subscribeToApplyFilter = function () {
            _applyFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                // DIBUJAR LA SOMBRA
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

            sensorCode = _measurementPoint.SensorTypeCode;
            if (sensorCode === 1) {
                _scaleChartDisplacement = PublisherSubscriber.subscribe("/scale/" + _graphType + "/displacement", [sensorCode], function (data) {
                    if (data[sensorCode] && _selectedSpectrumType === spectrumTypes.Acceleration) {
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
                    if (data[sensorCode] && _selectedSpectrumType === spectrumTypes.Acceleration) {
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
                    if (data[sensorCode] && _selectedSpectrumType === spectrumTypes.Velocity) {
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
                    if (data[sensorCode] && _selectedSpectrumType === spectrumTypes.Acceleration) {
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
                unitToConvert;

            if (_measurementPoint.SensorTypeCode === 3 && _measurementPoint.Integrate) {
                // VELOCIMETRO MOSTRANDO UNIDADES DE DESPLAZAMIENTO (DERIVAR)
                currentUnit = _subvariables.overall.Units;
                unitToConvert = _subvariables.original.Units;
                // GENERAR ESPECTRO DE DESPLAZAMIENTO
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor,
                        _getDerivativeValue(_currentData[i][1], _currentData[i][0], currentUnit, unitToConvert)]);
                }
            } else if (_measurementPoint.SensorTypeCode === 1) {
                // PROXIMIDAD MOSTRANDO UNIDADES DE DESPLAZAMIENTO
                currentUnit = _subvariables.overall.Units;
                // GENERAR ESPECTRO DE DESPLAZAMIENTO
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1]]);
                }
            }
            yLabel += " [" + currentUnit + "]";
            _chart.user_attrs_.ylabel = yLabel;
            return xyData;
        };

        _getVelocitySpectrum = function (xyData, yLabel) {
            var
                currentUnit,
                unitToConvert;

            if (_measurementPoint.SensorTypeCode === 2 && _measurementPoint.Integrate) {
                // ACELEROMETRO MOSTRANDO UNIDADES DE VELOCIDAD
                currentUnit = _subvariables.overall.Units;
                unitToConvert = _subvariables.original.Units;
                // EL VALOR DE FORMA DE ONDA ES INTEGRADO POR LO CUAL NO REQUIERE OPERACIONES ADICIONALES
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1]]);
                }
            } else if (_measurementPoint.SensorTypeCode === 2 && !_measurementPoint.Integrate) {
                // ACELEROMETRO NO INTEGRADO MOSTRANDO UNIDADES DE VELOCIDAD (INTEGRAR)
                currentUnit = _subvariables.overall.Units;
                // GENERAR ESPECTRO DE VELOCIDAD
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor,
                        _getIntegratedValue(_currentData[i][1], _currentData[i][0], currentUnit, unitToConvert)]);
                }
            } else if (_measurementPoint.SensorTypeCode === 3 && !_measurementPoint.Integrate) {
                // VELOCIMETRO MOSTRANDO UNIDADES POR DEFECTO
                currentUnit = _subvariables.overall.Units;
                // DEBIDO A QUE EL SENSOR NO ES INTEGRADO, LOS VALORES DE FORMA DE ONDA SON DE VELOCIDAD
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1]]);
                }
            } else if (_measurementPoint.SensorTypeCode === 3 && _measurementPoint.Integrate) {
                // VELOCIMETRO MOSTRANDO UNIDADES ORIGINALES
                currentUnit = _subvariables.original.Units;
                unitToConvert = _subvariables.overall.Units;
                // GENERAR ESPECTRO DE VELOCIDAD (INTEGRAR)
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor,
                        _getIntegratedValue(_currentData[i][1], _currentData[i][0], currentUnit, unitToConvert)]);
                }
            }
            yLabel += " [" + currentUnit + "]";
            _chart.user_attrs_.ylabel = yLabel;
            return xyData;
        };

        _getAccelerationSpectrum = function (xyData, yLabel) {
            var
                currentUnit,
                unitToConvert;

            if (_measurementPoint.SensorTypeCode === 2 && _measurementPoint.Integrate) {
                // ACELEROMETRO MOSTRANDO UNIDADES ORIGINALES
                currentUnit = _subvariables.original.Units;
                unitToConvert = _subvariables.overall.Units;
                // A DIFERENCIA DE LAS UNIDADES, EL VALOR DE FORMA DE ONDA ES INTEGRADO, SE REQUIERE DERIVAR
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor,
                        _getDerivativeValue(_currentData[i][1], _currentData[i][0], currentUnit, unitToConvert)]);
                }
            } else if (_measurementPoint.SensorTypeCode === 2 && !_measurementPoint.Integrate) {
                // ACELEROMETRO MOSTRANDO UNIDADES UNICAS O POR DEFECTO
                currentUnit = _subvariables.overall.Units;
                // DEBIDO A QUE EL SENSOR NO ES INTEGRADO, LOS VALORES DE FORMA DE ONDA SON DE ACELERACION
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor, _currentData[i][1]]);
                }
            } else if (_measurementPoint.SensorTypeCode === 3 && !_measurementPoint.Integrate) {
                // VELOCIMETRO MOSTRANDO UNIDADES DE ACELERACION
                currentUnit = _subvariables.overall.Units;
                // LOS VALORES DE FORMA DE ONDA REQUIEREN DERIVAR
                for (i = 0; i < _currentData.length; i += 1) {
                    xyData.push([_currentData[i][0] * _xCoordinateUnit.Factor,
                        _getDerivativeValue(_currentData[i][1], _currentData[i][0], currentUnit, unitToConvert)]);
                }
            }
            yLabel += " [" + currentUnit + "]";
            _chart.user_attrs_.ylabel = yLabel;
            return xyData;
        };

        _getDerivativeValue = function (value, frequency, currentUnit, unitToConvert) {
            var
                factor;

            if (unitToConvert === undefined) {
                // SIGNIFICA QUE LA CONVERSION BUSCADA NO ES CONOCIDA Y SE DEBE SELECCIONAR UNA POR DEFECTO BASADA EN LA ACTUAL
            }
            currentUnit = currentUnit.toLowerCase();
            unitToConvert = unitToConvert.toLowerCase();
            // GENERAR EL ALGORITMO QUE DETERMINA EL FACTOR QUE SE DEBE APLICAR PARA LA CONVERSION DE UNIDADES
            factor = 1.0;
            return value * 2 * Math.PI * frequency * factor;
        };

        _getIntegratedValue = function (value, frequency, currentUnit, unitToConvert) {
            var
                factor;

            if (unitToConvert === undefined) {
                // SIGNIFICA QUE LA CONVERSION BUSCADA NO ES CONOCIDA Y SE DEBE SELECCIONAR UNA POR DEFECTO BASADA EN LA ACTUAL
            }
            currentUnit = currentUnit.toLowerCase();
            unitToConvert = unitToConvert.toLowerCase();
            // GENERAR EL ALGORITMO QUE DETERMINA EL FACTOR QUE SE DEBE APLICAR PARA LA CONVERSION DE UNIDADES
            factor = 1.0;
            return (value / (2 * Math.PI * frequency)) * factor;
        };

        _getCurrentYUnits = function () {
            var
                unit;

            switch (_selectedSpectrumType.Value) {
                case spectrumTypes.Displacement.Value:
                    unit = _subvariables.overall.Units;
                    break;
                case spectrumTypes.Velocity.Value:
                    if (_measurementPoint.SensorTypeCode === 3 && _measurementPoint.Integrate) {
                        // VELOCIMETRO MOSTRANDO UNIDADES ORIGINALES
                        unit = _subvariables.original.Units;
                    } else {
                        unit = _subvariables.overall.Units;
                    }
                    break;
                case spectrumTypes.Acceleration.Value:
                    if (_measurementPoint.SensorTypeCode === 2 && _measurementPoint.Integrate) {
                        // ACELEROMETRO MOSTRANDO UNIDADES ORIGINALES
                        unit = _subvariables.original.Units;
                    } else {
                        unit = _subvariables.overall.Units;
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

        this.Show = function (measurementPointId, timeStamp) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
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

            switch (timeMode) {
                case 0: // RT
                    _measurementPoint = selectedMeasurementPoint;
                    _assetData = selectedAsset;

                    // Si el asset no tiene un asdaq asociado, significa que no se están actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    if (!_assetData.AsdaqId && !_assetData.AtrId) {
                        popUp("info", "No hay datos tiempo real activo seleccionado.");
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
            if (_measurementPoint.MeasureType !== 4) {
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
            originalUnits = "";
            if (_measurementPoint.Integrate) {
                // SubVariable que contiene el valor original del punto de medicion
                _subvariables.original = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where(ej.Predicate("FromIntegratedWaveform", "equal", false, false).and("ValueType", "equal", 1)))[0]);
                if (_subvariables.original) {
                    subVariableIdList.push(_subvariables.original.Id);
                    switch (_subvariables.original.MeasureType) {
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
                    _subvariables.original.Units += originalUnits;
                }
            }
            // SubVariable que corresponde al punto de referencia angular
            if (_angularSubvariable) {
                subVariableIdList.push(_angularSubvariable.Id);
            }
            _seriesName = ["Amplitud"];
            // Creamos el titulo de la grafica
            title = "Espectro de amplitud";
            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            // Para los tipos de sensor (2) Acelerometro y (3) Velocimetro se crea un menu que permite intercambiar entre los tipos de espectro
            if (_measurementPoint.SensorTypeCode === 2 || _measurementPoint.SensorTypeCode === 3) {
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
            // Menu que permite seleccionar entre manual o auto la escala en Y de la gráfica
            _createScaleYMenu(settingsMenu, settingsSubmenu);
            // Menu de exportar los datos de la grafica como una imagen
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
            // Menu de exportar los datos de la grafica como Excel
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));
            //settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Zoom", "zoom" + _widgetId));

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: title,
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
                measurementPointList: [_measurementPoint.Name.replace(/\s/g, "")],
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

            labels = ["Estampa de tiempo", _seriesName[0]];
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Se suscribe a la notificacion de llegada de nuevos datos.
            _subscribeToNewData(timeStamp, subVariableIdList);
            // Se suscribe a la notificacion de aplicacion de filtro dinamico para la forma de onda
            _subscribeToApplyFilter();
            // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
            _subscribeToResizeChart();
            // Se suscribe a la notificacion escala en Y por mayor valor.
            _subscribeToScaleChart();
            // Construir y mostrar grafica.
            _buildGraph(labels);
        };

        _createSpectrumTypeMenu = function (settingsMenu, settingsSubmenu) {
            settingsSubmenu = [];
            if ((_measurementPoint.Integrate && _measurementPoint.SensorTypeCode === 2) ||
                !_measurementPoint.Integrate && _measurementPoint.SensorTypeCode === 3) {
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
            } else if ((!_measurementPoint.Integrate && _measurementPoint.SensorTypeCode === 2)) {
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
            } else if ((!_measurementPoint.Integrate && _measurementPoint.SensorTypeCode === 3)) {
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

        _upgradeLabels = function (pts) {
            var
                txt;

            txt = "Amplitud: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " ";
            txt += _getCurrentYUnits();
            if (_xCoordinateUnit.Value === xCoordinateUnits.Order.Value) {
                txt += ", Frecuencia: ";
                if ((_angularSubvariable && _angularSubvariable.Value !== null)) {
                    txt += parseFloat(pts[0].xval.toFixed(2) / (_angularSubvariable.Value / 60)).toFixed(2) + " " + _xCoordinateUnit.Text;
                    txt += ", " + _angularSubvariable.Value.toFixed(0) + " RPM";
                } else {
                    txt += "--";
                }
            } else {
                txt += ", Frecuencia: " + pts[0].xval.toFixed(2) + " " + _xCoordinateUnit.Text;
                if ((_angularSubvariable && _angularSubvariable.Value !== null)) {
                    txt += ", " + _angularSubvariable.Value.toFixed(0) + " RPM";
                }
            }
            $("#" + pts[0].name + _widgetId + " > span").html(txt);
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

        this.Close = function () {
            var
                el;

            // Elimina el objeto en memoria de la escala en "Y" manual, si esta existe.
            ej.DataManager(_scaleY).remove("WidgetId", _widgetId, _scaleY);

            if (_scaleChartDisplacement) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                chartScaleY.DetachGraph(_graphType + "/displacement", _widgetId, _measurementPoint.SensorTypeCode);
                _scaleChartDisplacement.remove();
            }
            if (_scaleChartVelocity) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                chartScaleY.DetachGraph(_graphType + "/velocity", _widgetId, _measurementPoint.SensorTypeCode);
                _scaleChartVelocity.remove();
            }
            if (_scaleChartAcceleration) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                chartScaleY.DetachGraph(_graphType + "/acceleration", _widgetId, _measurementPoint.SensorTypeCode);
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
            if (_applyFilterSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar filtro dinámico a la forma de onda
                _applyFilterSubscription.remove();
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

    return SpectrumGraph;
})();