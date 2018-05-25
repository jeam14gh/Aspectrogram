/*
 * manageCanvas3d.js
 * Manejo de variables para la creación de Canvas 3d (Editor o Visor)
 */

var ManageCanvas3d = {};

ManageCanvas3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ManageCanvas3d = function (idEntity, canvasType, parentContId, idPoint, wId) {


        var _scene,
            _engine,
            _canvas,
            _parentContainer,
            _contCanvas,
            _contLoader,
            _canvas,
            _events,
            _canvasType,
            _idEntity,
            _idPoint,
            _idContLoader,
            _id3d,
            _id3dW,
            _addVariables,
            _createLoadingScreen,
            _disposeVariables,
            _addEventListeners,
            _disposeEventListeners,
            _createScene,
            _disposeScene,
            _cameras,
            _lights;

        _idEntity = idEntity;
        _idPoint = idPoint;

        

        _canvasType = canvasType;
        _parentContainer = $("#" + parentContId);

        if (canvasType == "Editor") {
            _cameras = {
                prop: {
                    alpha: -Math.PI / 3,
                    beta: Math.PI / 3,
                    radius: 10000,
                    target: new BABYLON.Vector3(100, 0, 0),
                    lowerRadiusLimit: 10,
                    upperRadiusLimit: 30000,
                    maxZ: 50000,
                    wheelPrecision: 0.1,
                    fov: 0.9
                },
                name: "ArcRotateCamera"
            };
        } else if (canvasType == "Viewer") {
            _cameras = {
                prop: {
                    alpha: -Math.PI / 3,
                    beta: Math.PI / 3,
                    radius: 60000,
                    target: new BABYLON.Vector3(100, 0, 0),
                    lowerRadiusLimit: 10,
                    upperRadiusLimit: 60000,
                    maxZ: 70000,
                    wheelPrecision: 0.1,
                    fov: 0.9
                },
                name: "ArcRotateCamera"
            };
        } else {
            _cameras = {
                prop: {
                    alpha: -Math.PI / 3,
                    beta: Math.PI / 3,
                    radius: 10000,
                    target: new BABYLON.Vector3(100, 0, 0),
                    lowerRadiusLimit: 10,
                    upperRadiusLimit: 30000,
                    maxZ: 50000,
                    wheelPrecision: 0.1,
                    fov: 0.9
                },
                name: "ArcRotateCamera"
            };
        }
        

        _lights =
            [
                { name: "Hemispheric", pos: new BABYLON.Vector3(0, 0, 0), intensity: 0.5 },
                { name: "Directional", pos: new BABYLON.Vector3(0, 0, 1), intensity: 0.8 }
            ];

        _addVariables = function () {
            var idCanvas, idContCanvas;           

            switch (_canvasType) {
                case "Editor": 
                    _id3d = _idEntity;
                    _id3dW = _idEntity + wId;

                    if (editor3d.containerCanvas[_id3dW] === null ||
                        editor3d.containerCanvas[_id3dW] === undefined) {

                        idContCanvas = "contCanvasEditor3D-" + _id3dW;
                        idCanvas = "canvasEditor3D-" + _id3dW;

                        _parentContainer.append('<div id="' + idContCanvas + '">' +
                           '<canvas id="' + idCanvas + '" width="100%" height="100%"></canvas></div>');

                        editor3d.containerCanvas[_id3dW] = document.getElementById(idContCanvas);


                        editor3d.canvas[_id3dW] = document.getElementById(idCanvas);

                        editor3d.engine[_id3dW] = new BABYLON.Engine(editor3d.canvas[_id3dW]);
                        editor3d.scene[_id3dW] = new BABYLON.Scene(editor3d.engine[_id3dW]);
                        editor3d.events[_id3dW] = new Events3d(_id3d, _canvasType, wId);

                        _contCanvas = editor3d.containerCanvas[_id3dW];
                        _canvas = editor3d.canvas[_id3dW];
                        _engine = editor3d.engine[_id3dW];
                        _scene = editor3d.scene[_id3dW];
                        _events = editor3d.events[_id3dW];                        

                        _contCanvas.style.width = "100%";
                        _contCanvas.style.height = "100%";
                        _canvas.style.width = "100%";
                        _canvas.style.height = "100%";
                    }
                break;
                case "Viewer": 
                    _id3d = _idEntity;
                    _id3dW = _idEntity + wId;

                    if (viewer3d.containerCanvas[_id3dW] === null ||
                        viewer3d.containerCanvas[_id3dW] === undefined) {

                        idContCanvas = "contCanvasViewer3D-" + _id3dW;
                        idCanvas = "canvasViewer3D-" + _id3dW;
                        _idContLoader = "contLoaderViewer3D-" + _id3dW;
                        //_createLoadingScreen();

                        _parentContainer.append('<div id="' + idContCanvas + '">' +
                            '<canvas id="' + idCanvas + '"></canvas></div>');

                        viewer3d.containerCanvas[_id3dW] = document.getElementById(idContCanvas);

                        viewer3d.canvas[_id3dW] = document.getElementById(idCanvas);

                        viewer3d.engine[_id3dW] = new BABYLON.Engine(viewer3d.canvas[_id3dW]);
                        viewer3d.scene[_id3dW] = new BABYLON.Scene(viewer3d.engine[_id3dW]);
                        viewer3d.events[_id3dW] = new Events3d(_id3d, _canvasType, wId);
                        viewer3d.contLoader[_id3dW] = $("#" + _idContLoader);

                        _contCanvas = viewer3d.containerCanvas[_id3dW];
                        _canvas = viewer3d.canvas[_id3dW];
                        _engine = viewer3d.engine[_id3dW];
                        _scene = viewer3d.scene[_id3dW];
                       

                        _events = viewer3d.events[_id3dW];

                        _contCanvas.style.width = "100%";
                        _contCanvas.style.height = "100%";
                        _canvas.style.width = "100%";
                        _canvas.style.height = "100%";
                    }
                 break;
                case "Waterfall": 
                    _id3d = _idPoint;
                    _id3dW = _idPoint + wId;

                    if (cascade3d.containerCanvas[_id3dW] === null ||
                        cascade3d.containerCanvas[_id3dW] === undefined) {

                        cascade3d.containerCanvas[_id3dW] = null;
                        cascade3d.canvas[_id3dW] = null;
                        cascade3d.engine[_id3dW] = null;

                        idContCanvas = "contCanvasWaterfall3D-" + _id3dW;
                        idCanvas = "canvasWaterfall3D-" + _id3dW;
                        _idContLoader = "contLoaderWaterfall3D-" + _id3dW;
                        

                        _parentContainer.append('<div id="' + idContCanvas + '">' +
                            '<canvas id="' + idCanvas + '"></canvas></div>');

                        cascade3d.containerCanvas[_id3dW] = document.getElementById(idContCanvas);

                        cascade3d.canvas[_id3dW] = document.getElementById(idCanvas);

                        cascade3d.engine[_id3dW] = new BABYLON.Engine(cascade3d.canvas[_id3dW]);
                        cascade3d.scene[_id3dW] = new BABYLON.Scene(cascade3d.engine[_id3dW]);
                        cascade3d.events[_id3dW] = new Events3d(_id3d, _canvasType, wId);
                        cascade3d.vbles[_id3dW] = {};
                        cascade3d.contLoader[_id3dW] = $("#" + _idContLoader);

                        _contCanvas = cascade3d.containerCanvas[_id3dW];
                        _canvas = cascade3d.canvas[_id3dW];
                        _engine = cascade3d.engine[_id3dW];
                        _scene = cascade3d.scene[_id3dW];

                        _events = cascade3d.events[_id3dW];

                        _contCanvas.style.width = "100%";
                        _contCanvas.style.height = "100%";
                        _canvas.style.width = "100%";
                        _canvas.style.height = "100%";
                    }
                 break;
                case "FullSpecWaterfall": 
                    _id3d = _idPoint;
                    _id3dW = _idPoint + wId;

                    if (fullSpecCascade3d.containerCanvas[_id3dW] === null ||
                        fullSpecCascade3d.containerCanvas[_id3dW] === undefined) {

                        idContCanvas = "contCanvasFullSpecWaterfall3D-" + _id3dW;
                        idCanvas = "canvasFullSpecWaterfall3D-" + _id3dW;
                        _idContLoader = "contLoaderFullSpecWaterfall3D-" + _id3dW;
                        //_createLoadingScreen();

                        _parentContainer.append('<div id="' + idContCanvas + '">' +
                            '<canvas id="' + idCanvas + '"></canvas></div>');

                        fullSpecCascade3d.containerCanvas[_id3dW] = document.getElementById(idContCanvas);

                        fullSpecCascade3d.canvas[_id3dW] = document.getElementById(idCanvas);

                        fullSpecCascade3d.engine[_id3dW] = new BABYLON.Engine(fullSpecCascade3d.canvas[_id3dW]);
                        fullSpecCascade3d.scene[_id3dW] = new BABYLON.Scene(fullSpecCascade3d.engine[_id3dW]);
                        fullSpecCascade3d.events[_id3dW] = new Events3d(_id3d, _canvasType, wId);
                        fullSpecCascade3d.vbles[_id3dW] = {};
                        fullSpecCascade3d.contLoader[_id3dW] = $("#" + _idContLoader);

                        _contCanvas = fullSpecCascade3d.containerCanvas[_id3dW];
                        _canvas = fullSpecCascade3d.canvas[_id3dW];
                        _engine = fullSpecCascade3d.engine[_id3dW];
                        _scene = fullSpecCascade3d.scene[_id3dW];

                        _events = fullSpecCascade3d.events[_id3dW];

                        _contCanvas.style.width = "100%";
                        _contCanvas.style.height = "100%";
                        _canvas.style.width = "100%";
                        _canvas.style.height = "100%";
                    }
                 break;
            }
        };

        _createLoadingScreen = function () {
            
            _parentContainer.append('<div id="' + _idContLoader + '" style="width: 100%; height: 100%; position: absolute; top: 0px; background-color: black; display: block; z-index: 1; "></div>');
            _contLoader = $("#" + _idContLoader);

            _contLoader.html('<center><img src="../Content/images/loading.gif" height="126px" width="232px" style="margin: auto; top: 100px; position: relative;"><div style="color: white; position: relative; top: 70px;">Cargando...</div></center>');


            //_contLoader.hide();
        };

        _createScene = function () {

            var camera, light = {};

            _engine.enableOfflineSupport = false;

            if (_canvasType === "Viewer") {
                _scene.clearColor = BABYLON.Color3.FromHexString(nodes[_id3dW].Properties3d.colors.clearColor);
            }
            else {
                _scene.clearColor = BABYLON.Color3.FromHexString("#000000");
            }
            


            camera = new BABYLON.ArcRotateCamera(
                _cameras.name,
                _cameras.prop.alpha,
                _cameras.prop.beta,
                _cameras.prop.radius,
                _cameras.prop.target,
                _scene);

            camera.attachControl(_canvas, false);
            camera.lowerBetaLimit = 0.01;
            //camera.lowerAlphaLimit = 0.01;
            camera.lowerRadiusLimit = _cameras.prop.lowerRadiusLimit;
            camera.upperRadiusLimit = _cameras.prop.upperRadiusLimit;
            
            camera.wheelPrecision = _cameras.prop.wheelPrecision;

            camera.maxZ = _cameras.prop.maxZ;
            camera.fov = _cameras.prop.fov;

            light[_lights[0].name] = new BABYLON.HemisphericLight(
                _lights[0].name,
                _lights[0].pos,
                _scene);
            light[_lights[0].name].intensity = _lights[0].intensity;

            light[_lights[1].name] = new BABYLON.DirectionalLight(
                _lights[1].name,
                _lights[1].pos,
                _scene);

            light[_lights[1].name].intensity = _lights[1].intensity;
            light[_lights[1].name].parent = camera;

            

            _engine.runRenderLoop(function () {
                _scene.render();
                
                /*
                if (canvasType === "Waterfall" || canvasType === "FullSpecWaterfall" && _scene.getMeshByName("Labels-Value-Frec-0")) {
                    if (_scene.activeCamera.beta <= 0.15) {
                        for (var i = 0; i < 6; i++) {
                            _scene.getMeshByName("Labels-Value-Frec-" + i).billboardMode = 1;
                            _scene.getMeshByName("Labels-Value-Tiemp-" + i).billboardMode = 1;
                            _scene.getMeshByName("Labels-Value-Frec-" + i).rotation.z = -Math.PI / 2;
                        }
                    }
                    else {
                        for (var i = 0; i < 6; i++) {
                            _scene.getMeshByName("Labels-Value-Frec-" + i).billboardMode = 7;
                            _scene.getMeshByName("Labels-Value-Tiemp-" + i).billboardMode = 7;
                            _scene.getMeshByName("Labels-Value-Frec-" + i).rotation.z = 0;
                        }
                    }
                }*/
                if ((canvasType === "Waterfall" || canvasType === "WaterfallRPM") && _scene.getMeshByName("Labels-Value-Amp-0")) {
                    if (_scene.activeCamera.beta <= 0.15 || _scene.activeCamera.beta > Math.PI * 0.9) {
                        for (var i = 0; i < 6; i++) {
                            _scene.getMeshByName("Labels-Value-Amp-" + i).visibility = false;
                        }
                    }
                    else {
                        for (var i = 0; i < 6; i++) {
                            _scene.getMeshByName("Labels-Value-Amp-" + i).visibility = true;
                        }
                    }
                } else if ((canvasType === "FullSpecWaterfallRPM" || canvasType === "FullSpecWaterfall") && _scene.getMeshByName("Labels-Value-Amp1-0")) {
                    if (_scene.activeCamera.beta <= 0.15 || _scene.activeCamera.beta > Math.PI * 0.9) {
                        for (var i = 0; i < 6; i++) {
                            _scene.getMeshByName("Labels-Value-Amp-" + i).visibility = false;
                            _scene.getMeshByName("Labels-Value-Amp1-" + i).visibility = false;
                        }
                    }
                    else {
                        for (var i = 0; i < 6; i++) {
                            _scene.getMeshByName("Labels-Value-Amp-" + i).visibility = true;
                            _scene.getMeshByName("Labels-Value-Amp1-" + i).visibility = true;
                        }
                    }
                }
            });
            /*
            _scene.executeWhenReady(function () {		// Optimize scene rendering		
                BABYLON.SceneOptimizer.OptimizeAsync(_scene, BABYLON.SceneOptimizerOptions.HighDegradationAllowed(),			
                    function() {				
                        console.log('FPS target reached');			
                    }, function() {				
                        console.log('FPS target NOT reached');			
                    }); 
            });*/

            _engine.resize();
        };

        _disposeScene = function () {

            _engine.stopRenderLoop();
            _scene.dispose();
            _engine.dispose();
            _contCanvas.remove();
            nodes[_id3dW] = null;

            switch (_canvasType) {
                case "Editor": {
                    delete editor3d.containerCanvas[_id3dW];
                    delete editor3d.contLoader[_id3dW];
                    delete editor3d.canvas[_id3dW];
                    delete editor3d.engine[_id3dW];
                    delete editor3d.scene[_id3dW];
                } break;
                case "Viewer": {
                    delete viewer3d.containerCanvas[_id3dW];
                    delete viewer3d.contLoader[_id3dW];
                    delete viewer3d.canvas[_id3dW];
                    delete viewer3d.engine[_id3dW];
                    delete viewer3d.scene[_id3dW];

                } break;
                case "Waterfall": {
                    delete cascade3d.containerCanvas[_id3dW];
                    delete cascade3d.contLoader[_id3dW];
                    delete cascade3d.canvas[_id3dW];
                    delete cascade3d.events[_id3dW];
                    delete cascade3d.engine[_id3dW];
                    delete cascade3d.scene[_id3dW];
                    delete cascade3d.vbles[_id3dW];

                } break;
                case "FullSpecWaterfall": {
                    delete fullSpecCascade3d.containerCanvas[_id3dW];
                    delete fullSpecCascade3d.contLoader[_id3dW];
                    delete fullSpecCascade3d.canvas[_id3dW];
                    delete fullSpecCascade3d.engine[_id3dW];
                    delete fullSpecCascade3d.scene[_id3dW];
                    delete fullSpecCascade3d.events[_id3dW];
                    delete fullSpecCascade3d.vbles[_id3dW];

                } break;
            }
        };

        _addEventListeners = function () {

            $('.grid-stack-item').on('resizestop', function () {
                setTimeout(function () {
                    _engine.resize();
                    if (_scene.activeCamera !== null) {
                        if (_scene.activeCamera.mode) {
                            var ratio = _contCanvas.offsetWidth / _contCanvas.offsetHeight;
                            var zoom = _scene.activeCamera.orthoTop;
                            var newWidth = zoom * ratio;
                            _scene.activeCamera.orthoLeft = -Math.abs(newWidth);
                            _scene.activeCamera.orthoRight = newWidth;
                            _scene.activeCamera.orthoBottom = -Math.abs(zoom);
                        }
                    }
                    
                }, 100);
            });
            
            window.addEventListener("resize", _events.onResize, false);
           _canvas.addEventListener("click", _events.onMouseDown, false);

           if (_canvasType === "Waterfall" || _canvasType === "FullSpecWaterfall") {
               _canvas.addEventListener("mousemove", _events.onMouseMove, false);
               _canvas.addEventListener("keydown", _events.onKeyDown, false);
            }

            _canvas.addEventListener("mousedown", _events.start);
            _canvas.addEventListener("touchstart", _events.start);
            _canvas.addEventListener("click", _events.click);
            _canvas.addEventListener("mouseout", _events.cancel);
            _canvas.addEventListener("touchend", _events.cancel);
            _canvas.addEventListener("touchleave", _events.cancel);
            _canvas.addEventListener("touchcancel", _events.cancel);
            

        };

        _disposeEventListeners = function () {
            window.removeEventListener("resize", _events.onResize, false);
            _canvas.removeEventListener("click", _events.onMouseDown, false);
            _contCanvas.removeEventListener("resize", _events.onResize, false);

            if (_canvasType !== "Waterfall" || _canvasType !== "FullSpecWaterfall") {
                _canvas.removeEventListener("mousedown", _events.start);
                _canvas.removeEventListener("touchstart", _events.start);
                _canvas.removeEventListener("click", _events.click);
                _canvas.removeEventListener("mouseout", _events.cancel);
                _canvas.removeEventListener("touchend", _events.cancel);
                _canvas.removeEventListener("touchleave", _events.cancel);
                _canvas.removeEventListener("touchcancel", _events.cancel);
                _canvas.removeEventListener("keydown", _events.onKeyDown, false);
            }
            else {
                _canvas.removeEventListener("mousemove", _events.onMouseMove, false);
            }
        };

        this.openCanvas = function () {
            _addVariables();
            _createScene();
            _addEventListeners();
        };

        this.closeCanvas = function () {
            _disposeEventListeners();
            _disposeScene();
        };

    };
    return ManageCanvas3d;
})();