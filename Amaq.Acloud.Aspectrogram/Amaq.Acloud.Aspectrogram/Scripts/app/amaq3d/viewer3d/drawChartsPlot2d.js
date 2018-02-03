/*property
    Color3, CreateCylinder, CreateLines, FromHexString, Mesh, PI, Properties3d,
    ShaftDef, StandardMaterial, canvas, color, colors, diffuseColor, dispose,
    drawChartInPLot, getMeshByName, gralInfo, lc, length, material, names, orb,
    orientation, plots, position, rotation, sCL, scaling, scene, spec,
    waterfall, x, y, z
*/
/*
 * DrawChartsPlot2d.js 
 */

var DrawChartsPlot2d = {};

var DrawChartsPlot2d = function () {
    "use strict";

    /*
     * Constructor.
     */
    DrawChartsPlot2d = function (idEntity, wId) {

        var _scene,
            _createPointForOrb,
            _lengthPath,
            _orientation,
            _flagPath;

        _lengthPath = {
            spec: 0,
            orb: 0,
            sCL: 0,
            waterfall: 0,
            ShaftDef: 0
        };


        _orientation = nodes[idEntity + wId].Properties3d.gralInfo.orientation;

        _flagPath = {
            spec: false,
            orb: false,
            sCL: false,
            waterfall: false,
            ShaftDef: false
        };
        _scene = viewer3d.scene[idEntity + wId];


        this.drawChartInPLot = function (idPoint, type, path, tS, sizePlot) {

            var lineChart, newLine, point, colors, parent, position = {}, parentName, indexPiece;

            colors = globals3d.colors[idEntity + wId];
            parent = _scene.getMeshByName(globals3d.names.plots[type].canvas + idPoint + wId);

            if (type === "trend" || type === "spec" || type === "spec100p" || type === "waterfall") {
                position.x = parent.position.x + parent.scaling.x * 0.8 / 2;
                position.y = parent.position.y - parent.scaling.y * 0.8 / 2;
                position.z = parent.position.z;
            } else {
                position = parent.position;
            }           
            if (_scene.getMeshByName("point-" + globals3d.names.plots[type].canvas + idPoint + wId) !== null) {
                _scene.getMeshByName("point-" + globals3d.names.plots[type].canvas + idPoint + wId).dispose();
            }

            if (type === "orb" || type === "ShaftDef") {
                if (_orientation === 0) {
                    point = _createPointForOrb(type, idPoint, sizePlot, position.z, colors[type].lc);                    
                } else {
                    point = _createPointForOrb(type, idPoint, sizePlot, position.y, colors[type].lc);
                }                   
          }            
            if (path.length !== _lengthPath[type] || !_flagPath[type]) {
                if (_scene.getMeshByName("line-Chart-" + globals3d.names.plots[type].canvas + idPoint + wId) !== null) {
                    _scene.getMeshByName("line-Chart-" + globals3d.names.plots[type].canvas + idPoint + wId).dispose();
                }
                lineChart = BABYLON.Mesh.CreateLines("line-Chart-" + globals3d.names.plots[type].canvas + idPoint + wId, path, _scene, true);
                lineChart.rotation.x = parent.rotation.x;
            }
            if (lineChart) {
                lineChart.color = BABYLON.Color3.FromHexString(colors[type].lc);
                lineChart.position = position;

                newLine = _scene.getMeshByName("line-Chart-" + globals3d.names.plots[type].canvas + idPoint + wId);
                newLine = BABYLON.Mesh.CreateLines(null, path, null, null, newLine);
            }                                                  
            if (type === "orb" || type === "ShaftDef") {
                for (var i = 0; i < nodes[idEntity + wId].Properties3d.points.children.length; i++) {
                    if (nodes[idEntity + wId].Properties3d.points.children[i].idPoint === idPoint) {
                        indexPiece = nodes[idEntity + wId].Properties3d.points.children[i].indexPiece[idEntity];
                        parentName = "asset-" + idEntity + "-_-" + nodes[idEntity + wId].Properties3d.points.children[i].info.parentName + "-" + indexPiece + wId;
                        parent = _scene.getMeshByName(parentName);
                    }
                }
                if (_orientation === 0) {

                    if (!tS) {
                        point.position.x = -path[0].x + parent.parent.position.x;
                        point.position.y = path[0].y;
                    } else {
                        point.position.x = -path[path.length - 1].x + parent.parent.position.x;
                        point.position.y = path[path.length - 1].y;
                    }
                } else {
                    if (!tS) {
                        point.position.x = -path[0].x;
                        point.position.z = -path[0].y;
                    } else {
                        point.position.x = -path[path.length - 1].x;
                        point.position.z = -path[path.length - 1].y;
                    }
                }               
            }
            lineChart.rotation.y = Math.PI;
            _flagPath[type] = true;

            chartSpec.push(lineChart);
        };

        _createPointForOrb = function (type, idPoint, sizePlot, position, color) {
            var parentName, parent, orbPoint;

            orbPoint = BABYLON.Mesh.CreateCylinder("point-" + globals3d.names.plots[type].canvas + idPoint + wId, 0.1, sizePlot * 0.06, sizePlot * 0.06, 16, _scene, 1);

            if (_orientation === 0) {
                orbPoint.position.z = position;
                orbPoint.rotation.x = 90 * Math.PI / 180;
            } else {
                orbPoint.position.y = position;
            }

            orbPoint.material = new BABYLON.StandardMaterial("materialt-" + globals3d.names.plots[type].canvas + idPoint + wId, _scene);
            orbPoint.material.diffuseColor = BABYLON.Color3.FromHexString(color);

            return orbPoint;
        };        

    };
    return DrawChartsPlot2d;
}();