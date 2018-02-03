/*
 * uiEditor3d.js
 * Generacion de DOM para Interfaz de Usuario de Editor 3D
 */

var UiEditor3d = {};

var UiEditor3d = (function ()
{
    "use strict";

    /*
     * Constructor.
     */
    UiEditor3d = function (idEntity, functions, treeEd3d, flagProp3d, entityType) {

        var _scene,
            _container,
            _prop3d,
            _globals,
            _flags,
            _url,
            _gral,
            _Tier1,
            _Tier2,
            _qtyAxis,
            _actualAxis = 1,
            _selectedAxis = 1,
            _orientation,
            _view,
            _tS,
            _longAxis,
            _velAxisRel,
            _axisRelVel,
            _mainMenu,
            _tier1Menu,
            _tier2Menu,
            _groupsTier2,
            _constEd,
            _tooltipDiv,
            _showHideHousing,
            _ppalMenuColor,
            _flagInPieces = false,
            _actualiceInfoAxis,
            _modifyHelpersAxis,
            _changePropertiesAxis,
            _changeParentHelpersAxis,
            _createAxisParents,
            _deleteAxisParents,
            _actualiceProp3dAxis,
            _calculateRadiusCamera,
            _modifySizeAxisHelpers,
            _actualiceQtyAxis,
            _deleteQtyAxis,
            _createGralMenu,
            _createGroupFile,
            _createGroupInsert,
            _createGroupPiece,
            _createGroupAxisConfig,
            _createSensorConfig,
            _createGralConfig,
            _createModal,
            _createTooltip,
            _showHideTier2,
            _createTier1,
            _createTier2;

        _scene = editor3d.scene[idEntity];

        _url = "../Content/images/editor3d/";
        _gral = globalsMenuEd.divsNames.gral;
        _Tier1 = globalsMenuEd.divsNames.Tier1;
        _Tier2 = globalsMenuEd.divsNames.Tier2;
        
        _qtyAxis = 1;

        var scope = this;

        this.flagOpenFile = false;
        this.helperEd3d = null;

        _container = $("#" + editor3d.containerCanvas[idEntity].id);
        
        _constEd = globalsMenuEd.constant[idEntity];

        this.initializateProp3d = function (prop3d) {
            // _prop3d = null;
            _prop3d = prop3d;

            _longAxis = prop3d.asset.axis[0].prop.long;
            
            _velAxisRel =prop3d.asset.axis[0].prop.axisRelVel;
            _axisRelVel = prop3d.asset.axis[0].prop.vel;
        };

        _groupsTier2 = {
            file: null,
            insert: null,
            piece: null,
            axisConfig: null,
            sensorConfig: null
        };

        this.createMenu = function () {
            _createGralMenu();
            _createTier1();
            _createTier2();
            treeEd3d.qtyAxis = _qtyAxis;

        };

        this.loadAxisHelperAxis = function () {
            
            if (!flagProp3d || scope.flagOpenFile) {
                _deleteQtyAxis();               
            }
           
            _qtyAxis = globalsMenuEd.prop3d.asset.axis.length;
            _prop3d.asset.axis = globalsMenuEd.prop3d.asset.axis;           

            if (scope.flagOpenFile) {
                _actualiceQtyAxis(true);
            } else {
                _actualiceQtyAxis(true);
            }

            _longAxis = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis).val();
            _actualiceProp3dAxis("long");
        };

        _createGralMenu = function () {

            _gral = globalsMenuEd.divsNames.gral;
            _container.append('<div id="' + _gral + "MainMenu" + idEntity + '"></div>');

            _mainMenu = $("#" + _gral + "MainMenu" + idEntity);
            _mainMenu.addClass("ed3dCont");
            _mainMenu.css({
                "width": "100%",
                "top": "0px"
            });
        };

        _createTier1 = function () {
            var file, insert, piece, axisConfig, sensorConfig, elements, gralConfig;
           
            _mainMenu.append('<div id="' + _gral + _Tier1.gral + idEntity + '"></div>');
            _tier1Menu = $("#" + _gral + _Tier1.gral + idEntity);
            _tier1Menu.addClass("ed3dMainMenu ed3dMainMenuTier1");

            _tier1Menu.append('<div id="' + _gral + _Tier1.gral + _Tier1.file + idEntity + '">Archivo</div>');
            _tier1Menu.append('<div id="' + _gral + _Tier1.gral + _Tier1.insert + idEntity + '">Insertar</div>');
            _tier1Menu.append('<div id="' + _gral + _Tier1.gral + _Tier1.piece + idEntity + '">Piezas</div>');
            _tier1Menu.append('<div id="' + _gral + _Tier1.gral + _Tier1.axisConfig + idEntity + '">Ejes</div>');
            _tier1Menu.append('<div id="' + _gral + _Tier1.gral + _Tier1.sensorConfig + idEntity + '">Sensores</div>');
            _tier1Menu.append('<div id="' + _gral + _Tier1.gral + _Tier1.gralConfig + idEntity + '">Config Gral</div>');

            file = $("#" + _gral + _Tier1.gral + _Tier1.file + idEntity);
            insert = $("#" + _gral + _Tier1.gral + _Tier1.insert + idEntity);
            piece = $("#" + _gral + _Tier1.gral + _Tier1.piece + idEntity);
            axisConfig = $("#" + _gral + _Tier1.gral + _Tier1.axisConfig + idEntity);
            sensorConfig = $("#" + _gral + _Tier1.gral + _Tier1.sensorConfig + idEntity);
            gralConfig = $("#" + _gral + _Tier1.gral + _Tier1.gralConfig + idEntity);

            file.addClass("ed3dMainMenu ed3dMainMenuTier1 ed3dSubContMainMenu");
            insert.addClass("ed3dMainMenu ed3dMainMenuTier1 ed3dSubContMainMenu");
            piece.addClass("ed3dMainMenu ed3dMainMenuTier1 ed3dSubContMainMenu");
            axisConfig.addClass("ed3dMainMenu ed3dMainMenuTier1 ed3dSubContMainMenu");
            sensorConfig.addClass("ed3dMainMenu ed3dMainMenuTier1 ed3dSubContMainMenu");
            gralConfig.addClass("ed3dMainMenu ed3dMainMenuTier1 ed3dSubContMainMenu");

            file.click(function (args) {
                _showHideTier2("file");
                _ppalMenuColor("file");
                _scene.cameras[0].inputs.attachInput(_scene.cameras[0].inputs.attached.keyboard);
            });
            insert.click(function (args) {
                _showHideTier2("insert");
                _ppalMenuColor("insert");
                _scene.cameras[0].inputs.attachInput(_scene.cameras[0].inputs.attached.keyboard);
            });
            piece.click(function (args) {
                _showHideTier2("piece");
                _ppalMenuColor("piece");
                _scene.cameras[0].inputs.attached.keyboard.detachControl();
            });
            axisConfig.click(function (args) {
                _showHideTier2("axis");
                _ppalMenuColor("axis");
                _scene.cameras[0].inputs.attached.keyboard.detachControl();
            });
            sensorConfig.click(function (args) {
                _showHideTier2("sensor");
                _ppalMenuColor("sensor");
                _scene.cameras[0].inputs.attached.keyboard.detachControl();
            });

            gralConfig.click(function (args) {
                _showHideTier2("gral");
                _ppalMenuColor("gral");
                _scene.cameras[0].inputs.attachInput(_scene.cameras[0].inputs.attached.keyboard);
            });
        };

        _createTier2 = function () {
            var file, insert, piece, axisConfig, sensorConfig, gralConfig, elements;

            _mainMenu.append('<div id="' + _gral + _Tier2.gral + idEntity + '"></div>');
            _tier2Menu = $("#" + _gral + _Tier2.gral + idEntity);
            _tier2Menu.addClass("ed3dMainMenu ed3dMainMenuTier2");

            //Archivo
            _tier2Menu.append('<div id="' + _gral + _Tier2.gral + _Tier1.file + '" style="background-color: rgba(70, 70, 70, 0.9); height:40px"></div>');
            _tier2Menu.append('<div id="' + _gral + _Tier2.gral + _Tier1.insert + '" style="background-color: rgba(70, 70, 70, 0.9); height:40px"></div>');
            _tier2Menu.append('<div id="' + _gral + _Tier2.gral + _Tier1.piece + '" style="background-color: rgba(70, 70, 70, 0.9); height:40px"></div>');

            if (entityType == 2) {
                _tier2Menu.append('<div id="' + _gral + _Tier2.gral + _Tier1.axisConfig + '" style="background-color: rgba(70, 70, 70, 0.9); height:40px"></div>');
                _tier2Menu.append('<div id="' + _gral + _Tier2.gral + _Tier1.sensorConfig + '" style="background-color: rgba(70, 70, 70, 0.9); height:40px"></div>');
                _tier2Menu.append('<div id="' + _gral + _Tier2.gral + _Tier1.gralConfig + '" style="background-color: rgba(70, 70, 70, 0.9); height:40px"></div>');
            }
            

            _groupsTier2 = {
                file: $("#" + _gral + _Tier2.gral + _Tier1.file),
                insert: $("#" + _gral + _Tier2.gral + _Tier1.insert),
                piece: $("#" + _gral + _Tier2.gral + _Tier1.piece),
                axisConfig: $("#" + _gral + _Tier2.gral + _Tier1.axisConfig),
                sensorConfig: $("#" + _gral + _Tier2.gral + _Tier1.sensorConfig),
                gralConfig: $("#" + _gral + _Tier2.gral + _Tier1.gralConfig)
            };

            _showHideTier2(null);
            
             _createGroupFile();
             _createGroupInsert();
             _createGroupPiece();

             if (entityType == 2) {
                 _createGroupAxisConfig();
                 _createSensorConfig();
                 _createGralConfig();
             }

             _groupsTier2.file.css({ "background-color": "rgba(70, 70, 70, 0.9)" });
        };

        _createGroupFile = function () {
            var newFile, openFile, saveFile;

            _groupsTier2.file.append('<img   id="' + _gral + _Tier2.gral + _Tier2.file.newFile + '" src="' + _url + "new.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.file.append('<img   id="' + _gral + _Tier2.gral + _Tier2.file.openFile + '" src="' + _url + "open.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.file.append('<img   id="' + _gral + _Tier2.gral + _Tier2.file.saveFile + '" src="' + _url + "save.png" + '" class="imged3dMainMenu" />');

            newFile = $("#" + _gral + _Tier2.gral + _Tier2.file.newFile);
            openFile = $("#" + _gral + _Tier2.gral + _Tier2.file.openFile);
            saveFile = $("#" + _gral + _Tier2.gral + _Tier2.file.saveFile);

            newFile.on("click", function (args) {
                functions.createNewFile();
                $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.qtyAxis).prop('selectedIndex', 0);
                if (!scope.flagOpenFile) {
                    _deleteQtyAxis();
                    _qtyAxis = 1;
                    scope.initializateProp3d();
                    _actualiceQtyAxis(true);
                    _actualiceInfoAxis();
                }
                
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.file.newFile);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            openFile.on("click", function (args) {
                functions.openFile();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.file.openFile);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            saveFile.on("click", function (args) {
                functions.saveFile();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.file.saveFile);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });
        };
        
        _createGroupInsert = function () {

            var location, moving, statics, housing, loadFileInput, selectedInsert, fileName, ext;

            _mainMenu.append('<input type="file" id="inFileSTL" multiple="multiple" accept=".stl" hidden="hidden" style="visibility:hidden; display:none;" />');
            loadFileInput = $("#inFileSTL");
            $("#inFileSTL").on('click', function (e) {
                this.value = null;
            });
            $("#inFileSTL").on('change', function (e) {
                var files = e.target.files;
                //var ext;

                if (files.length > 0) {
                    if (window.FormData !== undefined) {
                        var data = new FormData();
                        for (var x = 0; x < files.length; x++) {
                            // data.append("file" + x, files[x]);
                            data.append(files[x].name, files[x]);
                        }

                        $.ajax({
                            type: "POST",
                            url: '/Home/UploadFile?id=' + idEntity,
                            contentType: false,
                            processData: false,
                            data: data,
                            success: function (result) {
                                //console.log(result);
                                for (var i = 0; i < e.target.files.length; i++) {
                                    if (e.target.files[i].name.indexOf(".stl") != -1) {
                                        fileName = e.target.files[i].name;
                                       // fileName = e.target.files[i].name.split(".stl")[0];
                                       // ext = ".stl";
                                    }
                                    else if (e.target.files[i].name.indexOf(".STL") != -1) {
                                       // fileName = e.target.files[i].name.split(".STL")[0];
                                       // ext = ".STL";
                                    }
                                    fileName = e.target.files[i].name;

                                    switch (selectedInsert) {
                                        case "moving":
                                            functions.insertMoving(fileName);
                                            break;
                                        case "statics":
                                            functions.insertStatics(fileName);
                                            break;
                                        case "housing":
                                            functions.insertHousing(fileName);
                                            break;
                                        case "location":
                                            functions.insertLocation(fileName);
                                            break;
                                    }
                                }
                            },
                            error: function (xhr, status, p3, p4) {
                                var err = "Error " + " " + status + " " + p3 + " " + p4;
                                if (xhr.responseText && xhr.responseText[0] == "{")
                                    err = JSON.parse(xhr.responseText).Message;
                                console.log(err);
                            }
                        });
                    } else {
                        alert("This browser doesn't support HTML5 file uploads!");
                    }
                }

                
                

            });


            if (entityType == 1) {
                _groupsTier2.insert.append('<img   id="' + _gral + _Tier2.gral + _Tier2.insert.location + '" src="' + _url + "add.png" + '" class="imged3dMainMenu" />');

                location = $("#" + _gral + _Tier2.gral + _Tier2.insert.location);

                location.on("click", function (args) {
                    selectedInsert = "location";
                    loadFileInput.click();
                }).on("mouseover", function (args) {
                    _tooltipDiv.show();
                    _tooltipDiv.css("left", args.pageX + "px");
                    _tooltipDiv.text(globalsMenuEd.tooltips.insert.location);
                }).on("mouseout", function (args) {
                    _tooltipDiv.hide();
                });
            }
            if (entityType == 2) {
                _groupsTier2.insert.append('<img   id="' + _gral + _Tier2.gral + _Tier2.insert.moving + '" src="' + _url + "moving.png" + '" class="imged3dMainMenu" />');
                _groupsTier2.insert.append('<img   id="' + _gral + _Tier2.gral + _Tier2.insert.statics + '" src="' + _url + "statics.png" + '" class="imged3dMainMenu" />');
                _groupsTier2.insert.append('<img   id="' + _gral + _Tier2.gral + _Tier2.insert.housing + '" src="' + _url + "housing.png" + '" class="imged3dMainMenu" />');
            }

            


            if (entityType == 2) {
                moving = $("#" + _gral + _Tier2.gral + _Tier2.insert.moving);
                statics = $("#" + _gral + _Tier2.gral + _Tier2.insert.statics);
                housing = $("#" + _gral + _Tier2.gral + _Tier2.insert.housing);


                moving.on("click", function (args) {
                    selectedInsert = "moving";
                    loadFileInput.click();
                }).on("mouseover", function (args) {
                    _tooltipDiv.show();
                    _tooltipDiv.css("left", args.pageX + "px");
                    _tooltipDiv.text(globalsMenuEd.tooltips.insert.moving);
                }).on("mouseout", function (args) {
                    _tooltipDiv.hide();
                });

                statics.on("click", function (args) {
                    selectedInsert = "statics";
                    loadFileInput.click();
                }).on("mouseover", function (args) {
                    _tooltipDiv.show();
                    _tooltipDiv.css("left", args.pageX + "px");
                    _tooltipDiv.text(globalsMenuEd.tooltips.insert.statics);
                }).on("mouseout", function (args) {
                    _tooltipDiv.hide();
                });

                housing.on("click", function (args) {
                    selectedInsert = "housing";
                    loadFileInput.click();
                }).on("mouseover", function (args) {
                    _tooltipDiv.show();
                    _tooltipDiv.css("left", args.pageX + "px");
                    _tooltipDiv.text(globalsMenuEd.tooltips.insert.housing);
                }).on("mouseout", function (args) {
                    _tooltipDiv.hide();
                });
            }

        };

        _createGroupPiece = function ()  {

            var numAxis, inX, inY, inZ, meshName, mesh, value;


            _groupsTier2.piece.append('<img   id="' + _gral + _Tier2.gral + _Tier2.piece.move + '" src="' + _url + "position.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.piece.append('<img   id="' + _gral + _Tier2.gral + _Tier2.piece.rotate + '" src="' + _url + "rotation.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.piece.append('<img   id="' + _gral + _Tier2.gral + _Tier2.piece.scaling + '" src="' + _url + "scaling.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.piece.append('<div class="nameInputTransEd3d"> X: <input id="' + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.piece.append('<div class="nameInputTransEd3d"> Y: <input id="' + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.piece.append('<div class="nameInputTransEd3d"> Z:<input id="' + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.piece.append('<img   id="' + _gral + _Tier2.gral + _Tier2.piece.clone + '" src="' + _url + "clone.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.piece.append('<img   id="' + _gral + _Tier2.gral + _Tier2.piece.deletePiece + '" src="' + _url + "delete.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.piece.append('<input type="color"   id="' + _gral + _Tier2.gral + _Tier2.piece.changeColor + '" class="inColor3dMainMenu" />');

            $("#" + _gral + _Tier2.gral + _Tier2.piece.changeColor).change(function (args) {
                functions.changeMeshColor(args.currentTarget.value);
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.piece.changeColor);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            
            if (entityType == 2) {
                _groupsTier2.piece.append('<select id="' + _gral + _Tier2.gral + _Tier2.piece.cBAxis + '" style="margin: 4px; height: 15px; background-color: #1c1c1c; color: white; font-size: 10px; top: 5px; display: inline; position: relative; left: 5px;" >');

                for (var i = 1; i <= _qtyAxis; i++) {
                    $("#" + _gral + _Tier2.gral + _Tier2.piece.cBAxis).append('<option value="AxisNum-' + i + '">' + "Eje # : " + i + '</option>');
                }

                $("#" + _gral + _Tier2.gral + _Tier2.piece.cBAxis).on("mouseover", function (args) {
                    _tooltipDiv.show();
                    _tooltipDiv.css("left", args.pageX + "px");
                    _tooltipDiv.text(globalsMenuEd.tooltips.piece.cBAxis);
                }).on("mouseout", function (args) {
                    _tooltipDiv.hide();
                });

                $("#" + _gral + _Tier2.gral + _Tier2.piece.cBAxis).click(function (args) {
                    value = args.currentTarget.value;
                    value = value.split("Eje # : ")[1];
                    _actualAxis = value;
                    functions.selectParentAxis(parseInt(value));
                });
            }

            $("#" + _gral + _Tier2.gral + _Tier2.piece.move).click(function (args) {
                _constEd.pieces.move = true;
                _constEd.pieces.rotate = false;
                _constEd.pieces.scale = false;

                $("#" + _gral + _Tier2.gral + _Tier2.piece.move).css({ "background-color": "rgba(120, 120, 120, 0.9)" });
                $("#" + _gral + _Tier2.gral + _Tier2.piece.rotate).css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                $("#" + _gral + _Tier2.gral + _Tier2.piece.scaling).css({ "background-color": "rgba(70, 70, 70, 0.9)" });

                functions.moveMesh();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.piece.move);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            $("#" + _gral + _Tier2.gral + _Tier2.piece.rotate).click(function (args) {
                _constEd.pieces.move = false;
                _constEd.pieces.rotate = true;
                _constEd.pieces.scale = false;

                $("#" + _gral + _Tier2.gral + _Tier2.piece.rotate).css({ "background-color": "rgba(120, 120, 120, 0.9)" });
                $("#" + _gral + _Tier2.gral + _Tier2.piece.move).css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                $("#" + _gral + _Tier2.gral + _Tier2.piece.scaling).css({ "background-color": "rgba(70, 70, 70, 0.9)" });

                functions.rotateMesh();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.piece.rotate);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            $("#" + _gral + _Tier2.gral + _Tier2.piece.scaling).click(function (args) {
                _constEd.pieces.move = false;
                _constEd.pieces.rotate = false;
                _constEd.pieces.scale = true;

                $("#" + _gral + _Tier2.gral + _Tier2.piece.scaling).css({ "background-color": "rgba(120, 120, 120, 0.9)" });
                $("#" + _gral + _Tier2.gral + _Tier2.piece.rotate).css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                $("#" + _gral + _Tier2.gral + _Tier2.piece.move).css({ "background-color": "rgba(70, 70, 70, 0.9)" });

                functions.scaleMesh();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.piece.scaling);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });


            inX = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.X);
            inY = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Y);
            inZ = $("#" + _gral + _Tier2.gral + _Tier2.piece.inputsXYZ.Z);

            inX.change(function () {
                meshName = globalsMenuEd.actualMeshName[idEntity];
                mesh = _scene.getMeshByName(meshName);

                if (_constEd.pieces.move) {
                    mesh.position.x = inX.val();
                    functions.moveMesh();
                }
                else if (_constEd.pieces.rotate) {
                    mesh.rotation.x = inX.val();
                    functions.rotateMesh();
                }
                else if (_constEd.pieces.scale) {
                    mesh.scaling.x = inX.val();
                    functions.scaleMesh();
                }

            });
            inX.focusin(function () {
                _flagInPieces = true;
            });
            inX.focusout( function () {
                _flagInPieces = false;
            });
            inY.change(function () {
                meshName = globalsMenuEd.actualMeshName[idEntity];
                mesh = _scene.getMeshByName(meshName);

                if (_constEd.pieces.move) {
                    mesh.position.y = inY.val();
                    functions.moveMesh();
                }
                else if (_constEd.pieces.rotate) {
                    mesh.rotation.y = inY.val();
                    functions.rotateMesh();
                }
                else if (_constEd.pieces.scale) {
                    mesh.scaling.y = inY.val();
                    functions.scaleMesh();
                }
            });
            inY.focusin(function () {
                _flagInPieces = true;
            });
            inY.focusout(function () {
                _flagInPieces = false;
            });

            inZ.change(function () {
                meshName = globalsMenuEd.actualMeshName[idEntity];
                mesh = _scene.getMeshByName(meshName);

                if (_constEd.pieces.move) {
                    mesh.position.z = inZ.val();
                    functions.moveMesh();
                }
                else if (_constEd.pieces.rotate) {
                    mesh.rotation.z = inZ.val();
                    functions.rotateMesh();
                }
                else if (_constEd.pieces.scale) {
                    mesh.scaling.z = inZ.val();
                    functions.scaleMesh();
                }
            });
            inZ.focusin(function () {
                _flagInPieces = true;
            });
            inZ.focusout(function () {
                _flagInPieces = false;
            });

            inX.on("click", function (args) {
                _constEd.pieces.x = true;
                _constEd.pieces.y = false;
                _constEd.pieces.z = false;
            });
            inY.on("click", function (args) {
                _constEd.pieces.x = false;
                _constEd.pieces.y = true;
                _constEd.pieces.z = false;
            });
            inZ.on("click", function (args) {
                _constEd.pieces.x = false;
                _constEd.pieces.y = false;
                _constEd.pieces.z = true;
            });

            var input = "x";
            var val;
            $(document).keyup(function (e) {
                //var val = 
                meshName = globalsMenuEd.actualMeshName[idEntity];
                mesh = _scene.getMeshByName(meshName);

                if (_constEd.pieces.x) {
                    val = inX.val();
                    input = "x";
                }
                else if (_constEd.pieces.y) {
                    val = inY.val();
                    input = "y";
                }
                else if (_constEd.pieces.z) {
                    val = inZ.val();
                    input = "z";
                }
                if (e.which === 46) {
                    if (!_flagInPieces) {
                        functions.deleteMesh();
                    }
                    
                }
                if (e.which === 38) {
                    if (_constEd.pieces.move) {
                        mesh.position[input] = parseInt(val) + 1;
                        functions.moveMesh();
                    }
                    else if (_constEd.pieces.rotate) {
                        mesh.rotation[input] = parseInt(val) + 1;
                        functions.rotateMesh();
                    }
                    else if (_constEd.pieces.scale) {
                        mesh.scaling[input] = parseInt(val) + 1;
                        functions.scaleMesh();
                    }
                }
                if (e.which === 40) {
                    if (_constEd.pieces.move) {
                        mesh.position[input] = parseInt(val) - 1;
                        functions.moveMesh();
                    }
                    else if (_constEd.pieces.rotate) {
                        mesh.rotation[input] = parseInt(val) - 1;
                        functions.rotateMesh();
                    }
                    else if (_constEd.pieces.scale) {
                        mesh.scaling[input] = parseInt(val) - 1;
                        functions.scaleMesh();
                    }
                }
            });

            $("#" + _gral + _Tier2.gral + _Tier2.piece.clone).click(function (args) {
                //Funcion clonar pieza
                functions.cloneMesh();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.piece.clone);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            $("#" + _gral + _Tier2.gral + _Tier2.piece.deletePiece).click(function (args) {
                //Funcion clonar pieza
                functions.deleteMesh();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.piece.deletePiece);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });
            //

            //_groupsTier2.piece.append('<div id="' + _gral + _Tier2.gral + _Tier2.piece.cBAxis + '" class="cB3dMainMenu" > # Eje \u25BD </div>');
        };

        _createGroupAxisConfig = function () {

            var value, opHor, opVer, opCW, opCCW, opVP, opVM, inX, inY, inZ;

            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> Largo: <input type="number" id="' + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis + '" style="margin: 4px; height: 15px; width: 45px; display: inline; position: relative; left: 5px;" ></div>');

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis).change(function () {
                _longAxis = parseInt($("#" + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis).val());
                _actualiceProp3dAxis("long");
            });


            _groupsTier2.axisConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.axisConfig.viewP + '" src="' + _url + "viewPlus.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.axisConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.axisConfig.viewM + '" src="' + _url + "viewMinus.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.axisConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.axisConfig.hor + '" src="' + _url + "horizontal.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.axisConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.axisConfig.ver + '" src="' + _url + "vertical.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.axisConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.axisConfig.tSCW + '" src="' + _url + "cw.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.axisConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.axisConfig.tSCCW + '" src="' + _url + "ccw.png" + '" class="imged3dMainMenu" />');
            
            opVP = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.viewP);
            opVM = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.viewM);
            opHor = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.hor);
            opVer = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.ver);
            opCW = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.tSCW);
            opCCW = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.tSCCW);

            opVP.hide();
            opVer.hide();
            opCCW.hide();

            opVP.click(function (args) {
                opVP.hide();
                opVM.show();
                _constEd.viewPlus = false;
                _constEd.viewMinus = true;
                _actualiceProp3dAxis("view");
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.axisConfig.viewP);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            opVM.click(function (args) {
                opVP.show();
                opVM.hide();
                _constEd.viewPlus = true;
                _constEd.viewMinus = false;
                _actualiceProp3dAxis("view");
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.axisConfig.viewM);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            opHor.click(function (args) {
                opHor.hide();
                opVer.show();
                _constEd.hor = false;
                _constEd.ver = true;
                _actualiceProp3dAxis("orien");
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.axisConfig.hor);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            opVer.click(function (args) {
                opHor.show();
                opVer.hide();
                _constEd.hor = true;
                _constEd.ver = false;
                _actualiceProp3dAxis("orien");
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.axisConfig.ver);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            opCW.click(function (args) {
                opCCW.show();
                opCW.hide();
                _constEd.cW = false;
                _constEd.cCW = true;
                _actualiceProp3dAxis("tS");
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.axisConfig.tSCW);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            opCCW.click(function (args) {
                opCW.show();
                opCCW.hide();
                _constEd.cW = true;
                _constEd.cCW = false;
                _actualiceProp3dAxis("tS");
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.axisConfig.tSCCW);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> Posición - </div>');

            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> X: <input id="' + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.X + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> Y: <input id="' + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Y + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> Z: <input id="' + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Z + '" type="number" class="inputTxted3dMainMenu"></div>');

            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> Eje Relacionado: </div><select id="' + _gral + _Tier2.gral + _Tier2.axisConfig.axisParent + '" style="margin: 4px; height: 15px; background-color: #1c1c1c; color: white; font-size: 10px; top: 5px; display: inline; position: relative; left: 5px;" >');

            for (var i = 1; i <= _qtyAxis; i++) {
                $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.axisParent).append('<option value="AxisNum-' + i + '">' + "Eje # : " + i + '</option>');
            }

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.axisParent).click(function (args) {
                value = args.currentTarget.value;
                value = value.split("-")[1];
                _actualAxis = value;
            });
            
            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d">Velocidad: <input id="' + _gral + _Tier2.gral + _Tier2.axisConfig.vel + '" type="number" class="inputTxted3dMainMenu"></div>');

            _groupsTier2.axisConfig.append('<div class="nameInputTransEd3d"> Cantidad Ejes: </div><select id="' + _gral + _Tier2.gral + _Tier2.axisConfig.qtyAxis + '" style="margin: 4px; height: 15px; background-color: #1c1c1c; color: white; font-size: 10px; top: 5px; display: inline; position: relative; left: 5px;" >');
            for (var i = 1; i <= 10; i++) {
                $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.qtyAxis).append('<option value="AxisNum-' + i + '">' + i + '</option>');
            }

            var parentAxis, actualMesh;
            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.qtyAxis).on("change", function (args) {

                //_selectedAxis = 1;
                //actualMesh = _scene.getMeshByName(globalsMenuEd.actualMeshName);
                //parentAxis = 
               // _changeParentHelpersAxis(true);

                _deleteQtyAxis();
                value = args.currentTarget.value;
                _qtyAxis = parseInt(value.split("-")[1]);
                _actualiceQtyAxis(false);
            });

            //_actualiceQtyAxis();

            inX = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.X);
            inY = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Y);
            inZ = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Z);

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis).val(_prop3d.asset.axis[_actualAxis - 1].prop.long)
            inX.val(_prop3d.asset.axis[_actualAxis - 1].prop.position.x);
            inY.val(_prop3d.asset.axis[_actualAxis - 1].prop.position.y);
            inZ.val(_prop3d.asset.axis[_actualAxis - 1].prop.position.z);

            inX.change(function () {
                _constEd.axisPosX = inX.val();
                _actualiceProp3dAxis("pos");
            });
            inY.change(function () {
                _constEd.axisPosY = inY.val();
                _actualiceProp3dAxis("pos");
            });
            inZ.change(function () {
                _constEd.axisPosZ = inZ.val();
                _actualiceProp3dAxis("pos");
            });
            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.vel).change(function () {
                _velAxisRel = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.vel).val();
                _actualiceProp3dAxis("vel");
            });
            /*
            var input = "x";
            var val;
            $(document).keyup(function (e) {
                //var val = 
                meshName = globalsMenuEd.actualMeshName[idEntity];
                mesh = _scene.getMeshByName(meshName);

                if (_constEd.pieces.x) {
                    val = inX.val();
                    input = "x";
                }
                else if (_constEd.pieces.y) {
                    val = inY.val();
                    input = "y";
                }
                else if (_constEd.pieces.z) {
                    val = inZ.val();
                    input = "z";
                }

                if (e.which === 38) {
                    if (_constEd.pieces.move) {
                        mesh.position[input] = parseInt(val) + 1;
                        functions.moveMesh();
                    }
                    else if (_constEd.pieces.rotate) {
                        mesh.rotation[input] = parseInt(val) + 1;
                        functions.rotateMesh();
                    }
                    else if (_constEd.pieces.scale) {
                        mesh.scaling[input] = parseInt(val) + 1;
                        functions.scaleMesh();
                    }
                }
                if (e.which === 40) {
                    if (_constEd.pieces.move) {
                        mesh.position[input] = parseInt(val) - 1;
                        functions.moveMesh();
                    }
                    else if (_constEd.pieces.rotate) {
                        mesh.rotation[input] = parseInt(val) - 1;
                        functions.rotateMesh();
                    }
                    else if (_constEd.pieces.scale) {
                        mesh.scaling[input] = parseInt(val) - 1;
                        functions.scaleMesh();
                    }
                }
            });*/

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.vel).val(_prop3d.asset.axis[_actualAxis - 1].prop.vel);
        };

        _createSensorConfig = function () {

            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> GENERAL -  </div>');

            _groupsTier2.sensorConfig.append('<img id="img' + _gral + _Tier2.gral + _Tier2.sensorConfig.gralRadius + '" src="' + _url + 'radius.png" style="top:5px; position:relative; left: 5px;" width="20px"/><div class="nameInputTransEd3d"> <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.gralRadius + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');

            $("#img" + _gral + _Tier2.gral + _Tier2.sensorConfig.gralRadius).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.sensorConfig.gralRadius);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            _groupsTier2.sensorConfig.append('<img  id="img' + _gral + _Tier2.gral + _Tier2.sensorConfig.gralHeight + '" src="' + _url + 'height.png" style="top:5px; position:relative; left: 5px;" width="20px"/><div class="nameInputTransEd3d">  <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.gralHeight + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');

            $("#img" + _gral + _Tier2.gral + _Tier2.sensorConfig.gralHeight).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.sensorConfig.gralHeight);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });


            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> SENSOR -  </div>');
            _groupsTier2.sensorConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity + '" src="' + _url + "add.png" + '" class="imged3dMainMenu" />');
            _groupsTier2.sensorConfig.append('<img   id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity + '" src="' + _url + "delete.png" + '" class="imged3dMainMenu" />');

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).click(function () {
                functions.addNewSensor()
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.sensorConfig.addSensor);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).click(function () {
                functions.deleteSensor();
            }).on("mouseover", function (args) {
                _tooltipDiv.show();
                _tooltipDiv.css("left", args.pageX + "px");
                _tooltipDiv.text(globalsMenuEd.tooltips.sensorConfig.deleteSensor);
            }).on("mouseout", function (args) {
                _tooltipDiv.hide();
            });

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).show();
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).hide();

            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> Punto: </div><select id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity + '" style="margin: 4px; height: 15px; background-color: #1c1c1c; color: white; font-size: 10px; top: 5px; display: inline; position: relative; left: 5px;" >');

            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> Pieza: </div><select id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.relPart + '-' + idEntity + '" style="margin: 4px; height: 15px; background-color: #1c1c1c; color: white; font-size: 10px; top: 5px; display: inline; position: relative; left: 5px;" >');



            _groupsTier2.sensorConfig.append('<img src="' + _url + 'height.png" style="top:5px; position:relative; left: 5px;" width="20px"/><div class="nameInputTransEd3d">  <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.height + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');

            //_groupsTier2.sensorConfig.append('<img src="' + _url + 'angle.png" style="top:-5px; position:relative; left: 5px;" width="20px"/><div class="nameInputTransEd3d"> <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.angle + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.sensorConfig.append('<img src="' + _url + 'perpend.png" style="top:5px; position:relative; left: 5px;" width="20px"/><div class="nameInputTransEd3d"> <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.perpend + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.sensorConfig.append('<img src="' + _url + 'paralel.png" style="top:5px; position:relative; left: 5px;" width="20px"/><div class="nameInputTransEd3d">  <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.paralel + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');

            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> Posición - </div>');

            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> X: <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.X + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> Y: <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.Y + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');
            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> Z: <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.inputsXYZ.Z + '-' + idEntity + '" type="number" class="inputTxted3dMainMenu"></div>');

            /*
            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> Axial: <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.axial + '-' + idEntity + '" type="checkbox" class="inputTxted3dMainMenu" style="top: 5px;width: 18px;"></div>');*/

            //_groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d" id="lblSide"> Lado : </div>');
            _groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d" id="lblSide"> Lado : <div class="nameInputTransEd3d" style="top: 0px;"> + <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.sidePlus + '-' + idEntity + '" type="checkbox" class="inputTxted3dMainMenu" style="top: 5px;width: 18px;"></div><div class="nameInputTransEd3d" style="top: 0px;"> - <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.sideMinus + '-' + idEntity + '" type="checkbox" class="inputTxted3dMainMenu" style="top: 5px; width: 18px; "></div></div>');

            /*_groupsTier2.sensorConfig.append('<div class="nameInputTransEd3d"> - <input id="' + _gral + _Tier2.gral + _Tier2.sensorConfig.sideMinus + '-' + idEntity + '" type="checkbox" class="inputTxted3dMainMenu" style="top: 5px; width: 18px; "></div>');*/

            $("#lblSide").hide();

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity).append("<option></option>");

            for (var i = 0; i < totalPoints.length; i++) {
                if (!totalPoints[i].Properties3d) {
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

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity).on("change", function (args) {
                //console.log(args.target.value);
                globalsMenuEd.selectedLBPoint[idEntity] = args.target.value;
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).show();
                $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).hide();
            });
        };

        _createGralConfig = function () {

            var cbHousing;

            _groupsTier2.gralConfig.append('<div class="nameInputTransEd3d" style="top: 5px;"> Carcasa: <input id="' + _gral + _Tier2.gral + _Tier2.gralConfig.cbHousing + '-' + idEntity + '" type="checkbox" class="inputTxted3dMainMenu" style="top: 5px;width: 18px; left: 5px;" checked="true"></div>');

            cbHousing = $("#" + _gral + _Tier2.gral + _Tier2.gralConfig.cbHousing + '-' + idEntity);

            cbHousing.click(function (args) {
                //console.log(args.target.checked);
                _showHideHousing(args.target.checked);
            });
        };

        _showHideHousing = function (flag) {
            //isVisible
            var fileName, meshName, mesh;
            for (var i = 0; i < globalsMenuEd.prop3d.asset.children.length; i++) {
                if (globalsMenuEd.prop3d.asset.children[i].partType === "housing") {
                    fileName = globalsMenuEd.prop3d.asset.children[i].fileName;
                    for (var j = 0; j < globalsMenuEd.prop3d.asset.children[i].transform.length; j++) {
                        mesh = _scene.getMeshByName("Mesh-" + idEntity + "-" + fileName + "-" + j);
                        mesh.isVisible = flag;
                    }
                }
                
            }
        };

        _actualiceQtyAxis = function (flagPreload) {
            
            var childrenAxisRel, axisNum, axis, propAxis;


            axis = _prop3d.asset.axis;

            if (!flagPreload && !scope.flagOpenFile) {
                propAxis = {
                    prop: {
                        tS: 0,
                        orientation: 0,
                        view: 1,
                        vel: 1,
                        long: 1000,
                        axisRelVel: 1,
                        position: {
                            x: 0,
                            y: 0,
                            z: 0
                        }
                    }
                };
            } 

            //console.log(_qtyAxis);
            for (var i = 1; i <= _qtyAxis; i++) {
                _groupsTier2.axisConfig.append('<div id="' + _gral + _Tier2.gral + _Tier2.axisConfig.numAxis + "-" + i + '" class="chooseNumAxisEd3d" style="left: 20px; position: relative; display: inline; margin: 0px 10px 0px 15px;">' + i + '</div>');
                //$("#" + _gral + _Tier2.gral + _Tier2.axisConfig.qtyAxis).append('<option value="AxisNum-' + i + '">' + i + '</option>');
                $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.numAxis + "-" + i).click(function (args) {

                    _selectedAxis = args.target.id.split("-")[2];
                    
                    for (var j = 1; j <= _qtyAxis; j++) {
                        $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.numAxis + "-" + j).css({
                            "background-color": "rgba(0, 0, 0, 0.9)"
                        });
                    }
                    $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.numAxis + "-" + _selectedAxis).css({
                        "background-color": "rgba(120, 120, 120, 0.9)"
                    });
                    _actualiceInfoAxis();
                    //_actualiceProp3dAxis("all");
                    _changePropertiesAxis();
                });
               
            }

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.axisParent).find('option').remove().end();

            
            for (var i = 1; i <= _qtyAxis; i++) {
                $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.axisParent).append("<option>Eje # : " +i + "</option>")
            }
            
            $("#" + _gral + _Tier2.gral + _Tier2.piece.cBAxis).find('option').remove().end();

            for (var i = 1; i <= _qtyAxis; i++) {
                $("#" + _gral + _Tier2.gral + _Tier2.piece.cBAxis).append("<option>Eje # : " + i + "</option>")
            }

            if (!flagPreload) {
                if (_qtyAxis > globalsMenuEd.prop3d.asset.axis.length) {
                    for (var i = 0; i <= _qtyAxis - axis.length ; i++) {
                        
                        globalsMenuEd.prop3d.asset.axis.push(propAxis);
                    }
                }
            }
            if (_qtyAxis < globalsMenuEd.prop3d.asset.axis.length) {
                globalsMenuEd.prop3d.asset.axis.splice(_qtyAxis - 1, globalsMenuEd.prop3d.asset.axis.length - _qtyAxis);
            }
        
            //console.log(globalsMenuEd.prop3d.asset.axis);

            $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.numAxis + "-1").css({
                "background-color": "rgba(120, 120, 120, 0.9)"
            });

            _selectedAxis = 1;
            _createAxisParents(flagPreload);

        };

        _createAxisParents = function (flagPreload) {

            var parent, posX, posY, posZ, parentAux, ppalParent, parentAxis;

            ppalParent = new BABYLON.Mesh.CreateBox("PPalParent-" + idEntity, 1, _scene);
            ppalParent.visibility = false;
            parentAux = new BABYLON.Mesh.CreateBox("Sample-Parent-HelperAxis-" + idEntity + "-aux", 1, _scene);
            parentAux.visibility = false;

            _qtyAxis = _prop3d.asset.axis.length;

            if (_actualAxis) {
                for (var i = 0; i < parseInt(_qtyAxis); i++) {

                    parent = new BABYLON.Mesh.CreateBox("Parent-HelperAxis-" + idEntity + "-" + i, 1, _scene);
                    parentAxis = new BABYLON.Mesh.CreateBox(globals3d.names.parents.parentAxis + idEntity + "-" + i, 1, _scene);
                    
                    if (!flagPreload && !scope.flagOpenFile) {
                        parent.position.x = _prop3d.asset.axis[_actualAxis - 1].prop.position.x;
                        parent.position.y = _prop3d.asset.axis[_actualAxis - 1].prop.position.y;
                        parent.position.z = _prop3d.asset.axis[_actualAxis - 1].prop.position.z;

                        parentAxis.position.x = _prop3d.asset.axis[_actualAxis - 1].prop.position.x;
                        parentAxis.position.y = _prop3d.asset.axis[_actualAxis - 1].prop.position.y;
                        parentAxis.position.z = _prop3d.asset.axis[_actualAxis - 1].prop.position.z;

                    } else {
                        parent.position.x = _prop3d.asset.axis[i].prop.position.x;
                        parent.position.y = _prop3d.asset.axis[i].prop.position.y;
                        parent.position.z = _prop3d.asset.axis[i].prop.position.z;

                        parentAxis.position.x = _prop3d.asset.axis[i].prop.position.x;
                        parentAxis.position.y = _prop3d.asset.axis[i].prop.position.y;
                        parentAxis.position.z = _prop3d.asset.axis[i].prop.position.z;
                    }


                    if (_prop3d.asset.axis[_actualAxis - 1].prop.orientation == 0) {
                        _modifyHelpersAxis("orien", 0);
                        
                    } else {
                        _modifyHelpersAxis("orien", 1);
                    }

                    parent.visibility = false;

                }
            }            
        };

        _changeParentHelpersAxis = function (flagAux) {
            var parentPPal, parentEye, parentArrowTS, parentHelperAxis, selectedAxis, children = [], child, parent;

            selectedAxis = _selectedAxis - 1;
            //parent = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + selectedAxis); 

            if (!flagAux) {
                parentPPal = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + selectedAxis);
            }
            else {
                parentPPal = _scene.getMeshByName("Sample-Parent-HelperAxis-" + idEntity + "-aux");
            }           
          
            if (parentPPal._children) {
                for (var i = 0; i < parentPPal._children.length; i++) {
                    children.push(_scene.getMeshByName(parentPPal._children[i].name));
                }
            }

            for (var i = 0; i < children.length; i++) {
                children[i].parent = parentPPal;
            }
            
        };
        
        _deleteQtyAxis = function () {
            for (var i = 0; i <= _qtyAxis; i++) {
                $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.numAxis + "-" + i).remove();
            }
            _deleteAxisParents();
        };

        _deleteAxisParents = function () {

            var parent1, children1, parent2, children2, child1, child2;
            //_changeParentHelpersAxis(true);

            //console.log(_qtyAxis);

            for (var i = 0; i < _qtyAxis; i++) {
                parent1 = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + i);
                parent2 = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-" + i);
                if (parent1) {
                    children1 = parent1._children;
                    children2 = parent2._children;
                    if (children1) {
                        for (var j = 0; j < children1.length; j++) {
                            child1 = children1[j];
                            child1.parent = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-0");
                        }
                    }
                    if (children2) {
                        for (var j = 0; j < children2.length; j++) {
                            child2 = children2[j];
                            child2.parent = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-0");
                        }
                    }
                    _selectedAxis = 1;
                    if (parent1) {
                        parent1.dispose();
                    }
                    if (parent2) {
                        parent2.dispose();
                    }
                }
                
            }
            for (var i = 0; i < _prop3d.asset.children.length; i++) {
                for (var j = 0; j < _prop3d.asset.children[i].axisNum.length; j++) {
                    _prop3d.asset.children[i].axisNum[j] = 0;
                }
            }
            scope.helperEd3d.createAxisHelpers();

        };

        _showHideTier2 = function (opc) {
            _groupsTier2.file.hide();
            _groupsTier2.insert.hide();
            _groupsTier2.piece.hide();
            _groupsTier2.axisConfig.hide();
            _groupsTier2.sensorConfig.hide();
            _groupsTier2.gralConfig.hide();

            switch (opc) {
                case "file":
                    _groupsTier2.file.show();
                    break;
                case "insert":
                    _groupsTier2.insert.show();
                    break;
                case "piece":
                    _groupsTier2.piece.show();
                    break;
                case "axis":
                    _groupsTier2.axisConfig.show();
                    break;
                case "sensor":
                    _groupsTier2.sensorConfig.show();
                    break;
                case "gral":
                    _groupsTier2.gralConfig.show();
                    break;
            }
        };

        _actualiceInfoAxis = function () {

            var selAxis, longAxis, opHor, opVer, opCW, opCCW, opVP, opVM, inX, inY, inZ, axis, inVel;

            selAxis = _selectedAxis - 1;
            axis = globalsMenuEd.prop3d.asset.axis[selAxis].prop;

            //console.log(selAxis);

            longAxis = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.longAxis);
            opVP = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.viewP);
            opVM = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.viewM);
            opHor = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.hor);
            opVer = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.ver);
            opCW = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.tSCW);
            opCCW = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.tSCCW);
            inX = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.X);
            inY = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Y);
            inZ = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.inputsXYZ.Z);

            inVel = $("#" + _gral + _Tier2.gral + _Tier2.axisConfig.vel);

            longAxis.val(axis.long);
            inX.val(axis.position.x);
            inY.val(axis.position.y);
            inZ.val(axis.position.z);
            inVel.val(axis.vel);

            if (!axis.orientation) {
                opHor.show();
                opVer.hide();
            }
            else {
                opHor.hide();
                opVer.show();
            }
            if (!axis.tS) {
                opCW.show();
                opCCW.hide();
            }
            else {
                opCW.hide();
                opCCW.show();
            }
            if (!axis.view) {
                opVP.show();
                opVM.hide();
            }
            else {
                opVP.hide();
                opVM.show();
            }

            _changePropertiesAxis();
            _actualiceProp3dAxis();
        };

        _actualiceProp3dAxis = function (typeOption) {

            var axis, tS, orientation, vel, axisRel, pos, actualAxis, posX, posY, posZ, parentAxis, parentPPal, selectedAxis, helpAxis, eye, arrowTS, parentAxis;

            axis = _prop3d.asset.axis;
            actualAxis = _selectedAxis - 1;

            //console.log(actualAxis);

            globalsMenuEd.actualAxis[idEntity] = actualAxis;
            _constEd = globalsMenuEd.constant[idEntity];
            if (flagProp3d || scope.flagOpenFile) {
               _changeParentHelpersAxis(false);
            }
            

            selectedAxis = _selectedAxis - 1;

            parentPPal = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + selectedAxis);
            parentAxis = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-" + selectedAxis);
            helpAxis = _scene.getMeshByName("parent" + globalsMenuEd.utilsNames.posHelp.name + '-' + idEntity);
            eye = _scene.getMeshByName("parent" + globalsMenuEd.utilsNames.eye.name + '-' + idEntity);
            arrowTS = _scene.getMeshByName("parent" + globalsMenuEd.utilsNames.arrowTS.name + '-' + idEntity);


            switch (typeOption) {
                case "pos":
                    posX = parseInt(_constEd.axisPosX);
                    posY = parseInt(_constEd.axisPosY);
                    posZ = parseInt(_constEd.axisPosZ);

                    if (!posX) {
                        posX = 0;
                    }
                    if (!posY) {
                        posY = 0;
                    }
                    if (!posZ) {
                        posZ = 0;
                    }
                    axis[actualAxis].prop.position = {
                        x: posX,
                        y: posY,
                        z: posZ
                    };
                    parentPPal.position = new BABYLON.Vector3(posX, posY, posZ);
                    parentAxis.position = new BABYLON.Vector3(posX, posY, posZ);
                    break;
                case "long":
                    //console.log(_longAxis);
                    axis[actualAxis].prop.long = parseInt(_longAxis);
                    _calculateRadiusCamera();
                    _modifySizeAxisHelpers();
                    //_createHelpers();
                    arrowTS.scaling = new BABYLON.Vector3(parseInt(_longAxis) * 0.2, parseInt(_longAxis) * 0.2, parseInt(_longAxis) * 0.2);
                    eye.scaling = new BABYLON.Vector3(parseInt(_longAxis) * 0.2, parseInt(_longAxis * 0.2), parseInt(_longAxis) * 0.2);
                    //parentPPal.scaling = new BABYLON.Vector3(parseInt(_longAxis), parseInt(_longAxis), parseInt(_longAxis));
                    helpAxis.scaling = new BABYLON.Vector3(parseInt(_longAxis) * 0.003, parseInt(_longAxis) * 0.003, parseInt(_longAxis));
                    _changePropertiesAxis();

                    
                    break;
                case "view":
                    if(_constEd.viewPlus){
                        axis[actualAxis].prop.view = 0;
                        _modifyHelpersAxis("view", 0);
                    }
                    else if (_constEd.viewMinus) {
                        axis[actualAxis].prop.view = 1;
                        _modifyHelpersAxis("view", 1);
                    }
                    _changePropertiesAxis();
                    break;
                case "orien":
                    if (_constEd.hor) {
                        axis[actualAxis].prop.orientation = 0;
                        _modifyHelpersAxis("orien", 0);
                    }
                    else if (_constEd.ver) {
                        axis[actualAxis].prop.orientation = 1;
                        _modifyHelpersAxis("orien", 1);
                    }
                    _changePropertiesAxis();
                    break;
                case "tS":
                    if (_constEd.cW) {
                        axis[actualAxis].prop.tS = 0;
                        _modifyHelpersAxis("tS", 0);
                    }
                    else if (_constEd.cCW) {
                        axis[actualAxis].prop.tS = 1;
                        _modifyHelpersAxis("tS", 1);
                    }
                    _changePropertiesAxis();
                    break;
                case "axisRelVel":
                    axis[actualAxis].prop.axisRelVel = _axisRelVel;
                    break;
                case "vel":
                    axis[actualAxis].prop.vel = parseInt(_velAxisRel);
                    break;              
            }
        };

        _changePropertiesAxis = function () {

            var orien, tS, view, long, actualAxis, parentPpal, parentEye, parentHelpAxis, parentArrowTS, helpAxis, axis;

            actualAxis = _selectedAxis - 1;

            //console.log(actualAxis);
            axis = _prop3d.asset.axis[actualAxis].prop;

            parentPpal = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + actualAxis);
            parentEye = _scene.getMeshByName("parent" + globalsMenuEd.utilsNames.eye.name + '-' + idEntity);
            parentArrowTS = _scene.getMeshByName("parent" + globalsMenuEd.utilsNames.arrowTS.name + '-' + idEntity);
            parentHelpAxis = _scene.getMeshByName("parent" + globalsMenuEd.utilsNames.posHelp.name + '-' + idEntity);
            helpAxis = _scene.getMeshByName("axis" + globalsMenuEd.utilsNames.posHelp.name + '-' + idEntity);

            parentEye.parent = parentPpal;
            parentArrowTS.parent = parentPpal;
            parentHelpAxis.parent = parentPpal;

            long = axis.long;
            orien = axis.orientation;
            tS = axis.tS;
            view = axis.view;

            parentArrowTS.scaling = new BABYLON.Vector3(long * 0.2, long * 0.2, long * 0.2);
            parentEye.scaling = new BABYLON.Vector3(long * 0.2, long * 0.2, long * 0.2);
            //parentPPal.scaling = new BABYLON.Vector3(parseInt(_longAxis), parseInt(_longAxis), parseInt(_longAxis));
            parentHelpAxis.scaling = new BABYLON.Vector3(long * 0.003, long * 0.003, long);

            if (!orien) {
                helpAxis.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
                if (!view) {
                    parentEye.position.z = -long * 0.65;
                    parentEye.rotation.x = -Math.PI * 90 / 180;
                    parentArrowTS.position.z = -long * 0.65;
                    if (!tS) {
                        parentArrowTS.rotation.y = Math.PI;
                    }
                    else {
                        parentArrowTS.rotation.y = 0;
                    }
                }
                else {
                    parentEye.position.z = long * 0.65;
                    parentEye.rotation.x = Math.PI * 90 / 180;
                    parentArrowTS.position.z = long * 0.65;
                    if (!tS) {
                        parentArrowTS.rotation.y = 0;
                    }
                    else {
                        parentArrowTS.rotation.y = Math.PI;
                    }
                }
            }
            else {
                helpAxis.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
                if (view) {
                    parentEye.position.z = long * 0.65;
                    parentEye.rotation.x = Math.PI * 90 / 180;
                    parentArrowTS.position.z = long * 0.65;
                    if (!tS) {
                        parentArrowTS.rotation.y = 0;
                    }
                    else {
                        parentArrowTS.rotation.y = Math.PI;
                    }
                }
                else {
                    parentEye.position.z = -long * 0.65;
                    parentEye.rotation.x = -Math.PI * 90 / 180;
                    parentArrowTS.position.z = -long * 0.65;
                    if (!tS) {
                        parentArrowTS.rotation.y = Math.PI;
                    }
                    else {
                        parentArrowTS.rotation.y = 0;
                    }
                }
            }
        };

        _calculateRadiusCamera = function () {

            var radius = 0, long, posZ, orien;

            for (var i = 0; i < _prop3d.asset.axis.length; i++) {
                long = _prop3d.asset.axis[i].prop.long;
                posZ = _prop3d.asset.axis[i].prop.position.z;
                if (long + posZ > radius) {
                    radius = long + posZ;
                }
            }
            _scene.activeCamera.radius = radius * 2.5;
            _scene.activeCamera.target = new BABYLON.Vector3(0, 0, 0);

            _scene.activeCamera.panningSensibility = 10000 / radius;
            _scene.activeCamera.wheelPrecision = 100 / radius;
            _scene.activeCamera.targetScreenOffset.y = 200;
        };

        _modifySizeAxisHelpers = function () {

            var lineX, lineY, lineZ, long, sizeLine = 0, posZ, pathX, pathY, pathZ, canvasTextX, canvasTextY, canvasTextZ;

            for (var i = 0; i < _prop3d.asset.axis.length; i++) {
                long = _prop3d.asset.axis[i].prop.long;
                posZ = _prop3d.asset.axis[i].prop.position.z;
                if (long + posZ > sizeLine) {
                    sizeLine = long + posZ;
                }
            }
            pathX = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(sizeLine * 1.1, 0, 0)];
            pathY = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, sizeLine * 1.1, 0)];
            pathZ = [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, sizeLine * 1.1)];

            lineX = _scene.getMeshByName(globalsMenuEd.utilsNames.helperAxis.x + idEntity);
            lineX = BABYLON.Mesh.CreateLines(null, pathX, null, null, lineX);
            lineY = _scene.getMeshByName(globalsMenuEd.utilsNames.helperAxis.y + idEntity);
            lineY = BABYLON.Mesh.CreateLines(null, pathY, null, null, lineY);
            lineZ = _scene.getMeshByName(globalsMenuEd.utilsNames.helperAxis.z + idEntity);
            lineZ = BABYLON.Mesh.CreateLines(null, pathZ, null, null, lineZ);

            canvasTextX = _scene.getMeshByName("textAxisHelpersTP-X");
            canvasTextY = _scene.getMeshByName("textAxisHelpersTP-Y");
            canvasTextZ = _scene.getMeshByName("textAxisHelpersTP-Z");

            canvasTextX.position = new BABYLON.Vector3(sizeLine * 1.1 + 30, 0, 0);
            canvasTextY.position = new BABYLON.Vector3(0, sizeLine * 1.1 + 30, 0);
            canvasTextZ.position = new BABYLON.Vector3(0, 0, sizeLine * 1.1 + 30);

            canvasTextX.scaling = new BABYLON.Vector3(sizeLine / 10, sizeLine / 10, sizeLine / 10);
            canvasTextY.scaling = new BABYLON.Vector3(sizeLine / 10, sizeLine / 10, sizeLine / 10);
            canvasTextZ.scaling = new BABYLON.Vector3(sizeLine / 10, sizeLine / 10, sizeLine / 10);

        };

        _modifyHelpersAxis = function (option, value) {

            var eye, arrowTS, helpAxis;

            var selectedAxis = _selectedAxis - 1;
            var parentPPal = _scene.getMeshByName("Parent-HelperAxis-" + idEntity + "-" + selectedAxis);
            var parentAxis = _scene.getMeshByName(globals3d.names.parents.parentAxis + idEntity + "-" + selectedAxis);
            helpAxis = _scene.getMeshByName("axis" + globalsMenuEd.utilsNames.posHelp.name + '-' + idEntity);

            

            switch (option) {
                case "view":
                    if (selectedAxis == 0) {
                        globalsMenuEd.prop3d.gralInfo.view = value;
                    }
                    break;
                case "orien":
                    if (selectedAxis == 0) {
                        globalsMenuEd.prop3d.gralInfo.orientation = value;
                    }
                    if (value == 0) {
                        parentPPal.rotation.x = 0;
                        parentAxis.rotation.x = 0;
                        if (helpAxis) {
                            helpAxis.material.diffuseColor = new BABYLON.Color3(0, 0, 1);
                        }
                    }
                    else {
                        parentPPal.rotation.x = 90 * Math.PI / 180;
                        parentAxis.rotation.x = 90 * Math.PI / 180;
                        if (helpAxis) {
                            helpAxis.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
                        }
                    }
                    
                    break;
                case "tS":
                    if (value == 0) {
                        
                    }
                    else {
                       
                    }
                    break;
            }
        };

        _ppalMenuColor = function (opc) {
            var file, insert, piece, axisConfig, sensorConfig, gralConfig, elements;

            file = $("#" + _gral + _Tier1.gral + _Tier1.file + idEntity);
            insert = $("#" + _gral + _Tier1.gral + _Tier1.insert + idEntity);
            piece = $("#" + _gral + _Tier1.gral + _Tier1.piece + idEntity);
            axisConfig = $("#" + _gral + _Tier1.gral + _Tier1.axisConfig + idEntity);
            sensorConfig = $("#" + _gral + _Tier1.gral + _Tier1.sensorConfig + idEntity);
            gralConfig = $("#" + _gral + _Tier1.gral + _Tier1.gralConfig + idEntity);
            
            file.css({ "background-color": "rgba(0, 0, 0, 0)" , "color" : "white"});
            insert.css({ "background-color": "rgba(0, 0, 0, 0)", "color": "white"});
            piece.css({ "background-color": "rgba(0, 0, 0, 0)", "color": "white" });
            axisConfig.css({ "background-color": "rgba(0, 0, 0, 0)", "color": "white" });
            sensorConfig.css({ "background-color": "rgba(0, 0, 0, 0)", "color": "white" });
            gralConfig.css({ "background-color": "rgba(0, 0, 0, 0)", "color": "white" });

            switch (opc) {
                case "file":
                    file.css({ "background-color": "rgba(70, 70, 70, 0.9)"});
                    break;
                case "insert":
                    insert.css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                    break;
                case "piece":
                    piece.css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                    break;
                case "axis":
                    axisConfig.css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                    break;
                case "sensor":
                    sensorConfig.css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                    break;
                case "gral":
                    gralConfig.css({ "background-color": "rgba(70, 70, 70, 0.9)" });
                    break;
            }
        };

        _createTooltip = function () {

           // var tooltipDiv;

            _container.append('<div id="' + globalsMenuEd.tooltips.gral + "-" + idEntity + '" class="ed3dTooltip"></div>');
            _tooltipDiv = $("#" + globalsMenuEd.tooltips.gral + "-" + idEntity);
            _tooltipDiv.css({

            });
            _tooltipDiv.text("La prueba del tooltip");
            _tooltipDiv.hide();
        }();

        _createModal = function () {

            var parentAreaDialog,
                parentContAreaDialog,
                parentContDivNames;

            _container.append('<div id="' + globalsMenuEd.modalOpen.id + idEntity + '" style="display:none;"><div class="control"></div></div>');
            //globalsMenuEd.modalOpen.obj = $("#" + globalsMenuEd.modalOpen.id + idEntity);

            
            parentAreaDialog = $("#" + globalsMenuEd.modalOpen.id + idEntity);

            parentAreaDialog.append('<div id="' + globalsMenuEd.modalOpen.idCont + idEntity + '" title:"Activos con Propiedades 3D"></div>');
            parentContAreaDialog = $("#" + globalsMenuEd.modalOpen.idCont + idEntity);

            $("#" + globalsMenuEd.modalOpen.idCont + idEntity).ejDialog({
                enableResize: false,
                width: 320,
                height: 380,
                zIndex: 2000,
                title: "Activos con Propiedades 3D",
                close: function () {
                    //$("#measurementPointCheckList").ejListBox("destroy"); // Destruir objeto Listbox Syncfusion
                    $("#" + globalsMenuEd.modalOpen.id + idEntity + "#btnOpen").off("click"); // Necesario desasociar el evento
                    $("#" + globalsMenuEd.modalOpen.id + idEntity + "#btnCancel").off("click"); // Necesario desasociar el evento
                    $("#" + globalsMenuEd.modalOpen.id + idEntity).css("display", "none"); // Ocultar de nuevo el html de la modal
                },
                content: "#" + globalsMenuEd.modalOpen.id + idEntity,
                actionButtons: ["close"],
                position: { X: 150, Y: 100 } // Posicionar el ejDialog
            });

            $("#" + globalsMenuEd.modalOpen.idCont + idEntity).ejDialog("open");

            parentContAreaDialog.append('<div id="' + globalsMenuEd.modalOpen.idDivNames + "-" + idEntity + '" style="width: 280px; height: 270px; overflow-y: scroll; border:solid; border-width: 1px; border-color: #f1f1f1;"></div>');

            parentContDivNames = $("#" + globalsMenuEd.modalOpen.idDivNames + "-" + idEntity);


            parentContAreaDialog.append('<div class="form-group" style="display:block; top:290px; left: 80px; position: absolute;">' +
                        '<div class="row">' +
                            '<div style="text-align: center; ">' +
                                '<a id="btnOpen"  class="btn btn-sm btn-primary" href="#" style=" width: 80px;>' +
                                    '<i class="fa fa-filter"></i> Abrir' +
                                '</a>' +
                                '<a id="btnCancel" style=" margin-left: 30px; width: 80px;" class="btn btn-sm btn-primary" href="#">' +
                                    '<i class="fa fa-close"></i> Cancelar' +
                                '</a>' +
                            '</div>' +
                        '</div>' +
                   '</div>');

        }();
    };
    return UiEditor3d;
})();