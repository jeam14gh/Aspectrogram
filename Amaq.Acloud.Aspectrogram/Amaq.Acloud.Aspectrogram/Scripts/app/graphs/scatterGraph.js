/*
 * scatterGraph.js
 * Grafico de dispersion.
 * @author Jorge Calderon
 */

var ScatterGraph = {};

ScatterGraph = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ScatterGraph = function (timeMode, width, height, aspectRatio) {
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
            // Auto-referencia a la clase OrbitGraph
            _this,
            // Referencia al chart
            _chart,
            // Referencia al Id del widget
            _widgetId,
            // Tipo de grafico Aspectrogram, necesario en AspectrogramWidget para gestionar la cache de elementos abiertos
            _graphType,
            // Rango maximo y minimo del grafico, tanto en el eje X como en el eje Y
            _graphRange,
            // Listado de nombres de las series en la grafica
            _seriesName,
            // Informacion del activo al que estan relacionados los puntos de medicion
            _assetData,
            // Objeto cuyas propiedades corresponden a informacion relacionada al punto de medicion
            _measurementPoint,
            // Metodo privado que realiza el control de los modelos de interaccion de eventos sobre la grafica
            _customInteractionModel,
            // Callback de evento clic sobre algun item del menu de opciones
            _onSettingsMenuItemClick,
            // Metodo complementario a los modelos de interaccion para encontrar el punto sobre la grafica mas proximo
            _findClosestPoint,
            // Metodo complementario a los modelos de interaccion para seleccionar el punto mas proximo sobre la grafica
            _updateSelection,
            // Metodo privado que construye el chart caso no exista
            _buildGraph,
            // Referencia a la suscripcion para aplicar resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _resizeChartSubscription,
            // Metodo privado que aplica resize al chart Dygraph, necesario para resolver bug de renderizado de Dygraph
            _subscribeToResizeChart,
            // Menu que permite la seleccion tanto de la subVariable en X como de la subVariable en Y
            _menuXYSelection,
            // Metodo privado que realiza la gestion de los datos
            _getHistoricalData,
            // Unidad de la medida seleccionada en el eje X
            _xUnit,
            // Unidad de la medida seleccionada en el eje Y
            _yUnit,
            // Id de la subvariable seleccionada en el eje X
            _selectedXSubVariableId,
            // Id de la subvariable seleccionada en el eje Y
            _selectedYSubVariableId,
            // Rango del historico que se esta mostrando
            _historicalRange,
            // Color del punto de medicion seleccionado en el grafico historico
            _currentColor;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto
         */
        _pause = (timeMode == 0) ? false : true;
        _movableGrid = false;
        _this = this;
        _graphType = "scatter";
        _widgetId = Math.floor(Math.random() * 100000);
        _graphRange = {};
        _measurementPoint = {};

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = _graphType + "Graph" + _widgetId;
        _container.style.width = "100%";
        _container.style.height = "100%";
        _contentHeader = document.createElement("div");
        _contentHeader.id = _graphType + "Header" + _widgetId;
        _contentHeader.style.width = "100%";
        _contentHeader.style.paddingLeft = "15px";
        _contentHeader.style.paddingTop = "5px";
        $(_container).append(_contentHeader);
        _contentBody = document.createElement("div");
        _contentBody.id = _graphType + "Body" + _widgetId;
        _contentBody.style.width = "100%";
        _contentBody.style.height = "90%";
        $(_container).append(_contentBody);

        /*
         * Callback de evento click sobre algun item del menu de opciones
         * @param {Object} event Argumentos del evento
         */
        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var
                target,
                settingsMenuItem,
                numericSubVariables;

            target = $(event.currentTarget);
            settingsMenuItem = target.attr("data-value");
            switch (settingsMenuItem) {
                case "refreshXY" + _widgetId:
                    numericSubVariables = ej.DataManager(_measurementPoint.SubVariables).executeLocal(
                        new ej.Query().where("ValueType", "equal", 1, false));
                    _menuXYSelection(numericSubVariables);
                    break;
            }
        };

        /*
         * Construye la grafica, caso no exista
         */
        _buildGraph = function (subVariables, isInitial, dataSrc, xName, yName) {
            if (_chart) {
                _chart.destroy();
            }

            if (!isInitial) {
                _graphRange.X = dataSrc.rangeX;
                _graphRange.Y = dataSrc.rangeY;
                dataSrc = clone(dataSrc.value);
            }

            var
                // Dato dinamico por accion de movimiento del mouse sobre la grafica
                dynamicData;

            _chart = new Dygraph(
                _contentBody,
                dataSrc,
                {
                    colors: ["#006ACB"],
                    digitsAfterDecimal: 4,
                    legend: "never",
                    labels: ["X", "Y"],
                    xlabel: (isInitial) ? null : xName + " [" + _xUnit + "]",
                    ylabel: (isInitial) ? null : yName + " [" + _yUnit + "]",
                    dateWindow: (isInitial) ? null : [_graphRange.X[0], _graphRange.X[1]],
                    valueRange: (isInitial) ? null : [_graphRange.Y[0], _graphRange.Y[1]],
                    axisLabelFontSize: 10,
                    labelsDivWidth: 0,
                    hideOverlayOnMouseOut: false,
                    strokeWidth: 0,
                    drawPoints: true,
                    pointSize: 2,
                    underlayCallback: function (canvas, area, g) {
                        canvas.strokeStyle = "black";
                        canvas.strokeRect(area.x, area.y, area.w, area.h);
                    },
                    highlightCallback: function (e, x, pts, row) {
                        if (pts.length > 0 && _xUnit && _yUnit) {
                            dynamicData = xName + ": " + (pts[0].xval < 0 ? "" : "&nbsp;") + pts[0].xval.toFixed(2) + " " + _xUnit;
                            dynamicData += ", " + yName + ": " + pts[0].yval.toFixed(2) + " " + _yUnit;
                            $("#XY" + _widgetId + " > span").html(dynamicData);
                        }
                    },
                    interactionModel: _customInteractionModel,
                    axes: {
                        y: {
                            axisLabelWidth: 40,
                        }
                    }
                }
            );

            $(".grid-stack-item").on("resizestop", function () {
                setTimeout(function () {
                    _chart.resize();
                }, 100);
            });

            _chart.ready(function () {
                // Crear dialogo para preguntar el rango de tiempo que se desea abrir y las subvariables X + Y
                // Capturar tambien la unidad de X + Y (_xUnit, _yUnit)                
                if (isInitial) {
                    _menuXYSelection(subVariables);
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
            _chart.cascadeEvents_("select", {
                selectedRow: _chart.lastRow_,
                selectedX: _chart.lastx_,
                selectedPoints: _chart.selPoints_
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
                    point = _chart.selPoints_[i];
                    if (!Dygraph.isOK(point.canvasy)) continue;
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
                ctx.restore();
                _chart.previousVerticalX_ = canvasx;
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
                        if (row != _chart.lastRow_) {
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
                            if (setRow < points.length && points[setRow].idx == row) {
                                point = points[setRow];
                                if (point.yval !== null && !isNaN(point.yval)) {
                                    _chart.selPoints_.push(point);
                                }
                            } else {
                                for (pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                                    point = points[pointIdx];
                                    if (point.idx == row) {
                                        if (point.yval !== null && !isNaN(point.yval)) {
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
                            _updateSelection(undefined);
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
         * Metodo que ofrece la posibilidad de abrir un menu contextual para seleccionar las medidas a graficar
         */
        _menuXYSelection = function (subVariables) {
            var
                i, x, y,
                currentXIndex,
                currentYIndex,
                widgetWidth,
                widgetPosition,
                dialogSize,
                dialogPosition,
                configContainer;

            widgetWidth = $("#" + _container.id).width();
            widgetPosition = $("#" + _container.id).parents(".grid-stack-item").first().position();
            dialogSize = { width: 350, height: 220 };
            dialogPosition = { top: widgetPosition.top + 10, left: (widgetPosition.left + (widgetWidth / 2) - (dialogSize.width / 2)) };
            configContainer = $("#graphConfigAreaDialog").clone();
            configContainer.css("display", "block");
            configContainer[0].id = _widgetId + "shaft";
            $("#awContainer").append(configContainer);
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-5\"><label for=\"xSubVariableId\" " +
              "style=\"font-size:12px;\">Medida en eje horizontal</label></div>");
            $("#" + configContainer[0].id + "> div.graphConfigArea > div > form > div > div").append("<div class=\"col-md-7\"><select id=\"xSubVariableId\"></select></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-5\"><label for=\"ySubVariableId\" " +
              "style=\"font-size:12px;\">Medida en eje vertical</label></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(2) > div").append("<div class=\"col-md-7\">" +
                "<select id=\"ySubVariableId\"></select></div>");
            currentXIndex = -1;
            currentYIndex = -1;
            for (i = 0; i < subVariables.length; i += 1) {
                if (subVariables[i].Id === _selectedXSubVariableId) {
                    currentXIndex = i;
                }
                if (subVariables[i].Id === _selectedYSubVariableId) {
                    currentYIndex = i;
                }
                $("#xSubVariableId").append("<option value=\"" + subVariables[i].Id + "\">" + subVariables[i].Name + "</option>");
                $("#ySubVariableId").append("<option value=\"" + subVariables[i].Id + "\">" + subVariables[i].Name + "</option>");
            }
            $("#xSubVariableId").ejDropDownList({
                watermarkText: "Seleccione",
                selectedIndex: currentXIndex,
                width: "100%",
                allowVirtualScrolling: true,
                virtualScrollMode: "continuous",
                itemsCount: 5,
                change: function (args) {
                    var
                        i,
                        items,
                        indexToDisable;

                    indexToDisable = -1;
                    items = $("#ySubVariableId").data("ejDropDownList").getListData();
                    for (i = 0; i < items.length; i += 1)
                    {
                        $("#ySubVariableId").data("ejDropDownList").enableItemsByIndices(i);
                        if (items[i].value === args.selectedValue) {
                            indexToDisable = i;
                        }
                    }
                    if (indexToDisable >= 0) {
                        $("#ySubVariableId").data("ejDropDownList").disableItemsByIndices(indexToDisable);
                    }
                },
                create: function (args) {
                    if (currentYIndex >= 0) {
                        $("#xSubVariableId").data("ejDropDownList").disableItemsByIndices(currentYIndex);
                    }
                }
            });
            $("#ySubVariableId").ejDropDownList({
                watermarkText: "Seleccione",
                selectedIndex: currentYIndex,
                width: "100%",
                allowVirtualScrolling: true,
                virtualScrollMode: "continuous",
                itemsCount: 5,
                change: function onChange(args) {
                    var
                        i,
                        items,
                        indexToDisable;

                    indexToDisable = -1;
                    items = $("#xSubVariableId").data("ejDropDownList").getListData();
                    for (i = 0; i < items.length; i += 1) {
                        $("#xSubVariableId").data("ejDropDownList").enableItemsByIndices(i);
                        if (items[i].value === args.selectedValue) {
                            indexToDisable = i;
                        }
                    }
                    if (indexToDisable >= 0) {
                        $("#xSubVariableId").data("ejDropDownList").disableItemsByIndices(indexToDisable);
                    }
                },
                create: function (args) {
                    if (currentXIndex >= 0) {
                        $("#ySubVariableId").data("ejDropDownList").disableItemsByIndices(currentXIndex);
                    }
                }
            });
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form").append("<div class=\"form-group zeroMarginBottom\"><div class=\"row\"></div></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(3) > div").append("<div style=\"text-align: center;\"></div>");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnSaveSelection" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnSaveSelection" + _widgetId).append("<i class=\"fa fa-save\"></i> Guardar");
            $("#" + configContainer[0].id + " > div.graphConfigArea > div > form > div:nth-child(3) > div > div:nth-child(1)").append("\n<a id=\"btnCancelSelection" +
              _widgetId + "\" class=\"btn btn-sm btn-primary\" href=\"#\">");
            $("#btnCancelSelection" + _widgetId).append("<i class=\"fa fa-close\"></i> Cancelar");
            $("#" + configContainer[0].id + " > div.graphConfigArea").attr("title", "Seleccionar medidas");
            $("#" + configContainer[0].id + " > div.graphConfigArea").ejDialog({
                enableResize: false,
                title: "Seleccionar medidas",
                width: dialogSize.width,
                height: dialogSize.height,
                zIndex: 2000,
                close: function () {
                    $("#btnCancelSelection" + _widgetId).off("click");
                    $("#btnSaveSelection" + _widgetId).off("click");
                    $("#xSubVariableId").ejDropDownList("destroy");
                    $("#ySubVariableId").ejDropDownList("destroy");
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

            $("#btnCancelSelection" + _widgetId).click(function (e) {
                e.preventDefault();
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });

            $("#btnSaveSelection" + _widgetId).click(function (e) {
                e.preventDefault();
                _selectedXSubVariableId = $("#xSubVariableId_hidden").val();
                _selectedYSubVariableId = $("#ySubVariableId_hidden").val();
                if (!_selectedXSubVariableId || !_selectedYSubVariableId) {
                    alert("Falta validar");
                    return;
                }
                x = new ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("Id", "equal", _selectedXSubVariableId, false))[0];
                y = new ej.DataManager(subVariables).executeLocal(
                    new ej.Query().where("Id", "equal", _selectedYSubVariableId, false))[0];
                _xUnit = x.Units;
                _yUnit = y.Units;
                _getHistoricalData(x.Name, y.Name, x.Maximum, x.Minimum, y.Maximum, y.Minimum);
                $("#" + configContainer[0].id + " div.graphConfigArea").ejDialog("close");
            });
        };

        /*
         * Obtiene la informacion historica asociada al grafico
         */
        _getHistoricalData = function (xName, yName, xMax, xMin, yMax, yMin) {
            var
                i,
                // Fecha actual durante la iteracion del rango historico
                timeStamp,
                // Texto informativo sobre el punto de medicion
                txt,
                // Fecha de inicio real, esto es segun el primer dato ordenado por estampa de tiempo que coincide con la consulta
                startDate,
                // Fecha de fin real, esto es segun el ultimo dato ordenado por estampa de tiempo que coincide con la consulta
                endDate,
                // Valores de la serie de dispersion
                data,
                // Valores en X,Y de cada iteracion
                x, y;

            data = {
                value: []
            };
            for (i = 0; i < _historicalRange.length; i += 1) {
                timeStamp = new Date(_historicalRange[i]).getTime();
                x = subVariableHTList[_selectedXSubVariableId][timeStamp].Value;
                y = subVariableHTList[_selectedYSubVariableId][timeStamp].Value;
                data.value.push([x, y]);
            }
            data.rangeX = [xMin, xMax];
            data.rangeY = [yMin, yMax];
            startDate = new Date(_historicalRange[0]);
            endDate = new Date(_historicalRange[_historicalRange.length - 1]);
            txt = "<b style=\"color:" + _currentColor + ";\">" + _measurementPoint.Name + "</b>:&nbsp;";
            txt += "(" + formatDate(startDate) + " - " + formatDate(endDate) + ")";
            $("#" + _measurementPoint.Name.replace(/\s/g, "") + _widgetId + " > span").html(txt);
            _buildGraph(null, false, data, xName, yName);
        };

        /*
         * Metodo que permite estar suscrito a las ordenes de redimension de los graficos
         */
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

        /*
         * Metodo de invocacion inicial que crea el widget e inicializa el chart
         */
        this.Show = function (measurementPointId, currentColor, historicalRange) {
            var
                // Listado de Ids de SubVariables
                subVariableIdList,
                // Dato inicial necesario para graficar
                initialData,
                // Menu de opciones para la grafica
                settingsMenu,
                // SubVariables numericas asociadas al punto de medicion
                numericSubVariables;

            _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", measurementPointId, false))[0];
            _assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                new ej.Query().where("AssetId", "equal", _measurementPoint.ParentId, false))[0];
            _seriesName = ["XY"];
            _historicalRange = clone(historicalRange);
            _currentColor = clone(currentColor);
            subVariableIdList = ej.DataManager(_measurementPoint.SubVariables).executeLocal(new ej.Query().select("Id"));
            numericSubVariables = ej.DataManager(_measurementPoint.SubVariables).executeLocal(
                new ej.Query().where("ValueType", "equal", 1, false));

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Cambiar valores XY", "refreshXY" + _widgetId));

            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Dispersión",
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                graphType: _graphType,
                timeMode: timeMode,
                asdaqId: _assetData.AsdaqId,
                atrId: _assetData.AtrId,
                subVariableIdList: subVariableIdList,
                asset: _assetData.Name,
                seriesName: _seriesName,
                measurementPointList: [_measurementPoint.Name.replace(/\s/g, "")],
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
                    var
                        grid;

                    grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    $(".grid-stack").data("gridstack").movable(grid, _movableGrid);
                }
            });

            // Abrir AspectrogramWidget.
            _aWidget.open();
            // Se suscribe a la notificacion de aplicacion de resize para el chart Dygraph
            _subscribeToResizeChart();
            // Construir y mostrar grafica.
            initialData = [[0,0]];
            _buildGraph(numericSubVariables, true, initialData);
        };

        /*
         * Metodo invocado al cerrar el grafico
         */
        this.Close = function () {
            if (_resizeChartSubscription) {
                // Eliminar suscripción de notificaciones para aplicar resize al chart Dygraph
                _resizeChartSubscription.remove();
            }

            if (_chart) {
                _chart.destroy();
            }
            $(".grid-stack").data("gridstack").removeWidget($(_container).parents().eq(2));
            $(_container).remove();
        };
    };

    return ScatterGraph;
})();
