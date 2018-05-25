/**
     * Given a canvas X coordinate, find the closest row.
     * @param {number} domX graph-relative DOM X coordinate
     * Returns {number} row number.
     * @private
     */
Dygraph.prototype.findClosestRow = function (domX) {
    var minDistX = Infinity;
    var closestRow = -1;
    var sets = this.layout_.points;
    for (var i = 0; i < sets.length; i++) {
        var points = sets[i];
        var len = points.length;
        for (var j = 0; j < len; j++) {
            var point = points[j];
            if (!Dygraph.isValidPoint(point, true)) continue;
            var dist = Math.abs(point.canvasx - domX);
            if (dist < minDistX) {
                minDistX = dist;
                closestRow = point.idx;
            }
        }
    }

    return closestRow;
};

/**
 * Given canvas X,Y coordinates, find the closest point.
 *
 * This finds the individual data point across all visible series
 * that's closest to the supplied DOM coordinates using the standard
 * Euclidean X,Y distance.
 *
 * @param {number} domX graph-relative DOM X coordinate
 * @param {number} domY graph-relative DOM Y coordinate
 * Returns: {row, seriesName, point}
 * @private
 */
Dygraph.prototype.findClosestPoint = function (domX, domY) {
    var minDist = Infinity;
    var dist, dx, dy, point, closestPoint, closestSeries, closestRow;
    for (var setIdx = this.layout_.points.length - 1 ; setIdx >= 0 ; --setIdx) {
        var points = this.layout_.points[setIdx];
        for (var i = 0; i < points.length; ++i) {
            point = points[i];
            if (!Dygraph.isValidPoint(point)) continue;
            dx = point.canvasx - domX;
            dy = point.canvasy - domY;
            dist = dx * dx + dy * dy;
            if (dist < minDist) {
                minDist = dist;
                closestPoint = point;
                closestSeries = setIdx;
                closestRow = point.idx;
            }
        }
    }
    var name = this.layout_.setNames[closestSeries];
    return {
        row: closestRow,
        seriesName: name,
        point: closestPoint
    };
};

/**
 * Given canvas X,Y coordinates, find the touched area in a stacked graph.
 *
 * This first finds the X data point closest to the supplied DOM X coordinate,
 * then finds the series which puts the Y coordinate on top of its filled area,
 * using linear interpolation between adjacent point pairs.
 *
 * @param {number} domX graph-relative DOM X coordinate
 * @param {number} domY graph-relative DOM Y coordinate
 * Returns: {row, seriesName, point}
 * @private
 */
Dygraph.prototype.findStackedPoint = function (domX, domY) {
    var row = this.findClosestRow(domX);
    var closestPoint, closestSeries;
    for (var setIdx = 0; setIdx < this.layout_.points.length; ++setIdx) {
        var boundary = this.getLeftBoundary_(setIdx);
        var rowIdx = row - boundary;
        var points = this.layout_.points[setIdx];
        if (rowIdx >= points.length) continue;
        var p1 = points[rowIdx];
        if (!Dygraph.isValidPoint(p1)) continue;
        var py = p1.canvasy;
        if (domX > p1.canvasx && rowIdx + 1 < points.length) {
            // interpolate series Y value using next point
            var p2 = points[rowIdx + 1];
            if (Dygraph.isValidPoint(p2)) {
                var dx = p2.canvasx - p1.canvasx;
                if (dx > 0) {
                    var r = (domX - p1.canvasx) / dx;
                    py += r * (p2.canvasy - p1.canvasy);
                }
            }
        } else if (domX < p1.canvasx && rowIdx > 0) {
            // interpolate series Y value using previous point
            var p0 = points[rowIdx - 1];
            if (Dygraph.isValidPoint(p0)) {
                var dx = p1.canvasx - p0.canvasx;
                if (dx > 0) {
                    var r = (p1.canvasx - domX) / dx;
                    py += r * (p0.canvasy - p1.canvasy);
                }
            }
        }
        // Stop if the point (domX, py) is above this series' upper edge
        if (setIdx === 0 || py < domY) {
            closestPoint = p1;
            closestSeries = setIdx;
        }
    }
    var name = this.layout_.setNames[closestSeries];
    return {
        row: row,
        seriesName: name,
        point: closestPoint
    };
};

/**
 * When the mouse moves in the canvas, display information about a nearby data
 * point and draw dots over those points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @param {Object} event The mousemove event from the browser.
 * @private
 */
