/*
 * loadMeshFiles.js
 * Carga para el Editor y el Viewer los archivos.babylon de cada entidad
 */

var LoadMeshes = {};

LoadMeshes = (function () {
    "use strict";

    /*
     * Constructor.
     */
    LoadMeshes = function (idEntity, canvasType, parentContId, wId) {

        var _scene,
            _engine,
            _canvas,
            _flags,
            _createFlags,
            _renderScene,
            _errorFiles = [],
            _urlFiles,
            _flagEntityLocation = false,
            _selectCanvas,
            _loadSTLFiles,
            _loadedFiles = 0,
            _filesToLoad,
            _asignPropertiesToMeshes,
            _changePropertiesToMesh,
            _findMaxUniqueId,
            _loadPoints,
            _loadCanvasText,
            _createParents,
            _createParentAxis,
            _createProbe,
            _createPlot,
            _createBandsForTrendPlot,
            _loadCharts,
            _locateAsset,
            _locateCamera,
            _searchAssetLevel,
            _isPrincipal,
            _calculateMaxSize,
            _disposeCanvasText,
            _changePositionText,
            _loadColors;

        this.infoGralEntity = {
            view: 1, // 0-> + , 1-> -
            isCloned: false,
            idCloned: '',
            size: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 }, total: { x: 0, y: 0, z: 0 }, prom: 0 },
            orientation: 0, //0-H, 1-V
            sizePlot: 1,
            canvasTextSize: 800
        };

        //this.isPrincipal = false;

        var scope = this;

        globals3d.flags[idEntity + wId] = {};


        _selectCanvas = function () {
            switch (canvasType) {
                case "Editor": {
                    _scene = editor3d.scene[idEntity + wId];
                    _engine = editor3d.engine[idEntity + wId];
                    _canvas = editor3d.canvas[idEntity + wId];
                } break;
                case "Viewer": {
                    _scene = viewer3d.scene[idEntity + wId];
                    _engine = viewer3d.engine[idEntity + wId];
                    _canvas = viewer3d.canvas[idEntity + wId];
                } break;
            }
        }();

        _createFlags = function () {
         
            _flags = globals3d.flags[idEntity + wId];

            _flags.machineView = {};
            _flags.machineView.wireframe = false;
            _flags.machineView.housing = false;
            _flags.machineView.transparent = false;

            _flags.plots = {};
            _flags.plots.trend = false;
            _flags.plots.spec = false;
            _flags.plots.spec100p = false;
            _flags.plots.orb = false;
            _flags.plots.orb1X = false;
            _flags.plots.ShaftDef = false;
            _flags.plots.sCL = false;
            _flags.plots.waterfall = false;

            _flags.various = {};
            _flags.various.fullScreen = false;

            _flags.animation = true;
        }();

        this.loadLocations = function () {
            _flagEntityLocation = true;
            _renderScene();
        };

        this.loadAsset = function (idChild) {

            var idNode, asset, qtyFiles, fileName, idNodeSTL, isPrincipal;

            if (_flagEntityLocation === true) {
                idNode = idChild;

                scope.infoGralEntity.view = nodes[idNode + wId].Properties3d.gralInfo.view;
                scope.infoGralEntity.isCloned = nodes[idNode + wId].Properties3d.gralInfo.isCloned;
                scope.infoGralEntity.idCloned = nodes[idNode + wId].Properties3d.gralInfo.idCloned;
                scope.infoGralEntity.orientation = nodes[idNode + wId].Properties3d.gralInfo.orientation;
                _createParents(idEntity, idChild);
            }
            else {
                idNode = idEntity;


                scope.infoGralEntity.view = nodes[idNode + wId].Properties3d.gralInfo.view;
                scope.infoGralEntity.isCloned = nodes[idNode + wId].Properties3d.gralInfo.isCloned;
                scope.infoGralEntity.idCloned = nodes[idNode + wId].Properties3d.gralInfo.idCloned;
                scope.infoGralEntity.orientation = nodes[idNode + wId].Properties3d.gralInfo.orientation;

                _createParents(idEntity, "_");
                _createProbe(idNode);
            }

            _filesToLoad = nodes[idNode + wId].Properties3d.asset.children.length;


            _createParentAxis(idNode);

            _isPrincipal = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", idNode, false))[0].IsPrincipal;

            if (nodes[idNode + wId].Properties3d.gralInfo.idCloned != "") {
                idNodeSTL = nodes[idNode + wId].Properties3d.gralInfo.idCloned;
            } else {
                if (_isPrincipal) {
                    idNodeSTL = idNode;
                } else {
                    idNodeSTL = viewer3d.parentId[idNode + wId];
                }
            }
            
            _urlFiles = urlBabylonFiles + idNodeSTL;

            for (var i = 0; i < nodes[idNode + wId].Properties3d.asset.children.length; i++) {
               
                fileName = nodes[idNode + wId].Properties3d.asset.children[i].fileName;
                _loadSTLFiles(urlBabylonFiles + idNodeSTL + "/", fileName, idNode);
            }
           
        };

        _loadPoints = function (idNode)  {

            var idPoint, heightScale, totalHeight, angle, perpend, paralel, axial, posX, posY, posZ, side, factAngle,
                probe, cone, cylLevel, indLevel, height, diameter, parent, index = 0, numProbes, flagReady,
                parentName, parentInfo, parentSize = {}, indexPiece, propertyNames, idIndexPrincipal;

            height = nodes[idNode + wId].Properties3d.points.height;
            diameter = nodes[idNode + wId].Properties3d.points.diameter;

            for (var i = 0; i < nodes[idNode + wId].Properties3d.points.children.length; i++) {

                numProbes = nodes[idNode + wId].Properties3d.points.children.length;

                //indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[idNode];

                if (nodes[idNode + wId].Properties3d.points.children[i].indexPiece.hasOwnProperty(idNode)) {
                    indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[idNode];
                }
                else if (nodes[idNode + wId].Properties3d.points.children[i].indexPiece.hasOwnProperty("level13d")) {
                    if (_isPrincipal) {
                        indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece.level13d;
                    } else {
                        indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece.level23d;
                    }
                }

                else if (!nodes[idNode + wId].Properties3d.points.children[i].indexPiece.hasOwnProperty("level13d") && !nodes[idNode + wId].Properties3d.points.children[i].indexPiece.hasOwnProperty(idNode)) {
                    propertyNames = Object.getOwnPropertyNames(nodes[idNode + wId].Properties3d.points.children[i].indexPiece);

                    if (_isPrincipal) {
                        //indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[propertyNames[propertyNames.length - 1]];
                        for (var j = 0; j < treeObj.model.fields.dataSource.length; j += 1) {
                            for (var k = 0; k < propertyNames.length; k++) {
                                if (treeObj.model.fields.dataSource[j].Id == propertyNames[k] && !treeObj.model.fields.dataSource[j].HasChild) {
                                    // _isPrincipal = !treeObj.model.fields.dataSource[i].hasChild;
                                    idIndexPrincipal = propertyNames[k];
                                    indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[idIndexPrincipal];
                                    break;
                                }
                            }
                        }
                    } else {
                        for (var j = 0; j < propertyNames.length; j++) {
                            if (nodes[idNode + wId].Properties3d.points.children[i].indexPiece[propertyNames[j]] != null && propertyNames[j] != idIndexPrincipal) {
                                indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[j];
                            }
                        }
                        //indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece.level23d;
                    }
                }

                parentName = "asset-" + idNode + "-_-" + nodes[idNode + wId].Properties3d.points.children[i].info.parentName + "-" + indexPiece;

                idPoint = nodes[idNode + wId].Properties3d.points.children[i].idPoint;
                heightScale = nodes[idNode + wId].Properties3d.points.children[i].info.heightScale;
                angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle;
                /*
                if (scope.infoGralEntity.view == 0) {
                    angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle * -1;
                } else {
                    angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle;
                }*/

                perpend = nodes[idNode + wId].Properties3d.points.children[i].info.perpend;
                paralel = nodes[idNode + wId].Properties3d.points.children[i].info.paralel;
                axial = nodes[idNode + wId].Properties3d.points.children[i].info.axial;

                posX = nodes[idNode + wId].Properties3d.points.children[i].info.x;
                posY = nodes[idNode + wId].Properties3d.points.children[i].info.y;
                posZ = nodes[idNode + wId].Properties3d.points.children[i].info.z;

                totalHeight = (height * heightScale + diameter + 3 * diameter / 2);

                var sensorMesh = new Object(_scene.getMeshByName(globals3d.names.sensor.parent + idNode + wId));
                var parentSensor = new Object(sensorMesh.clone(globals3d.names.sensor.parent + idPoint + wId, parentSensor));
                parentSensor.visibility = true;

                var materialIndicator = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + idPoint + wId, _scene);

                parent = new Object(_scene.getMeshByName(parentName + wId));
                parentSensor.parent = new Object(parent);
                parentInfo = new Object(parent._boundingInfo);

                probe = _scene.getMeshByName(parentSensor._children[0].name);
                probe.name = globals3d.names.sensor.probe + idPoint + wId;
                probe.uniqueId = _findMaxUniqueId() + 1;
                probe.id = "id-" + globals3d.names.sensor.probe + idPoint + wId;

                cone = _scene.getMeshByName(parentSensor._children[1].name);
                cone.name = globals3d.names.sensor.cone + idPoint + wId;
                cone.uniqueId = _findMaxUniqueId() + 1;
                cone.id = "id-" + globals3d.names.sensor.cone + idPoint + wId
                cone.material = materialIndicator;

                cylLevel = _scene.getMeshByName(parentSensor._children[0]._children[0].name);
                cylLevel.name = globals3d.names.sensor.levelCyl + idPoint + wId;
                cylLevel.uniqueId = _findMaxUniqueId() + 1;
                cylLevel.id = "id-" + globals3d.names.sensor.levelCyl + idPoint + wId;
                cylLevel.material = materialIndicator;

                indLevel = _scene.getMeshByName(parentSensor._children[0]._children[1].name);
                indLevel.name = globals3d.names.sensor.levelInd + idPoint + wId;
                indLevel.uniqueId = _findMaxUniqueId() + 1;
                indLevel.id = "id-" + globals3d.names.sensor.levelInd + idPoint + wId;
                indLevel.material = materialIndicator;

                cone.position.y = -((height * heightScale) / 2 + 3 * diameter / 4);
                probe.scaling.y = heightScale;
                cylLevel.scaling.y = 1 / heightScale;
                indLevel.scaling.y = 1 / heightScale;

                parentSize.pos = Math.sqrt(Math.pow(parentInfo.maximum.y, 2), Math.pow(parentInfo.maximum.x, 2));
                parentSize.neg = Math.sqrt(Math.pow(parentInfo.maximum.y, 2), Math.pow(parentInfo.maximum.x, 2));

                if (axial) {
                    side = nodes[idNode + wId].Properties3d.points.children[i].info.side;
                    if (side === 0) {

                        parentSensor.rotation.x = -Math.PI / 2;
                        parentSensor.rotation.y = -Math.PI;
                        parentSensor.rotation.z = Math.PI;
                        parentSensor.position.z = -(totalHeight / 2) + parentInfo.minimum.z + posZ;

                        parentSensor.position.y = (parentInfo.maximum.y) + posY;
                        parentSensor.position.x = -posX;


                        if (angle === Math.PI / 2) {
                            probe.rotation.x = (Math.PI - angle);
                            probe.position.z = (height * heightScale / 2) + diameter / 2;
                            probe.position.y = -(height * heightScale / 2) + diameter / 2;
                        }
                        else {
                            probe.rotation.x = -angle;
                            probe.position.z = 0;
                            probe.position.y = 0;
                        }

                    } else {
                        parentSensor.rotation.x = Math.PI / 2;
                        parentSensor.position.z = (totalHeight / 2) + parentInfo.maximum.z + posZ;
                        parentSensor.position.y = posY;
                        parentSensor.position.x = posX;
                        if (angle === Math.PI / 2) {
                            probe.rotation.x = -angle;
                            probe.position.z = -(height * heightScale / 2) - diameter / 2;
                            probe.position.y = -(height * heightScale / 2) + diameter / 2;
                        }
                        else {
                            probe.position.z = 0;
                            probe.position.y = 0;
                        }
                    }

                }
                else {
                    parentSensor.rotation.x = 0;
                    parentSensor.rotation.z = angle;
                    if (angle >= 0) {
                        parentSensor.position.x = -(parentSize.neg) * Math.sin(angle) - (totalHeight / 2) * (Math.sin(angle)) + posX;

                        parentSensor.position.y = (parentSize.neg) * Math.sin(Math.PI / 2 - angle) + (totalHeight / 2) * (Math.sin(Math.PI / 2 - angle)) + posY - parent.position.y;
                    }
                    else {
                        parentSensor.position.x = -(parentSize.pos) * Math.sin(angle) - (totalHeight / 2) * (Math.sin(angle)) + posX;

                        parentSensor.position.y = (parentSize.pos) * Math.sin(Math.PI / 2 - angle) + (totalHeight / 2) * (Math.sin(Math.PI / 2 - angle)) + posY - parent.position.y;
                    }
                    parentSensor.position.z = posZ;
                }
                probe.position.x = paralel + probe.position.x;
                probe.position.y = perpend + probe.position.y;


                _loadCanvasText(idPoint);

                galgasVi.cyl.push(cylLevel);
                galgasVi.probe.push(probe);
                galgasVi.cone.push(cone);
                galgasVi.ind.push(indLevel);
            }



            var loadData = new LoadDataViewer3d(idNode, wId);
            loadData.verifyIncDec();
            sensorMesh.dispose();
        };
        
        this.loadPlots = function (type, idNode) {

            _createPlot(type);
            var plot, parent, parentName, posX, posY, sensorSize, idPoint, parentInfo, plotSize, angle = 1, axial, indexPiece;
            var mesh = _scene.getMeshByName(globals3d.names.plots[type].canvas + idEntity + wId);
            var indexPares = 0;

            _flags.plots[type] = true;

            plotsVi[type] = [];

            if (type === "trend" || type === "spec" || type === "waterfall" || type === "spec100p") {
                for (var i = 0; i < nodes[idNode + wId].Properties3d.points.children.length; i++) {

                    if (nodes[idNode + wId].Properties3d.points.children[i].info.vibr) {
                        angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle;
                        /*
                        if (scope.infoGralEntity.view == 0) {
                            angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle * -1;
                        } else {
                            angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle;
                        }
                        */
                        axial = nodes[idNode + wId].Properties3d.points.children[i].info.axial;

                        idPoint = nodes[idNode + wId].Properties3d.points.children[i].idPoint;
                        plot = new Object(mesh.clone(globals3d.names.plots[type].canvas + idPoint + wId, plot));
                        plot.uniqueId = _findMaxUniqueId() + 1;
                        plot.id = "id-" + globals3d.names.plots[type].canvas + idPoint + wId;

                        parentName = globals3d.names.sensor.probe + idPoint + wId;
                        parent = new Object(_scene.getMeshByName(parentName));
                        plot.parent = undefined;
                        sensorSize = parent._boundingInfo.maximum.y;

                        plotSize = plot.scaling.x;
                        scope.infoGralEntity.sizePlot = plotSize;

                        if (scope.infoGralEntity.orientation === 0) {
                            if (!axial) {
                                plot.position.x = parent.getAbsolutePosition().x;
                                if (angle < 0) {
                                    plot.position.x = parent.getAbsolutePosition().x + sensorSize * Math.sin(-angle) + plotSize / 2;
                                    plot.position.y = (-sensorSize * Math.sin(angle) + parent.getAbsolutePosition().y);
                                }
                                else if (angle > 0) {
                                    plot.position.x = parent.getAbsolutePosition().x - sensorSize * Math.sin(angle) - plotSize / 2;
                                    plot.position.y = sensorSize * Math.sin(angle) + parent.getAbsolutePosition().y;
                                }
                                else if (angle === 0) {
                                    plot.position.y = plotSize / 2 * Math.sin(Math.PI / 2 - angle) + sensorSize * Math.sin(Math.PI / 2 - angle) * 1.5 + parent.getAbsolutePosition().y;
                                }
                            }
                            else {
                                plot.position.x = -(plotSize / 2 + sensorSize) * Math.sin(3 * Math.PI / 4) * 2 + parent.getAbsolutePosition().x;
                                plot.position.y = (plotSize / 2 + sensorSize) * Math.sin(Math.PI / 4) * 2 + parent.getAbsolutePosition().y;
                            }
                            plot.position.z = parent.getAbsolutePosition().z;
                        }
                        else {
                            if (!axial) {
                                plot.position.x = parent.getAbsolutePosition().x;
                                if (angle < 0) {
                                    plot.position.x = parent.getAbsolutePosition().x + sensorSize * Math.sin(-angle) + plotSize / 1.5;
                                    plot.position.z = -sensorSize * Math.sin(angle) + parent.getAbsolutePosition().z;
                                }
                                else if (angle > 0) {
                                    plot.position.x = parent.getAbsolutePosition().x - sensorSize * Math.sin(angle) - plotSize / 1.5;
                                    plot.position.z = sensorSize * Math.sin(angle) + parent.getAbsolutePosition().z;
                                }
                                else if (angle === 0) {
                                    plot.position.z = (plotSize / 2 * Math.sin(Math.PI / 2 - angle) + sensorSize * Math.sin(Math.PI / 2 - angle) * 1.5) + parent.getAbsolutePosition().z;
                                }
                            }
                            else {
                                plot.position.x = -(plotSize / 2 + sensorSize) * Math.sin(3 * Math.PI / 4) * 2 + parent.getAbsolutePosition().x;
                                plot.position.z = (plotSize / 2 + sensorSize) * Math.sin(Math.PI / 4) * 2 + parent.getAbsolutePosition().z;
                            }
                            plot.position.y = parent.getAbsolutePosition().y;
                        }
                        if (type === 'trend') {
                            _createBandsForTrendPlot(idPoint, plot);
                        }

                        plot.visibility = false;
                        for (var j = 0; j < plot._children.length; j++) {
                            plot._children[j].visibility = false;
                        }
                    }

                    plotsVi[type].push(plot);
                }
            }
            if (type === 'orb' || type === 'sCL' || type === 'ShaftDef' || type === 'orb1X') {
                for (i = 0; i < nodes[idNode + wId].Properties3d.points.children.length; i++) {
                    if (!nodes[idNode + wId].Properties3d.points.children[i].info.axial) {
                        
                        idPoint = nodes[idNode + wId].Properties3d.points.children[i].idPoint;
                        if (vbles[idPoint].Orientation === 1) {
                            plot = new Object(mesh.clone(globals3d.names.plots[type].canvas + idPoint + wId, plot));
                            plot.uniqueId = _findMaxUniqueId() + 1;
                            plot.id = "id-" + globals3d.names.plots[type].canvas + idPoint + wId;

                            //indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[idNode];

                            if (nodes[idNode + wId].Properties3d.points.children[i].indexPiece.hasOwnProperty(idNode)) {
                                indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece[idNode];
                            }
                            else {
                                if (_isPrincipal) {
                                    indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece.level13d;
                                } else {
                                    indexPiece = nodes[idNode + wId].Properties3d.points.children[i].indexPiece.level23d;
                                }
                            }


                            parentName = "asset-" + idNode + "-_-" + nodes[idNode + wId].Properties3d.points.children[i].info.parentName + "-" + indexPiece + wId;
                            //parentName = nodes[idNode + wId].Properties3d.points.children[i].info.parentName + wId;
                            parent = _scene.getMeshByName(parentName);

                            plot.parent = undefined;

                            plot.position.x = parent.parent.getAbsolutePosition().x;
                            plot.position.y = parent.parent.getAbsolutePosition().y;
                            

                            if (scope.infoGralEntity.orientation === 0) {
                                plot.position.z = parent.getAbsolutePosition().z;
                            }
                            if (scope.infoGralEntity.orientation === 1) {
                                plot.position.y = parent.getAbsolutePosition().y;
                                plot.rotation.x = 1.5707963267948966;
                            }
                            indexPares++;

                            plotsVi[type].push(plot);
                            plot.visibility = false;
                            for (var j = 0; j < plot._children.length; j++) {
                                plot._children[j].visibility = false;
                            }
                            
                        }                       
                    }                       
                }
            }
                   
            globals3d.paresQty[idEntity + wId] = indexPares;
            mesh.dispose();
            
        };

        this.disposePlots = function (idNode) {

            var namePlot, idPoint;
            var plotTypes = ['trend', 'spec', 'spec100p', 'orb', 'sCL', 'waterfall', 'ShaftDef', 'orb1X'];

            
            for (var i = 0; i < nodes[idNode + wId].Properties3d.points.children.length; i++) {
                               
                idPoint = nodes[idNode + wId].Properties3d.points.children[i].idPoint;
                
                for (var j = 0; j < plotTypes.length; j++) {                    
                    namePlot = globals3d.names.plots[plotTypes[j]].canvas + idPoint + wId;
                    _flags.plots[plotTypes[j]] = false;
                    if (_scene.getMeshByName(namePlot) !== null) {
                        _scene.getMeshByName(namePlot).dispose();
                    }
                    if (_scene.getMeshByName("line-Chart-" + globals3d.names.plots[plotTypes[j]].canvas + idPoint + wId) !== null) {
                        _scene.getMeshByName("line-Chart-" + globals3d.names.plots[plotTypes[j]].canvas + idPoint + wId).dispose();
                    }
                    if (_scene.getMeshByName("point-" + globals3d.names.plots["orb"].canvas + idPoint + wId) !== null) {
                        _scene.getMeshByName("point-" + globals3d.names.plots["orb"].canvas + idPoint + wId).dispose();
                    }
                    if (_scene.getMeshByName("point-" + globals3d.names.plots["orb1X"].canvas + idPoint + wId) !== null) {
                        _scene.getMeshByName("point-" + globals3d.names.plots["orb1X"].canvas + idPoint + wId).dispose();
                    }
                    if (_scene.getMeshByName("point-" + globals3d.names.plots["ShaftDef"].canvas + idPoint + wId) !== null) {
                        _scene.getMeshByName("point-" + globals3d.names.plots["ShaftDef"].canvas + idPoint + wId).dispose();
                    }
                    for (var k= 0; k < nodes[idNode + wId].Properties3d.asset.axis.length; k++) {
                        if (_scene.getMeshByName(globals3d.names.plots["ShaftDef"].line +  "-" + k + idEntity + wId) !== null) {
                            _scene.getMeshByName(globals3d.names.plots["ShaftDef"].line + "-" + k + idEntity + wId).dispose();
                        }
                        if (_scene.getMeshByName(globals3d.names.plots["ShaftDef"].line  + "-" + k + idEntity + wId) !== null) {
                            _scene.getMeshByName(globals3d.names.plots["ShaftDef"].line + "-" + k + idEntity + wId).dispose();
                        }
                    }
                }
            }          
        };

        _loadCanvasText = function (idPoint) {
           
            var text2d = new CanvasText2d(idEntity, canvasType, wId);
            var canvasText = text2d.createText(idPoint, scope.infoGralEntity.canvasTextSize);
           
            var dt = canvasText.material.diffuseTexture;
            var con2d = dt.getContext();

            dt.drawText(vbles[idPoint].Name, null, 20, "bold 10px  Calibri", "#999999", null);
            dt.drawText("", null, 45, "bold 11px  Calibri", "#999999", null);
            dt.drawText("", null, 65, "bold 11px  Calibri", "#999999", null);

            TextVi.push(canvasText);

        };

        this.changePositionText = function (idNode, type) {

            var flagPlots, parentName, partner, position, rotation, angle = 0, axial= false, canvasText,
                plotSize, sensorSize, canvasTextSize, idPoint, posX, posY, posZ;

            flagPlots = _flags.plots.trend || _flags.plots.spec || _flags.plots.waterfall || _flags.plots.spec100p;


            
            canvasTextSize = scope.infoGralEntity.canvasTextSize;

            position = {
                x: 0, y: 0, z: 0
            };

            for (var i = 0; i < nodes[idNode + wId].Properties3d.points.children.length; i++) {

                idPoint = nodes[idNode + wId].Properties3d.points.children[i].idPoint;
                canvasText = _scene.getMeshByName(globals3d.names.text.plane + idPoint + wId);

                posX = nodes[idNode + wId].Properties3d.points.children[i].info.x;
                posY = nodes[idNode + wId].Properties3d.points.children[i].info.y;
                posZ = nodes[idNode + wId].Properties3d.points.children[i].info.z;

                if (type === "probe") {
                    parentName = globals3d.names.sensor.probe;
                } else if (type === "trend") {
                    parentName = globals3d.names.plots.trend.canvas;
                }
                else if (type === "spec") {
                    parentName = globals3d.names.plots.spec.canvas;
                } else if (type === "spec100p") {
                    parentName = globals3d.names.plots.spec100p.canvas;
                }
                else if (type === "waterfall") {
                    parentName = globals3d.names.plots.waterfall.canvas;
                }

                if (nodes[idNode + wId].Properties3d.points.children[i].info.vibr) {
                    partner = new Object(_scene.getMeshByName(parentName + idPoint + wId));
                }
                else {
                    parentName = globals3d.names.sensor.probe;
                    partner = new Object(_scene.getMeshByName(parentName + idPoint + wId));
                    type === "probe";
                }

                    if (type === "probe") {

                        sensorSize = partner._boundingInfo.maximum.y;
                    } else {
                            plotSize = partner.scaling.x;
                        
                    }
                /*
                    if (scope.infoGralEntity.view == 0) {
                        angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle * -1;
                    } else {
                        angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle;
                    }*/

                    angle = nodes[idNode + wId].Properties3d.points.children[i].info.angle;
                    axial = nodes[idNode + wId].Properties3d.points.children[i].info.axial;

               
                    if (flagPlots && nodes[idNode + wId].Properties3d.points.children[i].info.vibr) {
                        position.x = partner.position.x + posX;
                        position.y = partner.position.y + 1.1 * plotSize / 2 + posY;
                        position.z = partner.position.z;
                    }
                    if (!nodes[idNode + wId].Properties3d.points.children[i].info.vibr || !flagPlots) {

                        if (scope.infoGralEntity.orientation === 0) {
                            if (!axial) {
                                position.x = partner.getAbsolutePosition().x + posX;
                                if (angle < 0) {
                                    position.x = partner.getAbsolutePosition().x + (3 * sensorSize / 2 + canvasTextSize / 2) * Math.sin(-angle) + posX;
                                    position.y = partner.getAbsolutePosition().y + posY;
                                }
                                if (angle > 0) {
                                    position.x = partner.getAbsolutePosition().x - ((sensorSize / 1.7 + canvasTextSize / 2)) * Math.sin(angle) + posX;
                                    position.y = partner.getAbsolutePosition().y + posY;
                                }
                                if (angle === 0) {
                                    position.y = sensorSize * Math.sin(Math.PI / 4) * 2.5 + partner.getAbsolutePosition().y + posY;
                                }
                            }
                           else {
                                position.x = canvasTextSize / 2  + partner.getAbsolutePosition().x ;
                                position.y = sensorSize * Math.sin(Math.PI / 4)  + partner.getAbsolutePosition().y + posY;
                           }
                            position.z = partner.getAbsolutePosition().z;
                        }
                        else {
                            if (!axial) {
                                position.x = partner.position.x + posX;
                                if (angle < 0) {
                                    position.x = partner.getAbsolutePosition().x + (3 * sensorSize / 2 + canvasTextSize / 2) * Math.sin(-angle) + posX;
                                    position.z = partner.getAbsolutePosition().z;
                                }
                                if (angle > 0) {
                                    position.x = partner.getAbsolutePosition().x - ((sensorSize / 1.7 + canvasTextSize / 2)) * Math.sin(angle) + posX;
                                    position.z = partner.getAbsolutePosition().z;
                                }
                                if (angle === 0) {
                                    position.z = sensorSize * Math.sin(Math.PI / 4) * 2.5 + partner.getAbsolutePosition().z;
                                }
                            }
                            else {
                                position.x = -sensorSize * Math.sin(3 * Math.PI / 4) * 2 + partner.getAbsolutePosition().x + posX;
                                position.z = sensorSize * Math.sin(Math.PI / 4) * 2 + partner.getAbsolutePosition().z;
                            }
                            position.y = partner.getAbsolutePosition().y + posY;
                        }
                    
                }

            
                canvasText.position = new Object(new BABYLON.Vector3(position.x, position.y, position.z));
            }

        };
   
        this.animateAxis = function () {

            var actualVel;

            _scene.registerBeforeRender(function () {
                actualVel = globals3d.vel.asset.axis[idEntity + wId][0];
                if (_scene.getMeshByName(globals3d.names.parents.axis + "-" + 0 + "-" + idEntity + wId)) {
                    if (globals3d.flags[idEntity + wId].animation === true) {

                        for (var i = 0; i < nodes[idEntity + wId].Properties3d.asset.axis.length; i++) {
                            //globals3d.vel.asset.axis[idEntity + wId][i] = globals3d.vel.asset.axis[idEntity + wId][0] * nodes[idEntity + wId].Properties3d.asset.axis[i].prop.vel;
                            if (i > 0) {
                                globals3d.vel.asset.axis[idEntity + wId][i] = actualVel * nodes[idEntity + wId].Properties3d.asset.axis[i].prop.vel;
                            }
                            
                            if (nodes[idEntity + wId].Properties3d.asset.axis[i].prop.tS === 0) {
                                
                                //globals3d.vel.asset.axis[i] = globals3d.vel.asset.axis[0] * nodes[idEntity].Properties3d.asset.axis[i].prop.vel;
                                if (!isNaN(globals3d.vel.asset.axis[idEntity + wId][i])) {
                                    _scene.getMeshByName(globals3d.names.parents.axis + "-" + i + "-" + idEntity + wId).rotation.z += Math.PI * 0.00001 * globals3d.vel.asset.axis[idEntity + wId][i];
                                    
                                }

                            }
                            else {

                                //globals3d.vel.asset.axis[i] = globals3d.vel.asset.axis[0] * nodes[idEntity].Properties3d.asset.axis[i].prop.vel;
                                if (!isNaN(globals3d.vel.asset.axis[idEntity + wId][i])) {
                                    _scene.getMeshByName(globals3d.names.parents.axis + "-" + i + "-" + idEntity + wId).rotation.z -= Math.PI * 0.00001 * globals3d.vel.asset.axis[idEntity + wId][i];
                                    
                                }
                            }
                        }
                    }
                }


            });
        };
     
        _createParentAxis = function (idNode) {

            var parentAxis, axisNum, qtyAxis = 0, parentParentAxis;

            for (var i = 0; i < nodes[idNode + wId].Properties3d.asset.children.length; i++) {
                if (nodes[idNode + wId].Properties3d.asset.children[i].axisNum.length > 0) {
                    for (var j = 0; j < nodes[idNode + wId].Properties3d.asset.children[i].axisNum.length; j++) {
                        axisNum = nodes[idNode + wId].Properties3d.asset.children[i].axisNum[j] + 1;
                        if (axisNum > qtyAxis) {
                            qtyAxis = axisNum;
                        }
                    }
                }
                else {

                    axisNum = nodes[idNode + wId].Properties3d.asset.children[i].axisNum + 1;
                    if (axisNum > qtyAxis) {
                        qtyAxis = axisNum;
                    }
                }
                
                
            }
            for (var j = 0; j < qtyAxis; j++) {
                parentAxis = new BABYLON.Mesh.CreateBox(globals3d.names.parents.axis + "-" + j + "-" + idNode + wId, 0.001, _scene);
                parentAxis.position = new BABYLON.Vector3(nodes[idNode + wId].Properties3d.asset.axis[j].prop.position.x,
                    nodes[idNode + wId].Properties3d.asset.axis[j].prop.position.y,
                    nodes[idNode + wId].Properties3d.asset.axis[j].prop.position.z);

                parentAxis.visibility = false;

                parentParentAxis = new BABYLON.Mesh.CreateBox(globals3d.names.parents.parentAxis + "-" + j + "-" + idNode + wId, 0.001, _scene);
                parentParentAxis.position = new BABYLON.Vector3(nodes[idNode + wId].Properties3d.asset.axis[j].prop.position.x,
                    nodes[idNode + wId].Properties3d.asset.axis[j].prop.position.y,
                    nodes[idNode + wId].Properties3d.asset.axis[j].prop.position.z);

                parentAxis.parent = _scene.getMeshByName(globals3d.names.parents.asset + idNode + wId);
                parentParentAxis.parent = _scene.getMeshByName(globals3d.names.parents.asset + idNode + wId);
            }
        };

        _createParents = function (idNode, idChild) {


            var parentAsset, parentLocation;
            if (idChild === '_') {
                parentAsset = new BABYLON.Mesh.CreateBox(globals3d.names.parents.asset + idNode + wId, 0.001, _scene);
                parentAsset.visibility = false;

                if (scope.infoGralEntity.orientation === 1) {
                    parentAsset.rotation.x = 1.5707963267948966;
                }
            }
            else {
                parentAsset = new BABYLON.Mesh.CreateBox(globals3d.names.parents.asset + idChild + wId, 0.001, _scene);
                parentAsset.visibility = false;
                parentLocation = new BABYLON.Mesh.CreateBox(globals3d.names.parents.location + idNode + wId, 0.001, _scene);
                parentLocation.visibility = false;
                parentAsset.parent = parentLocation;
            }

        };

        _createProbe = function (idNode) {

            var parentSensor, materialIndicator, probe, cone, lineConeProbe, cylLevel, indLevel, height, diameter;

            height = nodes[idNode + wId].Properties3d.points.height;
            diameter = nodes[idNode + wId].Properties3d.points.diameter;

            parentSensor = new BABYLON.Mesh.CreateBox(globals3d.names.sensor.parent + idNode + wId, 0.0001, _scene);
            parentSensor.id = "id" + globals3d.names.sensor.parent;

            probe = new BABYLON.Mesh.CreateCylinder(
                globals3d.names.sensor.probe + idNode + wId, height, diameter, diameter, 12, 0, _scene);
            probe.material = new BABYLON.StandardMaterial("mat-" + globals3d.names.sensor.probe + idNode + wId, _scene);
            probe.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
            probe.material.specularColor = new BABYLON.Color3(1, 1, 1);
            probe.material.alpha = 0.1;
            probe.material.freeze();
            probe.parent = parentSensor;

            cone = new BABYLON.Mesh.CreateCylinder(
                globals3d.names.sensor.cone + idNode + wId, diameter, diameter, 0.1, 12, 0, _scene);
            cone.parent = parentSensor;

            indLevel = new BABYLON.Mesh.CreateTorus(
                globals3d.names.sensor.levelInd + idNode + wId, diameter * 1.5, diameter * 0.2, 32, _scene);
            indLevel.parent = probe;

            cylLevel = new BABYLON.Mesh.CreateCylinder(
                globals3d.names.sensor.levelCyl + idNode + wId, diameter * 0.1, diameter / 2, diameter / 2, 24, 0, _scene);
            cylLevel.parent = probe;

            lineConeProbe = BABYLON.Mesh.CreateLines(globals3d.names.sensor.lineConeProbe + idNode + wId, [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0.1, 0.1, 0.1)], _scene, true);

        };

        _createPlot = function (type) {

            var plot2d = new CanvasPlot2d(idEntity, canvasType, wId);
            if (scope.infoGralEntity.orientation === 0) {
                plot2d.infoPlots.scale = scope.infoGralEntity.size.prom * 0.22;
            }
            else {
                plot2d.infoPlots.scale = scope.infoGralEntity.size.prom * 0.15;
            }
            
            plot2d.infoPlots.orientation = scope.infoGralEntity.orientation;
            plot2d.createPlotContainer(type);

        };

        _createBandsForTrendPlot = function (idPoint, parent) {

            var max, min, total, size, arraySize, color, band, material, sizeInternalPlot, initialSize = 1, posBandSum = 0;

            max = vbles[idPoint].SubVariables.DefaultValue.Maximum;
            min = vbles[idPoint].SubVariables.DefaultValue.Minimum;
            total = max - min;
            arraySize = vbles[idPoint].SubVariables.DefaultValue.ArraySize;
            sizeInternalPlot = scope.infoGralEntity.sizePlot * 0.8;

            for (var i = 0; i < arraySize.length; i++) {
                color = arraySize[i].color;
                size = arraySize[i].size;
                band = BABYLON.Mesh.CreateBox(globals3d.names.plots.trend.bands + i + "-" + idPoint, initialSize, _scene);
                band.material = new BABYLON.StandardMaterial("material-" + globals3d.names.plots.trend.bands + i + "-" + idPoint + wId, _scene);
                band.material.alpha = 0.1;
                band.material.diffuseColor = BABYLON.Color3.FromHexString(color);
                band.scaling.y = size * 0.8 / total;
                band.scaling.x = 0.8;
                band.scaling.z = 1 / parent.scaling.z;
                band.position.y = posBandSum + ((size / total) * 0.8) / 2 - total * 2 / (sizeInternalPlot * 0.565);
                posBandSum += (size / total) * 0.8;

                band.parent = parent;
            }
        };

        _asignPropertiesToMeshes = function (mesh) {
          
            var fileNameOfMesh, idNode, meshName, color, alpha = 1, transform, axisNum, partType, fileName, parentLocation, parentAsset;

            meshName = mesh.name;
            fileNameOfMesh = meshName.split("-")[3];

            if (_flagEntityLocation === true) {
                idNode = meshName.split("-")[2];
            }
            else {
                idNode = meshName.split("-")[1];
            }
            
            for (var i = 0; i < nodes[idNode + wId].Properties3d.asset.children.length; i++) {
                fileName = nodes[idNode + wId].Properties3d.asset.children[i].fileName;
                if (fileNameOfMesh === fileName) {

                    color = new Object(nodes[idNode + wId].Properties3d.asset.children[i].color);
                    transform = new Object(nodes[idNode + wId].Properties3d.asset.children[i].transform);
                    //axisNum = new Object(nodes[idNode].Properties3d.asset.children[i].axisNum);
                    partType = nodes[idNode + wId].Properties3d.asset.children[i].partType;

                    if (partType === 'housing') {
                        alpha = 0.3;
                    }

                    for (var j = 0; j < transform.length; j++) {
                        var newMesh = new Object(mesh.clone(meshName + j + wId, newMesh));

                        if (nodes[idNode + wId].Properties3d.asset.children[i].axisNum.length !== undefined) {
                            axisNum = nodes[idNode + wId].Properties3d.asset.children[i].axisNum[j];
                        }
                        else{
                            axisNum = new Object(nodes[idNode + wId].Properties3d.asset.children[i].axisNum);
                        }
                        

                        newMesh.id = "id-" + meshName + j + wId;
                        newMesh.uniqueId = _findMaxUniqueId() + 1;

                        newMesh.material = new BABYLON.StandardMaterial("mat-" + meshName + j + wId, _scene);
                        newMesh.material.alpha = alpha;
                        newMesh.material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                        //newMesh.material.freeze();

                        newMesh.position = new BABYLON.Vector3(transform[j].pos.x, transform[j].pos.y, transform[j].pos.z);
                        newMesh.rotation = new BABYLON.Vector3(transform[j].rot.x, transform[j].rot.y, transform[j].rot.z);
                        newMesh.scaling = new BABYLON.Vector3(transform[j].sca.x, transform[j].sca.y, transform[j].sca.z);
                        newMesh.visibility = true;                        
                        
                        if (partType === 'moving') {
                            newMesh.parent = _scene.getMeshByName(globals3d.names.parents.axis + "-" + axisNum + "-" + idNode + wId);
                        }
                        else {
                            newMesh.parent = _scene.getMeshByName(globals3d.names.parents.parentAxis + "-" + axisNum + "-" + idNode + wId);
                        }
                        meshesTurbo.push(newMesh);
                    }
                    
                    break;
                }
            }
            _loadedFiles++;
            mesh.dispose();
            if (_flagEntityLocation === true) {
                idNode = meshName.split("-")[2];               
            }
            else {
                idNode = meshName.split("-")[1];
            }

            
            if (_filesToLoad === _loadedFiles) {

                _calculateMaxSize();
                scope.locateCamera();
                

                _loadPoints(idNode);

                _loadColors();
                
                setTimeout(function () {
                    scope.changePositionText(idNode, "probe");
                    viewer3d.contLoader[idEntity + wId].hide();
                }, 5000);
               // scope.changePositionText(idNode, "probe");
              //  viewer3d.contLoader[idEntity + wId].hide();
                console.log(new Date());
                console.log(new Date().getMilliseconds());
                var text2d = new CanvasText2d(idEntity, canvasType, wId);
                text2d.showHideText(false);
            }
            else if (_filesToLoad == (_loadedFiles + _errorFiles.length)) {
                console.log("falta");
                $("#contLoaderViewer3D-" + idNode + wId).children().remove();
                $("#contLoaderViewer3D-" + idEntity + wId).css({
                    "overflow-y": "scroll"
                });
                $("#contLoaderViewer3D-" + idNode + wId).append('<div style="font-size: 14px;color: whitesmoke;text-align: center;margin-top:50px;"> Los siguientes archivos no se encontaron en la ruta: ' + _urlFiles + ' : <br><br>' +
                    
                    '</div>');
                for (var i = 0; i < _errorFiles.length; i++) {
                    console.log(_errorFiles[i]);
                    $("#contLoaderViewer3D-" + idNode + wId).append('<div style="font-size: 14px;color: whitesmoke;text-align: center;">' + _errorFiles[i] + '.stl<br>' +

                   '</div>');
                }
            }
        };

        _locateAsset = function (idNode) {

            var position = scope.infoGralEntity.position;
            var parent = _scene.getMeshByName(globals3d.names.parents.asset + idNode + wId);

            parent.position.x = (scope.infoGralEntity.size.max.x + scope.infoGralEntity.size.min.x) * 2;
            parent.position.y = (scope.infoGralEntity.size.max.y + scope.infoGralEntity.size.min.y) * 2;
            parent.position.z = (scope.infoGralEntity.size.max.z + scope.infoGralEntity.size.min.z) * 2;
        };

        _loadSTLFiles = function (url, fileName, idNode) {

            var mesh, entityTypeMesh, idChild, nameMesh;


            if (_flagEntityLocation === true) {
                entityTypeMesh = "location";
                idChild = idNode;
            }
            else {
                entityTypeMesh = "asset";
                idChild = "_";
            }
           
            nameMesh = entityTypeMesh + "-" + idEntity + "-" + idChild + "-" + fileName + "-";
           // console.log(nameMesh);
           // console.log(new Date());
           // console.log(new Date().getMilliseconds());
            BABYLON.SceneLoader.ImportMesh(fileName, url, fileName + ".stl", _scene, function () {

                mesh = _scene.getMeshByName(fileName);
                mesh.name = nameMesh;
                mesh.id = "id-" + nameMesh;
                mesh.visibility = false;

               // console.log(nameMesh);
               // console.log(new Date());
               // console.log(new Date().getMilliseconds());

                if (mesh.isReady()) {
                    _asignPropertiesToMeshes(mesh);
                   // console.log(nameMesh);
                   // console.log(new Date());
                    //console.log(new Date().getMilliseconds());
                }
            }, function () { }, function (task) { console.log(task); console.log(fileName); _errorFiles.push(fileName) });
                
           
        };

        _findMaxUniqueId = function () {
            var maxUniqueId = 0;
            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].uniqueId > maxUniqueId) {
                    maxUniqueId = _scene.meshes[i].uniqueId;
                }
            }
            return maxUniqueId;
        };

        _calculateMaxSize = function () {
            
            var sizeMin, prom;
            var size = new Object({ min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 }, total: { x: 0, y: 0, z: 0 }, prom: 0 });

            var sizeMinX, sizeMaxX, sizeMinY, sizeMaxY, sizeMinZ, sizeMaxZ, totalSize = 0, prom;

            for (var i = 0; i < _scene.meshes.length; i++) {
                /*
                 if (_scene.meshes[i].name.indexOf("asset-") !== -1 || _scene.meshes[i].name.indexOf("location-") !== -1) {
 
                     if (_scene.meshes[i]._boundingInfo.boundingBox.minimumWorld.x * _scene.meshes[i].scaling.x < size.min.x) {
                         size.min.x = _scene.meshes[i]._boundingInfo.boundingBox.minimumWorld.x * _scene.meshes[i].scaling.x;
                     }
                     if (_scene.meshes[i]._boundingInfo.boundingBox.minimumWorld.y * _scene.meshes[i].scaling.y < size.min.y) {
                         size.min.y = _scene.meshes[i]._boundingInfo.boundingBox.minimumWorld.y * _scene.meshes[i].scaling.y;
                     }
                     if (_scene.meshes[i]._boundingInfo.boundingBox.minimumWorld.z * _scene.meshes[i].scaling.z < size.min.z) {
                         size.min.z = _scene.meshes[i]._boundingInfo.boundingBox.minimumWorld.z * _scene.meshes[i].scaling.z;
                     }
                     if (_scene.meshes[i]._boundingInfo.boundingBox.maximumWorld.x * _scene.meshes[i].scaling.x > size.max.x) {
                         size.max.x = _scene.meshes[i]._boundingInfo.boundingBox.maximumWorld.x * _scene.meshes[i].scaling.x;
                     }
                     if (_scene.meshes[i]._boundingInfo.boundingBox.maximumWorld.y * _scene.meshes[i].scaling.y > size.max.y) {
                         size.max.y = _scene.meshes[i]._boundingInfo.boundingBox.maximumWorld.y * _scene.meshes[i].scaling.y;
                     }
                     if (_scene.meshes[i]._boundingInfo.boundingBox.maximumWorld.z * _scene.meshes[i].scaling.z > size.max.z) {
                         size.max.z = _scene.meshes[i]._boundingInfo.boundingBox.maximumWorld.z * _scene.meshes[i].scaling.z;
                     }
                 }*/
                if (_scene.meshes[i].name.indexOf("asset-") !== -1 || _scene.meshes[i].name.indexOf("location-") !== -1) {
                    
                    if (_scene.meshes[i]._boundingInfo.boundingBox.minimum.x * _scene.meshes[i].scaling.x < size.min.x) {
                        size.min.x = _scene.meshes[i]._boundingInfo.boundingBox.minimum.x * _scene.meshes[i].scaling.x;
                    }
                    if (_scene.meshes[i]._boundingInfo.boundingBox.minimum.y * _scene.meshes[i].scaling.y < size.min.y) {
                        size.min.y = _scene.meshes[i]._boundingInfo.boundingBox.minimum.y * _scene.meshes[i].scaling.y;
                    }
                    if (_scene.meshes[i]._boundingInfo.boundingBox.minimum.z * _scene.meshes[i].scaling.z < size.min.z) {
                        size.min.z = _scene.meshes[i]._boundingInfo.boundingBox.minimum.z * _scene.meshes[i].scaling.z;
                    }
                    if (_scene.meshes[i]._boundingInfo.boundingBox.maximum.x * _scene.meshes[i].scaling.x > size.max.x) {
                        size.max.x = _scene.meshes[i]._boundingInfo.boundingBox.maximum.x * _scene.meshes[i].scaling.x;
                    }
                    if (_scene.meshes[i]._boundingInfo.boundingBox.maximum.y * _scene.meshes[i].scaling.y > size.max.y) {
                        size.max.y = _scene.meshes[i]._boundingInfo.boundingBox.maximum.y * _scene.meshes[i].scaling.y;
                    }
                    if (_scene.meshes[i]._boundingInfo.boundingBox.maximum.z * _scene.meshes[i].scaling.z > size.max.z) {
                        size.max.z = _scene.meshes[i]._boundingInfo.boundingBox.maximum.z * _scene.meshes[i].scaling.z;
                    }
                    sizeMinX = _scene.meshes[i]._boundingInfo.boundingBox.minimum.x * _scene.meshes[i].scaling.x;
                    sizeMaxX = _scene.meshes[i]._boundingInfo.boundingBox.maximum.x * _scene.meshes[i].scaling.x;

                    sizeMinY = _scene.meshes[i]._boundingInfo.boundingBox.minimum.y * _scene.meshes[i].scaling.y;
                    sizeMaxY = _scene.meshes[i]._boundingInfo.boundingBox.maximum.y * _scene.meshes[i].scaling.y;

                    sizeMinZ = _scene.meshes[i]._boundingInfo.boundingBox.minimum.z * _scene.meshes[i].scaling.z;
                    sizeMaxZ = _scene.meshes[i]._boundingInfo.boundingBox.maximum.z * _scene.meshes[i].scaling.z;
                    totalSize += ((sizeMaxX - sizeMinX) + (sizeMaxY - sizeMinY) + (sizeMaxZ - sizeMinZ));
                }

            }

            prom = totalSize / (_scene.meshes.length * 3);

            size.total.x = size.max.x - size.min.x;
            size.total.y = size.max.y - size.min.y;
            size.total.z = size.max.z - size.min.z;

            size.prom = (size.total.x + size.total.y + size.total.z) / 3;
            //size.prom = prom;

            scope.infoGralEntity.size = size;

            prom = (nodes[idEntity + wId].Properties3d.points.height) * 2;

           scope.infoGralEntity.canvasTextSize = Math.floor(prom);

            //scope.infoGralEntity.canvasTextSize = Math.floor(sizeMin / 6);
           
        };

        _loadColors = function () {

            globals3d.colors[idEntity + wId] = {};
            var colors_Prop3d = nodes[idEntity + wId].Properties3d.colors;

            globals3d.colors[idEntity + wId].clearColor = colors_Prop3d.clearColor;
            globals3d.colors[idEntity + wId].wireframe = colors_Prop3d.wireframe;

            
           /* globals3d.colors[idEntity].trend.bl = colors_Prop3d.trend.bl;
            globals3d.colors[idEntity].trend.bg = colors_Prop3d.trend.bg;
            globals3d.colors[idEntity].trend.lc = colors_Prop3d.trend.lc;*/

            globals3d.colors[idEntity + wId].spec = {};
            globals3d.colors[idEntity + wId].spec.bl = colors_Prop3d.spec.bl;
            globals3d.colors[idEntity + wId].spec.bg = colors_Prop3d.spec.bg;
            globals3d.colors[idEntity + wId].spec.lc = colors_Prop3d.spec.lc;

            globals3d.colors[idEntity + wId].trend = new Object(globals3d.colors[idEntity + wId].spec);
            globals3d.colors[idEntity + wId].spec100p = new Object(globals3d.colors[idEntity + wId].spec);
           
            globals3d.colors[idEntity + wId].orb = {};
            globals3d.colors[idEntity + wId].orb.bl = colors_Prop3d.orb.bl;
            globals3d.colors[idEntity + wId].orb.bg = colors_Prop3d.orb.bg;
            globals3d.colors[idEntity + wId].orb.lc = colors_Prop3d.orb.lc;

            globals3d.colors[idEntity + wId].sCL = {};
            globals3d.colors[idEntity + wId].sCL.bl = colors_Prop3d.sCL.bl;
            globals3d.colors[idEntity + wId].sCL.bg = colors_Prop3d.sCL.bg;
            globals3d.colors[idEntity + wId].sCL.lc = colors_Prop3d.sCL.lc;

            globals3d.colors[idEntity + wId].ShaftDef = new Object(globals3d.colors[idEntity + wId].orb);
            globals3d.colors[idEntity + wId].orb1X = new Object(globals3d.colors[idEntity + wId].orb);
        };

        this.locateCamera = function () {
            var radius, x, y, z;
            //_calculateMaxSize();

            if (scope.infoGralEntity.view === 0) {
                _scene.activeCamera.alpha = Math.PI * 2 / 3;
                y = scope.infoGralEntity.size.total.y;
                z = scope.infoGralEntity.size.max.z;
                if (scope.infoGralEntity.orientation) {
                    radius = Math.sqrt(Math.pow(y, 2) + Math.pow(z, 2)) * 2;
                }
                else {
                    radius = Math.sqrt(Math.pow(y, 2) + Math.pow(z, 2)) * 2.5;
                }                               
            } else {
                _scene.activeCamera.alpha = -Math.PI / 3;
                y = scope.infoGralEntity.size.total.y;
                z = scope.infoGralEntity.size.min.z;
                if (scope.infoGralEntity.orientation) {
                    radius = Math.sqrt(Math.pow(y, 2) + Math.pow(z, 2)) * 2;
                }
                else {
                    radius = Math.sqrt(Math.pow(y, 2) + Math.pow(z, 2)) * 2.5;
                }
            }

            _scene.activeCamera.radius = radius;
            _scene.activeCamera.beta = Math.PI / 3;
            _scene.activeCamera.setTarget(BABYLON.Vector3.Zero());
            //_scene.activeCamera.radius = radius;
            _scene.activeCamera.upperRadiusLimit = radius * 2;

            _scene.activeCamera.wheelPrecision = 500 / radius;
            _scene.activeCamera.panningSensibility = 5000 / radius;
        };

        this.opacityProbes = function (idNode, alpha) {

            for (var i = 0; i < nodes[idNode + wId].Properties3d.points.children.length; i++) {
                _scene.getMeshByName(globals3d.names.sensor.cone + nodes[idNode + wId].Properties3d.points.children[i].idPoint + wId).material.alpha = alpha;
                _scene.getMeshByName(globals3d.names.sensor.levelInd + nodes[idNode + wId].Properties3d.points.children[i].idPoint + wId).material.alpha = alpha;
                _scene.getMeshByName(globals3d.names.sensor.levelCyl + nodes[idNode + wId].Properties3d.points.children[i].idPoint + wId).material.alpha = alpha;
            }
        };

        _searchAssetLevel = function () {
            for (var i = 0; i < treeObj.model.fields.dataSource.length; i += 1) {
                if (treeObj.model.fields.dataSource[i].Id == idEntity) {
                    _isPrincipal = treeObj.model.fields.dataSource[i].IsPrincipal;
                    break;
                }
            }
        }();

    };
    return LoadMeshes;
})();