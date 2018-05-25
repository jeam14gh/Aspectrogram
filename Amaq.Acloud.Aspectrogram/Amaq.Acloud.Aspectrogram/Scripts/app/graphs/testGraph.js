/*
 * testGraph.js
 * Grafico de pruebas
 * @author Jorge Calderon
 */

/* globals Dygraph */

var TestGraph = {};

TestGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    TestGraph = function (timeMode) {
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
            // Tipo de grafico
            _graphType,
            // Frecuencia de muestreo
            _sampleRate,
            // Total de muestas
            _samples,
            // Valor de amplitud 1x (calculado o generado)
            _amplitude1x,
            // Valor de fase 1x (calculado o generado)
            _phase1x,
            // Valor de fase inicial con el que se genera la onda
            _phase,
            // Frecuencia en ciclos por segundo de la onda generada
            _frequency,
            // Valor calculado de amplitud 1x en una unica iteracion
            _resultAmp,
            // Valor calculado de fase 1x en una unica iteracion
            _resultPha,
            // Valor calculado de amplitud 1x como el promedio de todas las iteraciones
            _resultAvgAmp,
            // Valor calculado de fase 1x como el promedio de todas las iteraciones
            _resultAvgPha,
            // Posiciones de referencia angular
            _angularPositions,
            // Factor de expansion/contraccion de la frecuencia con que se genera la onda
            _factorFreq,
            // Factor de expansion/contraccion de la amplitud con que se genera la onda
            _factorAmpl,
            // Punto de medicion de la grafica
            _measurementPoint,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Referencia a las subvariables del punto de medicion (forma de onda, directa, fase 1x, amplitud 1x)
            _subvariables,
            // Referencia a la subvariable de velocidad (caso exista)
            _angularSubvariable,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Almacena la referencia de la subscripcion de nuevos datos
            _newDataSubscription,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            //
            _buildTrend,
            // Metodo privado que permite generar las posiciones de referencia angular
            _calculateAngularPositions,
            // Metodo privado para crear los controles HTML del grafico
            _createHtmlControls,
            // Metodo privado que obtiene los valores de Amplitud,Fase 1x en una unica iteracion
            _getFundamentalValues,
            // Metodo privado que obtiene los valores de Amplitud,Fase 1x para cada una de las revoluciones
            _getPartialResults,
            // Metodo privado que obtiene la informacion XY a graficar (generador)
            _getXYData,
            // Metodo privado que convierte el eje de abscisas en tiempo [ms]
            _getXYDataOnTime,
            // Metodo privado que dibuja re-dibuja los valores XY
            _redraw,
            // Metodo privado que permite actualizar los datos que llegan de la base de datos
            _refresh,
            // Metodo privado que realiza la asignacion de las anotaciones/posiciones de marcas de paso en la onda
            _setAnnotations,
            // Metodo privado que realiza la suscripcion a los nuevos datos
            _subscribeToNewData;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        timeMode = timeMode || 2;
        _pause = false;
        _movableGrid = false;
        _this = this;
        _graphType = "test";
        _widgetId = Math.floor(Math.random() * 100000);
        _sampleRate = 8000;
        _samples = 8000;
        _amplitude1x = 4;
        _phase1x = 90;
        _phase = 0;
        _frequency = 20;
        _factorFreq = 1;
        _factorAmpl = 1;
        _resultAmp = 0;
        _resultPha = 0;
        _resultAvgPha = 0;
        _resultAvgAmp = 0;
        _subvariables = {};
        _angularSubvariable = {};

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
        _contentHeader.style.height = "30%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = "waveformBody" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "70%";
        $(_container).append(_contentBody);

        /*
         * Construye la grafica, caso no exista.
         */
        _buildGraph = function () {
            var
                // Texto a mostrar de forma dinamica
                txt;

            _chart = new Dygraph(
                _contentBody,
                [[0, 0]],
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 6,
                    legend: "never",
                    xlabel: "Tiempo [ms]",
                    ylabel: "Amplitud [um pk-pk]",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: ["Estampa de tiempo", "Amplitud"],
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    highlightCallback: function (e, x, pts, row) {
                        if (pts.length > 0) {
                            txt = "Amplitud: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(4) + " um pk-pk";
                            txt += ", Tiempo: " + pts[0].xval.toFixed(2) + " [ms], Muestra: " + pts[0].idx;
                            $("#" + _seriesName[0] + _widgetId + " > span").html(txt);
                        }
                    },
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: Dygraph.defaultInteractionModel
                }
            );
            $(".grid-stack-item").on("resizestop", function () {
                setTimeout(function () {
                    _chart.resize();
                }, 200);
            });
            _chart.ready(function () {
                _createHtmlControls();
                _redraw();
            });
        };

        _createHtmlControls = function () {
            var
                content;

            $("#point" + _measurementPoint.Name + _widgetId).empty();
            $("#point" + _measurementPoint.Name + _widgetId)[0].style.height = "80%";
            content = "<table class=\"table table-bordered table-responsive\" style=\"margin-bottom:0px;\">";
            content += "<thead>";
            content += "<tr>";
            content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">F. Muestreo<br>[Muestras/seg]</th>";
            content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">N. Muestras<br>[Muestras]</th>";
            content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">Amplitud<br>[um pk-pk]</th>";
            content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">Fase Angular<br>[°]</th>";
            if (timeMode === 2) {
                content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">Fase Inicial<br>[°]</th>";
            }
            content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">" +
                (timeMode === 2 ? "Frecuencia Onda<br>[CPS]" : "Velocidad<br>[RPM]") + "</th>";
            content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">" +
                (timeMode === 2 ? "Factor<br>(Frecuencia)" : "Fecha<br>[yyyy/MM/dd HH:mm:ss]") + "</th>";
            if (timeMode === 2) {
                content += "<th class=\"text-center\" valign=\"center\" style=\"color:#0000FF;\">Factor<br>(Amplitud)</th>";
            }
            content += "</tr>";
            content += "</thead>";
            content += "<tbody>";
            content += "<tr>";
            content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"sRate" + _widgetId + "\" value=\"" + _sampleRate + "\" /></td>";
            content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"samples" + _widgetId + "\" value=\"" + _samples + "\" /></td>";
            content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"amp1X" + _widgetId + "\" value=\"" + _amplitude1x + "\" /></td>";
            content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"pha1X" + _widgetId + "\" value=\"" + _phase1x + "\" /></td>";
            if (timeMode === 2) {
                content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"pha" + _widgetId + "\" value=\"" + _phase + "\" /></td>";
            }
            content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"" +
                (timeMode === 2 ? "freq" : "vel") + _widgetId + "\" value=\"" + _frequency + "\" /></td>";
            content += "<td class=\"text-center\"><input type=\"text\" style=\"width:100%;\" id=\"" +
                (timeMode === 2 ? "factorFreq" : "date") + _widgetId + "\" value=\"" + _factorFreq + "\" /></td>";
            if (timeMode === 2) {
                content += "<td class=\"text-center\"><input type=\"number\" style=\"width:100%;\" id=\"factorAmpl" + _widgetId + "\" value=\"" + _factorAmpl + "\" /></td>";
            }
            content += "</tr>";
            content += "</tbody>";
            content += "</table>";
            $("#point" + _measurementPoint.Name + _widgetId).append(content);
            content = "<table class=\"table table-bordered table-responsive\">";
            content += "<tbody>";
            content += "<tr>" +
                "<td style=\"vertical-align:middle;text-align:center;\">Amplitud<br>(Única iter.): </td>" +
                "<td style=\"vertical-align:middle;text-align:center;\"><input type=\"number\" id=\"resultAmp" + _widgetId + "\" value=\"" + _resultAmp + "\" disabled /></td>" +
                "<td style=\"vertical-align:middle;text-align:center;\">Fase<br>(Única iter.): </td>" +
                "<td style=\"vertical-align:middle;text-align:center;\"><input type=\"number\" id=\"resultPha" + _widgetId + "\" value=\"" + _resultPha + "\" disabled /></td>" +
                "<td style=\"vertical-align:middle;text-align:center;\">Amplitud<br>(Promedio iter.): </td>" +
                "<td style=\"vertical-align:middle;text-align:center;\"><input type=\"number\" id=\"resultAvgAmp" + _widgetId + "\" value=\"" + _resultAvgAmp + "\" disabled /></td>" +
                "<td style=\"vertical-align:middle;text-align:center;\">Fase<br>(Promedio iter.): </td>" +
                "<td style=\"vertical-align:middle;text-align:center;\"><input type=\"number\" id=\"resultAvgPha" + _widgetId + "\" value=\"" + _resultAvgPha +
                    "\" disabled /></td>" + (timeMode === 2 ? "<td class=\"text-vertical-align:middle;text-align:center;\" valign=\"center\"><input id=\"btnRefresh"
                    + _widgetId + "\" type=\"button\" value=\"Aplicar\" /></td>" : "") +
                "</tr>";
            content += "<tr>";
            content += "<td class=\"text-center\" colspan=\"3\"><textarea id=\"partialPhases" + _widgetId + "\" cols=\"45\" rows=\"5\"></textarea></td>";
            content += "<td class=\"text-center\" colspan=\"" + (timeMode === 2 ? 6 : 5) + "\">" +
                //"<textarea id=\"angularPositions" + _widgetId + "\" cols=\"125\" rows=\"5\"></textarea>"
                "<div id=\"partialTrend" + _widgetId + "\" style=\"width:100%;height:150px;\"></div>"
                + "</td>";
            content += "</tr>";
            content += "</tbody>";
            content += "</table>";
            $("#point" + _measurementPoint.Name + _widgetId).append(content);
            if (timeMode === 2) {
                $("#btnRefresh" + _widgetId).click(function (e) {
                    _redraw();
                });
            }
        };

        _redraw = function (waveform, timeStamp) {
            var
                rpmValue;

            if (timeMode === 2) {
                _sampleRate = Number(Number($("#sRate" + _widgetId).val()).toFixed(0));
                _samples = Number(Number($("#samples" + _widgetId).val()).toFixed(0));
                _amplitude1x = Number(Number($("#amp1X" + _widgetId).val()).toFixed(2));
                _phase = Number(Number($("#pha" + _widgetId).val()).toFixed(2));
                _phase1x = Number(Number($("#pha1X" + _widgetId).val()).toFixed(2));
                _frequency = Number(Number($("#freq" + _widgetId).val()).toFixed(2));
                _factorFreq = Number(Number($("#factorFreq" + _widgetId).val()).toFixed(4));
                _factorAmpl = Number(Number($("#factorAmpl" + _widgetId).val()).toFixed(4));
            } else {
                $("#sRate" + _widgetId).val(_sampleRate).prop("disabled", true);
                $("#samples" + _widgetId).val(_samples).prop("disabled", true);
                $("#amp1X" + _widgetId).val(((_subvariables.amplitude) ? _subvariables.amplitude.Value.toFixed(2) : 0)).prop("disabled", true);
                $("#pha1X" + _widgetId).val(((_subvariables.phase) ? _subvariables.phase.Value.toFixed(5) : 0)).prop("disabled", true);
                rpmValue = (_angularSubvariable) ? _angularSubvariable.Value : null;
                rpmValue = (rpmValue === null) ? 0 : _angularSubvariable.Value.toFixed(2);
                $("#vel" + _widgetId).val(rpmValue).prop("disabled", true);
                $("#date" + _widgetId).val((timeStamp) ? timeStamp : "").prop("disabled", true);
                $("#btnRefresh" + _widgetId).prop("disabled", true);
            }
            _chart.updateOptions({
                "file": waveform || _getXYData()
            });
            _getFundamentalValues();
            _getPartialResults();
            _setAnnotations();
        };

        _getXYData = function () {
            var
                xyData,
                phi,
                omega,
                i;

            xyData = [];
            phi = (_phase - 90) * (Math.PI / 180);
            for (i = 0; i < _samples ; i += 1) {
                omega = 2 * Math.PI * _frequency * (1 + ((_factorFreq - 1) * i / _samples));
                xyData[i] = [i, (_amplitude1x * (1 + ((_factorAmpl - 1) * i / _samples)) / 2) * Math.cos(omega * i / _sampleRate + phi)];
            }
            _calculateAngularPositions(0, 0.6, 0.4);
            return _getXYDataOnTime(xyData);
        };

        _calculateAngularPositions = function (minimumNoiseInVolts, threshold, hysteresisThreshold) {
            var
                phi, i,
                noiseInVolts,
                pulstran,
                falling,
                raising;

            _angularPositions = [];
            phi = (_phase1x - 30 + _phase) * (Math.PI / 180);
            noiseInVolts = 1.0;
            pulstran = [];
            for (i = 0; i < _samples ; i += 1) {
                pulstran[i] = (Math.cos(2 * Math.PI * _frequency * (1 + ((_factorFreq - 1) * i / _samples)) * i / _sampleRate + phi) > 0.5 ? 1 : 0);
            }
            if (noiseInVolts >= minimumNoiseInVolts) {
                if (threshold > hysteresisThreshold) // Validar reset en bajada
                {
                    falling = false;
                    for (i = 0; i < pulstran.length - 1; i++) {
                        if ((!falling) && (pulstran[i] >= threshold)) {
                            falling = true;
                        }
                        if ((falling) && (pulstran[i + 1]) < hysteresisThreshold) {
                            falling = false;
                            _angularPositions.push(i);
                        }
                    }
                }
                else // Validar reset en subida
                {
                    raising = false;
                    for (i = 0; i < pulstran.length - 1; i++) {
                        if (pulstran[i] <= threshold) {
                            raising = true;
                        }
                        if ((raising) && (pulstran[i + 1]) > hysteresisThreshold) {
                            raising = false;
                            _angularPositions.push(i);
                        }
                    }
                }
            }
        };

        _getXYDataOnTime = function (xyData) {
            var
                step,
                xyDataOnTime,
                i;

            step = (_samples / _sampleRate) * 1000 / xyData.length;
            xyDataOnTime = [];
            for (i = 0; i < xyData.length; i += 1) {
                xyDataOnTime.push([RoundToPlaces((step * i), 6), xyData[i][1]]);
            }
            return xyDataOnTime;
        }

        _getFundamentalValues = function () {
            var
                n,
                firstFlank,
                lastFlank,
                numberOfFlanks,
                length,
                omega,
                k,
                sumX,
                sumY,
                windowObj,
                bSi;

            firstFlank = _angularPositions[0];
            lastFlank = _angularPositions[_angularPositions.length - 1];
            numberOfFlanks = _angularPositions.length;
            length = lastFlank - firstFlank;
            omega = 2.0 * Math.PI / length;
            sumX = 0;
            sumY = 0;
            for (n = firstFlank; n < lastFlank; n += 1) {
                // Es necesario para el calculo de la fase (el coseno y el seno deben arrancar en 0)
                k = n - firstFlank;
                // e^(-jwt) = cos(wt) - j * sin(wt)
                sumX += _chart.file_[n][1] * Math.cos(omega * k * (numberOfFlanks - 1));
                sumY += _chart.file_[n][1] * (-1) * Math.sin(omega * k * (numberOfFlanks - 1));
            }
            bSi = 2 / length;
            _resultAmp = 2 * bSi * Math.sqrt(sumX * sumX + sumY * sumY)/* * windowObj.factor*/;
            _resultPha = Math.atan2(-sumY, sumX) * (180 / Math.PI);
            _resultPha = (_resultPha < 0) ? (_resultPha + 360) : _resultPha;
            $("#resultAmp" + _widgetId).val(Number(_resultAmp.toFixed(5)));
            $("#resultPha" + _widgetId).val(Number(_resultPha.toFixed(5)));
        };

        _getPartialResults = function () {
            var
                i, j, k,
                firstFlank,
                lastFlank,
                length,
                omega,
                sumX,
                sumY,
                bSi,
                tmpPhase,
                tmpAmplitude,
                trendData,
                txt;

            txt = "Fases Parciales:\n";
            _resultAvgPha = 0;
            _resultAvgAmp = 0;
            trendData = [];
            for (i = 0; i < _angularPositions.length - 1; i += 1) {
                firstFlank = _angularPositions[i];
                lastFlank = _angularPositions[i + 1];
                length = lastFlank - firstFlank;
                omega = 2.0 * Math.PI / length;
                sumX = 0;
                sumY = 0;
                bSi = 2 / length;
                for (j = firstFlank; j < lastFlank; j += 1) {
                    // Es necesario para el calculo de la fase (el coseno y el seno deben arrancar en 0)
                    k = j - firstFlank;
                    // e^(-jwt) = cos(wt) - j * sin(wt)
                    sumX += _chart.file_[j][1] * Math.cos(omega * k);
                    sumY += _chart.file_[j][1] * (-1) * Math.sin(omega * k);
                }
                tmpAmplitude = 2 * bSi * Math.sqrt(sumX * sumX + sumY * sumY)
                tmpPhase = Math.atan2(-sumY, sumX) * (180 / Math.PI);
                tmpPhase = (tmpPhase < 0) ? (tmpPhase + 360) : tmpPhase;
                _resultAvgPha += tmpPhase;
                _resultAvgAmp += tmpAmplitude;
                txt += tmpAmplitude.toFixed(2) + " um, " + tmpPhase.toFixed(2) + "°, Velocidad: " + ((_sampleRate / length) * 60).toFixed(2) + " rpm\n";
                trendData.push([(i + 1), tmpAmplitude, tmpPhase, (_sampleRate / length) * 60]);
            }
            _resultAvgPha = (_resultAvgPha / (_angularPositions.length - 1));
            _resultAvgAmp = (_resultAvgAmp / (_angularPositions.length - 1));
            $("#resultAvgPha" + _widgetId).val(Number(_resultAvgPha.toFixed(5)));
            $("#resultAvgAmp" + _widgetId).val(Number(_resultAvgAmp.toFixed(5)));
            $("#partialPhases" + _widgetId).html(txt);
            _buildTrend(trendData);
        };

        _buildTrend = function (trendData) {
            var
                max,
                min,
                ampRange,
                phaRange,
                i;

            max = arrayColumn(trendData, 1).max();
            min = arrayColumn(trendData, 1).min();
            ampRange = max - min;
            max = arrayColumn(trendData, 2).max();
            min = arrayColumn(trendData, 2).min();
            phaRange = max - min;
            for (i = 0; i < trendData.length; i += 1) {
                trendData[i][1] = (trendData[i][1] - _resultAvgAmp) / ampRange;
                trendData[i][2] = (trendData[i][2] - _resultAvgPha) / phaRange;
            }

            new Dygraph(
                document.getElementById("partialTrend" + _widgetId),
                trendData,
                {
                    colors: ["#006ACB", "#008000", "#FF0000"],
                    digitsAfterDecimal: 6,
                    legend: "never",
                    xlabel: "Iteracion",
                    avoidMinZero: true,
                    xRangePad: 1,
                    labels: ["Iteracion", "Amplitud", "Fase", "Velocidad"],
                    axisLabelFontSize: 10,
                    hideOverlayOnMouseOut: false,
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    interactionModel: Dygraph.defaultInteractionModel,
                    axes: {
                        y: {
                            pixelsPerLabel: 10,
                            axisLabelWidth: 40
                        },
                        y2: {
                            pixelsPerLabel: 10,
                            axisLabelWidth: 40
                        }
                    },
                    valueRange: [-1, 1],
                    series: {
                        "Velocidad": { axis: "y2" }
                    }
                }
            );
        };

        _setAnnotations = function () {
            var
                annotations,
                step,
                xValues,
                yValues,
                i;

            annotations = [];
            step = (_samples / _sampleRate) * 1000 / _chart.file_.length;
            xValues = "[";
            yValues = "[";
            for (i = 0; i < _angularPositions.length; i += 1) {
                xValues += _chart.file_[_angularPositions[i]][0];
                yValues += _angularPositions[i]/*_chart.file_[_angularPositions[i]][1]*/;
                if (i < _angularPositions.length - 1) {
                    xValues += ", ";
                    yValues += ", ";
                }
                annotations.push({
                    series: "Amplitud",
                    x: RoundToPlaces((step * _angularPositions[i]), 6),
                    width: 10,
                    height: 10,
                    text: "",
                    cssClass: "keyphasor-annotation"
                });
            }
            xValues += "]";
            yValues += "]";
            $("#angularPositions" + _widgetId).html("Coordenadas marca de paso:\n" + xValues + "\n" + yValues);
            _chart.setAnnotations(annotations);
        };

        /*
         * Obtiene la informacion mas reciente a graficar
         */
        _subscribeToNewData = function (timeStamp, subVariableIdList) {
            var
                waveform,
                idList,
                i;

            // Subscripcion a evento para refrescar datos de grafica segun timeMode
            switch (timeMode) {
                case 1: // Historico
                    timeStamp = new Date(timeStamp).getTime().toString();
                    subVariableIdList = [_subvariables.waveform.Id];
                    _newDataSubscription = PublisherSubscriber.subscribe("/historic/refresh", subVariableIdList, function (data) {
                        if (Object.keys(data).length === 0) {
                            return;
                        }
                        if (data[Object.keys(data)[0]].WidgetId !== _widgetId) {
                            return;
                        }
                        waveform = data[_subvariables.waveform.Id][timeStamp];
                        // Posiciones de marca de paso
                        _angularPositions = clone(waveform.KeyphasorPositions);
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
                                    // Posiciones de marca de paso
                                    _angularPositions = clone(data[0].referencePositions);
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
            // Frecuencia de muestreo
            _sampleRate = Number(waveform.SampleRate);
            // Numero de muestras
            _samples = waveform.Value.length;
            // Pintar los datos nuevos
            _redraw(waveform.Value, waveform.TimeStamp);
        };

        this.Show = function (measurementPointId, timeStamp) {
            var
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // Sensor de referencia angular
                angularReference,
                // Listado de subVariables necesarias para actualizar los datos (aplica unicamente para RT)
                subVariableIdList,
                // Concatena las unidades configuradas para la SubVariable del punto de medicion con el valor global y su tipo de medida
                overallUnits;

            switch (timeMode) {
                case 1: // HT
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                        new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
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
                        _subvariables.phase.Value = 0;
                    }
                    // SubVariable que contiene el valor de amplitud del punto de medicion
                    _subvariables.amplitude = clone(ej.DataManager(subVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 4, false))[0]);
                    if (_subvariables.amplitude) {
                        subVariableIdList.push(_subvariables.amplitude.Id);
                        _subvariables.amplitude.Value = 0;
                    }
                    // SubVariable que corresponde al punto de referencia angular
                    if (_angularSubvariable) {
                        subVariableIdList.push(_angularSubvariable.Id);
                        _angularSubvariable.Value = 0.0;
                    }
                    break;
                default:
                    _measurementPoint = {};
                    _assetData = {};
                    _measurementPoint.Name = "ControlsContainer";
                    _assetData.Name = "Prueba";
            }

            _seriesName = ["Amplitude"];

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Forma de onda",
                width: 12,
                minWidth: 12,
                height: 7,
                minHeight: 7,
                aspectRatio: false,
                graphType: _graphType,
                timeMode: timeMode,
                asdaqId: "",
                atrId: "",
                subVariableIdList: [],
                asset: _assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s|\W|[#$%^&*()]/g, "")],
                pause: false,
                settingsMenu: [],
                onSettingsMenuItemClick: null,
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

            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Se suscribe a la notificacion de llegada de nuevos datos.
            _subscribeToNewData(timeStamp, subVariableIdList);
            // Construir y mostrar grafica.
            _buildGraph();
        };

        this.Close = function () {
            var
                el;

            if (_newDataSubscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _newDataSubscription.remove();
            }
            if (_playerSubscription) {
                // Eliminar suscripcion de notificacion de llegada de datos por medio del player
                _playerSubscription.remove();
            }
            if (_chart) {
                _chart.destroy();
            }

            el = $(_container).parents().eq(2);
            $(".grid-stack").data("gridstack").removeWidget(el);
            $(_container).remove();
        };
    };

    return TestGraph;
})();