/*
 * FunctionsEd3d.js
 * Eventos de editor para contenido 3D
 */

var FunctionsEd3d = {};

var FunctionsEd3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    FunctionsEd3d = function (idEntity, entityType) {

        var _scene,
            _names,
            _prop3d,
            _constant,
            _tree,
            _gral,
            _Tier1,
            _Tier2,
            _inX,
            _inY,
            _inZ,
            _constEd,
            _treePieces,
            _treePoints,
            _loadedFiles = 0,
            _filesToLoad,
            _fileNameArray = [],
            _meshNameArray = [],
            _contPieces,
            _selectMeshFcn,
            _selectSensorFcn,
            _loadSensorsMeshes,
            _actualiceCBParts,
            _actualiceTreePoints,
            _findMaxUniqueId,
            _renderOutlineSensor,
            _convertSensorAxialRadial,
            _movePositionSensor,
            _moveProbeParalelPerpend,
            _asignParentToSensor,
            _adjustSensorPositionToParent,
            _changeGralSensorSize,
            _actualicePropertiesPieces,
            _actualicePropertiesSensor,
            _addSensorsToTree,
            _actualiceMeshesNames,
            _asignPropertiesLoadedMeshes,
             _assignIndexPieceToPoints,
            _reorderPieces,
            _createSensor,
            _loadAsetPaths,
            _changeHeightProbe,
            _findMaxIndexMeshes,
            _resetUI,
            _selectTreePart,
            _flagInit = false,
            _addedPoints = [],
            _deletedPoints = [],
            _selectedPoint = "",
            _nodeChoosed = null,
            _assignURL,
            _urlSTL,
            _loadSTL,
            _asignPropertiesMesh,
            _createDivNodesPath,
            _flagFirstOpen = false,
            _groupsTier2;

        var scope = this;

        this.isPrincipal = null;
        this.isFromLibrary = false;
        this.urlLibrary = null;
        this.nodePathList = [];
        
        _names = globalsMenuEd.divsNames; 
        _tree = globalsMenuEd.divsNames.Tree;
        _gral = globalsMenuEd.divsNames.gral;
        _Tier1 = globalsMenuEd.divsNames.Tier1;
        _Tier2 = globalsMenuEd.divsNames.Tier2;

        _treePieces = {
            assemble: {
                id: "idassemble",
                name: "ENSAMBLE"
            },
            moving: {
                id: "idmoving",
                name: "MÓVILES"
            },
            statics: {
                id: "idstatics",
                name: "ESTÁTICAS"
            },
            housing: {
                id: "idhousing",
                name: "CARCASAS"
            }
        };

        _treePoints = {
            points: {
                id: "idpoints",
                name: "PUNTOS DE MEDICIÓN"
            },
            pair: {
                id: "idpair",
                name: "PARES"
            },
            axial: {
                id: "idaxial",
                name: "AXIALES"
            },
            radial: {
                id: "idradial",
                name: "RADIALES"
            }
        };

        _assignURL = function () {

            //_urlSTL = urlBabylonFiles + idEntity + "/";
            //_urlSTL = urlBabylonFiles + idEntity + "/";
            //globalsMenuEd.prop3d.gralInfo.idCloned
            if (globalsMenuEd.prop3d.hasOwnProperty("gralInfo")) {
                if (globalsMenuEd.prop3d.gralInfo.idCloned != "") {
                    _urlSTL = urlBabylonFiles + globalsMenuEd.prop3d.gralInfo.idCloned + "/";
                } else {
                    _urlSTL = urlBabylonFiles + idEntity + "/";
                }
            } else {
                _urlSTL = urlBabylonFiles + idEntity + "/";
            }
            
        }();

        _groupsTier2 = {
            file: $("#" + _names.gral + _names.Tier2.gral + _names.Tier1.file),
            insert: $("#" + _names.gral + _names.Tier2.gral + _names.Tier1.insert),
            piece: $("#" + _names.gral + _names.Tier2.gral + _names.Tier1.piece),
            axisConfig: $("#" + _names.gral + _names.Tier2.gral + _names.Tier1.axisConfig),
            sensorConfig: $("#" + _names.gral + _names.Tier2.gral + _names.Tier1.axisConfig)
        };

        _selectMeshFcn = function () {
            var meshName, meshSel, color, Axis, pos, divColor, meshes, mesh, moving, statics, housing, idDivSelPart, divSelPart, fileName, indexMesh, idChild, axisNum;

            pos = {
                x: 0,
                y: 0,
                z: 0
            };

            meshName = globalsMenuEd.actualMeshName[idEntity];
            meshSel = _scene.getMeshByName(meshName);
            fileName = meshName.split("-")[2];
            indexMesh = meshName.split("-")[3];

            
            pos.x = meshSel.position.x;
            pos.y = meshSel.position.y;
            pos.z = meshSel.position.z;

            _inX = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X);
            _inY = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y);
            _inZ = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z);
            divColor = $("#" + _gral + _Tier2.gral + _Tier2.piece.changeColor);

            _inX.val(pos.x);
            _inY.val(pos.y);
            _inZ.val(pos.z);


            _constEd = globalsMenuEd.constant[idEntity];

            _constEd.pieces.move = true;
            _constEd.pieces.rotate = false;
            _constEd.pieces.scale = false;


            $("#" + _gral + _Tier2.gral + _Tier2.piece.rotate).css({ "background-color": "rgba(70, 70, 70, 0.9)" });
            $("#" + _gral + _Tier2.gral + _Tier2.piece.scaling).css({ "background-color": "rgba(70, 70, 70, 0.9)" });
            $("#" + _gral + _Tier2.gral + _Tier2.piece.move).css({ "background-color": "rgba(120, 120, 120, 0.9)" });

            scope.moveMesh();

            color = meshSel.material.diffuseColor;          
            color = color.toHexString();
            divColor.val(color);

            
            for (var i = 0; i < _prop3d.asset.children.length; i++) {
                if (_prop3d.asset.children[i].fileName == fileName) {
                    axisNum = _prop3d.asset.children[i].axisNum[indexMesh];
                }
            }
            
            $("#" + _gral + _Tier2.gral + _Tier2.piece.cBAxis).prop('selectedIndex', axisNum);

            for (var i = 0; i < globalsMenuEd.meshNames[idEntity].length; i++) {
                meshes = _scene.getMeshByName(globalsMenuEd.meshNames[idEntity][i]);
                meshes.renderOutline = false;
            }

            meshSel.renderOutline = true;
            //meshSel.outlineWidth = 3;
            meshSel.outlineColor = BABYLON.Color3.Blue();



            idDivSelPart = "id-" + fileName + '-' + indexMesh;

            treePiecesObj.selectNode($("#" + idDivSelPart));

        };

        _selectSensorFcn = function () {
            var sensorId, heightScale, angle, paralel, perpend, pos, axial, side, fdO, parentName, inHeight, inParalel, inPerpend, inPosX, inPosY, inPosZ, cBAxial, cBSidePlus, cBSideMinus, inGralHeight, inGralRadius, cBPart, isVarious, flagSingleSensor = false, sensorType, indexPiece;

            sensorId = globalsMenuEd.actualSensorId[idEntity];
            pos = {
                x: 0,
                y: 0,
                z: 0
            };

            //_gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity

            if (_scene.getMeshByName("SensorProbe-" + sensorId)) {
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).hide();
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).show();
            }
            else {
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).show();
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).hide();
            }

            inGralHeight = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.gralHeight + '-' + idEntity);
            inGralRadius = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.gralRadius + '-' + idEntity);

            inHeight = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.height + '-' + idEntity);
            inPerpend = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.perpend + '-' + idEntity);
            inParalel = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.paralel + '-' + idEntity);
            inPosX = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.X + '-' + idEntity);
            inPosY = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.Y + '-' + idEntity);
            inPosZ = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.Z + '-' + idEntity);
            cBAxial = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.axial + '-' + idEntity);
            cBSidePlus = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.sidePlus + '-' + idEntity);
            cBSideMinus = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.sideMinus + '-' + idEntity);
            cBPart = $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.relPart + '-' + idEntity);

            //var parentTreeId = $("#divSensors-" + idEntity + "-" + sensorId).parent()[0].id;

            for (var i = 0; i < treeMeasurementsPointsObj.model.fields.dataSource.length; i++) {
                if (treeMeasurementsPointsObj.model.fields.dataSource[i].id == sensorId) {
                    var parentTreeId = treeMeasurementsPointsObj.model.fields.dataSource[i].pid;
                }
            }

            if (parentTreeId == "idradial") {
                sensorType = "Radial";
                flagSingleSensor = true;
                cBAxial.attr("disabled", false);
            }
            if (parentTreeId == "idaxial") {
                sensorType = "Axial";
                flagSingleSensor = true;
                cBAxial.attr("disabled", false);
            }
            if (parentTreeId == "idpair") {
                sensorType = "Pair";
                flagSingleSensor = false;
                cBAxial.attr("disabled", true);
            }

            inHeight.change(function () {
                _actualicePropertiesSensor("height", inHeight.val());
            });
            inPerpend.change(function () {
                _actualicePropertiesSensor("perpend", inPerpend.val());
            });
            inParalel.change(function () {
                _actualicePropertiesSensor("paralel", inParalel.val());
            });
            inPosX.change(function () {
                _actualicePropertiesSensor("posX", inPosX.val());
            });
            inPosY.change(function () {
                _actualicePropertiesSensor("posY", inPosY.val());
            });
            inPosZ.change(function () {
                _actualicePropertiesSensor("posZ", inPosZ.val());
            });
            inGralHeight.change(function () {

                _actualicePropertiesSensor("gralHeight", inGralHeight.val());
            });
            inGralRadius.change(function () {

                _actualicePropertiesSensor("gralRadius", inGralRadius.val());
            });

            /*
            cBAxial.change(function () {
                if (cBAxial.is(':checked')) {
                    if (flagSingleSensor && parentTreeId.indexOf("-Pair") === -1) {
                        _actualicePropertiesSensor("axial", true);
                        
                        _convertSensorAxialRadial(sensorType);
                    }
                   
                   // cBAxial.prop("checked", false);
                } else {
                    if (flagSingleSensor && parentTreeId.indexOf("-Pair") === -1) {
                        _convertSensorAxialRadial(sensorType);
                        _actualicePropertiesSensor("axial", false);
                        //cBAxial.prop("checked", true);           
                    }
                }
            });*/

            cBSidePlus.change(function () {
                if (cBSidePlus.is(':checked')) {
                    _actualicePropertiesSensor("sidePlus", true);
                    cBSideMinus.prop("checked", false);
                    if (flagSingleSensor && parentTreeId != "idpair") {
                        _convertSensorAxialRadial();
                    }

                } else {
                    _actualicePropertiesSensor("sidePlus", false);
                    cBSideMinus.prop("checked", false);
                    if (flagSingleSensor && parentTreeId != "idpair") {
                        _convertSensorAxialRadial();
                    }
                }
            });
            cBSideMinus.change(function () {
                if (cBSideMinus.is(':checked')) {
                    _actualicePropertiesSensor("sideMinus", true);
                    cBSidePlus.prop("checked", false);
                    if (flagSingleSensor && parentTreeId != "idpair") {
                        _convertSensorAxialRadial();
                    }
                } else {
                    _actualicePropertiesSensor("sideMinus", false);
                    cBSidePlus.prop("checked", true);
                    if (flagSingleSensor && parentTreeId != "idpair") {
                        _convertSensorAxialRadial();
                    }
                }
            });

            inGralHeight.val(_prop3d.points.height);
            inGralRadius.val(_prop3d.points.diameter / 2 );


            for (var i = 0; i < _prop3d.points.children.length; i++) {
                if (_prop3d.points.children[i].idPoint == sensorId) {

                    if (_prop3d.points.children[i].info.axial) {
                        $("#lblSide").show();
                    } else {
                        $("#lblSide").hide();
                    }

                    //indexPiece = _prop3d.points.children[i].indexPiece[idEntity];

                    if (_prop3d.points.children[i].indexPiece.hasOwnProperty(idEntity)) {
                        indexPiece = _prop3d.points.children[i].indexPiece[idEntity];
                    }
                    else {
                        if (scope.isPrincipal) {
                            indexPiece = _prop3d.points.children[i].indexPiece.level13d;
                        } else {
                            indexPiece = _prop3d.points.children[i].indexPiece.level23d;
                        }
                    }

                    axial = _prop3d.points.children[i].info.axial;
                    side = _prop3d.points.children[i].info.side;
                    parentName = _prop3d.points.children[i].info.parentName;

                    inHeight.val(_prop3d.points.children[i].info.heightScale);
                    inPerpend.val(_prop3d.points.children[i].info.perpend);
                    inParalel.val(_prop3d.points.children[i].info.paralel);
                    inPosX.val(_prop3d.points.children[i].info.x);
                    inPosY.val(_prop3d.points.children[i].info.y);
                    inPosZ.val(_prop3d.points.children[i].info.z);
                    cBPart.val(_prop3d.points.children[i].info.parentName + "-" + indexPiece);
                    if (axial) {
                        cBAxial.prop("checked", true);
                    } else {
                        cBAxial.prop("checked", false);
                    }
                    if (side) {
                        cBSidePlus.prop("checked", true);
                        cBSideMinus.prop("checked", false);
                    } else {
                        cBSidePlus.prop("checked", false);
                        cBSideMinus.prop("checked", true);
                    }
                }
            }

            _renderOutlineSensor();
        };

        _renderOutlineSensor = function () {
            //parentTreeId.indexOf("-Pair") === -1

            var sensorId, idPoint1, idPoint2, cone, probe, coneX, probeX, coneY, probeY;
            sensorId = globalsMenuEd.actualSensorId[idEntity];

            for (var i = 0; i < _prop3d.points.children.length; i++) {
                if (_scene.getMeshByName(globals3d.names.sensor.probe + _prop3d.points.children[i].idPoint )) {
                    probe = _scene.getMeshByName(globals3d.names.sensor.probe + _prop3d.points.children[i].idPoint);
                    cone = _scene.getMeshByName(globals3d.names.sensor.cone + _prop3d.points.children[i].idPoint);

                    probe.renderOutline = false;
                    cone.renderOutline = false;
                }
                    //globals3d.names.sensor.probe + sensorId
                if (_prop3d.points.children[i].idPoint == sensorId) {
                    idPoint1 = _prop3d.points.children[i].idPoint;
                    if (_prop3d.points.children[i].info.relatedIdPoint !== null) {
                        for (var j = 0; j < _prop3d.points.children.length; j++) {
                            if (_prop3d.points.children[i].info.relatedIdPoint == _prop3d.points.children[j].idPoint) {
                                idPoint2 = _prop3d.points.children[j].idPoint;
                            }
                        }
                    } 
                }
            }
            if (_scene.getMeshByName(globals3d.names.sensor.probe + idPoint1)) {
                probeX = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint1);
                coneX = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint1);

                coneX.renderOutline = true;
                probeX.renderOutline = true;
            }
            if (_scene.getMeshByName(globals3d.names.sensor.probe + idPoint2)) {
                probeY = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint2);
                coneY = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint2);
                coneY.renderOutline = true;
                probeY.renderOutline = true;
            }
            
        };

        _actualicePropertiesSensor = function (option, value) {

            var info1, info2, sensorId, idPoint1, idPoint2, prop3dPoint2;
            sensorId = globalsMenuEd.actualSensorId[idEntity];

            for (var i = 0; i < _prop3d.points.children.length; i++) {
                if (_prop3d.points.children[i].idPoint == sensorId) {
                    info1 = _prop3d.points.children[i].info;
                    idPoint1 = _prop3d.points.children[i].idPoint;
                    if (_prop3d.points.children[i].info.relatedIdPoint !== null) {
                        for (var j = 0; j < _prop3d.points.children.length; j++) {
                            if (_prop3d.points.children[i].info.relatedIdPoint == _prop3d.points.children[j].idPoint) {
                                info2 = _prop3d.points.children[j].info;
                                idPoint2 = _prop3d.points.children[j].idPoint;
                                prop3dPoint2 = _prop3d.points.children[j];
                            }
                        }
                    } else {
                        info2 = null;
                    }
                    
                    switch (option) {
                        case "gralHeight":
                            _prop3d.points.height = parseFloat(value);
                            _changeGralSensorSize();
                            break;
                        case "gralRadius":
                            _prop3d.points.diameter = parseFloat(value) * 2;
                            _changeGralSensorSize();
                            break;
                        case "height":
                            info1.heightScale = parseFloat(value);
                            _changeHeightProbe(idPoint1, parseFloat(value));
                            if (info2) {
                                info2.heightScale = parseFloat(value);
                                _changeHeightProbe(idPoint2, parseFloat(value));
                            }
                            break;
                        case "perpend":
                            info1.perpend = parseFloat(value);
                            _moveProbeParalelPerpend(idPoint1, "perpend", parseFloat(value));
                            if (info2) {
                                info2.perpend = parseFloat(value);
                                _moveProbeParalelPerpend(idPoint2, "perpend", parseFloat(value));
                            }
                            break;
                        case "paralel":
                            info1.paralel = parseFloat(value);
                            _moveProbeParalelPerpend(idPoint1, "paralel", parseFloat(value));
                            if (info2) {
                                info2.paralel = parseFloat(value);
                                _moveProbeParalelPerpend(idPoint2, "paralel", parseFloat(value));
                            }
                            break;
                        case "posX":
                            _movePositionSensor(idPoint1, info1.x, "x", parseFloat(value));
                            info1.x = parseFloat(value);
                            
                            if (info2) {
                                _movePositionSensor(idPoint2, info2.x, "x", parseFloat(value));
                                info2.x = parseFloat(value);
                            }
                            break;
                        case "posY":
                            _movePositionSensor(idPoint1, info1.y, "y", parseFloat(value));
                            info1.y = parseFloat(value);
                            if (info2) {
                                _movePositionSensor(idPoint2, info2.y, "y", parseFloat(value));
                                info2.y = parseFloat(value);
                            }
                            break;
                        case "posZ":
                            _movePositionSensor(idPoint1, info1.z, "z", parseFloat(value));
                            info1.z = parseFloat(value);
                            if (info2) {
                                _movePositionSensor(idPoint2, info2.z, "z", parseFloat(value));
                                info2.z = parseFloat(value);
                            }
                            break;
                        case "axial":
                            info1.axial = value;

                            break;
                        case "sidePlus":
                            info1.side = 1;
                            if (info2) {
                                info2.side = 1;
                            }
                            break;
                        case "sideMinus":
                            info1.side = 0;
                            if (info2) {
                                info2.side = 0;
                            }
                            break;
                        case "parentName":
                            info1.parentName = value.split("-")[0];
                            //_prop3d.points.children[i].indexPiece[idEntity] = parseInt(value.split("-")[1]);                        
                            if (scope.isPrincipal) {
                                _prop3d.points.children[i].indexPiece.level13d = parseInt(value.split("-")[1]);
                            } else {
                                _prop3d.points.children[i].indexPiece.level23d = parseInt(value.split("-")[1]);
                            }

                            
                            if (info2) {
                                info2.parentName = value.split("-")[0];
                                //prop3dPoint2.indexPiece[idEntity] = parseInt(value.split("-")[1]);
                                if (scope.isPrincipal) {
                                    prop3dPoint2.indexPiece.level13d = parseInt(value.split("-")[1]);
                                } else {
                                    prop3dPoint2.indexPiece.level23d = parseInt(value.split("-")[1]);
                                }
                            }
                            break;
                    }
                }
            }           
        };

        globalsMenuEd.selectMesh[idEntity] = _selectMeshFcn;
        globalsMenuEd.selectSensor[idEntity] = _selectSensorFcn;

        _constant = globalsMenuEd.constant[idEntity];

        _scene = editor3d.scene[idEntity];

        globalsMenuEd.constant[idEntity] = {
            insert:{
                location: false,
                moving: false,
                statics: false,
                scaling: false,
            },
            pieces:{
                move: true,
                rotate: false,
                scale: false,
                color: "#FFFFFFF",
                axisSelPiece: 1,
                x: 0,
                y: 0,
                z: 0,
                selectedMesh: null
            },
            axis:{
                longAxis: 100,
                hor: true,
                ver: false,
                cW: true,
                cCW: false,
                axisRelVel: 1,
                vel: 1,
                qtyAxis: 1,
                axisSel: 1
            },
            sensors:{
                radiusGral: 5,
                heightGral: 20,
                height: 1,
                angle: 0,
                paralel: 0,
                perpend: 0,
                posX: 0,
                posY: 0,
                posZ: 0, 
                axial: false,
                side: 0
            }
        };

        globalsMenuEd.meshNames[idEntity] = _meshNameArray;
        globalsMenuEd.actualMeshName[idEntity] = null;
        globalsMenuEd.selectedLBPoint[idEntity] = "";
        this.treeEd3d = null;
        this.uiEd3d = null;
        this.initializateProp3d = function (prop3d) {

            if (!prop3d) {
                _prop3d = {
                    asset: {
                        children: [],
                        axis: [{
                            prop: {
                                long: 1000,
                                tS: 0,
                                orientation: 0,
                                view: 1,
                                vel: 1,
                                axisRelVel: 1,
                                position: {
                                    x: 0,
                                    y: 0,
                                    z: 0
                                }
                            }
                        }]
                    },
                    points: {
                        height: 100,
                        diameter: 10,
                        children: []
                    },
                    gralInfo: {
                        idCloned: idEntity,
                        isCloned: true,
                        view: 1,
                        orientation: 0,
                        nominalVel: 3200
                    },
                    colors: {
                        clearColor: "#000000",
                        wireframe: "#00B3FF",
                        spec: {
                            bl: "#99CCE6",
                            bg: "#333380",
                            lc: "#99CCE6"
                        },
                        spec100p: {
                            bl: "#99CCE6",
                            bg: "#333380",
                            lc: "#99CCE6"
                        },
                        orb: {
                            bl: "#99CCE6",
                            bg: "#333380",
                            lc: "#99CCE6"
                        },
                        sCL: {
                            bl: "#CCB380",
                            bg: "#FFB380",
                            lc: "#CCB380"
                        },
                        waterfall: {
                            bl: "#CCB380",
                            bg: "#FFB380",
                            lc: "#CCB380"
                        }
                    }
                }
                console.log("ups");
            }
            else {

                _prop3d = prop3d;
                _assignIndexPieceToPoints();
            }
            _loadAsetPaths();
            //_loadAsetPaths();

            var url = "../Content/images/editor3d/Gradient_1024x768.jpg";
            var background = new BABYLON.Layer("back", url, _scene);
            background.isBackground = true;

            globalsMenuEd.prop3d = _prop3d;
        };

        this.infoAxis = {
            qty: 1,
            children: [] //Propiedades del eje, como orientación, sentido de giro, relVel, posición, asociated Axis
        };

        this.infoSensor = {
            height: 100,
            diameter: 10,
            children:[]
        };
         
        this.createNewFile = function (prop3d) {
            var meshes = [];
            this.initializateProp3d(prop3d);

            for (var i = 0; i < _scene.meshes.length; i++) {
                meshes.push(_scene.meshes[i]);
            }

            for (var i = 0; i < meshes.length; i++) {
                if (meshes[i].name.indexOf("Mesh-") !== -1 && meshes[i].name.indexOf("Sample-") === -1) {
                    meshes[i].dispose();
                }
                if (meshes[i].name.indexOf("Sample-") === -1 && meshes[i].name.indexOf("Sensor") !== -1) {
                    meshes[i].dispose();
                }
            }
            _resetUI();

            var arrayMdVariable = [];
            /*
            for (var i = 0; i < _prop3d.points.children.length; i++) {
                
                arrayMdVariable.push({
                    IdMdVariable: _prop3d.points.children[i].idPoint,
                    PropertiesMdVariable: null
                });
            }*/

            for (var i = 0; i < totalPoints.length; i++) {
                if (totalPoints[i].Properties3d != null) {
                    arrayMdVariable.push({
                        IdMdVariable: totalPoints[i].Id,
                        PropertiesMdVariable: null
                    });
                }
                
            }

            if (arrayMdVariable.length > 0) {
                $.ajax({
                    url: "/Home/UpdateManyMdVariableProperties3d",
                    method: "POST",
                    data: {
                        properties3dList: arrayMdVariable
                    },
                    success: function (response) {
                        console.log(arrayMdVariable);
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "A ocurrido un error. Intente nuevamente");
                    },
                });
            }
            treePiecesObj.removeAll();
            treeMeasurementsPointsObj.removeAll();

            scope.treeEd3d.piecesData = [
                   { id: _treePieces.assemble.id, name: _treePieces.assemble.name, hasChild: true },
                   { id: _treePieces.moving.id, name: _treePieces.moving.name, hasChild: true, pid: _treePieces.assemble.id },
                   { id: _treePieces.statics.id, name: _treePieces.statics.name, hasChild: true, pid: _treePieces.assemble.id },
                   { id: _treePieces.housing.id, name: _treePieces.housing.name, hasChild: true, pid: _treePieces.assemble.id }
            ];

            scope.treeEd3d.pointsData = [
                   { id: _treePoints.points.id, name: _treePoints.points.name, hasChild: true },
                   { id: _treePoints.pair.id, name: _treePoints.pair.name, hasChild: true, pid: _treePoints.points.id },
                   { id: _treePoints.axial.id, name: _treePoints.axial.name, hasChild: true, pid: _treePoints.points.id },
                   { id: _treePoints.radial.id, name: _treePoints.radial.name, hasChild: true, pid: _treePoints.points.id }
            ];

            treePiecesObj.model.fields.dataSource = scope.treeEd3d.piecesData;
            treePiecesObj.refresh();
            treeMeasurementsPointsObj.model.fields.dataSource = scope.treeEd3d.pointsData;
            treeMeasurementsPointsObj.refresh();
            // "Moving-" + _tree.pieces.firstLevel + idEntity
        };

        this.openFile = function () {
            //Resetea con CreateNewFile
            //Aparece modal con todos los activos que tengan propiedades 3D y clonado = false
            var prop3d, idCloned;
            if (!_flagFirstOpen) {
                _createDivNodesPath();
                _flagFirstOpen = true;
            }

            $("#" + globalsMenuEd.modalOpen.id + idEntity).css("display", "block");
            $("#" + globalsMenuEd.modalOpen.idCont + idEntity).ejDialog("open");

            $("#" + globalsMenuEd.modalOpen.id + idEntity + " #btnCancel").click(function (e) {
                e.preventDefault();
                $("#" + globalsMenuEd.modalOpen.idCont + idEntity).ejDialog("close");
            });
            $("#" + globalsMenuEd.modalOpen.id + idEntity + " #btnOpen").click(function (e) {
                e.preventDefault();
                //_uiWaterfall3d.saveInfoWaterfall();
                //console.log("eeer");
                
                $.ajax({
                    url: "/Home/GetAssetProperties3dByNode",
                    method: "GET",
                    data: {
                        nodeId: _nodeChoosed
                    },
                    success: function (result) {
                        
                        if (result) {
                            console.log(result);
                            prop3d = JSON.parse(result);
                            if (prop3d.asset.children.length > 0) {
                                scope.createNewFile(prop3d);
                                //prop3d = JSON.parse(result);
                                prop3d.gralInfo.isCloned = true;
                                console.log(prop3d.asset.children[0].axisNum);
                                console.log(prop3d);
                                globalsMenuEd.prop3d = prop3d;
                                scope.initializateProp3d(prop3d);
                                scope.uiEd3d.flagOpenFile = true;
                                scope.uiEd3d.loadAxisHelperAxis();
                                if (prop3d.gralInfo.idCloned != "") {
                                    idCloned = prop3d.gralInfo.idCloned;
                                } else {
                                    idCloned = _nodeChoosed;
                                }
                                prop3d.gralInfo.idCloned = idCloned;
                                prop3d.points.children = [];
                                _urlSTL = urlBabylonFiles + idCloned + "/";
                                scope.loadAssetMeshes();
                            }
                            else {
                                popUp("warning", "El activo seleccionado no tiene propiedades 3D");
                            }
                        }
                        else {
                            popUp("warning", "El activo seleccionado no tiene propiedades 3D");
                        }
                    },
                    error: function (jqXHR, textStatus) {
                        console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                    }
                });

                $("#" + globalsMenuEd.modalOpen.id + idEntity).css("display", "none"); // Ocultar de nuevo el html de la modal
                $("#" + globalsMenuEd.modalOpen.idCont + idEntity).ejDialog("close");
            });
        };

        this.saveFile = function () {
            var properties3dAsset = {}, arrayMdVariable = [];
            properties3dAsset.points = {};
            properties3dAsset.asset = globalsMenuEd.prop3d.asset;
            properties3dAsset.colors = globalsMenuEd.prop3d.colors;
            properties3dAsset.gralInfo = globalsMenuEd.prop3d.gralInfo;
            properties3dAsset.points.height = globalsMenuEd.prop3d.points.height;
            properties3dAsset.points.diameter = globalsMenuEd.prop3d.points.diameter;

            if (scope.isFromLibrary) {
                properties3dAsset.gralInfo.idCloned = scope.urlLibrary.split("../Content/STL/")[1];
            }

            if (properties3dAsset.asset.children.length > 0) {
                properties3dAsset = JSON.stringify(properties3dAsset);

                $.ajax({
                    url: "/Home/SetAssetProperties3d",
                    method: "POST",
                    data: { assetId: assetId, properties3d: properties3dAsset },
                    success: function (response) {
                        console.log(response);
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "A ocurrido un error. Intente nuevamente");
                    },
                });

                for (var h = 0; h < totalPoints.length; h++) {
                    for (var i = 0; i < globalsMenuEd.prop3d.points.children.length; i++) {
                        if (totalPoints[h].Id == globalsMenuEd.prop3d.points.children[i].idPoint) {
                            if (globalsMenuEd.prop3d.points.children[i].info.orientation == "radial" ||
                        globalsMenuEd.prop3d.points.children[i].info.orientation == "X" ||
                        globalsMenuEd.prop3d.points.children[i].info.orientation == "Y") {


                                if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                                    globalsMenuEd.prop3d.points.children[i].info.angle = totalPoints[h].SensorAngle * -1 * Math.PI / 180;
                                } else {
                                    globalsMenuEd.prop3d.points.children[i].info.angle = totalPoints[h].SensorAngle * Math.PI / 180;
                                }
                            }
                        }
                    }
                }
                for (var i = 0; i < globalsMenuEd.prop3d.points.children.length; i++) {
                    //globalsMenuEd.prop3d.points.children[i].info.angle = 


                    arrayMdVariable.push({
                        IdMdVariable: globalsMenuEd.prop3d.points.children[i].idPoint,
                        PropertiesMdVariable: JSON.stringify(globalsMenuEd.prop3d.points.children[i])
                    })
                }
                console.log(arrayMdVariable);
                if (arrayMdVariable.length > 0) {
                    $.ajax({
                        url: "/Home/UpdateManyMdVariableProperties3d",
                        method: "POST",
                        data: {
                            properties3dList: arrayMdVariable
                        },
                        success: function (response) {
                            console.log(arrayMdVariable);
                        },
                        error: function (jqXHR, textStatus) {
                            popUp("error", "A ocurrido un error. Intente nuevamente");
                        },
                    });
                }
            } else {
                $.ajax({
                    url: "/Home/SetAssetProperties3d",
                    method: "POST",
                    data: { assetId: assetId, properties3d: null },
                    success: function (response) {
                        console.log(response);
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "A ocurrido un error. Intente nuevamente");
                    },
                });
            }
           
            
        };

        this.insertLocation = function (fileName) {
            globalsMenuEd.constant[idEntity].insert.location = true;
            _loadSTL(fileName, "location");
        };

        this.insertMoving = function (fileName) {
            globalsMenuEd.constant[idEntity].insert.moving = true;
            _loadSTL(fileName, "moving");
        };

        this.insertStatics = function (fileName) {
            globalsMenuEd.constant[idEntity].insert.statics = true;
            _loadSTL(fileName, "statics");
        };

        this.insertHousing = function (fileName) {
            globalsMenuEd.constant[idEntity].insert.housing = true;
            _loadSTL(fileName, "housing");
        };

        this.moveMesh = function () {
            var mesh, meshName, pos;

            pos = {
                x: 0,
                y: 0,
                z: 0
            };
            meshName = globalsMenuEd.actualMeshName[idEntity];

            if (meshName) {              
                mesh = _scene.getMeshByName(meshName);
                pos.x = mesh.position.x;
                pos.y = mesh.position.y;
                pos.z = mesh.position.z;

                _inX = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X);
                _inY = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y);
                _inZ = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z);

                _inX.val(pos.x);
                _inY.val(pos.y);
                _inZ.val(pos.z);
            }
            _actualicePropertiesPieces();
        };

        this.rotateMesh = function () {
            var mesh, meshName, rot;

            rot = {
                x: 0,
                y: 0,
                z: 0
            };
            meshName = globalsMenuEd.actualMeshName[idEntity];

            if (meshName) {

                mesh = _scene.getMeshByName(meshName);
                rot.x = mesh.rotation.x;
                rot.y = mesh.rotation.y;
                rot.z = mesh.rotation.z;

                _inX = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X);
                _inY = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y);
                _inZ = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z);

                _inX.val(rot.x);
                _inY.val(rot.y);
                _inZ.val(rot.z);
            }
            _actualicePropertiesPieces();
        };

        this.scaleMesh = function () {
            var mesh, meshName, sca;

            sca = {
                x: 0,
                y: 0,
                z: 0
            };
            meshName = globalsMenuEd.actualMeshName[idEntity];

            if (meshName) {

                mesh = _scene.getMeshByName(meshName);
                sca.x = mesh.scaling.x;
                sca.y = mesh.scaling.y;
                sca.z = mesh.scaling.z;

                _inX = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X);
                _inY = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y);
                _inZ = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z);

                _inX.val(sca.x);
                _inY.val(sca.y);
                _inZ.val(sca.z);
            }

            _actualicePropertiesPieces();
        };

        this.cloneMesh = function () {

            var meshName, fileName, mesh, newMesh, transform, pos, rot, sca, color, typeMesh, axisNum;

            meshName = globalsMenuEd.actualMeshName[idEntity];

            if (meshName !== null) {
                if (entityType == 1) {

                }
                else if (entityType == 2) {
                    fileName = meshName.split("-")[2];
                    mesh = _scene.getMeshByName(meshName);
                    

                    for (var i = 0; i < _prop3d.asset.children.length; i++) {
                        if (_prop3d.asset.children[i].fileName == fileName) {
                            newMesh = mesh.clone('Mesh-' + idEntity + '-' + fileName + '-' + _prop3d.asset.children[i].transform.length, newMesh);
                            typeMesh = _prop3d.asset.children[i].partType;
                            color = _prop3d.asset.children[i].color;
                            pos = mesh.position;
                            rot = mesh.rotation;
                            sca = mesh.scaling;

                            _prop3d.asset.children[i].transform.push({
                                pos: { x: pos.x, y: pos.y, z: pos.z },
                                rot: { x: rot.x, y: rot.y, z: rot.z },
                                sca: { x: sca.x, y: sca.y, z: sca.z }
                            });

                            if (_prop3d.asset.children[i].axisNum.length > 0) {
                                _prop3d.asset.children[i].axisNum.push(0);
                            }
                            else {
                                axisNum = _prop3d.asset.children[i].axisNum;
                                _prop3d.asset.children[i].axisNum = [];
                                _prop3d.asset.children[i].axisNum.push(axisNum);
                                _prop3d.asset.children[i].axisNum.push(0);
                            }
                           

                            mesh.material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                            _asignPropertiesMesh(mesh, fileName, typeMesh, true);
                        }                        
                    }
                    _actualiceMeshesNames();
                }
            }

        };

        this.deleteMesh = function () {

            var meshName,  mesh;

            meshName = globalsMenuEd.actualMeshName[idEntity];
            mesh = _scene.getMeshByName(meshName);
          
            mesh.dispose();
            _actualiceMeshesNames();
            _reorderPieces(meshName);
        };

        this.changeMeshColor = function (colorIn) {

            var  meshName, mesh;

            meshName = globalsMenuEd.actualMeshName[idEntity];
            mesh = _scene.getMeshByName(meshName);
            mesh.material.diffuseColor = new BABYLON.Color3.FromHexString(colorIn);

            _actualicePropertiesPieces();
        };

        this.selectParentAxis = function (numAxis) {
            
            var meshName, mesh, fileName, indexMesh;

            numAxis = numAxis - 1;
            meshName = globalsMenuEd.actualMeshName[idEntity];

            if (meshName) {
                fileName = meshName.split("-")[2];
                indexMesh = meshName.split("-")[3];
                indexMesh = parseInt(indexMesh);
                mesh = _scene.getMeshByName(meshName);

                for (var i = 0; i < _prop3d.asset.children.length; i++) {
                    if (_prop3d.asset.children[i].fileName == fileName) {
                        _prop3d.asset.children[i].axisNum[indexMesh] = numAxis;
                    }
                    if (_prop3d.asset.children[i].partType == "moving") {
                        mesh.parent = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + numAxis);
                    }
                    else {
                        mesh.parent = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-" + numAxis);
                    }
                }
            }
            

        };

        this.addNewSensor = function () {
            //'Ed-' + globals3d.names.sensor.parent + idEntity
            var sensorId, sensorYId, measPoints, sensorMesh, parentSensor, probe, cone, sensorMeshY, parentSensorY, probeY, coneY, heightScale, height, diameter, materialIndicator, materialIndicatorY, angle, angleY, vibr = 0, flagId = false, namePoint;
            //sensorId = globalsMenuEd.actualSensorId[idEntity];

            if (globalsMenuEd.selectedLBPoint[idEntity] != "") {

                measPoints = totalPoints;

                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity + " option:selected").remove();

                _actualiceTreePoints(true);
                //sensorId = globalsMenuEd.actualSensorId[idEntity];

                if (globalsMenuEd.selectedLBPoint[idEntity].indexOf("-") != -1) {
                    namePoint = globalsMenuEd.selectedLBPoint[idEntity].split(" - ")[0];
                } else {
                    namePoint = globalsMenuEd.selectedLBPoint[idEntity];
                }

                for (var i = 0; i < totalPoints.length; i++) {

                    if (namePoint == totalPoints[i].Name) {
                        globalsMenuEd.actualSensorId[idEntity] = totalPoints[i].Id;
                        break;
                    }

                }
                sensorId = globalsMenuEd.actualSensorId[idEntity];

                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity).val("");

                height = _prop3d.points.height;
                diameter = _prop3d.points.diameter;

                for (var i = 0; i < _prop3d.points.children.length; i++) {
                    if (_prop3d.points.children[i].idPoint == sensorId) {
                        flagId = true;
                    }
                }

                for (var i = 0; i < measPoints.length; i++) {

                    if (sensorId === measPoints[i].Id && !flagId) {
                        if ((measPoints[i].Orientation == 1 || measPoints[i].Orientation == 2) && measPoints[i].AssociatedMeasurementPointId != null) {
                            //angle = measPoints[i].SensorAngle;
                            
                            if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                                angle = measPoints[i].SensorAngle * -1 * Math.PI / 180;
                            } else {
                                angle = measPoints[i].SensorAngle * Math.PI / 180;
                            }

                            sensorYId = measPoints[i].AssociatedMeasurementPointId;
                            sensorMesh = new Object(_scene.getMeshByName("Sample-" + globals3d.names.sensor.parent + idEntity));
                            parentSensor = new Object(sensorMesh.clone(globals3d.names.sensor.parent + sensorId, parentSensor));
                            parentSensor.visibility = false;

                            materialIndicator = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + sensorId, _scene);

                            probe = _scene.getMeshByName(parentSensor._children[0].name);
                            probe.name = globals3d.names.sensor.probe + sensorId;
                            probe.uniqueId = _findMaxUniqueId() + 1;
                            probe.id = "id-" + globals3d.names.sensor.probe + sensorId;
                            probe.visibility = true;

                            cone = _scene.getMeshByName(parentSensor._children[1].name);
                            cone.name = globals3d.names.sensor.cone + sensorId;
                            cone.uniqueId = _findMaxUniqueId() + 1;
                            cone.id = "id-" + globals3d.names.sensor.cone + sensorId;
                            cone.material = materialIndicator;
                            cone.visibility = true;


                            probe.outlineWidth = 1;
                            probe.outlineColor = BABYLON.Color3.Red();

                            cone.outlineWidth = 1;
                            cone.outlineColor = BABYLON.Color3.Red();

                            sensorMeshY = new Object(_scene.getMeshByName("Sample-" + globals3d.names.sensor.parent + idEntity));
                            parentSensorY = new Object(sensorMeshY.clone(globals3d.names.sensor.parent + sensorYId, parentSensorY));
                            parentSensorY.visibility = false;

                            materialIndicatorY = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + sensorYId, _scene);

                            probeY = _scene.getMeshByName(parentSensorY._children[0].name);
                            probeY.name = globals3d.names.sensor.probe + sensorYId;
                            probeY.uniqueId = _findMaxUniqueId() + 1;
                            probeY.id = "id-" + globals3d.names.sensor.probe + sensorYId;
                            probeY.visibility = true;

                            coneY = _scene.getMeshByName(parentSensorY._children[1].name);
                            coneY.name = globals3d.names.sensor.cone + sensorYId;
                            coneY.uniqueId = _findMaxUniqueId() + 1;
                            coneY.id = "id-" + globals3d.names.sensor.cone + sensorYId;
                            coneY.material = materialIndicator;
                            coneY.visibility = true;

                            probeY.outlineWidth = 1;
                            probeY.outlineColor = BABYLON.Color3.Red();

                            coneY.outlineWidth = 1;
                            coneY.outlineColor = BABYLON.Color3.Red();

                            cone.position.y = -((height * 1) / 2 + 3 * diameter / 4);
                            coneY.position.y = -((height * 1) / 2 + 3 * diameter / 4);

                            for (var j = 0; j < measPoints.length; j++) {
                                if (sensorYId === measPoints[j].Id) {
                                   // angleY = measPoints[j].SensorAngle;
                                    
                                    if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                                        angleY = measPoints[j].SensorAngle * -1 * Math.PI / 180;
                                    } else {
                                        angleY = measPoints[j].SensorAngle * Math.PI / 180;
                                    }
                                    
                                }
                            }
                           // parentSensor.rotation.z = angle * Math.PI / 180;
                           // parentSensorY.rotation.z = angleY * Math.PI / 180;

                            parentSensor.rotation.z = angle;
                            parentSensorY.rotation.z = angleY;

                            _prop3d.points.children.push({
                                idPoint: sensorId,
                                indexPiece: {
                                    level13d: null,
                                    level23d: null
                                },
                                info: {
                                    orientation: "X",
                                    relatedIdPoint: sensorYId,
                                    parentName: null,
                                    heightScale: 1,
                                    side: 0,
                                    angle: angle,
                                    paralel: 0,
                                    perpend: 0,
                                    axial: false,
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                    vibr: 1
                                }
                            });

                            /*
                            for (var j = 0; j < nodesId.length; j++) {
                                _prop3d.points.children[_prop3d.points.children.length - 1].indexPiece[nodesId[j]] = null;
                            }*/

                            //_prop3d.points.children[_prop3d.points.children.length - 1].indexPiece[idEntity] = null;

                            _prop3d.points.children.push({
                                indexPiece: {
                                    level13d: null,
                                    level23d: null
                                },
                                idPoint: sensorYId,
                                info: {
                                    relatedIdPoint: sensorId,
                                    orientation: "Y",
                                    parentName: null,
                                    heightScale: 1,
                                    side: 0,
                                    angle: angleY,
                                    paralel: 0,
                                    perpend: 0,
                                    axial: false,
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                    vibr: 1
                                }
                            });
                            //for (var j = 0; j < nodesId.length; j++) {
                            //    _prop3d.points.children[_prop3d.points.children.length - 1].indexPiece[nodesId[j]] = null;
                            //}

                        }
                        else if  (measPoints[i].Orientation == 1) {
                            //angle = measPoints[i].SensorAngle;
                            
                            if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                                angle = measPoints[i].SensorAngle * -1 * Math.PI / 180;
                            } else {
                                angle = measPoints[i].SensorAngle * Math.PI / 180;
                            }

                            sensorMesh = new Object(_scene.getMeshByName("Sample-" + globals3d.names.sensor.parent + idEntity));
                            parentSensor = new Object(sensorMesh.clone(globals3d.names.sensor.parent + sensorId, parentSensor));
                            parentSensor.visibility = false;

                            materialIndicator = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + sensorId, _scene);

                            probe = _scene.getMeshByName(parentSensor._children[0].name);
                            probe.name = globals3d.names.sensor.probe + sensorId;
                            probe.uniqueId = _findMaxUniqueId() + 1;
                            probe.id = "id-" + globals3d.names.sensor.probe + sensorId;
                            probe.visibility = true;

                            cone = _scene.getMeshByName(parentSensor._children[1].name);
                            cone.name = globals3d.names.sensor.cone + sensorId;
                            cone.uniqueId = _findMaxUniqueId() + 1;
                            cone.id = "id-" + globals3d.names.sensor.cone + sensorId;
                            cone.material = materialIndicator;
                            cone.visibility = true;


                            probe.outlineWidth = 1;
                            probe.outlineColor = BABYLON.Color3.Red();

                            cone.outlineWidth = 1;
                            cone.outlineColor = BABYLON.Color3.Red();

                            parentSensor.rotation.z = angle;

                            _prop3d.points.children.push({
                                idPoint: sensorId,
                                indexPiece: {
                                    level13d: null,
                                    level23d: null
                                },
                                info: {
                                    orientation: "radial",
                                    relatedIdPoint: null,
                                    parentName: null,
                                    heightScale: 1,
                                    side: 0,
                                    angle: angle,
                                    paralel: 0,
                                    perpend: 0,
                                    axial: false,
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                    vibr: 1
                                }
                            });

                        }
                        else if (measPoints[i].Orientation == 0 || measPoints[i].Orientation == 4) {

                            vibr = 1;
                            //angle = measPoints[i].SensorAngle;
                            if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                                angle = measPoints[i].SensorAngle * -1 * Math.PI / 180;
                            } else {
                                angle = measPoints[i].SensorAngle * Math.PI / 180;
                            }
                            sensorMesh = new Object(_scene.getMeshByName("Sample-" + globals3d.names.sensor.parent + idEntity));
                            parentSensor = new Object(sensorMesh.clone(globals3d.names.sensor.parent + sensorId, parentSensor));
                            parentSensor.visibility = true;

                            probe = _scene.getMeshByName(parentSensor._children[0].name);
                            probe.name = globals3d.names.sensor.probe + sensorId;
                            probe.uniqueId = _findMaxUniqueId() + 1;
                            probe.id = "id-" + globals3d.names.sensor.probe + sensorId;
                            probe.visibility = true;

                            cone = _scene.getMeshByName(parentSensor._children[1].name);
                            cone.name = globals3d.names.sensor.cone + sensorId;
                            cone.uniqueId = _findMaxUniqueId() + 1;
                            cone.id = "id-" + globals3d.names.sensor.cone + sensorId;
                            cone.material = materialIndicator;
                            cone.position.y = -((height * 1) / 2 + 3 * diameter / 4);
                            cone.visibility = true;

                            parentSensor.rotation.z = angle;

                            _prop3d.points.children.push({
                                idPoint: sensorId,
                                indexPiece: {
                                    level13d: null,
                                    level23d: null
                                },
                                info: {
                                    relatedIdPoint: null,
                                    orientation: null,
                                    parentName: null,
                                    heightScale: 1,
                                    side: 0,
                                    angle: angle,
                                    paralel: 0,
                                    perpend: 0,
                                    axial: false,
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                    vibr: vibr
                                }
                            });
                        }
                        else if (measPoints[i].Orientation == 3) {

                            vibr = 1;
                            angle = measPoints[i].SensorAngle * Math.PI / 180;

                            sensorMesh = new Object(_scene.getMeshByName("Sample-" + globals3d.names.sensor.parent + idEntity));
                            parentSensor = new Object(sensorMesh.clone(globals3d.names.sensor.parent + sensorId, parentSensor));
                            parentSensor.visibility = true;

                            probe = _scene.getMeshByName(parentSensor._children[0].name);
                            probe.name = globals3d.names.sensor.probe + sensorId;
                            probe.uniqueId = _findMaxUniqueId() + 1;
                            probe.id = "id-" + globals3d.names.sensor.probe + sensorId;
                            probe.visibility = true;

                            cone = _scene.getMeshByName(parentSensor._children[1].name);
                            cone.name = globals3d.names.sensor.cone + sensorId;
                            cone.uniqueId = _findMaxUniqueId() + 1;
                            cone.id = "id-" + globals3d.names.sensor.cone + sensorId;
                            cone.material = materialIndicator;
                            cone.position.y = -((height * 1) / 2 + 3 * diameter / 4);
                            cone.visibility = true;

                            parentSensor.rotation.z = angle * Math.PI / 180;

                            _prop3d.points.children.push({
                                idPoint: sensorId,
                                indexPiece: {
                                    level13d: null,
                                    level23d: null
                                },
                                info: {
                                    relatedIdPoint: null,
                                    orientation: null,
                                    parentName: null,
                                    heightScale: 1,
                                    side: 0,
                                    angle: angle,
                                    paralel: 0,
                                    perpend: 0,
                                    axial: true,
                                    x: 0,
                                    y: 0,
                                    z: 0,
                                    vibr: vibr
                                }
                            });

                        }
                    }
                }
                if (_scene.getMeshByName("SensorProbe-" + sensorId)) {
                    $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).hide();
                    $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).show();
                }
                else {
                    $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).show();
                    $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).hide();
                }

                _selectSensorFcn();
            }
          

            console.log(sensorMesh);
        };

        this.deleteSensor = function () {
            
            var idPoint, idRelated = null, sensorParent1, sensorParent2;
            idPoint = globalsMenuEd.actualSensorId[idEntity];

            _actualiceTreePoints(false);

            for (var i = 0; i < totalPoints.length; i++) {
                if (totalPoints[i].Id == idPoint) {
                    if (totalPoints[i].AssociatedMeasurementPointId && totalPoints[i].Orientation == 1) {
                        for (var j = 0; j < totalPoints.length; j++) {
                            if (totalPoints[i].AssociatedMeasurementPointId == totalPoints[j].Id) {
                                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity).append("<option>" + totalPoints[i].Name + " - " + totalPoints[j].Name + "</option>");
                            }
                        }
                    } else if (totalPoints[i].Orientation != 2) {
                        $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity).append("<option>" + totalPoints[i].Name + "</option>");
                    }

                }
            }

            for (var i = 0; i < _prop3d.points.children.length; i++) {
                if (idPoint == _prop3d.points.children[i].idPoint) {

                    if (_prop3d.points.children[i].info.idRelated !== null) {
                        idRelated = _prop3d.points.children[i].info.relatedIdPoint;
                    }
                    _prop3d.points.children.splice(i, 1);

                    for (var j = 0; j < _prop3d.points.children.length; j++) {
                        if (idRelated == _prop3d.points.children[j].idPoint) {
                            _prop3d.points.children.splice(j, 1);
                        }
                    }
                }
            }

            sensorParent1 = _scene.getMeshByName(globals3d.names.sensor.parent + idPoint);
            sensorParent2 = _scene.getMeshByName(globals3d.names.sensor.parent + idRelated);
           
            sensorParent1.dispose();
            if (sensorParent2) {
                sensorParent2.dispose();
            }
            

            if (_scene.getMeshByName("SensorProbe-" + idPoint)) {
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).hide();
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).show();
            }
            else {
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).show();
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).hide();
            }
        };

        this.loadAssetMeshes = function () {

            //_urlSTL = urlBabylonFiles + principalNodeId + "/";

            var fileName, typeMesh;

            _filesToLoad = globalsMenuEd.prop3d.asset.children.length;

            for (var i = 0; i < globalsMenuEd.prop3d.asset.children.length; i++) {
                fileName = globalsMenuEd.prop3d.asset.children[i].fileName;
                typeMesh = globalsMenuEd.prop3d.asset.children[i].partType;
                _loadSTL(fileName, typeMesh, true);
            }
            
        };

        _loadAsetPaths = function () {

            var i,j,k,
                index,
                index2,
                nodePathLong = "/",
                nameTemp = "",
                nodeList = [],
                nodePathShort = "/",
                currentLevel,
                currentLevel2,
                parentLevelList,
                parentLevelList2,
                orderedNodes,
                unorderedNodes,
                level,
                nodeId;
          
            for (i = 0; i < jsonTreeAssets.length; i++) {

                if (jsonTreeAssets[i].EntityType == 2 && jsonTreeAssets[i].Id != idEntity) {
                    nodeId = jsonTreeAssets[i].Id;
                    level = jsonTreeAssets[i].Level;
                    currentLevel = level;
                    parentLevelList = [];
                    nodePathLong = "";
                    nodePathShort = "";
                    index = (level != null) ? level.lastIndexOf('.') : -1;
                    parentLevelList.push(currentLevel);

                    while (index != -1) {
                        currentLevel = currentLevel.substring(0, index);
                        parentLevelList.push(currentLevel);
                        index = currentLevel.lastIndexOf('.');
                    }
                    parentLevelList.reverse();

                    for (j = 0; j < parentLevelList.length; j++) {
                        for (k = 0; k < jsonTreeAssets.length; k++) {
                            if (jsonTreeAssets[k].Level == parentLevelList[j]) {
                                nameTemp = jsonTreeAssets[k].Name + "";
                                nodePathLong = nodePathLong.concat(nameTemp + "/");

                            }
                        }
                    }

                    for (j = parentLevelList.length - 2; j < parentLevelList.length; j++) {
                        for (k = 0; k < jsonTreeAssets.length; k++) {
                            if (jsonTreeAssets[k].Level == parentLevelList[j]) {
                                nameTemp = jsonTreeAssets[k].Name + "";
                                nodePathShort = nodePathShort.concat(nameTemp + "/");

                            }
                        }
                    }

                    nodeList.push(jsonTreeAssets[i].Id);
                    scope.nodePathList.push({ nodesPathLong: nodePathLong, nodesPathShort: nodePathShort, nodeId: jsonTreeAssets[i].Id });
                    
                }
            }
        };     

        _createDivNodesPath = function () {
            var nodeOver = null, nodeOut = null;
            for (var i = 0; i < scope.nodePathList.length; i++) {
                $("#" + globalsMenuEd.modalOpen.idDivNames + "-" + idEntity).append('<div id="' + globalsMenuEd.modalOpen.idDivNames + "-" + scope.nodePathList[i].nodeId + "-" + idEntity + '" class="edPathAsset">' + scope.nodePathList[i].nodesPathShort + '<br></div>');
                $("#" + globalsMenuEd.modalOpen.idDivNames + "-" + scope.nodePathList[i].nodeId + "-" + idEntity).
                    click(function () {
                        _nodeChoosed = this.id.split("-")[1];
                        console.log(_nodeChoosed);

                        for (var j = 0; j < scope.nodePathList.length; j++) {
                            $("#" + globalsMenuEd.modalOpen.idDivNames + "-" + scope.nodePathList[j].nodeId + "-" + idEntity).css({
                                "cursor":"pointer",
                                "background-color": "#f8f8f8",
                                "border": "solid",
                                "border-width": "1px",
                                "border-color": "rgb(255, 255, 255)",
                                "font-size": "11px"
                            });
                        }
                        $(this).css({
                            "background-color": "#afd2ea",
                            "border": "solid",
                            "border-width": "1px",
                            "border-color": "#a8c8e4"
                        });

                    }).mouseover(function () {
                        nodeOver = this.id.split("-")[1];
                        for (var j = 0; j < scope.nodePathList.length; j++) {
                            if (nodeOver == scope.nodePathList[j].nodeId) {
                                $("#" + globalsMenuEd.modalOpen.idDivNames + "-" + scope.nodePathList[j].nodeId + "-" + idEntity).text(scope.nodePathList[j].nodePathLong);
                            }                            
                        }
                        $(this).css({
                            "background-color": "rgb(232, 236, 255)"
                        });
                    }).mouseout(function () {
                        nodeOut = this.id.split("-")[1];
                        for (var j = 0; j < scope.nodePathList.length; j++) {
                            if (nodeOut == scope.nodePathList[j].nodeId) {
                                $(this).text(scope.nodePathList[j].nodePathShort);
                            }
                        }
                        $(this).css({
                            "background-color": "#f8f8f8"
                        });
                    });
            }
            
        };

        _assignIndexPieceToPoints = function () {

            var propertyNames, indexPiece, idIndexPrincipal, lvl1IndexPiece, lvl2IndexPiece;
            lvl1IndexPiece = null;
            lvl2IndexPiece = null;

            if (_prop3d.points.children) {
                for (var i = 0; i < _prop3d.points.children.length; i++) {
                    if (_prop3d.points.children[i].indexPiece.hasOwnProperty(idEntity)) {
                        indexPiece = _prop3d.points.children[i].indexPiece[idEntity];
                    }
                    else if (_prop3d.points.children[i].indexPiece.hasOwnProperty("level13d")) {
                        if (scope.isPrincipal) {
                            indexPiece = _prop3d.points.children[i].indexPiece.level13d;
                            lvl1IndexPiece = indexPiece;
                        } else {
                            indexPiece = _prop3d.points.children[i].indexPiece.level23d;
                            lvl2IndexPiece = indexPiece;
                        }
                        propertyNames = Object.getOwnPropertyNames(_prop3d.points.children[i].indexPiece);
                    }
                    else if (!_prop3d.points.children[i].indexPiece.hasOwnProperty("level13d") && !_prop3d.points.children[i].indexPiece.hasOwnProperty(idEntity)) {
                        propertyNames = Object.getOwnPropertyNames(_prop3d.points.children[i].indexPiece);

                        if (scope.isPrincipal) {

                            for (var j = 0; j < jsonTree.length; j += 1) {
                                for (var k = 0; k < propertyNames.length; k++) {
                                    if (jsonTree[j].Id == propertyNames[k] && !jsonTree[j].HasChild) {
                                        // _isPrincipal = !treeObj.model.fields.dataSource[i].hasChild;
                                        idIndexPrincipal = propertyNames[k];
                                        indexPiece = _prop3d.points.children[i].indexPiece[idIndexPrincipal];
                                        lvl1IndexPiece = indexPiece;
                                        break;
                                    }
                                }
                            }
                        } else {
                            for (var j = 0; j < propertyNames.length; j++) {
                                if (_prop3d.points.children[i].indexPiece[propertyNames[j]] != null && propertyNames[j] != idIndexPrincipal) {
                                    indexPiece = _prop3d.points.children[i].indexPiece[propertyNames[j]];
                                    lvl2IndexPiece = indexPiece;
                                }
                            }
                        }
                    }

                    if (propertyNames) {
                        for (var j = 0; j < propertyNames.length; j++) {
                            delete _prop3d.points.children[i].indexPiece[propertyNames[j]];
                        }
                    }


                    _prop3d.points.children[i].indexPiece.level13d = lvl1IndexPiece;
                    _prop3d.points.children[i].indexPiece.level23d = lvl2IndexPiece;
                }
            }
            
        };

        _loadSensorsMeshes = function () {

            var point, angle, side, axial, sensorMesh, parentSensor, materialIndicator, probe, cone, idPoint, parentMesh, indexParent, fileName, paralel, orientation, posX, posY, posZ, heightScale, height, diameter, parentInfo, parentSize = { pos: 0, neg: 0 }, valueParalel, valuePerpend, totalHeight, numAxis, divPoint, divAxial, divVarious;

            for (var i = 0; i < globalsMenuEd.prop3d.points.children.length; i++) {
                point = new Object(globalsMenuEd.prop3d.points.children[i]);
                fileName = point.info.parentName;
                //indexParent = point.indexPiece[idEntity];

                if (_prop3d.points.children[i].indexPiece.hasOwnProperty(idEntity)) {
                    indexParent = point.indexPiece[idEntity];
                }
                else {
                    if (scope.isPrincipal) {
                        indexParent = point.indexPiece.level13d;
                    } else {
                        indexParent = point.indexPiece.level23d;
                    }
                }

                parentMesh = _scene.getMeshByName("Mesh-" + idEntity + "-" + fileName + "-" + indexParent);
                

                idPoint = globalsMenuEd.prop3d.points.children[i].idPoint;

                height = globalsMenuEd.prop3d.points.height;
                diameter = globalsMenuEd.prop3d.points.diameter;
                angle = point.info.angle;
                /*
                if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                    angle = point.info.angle * -1;
                } else {
                    angle = point.info.angle;
                }*/
                valueParalel = point.info.paralel;
                valuePerpend = point.info.perpend;
                axial = point.info.axial;
                side = point.info.side;
                posX = point.info.x;
                posY = point.info.y;
                posZ = point.info.z;
                heightScale = point.info.heightScale;

                sensorMesh = new Object(_scene.getMeshByName("Sample-" + globals3d.names.sensor.parent + idEntity));
                parentInfo = new Object(parentMesh._boundingInfo);
                totalHeight = (height * heightScale + diameter + 3 * diameter / 2);

                parentSize.pos = Math.sqrt(Math.pow(parentInfo.maximum.y, 2), Math.pow(parentInfo.maximum.x, 2));
                parentSize.neg = Math.sqrt(Math.pow(parentInfo.maximum.y, 2), Math.pow(parentInfo.minimum.x, 2));

                parentSensor = new Object(sensorMesh.clone(globals3d.names.sensor.parent + idPoint, parentSensor));
                parentSensor.visibility = false;

                materialIndicator = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + idPoint, _scene);

                probe = _scene.getMeshByName(parentSensor._children[0].name);
                cone = _scene.getMeshByName(parentSensor._children[1].name);

                probe.dispose();
                cone.dispose();

                probe = BABYLON.Mesh.CreateCylinder(globals3d.names.sensor.probe + idPoint, height, diameter, diameter, null, _scene);
                cone = BABYLON.Mesh.CreateCylinder(globals3d.names.sensor.cone + idPoint, diameter, diameter, 0.1, null, _scene);

                probe.parent = parentSensor;
                cone.parent = parentSensor;
                parentSensor.parent = parentMesh;


                probe.uniqueId = _findMaxUniqueId() + 1;
                probe.id = "id-" + globals3d.names.sensor.probe + idPoint;
                probe.visibility = true;
                probe.material = materialIndicator;
                probe.material.alpha = 0.3;

                cone.uniqueId = _findMaxUniqueId() + 1;
                cone.id = "id-" + globals3d.names.sensor.cone + idPoint;
                cone.material = materialIndicator;
                cone.visibility = true;
                cone.material.alpha = 0.3;

                probe.outlineWidth = 1;
                probe.outlineColor = BABYLON.Color3.Red();

                cone.outlineWidth = 1;
                cone.outlineColor = BABYLON.Color3.Red();

                for (var j = 0; j < globalsMenuEd.prop3d.asset.children.length; j++) {

                    if (globalsMenuEd.prop3d.asset.children[j].fileName == fileName) {
                        if (numAxis = globalsMenuEd.prop3d.asset.children[j].axisNum.length > 0) {
                            numAxis = globalsMenuEd.prop3d.asset.children[j].axisNum[indexParent];
                        }
                        else {
                            numAxis = globalsMenuEd.prop3d.asset.children[j].axisNum;
                        }
                    }
                }
                
                orientation = globalsMenuEd.prop3d.asset.axis[numAxis].prop.orientation;
                


                if (orientation == 0) {
                    if (probe.parent.position.x >= 0) {
                        probe.position.x = valueParalel;
                    } else {
                        probe.position.x = -valueParalel;
                    }
                } else {
                    if (probe.parent.position.z >= 0) {
                        probe.position.z = valueParalel;
                    } else {
                        probe.position.z = -valueParalel;
                    }
                }
                if (probe.parent.position.y >= 0) {
                    probe.position.y = valuePerpend;
                }
                else {
                    probe.position.y = -valuePerpend;
                }

                

                parentSensor.position.x = parentSensor.position.x + posX;
                parentSensor.position.y = parentSensor.position.y + posY;
                parentSensor.position.z = parentSensor.position.z + posZ;

                probe.scaling.y = heightScale;

                cone.position.y = -((height * heightScale) / 2 + 3 * diameter / 4);
                
                if (axial) {
                    //_convertSensorAxialRadial("various");
                    divPoint = $("#divSensors-" + idEntity + "-" + idPoint);
                    divVarious = $("#" + _tree.sensors.div + idEntity + _tree.sensors.various);
                    divAxial = $("#" + _tree.sensors.div + idEntity + _tree.sensors.axial);

                    divPoint.detach();
                    divAxial.append(divPoint);

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

                    }
                    else {
                        parentSensor.rotation.x = Math.PI / 2;;
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

                        parentSensor.position.y = (parentSize.neg) * Math.sin(Math.PI / 2 - angle) + (totalHeight / 2) * (Math.sin(Math.PI / 2 - angle)) + posY - parentMesh.position.y;
                    }
                    else {
                        parentSensor.position.x = -(parentSize.pos) * Math.sin(angle) - (totalHeight / 2) * (Math.sin(angle)) + posX;

                        parentSensor.position.y = (parentSize.pos) * Math.sin(Math.PI / 2 - angle) + (totalHeight / 2) * (Math.sin(Math.PI / 2 - angle)) + posY - parentMesh.position.y;
                    }
                    parentSensor.position.z = posZ;

                    
                }
                probe.position.x = valueParalel + probe.position.x;
                probe.position.y = valuePerpend + probe.position.y;
            }
            parentSensor.parent = parentMesh;

        };
        
        _convertSensorAxialRadial = function (sensorTypeTree) {
            var idPoint, sensorMesh, side, axial;


            for (var i = 0; i < _prop3d.points.children.length; i++) {
                if (_prop3d.points.children[i].idPoint == idPoint) {
                    axial = _prop3d.points.children[i].info.axial;
                    side = _prop3d.points.children[i].info.side;
                }
            }

            _asignParentToSensor(idPoint);
            
            sensorMesh = _scene.getMeshByName(globals3d.names.sensor.parent + idPoint);
            if (sensorMesh) {
                if (axial) {
                    if (side) {
                        sensorMesh.rotation.x = Math.PI * 90 / 180;
                    }
                    else {
                        sensorMesh.rotation.x = -Math.PI * 90 / 180;
                    }
                }
                else {
                    sensorMesh.rotation.x = 0;
                }
            }         
        };
        
        _changeGralSensorSize = function () {
            var materialIndicator, height, diameter, sensorMesh, cone, probe;
            height = _prop3d.points.height;
            diameter = _prop3d.points.diameter;

            for (var i = 0; i < _prop3d.points.children.length; i++) {
                sensorMesh = _scene.getMeshByName(globals3d.names.sensor.parent + _prop3d.points.children[i].idPoint);
                materialIndicator = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + _prop3d.points.children[i].idPoint, _scene);

                probe = _scene.getMeshByName(globals3d.names.sensor.probe + _prop3d.points.children[i].idPoint);
                cone = _scene.getMeshByName(globals3d.names.sensor.cone + _prop3d.points.children[i].idPoint);

                probe.dispose();
                cone.dispose();

                probe = BABYLON.Mesh.CreateCylinder(globals3d.names.sensor.probe + _prop3d.points.children[i].idPoint, height, diameter, diameter, null, _scene);
                cone = BABYLON.Mesh.CreateCylinder(globals3d.names.sensor.cone + _prop3d.points.children[i].idPoint, diameter, diameter, 0.1, null, _scene);

                probe.material = materialIndicator;
                probe.material.alpha = 0.3;

                probe.parent = sensorMesh;
                cone.parent = sensorMesh;

                _asignParentToSensor(_prop3d.points.children[i].idPoint);
                cone.position.y = -((height * 1) / 2 + 3 * diameter / 4);

                //height = _prop3d.points.height;
                //diameter = _prop3d.points.diameter;

            }

            
        };

        _createSensor = function () {

            var parentSensor, materialIndicator, probe, cone, height, diameter;

            if (globalsMenuEd.prop3d.points) {
                height = globalsMenuEd.prop3d.points.height;
                diameter = globalsMenuEd.prop3d.points.diameter;
            } else {
                height = scope.infoSensor.height;
                diameter = scope.infoSensor.diameter;
            }
            
            

            parentSensor = new BABYLON.Mesh.CreateBox("Sample-" + globals3d.names.sensor.parent + idEntity, 0.0001, _scene, true);
            parentSensor.id = "id" + globals3d.names.sensor.parent;

            probe = new BABYLON.Mesh.CreateCylinder(
                "Sample-" + globals3d.names.sensor.probe + idEntity, height, diameter, diameter, 12, 0, _scene);
            probe.material = new BABYLON.StandardMaterial("mat-" + globals3d.names.sensor.probe + idEntity, _scene, true);
            probe.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
            probe.material.specularColor = new BABYLON.Color3(1, 1, 1);
            probe.material.alpha = 0.1;
            probe.parent = parentSensor;
            probe.visibility = false;

            cone = new BABYLON.Mesh.CreateCylinder(
                "Sample-" + globals3d.names.sensor.cone + idEntity, diameter, diameter, 0.1, 12, 0, _scene);
            cone.parent = parentSensor;
            cone.material = new BABYLON.StandardMaterial("mat-" + globals3d.names.sensor.probe + idEntity, _scene, true);
            cone.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
            cone.material.specularColor = new BABYLON.Color3(1, 1, 1);
            cone.material.alpha = 0.1;
            cone.parent = parentSensor;
            cone.visibility = false;
        }();

        _actualicePropertiesPieces = function () {
            var mesh, meshName, fileName, indexName;

            meshName = globalsMenuEd.actualMeshName[idEntity];
            fileName = meshName.split("-")[2];
            indexName = meshName.split("-")[3];

            mesh = _scene.getMeshByName(meshName);

            for (var i = 0; i < _prop3d.asset.children.length; i++) {
                if (fileName == _prop3d.asset.children[i].fileName) {
                    _prop3d.asset.children[i].color.r = mesh.material.diffuseColor.r;
                    _prop3d.asset.children[i].color.g = mesh.material.diffuseColor.g;
                    _prop3d.asset.children[i].color.b = mesh.material.diffuseColor.b;

                    _prop3d.asset.children[i].transform[indexName].pos.x = mesh.position.x;
                    _prop3d.asset.children[i].transform[indexName].pos.y = mesh.position.y;
                    _prop3d.asset.children[i].transform[indexName].pos.z = mesh.position.z;

                    _prop3d.asset.children[i].transform[indexName].rot.x = mesh.rotation.x;
                    _prop3d.asset.children[i].transform[indexName].rot.y = mesh.rotation.y;
                    _prop3d.asset.children[i].transform[indexName].rot.z = mesh.rotation.z;

                    _prop3d.asset.children[i].transform[indexName].sca.x = mesh.scaling.x;
                    _prop3d.asset.children[i].transform[indexName].sca.y = mesh.scaling.y;
                    _prop3d.asset.children[i].transform[indexName].sca.z = mesh.scaling.z;
                }
            }

            globalsMenuEd.prop3d = _prop3d;
        };

        _actualiceCBParts = function () {

            var fileName, indexMesh;
            //_gral + _Tier2.gral + _Tier2.sensorConfig.relPart
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.relPart + '-' + idEntity).find('option').remove().end();

            for (var i = 0; i < globalsMenuEd.meshNames[idEntity].length; i++) {
                fileName = globalsMenuEd.meshNames[idEntity][i].split("-")[2];
                for(var j = 0; j < globalsMenuEd.prop3d.asset.children.length; j++){
                    if (globalsMenuEd.prop3d.asset.children[j].fileName == fileName && (globalsMenuEd.prop3d.asset.children[j].partType == "housing" || globalsMenuEd.prop3d.asset.children[j].partType == "statics")) {
                        indexMesh = globalsMenuEd.meshNames[idEntity][i].split("-")[3];
                        $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.relPart + '-' + idEntity).append("<option>" + fileName + '-' + indexMesh + "</option>");
                    }
                }                           
            }
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.relPart + '-' + idEntity).change(function (args) {
                _actualicePropertiesSensor("parentName", args.target.value);
                _asignParentToSensor(globalsMenuEd.actualSensorId[idEntity]);

                for (var i = 0; i < totalPoints.length; i++) {
                    if (totalPoints[i].AssociatedMeasurementPointId == globalsMenuEd.actualSensorId[idEntity]) {
                        _asignParentToSensor(totalPoints[i].Id);
                    }
                }
            });
        };

        _actualiceTreePoints = function (flagLB) {

            var pointName, pointId, type, yPoint;

            if (flagLB) {
                if (globalsMenuEd.selectedLBPoint[idEntity].indexOf("-") != -1) {
                    pointName = globalsMenuEd.selectedLBPoint[idEntity].split(" - ")[0];
                } else {
                    pointName = globalsMenuEd.selectedLBPoint[idEntity];
                }
            } else {
                for (var i = 0; i < totalPoints.length; i++) {
                    if (totalPoints[i].Id == globalsMenuEd.actualSensorId[idEntity]) {
                        pointName = totalPoints[i].Name;
                    }
                }
            }
            

            for (var i = 0; i < totalPoints.length; i++) {
                if (totalPoints[i].Name == pointName) {
                    pointId = totalPoints[i].Id;

                    switch (totalPoints[i].Orientation) {
                        case 0: type = "radial";
                            scope.treeEd3d.radialPoints.push(totalPoints[i]);
                            break;
                        case 1:
                            if (totalPoints[i].AssociatedMeasurementPointId != null) {
                                for (var j = 0; j < totalPoints.length; j++) {
                                    if (totalPoints[i].AssociatedMeasurementPointId == totalPoints[j].Id) {
                                        yPoint = totalPoints[j];
                                    }
                                }
                                scope.treeEd3d.pairPoints.push({ X: totalPoints[i], Y: yPoint });
                                type = "pair";
                                //scope.treeEd3d.pointsData.push({ id: "id" + totalPoints[i].Id, name: totalPoints[i].Name + ' - ' + yPoint.Name, hasChild: false, pid: "idpair" });
                            } else {
                                type = "radial";
                                scope.treeEd3d.radialPoints.push(totalPoints[i]);
                                //scope.treeEd3d.pointsData.push({ id: "id" + totalPoints[i].Id, name: totalPoints[i].Name, hasChild: false, pid: "idradial" });
                            }
                            break;
                        case 2: type = "pair";
                            break;
                        case 3: type = "axial";
                            scope.treeEd3d.axialPoints.push(totalPoints[i]);
                            //scope.treeEd3d.pointsData.push({ id: "id" + totalPoints[i].Id, name: totalPoints[i].Name, hasChild: false, pid: "idaxial" });
                            break;
                        case null: if (totalPoints[i].IsAngularReference) {
                            scope.treeEd3d.variousPoints.push(totalPoints[i]);
                            type = "various";
                        }
                            break;
                    }
                    break;
                }
            }

            if (flagLB) {

                treeMeasurementsPointsObj.addNode({ id: "id" + pointId, name: globalsMenuEd.selectedLBPoint[idEntity], hasChild: false, pid: "id" + type });
                /*
                $("#" + _tree.sensors.div + idEntity + _tree.sensors[type]).append('<div id="divSensors-' + idEntity + "-" + pointId + '" class="class' + _tree.pieces.thirdLevel + '">' + globalsMenuEd.selectedLBPoint[idEntity] + '</div>');
                $("#divSensors-" + idEntity + "-" + pointId).click(function (args) {
                    scope.treeEd3d.selectTreeSensor(args.target.id);
                    //_selectTreePart(args.target.id);
                });*/
                /*
                for (var i = 0; i < scope.treeEd3d.pairPoints.length; i++) {
                    scope.treeEd3d.pointsData.push({ id: "id" + scope.treeEd3d.pairPoints[i].X.Id, name: scope.treeEd3d.pairPoints[i].X.Name + ' - ' + scope.treeEd3d.pairPoints[i].Y.Name, hasChild: false, pid: "idpair" });
                }
                for (var i = 0; i < scope.treeEd3d.radialPoints.length; i++) {
                    scope.treeEd3d.pointsData.push({ id: "id" + scope.treeEd3d.radialPoints[i].Id, name: scope.treeEd3d.radialPoints[i].Name, hasChild: false, pid: "idradial" });
                }
                for (var i = 0; i < scope.treeEd3d.axialPoints.length; i++) {
                    scope.treeEd3d.pointsData.push({ id: "id" + scope.treeEd3d.axialPoints[i].Id, name: scope.treeEd3d.axialPoints[i].Name, hasChild: false, pid: "idaxial" });
                }
                */

                //treeMeasurementsPointsObj.model.fields.dataSource = scope.treeEd3d.pointsData;
                treeMeasurementsPointsObj.refresh();

                globalsMenuEd.actualSensorId[idEntity] = pointId;
            } else {
                // $("#divSensors-" + idEntity + "-" + pointId).remove();
                treeMeasurementsPointsObj.removeNode($("#id" + pointId));
            }


        };

        _addSensorsToTree = function () {
            var addedPoint;

            addedPoint = _addedPoints[_addedPoints.length - 1];


        };

        _asignParentToSensor = function (idPoint) {

            var nameFileMesh, idSensor1, idSensor2, sensor1, sensor2, parent, parentInfo, parentSensor1, parentSensor2, probe1, cone1, probe2, cone2,  heightScale, angle1, angle2, perpend, paralel, axial, posX, posY, posZ, side, heightGral, diameterGral, fileName, indexMesh, nameMesh, materialIndicator, sensorMesh, parentSize = {}, totalHeight;

            heightGral = _prop3d.points.height;
            diameterGral = _prop3d.points.diameter;
           
            //idSensor1 = globals3d.names.sensor.parent + globalsMenuEd.actualSensorId[idEntity];

            sensorMesh = new Object(_scene.getMeshByName(globals3d.names.sensor.parent + idEntity));         

            materialIndicator = new BABYLON.StandardMaterial(globals3d.names.sensor.materialInd + idPoint, _scene);
           // console.log(idPoint);
            for (var i = 0; i < _prop3d.points.children.length; i++) {
                //if (idSensor1 === globals3d.names.sensor.parent + _prop3d.points.children[i].idPoint) {
                //console.log(_prop3d.points.children[i].idPoint);
                if (idPoint ==  _prop3d.points.children[i].idPoint) {
                    nameFileMesh = _prop3d.points.children[i].info.parentName;
                    console.log(idPoint);
                   if (nameFileMesh) {
                        fileName = nameFileMesh;
                        //indexMesh = _prop3d.points.children[i].indexPiece[idEntity];

                        if (_prop3d.points.children[i].indexPiece.hasOwnProperty(idEntity)) {
                            indexMesh = _prop3d.points.children[i].indexPiece[idEntity];
                        }
                        else {
                            if (scope.isPrincipal) {
                                indexMesh = _prop3d.points.children[i].indexPiece.level13d;
                            } else {
                                indexMesh = _prop3d.points.children[i].indexPiece.level23d;
                            }
                        }

                        nameMesh = "Mesh-" + idEntity + "-" + fileName + "-" + indexMesh;

                        console.log(nameMesh);

                        parentSensor1 = _scene.getMeshByName(globals3d.names.sensor.parent + idPoint);
                        parent = new Object(_scene.getMeshByName(nameMesh));
                        console.log(parent);

                        parentSensor1.parent = new Object(parent);
                        parentInfo = new Object(parent._boundingInfo);

                        parentSize.pos = Math.sqrt(Math.pow(parentInfo.maximum.y, 2), Math.pow(parentInfo.maximum.x, 2));
                        parentSize.neg = Math.sqrt(Math.pow(parentInfo.maximum.y, 2), Math.pow(parentInfo.minimum.x, 2));

                        //angle1 = _prop3d.points.children[i].info.angle;

                        if (globalsMenuEd.prop3d.gralInfo.view == 0) {
                            angle1 = _prop3d.points.children[i].info.angle * -1;
                        } else {
                            angle1 = _prop3d.points.children[i].info.angle;
                        }

                        axial = _prop3d.points.children[i].info.axial;
                        heightScale = _prop3d.points.children[i].info.heightScale;
                        paralel = _prop3d.points.children[i].info.paralel;
                        perpend = _prop3d.points.children[i].info.perpend;
                        posX = _prop3d.points.children[i].info.x;
                        posY = _prop3d.points.children[i].info.y;
                        posZ = _prop3d.points.children[i].info.z;
                        side = _prop3d.points.children[i].info.side;

                        totalHeight = (heightGral * heightScale + diameterGral + 3 * diameterGral / 2);
                      /*
                        for (var j = 0; j < _prop3d.points.children.length; j++) {
                            if (_prop3d.points.children[i].info.relatedIdPoint == _prop3d.points.children[j].idPoint) {
                                idSensor2 = globals3d.names.sensor.parent + _prop3d.points.children[j].idPoint;

                                parentSensor2 = _scene.getMeshByName(idSensor2);
                                parent = new Object(_scene.getMeshByName(nameMesh));
                                parentSensor2.parent = new Object(parent);
                                parentSensor2.parent = parent;
                                parentInfo = new Object(parent._boundingInfo);
                                angle2 = _prop3d.points.children[j].info.angle;
                            } else {
                                idSensor2 = null;
                            }
                        }*/

                        probe1 = _scene.getMeshByName(parentSensor1._children[0].name);
                        cone1 = _scene.getMeshByName(parentSensor1._children[1].name);
                        cone1.material = materialIndicator;
                        /*
                        if (idSensor2) {
                            probe2 = _scene.getMeshByName(parentSensor2._children[0].name);
                            cone2 = _scene.getMeshByName(parentSensor2._children[1].name);
                            probe2.parent.parent = parent
                        }*/
                    }
                }
               // break;

            }
            if (nameFileMesh) {
                if (axial) {
                    if (side === 0) {
                        parentSensor1.rotation.x = -1.5707963267948966;
                        parentSensor1.rotation.y = -Math.PI;
                        parentSensor1.rotation.z = 1.5707963267948966 * 2;
                        parentSensor1.position.z = -(totalHeight / 2) + parentInfo.minimum.z;

                        parentSensor1.position.y = (parentInfo.maximum.y) + posY;
                        parentSensor1.position.x = -posX;


                        if (angle1 === Math.PI / 2) {
                            probe1.rotation.x = (Math.PI - angle1);
                            probe1.position.z = (heightGral * heightScale / 2) + diameterGral / 2;
                            probe1.position.y = -(heightGral * heightScale / 2) + diameterGral / 2;
                        }
                        else {
                            probe1.rotation.x = -angle1;
                            probe1.position.z = 0;
                            probe1.position.y = 0;
                        }

                    }
                    else {
                        parentSensor1.rotation.x = 1.5707963267948966;
                        parentSensor1.position.z = (totalHeight / 2) + parentInfo.maximum.z + posZ;
                        //parentSensor.position.y = posY;
                        parentSensor1.position.x = posX;
                        if (angle1 === Math.PI / 2) {
                            probe1.rotation.x = -angle1;
                            probe1.position.z = -(heightGral * heightScale / 2) - diameterGral / 2;
                            probe1.position.y = -(heightGral * heightScale / 2) + diameterGral / 2;
                        }
                        else {
                            probe1.position.z = 0;
                            probe1.position.y = 0;
                        }
                    }
                }
                else {
                    parentSensor1.rotation.x = 0;
                    parentSensor1.rotation.z = angle1;
                    if (angle1 >= 0) {
                        parentSensor1.position.x = -(parentSize.neg) * Math.sin(angle1) - (totalHeight / 2) * (Math.sin(angle1)) + posX;

                        parentSensor1.position.y = (parentSize.neg) * Math.sin(Math.PI / 2 - angle1) + (totalHeight / 2) * (Math.sin(Math.PI / 2 - angle1)) + posY - parent.position.y;
                    }
                    else {
                        parentSensor1.position.x = -(parentSize.pos) * Math.sin(angle1) - (totalHeight / 2) * (Math.sin(angle1)) + posX - parent.position.x;

                        parentSensor1.position.y = (parentSize.pos) * Math.sin(Math.PI / 2 - angle1) + +(totalHeight / 2) * (Math.sin(Math.PI / 2 - angle1)) + posY - parent.position.y;
                    }
                    parentSensor1.position.z = posZ;

                    if (idSensor2) {
                        parentSensor2.rotation.z = angle2;
                        if (angle2 >= 0) {
                            parentSensor2.position.x = -(parentSize.neg) * Math.sin(angle2) - (totalHeight / 2) * (Math.sin(angle2)) + posX;

                            parentSensor2.position.y = (parentSize.neg) * Math.sin(Math.PI / 2 - angle2) + (totalHeight / 2) * (Math.sin(Math.PI / 2 - angle2)) + posY - parent.position.y;
                        }
                        else {
                            parentSensor2.position.x = -(parentSize.pos) * Math.sin(angle2) - (totalHeight / 2) * (Math.sin(angle2)) + posX - parent.position.x;

                            parentSensor2.position.y = (parentSize.pos) * Math.sin(Math.PI / 2 - angle2) + +(totalHeight / 2) * (Math.sin(Math.PI / 2 - angle2)) + posY - parent.position.y;
                        }
                        parentSensor2.position.z = posZ;
                    }
                }

                probe1.position.x = paralel + probe1.position.x;
                probe1.position.y = perpend + probe1.position.y;

                if (idSensor2) {
                    probe2.position.x = paralel + probe2.position.x;
                    probe2.position.y = perpend + probe2.position.y;
                }
            } 
            
        };

        _moveProbeParalelPerpend = function (idPoint, type, value) {

            var idPoint,  probe,  numAxis, orientation =  0, parentName, indexMesh, fileName;

            //idPoint = globalsMenuEd.actualSensorId[idEntity];

            for (var i = 0; i < _prop3d.points.children.length; i++) {
                if (_prop3d.points.children[i].idPoint == idPoint) {
                    parentName = _prop3d.points.children[i].info.parentName;
                    //indexMesh = _prop3d.points.children[i].indexPiece[idEntity];
                    if (_prop3d.points.children[i].indexPiece.hasOwnProperty(idEntity)) {
                        indexMesh = _prop3d.points.children[i].indexPiece[idEntity];
                    }
                    else {
                        if (scope.isPrincipal) {
                            indexMesh = _prop3d.points.children[i].indexPiece.level13d;
                        } else {
                            indexMesh = _prop3d.points.children[i].indexPiece.level23d;
                        }
                    }
                }
            }

            if (parentName) {
                fileName = parentName;

                for (var i = 0; i < _prop3d.asset.children.length; i++) {
                    if (_prop3d.asset.children[i].fileName == fileName) {
                        numAxis = _prop3d.asset.children[i].axisNum[indexMesh];
                    }
                }
                orientation = _prop3d.asset.axis[numAxis].prop.orientation;
            }
            
            probe = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint);

            switch (type) {
                case "paralel":
                    if (orientation == 0) {
                        if (probe.parent.position.x >= 0) {
                            probe.position.x = value;
                        } else {
                            probe.position.x = -value;
                        }
                    } else {
                        if (probe.parent.position.z >= 0) {
                            probe.position.z = value;
                        } else {
                            probe.position.z = -value;
                        }
                    }
                    break;
                case "perpend":
                    if (probe.parent.position.y >= 0) {
                        probe.position.y = value;
                    } else {
                        probe.position.y = -value;
                    }                  
                    break;
            }

        };

        _movePositionSensor = function (idPoint, posIni, axis, value) {

            var parentSensor;

            parentSensor = _scene.getMeshByName(globals3d.names.sensor.parent + idPoint);
            
            switch (axis) {
                case "x":
                    parentSensor.position.x = parentSensor.position.x - posIni;
                    parentSensor.position.x = parentSensor.position.x + value;
                    break;
                case "y":
                    parentSensor.position.y = parentSensor.position.y - posIni;
                    parentSensor.position.y = parentSensor.position.y + value;
                    break;
                case "z":
                    parentSensor.position.z = parentSensor.position.z - posIni;
                    parentSensor.position.z = parentSensor.position.z + value;
                    break;
            }
        };

        _changeHeightProbe = function (idPoint, value) {

            var probe, cone, height, diameter;

            height = _prop3d.points.height;
            diameter = _prop3d.points.diameter;

            probe = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint);
            cone = _scene.getMeshByName(globals3d.names.sensor.cone + idPoint);
            probe.scaling.y = value;

            //probe.position.y = value / 2;
            cone.position.y = -((height * value) / 2 + 3 * diameter / 4);

            _asignParentToSensor(idPoint);
        };

        _actualiceMeshesNames = function () {
            globalsMenuEd.meshNames[idEntity] = [];
            for (var i = 0; i < _scene.meshes.length; i++) {
                if (_scene.meshes[i].name.indexOf("Mesh") !== -1) {
                    globalsMenuEd.meshNames[idEntity].push(_scene.meshes[i].name);
                }
            }
            _meshNameArray = globalsMenuEd.meshNames[idEntity];
            _actualiceCBParts();
        };

        _reorderPieces = function (meshName) {
            var indexMesh, fileName, tempName, qtyMesh, meshByTemp, tempIndexMesh, partType;

            indexMesh = meshName.split("-")[3];
            indexMesh = parseInt(indexMesh);
            fileName = meshName.split("-")[2];

            for (var i = 0; i < _prop3d.asset.children.length; i++) {
                if (_prop3d.asset.children[i].fileName == fileName) {
                    //Elimino la posición de transform donde està
                    _prop3d.asset.children[i].transform.splice(indexMesh, 1);
                    _prop3d.asset.children[i].axisNum.splice(indexMesh, 1);
                    qtyMesh = _prop3d.asset.children[i].transform.length;
                    partType = _prop3d.asset.children[i].partType;
                }
            }

            tempName = "Mesh-" + idEntity + "-" + fileName + "-";

            treePiecesObj.removeNode($("#id-" + fileName + '-' + indexMesh));
            //$("#" + _tree.sensors.div + idEntity + "-" + fileName + '-' + indexMesh).remove();

            for (var i = indexMesh + 1; i <= qtyMesh; i++) {
                tempIndexMesh = i - 1;
                $("#divContSensorsEd3d" + idEntity + "-" + fileName + "-" + i).attr("id", "divContSensorsEd3d" + idEntity + "-" + fileName + "-" + tempIndexMesh);
                $("#divContSensorsEd3d" + idEntity + "-" + fileName + "-" + tempIndexMesh).text(fileName + "-" + tempIndexMesh);
                meshByTemp = _scene.getMeshByName(tempName + i);
                if (meshByTemp) {
                    meshByTemp.name = tempName + tempIndexMesh;
                    meshByTemp.id = 'id-' + tempName + tempIndexMesh;
                    globalsMenuEd.actualMeshName[idEntity] = tempName + tempIndexMesh;

                    console.log(tempName + tempIndexMesh);
                }
            }
            /*
            var johnRemoved = _prop3d.asset.children.filter(function (el) {
                return el.fileName !== fileName;
            });
            JSON.stringify(johnRemoved, null, ' ');*/
            
            for (var i = 0; i < _prop3d.asset.children.length; i++) {
                if (_prop3d.asset.children[i].fileName == fileName && _prop3d.asset.children[i].transform.length == 0) {
                    _prop3d.asset.children.splice(i, 1);
                    for (var j = 0; j < _fileNameArray.length; j++) {
                        if (_fileNameArray[j] == fileName) {
                            _fileNameArray.splice(j, 1);
                        }
                    }
                    break;
                }
            }

            _actualiceMeshesNames();
        };

        _asignPropertiesLoadedMeshes = function (mesh, fileName, typeMesh) {

            var newMesh, pos, rot, sca, color, alpha;

            for (var i = 0; i < globalsMenuEd.prop3d.asset.children.length; i++) {
                if (fileName === globalsMenuEd.prop3d.asset.children[i].fileName) {

                    color = globalsMenuEd.prop3d.asset.children[i].color;

                    if (typeMesh === "housing") {
                        alpha = 0.3;
                    } else {
                        alpha = 1;
                    }

                    for (var j = 0; j < globalsMenuEd.prop3d.asset.children[i].transform.length; j++) {

                        newMesh = new Object(mesh.clone("Mesh-" + idEntity + "-" + fileName + "-" + j, newMesh));
                        newMesh.id = "id-Mesh-" + idEntity + "-" + fileName + "-" + j;
                        newMesh.uniqueId = _findMaxUniqueId() + 1;

                        newMesh.material = new BABYLON.StandardMaterial("mat-Mesh-" + idEntity + "-" + fileName + "-" + j, _scene);
                        newMesh.material.alpha = alpha;
                        newMesh.material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                        newMesh.material.freeze();

                        pos = new Object(globalsMenuEd.prop3d.asset.children[i].transform[j].pos);
                        rot = new Object(globalsMenuEd.prop3d.asset.children[i].transform[j].rot);
                        sca = new Object(globalsMenuEd.prop3d.asset.children[i].transform[j].sca);

                        newMesh.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
                        newMesh.rotation = new BABYLON.Vector3(rot.x, rot.y, rot.z);
                        newMesh.scaling = new BABYLON.Vector3(sca.x, sca.y, sca.z);                       
                        

                        if (typeMesh === 'moving') {
                            if (globalsMenuEd.prop3d.asset.children[i].axisNum.length) {
                                newMesh.parent = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + globalsMenuEd.prop3d.asset.children[i].axisNum[j]);
                            }
                            else {
                                newMesh.parent = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + globalsMenuEd.prop3d.asset.children[i].axisNum);
                            }
                        }
                        else {
                            if (globalsMenuEd.prop3d.asset.children[i].axisNum.length) {
                                newMesh.parent = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-" + globalsMenuEd.prop3d.asset.children[i].axisNum[j]);
                            } else {
                                newMesh.parent = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-" + globalsMenuEd.prop3d.asset.children[i].axisNum);
                            }
                        }

                        scope.treeEd3d.piecesData.push({ id: "id" + '-' + fileName + '-' + j, name: fileName + '-' + j, hasChild: false, pid: "id" + typeMesh });

                        treePiecesObj.model.fields.dataSource = scope.treeEd3d.piecesData;
                        treePiecesObj.refresh();
                        /*
                        switch (typeMesh) {
                            case "moving":
                                $("#Moving-" + _tree.pieces.firstLevel + idEntity).append('<div id="' + _tree.sensors.div + idEntity + "-" + fileName + '-' + j + '"    class="class' + _tree.pieces.secondLevel + '">' + fileName + '-' + j + '</div>');

                                alpha = 1;
                                break;
                            case "statics":
                                $("#Statics-" + _tree.pieces.firstLevel + idEntity).append('<div id="' + _tree.sensors.div + idEntity + "-" + fileName + '-' + j + '" class="class' + _tree.pieces.secondLevel + '">' + fileName + '-' + j + '</div>');
                                alpha = 1;
                                break;
                            case "housing":
                                $("#Housing-" + _tree.pieces.firstLevel + idEntity).append('<div id="' + _tree.sensors.div + idEntity + "-" + fileName + '-' + j + '" class="class' + _tree.pieces.secondLevel + '">' + fileName + '-' + j + '</div>');
                                alpha = 0.3;
                                break;
                            case "location": break;
                        }

                        $("#" + _tree.sensors.div + idEntity + "-" + fileName + '-' + j).click(function (args) {
                            _selectTreePart(args.target.id);
                        });
                        */

                    }

                }
            }

            _actualiceMeshesNames();
            _loadedFiles++;
            mesh.dispose();


            if (_filesToLoad === _loadedFiles) {
                _loadSensorsMeshes();
            }

        };

        _asignPropertiesMesh = function (mesh, fileName, typeMesh, cloned) {

            var indexMesh = 0, meshes, alpha, color, numMesh;
            
            if (!cloned) {
                indexMesh = 0;
            }
            else {
                for(var i = 0; i < _prop3d.asset.children.length; i++){
                    if( _prop3d.asset.children[i].fileName == fileName){
                        indexMesh = _prop3d.asset.children[i].transform.length - 1;
                    }
                }
            }
            
            switch (typeMesh) {
                case "moving":
                case "statics":
                    alpha = 1;
                    break;
                case "housing":
                    alpha = 0.3;
                    break;
                case "location": break;                
            }
            /*
            $("#" + _tree.sensors.div + idEntity + "-" + fileName + '-' + indexMesh).click(function (args) {
                _selectTreePart(args.target.id);
            });
            */

            scope.treeEd3d.piecesData.push({ id: "id" + '-' + fileName + '-' + indexMesh, name: fileName + '-' + indexMesh, hasChild: false, pid: "id" + typeMesh });


            treePiecesObj.model.fields.dataSource = scope.treeEd3d.piecesData;
            treePiecesObj.refresh();


            if (!cloned) {

                _actualiceMeshesNames();

                _prop3d.asset.children.push({
                    axisNum: [0],
                    partType: typeMesh,
                    fileName: fileName,
                    color: { r: 0.5, g: 0.5, b: 0.5 },
                    transform: [{ pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 }, sca: { x: 1, y: 1, z: 1 } }]
                });
                indexMesh = 0;
                color = { r: 0.5, g: 0.5, b: 0.5 };

                _contPieces = $("#" + _tree.pieces.div + idEntity);

                globalsMenuEd.actualMeshName[idEntity] = mesh.name;

                mesh.uniqueId = _findMaxUniqueId() + 1;

                mesh.material = new BABYLON.StandardMaterial("mat-" + mesh.name, _scene);
                mesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                mesh.material.alpha = alpha;

                for (var i = 0; i < globalsMenuEd.meshNames[idEntity].length; i++) {
                    meshes = _scene.getMeshByName(globalsMenuEd.meshNames[idEntity][i]);
                    meshes.renderOutline = false;
                }

                mesh.renderOutline = true;
                mesh.outlineColor = BABYLON.Color3.Blue();

                if (_constant.pieces.move) {
                    scope.moveMesh();
                }
                else if (_constant.pieces.rotate) {
                    scope.rotateMesh();
                }
                else if (_constant.pieces.scale) {
                    scope.scaleMesh();
                }

            } else {
                _actualiceMeshesNames();
            }
            
        };

        this.selectTreePart = function (idTree) {

            var selPart, idChild, moving, statics, housing, nameMesh, indexMesh, fileName, mesh, meshes;
            /*selPart = $("#" + idTree);
            fileName = idTree.split("-")[1];
            indexMesh = idTree.split("-")[2];*/
            //if (idTree.indexOf("-") != -1 && !globalsMenuEd.flagSelectedEvent) {
            if (idTree.indexOf("-") != -1) {
                fileName = idTree.split("-")[1];
                indexMesh = idTree.split("-")[2];

                console.log(idTree);

                nameMesh = "Mesh-" + idEntity + "-" + fileName + "-" + indexMesh;
                console.log(nameMesh);
                mesh = _scene.getMeshByName(nameMesh);
                globalsMenuEd.actualMeshName[idEntity] = mesh.name;

                _selectMeshFcn();
            }
            
        };

        _loadSTL = function (fileNameExt, typeMesh, loaded) {
            var mesh, repFileName, newMesh, repMeshName, maxIndexMesh = 0, indexMesh, color, pos, rot, sca, info, promSize, fileName, ext = "";

            if (fileNameExt.indexOf(".") != -1) {
                fileName = fileNameExt.split(".")[0];
                ext = "";
            } else {
                fileName = fileNameExt;
                ext = ".stl";
            }
      

            var repFileName = _fileNameArray.indexOf(fileName);

            info = {
                max: 0,
                min: 0
            };

            if (scope.isFromLibrary) {
                _urlSTL = scope.urlLibrary;
            }

            if (repFileName === -1) {
               
               // BABYLON.SceneLoader.ImportMesh("ascii", _urlSTL, fileName + ".stl", _scene, function () {
                BABYLON.SceneLoader.ImportMesh(fileName, _urlSTL, fileNameExt + ext, _scene, function () {
                    mesh = _scene.getMeshByName(fileName);
                    mesh.name = 'Mesh-' + idEntity + "-" + fileName + "-0";
                    mesh.id = "id-Mesh-" + idEntity + "-" + fileName + "-0";

                    info.max = new Object(mesh._boundingInfo.boundingBox.maximumWorld);
                    info.min = new Object(mesh._boundingInfo.boundingBox.minimumWorld);

                    promSize = (info.max.x - info.min.x + info.max.y - info.min.y + info.max.z - info.min.z) / 3;

                    mesh.outlineWidth = promSize / 30;
                    mesh.outlineColor = new BABYLON.Color3(0, 0, 1);

                    if (mesh.isReady()) {
                        if (loaded) {
                            _asignPropertiesLoadedMeshes(mesh, fileName, typeMesh);
                        } else {
                            _asignPropertiesMesh(mesh, fileName, typeMesh, false);
                        }
                    }

                });
                _fileNameArray.push(fileName);
                _meshNameArray.push('Mesh-' + idEntity + "-" + fileName + "-0");
            }
            else {             
                //mesh = _scene.getMeshByName('Mesh-' + fileName + "-" + idEntity + "-0");
                //newMesh = new Object(mesh.clone(globals3d.names.plots[type].canvas + idPoint + wId, plot));
                //_meshNameArray
                maxIndexMesh = 0;
                
                maxIndexMesh = _findMaxIndexMeshes(fileName, idEntity);

                mesh = _scene.getMeshByName('Mesh-' + idEntity + "-" + fileName + "-0");
                newMesh = new Object(mesh.clone('Mesh-' + idEntity + "-" + fileName + "-" + maxIndexMesh, newMesh));
                newMesh.id = 'id-Mesh-' + idEntity + "-" + fileName + "-" + maxIndexMesh;

                info.max = new Object(mesh._boundingInfo.boundingBox.maximumWorld);
                info.min = new Object(mesh._boundingInfo.boundingBox.minimumWorld);

                promSize = (info.max.x - info.min.x + info.max.y - info.min.y + info.max.z - info.min.z) / 3;

                mesh.outlineWidth = promSize / 30;

                for (var i = 0; i < _prop3d.asset.children.length; i++) {
                    if (_prop3d.asset.children[i].fileName == fileName) {
                        color = _prop3d.asset.children[i].color;
                        pos = mesh.position;
                        rot = mesh.rotation;
                        sca = mesh.scaling;

                        _prop3d.asset.children[i].transform.push({
                            pos: { x: pos.x, y: pos.y, z: pos.z },
                            rot: { x: rot.x, y: rot.y, z: rot.z },
                            sca: { x: sca.x, y: sca.y, z: sca.z }
                        });

                        _prop3d.asset.children[i].axisNum.push(0);

                        mesh.material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                        _asignPropertiesMesh(mesh, fileName, typeMesh, true);
                    }
                }
            }
            
        };

        _findMaxIndexMeshes = function (fileName, idEntity) {
            var maxIndexMesh = 0, indexMesh;

            for (var i = 0; i < _meshNameArray.length; i++) {
                if (_meshNameArray[i].indexOf('Mesh-' + idEntity + "-" + fileName) != -1) {
                    indexMesh = parseInt(_meshNameArray[i].split("-")[3]) + 1;
                    if (indexMesh > maxIndexMesh) {
                        maxIndexMesh = indexMesh;
                    }
                }
            }
            return maxIndexMesh;
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

        _resetUI = function () {

            var consta = {
                axis: {
                    axisRelVel: 1,
                    axisSel: 1,
                    cCW: false,
                    cW: true,
                    hor: true,
                    longAxis: 1000,
                    qtyAxis: 1,
                    vel: 1,
                    ver: false
                },
                pieces: {
                    axisSelPiece: 1,
                    color: "#000000",
                    move: true,
                    rotate: false,
                    scale: false,
                    selectedMesh: null,
                    x: 0,
                    y: 0,
                    z: 0
                },
                sensors: {
                    angle: 0,
                    axial: false,
                    height: 1,
                    heightGral: 20,
                    paralel: 0,
                    perpend: 0,
                    posX: 0,
                    posY: 0,
                    posZ: 0,
                    radiusGral: 5,
                    side: 0
                },
                axisPosX: 0,
                axisPosY: 0,
                axisPosZ: 0,
                insert: {
                    location: false,
                    moving: false,
                    statics: false,
                    scaling: false,
                }
            };

            $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z).val(0);

            $("#" + _gral + _Tier2.gral + _Tier2.piece.changeColor).val("#000000");

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis).val(1000);

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.X).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Y).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Z).val(0);

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.vel).val(1);

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.gralRadius).val(5);
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.gralHeight).val(20);

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points).val("");
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.relPart).val("");

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.height).val(1);
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.perpend).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.paralel).val(0);

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.X).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.Y).val(0);
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.Z).val(0);

            globalsMenuEd.constant[idEntity] = new Object(consta);
            globalsMenuEd.meshNames[idEntity] = [];
            _fileNameArray = [];
            
        };



    };

    return FunctionsEd3d;
})();