Dygraph.prototype.mouseMove_ = function (event) {
    // This prevents JS errors when mousing over the canvas before data loads.
    var points = this.layout_.points;
    if (points === undefined || points === null) return;

    var canvasCoords = this.eventToDomCoords(event);
    var canvasx = canvasCoords[0];
    var canvasy = canvasCoords[1];

    var highlightSeriesOpts = this.getOption("highlightSeriesOpts");
    var selectionChanged = false;
    if (highlightSeriesOpts && !this.isSeriesLocked()) {
        var closest;
        if (this.getBooleanOption("stackedGraph")) {
            closest = this.findStackedPoint(canvasx, canvasy);
        } else {
            closest = this.findClosestPoint(canvasx, canvasy);
        }
        selectionChanged = this.setSelection(closest.row, closest.seriesName);
    } else {
        var idxList = [];
        var x = Math.round(this.toDataXCoord(canvasx));
        idxList.push(this.getRowForX(x));
        idxList.push(this.getRowForX(-x));
        var idx = this.findClosestRow(canvasx);
        selectionChanged = this.setSelectionExt(idxList);
    }

    var callback = this.getFunctionOption("highlightCallback");
    if (callback && selectionChanged) {
        callback.call(this, event,
            this.lastx_,
            this.selPoints_,
            this.lastRow_,
            this.highlightSet_);
    }
};

/**
 * Find the row number corresponding to the given x-value.
 * Returns null if there is no such x-value in the data.
 * If there are multiple rows with the same x-value, this will return the
 * first one.
 * @param {number} xVal The x-value to look for (e.g. millis since epoch).
 * @return {?number} The row number, which you can pass to getValue(), or null.
 */
