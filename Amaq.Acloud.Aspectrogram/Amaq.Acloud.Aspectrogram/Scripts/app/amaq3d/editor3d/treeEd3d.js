/*
 * treeEd3d.js
 * Eventos de editor para contenido 3D
 */

var TreeEd3d = {};

var TreeEd3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    TreeEd3d = function (idEntity, entityType, functions) {

        var _container,
            _cont,
            _tree,
            _url,
            _gral,
            _Tier1,
            _Tier2,
            _toolbar,
            _treePieces,
            _treePoints,
            _treeAssetLibrary,
            _treeDivContPieces,
            _piecesToolbar,
            _getJSON,
            _contPieces,
            _contPoints,
            _contAssetLibrary,
            _contSensors,
            _createTree,
            _selectTreeSensor,
            _createToolbar,
            _assetTooltips,
            _createDivTreePieces,
            _createDivTreePoint,
            _createDivTreeAssetsLibrary,
            _createDivSensors;

        this.qtyAxis = 1;

        this.radialPoints = null;
        this.pairsPoints = null;
        this.variousPoints = null;
        this.axialPoints = null;

        this.piecesData = null;
        this.pointsData = null;
        this.piecesTreeObj = null;

        var scope = this;


        _container = $("#" + editor3d.containerCanvas[idEntity].id);
        _tree = globalsMenuEd.divsNames.Tree;
        _toolbar = globalsMenuEd.divsNames.toolbar;
        _gral = globalsMenuEd.divsNames.gral;
        _Tier1 = globalsMenuEd.divsNames.Tier1;
        _Tier2 = globalsMenuEd.divsNames.Tier2;
        _url = "../Content/images/editor3d/";

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

        _treeAssetLibrary = {
            assets: {
                id: "idAssetsLibrary"
            }
        };

        _createTree = function () {
            //_treePieces = globalsMenuEd.prop3d[idEntity];

            /*
            if(entityType == 1){
                _treePieces = {
                    location: [

                    ]
                };
            }
            else if(entityType == 2){
                _treePieces = globalsMenuEd.prop3d[idEntity];
            }*/

            //ed3dPiecesToolbar
            
          

        };

        _createToolbar = function () {


            _container.append('<div id="' + _toolbar.div + idEntity + '" class="ed3dPiecesToolbar"></div>');
            _piecesToolbar = $("#" + _toolbar.div + idEntity);

            for (var i = 0; i < _toolbar.children.length; i++) {
                _piecesToolbar.append('<div id="div' + _toolbar.children[i].id + idEntity + '" class="ed3dDivToolbar"></div>');
                $("#div" + _toolbar.children[i].id + idEntity).append('<img id="img' + _toolbar.children[i].id + idEntity + '" class="ed3dImgToolbar" src="' + _url + _toolbar.children[i].id + '.png"></img>');
                $("#div" + _toolbar.children[i].id + idEntity).append('<div id="txt' + _toolbar.children[i].id + idEntity + '" class="ed3dTxtToolbar">' + _toolbar.children[i].txt + '</div>');
                $("#txt" + _toolbar.children[i].id + idEntity).hide();

                $("#div" + _toolbar.children[i].id + idEntity).on("click", function (args) {
                    // $("#txt" + _toolbar.children[i] + idEntity).show();
                    console.log(args.target.id);
                    for (var j = 0; j < _toolbar.children.length; j++) {
                        $("#txt" + _toolbar.children[j].id + idEntity).hide();
                        if (args.target.id == "img" + _toolbar.children[j].id + idEntity) {
                            $("#" + _toolbar.children[j].child + idEntity).show();
                        } else {
                            $("#" + _toolbar.children[j].child + idEntity).hide();
                        }
                    }
                    $("#txt" + args.target.id.split("img")[1]).show();

                });
            }
        };

        this.createTreeEditor = function () {
             
            _container.append('<div id="' + _tree.gral + idEntity + '" class="classContTreeEd3d"></div>');
            _cont = $("#divContTreeEd3d" + _tree.gral + idEntity);


            _createToolbar();
            _createDivTreePieces();
            _createDivTreePoint();
            _createDivTreeAssetsLibrary();
            _createDivSensors();
            //globalsMenuEd.prop3d[idEntity] = _treePieces;
            //console.log(globalsMenuEd.prop3d[idEntity]);
            //_createDivSensors();
        };


        _createDivTreePieces = function () {

            _container.append('<div id="' + _tree.pieces.div + idEntity + '" class="classContTreePiecesEd3d"></div>');
            _contPieces = $("#" + _tree.pieces.div + idEntity);

            scope.piecesData = [
                   { id: _treePieces.assemble.id, name: _treePieces.assemble.name, hasChild: true },
                   { id: _treePieces.moving.id, name: _treePieces.moving.name, hasChild: true, pid: _treePieces.assemble.id },
                   { id: _treePieces.statics.id, name: _treePieces.statics.name, hasChild: true, pid: _treePieces.assemble.id },
                   { id: _treePieces.housing.id, name: _treePieces.housing.name, hasChild: true, pid: _treePieces.assemble.id }
            ];

            $("#" + _tree.pieces.div + idEntity).ejTreeView(
           {
               loadOnDemand: true,
               //showCheckbox: true,
               fields: { dataSource: scope.piecesData, id: "id", parentId: "pid", text: "name", hasChild: "hasChild" },
               nodeSelect: function (args) {
                   console.log(args);
                   //if (!globalsMenuEd.flagSelectedEvent && globalsMenuEd.actualMeshName[idEntity] != "Mesh-" + idEntity + "-" + args.id.split("-")[1] + "-" + args.id.split("-")[2] ) {
                   if (globalsMenuEd.actualMeshName[idEntity] != "Mesh-" + idEntity + "-" + args.id.split("-")[1] + "-" + args.id.split("-")[2]) {
                       functions.selectTreePart(args.id);
                   }
               },
               ready: function (args) {
                   //Comentado por nueva librería syncfusion 
                   //treePiecesObj = $("#" + _tree.pieces.div + idEntity).ejTreeView('instance');
                   treePiecesObj = $("#" + _tree.pieces.div + idEntity).data("ejTreeView");
                   treePiecesObj.checkAll();
                   treePiecesObj.expandAll();
               }

           });
            
            treePiecesObj = $("#" + _tree.pieces.div + idEntity).data("ejTreeView");

            setTimeout(function () {
                treePiecesObj.checkAll();
                treePiecesObj.expandAll();
            }, 3000);


            _contPieces.hide();
        };

        _createDivTreePoint = function () {

            _container.append('<div id="' + _tree.points.div + idEntity + '" class="classContTreePiecesEd3d"></div>');
            _contPoints = $("#" + _tree.points.div + idEntity);

            scope.pointsData = [
                   { id: _treePoints.points.id, name: _treePoints.points.name, hasChild: true },
                   { id: _treePoints.pair.id, name: _treePoints.pair.name, hasChild: true, pid: _treePoints.points.id },
                   { id: _treePoints.axial.id, name: _treePoints.axial.name, hasChild: true, pid: _treePoints.points.id },
                   { id: _treePoints.radial.id, name: _treePoints.radial.name, hasChild: true, pid: _treePoints.points.id }
            ];

            $("#" + _tree.points.div + idEntity).ejTreeView(
           {
               loadOnDemand: true,
              // showCheckbox: true,
               fields: { dataSource: scope.pointsData, id: "id", parentId: "pid", text: "name", hasChild: "hasChild" },
               nodeSelect: function (args) {
                   console.log(args);
                   globalsMenuEd.actualSensorId[idEntity] = args.id.split("id")[1];
                   globalsMenuEd.selectedLBPoint[idEntity] = "";
                   globalsMenuEd.selectSensor[idEntity]();
               },
               ready: function (args) {
                   //Comentado por nueva librería syncfusion 
                   //treeMeasurementsPointsObj = $("#" + _tree.points.div + idEntity).ejTreeView('instance');
                   treeMeasurementsPointsObj = $("#" + _tree.points.div + idEntity).data("ejTreeView");
                   treeMeasurementsPointsObj.checkAll();
                   treeMeasurementsPointsObj.expandAll();
               }
           });
            //no va
            treeMeasurementsPointsObj = $("#" + _tree.points.div + idEntity).data("ejTreeView");
            

            setTimeout(function () {
                treeMeasurementsPointsObj.checkAll();
                treeMeasurementsPointsObj.expandAll();
            }, 4000);

            _contPoints.hide();
        };

        _createDivTreeAssetsLibrary = function () {

            var parentAsset, assetName, url, prop3d, dataProp3d, idCloned;

            _container.append('<div id="' + _tree.assets.div + idEntity + '" class="classContTreePiecesEd3d"></div>');
            _contAssetLibrary = $("#" + _tree.assets.div + idEntity);

            //assetsLibrary

            $("#" + _tree.assets.div + idEntity).ejTreeView(
           {
               loadOnDemand: true,
               // showCheckbox: true,
               fields: { dataSource: assetsLibrary, id: "id", parentId: "pid", text: "txt", hasChild: "hasChild" },
               nodeSelect: function (args) {
                   console.log(args);
                   assetName = args.id.split("idAL")[1];
                   parentAsset = args.parentId.split("idAL")[1];

                   $.getJSON('../Content/Prop3d/assets.json', {
                       format: "json"
                   }).done(function (data) {
                       prop3d = JSON.parse(data[assetName]);
                       console.log(prop3d);

                       if (prop3d.asset.children.length > 0) {
                           functions.createNewFile(prop3d);
                           //prop3d = JSON.parse(result);
                           functions.isFromLibrary = true;
                           globalsMenuEd.prop3d = prop3d;
                           functions.initializateProp3d(prop3d);
                           functions.uiEd3d.flagOpenFile = true;
                           functions.uiEd3d.loadAxisHelperAxis();
                           idCloned = idEntity;
                           prop3d.gralInfo.idCloned = idCloned;
                           prop3d.points.children = [];
                           //_urlSTL = urlBabylonFiles + idCloned + "/";
                           functions.urlLibrary = '../Content/STL/Assets/' + parentAsset + '/' + assetName + '/';
                           functions.loadAssetMeshes();
                       }
                   });
               },
               ready: function (args) {
                   //Comentado por nueva librería syncfusion 
                   //treeAssetsLibraryObj = $("#" + _tree.assets.div + idEntity).ejTreeView('instance');
                   treeAssetsLibraryObj = $("#" + _tree.assets.div + idEntity).data("ejTreeView");
                   treeAssetsLibraryObj.checkAll();
                   treeAssetsLibraryObj.expandAll();
               }
           });
            treeAssetsLibraryObj = $("#" + _tree.assets.div + idEntity).data("ejTreeView");


            setTimeout(function () {
                treeAssetsLibraryObj.checkAll();
                treeAssetsLibraryObj.expandAll();
            }, 4000);

            _contAssetLibrary.hide();
            _assetTooltips();
        };

        _createDivSensors = function () {

            var points, measPoints, radialPoints = [], pairPoints = [], variousPoints = [], axialPoints = [], xPoint, yPoint;

            measPoints = totalPoints;


            
            for (var i = 0; i < measPoints.length; i++) {
                if (measPoints[i].Properties3d) {
                    if (measPoints[i].ParentId == idEntity) {
                        if (measPoints[i].IsAngularReference || (!measPoints[i].AssociatedMeasurementPointId && !measPoints[i].Orientation == 3)) {
                            radialPoints.push(
                                measPoints[i]
                            );
                        }
                        if (measPoints[i].Orientation == 1 && measPoints[i].AssociatedMeasurementPointId) {
                            xPoint = measPoints[i];
                            for (var j = 0; j < measPoints.length; j++) {
                                if (measPoints[i].AssociatedMeasurementPointId == measPoints[j].Id) {
                                    yPoint = measPoints[j];
                                }
                            }
                            pairPoints.push({
                                X: xPoint,
                                Y: yPoint
                            });
                        }
                        if (measPoints[i].Orientation == 1 && !measPoints[i].AssociatedMeasurementPointId) {
                            radialPoints.push(
                                measPoints[i]
                            );
                        }
                        if (!measPoints[i].Orientation && !measPoints[i].IsAngularReference) {
                            variousPoints.push(
                                measPoints[i]
                            );
                        }
                        if (measPoints[i].Orientation == 3) {
                            axialPoints.push(
                                measPoints[i]
                            );
                        }
                    }
                }               
            }


            scope.radialPoints = radialPoints;
            scope.pairPoints = pairPoints;
            scope.variousPoints = variousPoints;
            scope.axialPoints = axialPoints;


            for (var i = 0; i < pairPoints.length; i++) {
                scope.pointsData.push({ id: "id" + pairPoints[i].X.Id, name: pairPoints[i].X.Name + ' - ' + pairPoints[i].Y.Name, hasChild: false, pid: _treePoints.pair.id });
            }
            for (var i = 0; i < radialPoints.length; i++) {
                scope.pointsData.push({ id: "id" + radialPoints[i].Id, name: radialPoints[i].Name, hasChild: false, pid: _treePoints.radial.id });
            }
            for (var i = 0; i < axialPoints.length; i++) {
                scope.pointsData.push({ id: "id" + axialPoints[i].Id, name: axialPoints[i].Name, hasChild: false, pid: _treePoints.axial.id });
            }

            treeMeasurementsPointsObj.model.fields.dataSource = scope.pointsData;
            treeMeasurementsPointsObj.refresh();

            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.addSensor + '-' + idEntity).hide();
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.deleteSensor + '-' + idEntity).show();
            $("#" + _gral + _Tier2.gral + _Tier2.sensorConfig.points + '-' + idEntity).val("");
            globalsMenuEd.selectedLBPoint[idEntity] = "";
           
        };

        _assetTooltips = function () {

            var content, parent, child;

            for (var i = 0; i < assetsLibrary.length; i++) {
                if (!assetsLibrary[i].hasChild) {
                    parent = assetsLibrary[i].pid.split("idAL")[1];
                    child = assetsLibrary[i].id.split("idAL")[1];
                    content = '<div class="main"> <img class="ctrImg" src="../Content/images/editor3d/Assets/' + parent + '/' + child + '.jpg" width="120px" height="120px" id="img' + assetsLibrary[i].id + '"> </div>';
                    /*Comentado por nueva librería syncfusion 
                    
                    $("#" + assetsLibrary[i].id).ejTooltip({
                        content: content,
                        position: {
                            stem: { horizontal: "left", vertical: "top" },
                            target: { horizontal: "right", vertical: "bottom" }
                        }
                    });*/
                }
                
            }
        };

        _getJSON = function (url) {
            console.log("wwwww");
            $.getJSON(url, function (data) {
                console.log(data);
                //console.log(data[assetName]);
                //prop3d = JSON.parse(data[assetName]);
                //prop3d = prop3d[assetName];
                //console.log(prop3d);
            });
        }
    };
    return TreeEd3d;
})();