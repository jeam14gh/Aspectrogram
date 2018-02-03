/*
 * CanvasText2d.js
 * 
 */

var CanvasText2d = {};

CanvasText2d = function () {
    //"use strict";

    /*
     * Constructor.
     */
    CanvasText2d = function (idEntity, canvasType, wId) {

        var _scene,
            _selectCanvas,
            _calculateTextSize,
            _infoText;

        _infoText = {
            canvasSize: 60,
            fontWeight: "bold",
            fontStyle: "arial",
            width: 1500,
            namePoint: {
                fontSize: 180
            },
            nameSubVar: {
                fontSize: 160
            },
            pointValue: {
                fontSize: 170
            }
        };

        _selectCanvas = function () {
            switch (canvasType) {
            case "Editor":
                _scene = editor3d.scene[idEntity + wId];
                break;
            case "Viewer":
                _scene = viewer3d.scene[idEntity + wId];
                break;
            }
        }();

        /*
        * Crea texto en un canvas 2D para adaptarlo al 3D
        * @param {string} text: texto al que se le va a aclcular el tamaño
        */
        this.createText = function (idPoint, canvasSize) {

            var textPlaneTexture = new BABYLON.DynamicTexture(globals3d.names.text.texture + idPoint + wId, 80, _scene, true);
            
            textPlaneTexture.hasAlpha = true;
            var textPlane = BABYLON.Mesh.CreatePlane(globals3d.names.text.plane + idPoint + wId, canvasSize, _scene, false);

            textPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            textPlane.material = new BABYLON.StandardMaterial("mat-" + globals3d.names.text.plane + idPoint + wId, _scene);
            textPlane.material.diffuseColor = new BABYLON.Color3(0, 1, 0);

            textPlane.material.diffuseTexture = textPlaneTexture;
            textPlane.material.diffuseTexture.level = 2;
            textPlane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            textPlane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);

            textPlane.material.backFaceCulling = false;

            return textPlane;
        };

        this.showHideText = function (flag) {
            _scene.getMeshByName(globals3d.names.text.plane + idPoint + wId).visibility = flag;
        };


    };
    return CanvasText2d;
}();