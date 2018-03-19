/*
 * viewer3d.js
 * Gestiona todo lo relacionado a la visualización 3d.
 * @author Yuliana Piedrahita
 */

var App3d = {};

App3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    App3d = function (timeMode, width, height, aspectRatio, id3d, canvasType, historicCount) {
        // Propiedades privadas
        var
            // Contenedor HTML de la grafica
            _container,
            // Modo: Tiempo real (0), historico (1) o evento (2)
            _timeMode,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina si el grafico esta en pausa o no
            _pause,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid,
            // Auto-referencia a la clase SignalGraph
            _this,
            // Referencia al Id del widget
            _widgetId,
            // Listado de las subvariables que se suscriben para recibir informacion del polling de datos
            _subVariableIdList,
            // Almacena la referencia de la subscripcion a los datos
            _subscription,
            // Metodo privado que construye el chart caso no exista
            _buildViewer3d,
            // Metodo privado que realiza la suscripcion a los datos segun el modo definido
            _subscribeToRefresh,
            // Metodo privado que se ejecuta por accion del poll al cual fue suscrito el chart
            _refresh,
            _contLoader,
            _subVariableNames = [],
            // Mantiene la lista de los diferentes tipos de medida de los diferentes tipos de sensor del activo seleccionado
            _distinctMeasures = [],
            _filteredMeasurementPoints,
            _showEditor,
            _showViewer3d,
            _onSettingsMenuItemClick,
            _velocitySubVariable,
            _createLoadingScreen,
            _showWaterfall3d,
            _buildWaterfall3d,
            _showWaterfallRPM3d,
            _buildWaterfallRPM3d,
            _uiWaterfall3d,
            _uiVbles,
            _showFullSpecWaterfall3d,
            _buildFullSpecWaterfall3d,
            _showFullSpecWaterfallRPM3d,
            _buildFullSpecWaterfallRPM3d,
            _subVariablesId = {},
            _createWidget,
            _containerParentId,
            _manageCanvas,
            _angularReference,
            _measurementPoints = [],
            _measurementPoint,
            _mdVariableListId,
            _loadData,
            _realVel,
            _buffer,
            _scene,
            _canvas,
            _wId,
            _assetId,
            _nodeId,
            _userInterface,
            _actualStatus = [],
            _valueType1,
            _valueType3,
            _subVariables = [],
            _subVariableList = [],
            _sampleRate,
            _filteredSubVariables,
            _loadedAsset,
            _selectedMeasureBySensor,
            _pathSubActive,
            _addSensorAndMeasuresPanel,
            _addSensorTypes,
            _addStatusList,
            _subVariableFilter,
            _statusFilter = {},
            _flagOpenFilter = false,
            _inValWatFilter,
            _optWatFilter = 1,
            _firstLengthArray,
            _timeStamp,
            _timeStart,
            _timeEnd,
            _waterfall,
            _maxSpecInWaterfall,
            _flagFirstWaterfall = true,
            _specContent,
            _frecContent,
            _arraySpecFilter = [],
            _firstArraySpecFilter = [],
            _lengthArraySpec,
            _newArraySpec,
            _nominalVelocity,
            _inValWatFilterSpac,
            _inValWatFilterSpec,
            _calculateSpacementArray,
            _createWaterfallAreaDialog,
            _createAreaDialogApp3d,
            _createFilterAreaDialogApp3d,
            _streamParser = new StreamParser(),
            _indexQtyHS = 0, //Numero de High Spots
            _flagFirstTimeDS = false,
            // Colores de estado de condición de cada subVariable que se está graficando
            _statusIdList = [],
            _statusColorList = [],
            _filterDataHist,
            dataHist;

        /*
         * Definimos el modo, la auto-referencia y demas valores por defecto.
         */
        _timeMode = timeMode;
        _pause = false;
        _movableGrid = false;
        _this = this;
        _subVariableIdList = [];
        _widgetId = Math.floor(Math.random() * 100000);
        _valueType1 = [];
        _valueType3 = [];
        _maxSpecInWaterfall = 200;

        /*
        if (canvasType == "Viewer") {
            _wId = "-" + _widgetId;
        } else if (canvasType == "Waterfall" || canvasType == "FullSpecWaterfall") {
            _wId = "";
        }*/

        _wId = "-" + _widgetId;
        
        
        this.containerHistoricalId = "";

        /*
         * Creamos el contenedor HTML de la grafica
         */
        _containerParentId = "containerParent-" + id3d + _wId;
        _container = document.createElement("div");
        _container.id = _containerParentId;
        _container.style.width = "100%";
        _container.style.height = "100%";

        _createLoadingScreen = function () {
            var parentContainer = $("#" + _containerParentId);
            var idContLoader;

            if (canvasType == "Viewer") {
                idContLoader = "contLoaderViewer3D-" + id3d + _wId;
            } else if (canvasType == "Waterfall" || canvasType == "WaterfallRPM") {
                idContLoader = "contLoaderWaterfall3D-" + id3d + _wId;
            } else if (canvasType == "FullSpecWaterfall" || canvasType == "FullSpecWaterfallRPM") {
                idContLoader = "contLoaderFullSpecWaterfall3D-" + id3d + _wId;
            }

            if (!_contLoader) {
                parentContainer.append('<div id="' + idContLoader + '" style="width: 100%; height: 100%; position: absolute; top: 0px; background-color: black; display: block; z-index: 2; "></div>');
                _contLoader = $("#" + idContLoader);
                _contLoader.html('<center><img src="../Content/images/loading.gif" height="126px" width="232px" style="margin: auto; top: 100px; position: relative;"><div style="color: white; position: relative; top: 70px;">Cargando...</div></center>');
            }          
        };

        /*
         * Construye la visualizacion 3d, caso no exista.
         * @param {String} title Titulo a ser mostrado en la parte superior del chart
         */
        _buildViewer3d = function () {
           
            var loadMeshes, flagsPlots;


            _manageCanvas = new ManageCanvas3d(id3d, "Viewer", _containerParentId, null, _wId);
            _manageCanvas.openCanvas();

            if (selectedTreeNode.EntityType === 2) {
                loadMeshes = new LoadMeshes(id3d, "Viewer", _containerParentId, _wId);
                loadMeshes.loadAsset();
                //globalsReport.elem3D.push({ 'id': viewer3d.canvas[id3d].id, 'src': null });
            }
            /*
            if (selectedTreeNode.EntityType === 1) {
                loadMeshes = new LoadMeshes(id3d, "Viewer", _containerParentId, _wId);
                loadMeshes.loadLocations();
            }*/


            _loadData = new LoadDataViewer3d(id3d, _wId);
            flagsPlots = globals3d.flags[id3d + _wId].plots;  

            _userInterface = new UiViewer3d(id3d, loadMeshes, _loadData, _wId);
            _userInterface.timeMode = _timeMode;
            _userInterface.createUI();

            

            for (var i = 0; i < _userInterface.mainMenu.children.length; i++) {
                for (var j = 0; j < _userInterface.mainMenu.children[i].objs.length; j++) {

                   
                        _userInterface.mainMenu.children[i].objs[j].obj.on("click", function (args) {
                            _userInterface.chooseFunction(args.currentTarget.id);
                            if (timeMode == 0) {
                                if (flagsPlots.spec || flagsPlots.spec100p || flagsPlots.orb || flagsPlots.orb1X || flagsPlots.ShaftDef) {

                                    var currentSubVariableIdList = clone(_subVariableIdList);
                                    // Eliminar de la cache las subVariables a consultar en el servidor
                                    _aWidget.manageCache(currentSubVariableIdList, "delete");
                                    // Remover las subvariables especificadas dentro de la suscripcion
                                    _subscription.detachItems(currentSubVariableIdList);
                                    _subVariableIdList = [];

                                    for (var k = 0; k < _valueType3.length; k++) {
                                        _subVariableIdList.push(_valueType3[k]);
                                    }
                                    for (var l = 0; l < _valueType1.length; l++) {
                                        _subVariableIdList.push(_valueType1[l]);
                                    }

                                    // Actualizar en la cache las subVariables a consultar en el servidor
                                    _aWidget.manageCache(_subVariableIdList, "update");
                                    // Agrega las nuevas subvariables a la suscripcion
                                    _subscription.attachItems(_subVariableIdList);
                                }
                                else {

                                    var currentSubVariableIdList = clone(_subVariableIdList);
                                    // Eliminar de la cache las subVariables a consultar en el servidor
                                    _aWidget.manageCache(currentSubVariableIdList, "delete");
                                    // Remover las subvariables especificadas dentro de la suscripcion
                                    _subscription.detachItems(currentSubVariableIdList);
                                    _subVariableIdList = [];

                                    _subVariableIdList = clone(_valueType1);
                                    // Actualizar en la cache las subVariables a consultar en el servidor
                                    _aWidget.manageCache(_subVariableIdList, "update");
                                    // Agrega las nuevas subvariables a la suscripcion
                                    _subscription.attachItems(_subVariableIdList);
                                }
                            }
                        });
                    
                }
            }

            globals3d.bufferTrend[id3d + _wId] = {};
            _buffer = globals3d.bufferTrend[id3d + _wId];
            _buffer = {};

            
            for (var i = 0; i < nodes[id3d + _wId].Properties3d.points.children.length; i++) {
                _buffer[nodes[id3d + _wId].Properties3d.points.children[i].idPoint] = [];
            }

            globals3d.bufferTrend[id3d + _wId] = _buffer;
            // Aqui colocar el onstopresize del gridstack!!v
            loadMeshes.animateAxis();

            _scene = viewer3d.scene[id3d + _wId];
            _canvas = viewer3d.canvas[id3d + _wId];

            for (var i = 0; i < _measurementPoints.length; i++) {
                _uiVbles.vblesViewer3d.push(_measurementPoints[i].Id);
            }
            //_uiVbles.vblesViewer3d = _measurementPoints.length;
           // _uiVbles.createVblesWindows();
            _createAreaDialogApp3d();
            _createFilterAreaDialogApp3d();

        };

        /*
         * Construye la visualizacion 3d - Waterfall, caso no exista.
         * @param {String} title Titulo a ser mostrado en la parte superior del chart
         */

        _buildWaterfall3d = function (timeMode, data) {
            var
                i,
                waterfall,
                uiWaterfall3d,
                currentTime,
                timeStamp,
                vel,
                arraySignal,
                date,
                resp,
                units,
                parentAsset,
                overallSubVariable,
                nameGrandParentAsset;

            _manageCanvas = new ManageCanvas3d(id3d, "Waterfall", _containerParentId, id3d, _wId);
            _createLoadingScreen();
            _manageCanvas.openCanvas();

            cascade3d.vbles[id3d + _wId].arrayFilter = _arraySpecFilter;
            cascade3d.vbles[id3d + _wId].firstWaterfall = true;

            for (i = 0; i < treeObj.model.fields.dataSource.length; i += 1) {
                if (treeObj.model.fields.dataSource[i].Id === _measurementPoint.ParentNodeId) {
                    parentAsset = treeObj.model.fields.dataSource[i];
                }
            }
            for (i = 0; i < treeObj.model.fields.dataSource.length; i += 1) {
                if (treeObj.model.fields.dataSource[i].Id === parentAsset.ParentId) {
                    nameGrandParentAsset = treeObj.model.fields.dataSource[i].Name + "-";
                }
            }
            if (_measurementPoint.AngularReferenceId != null) {
                vel = _velocitySubVariable.Maximum;
                if (vel <= 60) {
                    vel = 1800;
                }
            }
            else {
                vel = _nominalVelocity;
            }

            if (timeMode == 1) {
                waterfall = new Waterfall3d(id3d, _wId, false);
                _waterfall = waterfall;
                waterfall.nomVel = vel;
                waterfall.flagRPM = false;
                waterfall.createHistoricWaterfall();
                
                arraySignal = [];
                waterfall.unitsAmp = ej.DataManager(_measurementPoint.SubVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, true).select("Units"))[0];
                overallSubVariable = ej.DataManager(_measurementPoint.SubVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];

                if (overallSubVariable) {
                    waterfall.overallMeasureType = overallSubVariable.MeasureType;
                }
                $("#" + _frecContent[1].inputId).val(waterfall.nomVel / 6);

                if (watConfig.type == "espectrograma") {
                    waterfall.fillWaterfallHistCubes(data);
                }
                else if (watConfig.type == "clasica") {
                    waterfall.fillClassicWaterfallHist(data);
                }
                
            }
            waterfall.chooseFrecuency(100, false);

            uiWaterfall3d = new UiWaterfall3d(id3d, waterfall, _wId, data, null, false);
            uiWaterfall3d.pointInfo.pointName = nameGrandParentAsset + " "  + parentAsset.Name + " - " + _measurementPoint.Name;


            uiWaterfall3d.pointInfo.timeRange = [formatDate(new Date(_arraySpecFilter[0])), formatDate(new Date(_arraySpecFilter[_arraySpecFilter.length - 1]))];
            uiWaterfall3d.createUI();

            _scene = cascade3d.scene[id3d + _wId ];
            _canvas = cascade3d.canvas[id3d + _wId];
            
            _uiWaterfall3d = uiWaterfall3d;

            
            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": 1 });
            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": 1 });
        };

        /*
         * Construye la visualizacion 3d - Waterfall, caso no exista.
         * @param {String} title Titulo a ser mostrado en la parte superior del chart
         */

        _buildFullSpecWaterfall3d = function (timeMode, data) {
            var
                i,
                waterfall,
                uiWaterfall3d,
                timeStamp,
                vel,
                arraySignalX,
                arraySignalY,
                date,
                resp,
                currentTime,
                dataArrayX,
                dataArrayY,
                parentAsset,
                nameGrandParentAsset;

            _manageCanvas = new ManageCanvas3d(id3d, "FullSpecWaterfall", _containerParentId, id3d, _wId);
            _createLoadingScreen();
            _manageCanvas.openCanvas();

            fullSpecCascade3d.vbles[id3d + _wId].arrayFilter = _arraySpecFilter;

            for (i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                if (treeObj.model.fields.dataSource[i].Id === _measurementPoint.ParentNodeId) {
                    parentAsset = treeObj.model.fields.dataSource[i];
                }
            }
            for (i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                if (treeObj.model.fields.dataSource[i].Id === parentAsset.ParentId) {
                    nameGrandParentAsset = treeObj.model.fields.dataSource[i].Name + "-";
                }
            }

            if (_measurementPoint.AngularReferenceId != null) {
                vel = _velocitySubVariable.Maximum;
                if (vel <= 60) {
                    vel = 1800;
                }
            }
            else {
                vel = _nominalVelocity;
            }

            waterfall = new Waterfall3d(id3d, _wId, true);
            _waterfall = waterfall;
            waterfall.nomVel = vel;
            waterfall.flagRPM = false;

            waterfall.createHistoricWaterfall();

            waterfall.unitsAmp = ej.DataManager(_measurementPoint.SubVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, true).select("Units"))[0];

            $("#" + _frecContent[1].inputId).val(waterfall.nomVel / 6);


            if (fSWatConfig.type == "espectrograma") {
                waterfall.fillWaterfallHistCubesFullSpec(data[_subVariablesId.x], data[_subVariablesId.y]);
            }
            else if (fSWatConfig.type == "clasica") {
                waterfall.fillClassicWaterfallHistFullSpec(data[_subVariablesId.x], data[_subVariablesId.y]);
            }

            uiWaterfall3d = new UiWaterfall3d(id3d, waterfall, _wId, data[_subVariablesId.x], data[_subVariablesId.y], true);
            uiWaterfall3d.pointInfo.pointName = nameGrandParentAsset + " " + parentAsset.Name + " - " + _measurementPoint.Name;


            uiWaterfall3d.pointInfo.timeRange = [formatDate(new Date(_arraySpecFilter[0])), formatDate(new Date(_arraySpecFilter[_arraySpecFilter.length - 1]))];
            uiWaterfall3d.createUI();

            _scene = fullSpecCascade3d.scene[id3d + _wId];
            _canvas = fullSpecCascade3d.canvas[id3d + _wId];

            _uiWaterfall3d = uiWaterfall3d;

            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": -(waterfall.nomVel / 60) * 10 });
            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": -(waterfall.nomVel / 60) * 10 });
        };

        _buildWaterfallRPM3d = function (timeMode, data) {
            var
                i,
                waterfall,
                uiWaterfall3d,
                currentTime,
                timeStamp,
                vel,
                arraySignal,
                date,
                resp,
                units,
                parentAsset,
                nameGrandParentAsset;

            _manageCanvas = new ManageCanvas3d(id3d, "Waterfall", _containerParentId, id3d, _wId);
            _createLoadingScreen();
            _manageCanvas.openCanvas();

            cascade3d.vbles[id3d + _wId].arrayFilter = _arraySpecFilter;

            for (i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                if (treeObj.model.fields.dataSource[i].Id === _measurementPoint.ParentNodeId) {
                    parentAsset = treeObj.model.fields.dataSource[i];
                }
            }
            for (i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                if (treeObj.model.fields.dataSource[i].Id === parentAsset.ParentId) {
                    nameGrandParentAsset = treeObj.model.fields.dataSource[i].Name + "-";
                }
            }
           
            if (_measurementPoint.AngularReferenceId != null) {
                vel = _velocitySubVariable.Maximum;
                if (vel <= 60) {
                    vel = 1800;
                }
            }
            else {
                vel = _nominalVelocity;
            }

            waterfall = new Waterfall3d(id3d, _wId, false);
            _waterfall = waterfall;
            waterfall.nomVel = vel;
            waterfall.flagRPM = true;
            waterfall.createHistoricWaterfall();

            $("#" + _frecContent[1].inputId).val(waterfall.nomVel / 6);


            if (watConfig.type == "espectrograma") {
                waterfall.fillWaterfallHistCubes(data);
            }
            else if (watConfig.type == "clasica") {
                waterfall.fillClassicWaterfallHist(data);
            }

            uiWaterfall3d = new UiWaterfall3d(id3d, waterfall, _wId, data, null, false);
            uiWaterfall3d.pointInfo.pointName = nameGrandParentAsset + " " + parentAsset.Name + " - " + _measurementPoint.Name;

            uiWaterfall3d.pointInfo.timeRange = [formatDate(new Date(_arraySpecFilter[0])), formatDate(new Date(_arraySpecFilter[_arraySpecFilter.length - 1]))];
            uiWaterfall3d.createUI();

            _scene = cascade3d.scene[id3d + _wId];
            _canvas = cascade3d.canvas[id3d + _wId];
            _uiWaterfall3d = uiWaterfall3d;

            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": 1 });
            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": 1 });
        };

        _buildFullSpecWaterfallRPM3d = function (timeMode, data) {
            var
                i,
                waterfall,
                uiWaterfall3d,
                timeStamp,
                vel,
                arraySignalX,
                arraySignalY,
                date,
                resp,
                currentTime,
                dataArrayX,
                dataArrayY,
                parentAsset,
                nameGrandParentAsset;

            _manageCanvas = new ManageCanvas3d(id3d, "FullSpecWaterfall", _containerParentId, id3d, _wId);
            _createLoadingScreen();
            _manageCanvas.openCanvas();

            fullSpecCascade3d.vbles[id3d + _wId].arrayFilter = _arraySpecFilter;

            for (i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                if (treeObj.model.fields.dataSource[i].Id === _measurementPoint.ParentNodeId) {
                    parentAsset = treeObj.model.fields.dataSource[i];
                }
            }
            for (i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                if (treeObj.model.fields.dataSource[i].Id === parentAsset.ParentId) {
                    nameGrandParentAsset = treeObj.model.fields.dataSource[i].Name + "-";
                }
            }

            if (_measurementPoint.AngularReferenceId != null) {
                vel = _velocitySubVariable.Maximum;
                if (vel <= 60) {
                    vel = 1800;
                }
            }
            else {
                vel = _nominalVelocity;
            }

            waterfall = new Waterfall3d(id3d, _wId, true);
            _waterfall = waterfall;
            waterfall.nomVel = vel;
            waterfall.flagRPM = true;
            waterfall.createHistoricWaterfall();

            $("#" + _frecContent[1].inputId).val(waterfall.nomVel / 6);

            waterfall.unitsAmp = ej.DataManager(_measurementPoint.SubVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, true).select("Units"))[0];
            

            if (fSWatConfig.type == "espectrograma") {
                waterfall.fillWaterfallHistCubesFullSpec(data[_subVariablesId.x], data[_subVariablesId.y]);
            }
            else if (fSWatConfig.type == "clasica") {
                waterfall.fillClassicWaterfallHistFullSpec(data[_subVariablesId.x], data[_subVariablesId.y]);
            }

            uiWaterfall3d = new UiWaterfall3d(id3d, waterfall, _wId, _subVariablesId.x, _subVariablesId.y, true);
            uiWaterfall3d.pointInfo.pointName = nameGrandParentAsset + " " + parentAsset.Name + " - " + _measurementPoint.Name;


            uiWaterfall3d.pointInfo.timeRange = [formatDate(new Date(_arraySpecFilter[0])), formatDate(new Date(_arraySpecFilter[_arraySpecFilter.length - 1]))];
            uiWaterfall3d.createUI();

            _scene = fullSpecCascade3d.scene[id3d + _wId];
            _canvas = fullSpecCascade3d.canvas[id3d + _wId];

            _uiWaterfall3d = uiWaterfall3d;

            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": -(waterfall.nomVel / 60) * 10 });
            $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({ "max": (waterfall.nomVel / 60) * 10, "min": -(waterfall.nomVel / 60) * 10 });
        };

        /*
         * Suscribe el chart al dato segun el Modo definido
         */
        _subscribeToRefresh = function (timeStamp, historicalRange, rpmPositions) {
            var
                startDate,
                endDate,
                subVariableIdList,
                dataArray,
                notStored,
                i, j,
                idx,
                group,
                items;

            timeStamp = new Date(timeStamp).getTime().toString();
            if (canvasType === "Viewer") {
                // Subscripcion a evento para refrescar datos de grafica segun _timeMode
                switch (_timeMode) {
                    case 0: // Tiempo Real
                        _subscription = PublisherSubscriber.subscribe("/realtime/refresh", _subVariableIdList, function (data) {
                            _refresh(data, _pause, enableFilter, stopFrequency);
                        });
                        break;
                    case 1: // Historico
                        _subscription = PublisherSubscriber.subscribe("/historic/refresh", _valueType3, function (data) {
                            var
                                i, index,
                                notStored,
                                dataArray;

                            if (Object.keys(data).length === 0) {
                                return;
                            }
                            if (data[Object.keys(data)[0]].WidgetId !== _widgetId) {
                                return;
                            }
                            dataArray = [];
                            for (i = 0; i < Object.keys(data).length; i += 1) {
                                dataArray[Object.keys(data)[i]] = data[Object.keys(data)[i]][timeStamp];
                            }
                            aidbManager.GetNumericBySubVariableIdAndTimeStampList(_valueType1, [parseInt(timeStamp)], _nodeId, function (resp) {
                                notStored = clone(_valueType1);
                                for (i = 0; i < resp.length; i += 1) {
                                    dataArray[resp[i].subVariableId] = {
                                        StatusId: resp[i].statusId,
                                        StatusColor: resp[i].statusColor,
                                        Value: resp[i].value,
                                        TimeStamp: formatDate(new Date(resp[i].timeStamp))
                                    };
                                    index = notStored.indexOf(resp[i].subVariableId);
                                    notStored.splice(index, 1);
                                }
                                for (i = 0; i < notStored.length; i += 1) {
                                    dataArray[notStored[i]] = {
                                        StatusId: null,
                                        StatusColor: null,
                                        Value: null
                                    };
                                }
                                _refresh(dataArray, _pause, enableFilter, stopFrequency);
                            });
                        });
                        var mdVariableIdList = ej.DataManager(_measurementPoints).executeLocal(new ej.Query().where(
                                                ej.Predicate("SensorTypeCode", "equal", 1, true).or("SensorTypeCode", "equal", 2, true).
                                                                                                 or("SensorTypeCode", "equal", 3, true)).select("Id"));
                        new HistoricalTimeMode().GetSingleDynamicHistoricalData(mdVariableIdList, _nodeId, _valueType3, timeStamp, _widgetId);
                        break;
                }
            }
            else if (canvasType === "Waterfall") {
                subVariableIdList = new ej.DataManager(_measurementPoint.SubVariables).executeLocal(
                    new ej.Query().where("ValueType", "equal", 3, true).select("Id"));
                dataArray = [];
                notStored = clone(_firstArraySpecFilter);
                // Subscripcion a evento para refrescar datos de grafica segun _timeMode
                switch (_timeMode) {
                    case 1: // Historico
                        _subscription = PublisherSubscriber.subscribe("/historicTrend/refresh", [_widgetId], function (data) {
                            if (Object.keys(data).length === 0) {
                                return;
                            }
                            if (parseInt(Object.keys(data)[0]) !== _widgetId) {
                                return;
                            }
                            items = ej.DataManager(data[Object.keys(data)[0]].Data).executeLocal(
                                new ej.Query().sortBy("timeStamp", ej.sortOrder.Ascending, false));
                            for (i = 0; i < items.length; i += 1) {
                                idx = _firstArraySpecFilter.indexOf(items[i].timeStamp);
                                dataArray[idx] = {
                                    signal: clone(items[i].value),
                                    timeStamp: formatDate(new Date(items[i].timeStamp)).split(" ")[1],
                                    milliseconds: items[i].timeStamp,
                                    sampleTime: items[i].sampleTime,
                                    sampleRate: items[i].value.length / items[i].sampleTime
                                };
                                idx = notStored.indexOf(items[i].timeStamp);
                                notStored.splice(idx, 1);
                                if (_sampleRate == null && i== 0) {
                                    _sampleRate = items[i].value.length / items[i].sampleTime;
                                }
                            }
                            if (notStored.length === 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList([_velocitySubVariable.Id], _firstArraySpecFilter, _nodeId, function (numeric) {
                                    for (i = 0; i < numeric.length; i += 1) {
                                        idx = _firstArraySpecFilter.indexOf(numeric[i].timeStamp);
                                        if (numeric[i].value !== null && _nominalVelocity !== null) {
                                            dataArray[idx].vel = clone(numeric[i].value);
                                        }
                                        else {
                                            dataArray[idx].vel = _nominalVelocity;
                                        }
                                    }
                                    
                                    _refresh(dataArray);
                                });
                            }
                           
                        });
                        new HistoricalTimeMode().GetDynamicHistoricalData([_measurementPoint.Id], subVariableIdList, _nodeId, _firstArraySpecFilter, _widgetId);
                        break;
                }
            }
            else if (canvasType === "FullSpecWaterfall") {
                subVariableIdList = [_subVariablesId.x, _subVariablesId.y];
                dataArray = [];
                dataArray[_subVariablesId.x] = [];
                dataArray[_subVariablesId.y] = [];
                notStored = clone(_firstArraySpecFilter);
                // Subscripcion a evento para refrescar datos de grafica segun _timeMode
                switch (_timeMode) {
                    case 1: // Historico
                        _subscription = PublisherSubscriber.subscribe("/historicTrend/refresh", [_widgetId], function (data) {
                            if (Object.keys(data).length === 0) {
                                return;
                            }
                            if (parseInt(Object.keys(data)[0]) !== _widgetId) {
                                return;
                            }
                            group = ej.DataManager(data[Object.keys(data)[0]].Data).executeLocal(
                                new ej.Query().group("timeStamp"));
                            for (i = 0; i < group.length; i += 1) {
                                items = group[i].items;
                                idx = _firstArraySpecFilter.indexOf(group[i].key);
                                for (j = 0; j < subVariableIdList.length; j += 1) {
                                    if (items[j]) {
                                        dataArray[items[j].subVariableId][idx] = {
                                            signal: clone(items[j].value),
                                            timeStamp: formatDate(new Date(items[j].timeStamp)).split(" ")[1],
                                            milliseconds: items[j].timeStamp,
                                            sampleTime: items[j].sampleTime,
                                            sampleRate: items[j].value.length / items[j].sampleTime
                                        };
                                        if (_sampleRate == null && i == 0) {
                                            _sampleRate = items[i].value.length / items[i].sampleTime;
                                        }
                                    } else {
                                        dataArray[subVariableIdList[j]][idx] = {
                                            signal: null,
                                            timeStamp: formatDate(new Date(group[i].key)).split(" ")[1],
                                            milliseconds: group[i].key,
                                            sampleTime: 0,
                                            sampleRate: 0
                                        };
                                    }
                                }
                                idx = notStored.indexOf(group[i].key);
                                notStored.splice(idx, 1);
                            }
                            if (notStored.length === 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList([_velocitySubVariable.Id], _firstArraySpecFilter, _nodeId, function (numeric) {
                                    for (i = 0; i < numeric.length; i += 1) {
                                        idx = _firstArraySpecFilter.indexOf(numeric[i].timeStamp);
                                        if (numeric[i].value !== null && _nominalVelocity !== null) {
                                            dataArray[_subVariablesId.x][idx].vel = clone(numeric[i].value);
                                            dataArray[_subVariablesId.y][idx].vel = clone(numeric[i].value);
                                        }
                                        else {
                                            dataArray[_subVariablesId.x][idx].vel = _nominalVelocity;
                                            dataArray[_subVariablesId.y][idx].vel = _nominalVelocity;
                                        }
                                        idx = notStored.indexOf(numeric[i].timeStamp);
                                        notStored.splice(idx, 1);
                                    }
                                    _refresh(dataArray);
                                });
                            }

                        });
                        new HistoricalTimeMode().GetDynamicHistoricalData(_mdVariableListId, subVariableIdList, _nodeId, _firstArraySpecFilter, _widgetId);
                        break;
                }
            }
            else if (canvasType === "WaterfallRPM") {
                subVariableIdList = new ej.DataManager(_measurementPoint.SubVariables).executeLocal(
                    new ej.Query().where("ValueType", "equal", 3, true).select("Id"));
                dataArray = [];
                notStored = clone(_firstArraySpecFilter);
                // Subscripcion a evento para refrescar datos de grafica segun _timeMode
                switch (_timeMode) {
                    case 1: // Historico
                        _subscription = PublisherSubscriber.subscribe("/historicTrend/refresh", [_widgetId], function (data) {
                            if (Object.keys(data).length === 0) {
                                return;
                            }
                            if (parseInt(Object.keys(data)[0]) !== _widgetId) {
                                return;
                            }
                            items = ej.DataManager(data[Object.keys(data)[0]].Data).executeLocal(
                                new ej.Query().sortBy("timeStamp", ej.sortOrder.Ascending, false));
                            for (i = 0; i < items.length; i += 1) {
                                idx = _firstArraySpecFilter.indexOf(items[i].timeStamp);
                                dataArray[idx] = {
                                    signal: clone(items[i].value),
                                    timeStamp: formatDate(new Date(items[i].timeStamp)).split(" ")[1],
                                    milliseconds: items[i].timeStamp,
                                    sampleTime: items[i].sampleTime,
                                    sampleRate: items[i].value.length / items[i].sampleTime
                                };
                                idx = notStored.indexOf(items[i].timeStamp);
                                notStored.splice(idx, 1);
                                if (_sampleRate == null && i == 0) {
                                    _sampleRate = items[i].value.length / items[i].sampleTime;
                                }
                            }
                            if (notStored.length === 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList([_velocitySubVariable.Id], _firstArraySpecFilter, _nodeId, function (numeric) {
                                    for (i = 0; i < numeric.length; i += 1) {
                                        idx = _firstArraySpecFilter.indexOf(numeric[i].timeStamp);
                                        if (numeric[i].value !== null && _nominalVelocity !== null) {
                                            dataArray[idx].vel = clone(numeric[i].value);
                                        }
                                        else {
                                            dataArray[idx].vel = _nominalVelocity;
                                        }
                                    }
                                    _refresh(dataArray);
                                });
                            }
                        });
                        new HistoricalTimeMode().GetDynamicHistoricalData([_measurementPoint.Id], subVariableIdList, _nodeId, _firstArraySpecFilter, _widgetId);
                        break;
                }
            }
            else if (canvasType === "FullSpecWaterfallRPM") {
                subVariableIdList = [_subVariablesId.x, _subVariablesId.y];
                dataArray = [];
                dataArray[_subVariablesId.x] = [];
                dataArray[_subVariablesId.y] = [];
                notStored = clone(_firstArraySpecFilter);
                // Subscripcion a evento para refrescar datos de grafica segun _timeMode
                switch (_timeMode) {
                    case 1: // Historico
                        _subscription = PublisherSubscriber.subscribe("/historicTrend/refresh", [_widgetId], function (data) {
                            if (Object.keys(data).length === 0) {
                                return;
                            }
                            if (parseInt(Object.keys(data)[0]) !== _widgetId) {
                                return;
                            }
                            group = ej.DataManager(data[Object.keys(data)[0]].Data).executeLocal(
                                new ej.Query().group("timeStamp"));
                            for (i = 0; i < group.length; i += 1) {
                                items = group[i].items;
                                idx = _firstArraySpecFilter.indexOf(group[i].key);
                                for (j = 0; j < subVariableIdList.length; j += 1) {
                                    if (items[j]) {
                                        dataArray[items[j].subVariableId][idx] = {
                                            signal: clone(items[j].value),
                                            timeStamp: formatDate(new Date(items[j].timeStamp)).split(" ")[1],
                                            milliseconds: items[j].timeStamp,
                                            sampleTime: items[j].sampleTime,
                                            sampleRate: items[j].value.length / items[j].sampleTime
                                        };
                                        if (_sampleRate == null && i == 0) {
                                            _sampleRate = items[i].value.length / items[i].sampleTime;
                                        }
                                    } else {
                                        dataArray[subVariableIdList[j]][idx] = {
                                            signal: null,
                                            timeStamp: formatDate(new Date(group[i].key)).split(" ")[1],
                                            milliseconds: group[i].key,
                                            sampleTime: 0,
                                            sampleRate: 0
                                        };
                                    }
                                }
                                idx = notStored.indexOf(group[i].key);
                                notStored.splice(idx, 1);
                            }
                            if (notStored.length === 0) {
                                aidbManager.GetNumericBySubVariableIdAndTimeStampList([_velocitySubVariable.Id], _firstArraySpecFilter, _nodeId, function (numeric) {
                                    for (i = 0; i < numeric.length; i += 1) {
                                        idx = _firstArraySpecFilter.indexOf(numeric[i].timeStamp);
                                        if (numeric[i].value !== null && _nominalVelocity !== null) {
                                            dataArray[_subVariablesId.x][idx].vel = clone(numeric[i].value);
                                            dataArray[_subVariablesId.y][idx].vel = clone(numeric[i].value);
                                        }
                                        else {
                                            dataArray[_subVariablesId.x][idx].vel = _nominalVelocity;
                                            dataArray[_subVariablesId.y][idx].vel = _nominalVelocity;
                                        }
                                    }
                                    _refresh(dataArray);
                                });
                            }
                        });
                        new HistoricalTimeMode().GetDynamicHistoricalData(_mdVariableListId, subVariableIdList, _nodeId, _firstArraySpecFilter, _widgetId);
                        break;
                }
            }
            
        };


        // Agregamos los items al menu de opciones para la grafica
        var settingsMenu = [];
        if (canvasType === "Waterfall" || canvasType === "FullSpecWaterfall" || canvasType === "WaterfallRPM" || canvasType === "FullSpecWaterfallRPM") {

            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Personalización", "personalizateWaterfall"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtro", "filterWaterfall"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Información", "infoWaterfall"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Vista Inicial", "initialViewWaterfall"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Pantalla Completa", "FullScreenWaterfall"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Guardar Imagen", "SaveImageWaterfall"));
        }
        if (canvasType === "Viewer") {

            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Personalización", "configViewer3d"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtro", "filterViewer3d"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Pantalla Completa", "FullScreenViewer3d"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Guardar Imagen", "SaveImageViewer3d"));

        }

        _createWidget = function (timeStamp, historicalRange, rpmPositions) {

            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: 'awContainer',
                content: _container,
                className: 'col-sm-4',
                width: width,
                height: height,
                aspectRatio: aspectRatio,
                settingsMenu: settingsMenu,
                onSettingsMenuItemClick: _onSettingsMenuItemClick,
                graphType: "app3d",
                timeMode: _timeMode,
                asdaqId: selectedAsset.AsdaqId,
                atrId: selectedAsset.AtrId,
                subVariableIdList: _subVariableIdList,
                pause: (_timeMode === 0) ? true : false,
                onClose: function () {
                    _this.Close();
                },
                onPause: function () {
                    _pause = !_pause;
                },
                onMove: function () {
                    _movableGrid = !_movableGrid;
                    var gridStack = $(".grid-stack").data("gridstack");
                    var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    gridStack.movable(grid, _movableGrid);
                    
                    if (_movableGrid && _scene) {
                        _scene.cameras[0].detachControl(_canvas);                     
                    } else if (!_movableGrid && _scene) {
                        _scene.cameras[0].attachControl(_canvas, false);
                        //_scene.camera.inputs.attachInput(camera.inputs.attached.pointers);
                    }
                }
            });

           
            _aWidget.open(); // Abrir AspectrogramWidget

            if (canvasType !== "Viewer") {
                _createLoadingScreen();
                _subscribeToRefresh(timeStamp, historicalRange, rpmPositions); // Se suscribe notificación de llegada de nuevos datos para la gráfica
            }
            _flagFirstWaterfall = false;
        };

        _onSettingsMenuItemClick = function (event) {
            event.preventDefault();
            var $target = $(event.currentTarget),
                 settingsMenuItem = $target.attr("data-value"),
                 i,
                 widgetWidth,
                 widgetPosition,
                 dialogSize,
                 dialogPosition,
                 measureTypesGroupBySensorType,
                 properties3d,
                 subVar;

            switch (settingsMenuItem) {
                case "personalizateWaterfall":

                    $("#app3dAreaDialog-" + canvasType + "-" + _wId).css("display", "block");
                    $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("open");

                    $("#app3dDialogCont-" + canvasType + "-" + _wId + " #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("close");
                    });
                    $("#app3dDialogCont-" + canvasType + "-" + _wId + " #btnSave").click(function (e) {
                        e.preventDefault();
                        _uiWaterfall3d.saveInfoWaterfall();

                        $("#app3dAreaDialog-" + canvasType + '-' + _wId).css("display", "none"); // Ocultar de nuevo el html de la modal
                        $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("close");
                    });
                    break;
                case "filterWaterfall":
                    var element = $("#waterfallAreaDialog-" + canvasType + "-" + _wId).detach();
                    $("#" + _containerParentId).append(element);

                    $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId).ejDialog("open");
                    $("#waterfallAreaDialog-" + canvasType + "-" + _wId).css("display", "block");


                    break;
                case "infoWaterfall":
                    _uiWaterfall3d.showArmonicInfo();
                    break;
                case "initialViewWaterfall":
                    _uiWaterfall3d.locateCamera();
                    break;
                case "FullScreenWaterfall":
                    _uiWaterfall3d.loadInFullScreen();
                    break;
                case "SaveImageWaterfall":
                    _uiWaterfall3d.saveImage();
                    break;
                case "configViewer3d":

                    $("#app3dAreaDialog-" + canvasType + "-" + _wId).css("display", "block");
                    $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("open");

                    $("#app3dDialogCont-" + canvasType + "-" + _wId + " #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("close");
                    });
                    $("#app3dDialogCont-" + canvasType + "-" + _wId + " #btnSave").click(function (e) {
                        e.preventDefault();
                        properties3d = nodes[id3d + _wId].Properties3d;
                        properties3d.colors = globals3d.colors[id3d + _wId];

                        properties3d = JSON.stringify(properties3d);

                        $.ajax({
                            url: "/Home/SetAssetProperties3d",
                            method: "POST",
                            data: { assetId: _assetId, properties3d: properties3d },
                            success: function (response) {
                                //console.log(response);
                            },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "A ocurrido un error. Intente nuevamente");
                            },
                        });

                        $("#app3dAreaDialog-" + canvasType + '-' + _wId).css("display", "none"); // Ocultar de nuevo el html de la modal
                        $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("close");
                    });
                    break;
                case "filterViewer3d":

                    measureTypesGroupBySensorType = new ej.DataManager(_distinctMeasures).executeLocal(new ej.Query().group("SensorType"));
                    var nameDivsVbles = "divVblesViewer3d-";
                    $('#measureTypesContainer' + canvasType + "-" + _wId).empty();
                    $('#statusContainer' + canvasType + "-" + _wId).empty();

                    _addStatusList();

                    for (var i = 0; i < measureTypesGroupBySensorType.length; i += 1) {
                        _addSensorAndMeasuresPanel(measureTypesGroupBySensorType[i].key, measureTypesGroupBySensorType[i].items);
                    }

                    $("#app3dAreaDialogFilter-" + canvasType + "-" + _wId).css("display", "block");
                    $("#app3dDialogFilterCont-" + canvasType + "-" + _wId).ejDialog("open");

                    $("#app3dDialogFilterCont-" + canvasType + "-" + _wId + " #btnCancel").click(function (e) {
                        e.preventDefault();
                        $("#app3dDialogFilterCont-" + canvasType + "-" + _wId).ejDialog("close");
                        _flagOpenFilter = true;
                    });
                    $("#app3dDialogFilterCont-" + canvasType + "-" + _wId + " #btnFilter").click(function (e) {
                        var
                            mdVariableIdList,
                            filteredSubVariables,
                            filteredMeasurementPoints;

                        e.preventDefault();

                        filteredMeasurementPoints = [];
                        filteredSubVariables = [];

                        // Obtener las subVariables que cumplan con los criterios de tipos de sensor y medida seleccionada por cada tipo
                        for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                            if (_selectedMeasureBySensor[i].selectedMeasureType > -1) {
                                filteredSubVariables.pushArray(ej.DataManager(_subVariables).executeLocal(new ej.Query().where(
                                    ej.Predicate("SensorTypeCode", "equal", _selectedMeasureBySensor[i].sensorTypeCode)
                                        .and("MeasureType", "equal", _selectedMeasureBySensor[i].selectedMeasureType)
                                        .and("FromIntegratedWaveform", "equal", _selectedMeasureBySensor[i].fromIntegratedWaveform)
                                    )));
                            }
                        }

                        for (i = 0; i < filteredSubVariables.length; i += 1) {
                            filteredMeasurementPoints.push(ej.DataManager(_measurementPoints).executeLocal(
                                new ej.Query().where("Id", "equal", filteredSubVariables[i].ParentId))[0]);
                        }

                        _filteredMeasurementPoints = filteredMeasurementPoints;

                        var currentSubVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));
                        // Eliminar de la cache las subVariables a consultar en el servidor
                        _aWidget.manageCache(currentSubVariableIdList, "delete");
                        // Remover las subvariables especificadas dentro de la suscripcion
                        _subscription.detachItems(currentSubVariableIdList);

                        // Actualizar la lista de subVariables actuales
                        _filteredSubVariables = clone(filteredSubVariables);

                        _subVariableIdList = ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().select("Id"));
                        // Actualizar en la cache las subVariables a consultar en el servidor
                        _aWidget.manageCache(_subVariableIdList, "update");
                        // Agrega las nuevas subvariables a la suscripcion
                        //_subscription.attachItems(_subVariableIdList);
                        

                       // $("#app3dAreaDialogFilter-" + canvasType + '-' + _wId).css("display", "none"); // Ocultar de nuevo el html de la modal
                        //$("#app3dDialogFilterCont-" + canvasType + "-" + _wId).ejDialog("close");
                    });
                    $("#" + nameDivsVbles + 0 + "-" + id3d + _wId).show();
                    $("#" + nameDivsVbles + 1 + "-" + id3d + _wId).show();
                    break;
                case "FullScreenViewer3d":
                    _userInterface.loadInFullScreen();
                    break;
                case "SaveImageViewer3d":
                    _userInterface.saveImageViewer();
                    break;
            }
        };

        /*
         * Actualiza el chart por accion de poll al cual fue suscrito el chart
         * @param {String} data Informacion obtenida del poll
         */
        _refresh = function (data, _pause, enableFilter, stopFrequency) {

            var xVal, yVal, sampleRate, xId, yId, flagSpec = false, indexSpec = 0, flagDefShaft = false, indexDefShaft = 0, timeStampHist, currentDefaultValueSubVar, statusId, nominalVelocity;

            

            if (!_pause && canvasType === "Viewer") {
                _uiVbles.subVblesViewer3d = [];
                    
                for (var i = 0; i < _measurementPoints.length; i++) {
                    
                    for (var j = 0; j < _measurementPoints[i].SubVariables.length; j++) {
                        if (data[_measurementPoints[i].SubVariables[j].Id] !== undefined) {
                            if (_measurementPoints[i].SubVariables[j].ValueType == 1) {
                               
                                _statusIdList.push(data[_measurementPoints[i].SubVariables[j].Id].StatusId);
                                _statusColorList.push(data[_measurementPoints[i].SubVariables[j].Id].StatusColor);
                                if (_selectedMeasureBySensor) {

                                    for (var k = 0; k < _selectedMeasureBySensor.length; k++) {
                                            //console.log()
                                        if (timeMode == 0) {
                                            if (_selectedMeasureBySensor[k].sensorTypeCode == _measurementPoints[i].SensorTypeCode &&
                                                                                       _selectedMeasureBySensor[k].selectedMeasureType == _measurementPoints[i].SubVariables[j].MeasureType &&
                                                                                          _statusFilter[data[_measurementPoints[i].SubVariables[j].Id].StatusId] == "checked") {
                                                //console.log(_measurementPoints[i].SubVariables[j].Id);
                                                _uiVbles.subVblesViewer3d.push({
                                                    id: _measurementPoints[i].Id,
                                                    tag: _measurementPoints[i].SubVariables[j].Name,
                                                    value: data[_measurementPoints[i].SubVariables[j].Id].Value,
                                                    units: _measurementPoints[i].SubVariables[j].Units,
                                                    name: _measurementPoints[i].Name,
                                                    sensorType: _measurementPoints[i].SensorTypeCode,
                                                    statusColor: data[_measurementPoints[i].SubVariables[j].Id].StatusColor
                                                });
                                            }
                                        }
                                        if (timeMode == 1) {
                                            dataHist = clone(data);                                           
                                        }                                      
                                    }
                                    
                                }
                            }
                        }                     
                    }
                    
                    _uiVbles.loadValues();

                    if (vbles[_measurementPoints[i].Id] != undefined) {
                        currentDefaultValueSubVar = ej.DataManager(_measurementPoints[i].SubVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];

                        var currentDefaultValueData = data[currentDefaultValueSubVar.Id];
                        if (currentDefaultValueData) {
                            if (currentDefaultValueSubVar && currentDefaultValueData.Value) {

                                _loadData.dataTextAndSensors.push({ idPoint: _measurementPoints[i].Id, value: currentDefaultValueData.Value, statusColor: currentDefaultValueData.StatusColor });
                            }
                        }
                        
                    }

                    if (_measurementPoints[i].SensorTypeCode === 4) {
                        var currentDefaultValueSubVarVel = ej.DataManager(_measurementPoints[i].SubVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false))[0];
                        var currentDefaultValueDataVel = data[currentDefaultValueSubVarVel.Id];
                        if (currentDefaultValueDataVel) {
                            globals3d.flags[id3d + _wId].animation = true;
                            globals3d.vel.asset.axis[id3d + _wId][0] = currentDefaultValueDataVel.Value;
                            _realVel = currentDefaultValueDataVel.Value;
                        }
                        
                    }
                    
                    var allNumericValueTypes;

                    if (_timeMode !== 0) {
                        allNumericValueTypes = ej.DataManager(_measurementPoints[i].SubVariables).executeLocal(
                        new ej.Query().where("ValueType", "equal", 1, false));
                    }
                    else {

                         allNumericValueTypes = ej.DataManager(_measurementPoints[i].SubVariables).executeLocal(
                            new ej.Query().where(ej.Predicate("ValueType", "equal", 1, false).and("Name", "equal", _userInterface.tipoMedida, false)));
                    }
                    
                    var currentDefaultValueDataCB;

                    if (_timeMode !== 0) {
                        if (currentDefaultValueSubVar !== undefined) {
                            if (data[currentDefaultValueSubVar.Id] !== undefined) {
                                if (data[currentDefaultValueSubVar.Id].TimeStamp !== undefined) {
                                    timeStampHist = data[currentDefaultValueSubVar.Id].TimeStamp + "+00:00";
                                }
                            }                                                 
                        }                       
                    }
                   if (_measurementPoints[i].SensorTypeCode === 1 || _measurementPoints[i].SensorTypeCode === 2) {

                        if (vbles[_measurementPoints[i].Id]) {
                            if (_measurementPoints[i].AssociatedMeasurementPointId !== null && _measurementPoints[i].Orientation === 1) {
                                
                                if (data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id]) {


                                    if (data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].KeyphasorPositions !== undefined) {

                                        if (_flagFirstTimeDS === false) {
                                            _indexQtyHS++;
                                        }

                                        indexDefShaft++;

                                        if (_flagFirstTimeDS) {
                                            if (indexDefShaft === globals3d.paresQty[id3d + _wId]) {
                                                flagDefShaft = true;
                                            }
                                        }

                                        if (_timeMode !== 0) {
                                            if (!data[vbles[_measurementPoints[i].Id].VelocityId].Value) {
                                                nominalVelocity = _nominalVelocity;
                                            } else {
                                                nominalVelocity = data[vbles[_measurementPoints[i].Id].VelocityId].Value / 60;
                                            }
                                            _loadData.dataPairs.push({
                                                idPoint: _measurementPoints[i].Id,
                                                data: {
                                                    x: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].RawValue,
                                                    y: data[vbles[_measurementPoints[i].AssociatedMeasurementPointId].SubVariables.WaveForm.Id].RawValue,
                                                    kphX: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].KeyphasorPositions,
                                                    kphY: data[vbles[_measurementPoints[i].AssociatedMeasurementPointId].SubVariables.WaveForm.Id].KeyphasorPositions,
                                                    xAngle: vbles[_measurementPoints[i].Id].Angle,
                                                    yAngle: vbles[_measurementPoints[i].AssociatedMeasurementPointId].Angle,
                                                    xAmp1X: data[vbles[_measurementPoints[i].Id].XAmp1XId].Value,
                                                    yAmp1X: data[vbles[_measurementPoints[i].Id].YAmp1XId].Value,
                                                    xPha1X: data[vbles[_measurementPoints[i].Id].XPha1XId].Value,
                                                    yPha1X: data[vbles[_measurementPoints[i].Id].YPha1XId].Value,
                                                    isFiltered: enableFilter,
                                                    measureType: vbles[_measurementPoints[i].Id].measureType,
                                                    fc: stopFrequency,
                                                    sampleRate: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].SampleRate,
                                                    tS: _measurementPoints[i].RotationDirection,
                                                    flagDefShaft: true,
                                                    vel: nominalVelocity,
                                                    //xAmp1XId: data[vbles[_measurementPoints[i].Id].XAmp1X]
                                                }
                                            });

                                        }
                                        else if (_timeMode === 0 && (globals3d.flags[id3d + _wId].plots.orb || globals3d.flags[id3d + _wId].plots.orb1X || globals3d.flags[id3d + _wId].plots.ShaftDef ||(globals3d.flags[id3d + _wId].plots.sCL))) {
                                            if (!data[vbles[_measurementPoints[i].Id].VelocityId].Value) {
                                                nominalVelocity = _nominalVelocity;
                                            } else {
                                                nominalVelocity = data[vbles[_measurementPoints[i].Id].VelocityId].Value / 60;
                                            }
                                            _loadData.dataPairs.push({
                                                idPoint: _measurementPoints[i].Id,
                                                data: {
                                                    x: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].RawValue,
                                                    y: data[vbles[_measurementPoints[i].AssociatedMeasurementPointId].SubVariables.WaveForm.Id].RawValue,
                                                    kphX: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].KeyphasorPositions,
                                                    kphY: data[vbles[_measurementPoints[i].AssociatedMeasurementPointId].SubVariables.WaveForm.Id].KeyphasorPositions,
                                                    xAngle: vbles[_measurementPoints[i].Id].Angle,
                                                    yAngle: vbles[_measurementPoints[i].AssociatedMeasurementPointId].Angle,
                                                    xAmp1X: data[vbles[_measurementPoints[i].Id].XAmp1XId].Value,
                                                    yAmp1X: data[vbles[_measurementPoints[i].Id].YAmp1XId].Value,
                                                    xPha1X: data[vbles[_measurementPoints[i].Id].XPha1XId].Value,
                                                    yPha1X: data[vbles[_measurementPoints[i].Id].YPha1XId].Value,
                                                    isFiltered: enableFilter,
                                                    measureType: vbles[_measurementPoints[i].Id].measureType,
                                                    isFiltered: enableFilter,
                                                    fc: stopFrequency,
                                                    sampleRate: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].SampleRate,
                                                    tS: _measurementPoints[i].RotationDirection,
                                                    flagDefShaft: true,
                                                    vel: nominalVelocity
                                                }
                                            });
                                        }
                                    }
                                }
                                
                            }

                            if (vbles[_measurementPoints[i].Id].SubVariables.WaveForm) {
                                indexSpec++;
                                if (indexSpec === nodes[id3d + _wId].Properties3d.points.children.length) {
                                    flagSpec = true;
                                }


                                if (_timeMode !== 0) {
                                    if (data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id]) {
                                        _loadData.dataWaveform.push({
                                            idPoint: _measurementPoints[i].Id,
                                            data: {
                                                signal: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].RawValue,
                                                sampleRate: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].SampleRate,
                                                isFiltered: enableFilter,
                                                fc: stopFrequency,
                                                flag: flagSpec
                                            }

                                        });
                                    }
                                   
                                }
                                if (_timeMode === 0 && (globals3d.flags[id3d + _wId].plots.spec ||
                                    globals3d.flags[id3d + _wId].plots.waterfall || globals3d.flags[id3d + _wId].plots.spec100p)) {

                                    _loadData.dataWaveform.push({
                                        idPoint: _measurementPoints[i].Id,
                                        data: {
                                            signal: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].RawValue,
                                            sampleRate: data[vbles[_measurementPoints[i].Id].SubVariables.WaveForm.Id].SampleRate,
                                            isFiltered: enableFilter,
                                            fc: stopFrequency,
                                            flag: flagSpec
                                        }
                                    });
                                }
                            }
                        }
                    }

                }
                if (timeMode !== 1) {
                    _loadData.loadDataTextAndSensors();
                    if (currentDefaultValueSubVar) {
                        _userInterface.loadValuesCategoryVble(_timeMode, data[currentDefaultValueSubVar.Id].TimeStamp + "+00:00", _pathSubActive);
                    }
                    
                    _loadData.drawChartsPairs();
                    _loadData.dataPairs = [];
                    _loadData.dataTextAndSensors = [];
                    _userInterface.dataIndicators = [];
                    //_loadData.dataPairs = [];
                    if (!globals3d.flags[id3d + _wId].plots.spec) {
                        _loadData.drawChartsWaveform();
                        _loadData.dataWaveform = [];
                    }
                }
                if (_indexQtyHS > 0) {
                    _flagFirstTimeDS = true;
                    globals3d.paresQty[id3d + _wId] = _indexQtyHS;
                }

                if (globals3d.flags[id3d + _wId].plots.spec) {
                    _loadData.drawChartsWaveform();
                    _loadData.dataWaveform = [];
                }
            }
            else  if (_pause){
                globals3d.flags[id3d + _wId].animation = false;
            }
            if (canvasType === "Waterfall") {
                _buildWaterfall3d(1, data);
                _createAreaDialogApp3d();
            }
           else if (canvasType === "FullSpecWaterfall") {
                _buildFullSpecWaterfall3d(1, data);
                _createAreaDialogApp3d();
            }
            else if (canvasType === "WaterfallRPM") {
                _buildWaterfallRPM3d(1, data);
                _createAreaDialogApp3d();
            }
            else if (canvasType === "FullSpecWaterfallRPM") {
                _buildFullSpecWaterfallRPM3d(1, data);
                _createAreaDialogApp3d();
            }
            if (_timeMode === 1 && canvasType !== "Waterfall" && canvasType !== "FullSpecWaterfall" && canvasType !== "WaterfallRPM" && canvasType !== "FullSpecWaterfallRPM") {
                
            setTimeout(function () {
                _loadData.loadDataTextAndSensors();
            }, 5000);
                //_loadData.loadDataTextAndSensors();
                _userInterface.loadValuesCategoryVble(_timeMode, timeStampHist, _pathSubActive);
            }
            
        };

        _showViewer3d = function (measurementPoints, selectedNode, timeStamp, historicalRange, rpmPositions) {

            var
                idPoint,
                subAssets,
                i,
                nameParentAsset,
                infoPoint,
                measurementPoint,
                sensorType;

            _uiVbles = new UiVblesViewer3d(id3d, _wId);
            for (i = 0; i < treeObj.model.fields.dataSource.length; i += 1) {
                if (treeObj.model.fields.dataSource[i].Id === selectedNode.ParentId) {
                    nameParentAsset = treeObj.model.fields.dataSource[i].Name + "-";
                }
            }
            if (nameParentAsset === undefined) {
                nameParentAsset = "";
            }
            _pathSubActive = nameParentAsset + selectedNode.Name;
            //console.log(new Date());
            //console.log(new Date().getMilliseconds());
            $.ajax({
                url: "/Home/GetAssetProperties3d",
                method: "GET",
                data: {
                    assetId: selectedNode.AssetId
                },
                success: function (result) {
                    globals3d.vel.asset.axis[id3d + _wId] = [];
                    if (result != "" && result != null) {
                        if (viewer3d.containerCanvas[id3d + _wId] === undefined) {
                            nodes[id3d + _wId] = {};
                            nodes[id3d + _wId].Type = selectedNode.EntityType;
                            nodes[id3d + _wId].Properties3d = JSON.parse(result);
                            nodes[id3d + _wId].Properties3d.points.children = [];

                            for (i = 0; i < _measurementPoints.length; i += 1) {
                                // if (_measurementPoints[i].ParentId == id3d) {
                                idPoint = _measurementPoints[i].Id


                                measurementPoint = _measurementPoints[i];
                                infoPoint = JSON.parse(measurementPoint.Properties3d);

                                if (measurementPoint.Properties3d) {
                                    infoPoint.idPoint = idPoint;
                                    infoPoint.info.relatedIdPoint = measurementPoint.AssociatedMeasurementPointId;

                                    
                                        vbles[idPoint] = {};
                                        vbles[idPoint].Id = idPoint;
                                        vbles[idPoint].Name = measurementPoint.Name;
                                        vbles[idPoint].Orientation = measurementPoint.Orientation;
                                        vbles[idPoint].Angle = measurementPoint.SensorAngle;
                                        vbles[idPoint].SubVariables = {};
                                        vbles[idPoint].Axis = infoPoint.axis;
                                        vbles[idPoint].AssociatedMeasurementPointId = measurementPoint.AssociatedMeasurementPointId;
                                        

                                        nodes[id3d + _wId].Properties3d.points.children.push(infoPoint);

                                        for (var k = 0; k < measurementPoint.SubVariables.length; k++) {
                                            if (measurementPoint.SubVariables[k].IsDefaultValue) {
                                                vbles[idPoint].SubVariables.DefaultValue = new Object(measurementPoint.SubVariables[k]);
                                            }
                                            else if (measurementPoint.SubVariables[k].ValueType === 3) {
                                                vbles[idPoint].SubVariables.WaveForm = new Object(measurementPoint.SubVariables[k]);
                                            }
                                        }
                                    
                                        for (var j = 0; j < _measurementPoints.length; j++) {
                                            if (_measurementPoints[j].Id == measurementPoint.AngularReferenceId) {
                                                for (var k = 0; k < _measurementPoints[j].SubVariables.length; k++) {
                                                    if (_measurementPoints[j].SubVariables[k].MeasureType == 9) {
                                                        vbles[idPoint].VelocityId = _measurementPoints[j].SubVariables[k].Id;            
                                                    }
                                                }
                                            }
                                            if (_measurementPoints[j].AssociatedMeasurementPointId != null) {
                                                if (_measurementPoints[j].Id == measurementPoint.Id) {
                                                    for (var k = 0; k < _measurementPoints[j].SubVariables.length; k++) {
                                                        
                                                        if (_measurementPoints[j].SubVariables[k].MeasureType == 4) {
                                                            if (_measurementPoints[j].Orientation == 1) {
                                                                vbles[idPoint].XAmp1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            } else if (_measurementPoints[j].Orientation == 2) {
                                                                vbles[idPoint].YAmp1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            }
                                                        }
                                                        else if (_measurementPoints[j].SubVariables[k].MeasureType == 6) {
                                                            if (_measurementPoints[j].Orientation == 1) {
                                                                vbles[idPoint].XPha1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            } else if (_measurementPoints[j].Orientation == 2) {
                                                                vbles[idPoint].YPha1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            }
                                                        }
                                                        else if (_measurementPoints[j].SubVariables[k].IsDefaultValue) {
                                                            vbles[idPoint].measureType = _measurementPoints[j].SubVariables[k].MeasureType;
                                                        }
                                                    }
                                                }
                                                else if (_measurementPoints[j].Id == measurementPoint.AssociatedMeasurementPointId) {
                                                    for (var k = 0; k < _measurementPoints[j].SubVariables.length; k++) {
                                                        if (_measurementPoints[j].SubVariables[k].MeasureType == 4) {
                                                            if (_measurementPoints[j].Orientation == 1) {
                                                                vbles[idPoint].XAmp1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            } else if (_measurementPoints[j].Orientation == 2) {
                                                                vbles[idPoint].YAmp1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            }
                                                        }
                                                        else if (_measurementPoints[j].SubVariables[k].MeasureType == 6) {
                                                            if (_measurementPoints[j].Orientation == 1) {
                                                                vbles[idPoint].XPha1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            } else if (_measurementPoints[j].Orientation == 2) {
                                                                vbles[idPoint].YPha1XId = _measurementPoints[j].SubVariables[k].Id;
                                                            }
                                                        }
                                                        }
                                                    }
                                                }
                                            }
                                }
                                if (measurementPoint.SensorTypeCode !== 4) {
                                    var waveform = ej.DataManager(measurementPoint.SubVariables).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
                                    if (waveform) {
                                        _valueType3.push(waveform.Id);
                                    }
                                }
                                var direct = ej.DataManager(measurementPoint.SubVariables).executeLocal(new ej.Query().where("ValueType", "equal", 1, false));
                                if (direct) {
                                    sensorType = ej.DataManager(sensorTypes).executeLocal(new ej.Query().where("Code", "equal", measurementPoint.SensorTypeCode))[0].Name;
                                    for (var l = 0; l < direct.length; l++) {
                                        _valueType1.push(direct[l].Id);
                                        _subVariableNames.push(direct[l].Name);
                                        _subVariableList.push(direct[l]);
                                        _subVariableList[l].SensorTypeCode = measurementPoint.SensorTypeCode;
                                        _subVariableList[l].SensorType = sensorType;
                                    }
                                }
                            }
                        }
                        if (timeMode == 0) {
                            _subVariableIdList = clone(_valueType1);
                        }
                        else if (timeMode == 1) {
                            _subVariableIdList = clone(_valueType1);
                            for (var m = 0; m < _valueType3.length; m++) {
                                _subVariableIdList.push(_valueType3[m]);
                            }
                        }
                        _subVariableNames = eliminateDuplicatesArray(_subVariableNames);
                        _uiVbles.subVblesNames = _subVariableNames;

                        var allSubVariables = [], index = 0, subVariableList, numericSubVariables, subVariablesGroupBySensor = [];

                        for (i = 0; i < _measurementPoints.length; i += 1) {
                            if (!_measurementPoints[i].SensorTypeCode) {
                                continue;
                            }
                            sensorType = ej.DataManager(sensorTypes).executeLocal(new ej.Query().where("Code", "equal", _measurementPoints[i].SensorTypeCode))[0].Name;
                            for (var j = 0; j < _measurementPoints[i].SubVariables.length; j += 1) {
                                if (_measurementPoints[i].SubVariables[j].ValueType == 1) {
                                    allSubVariables.push(_measurementPoints[i].SubVariables[j]);
                                    allSubVariables[index].SensorTypeCode = _measurementPoints[i].SensorTypeCode;
                                    // Propiedad por la cual se van a agrupar los diferentes tipos de medida
                                    allSubVariables[index].SensorType = sensorType;
                                    index += 1;
                                }

                            }
                        }

                        _distinctMeasures = [];

                        subVariablesGroupBySensor = [];

                        subVariablesGroupBySensor.pushArray(ej.DataManager(allSubVariables).executeLocal(
                                    new ej.Query().where("FromIntegratedWaveform", "equal", false).group("SensorTypeCode")));

                        subVariablesGroupBySensor.pushArray(ej.DataManager(allSubVariables).executeLocal(
                                    new ej.Query().where("FromIntegratedWaveform", "equal", true).group("SensorTypeCode")));


                        for (i = 0; i < subVariablesGroupBySensor.length; i += 1) {
                            _distinctMeasures.pushArray(ej.distinct(
                                subVariablesGroupBySensor[i].items,
                                "MeasureType",
                                true
                            ));
                        }

                        _subVariables = clone(_subVariableList);
                        _selectedMeasureBySensor = [];

                        // Aqui realizamos el filtrado de las subVariables a graficar (por defecto: aquellas donde IsDefaultValue = true)
                        _filteredSubVariables = ej.DataManager(_subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true));
                        if (_filteredSubVariables.length === 0) {
                            popUp("info", "No hay subvariables marcadas para valor por defecto.");
                            return;
                        }

                        var subVariablesGroupBySensor = new ej.DataManager(_filteredSubVariables).executeLocal(new ej.Query().group("SensorTypeCode"));

                        // Inicializar medida seleccionada por cada distinto sensor
                        for (i = 0; i < subVariablesGroupBySensor.length; i += 1) {
                            _selectedMeasureBySensor.push({
                                sensorTypeCode: subVariablesGroupBySensor[i].key,
                                selectedMeasureType: subVariablesGroupBySensor[i].items[0].MeasureType,
                                fromIntegratedWaveform: subVariablesGroupBySensor[i].items[0].FromIntegratedWaveform
                            });
                        }

                        _createWidget(timeStamp);
                        _createLoadingScreen();
                        _buildViewer3d();

                        _uiVbles.createDivsWindows();
                        _subscribeToRefresh(timeStamp, historicalRange, rpmPositions); // Se suscribe notificación de llegada de nuevos datos para la gráfica
                    }


                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
            
            //if()
            
        };
       
        _showWaterfall3d = function (measurementPointId) {

            _angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false));
            if (_angularReference && _angularReference.length > 0) {
                _velocitySubVariable = ej.DataManager(_angularReference[0].SubVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 9, false))[0];
            }
        };

        _showFullSpecWaterfall3d = function (measurementPointId) {
            var
                measurementPoints = {},
                waveforms = {},
                subVariablesX,
                subVariablesY;


            if (_measurementPoint.AssociatedMeasurementPointId != null) {
                if (_measurementPoint.Orientation == 1) {
                    measurementPoints.x = _measurementPoint;

                    // Punto de medicion Y.
                    measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", _measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                } else {
                    // Punto de medicion X
                    measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", _measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                    measurementPoints.y = _measurementPoint;
                    // Punto de medicion Y

                }
            }

            _angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false));
            if (!_angularReference || _angularReference.length === 0) {
                popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                return;
            }
            _velocitySubVariable = ej.DataManager(_angularReference[0].SubVariables).executeLocal(
                new ej.Query().where("MeasureType", "equal", 9, false))[0];

            subVariablesX = measurementPoints.x.SubVariables;
            // SubVariable que contiene la forma de onda en X
            waveforms.x = ej.DataManager(subVariablesX).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
            if (waveforms.x) {
                //_subVariableIdList.push(waveforms.x.Id);
                _subVariablesId.x = waveforms.x.Id;
            }

            subVariablesY = measurementPoints.y.SubVariables;
            // Subvariable que contiene la forma de onda en Y
            waveforms.y = ej.DataManager(subVariablesY).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
            if (waveforms.y) {
                //_subVariableIdList.push(waveforms.y.Id);
                _subVariablesId.y = waveforms.y.Id;
            }

            _mdVariableListId = [measurementPoints.x.Id, measurementPoints.y.Id];
        };

        _showWaterfallRPM3d = function (measurementPointId) {

            _angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false));
            if (_angularReference && _angularReference.length > 0) {
                _velocitySubVariable = ej.DataManager(_angularReference[0].SubVariables).executeLocal(
                    new ej.Query().where("MeasureType", "equal", 9, false))[0];
            }
        };

        _showFullSpecWaterfallRPM3d = function (measurementPointId) {
            var
                measurementPoints = {},
                waveforms = {},
                subVariablesX,
                subVariablesY;
            //switch (_timeMode) {
            //    case 0:

            //        break;
            //    case 1:
            //    case 2:
            //        measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
            //            new ej.Query().where("Id", "equal", measurementPointId, false))[0];
            //        /*
            //        subVariables = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", measurementPointId, false))[0].SubVariables;
            //        subVarId = ej.DataManager(subVariables).executeLocal(new ej.Query().where("Name", "equal", "Forma de onda", false))[0].Id;
            //        _subVariableIdList.push(subVarId);
            //        _angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
            //            new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false))[0];
            //        if (_angularReference) {
            //            _velocitySubVariable = ej.DataManager(_angularReference.SubVariables).executeLocal(
            //            new ej.Query().where("MeasureType", "equal", 9, false))[0];
            //        }

            //        if (_velocitySubVariable) {
            //            _subVariableIdList.push(_velocitySubVariable.Id);
            //        }*/
            //        break;
            //    default:

            //}

            if (_measurementPoint.AssociatedMeasurementPointId != null) {
                if (_measurementPoint.Orientation == 1) {
                    measurementPoints.x = _measurementPoint;

                    // Punto de medicion Y.
                    measurementPoints.y = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", _measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                } else {
                    // Punto de medicion X
                    measurementPoints.x = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                        new ej.Query().where("Id", "equal", _measurementPoint.AssociatedMeasurementPointId, false)
                    )[0];
                    measurementPoints.y = _measurementPoint;
                    // Punto de medicion Y

                }
            }

            _angularReference = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", _measurementPoint.AngularReferenceId, false));
            if (!_angularReference || _angularReference.length === 0) {
                popUp("info", "No se a configurado un sensor de referencia angular para " + _assetData.Name);
                return;
            }
            _velocitySubVariable = ej.DataManager(_angularReference[0].SubVariables).executeLocal(
                new ej.Query().where("MeasureType", "equal", 9, false))[0];

            subVariablesX = measurementPoints.x.SubVariables;
            // SubVariable que contiene la forma de onda en X
            waveforms.x = ej.DataManager(subVariablesX).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
            if (waveforms.x) {
                //_subVariableIdList.push(waveforms.x.Id);
                _subVariablesId.x = waveforms.x.Id;
            }

            subVariablesY = measurementPoints.y.SubVariables;
            // Subvariable que contiene la forma de onda en Y
            waveforms.y = ej.DataManager(subVariablesY).executeLocal(new ej.Query().where("ValueType", "equal", 3, false))[0];
            if (waveforms.y) {
                //_subVariableIdList.push(waveforms.y.Id);
                _subVariablesId.y = waveforms.y.Id;
            }

            //velocitySubVariable = ej.DataManager(angularReference.SubVariables).executeLocal(new ej.Query().where("MeasureType", "equal", 9, false))[0];
            //if (velocitySubVariable) {
            //    _subVariableIdList.push(velocitySubVariable.Id);
            //    _subVariablesId.vel = velocitySubVariable.Id;
            //}

            _mdVariableListId = [measurementPoints.x.Id, measurementPoints.y.Id];
        };

        _addStatusList = function () {
            var statusNames = [],
                statusId = [],
                statusChecked,
                statusTypesContainer,
                statusOption,
                newPanel,
                panelHeading,
                panelBody;

            _statusIdList = eliminateDuplicatesArray(_statusIdList);
            _statusColorList = eliminateDuplicatesArray(_statusColorList);

            if (timeMode == 0) {
                for (var i = 0; i < arrayObjectStatus.length; i++) {
                    for (var j = 0; j < _statusIdList.length; j++) {
                        if (arrayObjectStatus[i].Id == _statusIdList[j]) {
                            statusNames.push(arrayObjectStatus[i].Name);
                            statusId.push(arrayObjectStatus[i].Id);
                        }
                    }
                }
            }
            else if (timeMode == 1) {
                for (var i = 0; i < arrayObjectStatus.length; i++) {
                    for (var j = 0; j < _statusColorList.length; j++) {
                        if (arrayObjectStatus[i].Color == _statusColorList[j]) {
                            statusNames.push(arrayObjectStatus[i].Name);
                            statusId.push(arrayObjectStatus[i].Id);
                        }
                    }
                }
            }

            statusTypesContainer = $("#statusContainer" + canvasType + '-' + _wId);

            panelHeading = $("<div class=\"panel-heading\" style=\"padding-top:5px !important;padding-bottom:5px !important;\"></div>");
            panelHeading.append("<h3 class=\"panel-title\">Estados</h3>");

            panelBody = $("<div class=\"panel-body\" style=\"padding-top:0 !important;padding-bottom:0 !important;\"></div>");

            for (var i = 0; i < statusId.length; i++) {
                if (!_flagOpenFilter) {
                    statusChecked = "checked";
                    _statusFilter[statusId[i]] = "checked";
                } else {
                    statusChecked = _statusFilter[statusId[i]];
                }
                statusOption = $("<div class=\"checkbox\"></div>");
                statusOption.append(
                    "<label><input type=\"checkbox\" id=\"{0}\" value=\"{1}\" {2} ></input>{3}</label>".JsFormat(
                        statusId[i] + canvasType + "-" + _wId,
                        statusNames[i],
                        statusChecked,
                        statusNames[i]));

                panelBody.append(statusOption);
            }
            newPanel = $("<div class=\"panel panel-default\"></div>");
            newPanel.append(panelHeading);
            newPanel.append(panelBody);

            statusTypesContainer.append(newPanel);
            
            var statusIds;

            for (var i = 0; i < statusId.length; i++) {
                $("#" + statusId[i] + canvasType + "-" + _wId).change(function () {
                    
                    if (this.checked) {
                        _statusFilter[this.id.split(canvasType + "-" + _wId)[0]] = "checked";
                    } else {
                        _statusFilter[this.id.split(canvasType + "-" + _wId)[0]] = "";
                    }
                    if (timeMode == 1) {
                        _filterDataHist();
                    }

                });
            }
        };

        _addSensorAndMeasuresPanel = function (sensorType, measures) {
            var
                measureTypesContainer,
                newPanel,
                panelHeading,
                panelBody,
                measureOption,
                i,
                radioGroupName,
                selectedMeasureType,
                fromIntegratedWaveform,
                checked;

            //sensorType = sensorType.replace(" ", "_");

            measureTypesContainer = $("#measureTypesContainer" + canvasType + '-' + _wId);

            //console.log(_measurementPointFilter[sensorType].selectedSubVar);

            panelHeading = $("<div  class=\"panel-heading\" style=\"padding-top:5px !important;padding-bottom:5px !important;\"></div>");
            panelHeading.append("<h3 class=\"panel-title\">{0}</h3>".JsFormat(sensorType));

            panelBody = $("<div class=\"panel-body\" style=\"padding-top:0 !important;padding-bottom:0 !important;\"></div>");

            if (measures.length > 0) {
                radioGroupName = "sensor_" + sensorType;

                for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                    if (_selectedMeasureBySensor[i].sensorTypeCode == measures[0].SensorTypeCode) {
                        selectedMeasureType = _selectedMeasureBySensor[i].selectedMeasureType; // Medida seleccionada actualmente para el tipo de sensor
                        fromIntegratedWaveform = _selectedMeasureBySensor[i].fromIntegratedWaveform;
                        break;
                    }
                }

                for (i = 0; i < measures.length; i += 1) {
                    checked = "";

                    if ((measures[i].MeasureType == selectedMeasureType) && (measures[i].FromIntegratedWaveform == fromIntegratedWaveform)) {
                        checked = "checked";
                    }

                    measureOption = $("<div class=\"radio\"></div>");
                    measureOption.append(
                        "<label><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} {3}></input>{4}</label>".JsFormat(
                            radioGroupName,
                            measures[i].MeasureType,
                            (measures[i].FromIntegratedWaveform) ? "fromintegratedwaveform" : "",
                            checked,
                            measures[i].Name));

                    panelBody.append(measureOption);
                }

                checked = (selectedMeasureType == -1) ? "checked" : ""; // -1=Ninguno

                // Opción "Ninguno"
                measureOption = $("<div class=\"radio\"></div>");
                measureOption.append(
                    "<label><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} {3}></input>{4}</label>".JsFormat(
                        radioGroupName,
                        -1,
                        "",
                        checked,
                        "Ninguno"));

                panelBody.append(measureOption);
                // Opción "Ninguno"
            }

            newPanel = $("<div id=\"{0}\" class=\"panel panel-default\"></div>".JsFormat("Panel-" + sensorType + canvasType + "-" + _wId));
            newPanel.append(panelHeading);
            newPanel.append(panelBody);

            measureTypesContainer.append(newPanel);

            if (radioGroupName) {
                $("input[name=\"{0}\"]:radio".JsFormat(radioGroupName)).change(function () {
                    var
                        i,
                        radioObj,
                        sensorTypeCode,
                        measureType,
                        fromIntegratedWaveform;

                    radioObj = $(this);
                    //sensorTypeCode = parseInt(radioObj[0].name.split("_")[1]);

                    for (var i = 0; i < sensorTypes.length; i++) {
                        if (sensorTypes[i].Name.indexOf(radioObj[0].name.split("_")[1]) != -1) {
                            sensorTypeCode = sensorTypes[i].Code;
                        }
                    }
                    measureType = parseInt(radioObj.val());
                    fromIntegratedWaveform = radioObj.is('[fromintegratedwaveform]');

                    for (i = 0; i < _selectedMeasureBySensor.length; i += 1) {
                        if (_selectedMeasureBySensor[i].sensorTypeCode == sensorTypeCode) {
                            _selectedMeasureBySensor[i].selectedMeasureType = measureType;
                            _selectedMeasureBySensor[i].fromIntegratedWaveform = fromIntegratedWaveform;
                            break;
                        }
                    }

                    if (timeMode == 1) {
                        _filterDataHist();
                    }
                    
                });
            }


        };

        _filterDataHist = function () {
            var statusId;
            _uiVbles.subVblesViewer3d = [];
            for (var i = 0; i < _measurementPoints.length; i++) {
                for (var j = 0; j < _measurementPoints[i].SubVariables.length; j++) {
                    if (dataHist[_measurementPoints[i].SubVariables[j].Id] !== undefined) {
                        if (_measurementPoints[i].SubVariables[j].ValueType == 1) {

                            _statusIdList.push(dataHist[_measurementPoints[i].SubVariables[j].Id].StatusId);
                            _statusColorList.push(dataHist[_measurementPoints[i].SubVariables[j].Id].StatusColor);
                            if (_selectedMeasureBySensor) {
                                for (var k = 0; k < _selectedMeasureBySensor.length; k++) {

                                    for (var l = 0; l < arrayObjectStatus.length; l++) {
                                        if (dataHist[_measurementPoints[i].SubVariables[j].Id].StatusColor == arrayObjectStatus[l].Color) {
                                            statusId = arrayObjectStatus[l].Id;
                                        }
                                    }

                                    if (_selectedMeasureBySensor[k].sensorTypeCode == _measurementPoints[i].SensorTypeCode &&
                                                                               _selectedMeasureBySensor[k].selectedMeasureType == _measurementPoints[i].SubVariables[j].MeasureType &&
                                                                                  _statusFilter[statusId] == "checked") {
                                        //console.log(_measurementPoints[i].SubVariables[j].Id);
                                        _uiVbles.subVblesViewer3d.push({
                                            id: _measurementPoints[i].Id,
                                            tag: _measurementPoints[i].SubVariables[j].Name,
                                            value: dataHist[_measurementPoints[i].SubVariables[j].Id].Value,
                                            units: _measurementPoints[i].SubVariables[j].Units,
                                            name: _measurementPoints[i].Name,
                                            sensorType: _measurementPoints[i].SensorTypeCode,
                                            statusColor: dataHist[_measurementPoints[i].SubVariables[j].Id].StatusColor
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            _uiVbles.loadValues();
        };

        _calculateSpacementArray = function (historicalRange, rpmPositions) {
            var specArray = [], numSpac = 0, divSpec, totalSpec, newArray, lastSpacIn;

            if (_flagFirstWaterfall) {
                totalSpec = (canvasType == "Waterfall" || canvasType == "FullSpecWaterfall") ? historicCount : rpmPositions.length;
                _lengthArraySpec = totalSpec;
                _firstArraySpecFilter = historicalRange;
                //_arraySpecFilter = _firstArraySpecFilter;
            }

            totalSpec = (canvasType == "Waterfall" || canvasType == "FullSpecWaterfall") ? historicCount : rpmPositions.length;

            if (_optWatFilter == 2) { // Espaciamiento
                _inValWatFilterSpac = parseInt($("#inSpacement" + canvasType + '-' + _wId).val());
                //for (var i = 0; i < totalSpec ; i += _inValWatFilter) {//parseInt(totalSpec / _inValWatFilter)
                for (var i = 0; i < _firstArraySpecFilter.length ; i += parseInt(_inValWatFilterSpac)) {
                    specArray.push(_firstArraySpecFilter[i]);
                }
                
                $("#inQtySpec" + canvasType + '-' + _wId).val(parseInt(_lengthArraySpec / _inValWatFilterSpac));
            } else if (_optWatFilter == 1) {//Número de Espectros
                _inValWatFilterSpec = parseInt($("#inQtySpec" + canvasType + '-' + _wId).val());
                //divSpec = _firstLengthArray / _inValWatFilter;
                divSpec = _firstArraySpecFilter.length / _inValWatFilterSpec;
                for (var i = 0; i < _inValWatFilterSpec; i++) {
                    specArray.push(_firstArraySpecFilter[parseInt(divSpec * i)]);
                }
                $("#inSpacement" + canvasType + '-' + _wId).val(_lengthArraySpec / _inValWatFilterSpec);
                //lastSpacIn =  
            }
            _lengthArraySpec = specArray.length;
            _arraySpecFilter = specArray;
            _newArraySpec = _arraySpecFilter;
            
            if (_flagFirstWaterfall) {
                _firstLengthArray = _lengthArraySpec;
                _firstArraySpecFilter = specArray;
                $("#inQtySpec" + canvasType + '-' + _wId).attr("max", _firstLengthArray);
                $("#inSpacement" + canvasType + '-' + _wId).attr("max", _firstLengthArray);

            } else {
                
                if (canvasType == "Waterfall" || canvasType == "WaterfallRPM") {
                    cascade3d.vbles[id3d + _wId].arrayFilter = specArray;
                    cascade3d.vbles[id3d + _wId].firstWaterfall = false;
                }
                if (canvasType == "FullSpecWaterfall" || canvasType == "FullSpecWaterfallRPM") {
                    fullSpecCascade3d.vbles[id3d + _wId].arrayFilter = specArray;
                    fullSpecCascade3d.vbles[id3d + _wId].firstWaterfall = false;
                }
            }
            
            //$("#inSpacement" + canvasType + '-' + _wId).val(_lengthArraySpec / _inValWatFilterSpec);
            $("#inQtySpec" + canvasType + '-' + _wId).val(_lengthArraySpec);

        };

        _createFilterAreaDialogApp3d = function () {

            var parentPPal, parentAreaDialog, parentContAreaDialog, title, width, height, posY;

            title = "Filtro Visor 3d";
            width = 450;
            height = 450;
            posY = parseInt($("#containerParent-" +id3d +_wId).parent().parent().parent().css("top")) -$("#canvasViewer3D-" + canvasType + '-' +_wId).height();

            parentPPal = $("#aspectrogramMainContent");

            parentPPal.append('<div id="app3dAreaDialogFilter-' + canvasType + '-' + _wId + '" style="display:none;"><div class="control"></div></div>');//style='display:none;'
            parentAreaDialog = $("#app3dAreaDialogFilter-" + canvasType + "-" +_wId);

            parentAreaDialog.append('<div id="app3dDialogFilterCont-' + canvasType + '-' + _wId + '" title:"' + title + '"></div>');
            parentContAreaDialog = $("#app3dDialogFilterCont-" + canvasType + "-" +_wId);


            $("#app3dDialogFilterCont-" + canvasType + "-" +_wId).ejDialog({
                enableResize: false,
                width: width,
                    height: height,
                    title: "Filtro",
                zIndex: 2000,
                    close: function () {
                        //$("#measurementPointCheckList").ejListBox("destroy"); // Destruir objeto Listbox Syncfusion
                    $("#app3dAreaDialogFilter-" + canvasType + '-' + _wId + "#btnSave").off("click"); // Necesario desasociar el evento
                    $("#app3dAreaDialogFilter-" + canvasType + '-' + _wId + "#btnCancel").off("click"); // Necesario desasociar el evento
                    $("#app3dAreaDialogFilter-" + canvasType + '-' +_wId).css("display", "none"); // Ocultar de nuevo el html de la modal
            },
                    content: "#app3dAreaDialogFilter-" + canvasType + '-' +_wId,
                    actionButtons: ["close"],
                    position: { X: 250, Y: 50 +posY
            } // Posicionar el ejDialog
                });

            $("#app3dDialogFilterCont-" + canvasType + "-" +_wId).ejDialog("open");
            $("#app3dDialogFilterCont-" + canvasType + "-" +_wId).css("display", "block");


            var event;
            parentContAreaDialog.append('<div><form role="form">' +
                '<div class="row">' +
                    '<div class="form-group">' +
                        '<div class="col-md-6">' +
                            '<div id="measureTypesContainer' + canvasType + "-" + _wId + '" style="height: 350px; max-height: 350px; overflow-y: auto; width: 200px;"></div></div>' +
                        '<div class="col-md-6">' +
                            '<div id="statusContainer' + canvasType + "-" + _wId + '" style="height: 350px; max-height: 350px; overflow-y: auto; width: 170px;"></div></div>' +
                            '</div></div></form></div>');

                    /*
                    parentContAreaDialog.append('<div><form role="form"><div class="row"><div class="form-group"><div class="col-md-3"><div id="measureTypesContainer' + canvasType + "-" + _wId + '" style="height: 350px; max-height: 350px; overflow-y: auto; width: 170px; margin-left: 20px;"></div></div></div></form></div>');
                    parentContAreaDialog.append('<div><form role="form"><div class="row"><div class="form-group"><div class="col-md-3"><div id="statusContainer' + canvasType + "-" + _wId + '" style="height: 450px; max-height: 350px; overflow-y: auto; width: 170px; margin-left: 20px;"></div></div></div></form></div>');
                    */

            parentContAreaDialog.append('<div class="form-group" style="display:block; top: 370px; left: 200px; position: absolute;">' +
                                    '<div class="row">' +
                                        '<div style="text-align: center;">' +
                                            '<a id="btnCancel" style=" margin-left: 20px;" class="btn btn-sm btn-primary" href="#">' +
                                                '<i class="fa fa-close"></i> Cerrar' +
                                            '</a>' +
                                        '</div>' +
                                                '</div>' +
                               '</div>');

        };

        _createAreaDialogApp3d = function () {

            var parentPPal,
                parentAreaDialog,
                parentContAreaDialog,
                title,
                width,
                height,
                topButtons,
                posY;

            switch (canvasType) {
                case "Waterfall":
                case "FullSpecWaterfall":
                case "WaterfallRPM":
                case "FullSpecWaterfallRPM":
                    title = "Personalización Cascada";
                    width = 280;
                    height = 350;
                    break;
                case "Viewer":
                    title = "Personalización Visor 3d";
                    width = 320;
                    height = 350;
                    break;
            }

            posY = parseInt($("#containerParent-" + id3d + _wId).parent().parent().parent().css("top")) - $("#canvasViewer3D-" + canvasType + '-' + _wId).height();

            parentPPal = $("#aspectrogramMainContent");

            parentPPal.append('<div id="app3dAreaDialog-' + canvasType + '-' + _wId + '" style="display:none;"><div class="control"></div></div>');//style='display:none;'
            parentAreaDialog = $("#app3dAreaDialog-" + canvasType + "-" + _wId);

            parentAreaDialog.append('<div id="app3dDialogCont-' + canvasType + '-' + _wId + '" title:"' + title + '"></div>');
            parentContAreaDialog = $("#app3dDialogCont-" + canvasType + "-" + _wId);


            $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog({
                enableResize: false,
                width: width,
                height: height,
                zIndex: 2000,
                title: "Personalización",
                close: function () {
                    //$("#measurementPointCheckList").ejListBox("destroy"); // Destruir objeto Listbox Syncfusion
                    $("#app3dAreaDialog-" + canvasType + '-' + _wId + "#btnSave").off("click"); // Necesario desasociar el evento
                    $("#app3dAreaDialog-" + canvasType + '-' + _wId + "#btnCancel").off("click"); // Necesario desasociar el evento
                    $("#app3dAreaDialog-" + canvasType + '-' + _wId).css("display", "none"); // Ocultar de nuevo el html de la modal
                },
                content: "#app3dAreaDialog-" + canvasType + '-' + _wId,
                actionButtons: ["close"],
                position: { X: 250, Y: 50 + posY } // Posicionar el ejDialog
            });

            $("#app3dDialogCont-" + canvasType + "-" + _wId).ejDialog("open");
            $("#app3dDialogCont-" + canvasType + "-" + _wId).css("display", "block");



            var event;

            switch (canvasType) {
                case "Waterfall":
                case "FullSpecWaterfall":
                case "WaterfallRPM":
                case "FullSpecWaterfallRPM":
                    parentContAreaDialog.append('<div><form role="form"><div class="row"><div class="form-group"><div class="col-md-12"><div id="' + _uiWaterfall3d.modalPersonalize.id + "-" + _wId + '"></div></div></div></form></div>');
                    _uiWaterfall3d.modalPersonalize.obj = $("#" + _uiWaterfall3d.modalPersonalize.id + "-" + _wId);

                    _uiWaterfall3d.modalPersonalize.obj.addClass("infoGralWaterfall3d modalPersonalize-Waterfall3d-");
                    _uiWaterfall3d.modalPersonalize.obj.css({
                        "width": "240px",
                        "padding": "10px 10px 10px 10px",
                        "margin": "-30px 10px 30px 10px",
                        "right": "20px",
                        "top": "20px",
                        "background-color": "white",
                        "color": "black"
                    });


                    for (var i = 0; i < _uiWaterfall3d.modalPersonalize.children.length; i++) {

                        switch (_uiWaterfall3d.modalPersonalize.children[i].type) {
                            case "number":
                            case "color":
                            case "checkbox":
                            case "range":

                                _uiWaterfall3d.modalPersonalize.obj.append('<div style="display: inline-block; position: relative; padding: 25px 15px 5px 15px;">' + _uiWaterfall3d.modalPersonalize.children[i].txt + '</div>');
                                _uiWaterfall3d.modalPersonalize.obj.append('<input id="' + _uiWaterfall3d.modalPersonalize.children[i].name + _wId + '" type="' + _uiWaterfall3d.modalPersonalize.children[i].type + '" name="' + _uiWaterfall3d.modalPersonalize.children[i].name + '" min="1" value="' + _uiWaterfall3d.modalPersonalize.children[i].value + '">');

                                _uiWaterfall3d.modalPersonalize.children[i].obj = $("#" + _uiWaterfall3d.modalPersonalize.children[i].name + _wId);

                                _uiWaterfall3d.modalPersonalize.children[i].obj.addClass(_uiWaterfall3d.modalPersonalize.children[i].className);

                                if (_uiWaterfall3d.modalPersonalize.children[i].type === "checkbox") {
                                    //_modalConfig.children[i].obj.checked
                                    _uiWaterfall3d.modalPersonalize.children[i].obj.prop('checked', _uiWaterfall3d.modalPersonalize.children[i].checked);
                                }
                                if (_uiWaterfall3d.modalPersonalize.children[i].type === "number" || _uiWaterfall3d.modalPersonalize.children[i].type === "range") {
                                    _uiWaterfall3d.modalPersonalize.children[i].obj.prop('max', _uiWaterfall3d.modalPersonalize.children[i].max);
                                }

                                break;

                            case "img":
                                _uiWaterfall3d.modalPersonalize.obj.append('<img id="' + _uiWaterfall3d.modalPersonalize.children[i].name + _wId + '" src="' + _uiWaterfall3d.modalPersonalize.children[i].img + '">');
                                _uiWaterfall3d.modalPersonalize.children[i].obj = $("#" + _uiWaterfall3d.modalPersonalize.children[i].name + _wId);
                                _uiWaterfall3d.modalPersonalize.children[i].obj.addClass(_uiWaterfall3d.modalPersonalize.children[i].className);
                                break;
                            case "button":
                                _uiWaterfall3d.modalPersonalize.obj.append('<input id="' + _uiWaterfall3d.modalPersonalize.children[i].name + _wId + '" type="' + _uiWaterfall3d.modalPersonalize.children[i].type + '" name="' + _uiWaterfall3d.modalPersonalize.children[i].name + '" value="' + _uiWaterfall3d.modalPersonalize.children[i].txt + '">');
                                _uiWaterfall3d.modalPersonalize.children[i].obj = $("#" + _uiWaterfall3d.modalPersonalize.children[i].name + _wId);
                                _uiWaterfall3d.modalPersonalize.children[i].obj.addClass(_uiWaterfall3d.modalPersonalize.children[i].className);
                                break;
                        }

                        event = _uiWaterfall3d.modalPersonalize.children[i].event;

                        if (event !== null) {
                            _uiWaterfall3d.modalPersonalize.children[i].obj.on(event, function (args) {
                                _uiWaterfall3d.value = args.target.value;
                                _uiWaterfall3d.chooseFunction(args.currentTarget.id, "ModalConfig");
                                //_uiWaterfall3d.modalPersonalize.children[i].value = args.target.value;

                            });
                        }

                    }
                    if (canvasType == "Waterfall" || canvasType == "WaterfallRPM") {
                        if (watConfig.type == "espectrograma") {
                            $("#InClassicWat-" + _wId).prop('checked', false);
                            $("#InSpectrogramWat-" + _wId).prop('checked', true);
                        }
                        else {
                            $("#InClassicWat-" + _wId).prop('checked', true);
                            $("#InSpectrogramWat-" + _wId).prop('checked', false);
                        }
                    } else {
                        if (fSWatConfig.type == "espectrograma") {
                            $("#InClassicWat-" + _wId).prop('checked', false);
                            $("#InSpectrogramWat-" + _wId).prop('checked', true);
                        }
                        else {
                            $("#InClassicWat-" + _wId).prop('checked', true);
                            $("#InSpectrogramWat-" + _wId).prop('checked', false);
                        }
                    }

                    break;
                case "Viewer":
                    parentContAreaDialog.append('<div><form role="form"><div class="row"><div class="form-group"><div class="col-md-12"><div id="' + _userInterface.configColorsModalCont.id + "-" + _wId + '"></div></div></div></form></div>');
                    _userInterface.configColorsModalCont.obj = $("#" + _userInterface.configColorsModalCont.id + "-" + _wId);

                    _userInterface.configColorsModalCont.obj.css({
                        "width": "360px",
                        "padding": "10px 10px 10px 10px",
                        "margin": "-30px 10px 30px 10px",
                        "right": "20px",
                        "top": "20px",
                        "background-color": "white",
                        "color": "black"
                    });

                    var children = _userInterface.configColorsModalCont.children;
                    var sub = _userInterface.configColorsModalCont.sub;

                    _userInterface.configColorsModalCont.obj.append('<div style="display: inline-block; position: relative; padding: 15px 15px 5px 15px;">COLORES VISOR 3D</div><br>');

                    var value, colors;
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].type == "ppal") {
                            _userInterface.configColorsModalCont.obj.append('<div style="display: inline-block; position: relative; padding: 15px 15px 5px 15px;">' + children[i].txt + '</div>');
                            value = nodes[id3d + _wId].Properties3d.colors[children[i].id];
                            _userInterface.configColorsModalCont.obj.append('<input id="' + children[i].id + _wId + '" type="color" name="' + children[i].id + '" min="1" value="' + value + '">');
                            $("#" + children[i].id + _wId).addClass("InColor-Waterfall");

                            $("#" + children[i].id + _wId).on("change", function (args) {
                                _userInterface.valueColor = args.target.value;
                                _userInterface.chooseFunction(args.currentTarget.id);
                            });
                        }
                        if (children[i].type == "Title") {
                            _userInterface.configColorsModalCont.obj.append('<br><div style="display: inline-block; position: relative; padding: 15px 15px 5px 15px;">' + children[i].txt + '</div><br>');
                            for (var j = 0; j < sub.length; j++) {
                                _userInterface.configColorsModalCont.obj.append('<div style="display: inline-block; position: relative; padding: 15px 15px 5px 15px;">' + sub[j].txt + '</div>');
                                value = nodes[id3d + _wId].Properties3d.colors[children[i].id][sub[j].id];
                                _userInterface.configColorsModalCont.obj.append('<input id="' + children[i].id + sub[j].id + _wId + '" type="color" name="' + sub[j].id + '" min="1" value="' + value + '">');
                                $("#" + children[i].id + sub[j].id + _wId).addClass("InColor-Waterfall");

                                $("#" + children[i].id + sub[j].id + _wId).on("change", function (args) {
                                    _userInterface.valueColor = args.target.value;
                                    _userInterface.chooseFunction(args.currentTarget.id);
                                });
                            }
                        }
                    }
                    break;
            }



            parentContAreaDialog.append('<div class="form-group" style="display:block; top:290px; left: 70px; position: absolute;">' +
                                    '<div class="row">' +
                                        '<div style="text-align: center;">' +
                                            '<a id="btnSave"  class="btn btn-sm btn-primary" href="#">' +
                                                '<i class="fa fa-filter"></i> Aceptar' +
                                            '</a>' +
                                            '<a id="btnCancel" style=" margin-left: 20px;" class="btn btn-sm btn-primary" href="#">' +
                                                '<i class="fa fa-close"></i> Cancelar' +
                                            '</a>' +
                                        '</div>' +
                                    '</div>' +
                               '</div>');

        };

        _createWaterfallAreaDialog = function (historicalRange, rpmPositions) {

            var parentPPal,
                parentAreaDialog,
                parentContAreaDialog,
                radioGroupName,
                spectrumOption,
                minFrec,
                maxFrec,
                maxArmonic,
                posY,
                title,
                width,
                height;

            if (historicCount > _maxSpecInWaterfall) {
                historicCount = _maxSpecInWaterfall;
            }


            _specContent = [
                {
                    radioValue: 1,
                    checked: "checked",
                    description: " Número de Espectros : ",
                    inputId: "inQtySpec" + canvasType + '-' + _wId,
                    disabled: "",
                    value: historicCount
                },
                {
                    radioValue: 2,
                    checked: "",
                    description: " Espaciamiento : ",
                    inputId: "inSpacement" + canvasType + '-' + _wId,
                    disabled: "disabled",
                    value: 1
                },
            ];

            _frecContent = [
                {
                    description: " Ver armónico nX: ",
                    inputId: "inArmonic" + canvasType + '-' + _wId,
                    disabled: "",
                    value: 5,
                    extra: " X"
                },
                {
                    description: " Máxima Frecuencia : ",
                    inputId: "inMaxFrec" + canvasType + '-' + _wId,
                    disabled: "",
                    value: 600,
                    extra: ""
                }
            ];


            if ($("#canvas" + canvasType + "3D-" + id3d + '-' + _wId)) {
                // posY = parseInt($("#containerParent-" + id3d + _wId).parent().parent().parent().css("top")) - $("#canvas" + canvasType + "3D-" + id3d + '-' + _wId).height();
                posY = $("#" + _this.containerHistoricalId[0].id).parent().parent().parent().position().top;
            } else {
                posY = 0;
            }

            var flagFirstWaterfall = true;

            parentPPal = $("#aspectrogramMainContent");

            parentPPal.append('<div id="waterfallAreaDialog-' + canvasType + '-' + _wId + '" style="display:block;"><div class="control"></div></div>');//style='display:none;'
            parentAreaDialog = $("#waterfallAreaDialog-" + canvasType + "-" + _wId);

            parentAreaDialog.append('<div id="waterfallAreaDialogCont-' + canvasType + '-' + _wId + '" title:"Cantidad de Espectros"></div>');
            parentContAreaDialog = $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId);


            $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId).ejDialog({
                enableResize: false,
                width: 300,
                height: 250,
                zIndex: 2000,
                title: "Configuración Cascada",
                open: function () {
                    if (!flagFirstWaterfall) {

                        minFrec = _waterfall.nomVel * 4 / 60;
                        maxFrec = _sampleRate / 2;
                        maxArmonic = Math.ceil($("#" + _frecContent[1].inputId).val() / (_waterfall.nomVel / 60));

                        $("#inSpacement" + canvasType + '-' + _wId).val(1);
                        $("#" + _frecContent[0].inputId).attr({ "max": maxArmonic });
                        $("#" + _frecContent[1].inputId).attr({ "min": minFrec, "max": maxFrec });

                        $("#Label-" + _frecContent[0].inputId).css("display", "block");
                        $("#Label-" + _frecContent[1].inputId).css("display", "block");
                        //$("#inMaxFrecWaterfall--94619").attr("max", 800)
                        //_velocitySubVariable.Maximum
                    }
                },
                close: function () {
                    //$("#measurementPointCheckList").ejListBox("destroy"); // Destruir objeto Listbox Syncfusion
                    $("#waterfallAreaDialog-" + canvasType + '-' + _wId + "#btnSave").off("click"); // Necesario desasociar el evento
                    $("#waterfallAreaDialog-" + canvasType + '-' + _wId + "#btnCancel").off("click"); // Necesario desasociar el evento
                    $("#waterfallAreaDialog-" + canvasType + '-' + _wId).css("display", "none"); // Ocultar de nuevo el html de la modal
                },
                content: "#waterfallAreaDialog-" + canvasType + '-' + _wId,
                actionButtons: ["close"],
                position: { X: 170, Y: 50 + posY } // Posicionar el ejDialog
            });

            $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId).ejDialog("open");
            $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId).css("display", "block");



            var event;

            radioGroupName = "rdQtySpec";

            for (var i = 0; i < _specContent.length; i++) {
                parentContAreaDialog.append(
                        "<br><label id=\"Label-{4}\" style=\"left: 40px; position: absolute; display: block;\"><input type=\"radio\" name=\"{0}\" value=\"{1}\" {2} style=\"left: -20px; position: absolute; display: block;\"></input>{3}<input type=\"number\" id=\"{4}\" value=\"{5}\" {6} min=\"1\" max=\"{7}\" style=\"width: 50px; position: absolute; display: block; left: 150px; top:0px;\"></input></label>".JsFormat(
                            radioGroupName,
                            _specContent[i].radioValue,
                            _specContent[i].checked,
                            _specContent[i].description,
                            _specContent[i].inputId,
                            _specContent[i].value,
                            _specContent[i].disabled,
                            historicCount
                    ));
                $("#Label-" + _specContent[i].inputId).css({ "top": 30 * (i + 1) + "px" });
            }


            for (var i = 0; i < _frecContent.length; i++) {
                parentContAreaDialog.append(
                        "<br><label id=\"Label-{1}\" style=\"left: 40px; display: none; position: absolute;\">{0}<input type=\"number\" id=\"{1}\" value=\"{2}\" {3} min=\"0\" max=\"{4}\" style=\"width: 50px; position: absolute; left: 150px; top:0px;\"></input></label>".JsFormat(
                            _frecContent[i].description,
                            _frecContent[i].inputId,
                            _frecContent[i].value,
                            _frecContent[i].disabled,
                            6400
                    ));
                $("#Label-" + _frecContent[i].inputId).css({ "top": 30 * (i + 3) + "px" });
            }


            //$("#Label-" + _frecContent[0].inputId).css("marginTop", "12px");
            //$("#Label-" + _frecContent[1].inputId).css("marginTop", "-16px");

            parentContAreaDialog.append('<div class="form-group" style="display:block; top: 150px; left: 80px; position: absolute;">' +
                                    '<div class="row">' +
                                        '<div style="text-align: center;">' +
                                            '<a id="btnSave"  class="btn btn-sm btn-primary" href="#">' +
                                                '<i class="fa fa-filter"></i> Aceptar' +
                                            '</a>' +
                                            '<a id="btnCancel" style=" margin-left: 20px;" class="btn btn-sm btn-primary" href="#">' +
                                                '<i class="fa fa-close"></i> Cancelar' +
                                            '</a>' +
                                        '</div>' +
                                    '</div>' +
                               '</div>');


            $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId + " #btnCancel").click(function (e) {
                e.preventDefault();
                $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId).ejDialog("close");
            });
            $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId + " #btnSave").click(function (e) {

                
                e.preventDefault();
                //_uiWaterfall3d.saveInfoWaterfall();
                if ($("#" + _specContent[0].inputId).val() > historicCount) {
                    $("#" + _specContent[0].inputId).val(historicCount);
                }
                if ($("#" + _specContent[1].inputId).val() > historicCount) {
                    $("#" + _specContent[1].inputId).val(historicCount);
                }
                if (!_flagFirstWaterfall) {
                    if ($("#" + _frecContent[1].inputId).val() > parseInt($("#" + _frecContent[1].inputId).attr("max"))) {
                        $("#" + _frecContent[1].inputId).val($("#" + _frecContent[1].inputId).attr("max"));
                        _waterfall.frecMax = parseInt($("#" + _frecContent[1].inputId).attr("max"));
                    } else {
                        _waterfall.frecMax = parseInt($("#" + _frecContent[1].inputId).val());
                    }
                    if ($("#" + _frecContent[0].inputId).val() > $("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel) {
                        $("#" + _frecContent[0].inputId).val($("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel);
                        _waterfall.armonicValue = parseInt($("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel);
                    }
                }

                _calculateSpacementArray(historicalRange, rpmPositions);

                if (flagFirstWaterfall) {
                    if (canvasType === "Waterfall") {
                        _showWaterfall3d(_measurementPoint.Id);
                    }
                    else if (canvasType === "FullSpecWaterfall") {
                        _showFullSpecWaterfall3d(_measurementPoint.Id);
                    }
                    else if (canvasType === "WaterfallRPM") {
                        _showWaterfallRPM3d(_measurementPoint.Id);
                    }
                    else if (canvasType === "FullSpecWaterfallRPM") {
                        _showFullSpecWaterfallRPM3d(_measurementPoint.Id);
                    }
                    

                    _createWidget(_timeStamp, historicalRange, rpmPositions);
                    //_createLoadingScreen();
                    flagFirstWaterfall = false;

                }
                else {
                    _uiWaterfall3d.actualizeGralInfo(true);
                    _uiWaterfall3d.saveInfoWaterfall();
                   

                    if (canvasType === "Waterfall" || canvasType === "WaterfallRPM") {
                        cascade3d.vbles[id3d + _wId].arrayFilter = _arraySpecFilter;
                    }
                    else if (canvasType === "FullSpecWaterfall" || canvasType === "FullSpecWaterfallRPM") {
                        fullSpecCascade3d.vbles[id3d + _wId].arrayFilter = _arraySpecFilter;
                    }

                }

                $("#waterfallAreaDialogCont-" + canvasType + '-' + _wId).css("display", "none"); // Ocultar de nuevo el html de la modal
                $("#waterfallAreaDialogCont-" + canvasType + "-" + _wId).ejDialog("close");
            });

           
               if (radioGroupName) {
                $("input[name=\"{0}\"]:radio".JsFormat(radioGroupName)).change(function () {
                    var
                        i,
                        radioObj,
                        sensorTypeCode,
                        measureType,
                        fromIntegratedWaveform;

                    radioObj = $(this);
                    
                    if (radioObj.val() == 1) { // Si es por número de espectros
                        
                        _optWatFilter = 1;
                        $("#" + _specContent[0].inputId).attr("disabled", false);
                        $("#" + _specContent[1].inputId).attr("disabled", true);
                        

                    } else if (radioObj.val() == 2) { // Si es por espaciamiento
                        _optWatFilter = 2;
                        $("#" + _specContent[0].inputId).attr("disabled", true);
                        $("#" + _specContent[1].inputId).attr("disabled", false);
                    }
                });
               }

               $("#" + _specContent[0].inputId).change(function () {

                   if (_flagFirstWaterfall) {
                       $("#" + _specContent[1].inputId).val(parseInt(historicCount / $("#" + _specContent[0].inputId).val()));
                   }
                   else {
                       $("#" + _specContent[1].inputId).val(parseInt(_lengthArraySpec / $("#" + _specContent[0].inputId).val()));
                       if ($("#" + _specContent[0].inputId).val > parseInt($("#" + _specContent[0].inputId).attr("max"))) {
                           $("#" + _specContent[0].inputId).val($("#" + _specContent[0].inputId).attr("max"));
                       }    
                   }
               });

               $("#" + _specContent[1].inputId).change(function () {

                   if (_flagFirstWaterfall) {
                       $("#" + _specContent[0].inputId).val(parseInt(historicCount / $("#" + _specContent[1].inputId).val()));
                   }
                   else {
                       $("#" + _specContent[0].inputId).val(parseInt(_lengthArraySpec / $("#" + _specContent[1].inputId).val()));
                   }
               });

               $("#" + _frecContent[0].inputId).change(function () {
                  
                   if ($("#" + _frecContent[0].inputId).val() > $("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel) {
                       $("#" + _frecContent[0].inputId).val($("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel);
                       _waterfall.armonicValue = $("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel;
                   } else {
                       _waterfall.armonicValue = $("#" + _frecContent[0].inputId).val();
                   }
                   _uiWaterfall3d.actualizeGralInfo(false);
               });

               $("#" + _frecContent[1].inputId).change(function () {
                  
                   $("#" + _frecContent[0].inputId).attr({ "max": Math.ceil($("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel) });
                   if ($("#" + _frecContent[0].inputId).val() > $("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel) {
                       $("#" + _frecContent[0].inputId).val(Math.ceil($("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel));
                       _waterfall.armonicValue = Math.ceil($("#" + _frecContent[1].inputId).val() * 60 / _waterfall.nomVel);
                       _waterfall.frecMax = parseInt($("#" + _frecContent[1].inputId).val());
                   } else {
                       _waterfall.frecMax = parseInt($("#" + _frecContent[1].inputId).val());
                   }

                   $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({ "max": _waterfall.frecMax});
                   $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({ "max": _waterfall.frecMax});

                   if (canvasType != "FullSpecWaterfall" && canvasType != "FullSpecWaterfallRPM") {
                       $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({"min": 1 });
                       $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({"min": 1 });
                   } else {
                       $("#" + _uiWaterfall3d.gralInfo.frequency.parts[1] + "-" + id3d + _wId).attr({"min": -_waterfall.frecMax });
                       $("#" + _uiWaterfall3d.gralInfo.frequency.parts[2] + "-" + id3d + _wId).attr({"min": -_waterfall.frecMax });
                   }
                   
               });

        };

        this.Show = function (title, measurementPointId, timeStamp, historicalRange, rpmPositions) {

            var
                loadMeshes,
                manageCanvas,
                idPoint,
                selectedNode,
                subAssets,
                i, all,
                measurementPoint,
                asset;
            
            subAssets = [];
            _containerParentId = "containerParent-" + id3d + _wId;
            _container = document.createElement("div");
            _container.id = _containerParentId;
            _container.style.width = "100%";
            _container.style.height = "100%";

            
            /*
            if (timeMode == 0) {
                asset = selectedAsset;
            }
            else if (timeMode == 1) {
                measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                asset = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", measurementPoint.ParentNodeId, false))[0];
            }
            */
            
            switch (_timeMode) {
                case 0:
                    // Si el asset no tiene un asdaq asociado, significa que no se están actualizando los datos tiempo real de las subVariables
                    // de sus diferentes measurement points
                    asset = selectedAsset;
                    if (asset.IsPrincipal) {
                        all = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("ParentId", "equal", asset.Id, false));
                        for (i = 0; i < all.length; i += 1) {
                            if (all[i].AsdaqId) {
                                asset.AsdaqId = all[i].AsdaqId;
                                break;
                            }
                            else if (all[i].AtrId) { // Para que soporte un asdaq y atr en el mismo activo har que hacer un trabajo adicional a futuro
                                asset.AtrId = all[i].AtrId;
                                break;
                            }
                        }
                    }
                    if (!asset.AsdaqId && !asset.AtrId) {
                        popUp("info", "No hay datos tiempo real para el activo seleccionado.");
                        //return;
                    }
                    if (asset.NominalVelocity) {
                        _nominalVelocity = asset.NominalVelocity;
                    }
                    break;
                case 1:
                    measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    asset = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", measurementPoint.ParentNodeId, false))[0];
                    _measurementPoint = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(
                    new ej.Query().where("Id", "equal", measurementPointId, false))[0];
                    _timeStamp = timeStamp;

                    if (asset.NominalVelocity) {
                        _nominalVelocity = asset.NominalVelocity;
                    }
                    //_timeStart = timeStart
                    //_timeEnd = timeEnd;
                    break;
                default:
                    break;
            }

            if (asset.IsPrincipal && asset.HasChild) {

                for (i = 0; i < mainCache.loadedAssets.length; i++) {
                    if (mainCache.loadedAssets[i].ParentId == asset.Id)
                        subAssets.push(mainCache.loadedAssets[i].Id);
                }

                if (subAssets) {
                    for (i = 0; i < subAssets.length; i += 1) {
                        _measurementPoints.pushArray(ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("ParentId", "equal", subAssets[i], false)));
                    }
                }
            } else if (!asset.IsPrincipal) {
                _measurementPoints = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("ParentId", "equal", asset.Id, false));
                viewer3d.parentId[id3d + _wId] = asset.ParentId;
            } else if (asset.IsPrincipal && !asset.HasChild) {
                _measurementPoints = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("ParentId", "equal", asset.AssetId, false));
            }
                        
            if (viewer3d.containerCanvas[id3d + _wId] === undefined && canvasType === "Viewer") {
                // Construir y mostrar visualización 3d
                _showViewer3d(_measurementPoints, asset, timeStamp, historicalRange, rpmPositions);
            }

            else if (cascade3d.containerCanvas[id3d + _wId] === undefined && (canvasType === "Waterfall")) {
                if (_measurementPoint.SensorTypeCode === 1 || _measurementPoint.SensorTypeCode === 2 && _measurementPoint.AngularReferenceId != null) {
                    _createWaterfallAreaDialog(historicalRange, rpmPositions);
                } 
            }
            else if (cascade3d.containerCanvas[id3d + _wId] === undefined && canvasType ===  "WaterfallRPM") {
                if (_measurementPoint.SensorTypeCode === 1 || _measurementPoint.SensorTypeCode === 2 && _measurementPoint.AngularReferenceId != null) {
                    if (rpmPositions.length > 1) {
                        _createWaterfallAreaDialog(historicalRange, rpmPositions);
                    }
                    else {
                        popUp("info", "No hay datos para mostrar");
                    }
                }
            }
            else if (fullSpecCascade3d.containerCanvas[id3d + _wId] === undefined && canvasType === "FullSpecWaterfall") {
                if (_measurementPoint.SensorTypeCode === 1 || _measurementPoint.SensorTypeCode === 2 && _measurementPoint.AngularReferenceId != null) {

                    _createWaterfallAreaDialog(historicalRange, rpmPositions);
                }
            }
            else if (fullSpecCascade3d.containerCanvas[id3d + _wId] === undefined && canvasType === "FullSpecWaterfallRPM") {
                if (_measurementPoint.SensorTypeCode === 1 || _measurementPoint.SensorTypeCode === 2 && _measurementPoint.AngularReferenceId != null) {
                    if (rpmPositions.length > 1) {
                        _createWaterfallAreaDialog(historicalRange, rpmPositions);
                    }
                    else {
                        popUp("info", "No hay datos para mostrar");
                    }
                    
                }
            }
            else if (canvasType === "Editor") {
                _showEditor();
            } else {
                popUp("info", "Esta ventana ya está abierta");
            }

            globalsReport.elem3D.push({ 'id': id3d + _wId, 'src': null, type: canvasType });
            _assetId = asset.AssetId;
            _nodeId = asset.Id;
            //_createAreaDialogApp3d();
        };

        this.Close = function () {
            if (_subscription) {
                // Eliminar suscripcion de notificacion de llegada de nuevos datos.
                _subscription.remove();
            }

            _manageCanvas.closeCanvas();

            if ($('#app3dAreaDialogFilter-' + canvasType + '-' + _wId)) {
                $('#app3dAreaDialogFilter-' + canvasType + '-' + _wId).remove();
            }
            if ($('#app3dAreaDialog-' + canvasType + '-' + _wId)) {
                $('#app3dAreaDialog-' + canvasType + '-' + _wId).remove();
            }
            if ($('#waterfallAreaDialog-' + canvasType + '-' + _wId)) {
                $('#waterfallAreaDialog-' + canvasType + '-' + _wId).remove();
            }

            var myNode = document.getElementById(_containerParentId);
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            //_viewer3dController.closeWidget(_container);
            var grid, el;
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();

            $.each(globalsReport.elem3D, function (i) {
                if (globalsReport.elem3D[i].id === id3d + _wId) {
                    globalsReport.elem3D.splice(i, 1);
                    return false;
                }
            });

            _pause = true;
        };

        this.reloadJs = function (src) {
            src = $('script[src$="' + src + '"]').attr("src");
            $('script[src$="' + src + '"]').remove();
            $('<script/>').attr('src', src).appendTo('body');
        };
    };

    return App3d;
})();

