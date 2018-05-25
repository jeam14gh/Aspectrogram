/*
 * CanvasPlot2d.js
 * 
 */

var CanvasPlot2d = {};

CanvasPlot2d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    CanvasPlot2d = function (idEntity, canvasType, wId) {

        var _scene,
            _selectCanvas,
            _returnPointsWithQuadBezier,
            _createMeshesWithVertices,
            _createLine,
            _createPlaneRoundedSquare;

        this.infoPlots = {
            orientation: 0,
            scale: 100,
            alpha: 0.1,
            factRad: 0.2,
            size: 1
        };
        //this.size = 100;
        
        _selectCanvas = function () {
            switch (canvasType) {
                case "Editor": {
                    _scene = editor3d.scene[idEntity + wId];
                } break;
                case "Viewer": {
                    _scene = viewer3d.scene[idEntity + wId];
                } break;
            }
        }();

        _returnPointsWithQuadBezier = function (iniP, cP, endP, centerPoint, nbPs) {

            var points = [];

            if (cP !== null) {
                var cubicBezier = BABYLON.Curve3.CreateQuadraticBezier(iniP, cP, endP, nbPs);
                cubicBezier = cubicBezier.getPoints();
                for (var i = 0; i < cubicBezier.length; i++) {

                    if (i < cubicBezier.length - 1) {

                        points.push(centerPoint.x, centerPoint.y, centerPoint.z);
                        points.push(cubicBezier[i].x, cubicBezier[i].y, cubicBezier[i].z);
                        points.push(cubicBezier[i + 1].x, cubicBezier[i + 1].y, cubicBezier[i + 1].z);
                    }
                }
            }
            else {
                points.push(centerPoint.x, centerPoint.y, centerPoint.z);
                points.push(iniP.x, iniP.y, iniP.z);
                points.push(endP.x, endP.y, endP.z);
            }

            return points;
        };

        _createMeshesWithVertices = function (name, points, color, alpha) {

            var vertexData = new BABYLON.VertexData();

            var ind = [];
            var norm = [];
            var col = [];

            for (var i1 = 0; i1 < points.length; i1++) {
                if (i1 < points.length / 3 - 2) {
                    ind.push(0, i1 + 1, i1 + 2);
                }
                norm.push(0, 0, 1);
                col.push(0, 1, 0, 0);
            }

            vertexData.positions = points;
            vertexData.indices = ind;
            vertexData.normals = norm;
            vertexData.color = col;

            var blankmesh = new BABYLON.Mesh(name, _scene);
            blankmesh.material = new BABYLON.StandardMaterial(name, _scene);
            blankmesh.material.diffuseColor = color;
            blankmesh.material.backFaceCulling = false;
            blankmesh.material.alpha = alpha;

            vertexData.applyToMesh(blankmesh, 1);

            return blankmesh;
        };

        _createLine = function (name, points, color) {

            var curve = [];

            for (var i = 3; i < points.length; i += 9) {
                curve.push(new BABYLON.Vector3(points[i], points[i + 1], points[i + 2]));
            }
            curve.push(new BABYLON.Vector3(points[3], points[4], points[5]));
            var line = BABYLON.Mesh.CreateLines("line-" + name, curve, _scene);
            line.color = color;

            return line;
        };

        _createPlaneRoundedSquare = function (name, w, h, rad, fillColor, alpha, lBC) {

            var data = [];
            var points = [];

            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(w / 2 - rad, -h / 2, 0), new BABYLON.Vector3(w / 2, -h / 2, 0), new BABYLON.Vector3(w / 2, -h / 2 + rad, 0), new BABYLON.Vector3(0, 0, 0), 10));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(w / 2, -h / 2 + rad, 0), null, new BABYLON.Vector3(w / 2, h / 2 - rad, 0), new BABYLON.Vector3(0, 0, 0), 0));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(w / 2, h / 2 - rad, 0), new BABYLON.Vector3(w / 2, h / 2, 0), new BABYLON.Vector3(w / 2 - rad, h / 2, 0), new BABYLON.Vector3(0, 0, 0), 10));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(w / 2 - rad, h / 2, 0), null, new BABYLON.Vector3(-w / 2 + rad, h / 2, 0), new BABYLON.Vector3(0, 0, 0), 0));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(-w / 2 + rad, h / 2, 0), new BABYLON.Vector3(-w / 2, h / 2, 0), new BABYLON.Vector3(-w / 2, h / 2 - rad, 0), new BABYLON.Vector3(0, 0, 0), 10));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(-w / 2, h / 2 - rad, 0), null, new BABYLON.Vector3(-w / 2, -h / 2 + rad, 0), new BABYLON.Vector3(0, 0, 0), 0));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(-w / 2, -h / 2 + rad, 0), new BABYLON.Vector3(-w / 2, -h / 2, 0), new BABYLON.Vector3(-w / 2 + rad, -h / 2, 0), new BABYLON.Vector3(0, 0, 0), 10));
            data.push(_returnPointsWithQuadBezier(new BABYLON.Vector3(-w / 2 + rad, -h / 2, 0), null, new BABYLON.Vector3(w / 2 - rad, -h / 2, 0), new BABYLON.Vector3(0, 0, 0), 0));

            for (var dl1 = 0; dl1 < data.length; dl1++) {
                for (var dl2 = 0; dl2 < data[dl1].length; dl2++) {
                    points.push(data[dl1][dl2]);
                }
            }

            var mesh = _createMeshesWithVertices(name, points, fillColor, alpha);
            var line = _createLine(name, points, lBC);
            line.parent = mesh;

            return mesh;
        };
        
        this.createPlotContainer = function (type) {

            var colors = globals3d.colors[idEntity + wId];

            var mesh, bgColor, blColor;

            bgColor = BABYLON.Color3.FromHexString(colors[type].bg);
            blColor = BABYLON.Color3.FromHexString(colors[type].bl);
           
            mesh = _createPlaneRoundedSquare(globals3d.names.plots[type].canvas + idEntity + wId,
                    this.infoPlots.size,
                    this.infoPlots.size,
                    this.infoPlots.size * this.infoPlots.factRad,
                    bgColor,
                    this.infoPlots.alpha,
                    blColor);

            mesh.scaling = new BABYLON.Vector3(this.infoPlots.scale, this.infoPlots.scale, this.infoPlots.scale);

            return mesh;
        };
   

    };
    return CanvasPlot2d;
})();