/*
 * EventsViewer3d.js
 * Eventos de editor para contenido 3D
 */

var Events3d = {};

Events3d = (function () {
   // "use strict";

    /*
     * Constructor.
     */
    Events3d = function (id3d, canvasType, wId) {

        var _selectedMeshName,
            _scene,
            _engine,
            _canvas,
            _contCanvas,
            _camera,
            _numSpec,
            _longpress = false,
            _presstimer = null,
            _longtarget = null,
            _evaluateIdPoint,
            _dataListBox = $("#measurementPoints").data("ejListBox"),
            _indexListBox,
            _id3dW = id3d + wId,
            _selectMeshOutline,
            _selectCursor,
            _renderOutlineMeshesOut,
            _selectCanvas;

        var scope = this;

        this.waterfall = null;

        //this.meshNameSelected = "";

        _selectCanvas = function () {
            switch (canvasType) {
                case "Editor":
                    _scene = editor3d.scene[_id3dW];
                    _engine = editor3d.engine[_id3dW];
                    _canvas = editor3d.canvas[_id3dW];
                    _contCanvas = editor3d.containerCanvas[_id3dW];
                    _camera = editor3d.scene[_id3dW].activeCamera;
                break;
                case "Viewer":
                    _scene = viewer3d.scene[_id3dW];
                    _engine = viewer3d.engine[_id3dW];
                    _canvas = viewer3d.canvas[_id3dW];
                    _contCanvas = viewer3d.containerCanvas[_id3dW];
                    _camera = viewer3d.scene[_id3dW].activeCamera;
                break;
                case "WaterfallRPM":
                case "Waterfall":
                    _scene = cascade3d.scene[_id3dW];
                    _engine = cascade3d.engine[_id3dW];
                    _canvas = cascade3d.canvas[_id3dW];
                    _contCanvas = cascade3d.containerCanvas[_id3dW];
                    _camera = cascade3d.scene[_id3dW].activeCamera;
                    break;
                case "FullSpecWaterfall":
                case "FullSpecWaterfallRPM":
                    _scene = fullSpecCascade3d.scene[_id3dW];
                    _engine = fullSpecCascade3d.engine[_id3dW];
                    _canvas = fullSpecCascade3d.canvas[_id3dW];
                    _contCanvas = fullSpecCascade3d.containerCanvas[_id3dW];
                    _camera = fullSpecCascade3d.scene[_id3dW].activeCamera;
                    break;
            }
        }();

        _evaluateIdPoint = function (selectedMesh, e) {

            var posLeft, posTop, posMouseLeft, posMouseTop;

            posLeft = $("#" + _canvas.id).offset().left;
            posTop = $("#" + _canvas.id).offset().top;
            posMouseLeft = e.clientX;
            posMouseTop = e.clientY;

            if (canvasType !== "Waterfall") {

                for (var h = 0; h < _dataListBox.target.children.length; h++) {
                    if (selectedMesh.indexOf(_dataListBox.target.children[h].id) !== -1) {
                        $("#measurementPoints").ejListBox("selectItemByIndex", h);
                    }
                }

                for (var i = 0; i < nodes[_id3dW].Properties3d.points.children.length; i++) {
                    if (selectedMesh.indexOf(nodes[_id3dW].Properties3d.points.children[i].idPoint) !== -1) {
                        $("#ctxtMenu-Viewer3d-" + _id3dW).show();
                        $("#ctxtMenu-Viewer3d-" + _id3dW).css({
                            "top": posMouseTop - posTop + "px",
                            "left": posMouseLeft - posLeft + "px",
                        });
                        $("#Tooltip-CttxtMenuExt-" + _id3dW).css({
                            "top": posMouseTop - posTop + 35 + "px",
                            "left": posMouseLeft - posLeft + "px"
                        });
                    }
                }
            }
        };

        this.onKeyDown = function (e) {
            //_selectCursor(e);
            var frequencyParts = ["cBFreq-", "iTFreq-", "slFreq-"];
            var watType, checked = false;

            console.log(scope.waterfall.freqChoosed);
            if (e.keyCode == 65) { //izquierda
                if (canvasType === "Waterfall" || canvasType === "WaterfallRPM") {
                    if (scope.waterfall.xCoordinateUnit.Text == "Cpm") {
                        if (scope.waterfall.freqChoosed  > parseInt($("#" + frequencyParts[1] + _id3dW).attr("min"))) {
                            scope.waterfall.freqChoosed -= 60;
                        } else {
                            scope.waterfall.freqChoosed = 60;
                        }
                    } else {
                        if (scope.waterfall.freqChoosed > 1) {
                            scope.waterfall.freqChoosed--;
                        } else {
                            scope.waterfall.freqChoosed = 1;
                        }
                    }
                } else if (canvasType === "FullSpecWaterfall" || canvasType === "FullSpecWaterfallRPM") {
                    

                    if (scope.waterfall.xCoordinateUnit.Text == "Cpm") {
                        if (scope.waterfall.freqChoosed  > parseInt($("#" + frequencyParts[1] + _id3dW).attr("min"))) {
                            scope.waterfall.freqChoosed -= 60;
                        } else {
                            scope.waterfall.freqChoosed = parseInt(($("#" + frequencyParts[1] + _id3dW).attr("min")));
                        }
                    } else {
                        if (scope.waterfall.freqChoosed > parseInt($("#" + frequencyParts[1] + _id3dW).attr("min"))) {
                            scope.waterfall.freqChoosed--;
                        } else {
                            scope.waterfall.freqChoosed = 1;
                        }
                    }
                }
                
                
            } else if (e.keyCode == 68) {//derecha
                if (scope.waterfall.xCoordinateUnit.Text == "Cpm") {
                    if (scope.waterfall.freqChoosed  < parseInt($("#" + frequencyParts[1] + _id3dW).attr("max"))) {
                        scope.waterfall.freqChoosed += 60;
                    } else {
                        scope.waterfall.freqChoosed = parseInt(($("#" + frequencyParts[1] + _id3dW).attr("max") - 60));
                    }
                } else {
                    if (scope.waterfall.freqChoosed < parseInt($("#" + frequencyParts[1] + _id3dW).attr("max"))) {
                        scope.waterfall.freqChoosed++;
                    } else {
                        scope.waterfall.freqChoosed = parseInt($("#" + frequencyParts[1] + _id3dW).attr("max")) - 1;
                    }
                }
                    
                
            } else if (e.keyCode == 87) {//arriba
                if (canvasType === "Waterfall" || canvasType === "WaterfallRPM") {
                    if (cascade3d.vbles[_id3dW].numSpec < scope.waterfall.bufferSpectrum.length - 1) {
                        cascade3d.vbles[_id3dW].numSpec++;
                    } else {
                        cascade3d.vbles[_id3dW].numSpec = scope.waterfall.bufferSpectrum.length - 2;
                    }
                    cascade3d.vbles[_id3dW].loadGralInfo();

                    if (watConfig.type == "espectrograma") {
                        cascade3d.vbles[_id3dW].locateCursor();
                    } else {
                        for (var i = 0; i < cascade3d.vbles[_id3dW].armonicsInfo.length; i++) {
                            _scene.getMeshByName("line-" + i).color = new BABYLON.Color3(0, 0.2, 1);
                        }
                        _scene.getMeshByName("line-" + cascade3d.vbles[_id3dW].numSpec).color = new BABYLON.Color3(1, 0.2, 0.2);
                    }

                } else if (canvasType === "FullSpecWaterfall" || canvasType === "FullSpecWaterfallRPM") {
                    if (fullSpecCascade3d.vbles[_id3dW].numSpec < scope.waterfall.bufferSpectrum.length - 1) {
                        fullSpecCascade3d.vbles[_id3dW].numSpec++;
                    } else {
                        fullSpecCascade3d.vbles[_id3dW].numSpec = scope.waterfall.bufferSpectrum.length - 2;
                    }
                    fullSpecCascade3d.vbles[_id3dW].loadGralInfo();
                    
                    if (watConfig.type == "espectrograma") {
                        fullSpecCascade3d.vbles[_id3dW].locateCursor();
                    } else {
                        for (var i = 0; i < fullSpecCascade3d.vbles[_id3dW].armonicsInfo.length; i++) {
                            _scene.getMeshByName("line-" + i).color = new BABYLON.Color3(0, 0.2, 1);
                        }
                        _scene.getMeshByName("line-" + fullSpecCascade3d.vbles[_id3dW].numSpec).color = new BABYLON.Color3(1, 0.2, 0.2);
                    }
                }
            } else if (e.keyCode == 83) {//abajo
                if (canvasType === "Waterfall" || canvasType === "WaterfallRPM") {
                    if (cascade3d.vbles[_id3dW].numSpec > 0) {
                        cascade3d.vbles[_id3dW].numSpec--;
                    } else {
                        cascade3d.vbles[_id3dW].numSpec = 1;
                    }
                    cascade3d.vbles[_id3dW].loadGralInfo();

                    if (watConfig.type == "espectrograma") {
                        cascade3d.vbles[_id3dW].locateCursor();
                    } else {
                        for (var i = 0; i < cascade3d.vbles[_id3dW].armonicsInfo.length; i++) {
                            _scene.getMeshByName("line-" + i).color = new BABYLON.Color3(0, 0.2, 1);
                        }
                        _scene.getMeshByName("line-" + cascade3d.vbles[_id3dW].numSpec).color = new BABYLON.Color3(1, 0.2, 0.2);
                    }

                    
                } else if (canvasType === "FullSpecWaterfall" || canvasType === "FullSpecWaterfallRPM") {
                    if (fullSpecCascade3d.vbles[_id3dW].numSpec > 0) {
                        fullSpecCascade3d.vbles[_id3dW].numSpec--;
                    } else {
                        fullSpecCascade3d.vbles[_id3dW].numSpec = 1;
                    }
                    fullSpecCascade3d.vbles[_id3dW].loadGralInfo();

                    if (watConfig.type == "espectrograma") {
                        fullSpecCascade3d.vbles[_id3dW].locateCursor();
                    } else {
                        for (var i = 0; i < fullSpecCascade3d.vbles[_id3dW].armonicsInfo.length; i++) {
                            _scene.getMeshByName("line-" + i).color = new BABYLON.Color3(0, 0.2, 1);
                        }
                        _scene.getMeshByName("line-" + fullSpecCascade3d.vbles[_id3dW].numSpec).color = new BABYLON.Color3(1, 0.2, 0.2);
                    }

                    
                }

            }
            if (e.keyCode == 65 || e.keyCode == 68) { //izquierda
                if ($("#" + frequencyParts[0] + _id3dW).val() == "on") {
                    checked = true;
                } else {
                    checked = false;
                }
                console.log(scope.waterfall.freqChoosed);
                $("#" + frequencyParts[1] + _id3dW).val(scope.waterfall.freqChoosed);
                $("#" + frequencyParts[2] + _id3dW).val(scope.waterfall.freqChoosed);
                scope.waterfall.chooseFrecuency(checked);
            } 


            /*
            cascade3d.vbles[_id3dW].numSpec = _numSpec;
            cascade3d.vbles[_id3dW].loadGralInfo();
            cascade3d.vbles[_id3dW].locateCursor();*/
            //cascade3d.vbles[_id3dW].loadGralInfo();
        };

        this.onMouseMove = function (e) {
            e.preventDefault();

            var numSpec = 0;
            var lastMeshSelected;

            var pickInfo = _scene.pick(_scene.pointerX, _scene.pointerY, null, null, null);

            if (pickInfo.hit) {

                _selectedMeshName = pickInfo.pickedMesh.name;
                vblesEventsEd.click.current.meshName = _selectedMeshName;
                scope.meshNameSelected = _selectedMeshName;

                var numSpect;

                if (canvasType === "Waterfall" || canvasType === "WaterfallRPM") {

                    if (_selectedMeshName.split("-")[0] === "SPS" || _selectedMeshName.split("-")[0] === "cubeBase" || _selectedMeshName === "ribbonSpec") {
                        if (_selectedMeshName.split("-")[0] === "SPS") {
                            _numSpec = _selectedMeshName.split("-")[2];
                        }
                        else if (_selectedMeshName.split("-")[0] === "cubeBase") {
                            _numSpec = _selectedMeshName.split("-")[1];
                        }

                        cascade3d.vbles[_id3dW].numSpec = _numSpec;
                        cascade3d.vbles[_id3dW].loadGralInfo();
                        cascade3d.vbles[_id3dW].locateCursor();
                        lastMeshSelected = pickInfo.pickedMesh;
                    }
                    else if (_selectedMeshName.split("-")[0] === "line") {
                        _numSpec = _selectedMeshName.split("-")[1];
                        cascade3d.vbles[_id3dW].numSpec = _numSpec;
                        cascade3d.vbles[_id3dW].loadGralInfo();
                    }
                    else if (_selectedMeshName.split("-")[0] === "spec") {
                        _numSpec = _selectedMeshName.split("-")[2];
                        cascade3d.vbles[_id3dW].numSpec = _numSpec;
                        cascade3d.vbles[_id3dW].loadGralInfo();
                    }

                    if (_selectedMeshName.split("-")[0] === "spec" || _selectedMeshName.split("-")[0] === "line") {
                        //cascade3d.vbles[id3d].armonicsInfo.length
                        for (var i = 0; i < cascade3d.vbles[_id3dW].armonicsInfo.length; i++) {
                            _scene.getMeshByName("line-" + i).color = new BABYLON.Color3(0, 0.2, 1);
                        }
                        _scene.getMeshByName("line-" + _numSpec).color = new BABYLON.Color3(1, 0.2, 0.2);
                    }
                }
                else if (canvasType === "FullSpecWaterfall" || canvasType === "FullSpecWaterfallRPM") {
                    if (_selectedMeshName.split("-")[0] === "SPS" || _selectedMeshName.split("-")[0] === "cubeBase" || _selectedMeshName === "ribbonSpec") {
                        if (_selectedMeshName.split("-")[0] === "SPS") {
                            _numSpec = _selectedMeshName.split("-")[2];
                        }
                        else if (_selectedMeshName.split("-")[0] === "cubeBase") {
                            _numSpec = _selectedMeshName.split("-")[1];
                        }

                        fullSpecCascade3d.vbles[_id3dW].numSpec = _numSpec;
                        fullSpecCascade3d.vbles[_id3dW].loadGralInfo();

                        fullSpecCascade3d.vbles[_id3dW].locateCursor();

                        lastMeshSelected = pickInfo.pickedMesh;
                    }
                    else if (_selectedMeshName.split("-")[0] === "line") {
                        _numSpec = _selectedMeshName.split("-")[1];
                        fullSpecCascade3d.vbles[_id3dW].numSpec = _numSpec;
                        fullSpecCascade3d.vbles[_id3dW].loadGralInfo();
                    }
                    else if (_selectedMeshName.split("-")[0] === "spec") {
                        _numSpec = _selectedMeshName.split("-")[2];
                        fullSpecCascade3d.vbles[_id3dW].numSpec = _numSpec;
                        fullSpecCascade3d.vbles[_id3dW].loadGralInfo();
                    }

                    if (_selectedMeshName.split("-")[0] === "spec" || _selectedMeshName.split("-")[0] === "line") {
                        //cascade3d.vbles[id3d].armonicsInfo.length
                        for (var i = 0; i < fullSpecCascade3d.vbles[_id3dW].armonicsInfo.length; i++) {
                            _scene.getMeshByName("line-" + i).color = new BABYLON.Color3(0, 0.2, 1);
                        }
                        _scene.getMeshByName("line-" + _numSpec).color = new BABYLON.Color3(1, 0.2, 0.2);
                    }
                }
            }
        };

        this.onMouseDown = function (e) {
            e.preventDefault();

            if (canvasType == "Editor") {
                var fcnSelectMesh = globalsMenuEd.selectMesh[idEntity];
            }

            var pickInfo = _scene.pick(_scene.pointerX, _scene.pointerY, null, null, null);
            if (pickInfo.hit) {

                _selectedMeshName = pickInfo.pickedMesh.name;
                vblesEventsEd.click.current.meshName = _selectedMeshName;
                scope.meshNameSelected = _selectedMeshName;

                if (canvasType == "Editor") {
                    _renderOutlineMeshesOut();
                    _selectMeshOutline(true);
                    console.log(_selectedMeshName);
                    globalsMenuEd.actualMeshName[idEntity] = pickInfo.pickedMesh.name;
                    if (_selectedMeshName.indexOf("Mesh-") !== -1) {
                        globalsMenuEd.flagSelectedEvent = true;
                        fcnSelectMesh();
                        globalsMenuEd.flagSelectedEvent = false;
                    }
                    else if (_selectedMeshName.indexOf("SensorProbe-") !== -1) {
                        
                    }
                }
            }
            else {
                if (canvasType == "Editor") {
                    _selectMeshOutline(false);
                }
            }
            $("#ctxtMenu-Viewer3d-" + _id3dW).hide();

        };

        this.cancel = function (e) {
            e.preventDefault();
            if (_presstimer !== null) {
                clearTimeout(_presstimer);
                _presstimer = null;
            }

            this.classList.remove("longpress");
        };

        this.click = function (e) {
            e.preventDefault();
            if (_presstimer !== null) {
                clearTimeout(_presstimer);
                _presstimer = null;
            }

            this.classList.remove("longpress");

            if (_longpress) {
                return false;
            }
            vblesEventsEd.click.canvas = _id3dW;
            //treeObj.selectNode($("#" + vblesEventsEd.click.canvas));
            //alert("press");
           
        };

        this.start = function (e) {
            e.preventDefault();

            var posLeft, posTop, posMouseLeft, posMouseTop;

            posLeft = $("#" + _canvas.id).offset().left;
            posTop = $("#" + _canvas.id).offset().top;
            posMouseLeft = e.clientX;
            posMouseTop = e.clientY;

            if (e.type === "click" && e.button !== 0) {
                return;
            }

            _longpress = false;

            this.classList.add("longpress");

            _presstimer = setTimeout(function () {
                //alert("long click");
                var pickInfo = _scene.pick(_scene.pointerX, _scene.pointerY, null, null, null);
                if (pickInfo.hit) {
                    _selectedMeshName = pickInfo.pickedMesh.name;
                    vblesEventsEd.longClick.current.meshName = _selectedMeshName;
                    _evaluateIdPoint(_selectedMeshName, e);
                }
                //if (canvasType === "Waterfall") {
                //    $("#ctxtMenu-Waterfall3d-" + id3d).show();
                //    $("#ctxtMenu-Waterfall3d-" + id3d).css({
                //        "top": posMouseTop - posTop + "px",
                //        "left": posMouseLeft - posLeft + "px",
                //    });
                //    $("#Tooltip-CttxtMenuExtWaterfall-" + id3d).css({
                //        "top": posMouseTop - posTop + 35 + "px",
                //        "left": posMouseLeft - posLeft + "px"
                //    });
                //}
                _longpress = true;
            }, 900);

            return false;
        };

        this.onDblClick = function (e) {
            e.preventDefault();

            var pickInfo = _scene.pick(_scene.pointerX, _scene.pointerY, null, null, null);
            if (pickInfo.hit) {
                _selectedMeshName = pickInfo.pickedMesh.name;
                vblesEventsEd.click.current.meshName = _selectedMeshName;
            }
        };

        this.onResize = function (e) {
            e.preventDefault();

            if (_scene.activeCamera.mode) {
                var ratio = _contCanvas.offsetWidth / _contCanvas.offsetHeight;
                var zoom = _scene.activeCamera.orthoTop;
                var newWidth = zoom * ratio;
                _scene.activeCamera.orthoLeft = -Math.abs(newWidth);
                _scene.activeCamera.orthoRight = newWidth;
                _scene.activeCamera.orthoBottom = -Math.abs(zoom);
            }

            _engine.resize();
        };

        var _flag = 0;

        this.zoomOrtographicViewer = function (args) {
            args.preventDefault();
            var ar = args.wheelDeltaY / 120;
            var vel = 0.2;

            if (_flag === 0) {

                ar = args.deltaY * _scene.activeCamera.radius / 120;
                /*
                _scene.activeCamera.orthoBottom = -350;
                _scene.activeCamera.orthoLeft = -350 * _engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = 350;
                _scene.activeCamera.orthoRight = 350 * _engine.getAspectRatio(_scene.activeCamera);*/

                _scene.activeCamera.orthoBottom = -_scene.activeCamera.radius / 4;
                _scene.activeCamera.orthoLeft = -_scene.activeCamera.radius / 4 * _engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = _scene.activeCamera.radius / 4;
                _scene.activeCamera.orthoRight = _scene.activeCamera.radius / 4 * _engine.getAspectRatio(_scene.activeCamera);

                _flag = 1;
            }
            else {

                ar = (args.wheelDeltaY / 120) * _scene.activeCamera.radius * vel;
            }


            if (_scene.activeCamera.orthoBottom <= -460.8) {
                _scene.activeCamera.orthoBottom -= ar * vel;
                _scene.activeCamera.orthoLeft -= ar * _engine.getAspectRatio(_scene.activeCamera) * vel;
                _scene.activeCamera.orthoTop += ar * vel;
                _scene.activeCamera.orthoRight += ar * _engine.getAspectRatio(_scene.activeCamera) * vel;
            }
            else {
                _scene.activeCamera.orthoBottom = -460.8;
                _scene.activeCamera.orthoLeft = -460.8 * _engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = 460.8;
                _scene.activeCamera.orthoRight = 460.8 * _engine.getAspectRatio(_scene.activeCamera);
            }

        };

        this.zoomOrtographicCascade = function (args) {
            args.preventDefault();
            var ar = args.wheelDeltaY / 120;
            var vel = 0.02;

            if (_flag === 0) {

                ar = args.deltaY * _scene.activeCamera.radius / 120;
                /*
                _scene.activeCamera.orthoBottom = -350;
                _scene.activeCamera.orthoLeft = -350 * _engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = 350;
                _scene.activeCamera.orthoRight = 350 * _engine.getAspectRatio(_scene.activeCamera);*/

                _scene.activeCamera.orthoBottom = -_scene.activeCamera.radius / 25;
                _scene.activeCamera.orthoLeft = -_scene.activeCamera.radius / 25 * _engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = _scene.activeCamera.radius / 25;
                _scene.activeCamera.orthoRight = _scene.activeCamera.radius / 25 * _engine.getAspectRatio(_scene.activeCamera);

                _flag = 1;
            }
            else {

                ar = (args.wheelDeltaY / 120) * _scene.activeCamera.radius * vel;
            }


            if (_scene.activeCamera.orthoBottom <= -46.8) {
                _scene.activeCamera.orthoBottom -= ar * vel;
                _scene.activeCamera.orthoLeft -= ar * _engine.getAspectRatio(_scene.activeCamera) * vel;
                _scene.activeCamera.orthoTop += ar * vel;
                _scene.activeCamera.orthoRight += ar * _engine.getAspectRatio(_scene.activeCamera) * vel;
            }
            else {
                _scene.activeCamera.orthoBottom = -46.8;
                _scene.activeCamera.orthoLeft = -46.8 * _engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = 46.8;
                _scene.activeCamera.orthoRight = 46.8 * _engine.getAspectRatio(_scene.activeCamera);
            }


        };


        _selectCursor = function (e) {

        };        

        _selectMeshOutline = function (flag) {

            var idRelated, meshRelated, idPointX, meshPoint;
            var mesh = _scene.getMeshByName(_selectedMeshName);
            var fcnSelectSensor = globalsMenuEd.selectSensor[idEntity];

            if (mesh && _selectedMeshName.indexOf("Mesh-") !== -1) {

                mesh.renderOutline = flag;
                //mesh.outlineWidth = 1;
                mesh.outlineColor = BABYLON.Color3.Blue();
            }
            if (mesh && _selectedMeshName.indexOf("SensorProbe-") !== -1) {

                mesh.renderOutline = flag;

                for (var i = 0; i < globalsMenuEd.prop3d.points.children.length; i++) {
                    if (globalsMenuEd.prop3d.points.children[i].idPoint == _selectedMeshName.split("-")[1]) {
                        if (globalsMenuEd.prop3d.points.children[i].info.relatedIdPoint) {

                            if (globalsMenuEd.prop3d.points.children[i].info.orientation == 0) {
                                idPointX = globalsMenuEd.prop3d.points.children[i].idPoint;
                            }
                            else {
                                idPointX = globalsMenuEd.prop3d.points.children[i].info.relatedIdPoint;
                            }

                            idRelated = globalsMenuEd.prop3d.points.children[i].info.relatedIdPoint;
                            meshRelated = _scene.getMeshByName("SensorProbe-" + idRelated);

                            meshRelated.renderOutline = flag;
                        }
                        else{
                            idPointX = globalsMenuEd.prop3d.points.children[i].idPoint;
                            meshPoint = _scene.getMeshByName("SensorProbe-" + idPointX);
                            meshPoint.renderOutline = flag;
                        }
                    }
                    
                }

                treeMeasurementsPointsObj.selectNode("id" + idPointX);
                /*
                globalsMenuEd.actualSensorId[idEntity] = idPointX;
                $("#divSensors-" + idEntity + "-" + idPointX).css({
                    "background-color": "rgba(120, 120, 120, 0.9)"
                });*/
                fcnSelectSensor();
            }
        };

        _renderOutlineMeshesOut = function () {
            var mesh, moving, statics, housing, pairs, radial, axial, various,  idChild, tree, meshes = [];

            tree = globalsMenuEd.divsNames.Tree;


            for (var i = 0; i < _scene.meshes.length; i++) {
                meshes.push(_scene.meshes[i]);
            }
            for (var i = 0; i < meshes.length; i++) {
                meshes[i].renderOutline = false;
            }


            /*
            moving = $("#Moving-" + tree.pieces.firstLevel + idEntity);
            statics = $("#Statics-" + tree.pieces.firstLevel + idEntity);
            housing = $("#Housing-" + tree.pieces.firstLevel + idEntity);

            pairs = $("#" + tree.sensors.div + idEntity + tree.sensors.pair);
            radial = $("#" + tree.sensors.div + idEntity + tree.sensors.radial);
            axial = $("#" + tree.sensors.div + idEntity + tree.sensors.axial);
            various = $("#" + tree.sensors.div + idEntity + tree.sensors.various);

            for (var i = 0; i < moving.children().length; i++) {
                idChild = moving.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }
            for (var i = 0; i < statics.children().length; i++) {
                idChild = statics.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }
            for (var i = 0; i < housing.children().length; i++) {
                idChild = housing.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }
            for (var i = 0; i < pairs.children().length; i++) {
                idChild = pairs.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }
            for (var i = 0; i < radial.children().length; i++) {
                idChild = radial.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }
            for (var i = 0; i < axial.children().length; i++) {
                idChild = axial.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }
            for (var i = 0; i < various.children().length; i++) {
                idChild = various.children()[i].id;
                $("#" + idChild).css({
                    "background-color": "rgba(70, 70, 70, 0.9)"
                });
            }*/
        };

    };
    return Events3d;
})();