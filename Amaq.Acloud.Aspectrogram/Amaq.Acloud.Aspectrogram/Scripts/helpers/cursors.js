/*
 * @license
 * Copyright 2017 Jorge Calderon (jorgenhoc@gmail.com)
 */

/*global Dygraph:false */

var Cursors = {};

Cursors = (function () {
    "use strict";

    /*
     * Constructor
     * @param {Object} dygraph Referencia al chart
     */
    Cursors = function (dygraph) {
        var
            _canvas,
            _this,
            _normalCursor,
            _pointerArray,
            _harmonicCount,
            _sideBandCount,
            _dygraph,
            _gArray,
            _canvasArray,
            _getHarmonics,
            _dragPointer,
            _handleHarmonic,
            _drawHarmonicMarker,
            _handleSideband,
            _drawSidebandWidth,
            _drawSidebandMarker,
            _attachPointersToChart,
            _isDragging;

        _this = this;
        _isDragging = false;
        _canvas = document.createElement("canvas");
        _dygraph = dygraph;
        _pointerArray = [];
        _gArray = [];
        _canvasArray = [];
        if (dygraph !== null) {
            dygraph.graphDiv.appendChild(_canvas);
        }

        /*
         * Agregar diferentes canvas para un grafico con mas de un chart
         * @param {Object} g Referencia al chart
         */
        this.attachCanvas = function (g) {
            _gArray.push(g);
            _canvasArray.push(document.createElement("canvas"));
            g.graphDiv.appendChild(_canvasArray[_canvasArray.length - 1]);
        };

        /*
         * Cursor normal
         * @param {Double} xIni Posicion inicial del cursor
         */
        this.normalCursor = function (xIni) {
            var
                containerDiv,
                lineDiv,
                infoDiv,
                minX,
                maxX,
                yValArr;

            _this.detachLabels();
            _this.clearCursor();
            containerDiv = $("<div/>").css({
                "width": "6px",
                "margin-left": "-3px",
                "position": "absolute",
                "z-index": "10"
            }).addClass("dygraph-cursor-move");

            lineDiv = $("<div/>").css({
                "width": "1px",
                "position": "relative",
                "left": "3px",
                "background": "black",
                "height": "100%"
            });
            lineDiv.appendTo(containerDiv);

            infoDiv = $("<div/>").css({
                "position": "absolute",
                "display": "block"
            }).addClass("dygraph-cursor-info");

            $([infoDiv.get(0), containerDiv.get(0)]).draggable({
                axis: "x",
                drag: function (event, ui) {
                    _normalCursor.xval = _dygraph.findClosestRow(ui.position.left);
                    _normalCursor.domX = _dygraph.toDomXCoord(_normalCursor.xval);
                    _this.updateNormalCursor();
                }
            });

            xIni = Math.floor(xIni);
            minX = _dygraph.boundaryIds_[0][0] + 1;
            maxX = _dygraph.boundaryIds_[0][1] - 1;
            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (xIni > minX && xIni < maxX) {
                if (_dygraph.file_[xIni - 1][1] > _dygraph.file_[xIni][1]) {
                    xIni -= 1;
                } else if (_dygraph.file_[xIni + 1][1] > _dygraph.file_[xIni][1]) {
                    xIni += 1;
                }
            } else {
                // Buscamos el valor maximo dentro del rango
                yValArr = _dygraph.file_.slice(minX, maxX + 1).map(x => x[1]);
                xIni = _dygraph.file_.slice(minX, maxX + 1)[yValArr.indexOf(Math.max.apply(null, yValArr))][0];
            }
            _normalCursor = {
                lineDiv: containerDiv.get(0),
                infoDiv: infoDiv.get(0),
                xval: xIni,
                domX: _dygraph.toDomXCoord(xIni)
            };

            _this.updateNormalCursor();
            $([_normalCursor.lineDiv, _normalCursor.infoDiv]).appendTo(_dygraph.graphDiv);
        };

        /*
         * Cursor de armonicos
         * @param {Double} firstOrderFreq Posicion inicial
         * @param {Integer} count Cantidad de armonicos inicial
         */
        this.harmonicCursor = function (firstOrderFreq, count) {
            var
                width,
                height,
                ctx,
                xIni,
                minX, maxX,
                canvasx,
                canvasy,
                cursorPointerDiv,
                high, current,
                yValArr,
                i;

            width = _dygraph.plotter_.area.w;
            height = _dygraph.plotter_.area.h;
            _canvas.width = width;
            _canvas.height = height;
            _canvas.style.position = "absolute";
            _canvas.style.left = _dygraph.plotter_.area.x + "px";

            _this.detachLabels();
            minX = _dygraph.boundaryIds_[0][0] + 1;
            maxX = _dygraph.boundaryIds_[0][1] - 1;
            firstOrderFreq = Math.floor(firstOrderFreq);
            xIni = clone(firstOrderFreq);

            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (xIni > minX && xIni < maxX) {
                if (_dygraph.file_[xIni - 1][1] > _dygraph.file_[xIni][1]) {
                    xIni -= 1;
                } else if (_dygraph.file_[xIni + 1][1] > _dygraph.file_[xIni][1]) {
                    xIni += 1;
                }
            } else {
                // Buscamos el valor maximo dentro del rango
                yValArr = _dygraph.file_.slice(minX, maxX + 1).map(x => x[1]);
                xIni = _dygraph.file_.slice(minX, maxX + 1)[yValArr.indexOf(Math.max.apply(null, yValArr))][0];
            }

            high = (firstOrderFreq < 10) ? Math.floor(firstOrderFreq / 2) + 1 : 5;
            cursorPointerDiv = $("<div/>").css({
                "width": "6px",
                "height": "2px",
                "position": "absolute",
                "z-index": "10",
                "top": "-5px"
            }).addClass("dygraph-cursor-move");
            $("<i class=\"fa fa-caret-down\" aria-hidden=\"true\" style=\"font-size:medium;color:red;\"></i>").appendTo(cursorPointerDiv);
            current = {
                lineDiv: cursorPointerDiv.get(0),
                xval: xIni,
                domX: _dygraph.toDomXCoord(xIni),
                high: high
            };

            if (current.xval < minX || current.xval > maxX) {
                current.xval = minX;
                current.domX = _dygraph.toDomXCoord(current.xval);
            }

            $([cursorPointerDiv.get(0)]).draggable({
                axis: "x",
                drag: function (event, ui) {
                    _dragPointer(event, ui, true);
                },
                start: function (e, ui) {
                    _isDragging = true;
                },
                stop: function (e, ui) {
                    _isDragging = false;
                    _this.updateHarmonicPositions();
                }
            });
            _pointerArray.push(current);
            _harmonicCount = count;

            $(current.lineDiv).css({
                "left": (current.domX - 4) + "px",
                "height": "2px"
            });
            _attachPointersToChart();
            _drawHarmonicMarker(current.xval);
        };

        /*
         * Cursor de bandeamiento
         * @param {Array} xIni Posicion inicial
         * @param {Integer} count Cantidad de armonicos inicial
         */
        this.sidebandCursor = function (xIni, count) {
            var
                i,
                minX,
                maxX,
                diff,
                step,
                width,
                height,
                color,
                current,
                yValArr,
                cursorPointerDiv;

            width = _dygraph.plotter_.area.w;
            height = _dygraph.plotter_.area.h;
            _canvas.width = width;
            _canvas.height = height;
            _canvas.style.position = "absolute";
            _canvas.style.left = _dygraph.plotter_.area.x + "px";

            _this.detachLabels();
            minX = _dygraph.boundaryIds_[0][0] + 1;
            maxX = _dygraph.boundaryIds_[0][1] - 1;
            xIni = Math.floor(xIni);

            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (xIni > minX && xIni < maxX) {
                if (_dygraph.file_[xIni - 1][1] > _dygraph.file_[xIni][1]) {
                    xIni -= 1;
                } else if (_dygraph.file_[xIni + 1][1] > _dygraph.file_[xIni][1]) {
                    xIni += 1;
                }
            } else {
                // Buscamos el valor maximo dentro del rango
                yValArr = _dygraph.file_.slice(minX, maxX + 1).map(x => x[1]);
                xIni = _dygraph.file_.slice(minX, maxX + 1)[yValArr.indexOf(Math.max.apply(null, yValArr))][0];
            }

            step = Math.floor((maxX - xIni) / count);

            for (i = 0; i < 2; i += 1) {
                cursorPointerDiv = $("<div/>").css({
                    "width": "6px",
                    "height": "2px",
                    "position": "absolute",
                    "z-index": "10",
                    "top": "-5px"
                }).addClass("dygraph-cursor-move");
                cursorPointerDiv[0].setAttribute("pointerPosition", i);
                color = (i === 0) ? "red" : "black";
                $("<i class=\"fa fa-caret-down\" aria-hidden=\"true\" style=\"font-size:medium;color:" + color + ";\"></i>").appendTo(cursorPointerDiv);

                current = {
                    count: count,
                    step: step,
                    lineDiv: cursorPointerDiv.get(0),
                    xval: xIni + step * i,
                    domX: _dygraph.toDomXCoord(xIni + step * i)
                };

                if (current.xval < minX || current.xval > maxX) {
                    current.xval = (i === 0) ? minX : maxX;
                    current.domX = _dygraph.toDomXCoord(current.xval);
                }

                $([cursorPointerDiv.get(0)]).draggable({
                    axis: "x",
                    drag: function (event, ui) {
                        _dragPointer(event, ui);
                    },
                    start: function (e, ui) {
                        _isDragging = true;
                    },
                    stop: function (e, ui) {
                        _isDragging = false;
                        _this.updateSidebandPositions();
                    }
                });
                $([cursorPointerDiv.get(0)]).find("span").hide();
                _pointerArray.push(current);
                $(current.lineDiv).css({
                    "left": (current.domX - 4) + "px",
                    "height": "2px"
                });
            }

            _sideBandCount = count;
            _drawSidebandWidth();
            _drawSidebandMarker(xIni);
            _attachPointersToChart();
        };

        /*
         * Cursor de seguimiento
         * @param {Object} pts Punto en el cual se debe graficar el cursor de seguimiento
         */
        this.followCursor = function (pts) {
            var
                width,
                height,
                ctx,
                points,
                canvasx, canvasy,
                i, j;

            if (_gArray.length > 0) {
                for (i = 0; i < _gArray.length; i += 1) {
                    if (_gArray[i].selPoints_ !== pts) {
                        _gArray[i].setSelection(pts[0].idx);
                    }
                    points = _gArray[i].selPoints_;
                    width = _gArray[i].plotter_.area.w;
                    height = _gArray[i].plotter_.area.h;
                    _canvasArray[i].width = width;
                    _canvasArray[i].height = height;
                    _canvasArray[i].style.position = "absolute";
                    _canvasArray[i].style.left = _gArray[i].plotter_.area.x + "px";

                    ctx = _canvasArray[i].getContext("2d");
                    ctx.clearRect(0, 0, width, height);
                    ctx.strokeStyle = "#610B21";
                    ctx.beginPath();

                    canvasx = Math.floor(points[0].canvasx) + 0.5 - _gArray[i].plotter_.area.x;
                    ctx.moveTo(canvasx, 0);
                    ctx.lineTo(canvasx, height);
                    for (j = 0; j < points.length; j += 1) {
                        if (!isNaN(points[j].canvasy)) {
                            canvasy = Math.floor(points[j].canvasy) + 0.5;
                            ctx.moveTo(canvasx, canvasy);
                            ctx.arc(canvasx, canvasy, 2, 0, 2 * Math.PI, false);
                        }
                    }

                    ctx.stroke();
                    ctx.closePath();
                }
            } else {
                width = _dygraph.plotter_.area.w;
                height = _dygraph.plotter_.area.h;
                _canvas.width = width;
                _canvas.height = height;
                _canvas.style.position = "absolute";
                _canvas.style.left = _dygraph.plotter_.area.x + "px";

                ctx = _canvas.getContext("2d");
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = "#610B21";
                ctx.beginPath();

                canvasx = Math.floor(pts[0].canvasx) + 0.5 - _dygraph.plotter_.area.x;
                ctx.moveTo(canvasx, 0);
                ctx.lineTo(canvasx, height);
                for (i = 0; i < pts.length; i += 1) {
                    canvasy = Math.floor(pts[i].canvasy) + 0.5;
                    ctx.moveTo(canvasx, canvasy);
                    ctx.arc(canvasx, canvasy, 2, 0, 2 * Math.PI, false);
                }

                ctx.stroke();
                ctx.closePath();
            }
        };

        this.updateNormalCursor = function () {
            var
                layout,
                html, i,
                labels,
                chartLeft,
                chartRight;

            layout = _dygraph.getArea();
            chartLeft = layout.x;
            chartRight = layout.x + layout.w;

            _normalCursor.domX = _dygraph.toDomXCoord(_normalCursor.xval);
            $(_normalCursor.lineDiv).css({
                "left": _normalCursor.domX + "px",
                "top": layout.y + "px",
                "height": layout.h + "px"
            });
            $(_normalCursor.infoDiv).css({
                "left": _normalCursor.domX + "px",
                "top": layout.y + "px",
            });
            html = _normalCursor.xval.toFixed(2) + ": ";
            labels = _dygraph.getLabels();
            for (i = 1; i < labels.length; i += 1) {
                html += "<span style=\"color:" + _dygraph.plotter_.colors[labels[i]] + ";\">" + _dygraph.file_[_normalCursor.xval][1].toFixed(2) + "</span>, ";
            }
            html = html.replace(/,\s*$/, "");
            $(_normalCursor.infoDiv).html(html);

            if (_normalCursor.domX >= chartLeft && _normalCursor.domX <= chartRight) {
                $([_normalCursor.infoDiv, _normalCursor.lineDiv]).show();
            } else {
                $([_normalCursor.infoDiv, _normalCursor.lineDiv]).hide();
            }
        };

        this.updateHarmonicPositions = function () {
            var
                minX,
                maxX,
                step;

            minX = _dygraph.boundaryIds_[0][0] + 1;
            maxX = _dygraph.boundaryIds_[0][1] - 1;

            // Verificar que el valor este dentro de los limites de la grafica
            if (!(_pointerArray[0].xval > minX && _pointerArray[0].xval < maxX)) {
                $([_pointerArray[0].lineDiv]).hide();
                //_pointerArray[0].xval = minX;
            } else {
                $([_pointerArray[0].lineDiv]).show();
                _pointerArray[0].domX = _dygraph.toDomXCoord(_pointerArray[0].xval);
                $(_pointerArray[0].lineDiv).css({
                    "left": _pointerArray[0].domX + "px",
                    "height": "2px"
                });
            }

            $(_pointerArray[0].lineDiv).css({
                "left": (_pointerArray[0].domX - 4) + "px",
                "height": "2px"
            });
            _drawHarmonicMarker(_pointerArray[0].xval);
        };

        this.updateSidebandPositions = function () {
            var
                minX,
                maxX;

            minX = _dygraph.boundaryIds_[0][0] + 1;
            maxX = _dygraph.boundaryIds_[0][1] - 1;

            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (!(_pointerArray[0].xval > minX && _pointerArray[0].xval < maxX) && (_pointerArray[0].xval !== 1 && _pointerArray[0].xval !== _dygraph.file_.length - 2)) {
                //_pointerArray[0].xval = minX;
                $([_pointerArray[0].lineDiv]).hide();
            } else {
                $([_pointerArray[0].lineDiv]).show();
                _pointerArray[0].domX = _dygraph.toDomXCoord(_pointerArray[0].xval);
                $(_pointerArray[0].lineDiv).css({
                    "left": (_pointerArray[0].domX - 4) + "px",
                    "height": "2px"
                });
            }

            if (!(_pointerArray[1].xval > minX && _pointerArray[1].xval < maxX) && (_pointerArray[1].xval !== 1 && _pointerArray[1].xval !== _dygraph.file_.length - 2)) {
                //_pointerArray[1].xval = maxX;
                $([_pointerArray[1].lineDiv]).hide();
            } else {
                $([_pointerArray[1].lineDiv]).show();
                _pointerArray[1].xval = (_pointerArray[0].xval > _pointerArray[1].xval) ? -_pointerArray[0].step : _pointerArray[0].step;
                _pointerArray[1].xval += _pointerArray[0].xval;
                _pointerArray[1].domX = _dygraph.toDomXCoord(_pointerArray[1].xval);
                $(_pointerArray[1].lineDiv).css({
                    "left": (_pointerArray[1].domX - 4) + "px",
                    "height": "2px"
                });
            }

            _drawSidebandWidth();
            _drawSidebandMarker(_pointerArray[0].xval);
        };

        this.setHarmonicConfig = function (count, initial) {
            _harmonicCount = count;
            _pointerArray[0].xval = Math.floor(initial);
        };

        this.getHarmonicConfig = function () {
            return {
                count: _harmonicCount,
                initial: _pointerArray[0].xval
            };
        };

        this.setSidebandConfig = function (count, initial, width) {
            _sideBandCount = count;
            _pointerArray[0].xval = Math.floor(initial);
            _pointerArray[0].step = Math.floor(width);
            _pointerArray[1].step = Math.floor(width);
        };

        this.getSidebandConfig = function () {
            return {
                count: _sideBandCount,
                initial: _pointerArray[0].xval,
                width: _pointerArray[0].step
            };
        };

        this.clearCursor = function () {
            var
                ctx;

            ctx = _canvas.getContext("2d");
            ctx.clearRect(0, 0, _dygraph.plotter_.area.w, _dygraph.plotter_.area.h);
        };

        this.detachLabels = function () {
            var
                i,
                pt;

            if (typeof _normalCursor !== "undefined") {
                $(_normalCursor.lineDiv).remove();
                $(_normalCursor.infoDiv).remove();
            }

            for (i = 0; i < _pointerArray.length; i += 1) {
                pt = _pointerArray[i];
                $(pt.lineDiv).remove();
                _pointerArray[i] = null;
            }
            _pointerArray = [];
            _normalCursor = undefined;
        };

        this.resizeCanvas = function () {
            var
                width,
                height;

            _this.clearCursor();
            width = _dygraph.plotter_.area.w;
            height = _dygraph.plotter_.area.h;
            _canvas.width = width;
            _canvas.height = height;
            _canvas.style.position = "absolute";
            _canvas.style.left = _dygraph.plotter_.area.x + "px";
        };

        _getHarmonics = function (low, high) {
            var
                low,
                tmp,
                i, j,
                harmonicArray;

            harmonicArray = [];
            for (i = -2; i < high - 2; i += 1) {
                for (j = 1; j <= _harmonicCount; j += 1) {
                    if (_dygraph.file_[low * (j + 1) + i]) {
                        tmp = parseFloat(_dygraph.file_[low * (j + 1) + i][1].toFixed(2));
                        if (!harmonicArray[j] || tmp > harmonicArray[j][1]) {
                            harmonicArray[j] = [Math.floor(low * (j + 1) + i), tmp];
                            //harmonicArray[j] = Math.floor(low * (j + 1) + i);
                        }
                    }
                }
            }
            harmonicArray[0] = [low, _dygraph.file_[low][1]];
            //harmonicArray[0] = low;
            return harmonicArray;
        };

        _dragPointer = function (e, ui, isHarmonic) {
            if (isHarmonic) {
                _handleHarmonic(e, ui);
            } else {
                _handleSideband(e, ui);
            }
        };

        _handleHarmonic = function (e, ui) {
            var
                left,
                right;

            _this.clearCursor();
            _pointerArray[0].xval = _dygraph.findClosestRow(ui.position.left);
            if (_dygraph.file_[_pointerArray[0].xval - 1] && (_dygraph.file_[_pointerArray[0].xval - 1][1] > _dygraph.file_[_pointerArray[0].xval][1])) {
                _pointerArray[0].xval -= 1;
            } else if (_dygraph.file_[_pointerArray[0].xval + 1] && (_dygraph.file_[_pointerArray[0].xval + 1][1] > _dygraph.file_[_pointerArray[0].xval][1])) {
                _pointerArray[0].xval += 1;
            }
            _pointerArray[0].domX = _dygraph.toDomXCoord(_pointerArray[0].xval);
            left = _dygraph.boundaryIds_[0][0] + 1;
            right = _dygraph.boundaryIds_[0][1] - 1;
            if (_pointerArray[0].xval < left) {
                _pointerArray[0].xval = left;
                $(_pointerArray[0].lineDiv).css({
                    "left": _dygraph.toDomXCoord(left) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            }

            if (_pointerArray[0].xval > right) {
                _pointerArray[0].xval = right;
                $(_pointerArray[0].lineDiv).css({
                    "left": _dygraph.toDomXCoord(right) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            }

            $(_pointerArray[0].lineDiv).css({
                "left": (_pointerArray[0].domX - 4) + "px",
                "height": "2px"
            });
            ui.position.left = _pointerArray[0].domX - 4;
            _drawHarmonicMarker(_pointerArray[0].xval);
        };

        _drawHarmonicMarker = function (xIni) {
            var
                ctx,
                i, j,
                leftPt,
                centerPt,
                harmonicPositions;

            _this.clearCursor();
            ctx = _canvas.getContext("2d");
            j = _dygraph.layout_.points[0][0].idx;
            harmonicPositions = _getHarmonics(xIni, _pointerArray[0].high);
            centerPt = _dygraph.layout_.points[0][xIni - j];
            if (typeof centerPt !== "undefined") {
                ctx.beginPath();
                ctx.fillStyle = "#FF0000";
                ctx.arc(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y, 3, 0, 2 * Math.PI, true);
                ctx.fill();
                ctx.closePath();
                if (_isDragging) {
                    ctx.beginPath();
                    ctx.strokeStyle = "#FF0000";
                    ctx.setLineDash([8, 10]);
                    ctx.moveTo(centerPt.canvasx - _dygraph.plotter_.area.x, _dygraph.plotter_.area.y);
                    ctx.lineTo(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
            for (i = 1; i < harmonicPositions.length; i += 1) {
                leftPt = _dygraph.layout_.points[0][harmonicPositions[i][0] - j];
                if (typeof leftPt !== "undefined") {
                    ctx.beginPath();
                    ctx.fillStyle = "#000000";
                    ctx.arc(leftPt.canvasx - _dygraph.plotter_.area.x, leftPt.canvasy - _dygraph.plotter_.area.y, 2, 0, 2 * Math.PI, true);
                    ctx.fill();
                    ctx.closePath();
                    ctx.beginPath();
                    ctx.font = "12px FontAwesome";
                    ctx.fillText((i + 1) + "x", leftPt.canvasx - _dygraph.plotter_.area.x - 6, leftPt.canvasy - _dygraph.plotter_.area.y - 5);
                    ctx.closePath();
                }
            }
        };

        _handleSideband = function (e, ui) {
            var
                i,
                step,
                oldXVal,
                left,
                right;

            i = parseInt($(ui.helper)[0].getAttribute("pointerPosition"));
            oldXVal = clone(_pointerArray[i].xval);
            _pointerArray[i].xval = _dygraph.findClosestRow(ui.position.left);
            if (ui.position.left < _dygraph.plotter_.area.x) {
                _pointerArray[i].xval = _dygraph.findClosestRow(ui.position.left + 4);
            }
            _pointerArray[i].domX = _dygraph.toDomXCoord(_pointerArray[i].xval);

            if (i === 0) {
                // Puntero principal
                step = _pointerArray[1].xval - _pointerArray[0].xval;
                step = (step < 0) ? -_pointerArray[i].step : _pointerArray[i].step;
                _pointerArray[1].xval = _dygraph.findClosestRow(_dygraph.toDomXCoord(_pointerArray[i].xval + step));
                _pointerArray[1].domX = _dygraph.toDomXCoord(_pointerArray[1].xval);
                $(_pointerArray[1].lineDiv).css({
                    "left": _pointerArray[1].domX + "px",
                    "height": "2px"
                });
            } else {
                // Puntero secundario
                if (_dygraph.file_[_pointerArray[i].xval - 1] && (_dygraph.file_[_pointerArray[i].xval - 1][1] > _dygraph.file_[_pointerArray[i].xval][1])) {
                    _pointerArray[i].xval -= 1;
                } else if (_dygraph.file_[_pointerArray[i].xval + 1] && (_dygraph.file_[_pointerArray[i].xval + 1][1] > _dygraph.file_[_pointerArray[i].xval][1])) {
                    _pointerArray[i].xval += 1;
                }
                _pointerArray[i].domX = _dygraph.toDomXCoord(_pointerArray[i].xval);
                $(_pointerArray[1].lineDiv).css({
                    "left": _pointerArray[i].domX + "px",
                    "height": "2px"
                });
                step = _pointerArray[i].xval - _pointerArray[0].xval;
                if (step < 0) {
                    step = _pointerArray[0].xval - _pointerArray[i].xval;
                }
                _pointerArray[0].step = step;
                _pointerArray[1].step = step;
            }

            left = _dygraph.boundaryIds_[0][0] + 1;
            right = _dygraph.boundaryIds_[0][1] - 1;
            if (_pointerArray[0].xval >= left && _pointerArray[0].xval <= right) {
                $([_pointerArray[0].lineDiv]).show();
            } else if (_pointerArray[0].xval < left) {
                _pointerArray[0].xval = left;
                $(_pointerArray[0].lineDiv).css({
                    "left": _dygraph.toDomXCoord(left) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            } else if (_pointerArray[0].xval > right) {
                _pointerArray[0].xval = right;
                $(_pointerArray[0].lineDiv).css({
                    "left": _dygraph.toDomXCoord(right) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            }

            if (_pointerArray[1].xval <= right && _pointerArray[1].xval >= left) {
                $([_pointerArray[1].lineDiv]).show();
            } else if (_pointerArray[1].xval > right) {
                _pointerArray[1].xval = right;
                $(_pointerArray[1].lineDiv).css({
                    "left": _dygraph.toDomXCoord(right) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            } else if (_pointerArray[1].xval < left) {
                _pointerArray[1].xval = left;
                $(_pointerArray[1].lineDiv).css({
                    "left": _dygraph.toDomXCoord(left) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            }

            $(_pointerArray[0].lineDiv).css({
                "left": (_pointerArray[0].domX - 4) + "px",
                "height": "2px"
            });
            $(_pointerArray[1].lineDiv).css({
                "left": (_pointerArray[1].domX - 4) + "px",
                "height": "2px"
            });
            ui.position.left = _pointerArray[i].domX - 4;
            _drawSidebandWidth();
            _drawSidebandMarker(_pointerArray[0].xval, i);
        };

        _drawSidebandWidth = function () {
            var
                diff,
                ctx;

            _this.clearCursor();
            diff = _pointerArray[1].xval - _pointerArray[0].xval;
            diff = (diff < 0) ? (-diff).toFixed(0) : (diff).toFixed(0);
            //$([_pointerArray[0].lineDiv]).find("span").html(_pointerArray[0].xval + " Hz");
            //$([_pointerArray[1].lineDiv]).find("span").html(_pointerArray[1].xval + " Hz");
            ctx = _canvas.getContext("2d");
            ctx.beginPath();
            ctx.font = "10px Georgia";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(diff + " Hz", (_pointerArray[1].domX + _pointerArray[0].domX) / 2 - _dygraph.plotter_.area.x, 12);
            ctx.fillStyle = "#000000";
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.closePath();
        };

        _drawSidebandMarker = function (xIni, current) {
            var
                ctx,
                i, j,
                leftPt,
                centerPt,
                rightPt,
                secondPt,
                step;

            ctx = _canvas.getContext("2d");
            j = _dygraph.layout_.points[0][0].idx;
            centerPt = _dygraph.layout_.points[0][xIni - j];
            step = _pointerArray[0].step;
            if (typeof centerPt !== "undefined") {
                ctx.beginPath();
                ctx.fillStyle = "#FF0000";
                ctx.arc(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y, 3, 0, 2 * Math.PI, true);
                ctx.fill();
                ctx.closePath();
                if (_isDragging && current === 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = "#FF0000";
                    ctx.setLineDash([8, 10]);
                    ctx.moveTo(centerPt.canvasx - _dygraph.plotter_.area.x, _dygraph.plotter_.area.y);
                    ctx.lineTo(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y);
                    ctx.stroke();
                    ctx.closePath();
                } else if (_isDragging && current === 1) {
                    centerPt = _dygraph.layout_.points[0][_pointerArray[1].xval - j];
                    ctx.beginPath();
                    ctx.strokeStyle = "#000000";
                    ctx.setLineDash([8, 10]);
                    ctx.moveTo(centerPt.canvasx - _dygraph.plotter_.area.x, _dygraph.plotter_.area.y);
                    ctx.lineTo(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
            for (i = 1; i <= _sideBandCount; i += 1) {
                leftPt = _dygraph.layout_.points[0][xIni + step * i - j];
                rightPt = _dygraph.layout_.points[0][xIni - step * i - j];
                if (typeof leftPt !== "undefined") {
                    ctx.beginPath();
                    ctx.fillStyle = "#000000";
                    ctx.arc(leftPt.canvasx - _dygraph.plotter_.area.x, leftPt.canvasy - _dygraph.plotter_.area.y, 2, 0, 2 * Math.PI, true);
                    ctx.fill();
                    ctx.closePath();
                }
                if (typeof rightPt !== "undefined") {
                    ctx.beginPath();
                    ctx.fillStyle = "#000000";
                    ctx.arc(rightPt.canvasx - _dygraph.plotter_.area.x, rightPt.canvasy - _dygraph.plotter_.area.y, 2, 0, 2 * Math.PI, true);
                    ctx.fill();
                    ctx.closePath();
                }
            }
        };

        _attachPointersToChart = function () {
            var
                i;

            for (i = 0; i < _pointerArray.length; i += 1) {
                $(_pointerArray[i].lineDiv).appendTo(_dygraph.graphDiv);
            }
        };
    };

    return Cursors;
})();


//_findPosX = function (obj) {
//    var curleft = 0;
//    if (obj.offsetParent)
//        while (1) {
//            curleft += obj.offsetLeft;
//            if (!obj.offsetParent)
//                break;
//            obj = obj.offsetParent;
//        }
//    else if (obj.x)
//        curleft += obj.x;
//    return curleft;
//};

//_findPosY = function (obj) {
//    var curtop = 0;
//    if (obj.offsetParent)
//        while (1) {
//            curtop += obj.offsetTop;
//            if (!obj.offsetParent)
//                break;
//            obj = obj.offsetParent;
//        }
//    else if (obj.y)
//        curtop += obj.y;
//    return curtop;
//};

//_hairlineWasDragged = function (h, event, ui) {
//    var
//        area,
//        oldXVal;

//    area = _dygraph.getArea();
//    oldXVal = h.xval;
//    h.xval = _dygraph.toDataXCoord(ui.position.left);
//    //this.moveHairlineToTop(h);
//    _this.updateHairlineDivPositions();
//    _this.updateHairlineInfo();
//    //this.updateHairlineStyles();
//    //$(this).triggerHandler("hairlineMoved", {
//    //    oldXVal: oldXVal,
//    //    newXVal: h.xval
//    //});
//    //$(this).triggerHandler("hairlinesChanged", {});
//};

//_principalHairlineWasDragged = function (h, e, ui) {
//    var
//        area, i, j,
//        $lineContainerDiv,
//        $lineDiv,
//        chartLeft, chartRight,
//        secondaryCursors,
//        sidebandNumber,
//        highXVal,
//        step,
//        oldXVal;

//    area = _dygraph.getArea();
//    j = parseInt($(ui.helper)[0].getAttribute("hairlinePosition"));
//    oldXVal = clone(_hairlines[j].xval);
//    _hairlines[j].xval = _dygraph.toDataXCoord(ui.position.left);
//    _hairlines[j].domX = _dygraph.toDomXCoord(_hairlines[j].xval);
//    secondaryCursors = _hairlines.length - 1;
//    highXVal = Math.round(_dygraph.toDataXCoord(area.w + area.x - 1));
//    sidebandNumber = 0;

//    if (secondaryCursors > 0) {
//        step = _hairlines[1].xval - oldXVal;
//        sidebandNumber = Math.floor((highXVal - _hairlines[j].xval) / step);
//    } else if (secondaryCursors === 0) {
//        step = _hairlines[0].step;
//        sidebandNumber = Math.floor((highXVal - _hairlines[j].xval) / step);
//        _hairlines[0].domX = clone(_hairlines[j].domX);
//    }

//    sidebandNumber = (sidebandNumber <= 0) ? 1 : sidebandNumber;

//    // Eliminar o agregar segun el caso cursores de bandeamiento
//    if (sidebandNumber > secondaryCursors) {
//        // agregar
//        for (i = secondaryCursors; i < sidebandNumber; i += 1) {
//            $lineContainerDiv = $("<div/>").css({
//                "width": "6px",
//                "margin-left": "-3px",
//                "position": "absolute",
//                "z-index": "-1"
//            });
//            $lineContainerDiv[0].setAttribute("hairlinePosition", i + 1);

//            $lineDiv = $("<div/>").css({
//                "width": "1px",
//                "position": "relative",
//                "left": "3px",
//                "background": "black",
//                "height": "100%"
//            });
//            $lineDiv.appendTo($lineContainerDiv);

//            j = $.extend({
//                selected: false,
//                lineDiv: $lineContainerDiv.get(0)
//            }, {
//                xval: _hairlines[0].xval + (step * (i + 1))
//            });
//            j.domX = _dygraph.toDomXCoord(j.xval);
//            _hairlines.push(j);
//            $([j.lineDiv]).appendTo(_dygraph.graphDiv);
//        }
//    } else if (sidebandNumber < secondaryCursors) {
//        // eliminar
//        for (i = sidebandNumber + 1; i < _hairlines.length; i += 1) {
//            $(_hairlines[i].lineDiv).remove();
//        }
//        _hairlines = _hairlines.slice(0, sidebandNumber + 1);
//    }

//    // posicionar bandas
//    if (_hairlines.length > 1) {
//        step = _hairlines[1].xval - oldXVal;
//        _hairlines[0].step = step;
//        for (i = 1; i < _hairlines.length; i += 1) {
//            _hairlines[i].xval = _hairlines[0].xval + (step * i);
//            _hairlines[i].domX = _dygraph.toDomXCoord(_hairlines[i].xval);
//            $(_hairlines[i].lineDiv).css({
//                "left": _hairlines[i].domX + "px",
//                //"top": area.y + "px",
//                "height": area.h + "px"
//            });
//        }
//    }

//    chartLeft = area.x;
//    chartRight = area.x + area.w;
//    if (_hairlines[0].domX >= chartLeft) {
//        $([_hairlines[0].lineDiv]).show();
//    } else if (_hairlines[0].domX < chartLeft) {
//        $(_hairlines[0].lineDiv).css({
//            "left": chartLeft + "px",
//            //"top": area.y + "px",
//            "height": area.h + "px"
//        });
//        e.preventDefault();
//        return false;
//    }

//    if (_hairlines[1].domX <= chartRight) {
//        $([_hairlines[1].lineDiv]).show();
//    } else if (_hairlines[1].domX > chartRight) {
//        $(_hairlines[1].lineDiv).css({
//            "left": chartRight + "px",
//            //"top": area.y + "px",
//            "height": area.h + "px"
//        });
//        e.preventDefault();
//        return false;
//    }
//};

//_secondaryHairlineWasDragged = function (h, e, ui) {
//    var
//        area, i, j,
//        $lineContainerDiv,
//        $lineDiv, sidebandNumber,
//        chartLeft, chartRight,
//        secondaryCursors,
//        highXVal, oldXVal,
//        step;

//    area = _dygraph.getArea();
//    j = parseInt($(ui.helper)[0].getAttribute("hairlinePosition"));

//    if (j > _hairlines.length - 1) return;

//    oldXVal = clone(_hairlines[j].xval);
//    _hairlines[j].xval = _dygraph.toDataXCoord(ui.position.left);
//    _hairlines[j].domX = _dygraph.toDomXCoord(h.xval);
//    secondaryCursors = _hairlines.length - 1;
//    highXVal = Math.round(_dygraph.toDataXCoord(area.w + area.x - 1));
//    step = _hairlines[j].xval - _hairlines[j - 1].xval;

//    if (step <= 10) {
//        e.preventDefault();
//        return;
//    }

//    sidebandNumber = Math.floor((highXVal - _hairlines[0].xval) / step);
//    sidebandNumber = (sidebandNumber <= 0) ? 1 : sidebandNumber;

//    if (sidebandNumber > secondaryCursors) {
//        // agregar
//        for (i = secondaryCursors; i < sidebandNumber; i += 1) {
//            $lineContainerDiv = $("<div/>").css({
//                "width": "6px",
//                "margin-left": "-3px",
//                "position": "absolute",
//                "z-index": "-1"
//            });
//            $lineContainerDiv[0].setAttribute("hairlinePosition", i + 1);

//            $lineDiv = $("<div/>").css({
//                "width": "1px",
//                "position": "relative",
//                "left": "3px",
//                "background": "black",
//                "height": "100%"
//            });
//            $lineDiv.appendTo($lineContainerDiv);

//            h = $.extend({
//                selected: false,
//                lineDiv: $lineContainerDiv.get(0)
//            }, {
//                xval: _hairlines[0].xval + (step * (i + 1))
//            });
//            h.domX = _dygraph.toDomXCoord(h.xval);
//            _hairlines.push(h);
//            $([h.lineDiv]).appendTo(_dygraph.graphDiv);
//        }
//    } else if (sidebandNumber < secondaryCursors) {
//        // eliminar
//        for (i = sidebandNumber + 1; i < _hairlines.length; i += 1) {
//            $(_hairlines[i].lineDiv).remove();
//        }
//        _hairlines = _hairlines.slice(0, sidebandNumber + 1);
//    }

//    for (i = 1; i < _hairlines.length; i += 1) {
//        _hairlines[i].xval = _hairlines[0].xval + (step * i);
//        _hairlines[i].domX = _dygraph.toDomXCoord(_hairlines[i].xval);
//        $(_hairlines[i].lineDiv).css({
//            "left": _hairlines[i].domX + "px",
//            "top": area.y + "px",
//            "height": area.h + "px"
//        });
//    }

//    chartLeft = area.x;
//    chartRight = area.x + area.w;
//    if (_hairlines[1].domX >= chartLeft && _hairlines[1].domX <= chartRight) {
//        $([_hairlines[1].lineDiv]).show();
//    } else if (_hairlines[1].domX < chartLeft) {
//        $(_hairlines[1].lineDiv).css({
//            "left": chartLeft + "px",
//            "top": area.y + "px",
//            "height": area.h + "px"
//        });
//        e.preventDefault();
//        return false;
//    } else if (_hairlines[1].domX > chartRight) {
//        $(_hairlines[1].lineDiv).css({
//            "left": chartRight + "px",
//            "top": area.y + "px",
//            "height": area.h + "px"
//        });
//        e.preventDefault();
//        return false;
//    }
//};

//_findPrevNextRows = function (g, xval, col) {
//    var
//        prevRow,
//        nextRow,
//        numRows,
//        row,
//        yval,
//        rowXval;

//    numRows = g.numRows();
//    for (row = 0; row < numRows; row += 1) {
//        yval = g.getValue(row, col);
//        if (yval === null || yval === undefined || isNaN(yval)) continue;

//        rowXval = g.getValue(row, 0);
//        if (rowXval <= xval) prevRow = row;

//        if (rowXval >= xval) {
//            nextRow = row;
//            break;
//        }
//    }

//    return [prevRow, nextRow];
//};