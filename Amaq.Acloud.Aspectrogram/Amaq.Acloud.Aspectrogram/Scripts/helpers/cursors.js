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
    Cursors = function (dygraph, xCoordinateUnit, yUnitValue, velocityValue) {
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
            _getRowForX,
            _handleSideband,
            _drawSidebandWidth,
            _drawSidebandMarker,
            _attachPointersToChart,
            _xCoordinateUnit,
            _lastCursorSidebandSelected,
            _lastCursorPosition,
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
        _xCoordinateUnit = xCoordinateUnit;
        _lastCursorSidebandSelected = 0;

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
                minRow,
                maxRow,
                yValArr,
                row;

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
                    _normalCursor.domX = ui.position.left;
                    _normalCursor.row = _dygraph.findClosestRow(ui.position.left);
                    minRow = _dygraph.boundaryIds_[0][0] + 1;
                    maxRow = _dygraph.boundaryIds_[0][1] - 1;
                    if (_normalCursor.row <= minRow || _normalCursor.row >= maxRow) {
                        return false;
                    }
                    _normalCursor.xval = _dygraph.file_[_normalCursor.row][0];
                    _this.updateNormalCursor();
                }
            });
            minRow = _dygraph.boundaryIds_[0][0] + 1;
            maxRow = _dygraph.boundaryIds_[0][1] - 1;
            row = _dygraph.findClosestRow(_dygraph.toDomXCoord(xIni), 0);
            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (row > minRow && row < maxRow) {
                if (_dygraph.file_[row - 1][1] > _dygraph.file_[row][1]) {
                    row -= 1;
                } else if (_dygraph.file_[row + 1][1] > _dygraph.file_[row][1]) {
                    row += 1;
                }
                xIni = _dygraph.file_[row][0];
            } else {
                // Buscamos el valor maximo dentro del rango
                yValArr = _dygraph.file_.slice(minRow, maxRow + 1).map(x => x[1]);
                xIni = _dygraph.file_.slice(minRow, maxRow + 1)[yValArr.indexOf(Math.max.apply(null, yValArr))][0];
            }
            _normalCursor = {
                lineDiv: containerDiv.get(0),
                infoDiv: infoDiv.get(0),
                xval: xIni,
                domX: _dygraph.toDomXCoord(xIni),
                row: row
            };
            _this.updateNormalCursor();
            $([_normalCursor.lineDiv, _normalCursor.infoDiv]).appendTo(_dygraph.graphDiv);
        };

        /*
         * Cursor de armonicos
         * @param {Double} xIni Posicion inicial
         * @param {Integer} count Cantidad de armonicos inicial
         */
        this.harmonicCursor = function (xIni, count) {
            var
                minRow,
                maxRow,
                row,
                yValArr,
                nextRow,
                high,
                cursorPointerDiv,
                current,
                i;

            _canvas.width = _dygraph.plotter_.area.w;
            _canvas.height = _dygraph.plotter_.area.h;
            _canvas.style.position = "absolute";
            _canvas.style.left = _dygraph.plotter_.area.x + "px";
            _this.detachLabels();
            minRow = _dygraph.boundaryIds_[0][0] + 1;
            maxRow = _dygraph.boundaryIds_[0][1] - 1;
            row = _dygraph.findClosestRow(_dygraph.toDomXCoord(xIni), 0);
            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (row > minRow && row < maxRow) {
                if (_dygraph.file_[row - 1][1] > _dygraph.file_[row][1]) {
                    row -= 1;
                } else if (_dygraph.file_[row + 1][1] > _dygraph.file_[row][1]) {
                    row += 1;
                }
                xIni = _dygraph.file_[row][0];
            } else {
                // Buscamos el valor maximo dentro del rango
                yValArr = _dygraph.file_.slice(minRow, maxRow + 1).map(x => x[1]);
                xIni = _dygraph.file_.slice(minRow, maxRow + 1)[yValArr.indexOf(Math.max.apply(null, yValArr))][0];
            }
            nextRow = _dygraph.findClosestRow(_dygraph.toDomXCoord(xIni * 2), 0);
            high = (nextRow - row < 10) ? Math.floor((nextRow - row) / 2) + 1 : 5;
            cursorPointerDiv = $("<div/>").css({
                "width": "6px",
                "height": "2px",
                "position": "absolute",
                "z-index": "1050",
                "top": "-5px"
            }).addClass("dygraph-cursor-move");
            $("<i class=\"fa fa-caret-down\" aria-hidden=\"true\" style=\"font-size:medium;color:red;\"></i>").appendTo(cursorPointerDiv);
            current = {
                lineDiv: cursorPointerDiv.get(0),
                xval: xIni,
                domX: _dygraph.toDomXCoord(xIni),
                high: high,
                row: row
            };
            if (current.row < minRow || current.row > maxRow) {
                current.row = minRow;
                current.xval = _dygraph.file_[minRow][0];
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
            _harmonicCount = count - 1;
            $(current.lineDiv).css({
                "left": (current.domX - 4) + "px",
                "height": "2px"
            });
            _attachPointersToChart();
            _drawHarmonicMarker(current.row);
        };

        /*
         * Cursor de bandeamiento
         * @param {Array} xIni Posicion inicial
         * @param {Integer} count Cantidad de armonicos inicial
         */
        this.sidebandCursor = function (xIni, count) {
            var
                i,
                minRow,
                maxRow,
                row,
                step,
                color,
                current,
                yValArr,
                cursorPointerDiv;

            _canvas.width = _dygraph.plotter_.area.w;
            _canvas.height = _dygraph.plotter_.area.h;
            _canvas.style.position = "absolute";
            _canvas.style.left = _dygraph.plotter_.area.x + "px";
            _this.detachLabels();
            minRow = _dygraph.boundaryIds_[0][0] + 1;
            maxRow = _dygraph.boundaryIds_[0][1] - 1;
            row = _dygraph.findClosestRow(_dygraph.toDomXCoord(xIni), 0);
            // Verificar que el valor inicial este dentro de los limites de la grafica
            if (row > minRow && row < maxRow) {
                if (_dygraph.file_[row - 1][1] > _dygraph.file_[row][1]) {
                    row -= 1;
                } else if (_dygraph.file_[row + 1][1] > _dygraph.file_[row][1]) {
                    row += 1;
                }
                xIni = _dygraph.file_[row][0];
            } else {
                // Buscamos el valor maximo dentro del rango
                yValArr = _dygraph.file_.slice(minRow, maxRow + 1).map(x => x[1]);
                xIni = _dygraph.file_.slice(minRow, maxRow + 1)[yValArr.indexOf(Math.max.apply(null, yValArr))][0];
            }
            step = Math.floor((maxRow - row) / count);
            for (i = 0; i < 2; i += 1) {
                cursorPointerDiv = $("<div/>").css({
                    "width": "6px",
                    "height": "2px",
                    "position": "absolute",
                    "z-index": "1050",
                    "top": "-5px"
                }).addClass("dygraph-cursor-move");
                cursorPointerDiv[0].setAttribute("pointerPosition", i);
                color = (i === 0) ? "red" : "black";
                $("<i class=\"fa fa-caret-down\" aria-hidden=\"true\" style=\"font-size:medium;color:" + color +
                    ";\"></i>").appendTo(cursorPointerDiv);
                current = {
                    count: count,
                    step: step,
                    lineDiv: cursorPointerDiv.get(0),
                    row: row + step * i,
                    xval: _dygraph.file_[row + step * i][0],
                    domX: _dygraph.toDomXCoord(_dygraph.file_[row + step * i][0])
                };
                if (current.row < minRow || current.row > maxRow) {
                    current.row = (i === 0) ? minRow : maxRow;
                    current.xval = _dygraph.file_[current.row][0];
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
                        _this.updateSidebandPositions(_xCoordinateUnit, ui);
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
            _drawSidebandMarker(row, 0);
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

        this.updateNormalCursor = function (xCoordinateUnit, yUnit, velocity) {
            var
                layout,
                html, i,
                labels,
                chartLeft,
                chartRight;

            layout = _dygraph.getArea();
            chartLeft = layout.x;
            chartRight = layout.x + layout.w;
            _xCoordinateUnit = xCoordinateUnit || _xCoordinateUnit;
            yUnitValue = yUnit || yUnitValue;
            velocityValue = velocity || velocityValue;
            _normalCursor.xval = _dygraph.file_[_normalCursor.row][0];
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
            if (_xCoordinateUnit.Value === xCoordinateUnits.Order.Value) {
                html = (velocityValue === 0) ? "--" : (_normalCursor.xval / velocityValue).toFixed(2);
            } else {
                html = _normalCursor.xval.toFixed(2);
            }
            html += " " + _xCoordinateUnit.Text + ": ";
            labels = _dygraph.getLabels();
            for (i = 1; i < labels.length; i += 1) {
                if (_dygraph.file_[_normalCursor.row][i] !== null) {
                    html += "<span style=\"color:" + _dygraph.plotter_.colors[labels[i]] + ";\">";
                    html += _dygraph.file_[_normalCursor.row][i].toFixed(2) + " " + yUnitValue + "</span>, ";
                }
            }
            html = html.replace(/,\s*$/, "");
            $(_normalCursor.infoDiv).html(html);

            if (_normalCursor.domX >= chartLeft && _normalCursor.domX <= chartRight) {
                $([_normalCursor.infoDiv, _normalCursor.lineDiv]).show();
            } else {
                $([_normalCursor.infoDiv, _normalCursor.lineDiv]).hide();
            }
        };

        this.updateHarmonicPositions = function (xCoordinateUnit) {
            var
                minRow,
                maxRow;

            _xCoordinateUnit = xCoordinateUnit || _xCoordinateUnit;
            minRow = _dygraph.boundaryIds_[0][0] + 1;
            maxRow = _dygraph.boundaryIds_[0][1] - 1;
            _pointerArray[0].xval = _dygraph.file_[_pointerArray[0].row][0];
            // Verificar que el valor este dentro de los limites de la grafica
            if (!(_pointerArray[0].row > minRow && _pointerArray[0].row < maxRow)) {
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
            _drawHarmonicMarker(_pointerArray[0].row);
        };

        this.updateSidebandPositions = function (xCoordinateUnit, ui) {
            var
                left,
                right,
                current;

            _xCoordinateUnit = xCoordinateUnit || _xCoordinateUnit;
            // Valores y posicion en el DOM del cursor principal
            _pointerArray[0].xval = _dygraph.file_[_pointerArray[0].row][0];
            _pointerArray[0].domX = _dygraph.toDomXCoord(_pointerArray[0].xval);
            // Limites de la grafica (izquierda y derecha)
            left = _dygraph.plotter_.area.x - 4;
            right = _dygraph.plotter_.area.x + _dygraph.plotter_.area.w + 4;
            // Verificar que el cursor principal este dentro de los limites de la grafica
            if (_pointerArray[0].domX < left && _pointerArray[0].domX > right) {
                // Ocultar cursor principal
                $([_pointerArray[0].lineDiv]).hide();
            } else {
                // Mostrar cursor principal
                $([_pointerArray[0].lineDiv]).show();
                // Posicion del cursor principal
                $(_pointerArray[0].lineDiv).css({
                    "left": (_pointerArray[0].domX - 4) + "px",
                    "height": "2px"
                });
            }
            // Valores y posicion en el DOM del cursor secundario
            _pointerArray[1].xval = _dygraph.file_[_pointerArray[1].row][0];
            _pointerArray[1].domX = _dygraph.toDomXCoord(_pointerArray[1].xval);
            // Verificar que el cursor secundario este dentro de los limites de la grafica
            if (_pointerArray[1].domX < left && _pointerArray[1].domX > right) {
                // Ocultar cursor secundario
                $([_pointerArray[1].lineDiv]).hide();
            } else {
                // Mostrar cursor secundario
                $([_pointerArray[1].lineDiv]).show();
                // Posicion del cursor secundario
                $(_pointerArray[1].lineDiv).css({
                    "left": (_pointerArray[1].domX - 4) + "px",
                    "height": "2px"
                });
            }
            current = 0;
            if (ui) {
                current = parseInt($(ui.helper)[0].getAttribute("pointerPosition"));
            }
            _drawSidebandWidth();
            _drawSidebandMarker(_pointerArray[0].row, current);
        };

        this.setHarmonicConfig = function (count, initial) {
            var
                row;

            _harmonicCount = count - 1;
            row = _dygraph.findClosestRow(_dygraph.toDomXCoord(initial), 0);
            _pointerArray[0].row = row;
            _pointerArray[0].xval = _dygraph.file_[row][0];
        };

        this.getHarmonicConfig = function () {
            return {
                count: _harmonicCount + 1,
                initial: _pointerArray[0].xval,
                row: _pointerArray[0].row
            };
        };

        this.setSidebandConfig = function (count, initial, width) {
            var
                row;

            _sideBandCount = count - 1;
            row = _dygraph.findClosestRow(_dygraph.toDomXCoord(initial), 0);
            _pointerArray[0].row = row;
            _pointerArray[0].xval = _dygraph.file_[row][0];
            _pointerArray[0].step = Number(width);
            _pointerArray[1].step = Number(width);
        };

        this.getSidebandConfig = function () {
            return {
                count: _sideBandCount,
                initial: _pointerArray[0].xval,
                width: _pointerArray[0].step,
                row: _pointerArray[0].row
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

        this.applyKeyEvent = function (cursorType, key, e) {

            var minRow,
                maxRow;

            switch (cursorType) {
                case 1:
                    if (key == 1) {
                        _normalCursor.row -= 1;
                    } else if (key == 2) {
                        _normalCursor.row += 1;
                    }
                    
                    _normalCursor.row = _normalCursor.row;
                    minRow = _dygraph.boundaryIds_[0][0] + 1;
                    maxRow = _dygraph.boundaryIds_[0][1] - 1;
                    if (_normalCursor.row <= minRow || _normalCursor.row >= maxRow) {
                        return false;
                    }
                    _normalCursor.xval = _dygraph.file_[_normalCursor.row][0];
                    _this.updateNormalCursor();
                    break;
                case 2:
                    _isDragging = true;
                    _handleHarmonic(e, null, key);
                    _isDragging = false;
                    break;
                case 3:
                    _isDragging = true;
                    _handleSideband(e, null, key);
                    _isDragging = false;
                    break;
            }
        };

        _getHarmonics = function (low, high) {
            var
                positions,
                i, j, k,
                xIni,
                nextRow,
                tmp;

            positions = [];
            xIni = _dygraph.file_[low][0];
            for (i = 1; i <= _harmonicCount; i += 1) {
                nextRow = _dygraph.findClosestRow(_dygraph.toDomXCoord(xIni * (i + 1)), 0);
                if (_dygraph.file_[nextRow]) {
                    for (j = 0; j < _dygraph.layout_.points.length; j += 1) {
                        tmp = _dygraph.file_[nextRow][j + 1];
                        if (tmp !== null) {
                            positions[i] = [nextRow, tmp];
                        }
                    }
                    for (j = -2; j < high - 2; j += 1) {
                        if (j === 0) {
                            continue;
                        }
                        for (k = 0; k < _dygraph.layout_.points.length; k += 1) {
                            tmp = _dygraph.file_[nextRow + j];
                            if (tmp && tmp[k + 1] !== null) {
                                if (tmp[k + 1] > positions[i][1]) {
                                    positions[i] = [nextRow + j, tmp[k + 1]];
                                }
                            }
                        }
                    }
                }
            }
            for (i = 0; i < _dygraph.layout_.points.length; i += 1) {
                tmp = _dygraph.file_[low][i];
                if (tmp !== null) {
                    positions[0] = [low, tmp];
                    break;
                }
            }
            return positions;
        };

        _dragPointer = function (e, ui, isHarmonic) {
            if (isHarmonic) {
                _handleHarmonic(e, ui);
            } else {
                _handleSideband(e, ui);
            }
        };

        _handleHarmonic = function (e, ui, key) {
            var
                left,
                right;

            _this.clearCursor();
            if (ui) {
                _pointerArray[0].row = _dygraph.findClosestRow(ui.position.left);
            } else {
                if (key == 1) {
                    _pointerArray[0].row -= 1;
                } else if (key == 2) {
                    _pointerArray[0].row += 1;
                }                
            }

            /*
            if (_dygraph.file_[_pointerArray[0].row - 1] && (_dygraph.file_[_pointerArray[0].row - 1][1] > _dygraph.file_[_pointerArray[0].row][1])) {
                _pointerArray[0].row += 1;
            } else if (_dygraph.file_[_pointerArray[0].row + 1] && (_dygraph.file_[_pointerArray[0].row + 1][1] > _dygraph.file_[_pointerArray[0].row][1])) {
                _pointerArray[0].row -= 1;
            }*/
            _pointerArray[0].xval = _dygraph.file_[_pointerArray[0].row][0];
            _pointerArray[0].domX = _dygraph.toDomXCoord(_pointerArray[0].xval);
            left = _dygraph.boundaryIds_[0][0] + 1;
            right = _dygraph.boundaryIds_[0][1] - 1;
            if (_pointerArray[0].row < left) {
                _pointerArray[0].row = left;
                _pointerArray[0].xval = _dygraph.file_[_pointerArray[0].row][0];
                $(_pointerArray[0].lineDiv).css({
                    "left": _dygraph.toDomXCoord(_pointerArray[0].xval) + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            }

            if (_pointerArray[0].row > right) {
                _pointerArray[0].row = right;
                _pointerArray[0].xval = _dygraph.file_[_pointerArray[0].row][0];
                $(_pointerArray[0].lineDiv).css({
                    "left": _dygraph.toDomXCoord(_pointerArray[0].xval) + "px",
                    "height": "2px"
                });

                e.preventDefault();
                return false;
            }

            $(_pointerArray[0].lineDiv).css({
                "left": (_pointerArray[0].domX - 4) + "px",
                "height": "2px"
            });
            if (ui) {
                ui.position.left = _pointerArray[0].domX - 4;
            }
            _drawHarmonicMarker(_pointerArray[0].row);
        };

        _drawHarmonicMarker = function (row) {
            var
                ctx,
                positions,
                i, j,
                idx,
                leftPt,
                centerPt;

            _this.clearCursor();
            ctx = _canvas.getContext("2d");
            positions = _getHarmonics(row, _pointerArray[0].high);
            for (i = 0; i < _dygraph.layout_.points.length; i += 1) {
                if (_dygraph.file_[row][i + 1] !== null) {
                    j = _dygraph.layout_.points[i][0].idx;
                    break;
                }
            }
            centerPt = _dygraph.layout_.points[i][row - j];
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
            for (idx = 1; idx < positions.length; idx += 1) {
                leftPt = _dygraph.layout_.points[i][positions[idx][0] - j];
                if (typeof leftPt !== "undefined") {
                    ctx.beginPath();
                    ctx.fillStyle = "#000000";
                    ctx.arc(leftPt.canvasx - _dygraph.plotter_.area.x, leftPt.canvasy - _dygraph.plotter_.area.y, 2, 0, 2 * Math.PI, true);
                    ctx.fill();
                    ctx.closePath();
                    ctx.beginPath();
                    ctx.font = "12px FontAwesome";
                    ctx.fillText((idx + 1) + "x", leftPt.canvasx - _dygraph.plotter_.area.x - 6, leftPt.canvasy - _dygraph.plotter_.area.y - 5);
                    ctx.closePath();
                }
            }
        };

        _handleSideband = function (e, ui, key) {
            var
                i,
                step,
                left,
                right;

            if (ui) {
                i = parseInt($(ui.helper)[0].getAttribute("pointerPosition"));
                _pointerArray[i].row = _dygraph.findClosestRow(ui.position.left);
                if (ui.position.left < _dygraph.plotter_.area.x) {
                    _pointerArray[i].row = _dygraph.findClosestRow(ui.position.left + 4);
                }
                _lastCursorSidebandSelected = i;
                _lastCursorPosition = ui.position.left;
            } else {
                i = _lastCursorSidebandSelected;
                if (key == 1) {
                    _pointerArray[i].row -= 1;
                } else if (key == 2) {
                    _pointerArray[i].row += 1;
                }
            }

            _pointerArray[i].xval = _dygraph.file_[_pointerArray[i].row][0];
            _pointerArray[i].domX = _dygraph.toDomXCoord(_pointerArray[i].xval);
            if (i === 0) {
                // Puntero principal
                step = _pointerArray[1].row - _pointerArray[0].row;
                step = (step < 0) ? -_pointerArray[i].step : _pointerArray[i].step;
                _pointerArray[1].row = _pointerArray[i].row + step;
                // Proteger el desbordamiento de la grafica
                if (_pointerArray[1].row < 0) {
                    _pointerArray[1].row = 0;
                } else if (_pointerArray[1].row >= _dygraph.file_.length) {
                    _pointerArray[1].row = _dygraph.file_.length - 1;
                }
                _pointerArray[1].row = (_pointerArray[1].row < 0) ? 0 : _pointerArray[1].row;
                _pointerArray[1].xval = _dygraph.file_[_pointerArray[1].row][0];
                _pointerArray[1].domX = _dygraph.toDomXCoord(_pointerArray[1].xval);
                $(_pointerArray[1].lineDiv).css({
                    "left": _pointerArray[1].domX + "px",
                    "height": "2px"
                });
            } else {
                // Puntero secundario
                if (_dygraph.file_[_pointerArray[i].row - 1] &&
                    (_dygraph.file_[_pointerArray[i].row - 1][1] > _dygraph.file_[_pointerArray[i].row][1])) {
                    _pointerArray[i].row -= 1;
                } else if (_dygraph.file_[_pointerArray[i].xval + 1] &&
                    (_dygraph.file_[_pointerArray[i].xval + 1][1] > _dygraph.file_[_pointerArray[i].xval][1])) {
                    _pointerArray[i].row += 1;
                }
                _pointerArray[i].xval = _dygraph.file_[_pointerArray[i].row][0];
                _pointerArray[i].domX = _dygraph.toDomXCoord(_pointerArray[i].xval);
                $(_pointerArray[1].lineDiv).css({
                    "left": _pointerArray[i].domX + "px",
                    "height": "2px"
                });
                step = _pointerArray[i].row - _pointerArray[0].row;
                if (step < 0) {
                    step = _pointerArray[0].row - _pointerArray[i].row;
                }
                _pointerArray[0].step = step;
                _pointerArray[1].step = step;
            }
            left = _dygraph.plotter_.area.x - 4;
            right = _dygraph.plotter_.area.x + _dygraph.plotter_.area.w + 4;
            // A diferencia del cursor que genera el evento, el otro cursor puede encontrarse por fuera de la grafica durante el evento
            if (_pointerArray[(i + 1) % 2].domX < left || _pointerArray[(i + 1) % 2].domX > right) {
                $([_pointerArray[(i + 1) % 2].lineDiv]).hide();
            } else {
                $([_pointerArray[(i + 1) % 2].lineDiv]).show();
            }
            // Si el cursor que genera el evento Drag, se encuentra por fuera de los limites de la grafica
            // Es necesario prevenir la propagacion del evento ubicandolo sobre el limite inferior o superior segun el caso
            if (_pointerArray[i % 2].domX < left) {
                _pointerArray[i % 2].row = _dygraph.boundaryIds_[0][0] + 1;
                _pointerArray[i % 2].xval = _dygraph.file_[_pointerArray[i % 2].row][0];
                _pointerArray[i % 2].domX = _dygraph.toDomXCoord(_pointerArray[i % 2].xval);
                $(_pointerArray[i % 2].lineDiv).css({
                    "left": _pointerArray[i % 2].domX + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            } else if (_pointerArray[i % 2].domX > right) {
                _pointerArray[i % 2].row = _dygraph.boundaryIds_[0][1] - 1;
                _pointerArray[i % 2].xval = _dygraph.file_[_pointerArray[i % 2].row][0];
                _pointerArray[i % 2].domX = _dygraph.toDomXCoord(_pointerArray[i % 2].xval);
                $(_pointerArray[i % 2].lineDiv).css({
                    "left": _pointerArray[i % 2].domX + "px",
                    "height": "2px"
                });
                e.preventDefault();
                return false;
            } else {
                $([_pointerArray[i % 2].lineDiv]).show();
            }
            // Centrar el puntero principal
            $(_pointerArray[0].lineDiv).css({
                "left": (_pointerArray[0].domX - 4) + "px",
                "height": "2px"
            });
            // Centrar el puntero secundario
            $(_pointerArray[1].lineDiv).css({
                "left": (_pointerArray[1].domX - 4) + "px",
                "height": "2px"
            });
            if (ui) {
                // Necesario para que la linea que se dibuja sobre el marcador actual, coincida con el centro del puntero
                ui.position.left = _pointerArray[i].domX - 4;
            }
            _drawSidebandWidth();
            _drawSidebandMarker(_pointerArray[i].row, i);
        };

        _drawSidebandWidth = function () {
            var
                diff,
                ctx;

            _this.clearCursor();

            /*
             * RECORDATORIO: EL TEXTO QUE MUESTRA EL ANCHO DE LA BANDA, ES NECESARIO DARLE UN TRATAMIENTO
             * ADICIONAL, ESTO ES, CUANDO EL ANCHO DEL TEXTO ES GRANDE EN COMPARACION CON EL ANCHO DE LA BANDA (PIXELES)
             * ES NECESARIO UBICARLA A UNO DE LOS LADOS, TAMBIEN ES NECESARIO DETERMINAR QUE LADO TIENE EL MAYOR ESPACIO
             */

            diff = _pointerArray[1].xval - _pointerArray[0].xval;
            diff = (diff < 0) ? -diff.toFixed(2) : diff.toFixed(2);
            ctx = _canvas.getContext("2d");
            ctx.beginPath();
            ctx.font = "10px Georgia";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000000";
            ctx.fillText(diff + " " + _xCoordinateUnit.Text,
                (_pointerArray[1].domX + _pointerArray[0].domX) / 2 - _dygraph.plotter_.area.x, 12);
            ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.closePath();
        };

        _drawSidebandMarker = function (row, current) {
            var
                ctx,
                i, j,
                centerPt,
                step,
                idx,
                leftPt,
                rightPt;

            ctx = _canvas.getContext("2d");
            for (i = 0; i < _dygraph.layout_.points.length; i += 1) {
                if (_dygraph.file_[row][i + 1] !== null) {
                    idx = _dygraph.layout_.points[i][0].idx;
                    break;
                }
            }
            // Determinamos la informacion del cursor principal (caso sea visible)
            centerPt = _dygraph.layout_.points[i][_pointerArray[0].row - idx];
            step = _pointerArray[0].step;
            if (centerPt !== undefined) {
                ctx.beginPath();
                ctx.fillStyle = "#FF0000";
                ctx.arc(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y, 3, 0, 2 * Math.PI, true);
                ctx.fill();
                ctx.closePath();
                if (_isDragging) {
                    // Determinar el punto de central del cursor que se esta moviendo
                    centerPt = _dygraph.layout_.points[i][_pointerArray[current].row - idx];
                    // Dibujar la linea punteada que sirve de guia para encontrar una banda especifica
                    ctx.beginPath();
                    ctx.strokeStyle = (current === 0) ? "#FF0000" : "#000000";
                    ctx.setLineDash([8, 10]);
                    ctx.moveTo(centerPt.canvasx - _dygraph.plotter_.area.x, _dygraph.plotter_.area.y);
                    ctx.lineTo(centerPt.canvasx - _dygraph.plotter_.area.x, centerPt.canvasy - _dygraph.plotter_.area.y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
            row = _pointerArray[0].row;
            for (i = 1; i <= _sideBandCount; i += 1) {
                for (j = 0; j < _dygraph.layout_.points.length; j += 1) {
                    idx = _dygraph.layout_.points[j][0].idx;
                    leftPt = _dygraph.layout_.points[j][row + step * i - idx];
                    rightPt = _dygraph.layout_.points[j][row - step * i - idx];
                    if (leftPt !== undefined) {
                        ctx.beginPath();
                        ctx.fillStyle = "#000000";
                        ctx.arc(leftPt.canvasx - _dygraph.plotter_.area.x, leftPt.canvasy - _dygraph.plotter_.area.y, 2, 0, 2 * Math.PI, true);
                        ctx.fill();
                        ctx.closePath();
                    }
                    if (rightPt !== undefined) {
                        ctx.beginPath();
                        ctx.fillStyle = "#000000";
                        ctx.arc(rightPt.canvasx - _dygraph.plotter_.area.x, rightPt.canvasy - _dygraph.plotter_.area.y, 2, 0, 2 * Math.PI, true);
                        ctx.fill();
                        ctx.closePath();
                    }
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

        _getRowForX = function (xVal) {
            var low = 0,
                high = _dygraph.numRows() - 1;

            while (low <= high) {
                var idx = (high + low) >> 1;
                var x = _dygraph.getValue(idx, 0);
                if (x < xVal) {
                    low = idx + 1;
                } else if (x > xVal) {
                    high = idx - 1;
                } else if (low != idx) {
                    high = idx;
                } else {
                    return idx;
                }
            }
            return null;
        };
    };

    return Cursors;
})();
