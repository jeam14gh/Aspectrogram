/*
 * LoadDataViewer3d.js 
 */

var LoadDataViewer3d = {};

LoadDataViewer3d = function () {
    "use strict";

    /*
     * Constructor.
     */
    LoadDataViewer3d = function (idEntity, wId) {

        var _scene,
            _flags,
            _filtered1x,
            _fundamentalFrequency,
            _verifiyBandsSize,
            _verifyNormalColor,
            _verifyStatusColor,
            _createStateStripsBySubVar,
            _createCylStatesSensor,
            _calcuateStatus,
            _reloadTextValue,
            _applyFilter,
            _drawOrbit,
            _loadSensorData,
            _verifyMaxXYValue,
            _calculateAngularPositions,
            _convertToArrayVector3,
            _convertArrayYValuesToVector3,
            _getInitialPhase,
            _getOrbitData,
            _getOrbitPath,
            _getOrbitPathFiltered1X,
            _getMaxXYOrbits,
            _arraySpects = [],
            _arrayOrbits = [],
            _factOrbits = {},
            _orientation,
            _maximumYSpec = 0;

        var scope = this;

        this.normalColor = "#00FF00";

        this.dataTextAndSensors = [];
        this.dataPairs = [];
        this.dataWaveform = [];

        _factOrbits = {
            x: 0,
            y: 0
        };

        _orientation = nodes[idEntity + wId].Properties3d.gralInfo.orientation;

        _scene = viewer3d.scene[idEntity + wId];
        _flags = globals3d.flags[idEntity + wId];

        this.loadDataTextAndSensors = function () {

            var idPoint, value, color, max, min, units, pointName, subVarName;

            for (var i = 0; i < scope.dataTextAndSensors.length; i++) {
                idPoint = scope.dataTextAndSensors[i].idPoint;
                if (scope.dataTextAndSensors[i].value !== null) {
                    value = scope.dataTextAndSensors[i].value;
                }else {
                    value = 0;
                }

                max = vbles[idPoint].SubVariables.DefaultValue.Maximum;
                min = vbles[idPoint].SubVariables.DefaultValue.Minimum;
                units = vbles[idPoint].SubVariables.DefaultValue.Units;
                pointName = vbles[idPoint].Name;
                subVarName = vbles[idPoint].SubVariables.DefaultValue.Name;

                if (value > max) {
                    value = max;
                }else if (value < min) {
                    value = min;
                }

                color = scope.dataTextAndSensors[i].statusColor;
                _reloadTextValue(idPoint, pointName, subVarName, value, units, color);
                _loadSensorData(idPoint, value, color);
            }   
        };

        _loadSensorData = function (idPoint, value, color) {

            var materialSensor, indLevel, cylLevel, probe, factHeight, diameter;
            if (_scene.getMeshByName(globals3d.names.sensor.cone + idPoint + wId)) {

                materialSensor = _scene.getMeshByName(globals3d.names.sensor.cone + idPoint + wId).material;
                materialSensor.diffuseColor = BABYLON.Color3.FromHexString(color);

                cylLevel = _scene.getMeshByName(globals3d.names.sensor.levelInd + idPoint + wId);
                indLevel = _scene.getMeshByName(globals3d.names.sensor.levelCyl + idPoint + wId);
                probe = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint + wId);

                diameter = vbles[idPoint].SubVariables.DefaultValue.diameter;

                factHeight = vbles[idPoint].SubVariables.DefaultValue.height / vbles[idPoint].SubVariables.DefaultValue.total;

                if (_scene.getMeshByName(globals3d.names.sensor.levelInd + idPoint + wId)) {
                    if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "lower") {
                        indLevel.position.y = probe._boundingInfo.maximum.y - value * factHeight;
                        cylLevel.position.y = probe._boundingInfo.maximum.y - (value * factHeight) / 2;
                        cylLevel.scaling.y = (value * factHeight) / (diameter * 0.1);
                    }
                    else if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "upper" || vbles[idPoint].SubVariables.DefaultValue.BandsType === undefined) {
                        indLevel.position.y = probe._boundingInfo.minimum.y + value * factHeight;
                        cylLevel.position.y = probe._boundingInfo.minimum.y + (value * factHeight) / 2;
                        cylLevel.scaling.y = (value * factHeight) / (diameter * 0.1);
                    }
                    else if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "upperLower") {
                        indLevel.position.y = value * factHeight;
                        cylLevel.position.y = (value * factHeight) / 2;
                        cylLevel.scaling.y = (value * factHeight) / (diameter * 0.1);
                    }
                }
            }      
        };

        _reloadTextValue = function (idPoint, pointName, subVarName, value, units, color) {

            var dynamicTexture, context2D;
            value = value.toFixed(3);

            
            if (_scene.getMeshByName(globals3d.names.text.plane + idPoint + wId)) {
                dynamicTexture = _scene.getMeshByName(globals3d.names.text.plane + idPoint + wId).material.diffuseTexture;
                context2D = dynamicTexture.getContext();
                context2D.clearRect(0, 0, 150, 150);

                dynamicTexture.drawText(pointName, null, 20, "bold 11px Segoe UI", color, null);
                dynamicTexture.drawText(value , null, 33, "bold 13px Segoe UI", color, null);
                dynamicTexture.drawText("[" + units + "]", null, 47, "bold 13px Segoe UI", color, null);
            }

        };
     
        this.drawChartsWaveform = function () {

            var flagReady, idPoint, data, type, path, drawChart, plot, size, signalX, signalY, dataOrb, factSizeX, factSizeY, dataSpec, max = {}, dataNewSpec = [];
            //var shaftDeflection = new ShaftDeflection(idEntity, wId);

            if (globals3d.flags[idEntity + wId].plots.spec) {
                type = "spec";
            } else if (globals3d.flags[idEntity + wId].plots.spec100p) {
                type = "spec100p";
            } else if (globals3d.flags[idEntity + wId].plots.waterfall) {
                type = "waterfall";
            }

            drawChart = new DrawChartsPlot2d(idEntity, wId);

            for (var i = 0; i < scope.dataWaveform.length; i++) {

                idPoint = scope.dataWaveform[i].idPoint;
                data = scope.dataWaveform[i].data;

                plot = _scene.getMeshByName(globals3d.names.plots[type].canvas + idPoint + wId);
                size = plot.scaling.x * 0.8;

                plot.visibility = true;
                for (var j = 0; j < plot._children.length; j++) {
                    plot._children[j].visibility = true;
                }

                if (data.signal) {
                    switch (type) {
                        case "spec": 
                            dataSpec = GetHalfSpectrum(data.signal, data.sampleRate).mag;
                            dataNewSpec = [];
                            if (data.isFiltered) {
                                if (data.fc > 10) {
                                    var newX = Math.round(data.fc * dataSpec.length / data.sampleRate);
                                    for (var j = 0; j < newX; j++) {
                                        dataNewSpec.push(dataSpec[j]);
                                    }
                                }
                            }
                            else {
                                dataNewSpec = dataSpec;
                            }

                            if (_verifyMaxXYValue(dataNewSpec).yMax > _maximumYSpec) {
                                _maximumYSpec = _verifyMaxXYValue(dataNewSpec).yMax;
                            }
                            _arraySpects.push({ idPoint: idPoint, dataNewSpec: dataNewSpec });


                        break;
                        case "spec100p": 
                            dataSpec = GetHalfSpectrum(data.signal, data.sampleRate).mag;
                            dataNewSpec = [];
                            if (data.isFiltered) {
                                if (data.fc > 10) {
                                    var newX = Math.round(data.fc * dataSpec.length / data.sampleRate);
                                    for (var j = 0; j < newX; j++) {
                                        dataNewSpec.push(dataSpec[j]);
                                    }
                                }
                            }
                            else {
                                dataNewSpec = dataSpec;
                            }
                            max.yMax = _verifyMaxXYValue(dataNewSpec).yMax;
                            max.xMax = _verifyMaxXYValue(dataNewSpec).xMax;

                            factSizeX = size / (max.xMax);
                            factSizeY = size / (max.yMax);

                            path = _convertToArrayVector3(dataNewSpec, factSizeX, factSizeY);
                            drawChart.drawChartInPLot(idPoint, type, path, 0, size);

                        break;
                        case "waterfall": {

                        } break;
                    }
                }
                

                flagReady = true;
            }
            if (flagReady && type === "spec") {

                chartSpec = [];

                for (i = 0; i < _arraySpects.length; i++) {
                    max.yMax = _maximumYSpec;
                    max.xMax = _verifyMaxXYValue(_arraySpects[i].dataNewSpec).xMax;

                    factSizeX = size / (max.xMax);
                    factSizeY = size / (max.yMax);

                    path = _convertToArrayVector3(_arraySpects[i].dataNewSpec, factSizeX, factSizeY);
                    drawChart.drawChartInPLot(_arraySpects[i].idPoint, type, path, 0, size);
                }
                _arraySpects = [];
                _maximumYSpec = 0;
            }
        };
        /*
        this.drawChartsPairs = function () {


            var idPoint, data, type, path, drawChart, plot, size, signalX, signalY, dataOrb, factSizeX, factSizeY, dataSpec, max = {}, dataNewSpec = [], dataTrend = [], sizePlotX, sizePlotY;

            var shaftDeflection = new ShaftDeflection(idEntity, wId);

            drawChart = new DrawChartsPlot2d(idEntity, wId);

            drawChart.orientation = scope.orientation;

            if (globals3d.flags[idEntity + wId].plots.orb) {
                type = "orb";
            } else if (globals3d.flags[idEntity + wId].plots.sCL) {
                type = "sCL";
            } else if (globals3d.flags[idEntity + wId].plots.ShaftDef) {
                type = "ShaftDef";
            }

            for (var i = 0; i < scope.dataPairs.length; i++) {

                idPoint = scope.dataPairs[i].idPoint;
                data = new Object(scope.dataPairs[i].data);
                plot = _scene.getMeshByName(globals3d.names.plots[type].canvas + idPoint + wId);
                size = plot.scaling.x * 0.8;

                //globals3d.names.plots[type].canvas + idPoint + wId;
                plot.visibility = true;
                for (var j = 0; j < plot._children.length; j++) {
                    plot._children[j].visibility = true;
                }

                if (data !== undefined) {
                    switch (type) {
                        case "orb": 
                            _drawOrbit(data, idPoint, plot, size, type);
                        break;
                        case "ShaftDef": 
                            var path = _drawOrbit(data, idPoint, plot, size, type);
                            if (path.length > 1) {
                                if (data.flagDefShaft) {
                                    if (_orientation === 0) {
                                        shaftDeflection.createCurveH();
                                    } else {
                                        shaftDeflection.createCurveV();
                                    }
                                }
                            }
                         break;
                        case "sCL": 

                        break;
                    }
                }
            }           
        };*/

        this.drawChartsPairs = function () {


            var i, j, idPoint, data, type, path, drawChart, plot, size, signalX, signalY, dataOrb, factSizeX, factSizeY, dataSpec, max = {}, dataNewSpec = [], dataTrend = [], sizePlotX, sizePlotY, flagReady = false;

            _arrayOrbits = []; 
            var shaftDeflection = new ShaftDeflection(idEntity, wId);

            drawChart = new DrawChartsPlot2d(idEntity, wId);

            drawChart.orientation = scope.orientation;

            if (globals3d.flags[idEntity + wId].plots.orb) {
                type = "orb";
            } else if (globals3d.flags[idEntity + wId].plots.sCL) {
                type = "sCL";
            } else if (globals3d.flags[idEntity + wId].plots.ShaftDef) {
                type = "ShaftDef";
            } else if (globals3d.flags[idEntity + wId].plots.orb1X) {
                type = "orb1X";
            }

            for (i = 0; i < scope.dataPairs.length; i++) {

                idPoint = scope.dataPairs[i].idPoint;
                data = new Object(scope.dataPairs[i].data);
                plot = _scene.getMeshByName(globals3d.names.plots[type].canvas + idPoint + wId);
                size = plot.scaling.x * 0.95;

                //globals3d.names.plots[type].canvas + idPoint + wId;
                plot.visibility = true;
                for (var j = 0; j < plot._children.length; j++) {
                    plot._children[j].visibility = true;
                }

                if (data !== undefined) {
                    if (_flags.plots.orb1X || _flags.plots.ShaftDef) {
                        _getOrbitPathFiltered1X(data, idPoint);
                    } else {
                        _getOrbitPath(data, idPoint);
                    }
                                                      
                }

                if (i == plot._children.length - 1 ) {
                    flagReady = true;
                }
            }

            if (flagReady) {
                _getMaxXYOrbits(type);
                _drawOrbit(type);
            }

            /*
            for (j = 0; j < scope.dataPairs.length; j++) {
                idPoint = scope.dataPairs[j].idPoint;
                data = new Object(scope.dataPairs[j].data);
                plot = _scene.getMeshByName(globals3d.names.plots[type].canvas + idPoint + wId);
                size = plot.scaling.x * 0.8;
                _drawOrbit(data, idPoint, plot, size, type)
            }*/

            if (scope.dataPairs.length > 0) {
                if (type == "ShaftDef" && scope.dataPairs[0].data.flagDefShaft && _arrayOrbits.length > 1) {
                    if (_orientation === 0) {
                        shaftDeflection.createCurveH();
                    } else {
                        shaftDeflection.createCurveV();
                    }
                }
            }         
        };

        _getOrbitPath = function (data, idPoint) {
            var signalX, signalY, dataOrb;
            /*
            if (_flags.plots.orb1X || _flags.plots.ShaftDef) {
                signalX = GetFilterSignal(data.x, Math.round(data.vel), Math.round(data.sampleRate));
                signalY = GetFilterSignal(data.y, Math.round(data.vel), Math.round(data.sampleRate));
                
            }*/
            signalX = (data.isFiltered) ? GetFilterSignal(data.x, data.fc, Math.round(data.sampleRate)) : data.x;
            signalY = (data.isFiltered) ? GetFilterSignal(data.y, data.fc, Math.round(data.sampleRate)) : data.y;
            
            dataOrb = GetOrbitFull(signalX, signalY, data.kphX, data.kphY, data.xAngle * Math.PI / 180, data.yAngle * Math.PI / 180);

            _arrayOrbits.push({ idPoint: idPoint, dataOrb: dataOrb, tS: data.tS });
           
        };

        _getOrbitPathFiltered1X = function (data, idPoint) {
            var
                sampleTime,
                phaseIni,
                xVal,
                yVal,
                waveformX,
                waveformY,
                positions,
                xAngularPos,
                yAngularPos,
                phiX,
                phiY,
                dataOrb;


            if (data.vel ) {
                _fundamentalFrequency = data.vel;
            }

            sampleTime = (data.x.length / data.sampleRate);



            phaseIni = _getInitialPhase(clone(data.kphX), data.xPha1X);
            xVal = _applyFilter(data.x, data.sampleRate, data.measureType, data.xAmp1X, phaseIni);
            phaseIni = _getInitialPhase(clone(data.kphY), data.yPha1X);
            yVal = _applyFilter(data.y, data.sampleRate, data.measureType, data.yAmp1X, phaseIni);


            positions = _calculateAngularPositions(clone(data.kphX), data.x, data.xPha1X, clone(data.kphY), data.y, data.yPha1X);
            xAngularPos = positions[0];
            yAngularPos = positions[1];

            phiX = data.xAngle * Math.PI / 180;
            phiY = data.yAngle * Math.PI / 180;
            dataOrb = _getOrbitData(xVal, yVal, phiX, phiY, xAngularPos, yAngularPos, 1);

            _arrayOrbits.push({ idPoint: idPoint, dataOrb: dataOrb, tS: data.tS });

        };

        _getOrbitData = function (xVal, yVal, phiX, phiY, xAngularPos, yAngularPos, laps) {
            var
                data,
                start,
                xMax, xMin,
                yMax, yMin,
                i, j,
                largest,
                largestX, largestY,
                x, y, end,
                deltaX, deltaY;

            data = {
                value: [],
                rangeX: [],
                rangeY: []
            };
            largestX = 0;
            largestY = 0;
            laps = (xAngularPos.length > 1) ? laps : 1;
            if (xAngularPos.length > 0) {
                xMax = -xVal[Math.round(xAngularPos[0])] * Math.sin(phiX) - yVal[Math.round(xAngularPos[0])] * Math.sin(phiY);
                yMax = xVal[Math.round(xAngularPos[0])] * Math.cos(phiX) + yVal[Math.round(xAngularPos[0])] * Math.cos(phiY);
            } else {
                xMax = -xVal[0] * Math.sin(phiX) - yVal[0] * Math.sin(phiY);
                yMax = xVal[0] * Math.cos(phiX) + yVal[0] * Math.cos(phiY);
            }
            xMin = xMax;
            yMin = yMax;
            for (i = 0; i < laps; i += 1) {
                end = (xAngularPos.length > 1) ? xAngularPos[i + 1] : xVal.length;
                start = (xAngularPos.length > 1) ? xAngularPos[i] : 0;
                for (j = Math.round(start); j < Math.round(end); j += 1) {
                    x = -xVal[j] * Math.sin(phiX) - yVal[j] * Math.sin(phiY);
                    y = xVal[j] * Math.cos(phiX) + yVal[j] * Math.cos(phiY);
                    xMax = (x > xMax) ? x : xMax;
                    xMin = (x < xMin) ? x : xMin;
                    yMax = (y > yMax) ? y : yMax;
                    yMin = (y < yMin) ? y : yMin;
                    largestX = (Math.abs(x) > largestX) ? Math.abs(x) : largestX;
                    largestY = (Math.abs(y) > largestY) ? Math.abs(y) : largestY;
                    data.value.push([x, y]);
                }
                data.value.push([null, null]);
            }

            largest = [(xMax - xMin), (yMax - yMin)].max();
            largest = (largest === 0) ? 5 : largest;
            deltaX = (2 * largest - (xMax - xMin)) / 2;
            deltaY = (2 * largest - (yMax - yMin)) / 2;
            xMin -= deltaX;
            xMax += deltaX;
            yMin -= deltaY;
            yMax += deltaY;
            data.rangeX = [xMin, xMax];
            data.rangeY = [yMin, yMax];
            return data;
        };

        _getInitialPhase = function (KeyphasorPositions, phase1x) {
            var
                total,
                initial;

            if (KeyphasorPositions.length > 1) {
                initial = KeyphasorPositions[0];
                total = KeyphasorPositions[1] - initial;
                return 360 - ((initial * 360 / total) + phase1x) % 360;
            } else {
                return 0;
            }
        };

        _applyFilter = function (waveformValue, sampleRate, measureType, amp1x, phaIni) {
            var
                i, N,
                omega,
                resp,
                periodCount,
                sampleTime,
                samplesToUse,
                amp, pha,
                sumX, sumY;

            N = waveformValue.length;
            resp = clone(waveformValue);
            if (amp1x && phaIni > 0) {
                pha = ((phaIni > 180) ? phaIni - 360 : phaIni) * Math.PI / 180;
                for (i = 0; i < N; i += 1) {
                    resp[i] = (amp1x / 2) * Math.cos(Math.PI * 2 * _fundamentalFrequency * (i / sampleRate) + pha);
                }
            } else if (_fundamentalFrequency && _fundamentalFrequency > 0) {
                sampleTime = (N / sampleRate);
                periodCount = Math.floor(sampleTime * _fundamentalFrequency);
                samplesToUse = Math.round((periodCount * N) / (_fundamentalFrequency * sampleTime));
                omega = 2.0 * Math.PI / samplesToUse;
                sumX = 0;
                sumY = 0;

                for (i = 0; i < samplesToUse; i += 1) {
                    sumX += resp[i] * Math.cos(omega * i * periodCount);
                    sumY += resp[i] * (-1) * Math.sin(omega * i * periodCount);
                }
                pha = -Math.atan2(-sumY, sumX);// * 180 / Math.PI;
                //pha = 360 - ((pha < 0) ? pha + 360 : pha) % 360;
                //pha = ((pha > 180) ? pha - 360 : pha) * Math.PI / 180;
                amp = 4 * Math.sqrt(sumX * sumX + sumY * sumY) / N;
                for (i = 0; i < N; i += 1) {
                    resp[i] = (amp / 2) * Math.cos(Math.PI * 2 * _fundamentalFrequency * (i / sampleRate) + pha);
                }
            }
            return resp;
        };

        _getMaxXYOrbits = function (type) {

            var maxX, 
                maxY, 
                rangeX, 
                rangeY,
                plot,
                size;

            maxX = 0;
            maxY = 0;

            for (var i = 0; i < _arrayOrbits.length; i++) {
                rangeX = Math.abs(_arrayOrbits[i].dataOrb.rangeX[1] - _arrayOrbits[i].dataOrb.rangeX[0]);
                rangeY = Math.abs(_arrayOrbits[i].dataOrb.rangeY[1] - _arrayOrbits[i].dataOrb.rangeY[0]);
                
                if (maxX < rangeX) {
                    maxX = rangeX;
                }
                if (maxY < rangeY) {
                    maxY = rangeY;
                }
            }

            plot = _scene.getMeshByName(globals3d.names.plots[type].canvas +  _arrayOrbits[0].idPoint + wId);
            size = plot.scaling.x * 0.7 * 2;

            _factOrbits.x = size / (maxX);
            _factOrbits.y = size / (maxY);
        };

        _calculateAngularPositions = function (xAngularPos, xVal, xPha, yAngularPos, yVal, yPha) {
            var
                i,
                delta,
                firstMax,
                range,
                period,
                firstPosition;

            if (xAngularPos.length > 1) {
                // Primero encontrar el primer pico maximo
                range = xVal.slice(0, xAngularPos[1]);
                firstMax = range.indexOf(range.max());
                // Cantidad de datos que representan un giro completo del eje
                delta = xAngularPos[1] - xAngularPos[0];
                firstPosition = (360 - xPha) * delta / 360 + firstMax;
                if (firstPosition - delta > 0) {
                    firstPosition -= delta;
                }
                period = (xAngularPos[xAngularPos.length - 1] - xAngularPos[0]) / (xAngularPos.length - 1);
                for (i = 0; i < xAngularPos.length; i += 1) {
                    xAngularPos[i] = Math.round(period * i + firstPosition);
                    yAngularPos[i] = xAngularPos[i];
                }
            }
            return [xAngularPos, yAngularPos];
        };

        _drawOrbit = function (type) {

            var drawChart, path, plot, size;

            plot = _scene.getMeshByName(globals3d.names.plots[type].canvas + _arrayOrbits[0].idPoint + wId);
            size = plot.scaling.x * 0.80;

            for (var i = 0; i < _arrayOrbits.length; i++) {
                drawChart = new DrawChartsPlot2d(idEntity, wId);
                drawChart.orientation = scope.orientation;
                path = _convertToArrayVector3(_arrayOrbits[i].dataOrb.value, _factOrbits.x, _factOrbits.y);
                drawChart.drawChartInPLot(_arrayOrbits[i].idPoint, type, path, _arrayOrbits[i].tS, size);
            }

        };

        this.drawChartTrend = function () {

            var idPoint, value, type, path, drawChart, plot, size, signalX, signalY, dataOrb, factSizeX, factSizeY,  max = {},  dataTrend = [];
            var buffer = globals3d.bufferTrend[idEntity + wId];
            var shaftDeflection = new ShaftDeflection(idEntity + wId);

            type = "trend";

            drawChart = new DrawChartsPlot2d(idEntity + wId);

            for (var i = 0; i < scope.dataTextAndSensors.length; i++) {

                idPoint = scope.dataTextAndSensors[i].idPoint;
                plot = _scene.getMeshByName(globals3d.names.plots[type].canvas + idPoint + wId);

                if (plot) {
                    size = plot.scaling.x * 0.8;
                    value = scope.dataTextAndSensors[i].value;

                    max.yMax = vbles[idPoint].SubVariables.DefaultValue.Maximum - vbles[idPoint].SubVariables.DefaultValue.Minimum;
                    max.xMax = globals3d.bufferLength;

                    factSizeX = size / (max.xMax);
                    factSizeY = size / (max.yMax);

                    for ( i = 0; i < buffer[idPoint].length; i++) {
                        dataTrend.push([[i], [buffer[idPoint][i].Value]]);
                    }

                    path = _convertToArrayVector3(dataTrend, factSizeX, factSizeY);
                    drawChart.drawChartInPLot(idPoint, type, path, 0, size);
                }                
            }
        };

       _verifyMaxXYValue = function (dataSpec) {

            var yMax = 0,  xMax = 0;
            for (var i = 0; i < dataSpec.length; i++) {
                if (xMax < dataSpec[i][0]) {
                    xMax = dataSpec[i][0];
                }
                if (yMax < dataSpec[i][1]) {
                    yMax = dataSpec[i][1];
                }
            }
            return { yMax: yMax, xMax: xMax };
       };

       _convertArrayYValuesToVector3 = function (data, factX, factY) {

           var path = [];

           for (var i = 0; i < data.length; i++) {
               path.push(new BABYLON.Vector3(data[i][0] * factX, data[i][1] * factY, 0));
           }


           return path;
       };

        _convertToArrayVector3 = function (data, factX, factY) {

            var path = [];
            if (data.length > 1) {
                for (var i = 0; i < data.length - 1; i++) {
                    path.push(new BABYLON.Vector3(data[i][0] * factX, data[i][1] * factY, 0));
                }
            } else {
                path.push(0, 0, 0);
            }
            
            return path;
        };

        _verifyNormalColor = function () {
            for (var i = 0; i < arrayObjectStatus.length; i++) {
                if (arrayObjectStatus[i].Severity === 1) {
                    scope.normalColor = arrayObjectStatus[i].Color;
                }
            }
        }();

        _verifyStatusColor = function (idStatus) {

            var severity, color;

            for (var i = 0; i < arrayObjectStatus.length; i++) {
                if (arrayObjectStatus[i].Id === idStatus) {

                    severity = arrayObjectStatus[i].Severity;
                    color = arrayObjectStatus[i].Color;
                }
            }


            return {
                Color: color,
                Severity: severity
            };
        };

        _createCylStatesSensor = function (nameCyl, heightCyl, diameterCyl, color, position, probe) {

            var tempCyl = new BABYLON.Mesh.CreateCylinder(nameCyl, heightCyl, diameterCyl, diameterCyl, 12, 0, _scene); //Cilindro
            tempCyl.material = new BABYLON.StandardMaterial("material-" + nameCyl, _scene);
            tempCyl.material.alpha = 0.2;

            tempCyl.material.freeze();


            tempCyl.material.diffuseColor.r = color.r - 0.1;
            tempCyl.material.diffuseColor.g = color.g - 0.1;
            tempCyl.material.diffuseColor.b = color.b - 0.1;

            tempCyl.material.specularColor.r = color.r + 0.1;
            tempCyl.material.specularColor.g = color.g + 0.1;
            tempCyl.material.specularColor.b = color.b + 0.1;

            tempCyl.parent = probe;
            tempCyl.position.y = position;

            cylProbes.push(tempCyl);
        };

        _createStateStripsBySubVar = function (idPoint, total, height, heightTotal, diameter) {

            var probe,
                totalValue,
                heightScale,
                factHeight,
                size,
                color,
                sizeCyl,
                sizeCylB = 0,
                position = 0;

                for (var j = 0; j < vbles[idPoint].SubVariables.DefaultValue.ArraySize.length; j++) {
                    size = vbles[idPoint].SubVariables.DefaultValue.ArraySize[j].size;
                    color = BABYLON.Color3.FromHexString(vbles[idPoint].SubVariables.DefaultValue.ArraySize[j].color);
                    sizeCyl = (size / total) * height;
                    position = -height / 2 + sizeCylB + sizeCyl / 2;
                    probe = _scene.getMeshByName(globals3d.names.sensor.probe + idPoint + wId);
                    _createCylStatesSensor(globals3d.names.sensor.probe + "cyl-" + j + "-" + idPoint + wId, sizeCyl, diameter, color, position, probe);
                    sizeCylB += sizeCyl;
                }
            
        };

        var count = 0;

        _verifiyBandsSize = function (idPoint, bands, max, min, total, height, heightTotal, diameter) {

            var arraySize = [], indexBands = 0, iniPos = 0;

            iniPos = vbles[idPoint].SubVariables.DefaultValue.IniPos;

            if (bands.length >= 1) {
                bands.sort(function (a, b) {
                    return a.Severity - b.Severity;
                });
            }
            
            for (var i = 0; i < bands.length; i++) {
               
                if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "lower") {
                    
  
                            if (i === 0) {
                                arraySize.push({ size: max - bands[i].LowerThreshold.Value, color: scope.normalColor });
                            }
                            if (i <= bands.length - 1) {
                                arraySize.push({ size: bands[i].LowerThreshold.Value - bands[i - 1].LowerThreshold.Value, color: bands[i - 1].Color });
                            }
                            if (i === bands.length - 1) {
                                arraySize.push({ size: bands[i].LowerThreshold.Value - min, color: bands[i].Color });
                            }
                }
                if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "upper") {
                  
                            if (i === 0) {
                                arraySize.push({ size: bands[i].UpperThreshold.Value - min, color: scope.normalColor });
                            }
                            if (i > 0 && i <= bands.length - 1) {
                                arraySize.push({ size: bands[i].UpperThreshold.Value - bands[i - 1].UpperThreshold.Value, color: bands[i - 1].Color });
                            }
                            if (i === bands.length - 1) {
                                arraySize.push({ size: max - bands[i].UpperThreshold.Value, color: bands[i].Color });
                            }
                        }
            }


            if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "upperLower") {

                for (var i = 0 ; i < bands.length + 2; i++) {
                    if (i < bands.length) {
                        if (bands[i].LowerThreshold != null) {
                            arraySize.push(0);
                        }
                        if (bands[i].UpperThreshold != null) {
                            arraySize.push(0);
                        }
                    }
                    else {
                        arraySize.push(0);
                    }
                }

                arraySize[arraySize.length / 2 - 1] = { size: iniPos - bands[0].LowerThreshold.Value, color: scope.normalColor };
                arraySize[arraySize.length / 2] = { size: bands[0].UpperThreshold.Value - iniPos, color: scope.normalColor };

                for (var i = 1; i <= bands.length; i++) {
                    if (i < bands.length) {
                        arraySize[arraySize.length / 2 - 1 - i] = { size: bands[i -1].LowerThreshold.Value - bands[i].LowerThreshold.Value, color: bands[i - 1].Color };
                        arraySize[arraySize.length / 2 + i] = { size: bands[i].UpperThreshold.Value - bands[i - 1].UpperThreshold.Value, color: bands[i - 1].Color };
                    }
                    else if (i == bands.length) {
                        arraySize[arraySize.length / 2 - 1 - i] = { size: bands[i - 1].LowerThreshold.Value - min, color: bands[i - 1].Color };
                        arraySize[arraySize.length / 2 + i] = { size: max - bands[i - 1].UpperThreshold.Value, color: bands[i - 1].Color };
                    }
                    
                }


            }
            if (vbles[idPoint].SubVariables.DefaultValue.BandsType == undefined) {
                arraySize.push({ size: max - min, color: scope.normalColor })
            }
            vbles[idPoint].SubVariables.DefaultValue.ArraySize = arraySize;

            _createStateStripsBySubVar(idPoint, total, height, heightTotal, diameter);
        };

        this.verifyIncDec = function () {

            var idPoint, bands, max, min, total, height, heightTotal, diameter, flagU = false, flagL = false;

            for (var i = 0; i < nodes[idEntity + wId].Properties3d.points.children.length; i++) {
                flagU = false, flagL = false;
                idPoint = nodes[idEntity + wId].Properties3d.points.children[i].idPoint;
                bands = new Object(vbles[idPoint].SubVariables.DefaultValue.Bands);

                max = vbles[idPoint].SubVariables.DefaultValue.Maximum;
                min = vbles[idPoint].SubVariables.DefaultValue.Minimum;
                total = max - min;

                height = nodes[idEntity + wId].Properties3d.points.height;
                heightTotal = nodes[idEntity + wId].Properties3d.points.height * nodes[idEntity + wId].Properties3d.points.children[i].info.heightScale;
                diameter = nodes[idEntity + wId].Properties3d.points.diameter;

                vbles[idPoint].SubVariables.DefaultValue.BandsType = null;
                if (bands != null) {
                    for (var j = 0; j < bands.length; j++) {

                        vbles[idPoint].SubVariables.DefaultValue.Bands[j].Color =
                            _verifyStatusColor(vbles[idPoint].SubVariables.DefaultValue.Bands[j].StatusId).Color;

                        vbles[idPoint].SubVariables.DefaultValue.Bands[j].Severity =
                            _verifyStatusColor(vbles[idPoint].SubVariables.DefaultValue.Bands[j].StatusId).Severity;

                        if (bands[j].UpperThreshold == null ) {
                            if (bands[j].LowerThreshold.Value > min) {
                                vbles[idPoint].SubVariables.DefaultValue.BandsType = "lower";
                                vbles[idPoint].SubVariables.DefaultValue.IniPos = max;
                                flagL = true;
                            }
                        }
                        else if (bands[j].LowerThreshold == null) {
                            if (bands[j].UpperThreshold.Value < max) {
                                vbles[idPoint].SubVariables.DefaultValue.BandsType = "upper";
                                vbles[idPoint].SubVariables.DefaultValue.IniPos = min;
                                flagU = true;
                            }
                        } else if (isNumeric(bands[j].LowerThreshold.Value) && isNumeric(bands[j].UpperThreshold.Value)) {
                            if (bands[j].LowerThreshold.Value > min && bands[j].UpperThreshold.Value >= max) {
                                vbles[idPoint].SubVariables.DefaultValue.BandsType = "lower";
                                vbles[idPoint].SubVariables.DefaultValue.IniPos = max;
                                flagL = true;
                            }
                            else if (bands[j].UpperThreshold.Value < max && bands[j].LowerThreshold.Value == 0) {
                                vbles[idPoint].SubVariables.DefaultValue.BandsType = "upper";
                                vbles[idPoint].SubVariables.DefaultValue.IniPos = min;
                                flagU = true;
                            }
                            else if (bands[j].UpperThreshold.Value < max && bands[j].LowerThreshold.Value > min) {
                                flagL = true;
                                flagU = true;
                            }                           

                        }
                        

                    }
                    if (flagU && flagL) {
                        vbles[idPoint].SubVariables.DefaultValue.BandsType = "upperLower";
                        vbles[idPoint].SubVariables.DefaultValue.IniPos = 0;
                    }

                vbles[idPoint].SubVariables.DefaultValue.height = height;
                vbles[idPoint].SubVariables.DefaultValue.diameter = diameter;
                vbles[idPoint].SubVariables.DefaultValue.total = total;
                _verifiyBandsSize(idPoint, bands, max, min, total, height, heightTotal, diameter);

                }
                
            }
        };
        /*
         * anima el activo dependiendo del número de ejes y su velocidad
         */
        this.animateAsset = function (axis,  Value) {
            //Ver la forma de como animar la marca de paso

            var tS, vel, fps, totalFrame, anim, realVel, nomVel, factVel, newFPS;

            realVel = 0;

            if (Value > 0) {
                realVel = Value;
            }            
            fps = 120;
            totalFrame = 60;
            nomVel = 3600;
            factVel = (realVel / nomVel);
            newFPS = factVel * fps;           
            if (_flags.animation) {
                if (nodes[idEntity + wId].Properties3d.asset.axis[axis].prop.tS === 0) {
                    tS = -1;
                } else {
                    tS = 1;
                }             
                BABYLON.Animation.CreateAndStartAnimation("rotateAxis-" + axis,
                    _scene.getMeshByName(globals3d.names.parents.axis + "-" + axis + "-" + idEntity + wId),
                    "rotation.z",
                    newFPS * nodes[idEntity + wId].Properties3d.asset.axis[axis].prop.vel,
                    totalFrame,
                    0,
                    0.5 * tS);
            } else {
                BABYLON.Animation.CreateAndStartAnimation("rotateAxis-" + axis,
                        _scene.getMeshByName(globals3d.names.parents.axis + "-" + axis + "-" + idEntity + wId),
                        "rotation.z",
                        newFPS * nodes[idEntity + wId].Properties3d.asset.axis[axis].prop.vel,
                        totalFrame,
                        0,
                        0);
                nodes[idEntity + wId].Properties3d.asset.axis[axis].prop.realVel = 0;
            }

        };

        /*
        * Verifica la severidad y el color de un estado con si id de base de datos
        *esto lo hace en un array creado con la información de la base de datos al inicio de la carga del 3D
        * @param {string} id Status: id del estado a consultar
        */
        _calcuateStatus = function (idPoint, value, max, min) {

            var bands, color;
   

            bands = clone(vbles[idPoint].SubVariables.DefaultValue.Bands);
            if (vbles[idPoint].SubVariables.DefaultValue.Bands != null) {
                for (var i = 0; i < bands.length; i++) {
                    if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "lower") {
                        if (i === 0) {
                            if (value <= max && value > bands[i].LowerThreshold.Value) {
                                color = scope.normalColor;
                            }
                        }
                        if (i > 0 && i <= bands.length - 1) {
                            if (value <= bands[i - 1].LowerThreshold.Value && value > bands[i].LowerThreshold.Value) {
                                color = bands[i - 1].Color;
                            }
                        }
                        if (i === bands.length - 1) {
                            if (value <= bands[i].LowerThreshold.Value && value >= min) {
                                color = bands[i].Color;
                            }
                        }
                    }
                    else if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "upper") {
                        if (i === 0) {
                            if (value >= min && value < bands[i].UpperThreshold.Value) {
                                color = scope.normalColor;
                            }
                        }
                        if (i > 0 && i <= bands.length - 1) {
                            if (value >= bands[i - 1].UpperThreshold.Value && value < bands[i].UpperThreshold.Value) {
                                color = bands[i - 1].Color;
                            }
                        }
                        if (i === bands.length - 1) {
                            if (value >= bands[i].UpperThreshold.Value && value <= max) {
                                color = bands[i].Color;
                            }
                        }
                    }
                    else if (vbles[idPoint].SubVariables.DefaultValue.BandsType === "upperLower") {

                    }
                    else if (vbles[idPoint].SubVariables.DefaultValue.BandsType == undefined) {
                        color = scope.normalColor;
                    }
                }
            } 
            

            //color = _verifyStatusColor(vbles[idPoint].SubVariables.DefaultValue.Status[0]).Color;

            if (color === undefined) {
                color = "#00ff00";
            }

            return color;
        };

    };
    return LoadDataViewer3d;
}();