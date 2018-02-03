/*property
    ampMax, armQty, bilog, bufferSpectrum, containerCanvas, dinamic, flagBilog,
    flagRPM, flagTime, id, infoLabels, labelsColor, lines, nameL, nameM, nameS,
    nomVel, numAxis, numChromeScale, numberCubesY, qty, qtyArm, qtyData, scene,
    sizeCubeVal, srcBmp, units, unitsAmp, vbles
*/
/*
 * Waterfall3d.js
 * Generacion de Cascada Clásica y en cubos con escala cromática
 */

var Waterfall3d = {};

Waterfall3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    Waterfall3d = function (idPoint, wId, flagFullSpec) {

        var _scene,
            _canvas,
            _createSkeleton,
            _loadColors,
            _createLabels,
            _imgBmp,
            _canvasBmp,
            _ctxBmp,
            _colorLabels = null,
            _vbles = cascade3d.vbles[idPoint + wId],
            _nameSPS = 'SPS-Spec-',
            _sizeCube = 600,
            _canvasTextSize = 50,
            _qtyLines = 5,
            _frecMax,
            _infoTxt,
            _infoTextsLabels,            
            _containerId,
            _drawSpectrumsInWaterfall,
            _createIndColorsAmp,
            _findMinMaxGral,
            _numDigits,
            _dataWaterfall,
            _factColor,
            _cantColores,
            _createText,
            _flagParticles = true, 
            _escalaCromatica = [],
            _vectColor = [],
            _escalaInv = [],
            _arrayMaxY = [],
            _calculateSizePartsWaterfall,
            _createCanvasBmp,
            _loadImageBmp,
            _createCubes,
            _createBase,
            _createCubesBase,
            _createRibbonForFreq,
            _createCubeForFreq,
            _createParticlesDegrade,
            _createBox,
            _createCubesDegrade,
            _createBoxDegrade,
            _createParticlesDegrade,
            _findRangeXY,
            _createParticles,
            _calculateArmonics,
            _calculateFullSpecArmonics,
            _disposeParticles,   
            _calculateMaxFrec,
            _findSizeValuesXY,
            _fillArrayVector3ForWaterfall,
            _calculateMaxYFrequency,
            _calculateMaxYArmonic,
            _calculateMaxYArmonicFS,
            _createArmonicsLines,
            _createArmonicsLinesFS,
            _createTextLabels,
            _createLineForFreq,
            _colorBase,
            _locateCursor,
            _createWallSignal,
            _createLinesSignals,
            _selLabelsColor,
            _createGrid,
            _factScaleY = 0.3,        
            _porcLineL = 0.04;

        var scope = this;

        if (flagFullSpec) {
            _containerId = fullSpecCascade3d.containerCanvas[idPoint + wId].id;
            _scene = fullSpecCascade3d.scene[idPoint + wId];
            _vbles = fullSpecCascade3d.vbles[idPoint + wId];
            
            _colorLabels = fSWatConfig.labelsColor;
        } else {
            _containerId = cascade3d.containerCanvas[idPoint + wId].id;
            _scene = cascade3d.scene[idPoint + wId];
            _vbles = cascade3d.vbles[idPoint + wId];
            
            _colorLabels = watConfig.labelsColor;
        }




        this.bufferSpectrum = [];
        this.flagRPM = false;
        this.unitsAmp = "um";
        this.overallMeasureType = 1;
        this.armonicValue = 5;
        this.frecMax = null;
        this.freqChoosed = 0;

        _infoTxt = [
            { id: "Amp", numAxis: 4, units: scope.unitsAmp, dinamic: true },
            { id: "Frec", numAxis: 5, units: "Hz", dinamic: false },
            { id: "Tiemp", numAxis: 7, units: null, dinamic: true },
            { id: "RPM", numAxis: 7, units: "RPM", dinamic: true },
            { id: "Amp2", numAxis: 4, units: scope.unitsAmp, dinamic: true },
            { id: "Frec2", numAxis: 5, units: "Hz", dinamic: false },
            { id: "RPM2", numAxis: 7, units: "RPM", dinamic: true }
        ];

        this.flagTime = true;
        this.flagRPM = false;
        this.flagFirstWaterfall = true;

        this.flagBilog = watConfig.bilog;
        this.sizeCubeVal = 1;
        this.qtyArm = watConfig.armQty;
        this.nomVel = 12288;
        this.ampMax = 650;
        this.qtyData = 4;
        this.numberCubesY = 80;
        this.srcBmp = "";
        //this.srcBmp = "/Content/bmpWaterfall/" + arrayBmp[watConfig.numChromeScale] + ".bmp";


        this.infoLabels = {
            lines: {
                qty: _qtyLines,
                nameL: "lineWat-L-",
                nameM: "lineWat-M-",
                nameS: "lineWat-S-",
            },
            text: {
                units: "Labels-units-",
                value: "Labels-Value-",
                info: _infoTxt
            },
            color: "#99CCEF"
        };

        this.colorLabels = _colorLabels;

        this.armonicColors = [
            '#278ECF',
            '#4BD762',
            '#FFCA1F',
            '#FF9416',
            '#D42AE8',
        ];

        _calculateMaxFrec = function () {

            if (scope.frecMax == null) {
                if (scope.armonicValue > 10) {
                    _frecMax = (scope.nomVel / 60) * scope.armonicValue;
                }
                else {
                    _frecMax = (scope.nomVel / 60) * 10;
                }
            } else {
                _frecMax = scope.frecMax;
            }
            
        };

        _locateCursor = function () {

            if (_scene.getMeshByName("ribbonSpec")) {
                _scene.getMeshByName("ribbonSpec").dispose();
            }

            

            var numSpec, pathBase, pathSpec1 = [], pathSpec2 = [], RibbonBase, RibbonSpec, mat, sizeZ, deltaY = 0, factSize, factY, colorRibbon;

            colorRibbon = "#99CCEF";
            numSpec = _vbles.numSpec;
            sizeZ = _sizeCube / scope.bufferSpectrum.length;
            factSize = _sizeCube / _frecMax;
            factY = _dataWaterfall.y.fact;
            mat = new BABYLON.StandardMaterial("matRibbonSpec", _scene);
            mat.alpha = 1.0;
            mat.diffuseColor = BABYLON.Color3.FromHexString(colorRibbon);
            mat.emissiveColor = BABYLON.Color3.FromHexString(colorRibbon);
            mat.specularColor = BABYLON.Color3.FromHexString(colorRibbon);
            mat.backFaceCulling = false;
            mat.wireframe = false;

            pathBase = [[new BABYLON.Vector3(-_sizeCube / 2, -_sizeCube / 2 + 2, -_sizeCube / 2 - sizeZ / 2),
                        new BABYLON.Vector3(_sizeCube / 2, -_sizeCube / 2 + 2, -_sizeCube / 2 - sizeZ / 2)],
                [new BABYLON.Vector3(-_sizeCube / 2, -_sizeCube / 2 + 2, -_sizeCube / 2 + sizeZ / 2),
                        new BABYLON.Vector3(_sizeCube / 2, -_sizeCube / 2 + 2, -_sizeCube / 2 + sizeZ / 2)]];

            for (var i = 0; i < scope.bufferSpectrum[numSpec].spec.length - 2; i++) {

                deltaY = scope.bufferSpectrum[numSpec].spec[i + 1][1] - scope.bufferSpectrum[numSpec].spec[i][1];

                if (deltaY > 0) {
                    pathSpec1.push(new BABYLON.Vector3(scope.bufferSpectrum[numSpec].spec[i][0] * factSize * scope.bufferSpectrum[numSpec].sampleTime - 2,
                    scope.bufferSpectrum[numSpec].spec[i][1] * factY,
                    -_sizeCube / 2 - sizeZ / 2));
                    pathSpec2.push(new BABYLON.Vector3(scope.bufferSpectrum[numSpec].spec[i][0] * factSize * scope.bufferSpectrum[numSpec].sampleTime - 2,
                        scope.bufferSpectrum[numSpec].spec[i][1] * factY,
                        -_sizeCube / 2 + sizeZ / 2));
                }
                else {
                    pathSpec1.push(new BABYLON.Vector3(scope.bufferSpectrum[numSpec].spec[i][0] * factSize * scope.bufferSpectrum[numSpec].sampleTime + 2,
                    scope.bufferSpectrum[numSpec].spec[i][1] * factY,
                    -_sizeCube / 2 - sizeZ / 2));
                    pathSpec2.push(new BABYLON.Vector3(scope.bufferSpectrum[numSpec].spec[i][0] * factSize * scope.bufferSpectrum[numSpec].sampleTime + 2,
                        scope.bufferSpectrum[numSpec].spec[i][1] * factY ,
                        -_sizeCube / 2 + sizeZ / 2));
                }                             
            }

            RibbonSpec = new BABYLON.Mesh.CreateRibbon("ribbonSpec", [pathSpec1, pathSpec2], false, false, null, _scene);
            RibbonSpec.isPickable = false;
            RibbonSpec.position.x = -_sizeCube / 2;
            RibbonSpec.position.y = -_sizeCube / 2 + _sizeCube * 0.01;
            RibbonSpec.position.z = numSpec * sizeZ + sizeZ / 2;
            RibbonSpec.material = mat;

        };
     
        this.chooseFrecuency = function (freqChoosed, checked) {
            var fieldSpec, maxY = 0, y, box;
            /*
            if (flagFullSpec) {
                for (var i = 0; i < scope.bufferSpectrum.length; i++) {
                    fieldSpec = parseInt(
                        (scope.bufferSpectrum[i].spec[parseInt(scope.bufferSpectrum[i].spec.length / 2) + 1][0] / scope.bufferSpectrum[i].sampleTime) * freqChoosed + parseInt(scope.bufferSpectrum[i].spec.length / 2));

                    if (fieldSpec > 0) {
                        y = scope.bufferSpectrum[i].spec[fieldSpec -1 ][2];
                    } else {
                        y = scope.bufferSpectrum[i].spec[fieldSpec][1];
                    }
                    
                    if (y > maxY) {
                        // maxY = scope.bufferSpectrum[i].spec[fieldSpec][1];
                        if (fieldSpec > 0) {
                            maxY = scope.bufferSpectrum[i].spec[fieldSpec - 1][2];
                        } else {
                            maxY = scope.bufferSpectrum[i].spec[fieldSpec][1];
                        }
                    }
                }
            } else {
                for (var i = 0; i < scope.bufferSpectrum.length; i++) {
                    fieldSpec = parseInt((scope.bufferSpectrum[i].spec[1][0] / scope.bufferSpectrum[i].sampleTime) * freqChoosed);

                    y = scope.bufferSpectrum[i].spec[fieldSpec - 1][1];
                    if (y > maxY) {
                        maxY = scope.bufferSpectrum[i].spec[fieldSpec - 1][1];
                    }
                }
            }*/

            _createLineForFreq(freqChoosed, checked);
            box = _scene.getMeshByName("boxFreqChoosed");
            box.position = new BABYLON.Vector3(-_sizeCube / 2 + parseInt(freqChoosed) * _vbles.dataWaterfall.x.fact[0], -_sizeCube / 2 + 2 * _vbles.dataWaterfall.y.fact, 0);

            box.visibility = checked;

        };

        this.createRealTimeWaterfall = function () {
            this.locateCamera();
            //_findMinMaxGral();
            _createSkeleton();

        };

        this.createHistoricWaterfall = function () {

            _vbles.flagRPM = this.flagRPM;
            _calculateMaxFrec();
            _calculateSizePartsWaterfall();
            this.locateCamera();
            _createCubeForFreq();
            //_createRibbonForFreq();
            //_findMinMaxGral();                       
        };

        this.fillWaterfallHistCubes = function (arraySignal) {
            var dataSizeSignal, spectrum, path, factColor, k, pixel, data, pixelLog, dataLog, canvasB, wImg, hImg;
            _vbles.armonicsInfo = [];
            _vbles.RPM = [];
            _vbles.timeStamp = [];
            _loadImageBmp();
            _createSkeleton();

            _vbles.locateCursor = _locateCursor;

            //scope.armonicColors = [];
            scope.bufferSpectrum = [];
            _escalaCromatica = [];

            scope.flagBilog = watConfig.bilog;
            _vbles.qtyArm = watConfig.armQty;
            _vbles.qtyArm = scope.qtyArm;
            watConfig.bGColor = _scene.clearColor.toHexString();
            
            _imgBmp.onload = function () {
                wImg = _imgBmp.width, hImg = _imgBmp.height
                _ctxBmp.drawImage(_imgBmp, 0, 0, wImg, hImg);
                _cantColores = _imgBmp.height;

                for (var i = 0; i < _cantColores; i++) {

                    if (!scope.flagBilog) {
                        pixel = _ctxBmp.getImageData(2, _cantColores - 1 - i, _imgBmp.width, _imgBmp.height);
                        data = pixel.data;
                        _escalaCromatica.push([data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255]);
                    }
                    else {
                        k = Math.round((_cantColores - 1) * Math.log10((i + 0.01) / 0.01) / Math.log10((_cantColores - 1 + 0.01) / 0.01));
                        pixelLog = _ctxBmp.getImageData(2, _cantColores - 1 - k, _imgBmp.width, _imgBmp.height);
                        dataLog = pixelLog.data;
                        _escalaCromatica.push([dataLog[0] / 255, dataLog[1] / 255, dataLog[2] / 255, dataLog[3] / 255]);
                    }
                }

                for (var i = 0; i < arraySignal.length; i++) {
                    for (var j = 0; j < _vbles.arrayFilter.length; j++) {
                        if (arraySignal[i].timeStampUTC == _vbles.arrayFilter[j]) {
                            spectrum = GetHalfSpectrum(arraySignal[i].signal, arraySignal[i].sampleRate, scope.overallMeasureType, windowing.Hanning).mag;
                            if (spectrum.length > _frecMax) {
                                spectrum.splice(_frecMax - 1, (spectrum.length - _frecMax));
                            }

                            dataSizeSignal = new Object(_findSizeValuesXY(spectrum));
                            _vbles.armonicsInfo.push(_calculateArmonics(spectrum, arraySignal[i].vel));
                            scope.bufferSpectrum.push({ spec: spectrum, timeStamp: arraySignal[i].timeStamp, dataSizeSignal: dataSizeSignal, sampleTime: arraySignal[i].sampleTime });
                            _vbles.RPM.push(arraySignal[i].vel);
                            _vbles.timeStamp.push(arraySignal[i].timeStamp);
                        }                       
                    }                                    
                }

                _findMinMaxGral();                
                _createCubesDegrade();              
                 _createIndColorsAmp();
          
                _createTextLabels();
                _calculateMaxYArmonic();
                _createArmonicsLines();

                _selLabelsColor(false);
                setTimeout(function () { cascade3d.contLoader[idPoint + wId].hide(); }, 3000);
            }
        };

        this.fillClassicWaterfallHist = function (arraySignal) {
            var dataSizeSignal, spectrum, path, factColor, k, pixel, data, pixelLog, dataLog, canvasB, wImg, hImg, sampleRate;
            _vbles.armonicsInfo = [];
            _vbles.RPM = [];
            _vbles.timeStamp = [];
            _vbles.qtyArm = scope.qtyArm;
            //scope.armonicColors = [];
            scope.bufferSpectrum = [];

            _colorLabels = "#222244";
            _createSkeleton();


            for (var i = 0; i < arraySignal.length; i++) {
                for (var j = 0; j < _vbles.arrayFilter.length; j++) {
                    
                    if (arraySignal[i].timeStampUTC == _vbles.arrayFilter[j]) {
                        spectrum = GetHalfSpectrum(arraySignal[i].signal, arraySignal[i].sampleRate, scope.overallMeasureType, windowing.Hanning).mag;
                        if (spectrum.length > _frecMax) {
                            spectrum.splice(_frecMax - 1, (spectrum.length - _frecMax));
                        }

                        dataSizeSignal = new Object(_findSizeValuesXY(spectrum));
                        _vbles.armonicsInfo.push(_calculateArmonics(spectrum, arraySignal[i].vel));
                        scope.bufferSpectrum.push({ spec: spectrum, timeStamp: arraySignal[i].timeStamp, dataSizeSignal: dataSizeSignal, sampleTime: arraySignal[i].sampleTime });
                        _vbles.RPM.push(arraySignal[i].vel);
                        _vbles.timeStamp.push(arraySignal[i].timeStamp);
                    }                   
                }
            }

                _findMinMaxGral();
                _createWallSignal();
                _createLinesSignals();
                _createTextLabels();
                _vbles.dataWaterfall = _dataWaterfall;
                _calculateMaxYArmonic();
                _createArmonicsLines();

                _selLabelsColor(true);

                setTimeout(function () { cascade3d.contLoader[idPoint + wId].hide(); }, 2000);
                
        };

        this.fillWaterfallHistCubesFullSpec = function (arraySignalX, arraySignalY) {
            var dataSizeSignal, spectrum, spectrum2, path, factColor, k, pixel, data, pixelLog, dataLog, canvasB, wImg, hImg;
            _vbles.armonicsInfo = [];
            _vbles.RPM = [];
            _vbles.timeStamp = [];
            _loadImageBmp();
            _createSkeleton();
            _vbles.locateCursor = _locateCursor;

            //scope.armonicColors = [];
            scope.bufferSpectrum = [];
            _escalaCromatica = [];

            scope.flagBilog = fSWatConfig.bilog;
            _vbles.qtyArm = fSWatConfig.armQty;
            _vbles.qtyArm = scope.qtyArm;
            fSWatConfig.bGColor = _scene.clearColor.toHexString();

            _imgBmp.onload = function () {
                wImg = _imgBmp.width, hImg = _imgBmp.height
                _ctxBmp.drawImage(_imgBmp, 0, 0, wImg, hImg);
                _cantColores = _imgBmp.height;

                for (var i = 0; i < _cantColores; i++) {

                    if (!scope.flagBilog) {
                        pixel = _ctxBmp.getImageData(2, _cantColores - 1 - i, _imgBmp.width, _imgBmp.height);
                        data = pixel.data;
                        _escalaCromatica.push([data[0] / 255, data[1] / 255, data[2] / 255, data[3] / 255]);
                    }
                    else {
                        k = Math.round((_cantColores - 1) * Math.log10((i + 0.01) / 0.01) / Math.log10((_cantColores - 1 + 0.01) / 0.01));
                        pixelLog = _ctxBmp.getImageData(2, _cantColores - 1 - k, _imgBmp.width, _imgBmp.height);
                        dataLog = pixelLog.data;
                        _escalaCromatica.push([dataLog[0] / 255, dataLog[1] / 255, dataLog[2] / 255, dataLog[3] / 255]);
                    }
                }

                for (var i = 0; i < arraySignalX.length; i++) {
                    for (var j = 0; j < _vbles.arrayFilter.length; j++) {
                        if (arraySignalX[i].timeStampUTC == _vbles.arrayFilter[j]) {
                            spectrum = GetFullSpectrum(arraySignalX[i].signal, arraySignalY[i].signal, arraySignalX[i].sampleRate, scope.overallMeasureType, windowing.Hanning);
                            if (spectrum.length > _frecMax * 2) {

                                spectrum2 = spectrum.slice(spectrum.length / 2 - _frecMax, spectrum.length / 2 + _frecMax);
                            }
                            dataSizeSignal = new Object(_findSizeValuesXY(spectrum2));
                            _vbles.armonicsInfo.push(_calculateFullSpecArmonics(spectrum2, arraySignalX[i].vel));
                            scope.bufferSpectrum.push({ spec: spectrum2, timeStamp: arraySignalX[i].timeStamp, dataSizeSignal: dataSizeSignal, sampleTime: arraySignalX[i].sampleTime });
                            _vbles.RPM.push(arraySignalX[i].vel);
                            _vbles.timeStamp.push(arraySignalX[i].timeStamp);
                        }
                        
                    }
                }

                _findMinMaxGral();
                _createCubesDegrade();
                _createIndColorsAmp();
                _createTextLabels();

                _calculateMaxYArmonicFS();
                _createArmonicsLinesFS();
                _selLabelsColor(false);
                setTimeout(function () { fullSpecCascade3d.contLoader[idPoint + wId].hide(); }, 3000);
            }
        };

        this.fillClassicWaterfallHistFullSpec = function (arraySignalX, arraySignalY) {
            var dataSizeSignal, spectrum, spectrum2, path, factColor, k, pixel, data, pixelLog, dataLog, canvasB, wImg, hImg, sampleRate;
            _vbles.armonicsInfo = [];
            _vbles.RPM = [];
            _vbles.timeStamp = [];
            _vbles.qtyArm = scope.qtyArm;
            //scope.armonicColors = [];
            scope.bufferSpectrum = [];
            _createSkeleton();

            for (var i = 0; i < arraySignalX.length - 1; i++) {
                for (var j = 0; j < _vbles.arrayFilter.length; j++) {
                    if (arraySignalX[i].timeStampUTC == _vbles.arrayFilter[j]) {
                        spectrum = GetFullSpectrum(arraySignalX[i].signal, arraySignalY[i].signal, arraySignalY[i].sampleRate, scope.overallMeasureType, windowing.Hanning);

                
                        if (spectrum.length > _frecMax * 2) {

                            spectrum = spectrum.slice(spectrum.length / 2 - parseInt(_frecMax), spectrum.length / 2 + parseInt(_frecMax));
                            
                        }
                
                        dataSizeSignal = new Object(_findSizeValuesXY(spectrum));
                        _vbles.armonicsInfo.push(_calculateFullSpecArmonics(spectrum, arraySignalX[i].vel));
                        scope.bufferSpectrum.push({ spec: spectrum, timeStamp: arraySignalX[i].timeStamp, dataSizeSignal: dataSizeSignal, sampleTime: arraySignalX[i].sampleTime });
                        _vbles.RPM.push(arraySignalX[i].vel);
                        _vbles.timeStamp.push(arraySignalX[i].timeStamp);
                    }
                    
                }
            }

            _findMinMaxGral();
            _createWallSignal();
            _createLinesSignals();
            _createTextLabels();
            _vbles.dataWaterfall = _dataWaterfall;
            _calculateMaxYArmonicFS();
            _createArmonicsLinesFS();
            _selLabelsColor(true);
            setTimeout(function () { fullSpecCascade3d.contLoader[idPoint + wId].hide(); }, 3000);
            

        };

        _createWallSignal = function () {

            var colFondo = new BABYLON.Color3(1, 1, 1);
            _scene.clearColor = new BABYLON.Color3(1, 1, 1);
            watConfig.bGColor = _scene.clearColor.toHexString();

            var deltaY, factY, factX, factZ, points = [], ind = [], col = [], spec, meshFB, vertexData, indexVert1, indexVert2, indexVert3, numY, contInd = 0;
            var pointsArray = [], indArray = [], colArray = [], pointsAux = [], indAux = [], colAux = [], qtyInd, auxPoint;
            factY = _dataWaterfall.y.fact;
            
            factZ = _sizeCube / scope.bufferSpectrum.length;

            var numSpec;

            for (var h = 0; h < scope.bufferSpectrum.length; h ++) {
         
                    spec = scope.bufferSpectrum[h].spec;
                    points = [], ind = [], col = [], indexVert1 = 1, indexVert2 = 3, indexVert3 = 2, pointsArray = [], indArray = [], colArray = [], pointsAux = [], indAux = [], colAux = [];
                    factX = _dataWaterfall.x.fact[h];
                    contInd = 0;
                    for (var i = 0; i < spec.length - 2; i++) {
                        if (flagFullSpec) {
                            if (i < _frecMax) {
                                numY = 1;
                            } else {
                                numY = 2;
                            }
                        } else {
                            numY = 1;
                        }
                        deltaY = Math.abs(spec[i + 1][numY] - spec[i][numY]) * factY;


                        if (deltaY > 0.01) {

                            points.push(spec[i][0] * factX, spec[i][numY] * factY, 0,
                                    spec[i][0] * factX, 0, 0,
                                    spec[i + 1][0] * factX, spec[i + 1][numY] * factY, 0,
                                    spec[i][0] * factX, 0, 0,
                                    spec[i + 1][0] * factX, spec[i + 1][numY] * factY, 0,
                                    spec[i + 1][0] * factX, 0, 0);
                            ind.push(indexVert1 + 1, indexVert1 + 2, indexVert1 + 3,
                                indexVert1 + 2, indexVert1 + 3, indexVert1 + 4);
                            col.push(colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1);
                            indexVert1 += 4;
                            contInd += 6;
                        }

                    }
                  
                    for (var i = 0; i < spec.length - 2; i++) {
                        if (flagFullSpec) {
                            if (i < _frecMax) {
                                numY = 1;
                            }else{
                                numY = 2;
                            }
                        }else{
                            numY = 1;
                        }
                        deltaY = Math.abs(spec[i + 1][numY] - spec[i][numY]) * factY;
                        if (deltaY > 0.01) {

                            points.push(spec[i][0] * factX, spec[i][numY] * factY, 0,
                                    spec[i][0] * factX, 0, 0,
                                    spec[i + 1][0] * factX, spec[i + 1][numY] * factY, 0,
                                    spec[i][0] * factX, 0, 0,
                                    spec[i + 1][0] * factX, spec[i + 1][numY] * factY, 0,
                                    spec[i + 1][0] * factX, 0, 0);
                            ind.push(indexVert2 + 1, indexVert2 + 2, indexVert2 + 3,
                                indexVert2 + 2, indexVert2 + 3, indexVert2 + 4);
                            col.push(colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1,
                                colFondo.r, colFondo.g, colFondo.b, 1);
                            indexVert2 += 4;
                            contInd += 6;
                        }
                    }

                    meshFB = new BABYLON.Mesh("spec-" + 0 + "-" + h, _scene);
                    meshFB.material = new BABYLON.StandardMaterial("mat" + name, _scene);
                    meshFB.material.backFaceCulling = false;
                    meshFB.material.specularColor = new BABYLON.Color3(0, 0, 0);
                    meshFB.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
                    meshFB.material.freeze();

                    vertexData = new BABYLON.VertexData();

                    vertexData.positions = points;
                    vertexData.indices = ind;
                    vertexData.colors = col;

                    vertexData.applyToMesh(meshFB, 1);

                    meshFB.position = new BABYLON.Vector3(-_sizeCube / 2, -_sizeCube / 2, -_sizeCube / 2 + h * factZ);

                
            }


            return meshFB;
        };
        
        _createLinesSignals = function () {

            var deltaY, factY, factX, factZ, spec, path = [], line;

            factY = _dataWaterfall.y.fact;      
            factZ = _sizeCube / scope.bufferSpectrum.length;

            for (var i = 0; i < scope.bufferSpectrum.length; i ++) {
                factX = _dataWaterfall.x.fact[i];
                spec = scope.bufferSpectrum[i].spec;
                path = [];
                if (!flagFullSpec) {
                    for (var j = 0; j < spec.length - 2; j++) {
                        path.push(new BABYLON.Vector3(spec[j][0] * factX, spec[j][1] * factY, 0));
                    }
                } else {
                    for (var j = 0; j < spec.length - 2; j++) {
                        if (j < _frecMax ) {
                            path.push(new BABYLON.Vector3(spec[j][0] * factX, spec[j][1] * factY, 0));
                        } else {
                            path.push(new BABYLON.Vector3(spec[j][0] * factX, spec[j][2] * factY, 0));
                        }
                        
                    }
                }
                
                line = BABYLON.Mesh.CreateLines("line-" + i, path, _scene, true);
                line.position = new BABYLON.Vector3(-_sizeCube / 2, -_sizeCube / 2, -_sizeCube / 2 + i * factZ);
                line.color = new BABYLON.Color3(0, 0.2, 1);
            }
        };

        _findRangeXY = function (spec, j) {

            var deltaX, deltaY, factX, factY, arrayRange = [], maxY = 0, indexX = 0, indexBuffer = 0, qtyXpC;

            factX = _dataWaterfall.x.fact[j];
            factY = _dataWaterfall.y.fact;

            deltaX = (spec[1][0] - spec[0][0]) * factX;

            qtyXpC = Math.floor(scope.sizeCubeVal/ deltaX);

                for (var i = 0; i < spec.length - 1; i++) {

                    if (indexX <= qtyXpC) {
                        if (maxY < spec[i][1] * factY && spec[i][1] * factY > 1) {
                            maxY = spec[i][1] * factY;
                            arrayRange.push({x: i, y: maxY });
                        }
                        if (spec[i][2]) {
                            if (maxY < spec[i][2] * factY && spec[i][2] * factY > 1) {
                                maxY = spec[i][2] * factY;
                                arrayRange.push({ x: i, y: maxY });
                            }
                        }
                        
                        indexX += deltaX;
                        
                    } else {
                        i--;
                        indexX = 0;
                        maxY = 0;
                    }
                }
            return arrayRange;
        };

        _createLabels = function (parentName) {

            var parent = new BABYLON.Mesh.CreateBox(parentName, 0.001, _scene);

            var lineS, lineM, lineL, porcS = 0.3, porcM = 0.5, vec1, vec2, factLM, factS;

            vec1 = new BABYLON.Vector3(0, (_sizeCube * _porcLineL), 0);
            vec2 = new BABYLON.Vector3(0, 0, 0);
            lineL = BABYLON.Mesh.CreateLines(parentName + "lineWat-L-0", [vec1, vec2], _scene);
            lineL.parent = parent;
            lineL.color = BABYLON.Color3.FromHexString(_colorLabels);


            factLM = _sizeCube / _qtyLines;
            factS = _sizeCube / (_qtyLines * 2);

            for (var i = 1; i <= _qtyLines * 4; i++) {

                if (i <= _qtyLines) {
                    vec1 = new BABYLON.Vector3(factLM * i, (_sizeCube * _porcLineL), 0);
                    vec2 = new BABYLON.Vector3(factLM * i, 0, 0);
                    lineL = BABYLON.Mesh.CreateLines(parentName + "lineWat-L-" + i, [vec1, vec2], _scene);
                    lineL.parent = parent;
                    lineL.color = BABYLON.Color3.FromHexString(_colorLabels);
                    vec1 = new BABYLON.Vector3(factLM * (i - 0.5), (_sizeCube * _porcLineL * porcM), 0);
                    vec2 = new BABYLON.Vector3(factLM * (i - 0.5), 0, 0);
                    lineM = BABYLON.Mesh.CreateLines(parentName + "lineWat-M-" + i, [vec1, vec2], _scene);
                    lineM.parent = parent;
                    lineM.color = BABYLON.Color3.FromHexString(_colorLabels);
                }

                if (i % 2 !== 0) {
                    vec1 = new BABYLON.Vector3(factS * 0.5 * i, (_sizeCube * _porcLineL * porcS), 0);
                    vec2 = new BABYLON.Vector3(factS * 0.5 * i, 0, 0);
                    lineS = BABYLON.Mesh.CreateLines(parentName + "lineWat-S-." + i, [vec1, vec2], _scene);
                    lineS.parent = parent;
                    lineS.color = BABYLON.Color3.FromHexString(_colorLabels);
                }

            }
            return parent;
        };

        this.locateCamera = function () {

            var element = document.getElementById(_containerId);
            _scene.activeCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

            if (flagFullSpec) {
                element.addEventListener("wheel", fullSpecCascade3d.events[idPoint + wId].zoomOrtographic);
                _scene.activeCamera.target = new BABYLON.Vector3(0, 0, 0);
                _scene.activeCamera.target = new BABYLON.Vector3(-_sizeCube / 2, -_sizeCube * 0.3, -_sizeCube * 0.2);
                _scene.activeCamera.alpha = -1.38;
                _scene.activeCamera.beta = 1.045;

                _scene.activeCamera.orthoBottom = -_sizeCube * 0.66;
                _scene.activeCamera.orthoLeft = -_sizeCube * 0.66 * _scene._engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = _sizeCube * 0.66;
                _scene.activeCamera.orthoRight = _sizeCube * 0.66 * _scene._engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.radius = 16000;
            } else {
                element.addEventListener("wheel", cascade3d.events[idPoint + wId].zoomOrtographic);
                //_scene.activeCamera.target = new BABYLON.Vector3(-_sizeCube / 2, 0, 0);
                _scene.activeCamera.target = new BABYLON.Vector3(60, -_sizeCube * 0.254, -_sizeCube * 0.116);
                _scene.activeCamera.alpha = -1.3153;
                _scene.activeCamera.beta = 1.045;

                _scene.activeCamera.orthoBottom = -_sizeCube * 0.54;
                _scene.activeCamera.orthoLeft = -_sizeCube * 0.54 * _scene._engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.orthoTop = _sizeCube * 0.54;
                _scene.activeCamera.orthoRight = _sizeCube * 0.54 * _scene._engine.getAspectRatio(_scene.activeCamera);
                _scene.activeCamera.radius = 16200;
            }
            /*
            
            _scene.activeCamera.radius = _sizeCube * 4.5;

            _scene.activeCamera.orthoBottom = -_sizeCube * 0.8;
            _scene.activeCamera.orthoLeft = -_sizeCube * 0.8 * _scene._engine.getAspectRatio(_scene.activeCamera);
            _scene.activeCamera.orthoTop = _sizeCube * 0.8;
            _scene.activeCamera.orthoRight = _sizeCube * 0.8 * _scene._engine.getAspectRatio(_scene.activeCamera);

            _scene.activeCamera.alpha = -Math.PI / 2;
            _scene.activeCamera.beta = 0.1;*/
            _scene.activeCamera.wheelPrecision = 0.1;
            _scene.activeCamera.upperRadiusLimit = 80000;
            _scene.activeCamera.lowerRadiusLimit = 2;
            _scene.activeCamera.panningSensibility = 2;
            _scene.lights[0].intensity = 0;
            _scene.lights[1].intensity = 0;
        };

        _findSizeValuesXY = function (signal) {

            var data = new Object({
                x: {
                    max: signal.length,
                    min: 0,
                    total: signal.length
                },
                y: {
                    max: 0,
                    min: 0,
                    total: 0
                }
            });

            for (var i0 = 0; i0 < signal.length; i0++) {
                if (signal[i0][1] > data.y.max) {
                    data.y.max = signal[i0][1];
                }
                if (signal[i0][1] < data.y.min) {
                    data.y.min = signal[i0][1];
                }
                if (signal[i0][2]) {
                    if (signal[i0][2] > data.y.max) {
                        data.y.max = signal[i0][2];
                    }
                    if (signal[i0][2] < data.y.min) {
                        data.y.min = signal[i0][2];
                    }
                }
                
            }
            data.y.total = data.y.max - data.y.min;

            return data;
        };

        _findMinMaxGral = function () {

            var numDigits, auxVal;

            var data = new Object({
                x: {
                    total: _frecMax,
                    fact: []
                },
                y: {
                    max: 0,
                    min: 0,
                    total: 0,
                    fact: 0,
                    maxAxis: 0
                }
            });

            
            for (var i0 = 0; i0 < scope.bufferSpectrum.length; i0++) {
                if (scope.bufferSpectrum[i0].dataSizeSignal.y.max > data.y.max) {
                    data.y.max = scope.bufferSpectrum[i0].dataSizeSignal.y.max;
                }
                if (scope.bufferSpectrum[i0].dataSizeSignal.y.min < data.y.min) {
                    data.y.min = scope.bufferSpectrum[i0].dataSizeSignal.y.min;
                }
                data.x.fact.push((scope.bufferSpectrum[i0].sampleTime * _sizeCube) / _frecMax);
            }

            data.y.total = data.y.max - data.y.min;
            //data.x.fact = _sizeCube / data.x.total;     

            numDigits = _numDigits(data.y.max);
            
            if (numDigits <= 2) {
                data.y.maxAxis = Math.ceil(data.y.max);
            }
            else {
                
                auxVal = data.y.max / Math.pow(10, numDigits - 2);
                auxVal = Math.ceil(auxVal);
                data.y.maxAxis = auxVal * Math.pow(10, numDigits - 2);
            }     

            data.y.fact =  _sizeCube * _factScaleY / data.y.maxAxis ;
            _dataWaterfall = new Object(data);
        };

        _calculateSizePartsWaterfall = function () {

            _sizeCube = 1000;
            _canvasTextSize = _sizeCube / 5;
            scope.sizeCubeVal = 0.99;

        };

        _createParticlesDegrade = function (path, bufferPos, colorT, factY) {

            var myPositionFunction, box, mat, SPS, mesh, colorAlt, colorBase;

            myPositionFunction = function (particle, i, s) {
                particle.scaling.y = factY;
                particle.scaling.z = (_sizeCube / scope.bufferSpectrum.length) * (2 - scope.sizeCubeVal);
                particle.scaling.x = (_sizeCube / scope.bufferSpectrum[0].spec.length) * (2 - scope.sizeCubeVal);
                particle.position.x = path[i].x;
                particle.position.y = path[i].y;
                particle.color = colorT[i];
                particle.position.z = 0;
            };

            mat = new BABYLON.StandardMaterial("matParticle", _scene);

            SPS = new BABYLON.SolidParticleSystem(_nameSPS + bufferPos, _scene, { updatable: false, isPickable: true });

            box = BABYLON.Mesh.CreateBox("cube-", scope.sizeCubeVal, _scene, false, BABYLON.Mesh.DEFAULTSIDE);
                SPS.addShape(box, path.length, { positionFunction: myPositionFunction });

                mesh = SPS.buildMesh();
                mat.specularColor = new BABYLON.Color3(0, 0, 0);
                mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
                //mat.freeze();
                mesh.material = mat;


                box.dispose();
                mesh.position.y = -_sizeCube / 2;
                if (flagFullSpec) {
                    mesh.position.x = _sizeCube / 2;
                } else {
                    mesh.position.x = -_sizeCube / 2;
                }
                

                mesh.position.z = -_sizeCube / 2 + (_sizeCube * bufferPos / (scope.bufferSpectrum.length)) + (_sizeCube / (scope.bufferSpectrum.length * 2));
        };

        _disposeParticles = function () {

            for (var i = 0; i < scope.bufferSpectrum.length; i++) {
                if (_scene.getMeshByName(_nameSPS + i)) {
                    _scene.getMeshByName(_nameSPS + i).dispose();
                }                
            }
        };

        _createText = function (name, canvasSize, sizeCanvas) {

            var textPlaneTexture = new BABYLON.DynamicTexture("text" + name, sizeCanvas, _scene, true);
            textPlaneTexture.hasAlpha = true;

            var textPlane = BABYLON.Mesh.CreatePlane(name, canvasSize, _scene, false);

            textPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            textPlane.material = new BABYLON.StandardMaterial("mat-" + name, _scene);
            textPlane.material.emissiveColor = BABYLON.Color3.FromHexString(_colorLabels);
            textPlane.material.opacityColor = BABYLON.Color3.FromHexString(_colorLabels);

            //textPlane.material.diffuseTexture = textPlaneTexture;
            textPlane.material.emissiveTexture = textPlaneTexture;
            textPlane.material.opacityTexture = textPlaneTexture;
            //textPlane.material.diffuseTexture.level = 2;
            textPlane.material.specularColor = BABYLON.Color3.FromHexString(_colorLabels);
            textPlane.material.emissiveColor = BABYLON.Color3.FromHexString(_colorLabels);

            textPlane.material.backFaceCulling = true;
            textPlane.material.disableLighting = true;
            textPlane.material.freeze();
            return textPlane;
        };

        _createTextLabels = function () {

            var canvasText, et, ot, factPosX = false, factPosZ = false, posX, posY, posZ, et2, ot2, canvasText2, valueAmp, valueFrec, valueFrec2, valueTiemp, valueRPM;

            _infoTxt[0].units = scope.unitsAmp;

            var qtyTxt;
            if (flagFullSpec) {
                qtyTxt = _infoTxt.length;

                canvasText = _createText("Labels-units-Forward", _canvasTextSize / 1.2, 90);
                et = canvasText.material.emissiveTexture;
                ot = canvasText.material.opacityTexture;
                et.drawText("FORWARD", null, 40, "14px Segoe UI", _colorLabels, null);
                ot.drawText("FORWARD", null, 40, "14px Segoe UI", _colorLabels, null);
                canvasText.position = new BABYLON.Vector3(0, -(_sizeCube * (1 + _factScaleY / 2)) / 2, -_sizeCube / 2);

                canvasText = _createText("Labels-units-Reverse", _canvasTextSize / 1.2, 90);
                et = canvasText.material.emissiveTexture;
                ot = canvasText.material.opacityTexture;
                et.drawText("REVERSE", null, 40, "14px Segoe UI", _colorLabels, null);
                ot.drawText("REVERSE", null, 40, "14px Segoe UI", _colorLabels, null);
                canvasText.position = new BABYLON.Vector3(-_sizeCube, -(_sizeCube * (1 + _factScaleY / 2)) / 2, -_sizeCube / 2);

            } else {
                qtyTxt = 4;
            }

            for (var i = 0; i < qtyTxt; i++) {

                if ((flagFullSpec && i !== 3) || !flagFullSpec) {
                    if (_infoTxt[i].units !== null) {
                        canvasText = _createText("Labels-units-" + _infoTxt[i].id, _canvasTextSize / 1.5, 80);
                        et = canvasText.material.emissiveTexture;
                        ot = canvasText.material.opacityTexture;
                        et.drawText(_infoTxt[i].units, null, 20, "22px Segoe UI", _colorLabels, null);
                        ot.drawText(_infoTxt[i].units, null, 20, "22px Segoe UI", _colorLabels, null);
                    }

                    switch (_infoTxt[i].id) {
                        case "Amp": {
                            canvasText.position = new BABYLON.Vector3((_sizeCube * 1.2) / 2, -(_sizeCube * (0.5 - _factScaleY - 0.05)), _sizeCube / 2);
                            posX = (_sizeCube / 2) * 1.1;
                            posY = -(_sizeCube / 2) * (1 + _factScaleY / 4) * 0.99;
                            posZ = _sizeCube / 2;
                        } break;
                        case "Frec": {
                            canvasText.position = new BABYLON.Vector3(-_sizeCube / 2, -(_sizeCube * (1 + _factScaleY / 2)) / 2, 0);
                            posX = -_sizeCube / 2;
                            posY = -_sizeCube / 2;
                            posZ = -_sizeCube / 2 * 1.1;
                        } break;
                        case "Tiemp": {
                            canvasText.position = new BABYLON.Vector3(0, -(_sizeCube * (1 + _factScaleY / 2)) / 2, -_sizeCube / 2);
                            posX = _sizeCube / 2;
                            posY = -_sizeCube / 2;
                            posZ = -_sizeCube / 2;
                        } break;
                        case "RPM": {
                            canvasText.position = new BABYLON.Vector3(-1.2 * _sizeCube / 2, -(_sizeCube * (1 + _factScaleY / 2)) / 2, 0);
                            posX = -_sizeCube / 2;
                            posY = -_sizeCube / 2;
                            posZ = -_sizeCube / 2;
                        } break;
                        case "Amp2": {
                            canvasText.position = new BABYLON.Vector3(-2.5 * (_sizeCube * 1.2) / 2, -(_sizeCube * (0.5 - _factScaleY - 0.05)), _sizeCube / 2);
                            posX = -2.5 * _sizeCube / 2;
                            posY = -(_sizeCube / 2) * (1 + _factScaleY / 4) * 0.99;
                            posZ = _sizeCube / 2;
                        } break;
                        case "Frec2": {
                            canvasText.position = new BABYLON.Vector3(-_sizeCube / 2, -(_sizeCube * (1 + _factScaleY / 2)) / 2, -_sizeCube / 2);
                            posX = -3 * _sizeCube / 2;
                            posY = -_sizeCube / 2;
                            posZ = -_sizeCube / 2 * 1.1;
                        } break;
                        case "RPM2": {

                            canvasText.position = new BABYLON.Vector3(-3 * _sizeCube * 1.2 / 2, -(_sizeCube * (1 + _factScaleY / 2)) / 2, 0);
                            posX = -2.5 * _sizeCube / 2;
                            posY = -_sizeCube / 2;
                            posZ = -_sizeCube / 2;
                        } break;
                    }



                    for (var j = 0; j <= _qtyLines; j++) {
                        canvasText2 = _createText("Labels-Value-" + _infoTxt[i].id + "-" + j, _canvasTextSize / 1.5, 80);
                        et2 = canvasText2.material.emissiveTexture;
                        ot2 = canvasText2.material.opacityTexture;
                        valueFrec = j * (_frecMax / _qtyLines);
                        valueAmp = j * (_dataWaterfall.y.maxAxis / _qtyLines);
                        valueAmp = valueAmp.toFixed(2);
                        valueFrec2 = -(_qtyLines - j) * _frecMax / _qtyLines;


                        valueFrec = valueFrec.toFixed(2);
                        valueFrec2 = valueFrec2.toFixed(2);
                        // valueAmp = valueAmp.toFixed(2);
                        switch (_infoTxt[i].id) {
                            case "Amp":
                                et2.drawText(valueAmp, null, 25, "18px Segoe UI", _colorLabels, null);
                                ot2.drawText(valueAmp, null, 25, "18px Segoe UI", _colorLabels, null);
                                canvasText2.position = new BABYLON.Vector3(posX * 1.15, posY + j * 1.05 * (_sizeCube / 4) * (1 + _factScaleY / 2) / _qtyLines, posZ);
                                break;
                            case "Frec":
                                et2.drawText(valueFrec, null, 20, "18px Segoe UI", _colorLabels, null);
                                ot2.drawText(valueFrec, null, 20, "18px Segoe UI", _colorLabels, null);
                                canvasText2.position = new BABYLON.Vector3(posX + j * (_sizeCube / _qtyLines), posY * 1.2, posZ * 1.1);
                                break;
                            case "Tiemp":
                                if (scope.bufferSpectrum[Math.ceil(j * (scope.bufferSpectrum.length / _qtyLines))]) {
                                    et2.drawText(scope.bufferSpectrum[Math.ceil(j * (scope.bufferSpectrum.length / _qtyLines))].timeStamp, null, 20, "18px Segoe UI", _colorLabels, null);
                                    ot2.drawText(scope.bufferSpectrum[Math.ceil(j * (scope.bufferSpectrum.length / _qtyLines))].timeStamp, null, 20, "18px Segoe UI", _colorLabels, null);
                                    canvasText2.position = new BABYLON.Vector3(posX * 1.3, posY * 1.1, posZ + j * (_sizeCube / _qtyLines));
                                }
                                break;
                            case "RPM":

                                if (scope.bufferSpectrum[Math.ceil(j * (scope.bufferSpectrum.length / _qtyLines))]) {
                                    et2.drawText(Math.ceil(_vbles.RPM[Math.ceil(j * (_vbles.RPM.length / _qtyLines))]), null, 20, "18px Segoe UI", _colorLabels, null);
                                    ot2.drawText(Math.ceil(_vbles.RPM[Math.ceil(j * (_vbles.RPM.length / _qtyLines))]), null, 20, "18px Segoe UI", _colorLabels, null);
                                    canvasText2.position = new BABYLON.Vector3(posX * 1.3, posY * 1.1, posZ + j * (_sizeCube / _qtyLines));
                                }
                                break;
                            case "Amp2":
                                et2.drawText(valueAmp, null, 30, "18px Segoe UI", _colorLabels, null);
                                canvasText2.position = new BABYLON.Vector3(posX * 1.15, posY + j * 1.05 * (_sizeCube / 4) * (1 + _factScaleY / 2) / _qtyLines, posZ);
                                ot2.drawText(valueAmp, null, 30, "18px Segoe UI", _colorLabels, null);
                                canvasText2.position = new BABYLON.Vector3(posX * 1.15, posY + j * 1.05 * (_sizeCube / 4) * (1 + _factScaleY / 2) / _qtyLines, posZ);
                                break;
                            case "Frec2":
                                if (j < _qtyLines) {
                                    et2.drawText(valueFrec2, null, 20, "18px Segoe UI", _colorLabels, null);
                                    canvasText2.position = new BABYLON.Vector3(posX + j * (_sizeCube / _qtyLines), posY * 1.2, posZ * 1.1);
                                    ot2.drawText(valueFrec2, null, 20, "18px Segoe UI", _colorLabels, null);
                                    canvasText2.position = new BABYLON.Vector3(posX + j * (_sizeCube / _qtyLines), posY * 1.2, posZ * 1.1);
                                }
                                break;
                            case "RPM2":
                                if (scope.bufferSpectrum[Math.ceil(j * (scope.bufferSpectrum.length / _qtyLines))]) {
                                    et2.drawText(Math.ceil(_vbles.RPM[Math.ceil(j * (_vbles.RPM.length / _qtyLines))]), null, 20, "18px Segoe UI", _colorLabels, null);
                                    ot2.drawText(Math.ceil(_vbles.RPM[Math.ceil(j * (_vbles.RPM.length / _qtyLines))]), null, 20, "18px Segoe UI", _colorLabels, null);
                                    canvasText2.position = new BABYLON.Vector3(posX * 1.3, posY * 1.1, posZ + j * (_sizeCube / _qtyLines));
                                }
                                break;
                        }

                    }

                }

            }

        }

        _createSkeleton = function () {

            var parent, qtyLabels;

            //Para ejes Y

            if (flagFullSpec) {
                qtyLabels = 10;
            } else {
                qtyLabels = 6;
            }

            for (var i = 1; i <= qtyLabels; i++) {
                parent = _createLabels("LabelsAxis-" + i + "-");

                if (i < 5 || i == 7 || i == 8) {
                    parent.position.y = -_sizeCube * (0.5 - _factScaleY);
                    parent.scaling = new BABYLON.Vector3(_factScaleY, 1, 1);
                    parent.rotation.z = -Math.PI / 2;
                }

                switch (i) {
                    case 1:
                        parent.rotation.y = Math.PI / 2;
                        parent.position.x = -_sizeCube / 2;
                        parent.position.z = -_sizeCube / 2;
                        break;
                    case 2:
                        parent.rotation.y = Math.PI / 2;
                        parent.position.x = -_sizeCube / 2;
                        parent.position.z = _sizeCube / 2;
                        break;
                    case 3:
                        parent.position.x = -_sizeCube / 2;
                        parent.position.z = _sizeCube / 2;
                        break;
                    case 4:
                        parent.position.x = _sizeCube / 2;
                        parent.position.z = _sizeCube / 2;
                        break;
                    case 5:
                        parent.rotation.x = -Math.PI / 2;
                        parent.position.x = -_sizeCube / 2;
                        parent.position.y = -_sizeCube / 2;
                        parent.position.z = -_sizeCube / 2;
                        break;
                    case 6:
                        parent.rotation.y = -Math.PI / 2;
                        parent.rotation.x = -Math.PI / 2;
                        parent.position.x = _sizeCube / 2;
                        parent.position.y = -_sizeCube / 2;
                        parent.position.z = -_sizeCube / 2;
                        break;
                    case 7:
                        parent.position.x = -_sizeCube / 2;
                        parent.position.z = _sizeCube / 2;
                        parent.rotation.y = Math.PI;
                        break;
                    case 8:
                        parent.position.x = -3 * _sizeCube / 2;
                        parent.position.z = _sizeCube / 2;
                        parent.rotation.y = Math.PI;
                        break;
                    case 9:
                        parent.rotation.y = Math.PI / 2;
                        parent.rotation.x = -Math.PI / 2;
                        parent.position.x = -3 * _sizeCube / 2;
                        parent.position.y = -_sizeCube / 2;
                        parent.position.z = _sizeCube / 2;
                        break;
                    case 10:
                        parent.rotation.x = -Math.PI / 2;
                        parent.position.x = -3 * _sizeCube / 2;
                        parent.position.y = -_sizeCube / 2;
                        parent.position.z = -_sizeCube / 2;
                        break;
                    /*case 7:
                        parent.rotation.y = -Math.PI / 2;
                        parent.rotation.x = Math.PI / 2;
                        parent.position.x = -_sizeCube / 2;
                        parent.position.y = -_sizeCube / 2;
                        parent.position.z = -_sizeCube / 2;
                        break;*/
                }
            }

            if (!flagFullSpec) {
                parent = _createLabels("LabelsAxis-11-");
                parent.rotation.y = Math.PI / 2;
                parent.rotation.x = -Math.PI / 2;
                parent.position.x = - _sizeCube / 2;
                parent.position.y = -_sizeCube / 2;
                parent.position.z = _sizeCube / 2;
            }
            //_createTextLabels();

            _createGrid();
        };

        _createCubesDegrade = function () {

            var path1 = [], path2 = [], posX, posY, colorT = [], color, numCubesBase, factColor, objArrayY, numCubeX, maxY = [], posEscalaCrom, numPart, factY;
            numCubesBase = Math.floor((_sizeCube / _frecMax) * scope.sizeCubeVal);
            factY = (_sizeCube * _factScaleY) / scope.numberCubesY;
            _colorBase = new BABYLON.Color3(_escalaCromatica[0][0], _escalaCromatica[0][1], _escalaCromatica[0][2]);

            //posX = scope.sizeCubeVal;
            for (var j = 0; j < scope.bufferSpectrum.length; j++) {
                if (flagFullSpec) {
                    posX = -(_sizeCube / (_frecMax)) * scope.sizeCubeVal;
                    //posX = -scope.sizeCubeVal * 2;
                } else {
                    posX = (_sizeCube / _frecMax) * scope.sizeCubeVal;
                    //posX = scope.sizeCubeVal;
                }
                
                objArrayY = _findRangeXY(scope.bufferSpectrum[j].spec, j);
                path1 = [];
                var index = 0, colBase, colAlt;
                colBase = new Object(_colorBase);
                factColor = (_escalaCromatica.length - 1) / (_sizeCube * _factScaleY);

                for (var l = 0; l < objArrayY.length; l++) {

                    numCubeX = Math.floor(objArrayY[l].x );
                    posEscalaCrom = Math.round(factColor * objArrayY[l].y);
                    
                    if (posEscalaCrom >= _cantColores) {
                        posEscalaCrom = _cantColores - 1;
                    }

                    numPart = Math.round(objArrayY[l].y / factY);

                    if (numPart >= 1) {
                        colAlt = new Object(new BABYLON.Color3(_escalaCromatica[posEscalaCrom][0], _escalaCromatica[posEscalaCrom][1], _escalaCromatica[posEscalaCrom][2]));

                        for (var m = -Math.round(objArrayY[l].y) / 2; m < Math.round(objArrayY[l].y) / 2 ; m += factY) {

                            color = new Object(new BABYLON.Color3((colAlt.r - colBase.r) * m / numPart + colBase.r,
                                    (colAlt.g - colBase.g) * m / numPart + colBase.g, (colAlt.b - colBase.b) * m / numPart + colBase.b));
                            if (flagFullSpec) {
                                path2.push(new BABYLON.Vector3(posX * numCubeX, index, 0));
                            } else {
                                path2.push(new BABYLON.Vector3(posX * numCubeX, index, 0));
                            }
                            
                            colorT.push(color);

                            color = null;

                            index += factY;
                        }
                        index = 0;
                    }
                   
                }
                _createParticlesDegrade(path2, j, colorT, factY);

                path2 = [];
                colorT = [];
            }
            _createBase();
        };

        _calculateArmonics = function (spec, actualVel) {

            var frec, nX, yMax = 0.1, infoSignal = [];
            nX = scope.qtyArm;

            for (var j = 1; j <= nX; j++) {
                for (var i = 0; i < spec.length; i++) {                   
                    frec = (actualVel / 60) * j;
                    if (j == nX) {
                        frec = (actualVel / 60) * scope.armonicValue;
                    }
                    if (spec[i][0] > frec * 0.9 && spec[i][0] < frec * 1.1) {
                        if (spec[i][1] > yMax) {
                            yMax = spec[i][1];
                        }
                    }
                    if (scope.armonicValue != null) {
                        nX = 5;
                    }
                }
                infoSignal.push(yMax);
                yMax = 0;
            }
            return infoSignal;
        };

        _calculateMaxYFrequency = function () {

        };

        _calculateFullSpecArmonics = function (spec, actualVel) {

            var frec, nX, yMaxX = 0.1, yMaxY = 0.1, infoSignal = [];
            nX = scope.qtyArm;

            for (var j = 1; j <= nX; j++) {
                for (var i = 0; i < spec.length; i++) {
                    frec = (actualVel / 60) * j;
                    if (j == nX) {
                        frec = (actualVel / 60) * scope.armonicValue;
                    }
                    if (spec[i][0] > frec * 0.9 && spec[i][0] < frec * 1.1) {
                        if (spec[i][2] > yMaxX) {
                            yMaxY = spec[i][2];
                        }
                    }
                    if (spec[i][0] < -frec * 0.9 && spec[i][0] > -frec * 1.1) {
                        if (spec[i][1] > yMaxY) {
                            yMaxX = spec[i][1];
                        }
                    }
                    if (scope.armonicValue != null) {
                        nX = 5;
                    }
                }
                infoSignal.push({ yMaxX: yMaxX, yMaxY: yMaxY });
                yMaxX = 0;
                yMaxY = 0;
            }
            return infoSignal;
        };

        _calculateMaxYArmonic = function () {

            var qtySpec,  maxYArm = 0;
            qtySpec = _vbles.armonicsInfo.length;
            _arrayMaxY = [];

            for (var i = 0; i < _vbles.armonicsInfo[0].length; i++) {
                maxYArm = 0;
                for (var j = 0; j < qtySpec; j++) {
                    if (_vbles.armonicsInfo[j][i] > maxYArm) {
                        maxYArm = _vbles.armonicsInfo[j][i];
                    }
                }
                _arrayMaxY.push(maxYArm);
            }
        };

        _calculateMaxYArmonicFS = function () {

            var qtySpec, maxYArm = 0, maxYArmX = 0.5, maxYArmY = 0.5 ;
            qtySpec = _vbles.armonicsInfo.length;
            _arrayMaxY = [];

            for (var i = 0; i < _vbles.qtyArm; i++) {
                maxYArmX = 0.5, maxYArmY = 0.5;
                for (var j = 0; j < qtySpec; j++) {
                    if (_vbles.armonicsInfo[j][i].yMaxX > maxYArmX) {
                        maxYArmX = _vbles.armonicsInfo[j][i].yMaxX;
                    }
                    if (_vbles.armonicsInfo[j][i].yMaxY > maxYArmY) {
                        maxYArmY = _vbles.armonicsInfo[j][i].yMaxY;
                    }                                       
                }
                _arrayMaxY.push({ maxYArmX: maxYArmX, maxYArmY: maxYArmY });
            }

        };

        _createArmonicsLines = function () {

            var path = [], line, factX, factY, factZ, x, y, z;

            _vbles.nameArmLines = "lineArmonic-";

            factY = _dataWaterfall.y.fact;
            factX = _dataWaterfall.x.fact;
            factZ = _sizeCube / _vbles.armonicsInfo.length;

            for (var i = 0; i < _vbles.armonicsInfo[0].length; i++) {
                for (var j = 0; j < _vbles.armonicsInfo.length; j++) {
                    x = _vbles.RPM[j] * factX[i] * (i + 1) / 60;
                    if (i == _vbles.armonicsInfo[0].length - 1) {
                        x = _vbles.RPM[j] * factX[i] * (scope.armonicValue) / 60;
                    }

                    y = _arrayMaxY[i] * factY * 1.01;
                    z = factZ * j;
                    path.push(new BABYLON.Vector3(-_sizeCube / 2 + x, -_sizeCube / 2 + y, -_sizeCube / 2 + z));
                }
                if (_scene.getMeshByName("lineArmonic-" + i + "-" + idPoint + wId, path, _scene) == undefined) {
                    line = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-" + idPoint + wId, path, _scene);
                }
                
                if (i == _vbles.armonicsInfo[0].length - 1 && _scene.getMeshByName("lineArmonic-" + i + "-" + idPoint + wId) != undefined) {
                    _scene.getMeshByName("lineArmonic-" + i + "-" + idPoint + wId).dispose();
                    line = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-" + idPoint + wId, path, _scene);
                }
                line.color = BABYLON.Color3.FromHexString(scope.armonicColors[i]);
                line.visibility = false;
                path = [];
            }

            _vbles.armonicColors = scope.armonicColors;
            _vbles.unitsAmp = scope.unitsAmp;
        };

        _createArmonicsLinesFS = function () {

            var pathX = [], lineX, pathY = [], lineY, factX, factY, factZ, xX, yX, zX, xY, yY, zY;

            _vbles.nameArmLines = "lineArmonic-";

            factY = _dataWaterfall.y.fact;
            factX = _dataWaterfall.x.fact;
            factZ = _sizeCube / _vbles.armonicsInfo.length;

            for (var i = 0; i < _vbles.armonicsInfo[0].length; i++) {
                for (var j = 0; j < _vbles.armonicsInfo.length; j++) {
                    xX = -_vbles.RPM[j] * factX[i] * (i + 1) / 60;
                    if (i == _vbles.armonicsInfo[0].length - 1) {
                        xX = _vbles.RPM[j] * factX[i] * (scope.armonicValue) / 60;
                    }

                    yX = _arrayMaxY[i].maxYArmX * factY * 1.01;
                    zX = factZ * j;
                    pathX.push(new BABYLON.Vector3(-_sizeCube / 2 + xX, -_sizeCube / 2 + yX, -_sizeCube / 2 + zX));

                    xY = _vbles.RPM[j] * factX[i] * (i + 1) / 60;
                    if (i == _vbles.armonicsInfo[0].length - 1) {
                        xY = _vbles.RPM[j] * factX[i] * (scope.armonicValue) / 60;
                    }

                    yY = _arrayMaxY[i].maxYArmY * factY * 1.01;
                    zY = factZ * j;
                    pathY.push(new BABYLON.Vector3(-_sizeCube / 2 + xY, -_sizeCube / 2 + yY, -_sizeCube / 2 + zY));
                                
                }

                lineX = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-X-" + idPoint + wId, pathX, _scene);
                if (_scene.getMeshByName("lineArmonic-" + i + "-X-" + idPoint + wId, pathX, _scene) == undefined) {
                    lineX = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-X-" + idPoint + wId, pathX, _scene);
                }

                if (i == _vbles.armonicsInfo[0].length - 1 && _scene.getMeshByName("lineArmonic-" + i + "-X-" + idPoint + wId) != undefined) {
                    _scene.getMeshByName("lineArmonic-" + i + "-X-" + idPoint + wId).dispose();
                    lineX = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-X-" + idPoint + wId, pathX, _scene);
                }


                lineX.color = BABYLON.Color3.FromHexString(scope.armonicColors[i]);
                lineX.visibility = false;
                pathX = [];

                lineY = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-Y-" + idPoint + wId, pathY, _scene);
                if (_scene.getMeshByName("lineArmonic-" + i + "-Y-" + idPoint + wId, pathY, _scene) == undefined) {
                    lineY = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-Y-" + idPoint + wId, pathY, _scene);
                }

                if (i == _vbles.armonicsInfo[0].length - 1 && _scene.getMeshByName("lineArmonic-" + i + "-Y-" + idPoint + wId) != undefined) {
                    _scene.getMeshByName("lineArmonic-" + i + "-Y-" + idPoint + wId).dispose();
                    lineY = BABYLON.Mesh.CreateLines("lineArmonic-" + i + "-Y-" + idPoint + wId, pathY, _scene);
                }

                lineY.color = BABYLON.Color3.FromHexString(scope.armonicColors[i]);
                lineY.visibility = false;
                pathY = [];
            }
            scope.createExtraArmonicLineFS(true);
            _vbles.armonicColors = scope.armonicColors;
            _vbles.unitsAmp = scope.unitsAmp;
        };

        this.createExtraArmonicLine = function () {
           
            var path = [], line, factX, factY, factZ, x, y, z;

            factY = _dataWaterfall.y.fact;
            factX = _dataWaterfall.x.fact;
            factZ = _sizeCube / _vbles.armonicsInfo.length;

            for (var j = 0; j < _vbles.armonicsInfo.length; j++) {
                x = _vbles.RPM[j] * factX[4] * (scope.armonicValue) / 60;
                y = _arrayMaxY[4] * factY * 1.01;
                z = factZ * j;
                path.push(new BABYLON.Vector3(-_sizeCube / 2 + x, -_sizeCube / 2 + y, -_sizeCube / 2 + z));
            }

            if (_scene.getMeshByName("lineArmonic-4-" + idPoint + wId) != undefined) {
                _scene.getMeshByName("lineArmonic-4-" + idPoint + wId).dispose();
                line = BABYLON.Mesh.CreateLines("lineArmonic-4-" + idPoint + wId, path, _scene);
            }

            line.color = BABYLON.Color3.FromHexString(scope.armonicColors[4]);
            path = [];          
        };

        this.createExtraArmonicLineFS = function (firstTime) {

            var pathX = [], lineX, pathY = [], lineY, factX, factY, factZ, xX, yX, zX, xY, yY, zY;

            factY = _dataWaterfall.y.fact;
            factX = _dataWaterfall.x.fact;
            factZ = _sizeCube / _vbles.armonicsInfo.length;

            for (var j = 0; j < _vbles.armonicsInfo.length; j++) {
                //xX = _vbles.RPM[j] * factX[4] * (4 + 1) / 60;
                //if (4 == _vbles.armonicsInfo[0].length - 1) {
                //    xX = _vbles.RPM[j] * factX[4] * (scope.armonicValue) / 60;
                //}
                xX = -_vbles.RPM[j] * factX[4] * (scope.armonicValue) / 60;

                yX = _arrayMaxY[4].maxYArmX * factY * 1.01;
                zX = factZ * j;
                pathX.push(new BABYLON.Vector3(-_sizeCube / 2 + xX, -_sizeCube / 2 + yX, -_sizeCube / 2 + zX));

                //xY = _vbles.RPM[j] * factX[4] * (4 + 1) / 60;
                //if (4 == _vbles.armonicsInfo[0].length - 1) {
                //    xY = _vbles.RPM[j] * factX[4] * (scope.armonicValue) / 60;
                //}
                xY = _vbles.RPM[j] * factX[4] * (scope.armonicValue) / 60;


                yY = _arrayMaxY[4].maxYArmY * factY * 1.01;
                zY = factZ * j;
                pathY.push(new BABYLON.Vector3(-_sizeCube / 2 + xY, -_sizeCube / 2 + yY, -_sizeCube / 2 + zY));
            }

            if (_scene.getMeshByName("lineArmonic-4-X-" + idPoint + wId) != undefined) {
                _scene.getMeshByName("lineArmonic-4-X-" + idPoint + wId).dispose();
                lineX = BABYLON.Mesh.CreateLines("lineArmonic-4-X-" + idPoint + wId, pathX, _scene);
            }

            lineX.color = BABYLON.Color3.FromHexString(scope.armonicColors[4]);
            pathX = [];

            if (_scene.getMeshByName("lineArmonic-4-Y-" + idPoint + wId) != undefined) {
                _scene.getMeshByName("lineArmonic-4-Y-" + idPoint + wId).dispose();
                lineY = BABYLON.Mesh.CreateLines("lineArmonic-4-Y-" + idPoint + wId, pathY, _scene);
            }

            lineY.color = BABYLON.Color3.FromHexString(scope.armonicColors[4]);
            pathY = [];

            if (firstTime) {
                lineX.visibility = false;
                lineY.visibility = false;
            } else {
                lineX.visibility = true;
                lineY.visibility = true;
            }
        };

        _createIndColorsAmp = function () {
            var path = [], posX, posZ, cyl, options, mat, sizeCyl;
            posX = _sizeCube / 2;
            posZ = _sizeCube / 2;
            sizeCyl = (_sizeCube * _factScaleY) / (_cantColores);
            options = {
                diameter: _sizeCube / 200,
                height: sizeCyl * 3,
                tessellation: 5
            };
            
            for (var i = 0; i < Math.round(_cantColores / 3); i++) {
                cyl = BABYLON.MeshBuilder.CreateCylinder('cyl' + i, options, _scene);
                mat = new BABYLON.StandardMaterial("mat-cyl", _scene);
                mat.alpha = 1;
                mat.diffuseColor = new BABYLON.Color3(_escalaCromatica[i * 3][0], _escalaCromatica[i * 3][1],
                    _escalaCromatica[i * 3][2]);
                mat.specularColor = new BABYLON.Color3(_escalaCromatica[i * 3][0], _escalaCromatica[i * 3][1],
                    _escalaCromatica[i * 3][2]);
                mat.emissiveColor = new BABYLON.Color3(_escalaCromatica[i * 3][0], _escalaCromatica[i * 3][1],
                    _escalaCromatica[i * 3][2]);
                cyl.material = mat;
                cyl.position = new BABYLON.Vector3(posX, sizeCyl * i * 3 + sizeCyl / 2 - _sizeCube / 2, posZ);
            }
        };

        _createCanvasBmp = function () {
            var contCanvas = document.getElementById(_containerId);
            var img = document.createTextNode('<img id="imgBmp" width="3" height="380" style="display:none;">');
            contCanvas.appendChild(img);
        };

        _numDigits = function (x) {
            return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
        };

        _loadImageBmp = function () {

            scope.srcBmp = "/Content/bmpWaterfall/" + arrayBmp[watConfig.numChromeScale] + ".bmp";
            _imgBmp = document.getElementById("imgBmp");
            _imgBmp.src = scope.srcBmp;
            _canvasBmp = document.getElementById("canvasBmp");
            _ctxBmp = canvasBmp.getContext("2d");
        };

        _createBase = function () {

            var mat, box, parent;
            mat = new BABYLON.StandardMaterial("matBase", _scene);
            mat.diffuseColor = _colorBase;
            mat.emissiveColor = _colorBase;
            mat.specularColor = new BABYLON.Color3(0, 0.1, 0.1);

            parent = BABYLON.Mesh.CreateBox("parent", 1, _scene, false, BABYLON.Mesh.DEFAULTSIDE);

            for (var i = 0; i < scope.bufferSpectrum.length; i++) {
                box = parent.clone();
                box.name = "cubeBase-" + i;
                box.position.y = -_sizeCube / 2;
                
                box.scaling.z = (_sizeCube / scope.bufferSpectrum.length) * (scope.sizeCubeVal);
                if (flagFullSpec) {
                    box.scaling.x = _sizeCube * 2;
                    box.position.x = -_sizeCube / 2;
                } else {
                    box.scaling.x = _sizeCube;
                    box.position.x = 0;
                }
                

                box.position.z = -_sizeCube / 2 + (_sizeCube * i / (scope.bufferSpectrum.length)) + (_sizeCube / (scope.bufferSpectrum.length * 2));
                box.material = mat;

                box.outlineColor = new BABYLON.Color3(0, 0.7, 1);
                box.outlineWidth = 4;
            }
            
            parent.dispose();
           
        };

        this.paintArmonic = function (num, flag) {
            var valX, numCubeX, path = [], posX = scope.sizeCubeVal;
            if (flag) {
                for (var i = 0; i < _vbles.armonicsInfo.length; i++) {
                    valX = cascade3d.vbles[idPoint + wId].RPM[i] / 60;
                    numCubeX = Math.floor((valX * _dataWaterfall.x.fact) / (scope.sizeCubeVal)) * (scope.sizeCubeVal);

                    path.push(new BABYLON.Vector3((posX + numCubeX) * num, scope.sizeCubeVal / 4, (_sizeCube / scope.bufferSpectrum.length) * i));

                    color = scope.armonicColors[num - 1];

                }
                _createParticles(path, color, num - 1, "box", "arm");
            } else {
                _scene.getMeshByName("SPS-Spec-16-base" + num - 1 + "-" + "arm").dispose();
            }

        };
        
        _selLabelsColor = function (flagClasic) {

            var infoLabels, qtyLines, parentName, nameL, nameM, nameS, textUnits, textValue, colorL, infoTxt, qtyLabels;
            infoLabels = scope.infoLabels;

            if (flagClasic) {
                colorL = "#000000";
            } else {
                colorL = "#99CCEF";
            }
            

            qtyLines = infoLabels.lines.qty;
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
            var qtyInfoTxt;

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
                    if (infoTxt[i].units !== null && i != 1) {
                        _scene.getMeshByName(textUnits + infoTxt[i].id).material.ambientColor = BABYLON.Color3.FromHexString(colorL);
                        _scene.getMeshByName(textUnits + infoTxt[i].id).material.diffuseColor = BABYLON.Color3.FromHexString(colorL);
                        _scene.getMeshByName(textUnits + infoTxt[i].id).material.emissiveColor = BABYLON.Color3.FromHexString(colorL);
                        _scene.getMeshByName(textUnits + infoTxt[i].id).material.specularColor = BABYLON.Color3.FromHexString(colorL);
                    }
                    for (var j = 0; j <= qtyLines; j++) {
                        _scene.getMeshByName(textValue + infoTxt[i].id + "-" + j).material.diffuseColor = BABYLON.Color3.FromHexString(colorL);
                        _scene.getMeshByName(textValue + infoTxt[i].id + "-" + j).material.emissiveColor = BABYLON.Color3.FromHexString(colorL);
                        _scene.getMeshByName(textValue + infoTxt[i].id + "-" + j).material.specularColor = BABYLON.Color3.FromHexString(colorL);
                    }
                }
                
            }

        };

        _createRibbonForFreq = function () {
            var paths, ribbon, posX, posY, posZ;

            posX = -_sizeCube / 2;
            posY = -_sizeCube / 2;
            posZ = -_sizeCube / 2;

            paths = [
                [new BABYLON.Vector3(posX - 3, posY, _sizeCube / 2), new BABYLON.Vector3(posX - 3, posY, -_sizeCube / 2), new BABYLON.Vector3(posX + 3, posY, -_sizeCube / 2)],
                [new BABYLON.Vector3(posX + 3, posY, -_sizeCube / 2), new BABYLON.Vector3(posX + 3, posY, _sizeCube / 2), new BABYLON.Vector3(posX - 3, posY, _sizeCube / 2)]
            ];

            ribbon = BABYLON.MeshBuilder.CreateRibbon("ribbonFreqChoosed", { pathArray: paths, closeArray: true }, _scene);
            ribbon.material = new BABYLON.StandardMaterial("matribbonFreqChoosed", _scene);
            ribbon.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
            ribbon.material.alpha = 1;
            ribbon.material.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
            ribbon.material.backFaceCulling = false;
            ribbon.visibility = false;

        };

        _createCubeForFreq = function () {
            var paths, box, line;

            box = BABYLON.Mesh.CreateBox("boxFreqChoosed", 5, _scene);
            box.scaling.z = _sizeCube / 5;
            box.position = new BABYLON.Vector3(-_sizeCube / 2, 0, 0);

            box.material = new BABYLON.StandardMaterial("matboxFreqChoosed", _scene);
            box.material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
            box.material.alpha = 1;
            box.material.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);
            box.material.backFaceCulling = false;

            box.visibility = false;

            line = BABYLON.Mesh.CreateLines("lineFreq-" + idPoint + wId, [0, 0], _scene);
            line.visibility = false;
            //scope.chooseFrecuency(10);
        };

        _createLineForFreq = function (freqChoosed, checked) {

            var path = [], line, factX, factY, factZ, x, y, z, fieldSpec;

            factY = _dataWaterfall.y.fact;
            factX = _dataWaterfall.x.fact;
            factZ = _sizeCube / scope.bufferSpectrum.length;

            if (!flagFullSpec) {
                for (var i = 0; i < scope.bufferSpectrum.length; i++) {
                    
                    fieldSpec = parseInt((scope.bufferSpectrum[i].spec[1][0] / scope.bufferSpectrum[i].sampleTime) * freqChoosed);

                    x = fieldSpec * factX[i];
                    y = scope.bufferSpectrum[i].spec[fieldSpec - 1][1] * factY * 1.01;
                    z = factZ * i;

                    if (i == 0) {
                        path.push(new BABYLON.Vector3(-_sizeCube / 2 + x, -_sizeCube / 1.98, -_sizeCube / 2 + z));
                    }
                    path.push(new BABYLON.Vector3(-_sizeCube / 2 + x, -_sizeCube / 2 + y, -_sizeCube / 2 + z));
                }
                
            }
            else {
                for (var i = 0; i < scope.bufferSpectrum.length; i++) {
                    fieldSpec = parseInt(
                            (scope.bufferSpectrum[i].spec[parseInt(scope.bufferSpectrum[i].spec.length / 2) + 1][0] / scope.bufferSpectrum[i].sampleTime) * freqChoosed + parseInt(scope.bufferSpectrum[i].spec.length / 2));

                    if (fieldSpec > 0) {
                        x = (fieldSpec - 1) * factX[i] - _sizeCube;
                        y = scope.bufferSpectrum[i].spec[fieldSpec - 1][2] * factY * 1.01;
                    } else {
                        x = (fieldSpec) * factX[i] - _sizeCube;
                        y = scope.bufferSpectrum[i].spec[fieldSpec][1] * factY * 1.01;
                    }

                    z = factZ * i;
                    if (i == 0) {
                        path.push(new BABYLON.Vector3(-_sizeCube / 2 + x, -_sizeCube / 1.98, -_sizeCube / 2 + z));
                    }
                    path.push(new BABYLON.Vector3(-_sizeCube / 2 + x, -_sizeCube / 2 + y, -_sizeCube / 2 + z));

                }
            }

            

            if (_scene.getMeshByName("lineFreq-" + idPoint + wId) != undefined) {
                _scene.getMeshByName("lineFreq-" + idPoint + wId).dispose();
                line = BABYLON.Mesh.CreateLines("lineFreq-" + idPoint + wId, path, _scene);
            }

            line.color = BABYLON.Color3.FromHexString("#ff0000");
            path = [];
            line.visibility = checked;

        };

        _createGrid = function () {
            var lineHAmp, lineVAmp, lineHVel, lineVVel, pathHAmp = [], pathVAmp = [], pathHVel = [], pathVVel = [], factHAmpFS, factXVelFS;

            if (flagFullSpec) {
                factHAmpFS = _sizeCube;
                factXVelFS = _sizeCube;
            } else {
                factHAmpFS = 0;
                factXVelFS = 0;
            }


            //Lineas para amplitud Z+
            for (var i = 1; i <= _qtyLines; i++) {
                pathHAmp = [
                    new BABYLON.Vector3(-_sizeCube / 2 - factHAmpFS, -(_sizeCube / 2) + (_sizeCube) * 0.3 * 0.2 * i, _sizeCube / 2),
                    new BABYLON.Vector3(_sizeCube / 2, -(_sizeCube / 2) + (_sizeCube) * 0.3 * 0.2 * i, _sizeCube / 2)
                ];
                lineHAmp = BABYLON.Mesh.CreateLines("lineGridZPHAmp-" + i, pathHAmp, _scene);
                lineHAmp.color = BABYLON.Color3.FromHexString("#AAAAAA");

                pathVAmp = [
                    new BABYLON.Vector3(-_sizeCube / 2 + (_sizeCube) * 0.2 * i, -(_sizeCube / 2), _sizeCube / 2),
                    new BABYLON.Vector3(-_sizeCube / 2 + (_sizeCube) * 0.2 * i, -(_sizeCube / 2) + (_sizeCube) * 0.3, _sizeCube / 2)
                ];
                lineVAmp = BABYLON.Mesh.CreateLines("lineGridZPVAmp-" + i, pathVAmp, _scene);
                lineVAmp.color = BABYLON.Color3.FromHexString("#AAAAAA");

                if (flagFullSpec) {
                    pathVAmp = [
                    new BABYLON.Vector3(-_sizeCube / 2 + (_sizeCube) * 0.2 * (i - _qtyLines), -(_sizeCube / 2), _sizeCube / 2),
                    new BABYLON.Vector3(-_sizeCube / 2 + (_sizeCube) * 0.2 * (i - _qtyLines), -(_sizeCube / 2) + (_sizeCube) * 0.3, _sizeCube / 2)
                    ];
                    lineVAmp = BABYLON.Mesh.CreateLines("lineGridZPVAmp-" + i, pathVAmp, _scene);
                    lineVAmp.color = BABYLON.Color3.FromHexString("#AAAAAA");
                }

                pathHVel = [
                    new BABYLON.Vector3(-_sizeCube / 2 + factXVelFS, -(_sizeCube / 2) + (_sizeCube) * 0.3 * 0.2 * i, _sizeCube / 2),
                    new BABYLON.Vector3(-_sizeCube / 2 + factXVelFS, -(_sizeCube / 2) + (_sizeCube) * 0.3 * 0.2 * i, -_sizeCube / 2)
                ];
                lineHVel = BABYLON.Mesh.CreateLines("lineGridZPHVel-" + i, pathHVel, _scene);
                lineHVel.color = BABYLON.Color3.FromHexString("#AAAAAA");

                pathVVel = [
                    new BABYLON.Vector3(-_sizeCube / 2 + factXVelFS, -(_sizeCube / 2), -_sizeCube / 2 + (_sizeCube) * 0.2 * i),
                    new BABYLON.Vector3(-_sizeCube / 2 + factXVelFS, -(_sizeCube / 2) + (_sizeCube) * 0.3, -_sizeCube / 2 + (_sizeCube) * 0.2 * i)
                ];
                lineVVel = BABYLON.Mesh.CreateLines("lineGridZPVVel-" + i, pathVVel, _scene);
                lineVVel.color = BABYLON.Color3.FromHexString("#AAAAAA");
            }

        };


    };
    return Waterfall3d;
})();

