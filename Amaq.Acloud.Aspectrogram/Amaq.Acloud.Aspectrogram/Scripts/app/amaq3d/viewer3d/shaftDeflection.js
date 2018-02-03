/*
 * ShaftDeflection.js
 * 
 */

var ShaftDeflection = {};

ShaftDeflection = function () {
    "use strict";

    /*
     * Constructor.
     */
    ShaftDeflection = function (idEntity, wId) {

        var _scene,
            _points,
            _arrayAxis = [],
            _orderPointsY,
            _orderPointsZ,
            _sliceArrayxyz,
            _findZMatrix,
            _findXYMatrix,
            _findYMatrix,
            _findXZMatrix,
            _solvePolyH,
            _solvePolyV,
            _createVectorsH,
            _createVectorsV,
            _getPoints,
            _pointsNew,
            _lengthArrayPoints = 0;

        _scene = viewer3d.scene[idEntity + wId];

        //Crear Vectores
        _createVectorsH = function (facts, arrayZ) {

            var N, iniZ, endZ, arrayVects = [], x = 0, y = 0;
            N = arrayZ.length;
            iniZ = arrayZ[0];
            endZ = arrayZ[N - 1];

            for (var i = iniZ; i <= endZ; i++) {
                for (var j = 0; j < N; j++) {
                    x += facts.x[j] * Math.pow(i, N - (j + 1));
                    y += facts.y[j] * Math.pow(i, N - (j + 1));
                }

                arrayVects.push(new BABYLON.Vector3(x, y, i));
                x = 0;
                y = 0;
            }

            return arrayVects;
        };

        //Crear Vectores
        _createVectorsV = function (facts, arrayY) {

            var N, iniY, endY, arrayVects = [], x = 0, z = 0;
            N = arrayY.length;
            iniY = arrayY[0];
            endY = arrayY[N - 1];

            for (var i = iniY; i <= endY; i++) {
                for (var j = 0; j < N; j++) {
                    x += facts.x[j] * Math.pow(i, N - (j + 1));
                    z += facts.z[j] * Math.pow(i, N - (j + 1));
                }

                arrayVects.push(new BABYLON.Vector3(x, i, z));
                x = 0;
                z = 0;
            }

            return arrayVects;
        };

        //Resolver polinomio
        _solvePolyH = function () {

            var matrixX, matrixY, matrixZ, matrixZinv, factsX, factsY;

            matrixX = _findXYMatrix().matrixX;
            matrixY = _findXYMatrix().matrixY;
            matrixZ = _findZMatrix();
            if (_points.length == matrixZ.length) {
                matrixZinv = math.inv(matrixZ);
            }

            factsX = math.multiply(matrixZinv, matrixX);
            factsY = math.multiply(matrixZinv, matrixY);
            
            return { x: factsX, y: factsY}           
        };

        //Resolver polinomio
        _solvePolyV = function () {

            var matrixX, matrixY, matrixZ, matrixYinv, factsX, factsZ;

            matrixX = _findXZMatrix().matrixX;
            matrixZ = _findXZMatrix().matrixZ;
            matrixY = _findYMatrix();
            matrixYinv = math.inv(matrixY);

            factsX = math.multiply(matrixYinv, matrixX);
            factsZ = math.multiply(matrixYinv, matrixZ);

            return { x: factsX, z: factsZ }
        };

        //Orientacion Horizontal
        //Encontrar matriz X y Y
        _findXZMatrix = function () {

            var arrayX, arrayZ, N, matrixX = [], matrixZ = [], rows = [];

            arrayX = _sliceArrayxyz().x;
            arrayZ = _sliceArrayxyz().z;
            N = arrayX.length;

            for (var i = 0; i < N; i++) {
                matrixX.push(arrayX[i]);
                matrixZ.push(arrayZ[i]);
            }

            return { matrixX: matrixX, matrixZ: matrixZ };
        };

        //Encontrar matriz Z
        _findZMatrix = function () {

            var array, N, matrix = [], rows = [];

            array = _sliceArrayxyz().z;
            N = array.length;

            for (var i = 0; i < N; i++) {
                for (var j = 1; j <= N; j++) {
                    rows.push(Math.pow(array[i], N - j));
                }
                matrix.push(rows);
                rows = [];
            }

            return matrix;

        };

        //Organización de puntos Z
        _orderPointsZ = function () {

            var arrayZPoints = [], newPoints = [];

            for (var i = 0; i < _points.length; i++) {
                arrayZPoints.push(_points[i].z);
            }

            arrayZPoints.sort(function (a, b) { return a - b });

            for (var j = 0; j < arrayZPoints.length; j++) {
                for (var k = 0; k < _points.length; k++) {
                    if (_points[k].z === arrayZPoints[j]) {
                        newPoints.push(_points[k]);
                    }
                }
            }

            return newPoints;
        };

        //Orientacion Vertical
        //Encontrar matriz X y Y

        _findXYMatrix = function () {

            var arrayX, arrayY, N, matrixX = [], matrixY = [], rows = [];

            arrayX = _sliceArrayxyz().x;
            arrayY = _sliceArrayxyz().y;
            N = arrayX.length;

            for (var i = 0; i < N; i++) {
                matrixX.push(arrayX[i]);
                matrixY.push(arrayY[i]);
            }

            return { matrixX: matrixX, matrixY: matrixY };
        };

        //Encontrar matriz y
        _findYMatrix = function () {

            var array, N, matrix = [], rows = [];

            array = _sliceArrayxyz().y;
            N = array.length;

            for (var i = 0; i < N; i++) {
                for (var j = 1; j <= N; j++) {
                    rows.push(Math.pow(array[i], N - j));
                }
                matrix.push(rows);
                rows = [];
            }

            return matrix;

        };

        //Organización de puntos
        _orderPointsY = function () {

            var arrayYPoints = [], newPoints = [];

            for (var i = 0; i < _points.length; i++) {
                arrayYPoints.push(_points[i].y);
            }

            arrayYPoints.sort(function (a, b) { return a - b });

            for (var j = 0; j < arrayYPoints.length; j++) {
                for (var k = 0; k < _points.length; k++) {
                    if (_points[k].y === arrayYPoints[j]) {
                        newPoints.push(_points[k]);
                    }
                }
            }

            return newPoints;
        };

        //separar array x, y y z
        _sliceArrayxyz = function () {

            var x = [], y = [], z = [], N;

            N = _pointsNew.length;

            for (var i = 0; i < _pointsNew.length; i++) {
                x.push(_pointsNew[i].x);
                y.push(_pointsNew[i].y);
                z.push(_pointsNew[i].z);
            }

            return { x: x, y: y, z: z };
        };



        _getPoints = function () {

            var point, position, idPoint, array = [], pointParent, axisNum, indexPiece;

            _arrayAxis = [];

            for (var i = 0; i < nodes[idEntity + wId].Properties3d.asset.axis.length; i++) {
                _arrayAxis.push({ idPoints: [], pointArray: [] });
            }

            for (var i = 0; i < nodes[idEntity + wId].Properties3d.points.children.length; i++) {
                idPoint = nodes[idEntity + wId].Properties3d.points.children[i].idPoint;
                indexPiece = nodes[idEntity + wId].Properties3d.points.children[i].indexPiece[idEntity];

                if (vbles[idPoint].Orientation === 1 && vbles[idPoint].AssociatedMeasurementPointId != null && _scene.getMeshByName("point-" + globals3d.names.plots["ShaftDef"].canvas + idPoint + wId) !== null) {
                    pointParent = nodes[idEntity + wId].Properties3d.points.children[i].info.parentName;
                    for (var j = 0; j < nodes[idEntity + wId].Properties3d.asset.children.length; j++) {
                        if (nodes[idEntity + wId].Properties3d.asset.children[j].fileName == pointParent) {
                            if (nodes[idEntity + wId].Properties3d.asset.children[j].axisNum.length > 1) {
                                axisNum = nodes[idEntity + wId].Properties3d.asset.children[j].axisNum[indexPiece];
                            } else {
                                axisNum = nodes[idEntity + wId].Properties3d.asset.children[j].axisNum;
                            }
                            
                            _arrayAxis[axisNum].idPoints.push(idPoint);
                            break;
                        }
                    }
                    point = _scene.getMeshByName("point-" + globals3d.names.plots["ShaftDef"].canvas + idPoint + wId);
                    position = point.position;
                    if (position.x !== undefined && position.y !== undefined && position.z !== undefined) {
                        _arrayAxis[axisNum].pointArray.push(position);
                    }
                }
            }
            /*
            for (var i = 0; i < nodes[idEntity + wId].Properties3d.points.children.length; i++) {
                if (!nodes[idEntity + wId].Properties3d.points.children[i].info.axial) {

                    idPoint = nodes[idEntity + wId].Properties3d.points.children[i].idPoint;
                    if (vbles[idPoint].Orientation === 1 && vbles[idPoint].AssociatedMeasurementPointId != null) {

                        if (_scene.getMeshByName("point-" + globals3d.names.plots["ShaftDef"].canvas + idPoint + wId) !== null) {
                            point = _scene.getMeshByName("point-" + globals3d.names.plots["ShaftDef"].canvas + idPoint + wId);
                            position = point.position;
                            console.log(point.name);
                        }  
                        if (position !== undefined) {
                            array.push(position);
                        }
                    }
                }
            }
            _points = array;*/
        };


        //Crear curva
        this.createCurveH = function () {

            var path3d, curve, line, newLine, arrayZ, facts, arrayVects;
            _getPoints();

            for (var h = 0; h < nodes[idEntity + wId].Properties3d.asset.axis.length; h++) {
                _lengthArrayPoints = 0;
                for (var i = 0; i < _arrayAxis.length ; i++) {
                    _points = _arrayAxis[i].pointArray;

                    if (_points.length > 1) {
                        _pointsNew = _orderPointsZ();
                        arrayZ = _sliceArrayxyz().z;
                        if (arrayZ) {
                            facts = _solvePolyH();
                            arrayVects = _createVectorsH(facts, arrayZ);

                            path3d = new BABYLON.Path3D(arrayVects);
                            curve = path3d.getCurve();

                            if (_pointsNew.length !== _lengthArrayPoints && _scene.getMeshByName(globals3d.names.plots.ShaftDef.line + "-" + i + idEntity + wId) == null) {
                                line = BABYLON.Mesh.CreateLines(globals3d.names.plots.ShaftDef.line + "-" + i + idEntity + wId, curve, _scene, true);
                                _lengthArrayPoints = i;
                                line.color = BABYLON.Color3.FromHexString(globals3d.colors[idEntity + wId].ShaftDef.lc);
                            }
                            else {
                                newLine = _scene.getMeshByName(globals3d.names.plots.ShaftDef.line + "-" + i + idEntity + wId);
                                newLine = BABYLON.Mesh.CreateLines(null, curve, null, null, newLine);
                            }
                        }
                    }
                }
            }

        };

        this.createCurveV = function () {

            var path3d, curve, line, newLine, arrayY, facts, arrayVects;
            _getPoints();

            for (var h = 0; h < nodes[idEntity + wId].Properties3d.asset.axis.length; h++) {
                for (var i = 0; i < _arrayAxis.length ; i++) {
                    _points = _arrayAxis[i].pointArray;
                    if (_points.length > 1) {
                        _pointsNew = _orderPointsY();
                        arrayY = _sliceArrayxyz().y;
                        if (arrayY) {
                            facts = _solvePolyV();
                            arrayVects = _createVectorsV(facts, arrayY);

                            path3d = new BABYLON.Path3D(arrayVects);
                            curve = path3d.getCurve();

                            if (_pointsNew.length !== _lengthArrayPoints && _scene.getMeshByName(globals3d.names.plots.ShaftDef.line + "-" + i + idEntity + wId) == null) {
                                line = BABYLON.Mesh.CreateLines(globals3d.names.plots.ShaftDef.line + "-" + i + idEntity + wId, curve, _scene, true);
                                _lengthArrayPoints = _pointsNew.length;
                                line.color = BABYLON.Color3.FromHexString(globals3d.colors[idEntity + wId].ShaftDef.lc);
                            }
                            else {
                                newLine = _scene.getMeshByName(globals3d.names.plots.ShaftDef.line + "-" + i + idEntity + wId);
                                newLine = BABYLON.Mesh.CreateLines(null, curve, null, null, newLine);
                            }
                        }
                    }
                }
            }

        };
    };
    return ShaftDeflection;
}();