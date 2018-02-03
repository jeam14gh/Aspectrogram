/*
 * AMAQ 2016
 * Menu contextual para las diferentes necesidades del sistema
 * @author Jorge Calderon
 */

var CustomContextMenu = {};

CustomContextMenu = (function () {
    "use strict";

    /*
     * Constructor
     */
    CustomContextMenu = function () {
        // Variables privadas
        var
            // Contenedor para el menu contextual por punto especifico del historico
            _containerByTimeStamp,
            // Contenedor para el menu contextual por rango de tiempo en el historico
            _containerByRange,
            // Referencia al punto de medicion sobre la grafica de tendencia
            _currentMeasurementPoint,
            // Estampa de tiempo del punto sobre el que se abrio el menu contextual
            _currentTimeStamp,
            // Referencia a la clase CustomContextMenu
            _this,
            // Valor aleatorio que sirve como base para el identificador unico del widget
            _rnd,
            _historicalRange,
            _rpmPositions;

        // Inicializacion de variables
        _this = this;
        _rnd = Math.floor(Math.random() * 100000);

        // Metodos publicos

        /*
         * Menu sobre puntos especificos en la historia
         */
        this.CreateMenuByTimeStamp = function (parent) {
            var
                graph,
                ulEl,
                currentColor,
                pairColor,
                measurementPoint,
                assetData;

            // Contenedor para el menu contextual
            _containerByTimeStamp = document.createElement("div");
            _containerByTimeStamp.id = "historicCtxMenu" + _rnd;
            _containerByTimeStamp.className = "customContextMenu";
            ulEl = document.createElement("ul");
            $(ulEl).append("<li id=\"menuWaveform" + _rnd + "\" class=\"menuWaveform\">Forma de onda</li>");
            $(ulEl).append("<li id=\"menuSpectrum" + _rnd + "\" class=\"menuSpectrum\">Espectro de magnitud</li>");
            $(ulEl).append("<li id=\"menuFullSpectrum" + _rnd + "\" class=\"menuFullSpectrum\">Espectro de órbita</li>");
            $(ulEl).append("<li id=\"menuOrbit" + _rnd + "\" class=\"menuOrbit\">Órbita</li>");
            $(ulEl).append("<li id=\"menuBarChart" + _rnd + "\" class=\"menuBarChart\">Gráfico de barras</li>");
            $(ulEl).append("<li id=\"menuViewer3D" + _rnd + "\" class=\"menuViewer3D\">Visor 3D</li>");
            
            $(_containerByTimeStamp).append(ulEl);
            _currentMeasurementPoint = document.createElement("input");
            _currentMeasurementPoint.id = "measurementPointId" + _rnd;
            _currentMeasurementPoint.type = "hidden";
            _currentMeasurementPoint.value = "";
            _currentTimeStamp = document.createElement("input");
            _currentTimeStamp.id = "measurementPointId" + _rnd;
            _currentTimeStamp.type = "hidden";
            _currentTimeStamp.value = "";
            $(_containerByTimeStamp).append(_currentMeasurementPoint);
            $(_containerByTimeStamp).append(_currentTimeStamp);
            // Agregamos el contenedor del menu contextual al DOM
            $(parent).append(_containerByTimeStamp);
            $(_containerByTimeStamp).click(function (e) {
                // Si la opcion esta desactivada, no hacer nada
                if (e.target.className == "disabled") {
                    return false;
                } else {
                    // Gestionamos la accion especifica
                    switch (e.target.id) {
                        case "menuWaveform" + _rnd:
                            graph = new WaveformGraph(1, 6, 4, true);
                            graph.Show($(_currentMeasurementPoint).val(), $(_currentTimeStamp).val());
                            break;
                        case "menuSpectrum" + _rnd:
                            graph = new SpectrumGraph(1, 6, 4, true);
                            graph.Show($(_currentMeasurementPoint).val(), $(_currentTimeStamp).val());
                            break;
                        case "menuFullSpectrum" +_rnd:
                            graph = new FullSpectrumGraph(1, 12, 5, true);
                            graph.Show($(_currentMeasurementPoint).val(), $(_currentTimeStamp).val());
                            break;
                        case "menuOrbit" + _rnd:
                            currentColor = $(_currentMeasurementPoint).attr("currentColor");
                            pairColor = $(_currentMeasurementPoint).attr("pairColor");
                            graph = new OrbitGraph(1, 12, 5, false);
                            graph.Show($(_currentMeasurementPoint).val(), $(_currentTimeStamp).val(), currentColor, pairColor);
                            break;
                        case "menuBarChart" + _rnd:
                            graph = new BarChartGraph(1, 12, 4, true);
                            graph.Show($(_currentMeasurementPoint).val(), $(_currentTimeStamp).val());
                            break;
                        case "menuViewer3D" + _rnd:
                            measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                                new ej.Query().where("Id", "equal", $(_currentMeasurementPoint).val(), false))[0];
                            assetData = new ej.DataManager(mainCache.loadedAssets).executeLocal(
                                new ej.Query().where("Id", "equal", measurementPoint.ParentNodeId, false))[0];
                            graph = new App3d(1, 12, 6, false, assetData.Id, "Viewer");
                            graph.Show("Visor 3D", $(_currentMeasurementPoint).val(), $(_currentTimeStamp).val());
                            break;
                    }
                    // Cerramos el menu contextual
                    $(_containerByTimeStamp).css("display", "none");
                }
            });
        };

        this.OpenMenuByTimeStamp = function (top, left, currentMeasurementPoint, currentTimeStamp, currentColor, pairColor) {
            $(_containerByTimeStamp).css("display", "block");
            $(_containerByTimeStamp).css("top", top);
            $(_containerByTimeStamp).css("left", left);
            $(_currentMeasurementPoint).val(currentMeasurementPoint);
            $(_currentMeasurementPoint).attr("currentColor", currentColor);
            $(_currentMeasurementPoint).attr("pairColor", pairColor);
            $(_currentTimeStamp).val(currentTimeStamp);
        };

        /*
         * Menu contextual para rangos de tiempo sobre el grafico historico
         */
        this.CreateMenuByRange = function (parent) {
            var
                graph,
                ulEl,
                graph2,
                currentColor,
                pairColor;

            // Contenedor para el menu contextual
            _containerByRange = document.createElement("div");
            _containerByRange.id = "historicRangeCtxMenu" + _rnd;
            _containerByRange.className = "customContextMenu";
            ulEl = document.createElement("ul");
            //$(ulEl).append("<li id=\"saveAsPng" + _rnd + "\" class=\"saveAsPng\">Guardar imagen</li>");
            $(ulEl).append("<li id=\"shaftPlot" + _rnd + "\" class=\"shaftPositionMenu\">Posición del eje</li>");
            $(ulEl).append("<li id=\"bodePlot" + _rnd + "\" class=\"bodePlotMenu\">Bode</li>");
            $(ulEl).append("<li id=\"polarPlot" + _rnd + "\" class=\"polarPlotMenu\">Polar</li>");
            $(ulEl).append("<li id=\"cascadePlot" + _rnd + "\" class=\"cascadePlotMenu\">Cascada</li>");
            $(ulEl).append("<li id=\"fSCascadePlot" + _rnd + "\" class=\"fSCascadePlotMenu\">Cascada de Órbita</li>");
            $(ulEl).append("<li id=\"cascadeRPMPlot" + _rnd + "\" class=\"cascadeRPMPlotMenu\">Cascada RPM</li>");
            $(ulEl).append("<li id=\"fSCascadeRPMPlot" + _rnd + "\" class=\"fSCascadeRPMPlotMenu\">Cascada de Órbita RPM</li>");
            $(ulEl).append("<li id=\"scatterPlot" + _rnd + "\" class=\"scatterPlotMenu\">Dispersión</li>");

            $(_containerByRange).append(ulEl);
            _currentMeasurementPoint = document.createElement("input");
            _currentMeasurementPoint.id = "measurementPointId" + _rnd;
            _currentMeasurementPoint.type = "hidden";
            _currentMeasurementPoint.value = "";
            $(_containerByRange).append(_currentMeasurementPoint);
            // Agregamos el contenedor del menu contextual al DOM
            $(parent).append(_containerByRange);
            $(_containerByRange).click(function (e) {
                // Si la opcion esta desactivada, no hacer nada
                if (e.target.className == "disabled") {
                    return false;
                } else {
                    // Gestionamos la accion especifica
                    switch (e.target.id) {
                        case "shaftPlot" + _rnd:
                            currentColor = $(_currentMeasurementPoint).attr("currentColor");
                            pairColor = $(_currentMeasurementPoint).attr("pairColor");
                            graph = new ShaftPositionGraph(1, 6, 6, true);
                            graph.Show($(_currentMeasurementPoint).val(), currentColor, pairColor, _historicalRange, _rpmPositions);
                            break;
                        case "bodePlot" + _rnd:
                            currentColor = $(_currentMeasurementPoint).attr("currentColor");
                            graph = new BodeGraph(1, 6, 4, true);
                            graph.Show($(_currentMeasurementPoint).val(), currentColor, _historicalRange, _rpmPositions);
                            break;
                        case "polarPlot" + _rnd:
                            currentColor = $(_currentMeasurementPoint).attr("currentColor");
                            graph = new PolarGraph(1, 5, 5, true);
                            graph.Show($(_currentMeasurementPoint).val(), currentColor, _historicalRange, _rpmPositions);
                            break;
                        case "fSCascadePlot" + _rnd:
                            graph2 = new App3d(1, 12, 6, false, $(_currentMeasurementPoint).val(), "FullSpecWaterfall", _historicalRange.length);
                            graph2.containerHistoricalId = parent;
                            graph2.Show("Cascada de Órbita", $(_currentMeasurementPoint).val(), null, _historicalRange, _rpmPositions);
                            break;
                        case "cascadePlot" + _rnd:                            
                            graph = new App3d(1, 12, 6, false, $(_currentMeasurementPoint).val(), "Waterfall", _historicalRange.length);
                            graph.containerHistoricalId = parent;
                            graph.Show("Cascada", $(_currentMeasurementPoint).val(), null, _historicalRange, _rpmPositions);
                            break;
                        case "fSCascadeRPMPlot" + _rnd:
                            graph2 = new App3d(1, 12, 6, false, $(_currentMeasurementPoint).val(), "FullSpecWaterfallRPM", _rpmPositions.length);
                            graph2.containerHistoricalId = parent;
                            graph2.Show("Cascada de Órbita RPM", $(_currentMeasurementPoint).val(), null, _historicalRange, _rpmPositions);
                            break;
                        case "cascadeRPMPlot" + _rnd:
                            graph = new App3d(1, 12, 6, false, $(_currentMeasurementPoint).val(), "WaterfallRPM", _rpmPositions.length);
                            graph.containerHistoricalId = parent;
                            graph.Show("Cascada RPM", $(_currentMeasurementPoint).val(), null, _historicalRange, _rpmPositions);
                            break;
                        case "scatterPlot" + _rnd:
                            currentColor = $(_currentMeasurementPoint).attr("currentColor");
                            graph = new ScatterGraph(1, 12, 6, false);
                            graph.Show($(_currentMeasurementPoint).val(), currentColor, _historicalRange);
                            break;
                    }
                    // Cerramos el menu contextual
                    $(_containerByRange).css("display", "none");
                }
            });
        };

        this.OpenMenuByRange = function (top, left, currentMeasurementPoint, currentColor, pairColor, historicalRange, historicalRpmPositions) {
            $(_containerByRange).css("display", "block");
            $(_containerByRange).css("top", top);
            $(_containerByRange).css("left", left);
            $(_currentMeasurementPoint).val(currentMeasurementPoint);
            $(_currentMeasurementPoint).attr("currentColor", currentColor);
            $(_currentMeasurementPoint).attr("pairColor", pairColor);
            _historicalRange = historicalRange;
            _rpmPositions = historicalRpmPositions;
        };
    };

    return CustomContextMenu;
})();

