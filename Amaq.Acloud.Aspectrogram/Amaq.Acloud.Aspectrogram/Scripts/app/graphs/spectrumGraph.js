/*
 * spectrumGraph.js
 * Gestiona todo lo relacionado a la grafica de espectros.
 * @author Jorge Calderon
 */
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
            // Modo: Tiempo real (0), historico (1) o evento (2)
            _timeMode,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase SpectrumGraph
            _this,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
            // Mantiene la ultima estampa de tiempo que se actualizo en la grafica
            _currentTimeStamp,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Punto de medicion de la grafica
            _measurementPoint,
            // Mantiene la subVariable de la forma de onda en memoria
            _waveformSubVariable,
            // Mantiene el valor de la subVariable de global en memoria
            _overallValue,
            // Mantiene el valor de la subVariable de velocidad que corresponde a la referencia angular en memoria
            _velocityValue,
            // Tipo de ventaneo con que se grafica el espectro
            _windowing,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Referencia a la suscripcion que sincroniza el chart con los datos enviados por el reproductor
            _playerSubscription,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            // Metodo privado que gestiona el evento click sobre los items del menu de opciones
            _onSettingsMenuItemClick,
            // Referencia a la suscripcion para aplicar filtro dinamico
            _applyFilterSubscription,
            // Metodo privado que realiza la suscripcion al publisher para aplicar filtro dinamico
            _subscribeToApplyFilter,
            // Metodo privado que aplica filtro dinamico a la forma de onda y refresca el chart
            _applyFilter,
            // Referencia a los ultimos datos que se han graficado
            _currentData,
            // Aplica una derivativa antes de graficar segun seleccion del usuario. (1) Ninguna, (2) Integral, (3) Derivar
            _applyDerivative,
            // Valor boleano que indica si el tipo de espectro a mostrar es el por defecto segun el tipo de sensor.
            _isDefaultSelected,
            // Unidad del eje X seleccionada para mostrar (1) Frecuencia, (2) Orden
            _currentXUnit,
            // Tipo de sensor. (1) Acelerometro, (2) Velocimetro, (3) Acelerometro integrado
            _sensorType,
            // Referencia a la suscripción para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Método privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            _subscribeToScaleChart,
            _offsetToPercentage,
            _zoom,
            _adjustAxis,
            _getHarmonicLimits,
            _nxArray,
            _cursor,
            _cursorType,
            _harmonicCount,
            _sidebandCount,
            _harmonicIni,
            _sidebandIni,
            _sidebandWidth,
            _autoscale,
            _largestY,
            _largestDifference,
            _scaleChartSubscription,
            _scaleChartAcceleration;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _pause = false;
        _movableGrid = false;
        _autoscale = false;
        _this = this;
        _graphType = "spectrum";
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _overallValue = 0;
        _velocityValue = NaN;
        _windowing = clone(windowing.Hanning);
        _isDefaultSelected = true;
        _currentXUnit = 1;
        _cursorType = cursorType.None;
        _nxArray = [];
        _harmonicCount = 5;
        _sidebandCount = 5;

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
         *@param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var
                target,
                i, configContainer,
                cursorIni,
                cursorCount,
                currentType,
                currentPosition,
                configParameters,
                newType,
                children,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                settingsMenuItem,
                dataSrc;

            target = $(event.currentTarget);
            settingsMenuItem = target.attr("data-value");
            switch (settingsMenuItem) {
                case "saveImageSpectrum" + _widgetId:
                    imgExport = new ImageExport(_chart, _graphType);
                    imgExport.asPNG();
                    break;
                case "spectrum_1_" + _widgetId:
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    target.parent().next().children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    _isDefaultSelected = true;
                    if (_currentData && _currentData.Value !== null) {
                        _applyFilter(_applyDerivative(_currentData), _chart);
                    }
                    break;
                case "spectrum_2_" + _widgetId:
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    target.parent().prev().children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    _isDefaultSelected = false;
                    if (_currentData && _currentData.Value !== null) {
                        _applyFilter(_applyDerivative(_currentData), _chart);
                    }
                    break;
                case "frequencyUnit" + _widgetId:
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    target.parent().next().children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    if (_currentXUnit !== 1) {
                        _currentXUnit = 1;
                        if (_currentData && _currentData.Value !== null) {
                            _applyFilter(_applyDerivative(_currentData), _chart, "Frecuencia [Hz]");
                        }
                    }
                    break;
                case "orderUnit" + _widgetId:
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    target.parent().prev().children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    if (_currentXUnit !== 2) {
                        _currentXUnit = 2;
                        if (_currentData && _currentData.Value !== null) {
                            _applyFilter(_applyDerivative(_currentData), _chart, "Orden");
                        }
                    }
                    break;
                case "noneCursor" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _cursorType = cursorType.None;
                    _cursor.clearCursor();
                    _cursor.detachLabels();
                    $("[data-value=\"cfgCursor" + _widgetId + "\"]").hide();
                    break;
                case "normalCursor" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _cursorType = cursorType.Normal;
                    $("[data-value=\"cfgCursor" + _widgetId + "\"]").hide();
                    _cursor.normalCursor(_velocityValue / 60);
                    break;
                case "harmonicCursor" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _cursorType = cursorType.Harmonic;
                    $("[data-value=\"cfgCursor" + _widgetId + "\"]").show();
                    _harmonicIni = _velocityValue / 60;
                    _cursor.harmonicCursor(_harmonicIni, _harmonicCount);
                    break;
                case "sidebandCursor" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _cursorType = cursorType.SideBand;
                    $("[data-value=\"cfgCursor" + _widgetId + "\"]").show();
                    _sidebandIni = _velocityValue / 60;
                    _cursor.sidebandCursor(_sidebandIni, 4);
                    break;
                case "cfgCursor" + _widgetId:
                    widgetWidth = $("#" + _container.id).width();
                    widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
                    dialogSize = { width: 350, height: 190 };
                    dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
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
                    $("#awContainer").append(configContainer);
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
                        dialogSize.height += 50;
                        $(i + " > div:nth-child(3) > div").append("<div class=\"col-md-5\"><label for=\"bandWidth" + _widgetId + "\" style=\"font-size:12px;\">" +
                          "Ancho de las bandas</label></div>");
                        $(i + " > div:nth-child(3) > div").append("<div class=\"col-md-7\"><input type=\"number\" id=\"bandWidth" + _widgetId + "\" " +
                          "name=\"bandWidth" + _widgetId + "\" style=\"width:100%;\"></div>");
                        $("#sidebandNumber" + _widgetId).val(_sidebandCount);
                        $("#sidebandIni" + _widgetId).val(_sidebandIni);
                        $("#bandWidth" + _widgetId).val(_sidebandWidth);
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
                        width: dialogSize.width,
                        height: dialogSize.height,
                        zIndex: 2000,
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
                        position: {
                            X: dialogPosition.left,
                            Y: dialogPosition.top
                        }
                    });

                    $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("open");

                    $("#btnCancelCount" + _widgetId).click(function (e) {
                        e.preventDefault();
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                    });

                    $("#btnSaveCount" + _widgetId).click(function (e) {
                        if (_cursorType === cursorType.Harmonic) {
                            _harmonicCount = parseFloat($("#harmonicNumber" + _widgetId).val());
                            _harmonicCount = (_harmonicCount > 13) ? 13 : _harmonicCount;
                            _harmonicIni = parseFloat($("#harmonicIni" + _widgetId).val());
                            _cursor.setHarmonicConfig(_harmonicCount, _harmonicIni);
                            _cursor.updateHarmonicPositions();
                        } else {
                            _sidebandCount = parseFloat($("#sidebandNumber" + _widgetId).val());
                            _sidebandCount = (_sidebandCount > 13) ? 13 : _sidebandCount;
                            _sidebandIni = parseFloat($("#sidebandIni" + _widgetId).val());
                            _sidebandWidth = parseFloat($("#bandWidth" + _widgetId).val());
                            _cursor.setSidebandConfig(_sidebandCount, _sidebandIni, _sidebandWidth);
                            _cursor.updateSidebandPositions();
                        }
                        e.preventDefault();
                        $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
                    });
                    break;
                case "exportToExcel" + _widgetId:
                    var
                        contId,
                        name,
                        labels;

                    labels = [];
                    if (timeMode == 0) {
                        name = "Tiempo Real, Espectro de amplitud: " + _assetData.Name;
                    } else if (timeMode == 1) {
                        name = "Histórico, Espectro de amplitud: " + _assetData.Name;
                    }

                    contId = "tableToExcelWaveformGraph" + _widgetId;
                    labels.push(_chart.user_attrs_.xlabel);
                    labels.push(_chart.user_attrs_.ylabel);
                    createTableToExcel(_container, contId, name, labels, _chart.file_, false)
                    tableToExcel("tableToExcelWaveformGraph" + _widgetId, name);
                    break;
                case "noneWindow" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _windowing = clone(windowing.None);
                    dataSrc = GetHalfSpectrum(_chart.waveform_.RawValue, _chart.waveform_.SampleRate, _chart.measureType, _windowing.Value, _velocityValue);
                    dataSrc = _applyDerivative(dataSrc.mag);
                    _currentData = clone(dataSrc);
                    _chart.updateOptions({
                        "file": dataSrc
                    });
                    break;
                case "hammingWindow" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _windowing = clone(windowing.Hamming);
                    dataSrc = GetHalfSpectrum(_chart.waveform_.RawValue, _chart.waveform_.SampleRate, _chart.measureType, _windowing.Value, _velocityValue);
                    dataSrc = _applyDerivative(dataSrc.mag);
                    _currentData = clone(dataSrc);
                    _chart.updateOptions({
                        "file": dataSrc
                    });
                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor();
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions();
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions();
                    }
                    break;
                case "hanningWindow" + _widgetId:
                    children = target.parent().parent().children();
                    for (i = 0; i < children.length; i += 1) {
                        children.eq(i).children().children().eq(0).addClass("fa-square-o").removeClass("fa-check-square");
                    }
                    target.children().eq(0).addClass("fa-check-square").removeClass("fa-square-o");
                    _windowing = clone(windowing.Hanning);
                    dataSrc = GetHalfSpectrum(_chart.waveform_.RawValue, _chart.waveform_.SampleRate, _chart.measureType, _windowing.Value, _velocityValue);
                    dataSrc = _applyDerivative(dataSrc.mag);
                    _currentData = clone(dataSrc);
                    _chart.updateOptions({
                        "file": dataSrc
                    });
                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor();
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions();
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions();
                    }
                    break;
                default:
                    console.log("Opción de menú no implementada.");
                    break;
            }
            return false;
        };

        /*
         * Construye la grafica, caso no exista.
         * @param {Array} labels
         */
        _buildGraph = function (labels, waveformUnits) {
            var
            // Dato inicial necesario para graficar
                initialData,
                canvasCoords,
                // Personalizacion de los eventos de interaccion dentro de la grafica
                customInteractionModel,
                lastClickedGraph,
                headerHeigthPercentage,
                dynamicData;

            lastClickedGraph = null;
            customInteractionModel = {
                mousedown: function (e, g, ctx) {
                    ctx.initializeMouseDown(e, g, ctx);
                    ctx.customFlag = false;
                    if (e.ctrlKey || e.shiftKey) {
                        if (_cursorType === 2) _cursor.clearCursor();
                        Dygraph.startPan(e, g, ctx);
                    } else {
                        Dygraph.startZoom(e, g, ctx);
                    }
                },
                mousemove: function (e, g, ctx) {
                    if (ctx.isPanning) {
                        Dygraph.movePan(e, g, ctx);
                    } else if (ctx.isZooming) {
                        Dygraph.moveZoom(e, g, ctx);
                    }
                },
                mouseup: function (e, g, ctx) {
                    if (ctx.isPanning) {
                        Dygraph.endPan(e, g, ctx);
                        if (_cursorType === 1) {
                            _cursor.updateNormalCursor();
                        } else if (_cursorType === 2) {
                            ctx.customFlag = true;
                            _cursor.updateHarmonicPositions();
                        } else if (_cursorType === 3) {
                            ctx.customFlag = true;
                            _cursor.updateSidebandPositions();
                        }
                    } else if (ctx.isZooming) {
                        Dygraph.endZoom(e, g, ctx);
                        if (ctx.regionHeight > 0 && ctx.regionWidth > 0) {
                            ctx.customFlag = true;
                        }

                        if (_cursorType === 1) {
                            _cursor.updateNormalCursor();
                        } else if (_cursorType === 2) {
                            _cursor.updateHarmonicPositions();
                        } else if (_cursorType === 3) {
                            _cursor.updateSidebandPositions();
                        }
                    }
                },
                contextmenu: function (e, g, ctx) {
                    e.preventDefault();
                    return false;
                },
                click: function (e, g, ctx) {
                    lastClickedGraph = g;
                    e.preventDefault();
                    e.stopPropagation();
                },
                dblclick: function (e, g, ctx) {
                    g.updateOptions({
                        "valueRange": [-(_largestY + _largestDifference) * 0.02, (_largestY + _largestDifference) * 1.02],
                        "dateWindow": [0, g.file_.length]
                    });

                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor();
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions();
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions();
                    }
                },
                mousewheel: function (e, g, ctx) {
                    if (lastClickedGraph !== g) {
                        return;
                    }
                    
                    var
                        normal,
                        percentage,
                        percentages,
                        xPct, yPct;

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
                        _cursor.updateNormalCursor();
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions();
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions();
                    }
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            //$("<div id=\"plotOpts" + _widgetId + "\"><span>&nbsp;</span></div>").insertBefore("#" + _seriesName[0] + _widgetId);
            headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
            _contentBody.style.height = (100 - headerHeigthPercentage) + "%";

            initialData = [];
            initialData.push([1, 0]);
            _chart = new Dygraph(
                _contentBody,
                initialData, {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    xlabel: "Frecuencia [Hz]",
                    ylabel: "Amplitud [" + waveformUnits.split(" ")[0] + "]",
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
                        right = g.toDomCoords(enableFilter ? stopFrecuency : 0, +20);
                        left = left[0];
                        right = right[0];
                        canvas.fillStyle = "rgba(255, 255, 102, 1.0)";
                        canvas.fillRect(left, area.y, right - left, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        dynamicData = "Amplitud: " + (pts[0].yval < 0 ? "" : "&nbsp;") + pts[0].yval.toFixed(2) + " ";// + waveformUnits;
                        if (_isDefaultSelected) {
                            switch (_sensorType) {
                                case 1:
                                    dynamicData += "mG";
                                    break;
                                default:
                                    dynamicData += waveformUnits;
                                    break;
                            }
                        } else {
                            switch (_sensorType) {
                                case 2:
                                case 3:
                                    dynamicData += "mG";
                                    break;
                                default:
                                    dynamicData += waveformUnits;
                                    break;
                            }
                        }

                        if (_currentXUnit === 1) {
                            dynamicData += ", Frecuencia: " + pts[0].xval.toFixed(2) + " Hz";
                        } else {
                            dynamicData += ", Frecuencia: " + parseFloat(pts[0].xval.toFixed(2) / (_velocityValue / 60)).toFixed(2) + " x";
                        }
                        dynamicData += isNaN(_velocityValue) ? "" : ", " + _velocityValue.toFixed(0) + " RPM";
                        if (_cursorType === 2) {
                            dynamicData += ", 1x=";
                            dynamicData += " Hz";
                        }
                        $("#" + pts[0].name + _widgetId + " > span").html(dynamicData);
                    },
                    drawCallback: function (g, is_initial) {
                        if (is_initial) {
                            _cursor = new Cursors(g);
                            $("[data-value=\"cfgCursor" + _widgetId + "\"]").hide();
                            g.canvas_.style.zIndex = 1;
                        }
                    },
                    interactionModel: customInteractionModel,
                    axes: {
                        x: {
                            ticker: function (min, max, pixels, opts, dygraph, vals) {
                                var
                                    ticks,
                                    dataArray,
                                    i, step;

                                if (min !== max) {
                                    if (_currentXUnit === 2) {
                                        dataArray = [];
                                        ticks = _getHarmonicLimits(min, max);
                                        if (ticks.totalPoints === 0) {
                                            return dataArray;
                                        }

                                        if (ticks.totalPoints <= 8) {
                                            for (i = ticks.lowIdx; i < ticks.highIdx; i += 1) {
                                                dataArray.push({ v: parseFloat(_nxArray[i]), label: (i + 1).toString() + "x" });
                                            }
                                        } else {
                                            step = Math.floor((ticks.lowIdx + ticks.highIdx) / 6);
                                            for (i = ticks.lowIdx; i < ticks.highIdx; i += step) {
                                                dataArray.push({ v: parseFloat(_nxArray[i]), label: (i + 1).toString() + "x" });
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
                var headerHeigthPercentage = (_contentHeader.clientHeight + 4) * 100 / _container.clientHeight;
                _contentBody.style.height = (100 - headerHeigthPercentage) + "%";
                setTimeout(function () {
                    _chart.resize();
                    _cursor.resizeCanvas();
                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor();
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions();
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions();
                    }
                }, 100);
            });

            globalsReport.elemDygraph.push({
                "id": _container.id,
                "obj": _chart,
                "src": ""
            });

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
            foo = [increment * bias, increment * (1-bias)];
            return [axis[0] + foo[0], axis[1] - foo[1]];
        };

        /*
         * Suscribe el chart al dato segun el modo definido
         */
        _subscribeToRefresh = function (mdVariableIdList, overall, velocity, overallUnits, timeStamp) {
            var
                waveform;

            timeStamp = new Date(timeStamp).getTime().toString();
            // Subscripcion a evento para refrescar datos de grafica segun _timeMode
            switch (_timeMode) {
                case 0: // Tiempo Real
                    _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                        waveform = data[_waveformSubVariable.Id];
                        if (!isEmpty(waveform) && waveform.Value !== null && waveform.RawValue) {
                            _overallValue = clone(data[overall.Id].Value);
                            if (velocity) {
                                _velocityValue = clone(data[velocity.Id].Value);
                            } else {
                                _velocityValue = NaN;
                            }
                            _chart.waveform_ = clone(waveform);
                            _chart.measureType = overall.MeasureType;
                            _refresh(waveform, _pause, enableFilter, stopFrecuency, _chart, overallUnits, overall.Name, overall.MeasureType);
                        }
                    });
                    break;
                case 1: // Historico
                    _subscription = PublisherSubscriber.subscribe("/historic/refresh", _subVariableIdList, function (data) {
                        waveform = data[_waveformSubVariable.Id][timeStamp];
                        if (!isEmpty(waveform) && waveform.RawValue) {
                            _overallValue = clone(subVariableHTList[overall.Id][timeStamp].Value);
                            if (velocity) {
                                _velocityValue = clone(subVariableHTList[velocity.Id][timeStamp].Value);
                            } else {
                                _velocityValue = NaN;
                            }
                            _chart.waveform_ = clone(waveform);
                            _chart.measureType = overall.MeasureType;
                            _refresh(waveform, _pause, enableFilter, stopFrecuency, _chart, overallUnits, overall.Name, overall.MeasureType);
                        }
                    });
                    new HistoricalTimeMode().GetSingleDynamicHistoricalData([_measurementPoint.Id], _subVariableIdList, timeStamp, _widgetId);
                    _playerSubscription = PublisherSubscriber.subscribe("/player/refresh", null, function (currentTimeStamp) {
                        if (!isNaN(currentTimeStamp)) {
                            waveform = clone(subVariableHTList[_waveformSubVariable.Id][currentTimeStamp]);
                            if (isEmpty(waveform)) {
                                console.error("No se encontró datos de forma de onda.");
                                return;
                            }
                            _velocityValue = NaN;
                            _overallValue = NaN;
                            if (velocity && subVariableHTList[velocity.Id][currentTimeStamp]) {
                                _velocityValue = clone(subVariableHTList[velocity.Id][currentTimeStamp].Value);
                            }
                            if (subVariableHTList[overall.Id][currentTimeStamp]) {
                                _overallValue = clone(subVariableHTList[overall.Id][currentTimeStamp].Value);
                            }
                            _chart.waveform_ = clone(waveform);
                            _chart.measureType = overall.MeasureType;
                            _refresh(waveform, false, enableFilter, stopFrecuency, _chart, overallUnits, overall.Name, overall.MeasureType);
                        }
                    });
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {Array} data Informacion obtenida del poll
         */
        _refresh = function (data, pause, isEnabledFilter, fc, chart, overallUnits, overallName, measureType) {
            if (!pause) {
                var
                    dataSrc,
                    yLabelBase,
                    txt, nxBase, i;

                if (_currentTimeStamp !== data.TimeStamp) {
                    dataSrc = GetHalfSpectrum(data.RawValue, data.SampleRate, measureType, _windowing.Value, _velocityValue);
                    dataSrc = _applyDerivative(dataSrc.mag);
                    _currentData = clone(dataSrc);
                    yLabelBase = chart.user_attrs_.ylabel;
                    _currentTimeStamp = data.TimeStamp;

                    if (!_isDefaultSelected) {
                        switch (_sensorType) {
                            case 2:
                            case 3:
                                _overallValue = _overallValue / 9.806;
                                overallUnits = "mG";
                                break;
                        }
                    }

                    txt = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                    txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                    txt += overallName + ": " + _overallValue.toFixed(2) + " " + overallUnits + ", &nbsp;" + _currentTimeStamp;
                    $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);

                    _nxArray = [];
                    nxBase = Math.round((_velocityValue / 60 + 0.00001) * 100) / 100;
                    if (nxBase > 0) {
                        for (i = nxBase; i < dataSrc.length; i += nxBase) {
                            _nxArray.push(i);
                        }
                    }

                    if (dataSrc.length > 0) {
                        _largestY = arrayColumn(dataSrc, 1).max();
                    }
                    chart.updateOptions({
                        "file": dataSrc,
                        "ylabel": yLabelBase,
                        "valueRange": [-(_largestY + _largestDifference) * 0.02, (_largestY + _largestDifference) * 1.02]
                    });

                    if (typeof _chart.lastx_ === "undefined") {
                        _chart.lastx_ = 0;
                    }
                    i = chart.findClosestRow(chart.toDomXCoord(chart.lastx_));
                    chart.setSelection(i);
                    txt = "Amplitud: " + (chart.selPoints_[0].yval < 0 ? "" : "&nbsp;") + chart.selPoints_[0].yval.toFixed(2) + " ";
                    if (_isDefaultSelected) {
                        switch (_sensorType) {
                            case 1:
                                txt += "mG";
                                break;
                            default:
                                txt += overallUnits;
                                break;
                        }
                    } else {
                        switch (_sensorType) {
                            case 2:
                            case 3:
                                txt += "mG";
                                break;
                            default:
                                txt += overallUnits;
                                break;
                        }
                    }

                    if (_currentXUnit === 1) {
                        txt += ", Frecuencia: " + chart.selPoints_[0].xval.toFixed(2) + " Hz";
                    } else {
                        txt += ", Frecuencia: " + parseFloat(chart.selPoints_[0].xval.toFixed(2) / (_velocityValue / 60)).toFixed(2) + " x";
                    }
                    txt += isNaN(_velocityValue) ? "" : ", " + _velocityValue.toFixed(0) + " RPM";
                    if (_cursorType === 2) {
                        txt += ", 1x=";
                        txt += " Hz";
                    }
                    $("#" + chart.selPoints_[0].name + _widgetId + " > span").html(txt);

                    if (_cursorType === 1) {
                        _cursor.updateNormalCursor();
                    } else if (_cursorType === 2) {
                        _cursor.updateHarmonicPositions();
                    } else if (_cursorType === 3) {
                        _cursor.updateSidebandPositions();
                    }
                    chartScaleY.AttachGraph(_graphType + "/" + _isDefaultSelected, _widgetId, _measurementPoint.SensorTypeCode, _largestY);
                }
            }
        };

        _subscribeToApplyFilter = function () {
            _applyFilterSubscription = PublisherSubscriber.subscribe("/applyfilter", null, function () {
                if (_currentData && _currentData.Value !== null) {
                    _applyFilter(_currentData, _chart);
                }
            });
        };

        _applyFilter = function (currentData, chart, xlabel) {
            if (xlabel) {
                chart.updateOptions({
                    "file": currentData,
                    "xlabel": xlabel
                });
            } else {
                chart.updateOptions({
                    "file": currentData
                });
            }
            if (_isDefaultSelected) {
                _largestY = arrayColumn(currentData, 1).max();
                chartScaleY.AttachGraph(_graphType + "/" + _isDefaultSelected, _widgetId, _measurementPoint.SensorTypeCode, _largestY);
            } else {
                chartScaleY.AttachGraph(_graphType + "/" + _isDefaultSelected, _widgetId, _measurementPoint.SensorTypeCode, arrayColumn(currentData, 1).max());
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

        _subscribeToScaleChart = function () {
            _scaleChartSubscription = PublisherSubscriber.subscribe("/scale/" + _graphType + "/true", [_measurementPoint.SensorTypeCode], function (data) {
                if (data[_measurementPoint.SensorTypeCode] && _isDefaultSelected) {
                    if (!_autoscale && data[_measurementPoint.SensorTypeCode] >= _largestY) {
                        _largestDifference = data[_measurementPoint.SensorTypeCode] - _largestY;
                        if (_largestDifference === 0 && (_chart.axes_[0].maxyval - _largestY) < 1) {
                            return;
                        }
                        _chart.updateOptions({
                            "valueRange": [-(_largestY + _largestDifference) * 0.02, (_largestY + _largestDifference) * 1.02]
                        });
                    }
                }
            });

            _scaleChartAcceleration = PublisherSubscriber.subscribe("/scale/" + _graphType + "/false", [_measurementPoint.SensorTypeCode], function (data) {
                if (data[_measurementPoint.SensorTypeCode] && !_isDefaultSelected) {
                    if (!_autoscale) {
                        _chart.updateOptions({
                            "valueRange": [-data[_measurementPoint.SensorTypeCode] * 0.02, data[_measurementPoint.SensorTypeCode] * 1.02]
                        });
                    }
                }
            });
        };

        _applyDerivative = function (currentData) {
            var
                data,
                yLabelBase,
                spectrumType,
                txt,
                i;

            data = [];
            yLabelBase = _chart.user_attrs_.ylabel;
            spectrumType = $(_contentHeader).children().eq(0).text();
            if (_isDefaultSelected) {
                switch (_sensorType) {
                    case 0:
                    case 1:
                        data = clone(currentData);
                        break;
                    case 2:
                    case 3:
                        data = clone(currentData);
                        yLabelBase = yLabelBase.replace("mG]", "mm/s]");
                        spectrumType = spectrumType.replace(" (Acel) ", " (Vel) ");
                        txt = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                        txt += "Directa: " + _overallValue.toFixed(2) + " mm/s, &nbsp;" + _currentTimeStamp;
                        $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                        break;
                }
            } else {
                switch (_sensorType) {
                    case 0:
                        data = clone(currentData);
                        break;
                    case 1:
                        data = clone(currentData);
                        yLabelBase = yLabelBase.replace("mG]", "mm/s]");
                        spectrumType = spectrumType.replace(" (Acel) ", " (Vel) ");
                        txt = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                        txt += "Directa: " + _overallValue.toFixed(2) + " mm/s, &nbsp;" + _currentTimeStamp;
                        $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                        break;
                    case 2:
                    case 3:
                        for (i = 0; i < currentData.length; i += 1) {
                            data.push([i, currentData[i][1] * 2 * Math.PI * i / 9.806]);
                        }
                        yLabelBase = yLabelBase.replace("mm/s]", "mG]");
                        spectrumType = spectrumType.replace(" (Vel) ", " (Acel) ");
                        txt = _measurementPoint.Name + "&nbsp;&nbsp;Ang:&nbsp;";
                        txt += parseAng(_measurementPoint.SensorAngle) + "&deg;" + ", ";
                        txt += "Directa: " + (_overallValue / 9.806).toFixed(2) + " mG, &nbsp;" + _currentTimeStamp;
                        $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
                        break;
                }
            }
            _chart.user_attrs_.ylabel = yLabelBase;
            $(_contentHeader).children().eq(0).text(spectrumType);
            return data;
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
                // Sensor de referencia angular
                angularReference,
                // Menu de opciones para la grafica
                settingsMenu,
                // Sub-menu de opciones para los tipos de espectro (solo aplica para acelerometro, velocimetro)
                settingsSubmenu,
                // SubVariables del punto de medicion seleccionado, dependiendo del modo
                subVariables,
                // SubVariable global configurada en el sistema
                overallSubVariable,
                // SubVariable de velocidad de la referencia angular
                velocitySubVariable,
                // Minimo ancho del grid
                minWidth,
                // Minimo ancho del grid
                minHeight,
                // Labels
                labels,
                // Listado de Ids de variables a suscribir
                mdVariableListId,
                // Tipo de espectro seleccionado
                selectedSpectrumType,
                // Ruta del activo
                assetPath,
                // Concatena las unidades configuradas para la SubVariable de valor global con el tipo de medida (peak-peak, zero-peak, rms)
                overallUnits;

            switch (_timeMode) {
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
                    _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
                    break;
                default:
                    break;
            }
            if (_measurementPoint.MeasureType !== 4) {
                // Referencia angular
                angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false)
                )[0];
            }
            subVariables = _measurementPoint.SubVariables;

            minWidth = 2;
            minHeight = 2;

            // SubVariables necesarias para la grafica
            _waveformSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
            overallSubVariable = ej.DataManager(subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
            if (angularReference) {
                velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
            }

            if (!_waveformSubVariable) {
                popUp("info", "No existe una subvariable configurada para forma de onda.");
                return;
            }
            _subVariableIdList.push(_waveformSubVariable.Id);

            if (overallSubVariable) {
                _subVariableIdList.push(overallSubVariable.Id);
                overallUnits = overallSubVariable.Units;
                switch (overallSubVariable.MeasureType) {
                    case 1:
                        overallUnits += " p";
                        break;
                    case 2:
                        overallUnits += " pp";
                        break;
                    case 3:
                        overallUnits += " rms";
                        break;
                    default:
                        popUp("info", "La subVariable no corresponde a un tipo de medida pk-pk, 0-pk o rms");
                        return;
                }
            }
            if (velocitySubVariable) {
                _subVariableIdList.push(velocitySubVariable.Id);
            }

            _seriesName = ["Amplitud"];
            assetPath = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("Id", "equal", _assetData.ParentId, false))[0];
            assetPath = _assetData.Name + " - " + assetPath.Name;

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            _sensorType = 0;
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageSpectrum" + _widgetId));
            if (_measurementPoint.SensorTypeCode === 2 || _measurementPoint.SensorTypeCode === 3) {
                settingsSubmenu = [];
                if (_measurementPoint.Integrate && _measurementPoint.SensorTypeCode === 2) {
                    _sensorType = 3;
                } else if (_measurementPoint.SensorTypeCode === 3) {
                    _sensorType = 2;
                } else {
                    _sensorType = 1;
                }

                selectedSpectrumType = (_sensorType === 1) ? "Espectro Aceleración" : "Espectro Velocidad";
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                        "item",
                        "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> " + selectedSpectrumType,
                        "spectrum_1_" + _widgetId
                    ));
                selectedSpectrumType = (_sensorType === 1) ? "Espectro Velocidad" : "Espectro Aceleración";
                settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                   "item",
                   "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> " + selectedSpectrumType,
                   "spectrum_2_" + _widgetId
               ));
                selectedSpectrumType = (_sensorType === 1) ? "(Acel)" : "(Vel)";
                settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Tipo Espectro", "spectrumType" + _widgetId, settingsSubmenu));
            }

            settingsSubmenu = [];
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-check-square\" aria-hidden=\"true\"></i> Frecuencia",
                "frequencyUnit" + _widgetId
            ));
            settingsSubmenu.push(AspectrogramWidget.createSettingsMenuElement(
                "item",
                "<i class=\"fa fa-square-o\" aria-hidden=\"true\"></i> Orden",
                "orderUnit" + _widgetId
            ));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("submenu", "Cambiar unidad abscisa", "abscissaUnit" + _widgetId, settingsSubmenu));

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
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar a Excel", "exportToExcel" + _widgetId));

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
            //settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Zoom", "zoom" + _widgetId));

            selectedSpectrumType = (selectedSpectrumType) ? "Espectro de amplitud " + selectedSpectrumType : "Espectro de amplitud";
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: selectedSpectrumType,
                width: width,
                minWidth: minWidth,
                height: height,
                minHeight: minHeight,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: _timeMode,
                asdaqId: _assetData.AsdaqId,
                atrId: _assetData.AtrId,
                subVariableIdList: _subVariableIdList,
                asset: assetPath,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s/g, "")],
                pause: (_timeMode === 0) ? true : false,
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

            labels = ["Estampa de tiempo"];
            labels.pushArray(_seriesName);
            mdVariableListId = [_measurementPoint.Id];
            if (angularReference) {
                mdVariableListId.push(angularReference.Id);
            }
            // Se suscribe a la notificacion de llegada de nuevos datos.
            _subscribeToRefresh(mdVariableListId, overallSubVariable, velocitySubVariable, overallUnits, timeStamp);
            // Se suscribe a la notificación de aplicación de filtro dinámico para la forma de onda
            _subscribeToApplyFilter();
            // Se suscribe a la notificación de aplicación de resize para el chart Dygraph
            _subscribeToResizeChart();
            // Se suscribe a la notificacion escala en Y por mayor valor.
            _subscribeToScaleChart();
            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Construir y mostrar grafica.
            _buildGraph(labels, overallUnits);
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
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

            if (_scaleChartSubscription) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                _scaleChartSubscription.remove();
                chartScaleY.DetachGraph(_graphType + "/true", _widgetId, _measurementPoint.SensorTypeCode);
            }

            if (_scaleChartAcceleration) {
                // Eliminar suscripcion de notificaciones para escala en Y basado en el mayor valor
                // segun el tipo de sensor y por cada grafico diferente
                _scaleChartAcceleration.remove();
                chartScaleY.DetachGraph(_graphType + "/false", _widgetId, _measurementPoint.SensorTypeCode);
            }

            var grid, el;
            if (_chart) _chart.destroy();
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();

            //$.each(globalsReport.elemDygraph, function (i) {
            //    if (globalsReport.elemDygraph[i].id === _container.id) {
            //        globalsReport.elemDygraph.splice(i, 1);
            //        return false;
            //    }
            //});
        };
    };

    return SpectrumGraph;
})();