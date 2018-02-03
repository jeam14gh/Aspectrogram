/*
 * orbitGraph.js
 * Gestiona todo lo relacionado a la grafica de orbitas.
 * @author Jorge Calderon
 */

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
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
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
            // Referencia a las subvariables del punto de medicion en X (forma de onda, directa)
            _xSubvariables,
            // Referencia a las subvariables del punto de medicion en Y (forma de onda, directa)
            _ySubvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Bandera que identifica si se esta mostrando la grafica filtrada 1x o sin filtro
            _filtered1x,
            // Gestiona el numero de vueltas a mostrar sobre el grafico de orbita
            _laps,
            // Frecuencia caracteristica/fundamental 1X
            _fundamentalFrequency,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection,
            // Metodo privado que calcula las margenes deseadas
            _setMargins,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData,
            // Metodo privado que aplica filtro a la frecuencia caracteristica 1X
            _applyFilter,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Referencia a la suscripcion para sincronizacion de los datos del reproductor
            _playerSubscription,
            // Metodo privado que se ejecuta para actualizar la informacion a graficar
            _refresh,
            // Metodo privado que gestiona el evento clic sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo privado que obtiene la informacion a graficar de la orbita
            _getOrbitData,
            // Metodo privado que oculta el eje de la grafica Y1 intercambiandolo por el Y2
            _showY2Axis,
            // Metodo privado que re-calcula las posiciones de referencia angular para orbita filtrada 1x
            _calculateAngularPositions,
            // Metodo privado que obtiene la fase inicial de una forma de onda
            _getInitialPhase,
            _drawCharts;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto
         */
        _pause = (timeMode == 0) ? false : true;
        _movableGrid = false;
        _filtered1x = false;
        _this = this;
        _graphType = "orbit";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _measurementPoints = {};
        _xSubvariables = {};
        _ySubvariables = {};
        _laps = 1;

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
        $(_contentBody).children().children().eq(1).append("<div style=\"height:4%\"></div>");
        $(_contentBody).children().children().eq(1).append(_contentXWaveform);
        $(_contentBody).children().children().eq(1).append("<div style=\"height:4%\"></div>");
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
                width,
                height,
                header;

            header = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - header) + "%";
            w = _contentBody.clientWidth / 2;
            h = _contentBody.clientHeight;
            _side = [w, h].min();
            mrg = ([w, h].max() - _side) / 2;
            width = (w == _side) ? (_side * 100) / w : ((_side + 40) * 100) / w;
            width = (width > 100) ? 100 : width;
            height = (h == _side) ? (_side * 100) / h : ((_side - 40) * 100) / h;
            $(_contentOrbit).css("width", width + "%");
            $(_contentOrbit).css("height", height + "%");
            if (w == _side) {
                $(_contentOrbit).css("margin-top", ((100 - height) / 2) + "%");
                $(_contentOrbit).css("margin-left", "0%");
            } else {
                $(_contentOrbit).css("margin-left", ((100 - width) / 2) + "%");
                $(_contentOrbit).css("margin-top", ((100 - ((_side * 100) / h)) / 2.2) + "%");
            }
        };

        /*
         * Callback de evento clic sobre algun item del menu de opciones
         * @param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (e) {
            e.preventDefault();
            var
                target,
                item,
                size,
                width,
                dialog,
                position,
                container;

            target = $(e.currentTarget);
            item = target.attr("data-value");
            switch (item) {
                case "setOrbitLaps":
                    width = $("#" + _container.id).width();
                    position = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    size = { width: 350, height: 150 };
                    dialog = { top: position.top + 10, left: (position.left + (width / 2) - (size.width / 2)) };
                    container = $("#graphConfigAreaDialog").clone();
                    container.css("display", "block");
                    container[0].id = _widgetId + "orbit";
                    $("#awContainer").append(container);
                    $("#" + container[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
                    $("#" + container[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"orbitLapsToShow\" " +
                      "style=\"font-size:12px;\">N&uacute;mero de vueltas</label></div>");
                    $("#" + container[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"number\" " +
                      "id=\"orbitLapsToShow\" name=\"orbitLapsToShow\" style=\"width:100%;\"></div>");
                    $("#" + container[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
                    $("#" + container[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div style=\"text-align: center;\"></div>");
                    $("#" + container[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnSaveLaps" +
                      _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                    $("#btnSaveLaps" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
                    $("#" + container[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnCancelLaps" +
                      _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                    $("#btnCancelLaps" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
                    $("#orbitLapsToShow").val(_laps);
                    $("#" + container[0].id + " > div.graphConfigArea").ejDialog({
                        enableResize: false,
                        width: size.width,
                        height: size.height,
                        zIndex: 2000,
                        close: function () {
                            $("#btnCancelLaps" + _widgetId).off("click");
                            $("#btnSaveLaps" + _widgetId).off("click");
                            $("#" + container[0].id).remove();
                        },
                        content: "#" + container[0].id,
                        tooltip: {
                            close: "Cerrar"
                        },
                        actionButtons: ["close"],
                        position: {
                            X: position.left,
                            Y: position.top
                        }
                    });

                    $("#btnCancelLaps" + _widgetId).click(function (event) {
                        event.preventDefault();
                        $("#" + container[0].id + " div.graphConfigArea").ejDialog("close");
                    });

                    $("#btnSaveLaps" + _widgetId).click(function (event) {
                        event.preventDefault();
                        _laps = parseFloat($("#orbitLapsToShow").val());
                        if (_laps < 1) {
                            return;
                        }
                        $("#" + container[0].id + " div.graphConfigArea").ejDialog("close");
                        switch (timeMode) {
                            case 1:
                                var
                                    x, y,
                                    sampleTime,
                                    waveformX,
                                    waveformY,
                                    positions,
                                    xAngularPos,
                                    yAngularPos,
                                    data;

                                x = clone(_xSubvariables.waveform.RawValue);
                                y = clone(_ySubvariables.waveform.RawValue);
                                if (_filtered1x) {
                                    sampleTime = (_xSubvariables.waveform.Value.length / _xSubvariables.waveform.SampleRate);
                                    waveformX = _applyFilter(x, _xSubvariables.waveform.SampleRate, _xSubvariables.overall.MeasureType);
                                    waveformY = _applyFilter(y, _ySubvariables.waveform.SampleRate, _ySubvariables.overall.MeasureType);
                                    positions = _calculateAngularPositions(
                                        clone(_xSubvariables.waveform.KeyphasorPositions), waveformX,
                                        clone(_ySubvariables.waveform.KeyphasorPositions), waveformY);
                                    xAngularPos = positions[0];
                                    yAngularPos = positions[1];
                                    data = _getOrbitData(waveformX, waveformY, _orbitChart.phiX_, _orbitChart.phiY_, xAngularPos, yAngularPos, _laps);
                                } else {
                                    positions = _calculateAngularPositions(
                                        clone(_xSubvariables.waveform.KeyphasorPositions), x,
                                        clone(_ySubvariables.waveform.KeyphasorPositions), y);
                                    xAngularPos = positions[0];
                                    yAngularPos = positions[1];
                                    data = _getOrbitData(x, y, _orbitChart.phiX_, _orbitChart.phiY_, xAngularPos, yAngularPos, _laps);
                                }
                                _graphRange.X = data.rangeX;
                                _graphRange.Y = data.rangeY;
                                _orbitChart.updateOptions({
                                    "file": data.value,
                                    "dateWindow": [_graphRange.X[0], _graphRange.X[1]],
                                    "valueRange": [_graphRange.Y[0], _graphRange.Y[1]]
                                });
                                break;
                            default:
                                break;
                        }
                    });
                    break;
                case "filteredOrbit" + _widgetId:
                    var
                        x, y,
                        phaseIni,
                        positions,
                        measure,
                        xAngularPos,
                        yAngularPos,
                        sampleTime;

                    _filtered1x = true;
                    sampleTime = (_xSubvariables.waveform.Value.length / _xSubvariables.waveform.SampleRate);
                    measure = _xSubvariables.overall.MeasureType;
                    if (_angularSubvariable && _fundamentalFrequency > 0) {
                        phaseIni = _getInitialPhase(clone(_xSubvariables.waveform), _xSubvariables.phase);
                        x = _applyFilter(_xSubvariables.waveform.RawValue, _xSubvariables.waveform.SampleRate, measure, _xSubvariables.amplitude, phaseIni);
                        phaseIni = _getInitialPhase(clone(_ySubvariables.waveform), _ySubvariables.phase);
                        y = _applyFilter(_ySubvariables.waveform.RawValue, _ySubvariables.waveform.SampleRate, measure, _ySubvariables.amplitude, phaseIni);
                        positions = _calculateAngularPositions(
                            clone(_xSubvariables.waveform.KeyphasorPositions), x, _xSubvariables.phase,
                            clone(_ySubvariables.waveform.KeyphasorPositions), y, _ySubvariables.phase);
                        xAngularPos = positions[0];
                        yAngularPos = positions[1];
                        _drawCharts(x, y, xAngularPos, yAngularPos, sampleTime);
                        target[0].innerHTML = "Sin filtrar";
                        target.attr("data-value", "unfilteredOrbit" + _widgetId);
                    } else {
                        width = $("#" + _container.id).width();
                        position = $("#" + _container.id).parents(".grid-stack-item").first().position();
                        size = { width: 350, height: 150 };
                        dialog = { top: position.top + 10, left: (position.left + (width / 2) - (size.width / 2)) };
                        container = $("#graphConfigAreaDialog").clone();
                        container.css("display", "block");
                        container[0].id = _widgetId + "orbit";
                        $("#awContainer").append(container);
                        $("#" + container[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
                        $("#" + container[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"fundamentalFreq\" " +
                          "style=\"font-size:12px;\">Frecuencia fundamental</label></div>");
                        $("#" + container[0].id + " > div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><input type=\"number\" " +
                          "id=\"fundamentalFreq\" name=\"fundamentalFreq\" style=\"width:100%;\"></div>");
                        $("#" + container[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
                        $("#" + container[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div style=\"text-align: center;\"></div>");
                        $("#" + container[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnSaveFreq" +
                          _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                        $("#btnSaveFreq" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
                        $("#" + container[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div > div:nth-child(1)").append("\n<a id=\"btnCancelFreq" +
                          _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
                        $("#btnCancelFreq" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
                        $("#fundamentalFreq").val(_fundamentalFrequency ? _fundamentalFrequency : 0);
                        $("#" + container[0].id + " > div.graphConfigArea").ejDialog({
                            enableResize: false,
                            width: size.width,
                            height: size.height,
                            zIndex: 2000,
                            close: function () {
                                $("#btnCancelFreq" + _widgetId).off("click");
                                $("#btnSaveFreq" + _widgetId).off("click");
                                $("#" + container[0].id).remove();
                            },
                            content: "#" + container[0].id,
                            tooltip: {
                                close: "Cerrar"
                            },
                            actionButtons: ["close"],
                            position: {
                                X: position.left,
                                Y: position.top
                            }
                        });
                        $("#btnCancelFreq" + _widgetId).click(function (event) {
                            event.preventDefault();
                            $("#" + container[0].id + " div.graphConfigArea").ejDialog("close");
                        });

                        $("#btnSaveFreq" + _widgetId).click(function (event) {
                            event.preventDefault();
                            _fundamentalFrequency = parseFloat($("#fundamentalFreq").val());
                            if (_fundamentalFrequency <= 0) {
                                return;
                            }
                            $("#" + container[0].id + " div.graphConfigArea").ejDialog("close");
                            phaseIni = _getInitialPhase(clone(_xSubvariables.waveform), _xSubvariables.phase);
                            x = _applyFilter(_xSubvariables.waveform.RawValue, _xSubvariables.waveform.SampleRate, measure, _xSubvariables.amplitude, phaseIni);
                            phaseIni = _getInitialPhase(clone(_ySubvariables.waveform), _ySubvariables.phase);
                            y = _applyFilter(_ySubvariables.waveform.RawValue, _ySubvariables.waveform.SampleRate, measure, _ySubvariables.amplitude, phaseIni);
                            positions = _calculateAngularPositions(
                                clone(_xSubvariables.waveform.KeyphasorPositions), x, _xSubvariables.phase,
                                clone(_ySubvariables.waveform.KeyphasorPositions), y, _ySubvariables.phase);
                            xAngularPos = positions[0];
                            yAngularPos = positions[1];
                            _drawCharts(x, y, xAngularPos, yAngularPos, sampleTime);
                            target[0].innerHTML = "Sin filtrar";
                            target.attr("data-value", "unfilteredOrbit" + _widgetId);
                        });
                    }
                    break;
                case "unfilteredOrbit" + _widgetId:
                    var
                        xAngularPos,
                        yAngularPos;

                    _filtered1x = false;
                    xAngularPos = clone(_xSubvariables.waveform.KeyphasorPositions);
                    yAngularPos = clone(_ySubvariables.waveform.KeyphasorPositions);
                    _drawCharts(_xSubvariables.waveform.RawValue, _ySubvariables.waveform.RawValue, xAngularPos, yAngularPos, sampleTime);
                    target[0].innerHTML = "Filtrar órbita";
                    target.attr("data-value", "filteredOrbit" + _widgetId);
                    break;
                case "saveImageOrbit" + _widgetId:
                    imgExport = new ImageExport(_orbitChart, _graphType);
                    imgExport.asPNG();
                    break;
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
        _buildGraph = function (labels, rotn) {
            var
                txt;

            _setMargins();
            _orbitChart = new Dygraph(
                _contentOrbit,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    labels: labels,
                    axisLabelFontSize: 10,
                    labelsDivWidth: 0,
                    hideOverlayOnMouseOut: false,
                    axes: {
                        x: {
                            pixelsPerLabel: 30,
                        },
                        y: {
                            pixelsPerLabel: 30,
                            axisLabelWidth: 40
                        }
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        if (pts.length > 0) {
                            txt = "Amplitud X: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " " + _xSubvariables.overall.Units;
                            txt += ", Amplitud Y: " + pts[0].xval.toFixed(2) + " " + _ySubvariables.overall.Units;
                            txt += (isEmpty(_angularSubvariable) || _angularSubvariable.Value === null) ? "" : ", " + _angularSubvariable.Value.toFixed(0) + " RPM";
                            $("#" + pts[0].name + _widgetId + " > span").html(txt);
                        }
                    },
                    series: {
                        "Amplitud": {
                            plotter: function (e) {
                                var
                                    alpha,
                                    beta;

                                alpha = clone(_measurementPoints.x.SensorAngle);
                                beta = clone(_measurementPoints.y.SensorAngle);
                                Dygraph.Plugins.Plotter.prototype.drawRotationDirection(e, _side, rotn);
                                Dygraph.Plugins.Plotter.prototype.drawSensorPositions(e, alpha, beta, rotn, _measurementPoints.x.Color, _measurementPoints.y.Color);
                                Dygraph.Plugins.Plotter.prototype.drawOrbit(e, rotn, _laps, _fundamentalFrequency);
                            },
                        },
                    },
                    interactionModel: _customInteractionModel
                }
            );

            _xWaveformChart = new Dygraph(
                _contentXWaveform,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    labels: ["X", "Y"],
                    axisLabelFontSize: 10,
                    y2label: "Amplitud [" + _xSubvariables.overall.Units + "]",
                    labelsDivWidth: 0,
                    hideOverlayOnMouseOut: false,
                    zoomCallback: function (minDate, maxDate, yRange) {
                        _showY2Axis();
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    series: {
                        "Y": { axis: "y2" }
                    },
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
                    }
                }
            );

            _yWaveformChart = new Dygraph(
                _contentYWaveform,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    labels: ["X", "Y"],
                    axisLabelFontSize: 10,
                    xlabel: "Tiempo [ms]",
                    y2label: "Amplitud [" + _xSubvariables.overall.Units + "]",
                    labelsDivWidth: 0,
                    hideOverlayOnMouseOut: false,
                    zoomCallback: function (minDate, maxDate, yRange) {
                        _showY2Axis();
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    series: {
                        "Y": { axis: "y2" }
                    },
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
                    }
                }
            );
            _showY2Axis();

            Dygraph.synchronize([_xWaveformChart, _yWaveformChart], {
                zoom: true,
                selection: true,
                range: false
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
                    if (!Dygraph.isValidPoint(pts[i])) continue;
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
        _updateSelection = function () {
            _orbitChart.cascadeEvents_("select", {
                selectedRow: _orbitChart.lastRow_,
                selectedX: _orbitChart.lastx_,
                selectedPoints: _orbitChart.selPoints_
            });

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

            // Contexto de canvas
            ctx = _orbitChart.canvas_ctx_;
            if (_orbitChart.previousVerticalX_ >= 0) {
                // Determinar el radio maximo del circulo resaltado
                maxCircleSize = 0;
                labels = _orbitChart.attr_("labels");
                for (i = 1; i < labels.length; i += 1) {
                    currentRatio = _orbitChart.getNumericOption("highlightCircleSize", labels[i]);
                    if (currentRatio > maxCircleSize) {
                        maxCircleSize = currentRatio;
                    }
                }
                ctx.clearRect(0, 0, _orbitChart.width_, _orbitChart.height_);
            }

            if (_orbitChart.isUsingExcanvas_ && _orbitChart.currentZoomRectArgs_) {
                Dygraph.prototype.drawZoomRect_.apply(_orbitChart, _orbitChart.currentZoomRectArgs_);
            }

            colorSerie = (_orbitChart && _orbitChart.colors_ && _orbitChart.colors_.length > 0) ? _orbitChart.colors_[0] : "#006ACB";
            if (_orbitChart.selPoints_.length > 0) {
                // Dibuja circulos de colores sobre el centro de cada punto seleccionado
                canvasx = _orbitChart.selPoints_[0].canvasx;
                ctx.save();
                for (i = 0; i < _orbitChart.selPoints_.length; i += 1) {
                    point = _orbitChart.selPoints_[i];
                    if (!Dygraph.isOK(point.canvasy)) continue;
                    circleSize = _orbitChart.getNumericOption("highlightCircleSize", point.name);
                    callback = _orbitChart.getFunctionOption("drawHighlightPointCallback", point.name);
                    if (!callback) {
                        callback = Dygraph.Circles.DEFAULT;
                    }
                    ctx.lineWidth = _orbitChart.getNumericOption("strokeWidth", point.name);
                    ctx.strokeStyle = colorSerie;
                    ctx.fillStyle = colorSerie;
                    callback.call(_orbitChart, _orbitChart, point.name, ctx, point.canvasx, point.canvasy, colorSerie, circleSize, point.idx);
                }
                ctx.restore();
                _orbitChart.previousVerticalX_ = canvasx;
            }
        };

        /*
         * Modelo de interaccion personalizado con los diferentes eventos del grafico
         */
        _customInteractionModel = {
            mousedown: function (event, g, context) {
                if (_pause) {
                    // Evita que el clic derecho inicialice el zoom
                    if (event.button && event.button == 2) return;
                    context.initializeMouseDown(event, g, context);
                    if (event.altKey || event.shiftKey || event.ctrlKey) {
                        Dygraph.startPan(event, g, context);
                    } else {
                        Dygraph.startZoom(event, g, context);
                    }
                }
            },
            mousemove: function (event, g, context) {
                if (_pause) {
                    if (context.isZooming) {
                        Dygraph.moveZoom(event, g, context);
                    } else if (context.isPanning) {
                        Dygraph.movePan(event, g, context);
                    } else {
                        var
                            selectionChanged,
                            closestPoint,
                            row, point,
                            setIdx, pointIdx,
                            points, setRow,
                            callback;

                        selectionChanged = false;
                        closestPoint = _findClosestPoint(g.eventToDomCoords(event)[0], g.eventToDomCoords(event)[1], g.layout_);
                        row = closestPoint.row;
                        if (row != _orbitChart.lastRow_) {
                            selectionChanged = true;
                        }
                        _orbitChart.lastRow_ = row;
                        _orbitChart.selPoints_ = [];
                        for (setIdx = 0; setIdx < _orbitChart.layout_.points.length; ++setIdx) {
                            points = _orbitChart.layout_.points[setIdx];
                            setRow = row - _orbitChart.getLeftBoundary_(setIdx);
                            if (!points[setRow]) {
                                // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                                continue;
                            }
                            if (setRow < points.length && points[setRow].idx == row) {
                                point = points[setRow];
                                if (point.yval !== null && !isNaN(point.yval)) {
                                    _orbitChart.selPoints_.push(point);
                                }
                            } else {
                                for (pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                                    point = points[pointIdx];
                                    if (point.idx == row) {
                                        if (point.yval !== null && !isNaN(point.yval)) {
                                            _orbitChart.selPoints_.push(point);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                        if (_orbitChart.selPoints_.length) {
                            _orbitChart.lastx_ = _orbitChart.selPoints_[0].xval;
                        } else {
                            _orbitChart.lastx_ = -1;
                        }
                        if (selectionChanged) {
                            _updateSelection(undefined);
                        }
                        callback = _orbitChart.getFunctionOption("highlightCallback");
                        if (callback && selectionChanged) {
                            callback.call(_orbitChart, event,
                                _orbitChart.lastx_,
                                _orbitChart.selPoints_,
                                _orbitChart.lastRow_,
                                _orbitChart.highlightSet_);
                        }
                    }
                }
            },
            dblclick: function (event, g, context) {
                if (context.cancelNextDblclick) {
                    context.cancelNextDblclick = false;
                    return;
                }
                if (event.altKey || event.shiftKey || event.ctrlKey) {
                    return;
                }

                g.updateOptions({
                    "dateWindow": [_graphRange.X[0], _graphRange.X[1]],
                    "valueRange": [_graphRange.Y[0], _graphRange.Y[1]]
                });
            },
            mouseup: function (event, g, context) {
                if (context.isZooming) {
                    Dygraph.endZoom(event, g, context);
                } else if (context.isPanning) {
                    Dygraph.endPan(event, g, context);
                }
            },
            contextmenu: function (e, g, ctx) {
                e.preventDefault();
                return false;
            },
            click: function (e, g, ctx) {
                $(".customContextMenu").css("display", "none");
            }
        };

        /*
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (timeStamp, subVariableIdList) {
            var
                mdVariableIdList,
                index,
                waveformX,
                waveformY;

            timeStamp = new Date(timeStamp).getTime().toString();
            subVariableIdList = (timeMode === 0) ? subVariableIdList : [_xSubvariables.waveform.Id, _ySubvariables.waveform.Id];
            switch (timeMode) {
                case 0: // RT
                    _newDataSubscription = PublisherSubscriber.subscribe("/realtime/refresh", subVariableIdList, function (data) {
                        waveformX = data[_xSubvariables.waveform.Id];
                        waveformY = data[_ySubvariables.waveform.Id];
                        if (!isEmpty(waveformX) && !isEmpty(waveformY)) {
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
                            _refresh(waveformX, waveformY, _orbitChart.phiX_, _orbitChart.phiY_);
                        } else {
                            console.error("No se encontró datos de forma de onda");
                        }
                    });
                    break;
                case 1: // HT
                    _newDataSubscription = PublisherSubscriber.subscribe("/historic/refresh", subVariableIdList, function (data) {
                        for (index in data) {
                            if (data.hasOwnProperty(index)) {
                                if (data[index].WidgetId !== _widgetId) {
                                    return;
                                }
                            }
                        }
                        waveformX = data[_xSubvariables.waveform.Id][timeStamp];
                        waveformY = data[_ySubvariables.waveform.Id][timeStamp];
                        if (!isEmpty(waveformX) && !isEmpty(waveformY)) {
                            if (!waveformX.KeyphasorPositions || !waveformY.KeyphasorPositions) {
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
                            if (subVariableHTList[_xSubvariables.overall.Id][timeStamp]) {
                                _xSubvariables.overall.Value = clone(subVariableHTList[_xSubvariables.overall.Id][timeStamp].Value);
                            }
                            if (subVariableHTList[_ySubvariables.overall.Id][timeStamp]) {
                                _ySubvariables.overall.Value = clone(subVariableHTList[_ySubvariables.overall.Id][timeStamp].Value);
                            }
                            
                            if (_angularSubvariable) {
                                if (subVariableHTList[_xSubvariables.phase.Id][timeStamp]) {
                                    _xSubvariables.phase.Value = clone(subVariableHTList[_xSubvariables.phase.Id][timeStamp].Value);
                                }
                                if (subVariableHTList[_xSubvariables.amplitude.Id][timeStamp]) {
                                    _xSubvariables.amplitude.Value = clone(subVariableHTList[_xSubvariables.amplitude.Id][timeStamp].Value);
                                }
                                if (subVariableHTList[_ySubvariables.phase.Id][timeStamp]) {
                                    _ySubvariables.phase.Value = clone(subVariableHTList[_ySubvariables.phase.Id][timeStamp].Value);
                                }
                                if (subVariableHTList[_ySubvariables.amplitude.Id][timeStamp]) {
                                    _ySubvariables.amplitude.Value = clone(subVariableHTList[_ySubvariables.amplitude.Id][timeStamp].Value);
                                }
                                if (subVariableHTList[_angularSubvariable.Id][timeStamp]) {
                                    _angularSubvariable.Value = clone(subVariableHTList[_angularSubvariable.Id][timeStamp].Value);
                                }
                            }
                            _orbitChart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            _orbitChart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            _refresh(waveformX, waveformY, _orbitChart.phiX_, _orbitChart.phiY_);
                        } else {
                            console.error("No se encontró datos de forma de onda");
                        }
                    });
                    mdVariableIdList = [_measurementPoints.x.Id, _measurementPoints.y.Id];
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData(mdVariableIdList, subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!isNaN(currentTimeStamp)) {
                            if (subVariableHTList[_xSubvariables.waveform.Id][currentTimeStamp]) {
                                waveformX = clone(subVariableHTList[_xSubvariables.waveform.Id][currentTimeStamp]);
                            } else {
                                console.error("No se encontró datos de forma de onda en X.");
                                return;
                            }
                            if (subVariableHTList[_ySubvariables.waveform.Id][currentTimeStamp]) {
                                waveformY = clone(subVariableHTList[_ySubvariables.waveform.Id][currentTimeStamp]);
                            } else {
                                console.error("No se encontró datos de forma de onda en Y.");
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
                            if (subVariableHTList[_xSubvariables.overall.Id][currentTimeStamp]) {
                                _xSubvariables.overall.Value = clone(subVariableHTList[_xSubvariables.overall.Id][currentTimeStamp].Value);
                            }
                            if (subVariableHTList[_ySubvariables.overall.Id][currentTimeStamp]) {
                                _ySubvariables.overall.Value = clone(subVariableHTList[_ySubvariables.overall.Id][currentTimeStamp].Value);
                            }

                            if (_angularSubvariable) {
                                if (subVariableHTList[_xSubvariables.phase.Id][currentTimeStamp]) {
                                    _xSubvariables.phase.Value = clone(subVariableHTList[_xSubvariables.phase.Id][currentTimeStamp].Value);
                                }
                                if (subVariableHTList[_xSubvariables.amplitude.Id][currentTimeStamp]) {
                                    _xSubvariables.amplitude.Value = clone(subVariableHTList[_xSubvariables.amplitude.Id][currentTimeStamp].Value);
                                }
                                if (subVariableHTList[_ySubvariables.phase.Id][currentTimeStamp]) {
                                    _ySubvariables.phase.Value = clone(subVariableHTList[_ySubvariables.phase.Id][currentTimeStamp].Value);
                                }
                                if (subVariableHTList[_ySubvariables.amplitude.Id][currentTimeStamp]) {
                                    _ySubvariables.amplitude.Value = clone(subVariableHTList[_ySubvariables.amplitude.Id][currentTimeStamp].Value);
                                }
                                if (subVariableHTList[_angularSubvariable.Id][currentTimeStamp]) {
                                    _angularSubvariable.Value = clone(subVariableHTList[_angularSubvariable.Id][currentTimeStamp].Value);
                                }
                            }

                            _orbitChart.phiX_ = _measurementPoints.x.SensorAngle * Math.PI / 180;
                            _orbitChart.phiY_ = _measurementPoints.y.SensorAngle * Math.PI / 180;
                            _refresh(waveformX, waveformY, _orbitChart.phiX_, _orbitChart.phiY_);
                        }
                    });
                    break;
            }
        };

        _drawCharts = function (x, y, xAngularPos, yAngularPos, sampleTime) {
            var
                data,
                kph;

            data = _getOrbitData(x, y, _orbitChart.phiX_, _orbitChart.phiY_, xAngularPos, yAngularPos, _laps);
            if (_filtered1x) {
                xAngularPos = GetKeyphasorOnTime(xAngularPos, sampleTime, x.length);
                yAngularPos = GetKeyphasorOnTime(yAngularPos, sampleTime, y.length);
            } else {
                xAngularPos = clone(_xSubvariables.waveform.KeyphasorPositionsOnTime);
                yAngularPos = clone(_ySubvariables.waveform.KeyphasorPositionsOnTime);
            }
            _graphRange.X = data.rangeX;
            _graphRange.Y = data.rangeY;
            _orbitChart.updateOptions({
                "file": data.value,
                "dateWindow": [_graphRange.X[0], _graphRange.X[1]],
                "valueRange": [_graphRange.Y[0], _graphRange.Y[1]]
            });
            // Formas de onda
            _xWaveformChart.updateOptions({
                "file": (_filtered1x) ? GetXYDataOnTime(x, sampleTime) : _xSubvariables.waveform.Value
            });
            kph = [];
            if (xAngularPos) {
                if (xAngularPos.length > 2) {
                    for (i = 0; i < xAngularPos.length; i += 1) {
                        kph.push({
                            series: "Y",
                            x: xAngularPos[i],
                            text: xAngularPos[i].toString(),
                            width: 10,
                            height: 10,
                            cssClass: "keyphasor-annotation"
                        });
                    }
                }
            }
            _xWaveformChart.setAnnotations(kph);
            _yWaveformChart.updateOptions({
                "file": (_filtered1x) ? GetXYDataOnTime(y, sampleTime) : _ySubvariables.waveform.Value
            });
            kph = [];
            if (yAngularPos) {
                if (yAngularPos.length > 2) {
                    for (i = 0; i < yAngularPos.length; i += 1) {
                        kph.push({
                            series: "Y",
                            x: yAngularPos[i],
                            text: yAngularPos[i].toString(),
                            width: 10,
                            height: 10,
                            cssClass: "keyphasor-annotation"
                        });
                    }
                }
            }
            _yWaveformChart.setAnnotations(kph);
        };

        /*
         * Actualiza los valores a graficar
         */
        _refresh = function (xWaveform, yWaveform, phiX, phiY) {
            if (timeMode === 1 || (timeMode === 0 && !_pause)) {
                if (_currentTimeStamp !== xWaveform.TimeStamp && xWaveform.TimeStamp === yWaveform.TimeStamp) {
                    var
                        txt, kph,
                        sampleTime,
                        measureType,
                        xAngularPos,
                        yAngularPos,
                        yRange,
                        phaseIni,
                        positions,
                        xVal, yVal,
                        orbitData;

                    _currentTimeStamp = xWaveform.TimeStamp;
                    sampleTime = (xWaveform.Value.length / xWaveform.SampleRate);
                    if (_angularSubvariable) {
                        _fundamentalFrequency = _angularSubvariable.Value / 60;
                    }
                    xVal = clone(xWaveform.RawValue);
                    yVal = clone(yWaveform.RawValue);
                    measureType = _xSubvariables.overall.MeasureType;
                    if (_filtered1x) {
                        phaseIni = _getInitialPhase(clone(xWaveform), _xSubvariables.phase);
                        xVal = _applyFilter(xWaveform.RawValue, xWaveform.SampleRate, measureType, _xSubvariables.amplitude, phaseIni);
                        phaseIni = _getInitialPhase(clone(yWaveform), _ySubvariables.phase);
                        yVal = _applyFilter(yWaveform.RawValue, yWaveform.SampleRate, measureType, _ySubvariables.amplitude, phaseIni);
                    }
                    positions = _calculateAngularPositions(
                        clone(_xSubvariables.waveform.KeyphasorPositions), xVal, _xSubvariables.phase,
                        clone(_ySubvariables.waveform.KeyphasorPositions), yVal, _ySubvariables.phase);
                    xAngularPos = positions[0];
                    yAngularPos = positions[1];

                    orbitData = _getOrbitData(xVal, yVal, phiX, phiY, xAngularPos, yAngularPos, _laps);
                    txt = "<b style=\"color:" + _measurementPoints.x.Color + ";\">" + _measurementPoints.x.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoints.x.SensorAngle) + "&deg;" + ", " + _xSubvariables.overall.Name + ": ";
                    txt += _xSubvariables.overall.Value.toFixed(2) + " " + _xSubvariables.overall.Units + ", &nbsp;" + _currentTimeStamp;
                    $("#" + _measurementPoints.x.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                    txt = "<b style=\"color:" + _measurementPoints.y.Color + ";\">" + _measurementPoints.y.Name + "</b>&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoints.y.SensorAngle) + "&deg;" + ", " + _ySubvariables.overall.Name + ": ";
                    txt += _ySubvariables.overall.Value.toFixed(2) + " " + _ySubvariables.overall.Units + ", &nbsp;" + _currentTimeStamp;
                    $("#" + _measurementPoints.y.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);

                    yRange = [[xVal.min(), yVal.min()].min(), [xVal.max(), yVal.max()].max()];

                    // Informacion Orbita
                    _graphRange.X = orbitData.rangeX;
                    _graphRange.Y = orbitData.rangeY;
                    _orbitChart.updateOptions({
                        "file": orbitData.value,
                        "dateWindow": [_graphRange.X[0], _graphRange.X[1]],
                        "valueRange": [_graphRange.Y[0], _graphRange.Y[1]]
                    });

                    // Informacion Forma de Onda X
                    _xWaveformChart.updateOptions({
                        "file": GetXYDataOnTime(xVal, sampleTime),
                        "valueRange": yRange
                    });
                    kph = [];
                    if (_xSubvariables.waveform.KeyphasorPositionsOnTime) {
                        if (_xSubvariables.waveform.KeyphasorPositionsOnTime.length > 2) {
                            for (i = 0; i < _xSubvariables.waveform.KeyphasorPositionsOnTime.length; i += 1) {
                                kph.push({
                                    series: "Y",
                                    x: _xSubvariables.waveform.KeyphasorPositionsOnTime[i],
                                    text: _xSubvariables.waveform.KeyphasorPositionsOnTime[i].toString(),
                                    width: 10,
                                    height: 10,
                                    cssClass: "keyphasor-annotation"
                                });
                            }
                        }
                    }
                    _xWaveformChart.setAnnotations(kph);

                    // Informacion Forma de Onda Y
                    _yWaveformChart.updateOptions({
                        "file": GetXYDataOnTime(yVal, sampleTime),
                        "valueRange": yRange
                    });
                    kph = [];
                    if (_ySubvariables.waveform.KeyphasorPositionsOnTime) {
                        if (_ySubvariables.waveform.KeyphasorPositionsOnTime.length > 2) {
                            for (i = 0; i < _ySubvariables.waveform.KeyphasorPositionsOnTime.length; i += 1) {
                                kph.push({
                                    series: "Y",
                                    x: _ySubvariables.waveform.KeyphasorPositionsOnTime[i],
                                    text: _ySubvariables.waveform.KeyphasorPositionsOnTime[i].toString(),
                                    width: 10,
                                    height: 10,
                                    cssClass: "keyphasor-annotation"
                                });
                            }
                        }
                    }
                    _yWaveformChart.setAnnotations(kph);
                    _showY2Axis();
                }
            }
        };

        _applyFilter = function (waveformValue, sampleRate, measureType, amp1x, phaIni) {
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

        _getOrbitData = function (xVal, yVal, phiX, phiY, xAngularPos, yAngularPos, laps) {
            var
                data,
                start,
                xMax, xMin,
                yMax, yMin,
                i, j, k,
                largest,
                largestX, largestY,
                x, y, end,
                deltaX, deltaY;

            data = {
                value: [],
                rangeX: [],
                rangeY: []
            };
            largestX = 0;
            largestY = 0;
            laps = (xAngularPos.length > 1) ? laps : 1;
            if (xAngularPos.length > 0) {
                xMax = -xVal[xAngularPos[0]] * Math.sin(phiX) - yVal[xAngularPos[0]] * Math.sin(phiY);
                yMax = xVal[xAngularPos[0]] * Math.cos(phiX) + yVal[xAngularPos[0]] * Math.cos(phiY);
            } else {
                xMax = -xVal[0] * Math.sin(phiX) - yVal[0] * Math.sin(phiY);
                yMax = xVal[0] * Math.cos(phiX) + yVal[0] * Math.cos(phiY);
            }
            xMin = xMax;
            yMin = yMax;
            for (i = 0; i < laps; i += 1) {
                end = (xAngularPos.length > 1) ? xAngularPos[i + 1] : xVal.length;
                start = (xAngularPos.length > 1) ? xAngularPos[i] : 0;
                for (j = start; j < end; j += 1) {
                    x = -xVal[j] * Math.sin(phiX) - yVal[j] * Math.sin(phiY);
                    y = xVal[j] * Math.cos(phiX) + yVal[j] * Math.cos(phiY);
                    xMax = (x > xMax) ? x : xMax;
                    xMin = (x < xMin) ? x : xMin;
                    yMax = (y > yMax) ? y : yMax;
                    yMin = (y < yMin) ? y : yMin;
                    largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
                    largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
                    data.value.push([x, y]);
                }
                data.value.push([null, null]);
            }

            largest = [(xMax - xMin), (yMax - yMin)].max();
            largest = (largest === 0) ? 5 : largest;
            deltaX = (2 * largest - (xMax - xMin)) / 2;
            deltaY = (2 * largest - (yMax - yMin)) / 2;
            xMin -= deltaX;
            xMax += deltaX;
            yMin -= deltaY;
            yMax += deltaY;
            data.rangeX = [xMin, xMax];
            data.rangeY = [yMin, yMax];
            return data;
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

        _calculateAngularPositions = function (xAngularPos, xVal, xPha, yAngularPos, yVal, yPha) {
            var
                i,
                delta,
                firstMax,
                range,
                period,
                firstPosition;

            if (_filtered1x && xAngularPos.length > 1) {
                // Primero encontrar el primer pico maximo
                range = xVal.slice(0, xAngularPos[1]);
                firstMax = range.indexOf(range.max());
                // Cantidad de datos que representan un giro completo del eje
                delta = xAngularPos[1] - xAngularPos[0];
                firstPosition = (360 - xPha.Value) * delta / 360 + firstMax;
                if (firstPosition - delta > 0) {
                    firstPosition -= delta;
                }
                period = (xAngularPos[xAngularPos.length - 1] - xAngularPos[0]) / (xAngularPos.length - 1);
                for (i = 0; i < xAngularPos.length; i += 1) {
                    xAngularPos[i] = Math.round(period * i + firstPosition);
                    yAngularPos[i] = xAngularPos[i];
                }
            }
            return [xAngularPos, yAngularPos];
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

        this.Show = function (measurementPointId, timeStamp, currentColor, pairedColor) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Punto de medicion de referencia en el par (x, y)
                measurementPoint,
                // Sentido de giro (Nomenclatura usada en libros y documentos, abreviacion de RotationDirection)
                rotn,
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
                    break;
            }

            if (measurementPoint.AssociatedMeasurementPointId != null) {
                var
                    // Sensor de referencia angular
                    angularReference,
                    // Menu de opciones para la grafica
                    settingsMenu,
                    // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                    subVariableIdList,
                    // Concatena las unidades configuradas para la SubVariable del punto de medicion en X con el valor global y su tipo de medida
                    overallUnits;

                subVariableIdList = [];
                if (measurementPoint.Orientation === 1) {
                    // Punto de medicion X
                    _measurementPoints.x = measurementPoint;
                    // Punto de medicion Y.
                    _measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                    // Colores
                    _measurementPoints.x.Color = (timeMode === 0) ? "#C68E17" : currentColor;
                    _measurementPoints.y.Color = (timeMode === 0) ? "#8D38C9" : pairedColor;
                } else {
                    // Punto de medicion X
                    _measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                    // Punto de medicion Y
                    _measurementPoints.y = measurementPoint;
                    // Colores
                    _measurementPoints.x.Color = (timeMode === 0) ? "#C68E17" : pairedColor;
                    _measurementPoints.y.Color = (timeMode === 0) ? "#8D38C9" : currentColor;
                }
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPoint.AngularReferenceId, false)
                )[0];
                if (!angularReference) {
                    popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                    rotn = "CW";
                } else {
                    rotn = (angularReference.RotationDirection == 1) ? "CW" : "CCW";
                    _angularSubvariable = clone(ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0]);
                }

                // SubVariable que corresponde al punto de referencia angular
                if (_angularSubvariable) {
                    subVariableIdList.push(_angularSubvariable.Id);
                }
                // Total subvariables para el punto de medicion en X
                subVariables = _measurementPoints.x.SubVariables;
                // SubVariable que contiene la forma de onda en X
                _xSubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_xSubvariables.waveform) {
                    subVariableIdList.push(_xSubvariables.waveform.Id);
                }
                // SubVariable que contiene el valor global del sensor en X
                _xSubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                if (_xSubvariables.overall) {
                    subVariableIdList.push(_xSubvariables.overall.Id);
                }
                //SubVariable que contiene el valor de fase del sensor en X
                _xSubvariables.phase = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 6, false))[0]);
                if (_xSubvariables.phase) {
                    subVariableIdList.push(_xSubvariables.phase.Id);
                }
                //SubVariable que contiene el valor de amplitud del sensor en X
                _xSubvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0]);
                if (_xSubvariables.amplitude) {
                    subVariableIdList.push(_xSubvariables.amplitude.Id);
                }
                // Total subvariables para el punto de medicion en Y
                subVariables = _measurementPoints.y.SubVariables;
                // Subvariable que contiene la forma de onda en Y
                _ySubvariables.waveform = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0]);
                if (_ySubvariables.waveform) {
                    subVariableIdList.push(_ySubvariables.waveform.Id);
                }
                // SubVariable que contiene el valor global del sensor en Y
                _ySubvariables.overall = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0]);
                if (_ySubvariables.overall) {
                    subVariableIdList.push(_ySubvariables.overall.Id);
                }
                //SubVariable que contiene el valor de fase del sensor en X
                _ySubvariables.phase = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 6, false))[0]);
                if (_ySubvariables.phase) {
                    subVariableIdList.push(_ySubvariables.phase.Id);
                }
                //SubVariable que contiene el valor de amplitud del sensor en X
                _ySubvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0]);
                if (_ySubvariables.amplitude) {
                    subVariableIdList.push(_ySubvariables.amplitude.Id);
                }

                if (_xSubvariables.overall.Units !== _ySubvariables.overall.Units) {
                    popUp("info", "Unidades de las subvariable con valor global es diferente para el par de puntos de medición.");
                    return;
                }

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
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Número de vueltas...", "setOrbitLaps"));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtrar órbita", "filteredOrbit" + _widgetId));
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageOrbit" + _widgetId));
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
                    measurementPointList: [_measurementPoints.x.Name.replace(/\s/g, ""), _measurementPoints.y.Name.replace(/\s/g, "")],
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
                        _movableGrid = !_movableGrid;
                        var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                        $(".grid-stack").data("gridstack").movable(grid, _movableGrid);
                    }
                });

                labels = ["Estampa de tiempo", "Amplitud"];
                // Abrir AspectrogramWidget
                _aWidget.open();
                // Se suscribe a la notificacion de llegada de nuevos datos
                _subscribeToNewData(timeStamp, subVariableIdList);
                // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
                _subscribeToResizeChart();
                // Construir y mostrar grafica
                _buildGraph(labels, rotn);
            } else {
                popUp("info", "El punto de medición no tiene asociado ningún par.");
            }
        };

        this.Close = function () {
            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }

            if (_resizeChartSubscription) {
                // Eliminar suscripcion de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }

            if (_playerSubscription) {
                // Eliminar suscripcion de reproductor.
                _playerSubscription.remove();
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
            var el = $(_container).parents().eq(2);
            $(".grid-stack").data("gridstack").removeWidget(el);
            $(_container).remove();
        };
    }

    return OrbitGraph;
})();