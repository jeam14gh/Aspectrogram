/*
 * Utilities3d.js
 * 
 */

var Utilities3d = {};

Utilities3d = function () {
    "use strict";

    /*
     * Constructor.
     */
    Utilities3d = function (idEntity, canvasType, wId) {

        var _scene,
            _events,
            _flags,
            _selectCanvas,
            _containerId;

        _flags = globals3d.flags[idEntity + wId];

        _selectCanvas = function () {
            switch (canvasType) {
                case "Editor": {
                    _scene = editor3d.scene[idEntity + wId];
                    _events = editor3d.events[idEntity + wId];
                    _containerId = editor3d.containerCanvas[idEntity + wId].id;
                } break;
                case "Viewer": {
                    _scene = viewer3d.scene[idEntity + wId];
                    _events = viewer3d.events[idEntity + wId];
                    _containerId = viewer3d.containerCanvas[idEntity + wId].id;
                } break;
            }
        }();      

        /*
         * Convierte el activo en alambre
         * @param {bool} flag: bandera para saber si es alambre o no. 0. Normal - 1. Alambre
         */
        this.convertAssetInWireframe = function (flag) {

            var alpha, tempMesh, fileName, housing = false;

           // alpha = 0.02;
            alpha = 0.04;
            _flags.machineView.wireframe = !_flags.machineView.wireframe;

            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.split("-_-")[0] === "asset-" + idEntity) {

                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));
                    tempMesh.material.wireframe = flag;

                    for (var j = 0; j < nodes[idEntity + wId].Properties3d.asset.children.length; j++) {
                        fileName = nodes[idEntity + wId].Properties3d.asset.children[j].fileName;
                        if (fileName === tempMesh.name.split(/[--]/)[3]) {
                            if (nodes[idEntity + wId].Properties3d.asset.children[j].partType === 'housing') {
                                housing = true;
                            }
                            else {
                                housing = false;
                            }
                        }
                    }

                    if (flag) {
                        tempMesh.material.emissiveColor = BABYLON.Color3.FromHexString(globals3d.colors[idEntity + wId].wireframe); //Reemplazar por el color del pick
                        tempMesh.material.alpha = alpha;
                    }
                    else {
                        tempMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                        if (housing) {
                            tempMesh.material.alpha = 0.3;
                        } else {
                            tempMesh.material.alpha = 1;
                        }
                    }
                }
            }
        };

        /*
         * Quita - Pone Carcazas al activo
         * @param {bool} flag: bandera para saber si es con carcaza o no o no. 0. NO carcaza - 1. SI carcaza
         */
        this.takeAwayHousing = function (flag) {

            var tempMesh;
            
            _flags.machineView.housing = !_flags.machineView.housing;

            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.split("-_-")[0] === "asset-" + idEntity) {

                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));

                    if (flag && tempMesh.material.alpha === 0.3) {
                        tempMesh.visibility = false;
                    }
                    else {
                        tempMesh.visibility = true;
                    }
                }
            }
        };

        /*
         * Asigna transparente el activo
         * @param {bool} flag: bandera para saber si es transparente o no o no. 0. NO Transparente - 1. SI Transparente
         */
        this.convertAssetInWhiteTransparent = function (flag) {
            

            var alpha, tempMesh, fileName, color, housing = false;

            alpha = 0.02;

            _flags.machineView.transparent = !_flags.machineView.transparent;

            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.split("-_-")[0] === "asset-" + idEntity) {

                    tempMesh = new Object(_scene.getMeshByName(_scene.meshes[i].name));

                    for (var j = 0; j < nodes[idEntity + wId].Properties3d.asset.children.length; j++) {
                        fileName = nodes[idEntity + wId].Properties3d.asset.children[j].fileName;
                        if (fileName === tempMesh.name.split(/[--]/)[3]) {
                            color = nodes[idEntity + wId].Properties3d.asset.children[j].color;
                            if (nodes[idEntity + wId].Properties3d.asset.children[j].partType === 'housing') {
                                housing = true;
                            }
                            else {
                                housing = false;
                            }
                        }
                    }

                    if (flag) {
                        tempMesh.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                        tempMesh.material.alpha = 0.1;
                    }
                    else {
                        tempMesh.material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                        if (housing) {
                            tempMesh.material.alpha = 0.3;
                        } else {
                            tempMesh.material.alpha = 1;
                        }
                    }
                }
            }


        };

        /*
         * convierte el container del 3d en pantalla completa
         */
        this.launchFullScreen = function () {

            _flags.various.fullScreen = true;

            var element = document.getElementById(_containerId);

            if (element.requestFullScreen) {
                element.requestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            }
            _flags.various.fullScreen = false;

        };

        /*
         *container del 3dsale de pantalla completa
         */
        this.cancelFullscreen = function () {

            _flags.various.fullScreen = false;

            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        };

        /*
         * Cambia el tipo de cámara -> ORTHOGRAPHIC_CAMERA y PERSPECTIVE_CAMERA
         * @param {bool} type: bandera para saber si es ORTHOGRAPHIC_CAMERA o PERSPECTIVE_CAMERA . 0. PERSPECTIVE_CAMERA - 1. ORTHOGRAPHIC_CAMERA
         */
        this.switchCamera = function (type) {
            //type = 0 - perspective --- type = 1 - orto

            var element = document.getElementById(_containerId);

            if (type) {
                _scene.activeCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                element.addEventListener("wheel", _events.zoomOrtographicViewer);

                _scene.activeCamera.beta = (90 * Math.PI) / 180;
                _scene.activeCamera.alpha = (-90 * Math.PI) / 180;
            }
            else {
                _scene.activeCamera.mode = BABYLON.Camera.PERSPECTIVE_CAMERA;
                element.removeEventListener("wheel", _events.zoomOrtographicViewer);
            }
        };

    };
    return Utilities3d;
}();