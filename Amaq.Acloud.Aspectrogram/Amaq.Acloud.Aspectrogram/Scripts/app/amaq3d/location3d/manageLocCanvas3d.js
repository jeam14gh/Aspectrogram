/*
 * manageCanvas3d.js
 * Manejo de variables para la creación de Canvas 3d (Editor o Visor)
 */

var ManageLocCanvas3d = {};

ManageLocCanvas3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ManageLocCanvas3d = function (_widgetId, parentContId) {


        var _scene,
            _engine,
            _canvas,
            _parentContainer,
            _contCanvas,
            _contLoader,
            _canvas,
            _events,
            _idContLoader,
            _addVariables,
            _createLoadingScreen,
            _disposeVariables,
            _addEventListeners,
            _disposeEventListeners,
            _createScene,
            _disposeScene,
            _cameras,
            _lights;
        
        var scope = this;

        _parentContainer = $("#" + parentContId);

        _cameras = {
            prop: {
                alpha: 0,
                beta: 0,
                radius: 10000,
                target: new BABYLON.Vector3(100, 0, 0),
                lowerRadiusLimit: 10,
                upperRadiusLimit: 50000,
                maxZ: 50000,
                wheelPrecision: 0.1,
                fov: 0.8
            },
            name: "ArcRotateCamera"
        };

        _lights = [
                { name: "Hemispheric", pos: new BABYLON.Vector3(0, -1000, 0), intensity: 0.5 },
                { name: "Hemispheric", pos: new BABYLON.Vector3(0, 1000, 0), intensity: 0.5 },
                { name: "Directional1", pos: new BABYLON.Vector3(0, 0, 1), intensity: 0.8 },
                { name: "Directional2", pos: new BABYLON.Vector3(0, 1, 0), intensity: 0.8 }
        ];
            

        this.addVariables = function () {
            var idCanvas, idContCanvas;


            if (location3d.containerCanvas[_widgetId] === null ||
                location3d.containerCanvas[_widgetId] === undefined) {

                idContCanvas = "contCanvasLoc3D-";
                idCanvas = "canvasLoc3D-";
                _idContLoader = "contLoaderLoc3D-";
                //_createLoadingScreen();

                _parentContainer.append('<div id="' + idContCanvas + '">' +
                    '<canvas id="' + idCanvas + '"></canvas></div>');

                location3d.containerCanvas[_widgetId] = document.getElementById(idContCanvas);

                location3d.canvas[_widgetId] = document.getElementById(idCanvas);
                location3d.vbles[_widgetId] = {};
                location3d.engine[_widgetId] = new BABYLON.Engine(location3d.canvas[_widgetId]);
                location3d.scene[_widgetId] = new BABYLON.Scene(location3d.engine[_widgetId]);
                location3d.events[_widgetId] = new EventsLoc3d(_widgetId, parentContId);
                location3d.contLoader[_widgetId] = $("#" + _idContLoader);

                _contCanvas = location3d.containerCanvas[_widgetId];
                _canvas = location3d.canvas[_widgetId];
                _engine = location3d.engine[_widgetId];
                _scene = location3d.scene[_widgetId];


                _events = location3d.events[_widgetId];

                _contCanvas.style.width = "100%";
                _contCanvas.style.height = "100%";
                _canvas.style.width = "100%";
                _canvas.style.height = "100%";
            }
        };

        _createLoadingScreen = function () {

            _parentContainer.append('<div id="' + _idContLoader + '" style="width: 100%; height: 100%; position: absolute; top: 0px; background-color: black; display: block; z-index: 1; "></div>');
            _contLoader = $("#" + _idContLoader);

            _contLoader.html('<center><img src="../Content/images/loading.gif" height="126px" width="232px" style="margin: auto; top: 100px; position: relative;"><div style="color: white; position: relative; top: 70px;">Cargando...</div></center>');


            //_contLoader.hide();
        };

        this.createScene = function () {

            var camera,
                light = {};

            light = {};

            _engine.enableOfflineSupport = false;

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
            
            light[_lights[1].name] = new BABYLON.HemisphericLight(
                _lights[1].name,
                _lights[1].pos,
                _scene);

            light[_lights[1].name].intensity = _lights[2].intensity;
            //light[_lights[1].name].parent = camera;

            light[_lights[2].name] = new BABYLON.DirectionalLight(
                _lights[2].name,
                _lights[2].pos,
                _scene);

            light[_lights[2].name].intensity = _lights[2].intensity;
            light[_lights[2].name].parent = camera;

            _scene.clearColor = BABYLON.Color3.FromHexString("#000000");


            _engine.runRenderLoop(function () {
                _scene.render(); 
            });
            
            _engine.resize();
        };

        this.disposeScene = function () {

            _engine.stopRenderLoop();
            _scene.dispose();
            _engine.dispose();
            _contCanvas.remove();

            delete location3d.containerCanvas;
            delete location3d.canvas;
            delete location3d.engine;
            delete location3d.scene;
        };

        this.addEventListeners = function () {


            _canvas.addEventListener("mousemove", _events.onMouseMove, false);

            $('.grid-stack-item').on('resizestop', function () {
                setTimeout(function () {
                    _engine.resize();
                   

                }, 100);
            });

            /*
            window.addEventListener("resize", _events.onResize, false);
            _canvas.addEventListener("mousedown", _events.onMouseDown, false);

            _canvas.addEventListener("mousedown", _events.start);
            _canvas.addEventListener("touchstart", _events.start);
            _canvas.addEventListener("click", _events.click);
            _canvas.addEventListener("mouseout", _events.cancel);
            _canvas.addEventListener("touchend", _events.cancel);
            _canvas.addEventListener("touchleave", _events.cancel);
            _canvas.addEventListener("touchcancel", _events.cancel);
            */

        };

        this.disposeEventListeners = function () {

            _canvas.removeEventListener("mousemove", _events.onMouseMove, false);
            /*
            window.removeEventListener("resize", _events.onResize, false);
            _canvas.removeEventListener("mousedown", _events.onMouseDown, false);
            _contCanvas.removeEventListener("resize", _events.onResize, false);

            if (_canvasType !== "Waterfall") {
                _canvas.removeEventListener("mousedown", _events.start);
                _canvas.removeEventListener("touchstart", _events.start);
                _canvas.removeEventListener("click", _events.click);
                _canvas.removeEventListener("mouseout", _events.cancel);
                _canvas.removeEventListener("touchend", _events.cancel);
                _canvas.removeEventListener("touchleave", _events.cancel);
                _canvas.removeEventListener("touchcancel", _events.cancel);
            }
            else {
                _canvas.removeEventListener("mousemove", _events.onMouseMove, false);
            }
            */
        };

        this.openCanvas = function () {
            scope.addVariables();
            scope.createScene();
            scope.addEventListeners();
        };

        this.closeCanvas = function () {
            scope.disposeEventListeners();
            scope.disposeScene();
        };

        
    };
    return ManageLocCanvas3d;
})();