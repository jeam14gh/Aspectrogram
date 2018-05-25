/*
 * HelpersEd3d.js
 * Eventos de editor para contenido 3D
 */

var HelpersEd3d = {};

var HelpersEd3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    HelpersEd3d = function (idEntity) {

        
        var _scene,
            _createEye,
            _createRotationArrrow,
            _createAxisHelpers,
            _createHelpAxis,
            _createText;

        var scope = this;

        _scene = editor3d.scene[idEntity];
        
        this.createAxisHelpers = function () {
            _createEye();
            _createRotationArrrow();
            _createHelpAxis();
            _createAxisHelpers();
        };

        _createEye = function () {
            var cylEye, sphBigEye, sphSmallEye, utilsEye, eyeAxis;

            utilsEye = globalsMenuEd.utilsNames.eye;

            eyeAxis = new BABYLON.Mesh.CreateBox("parent" + utilsEye.name + '-' + idEntity, 0.001, _scene);

            cylEye = BABYLON.Mesh.CreateCylinder("cone" + utilsEye.name + '-' + idEntity, 0.40 * utilsEye.size, 0.145 * utilsEye.size, 0.44 * utilsEye.size, 64, 0, _scene);
            cylEye.parent = eyeAxis;


            cylEye.material = new BABYLON.StandardMaterial("materialcylEye" + '-' + idEntity, _scene);
            cylEye.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
            cylEye.material.emissiveColor = new BABYLON.Color3(1, 0, 0);

            sphBigEye = BABYLON.Mesh.CreateSphere("sphereBig" + '-' + idEntity, 10, 0.30 * utilsEye.size, _scene);
            sphBigEye.material = new BABYLON.StandardMaterial("materialSphBig" + '-' + idEntity, _scene);
            sphBigEye.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
            sphBigEye.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            sphBigEye.parent = eyeAxis;

            sphSmallEye = BABYLON.Mesh.CreateSphere("sphereSmall" + '-' + idEntity, 10, 0.250 * utilsEye.size, _scene);
            sphSmallEye.material = new BABYLON.StandardMaterial("materialSphSmall" + '-' + idEntity, _scene);
            sphSmallEye.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
            sphSmallEye.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
            sphSmallEye.parent = eyeAxis;

            sphBigEye.position = new BABYLON.Vector3(0, -0.15 * utilsEye.size, 0);
            sphSmallEye.position = new BABYLON.Vector3(0, -0.25 * utilsEye.size, 0);

            eyeAxis.visibility = false;
        };

        _createRotationArrrow = function () {

            var arrowTS, utilsarrowTS, sizeCurve, sizeArrow, origVec, control, destVec, paths1, paths2, pathArrowPos, pathArrowNeg, ribbon1, pathCurveZPos, pathCurveZNeg, ribbon2, mat;

            //utils = varEditor.axis.utils.arrowTS;
            //arrowTS = globalsMenuEd.utilsNames.eye;

            utilsarrowTS = globalsMenuEd.utilsNames.arrowTS;

            sizeCurve = globalsMenuEd.utilsNames.arrowTS.size;
            sizeArrow = sizeCurve * 0.15;

            arrowTS = new BABYLON.Mesh.CreateBox("parent" + utilsarrowTS.name + '-' + idEntity, 0.001, _scene);

            origVec = new BABYLON.Vector3(-sizeCurve, 0, sizeArrow / 2);
            control = new BABYLON.Vector3(0, sizeCurve, sizeArrow / 2);
            destVec = new BABYLON.Vector3(-sizeCurve, 0, sizeArrow / 2);

            paths1 = [];
            paths2 = [];

            pathArrowPos = [
                new BABYLON.Vector3(-sizeCurve / 9, -sizeCurve / 3 - sizeArrow, 0.1),
                new BABYLON.Vector3(-sizeCurve / 3, -sizeCurve / 3, sizeArrow)
            ];
            paths2.push(pathArrowPos);

            pathArrowNeg = [
                new BABYLON.Vector3(-sizeCurve / 3, -sizeCurve / 3, -sizeArrow),
                new BABYLON.Vector3(-sizeCurve / 9, -sizeCurve / 3 - sizeArrow, 0.1)
            ];
            paths2.push(pathArrowNeg);



           // ribbon1 = BABYLON.Mesh.CreateRibbon("ribbon1" + utilsarrowTS.name + '-' + idEntity, paths1, false, false, 0, _scene);
            
            pathCurveZPos = BABYLON.Curve3.CreateCubicBezier(
                                        new BABYLON.Vector3(-sizeCurve / 3, -sizeCurve / 3, sizeArrow / 2),
                                        new BABYLON.Vector3(-sizeCurve, 2 * sizeCurve / 3, sizeArrow / 2),
                                        new BABYLON.Vector3(sizeCurve, 2 * sizeCurve / 3, sizeArrow / 2),
                                        new BABYLON.Vector3(sizeCurve / 3, -sizeCurve / 3, sizeArrow / 2), 20);
            paths2.push(pathCurveZPos.getPoints());

            pathCurveZNeg = BABYLON.Curve3.CreateCubicBezier(
                                        new BABYLON.Vector3(-sizeCurve / 3, -sizeCurve / 3, -sizeArrow / 2),
                                        new BABYLON.Vector3(-sizeCurve, 2 * sizeCurve / 3, -sizeArrow / 2),
                                        new BABYLON.Vector3(sizeCurve, 2 * sizeCurve / 3, -sizeArrow / 2),
                                        new BABYLON.Vector3(sizeCurve / 3, -sizeCurve / 3, -sizeArrow / 2), 20);
            paths2.push(pathCurveZNeg.getPoints());

            ribbon2 = BABYLON.Mesh.CreateRibbon("ribbon2"  + utilsarrowTS.name + '-' + idEntity, paths2, false, false, 0, _scene);
           
          //  ribbon1.parent = arrowTS;
            ribbon2.parent = arrowTS;

            mat = new BABYLON.StandardMaterial("mat1Ribbons" + '-' + idEntity, _scene);
            mat.alpha = 1.0;
            mat.diffuseColor = new BABYLON.Color3(0.388, 0.87, 0.87);
            mat.backFaceCulling = false;

           // ribbon1.material = mat;
            ribbon2.material = mat;

            arrowTS.visibility = false;
        };

        _createHelpAxis = function () {
            var helpAxis, cylAxisHelp, utilsposHelp;

            utilsposHelp = globalsMenuEd.utilsNames.posHelp;

            helpAxis = new BABYLON.Mesh.CreateBox("parent" + utilsposHelp.name + '-' + idEntity, 0.00001, _scene);
            cylAxisHelp = BABYLON.Mesh.CreateCylinder("axis" + utilsposHelp.name + '-' + idEntity, utilsposHelp.size, utilsposHelp.size, utilsposHelp.size, 32, 0, _scene);
            cylAxisHelp.rotation.x = Math.PI * 90 / 180;
            cylAxisHelp.parent = helpAxis;
            cylAxisHelp.material = new BABYLON.StandardMaterial("materialAxisHelp" + '-' + idEntity, _scene);
            cylAxisHelp.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
            helpAxis.visibility = false;
        };
        
        _createAxisHelpers = function () {
            var pathX, pathY, pathZ, lineX, lineY, lineZ, canvasTextX, canvasTextY, canvasTextZ, dtX, dtY, dtZ, con2dX, con2dY, con2dZ;

            pathX = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(12, 0, 0)];
            pathY = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 12, 0)];
            pathZ = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, 12)];

            lineX = BABYLON.Mesh.CreateLines(globalsMenuEd.utilsNames.helperAxis.x + idEntity, pathX, _scene, true);
            lineY = BABYLON.Mesh.CreateLines(globalsMenuEd.utilsNames.helperAxis.y + idEntity, pathY, _scene, true);
            lineZ = BABYLON.Mesh.CreateLines(globalsMenuEd.utilsNames.helperAxis.z + idEntity, pathZ, _scene, true);

            lineX.color = new BABYLON.Color3(1, 0, 0);
            lineY.color = new BABYLON.Color3(0, 1, 0);
            lineZ.color = new BABYLON.Color3(0, 0, 1);

            canvasTextX = _createText("X", 1);
            canvasTextY = _createText("Y", 1);
            canvasTextZ = _createText("Z", 1);

            dtX = canvasTextX.material.diffuseTexture;
            dtY = canvasTextY.material.diffuseTexture;
            dtZ = canvasTextZ.material.diffuseTexture;

            con2dX = dtX.getContext();
            con2dY = dtY.getContext();
            con2dZ = dtZ.getContext();

            dtX.drawText("X", null, 20, "16px  Calibri", "#ff0000", null);
            dtY.drawText("Y", null, 20, "16px  Calibri", "#00ff00", null);
            dtZ.drawText("Z", null, 20, "16px  Calibri", "#0000ff", null);

            canvasTextX.position = new BABYLON.Vector3(120, 0, 0);
            canvasTextY.position = new BABYLON.Vector3(0, 120, 0);
            canvasTextZ.position = new BABYLON.Vector3(0, 0, 120);
        };

       _createText = function (name, canvasSize) {

            var textPlaneTexture = new BABYLON.DynamicTexture("textAxisHelpersTPT-" + name, 30, _scene, true);

            textPlaneTexture.hasAlpha = true;
            var textPlane = BABYLON.Mesh.CreatePlane("textAxisHelpersTP-" + name, canvasSize, _scene, false);

            textPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            textPlane.material = new BABYLON.StandardMaterial("mat-" + "textAxisHelpersTP-" + name, _scene);
            textPlane.material.diffuseColor = new BABYLON.Color3(0, 1, 0);

            textPlane.material.diffuseTexture = textPlaneTexture;
            textPlane.material.diffuseTexture.level = 2;
            textPlane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            textPlane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);

            textPlane.material.backFaceCulling = false;

            return textPlane;
        };
    };
    return HelpersEd3d;
})();