Dygraph.prototype.getRowForX = function (xVal) {
    var low = 0,
        high = this.numRows() - 1;

    while (low <= high) {
        var idx = (high + low) >> 1;
        var x = this.getValue(idx, 0);
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

/**
 * Fetch left offset from the specified set index or if not passed, the 
 * first defined boundaryIds record (see bug #236).
 * @private
 */
Dygraph.prototype.getLeftBoundary_ = function (setIdx) {
    if (this.boundaryIds_[setIdx]) {
        return this.boundaryIds_[setIdx][0];
    } else {
        for (var i = 0; i < this.boundaryIds_.length; i++) {
            if (this.boundaryIds_[i] !== undefined) {
                return this.boundaryIds_[i][0];
            }
        }
        return 0;
    }
};

Dygraph.prototype.animateSelection_ = function (direction) {
    var totalSteps = 10;
    var millis = 30;
    if (this.fadeLevel === undefined) this.fadeLevel = 0;
    if (this.animateId === undefined) this.animateId = 0;
    var start = this.fadeLevel;
    var steps = direction < 0 ? start : totalSteps - start;
    if (steps <= 0) {
        if (this.fadeLevel) {
            this.updateSelection_(1.0);
        }
        return;
    }

    var thisId = ++this.animateId;
    var that = this;
    Dygraph.repeatAndCleanup(
      function (n) {
          // ignore simultaneous animations
          if (that.animateId != thisId) return;

          that.fadeLevel += direction;
          if (that.fadeLevel === 0) {
              that.clearSelection();
          } else {
              that.updateSelection_(that.fadeLevel / totalSteps);
          }
      },
      steps, millis, function () { });
};

/**
 * Draw dots over the selectied points in the data series. This function
 * takes care of cleanup of previously-drawn dots.
 * @private
 */
Dygraph.prototype.updateSelection_ = function (opt_animFraction) {
    /*var defaultPrevented = */
    //this.cascadeEvents_('select', {
    //    selectedRow: this.lastRow_,
    //    selectedX: this.lastx_,
    //    selectedPoints: this.selPoints_
    //});
    // TODO(danvk): use defaultPrevented here?

    // Clear the previously drawn vertical, if there is one
    var i;
    var ctx = this.canvas_ctx_;
    if (this.getOption('highlightSeriesOpts')) {
        ctx.clearRect(0, 0, this.width_, this.height_);
        var alpha = 1.0 - this.getNumericOption('highlightSeriesBackgroundAlpha');
        if (alpha) {
            // Activating background fade includes an animation effect for a gradual
            // fade. TODO(klausw): make this independently configurable if it causes
            // issues? Use a shared preference to control animations?
            var animateBackgroundFade = true;
            if (animateBackgroundFade) {
                if (opt_animFraction === undefined) {
                    // start a new animation
                    this.animateSelection_(1);
                    return;
                }
                alpha *= opt_animFraction;
            }
            ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.fillRect(0, 0, this.width_, this.height_);
        }

        // Redraw only the highlighted series in the interactive canvas (not the
        // static plot canvas, which is where series are usually drawn).
        this.plotter_._renderLineChart(this.highlightSet_, ctx);
    } else if (this.previousVerticalX_ >= 0) {
        // Determine the maximum highlight circle size.
        var maxCircleSize = 0;
        var labels = this.attr_('labels');
        for (i = 1; i < labels.length; i++) {
            var r = this.getNumericOption('highlightCircleSize', labels[i]);
            if (r > maxCircleSize) maxCircleSize = r;
        }
        var px1 = this.previousVerticalX_;
        ctx.clearRect(px1 - maxCircleSize - 1, 0,
                      2 * maxCircleSize + 2, this.height_);
        var px2 = this.toDomXCoord(-Math.round(this.toDataXCoord(this.previousVerticalX_)));
        ctx.clearRect(px2 - maxCircleSize - 1, 0,
                      2 * maxCircleSize + 2, this.height_);
    }

    if (this.isUsingExcanvas_ && this.currentZoomRectArgs_) {
        Dygraph.prototype.drawZoomRect_.apply(this, this.currentZoomRectArgs_);
    }

    if (this.selPoints_.length > 0) {
        // Draw colored circles over the center of each selected point
        var canvasx = this.selPoints_[0].canvasx;
        ctx.save();
        for (i = 0; i < this.selPoints_.length; i++) {
            var pt = this.selPoints_[i];
            if (!Dygraph.isOK(pt.canvasy)) continue;

            var circleSize = this.getNumericOption('highlightCircleSize', pt.name);
            var callback = this.getFunctionOption("drawHighlightPointCallback", pt.name);
            var color = this.plotter_.colors[pt.name];
            if (!callback) {
                callback = Dygraph.Circles.DEFAULT;
            }
            ctx.lineWidth = this.getNumericOption('strokeWidth', pt.name);
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            callback.call(this, this, pt.name, ctx, pt.canvasx, pt.canvasy,
                color, circleSize, pt.idx);
        }
        ctx.restore();

        this.previousVerticalX_ = canvasx;
    }
};

/**
 * Manually set the selected points and display information about them in the
 * legend. The selection can be cleared using clearSelection() and queried
 * using getSelection().
 * @param {number} row Row number that should be highlighted (i.e. appear with
 * hover dots on the chart).
 * @param {seriesName} optional series name to highlight that series with the
 * the highlightSeriesOpts setting.
 * @param { locked } optional If true, keep seriesName selected when mousing
 * over the graph, disabling closest-series highlighting. Call clearSelection()
 * to unlock it.
 */
Dygraph.prototype.setSelection = function (row, opt_seriesName, opt_locked) {
    // Extract the points we've selected
    this.selPoints_ = [];

    var changed = false;
    if (row !== false && row >= 0) {
        if (row != this.lastRow_) changed = true;
        this.lastRow_ = row;
        for (var setIdx = 0; setIdx < this.layout_.points.length; ++setIdx) {
            var points = this.layout_.points[setIdx];
            // Check if the point at the appropriate index is the point we're looking
            // for.  If it is, just use it, otherwise search the array for a point
            // in the proper place.
            var setRow = row - this.getLeftBoundary_(setIdx);
            if (setRow < points.length && points[setRow].idx == row) {
                var point = points[setRow];
                if (point.yval !== null) this.selPoints_.push(point);
            } else {
                for (var pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                    var point = points[pointIdx];
                    if (point.idx == row) {
                        if (point.yval !== null) {
                            this.selPoints_.push(point);
                        }
                        break;
                    }
                }
            }
        }
    } else {
        if (this.lastRow_ >= 0) changed = true;
        this.lastRow_ = -1;
    }

    if (this.selPoints_.length) {
        this.lastx_ = this.selPoints_[0].xval;
    } else {
        this.lastx_ = -1;
    }

    if (opt_seriesName !== undefined) {
        if (this.highlightSet_ !== opt_seriesName) changed = true;
        this.highlightSet_ = opt_seriesName;
    }

    if (opt_locked !== undefined) {
        this.lockedSet_ = opt_locked;
    }

    if (changed) {
        this.updateSelection_(undefined);
    }
    return changed;
};

Dygraph.prototype.setSelectionExt = function (rowList, opt_seriesName, opt_locked) {
    // Extract the points we've selected
    this.selPoints_ = [];

    var changed = false;
    for (var i = 0; i < rowList.length; i++) {
        var row = rowList[i];
        if (row !== false && row >= 0) {
            if (row != this.lastRow_) changed = true;
            this.lastRow_ = row;
            for (var setIdx = 0; setIdx < this.layout_.points.length; ++setIdx) {
                var points = this.layout_.points[setIdx];
                // Check if the point at the appropriate index is the point we're looking
                // for.  If it is, just use it, otherwise search the array for a point
                // in the proper place.
                var setRow = row - this.getLeftBoundary_(setIdx);
                if (setRow < points.length && points[setRow].idx == row) {
                    var point = points[setRow];
                    if (point.yval !== null && !isNaN(point.yval)) this.selPoints_.push(point);
                } else {
                    for (var pointIdx = 0; pointIdx < points.length; ++pointIdx) {
                        var point = points[pointIdx];
                        if (point.idx == row) {
                            if (point.yval !== null && !isNaN(point.yval)) {
                                this.selPoints_.push(point);
                            }
                            break;
                        }
                    }
                }
            }
        } else {
            if (this.lastRow_ >= 0) changed = true;
            this.lastRow_ = -1;
        }
    }

    if (this.selPoints_.length) {
        this.lastx_ = this.selPoints_[0].xval;
    } else {
        this.lastx_ = -1;
    }

    if (opt_seriesName !== undefined) {
        if (this.highlightSet_ !== opt_seriesName) changed = true;
        this.highlightSet_ = opt_seriesName;
    }

    if (opt_locked !== undefined) {
        this.lockedSet_ = opt_locked;
    }

    if (changed) {
        this.updateSelection_(undefined);
    }
    return changed;
};

/**
 * The mouse has left the canvas. Clear out whatever artifacts remain
 * @param {Object} event the mouseout event from the browser.
 * @private
 */
Dygraph.prototype.mouseOut_ = function (event) {
    if (this.getFunctionOption("unhighlightCallback")) {
        this.getFunctionOption("unhighlightCallback").call(this, event);
    }

    if (this.getBooleanOption("hideOverlayOnMouseOut") && !this.lockedSet_) {
        this.clearSelection();
    }
};

/**
 * Clears the current selection (i.e. points that were highlighted by moving
 * the mouse over the chart).
 */
Dygraph.prototype.clearSelection = function () {
    this.cascadeEvents_('deselect', {});

    this.lockedSet_ = false;
    // Get rid of the overlay data
    if (this.fadeLevel) {
        this.animateSelection_(-1);
        return;
    }
    this.canvas_ctx_.clearRect(0, 0, this.width_, this.height_);
    this.fadeLevel = 0;
    this.selPoints_ = [];
    this.lastx_ = -1;
    this.lastRow_ = -1;
    this.highlightSet_ = null;
};

/**
 * Returns the number of the currently selected row. To get data for this row,
 * you can use the getValue method.
 * @return {number} row number, or -1 if nothing is selected
 */
Dygraph.prototype.getSelection = function () {
    if (!this.selPoints_ || this.selPoints_.length < 1) {
        return -1;
    }

    for (var setIdx = 0; setIdx < this.layout_.points.length; setIdx++) {
        var points = this.layout_.points[setIdx];
        for (var row = 0; row < points.length; row++) {
            if (points[row].x == this.selPoints_[0].x) {
                return points[row].idx;
            }
        }
    }
    return -1;
};

/**
 * Returns the name of the currently-highlighted series.
 * Only available when the highlightSeriesOpts option is in use.
 */
Dygraph.prototype.getHighlightSeries = function () {
    return this.highlightSet_;
};

/**
 * Returns true if the currently-highlighted series was locked
 * via setSelection(..., seriesName, true).
 */
Dygraph.prototype.isSeriesLocked = function () {
    return this.lockedSet_;
};

/**
 * Fires when there's data available to be graphed.
 * @param {string} data Raw CSV data to be plotted
 * @private
 */
Dygraph.prototype.loadedEvent_ = function (data) {
    this.rawData_ = this.parseCSV_(data);
    this.cascadeDataDidUpdateEvent_();
    this.predraw_();
};