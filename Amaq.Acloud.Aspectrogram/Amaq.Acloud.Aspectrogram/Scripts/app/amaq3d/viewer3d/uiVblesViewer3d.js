/*
 * UiVblesViewer3d.js
 * Generacion de DOM para Interfaz de Usuario de Visor 3D
 */

var UiVblesViewer3d = {};

UiVblesViewer3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    UiVblesViewer3d = function (idEntity, wId) {

        var _scene,
            _engine,
            _canvas,
            _variablesV3d,
            _qtyWindows,
            _sizeFont = 9,
            _subVarGroup = [],
            _varMDGroup = [],
            _statusGroup = [],
            _groupsFilter = [],
            _filteredSubVars = [],
            _selectedVarMd = "Mostrar Todos", 
            _selectedStatus = "Todos",
            _selectedSubVar = "",
            _nameDivs,
            _containerId,
            _container,
            _vbleEnter,
            _asignColorsToSensorTypes,
            _createDivsWindows,
            _showAlphaPlaneText,
            _showHidePlaneText,
            _selectCanvas,
            _createGroups,
            _aplicateFilter,
            _nameDivsVbles = "divVblesViewer3d-",
            _createFilterModal;

      
        var scope = this;

        this.subVblesNames = [];
        this.subVblesViewer3d = [];
        this.vblesViewer3d = [];
        this.filteredSubVars;

        /*
        _nameDivs = {
            status: "divStatusV3d-",
            tag: "divTagV3d-",
            value: "divValueV3d-",
            units: "divUnitsV3d-",
        };*/

        _nameDivs = {
            orderPts: "divOrderPointsV3d-",
            vbleColor: "divVbleColorV3d-",
            tag: "divTagV3d-",
            status: "divStatusV3d-",
            value: "divValueV3d-",
            units: "divUnitsV3d-",
        };

        _createGroups = function () {

            var i;
            //var varMDGroup = [], subVarGroup = [], statusGroup = [];

            _varMDGroup.push("Mostrar Todos");
            for (i = 0; i < sensorTypes.length; i++) {
                _varMDGroup.push(sensorTypes[i].Name);
            }
            _varMDGroup.push("Ocultar Todos");

            _statusGroup.push("Todos");
            for (i = 0; i < arrayObjectStatus.length; i++) {
                _statusGroup.push(arrayObjectStatus[i].Name);
            }
            

            _subVarGroup = scope.subVblesNames;

            _groupsFilter = [{ name: "varMD", group: _varMDGroup }, { name: "status", group: _statusGroup }, { name: "subVar", group: _subVarGroup }];

            _selectedVarMd = _varMDGroup[0];
            _selectedStatus = _statusGroup[0];
            _selectedSubVar = _subVarGroup[0];
            
        };

        this.createDivsWindows = function () {
            var sizeFont, totalSize, heightCanvas, widthWindow, heightWindow, qtyVbles, heightVbleDiv, margin, padding, i, nameDivsVbles;

            heightCanvas = viewer3d.containerCanvas[idEntity + wId].clientHeight - $("#ind-gralInfo-Viewer3d-" + idEntity + wId)[0].clientHeight * 1.2;
            sizeFont = 9;
            margin = 1;
            padding = 1;
            _qtyWindows = 1;
            nameDivsVbles = "divVblesViewer3d-";


            widthWindow = sizeFont * (1.4 + 18); //Numero de letras, mas tamaño de indicador
            heightVbleDiv = sizeFont + (margin + padding) * 2;

            _containerId = viewer3d.containerCanvas[idEntity + wId].id;
            _container = $("#" + _containerId);

            qtyVbles = scope.vblesViewer3d.length;

            _qtyWindows = Math.ceil( qtyVbles * heightVbleDiv / heightCanvas);

            for (i = 0; i < _qtyWindows; i++) {
                _container.append('<div id="' + _nameDivsVbles + i + "-" + idEntity + wId + '"></div>');
                $("#" + _nameDivsVbles + i + "-" + idEntity + wId).addClass("classVblesViewer3d");
                if (i === 0) {
                    $("#" + _nameDivsVbles + i + "-" + idEntity + wId).css({
                        "left": "0px"
                    });                    
                }
                if (i === 1) {
                    $("#" + _nameDivsVbles + i + "-" + idEntity + wId).css({
                        "right": "60px"
                    });
                }
                $("#" + _nameDivsVbles + i + "-" + idEntity + wId).hide();
            }

            var numWindow;

            for (i = 0; i < qtyVbles; i++) {
                if (_qtyWindows <= 2) {
                    if (i < qtyVbles / _qtyWindows) {
                        numWindow = 0;                                             
                    } else {
                        numWindow = 1;
                    }
                    $("#" + _nameDivsVbles + numWindow + "-" + idEntity + wId).append('<div id="' + _nameDivsVbles + "-" + idEntity + wId + "-" + scope.vblesViewer3d[i] + '"></div>');

                    $("#" + _nameDivsVbles + "-" + idEntity + wId + "-" + scope.vblesViewer3d[i]).addClass("classDivVbleViewer3d");

                    $("#" + _nameDivsVbles + "-" + idEntity + wId + "-" + scope.vblesViewer3d[i]).mouseenter(function (args) {
                        _showAlphaPlaneText(args.target.id.split("-")[1], true);
                        _vbleEnter = args.target.id.split("-")[1];
                    }).mouseleave(function (args) {
                        if (!args.target.id.split("-")[1]) {
                            _showAlphaPlaneText(_vbleEnter, false);
                        } else {
                            _showAlphaPlaneText(args.target.id.split("-")[1], false);
                        }                     
                      });

                    var divPoint = $("#" + _nameDivsVbles + "-" + idEntity + wId + "-" + scope.vblesViewer3d[i]);

                    divPoint.append('<div id="' + _nameDivs.orderPts + scope.vblesViewer3d[i] + wId + '" class="classDivOrderPoint" ></div>');
                    divPoint.append('<div id="' + _nameDivs.vbleColor + scope.vblesViewer3d[i] + wId + '" class="classDivVbleColor"></div>');
                    divPoint.append('<div id="' + _nameDivs.tag + scope.vblesViewer3d[i] + wId + '" class="classDivTag"></div>');
                    divPoint.append('<div id="' + _nameDivs.status + scope.vblesViewer3d[i] + wId + '" class="classDivStatus"></div>');
                    divPoint.append('<div id="' + _nameDivs.value + scope.vblesViewer3d[i] + wId + '" class="classDivValue"></div>');
                    divPoint.append('<div id="' + _nameDivs.units + scope.vblesViewer3d[i] + wId + '" class="classDivUnits"></div>');

                }               
            }

            $("#" + _nameDivsVbles + 0 + "-" + idEntity + wId).hide();
            $("#" + _nameDivsVbles + 1 + "-" + idEntity + wId).hide();

            //$("#" + divVblesViewer3d).hide();

        }; 

        /*
        _aplicateFilter = function () {

            var statusColor, sensorType = 0, i, j;
            _filteredSubVars = [];

            for(i = 0; i < arrayObjectStatus.length; i++){
                if (arrayObjectStatus[i].Name == _selectedStatus) {
                    statusColor = arrayObjectStatus[i].Color;
                }
            }
            for (i = 0; i < sensorTypes.length; i++) {
                if (sensorTypes[i].Name == _selectedVarMd) {
                    sensorType = sensorTypes[i].Code;
                }
            }

            $("#" + _nameDivsVbles + 0 + "-" + idEntity + wId).show();
            $("#" + _nameDivsVbles + 1 + "-" + idEntity + wId).show();
            
            if (statusColor == undefined) {
                statusColor = "Todos";
            }

            for (i = 0 ; i < scope.subVblesViewer3d.length; i++) {               

                if (scope.subVblesViewer3d[i].sensorType == sensorType && statusColor == "Todos" && scope.subVblesViewer3d[i].tag == _selectedSubVar) {
                    _filteredSubVars.push(scope.subVblesViewer3d[i]);
                    _showHidePlaneText(true, true);
                }
                else if (scope.subVblesViewer3d[i].sensorType == sensorType && scope.subVblesViewer3d[i].statusColor == statusColor && scope.subVblesViewer3d[i].tag == _selectedSubVar) {
                    _filteredSubVars.push(scope.subVblesViewer3d[i]);
                    _showHidePlaneText(true, true);
                }
                else if (_selectedVarMd == "Mostrar Todos" && scope.subVblesViewer3d[i].statusColor == statusColor && scope.subVblesViewer3d[i].tag == _selectedSubVar) {
                    _filteredSubVars.push(scope.subVblesViewer3d[i]);
                    _showHidePlaneText(true, true);
                }
                else if (_selectedVarMd == "Mostrar Todos" && statusColor == "Todos" && scope.subVblesViewer3d[i].tag == _selectedSubVar) {
                    _filteredSubVars.push(scope.subVblesViewer3d[i]);
                    //_showHidePlaneText(true, true);
                }
                else if (_selectedVarMd == "Ocultar Todos") {
                    _filteredSubVars = [];
                    _showHidePlaneText(false, false);
                }
                else if (_selectedVarMd == "Mostrar Todos" && statusColor == "Todos" && "Directa" == _selectedSubVar) {
                    //_filteredSubVars.push(scope.subVblesViewer3d[i]);
                    _showHidePlaneText(true, false);
                }
                else {
                    _showHidePlaneText(true, true);
                }
            }
            globals3d.filteredSV[idEntity+ wId] = _filteredSubVars;

            scope.loadValues();

        };
        */
        _showHidePlaneText = function (flagHideShow, flagFilter) {
            var canvasText, i;
            _scene = viewer3d.scene[idEntity+ wId];
            for (i = 0 ; i < scope.subVblesViewer3d.length; i++) {
                if (_scene.getMeshByName(globals3d.names.text.plane + scope.subVblesViewer3d[i].id + wId)) {
                    canvasText = _scene.getMeshByName(globals3d.names.text.plane + scope.subVblesViewer3d[i].id + wId);
                    if (flagHideShow) {
                        canvasText.material.alpha = 0.0;
                    }
                    else {
                        canvasText.material.alpha = 1;
                    }
                }              
            }

            if (flagFilter) {
                for (i = 0 ; i < _filteredSubVars.length; i++) {
                    if (_scene.getMeshByName(globals3d.names.text.plane + _filteredSubVars[i].id + wId)) {
                        canvasText = _scene.getMeshByName(globals3d.names.text.plane + _filteredSubVars[i].id + wId);
                        canvasText.material.alpha = 1;
                    }                   
                }
            }
        };

        _showAlphaPlaneText = function (idSubVar, flagEnter) {
            var canvasText;
            if (_selectedVarMd == "Mostrar Todos" && _selectedStatus == "Todos" && "Directa" == _selectedSubVar) {
                if (_scene.getMeshByName(globals3d.names.text.plane + idSubVar + wId)) {
                    canvasText = _scene.getMeshByName(globals3d.names.text.plane + idSubVar + wId);
                    if (flagEnter) {
                        canvasText.material.alpha = 1;
                    }
                    else {
                        canvasText.material.alpha = 0.0;
                    }
                }
            }            
        };

        this.loadValues = function () {

            var i, tag, value, units, statusColor, order, sensorTypeColor, lastId;

            _filteredSubVars = scope.subVblesViewer3d;
            globals3d.filteredSV[idEntity + wId] = _filteredSubVars;
            

            for (i = 0; i < scope.vblesViewer3d.length; i++) {
                $("#" + _nameDivsVbles + "-" + idEntity + wId + "-" + scope.vblesViewer3d[i]).css({ "display": "none" });
            }

            for (i = 0; i < _filteredSubVars.length; i++) {
                for (var k = 0; k < scope.subVblesViewer3d.length; k++) {
                    if (_filteredSubVars[i].id === scope.subVblesViewer3d[k].id) {
                        
                        if (lastId !== _filteredSubVars[i].id) {

                            for (var j = 0; j < sensorTypes.length; j++) {
                                if (_filteredSubVars[i].sensorType === sensorTypes[j].Code) {
                                    sensorTypeColor = sensorTypes[j].Color;
                                }
                            }

                            statusColor = scope.subVblesViewer3d[k].statusColor;
                            tag = _filteredSubVars[i].name;
                            if (scope.subVblesViewer3d[k].value !== null) {
                                value = scope.subVblesViewer3d[k].value.toFixed(3);
                            }
                            else {
                                value = "";
                            }

                            units = _filteredSubVars[i].units;
                            order = i + 1;

                            $("#" + _nameDivs.vbleColor + _filteredSubVars[i].id + wId).css({ "background-color": sensorTypeColor });
                            $("#" + _nameDivs.orderPts + _filteredSubVars[i].id + wId).text(order);
                            $("#" + _nameDivs.status + _filteredSubVars[i].id + wId).css({ "background-color": statusColor });
                            $("#" + _nameDivs.tag + _filteredSubVars[i].id + wId).text(" " + tag);
                            $("#" + _nameDivs.value + _filteredSubVars[i].id + wId).text(value);
                            $("#" + _nameDivs.units + _filteredSubVars[i].id + wId).text("[" + units + "]");

                            $("#" + _nameDivsVbles + "-" + idEntity + wId + "-" + _filteredSubVars[i].id).css({ "display": "block" });

                        }
                       
                    lastId = _filteredSubVars[i].id;
                    }
                }

                
            }

            scope.filteredSubVars = _filteredSubVars;
        };

        _asignColorsToSensorTypes = function () {
            var arrayColors = ["#C8BFE7", "#99D9EA", "#D1F075", "#EFE4B0", "#FF75A2"];
            for (var i = 0; i < sensorTypes.length; i++) {
                sensorTypes[i].Color = arrayColors[i];
            }
        }();

    };
    return UiVblesViewer3d;
})();