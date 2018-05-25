/*
 * loadMeshesLoc3d.js
 * Manejo de variables para la creación de Canvas 3d (Editor o Visor)
 */

var LoadMeshesLoc3d = {};

LoadMeshesLoc3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    LoadMeshesLoc3d = function (parentContId, manageCanvas) {


        var _scene,
            _engine,
            _canvas,
            _contCanvas,
            _selectedNodeId,
            _ppalProperties3d,
            _children = [],
            _nodes,
            _getChildren,
            _loadChildren,
            _actualNode,
            _findMaxUniqueId,
            _asignPropertiesToMeshes,
            _loadMeshes,
            _loadAsset,
            _loadSTLFiles,
            _loadLocations,
            _loadProperties3d,
            _loadLocationsAndAssets,
            _pruFunction;

        var scope = this;

        _nodes = {
            asset: [],
            location: []
        };

        _contCanvas = location3d.containerCanvas;
        _canvas = location3d.canvas;
        _engine = location3d.engine;
        _scene = location3d.scene;

        _pruFunction = function () {
            console.log(_selectedNodeId);
            /*if (_selectedNodeId === "57f7f554691ddf29a26be54a") {
                _ppalProperties3d = epmPlanta.location;
            }
            if (_selectedNodeId === "5834450b5ca9da6b0ca01d9e") {
                _ppalProperties3d = distribucionPrimaria.location;
            }
            if (_selectedNodeId === "5834530a5ca9da6b0ca01da4") {
                _ppalProperties3d = bombeoberlin.location;
            }*/
            //_loadPrincipalLoc(_ppalProperties3d.parts);
            _nodes.location.push({
                idNode: _selectedNodeId,
                parts: _ppalProperties3d.parts,
                relTrans: { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
            });
            _getChildren(_ppalProperties3d.children);
            console.log(_nodes.location);
            _loadLocations();
        };
         
        _getChildren = function (children) {
            var idChildren, childrenChilren, parts, assetProp3d, relTrans, absTrans;
            for (var i = 0; i < children.length; i++) {
                idChildren = children[i].id;
                relTrans = children[i].transform;
                for (var j = 0; j < treeObj.model.fields.dataSource.length; j++) {
                    //&& treeObj.model.fields.dataSource[j].Properties3d
                    if (treeObj.model.fields.dataSource[j].Id === idChildren ) {
                        if (children[i].partType == "Location") {
                            if (idChildren === "57f7f554691ddf29a26be54a") {
                                _ppalProperties3d = epmPlanta.location;
                            }
                            if (idChildren === "5834450b5ca9da6b0ca01d9e") {
                                _ppalProperties3d = distribucionPrimaria.location;
                            }
                            if (idChildren === "5834530a5ca9da6b0ca01da4") {
                                _ppalProperties3d = bombeoberlin.location;
                            }
                            _nodes.location.push({
                                idNode: idChildren,
                                parts: _ppalProperties3d.parts,
                                relTrans: relTrans
                            });

                            //_loadPrincipalLoc(_ppalProperties3d.parts);
                            _getChildren(_ppalProperties3d.children);                           
                        }
                        if (children[i].partType == "Asset") {
                            assetProp3d = JSON.parse(treeObj.model.fields.dataSource[j].Properties3d)
                            //_loadAsset(idChildren, assetProp3d.asset);

                        }
                        if (!treeObj.model.fields.dataSource[j].HasChild && i == children.length - 1) {
                            return;
                        }                                              
                    }                  
                }                
            }
        };

        /*
        _loadAsset = function (idNode, assetProp3d) {

            var fileName;
            _actualNode = assetProp3d;

            for (var i = 0; i < assetProp3d.children.length; i++) {
                fileName = assetProp3d.children[i].fileName;
                console.log(fileName);
                _loadSTLFiles(urlBabylonFiles + idNode + "/", fileName, idNode, 2);
            }
        };*/

        _loadChildren = function (id) {

        }

        _loadLocationsAndAssets = function () {
            _selectedNodeId = selectedTreeNode.Id;
            scope.disposeMeshes();
            _nodes.location = [];
            _pruFunction();

            /*_ppalProperties3d = JSON.parse(selectedTreeNode.Properties3d);
            if (selectedTreeNode.Properties3d) {

            }*/
            //_pruFunction();
        };

        _loadSTLFiles = function (url, fileName, idNode, entityType) {

            var mesh, nameMesh;


            nameMesh = idNode + "-" + fileName + "-";

            BABYLON.SceneLoader.ImportMesh("ascii", url, fileName + ".stl", _scene, function () {

                mesh = _scene.getMeshByName('ascii');
                mesh.name = nameMesh;
                mesh.id = "id-" + nameMesh;
                mesh.visibility = true;
                if (mesh.isReady()) {
                    _asignPropertiesToMeshes(mesh, entityType, idNode);

                }
            });
        };

        _loadLocations = function () {
            var parts, relTrans, idNode, fileName;

            for (var i = 0; i < _nodes.location.length; i++) {
                parts = _nodes.location[i].parts;
                relTrans =  _nodes.location[i].relTrans;
                idNode = _nodes.location[i].idNode;

                for (var j = 0; j < parts.length; j++) {
                    fileName = parts[j].fileName;
                    _loadSTLFiles(urlBabylonFiles + "Locations/", fileName, idNode, 1);
                }
            }

        };

        _asignPropertiesToMeshes = function (mesh, entityType, idNode) {

            var fileNameOfMesh, idNode, meshName, color, alpha = 1, transform, axisNum, partType, fileName, parentLocation, parentAsset, parts, parentParts, relTrans, newMesh;
            console.log(entityType);
            meshName = mesh.name;
            fileNameOfMesh = meshName.split("-")[1];
            //idNode = meshName.split("-")[0];
            //_ppalProperties3d.parts
            if (entityType === 1) {
                for (var i = 0; i < _nodes.location.length; i++) {
                    parentParts = new BABYLON.Mesh.CreateBox("ParentLoc-" + idNode, 0.001, _scene);
                    parentParts.visibility = false;
                    relTrans = _nodes.location[i].relTrans;
                    if (idNode == _nodes.location[i].idNode) {
                        parts = _nodes.location[i].parts;

                        for (var j = 0; j < parts.length; j++) {
                            transform = new Object(parts[j].transform);
                            for (var k = 0; k < transform.length; k++) {
                                newMesh = new Object(mesh.clone(meshName + k, newMesh));
                                console.log(newMesh);

                                newMesh.id = "id-" + meshName + k;
                                newMesh.uniqueId = _findMaxUniqueId() + 1;
                                newMesh.material = new BABYLON.StandardMaterial("mat-" + newMesh.name, _scene);

                                newMesh.position = new BABYLON.Vector3(transform[k].pos.x, transform[k].pos.y, transform[k].pos.z);
                                newMesh.rotation = new BABYLON.Vector3(transform[k].rot.x, transform[k].rot.y, transform[k].rot.z);
                                newMesh.scaling = new BABYLON.Vector3(transform[k].sca.x, transform[k].sca.y, transform[k].sca.z);
                                newMesh.visibility = true;

                                newMesh.material.alpha = 0.5;

                                newMesh.parent = parentParts;
                            }
                        }

                    }
                    parentParts.position = new BABYLON.Vector3(relTrans.pos.x, relTrans.pos.y, relTrans.pos.z);
                    parentParts.rotation = new BABYLON.Vector3(relTrans.rot.x, relTrans.rot.y, relTrans.rot.z);
                    parentParts.scaling = new BABYLON.Vector3(relTrans.sca.x, relTrans.sca.y, relTrans.sca.z);
                }
                /*
                for (var i = 0; i < _ppalProperties3d.parts.length; i++) {
                    if (fileNameOfMesh === _ppalProperties3d.parts[i].fileName) {
                        transform = new Object(_ppalProperties3d.parts[i].transform);
                        console.log(transform);
                        for (var j = 0; j < transform.length; j++) {
                            var newMesh = new Object(mesh.clone(meshName + j, newMesh));
                            newMesh.id = "id-" + meshName + j;
                            newMesh.uniqueId = _findMaxUniqueId() + 1;
                            newMesh.material = new BABYLON.StandardMaterial("mat-" + newMesh.name, _scene);

                            newMesh.position = new BABYLON.Vector3(transform[j].pos.x, transform[j].pos.y, transform[j].pos.z);
                            newMesh.rotation = new BABYLON.Vector3(transform[j].rot.x, transform[j].rot.y, transform[j].rot.z);
                            newMesh.scaling = new BABYLON.Vector3(transform[j].sca.x, transform[j].sca.y, transform[j].sca.z);
                            newMesh.visibility = true;
                        }
                    }                   
                }
                */
            }
            else if (entityType === 2) {
                for (var i = 0; i < _actualNode.children.length; i++) {
                    fileName = _actualNode.children[i].fileName;
                    if (fileNameOfMesh === fileName) {

                        color = new Object(_actualNode.children[i].color);
                        transform = new Object(_actualNode.children[i].transform);
                        //axisNum = new Object(nodes[idNode].Properties3d.asset.children[i].axisNum);
                        partType = _actualNode.children[i].partType;

                        if (partType === 'housing') {
                            alpha = 0.3;
                        }

                        for (var j = 0; j < transform.length; j++) {
                            var newMesh = new Object(mesh.clone(meshName + j, newMesh));

                            if (_actualNode.children[i].axisNum.length !== undefined) {
                                axisNum = _actualNode.children[i].axisNum[j];
                            }
                            else {
                                axisNum = new Object(_actualNode.children[i].axisNum);
                            }


                            newMesh.id = "id-" + meshName + j;
                            newMesh.uniqueId = _findMaxUniqueId() + 1;

                            newMesh.material = new BABYLON.StandardMaterial("mat-" + meshName + j, _scene);
                            newMesh.material.alpha = alpha;
                            newMesh.material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
                            newMesh.material.freeze();

                            newMesh.position = new BABYLON.Vector3(transform[j].pos.x, transform[j].pos.y, transform[j].pos.z);
                            newMesh.rotation = new BABYLON.Vector3(transform[j].rot.x, transform[j].rot.y, transform[j].rot.z);
                            newMesh.scaling = new BABYLON.Vector3(transform[j].sca.x, transform[j].sca.y, transform[j].sca.z);
                            newMesh.visibility = true;

                            if (partType === 'moving') {
                                newMesh.parent = _scene.getMeshByName(globals3d.names.parents.axis + "-" + axisNum + "-" + idNode);
                            }
                            else {
                                newMesh.parent = _scene.getMeshByName(globals3d.names.parents.asset + idNode);
                            }
                        }

                        break;
                    }
                }
            }
            mesh.dispose();
            

            /*
            _loadedFiles++;
            mesh.dispose();
            if (_filesToLoad === _loadedFiles) {

            }*/
        };


        _loadProperties3d = function (id) {

        };

        

        _loadMeshes = function () {

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

        this.loadLocations = function () {
            location3d.loadMeshesNodeSel = _loadLocationsAndAssets;
            scope.disposeMeshes();
            location3d.loadMeshesNodeSel();
            
        };
        
        this.disposeMeshes = function () {

            var meshes = [];

            console.log(_scene.meshes.length);
           // _engine.stopRenderLoop();

            for (var i = 0; i < _scene.meshes.length; i++) {
                meshes.push(_scene.meshes[i]);
            }

            for (var i = 0; i < meshes.length; i++) {
                meshes[i].dispose();
            }


            /*
            _scene.dispose();
            delete location3d.scene
            location3d.scene = new BABYLON.Scene(_engine);
            manageCanvas.createScene();
            manageCanvas.addEventListeners();
            */
            /*
            for (var i = 0; i < _scene.meshes.length; i++){
                _scene.meshes[i].dispose();
            }
            for (var i = 0; i < _scene.materials.length; i++) {
                _scene.materials[i].dispose();
            }
            for (var i = 0; i < _scene.meshes.length; i++) {
                _scene.meshes[i].dispose();
            }
            console.log(_scene.meshes.length);*/
        };
    };
    return LoadMeshesLoc3d;
})();