/*
 * serieSynchronizer.js
 * Sincorniza dos series sobre alguno de los ejes
 * @author Jorge Calderon
 */

/*global Dygraph:false */

var SerieSynchronizer = {};

SerieSynchronizer = (function () {

    "use strict";

    /*
     * Constructor
     * @param {Object} g Referencia al grafico a sincronizar
     */
    SerieSynchronizer = function () {
        // Propiedades privadas
        var
            // Auto-referencia a la clase SerieReflectionSynchronizer
            _this,
            // Referencia al grafico a sincronizar
            _chart,
            _lastPoint,
            _findClosestPoint;

        _this = this;

        this.SetChartReference = function (chart) {
            _chart = chart;
        };

        /*
         * @param {String} axis Eje sobre el cual se realiza la sincronizacion basada en la reflexion del eje
         */
        this.YReflection = function (e, g, ctx) {
            var
                points,
                selectionChanged,
                canvasCoords,
                closestPoint,
                idxList,
                callback;

            _chart = g;
            points = g.layout_.points;
            if (points === undefined || points === null) {
                return;
            }
            selectionChanged = false;
            canvasCoords = g.eventToDomCoords(e);
            closestPoint = _findClosestPoint(canvasCoords[0], canvasCoords[1], g.layout_);
            idxList = [closestPoint.row, _this.getRowForX(-closestPoint.point.xval)];
            if (idxList[0] < _chart.boundaryIds_[0][0]) {
                return;
            }
            selectionChanged = _this.setSelection(idxList);
            callback = _chart.getFunctionOption("highlightCallback");
            if (callback && selectionChanged) {
                callback.call(_chart, e,
                    _chart.lastx_,
                    _chart.selPoints_,
                    _chart.lastRow_,
                    _chart.highlightSet_);
            }
            _lastPoint = closestPoint;
        };
        /*
 * @param {String} axis Eje sobre el cual se realiza la sincronizacion basada en la reflexion del eje
 */
        this.YReflectionKey = function (e, g) {
            var
                points,
                selectionChanged,
                canvasCoords,
                closestPoint,
                idxList,
                callback;

            _chart = g;

            if (e.which == 37) {
                _lastPoint.row -= 1;
                idxList = [_lastPoint.row, _this.getRowForX(-_lastPoint.point.xval) + 1];
            } else if (e.which == 39) {
                _lastPoint.row += 1;
                idxList = [_lastPoint.row, _this.getRowForX(-_lastPoint.point.xval) - 1];
            }
            _lastPoint.point.xval = _chart.file_[_lastPoint.row][0];


            if (idxList[0] < _chart.boundaryIds_[0][0]) {
                return;
            }
            selectionChanged = _this.setSelection(idxList);
            callback = _chart.getFunctionOption("highlightCallback");
            if (callback && selectionChanged) {
                callback.call(_chart, e,
                    _chart.lastx_,
                    _chart.selPoints_,
                    _chart.lastRow_,
                    _chart.highlightSet_);
            }
        };

        this.ReflectByIndex = function (e, g, ctx) {
            var
                points,
                canvasCoords,
                closestPoint,
                selectionChanged,
                totalPoints,
                currentIdx,
                idxList,
                callback,
                i;

            _chart = g;
            canvasCoords = g.eventToDomCoords(e);
            closestPoint = _findClosestPoint(canvasCoords[0], canvasCoords[1], g.layout_);
            currentIdx = closestPoint.row;
            totalPoints = g.file_.length;
            points = g.layout_.points;
            if (points === undefined || points === null) {
                return;
            }
            selectionChanged = false;
            idxList = [currentIdx, (currentIdx + totalPoints / 2) % totalPoints];
            selectionChanged = _this.setSelection(idxList);
            callback = _chart.getFunctionOption("highlightCallback");
            if (callback && selectionChanged) {
                callback.call(_chart, e,
                    _chart.lastx_,
                    _chart.selPoints_,
                    _chart.lastRow_,
                    _chart.highlightSet_);
            }
        };

        /*
         * Encuentra el numero de fila correspondiente al valor x dado.
         * Devuelve null si no existe tal valor x en los datos.
         * @param {Number} xVal El valor x a buscar.
         * @return {?Number} El numero de la fila, el cual se puede pasar a la funcion getValue(), o null.
         */
        this.getRowForX = function (xVal) {
            var low = 0,
                high = _chart.numRows() - 1;

            while (low <= high) {
                var idx = (high + low) >> 1;
                var x = _chart.getValue(idx, 0);
                if (x < xVal) {
                    low = idx + 1;
                } else if (x > xVal) {
                    high = idx - 1;
                } else if (low != idx) {  // equal, but there may be an earlier match.
                    high = idx;
                } else {
                    return idx;
                }
            }

            return null;
        };

        /*
         * Establece manualmente los puntos seleccionados y muestra informacion acerca de estos en la leyenda.
         * La seleccion se puede borrar usando clearSelection() y consultada usando getSelection().
         * @param {Array} row Numero de fila que se debe resaltar
         */
        this.setSelection = function (rowList) {
            _chart.selPoints_ = [];
            var
                changed,
                row,
                setIdx,
                points,
                setRow,
                point,
                pointIdx,
                i;

            changed = false;
            for (i = 0; i < rowList.length; i += 1) {
                row = rowList[i];
                if (row !== false && row >= 0) {
                    if (row != _chart.lastRow_) changed = true;
                    _chart.lastRow_ = row;
                    for (setIdx = 0; setIdx < _chart.layout_.points.length; ++setIdx) {
                        points = _chart.layout_.points[setIdx];
                        setRow = row - _chart.getLeftBoundary_(setIdx);
                        if (!points[setRow]) {
                            // Indica que la fila buscada no esta en la grafica (por ejemplo, zoom rectangular no igual para ambos lados)
                            continue;
                        }
                        if (setRow < points.length && points[setRow].idx == row) {
                            point = points[setRow];
                            if (point.yval !== null && !isNaN(point.yval)) _chart.selPoints_.push(point);
                        } else {
                            for (pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                                point = points[pointIdx];
                                if (point.idx == row) {
                                    if (point.yval !== null && !isNaN(point.yval)) {
                                        _chart.selPoints_.push(point);
                                    }
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    if (_chart.lastRow_ >= 0) changed = true;
                    _chart.lastRow_ = -1;
                }
            }

            if (_chart.selPoints_.length) {
                _chart.lastx_ = _chart.selPoints_[0].xval;
            } else {
                _chart.lastx_ = -1;
            }

            if (changed) {
                _this.updateSelection(undefined);
            }
            return changed;
        };

        this.updateSelection = function () {
            _chart.cascadeEvents_("select", {
                selectedRow: _chart.lastRow_,
                selectedX: _chart.lastx_,
                selectedPoints: _chart.selPoints_
            });

            // Clear the previously drawn vertical, if there is one
            var
                i,
                ctx,
                px1,
                px2;

            ctx = _chart.canvas_ctx_;
            if (_chart.previousVerticalX_ >= 0) {
                // Determine the maximum highlight circle size.
                var maxCircleSize = 0;
                var labels = _chart.attr_("labels");
                for (i = 1; i < labels.length; i += 1) {
                    var r = _chart.getNumericOption("highlightCircleSize", labels[i]);
                    if (r > maxCircleSize) maxCircleSize = r;
                }
                ctx.clearRect(0, 0, _chart.width_, _chart.height_);
            }

            if (_chart.isUsingExcanvas_ && _chart.currentZoomRectArgs_) {
                Dygraph.prototype.drawZoomRect_.apply(_chart, _chart.currentZoomRectArgs_);
            }

            if (_chart.selPoints_.length > 0) {
                // Draw colored circles over the center of each selected point
                var canvasx = _chart.selPoints_[0].canvasx;
                ctx.save();
                for (i = 0; i < _chart.selPoints_.length; i += 1) {
                    var pt = _chart.selPoints_[i];
                    if (!Dygraph.isOK(pt.canvasy)) continue;

                    var circleSize = _chart.getNumericOption("highlightCircleSize", pt.name);
                    var callback = _chart.getFunctionOption("drawHighlightPointCallback", pt.name);
                    var color = _chart.plotter_.colors[pt.name];
                    if (!callback) {
                        callback = Dygraph.Circles.DEFAULT;
                    }
                    ctx.lineWidth = _chart.getNumericOption("strokeWidth", pt.name);
                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;
                    callback.call(_chart, _chart, pt.name, ctx, pt.canvasx, pt.canvasy, color, circleSize, pt.idx);
                }
                ctx.restore();

                _chart.previousVerticalX_ = canvasx;
            }
        };

        this.mouseOut = function (e, g, ctx) {
            if (_chart.getFunctionOption("unhighlightCallback")) {
                _chart.getFunctionOption("unhighlightCallback").call(_chart, e);
            }
            _this.clearSelection();
        };

        this.clearSelection = function () {
            _chart.cascadeEvents_("deselect", {});
            _chart.lockedSet_ = false;
            _chart.canvas_ctx_.clearRect(0, 0, _chart.width_, _chart.height_);
            _chart.selPoints_ = [];
        };

        _findClosestPoint = function (domX, domY, layout) {
            var
                minDist,
                setIdx,
                pts, i,
                dist, dx, dy,
                closestPoint,
                closestSeries,
                closestRow;

            minDist = Infinity;
            for (setIdx = layout.points.length - 1; setIdx >= 0; --setIdx) {
                pts = layout.points[setIdx];
                for (i = 0; i < pts.length; ++i) {
                    if (!Dygraph.isValidPoint(pts[i])) {
                        continue;
                    }
                    dx = pts[i].canvasx - domX;
                    dy = pts[i].canvasy - domY;
                    dist = dx * dx + dy * dy;
                    if (dist < minDist) {
                        minDist = dist;
                        closestPoint = pts[i];
                        closestSeries = setIdx;
                        closestRow = pts[i].idx;
                    }
                }
            }
            return {
                row: closestRow,
                seriesName: layout.setNames[closestSeries],
                point: closestPoint
            };
        };
    };

    return SerieSynchronizer;
})();