/*
 * imgWaterfall3d.js
 * Generacion de imagen enriquecida de la cascada
 */

var ImgWaterfall3d = {};

ImgWaterfall3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ImgWaterfall3d = function (idPoint, waterfall, wId, flagFullSpec) {

        var _scene,
            _engine,
            _camera,
            _vbles,
            _containerId,
            _container,
            _context,
            _convertWebglHtmlToCanvas,
            _loadInfoCanvasWaterfall,
            _drawInfoToCanvas,
            _dataInfoWaterfall3d = {};

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
        

        this.gralInfoDivName = "";
        this.flagSaveFile = false;
        this.flagSaveUrlReport = false;
        var scope = this;


        this.saveImage = function () {

            _loadInfoCanvasWaterfall();
            var imgURL;
            imgURL = _convertWebglHtmlToCanvas(_engine, _camera, { precision: 2 });
        };

        _convertWebglHtmlToCanvas = function (engine, camera, size, successCallback) {
            var data;
            var width;
            var height;
            var imgURL;                     
            var screenshotCanvas;

            //Si la precision es especificada
            if (size.precision) {
                width = Math.round(engine.getRenderWidth() * size.precision);
                height = Math.round(width / engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            else if (size.width && size.height) {
                width = size.width;
                height = size.height;
            }
            else if (size.width && !size.height) {
                width = size.width;
                height = Math.round(width / engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            else if (size.height && !size.width) {
                height = size.height;
                width = Math.round(height * engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            else if (!isNaN(size)) {
                height = size;
                width = size;
            }
            else {
                BABYLON.Tools.Error("Invalid 'size' parameter !");
                return;
            }
            var scene = camera.getScene();
            var previousCamera = null;
            if (scene.activeCamera !== camera) {
                previousCamera = scene.activeCamera;
                scene.activeCamera = camera;
            }

            var numberOfChannelsByLine = width * 4;
            var halfHeight = height / 2;

            //En este punto, el tamaño puede ser un número o un objeto (de acuerdo con el método engine.prototype.createRenderTargetTexture
            var texture = new BABYLON.RenderTargetTexture("screenShot", size, scene, false, false);
            texture.renderList = scene.meshes;
            texture.onAfterRenderObservable.add(function () {
                data = engine.readPixels(0, 0, width, height);

                for (var i = 0; i < halfHeight; i++) {
                    for (var j = 0; j < numberOfChannelsByLine; j++) {
                        var currentCell = j + i * numberOfChannelsByLine;
                        var targetLine = height - i - 1;
                        var targetCell = j + targetLine * numberOfChannelsByLine;
                        var temp = data[currentCell];
                        data[currentCell] = data[targetCell];
                        data[targetCell] = temp;
                        
                    }
                }
                // Crea un canvas 2D, para guardar el resultado
                if (!screenshotCanvas) {
                    screenshotCanvas = document.createElement('canvas');
                }
                screenshotCanvas.width = width;
                screenshotCanvas.height = height;

                _context = screenshotCanvas.getContext('2d');

                // Copia los pxeles al canvas 2D
                var imageData = _context.createImageData(width, height);
                var castData = imageData.data;
                castData.set(data);
                _context.putImageData(imageData, 0, 0);
                _drawInfoToCanvas();
                var base64Image = screenshotCanvas.toDataURL("image/jpeg", 1.0);

                if (successCallback) {
                    successCallback(base64Image);
                }
                else {                 
                    actualSrcImage = base64Image;

                    if (scope.flagSaveFile) {
                        if (("download" in document.createElement("a"))) {
                            var a = window.document.createElement("a");
                            a.href = base64Image;
                            var date = new Date();
                            var stringDate = (date.getFullYear() + "-" + (date.getMonth() + 1)).slice(-2) + "-" + date.getDate() + "_" + date.getHours() + "-" + ('0' + date.getMinutes()).slice(-2);
                            a.setAttribute("download", "screenshot_" + stringDate + ".jpg");
                            window.document.body.appendChild(a);
                            a.addEventListener("click", function () {
                                a.parentElement.removeChild(a);
                            });
                            a.click();
                        }
                        else {
                            var newWindow = window.open("");
                            var img = newWindow.document.createElement("img");
                            img.src = base64Image;
                            newWindow.document.body.appendChild(img);
                        }
                    }
                    if (scope.flagSaveUrlReport) {
                        for (var j = 0; j < globalsReport.elem3D.length; j++) {
                            if (globalsReport.elem3D[j].id == idPoint + wId) {
                                globalsReport.elem3D[j].src = base64Image;
                            }

                        }
                    }
                }
            });

            scene.incrementRenderId();
            scene.resetCachedMaterial();
            texture.render(true);
            texture.dispose();
            if (previousCamera) {
                scene.activeCamera = previousCamera;
            }
            camera.getProjectionMatrix(true); // Forza a la caché para refrescar;
        };

        _loadInfoCanvasWaterfall = function () {

            var numS = parseInt(_vbles.numSpec);
            numS = numS - 1;
            var contGralInfo = $("#" + scope.gralInfoDivName);
            var units = _vbles.unitsAmp;
            var armonicsInfo;

            _dataInfoWaterfall3d.width = contGralInfo.width();
            _dataInfoWaterfall3d.height = contGralInfo.height();
            _dataInfoWaterfall3d.font = "20px  Segoe UI";
            _dataInfoWaterfall3d.infoText = [];
            _dataInfoWaterfall3d.armonicsInfo = [];

            _dataInfoWaterfall3d.infoText.push(_vbles.pointName);
            _dataInfoWaterfall3d.infoText.push(_vbles.timeRange);

            if (_vbles.numSpec !== undefined) {
                _dataInfoWaterfall3d.infoText.push("Espectro número: " + numS);
                _dataInfoWaterfall3d.infoText.push("Velocidad: " + _vbles.RPM[numS].toFixed(3) + " RPM");
                _dataInfoWaterfall3d.infoText.push("Fecha: " + _vbles.timeStamp[numS]);

                for (var i = 0; i < _vbles.qtyArm; i++) {
                    armonicsInfo = _vbles.armonicsInfo[numS];
                    _dataInfoWaterfall3d.armonicsInfo.push({ color: _vbles.armonicColors[i], text: i + 1 + "X: " + armonicsInfo[i] + " " + units });
                }
            } else {
                _dataInfoWaterfall3d.infoText.push("Espectro número: 1");
                _dataInfoWaterfall3d.infoText.push("Velocidad: " + _vbles.RPM[0].toFixed(3) + " RPM");
                _dataInfoWaterfall3d.infoText.push("Fecha: " + _vbles.timeStamp[0]);

                for (var i = 0; i < _vbles.qtyArm; i++) {
                    armonicsInfo = _vbles.armonicsInfo[0];
                    _dataInfoWaterfall3d.armonicsInfo.push({ color: _vbles.armonicColors[i], text: i + 1 + "X: " + armonicsInfo[i].toFixed(3) + " " + units });
                }
            }            
        };

        _drawInfoToCanvas = function () {
            var info = _dataInfoWaterfall3d;
            var colorArm, textArm, height, sizeText = 20;

            height = sizeText * (info.infoText.length + 1) + sizeText + _vbles.qtyArm * 22;
            //_context.fillStyle = "#000000";
            //_context.fillRect(sizeText, sizeText, info.width + sizeText, info.height + sizeText);

            _context.font = info.font;
            _context.fillStyle = "#000000";

            for (var i = 0; i < info.infoText.length; i++) {
                _context.fillText(info.infoText[i], 20, sizeText * (i + 1) + sizeText);
            }

            for (var i = 0; i < _vbles.qtyArm; i++) {
                colorArm = info.armonicsInfo[i].color;
                textArm = info.armonicsInfo[i].text;

                _context.fillStyle = colorArm;
                _context.fillRect(20, (info.infoText.length + 1) * sizeText + (sizeText + 10 ) * i + 10, sizeText + 3, sizeText + 3);

                _context.fillStyle = "#000000";
                _context.fillText(textArm, 20 + sizeText + 5 + 10, ((info.infoText.length + 1) * sizeText) + i * 30 + 28);
            }
        };

        

    };
    return ImgWaterfall3d;
})();