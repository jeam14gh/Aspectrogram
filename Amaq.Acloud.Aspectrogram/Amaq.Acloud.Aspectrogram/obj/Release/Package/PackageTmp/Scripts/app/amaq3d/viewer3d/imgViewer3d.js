/*
 * ImgViewer3d.js
 * Generacion de imagen enriquecida del visor 3D
 */

var ImgViewer3d = {};

ImgViewer3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ImgViewer3d = function (idEntity, wId) {

        var _scene,
            _engine,
            _camera,
            _vbles,
            _width = 1200,
            _height = 800,
            _containerId,
            _container,
            _context,
            _convertWebglHtmlToCanvas,
            _loadInfoCanvasViewer,
            _drawInfoToCanvas,
            _dataInfoViewer3d = {};

        _containerId = viewer3d.containerCanvas[idEntity + wId].id;
        _container = $("#" + _containerId);

        _scene = viewer3d.scene[idEntity + wId];
        _engine = viewer3d.engine[idEntity + wId];
        _camera = viewer3d.scene[idEntity + wId].activeCamera;

        this.gralInfoDivName = "";
        this.flagSaveFile = false;
        this.flagSaveUrlReport = false;


        var scope = this;


        this.saveImage = function () {

            var clearColor = _scene.clearColor;
            _scene.clearColor = BABYLON.Color3.FromHexString("#FFFFFF");
            _loadInfoCanvasViewer();
            var imgURL;
            imgURL = _convertWebglHtmlToCanvas(_engine, _camera, { width: _width, height: _height });
            _scene.clearColor = clearColor;
            //imgURL = _convertWebglHtmlToCanvas(_engine, _camera,  { precision: 1 });
            return imgURL;
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
                    //actualSrcImage = base64Image;

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
                            if (globalsReport.elem3D[j].id == idEntity + wId) {
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

        _loadInfoCanvasViewer = function () {

            
        };

        _drawInfoToCanvas = function () {
            
            //console.log(scope.infoForCanvas.timeStamp);
            //console.log(globals3d.filteredSV[idEntity]);

            var tag,
                value,
                statusColor,
                sensorTypeColor,
                vbleColor,
                units,
                fontSize = 16,
                xIni = 20,
                yIni = 150,
                hSubvar = 14,
                wTag = 125,
                wNum = 12,
                sStatus = 12,
                wVble = 6,
                wValue = 70,
                wunits = 70,
                margin = 2,
                wTSVU = 300;

            var font = "14px  Segoe UI";
            var filtered = globals3d.filteredSV[idEntity + wId];

            _context.font = font;


            for (var i = 0; i < filtered.length; i++) {

                if (i < filtered.length / 2 && filtered.length * (fontSize + margin) > 500) {
                    xIni = 20;
                    yIni = 150;
                } else {
                    xIni = _width - wTSVU;
                    yIni = 150 - filtered.length / 2 * fontSize;
                }

                tag = filtered[i].name;
                statusColor = filtered[i].statusColor;
                if (filtered[i].value) {
                    value = filtered[i].value.toFixed(3);
                }
                else {
                    value = "";
                }
                units = filtered[i].units;

                for (var j = 0; j < sensorTypes.length; j++) {
                    if (filtered[i].sensorType === sensorTypes[j].Code) {
                        sensorTypeColor = sensorTypes[j].Color;
                    }
                }

                //Figura Numero
                _context.beginPath();
                
                _context.moveTo(xIni, yIni + i * fontSize + margin);
                _context.lineTo(xIni + wNum + hSubvar, yIni + i * fontSize + margin);
                _context.lineTo(xIni + wNum, yIni + (i + 1) * fontSize);
                _context.lineTo(xIni, yIni + (i + 1) * fontSize);
                _context.fillStyle = "rgba(104, 106, 108, 0.7)";
                _context.fill();

                //Shape Vble
                _context.beginPath();                
                //_context.fillStyle = vbleColor;
                _context.moveTo(xIni + wNum + 8 + margin, yIni + i * fontSize + margin);
                _context.lineTo(xIni + wNum + 8 + wVble + margin, yIni + i * fontSize + margin);
                _context.lineTo(xIni + wNum + wVble + margin, yIni + (i + 1) * fontSize);
                _context.lineTo(xIni + wNum + margin, yIni + (i + 1) * fontSize);
                _context.fillStyle = sensorTypeColor;
                _context.fill();

                //Cuadro Tag valor y unidades
                _context.beginPath();
                _context.moveTo(xIni + wNum + 8 + wVble + margin * 2, yIni + i * fontSize + margin);
                _context.lineTo(xIni + wNum + wVble + margin * 2, yIni + (i + 1) * fontSize);
                _context.lineTo(xIni + wNum + wVble + wTSVU, yIni + (i + 1) * fontSize);
                _context.lineTo(xIni + wNum + wVble + wTSVU, yIni + i * fontSize + margin);
                _context.fillStyle = "rgba(50, 60, 60, 0.8)";
                _context.fill();

                //Cuadro Estado
                _context.beginPath();
                _context.moveTo(xIni + wNum + wVble + wTag + margin * 2, yIni + i * fontSize + margin);
                _context.lineTo(xIni + wNum + wVble + wTag + margin * 2, yIni + (i + 1) * fontSize);
                _context.lineTo(xIni + wNum + wVble + wTag + sStatus + margin * 2, yIni + (i + 1) * fontSize);
                _context.lineTo(xIni + wNum + wVble + wTag + sStatus + margin * 2, yIni + i * fontSize + margin);
                _context.fillStyle = statusColor;
                _context.fill();

                _context.fillStyle = "#DDDDFF";
                if (i < 9) {
                    _context.fillText(i + 1, xIni + 2 + margin * 2, yIni + fontSize * (i + 1));
                }
                else {
                    _context.fillText(i + 1, xIni + 2, yIni + fontSize * (i + 1));
                }
                
                _context.fillText(tag, xIni + 2 + wNum + hSubvar + wVble + margin * 2, yIni + fontSize * (i + 1));
                _context.fillText(value, xIni + 2 + wNum + hSubvar + wVble + wTag + margin * 2, yIni + fontSize * (i + 1));
                _context.fillText(units, xIni + 2 + wNum + hSubvar + wVble + wTag + wValue + margin * 2, yIni + fontSize * (i + 1));
            }

            _context.fillStyle = "#000000";
            _context.fillText(globals3d.infoViewer.timeStamp, 20, 20);
            _context.fillText(globals3d.infoViewer.asset, 20, 38);

        };



    };
    return ImgViewer3d;
})();