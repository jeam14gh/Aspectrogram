/*
 * uiWaterfall3d.js
 * Generacion de DOM para Interfaz de Usuario de Editor 3D
 */

var UiWaterfall3d = {};

UiWaterfall3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    UiWaterfall3d = function (idPoint, waterfall, wId, arraySignal, arraySignalY, flagFullSpec, rotDir) {

        var _scene,
            _engine,
            _camera,
            _containerId,
            _container,
            _createGralInfo,
            _createMenuGral,
            _createCtxMenu,
            _openCloseModal,
            _saveImage,
            _srcIcons,
            _flags,
            _modalPersonalize,
            _value,
            _watConfig,
            _launchFullScreen,
            _fullScreen = false,
            _selectValuesModal,
            _values = {},
            _cancelFullscreen,
            _loadInFullScreen,
            _loadValuesInfoGral,
            _createConfigWindow,
            _createContextMenu,
            _createModalConfig,
            _contextMenu3d,
            _chooseFunction,
            _showTooltipCtxt,
             _showHideArmonicLines,
             _changeColorLines,
             _arrayMaxYArmonics,
             _showArmonicInfo,
             _locateCamera,
            _vbles = cascade3d.vbles[idPoint + wId],
            _arraySpec = [],
            _asignQtySpec,
            _asignQtyArm,
            _selBilog,
            _selClassicSpectrogram,
            _goBackBmp,
            _selectImgBmp,
            _goNextBmp,
            _selBackgroundColor,
            _selLabelsColor,
            _saveInfoWaterfall,
            _cancelConfigWaterfall,
            _srcImagesBmp,
            _imgwaterfall3d;

        _srcImagesBmp = "../Content/bmpWaterfall/Gradientes/";
        _srcIcons = "../Content/images/waterfall/";
        _imgwaterfall3d = new ImgWaterfall3d(idPoint, waterfall, wId, flagFullSpec);
        _watConfig = watConfig;

        if (!flagFullSpec) {
            _containerId = cascade3d.containerCanvas[idPoint + wId].id;
            _container = $("#" + _containerId);

            _scene = cascade3d.scene[idPoint + wId];
            _engine = cascade3d.engine[idPoint + wId];
            _camera = cascade3d.scene[idPoint + wId].activeCamera;
            _vbles = cascade3d.vbles[idPoint + wId];
        } else {
            _containerId = fullSpecCascade3d.containerCanvas[idPoint + wId].id;
            _container = $("#" + _containerId);

            _scene = fullSpecCascade3d.scene[idPoint + wId];
            _engine = fullSpecCascade3d.engine[idPoint + wId];
            _camera = fullSpecCascade3d.scene[idPoint + wId].activeCamera;
            _vbles = fullSpecCascade3d.vbles[idPoint + wId];
        }

        var scope = this;

        this.value = null;

            this.loadInFullScreen = function () {
                if (!_fullScreen) {
                    _launchFullScreen();
                } else {
                    _cancelFullscreen();
                }
            };

            this.saveImage = function () {              
                _imgwaterfall3d.flagSaveFile = true;
                _imgwaterfall3d.gralInfoDivName = scope.gralInfo.id + "-" + idPoint + wId;
                _imgwaterfall3d.saveImage();
            };

            _openCloseModal = function () {
                _scene.cameras[0].inputs.attached.keyboard.detachControl();
                _modalPersonalize.obj.show();
            };

            _asignQtySpec = function () {
                _watConfig.specQty = scope.value;
            };

            _asignQtyArm = function () {
                _watConfig.armQty = scope.value;
            };

            _selClassicSpectrogram = function () {
                _watConfig.type = scope.value;
                if (scope.value == "espectrograma") {
                    $("#InClassicWat-" +  wId).prop('checked', false);
                    $("#InSpectrogramWat-" +  wId).prop('checked', true);
                }
                else {
                    $("#InClassicWat-" + wId).prop('checked', true);
                    $("#InSpectrogramWat-" + wId).prop('checked', false);
                }
            };

            _selBilog = function () {
                _watConfig.bilog = $("#InBilogWat-" + wId).is(':checked')
            };

            _selectImgBmp = function () {
                var num = parseInt(scope.value) - 1;
                _watConfig.numChromeScale = num;
               
                $("#imgBmpWaterfall-" + wId).attr("src", "../Content/bmpWaterfall/" + arrayBmp[num] + ".bmp");
            };

            _selBackgroundColor = function () {
                _watConfig.bGColor = scope.value;
                _scene.clearColor = BABYLON.Color3.FromHexString(scope.value);
            };

            _selLabelsColor = function () {

                var infoLabels,
                    qtyLines,
                    parentName,
                    nameL,
                    nameM,
                    nameS,
                    textUnits,
                    textValue,
                    colorL,
                    infoTxt,
                    qtyLabels,
                    qtyInfoTxt;

                infoLabels = waterfall.infoLabels;
                _watConfig.labelsColor = scope.value;
                colorL = scope.value;

                qtyLines = infoLabels.lines.qty;
                nameL = infoLabels.lines.nameL;
                nameM = infoLabels.lines.nameM;
                nameS = infoLabels.lines.nameS;
                textUnits = infoLabels.text.units;
                textValue = infoLabels.text.value;
                infoTxt = infoLabels.text.info;

                if (flagFullSpec) {
                    qtyLabels = 10;
                } else {
                    qtyLabels = 6;
                }

                for (var h = 1; h <= qtyLabels; h++) {
                    parentName = "LabelsAxis-" + h + "-";
                    _scene.getMeshByName(parentName + "lineWat-L-0").color = BABYLON.Color3.FromHexString(colorL);
                    for (var i = 1; i <= qtyLines * 4; i++) {

                        if (i <= qtyLines) {
                            _scene.getMeshByName(parentName + "lineWat-L-" + i).color = BABYLON.Color3.FromHexString(colorL);
                            _scene.getMeshByName(parentName + "lineWat-M-" + i).color = BABYLON.Color3.FromHexString(colorL);
                        }

                        if (i % 2 !== 0) {
                            _scene.getMeshByName(parentName + "lineWat-S-." + i).color = BABYLON.Color3.FromHexString(colorL);
                        }
                    }
                }

                if (flagFullSpec) {
                    qtyInfoTxt = infoTxt.length;
                    _scene.getMeshByName("Labels-units-Reverse").material.diffuseColor = BABYLON.Color3.FromHexString(colorL);
                    _scene.getMeshByName("Labels-units-Reverse").material.emissiveColor = BABYLON.Color3.FromHexString(colorL);
                    _scene.getMeshByName("Labels-units-Reverse").material.specularColor = BABYLON.Color3.FromHexString(colorL);


                    _scene.getMeshByName("Labels-units-Forward").material.diffuseColor = BABYLON.Color3.FromHexString(colorL);
                    _scene.getMeshByName("Labels-units-Forward").material.emissiveColor = BABYLON.Color3.FromHexString(colorL);
                    _scene.getMeshByName("Labels-units-Forward").material.specularColor = BABYLON.Color3.FromHexString(colorL);
                } else {
                    qtyInfoTxt = 4;
                }

                for (var i = 0; i < qtyInfoTxt; i++) {
                    if ((i != 3 && flagFullSpec) || !flagFullSpec) {
                        if (infoTxt[i].units !== null) {
                            _scene.getMeshByName(textUnits + infoTxt[i].id).material.diffuseColor = BABYLON.Color3.FromHexString(colorL);
                            _scene.getMeshByName(textUnits + infoTxt[i].id).material.emissiveColor = BABYLON.Color3.FromHexString(colorL);
                        }
                        for (var j = 0; j <= qtyLines; j++) {
                            _scene.getMeshByName(textValue + infoTxt[i].id + "-" + j).material.diffuseColor = BABYLON.Color3.FromHexString(colorL);
                            _scene.getMeshByName(textValue + infoTxt[i].id + "-" + j).material.emissiveColor = BABYLON.Color3.FromHexString(colorL);
                        }
                    }
                }
            };

            this.saveInfoWaterfall = function () {
                var meshes;
                
                var meshesQty = _scene.meshes.length;

                if (flagFullSpec) {
                    fSWatConfig = _watConfig;
                    fullSpecCascade3d.contLoader[idPoint + wId].show();
                } else {
                    watConfig = _watConfig;
                    cascade3d.contLoader[idPoint + wId].show();
                }

                for (var i = _scene.meshes.length - 1; i >= 0; i--) {
                    _scene.meshes[i].dispose();
                }

                waterfall.createHistoricWaterfall();
                
                if (flagFullSpec) {
                    if (fSWatConfig.type == "espectrograma") {
                        waterfall.fillWaterfallHistCubesFullSpec(arraySignal, arraySignalY, rotDir);
                    }else{
                        waterfall.fillClassicWaterfallHistFullSpec(arraySignal, arraySignalY, rotDir);
                    }
                } else {
                    if (watConfig.type == "espectrograma") {
                        waterfall.fillWaterfallHistCubes(arraySignal);
                    }else if (watConfig.type == "clasica") {
                        waterfall.fillClassicWaterfallHist(arraySignal);
                    }
                }
                
            };

            _cancelConfigWaterfall = function () {
                _modalPersonalize.obj.hide();
                _scene.cameras[0].inputs.attachInput(_scene.cameras[0].inputs.attached.keyboard);
            };

            this.locateCamera = function () {
                waterfall.locateCamera();
            };

            this.showArmonicInfo = function () {
                if ($("#" + scope.gralInfo.numSpec.id + "-" + idPoint + wId).css("display") === "none") {
                    $("#infoSpec-Waterfall").show();
                    $("#" + scope.gralInfo.numSpec.id + "-" + idPoint + wId).show();
                    $("#" + scope.gralInfo.actVel.id + "-" + idPoint + wId).show();
                    $("#" + scope.gralInfo.timeStamp.id + "-" + idPoint + wId).show();
                    $("#" + scope.gralInfo.armonics.id + "-" + idPoint + wId).show();
                    $("#" + scope.gralInfo.frequency.id + "-" + idPoint + wId).show();
                }
                else {
                    $("#infoSpec-Waterfall").hide();
                    $("#" + scope.gralInfo.numSpec.id + "-" + idPoint + wId).hide();
                    $("#" + scope.gralInfo.actVel.id + "-" + idPoint + wId).hide();
                    $("#" + scope.gralInfo.timeStamp.id + "-" + idPoint + wId).hide();
                    $("#" + scope.gralInfo.armonics.id + "-" + idPoint + wId).hide();
                    $("#" + scope.gralInfo.frequency.id + "-" + idPoint + wId).hide();
                }
            };


        this.pointInfo = {
            pointName: "",
            timeRange: ""
        };

        this.gralInfo = {
            id: "gralInfo-Waterfall",
            className: "infoGralWaterfall3d",
            pointInfo: {
                id: "pointInfoWaterfall",
                className: "groupsWaterfall",
                children: [
                    { id: "PointName-Wat" },
                    { id: "NominalVel-Wat"},
                    { id: "TimeRange-Wat"}
                ]
            },
            numSpec:{ id: "Num-Espec-Wat-", txt: "Número de Espectro: " },
            actVel: { id: "Actual-Vel-Wat", txt: "Velocidad: " },
            timeStamp: { id: "Actual-timeStamp-Wat", txt: "Fecha: " },
            armonics: {
                id: "armonicWaterfall",
                className: "groupsArmonics",
                name: "armonicWF-",
                parts: ["name", "color", "cB", "tB"],
                classNameParts: "cdPartArmonic"
            },
            frequency: {
                id: "frequencyWaterfall",
                className: "groupsFrequency",
                parts: ["cBFreq", "iTFreq","slFreq", "lblUnits"]
            }
        };

        _selectValuesModal = function () {

            if(flagFullSpec){
               
                _values.specQty = fSWatConfig.specQty;
                _values.armQty = fSWatConfig.armQty;

                _values.labelsColor = fSWatConfig.labelsColor;
                if (fSWatConfig.type == "espectrograma") {
                    _values.typeSpectrogram = true;
                    _values.typeClassic = false;
                } else {
                    _values.typeSpectrogram = false;
                    _values.typeClassic = true;
                }
                _values.numChromeScale = fSWatConfig.numChromeScale;
                _values.bilog = fSWatConfig.bilog;


            }else{
                _values.specQty = watConfig.specQty;
                _values.armQty = watConfig.armQty;

                _values.labelsColor = watConfig.labelsColor;
                if (watConfig.type == "espectrograma") {
                    _values.typeSpectrogram = true;
                    _values.typeClassic = false;
                } else {
                    _values.typeSpectrogram = false;
                    _values.typeClassic = true;
                }
                _values.numChromeScale = watConfig.numChromeScale;
                _values.bilog = watConfig.bilog;
            }
            _values.bGColor = _scene.clearColor.toHexString();

            
        }();

        this.modalPersonalize = {
            obj: null,
            id: "modalPersonalize-Waterfall3d-",
            children: [
                {
                    obj: null,
                    name: "InBackgroundColorWat-",
                    txt: "Color Fondo: ",
                    type: "color",
                    fcn: _selBackgroundColor,
                    event: "change",
                    className: "InColor-Waterfall",
                    value: _values.bGColor
                },
                {
                    obj: null,
                    name: "InLabelsColorWat-",
                    txt: "Color Rótulos: ",
                    type: "color",
                    fcn: _selLabelsColor,
                    event: "change",
                    className: "InColor-Waterfall",
                    value: _values.labelsColor
                },
                {
                    obj: null,
                    name: "InClassicWat-",
                    txt: "Clasica: ",
                    type: "checkbox",
                    fcn: _selClassicSpectrogram,
                    event: "change",
                    className: "InCB-Waterfall",
                    value: "clasica",
                    checked: _values.typeSpectrogram
                },
                {
                    obj: null,
                    name: "InSpectrogramWat-",
                    txt: "Espectrograma: ",
                    type: "checkbox",
                    fcn: _selClassicSpectrogram,
                    event: "change",
                    className: "InCB-Waterfall",
                    value: "espectrograma",
                    checked: _values.typeClassic
                },
                {
                    obj: null,
                    name: "InBilogWat-",
                    txt: "Compensación Bilog: ",
                    type: "checkbox",
                    fcn: _selBilog,
                    event: "change",
                    className: "InCB-Waterfall",
                    checked: _values.bilog
                },
                {
                    obj: null,
                    name: "divSelectBmp-",
                    txt: "Escala Cromática: ",
                    type: "range",
                    event: "change",
                    className: "InRange-Waterfall",
                    fcn: _selectImgBmp,
                    value: _values.numChromeScale,
                    max: 18                  
                },
                {
                    obj: null,
                    name: "imgBmpWaterfall-",
                    type: "img",
                    img: "../Content/bmpWaterfall/" + arrayBmp[_values.numChromeScale] + ".bmp",
                    event: null,
                    className: "ImgBmp-Waterfall"
                }
            ]
        };

        _contextMenu3d = {
            obj: null,
            id: "ctxtMenu-Waterfall3d-",
            children: [
                {
                    obj: null,
                    name: "btnConfigWaterfall",
                    fcn: _openCloseModal,
                    img: "Config.png",
                    txt: "Configuración"
                },
                 {
                     obj: null,
                     name: "btnInfoWaterfall",
                     fcn: _showArmonicInfo,
                     img: "Info.png",
                     txt: "Info Armonicos"
                 },
                {
                    obj: null,
                    name: "btnInitialViewWaterfall",
                    fcn: _locateCamera,
                    img: "Eye.png",
                    txt: "Vista inicial"
                },
                {
                    obj: null,
                    name: "btnFullScreenWaterfall",
                    fcn: _loadInFullScreen,
                    img: "TotalScreen3d.png",
                    txt: "Pantalla Completa"
                },
                {
                    obj: null,
                    name: "btnSaveImageWaterfall",
                    fcn: _saveImage,
                    img: "Save.png",
                    txt: "Guardar Imagen"
                },
            ]
        };

        _createGralInfo = function () {

            var numSpec,
                numArmonic;

            if (_vbles.numSpec === undefined) {
                numSpec = "";
            }

            _vbles.loadGralInfo = _loadValuesInfoGral;

            _vbles.pointName = scope.pointInfo.pointName;
            _vbles.timeRange = scope.pointInfo.timeRange;

            _container.append('<div id="' + scope.gralInfo.id + "-" + idPoint + wId + '"></div>');
            $("#" + scope.gralInfo.id + "-" + idPoint + wId).addClass(scope.gralInfo.className);
            $("#" + scope.gralInfo.id + "-" + idPoint + wId).css({
                "top": "0px",
                "left": "2px"
            });

            //Info del Punto

            $("#" + scope.gralInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.pointInfo.id + "-"
                + idPoint + wId + '"></div>');

            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.pointInfo.children[0].id +
                "-" + idPoint + wId + '">' + scope.pointInfo.pointName + '</div>');

            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.pointInfo.children[2].id +
                "-" + idPoint + wId + '">' + scope.pointInfo.timeRange[0] + ' - ' + scope.pointInfo.timeRange[1] + '</div>');

            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.numSpec.id +
                "-" + idPoint + wId + '">' + scope.gralInfo.numSpec.txt + numSpec + '</div>');
            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.actVel.id +
                "-" + idPoint + wId + '">' + scope.gralInfo.actVel.txt + numSpec + '</div>');
            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.timeStamp.id + "-" + idPoint + wId + '">' + scope.gralInfo.timeStamp.txt + numSpec + '</div>');

            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.armonics.id + "-" + idPoint + wId + '" style ="border-top: solid 3px; border-botom: solid 4px;"></div>');

            $("#" + scope.gralInfo.armonics.id + "-" + idPoint + wId).append('<div style="font-size: 14px;">Cursores Armónicos</div>');

            for (var i = 0; i < waterfall.qtyArm; i++) {
                numArmonic = 1 + parseInt(i);
                if (i == waterfall.qtyArm - 1) {
                    numArmonic = parseInt(waterfall.armonicValue);
                }
                $("#" + scope.gralInfo.armonics.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.armonics.name + "-" + i + "-" + idPoint + wId + '"></div>');
                $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + idPoint + wId).addClass(scope.gralInfo.armonics.className);
                for (var j = 0; j < scope.gralInfo.armonics.parts.length; j++) {

                    switch (j) {
                        case 0: $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.armonics.name + "-" + i + "-" +
                                scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId + '">' + numArmonic + 'X : </div>');
                            break;
                        case 1: $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + idPoint + wId).append('<input type="checkbox" id="' + scope.gralInfo.armonics.name + i + "-" +
                                scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId + '"/>');

                            $("#" + scope.gralInfo.armonics.name + i + "-" + scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId).on("change", function (args) {
                                _showHideArmonicLines(args.target.id.split("-")[1], args.target.checked);
                            });
                            break;
                        case 2: $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + idPoint + wId).append('<input type="color"  id="' + scope.gralInfo.armonics.name + i + "-" +
                                scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId + '"/>');
                            $("#" + scope.gralInfo.armonics.name + i + "-" + scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId).css({
                                "width": "20px",
                                "padding" : "0px 0px 0px 0px"
                            });
                            $("#" + scope.gralInfo.armonics.name + i + "-" + scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId).val(waterfall.armonicColors[i]);
                            
                            $("#" + scope.gralInfo.armonics.name + i + "-" + scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId).on("change", function (args) {
                                _changeColorLines(args.target.id.split("-")[1], args.target.value);
                            });
                            break;
                        case 3: $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.armonics.name + "-" + i + "-" +
                                scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId + '"></div>');
                            break;
                    }
                    
                    $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + scope.gralInfo.armonics.parts[j] + "-" + j + "-" + idPoint + wId).addClass(scope.gralInfo.armonics.classNameParts);
                }                
            }

            $("#" + scope.gralInfo.pointInfo.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.frequency.id + "-" + idPoint + wId + '"><div style="font-size: 14px; border-top:4px solid; height: 100px;">Cursor de Frecuencia</div></div>');

            $("#" + scope.gralInfo.frequency.id + "-" + idPoint + wId).append('<input type="checkbox" id="' + scope.gralInfo.frequency.parts[0] + "-" + idPoint + wId + '" >');

            $("#" + scope.gralInfo.frequency.parts[0] + "-" + idPoint + wId).css({
                "position": "absolute",
                "top": "273px",
                "left": "30px"
            });

            $("#" + scope.gralInfo.frequency.id + "-" + idPoint + wId).append('<input type="number" id="' + scope.gralInfo.frequency.parts[1] + "-" + idPoint + wId + '" value="' + waterfall.xCoordinateUnit.Factor + '" min="' + waterfall.xCoordinateUnit.Factor + '" step="' + waterfall.xCoordinateUnit.Factor + '">');

            $("#" + scope.gralInfo.frequency.parts[1] + "-" + idPoint + wId).css({
                "position": "absolute",
                "top": "273px",
                "left": "80px",
                "width": "55px",
                "color": "black"
            });

            $("#" + scope.gralInfo.frequency.id + "-" + idPoint + wId).append('<div id="' + scope.gralInfo.frequency.parts[3] + "-" + idPoint + wId + '"></div>');

            $("#" + scope.gralInfo.frequency.parts[3] + "-" + idPoint + wId).css({
                "position": "absolute",
                "font-size": "12px",
                "top": "273px",
                "left": "140px",
                "width": "55px",
                "color": "whitesmoke"
            });

            $("#" + scope.gralInfo.frequency.parts[3] + "-" + idPoint + wId).text(waterfall.xCoordinateUnit.Text);

            $("#" + scope.gralInfo.frequency.id + "-" + idPoint + wId).append('<input type="range" id="' + scope.gralInfo.frequency.parts[2] + "-" + idPoint + wId + '" value="' + waterfall.xCoordinateUnit.Factor + '" min="' + waterfall.xCoordinateUnit.Factor + '"  step="' + waterfall.xCoordinateUnit.Factor + '">');

            $("#" + scope.gralInfo.frequency.parts[2] + "-" + idPoint + wId).css({
                "position": "absolute",
                "top": "306px",
                "left": "5px",
                "width": "180px"
            });

            var checked = false;
            //waterfall.chooseFrecuency($("#" + scope.gralInfo.frequency.parts[2] + "-" + idPoint + wId).val());

            $("#" + scope.gralInfo.frequency.parts[0] + "-" + idPoint + wId).on("change", function (args) {
                _scene.getMeshByName("boxFreqChoosed").visibility = args.target.checked;
                _scene.getMeshByName("lineFreq-" + idPoint + wId).visibility = args.target.checked;
                checked = args.target.checked;
            });

            $("#" + scope.gralInfo.frequency.parts[1] + "-" + idPoint + wId).on("change", function (args) {
                if ($("#" + scope.gralInfo.frequency.parts[0] + "-" + idPoint + wId)[0].checked) {
                    checked = true;
                }else{
                    checked = false;
                }
                waterfall.freqChoosed = $("#" + scope.gralInfo.frequency.parts[1] + "-" + idPoint + wId).val();
                $("#" + scope.gralInfo.frequency.parts[2] + "-" + idPoint + wId).val(waterfall.freqChoosed);
                waterfall.chooseFrecuency(checked);
                
            });

            $("#" + scope.gralInfo.frequency.parts[2] + "-" + idPoint + wId).on("change", function (args) {
                if ($("#" + scope.gralInfo.frequency.parts[0] + "-" + idPoint + wId)[0].checked) {
                    checked = true;
                } else {
                    checked = false;
                }
                waterfall.freqChoosed = $("#" + scope.gralInfo.frequency.parts[2] + "-" + idPoint + wId).val();
                $("#" + scope.gralInfo.frequency.parts[1] + "-" + idPoint + wId).val(waterfall.freqChoosed);
                waterfall.chooseFrecuency(checked);
            });

            scope.showArmonicInfo();
        };

        this.actualizeGralInfo = function (flagReload) {

            $("#" + scope.gralInfo.armonics.name + "-" + 4 + "-" +
                scope.gralInfo.armonics.parts[0] + "-" + 0 + "-" + idPoint + wId).text(waterfall.armonicValue + "X : ");

            if (flagReload) {
                for (var i = 0; i < waterfall.qtyArm; i++) {
                    $("#" + scope.gralInfo.armonics.name  + i + "-" +
                    scope.gralInfo.armonics.parts[1] + "-" + 1 + "-" + idPoint + wId).attr("checked", false);
                }
            }

            $("#" + scope.gralInfo.frequency.parts[0] + "-" + idPoint + wId).attr("checked", false);

            if (flagFullSpec) {
                waterfall.createExtraArmonicLineFS(false);
            } else {
                waterfall.createExtraArmonicLine(false);
            }
        };

        _loadValuesInfoGral = function () {

            var numSpec, actVel, timeStamp, armonics = [], qtyArm;

            if (_vbles.numSpec !== undefined) {
                numSpec = 1 + parseInt(_vbles.numSpec);
                actVel = _vbles.RPM[numSpec - 1];
                timeStamp = _vbles.timeStamp[numSpec - 1];
                qtyArm = _vbles.qtyArm;

                //console.log(numSpec);
                // $("#Tooltip-Menu-" + idEntity).text(text);

                $("#" + scope.gralInfo.numSpec.id + "-" + idPoint + wId).text(scope.gralInfo.numSpec.txt + numSpec);
                $("#" + scope.gralInfo.actVel.id + "-" + idPoint + wId).text(scope.gralInfo.actVel.txt + actVel.toFixed(0) + " RPM");
                $("#" + scope.gralInfo.timeStamp.id + "-" + idPoint + wId).text(scope.gralInfo.timeStamp.txt + timeStamp);

                if (flagFullSpec) {
                    for (var i = 0; i < qtyArm; i++) {
                        $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + scope.gralInfo.armonics.parts[3] + "-" + 3 + "-" + idPoint + wId).
                            text(_vbles.armonicsInfo[numSpec - 1][i].yMaxX.toFixed(3) + waterfall.unitsAmp + " - " + _vbles.armonicsInfo[numSpec - 1][i].yMaxY.toFixed(3) + waterfall.unitsAmp);
                    }
                } else {
                    for (var i = 0; i < qtyArm; i++) {
                        $("#" + scope.gralInfo.armonics.name + "-" + i + "-" + scope.gralInfo.armonics.parts[3] + "-" + 3 + "-" + idPoint + wId).
                            text(_vbles.armonicsInfo[numSpec - 1][i].toFixed(3) + waterfall.unitsAmp);
                    }
                }
            }
            else {
                $("#" + scope.gralInfo.numSpec.id + "-" + idPoint + wId).text(scope.gralInfo.numSpec.txt + "");
                $("#" + scope.gralInfo.actVel.id + "-" + idPoint + wId).text(scope.gralInfo.actVel.txt + " ");
                $("#" + scope.gralInfo.timeStamp.id + "-" + idPoint + wId).text(scope.gralInfo.timeStamp.txt + "");

                $("#" + scope.gralInfo.armonics.name + "-" + j + "-" + scope.gralInfo.armonics.parts[3] + "-" + 3 + "-" + idPoint + wId).text("");             
            }

        };

        _createContextMenu = function () {
            //menuWaterfall3d groupsWaterfall btnMenuWaterfall3d
            _container.append('<div id="' + _contextMenu3d.id + idPoint + wId + '"></div>');
            _contextMenu3d.obj = $("#" + _contextMenu3d.id + idPoint + wId);
            _contextMenu3d.obj.addClass("menuWaterfall3d");
            _contextMenu3d.obj.css({
                "top": "50px"
            });

            for (var i = 0; i < _contextMenu3d.children.length; i++) {
                _contextMenu3d.obj.append('<div id="' + _contextMenu3d.children[i].name + "-" + idPoint + wId + '">' +
                        '<img src="' + _srcIcons + _contextMenu3d.children[i].img + '" width="20px" height="20px" class="btnMenuWaterfall3d"/></div>');
                _contextMenu3d.children[i].obj = $("#" + _contextMenu3d.children[i].name + "-" + idPoint + wId);
                _contextMenu3d.children[i].obj.css({
                    "display": "inline-block"
                });

                _contextMenu3d.children[i].obj.on("click", function (args) {
                    _chooseFunction(args.currentTarget.id, "ContextMenu");
                });

                _contextMenu3d.children[i].obj.hover(function (args) {
                    _showTooltipCtxt(args.currentTarget.id);
                });

                _contextMenu3d.children[i].obj.on("mouseleave", function (args) {
                    $("#Tooltip-CttxtMenuExtWaterfall-" + idPoint + wId).hide();
                });
            }

            _container.append('<div id="Tooltip-CttxtMenuExtWaterfall-' + idPoint + wId + '" class="menuWaterfall3d groupsWaterfall"' +
                ' style="right: 36px; position: absolute; top: 100px; padding-left: 5px; padding-right: 5px; opacity: 0.5;">3333</div>');

            $("#Tooltip-CttxtMenuExtWaterfall-" + idPoint + wId).hide();
           // _contextMenu3d.obj.hide();
            
        };

        _showTooltipCtxt = function (idButton) {
            var text;
            $("#Tooltip-CttxtMenuExtWaterfall-" + idPoint + wId).show();
            for (var i = 0; i < _contextMenu3d.children.length; i++) {
                if (idButton === _contextMenu3d.children[i].name + "-" + idPoint + wId) {
                    text = _contextMenu3d.children[i].txt;
                    $("#Tooltip-CttxtMenuExtWaterfall-" + idPoint + wId).text(text);
                    $("#Tooltip-CttxtMenuExtWaterfall-" + idPoint + wId).css({
                        "right": "155px",
                        "top": "100px"
                    });
                }
            }
        };

        this.chooseFunction = function (idButton, type) {

            var fcn;

            if (type === "ContextMenu") {
                for (var i = 0; i < _contextMenu3d.children.length; i++) {
                    if (idButton === _contextMenu3d.children[i].name + "-" + idPoint + wId) {
                        fcn = _contextMenu3d.children[i].fcn;
                        fcn();
                    }
                }
            } else if (type === "ModalConfig") {
                for (var i = 0; i < scope.modalPersonalize.children.length; i++) {
                    if (idButton === scope.modalPersonalize.children[i].name + wId) {
                        fcn = scope.modalPersonalize.children[i].fcn;
                        fcn();
                    }
                }
            }
            
        };

        this.createUI = function () {

            _createGralInfo();
            _createConfigWindow();
        };

        _createConfigWindow = function () {

            _container.append('<div id="' + scope.gralInfo.id + "-" + idPoint + wId + '"></div>');
        };

        _showHideArmonicLines = function (num, flag) {
            if (!flagFullSpec) {

                _scene.getMeshByName(_vbles.nameArmLines + num + "-" + idPoint + wId).visibility = flag;
            } else {
                _scene.getMeshByName(_vbles.nameArmLines + num + "-X-" + idPoint + wId).visibility = flag;
                _scene.getMeshByName(_vbles.nameArmLines + num + "-Y-" + idPoint + wId).visibility = flag;
            }
        };

        _changeColorLines = function (num, color) {

            waterfall.armonicColors[num] = color;
            
            if (!flagFullSpec) {
                _scene.getMeshByName(_vbles.nameArmLines + num + "-" + idPoint + wId).color =
                BABYLON.Color3.FromHexString(color);
            } else {
                _scene.getMeshByName(_vbles.nameArmLines + num + "-X-" + idPoint + wId).color =
                BABYLON.Color3.FromHexString(color);
                _scene.getMeshByName(_vbles.nameArmLines + num + "-Y-" + idPoint + wId).color =
                BABYLON.Color3.FromHexString(color);
            }
        };

        /*
         * convierte el container del 3d en pantalla completa
         */
        _launchFullScreen = function () {


            _fullScreen = true;

            var element = document.getElementById(_containerId);

            if (element.requestFullScreen) {
                element.requestFullScreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) {
                element.webkitRequestFullScreen();
            }
            _fullScreen = false;

        };

        /*
         *container del 3d sale de pantalla completa
         */
        _cancelFullscreen = function () {

            _fullScreen = false;

            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        };

        

    };
    return UiWaterfall3d;
})();