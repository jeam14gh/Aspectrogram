/*
 * orbitGraph.js
 * Gestiona todo lo relacionado a la grafica de orbitas.
 * @author Jorge Calderon
 */

/* globals ImageExport, createTableToExcel, tableToExcel, clone, DygraphOps, Dygraph, isEmpty, PublisherSubscriber, ej,
   aidbManager, HistoricalTimeMode, formatDate, GetXYDataOnTime, GetKeyphasorOnTime, parseAng, selectedMeasurementPoint,
   selectedAsset, popUp, mainCache, AspectrogramWidget*/

var OrbitGraph = {};

OrbitGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    OrbitGraph = function (timeMode, width, height, aspectRatio) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Contenedor general para los diferentes chart a mostrar
            _contentBody,
            // Contenedor especifico de la representacion orbital
            _contentOrbit,
            // Contenedor especifico de la representacion de la forma de onda del punto con orientacion X
            _contentXWaveform,
            // Contenedor especifico de la representacion de la forma de onda del punto con orientacion Y
            _contentYWaveform,
            // Contenedor de las medidas a mostrar en la parte superior de la grafica
            _contentHeader,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase OrbitGraph
            _this,
            // Referencia al chart de orbita
            _orbitChart,
            // Referencia al chart de forma de onda en X
            _xWaveformChart,
            // Referencia al chart de forma de onda en Y
            _yWaveformChart,
            // Referencia al Id del widget
            _widgetId,
            // Mantiene el ultimo evento mousemove que se realizo sobre la grafica
            _lastMousemoveEvt,
            // Valor booleano que indica si el usuario tiene el mouse sobre la grafica
            _mouseover,
            // Dimension del cuadrado
            _side,
            // Rango maximo y minimo del grafico, tanto en el eje X como en el eje Y
            _graphRange,
            // Mantiene la ultima estampa de tiempo que se actualizo en la grafica
            _currentTimeStamp,
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
            // Bandera que identifica si se esta mostrando la grafica filtrada 1x o sin filtro
            _filtered1x,
            // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
            _rotn,
            // Gestiona el numero de vueltas a mostrar sobre el grafico de orbita
            _laps,
            // Frecuencia caracteristica/fundamental 1X
            _fundamentalFrequency,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion para sincronizacion de los datos del reproductor
            _playerSubscription,
            // Referencia a la suscripcion para aplicar filtro dinamico
            _dynamicFilterSubscription,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que re-calcula las posiciones de referencia angular para orbita filtrada 1x
            _calculateAngularPositions,
            // Metodo privado que aplica filtro a la frecuencia caracteristica 1X
            _customFilter,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo privado que gestiona la graficacion de los charts
            _drawCharts,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo privado que obtiene la fase inicial de una forma de onda
            _getInitialPhase,
            // Metodo privado que obtiene la informacion a graficar de la orbita
            _getOrbitData,
            // Metodo privado que obtiene los valores maximos y minimos de las graficas de orbita y formas de onda
            _getRangeGraph,
            // Metodo privado que obtiene la informacion de los puntos seleccionados en el conjunto de graficas
            _getSelectedPoints,
            // Metodo privado como manejador de eventos de KeyDown
            _keyDownEventHandler,
            // Metodo privado que gestiona el evento clic sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que se ejecuta para actualizar la informacion a graficar
            _refresh,
            // Metodo privado que calcula las margenes deseadas
            _setMargins,
            // Metodo privado que gestiona el numero de vueltas a graficar en la orbita
            _setOrbitLaps,
            // Metodo privado que permite mostrar/ocultar la orbita filtrada 1X
            _showHideFilteredOrbit,
            // Metodo privado que oculta el eje de la grafica Y1 intercambiandolo por el Y2
            _showY2Axis,
            // Metodo privado que realiza la suscripcion al publisher para aplicar filtro dinamico
            _subscribeToDynamicFilter,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto
         */
        _pause = (timeMode === 0) ? false : true;
        _movableGrid = false;
        _filtered1x = false;
        _this = this;
        _graphType = "orbit";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _measurementPoints = {};
        _xSubvariables = {};
        _ySubvariables = {};
        _laps = 4;

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "orbitGraph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = "orbitHeader" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "orbitBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "85%";
        _contentBody.style.cssFloat = "right";
        $(_container).append(_contentBody);
        $(_contentBody).append("<div class=\"row\" style=\"margin: 0px;height:100%;\"><div class=\"col-sm-6 orbitContent\">" +
                               "</div><div class=\"col-sm-6 waveformContent\"></div></div>");
        _contentOrbit = document.createElement("div");
        _contentOrbit.id = "orbital" + _widgetId;
        $(_contentBody).children().children().eq(0).append(_contentOrbit);
        _contentXWaveform = document.createElement("div");
        _contentXWaveform.id = "xWaveform" + _widgetId;
        _contentXWaveform.style.height = "41.5%";
        $(_contentBody).children().children().eq(1).append("<div id=\"waveformXLabel" + _widgetId +
            "\" style=\"height:4%;padding-left:5px;margin-right:2px;\"><span></span><span></span></div>");
        $(_contentBody).children().children().eq(1).append(_contentXWaveform);
        $(_contentBody).children().children().eq(1).append("<div id=\"waveformYLabel" + _widgetId +
            "\" style=\"height:4%;padding-left:5px;margin-right:2px;\"><span></span><span></span></div>");
        _contentYWaveform = document.createElement("div");
        _contentYWaveform.id = "yWaveform" + _widgetId;
        _contentYWaveform.style.height = "50%";
        $(_contentBody).children().children().eq(1).append(_contentYWaveform);

        /*
         * Define las margenes de tal forma que el grafico de orbita ocupe la mitad derecha del contenedor de graficas.
         * La mitad izquierda es ocupada por ambas graficas de forma de onda (x, y)
         */
        _setMargins = function () {
            var
                w, h,
                mrg,
                widthContent,
                heightContent,
                header;

            header = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - header) + "%";
            w = _contentBody.clientWidth / 2;
            h = _contentBody.clientHeight;
            _side = [w, h].min();
            mrg = ([w, h].max() - _side) / 2;
            widthContent = (w === _side) ? (_side * 100) / w : ((_side + 40) * 100) / w;
            widthContent = (widthContent > 100) ? 100 : widthContent;
            heightContent = (h === _side) ? (_side * 100) / h : ((_side - 40) * 100) / h;
            $(_contentOrbit).css("width", widthContent + "%");
            $(_contentOrbit).css("height", heightContent + "%");
            if (w === _side) {
                $(_contentOrbit).css("margin-top", ((100 - heightContent) / 2) + "%");
                $(_contentOrbit).css("margin-left", "0%");
            } else {
                $(_contentOrbit).css("margin-left", ((100 - widthContent) / 2) + "%");
                $(_contentOrbit).css("margin-top", ((100 - ((_side * 100) / h)) / 2.2) + "%");
            }
        };

        /*
         * Callback de evento clic sobre algun item del menu de opciones
         * @param {Object} evt Argumentos del evento
         */
        _onSettingsMenuItemClick = function (evt) {
            evt.preventDefault();
            var
                target,
                item,
                imgExport,
                contId,
                name,
                labels,
                i;

            target = $(evt.currentTarget);
            item = target.attr("data-value");
            switch (item) {
                case "setLaps" + _widgetId:
                    _setOrbitLaps();
                    break;
                case "filteredOrbit" + _widgetId:
                    _showHideFilteredOrbit(true, target);
                    break;
                case "unfilteredOrbit" + _widgetId:
                    _showHideFilteredOrbit(false, target);
                    break;
                case "saveImage" + _widgetId:
                    imgExport = new ImageExport(_orbitChart, _graphType);
                    imgExport.asPNG();
                    break;
                case "exportToExcel" + _widgetId:
                    labels = [];
                    if (timeMode === 0) {
                        name = "Tiempo Real, Órbita: " + _assetData.Name;
                    } else if (timeMode === 1) {
                        name = "Histórico, Órbita: " + _assetData.Name;
                    }
                    contId = "tableToExcelOrbitGraph" + _widgetId;
                    for (i = 0; i < _orbitChart.user_attrs_.labels.length; i += 1) {
                        labels.push(_orbitChart.user_attrs_.labels[i]);
                    }
                    createTableToExcel(_container, contId, name, labels, _orbitChart.file_, false);
                    tableToExcel("tableToExcelOrbitGraph" + _widgetId, name);
                    break;
            }
        };

        _setOrbitLaps = function () {
            var
                configContainer,
                x, y,
                phaseIni,
                sampleTime,
                positions;

            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "orbit";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"orbitLapsToShow\" " +
              "style=\"font-size:12px;\">N&uacute;mero de vueltas</label></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"number\" " +
              "id=\"orbitLapsToShow\" name=\"orbitLapsToShow\" style=\"width:100%;\"></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnSaveLaps" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveLaps" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnCancelLaps" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelLaps" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#orbitLapsToShow").val(_laps);
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                isResponsive: true,
                enableModal: true,
                showRoundedCorner: true,
                enableResize: false,
                width: "auto",
                height: "auto",
                close: function () {
                    $("#btnCancelLaps" + _widgetId).off("click");
                    $("#btnSaveLaps" + _widgetId).off("click");
                    $("#" + configContainer[0].id).remove();
                },
                content: "#" + configContainer[0].id,
                tooltip: {
                    close: "Cerrar"
                },
                actionButtons: ["close"]
            });
            // Abrir el dialogo
            $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
            // Boton cancelar
            $("#btnCancelLaps" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
            // Botono aceptar
            $("#btnSaveLaps" + _widgetId).click(function (e) {
                e.preventDefault();
                _laps = parseFloat($("#orbitLapsToShow").val());
                if (_laps < 1) {
                    return;
                }
                x = clone(_xSubvariables.waveform.RawValue);
                y = clone(_ySubvariables.waveform.RawValue);
                phaseIni = 0;
                if (_filtered1x) {
                    if (_angularSubvariable && _angularSubvariable.Value > 0) {
                        phaseIni = _getInitialPhase(clone(_xSubvariables.waveform), _xSubvariables.phase);
                    }
                    x = _customFilter(x, _xSubvariables.waveform.SampleRate, _xSubvariables.overall.MeasureType, _xSubvariables.amplitude, phaseIni);
                    if (_angularSubvariable && _angularSubvariable.Value > 0) {
                        phaseIni = _getInitialPhase(clone(_ySubvariables.waveform), _ySubvariables.phase);
                    }
                    y = _customFilter(y, _ySubvariables.waveform.SampleRate, _ySubvariables.overall.MeasureType, _ySubvariables.amplitude, phaseIni);
                }
                sampleTime = (_xSubvariables.waveform.Value.length / _xSubvariables.waveform.SampleRate);
                positions = _calculateAngularPositions(x);
                _drawCharts(x, y, positions, sampleTime);
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
        };

        _showHideFilteredOrbit = function (visible, target) {
            var
                txt,
                x, y,
                phaseIni,
                positions,
                measure,
                sampleTime,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer;

            _filtered1x = visible;
            sampleTime = (_xSubvariables.waveform.RawValue.length / _xSubvariables.waveform.SampleRate);
            txt = "<b style=\"color:" + _measurementPoints.x.Color + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
            txt += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
            txt += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;";
            if (_filtered1x) {
                txt += "(" + _xSubvariables.amplitude.Value.toFixed(2) + "&ang;" + _xSubvariables.phase.Value.toFixed(2) + "&deg;), &nbsp;";
            }
            txt += _currentTimeStamp;
            $("#point" + _measurementPoints.x.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
            txt = "<b style=\"color:" + _measurementPoints.y.Color + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
            txt += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
            txt += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;"
            if (_filtered1x) {
                txt += "(" + _ySubvariables.amplitude.Value.toFixed(2) + "&ang;" + _ySubvariables.phase.Value.toFixed(2) + "&deg;), &nbsp;";
            }
            txt += _currentTimeStamp;
            $("#point" + _measurementPoints.y.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
            if (visible) {
                measure = _xSubvariables.overall.MeasureType;
                if (_angularSubvariable && _angularSubvariable.Value > 0 && _fundamentalFrequency > 0) {
                    phaseIni = _getInitialPhase(clone(_xSubvariables.waveform), _xSubvariables.phase);
                    x = _customFilter(_xSubvariables.waveform.RawValue, _xSubvariables.waveform.SampleRate, measure, _xSubvariables.amplitude, phaseIni);
                    phaseIni = _getInitialPhase(clone(_ySubvariables.waveform), _ySubvariables.phase);
                    y = _customFilter(_ySubvariables.waveform.RawValue, _ySubvariables.waveform.SampleRate, measure, _ySubvariables.amplitude, phaseIni);
                    positions = _calculateAngularPositions(x);
                    _drawCharts(x, y, positions, sampleTime);
                    target[0].innerHTML = "Sin filtrar";
                    target.attr("data-value", "unfilteredOrbit" + _widgetId);
                } else {
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 350, height: 150 };
                    dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
                    configContainer = $("#graphConfigAreaDialog").clone();
                    configContainer.css("display", "block");
                    configContainer[0].id = _widgetId + "orbit";
                    $("#awContainer").append(configContainer);
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"fundamentalFreq\" " +
                      "style=\"font-size:12px;\">Frecuencia fundamental</label></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"number\" " +
                      "id=\"fundamentalFreq\" name=\"fundamentalFreq\" style=\"width:100%;\"></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div style=\"text-align: center;\"></div>");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnSaveFreq" +
                      _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                    $("#btnSaveFreq" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
                    $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnCancelFreq" +
                      _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                    $("#btnCancelFreq" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
                    $("#fundamentalFreq").val(_fundamentalFrequency ? _fundamentalFrequency : 0);
                    $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                        enableResize: false,
                        width: dialogSize.width,
                        height: dialogSize.height,
                        zIndex: 2000,
                        close: function () {
                            $("#btnCancelFreq" + _widgetId).off("click");
                            $("#btnSaveFreq" + _widgetId).off("click");
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
                    // Abrir el dialogo
                    $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");
                    // Boton cancelar
                    $("#btnCancelFreq" + _widgetId).click(function (event) {
                        event.preventDefault();
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                    });
                    // Boton aceptar
                    $("#btnSaveFreq" + _widgetId).click(function (event) {
                        event.preventDefault();
                        _fundamentalFrequency = parseFloat($("#fundamentalFreq").val());
                        if (_fundamentalFrequency <= 0) {
                            return;
                        }
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                        phaseIni = _getInitialPhase(clone(_xSubvariables.waveform), _xSubvariables.phase);
                        x = _customFilter(_xSubvariables.waveform.RawValue, _xSubvariables.waveform.SampleRate, measure, _xSubvariables.amplitude, phaseIni);
                        phaseIni = _getInitialPhase(clone(_ySubvariables.waveform), _ySubvariables.phase);
                        y = _customFilter(_ySubvariables.waveform.RawValue, _ySubvariables.waveform.SampleRate, measure, _ySubvariables.amplitude, phaseIni);
                        positions = _calculateAngularPositions(x);
                        _drawCharts(x, y, positions, sampleTime);
                        target[0].innerHTML = "Sin filtrar";
                        target.attr("data-value", "unfilteredOrbit" + _widgetId);
                    });
                }
            } else {
                positions = clone(_xSubvariables.waveform.KeyphasorPositions);
                _drawCharts(_xSubvariables.waveform.RawValue, _ySubvariables.waveform.RawValue, positions, sampleTime);
                target[0].innerHTML = "Filtrar órbita";
                target.attr("data-value", "filteredOrbit" + _widgetId);
                _fundamentalFrequency = (_angularSubvariable && _angularSubvariable.Value > 0) ? _fundamentalFrequency : 0;
            }
        };

        _showY2Axis = function () {
            $("#" + _contentXWaveform.id + " .dygraph-axis-label-y:not(.dygraph-axis-label-y2)").hide();
            $("#" + _contentXWaveform.id + " .dygraph-axis-label-y2").show();
            $("#" + _contentYWaveform.id + " .dygraph-axis-label-y:not(.dygraph-axis-label-y2)").hide();
            $("#" + _contentYWaveform.id + " .dygraph-axis-label-y2").show();
            DygraphOps.dispatchMouseMove(_orbitChart, 0, 0);
        };

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function (labels) {
            var
                txt;

            _setMargins();
            // Correlacion de las formas de onda en X e Y
            _orbitChart = new Dygraph(
                _contentOrbit,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: labels,
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        if (pts.length > 0 && pts[0] != null) {
                            txt = "Amplitud X: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " ";
                            txt += _xSubvariables.overall.Units + ", Amplitud Y: ";
                            txt += pts[0].xval.toFixed(2) + " " + _ySubvariables.overall.Units;
                            if (!isEmpty(_angularSubvariable) && _angularSubvariable.Value !== null) {
                                txt += ", " + _angularSubvariable.Value.toFixed(0) + " RPM";
                            }
                            $("#" + pts[0].name + _widgetId + " > span").html(txt);
                            row = pts[0].idx;
                            // Informacion de la forma de onda en X
                            pts = _xWaveformChart.file_[row];
                            if (pts && pts.length > 0 && pts[0] != null) {
                                txt = "Amplitud: " + pts[1].toFixed(2) + "&nbsp;" + _xSubvariables.overall.Units + ", ";
                                txt += "Tiempo: " + pts[0].toFixed(2) + " ms";
                                $("#waveformXLabel" + _widgetId + ">span:nth-child(2)").html(txt);
                            }
                            // Informacion de la forma de onda en Y
                            pts = _yWaveformChart.file_[row];
                            if (pts && pts.length > 0 && pts[0] != null) {
                                txt = "Amplitud: " + pts[1].toFixed(2) + "&nbsp;" + _ySubvariables.overall.Units + ", ";
                                txt += "Tiempo: " + pts[0].toFixed(2) + " ms";
                                $("#waveformYLabel" + _widgetId + ">span:nth-child(2)").html(txt);
                            }
                        }
                        _lastMousemoveEvt = e;
                        _mouseover = true;
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
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + ylabel
                        $("#" + _contentOrbit.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1025);
                        $("#" + _contentOrbit.id + " .dygraph-ylabel").eq(0).parent().parent().css("z-index", 1025);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _contentOrbit.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1025);
                        }
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        x: {
                            pixelsPerLabel: 30
                        },
                        y: {
                            pixelsPerLabel: 30,
                            axisLabelWidth: 40
                        }
                    },
                    series: {
                        "Amplitud": {
                            plotter: function (e) {
                                var
                                    alpha,
                                    beta,
                                    xColor,
                                    yColor;

                                alpha = clone(_measurementPoints.x.SensorAngle);
                                beta = clone(_measurementPoints.y.SensorAngle);
                                xColor = clone(_measurementPoints.x.Color);
                                yColor = clone(_measurementPoints.y.Color);
                                Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, _rotn);
                                Dygraph.Plugins.Plotter.prototype.drawSensorPositions(e, alpha, beta, _rotn, xColor, yColor);
                                Dygraph.Plugins.Plotter.prototype.drawOrbit(e, _laps, _fundamentalFrequency);
                            }
                        }
                    }
                }
            );
            // Forma de onda en X
            _xWaveformChart = new Dygraph(
                _contentXWaveform,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    y2label: "Amplitud [" + _xSubvariables.overall.Units + "]",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: ["X", "Y"],
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
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
                    drawCallback: function (g, is_initial) {
                        var
                            // DIVs contenedores de los labels en los ejes X e Y de la grafica
                            axisLabelDivs,
                            // Contador
                            i;

                        if (is_initial) {
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + y2label
                        $("#" + _contentXWaveform.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1025);
                        $("#" + _contentXWaveform.id + " .dygraph-y2label").eq(0).parent().parent().css("z-index", 1025);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _contentXWaveform.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1025);
                        }
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        x: {
                            drawAxis: false
                        },
                        y: {
                            drawAxis: true,
                            drawGrid: true,
                            independentTicks: false,
                            axisLabelWidth: 0
                        },
                        y2: {
                            drawAxis: true,
                            drawGrid: false,
                            independentTicks: true,
                            includeZero: true,
                            drawAxesAtZero: true,
                            pixelsPerLabel: 30,
                            axisLabelWidth: 40
                        }
                    },
                    series: {
                        "Y": { axis: "y2" }
                    },
                    zoomCallback: function (minDate, maxDate, yRange) {
                        _showY2Axis();
                    }
                }
            );
            // Forma de onda en Y
            _yWaveformChart = new Dygraph(
                _contentYWaveform,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Tiempo [ms]",
                    y2label: "Amplitud [" + _xSubvariables.overall.Units + "]",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: ["X", "Y"],
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
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
                    drawCallback: function (g, is_initial) {
                        var
                            // DIVs contenedores de los labels en los ejes X e Y de la grafica
                            axisLabelDivs,
                            // Contador
                            i;

                        if (is_initial) {
                            g.canvas_.style.zIndex = 1000;
                        }
                        // xlabel + y2label
                        $("#" + _contentYWaveform.id + " .dygraph-xlabel").eq(0).parent().css("z-index", 1025);
                        $("#" + _contentYWaveform.id + " .dygraph-y2label").eq(0).parent().parent().css("z-index", 1025);
                        // Recorrer todos los axis-labels
                        axisLabelDivs = $("#" + _contentYWaveform.id + " .dygraph-axis-label");
                        for (i = 0; i < axisLabelDivs.length; i += 1) {
                            axisLabelDivs.eq(i).parent().css("z-index", 1025);
                        }
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        y: {
                            drawAxis: true,
                            drawGrid: true,
                            independentTicks: false,
                            axisLabelWidth: 0
                        },
                        y2: {
                            drawAxis: true,
                            drawGrid: false,
                            independentTicks: true,
                            includeZero: true,
                            drawAxesAtZero: true,
                            pixelsPerLabel: 30,
                            axisLabelWidth: 40
                        }
                    },
                    series: {
                        "Y": { axis: "y2" }
                    },
                    zoomCallback: function (minDate, maxDate, yRange) {
                        _showY2Axis();
                    }
                }
            );
            Dygraph.synchronize([_xWaveformChart, _yWaveformChart], {
                zoom: true,
                selection: false,
                range: false
            });
            _showY2Axis();
            _yWaveformChart.ready(function () {
                document.body.addEventListener("keydown", _keyDownEventHandler);
            });
            $(".grid-stack-item").on("resizestop", function () {
                setTimeout(function () {
                    _setMargins();
                    _orbitChart.resize();
                    _xWaveformChart.resize();
                    _yWaveformChart.resize();
                    _showY2Axis();
                }, 100);
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
        _updateSelection = function (chartArray, type, selectedKey, e) {
            var
                i, j,
                ctx,
                maxCircleSize,
                labels,
                currentRatio,
                canvasx,
                point,
                colorSerie,
                circleSize,
                callback;

            for (i = 0; i < chartArray.length; i += 1) {
                chartArray[i].cascadeEvents_("select", {
                    selectedRow: chartArray[i].lastRow_,
                    selectedX: chartArray[i].lastx_,
                    selectedPoints: chartArray[i].selPoints_
                });

                // Contexto de canvas
                ctx = chartArray[i].canvas_ctx_;
                if (chartArray[i].previousVerticalX_ >= 0) {
                    // Determinar el radio maximo del circulo resaltado
                    maxCircleSize = 0;
                    labels = chartArray[i].attr_("labels");
                    for (j = 1; j < labels.length; j += 1) {
                        currentRatio = chartArray[i].getNumericOption("highlightCircleSize", labels[j]);
                        if (currentRatio > maxCircleSize) {
                            maxCircleSize = currentRatio;
                        }
                    }
                    ctx.clearRect(0, 0, chartArray[i].width_, chartArray[i].height_);
                }

                if (chartArray[i].isUsingExcanvas_ && chartArray[i].currentZoomRectArgs_) {
                    Dygraph.prototype.drawZoomRect_.apply(chartArray[i], chartArray[i].currentZoomRectArgs_);
                }

                colorSerie = (chartArray[i] && chartArray[i].colors_ && chartArray[i].colors_.length > 0) ? chartArray[i].colors_[0] : "#006ACB";
                if (chartArray[i].selPoints_.length > 0 && chartArray[i].selPoints_[0]) {
                    // Dibuja circulos de colores sobre el centro de cada punto seleccionado
                    canvasx = chartArray[i].selPoints_[0].canvasx;
                    ctx.save();
                    for (j = 0; j < chartArray[i].selPoints_.length; j += 1) {
                        if (type == "keyboardEvent") {
                            if (selectedKey == 1) {
                                if (chartArray[i].layout_.points[0][chartArray[i].lastRow_ - 1]) {
                                    point = chartArray[i].layout_.points[0][chartArray[i].lastRow_ - 1];
                                    chartArray[i].lastRow_ = chartArray[i].lastRow_ - 1;
                                } else {
                                    point = chartArray[i].layout_.points[0][chartArray[i].lastRow_];
                                    chartArray[i].lastRow_ = chartArray[i].lastRow_;
                                }
                            } else if (selectedKey == 2) {
                                if (chartArray[i].layout_.points[0][chartArray[i].lastRow_ + 1]) {
                                    point = chartArray[i].layout_.points[0][chartArray[i].lastRow_ + 1];
                                    chartArray[i].lastRow_ = chartArray[i].lastRow_ + 1;
                                } else {
                                    point = chartArray[i].layout_.points[0][chartArray[i].lastRow_];
                                    chartArray[i].lastRow_ = chartArray[i].lastRow_;
                                }
                            }
                            if (point) {
                                chartArray[i].xval_ = point.xval;
                                chartArray[i].selPoints_[j] = point;
                                canvasx = point.canvasx;
                            }
                        } else if (type == "mouseEvent") {
                            point = chartArray[i].selPoints_[j];
                        }

                        if (point) {
                            if (!Dygraph.isOK(point.canvasy)) {
                                continue;
                            }
                            circleSize = chartArray[i].getNumericOption("highlightCircleSize", point.name);
                            callback = chartArray[i].getFunctionOption("drawHighlightPointCallback", point.name);
                            if (!callback) {
                                callback = Dygraph.Circles.DEFAULT;
                            }
                            ctx.lineWidth = chartArray[i].getNumericOption("strokeWidth", point.name);
                            ctx.strokeStyle = colorSerie;
                            ctx.fillStyle = colorSerie;
                            callback.call(chartArray[i], chartArray[i], point.name, ctx, point.canvasx, point.canvasy, colorSerie, circleSize, point.idx);
                        }
                        
                    }
                    ctx.restore();
                    chartArray[i].previousVerticalX_ = canvasx;
                }
            }
        };

        _getSelectedPoints = function (row, chartArray) {
            var
                i,
                setIdx,
                points,
                setRow,
                point,
                pointIdx;

            for (i = 0; i < chartArray.length; i += 1) {
                chartArray[i].lastRow_ = row;
                chartArray[i].selPoints_ = [];
                for (setIdx = 0; setIdx < chartArray[i].layout_.points.length; setIdx += 1) {
                    points = chartArray[i].layout_.points[setIdx];
                    setRow = row - chartArray[i].getLeftBoundary_(setIdx);
                    if (!points[setRow]) {
                        // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                        continue;
                    }
                    if (setRow < points.length && points[setRow].idx === row) {
                        point = points[setRow];
                        if (point.yval !== null && !Number.isNaN(point.yval)) {
                            chartArray[i].selPoints_.push(point);
                        }
                    } else {
                        for (pointIdx = 0; pointIdx < points.length; pointIdx += 1) {
                            point = points[pointIdx];
                            if (point.idx === row) {
                                if (point.yval !== null && !Number.isNaN(point.yval)) {
                                    chartArray[i].selPoints_.push(point);
                                }
                                break;
                            }
                        }
                    }
                }
                if (chartArray[i].selPoints_.length) {
                    chartArray[i].lastx_ = chartArray[i].selPoints_[0].xval;
                } else {
                    chartArray[i].lastx_ = -1;
                }
            }
        };

        /*
         * Modelo de interaccion personalizado con los diferentes eventos del grafico
         */
        _customInteractionModel = {
            mousedown: function (e, g, ctx) {
                // Evita que el clic derecho inicialice el zoom
                if (e.button && e.button === 2) {
                    return;
                }
                ctx.initializeMouseDown(e, g, ctx);
                if (e.altKey || e.shiftKey || e.ctrlKey) {
                    Dygraph.startPan(e, g, ctx);
                } else {
                    Dygraph.startZoom(e, g, ctx);
                }
            },
            mousemove: function (e, g, ctx) {
                if (ctx.isZooming) {
                    Dygraph.moveZoom(e, g, ctx);
                } else if (ctx.isPanning) {
                    Dygraph.movePan(e, g, ctx);
                } else {
                    var
                        closestPoint,
                        selectionChanged,
                        chartArray,
                        callback;

                    closestPoint = _findClosestPoint(g.eventToDomCoords(e)[0], g.eventToDomCoords(e)[1], g.layout_);
                    selectionChanged = (closestPoint.row !== g.lastRow_);
                    chartArray = [_orbitChart, _xWaveformChart, _yWaveformChart];
                    _getSelectedPoints(closestPoint.row, chartArray);
                    if (selectionChanged) {
                        _updateSelection(chartArray, "mouseEvent");
                    }
                    callback = _orbitChart.getFunctionOption("highlightCallback");
                    if (callback && selectionChanged) {
                        callback.call(_orbitChart, e, _orbitChart.lastx_, _orbitChart.selPoints_, _orbitChart.row);
                    }
                }
            },
            mouseup: function (e, g, ctx) {
                if (ctx.isZooming) {
                    Dygraph.endZoom(e, g, ctx);
                } else if (ctx.isPanning) {
                    Dygraph.endPan(e, g, ctx);
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                return false;
            },
            click: function (e, g, ctx) {
                var
                    closestPoint,
                    chartArray;

                e.preventDefault();
                closestPoint = _findClosestPoint(g.eventToDomCoords(e)[0], g.eventToDomCoords(e)[1], g.layout_);
                _orbitChart.selectedRow_ = closestPoint.row;
                chartArray = [_orbitChart, _xWaveformChart, _yWaveformChart];
                _getSelectedPoints(closestPoint.row, chartArray);
                _updateSelection(chartArray, "mouseEvent");
                return false;
            },
            dblclick: function (e, g, ctx) {
                if (ctx.cancelNextDblclick) {
                    ctx.cancelNextDblclick = false;
                    return;
                }
                if (e.altKey || e.shiftKey || e.ctrlKey) {
                    return;
                }
                switch ($(g.canvas_).parent().parent()[0].id) {
                    case _contentOrbit.id:
                        g.updateOptions({
                            "dateWindow": _graphRange.orbit.X,
                            "valueRange": _graphRange.orbit.Y
                        });
                        break;
                    case _contentXWaveform.id:
                    case _contentYWaveform.id:
                        g.updateOptions({
                            "dateWindow": _graphRange.waveform.X,
                            "axes": { y2: { "valueRange": _graphRange.waveform.Y } }
                        });
                        break;
                }
            }
        };

        /*
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (timeStamp, subVariableIdList) {
            var
                mdVariableIdList,
                i,
                waveformX,
                waveformY,
                idList;

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
                        if (!waveformX.KeyphasorPositions || !waveformY.KeyphasorPositions) {
                            waveformX.KeyphasorPositions = [];
                            waveformY.KeyphasorPositions = [];
                            _xSubvariables.waveform.KeyphasorPositions = [];
                            _xSubvariables.waveform.KeyphasorPositionsOnTime = [];
                            _ySubvariables.waveform.KeyphasorPositions = [];
                            _ySubvariables.waveform.KeyphasorPositionsOnTime = [];
                        } else {
                            _xSubvariables.waveform.KeyphasorPositions = clone(waveformX.KeyphasorPositions);
                            _xSubvariables.waveform.KeyphasorPositionsOnTime = clone(waveformX.KeyphasorPositionsOnTime);
                            _ySubvariables.waveform.KeyphasorPositions = clone(waveformY.KeyphasorPositions);
                            _ySubvariables.waveform.KeyphasorPositionsOnTime = clone(waveformY.KeyphasorPositionsOnTime);
                        }

                        _xSubvariables.waveform.Value = clone(waveformX.Value);
                        _xSubvariables.waveform.RawValue = clone(waveformX.RawValue);
                        _xSubvariables.waveform.SampleRate = clone(waveformX.SampleRate);
                        _ySubvariables.waveform.Value = clone(waveformY.Value);
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

                        if (_angularSubvariable) {
                            if (data[_xSubvariables.phase.Id]) {
                                _xSubvariables.phase.Value = clone(data[_xSubvariables.phase.Id].Value);
                                _xSubvariables.phase.RawTimeStamp = clone(data[_xSubvariables.phase.Id].RawTimeStamp);
                                _xSubvariables.phase.TimeStamp = clone(data[_xSubvariables.phase.Id].TimeStamp);
                            }
                            if (data[_xSubvariables.amplitude.Id]) {
                                _xSubvariables.amplitude.Value = clone(data[_xSubvariables.amplitude.Id].Value);
                                _xSubvariables.amplitude.RawTimeStamp = clone(data[_xSubvariables.amplitude.Id].RawTimeStamp);
                                _xSubvariables.amplitude.TimeStamp = clone(data[_xSubvariables.amplitude.Id].TimeStamp);
                            }
                            if (data[_ySubvariables.phase.Id]) {
                                _ySubvariables.phase.Value = clone(data[_ySubvariables.phase.Id].Value);
                                _ySubvariables.phase.RawTimeStamp = clone(data[_ySubvariables.phase.Id].RawTimeStamp);
                                _ySubvariables.phase.TimeStamp = clone(data[_ySubvariables.phase.Id].TimeStamp);
                            }
                            if (data[_ySubvariables.amplitude.Id]) {
                                _ySubvariables.amplitude.Value = clone(data[_ySubvariables.amplitude.Id].Value);
                                _ySubvariables.amplitude.RawTimeStamp = clone(data[_ySubvariables.amplitude.Id].RawTimeStamp);
                                _ySubvariables.amplitude.TimeStamp = clone(data[_ySubvariables.amplitude.Id].TimeStamp);
                            }
                            if (data[_angularSubvariable.Id]) {
                                _angularSubvariable.Value = clone(data[_angularSubvariable.Id].Value);
                                _angularSubvariable.RawTimeStamp = clone(data[_angularSubvariable.Id].RawTimeStamp);
                                _angularSubvariable.TimeStamp = clone(data[_angularSubvariable.Id].TimeStamp);
                            }
                        }

                        _orbitChart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                        _orbitChart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
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
                        if (!isEmpty(waveformX) && !isEmpty(waveformY)) {
                            // Forma de onda en X
                            _xSubvariables.waveform.Value = clone(waveformX.Value);
                            _xSubvariables.waveform.RawValue = clone(waveformX.RawValue);
                            _xSubvariables.waveform.SampleRate = clone(waveformX.SampleRate);
                            _xSubvariables.waveform.KeyphasorPositions = clone(waveformX.KeyphasorPositions);
                            _xSubvariables.waveform.KeyphasorPositionsOnTime = clone(waveformX.KeyphasorPositionsOnTime);
                            // Forma de onda en Y
                            _ySubvariables.waveform.Value = clone(waveformY.Value);
                            _ySubvariables.waveform.RawValue = clone(waveformY.RawValue);
                            _ySubvariables.waveform.SampleRate = clone(waveformY.SampleRate);
                            _ySubvariables.waveform.KeyphasorPositions = clone(waveformY.KeyphasorPositions);
                            _ySubvariables.waveform.KeyphasorPositionsOnTime = clone(waveformY.KeyphasorPositionsOnTime);
                            // Listado de Ids a consultar
                            idList = [];
                            if (_xSubvariables.overall) {
                                idList.push(_xSubvariables.overall.Id);
                            }
                            if (_xSubvariables.phase) {
                                idList.push(_xSubvariables.phase.Id);
                            }
                            if (_xSubvariables.amplitude) {
                                idList.push(_xSubvariables.amplitude.Id);
                            }
                            if (_ySubvariables.overall) {
                                idList.push(_ySubvariables.overall.Id);
                            }
                            if (_ySubvariables.phase) {
                                idList.push(_ySubvariables.phase.Id);
                            }
                            if (_ySubvariables.amplitude) {
                                idList.push(_ySubvariables.amplitude.Id);
                            }
                            if (_angularSubvariable) {
                                idList.push(_angularSubvariable.Id);
                            }
                            _orbitChart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            _orbitChart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            if (idList.length > 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [parseInt(timeStamp)], _assetData.NodeId, function (resp) {
                                    for (i = 0; i < resp.length; i += 1) {
                                        if (_xSubvariables.overall && resp[i].subVariableId === _xSubvariables.overall.Id) {
                                            _xSubvariables.overall.Value = clone(resp[i].value);
                                        } else if (_xSubvariables.phase && resp[i].subVariableId === _xSubvariables.phase.Id) {
                                            _xSubvariables.phase.Value = clone(resp[i].value);
                                        } else if (_xSubvariables.amplitude && resp[i].subVariableId === _xSubvariables.amplitude.Id) {
                                            _xSubvariables.amplitude.Value = clone(resp[i].value);
                                        } else if (_ySubvariables.overall && resp[i].subVariableId === _ySubvariables.overall.Id) {
                                            _ySubvariables.overall.Value = clone(resp[i].value);
                                        } else if (_ySubvariables.phase && resp[i].subVariableId === _ySubvariables.phase.Id) {
                                            _ySubvariables.phase.Value = clone(resp[i].value);
                                        } else if (_ySubvariables.amplitude && resp[i].subVariableId === _ySubvariables.amplitude.Id) {
                                            _ySubvariables.amplitude.Value = clone(resp[i].value);
                                        } else if (_angularSubvariable && resp[i].subVariableId === _angularSubvariable.Id) {
                                            _angularSubvariable.Value = clone(resp[i].value);
                                        }
                                    }
                                    _refresh(waveformX, waveformY);
                                });
                            } else {
                                _refresh(waveformX, waveformY);
                            }
                        } else {
                            console.error("No se encontró datos de forma de onda");
                        }
                    });
                    mdVariableIdList = [_measurementPoints.x.Id, _measurementPoints.y.Id];
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData(mdVariableIdList, _assetData.NodeId, subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!isNaN(currentTimeStamp)) {
                            aidbManager.GetStreamBySubVariableIdAndTimeStampList(subVariableIdList, [currentTimeStamp], _assetData.NodeId, function (data) {
                                for (i = 0; i < data.length; i += 1) {
                                    if (data[i].subVariableId === _xSubvariables.waveform.Id) {
                                        waveformX.TimeStamp = formatDate(new Date(data[i].timeStamp));
                                        waveformX.SampleTime = clone(data[i].sampleTime);
                                        waveformX.RawValue = clone(data[i].value);
                                        waveformX.Value = GetXYDataOnTime(waveformX.RawValue, waveformX.SampleTime);
                                        waveformX.SampleRate = waveformX.RawValue.length / waveformX.SampleTime;
                                        waveformX.KeyphasorPositions = clone(data[i].referencePositions) || [];
                                        waveformX.KeyphasorPositionsOnTime = waveformX.KeyphasorPositions.length > 0 ?
                                            GetKeyphasorOnTime(data[i].referencePositions, data[i].sampleTime, data[i].value.length) : [];
                                    } else if (data[i].subVariableId === _ySubvariables.waveform.Id) {
                                        waveformY.TimeStamp = formatDate(new Date(data[i].timeStamp));
                                        waveformY.SampleTime = clone(data[i].sampleTime);
                                        waveformY.RawValue = clone(data[i].value);
                                        waveformY.Value = GetXYDataOnTime(waveformY.RawValue, waveformY.SampleTime);
                                        waveformY.SampleRate = waveformY.RawValue.length / waveformY.SampleTime;
                                        waveformY.KeyphasorPositions = clone(data[i].referencePositions) || [];
                                        waveformY.KeyphasorPositionsOnTime = waveformY.KeyphasorPositions.length > 0 ?
                                            GetKeyphasorOnTime(data[i].referencePositions, data[i].sampleTime, data[i].value.length) : [];
                                    }
                                }
                                if (!isEmpty(waveformX) && !isEmpty(waveformY)) {
                                    // Forma de onda en X
                                    _xSubvariables.waveform.Value = clone(waveformX.Value);
                                    _xSubvariables.waveform.RawValue = clone(waveformX.RawValue);
                                    _xSubvariables.waveform.SampleRate = clone(waveformX.SampleRate);
                                    _xSubvariables.waveform.KeyphasorPositions = clone(waveformX.KeyphasorPositions);
                                    _xSubvariables.waveform.KeyphasorPositionsOnTime = clone(waveformX.KeyphasorPositionsOnTime);
                                    // Forma de onda en Y
                                    _ySubvariables.waveform.Value = clone(waveformY.Value);
                                    _ySubvariables.waveform.RawValue = clone(waveformY.RawValue);
                                    _ySubvariables.waveform.SampleRate = clone(waveformY.SampleRate);
                                    _ySubvariables.waveform.KeyphasorPositions = clone(waveformY.KeyphasorPositions);
                                    _ySubvariables.waveform.KeyphasorPositionsOnTime = clone(waveformY.KeyphasorPositionsOnTime);
                                    // Listado de Ids a consultar
                                    idList = [];
                                    if (_xSubvariables.overall) {
                                        idList.push(_xSubvariables.overall.Id);
                                    }
                                    if (_xSubvariables.phase) {
                                        idList.push(_xSubvariables.phase.Id);
                                    }
                                    if (_xSubvariables.amplitude) {
                                        idList.push(_xSubvariables.amplitude.Id);
                                    }
                                    if (_ySubvariables.overall) {
                                        idList.push(_ySubvariables.overall.Id);
                                    }
                                    if (_ySubvariables.phase) {
                                        idList.push(_ySubvariables.phase.Id);
                                    }
                                    if (_ySubvariables.amplitude) {
                                        idList.push(_ySubvariables.amplitude.Id);
                                    }
                                    if (_angularSubvariable) {
                                        idList.push(_angularSubvariable.Id);
                                    }
                                    _orbitChart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                                    _orbitChart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
                                    if (idList.length > 0) {
                                        aidbManager.GetNumericBySubVariableIdAndTimeStampList(idList, [currentTimeStamp], _assetData.NodeId, function (resp) {
                                            for (i = 0; i < resp.length; i += 1) {
                                                if (_xSubvariables.overall && resp[i].subVariableId === _xSubvariables.overall.Id) {
                                                    _xSubvariables.overall.Value = clone(resp[i].value);
                                                } else if (_xSubvariables.phase && resp[i].subVariableId === _xSubvariables.phase.Id) {
                                                    _xSubvariables.phase.Value = clone(resp[i].value);
                                                } else if (_xSubvariables.amplitude && resp[i].subVariableId === _xSubvariables.amplitude.Id) {
                                                    _xSubvariables.amplitude.Value = clone(resp[i].value);
                                                } else if (_ySubvariables.overall && resp[i].subVariableId === _ySubvariables.overall.Id) {
                                                    _ySubvariables.overall.Value = clone(resp[i].value);
                                                } else if (_ySubvariables.phase && resp[i].subVariableId === _ySubvariables.phase.Id) {
                                                    _ySubvariables.phase.Value = clone(resp[i].value);
                                                } else if (_ySubvariables.amplitude && resp[i].subVariableId === _ySubvariables.amplitude.Id) {
                                                    _ySubvariables.amplitude.Value = clone(resp[i].value);
                                                } else if (_angularSubvariable && resp[i].subVariableId === _angularSubvariable.Id) {
                                                    _angularSubvariable.Value = clone(resp[i].value);
                                                }
                                            }
                                            _refresh(waveformX, waveformY);
                                        });
                                    } else {
                                        _refresh(waveformX, waveformY);
                                    }
                                } else {
                                    console.error("No se encontró datos de forma de onda");
                                }
                            });
                        }
                    });
                    break;
            }
        };

        _drawCharts = function (x, y, positions, sampleTime) {
            var
                // Conjunto de datos XY a graficar
                xyData,
                // Anotaciones de la grafica de forma de onda
                annotations,
                // Contador
                i;

            // Validamos si existe informacion del filtro dinamico y no esta activo el filtro 1x
            if (!_filtered1x && enableFilter) {
                x = GetFilterSignal(x, stopFrequency);
                y = GetFilterSignal(y, stopFrequency);
            }
            // Informacion de orbita
            xyData = _getOrbitData(x, y, sampleTime, positions);
            _getRangeGraph(xyData);
            _orbitChart.updateOptions({
                "file": xyData.orbit,
                "dateWindow": _graphRange.orbit.X,
                "valueRange": _graphRange.orbit.Y
            });
            // Informacion de forma de onda Y
            _yWaveformChart.updateOptions({
                "file": xyData.yWaveform,
                "dateWindow": _graphRange.waveform.X,
                "axes": { y2: { "valueRange": _graphRange.waveform.Y } }
            });
            // Informacion de forma de onda X
            _xWaveformChart.updateOptions({
                "file": xyData.xWaveform,
                "dateWindow": _graphRange.waveform.X,
                "axes": { y2: { "valueRange": _graphRange.waveform.Y } }
            });
            if (_filtered1x) {
                positions = GetKeyphasorOnTime(positions, sampleTime, x.length);
            } else {
                positions = clone(_xSubvariables.waveform.KeyphasorPositionsOnTime);
            }
            annotations = [];
            if (positions) {
                if (positions.length > 2) {
                    for (i = 0; i < positions.length; i += 1) {
                        annotations.push({
                            series: "Y",
                            x: positions[i],
                            text: positions[i].toString(),
                            width: 10,
                            height: 10,
                            cssClass: "keyphasor-annotation"
                        });
                    }
                }
            }
            _xWaveformChart.setAnnotations(annotations);
            _yWaveformChart.setAnnotations(annotations);
        };

        /*
         * Actualiza los valores a graficar
         */
        _refresh = function (xWaveform, yWaveform) {
            if (timeMode === 1 || (timeMode === 0 && !_pause)) {
                if (_currentTimeStamp !== xWaveform.TimeStamp && xWaveform.TimeStamp === yWaveform.TimeStamp) {
                    var
                        // Texto que indentifica los puntos en la grafica
                        txt,
                        // Valores de la forma de onda en X
                        xValue,
                        // Valores de la forma de onda en Y
                        yValue,
                        // Posiciones de la marca de paso
                        positions,
                        // Tiempo total de graficacion
                        sampleTime,
                        // Fase inicial de la forma de onda
                        phaseIni,
                        // Tipo de medida global
                        measureType;

                    _currentTimeStamp = xWaveform.TimeStamp;
                    if (_angularSubvariable) {
                        _fundamentalFrequency = _angularSubvariable.Value / 60;
                    }
                    _xSubvariables.overall.Value = _xSubvariables.overall.Value || 0;
                    txt = "<b style=\"color:" + _measurementPoints.x.Color + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
                    txt += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;";
                    if (_filtered1x) {
                        txt += "(" + _xSubvariables.amplitude.Value.toFixed(2) + "&ang;" + _xSubvariables.phase.Value.toFixed(2) + "&deg;), &nbsp;";
                    }
                    txt += _currentTimeStamp;
                    $("#point" + _measurementPoints.x.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
                    txt = "<b style=\"color:" + _measurementPoints.y.Color + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
                    _ySubvariables.overall.Value = _ySubvariables.overall.Value || 0;
                    txt += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;"
                    if (_filtered1x) {
                        txt += "(" + _ySubvariables.amplitude.Value.toFixed(2) + "&ang;" + _ySubvariables.phase.Value.toFixed(2) + "&deg;), &nbsp;";
                    }
                    txt += _currentTimeStamp;
                    $("#point" + _measurementPoints.y.Name.replace(/\s|\W|[#$%^&*()]/g, "") + _widgetId + " > span").html(txt);
                    txt = "<b style=\"color:" + _measurementPoints.x.Color + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;";
                    $("#waveformXLabel" + _widgetId + ">span").html(txt);
                    txt = "<b style=\"color:" + _measurementPoints.y.Color + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;";
                    $("#waveformYLabel" + _widgetId + ">span").html(txt);
                    xValue = clone(xWaveform.RawValue);
                    yValue = clone(yWaveform.RawValue);
                    phaseIni = 0;
                    if (_filtered1x) {
                        if (_angularSubvariable && _angularSubvariable.Value > 0) {
                            phaseIni = _getInitialPhase(clone(xWaveform), _xSubvariables.phase);
                        }
                        measureType = clone(_xSubvariables.overall.MeasureType);
                        xValue = _customFilter(xValue, _xSubvariables.waveform.SampleRate, measureType, _xSubvariables.amplitude, phaseIni);
                        if (_angularSubvariable && _angularSubvariable.Value > 0) {
                            phaseIni = _getInitialPhase(clone(yWaveform), _ySubvariables.phase);
                        }
                        measureType = clone(_ySubvariables.overall.MeasureType);
                        yValue = _customFilter(yValue, _ySubvariables.waveform.SampleRate, measureType, _ySubvariables.amplitude, phaseIni);
                    }
                    positions = _calculateAngularPositions(xValue);
                    sampleTime = (xValue.length / xWaveform.SampleRate);
                    _drawCharts(xValue, yValue, positions, sampleTime);
                    _showY2Axis();
                    if (_mouseover) {
                        _orbitChart.mouseMove_(_lastMousemoveEvt);
                        _xWaveformChart.mouseMove_(_lastMousemoveEvt);
                        _yWaveformChart.mouseMove_(_lastMousemoveEvt);
                    } else {
                        DygraphOps.dispatchMouseMove(_orbitChart, 0, 0);
                        DygraphOps.dispatchMouseMove(_xWaveformChart, 0, 0);
                        DygraphOps.dispatchMouseMove(_yWaveformChart, 0, 0);
                    }
                }
            }
        };

        _customFilter = function (waveformValue, sampleRate, measureType, amp1x, phaIni) {
            var
                i, N,
                omega,
                resp,
                periodCount,
                sampleTime,
                samplesToUse,
                amp, pha,
                sumX, sumY;

            N = waveformValue.length;
            resp = clone(waveformValue);
            if (amp1x && phaIni > 0) {
                amp1x = amp1x.Value;
                pha = ((phaIni > 180) ? phaIni - 360 : phaIni) * Math.PI / 180;
                for (i = 0; i < N; i += 1) {
                    resp[i] = (amp1x / 2) * Math.cos(Math.PI * 2 * _fundamentalFrequency * (i / sampleRate) + pha);
                }
            } else if (_fundamentalFrequency && _fundamentalFrequency > 0) {
                sampleTime = (N / sampleRate);
                periodCount = Math.floor(sampleTime * _fundamentalFrequency);
                samplesToUse = Math.round((periodCount * N) / (_fundamentalFrequency * sampleTime));
                omega = 2.0 * Math.PI / samplesToUse;
                sumX = 0;
                sumY = 0;

                for (i = 0; i < samplesToUse; i += 1) {
                    sumX += resp[i] * Math.cos(omega * i * periodCount);
                    sumY += resp[i] * (-1) * Math.sin(omega * i * periodCount);
                }
                pha = -Math.atan2(-sumY, sumX);// * 180 / Math.PI;
                //pha = 360 - ((pha < 0) ? pha + 360 : pha) % 360;
                //pha = ((pha > 180) ? pha - 360 : pha) * Math.PI / 180;
                amp = 4 * Math.sqrt(sumX * sumX + sumY * sumY) / N;
                for (i = 0; i < N; i += 1) {
                    resp[i] = (amp / 2) * Math.cos(Math.PI * 2 * _fundamentalFrequency * (i / sampleRate) + pha);
                }
            }
            return resp;
        };

        _getOrbitData = function (u, v, sampleTime, positions) {
            var
                // Datos de la orbita y formas de ondas
                xyData,
                // Angulo en radianes del sensor en X
                phiX,
                // Angulo en radianes del sensor en Y
                phiY,
                // Espaciamiento en el eje temporal (para las formas de onda)
                step,
                // Contadores
                i, j,
                // Punto de inicio y fin de la grafica
                start, end,
                // Valores de la transformacion de cordenadas
                x, y;

            xyData = {
                orbit: [],
                xWaveform: [],
                yWaveform: []
            };
            _laps = (positions.length > _laps) ? _laps : positions.length;
            _laps = (positions.length <= 2) ? 1 : _laps;
            if (_rotn === "CW") {
                phiX = _orbitChart.phiX_;
                phiY = _orbitChart.phiY_;
            } else {
                phiX = -_orbitChart.phiX_;
                phiY = -_orbitChart.phiY_;
            }
            step = sampleTime * 1000 / u.length;
            for (i = 0; i < _laps; i += 1) {
                end = (positions.length > 1) ? positions[i + 1] : u.length;
                //end = (_filtered1x) ? Math.round(end * 0.96) : end;
                start = (positions.length > 1) ? positions[i] : 0;
                for (j = start; j < end; j += 1) {
                    x = -u[j] * Math.sin(phiX) - v[j] * Math.sin(phiY);
                    y = u[j] * Math.cos(phiX) + v[j] * Math.cos(phiY);
                    xyData.orbit.push([x, y]);
                    xyData.xWaveform.push([RoundToPlaces((step * j), 6), u[j]]);
                    xyData.yWaveform.push([RoundToPlaces((step * j), 6), v[j]]);
                }
                xyData.orbit.push([null, null]);
                xyData.xWaveform.push([null, null]);
                xyData.yWaveform.push([null, null]);
            }
            return xyData;
        };

        _getRangeGraph = function (xyData) {
            var
                // Valores maximo y minimo de los puntos graficados en X
                xMax, xMin,
                // Valores maximo y minimo de los puntos graficados en Y
                yMax, yMin,
                // Valor maximo entre los ejes X e Y
                largest,
                // Valores delta complementarios para centrar la grafica
                deltaX, deltaY;

            // Calculo para valores maximos y minimos de la orbita
            xMax = arrayColumn(xyData.orbit, 0).max();
            xMin = arrayColumn(xyData.orbit, 0).min();
            yMax = arrayColumn(xyData.orbit, 1).max();
            yMin = arrayColumn(xyData.orbit, 1).min();
            largest = [(xMax - xMin), (yMax - yMin)].max();
            largest = (largest === 0) ? 5 : largest;
            deltaX = (2 * largest - (xMax - xMin)) / 2;
            deltaY = (2 * largest - (yMax - yMin)) / 2;
            xMin -= deltaX;
            xMax += deltaX;
            yMin -= deltaY;
            yMax += deltaY;
            _graphRange.orbit = {
                X: [xMin, xMax],
                Y: [yMin, yMax]
            };
            // Calculo para valores maximos y minimos de las formas de onda
            xMax = (xyData.xWaveform[xyData.xWaveform.length - 1][0] !== null) ?
                xyData.xWaveform[xyData.xWaveform.length - 1][0] : xyData.xWaveform[xyData.xWaveform.length - 2][0];
            xMin = xyData.xWaveform[0][0];
            yMax = [arrayColumn(xyData.xWaveform, 1).max(), arrayColumn(xyData.yWaveform, 1).max()].max();
            yMin = [arrayColumn(xyData.xWaveform, 1).min(), arrayColumn(xyData.yWaveform, 1).min()].min();
            _graphRange.waveform = {
                X: [xMin, xMax],
                Y: [yMin * 1.1, yMax * 1.1]
            };
        };

        _getInitialPhase = function (waveformData, phase1x) {
            var
                total,
                initial;

            if (waveformData.KeyphasorPositions.length > 1) {
                initial = waveformData.KeyphasorPositions[0];
                total = waveformData.KeyphasorPositions[1] - initial;
                return 360 - ((initial * 360 / total) + phase1x.Value) % 360;
            } else {
                return 0;
            }
        };

        _calculateAngularPositions = function (xValue) {
            var
                // Valor inicial o existente de las posiciones de marca de paso
                xAngularPos,
                // Rango de datos o muestras donde se encuentra el pico maximo
                range,
                // Valor del primer maximo
                firstMax,
                // Espaciamiento entre puntos de marca de paso
                delta,
                // Posicion del primer maximo
                firstPosition,
                // Periodicidad en la que se desea ubicar las posiciones de marca de paso
                period,
                // Contador
                i;

            xAngularPos = clone(_xSubvariables.waveform.KeyphasorPositions);
            if (_filtered1x && xAngularPos.length > 1) {
                // Primero encontrar el primer pico maximo
                range = xValue.slice(0, xAngularPos[1]);
                firstMax = range.indexOf(range.max());
                // Cantidad de datos que representan un giro completo del eje
                delta = xAngularPos[1] - xAngularPos[0];
                firstPosition = (360 - _xSubvariables.phase.Value) * delta / 360 + firstMax;
                if (firstPosition - delta > 0) {
                    firstPosition -= delta;
                }
                period = (xAngularPos[xAngularPos.length - 1] - xAngularPos[0]) / (xAngularPos.length - 1);
                for (i = 0; i < xAngularPos.length; i += 1) {
                    xAngularPos[i] = Math.round(period * i + firstPosition);
                }
            }
            return xAngularPos;
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
                _orbitChart.resize();
                _xWaveformChart.resize();
                _yWaveformChart.resize();
                gridStack.batchUpdate();
                gridStack.resize(grid, w, h);
                gridStack.commit();
                setTimeout(function () {
                    _orbitChart.resize();
                    _xWaveformChart.resize();
                    _yWaveformChart.resize();
                }, 100);
            });
        };

        _keyDownEventHandler = function (e) {
            var
                ppalChart,
                chartArray,
                callback;

            if (_mouseover && _lastMousemoveEvt.isTrusted) {
                // Necesario para evitar la propagacion del evento keydown en otros graficos
                // (Principalmente ocurre con tiempo real).
                ppalChart = _orbitChart;
                chartArray = [ppalChart, _xWaveformChart, _yWaveformChart];

                if (e.keyCode == 37) {
                    _updateSelection(chartArray, "keyboardEvent", 1, e);
                    callback = ppalChart.getFunctionOption("highlightCallback");
                    callback.call(ppalChart, e, ppalChart.lastx_, ppalChart.selPoints_, ppalChart.row);
                } else if (e.keyCode == 39) {
                    _updateSelection(chartArray, "keyboardEvent", 2, e);
                    callback = ppalChart.getFunctionOption("highlightCallback");
                    callback.call(ppalChart, e, ppalChart.lastx_, ppalChart.selPoints_, ppalChart.row);
                }
            }
        };

        _subscribeToDynamicFilter = function () {
            _dynamicFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                var
                    x,
                    y,
                    phaseIni,
                    sampleTime,
                    positions;

                x = clone(_xSubvariables.waveform.RawValue);
                y = clone(_ySubvariables.waveform.RawValue);
                phaseIni = 0;
                if (_filtered1x) {
                    if (_angularSubvariable && _angularSubvariable.Value > 0) {
                        phaseIni = _getInitialPhase(clone(_xSubvariables.waveform), _xSubvariables.phase);
                    }
                    x = _customFilter(x, _xSubvariables.waveform.SampleRate, _xSubvariables.overall.MeasureType, _xSubvariables.amplitude, phaseIni);
                    if (_angularSubvariable && _angularSubvariable.Value > 0) {
                        phaseIni = _getInitialPhase(clone(_ySubvariables.waveform), _ySubvariables.phase);
                    }
                    y = _customFilter(y, _ySubvariables.waveform.SampleRate, _ySubvariables.overall.MeasureType, _ySubvariables.amplitude, phaseIni);
                }
                sampleTime = (_xSubvariables.waveform.Value.length / _xSubvariables.waveform.SampleRate);
                positions = _calculateAngularPositions(x);
                _drawCharts(x, y, positions, sampleTime);
            });
        };

        this.Show = function (measurementPointId, timeStamp, currentColor, pairedColor) {
            var
                // Punto de medicion de referencia en el par (x, y)
                measurementPoint,
                // Sensor de referencia angular
                angularReference,
                // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                subVariableIdList,
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                overallUnits,
                // Menu de opciones para la grafica
                settingsMenu,
                // Labels
                labels;

            switch (timeMode) {
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
                    console.log("Modo no soportado.");
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
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false))[0];
                if (!angularReference) {
                    popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    _rotn = "CW";
                } else {
                    _rotn = (angularReference.RotationDirection === 1) ? "CW" : "CCW";
                    _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(
                        new ej.Query().where("MeasureType", "equal", 9, false))[0]);
                }
                subVariableIdList = [];
                // SubVariable que corresponde al punto de referencia angular
                if (_angularSubvariable) {
                    subVariableIdList.push(_angularSubvariable.Id);
                }
                // Total subvariables para el punto de medicion en X
                subVariables = _measurementPoints.x.SubVariables;
                // SubVariable que contiene la forma de onda en X
                _xSubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_xSubvariables.waveform) {
                    subVariableIdList.push(_xSubvariables.waveform.Id);
                }
                // SubVariable que contiene el valor global del sensor en X
                _xSubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                if (_xSubvariables.overall) {
                    subVariableIdList.push(_xSubvariables.overall.Id);
                }
                //SubVariable que contiene el valor de fase del sensor en X
                _xSubvariables.phase = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 6, false))[0]);
                if (_xSubvariables.phase) {
                    subVariableIdList.push(_xSubvariables.phase.Id);
                }
                //SubVariable que contiene el valor de amplitud del sensor en X
                _xSubvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 4, false))[0]);
                if (_xSubvariables.amplitude) {
                    subVariableIdList.push(_xSubvariables.amplitude.Id);
                }
                // Total subvariables para el punto de medicion en Y
                subVariables = _measurementPoints.y.SubVariables;
                // Subvariable que contiene la forma de onda en Y
                _ySubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_ySubvariables.waveform) {
                    subVariableIdList.push(_ySubvariables.waveform.Id);
                }
                // SubVariable que contiene el valor global del sensor en Y
                _ySubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                if (_ySubvariables.overall) {
                    subVariableIdList.push(_ySubvariables.overall.Id);
                }
                //SubVariable que contiene el valor de fase del sensor en X
                _ySubvariables.phase = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 6, false))[0]);
                if (_ySubvariables.phase) {
                    subVariableIdList.push(_ySubvariables.phase.Id);
                }
                //SubVariable que contiene el valor de amplitud del sensor en X
                _ySubvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 4, false))[0]);
                if (_ySubvariables.amplitude) {
                    subVariableIdList.push(_ySubvariables.amplitude.Id);
                }
                // VALIDAR QUE LAS UNIDADES DE AMBOS PUNTOS SEAN IGUALES
                if (_xSubvariables.overall.Units !== _ySubvariables.overall.Units) {
                    popUp("info", "Unidades de las subvariable con valor global es diferente para el par de puntos de medición.");
                    return;
                }
                // CONCATENAMOS LAS UNIDADES CON EL TIPO DE MEDIDA (PICO-PICO, CERO-PICO Y RMS)
                overallUnits = "";
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
                _ySubvariables.overall.Units += overallUnits;
                // Agregamos los items al menu de opciones para la grafica
                settingsMenu = [];
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Número de vueltas", "setLaps" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtrar órbita", "filteredOrbit" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImage" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

                /*
                 * Creamos la referencia al AspectrogramWidget
                 */
                _aWidget = new AspectrogramWidget({
                    widgetId: _widgetId,
                    parentId: "awContainer",
                    content: _container,
                    title: "Órbita",
                    width: width,
                    height: height,
                    aspectRatio: aspectRatio,
                    graphType: _graphType,
                    timeMode: timeMode,
                    asdaqId: _assetData.AsdaqId,
                    atrId: _assetData.AtrId,
                    subVariableIdList: subVariableIdList,
                    asset: _assetData.Name,
                    seriesName: ["Amplitud"],
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
                    },
                    onMinimize: function () {
                        cancelFullscreen();
                    },
                    onMaximize: function () {
                        launchFullScreen(_container.id);
                    },
                    onMinimize: function () {
                        cancelFullscreen();
                    }
                });

                labels = ["Estampa de tiempo", "Amplitud"];
                // Abrir AspectrogramWidget
                _aWidget.open();
                // Se suscribe a la notificacion de llegada de nuevos datos
                _subscribeToNewData(timeStamp, subVariableIdList);
                // Se suscribe a la notificacion de aplicacion de filtro dinamico
                _subscribeToDynamicFilter();
                // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Construir y mostrar grafica
                _buildGraph(labels);
            } else {
                popUp("info", "El punto de medición no tiene asociado ningún par.");
            }
        };

        this.Close = function () {
            var
                el;

            // Remover el evento manejador de KeyDown
            document.body.removeEventListener("keydown", _keyDownEventHandler);
            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }
            if (_playerSubscription) {
                // Eliminar suscripcion de reproductor.
                _playerSubscription.remove();
            }
            if (_dynamicFilterSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar filtro dinamico
                _dynamicFilterSubscription.remove();
            }
            if (_resizeChartSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }
            if (_orbitChart) {
                _orbitChart.destroy();
            }
            if (_xWaveformChart) {
                _xWaveformChart.destroy();
            }
            if (_yWaveformChart) {
                _yWaveformChart.destroy();
            }
            el = $(_container).parents().eq(2);
            $(".grid-stack").data("gridstack").removeWidget(el);
            $(_container).remove();
        };
    };

    return OrbitGraph;
})();