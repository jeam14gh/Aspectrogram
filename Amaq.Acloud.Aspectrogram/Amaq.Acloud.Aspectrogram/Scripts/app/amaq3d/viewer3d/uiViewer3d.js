/*
 * UiViewer3d.js
 * Generacion de DOM para Interfaz de Usuario de Visor 3D
 */

var UiViewer3d = {};

UiViewer3d = (function ()
{
    "use strict";

    /*
     * Constructor.
     */
    UiViewer3d = function (idEntity, loadedCanvas, loadedData, wId) {

        var _scene,
            _containerId,
            _container,
            _utilities,
            _createIndicators,
            _createMenu,
            _createContextMenu3d,
            _srcImages,
            _imgViewer3d,
            _mainMenu,
            _colorsConfig = nodes[idEntity + wId].Properties3d.colors,
            _typeChartColor,
            _contextMenu3d,
            _indicators,
            _chooseFunction,
            _showTooltip,
            _hideShowHousing,
            _hideShowTransparency,
            _hideShowWireframe,
            _showTrend,
            _showSpectrum,
            _showSpectrum100p,
            _showOrbital,
            _showOrbital1X,
            _showOrbitalShaftDef,
            _showSCL,
            _showWaterfall,
            _showExternalSignal,
            _showExternalTrend,
            _showExternalBarChart,
            _showExternalSpectrum,
            _showExternalOrbital,
            _showExternalSCL,
            _loadViewInitial,
            _saveImageViewer,
            _changeToPerspectiveCamera,
            _changeToOrtographicCamera,
            _loadInFullScreen,
            _openDivConfig,
            _loadFilteredData,
            _changeClearColor,
            _changeWireframe,
            _changeBG,
            _changeBL,
            _changeLC,
            _flags,
            _date = new Date(),
            _options,
            _createAxisDiv,
            _removeElementsSubVarList,
            _showTooltipCtxt,
            _eventsIndicators,
            _loadVblesCategory,
            _tiposDeMedida = [];
            //_loadData = new LoadDataViewer3d(idEntity);


        _flags = globals3d.flags[idEntity + wId];

        _srcImages = "../Content/images/viewer3d/";

        _options = {
            weekday: "long", year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", minute: "2-digit"
        };

        _containerId = viewer3d.containerCanvas[idEntity + wId].id;
        _container = $("#" + _containerId);

        _scene = viewer3d.scene[idEntity + wId];

        _utilities = new Utilities3d(idEntity, "Viewer", wId);
        _imgViewer3d = new ImgViewer3d(idEntity, wId);

        globals3d.filteredSV[idEntity + wId] = [];

        var scope = this;

        this.timeMode = 0;
        this.valueColor = null;


        _hideShowHousing = function () {
            _utilities.convertAssetInWireframe(false);
            _flags.machineView.wireframe = false;
            _utilities.convertAssetInWhiteTransparent(false);
            _flags.machineView.transparent = false;
            _utilities.takeAwayHousing(!_flags.machineView.housing);
        };
        _hideShowWireframe = function () {
            _utilities.takeAwayHousing(false);
            _flags.machineView.housing = false;
            _utilities.convertAssetInWhiteTransparent(false);
            _flags.machineView.transparent = false;
            _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
        };
        _hideShowTransparency = function () {
            _utilities.takeAwayHousing(false);
            _flags.machineView.housing = false;
            _utilities.convertAssetInWireframe(false);
            _flags.machineView.wireframe = false;
            _utilities.convertAssetInWhiteTransparent(!_flags.machineView.transparent);
        };
        _showTrend = function () {
            _flags.machineView.wireframe = false;
            _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
            loadedCanvas.disposePlots(idEntity);
            loadedCanvas.loadPlots('trend', idEntity);
            loadedCanvas.changePositionText(idEntity, "trend");
            loadedCanvas.opacityProbes(idEntity, 0.4);
            loadedData.drawChartTrend();
        };
        _showSpectrum = function () {
            if (!_flags.plots['spec']) {
                _flags.machineView.wireframe = false;
                _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
                loadedCanvas.disposePlots(idEntity);
                loadedCanvas.loadPlots('spec', idEntity);
                loadedCanvas.changePositionText(idEntity, "spec");
                loadedCanvas.opacityProbes(idEntity, 0.4);
            }
            loadedData.drawChartsWaveform();
        };
        _showSpectrum100p = function () {
            if (!_flags.plots['spec100p']) {
                _flags.machineView.wireframe = false;
                _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
                loadedCanvas.disposePlots(idEntity);
                loadedCanvas.loadPlots('spec100p', idEntity);
                loadedCanvas.changePositionText(idEntity, 'spec100p');
                loadedCanvas.opacityProbes(idEntity, 0.4);
            }
            loadedData.drawChartsWaveform();
        };
        _showOrbital = function () {
            if (!_flags.plots['orb']) {
                _flags.machineView.wireframe = false;
                _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
                loadedCanvas.disposePlots(idEntity);
                loadedCanvas.loadPlots('orb', idEntity);
                loadedCanvas.changePositionText(idEntity, "probe");
                loadedCanvas.opacityProbes(idEntity, 0.4);
            }
            loadedData.drawChartsPairs();
        };
        _showOrbital1X = function () {
            if (!_flags.plots['orb1X']) {
                _flags.machineView.wireframe = false;
                _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
                loadedCanvas.disposePlots(idEntity);
                loadedCanvas.loadPlots('orb1X', idEntity);
                loadedCanvas.changePositionText(idEntity, "probe");
                loadedCanvas.opacityProbes(idEntity, 0.4);
            }
            loadedData.drawChartsPairs();
        };
        _showSCL = function () {
            
            if (!_flags.plots['sCL']) {
                _flags.machineView.wireframe = false;
                _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
                loadedCanvas.disposePlots(idEntity);
                loadedCanvas.loadPlots('sCL', idEntity);
                loadedCanvas.changePositionText(idEntity, "probe");
                loadedCanvas.opacityProbes(idEntity, 0.4);
            }
            loadedData.drawChartsPairs();
        };
        _showOrbitalShaftDef = function () {
            if (!_flags.plots['ShaftDef']) {
                _flags.machineView.wireframe = false;
                _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
                loadedCanvas.disposePlots(idEntity);
                loadedCanvas.loadPlots('ShaftDef', idEntity);
                loadedCanvas.changePositionText(idEntity, "probe");
                loadedCanvas.opacityProbes(idEntity, 0.4);
            }
            loadedData.drawChartsPairs();
        };
        _showWaterfall = function () {
            _flags.machineView.wireframe = false;
            _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
            loadedCanvas.disposePlots(idEntity);
            loadedCanvas.loadPlots('waterfall', idEntity);
            loadedCanvas.changePositionText(idEntity, "waterfall");
            loadedCanvas.opacityProbes(idEntity, 0.4);
            loadedData.drawCharts(scope.idPunto, scope.waveFormInfo);
        };
        _loadViewInitial = function () {
            loadedCanvas.disposePlots(idEntity);
            loadedCanvas.opacityProbes(idEntity, 1);
            loadedCanvas.changePositionText(idEntity, "probe");
            loadedCanvas.locateCamera();
        };
        _changeToPerspectiveCamera = function () {
            _utilities.switchCamera(false);
        };
        _changeToOrtographicCamera = function () {
            _utilities.switchCamera(true);
        };
        this.loadInFullScreen = function () {
            if (!_flags.various.fullScreen) {
                _utilities.launchFullScreen();
            } else {
                _utilities.cancelFullscreen();
            }          
        };

        _showExternalSignal = function () {
            new SignalGraph(scope.timeMode, 6, 4, true).Show("Forma de onda");
        };
        _showExternalTrend = function () {
            new LiveTrendGraph(6, 4, true).Show("Tendencia Instantánea");
        };
        _showExternalBarChart = function () {
            new BarChartGraph(scope.timeMode, 6, 4, true).Show("Grafico de barras");
        };
        _showExternalSpectrum = function () {
            new SpectrumGraph(scope.timeMode, 6, 4, true).Show("Espectro de amplitud");
        };
        _showExternalOrbital = function () {
            new OrbitGraph(scope.timeMode, 5, 5, true).Show("Orbital");
        };
        _showExternalSCL = function () {

        };
        this.saveImageViewer = function () {
            _imgViewer3d.flagSaveFile = true;
            //_imgViewer3d.gralInfoDivName = scope.gralInfo.id + "-" + idPoint;
            _imgViewer3d.saveImage();
        };


        _openDivConfig = function () {
            
        };

        this.mainMenu = {
            obj: null,
            id: "menu-Viewer3d",
            children:[
                {       id: "menuViewer-machineView-",
                        obj: null,
                        objs: [
                            {
                                id: "btnHousing3d",
                                obj: null,
                                img: "Carcaza.png",
                                txt: "Carcasa",
                                fcn: _hideShowHousing,
                                flag: false
                            },
                            {
                                id: "btnTransparency3d",
                                obj: null,
                                img: "Transparency3d.png",
                                txt: "Transparencia",
                                fcn: _hideShowTransparency,
                                flag: false
                            },
                            {
                                id: "btnWireframe3d",
                                obj: null,
                                img: "Wireframe3d.png",
                                txt: "Alambre",
                                fcn: _hideShowWireframe,
                                flag: false
                            },
                        ]                    
                },
                {
                    id: "menuViewer-charts-",
                        obj: null,
                        objs: [
                            /*
                            {
                                id: "btnTrend3d",
                                obj: null,
                                img: "Trend3d.png",
                                txt: "Tendencia",
                                fcn: _showTrend
                            },*/
                           {
                                id: "btnSpectrum3d",
                                obj: null,
                                img: "Spectrum3d.png",
                                txt: "Espectro",
                                fcn: _showSpectrum
                           },
                           {
                               id: "btnSpectrum3d100p",
                               obj: null,
                               img: "Spectrum3d100p.png",
                               txt: "Espectro 100%",
                               fcn: _showSpectrum100p
                           },
                            {
                                id: "btnOrbital3d",
                                obj: null,
                                img: "Orbital3d.png",
                                txt: "Orbital",
                                fcn: _showOrbital
                            },
                            {
                                id: "btnOrbital1X3d",
                                obj: null,
                                img: "Orbital1X3d.png",
                                txt: "Orbital 1X",
                                fcn: _showOrbital1X
                            },/*
                            {
                                id: "btnSCL3d",
                                obj: null,
                                img: "SCL3d.png",
                                txt: "Centro de Eje",
                                fcn: _showSCL
                            },*/
                            {
                                id: "btnOrbitalShaftDef3d",
                                obj: null,
                                img: "ShaftDef.png",
                                txt: "Deflexión del Eje",
                                fcn: _showOrbitalShaftDef
                            },/*
                            {
                                id: "btnWaterfall3d",
                                obj: null,
                                img: "Waterfall3d.png",
                                txt: "Cascada",
                                fcn: _showWaterfall
                            },*/
                        ]                    
                },
                {
                    id: "menuViewer-camera-",
                    obj: null,
                    objs: [
                       {
                           id: "btnCentralView3d",
                           obj: null,
                           img: "InitialView3d.png",
                           txt: "Vista Inicial",
                           fcn: _loadViewInitial
                       },
                        {
                            id: "btnPerspective3d",
                            obj: null,
                            img: "Perspective3d.png",
                            txt: "Perspectiva",
                            fcn: _changeToPerspectiveCamera
                        },
                        {
                            id: "btnOrtographic3d",
                            obj: null,
                            img: "Ortographic3d.png",
                            txt: "Ortográfica",
                            fcn: _changeToOrtographicCamera
                        }
                    ]
                },/*
                {
                    id: "menuViewer-various-",
                    obj: null,
                    objs: [
                           {
                               id: "btnTotalScreenView3d",
                               obj: null,
                               img: "TotalScreen3d.png",
                               txt: "Pantalla Completa",
                               fcn: _loadInFullScreen
                           },
                           {
                               id: "btnSaveView3d",
                               obj: null,
                               img: "Save.png",
                               txt: "Guardar Imagen",
                               fcn: _saveImageViewer
                           },
                           {
                               id: "btnConfigView3d",
                               obj: null,
                               img: "Config3d.png",
                               txt: "Configuración",
                               fcn: _openDivConfig,
                               child: {
                                   id: "divConfigPPal",
                                   obj: null,
                                   position: "absolute",
                                   children: [
                                       {
                                           id: "divPickBGColor", //Para SF agrego SF al id
                                           obj: null,
                                           type: 0,
                                           text: "Color Fondo",
                                           objSF: null
                                       },
                                       {
                                           id: "divPickWFColor",
                                           obj: null,
                                           type: 0,
                                           text: "Color Alambre",
                                           objSF: null
                                       },
                                   ]
                               }
                           }
                    ]
                }*/
            ]
        };

        _contextMenu3d = {
            obj: null,
            id: "ctxtMenu-Viewer3d-",
            children: [
                {
                    id: "ctxtMenu-Viewer3d-Single",
                    obj: null,
                    objs: [{
                        id: "btnExtSignal",
                        obj: null,
                        img: "signal-w.png",
                        txt: "Señal",
                        fcn: _showExternalSignal
                    },
                           {
                               id: "btnExtSpectrum",
                               obj: null,
                               img: "Spectrum3d.png",
                               txt: "Espectro",
                               fcn: _showExternalSpectrum
                           },
                            {
                                id: "btnExtOrbital",
                                obj: null,
                                img: "Orbital3d.png",
                                txt: "Orbital",
                                fcn: _showExternalOrbital
                            },
                            {
                                id: "btnExtSCL",
                                obj: null,
                                img: "SCL3d.png",
                                txt: "Centro de Eje",
                                fcn: _showExternalSCL
                            },
                    ]
                },
                {
                    id: "ctxtMenu-Viewer3d-Mult",
                    obj: null,
                    objs: [
            
                            {
                                id: "btnExtTrend",
                                obj: null,
                                img: "Trend3d.png",
                                txt: "Tendencia",
                                fcn: _showExternalTrend
                            },
                           {
                               id: "btnExtBarChart",
                               obj: null,
                               img: "BarChart.png",
                               txt: "Grafico Barras",
                               fcn: _showExternalBarChart
                           }
                    ]
                }
                
                ]
        };

        this.axisQty = 1;
        this.tipoMedida = "";
        this.sensorType = "";
        this.tiposDeMedida = [];
        this.dataIndicators = [];


        this.indicators = {
            obj: null,
            id: "indicators-Viewer3d",
            gralInfo: {
                obj: null,
                id: "ind-gralInfo-Viewer3d",
                children: [
                    {
                        id: "dateTime",
                        obj: null,
                        text: _date.toLocaleTimeString("es-co", _options)
                    },
                    {
                        id: "nameAsset",
                        obj: null,
                        text: selectedTreeNode.Name + " - TIEMPO REAL"// se supone que es la ruta completa
                    }
                ]
            },
            cb: {
                obj: null,
                id: "ind-cb-Viewer3d",
                box:{
                    obj: null,
                    id: "ind-cb-box-Viewer3d",
                },
                contentCB: {
                    obj: null,
                    id: "ind-contentCB-Viewer3d"
                },
            },
            
            subVarList: {
                obj: null,
                id: "ind-subVarList-Viewer3d",
                axisQty: [],
                varName: {
                    name: "ind-subVarList-varName-Viewer3d"
                },
                list: {
                    name: "ind-subVarList-list-Viewer3d",
                    children: [
                        {
                            name: "ind-led-Viewer3d",
                            className: "class-ind-led-Viewer3d"
                        },
                        {
                            name: "ind-pointName-Viewer3d",
                            className: "class-ind-pointName-Viewer3d"
                        },
                        {
                            name: "ind-valueSubVar-Viewer3d",
                            className: "class-ind-valueSubVar-Viewer3d"
                        },
                    ]
                }
            }
        };

        _indicators = this.indicators;

        _createMenu = function () {

            var fcn;
            _container.append('<div id="' + scope.mainMenu.id + "-" + idEntity + wId + '"></div>');
            scope.mainMenu.obj = $("#" + scope.mainMenu.id + "-" + idEntity + wId);
            scope.mainMenu.obj.addClass("menuViewer3d");
            scope.mainMenu.obj.css({
                "width": "28px",
                "top": "30px",
                "right": "2px"
            });

            for (var i = 0; i < scope.mainMenu.children.length; i++) {
                scope.mainMenu.obj.append('<div id="' + scope.mainMenu.children[i].id + "-" + idEntity + wId + '"></div>');
                scope.mainMenu.children[i].obj = $("#" + scope.mainMenu.children[i].id + "-" + idEntity + wId);
                scope.mainMenu.children[i].obj.addClass("groupMenuViewer3d");

                for (var j = 0; j < scope.mainMenu.children[i].objs.length; j++) {
                    scope.mainMenu.children[i].obj.append('<div id="' + scope.mainMenu.children[i].objs[j].id + "-" + idEntity + wId + '">' +
                        '<img src="' + _srcImages + scope.mainMenu.children[i].objs[j].img + '" width="20px" height="20px" class="btnMenuViewer3d"/></div>');
                    scope.mainMenu.children[i].objs[j].obj = $("#" + scope.mainMenu.children[i].objs[j].id + "-" + idEntity + wId);
                    /*
                    scope.mainMenu.children[i].objs[j].obj.on("click", function (args) {
                        _chooseFunction(args.currentTarget.id);
                    });*/

                    scope.mainMenu.children[i].objs[j].obj.hover( function (args) {
                        _showTooltip(args.currentTarget.id);
                    });

                    scope.mainMenu.children[i].objs[j].obj.on("mouseleave", function (args) {
                        $("#Tooltip-Menu-" + idEntity + wId).hide();
                    });
                }
            }

            _container.append('<div id="Tooltip-Menu-' + idEntity + wId + '" class="menuViewer3d groupMenuViewer3d"' +
                ' style="right: 36px; position: absolute; top: 10px; padding-left: 5px; padding-right: 5px; opacity: 0.5;">3333</div>');
            
            $("#Tooltip-Menu-" + idEntity + wId).hide();

            _createContextMenu3d();
        };

        _createContextMenu3d = function () {

            var fcn;
            _container.append('<div id="' + _contextMenu3d.id + idEntity + wId + '"></div>');
            _contextMenu3d.obj = $("#" + _contextMenu3d.id + idEntity + wId);
            _contextMenu3d.obj.addClass("menuViewer3d");
            _contextMenu3d.obj.css({
                "top": "50px"
            });


            for (var i = 0; i < _contextMenu3d.children.length; i++) {
                _contextMenu3d.obj.append('<div id="' + _contextMenu3d.children[i].id + "-" + idEntity + wId + '"></div>');
                _contextMenu3d.children[i].obj = $("#" + _contextMenu3d.children[i].id + "-" + idEntity + wId);
                _contextMenu3d.children[i].obj.addClass("groupMenuViewer3d");
                _contextMenu3d.children[i].obj.css({
                    "display": "inline-block"
                });

                for (var j = 0; j < _contextMenu3d.children[i].objs.length; j++) {
                    _contextMenu3d.children[i].obj.append('<div id="' + _contextMenu3d.children[i].objs[j].id + "-" + idEntity + wId + '">' +
                        '<img src="' + _srcImages + _contextMenu3d.children[i].objs[j].img + '" width="20px" height="20px" class="btnMenuViewer3d"/></div>');
                    _contextMenu3d.children[i].objs[j].obj = $("#" + _contextMenu3d.children[i].objs[j].id + "-" + idEntity + wId);
                    _contextMenu3d.children[i].objs[j].obj.css({
                        "display": "inline"
                    });

                    _contextMenu3d.children[i].objs[j].obj.on("click", function (args) {
                        scope.chooseFunction(args.currentTarget.id);
                    });

                    _contextMenu3d.children[i].objs[j].obj.hover(function (args) {
                        _showTooltipCtxt(args.currentTarget.id);
                    });

                    _contextMenu3d.children[i].objs[j].obj.on("mouseleave", function (args) {
                        $("#Tooltip-CttxtMenuExt-" + idEntity + wId).hide();
                    });
                }
            }

            _container.append('<div id="Tooltip-CttxtMenuExt-' + idEntity + wId + '" class="menuViewer3d groupMenuViewer3d"' +
                ' style="right: 36px; position: absolute; top: 10px; padding-left: 5px; padding-right: 5px; opacity: 0.5;">3333</div>');

            $("#Tooltip-CttxtMenuExt-" + idEntity + wId).hide();
            _contextMenu3d.obj.hide();
        };

        _showTooltip = function (idButton) {
            var text;
            $("#Tooltip-Menu-" + idEntity + wId).show();
            for (var i = 0; i < scope.mainMenu.children.length; i++) {
                for (var j = 0; j < scope.mainMenu.children[i].objs.length; j++) {
                    if (idButton === scope.mainMenu.children[i].objs[j].id + "-" + idEntity + wId) {
                        text = scope.mainMenu.children[i].objs[j].txt;
                        $("#Tooltip-Menu-" + idEntity + wId).text(text);
                        $("#Tooltip-Menu-" + idEntity + wId).css({
                            "top": scope.mainMenu.children[i].objs[j].obj.position().top + scope.mainMenu.children[i].obj.position().top + 30 + "px"
                        });
                    }
                }
            }
        };

        _showTooltipCtxt = function (idButton) {
            var text;
            $("#Tooltip-CttxtMenuExt-" + idEntity + wId).show();
            for (var i = 0; i < _contextMenu3d.children.length; i++) {
                for (var j = 0; j < _contextMenu3d.children[i].objs.length; j++) {
                    if (idButton === _contextMenu3d.children[i].objs[j].id + "-" + idEntity + wId) {
                        text = _contextMenu3d.children[i].objs[j].txt;
                        $("#Tooltip-CttxtMenuExt-" + idEntity + wId).text(text);
                        $("#Tooltip-CttxtMenuExt-" + idEntity + wId).css({
                            "right": "auto"
                            //"top": _contextMenu3d.children[i].objs[j].obj.position().top + _contextMenu3d.children[i].obj.position().top + 30 + "px"
                        });
                    }
                }
            }
        };
        
        this.chooseFunction = function (idButton) {

            var fcn;
            
            for (var i = 0; i < scope.mainMenu.children.length; i++) {
                for (var j = 0; j < scope.mainMenu.children[i].objs.length; j++) {
                    if (idButton === scope.mainMenu.children[i].objs[j].id + "-" + idEntity + wId) {
                        fcn = scope.mainMenu.children[i].objs[j].fcn;
                        fcn();
                    }
                }
            }
            for (var i = 0; i < _contextMenu3d.children.length; i++) {
                for (var j = 0; j < _contextMenu3d.children[i].objs.length; j++) {
                    if (idButton === _contextMenu3d.children[i].objs[j].id + "-" + idEntity + wId) {
                        fcn = _contextMenu3d.children[i].objs[j].fcn;
                        fcn();
                    }
                }
            }
            for (var i = 0; i < scope.configColorsModalCont.children.length; i++) {
                
                if (scope.configColorsModalCont.children[i].type == "ppal") {
                    if (idButton === scope.configColorsModalCont.children[i].id  + wId) {
                        fcn = scope.configColorsModalCont.children[i].fcn;
                        fcn();
                    }
                }
                if (scope.configColorsModalCont.children[i].type == "Title") {
                    for (var j = 0; j < scope.configColorsModalCont.sub.length; j++) {
                        if (idButton === scope.configColorsModalCont.children[i].id + scope.configColorsModalCont.sub[j].id + wId) {
                            _typeChartColor = scope.configColorsModalCont.children[i].id;
                            fcn = scope.configColorsModalCont.sub[j].fcn;
                            fcn();
                        }
                    }
                }
            }
        };

        _createIndicators = function () {

            var axisQtyDiv = new Object({
                obj: null,
                id: "ind-subVarList-axisQty-Viewer3d"
            });
          
            _container.append('<div id="' + _indicators.gralInfo.id + "-" + idEntity + wId + '"></div>');
            _indicators.gralInfo.obj = $("#" + _indicators.gralInfo.id + "-" + idEntity + wId);
            _indicators.gralInfo.obj.addClass("menuViewer3d indicatorsViewer3d");

            for (var i = 0; i < _indicators.gralInfo.children.length; i++) {
                _indicators.gralInfo.obj.append('<div id="' + _indicators.gralInfo.children[i].id + "-" + idEntity + wId + '">' +
                    _indicators.gralInfo.children[i].text + '</div>');
                _indicators.gralInfo.children[i].obj = $("#" + _indicators.gralInfo.children[i].id + "-" + idEntity + wId);
            }
            /*
            _indicators.gralInfo.obj.append('<div id="filterViewer-' + idEntity + wId + '" style="margin-left: 0px; position: relative; display: inline-block;"><img src="' + _srcImages + 'filter.png" width="16px" height="16px" class="btnMenuViewer3d"/></div>');
            
            _indicators.gralInfo.obj.append('<div id="sortingViewer-' + idEntity + wId + '" style="margin-left: 0px; position: relative; display: inline-block;"><img src="' + _srcImages + 'Sorting.png" width="16px" height="16px" class="btnMenuViewer3d"/></div>');
            */

            //Combo box
            /*
            _container.append('<div id="' + _indicators.cb.id + "-" + idEntity + '"></div>');
            _indicators.cb.obj = $("#" + _indicators.cb.id + "-" + idEntity);
            _indicators.cb.obj.css({
                "top": _indicators.gralInfo.obj.height() * 1.2 + "px",
                "cursor": "pointer"
            });
           
            _indicators.cb.obj.addClass("menuViewer3d indicatorsViewer3d");
            _indicators.cb.obj.append('<div id="' + _indicators.cb.box.id + "-" + idEntity + '">Tipo de Medida &#x8 &#x8 &#x25BD;</div>');
            _indicators.cb.box.obj = $("#" + _indicators.cb.box.id + "-" + idEntity);           

            _container.append('<div id="' + _indicators.cb.contentCB.id + "-" + idEntity + '"></div>');
            _indicators.cb.contentCB.obj = $("#" + _indicators.cb.contentCB.id + "-" + idEntity);
            _indicators.cb.contentCB.obj.css({
                "top": (_indicators.gralInfo.obj.height() + _indicators.cb.box.obj.height()) * 1.22 + "px",
                "min-width": _indicators.cb.box.obj.width() - 2 + "px",
            });
            _indicators.cb.contentCB.obj.addClass("menuViewer3d indicatorsViewer3d contentCBIndViewer3d");

            _indicators.cb.contentCB.obj.append('<div id="' + _indicators.cb.contentCB.id + "-Neither-" + idEntity + '">___</div>');
  
            for (var j = 0; j < scope.tiposDeMedida.length; j++) {
                _indicators.cb.contentCB.obj.append('<div style="font-weight: bold; padding: 4px 4px 4px 4px;" id="' + _indicators.cb.contentCB.id + "-" +
                    scope.tiposDeMedida[j].sensorType + "-" + idEntity + '">' + scope.tiposDeMedida[j].sensorType + '</div>');

                for (var k = 0; k < scope.tiposDeMedida[j].children.length; k++) {
                    $("#" + _indicators.cb.contentCB.id + "-" + scope.tiposDeMedida[j].sensorType + "-" + idEntity).
                        append('<div style="font-weight: bold; padding: 4px 4px 4px 4px;">' + scope.tiposDeMedida[j].children[k] + '</div>');
                }
                
            }

            _container.append('<div id="' + _indicators.subVarList.id + "-" + idEntity + '"></div>');
            _indicators.subVarList.obj = $("#" + _indicators.subVarList.id + "-" + idEntity);
            _indicators.subVarList.obj.addClass("menuViewer3d indicatorsViewer3d");
            _indicators.subVarList.obj.css({
                "top": Math.round((_indicators.gralInfo.obj.height() + _indicators.cb.box.obj.height()) * 1.3) + "px",
                "padding": "2px 2px 2px 2px"
            });
           
            _eventsIndicators();
            //_createAxisDiv();

            _indicators.subVarList.obj.hide();    */        
        };

        

        _createAxisDiv = function () {

            var vel = nodes[idEntity + wId].Properties3d.gralInfo.nominalVel;
            var axisVel, axisNum;

            _indicators.subVarList.obj.append('<div id="' + _indicators.subVarList.varName.name + "-" + idEntity + wId + '"><CENTER><b>' + scope.tipoMedida + '</b></div>');
            $("#" + _indicators.subVarList.varName.name + "-" + axisNum + "-" + idEntity + wId).addClass("indVarNameViewer3d");

            for (var j = 0; j < scope.axisQty; j++) {

                _indicators.subVarList.axisQty.push({
                    obj: null,
                    id: "ind-subVarList-axisQty-Viewer3d" + j
                });
                axisNum = j + 1;
                axisVel = nodes[idEntity + wId].Properties3d.asset.axis[j].prop.vel * vel;

                _indicators.subVarList.obj.append('<div id="' + _indicators.subVarList.axisQty[j].id + "-" + idEntity + wId + '"><u class="velChange">EJE ' + axisNum + ' - VEL: ' + axisVel + ' RPM </u>' +
                    ' <div id="' + _indicators.subVarList.axisQty[j].id + "-arrow-" + idEntity + wId + '" style="cursor: pointer;">&#x25BD;</div></div>');
                _indicators.subVarList.axisQty[j].obj = $("#" + _indicators.subVarList.axisQty[j].id + "-" + idEntity + wId);
                _indicators.subVarList.axisQty[j].obj.addClass("indAxisQtyViewer3d");

                $("#" + _indicators.subVarList.axisQty[j].id + "-arrow-" + idEntity + wId).on("click", function (args) {
                    if (args.currentTarget.parentElement.children[2]) {
                        if (args.currentTarget.parentElement.children[2].style.display === "") {
                            args.currentTarget.parentElement.children[2].style.display = "none";
                            args.currentTarget.parentElement.children[1].innerText = ' \u25B3 ';
                        }
                        else {
                            args.currentTarget.parentElement.children[2].style.display = "";
                            args.currentTarget.parentElement.children[1].innerText = ' \u25BD ';
                        }
                    }
                });
            }
        };

        _removeElementsSubVarList = function () {

            _indicators.subVarList.obj.empty();
            _indicators.subVarList.obj.empty();
            _indicators.subVarList.obj.empty();
        };

        this.createSubVarList = function (idPoint, pointName, value, units, statusColor, axisNum) {


            _indicators.subVarList.axisQty[axisNum].obj.append('<div id="' + _indicators.subVarList.list.name + "-" + axisNum + "-" + idEntity + wId + '"></div>');
            $("#" + _indicators.subVarList.list.name + "-" + axisNum + "-" + idEntity + wId).addClass("indSubVarListViewer3d");


            $("#" + _indicators.subVarList.list.name + "-" + axisNum + "-" + idEntity + wId).
                append('<div id="Parent-' + _indicators.subVarList.list.children[0].name +
                "-" + axisNum + "-" + idPoint + wId + '" style="display: block; border-bottom-style: solid; border-bottom-width: 1px;"></div>');

            $("#Parent-" + _indicators.subVarList.list.children[0].name + "-" + axisNum + "-" + idPoint + wId).
                append('<div id="' + _indicators.subVarList.list.children[0].name + "-" + axisNum + "-" + idPoint + wId + '"></div>');
            $("#" + _indicators.subVarList.list.children[0].name + "-" + axisNum + "-" + idPoint + wId).addClass(_indicators.subVarList.list.children[0].className);
            $("#" + _indicators.subVarList.list.children[0].name + "-" + axisNum + "-" + idPoint + wId).css({
                "background-color": statusColor,
                "display": "inline-block !important"
            });

            $("#Parent-" + _indicators.subVarList.list.children[0].name + "-" + axisNum + "-" + idPoint + wId).append('<div id="' + "Ind-Value-" +
                axisNum + "-" + idPoint + wId + '" style="display: inline-block"></div>');

            for (var i = 1; i < _indicators.subVarList.list.children.length; i++) {
                $("#" + "Ind-Value-" + axisNum + "-" + idPoint + wId).append('<div id="' + _indicators.subVarList.list.children[i].name +
                    "-" + axisNum + "-" + idPoint + wId + '"></div>');
                $("#" + _indicators.subVarList.list.children[i].name + "-" + axisNum + "-" + idPoint + wId).addClass(_indicators.subVarList.list.children[i].className);
            }

            $("#" + _indicators.subVarList.list.children[1].name + "-" + axisNum + "-" + idPoint + wId).text(pointName);
            $("#" + _indicators.subVarList.list.children[2].name + "-" + axisNum + "-" + idPoint + wId).text(value + " [" + units + "]");

        };

        this.createUI = function () {

            _createIndicators();
            _createMenu();
        };

        _eventsIndicators = function () {

            _indicators.cb.contentCB.obj.on("click", function (args) {

                var parent = args.target.parentElement.id;
                scope.sensorType = parent.split("-")[3];


                for (var i = 0; i < scope.tiposDeMedida.length; i++) {
                    if (scope.sensorType === scope.tiposDeMedida[i].sensorType) {
                        _indicators.cb.contentCB.obj.hide();                    
                        scope.tipoMedida = args.target.textContent;
                        _removeElementsSubVarList();
                        _loadFilteredData();
                        _indicators.subVarList.obj.show();
                    }
                }
            });

            _indicators.cb.box.obj.on("click", function (args) {
                if (_indicators.cb.contentCB.obj.css("display") === "none") {
                    _indicators.cb.contentCB.obj.show();
                }
                else {
                    _indicators.cb.contentCB.obj.hide();
                }
            });

            $("#" + _indicators.cb.contentCB.id + "-Neither-" + idEntity + wId).on("click", function (args) {
                _indicators.cb.contentCB.obj.hide();
                _indicators.subVarList.obj.hide();
            });
        };

        _loadVblesCategory = function () {

            $("#" + scope.indicators.gralInfo.children[0].id + "-" + idEntity + wId).text(scope.indicators.gralInfo.children[0].text);

            var tipoDeMedida = []; // sensorType - subVbleName
            var subVbleName = [];
            var sensorType = [];
            var subVble;

            var cb = [];

            for (var i = 0; i < mainCache.loadedMeasurementPoints.length; i++) {
                for (var j = 0; j < mainCache.loadedMeasurementPoints[i].SubVariables.length; j++) {
                    if (mainCache.loadedMeasurementPoints[i].SubVariables[j].ValueType === 1 && idEntity + wId === mainCache.loadedMeasurementPoints[i].ParentId) {
                        tipoDeMedida.push("sensorType:" + mainCache.loadedMeasurementPoints[i].SubVariables[j].SensorType + "-_-" +
                            "subVbleName:" + mainCache.loadedMeasurementPoints[i].SubVariables[j].Name);
                        sensorType.push(mainCache.loadedMeasurementPoints[i].SubVariables[j].SensorType);
                    }
                }
            }

            
            tipoDeMedida = eliminateDuplicatesArray(tipoDeMedida);
            sensorType = eliminateDuplicatesArray(sensorType);

            for (var k = 0; k < sensorType.length; k++) {
                cb.push({ sensorType: sensorType[k].replace(" ", "_").toUpperCase(), children: [] })
                for (var l = 0; l < tipoDeMedida.length; l++) {
                    if (tipoDeMedida[l].indexOf(sensorType[k]) !== -1) {
                        subVble = tipoDeMedida[l].split("subVbleName:")[1];
                        subVble = subVble.replace(" ", "_");
                        cb[k].children.push(subVble);
                    }
                }
            }
            scope.tiposDeMedida = cb;
        }();

        this.loadValuesCategoryVble = function (timeMode, dateExt, nodeName) {

            var idPoint, value, dateTime, mode, units, statusColor, numAxis, vel;

            switch (timeMode) {
                case 0:
                    dateTime = new Date();
                    dateTime = dateTime.toLocaleTimeString("es-co", _options);
                    mode = "TIEMPO REAL";
                    break;
                case 1:
                    dateTime = dateExt;
                    mode = "HISTÓRICO";
                    break;
                case 2:
                    dateTime = dateExt;
                    mode = "EVENTO";
                    break;
            }

            //_imgViewer3d.infoForCanvas.timeStamp = dateTime;
            //_imgViewer3d.infoForCanvas.asset = nodeName + " - " + mode;

            globals3d.infoViewer.timeStamp = dateTime;
            globals3d.infoViewer.asset = nodeName + " - " + mode;
            
            $("#" + scope.indicators.gralInfo.children[0].id + "-" + idEntity + wId).text(dateTime);
            $("#" + scope.indicators.gralInfo.children[1].id + "-" + idEntity + wId).text(nodeName + " - " + mode);

            for (var i = 0; i < scope.dataIndicators.length; i++) {

                idPoint = scope.dataIndicators[i].idPoint;
                value = scope.dataIndicators[i].value;
                if (value) {
                    value = value.toFixed(3);
                }
                units = scope.dataIndicators[i].units;
                statusColor = scope.dataIndicators[i].statusColor;
                numAxis = scope.dataIndicators[i].numAxis;
                vel = scope.dataIndicators[i].vel;

                var axisNumText = numAxis + 1;

                console.log(mode);
               
                //$("#" + scope.indicators.gralInfo.children[0].id + "-" + idEntity).text(dateTime);
               // $("#" + scope.indicators.gralInfo.children[1].id + "-" + idEntity).text(selectedTreeNode.Name + " - " + mode);


                if (_indicators.subVarList.axisQty[numAxis]) {

                    $("#" + _indicators.subVarList.axisQty[numAxis].id + "-" + idEntity + wId + " .velChange").text('EJE ' + axisNumText + ' -VEL: ' + vel + ' RPM');

                    $("#" + _indicators.subVarList.list.children[0].name + "-" + numAxis + "-" + idPoint).css({
                        "background-color": statusColor,
                    });

                    $("#" + _indicators.subVarList.list.children[2].name + "-" + numAxis + "-" + idPoint).text(value + " [" + units + "]");
                }               
            }
        };

        _loadFilteredData = function () {

            _createAxisDiv();

            var idPoint, namePoint, value, units, color, axis;

            for (var i = 0; i < mainCache.loadedMeasurementPoints.length; i++) {
                for (var j = 0; j < mainCache.loadedMeasurementPoints[i].SubVariables.length; j++) {
                    if (mainCache.loadedMeasurementPoints[i].SubVariables[j].ValueType === 1 &&
                        mainCache.loadedMeasurementPoints[i].SubVariables[j].SensorType.toUpperCase().replace(" ", "_") === scope.sensorType &&
                        mainCache.loadedMeasurementPoints[i].SubVariables[j].Name === scope.tipoMedida &&
                        idEntity + wId === mainCache.loadedMeasurementPoints[i].ParentId) {

                        idPoint = mainCache.loadedMeasurementPoints[i].Id;
                        namePoint = mainCache.loadedMeasurementPoints[i].Name;
                        value = mainCache.loadedMeasurementPoints[i].SubVariables[j].Value;
                        units = mainCache.loadedMeasurementPoints[i].SubVariables[j].Units;
                        color = "#000000";
                        axis = nodes[idEntity + wId].Properties3d.points.children[j].info.axis;

                        if (value === null) {
                            value = "__";
                        }
                        scope.createSubVarList(idPoint, namePoint, value, units, color, 0);
                    }
                }
            }

        };

        _changeClearColor = function () {
            _scene.clearColor = BABYLON.Color3.FromHexString(scope.valueColor);
            globals3d.colors[idEntity + wId].clearColor = scope.valueColor;
        };

        _changeWireframe = function () {

            var tempMesh;


            globals3d.colors[idEntity + wId].wireframe = scope.valueColor;

            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.split("-_-")[0] === "asset-" + idEntity) {
                    _utilities.convertAssetInWireframe(true);
                }
            }
            // _utilities.convertAssetInWireframe(!_flags.machineView.wireframe);
        };

        _changeBG = function () {
            var name1, name2, tempMesh;
            switch (_typeChartColor) {
                case "spec":
                    name1 = "Spec";
                    name2 = "Spec100p";
                    break;
                case "orb":
                    name1 = "Orb";
                    name2 = "ShaftDef";
                    break;
            }
            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.split("-")[0] === "canvas" && (_scene.meshes[i].name.split("-")[1] === name1 || _scene.meshes[i].name.split("-")[1] === name2)) {

                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));
                    globals3d.colors[idEntity + wId][_typeChartColor].bg = scope.valueColor;
                    tempMesh.material.diffuseColor = BABYLON.Color3.FromHexString(scope.valueColor); //Reemplazar por el color del pick
                }
            }

        };

        _changeBL = function () {
            var name1, name2, tempMesh;
            switch (_typeChartColor) {
                case "spec":
                    name1 = "Spec";
                    name2 = "Spec100p";
                    break;
                case "orb":
                    name1 = "Orb";
                    name2 = "ShaftDef";
                    break;
            }
            var wIdAlt = wId.split("-")[1];
            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.split("-")[3] === wIdAlt + ".line") {

                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));
                    globals3d.colors[idEntity + wId][_typeChartColor].bl = scope.valueColor;
                    tempMesh.color = BABYLON.Color3.FromHexString(scope.valueColor); //Reemplazar por el color del pick
                }
            }
        };

        _changeLC = function () {
            var name1, name2, tempMesh;
            switch (_typeChartColor) {
                case "spec":
                    name1 = "Spec";
                    name2 = "Spec100p";
                    break;
                case "orb":
                    name1 = "Orb";
                    name2 = "ShaftDef";
                    break;
            }
            for (var i = 0; i < _scene.meshes.length; i++) {
                console.log(_scene.meshes[i].name.split("-")[0]);
                if (_scene.meshes[i].name.split("-")[1] === "Chart" && _scene.meshes[i].name.split("-")[2] === "canvas" && (_scene.meshes[i].name.split("-")[3] === name1 || _scene.meshes[i].name.split("-")[3] === name2) || _scene.meshes[i].name.split("-")[0] === "point") {

                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));
                    globals3d.colors[idEntity + wId][_typeChartColor].lc = scope.valueColor;
                    tempMesh.color = BABYLON.Color3.FromHexString(scope.valueColor); //Reemplazar por el color del pick
                } else if (_scene.meshes[i].name.split("-")[0] === "line" && _scene.meshes[i].name.split("-")[1] === name2 && _typeChartColor == "orb") {
                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));
                    globals3d.colors[idEntity + wId][_typeChartColor].lc = scope.valueColor;
                    tempMesh.color = BABYLON.Color3.FromHexString(scope.valueColor); //Reemplazar por el color del pick
                }
            }
        };


        this.configColorsModalCont = {
            id: "contModalGralInfo",
            obj: null,
            children: [
                {
                    id: "clearColor",
                    txt: "Fondo: ",
                    type: "ppal",
                    fcn: _changeClearColor
                },
                {
                    id: "wireframe",
                    txt: "Alambre: ",
                    type: "ppal",
                    fcn: _changeWireframe
                },
                {
                    type: "Title",
                    txt: "ESPECTROS",
                    id: "spec"
                },
                {
                    type: "Title",
                    txt: "ÓRBITAS",
                    id: "orb"
                }],
            sub:[
                {
                    id: "bg",
                    txt: "Fondo: ",
                    fcn: _changeBG
                },
                {
                    id: "bl",
                    txt: "borde: ",
                    fcn: _changeBL
                },
                {
                    id: "lc",
                    txt: "gráfica: ",
                    fcn: _changeLC
                }
                ]
        };


        this.saveInfoGral = function () {

        };

    };
    return UiViewer3d;
})();