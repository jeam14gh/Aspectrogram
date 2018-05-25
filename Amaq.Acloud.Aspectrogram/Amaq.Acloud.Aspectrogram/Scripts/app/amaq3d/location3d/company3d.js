/*
 * Company3d.js
 * Manejo de variables para la creación de Canvas 3d (Editor o Visor)
 */

var Company3d = {};

Company3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    Company3d = function (wId, parentContId) {


        var _scene,
            _engine,
            _canvas,
            _cube,
            _base,
            _cyl,
            _vbles,
            _plants,
            _cubeQty,
            _cols,
            _rows,
            _scope,
            _plantsArray,
            _hexArray,
            _spacePercent,
            _hexPercent,
            _initializeVbles,
            _createPies,
            _createPie,
            _createPortion,
            _createPieStructure,
            _createCover,
            _simulateStatesChange,
            _calculateRowsCols,
            _createNameCompanyCanvas,
            _createCompleteNameCompanyCanvas,
            _calculateStatusPercentage,
            _createBeams,
            _createBeamMaterial,
            _locatePies,
            _createHexagons,
            _arrayGeoLocType,
            _distributeGeoLocation,
            _createConexionLines,
            _loadPlants,
            _locateCamera,
            _createMaterial,
            _animateMaterial,
            _animations,
            _createRibbon,
            _createBase,
            _createShapes;

        _cube = {
            h: 200,
            w: 200,
            d: 200
        };

        _base = {
            h: 100,
            w: 100,
            d: 100
        };

        _cyl = {
            h: 30,
            d: 100
        };

        _arrayGeoLocType = {
            NO: [],
            NE: [],
            E: [],
            SE: [],
            SO: [],
            O: [],
            C: [],
        };

        _hexPercent = 1.2;
        _spacePercent = 1;
        _plantsArray = [];
        _hexArray = [];

        this.locInfo = globalsLoc3d;

        _scope = this;

        _initializeVbles = function () {
            _scene = location3d.scene[wId];
            _vbles = location3d.vbles[wId];
            scene = _scene;
            camera = _scene.activeCamera;
        }();

        _vbles.plants = {
            shape: [],
            text: [],
            hex: [],
            sparkles: []
        };

        this.loadCompany = function () {

            _loadPlants();
            _calculateRowsCols();
            _distributeGeoLocation();
            //_createPie();
            //_createRibbon();
            //parte de base rectangular con pies
            //_createBase();
            //_createPies();
            //_createShapes("sphere");
            _locateCamera();
            _simulateStatesChange();
           // _scope.updatePortionPies();
        };

        this.updatePortionPies = function () {

            var i,
                entityChildren,
                status;

            var jsonTree2 = entities;


            for (i = 0; i < _plants.length; i++) {
                entityChildren = ej.DataManager(jsonTree2).executeLocal(new ej.Query().where("ParentId", "equal", _plants[i].Id, true));
                status = _calculateStatusPercentage(entityChildren);
            }

        };

        _animations = function () {
            var alpha,
                statusColor,
                idEntity,
                i, j,
                material,
                incAlpha,
                incScale,
                highlight,
                info,
                time,
                cone11,
                cone21;

            highlight = 0;
            time = 0;
            alpha = 0;
            incAlpha = true;
            incScale = true;
            var jsonTree2;

            jsonTree2 = entities;

            _scene.registerBeforeRender(function () {
                for (i = 0; i < _hexArray.length; i++) {
                    _hexArray[i].mesh.position.y = _hexArray[i].iniPos * 2 + Math.cos(_hexArray[i].alpha) * 70;
                    _hexArray[i].alpha += 0.01 * _hexArray[i].incPosY;
                }

                time += Math.random() * 0.03;
                for (i = 0; i < globalsLoc3d.materials.beams.length; i++) {
                    globalsLoc3d.materials.beams[i].setFloat("time", time);
                    
                }
                /*
                for (i = 0; i < _plants.length; i++) {
                    if (_plants[i].PrevSeverity != _plants[i].Severity) {
                        material = _scene.getMaterialByName(_scope.locInfo.names.beamsMat + _plants[i].Id);
                        material.setColor3("baseColor", BABYLON.Color3.FromHexString(_plants[i].StatusColor));
                        
                        if (_plants[i].Severity == 3) {
                            highlight += 0.0003;
                            material.setFloat("highlight", highlight);
                        } else {
                            highlight = 0;

                            material.setFloat("highlight", highlight);
                        }
                        
                        _plants[i].PrevSeverity = _plants[i].Severity;
                        _plants[i].PrevStatusColor = _plants[i].StatusColor;
                    }
                }*/

                /*
                for (i = 0; i < _plants.length; i++) {
                    idEntity = _plants[i].Id;
                    statusColor = ej.DataManager(jsonTree2).executeLocal(
                    new ej.Query().where("Id", "equal", idEntity, true))[0].StatusColor;

                    for (j = 0; j < _vbles.plants.sparkles[i].info.length; j++) {
                        info = _vbles.plants.sparkles[i].info[j];
                        //_vbles.plants.sparkles[i].info[j].alpha += 0.006 * info.incAlpha;
                        ///console.log(_scene.getMeshByName(_scope.locInfo.names.cones + 1 + "-" + j + "-" + idEntity));
                        //console.log(_scope.locInfo.names.cones + 1 + "-" + j + "-" + idEntity);
                        if (_scene.getMeshByName(_scope.locInfo.names.cones + 1 + "-" + j + "-" + idEntity)) {
                            cone11 = _scene.getMeshByName(_scope.locInfo.names.cones + 1 + "-" + j + "-" + idEntity);
                            //cone11.material.alpha = info.iniAlpha;
                           // console.log(cone11.material.alpha);
                            //cone21 = _scene.getMeshByName(_scope.locInfo.names.cones + 2 + "-" + j + "-" + idEntity);

                            //_vbles.plants.sparkles[i].info[j].alpha += 0.06 * info.incAlpha;
                            
                            if (incAlpha && _vbles.plants.sparkles[i].info[j].alpha < 0.5) {
                                _vbles.plants.sparkles[i].info[j].alpha += 0.01 * info.incAlpha;
                                cone11.material.alpha = _vbles.plants.sparkles[i].info[j].alpha;
                            }
                            if (incAlpha && _vbles.plants.sparkles[i].info[j].alpha > 0.5) {
                                incAlpha = false;
                            }
                            if (!incAlpha && _vbles.plants.sparkles[i].info[j].alpha > 0.05) {
                                _vbles.plants.sparkles[i].info[j].alpha -= 0.01 * info.incAlpha;
                                cone11.material.alpha = _vbles.plants.sparkles[i].info[j].alpha;
                            }
                            if (!incAlpha && _vbles.plants.sparkles[i].info[j].alpha < 0.05) {
                                incAlpha = true;
                            }


                            cone11.material.diffuseColor = BABYLON.Color3.FromHexString(statusColor);
                            cone11.material.emissiveColor = BABYLON.Color3.FromHexString(statusColor);
                            cone11.material.specularColor = BABYLON.Color3.FromHexString(statusColor);
                            _vbles.plants.sparkles[i].info[j].incAlpha = Math.random();
                        }
                        
                        
                    }
                }
                */
            });
            

        };

        //Función para crear pedazo de torta
        _createPortion = function (idEntity, idStatus, aI, aF, parent, newPie) {

            var paths,
                color,
                ribbonStructure,
                ribbonCover1,
                ribbonCover2,
                materialPie,
                pathsCover,
                path,
                steps,
                x, y, z,
                rI, //radio Interno
                rE, //radio Externo
                aI, //ángulo inicial
                aF, //ángulo final
                hT; //altura Torta

            paths = [];
            pathsCover = [];
            rE = _cyl.d / 2;
            rI = rE * 0.1;
            aI = aI * Math.PI / 180;
            aF = aF * Math.PI / 180;
            hT = rE * 0.3;

            if (_scene.getMeshByName(_scope.locInfo.names.portion[0] + idEntity + "-" + idStatus)) {
                _scene.getMeshByName(_scope.locInfo.names.portion[0] + idEntity + "-" + idStatus).dispose();
                _scene.getMeshByName(_scope.locInfo.names.portion[1] + idEntity + "-" + idStatus).dispose();
                _scene.getMeshByName(_scope.locInfo.names.portion[2] + idEntity + "-" + idStatus).dispose();
            }


            if (aI != aF) {
                color = ej.DataManager(arrayObjectStatus).executeLocal(
                         new ej.Query().where("Id", "equal", idStatus, true))[0].Color;


                paths.push(_createPieStructure(rI, rE, aI, aF, hT));
                paths.push(_createPieStructure(rI, rE, aI, aF, 0));

                ribbonStructure = BABYLON.Mesh.CreateRibbon(_scope.locInfo.names.portion[0] + idEntity + "-" + idStatus,
                                    paths, false, true, 0, _scene, true, BABYLON.Mesh.DOUBLESIDE);
                //   { pathArray: paths, closePath: true, updatable: true }, _scene);
                ribbonStructure.parent = parent;

                materialPie = _createMaterial(idEntity + "-" + idStatus, color);
                ribbonStructure.material = materialPie;

                pathsCover = _createCover(rE, rI, aI, aF);

                ribbonCover1 = BABYLON.Mesh.CreateRibbon(_scope.locInfo.names.portion[1] + idEntity + "-" + idStatus,
                     pathsCover, false, false, 0, _scene, true, BABYLON.Mesh.DOUBLESIDE);
                // { pathArray: pathsCover, updatable: true }, _scene);
                ribbonCover2 = BABYLON.Mesh.CreateRibbon(_scope.locInfo.names.portion[2] + idEntity + "-" + idStatus,
                     pathsCover, false, false, 0, _scene, true, BABYLON.Mesh.DOUBLESIDE);
                //  { pathArray: pathsCover, updatable: true }, _scene);

                ribbonCover1.material = materialPie;
                ribbonCover1.parent = parent;
                ribbonCover2.material = materialPie;
                ribbonCover2.parent = parent;

                ribbonCover2.position.y = hT;
            }


            /*
            if (newPie) {
                paths.push(_createPieStructure(rI, rE, aI, aF, hT));
                paths.push(_createPieStructure(rI, rE, aI, aF, 0));

                ribbonStructure = BABYLON.Mesh.CreateRibbon(_scope.locInfo.names.portion[0] + idEntity + "-" + idStatus,
                                    paths, false, true, 0, _scene, true, BABYLON.Mesh.DOUBLESIDE);
                                 //   { pathArray: paths, closePath: true, updatable: true }, _scene);
                ribbonStructure.parent = parent;

                materialPie = _createMaterial(idEntity + "-" + idStatus, color);
                ribbonStructure.material = materialPie;

                pathsCover = _createCover(rE, rI, aI, aF);

                ribbonCover1 = BABYLON.Mesh.CreateRibbon(_scope.locInfo.names.portion[1] + idEntity + "-" + idStatus,
                     pathsCover, false, false, 0, _scene, true, BABYLON.Mesh.DOUBLESIDE );
                   // { pathArray: pathsCover, updatable: true }, _scene);
                ribbonCover2 = BABYLON.Mesh.CreateRibbon(_scope.locInfo.names.portion[2] + idEntity + "-" + idStatus,
                     pathsCover, false, false, 0, _scene, true, BABYLON.Mesh.DOUBLESIDE);
                  //  { pathArray: pathsCover, updatable: true }, _scene);

                ribbonCover1.material = materialPie;
                ribbonCover1.parent = parent;
                ribbonCover2.material = materialPie;
                ribbonCover2.parent = parent;

                ribbonCover2.position.y = hT;
            } else {
                console.log("aI " + aI);
                console.log("aF " + aF);
                ribbonStructure = _scene.getMeshByName(_scope.locInfo.names.portion[0] + idEntity + "-" + idStatus);
                ribbonCover1 = _scene.getMeshByName(_scope.locInfo.names.portion[1] + idEntity + "-" + idStatus);
                ribbonCover2 = _scene.getMeshByName(_scope.locInfo.names.portion[2] + idEntity + "-" + idStatus);
                console.log(paths);
                console.log(pathsCover);
                if (aI != aF) {
                    paths.push(_createPieStructure(rI, rE, aI, aF, hT));
                    paths.push(_createPieStructure(rI, rE, aI, aF, 0));
                    pathsCover = _createCover(rE, rI, aI, aF);
                    //ribbonStructure = BABYLON.MeshBuilder.CreateRibbon(null, { pathArray: paths, instance: ribbonStructure });
                    ribbonStructure = BABYLON.Mesh.CreateRibbon(null, paths, null, null, null, null, null, null, ribbonStructure);
                    //ribbonCover1 = BABYLON.MeshBuilder.CreateRibbon(null, { pathArray: pathsCover, instance: ribbonCover1 });
                    ribbonCover1 = BABYLON.Mesh.CreateRibbon(null, pathsCover, null, null, null, null, null, null, ribbonCover1);
                    //ribbonCover2 = BABYLON.MeshBuilder.CreateRibbon(null, { pathArray: pathsCover, instance: ribbonCover2 });
                    ribbonCover2 = BABYLON.Mesh.CreateRibbon(null, pathsCover, null, null, null, null, null, null, ribbonCover2);

                } else {
                    ribbonStructure.visibility = false;
                    ribbonCover1.visibility = false;
                    ribbonCover2.visibility = false;
                }
                

                
            }
            */


            //	ribbon = BABYLON.MeshBuilder.CreateRibbon(null, {pathArray: myPaths2, instance: ribbon} ); 

        };

        _createBase = function () {

            var i, boxLocation,
                material,
                width,
                height;

            _base.w = (_cols + 1) * _cube.w * _spacePercent + _cols * _cube.w;
            _base.d = (_rows + 1) * _cube.d * _spacePercent + _rows * _cube.d;

            boxLocation = BABYLON.MeshBuilder.CreateBox("boxPpal", { height: 1, width: _base.w, depth: _base.d }, scene);
            //planeLocation = BABYLON.MeshBuilder.CreatePlane("planeLocation", { width: width, height: height }, _scene);

            
            boxLocation.material = new BABYLON.StandardMaterial("matBoxPpal", _scene);
            boxLocation.material.diffuseColor = BABYLON.Color3.FromHexString("#222222");
            boxLocation.material.emissiveColor = BABYLON.Color3.FromHexString("#222222");
            boxLocation.material.specularColor = BABYLON.Color3.FromHexString("#222222");
            boxLocation.material.alpha = 0.5;
            
            var myPoints = [
                new BABYLON.Vector3(-_base.w / 2, 0, _base.d / 2),
                new BABYLON.Vector3(-_base.w / 2, 0, -_base.d / 2),
                new BABYLON.Vector3(_base.w / 2, 0, -_base.d / 2),
                new BABYLON.Vector3(_base.w / 2, 0, _base.d / 2),
                new BABYLON.Vector3(-_base.w / 2, 0, _base.d / 2)
            ];
            var lines = BABYLON.MeshBuilder.CreateLines("lines", { points: myPoints, updatable: true }, scene);
            lines.color = BABYLON.Color3.FromHexString("#444499");

            //material = _createMaterial("matBoxPpal", "#888888");
            //boxLocation.material.diffuseFresnelParameters.bias = 1;
            //boxLocation.material = material;
            plane = boxLocation;
            //pla
        };

        _createNameCompanyCanvas = function (name, text, pos) {

            var textureResolution,
                textureGround,
                textureContext,
                materialPlane,
                dT, sizeText,
                posText,
                cX, cY,
                hexSize;

            hexSize = _hexPercent * _cyl.d;

            plane = BABYLON.MeshBuilder.CreatePlane(_scope.locInfo.names.hex + name, { width: hexSize, height: hexSize, subdivisions: 25 }, _scene);
            plane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;

            textureResolution = cX = cY = hexSize;
            textureGround = new BABYLON.DynamicTexture("dynamicTexture-" + name, textureResolution, _scene);
            textureGround.hasAlpha = true;
            textureContext = textureGround.getContext();

            materialPlane = new BABYLON.StandardMaterial("Mat-" + name, _scene);
            materialPlane.diffuseTexture = textureGround;
            materialPlane.diffuseColor = new BABYLON.Color3(0, 1, 0);

            materialPlane.diffuseTexture.level = 2;
            materialPlane.specularColor = new BABYLON.Color3(0, 0, 0);
            materialPlane.emissiveColor = new BABYLON.Color3(1, 1, 1);
            plane.material = materialPlane;

            textureContext.beginPath();
            textureContext.moveTo(cX / 2, 0);
            textureContext.lineTo(cX, cY / 4);
            textureContext.lineTo(cX, 3 * cY / 4);
            textureContext.lineTo(cX / 2, cY);
            textureContext.lineTo(0, 3 * cY / 4);
            textureContext.lineTo(0, cY / 4);
            textureContext.moveTo(cX / 2, 0);
            textureContext.fillStyle = "black";
            textureContext.fill();
            textureGround.update();

            dT = materialPlane.diffuseTexture;
            dT.drawText(text, null, hexSize * 0.6, "bold " + hexSize * 0.4 + "px  Calibri", "#ffffff", null);

            plane.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);

            _hexArray.push({ mesh: plane, iniPos: pos.y, incPosY: Math.random() + 0.5, alpha: Math.random() });

            _vbles.plants.hex.push(plane);

            return plane;
        };

        _createCompleteNameCompanyCanvas = function (name, text, pos) {

            var textureResolution,
                textureGround,
                textureContext,
                materialPlane,
                dT, sizeText,
                posText,
                cX, cY,
                canvasSize;

            canvasSize = 4 * _cyl.d;

            plane = BABYLON.MeshBuilder.CreatePlane(_scope.locInfo.names.namePlant + name, { width: canvasSize, height: canvasSize, subdivisions: 25 }, _scene);
            plane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;

            textureResolution = cX = cY = canvasSize;
            textureGround = new BABYLON.DynamicTexture("completeDynamicTexture-" + name, textureResolution, _scene);
            textureGround.hasAlpha = true;
            textureContext = textureGround.getContext();

            materialPlane = new BABYLON.StandardMaterial("MatPlane-" + name, _scene);
            materialPlane.diffuseTexture = textureGround;
            materialPlane.diffuseColor = new BABYLON.Color3(0, 1, 0);

            materialPlane.diffuseTexture.level = 2;
            materialPlane.specularColor = new BABYLON.Color3(0, 0, 0);
            materialPlane.emissiveColor = new BABYLON.Color3(1, 1, 1);
            plane.material = materialPlane;
            plane.isPickable = false;

            dT = materialPlane.diffuseTexture;
            dT.drawText(text, null, canvasSize * 0.9, "bold " + canvasSize * 0.1 + "px  Calibri", "#ffffff", null);

            plane.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);
            plane.visibility = false;
            _vbles.plants.text.push(plane);

            return plane;

        };

        _locateCamera = function () {

            _scene.activeCamera.target.y = _cube.h * 1.2;
            _scene.activeCamera.beta = 60 * Math.PI / 180;
            _scene.activeCamera.alpha = 360 * Math.PI / 180;
            _scene.activeCamera.radius = _base.d * 1.5;
        };

        _createMaterial = function (name, color) {

            var material;

            material = new BABYLON.StandardMaterial("mat" + name, _scene);
            material.emissiveColor = BABYLON.Color3.FromHexString(color);
            material.diffuseColor = BABYLON.Color3.FromHexString(color);
            material.specularColor = BABYLON.Color3.FromHexString(color);
            material.alpha = 0.5;
            
            material.backFaceCulling = true;
            material.specularPower = 64;
            material.alpha = 0.5;
            //material.alphaMode = 1;
            
            material.diffuseFresnelParameters = new BABYLON.FresnelParameters();
            material.diffuseFresnelParameters.power = 2;
            material.diffuseFresnelParameters.bias = 0.5;
            material.diffuseFresnelParameters.leftColor = BABYLON.Color3.FromHexString(color);
            material.diffuseFresnelParameters.rightColor = BABYLON.Color3.FromHexString(color);

            material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
            material.emissiveFresnelParameters.power = 2;
            material.emissiveFresnelParameters.bias = 0.5;
            material.emissiveFresnelParameters.leftColor = BABYLON.Color3.FromHexString(color);
            material.emissiveFresnelParameters.rightColor = BABYLON.Color3.FromHexString(color);

            
            return material;
        };

        _createPieStructure = function (rI, rE, aI, aF, hT) {

            var path,
                steps, i,
                x, y, z;

            path = [];

            steps = 2 * Math.PI / (180 * (aF - aI));

            for (i = aF; i >= aI; i -= steps) {
                x = rI * Math.cos(i);
                y = hT;
                z = rI * Math.sin(i);
                path.push(new BABYLON.Vector3(x, y, z));
            }


            for (i = aI; i <= aF; i += steps) {
                x = rE * Math.cos(i);
                y = hT;
                z = rE * Math.sin(i);
                path.push(new BABYLON.Vector3(x, y, z));
            }

            path.push(path[0]);

            return path;
        };

        _createCover = function (rE, rI, aI, aF) {

            var path,
                paths,
                steps,
                x, y,
                z, i;

            path = [];
            paths = [];

            steps = 2 * Math.PI / (180 * (aF - aI));

            for (i = aI; i <= aF; i += steps) {
                x = rI * Math.cos(i);
                y = 0;
                z = rI * Math.sin(i);
                path.push(new BABYLON.Vector3(x, y, z));
            }
            paths.push(path);

            path = [];

            for (i = aI; i <= aF; i += steps) {
                x = rE * Math.cos(i);
                y = 0;
                z = rE * Math.sin(i);
                path.push(new BABYLON.Vector3(x, y, z));
            }
            paths.push(path);

            return paths;
        };

        _loadPlants = function () {

            var jsonTree2;

            jsonTree2 = entities;

            _plants = ej.DataManager(jsonTree2).executeLocal(
                        new ej.Query().where(ej.Predicate("IsPlant", "equal", true, true).
                        and("ParentId", "equal", "1", true)));


            _plants = _plants.sort(function (a, b) {
                var textA = a.Name.toUpperCase();
                var textB = b.Name.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });

            for (var i = 0; i < _plants.length; i++) {
                _plants[i].PrevSeverity = _plants[i].Severity;
                _plants[i].PrevStatusColor = _plants[i].StatusColor;
            }

            _cubeQty = _plants.length;
        };

        _calculateRowsCols = function (idEntity) {

            var sqrt;

            sqrt = Math.sqrt(_cubeQty);
            _cols = Math.ceil(sqrt);
            _rows = Math.round(sqrt);
        };

        _calculateStatusPercentage = function (entityChildren) {

            var statusPercentage,
                status,
                pie,
                i, j;

            var jsonTree2 = entities;

            status = [];

            pie = _scene.getMeshByName(_scope.locInfo.names.pie + entityChildren[0].ParentId);

            for (i = 0; i < arrayObjectStatus.length; i++) {

                status.push({
                    id: arrayObjectStatus[i].Id,
                    severity: arrayObjectStatus[i].Severity,
                    qty: 0,
                    per: 0,
                    aI: 0,
                    aF: 0
                });
            }

            for (i = 0; i < entityChildren.length; i++) {
                for (j = 0; j < status.length; j++) {
                    if (entityChildren[i].Severity == status[j].severity) {
                        status[j].qty++;
                    }
                }
            }

            for (i = 0; i < status.length; i++) {
                status[i].per = status[i].qty / entityChildren.length;
                if (i == 0) {
                    status[i].aI = 0;
                    status[i].aF = status[i].per * 360;
                } else {
                    status[i].aI = status[i - 1].aF;
                    status[i].aF = status[i].aI + status[i].per * 360;
                }
                _createPortion(entityChildren[0].ParentId, status[i].id, status[i].aI, status[i].aF, pie, false);
            }

            console.log(status);

            return status;

        };

        _createPie = function (idEntity) {

            var i, j,
                pie,
                portion,
                idStatus,
                numStatus,
                severity,
                status;

            status = [];
            numStatus = arrayObjectStatus.length;

            pie = BABYLON.MeshBuilder.CreateBox(_scope.locInfo.names.pie + idEntity, { height: 1, width: 1, depth: 1 }, _scene);
            pie.visibility = false;

            for (i = 0; i < arrayObjectStatus.length; i++) {
                idStatus = arrayObjectStatus[i].Id;
                portion = _createPortion(idEntity, idStatus, i * (360 / numStatus), (i + 1) * (360 / numStatus), pie, true);
            }

            return pie;

        };

        //"lineConexion-" "lineHex-" "hex-" "lineHex-"
        
        _createPies = function (array, geoLocType) {

            var rInt, //radio Interno hexagono
                rExt, //radio Externo Hexagono
                dCHexTodCCyl, //Distancia centro Hexàgono a distancia centro cilindro
                qtyHex,
                hCyl,
                rCyl,
                cyl,
                qty,
                pie,
                idEntity,
                spaceExt,
                spaceCyl,
                angle,
                arrayPies,
                arrayNameCompany,
                arrayCompleteNameCompany,
                arraySparkles,
                shortNameEntity,
                nameEntity,
                actualRadInt,
                actualRadExt,
                dCHexToCCyl, //Distancia del centro del hexagono al centro del Cylindro
                pieAngle,
                numCylForHex,
                angleQtyHex,
                pointsHex,
                indsHex,
                colsHex,
                hexBase,
                cylinders,
                posX,
                posY,
                posZ,
                i, j,
                count;

            qty = array.length;
            qtyHex = Math.ceil(qty / 6); //Cantidad de repeticiones de hexàgono
            count = 0;

            rCyl = _cyl.d;
            hCyl = _cyl.h;
            spaceExt = 0.2 * rCyl;
            spaceCyl = 0.1 * rCyl;
            cylinders = [];
            arrayPies = [];
            arrayNameCompany = [];
            arrayCompleteNameCompany = [];
            arraySparkles = [];

            if (qty > 0) {

                for (i = 0; i < qtyHex; i++) {
                    if (i == 0) {
                        if (qty != 6) {
                            numCylForHex = qty % 6;
                        } else {
                            numCylForHex = 6;
                        }

                        if (qty % 6 != 0) {
                            angle = (360 / (qty % 6)) * Math.PI / 180;
                        } else {
                            angle = 60 * Math.PI / 180;
                        }
                    } else {
                        numCylForHex = 6;
                        angle = 60 * Math.PI / 180;
                    }

                    switch (numCylForHex) {
                        case 1:
                            dCHexToCCyl = 0;
                            break;
                        case 2:
                        case 3:
                            dCHexToCCyl = rCyl;
                            break;
                        default:
                            if (i > 0) {
                                dCHexToCCyl = (Math.PI - angle) * (rCyl + spaceCyl) / (2 * angle);
                            } else {
                                dCHexToCCyl = (Math.PI - angle) * (rCyl + spaceCyl) / (angle);
                            }
                    }

                    actualRadInt = dCHexToCCyl + (rCyl + spaceCyl) * (i + 1);
                    actualRadExt = actualRadInt / Math.sin(60 / (Math.PI / 180));

                    for (j = 0; j < numCylForHex; j++) {
                        idEntity = array[count].id;
                        shortNameEntity = array[count].name.slice(0, 3).toUpperCase();
                        nameEntity = array[count].name.toUpperCase();
                        pieAngle = angle * j;
                        if (i % 2 != 0) {
                            pieAngle = angle * j + 30 * Math.PI / 180;
                        }
                        posX = dCHexToCCyl * Math.cos(pieAngle);
                        posY = hCyl;
                        posZ = dCHexToCCyl * Math.sin(pieAngle);

                        pie = _createPie(idEntity);

                        pie.position = new BABYLON.Vector3(posX, posY, posZ);

                        arrayNameCompany.push(_createNameCompanyCanvas(idEntity, shortNameEntity,
                                                    { x: posX, y: _cyl.d * 2, z: posZ }));
                        arrayCompleteNameCompany.push(_createCompleteNameCompanyCanvas(idEntity, nameEntity,
                            { x: posX, y: posY + _cyl.d * 3.5 * 2, z: posZ }));

                        _plantsArray.push(pie);
                        arrayPies.push(pie);
                        _vbles.plants.shape.push(pie);
                        arraySparkles.push(_createBeams(idEntity, { x: posX, y: _cyl.d, z: posZ }, BABYLON.Color3.FromHexString(array[count].statusColor)));
                        //arraySparkles.push(_createSparkles(idEntity, { x: posX, y: _cyl.d, z: posZ }));

                        /*

                        if (count < _plants.length) {
                        shortNameEntity = _plants[count].Name.slice(0, 3).toUpperCase();
                        nameEntity = _plants[count].Name.toUpperCase();
                        idEntity = _plants[count].Id;
                        posX = -_base.w / 2 + _spacePercent * _cube.w + _cube.w / 2 + (_cube.w + _spacePercent * _cube.w) * j;
                        posZ = _base.d / 2 - _spacePercent * _cube.w - _cube.w / 2 - (_cube.d + _spacePercent * _cube.d) * i;

                        pie = _createPie(_plants[count].Id);
                    }
                    pie.position = new BABYLON.Vector3(posX, posY, posZ);

                        _createNameCompanyCanvas(idEntity, shortNameEntity,
                            { x: posX, y: _cube.h, z: posZ });
                        _createCompleteNameCompanyCanvas(idEntity, nameEntity,
                            { x: posX, y: posY + _cube.h * 3.5, z: posZ });
                        _plantsArray.push(pie);
                        _vbles.plants.shape.push(pie);
                        _createSparkles(idEntity, { x: posX, y: _cube.h, z: posZ });*/

                        /*
                        cyl = new BABYLON.MeshBuilder.CreateCylinder("cyl-" + idEntity, { diameterTop: rCyl, diameterBottom: rCyl, height: hCyl, tessellation: 32 }, scene);
                        cyl.position = new BABYLON.Vector3(posX, posY, posZ);
                        cylinders.push(cyl);*/
                        count++;
                    }
                }
            }

            hexBase = _createHexagons(geoLocType, actualRadExt,
                { arrayPies: arrayPies, arrayNameCompany: arrayNameCompany, arrayCompleteNameCompany: arrayCompleteNameCompany, arraySparkles: arraySparkles });

            //

            return hexBase;
        };

        _createHexagons = function (geoLocType, rExt, arrays) {

            var i, angle,
                pointsHex,
                pathLine,
                lineHex,
                indHex,
                colHex,
                line,
                angle,
                colorHex,
                indexVert,
                vertexData,
                arrayPies,
                arrayNameCompany,
                arrayCompleteNameCompany,
                arraySparkles,
                hexagon;
            
            arrayPies = arrays.arrayPies;
            arrayNameCompany = arrays.arrayNameCompany;
            arrayCompleteNameCompany = arrays.arrayCompleteNameCompany;
            arraySparkles = arrays.arraySparkles;
            pointsHex = [];
            pathLine = [];
            indHex = [];
            colHex = [];
            indexVert = 0;
            angle = 60 * Math.PI / 180;
            colorHex = BABYLON.Color3.FromHexString("#002b35");

            for (i = 0; i < 6; i++) {
                pointsHex.push(0, 0, 0,
                    rExt * Math.cos(angle * i), 0, rExt * Math.sin(angle * i),
                    rExt * Math.cos(angle * (i + 1)), 0, rExt * Math.sin(angle * (i + 1)));
                indHex.push(indexVert, indexVert + 1, indexVert + 2);
                colHex.push(colorHex.r, colorHex.g, colorHex.b, 1,
                                colorHex.r, colorHex.g, colorHex.b, 1,
                                colorHex.r, colorHex.g, colorHex.b, 1);
                pathLine.push(new BABYLON.Vector3(rExt * Math.cos(angle * i), 0, rExt * Math.sin(angle * i)));
                indexVert += 3;
            }
            pathLine.push(new BABYLON.Vector3(rExt * Math.cos(0), 0, rExt * Math.sin(0)));

            hexagon = new BABYLON.Mesh("hex-" + geoLocType, scene);
            hexagon.material = new BABYLON.StandardMaterial("matHex" + geoLocType, scene);
            hexagon.material.backFaceCulling = false;
            hexagon.material.specularColor = new BABYLON.Color3(0, 0, 0);
            hexagon.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            hexagon.material.freeze();
            hexagon.alphaIndex = 4000;

            vertexData = new BABYLON.VertexData();

            vertexData.positions = pointsHex;
            vertexData.indices = indHex;
            vertexData.colors = colHex;

            vertexData.applyToMesh(hexagon, 1);

            line = BABYLON.Mesh.CreateLines("lineHex-" + geoLocType, pathLine, scene, true);
            line.parent = hexagon;
            line.color = BABYLON.Color3.FromHexString("#7feaff");

            for (i = 0; i < arrayPies.length; i++) {
                arrayPies[i].parent = hexagon;
                arrayNameCompany[i].parent = hexagon;
                arrayCompleteNameCompany[i].parent = hexagon;
                arraySparkles[i].parent = hexagon;

            }

            return hexagon;
        };

        _distributeGeoLocation = function () {

            var geoLocType,
                centerRadius,
                distance,
                distanceFromCenter,
                angle,
                radius,
                hexBases,
                array,
                mesh,
                type,
                posX,
                posY,
                posZ,
                i;

            hexBases = [];

            for (i = 0; i < entities.length; i++) {
                if (entities[i].GeoLoc) {
                    geoLocType = entities[i].GeoLoc;
                    _arrayGeoLocType[geoLocType].push({
                        id: entities[i].Id,
                        name: entities[i].Name,
                        statusColor: entities[i].StatusColor
                    });
                }
            }

            for (i = 0; i < arrayGeoLoc.length; i++) {
                type = arrayGeoLoc[i];

                array = _arrayGeoLocType[type];
                mesh = _createPies(array, type);
                radius = mesh._boundingInfo.maximum.x / 2;
                if (i == 0) {
                    centerRadius = radius;
                    distanceFromCenter = 0;
                } else {
                    distanceFromCenter = (centerRadius + radius) * (4 + Math.random() / 2);
                    _createConexionLines(type, (30 * Math.PI / 180) + i * 60 * Math.PI / 180, centerRadius, radius, distanceFromCenter);
                }

                hexBases.push({
                    mesh: mesh,
                    angle: 30 * Math.PI / 180 + i * 60 * Math.PI / 180,
                    radius: radius,
                    distance: distanceFromCenter
                });
            }

            for (i = 0; i < hexBases.length; i++) {
                mesh = hexBases[i].mesh;
                angle = hexBases[i].angle;
                radius = hexBases[i].radius;
                distance = hexBases[i].distance;

                posX = distance * Math.cos(angle);
                posZ = distance * Math.sin(angle);

                mesh.position = new BABYLON.Vector3(posX, 0, posZ);
            }
            _animations();

        };

        _createConexionLines = function (type, angle, centerRad, meshRad, distance) {

            var path,
                p1,
                p2,
                line,
                x,
                y,
                z;

            x = 2 * centerRad * Math.sin(60 * Math.PI / 180) * Math.cos(angle);
            z = 2 * centerRad * Math.sin(60 * Math.PI / 180) * Math.sin(angle);
            p1 = new BABYLON.Vector3(x, 0, z);

            x = (-centerRad + distance - meshRad * Math.sin(60 * Math.PI / 180)) * Math.cos(angle);
            z = (-centerRad + distance - meshRad * Math.sin(60 * Math.PI / 180)) * Math.sin(angle);
            p2 = new BABYLON.Vector3(x, 0, z);

            line = BABYLON.Mesh.CreateDashedLines("lineConexion-" + type, [p1, p2], 10, 5, 10, scene, true);
            line.color = BABYLON.Color3.FromHexString("#8ffbff");
        };

        /*
        _createPies = function () {

            var i, j,
                plantChildren,
                count,
                idEntity,
                nameEntity,
                nameEntity,
                shortNameEntity,
                pie,
                posX,
                posY,
                posZ;

            var jsonTree2 = entities;
            count = 0;

            posY = _cube.d * 0.15 / 2;
            for (i = 0; i < _rows; i++) {
                for (j = 0; j < _cols; j++) {
                    if (count < _plants.length) {
                        shortNameEntity = _plants[count].Name.slice(0, 3).toUpperCase();
                        nameEntity = _plants[count].Name.toUpperCase();
                        idEntity = _plants[count].Id;
                        posX = -_base.w / 2 + _spacePercent * _cube.w + _cube.w / 2 + (_cube.w + _spacePercent * _cube.w) * j;
                        posZ = _base.d / 2 - _spacePercent * _cube.w - _cube.w / 2 - (_cube.d + _spacePercent * _cube.d) * i;

                        pie = _createPie(_plants[count].Id);
                    }
                    pie.position = new BABYLON.Vector3(posX, posY, posZ);

                    _createNameCompanyCanvas(idEntity, shortNameEntity,
                        { x: posX, y: _cube.h, z: posZ });
                    _createCompleteNameCompanyCanvas(idEntity, nameEntity,
                        { x: posX, y: posY + _cube.h * 3.5, z: posZ });
                    _plantsArray.push(pie);
                    _vbles.plants.shape.push(pie);
                    _createSparkles(idEntity, { x: posX, y: _cube.h, z: posZ });

                    // plants(count).
                    count++;

                }
            }


            _animations();
        };*/

        /*
        _createSparkles = function (idEntity, pos) {

            var i,
                material,
                numSparkles,
                parent,
                scaleXZ,
                cone1,
                cone2,
                cone11,
                cone21,
                numSmin,
                numSmax,
                posX,
                posY,
                posZ;

            numSmin = 8;
            numSmax = 12;
            numSparkles = Math.round(Math.random() * (numSmax - numSmin) + numSmin);

            parent = BABYLON.MeshBuilder.CreateBox("sparkleParent" + idEntity, { height: 1, width: 1, depth: 1 }, _scene);

            cone1 = BABYLON.MeshBuilder.CreateCylinder(_scope.locInfo.names.cones + 1, { diameterTop: _cyl.d * 0.08, height: 1.5 * _cyl.d, tessellation: 3 }, _scene);
            cone1.position.y = 1.5 * _cyl.d / 2 + 0.15 * _cube.h;
            cone2 = BABYLON.MeshBuilder.CreateCylinder(_scope.locInfo.names.cones + 2, { diameterBottom: _cyl.d * 0.08, height: 1.5 * _cyl.d, tessellation: 3 }, _scene);
            cone2.position.y = 3 * 1.5 * _cyl.d / 2 + 0.15 * _cube.h;;

            cone1.visibility = cone2.visibility = false;


            _vbles.plants.sparkles.push({
                qty: numSparkles,
                idEntity: idEntity,
                info: []
            });

            for (i = 0; i < numSparkles; i++) {
                cone11 = new Object(cone1.clone(_scope.locInfo.names.cones + 1 + "-" + i, cone11));
                cone21 = new Object(cone2.clone(_scope.locInfo.names.cones + 2 + "-" + i, cone21));
                cone11.name = _scope.locInfo.names.cones + 1 + "-" + i + "-" + idEntity;
                cone21.name = _scope.locInfo.names.cones + 2 + "-" + i + "-" + idEntity;
                cone11.parent = parent;
                cone21.parent = parent;
                cone11.visibility = cone21.visibility = true;
                scaleXZ = Math.random();

                posX = Math.round(Math.random() * (_cyl.d) - _cyl.d / 2) * 0.8;
                posZ = Math.round(Math.random() * (_cyl.d) - _cyl.d / 2) * 0.2;

                cone11.position.x = posX + pos.x;
                cone11.position.z = posZ + pos.z;
                cone21.position.x = posX + pos.x;
                cone21.position.z = posZ + pos.z;
                cone11.scaling.x = cone21.scaling.x = scaleXZ;
                cone11.scaling.z = cone21.scaling.z = scaleXZ;

                cone11.material = new BABYLON.StandardMaterial("Mat-" + _scope.locInfo.names.cones + 1 + "-" + i, _scene);
                cone21.material = new BABYLON.StandardMaterial("Mat-" + _scope.locInfo.names.cones + 2 + "-" + i, _scene);

                cone11.material.alpha = 0.1;
                cone21.material.alpha = 0.1;

                _vbles.plants.sparkles[_vbles.plants.sparkles.length - 1].info.push({
                    incAlpha: Math.random() * 0.01,
                    iniAlpha: Math.random() * 0.4 + 0.1,
                    alpha: 0
                });
            }

            return parent;
        };
        */


        _createBeamMaterial = function (name) {

            var shaderMaterial = new BABYLON.ShaderMaterial(
					_scope.locInfo.names.beamsMat + name,
					_scene,
                    {
                        vertex: "beams",
                        fragment: "beams",
                    },
					{
					    attributes: ["position", "uv"],
					    uniforms: ["worldViewProjection", "time", "baseColor", "highlight"],
					    needAlphaBlending: true
					}
				);

            shaderMaterial.setFloat("time", Math.random() * 2);
            shaderMaterial.setFloat("highlight", 0);
            shaderMaterial.setColor3("baseColor", new BABYLON.Color3(0.4, 0.02, 0.8));
            shaderMaterial.backFaceCulling = true;
            shaderMaterial.checkReadyOnEveryCall = true;
            _scope.locInfo.materials.beams.push(shaderMaterial);
            /*| 
            var animation = new BABYLON.Animation("cameraAnimation", "_floats.highlights", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);



            scene.beginDirectAnimation(shaderMaterial, [animation], 0, 120, false, 1);*/

            //this.beams_material.setFloat("time", time);
            /*
            shaderMaterial.onBind = function (material, mesh) {
                if (mesh.hasOwnProperty('beam_color')) {
                    material._effect.setColor3("baseColor", mesh['beam_color']);
                }

                if (mesh.hasOwnProperty('highlight')) {
                    material._effect.setFloat("highlight", mesh['highlight']);
                } else {
                    material._effect.setFloat("highlight", 0.0);
                }
            };*/


            //_scope.locInfo.materials.beams = shaderMaterial;
            /*
            _scope.locInfo.materials.beams.onBindObservable.add(function (material, mesh) {
                if (mesh.hasOwnProperty('beam_color')) {
                    material._effect.setColor3("baseColor", mesh['beam_color']);
                }

                
            });
            */
            return shaderMaterial;


        };

        _createBeams = function (idEntity, pos, color) {

            var beamMesh,
                mixColor;

            beamMesh = BABYLON.Mesh.CreatePlane(_scope.locInfo.names.beams + idEntity, 1, scene);
            beamMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;

            // beamMesh.material = _scope.locInfo.materials.beams;
            beamMesh.material = _createBeamMaterial(idEntity);
            //beamMesh.parent = parent;
            beamMesh.position = new BABYLON.Vector3(pos.x, pos.y + _cyl.d / 2 + _cyl.h * 2, pos.z);
            beamMesh.scaling.x = _cyl.d;
            beamMesh.scaling.y = 4 * _cyl.d;

            beamMesh.material.setColor3("baseColor", color);
            //mixColor = color.clone();

            //beamMesh.beam_color = mixColor;

            console.log(beamMesh);

            return beamMesh;
        }   
        /*
        _createSparkles = function (idEntity, pos) {

            var i,
                material,
                numSparkles,
                parent,
                scaleXZ,
                cone1,
                cone2,
                cone11,
                cone21,
                light,
                light1,
                numSmin,
                numSmax,
                posX,
                posY,
                posZ;

            numSmin = 4;
            numSmax = 8;
            numSparkles = Math.round(Math.random() * (numSmax - numSmin) + numSmin);

            parent = BABYLON.MeshBuilder.CreateBox("sparkleParent" + idEntity, { height: 1, width: 1, depth: 1 }, _scene);
            parent.visibility = false;
            light = createLightVertex("light");
            
            light.visibility = false;

            /*
            cone1 = BABYLON.MeshBuilder.CreateCylinder(_scope.locInfo.names.cones + 1, { diameterTop: _cyl.d * 0.08, height: 1.5 * _cyl.d, tessellation: 3 }, _scene);
            cone1.position.y = 1.5 * _cyl.d / 2 + 0.15 * _cube.h;
            cone2 = BABYLON.MeshBuilder.CreateCylinder(_scope.locInfo.names.cones + 2, { diameterBottom: _cyl.d * 0.08, height: 1.5 * _cyl.d, tessellation: 3 }, _scene);
            cone2.position.y = 3 * 1.5 * _cyl.d / 2 + 0.15 * _cube.h;;

            cone1.visibility = cone2.visibility = false;
            */
        /*
            _vbles.plants.sparkles.push({
                qty: numSparkles,
                idEntity: idEntity,
                info: []
            });

            for (i = 0; i < 12; i++) {
                
                cone11 = new Object(cone1.clone(_scope.locInfo.names.cones + 1 + "-" + i, cone11));
                cone21 = new Object(cone2.clone(_scope.locInfo.names.cones + 2 + "-" + i, cone21));
                cone11.name = _scope.locInfo.names.cones + 1 + "-" + i + "-" + idEntity;
                cone21.name = _scope.locInfo.names.cones + 2 + "-" + i + "-" + idEntity;
                cone11.parent = parent;
                cone21.parent = parent;
                cone11.visibility = cone21.visibility = true;
                
                light1 = new Object(light.clone(_scope.locInfo.names.cones + 1 + "-" + i, light1));
                light1.name = _scope.locInfo.names.cones + 1 + "-" + i + "-" + idEntity;
                light1.visibility = true;
                light1.parent = parent;
                light1.scaling.y = 3.5 * _cyl.d;
                scaleXZ = Math.random() * 2 + 1;

                posX = Math.round(Math.random() * (_cyl.d) - _cyl.d / 2) * 0.8;
                //posZ = Math.round(Math.random() * (_cyl.d) - _cyl.d / 2) * 0.2;

                light1.position.x = posX + pos.x;
                //light1.position.z = posZ + pos.z;
                light1.scaling.x = scaleXZ * 2;
                light1.position.x = -_cyl.d / 2 * (i + 1) * 1.1 * _cyl.d / 12;
                //light1.scaling.z = cone21.scaling.z = scaleXZ;

                light1.material = new BABYLON.StandardMaterial("Mat-" + _scope.locInfo.names.cones + 1 + "-" + i, _scene);

                light1.material.alpha = Math.random() * 0.5 + 0.05;
                light1.material.alphaMode = 1;
                _vbles.plants.sparkles[_vbles.plants.sparkles.length - 1].info.push({
                    incAlpha: Math.random() * 0.01,
                    iniAlpha: light1.material.alpha,
                    alpha: light1.material.alpha
                });
            }

            return parent;
        };*/

        _simulateStatesChange = function () {

           

            

            setInterval(function () {

                changeStatus();


            }, 3000);
        };

        var changeStatus = function () {

            var states,
               material,
               severity,
               statusColor,
               severityRandom;

            for (var i = 0; i < _plants.length; i++) {

                severityRandom = Math.floor(Math.random() * 5);
                statusColor = ej.DataManager(arrayObjectStatus).executeLocal(
                    new ej.Query().where(ej.Predicate("Severity", "equal", severityRandom, true)))[0].Color;
                _plants[i].Severity = severityRandom;
                _plants[i].StatusColor = statusColor;

                if (_plants[i].PrevSeverity != severityRandom) {
                    material = _scene.getMaterialByName(_scope.locInfo.names.beamsMat + _plants[i].Id);
                    material.setColor3("baseColor", BABYLON.Color3.FromHexString(statusColor));
                    if (severityRandom == 3) {

                    }
                    _plants[i].PrevSeverity = _plants[i].Severity;
                    _plants[i].StatusColor = statusColor;
                }

                

                

            }
        };

        _createShapes = function (type) {

            var i, j,
                count,
                idEntity,
                nameEntity,
                shortNameEntity,
                statusColor,
                posX,
                posY,
                posZ,
                posIniX,
                posIniZ,
                shape;

            posY = _cube.h / 2;
            count = 0;

            for (i = 0; i < _rows; i++) {
                for (j = 0; j < _cols; j++) {
                    if (count < _cubeQty) {
                        shortNameEntity = _plants[count].Name.slice(0, 3).toUpperCase();
                        nameEntity = _plants[count].Name.toUpperCase();
                        idEntity = _plants[count].Id;
                        posX = -_base.w / 2 + _spacePercent * _cube.w + _cube.w / 2 + (_cube.w + _spacePercent * _cube.w) * j;
                        posZ = _base.d / 2 - _spacePercent * _cube.w - _cube.w / 2 - (_cube.d + _spacePercent * _cube.d) * i;

                        switch (type) {
                            case "sphere":
                                shape = BABYLON.MeshBuilder.CreateSphere("sphere-" + _scope.locInfo.names + idEntity,
                                { segments: 16, diameter: _cube.d }, _scene);
                                break;
                            case "cube":
                                shape = BABYLON.MeshBuilder.CreateBox("cube-" + _scope.locInfo.names + idEntity,
                                { height: _cube.h, width: _cube.w, depth: _cube.d }, _scene);
                                shape.showBoundingBox = true;
                                _scene.getBoundingBoxRenderer().frontColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                                _scene.getBoundingBoxRenderer().backColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                                break;
                        }

                        statusColor = _plants[count].StatusColor;
                        shape.position = new BABYLON.Vector3(posX, posY, posZ);
                        shape.material = _createMaterial("mat-" + _scope.locInfo.names + idEntity);
                        shape.material.diffuseColor = BABYLON.Color3.FromHexString(statusColor);
                        _createNameCompanyCanvas(_scope.locInfo.names + idEntity, shortNameEntity,
                            { x: posX, y: posY, z: posZ });
                        _createCompleteNameCompanyCanvas(_scope.locInfo.names + idEntity, nameEntity,
                            { x: posX, y: posY + _cube.h * 3.5, z: posZ });
                        _plantsArray.push(shape);
                        _vbles.plants.shape.push(shape);
                        count++;
                    }
                }
            }
            _animateHexagon();
        };

        /*
                _animateMaterial = function () {

            var up, i,
                opacity,
                maxOpacity,
                minOpacity,
                incOpacity;

            up = true;

            opacity = 0.5;

            scene.beforeRender = function () {

                for (i = 0; i < _plantsArray.length; i++) {

                    minOpacity = 0.4;
                    maxOpacity = 0.8;
                    incOpacity = Math.random() * (maxOpacity - minOpacity) + minOpacity;
                    if (up && opacity <= maxOpacity) {
                        _plantsArray[i].material.alpha = opacity;
                        opacity += incOpacity * 0.00001;
                    }
                    if (up && opacity > maxOpacity) {
                        up = false;
                    }
                    if (!up && opacity >= minOpacity) {
                        _plantsArray[i].material.alpha = opacity;
                        opacity -= incOpacity * 1 / (_cubeQty * 10);
                    }
                    if (!up && opacity < minOpacity) {
                        up = true;
                    }
                }
            };

        };
        _createPiece2_4 = function (rG, aI, aF, sG, hT) {

            var path,
                steps, i,
                x, y, z;

            path = [];
            steps = 2 * Math.PI / sG;

            for (i = aF; i >= aI; i -= steps) {
                x = rG * Math.cos(i);
                y = hT;
                z = rG * Math.sin(i);
                path.push(new BABYLON.Vector3(x, y, z));
            }

            for (i = aI; i <= aF; i += steps) {
                x = rG * Math.cos(i);
                y = 0;
                z = rG * Math.sin(i);
                path.push(new BABYLON.Vector3(x, y, z));
            }

            path.push(path[0]);

            return path;
        };
        */
        /*
        _createRibbon = function (name, pos) {

            var paths = [];
            var disp = 10;
            var radius = 100;
            var steps = 60;
            var step = 2 * Math.PI / steps;
            var circle = [];

            for (var i = 0; i < Math.PI ; i += step) {
                var x = radius * Math.cos(i) + disp;
                var y = radius * Math.sin(i);
                var z = 0;
                circle.push(new BABYLON.Vector3(x, y, z));
            }

            var deltaSteps = 40;
            var delta = 2 * Math.PI / deltaSteps;

            for (var p = 0; p <= 2 * Math.PI; p += delta) {
                var path = [];
                for (var i = 0; i < circle.length; i++) {
                    var x = circle[i].x * Math.cos(p) + circle[i].z * Math.sin(p);
                    var y = circle[i].y;
                    var z = -circle[i].x * Math.sin(p) + circle[i].z * Math.cos(p);
                    path.push(new BABYLON.Vector3(x, y, z));
                }
                paths.push(path);
            }

            var ribbon = BABYLON.MeshBuilder.CreateRibbon("ribbon", { pathArray: paths, closePath: true }, scene);
           // ribbon.material = mat;
        }*/

    };
    return Company3d;
})();