/*
 * @license
 * Copyright 2016 Jorge Calderon (jorgenhoc@gmail.com)
 */

/*global Dygraph:false */

Dygraph.Plugins.Plotter = (function () {
    "use strict";

    /*
     * Constructor
     */
    var
        plotter,
        _positionateText,
        _getControlPoints;

    plotter = function () {
        
    };

    plotter.prototype.toString = function () {
        return "Plotter Plugin JC";
    };

    plotter.prototype.activate = function (g) {
        return {
            drawOrbit: this.drawOrbit,
            drawShaft: this.drawShaft
        };
    };

    plotter.prototype.drawOrbit = function (e, laps, fundamentalFreq) {
        var
            // Variable que contiene el contexto 2D del canvas
            ctx,
            cursor,
            i, j;

        // Inicializamos las variables
        ctx = e.drawingContext;
        cursor = 0;
        laps = (fundamentalFreq) ? laps : 1;
        if (e.points.length === 1) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.moveTo(e.points[0].canvasx, e.points[0].canvasy);
            ctx.strokeStyle = e.color;
            ctx.stroke();
            ctx.closePath();
        } else {
            for (i = 0; i < laps; i += 1) {
                // Grafica los puntos de la orbita
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.moveTo(e.points[cursor].canvasx, e.points[cursor].canvasy);
                for (j = (cursor + 1) ; j < e.points.length; j += 1) {
                    if (Number.isNaN(e.points[j].xval)) {
                        break;
                    }
                    ctx.lineTo(e.points[j].canvasx, e.points[j].canvasy);
                }
                ctx.strokeStyle = e.color;
                ctx.stroke();
                ctx.closePath();
                //Grafica el High Spot de la orbita
                ctx.beginPath();
                ctx.fillStyle = e.color;
                ctx.arc(e.points[cursor].canvasx, e.points[cursor].canvasy, 4, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.closePath();
                cursor = j + 1;
            }
        }
        return e.color;
    };

    plotter.prototype.drawClearanceBoundary = function (e, clearanceConfig) {
        var
            startPosition,
            xClearance,
            yClearance,
            xVal,
            yVal,
            i, j;

        if (!clearanceConfig.enable) {
            return;
        }

        startPosition = clearanceConfig.start;
        xClearance = clearanceConfig.x;
        yClearance = clearanceConfig.y;
        switch (startPosition.Value) {
            case clearanceStartPosition.Bottom.Value:
                ctx.beginPath();
                ctx.lineWidth = 1;
                xVal = (xClearance / 2) * Math.cos(0);
                yVal = (yClearance / 2) * (Math.sin(0) + 1);
                xVal = e.dygraph.toDomXCoord(xVal);
                yVal = e.dygraph.toDomYCoord(yVal);
                ctx.moveTo(xVal, yVal);
                for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                    xVal = (xClearance / 2) * Math.cos(i);
                    yVal = (yClearance / 2) * (Math.sin(i) + 1);
                    xVal = e.dygraph.toDomXCoord(xVal);
                    yVal = e.dygraph.toDomYCoord(yVal);
                    if (j === 1) {
                        ctx.lineTo(xVal, yVal);
                        ctx.strokeStyle = "#B3B3B3";
                        ctx.stroke();
                        ctx.closePath();
                        j = -1;
                    } else {
                        ctx.moveTo(xVal, yVal);
                    }
                    j += 1;
                }
                ctx.strokeStyle = "#B3B3B3";
                ctx.stroke();
                ctx.closePath();
                break;
            case clearanceStartPosition.Center.Value:
                ctx.beginPath();
                ctx.lineWidth = 1;
                xVal = (xClearance / 2) * Math.cos(0);
                yVal = (yClearance / 2) * (Math.sin(0));
                xVal = e.dygraph.toDomXCoord(xVal);
                yVal = e.dygraph.toDomYCoord(yVal);
                ctx.moveTo(xVal, yVal);
                for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                    xVal = (xClearance / 2) * Math.cos(i);
                    yVal = (yClearance / 2) * (Math.sin(i));
                    xVal = e.dygraph.toDomXCoord(xVal);
                    yVal = e.dygraph.toDomYCoord(yVal);
                    if (j === 1) {
                        ctx.lineTo(xVal, yVal);
                        ctx.strokeStyle = "#B3B3B3";
                        ctx.stroke();
                        ctx.closePath();
                        j = -1;
                    } else {
                        ctx.moveTo(xVal, yVal);
                    }
                    j += 1;
                }
                ctx.strokeStyle = "#B3B3B3";
                ctx.stroke();
                ctx.closePath();
                break;
            case clearanceStartPosition.Top.Value:
                ctx.beginPath();
                ctx.lineWidth = 1;
                xVal = (xClearance / 2) * Math.cos(0);
                yVal = (yClearance / 2) * (Math.sin(0) - 1);
                xVal = e.dygraph.toDomXCoord(xVal);
                yVal = e.dygraph.toDomYCoord(yVal);
                ctx.moveTo(xVal, yVal);
                for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                    xVal = (xClearance / 2) * Math.cos(i);
                    yVal = (yClearance / 2) * (Math.sin(i) - 1);
                    xVal = e.dygraph.toDomXCoord(xVal);
                    yVal = e.dygraph.toDomYCoord(yVal);
                    if (j === 1) {
                        ctx.lineTo(xVal, yVal);
                        ctx.strokeStyle = "#B3B3B3";
                        ctx.stroke();
                        ctx.closePath();
                        j = -1;
                    } else {
                        ctx.moveTo(xVal, yVal);
                    }
                    j += 1;
                }
                ctx.strokeStyle = "#B3B3B3";
                ctx.stroke();
                ctx.closePath();
                break;
            case clearanceStartPosition.Left.Value:
                ctx.beginPath();
                ctx.lineWidth = 1;
                xVal = (xClearance / 2) * (Math.cos(0) - 1);
                yVal = (yClearance / 2) * Math.sin(0);
                xVal = e.dygraph.toDomXCoord(xVal);
                yVal = e.dygraph.toDomYCoord(yVal);
                ctx.moveTo(xVal, yVal);
                for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                    xVal = (xClearance / 2) * (Math.cos(i) - 1);
                    yVal = (yClearance / 2) * Math.sin(i);
                    xVal = e.dygraph.toDomXCoord(xVal);
                    yVal = e.dygraph.toDomYCoord(yVal);
                    if (j === 1) {
                        ctx.lineTo(xVal, yVal);
                        ctx.strokeStyle = "#B3B3B3";
                        ctx.stroke();
                        ctx.closePath();
                        j = -1;
                    } else {
                        ctx.moveTo(xVal, yVal);
                    }
                    j += 1;
                }
                ctx.strokeStyle = "#B3B3B3";
                ctx.stroke();
                ctx.closePath();
                break;
            case clearanceStartPosition.Right.Value:
                ctx.beginPath();
                ctx.lineWidth = 1;
                xVal = (xClearance / 2) * (Math.cos(0) + 1);
                yVal = (yClearance / 2) * Math.sin(0);
                xVal = e.dygraph.toDomXCoord(xVal);
                yVal = e.dygraph.toDomYCoord(yVal);
                ctx.moveTo(xVal, yVal);
                for (i = Math.PI / 30, j = 1; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                    xVal = (xClearance / 2) * (Math.cos(i) + 1);
                    yVal = (yClearance / 2) * Math.sin(i);
                    xVal = e.dygraph.toDomXCoord(xVal);
                    yVal = e.dygraph.toDomYCoord(yVal);
                    if (j === 1) {
                        ctx.lineTo(xVal, yVal);
                        ctx.strokeStyle = "#B3B3B3";
                        ctx.stroke();
                        ctx.closePath();
                        j = -1;
                    } else {
                        ctx.moveTo(xVal, yVal);
                    }
                    j += 1;
                }
                ctx.strokeStyle = "#B3B3B3";
                ctx.stroke();
                ctx.closePath();
                break;
            default:
                console.log("Posición de inicio para el gráfico desconocida.");
        }
    };

    plotter.prototype.drawShaftPosition = function (e, smoothing) {
        var
            // Variable que contiene el contexto 2D del canvas
            ctx;

        // Se inicializan las variables
        ctx = e.drawingContext;
        // Se grafican los puntos del shaft (Un unico punto para tiempo real)
        if (e.points.length === 1) {
            ctx.beginPath();
            ctx.fillStyle = e.color;
            ctx.arc(e.points[0].canvasx, e.points[0].canvasy, 2, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        } else {
            plotter.prototype.smoothPlotter(e, smoothing);
            //ctx.beginPath();
            //ctx.lineWidth = 1;
            //ctx.moveTo(e.points[0].canvasx, e.points[0].canvasy);
            //for (i = 1; i < e.points.length; i += 1) {
            //    ctx.lineTo(e.points[i].canvasx, e.points[i].canvasy);
            //}
            //ctx.strokeStyle = e.color;
            //ctx.stroke();
            //ctx.closePath();
        }
    };

    plotter.prototype.drawPolar = function (e, sensorAngle, rotn, annotations, smoothing) {
        var
            // Variable que contiene el contexto 2D del canvas
            ctx,
            xIni,
            yIni,
            sAngle,
            canvasx,
            canvasy,
            rotuleColor,
            angleDirection,
            reference,
            i, j, k;

        // Inicializar variables
        ctx = e.drawingContext;
        rotuleColor = "#808080";

        // Graficar las diferentes marcaciones y rotulos de la grafica
        if (e.dygraph.maxRadiusSize_) {
            xIni = e.plotArea.x + e.plotArea.w / 2;
            yIni = e.plotArea.y + e.plotArea.w / 2 + 1;
            sAngle = ((rotn === "CW") ? sensorAngle + 90 : -sensorAngle + 90);
            sAngle *= Math.PI / 180;
            for (j = 1; j < 4; j += 1) {
                ctx.beginPath();
                ctx.lineWidth = 1;
                canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * j / 3) * Math.cos(0));
                canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * j / 3) * Math.sin(0));
                ctx.moveTo(canvasx, canvasy);
                k = 0;
                for (i = Math.PI / 30; i <= 2 * Math.PI; i = i + Math.PI / 30) {
                    if (k === 0) {
                        canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * j / 3) * Math.cos(i));
                        canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * j / 3) * Math.sin(i));
                        ctx.lineTo(canvasx, canvasy);
                        ctx.strokeStyle = rotuleColor;
                        ctx.stroke();
                        ctx.closePath();
                        k = 1;
                    } else {
                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * j / 3) * Math.cos(i));
                        canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * j / 3) * Math.sin(i));
                        ctx.moveTo(canvasx, canvasy);
                        k = 0;
                    }
                }
                ctx.strokeStyle = rotuleColor;
                ctx.stroke();
                ctx.closePath();
            }

            ctx.beginPath();
            ctx.lineWidth = 1;
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle));
            ctx.moveTo(canvasx, canvasy);
            reference = _positionateText(sAngle, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("0°", reference[0], reference[1]);
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + Math.PI));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + Math.PI));
            ctx.lineTo(canvasx, canvasy);
            reference = _positionateText(sAngle + Math.PI, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("180°", reference[0], reference[1]);
            ctx.strokeStyle = rotuleColor;
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 1;
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + Math.PI / 4));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + Math.PI / 4));
            ctx.moveTo(canvasx, canvasy);
            angleDirection = (rotn === "CW") ? sAngle + Math.PI / 4 : sAngle - Math.PI / 4;
            reference = _positionateText(angleDirection, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("45°", reference[0], reference[1]);
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 5 * Math.PI / 4));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 5 * Math.PI / 4));
            ctx.lineTo(canvasx, canvasy);
            angleDirection = (rotn === "CW") ? sAngle + 5 * Math.PI / 4 : sAngle - 5 * Math.PI / 4;
            reference = _positionateText(angleDirection, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("225°", reference[0], reference[1]);
            ctx.strokeStyle = rotuleColor;
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 1;
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 3 * Math.PI / 4));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 3 * Math.PI / 4));
            ctx.moveTo(canvasx, canvasy);
            angleDirection = (rotn === "CW") ? sAngle + 3 * Math.PI / 4 : sAngle - 3 * Math.PI / 4;
            reference = _positionateText(angleDirection, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("135°", reference[0], reference[1]);
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 7 * Math.PI / 4));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 7 * Math.PI / 4));
            ctx.lineTo(canvasx, canvasy);
            angleDirection = (rotn === "CW") ? sAngle + 7 * Math.PI / 4 : sAngle - 7 * Math.PI / 4;
            reference = _positionateText(angleDirection, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("315°", reference[0], reference[1]);
            ctx.strokeStyle = rotuleColor;
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.lineWidth = 1;
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + Math.PI / 2));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + Math.PI / 2));
            ctx.moveTo(canvasx, canvasy);
            angleDirection = (rotn === "CW") ? sAngle + Math.PI / 2 : sAngle - Math.PI / 2;
            reference = _positionateText(angleDirection, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("90°", reference[0], reference[1]);
            canvasx = e.dygraph.toDomXCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.cos(sAngle + 3 * Math.PI / 2));
            canvasy = e.dygraph.toDomYCoord((e.dygraph.maxRadiusSize_ * 1.03) * Math.sin(sAngle + 3 * Math.PI / 2));
            ctx.lineTo(canvasx, canvasy);
            angleDirection = (rotn === "CW") ? sAngle + 3 * Math.PI / 2 : sAngle - 3 * Math.PI / 2;
            reference = _positionateText(angleDirection, e.dygraph.maxRadiusSize_, e.dygraph);
            ctx.fillText("270°", reference[0], reference[1]);
            ctx.strokeStyle = rotuleColor;
            ctx.stroke();
            ctx.closePath();

            if (annotations) {
                // Se grafican los diferentes puntos con etiquetas de cambio de rpm
                for (i = 0; i < annotations.length; i += 1) {
                    if (annotations[i]) {
                        ctx.beginPath();
                        ctx.fillStyle = "#FF0000";
                        canvasx = e.dygraph.toDomXCoord(annotations[i].x);
                        canvasy = e.dygraph.toDomYCoord(annotations[i].y);
                        ctx.arc(canvasx, canvasy, 2, 0, 2 * Math.PI, false);
                        ctx.fill();
                        ctx.closePath();
                    }
                }

                // Se grafica el High Spot del Shaft (punto de inicio)
                ctx.beginPath();
                ctx.fillStyle = "#000000";
                ctx.arc(e.points[0].canvasx, e.points[0].canvasy, 2, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.closePath();
            }
        }

        // Graficar los puntos del polar
        plotter.prototype.smoothPlotter(e, smoothing);
        //ctx.beginPath();
        //ctx.lineWidth = 1;
        //ctx.moveTo(e.points[0].canvasx, e.points[0].canvasy);
        //for (i = 1; i < e.points.length; i += 1) {
        //    ctx.lineTo(e.points[i].canvasx, e.points[i].canvasy);
        //}
        //ctx.strokeStyle = e.color;
        //ctx.stroke();
        //ctx.closePath();
    };

    plotter.prototype.drawCompPolar = function (e, annotations, compensed) {
        var
            // Variable que contiene el contexto 2D del canvas
            ctx,
            canvasx,
            canvasy,
            i;

        // Inicializar variables
        ctx = e.drawingContext;

        if (!compensed) {
            return;
        }

        if (annotations) {
            // Se grafican los diferentes puntos con etiquetas de cambio de rpm
            for (i = 0; i < annotations.length; i += 1) {
                if (annotations[i]) {
                    ctx.beginPath();
                    ctx.fillStyle = "#000000";
                    //canvasx = e.dygraph.toDomXCoord(annotations[i].x - e.dygraph.dataCompensed_[i][0]);
                    //canvasy = e.dygraph.toDomYCoord(annotations[i].y - e.dygraph.dataCompensed_[i][1]);
                    //ctx.arc(canvasx, canvasy, 2, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }

        // Graficar los puntos compensados del polar
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(e.points[0].canvasx, e.points[0].canvasy);
        for (i = 1; i < e.points.length; i += 1) {
            ctx.lineTo(e.points[i].canvasx, e.points[i].canvasy);
        }
        ctx.strokeStyle = e.color;
        ctx.stroke();
        ctx.closePath();
    };

    _positionateText = function (angle, rMax, dygraph) {
        var
            reference,
            xval,
            yval;

        reference = ((angle < 0) ? angle + 2 * Math.PI : angle) * 180 / Math.PI;
        reference = Math.round(reference) % 360;
        if (reference < 90) {
            xval = dygraph.toDomXCoord((rMax * 1.06) * Math.cos(angle));
            yval = dygraph.toDomYCoord((rMax * 1.03) * Math.sin(angle));
        } else if (reference < 180) {
            xval = dygraph.toDomXCoord((rMax * 1.18) * Math.cos(angle));
            yval = dygraph.toDomYCoord((rMax * 1.04) * Math.sin(angle));
        } else if (reference < 270) {
            xval = dygraph.toDomXCoord((rMax * 1.2) * Math.cos(angle));
            yval = dygraph.toDomYCoord((rMax * 1.12) * Math.sin(angle));
        } else {
            xval = dygraph.toDomXCoord((rMax * 1.06) * Math.cos(angle));
            yval = dygraph.toDomYCoord((rMax * 1.12) * Math.sin(angle));
        }

        if ((reference >= 85 && reference <= 95) || (reference >= 265 && reference <= 275)) {
            xval -= 6;
        }

        return [xval, yval];
    }

    plotter.prototype.drawRotationDirection = function (e, side, shaftRotation) {
        // Graficamos solo una vez el sentido de giro
        if (e.seriesIndex !== 0) return;

        var
            // Variable que contiene el contexto 2D del canvas
            ctx,
            // Radio de la circunferencia interna interna al cuadrado
            radius,
            sx,
            sy,
            // Angulo inicial del arco indicativo de sentido de giro
            sAngle,
            // Angulo final del arco indicativo de sentido de giro
            eAngle,
            // Tamaño de la punta de flecha
            arrowSize,
            // Base del triangulo
            base,
            // Punto inicial del sentido de giro
            sPoint,
            // Punto final del sentido de giro
            ePoint,
            // Angulo en el cual se posiciona la punta de flecha para el sentido de giro
            arrowAngle;

        // Inicializamos las variables
        ctx = e.drawingContext;
        radius = e.plotArea.w / 2;
        sx = e.plotArea.x + e.plotArea.w / 2;
        sy = e.plotArea.y + e.plotArea.w / 2 + 1;
        sAngle = (shaftRotation == "CCW") ? 229 * Math.PI / 180 : 317 * Math.PI / 180;
        eAngle = (shaftRotation == "CCW") ? 222 * Math.PI / 180 : 310 * Math.PI / 180;
        arrowSize = 10;
        base = arrowSize / 2;
        sPoint = xyOnArc(sx, sy, radius * 1.25, (shaftRotation == "CCW") ? sAngle : eAngle);
        ePoint = xyOnArc(sx, sy, radius * 1.25, (shaftRotation == "CCW") ? eAngle : sAngle);
        arrowAngle = Math.atan2(sPoint.x - ePoint.x, sPoint.y - ePoint.y);
        arrowAngle += (shaftRotation == "CCW") ? 0 : Math.PI;

        // Grafica el arco indicativo de sentido de giro
        ctx.beginPath();
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.lineWidth = 1;
        ctx.arc(sx, sy, radius * 1.25, eAngle, sAngle);
        ctx.stroke();
        ctx.closePath();

        // Grafica la punta de flecha para el sentido de giro
        ctx.beginPath();
        ctx.translate(ePoint.x, ePoint.y);
        ctx.rotate(arrowAngle);
        ctx.translate(-base, -base);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 1 * arrowSize);
        ctx.lineTo(1 * arrowSize, 1 * base);
        ctx.fill();
        ctx.translate(base, base);
        ctx.rotate(-arrowAngle);
        ctx.translate(-ePoint.x, -ePoint.y);
        ctx.closePath();
    };

    plotter.prototype.drawSensorPositions = function (e, thetaA, thetaB, rotn, xColor, yColor) {
        var
            // Variable que contiene el contexto 2D del canvas
            ctx,
            radius,
            thetaA,
            xIni,
            yIni,
            maxWidth,
            sensorA,
            sensorB,
            a,
            b,
            i;

        // Inicializamos las variables
        ctx = e.drawingContext;
        radius = 9;
        maxWidth = e.plotArea.x + e.plotArea.w;
        sensorA = {};
        sensorB = {};
        xColor = (xColor) ? xColor : "#C68E17";
        yColor = (yColor) ? yColor : "#8D38C9";

        xIni = e.plotArea.x + e.plotArea.w / 2;
        yIni = e.plotArea.y + e.plotArea.w / 2;
        thetaA = ((rotn === "CW") ? Number(thetaA) + 45 : -Number(thetaA) + 45);
        thetaA *= Math.PI / 180;
        thetaB = ((rotn === "CW") ? Number(thetaB) + 45 : -Number(thetaB) + 45);
        thetaB *= Math.PI / 180;

        a = (Math.cos(thetaA) == 0) ? 0 : Number((Math.pow(Math.cos(thetaA), 3) / Math.abs(Math.cos(thetaA))).toFixed(2));
        b = (Math.sin(thetaA) == 0) ? 0 : Number((Math.pow(Math.sin(thetaA), 3) / Math.abs(Math.sin(thetaA))).toFixed(2));
        sensorA.x = e.plotArea.w * 0.5 * (a - b);
        sensorA.x += (sensorA.x > 0) ? (xIni + radius / 2) : (xIni - radius / 2);
        sensorA.x = (sensorA.x >= maxWidth) ? maxWidth - radius : sensorA.x;
        sensorA.x = (thetaA >= Math.PI / 2 && thetaA <= Math.PI) ? sensorA.x + radius / 2 : sensorA.x;
        sensorA.y = -e.plotArea.w * 0.5 * (a + b) + (yIni);
        a = (Math.cos(thetaB) == 0) ? 0 : Number((Math.pow(Math.cos(thetaB), 3) / Math.abs(Math.cos(thetaB))).toFixed(2));
        b = (Math.sin(thetaB) == 0) ? 0 : Number((Math.pow(Math.sin(thetaB), 3) / Math.abs(Math.sin(thetaB))).toFixed(2));
        sensorB.x = e.plotArea.w * 0.5 * (a - b);
        sensorB.x += (sensorB.x > 0) ? (xIni + radius / 2) : (xIni - radius / 2);
        sensorB.x = (sensorB.x >= maxWidth) ? maxWidth - radius : sensorB.x;
        sensorB.x = (thetaB >= Math.PI / 2 && thetaB <= Math.PI) ? sensorB.x + radius / 2 : sensorB.x;
        sensorB.y = -e.plotArea.w * 0.5 * (a + b) + (yIni);
        
        ctx.fillStyle = xColor;
        ctx.beginPath();
        ctx.fillRect(sensorA.x, sensorA.y, radius, radius);
        ctx.closePath();

        ctx.fillStyle = yColor;
        ctx.beginPath();
        ctx.fillRect(sensorB.x, sensorB.y, radius, radius);
        ctx.closePath();
    };

    plotter.prototype.smoothPlotter = function (e, smoothing) {
        var
            ctx,
            points,
            lastRightX,
            lastRightY,
            isOK,
            i,
            p0,
            p1,
            p2,
            controls;

        ctx = e.drawingContext;
        points = e.points;
        ctx.beginPath();
        ctx.moveTo(points[0].canvasx, points[0].canvasy);
        // Punto de control a la derecha para el punto anterior
        lastRightX = points[0].canvasx;
        lastRightY = points[0].canvasy;
        isOK = Dygraph.isOK;  // es decir, no es (null, undefined, NaN)
        for (i = 1; i < points.length; i += 1) {
            p0 = points[i - 1];
            p1 = points[i];
            p2 = points[i + 1];
            p0 = p0 && isOK(p0.canvasy) ? p0 : null;
            p1 = p1 && isOK(p1.canvasy) ? p1 : null;
            p2 = p2 && isOK(p2.canvasy) ? p2 : null;
            if (p0 && p1) {
                controls = _getControlPoints(
                    { x: p0.canvasx, y: p0.canvasy },
                    { x: p1.canvasx, y: p1.canvasy },
                    p2 && { x: p2.canvasx, y: p2.canvasy },
                    smoothing);
                lastRightX = (lastRightX !== null) ? lastRightX : p0.canvasx;
                lastRightY = (lastRightY !== null) ? lastRightY : p0.canvasy;
                ctx.bezierCurveTo(
                    lastRightX, lastRightY,
                    controls[0], controls[1],
                    p1.canvasx, p1.canvasy);
                lastRightX = controls[2];
                lastRightY = controls[3];
            } else if (p1) {
                // Empezando de nuevo despues de un punto faltante
                ctx.moveTo(p1.canvasx, p1.canvasy);
                lastRightX = p1.canvasx;
                lastRightY = p1.canvasy;
            } else {
                lastRightX = lastRightY = null;
            }
        }
        ctx.strokeStyle = e.color;
        ctx.stroke();
    };

    /*
     * Dado tres puntos secuenciales, p0, p1 y p2, encuentre los puntos de control de izquierda a derecha para p1.
     * Se espera que los tres puntos tengan propiedades X,Y
     * Si opt_alpha=0, entonces ambos puntos de control seran los mismos que p1 (es decir, sin suavizado)
     */
    _getControlPoints = function (p0, p1, p2, opt_alpha, opt_allowFalseExtrema) {
        var alpha = (opt_alpha !== undefined) ? opt_alpha : 1 / 3;
        var allowFalseExtrema = opt_allowFalseExtrema || false;

        if (!p2) {
            return [p1.x, p1.y, null, null];
        }

        // Step 1: Position the control points along each line segment.
        var l1x = (1 - alpha) * p1.x + alpha * p0.x,
            l1y = (1 - alpha) * p1.y + alpha * p0.y,
            r1x = (1 - alpha) * p1.x + alpha * p2.x,
            r1y = (1 - alpha) * p1.y + alpha * p2.y;

        // Step 2: shift the points up so that p1 is on the l1â€“r1 line.
        if (l1x != r1x) {
            // This can be derived w/ some basic algebra.
            var deltaY = p1.y - r1y - (p1.x - r1x) * (l1y - r1y) / (l1x - r1x);
            l1y += deltaY;
            r1y += deltaY;
        }

        // Step 3: correct to avoid false extrema.
        if (!allowFalseExtrema) {
            if (l1y > p0.y && l1y > p1.y) {
                l1y = Math.max(p0.y, p1.y);
                r1y = 2 * p1.y - l1y;
            } else if (l1y < p0.y && l1y < p1.y) {
                l1y = Math.min(p0.y, p1.y);
                r1y = 2 * p1.y - l1y;
            }

            if (r1y > p1.y && r1y > p2.y) {
                r1y = Math.max(p1.y, p2.y);
                l1y = 2 * p1.y - r1y;
            } else if (r1y < p1.y && r1y < p2.y) {
                r1y = Math.min(p1.y, p2.y);
                l1y = 2 * p1.y - r1y;
            }
        }

        return [l1x, l1y, r1x, r1y];
    }

    /*
     * Realiza la construccion de barras con una sola serie.
     * @param {Object} e Referencia al chart.
     */
    plotter.prototype.barChartPlotter = function (e, statusColorList) {
        var
            ctx,
            points,
            yBottom,
            minSeparation,
            currentSeparation,
            barWidth,
            i, j;

        ctx = e.drawingContext;
        points = e.points;
        yBottom = e.dygraph.toDomYCoord(0);

        // Determinar el ancho de las barras, basado en la separacion maxima entre barras.
        minSeparation = e.dygraph.canvas_.width;
        for (i = 1; i < points.length; i += 1) {
            currentSeparation = points[i].canvasx - points[i - 1].canvasx;
            if (currentSeparation < minSeparation) {
                minSeparation = currentSeparation;
            }
        }
        
        barWidth = Math.floor(2.0 / 3 * minSeparation);

        // Recorremos cada uno de los puntos y los graficamos como una barra
        for (i = 0; i < points.length; i += 1) {
            ctx.fillStyle = statusColorList[i];
            ctx.strokeStyle = statusColorList[i];
            ctx.fillRect(points[i].canvasx - barWidth / 2, points[i].canvasy, barWidth, yBottom - points[i].canvasy);
            ctx.strokeRect(points[i].canvasx - barWidth / 2, points[i].canvasy, barWidth, yBottom - points[i].canvasy);
        }
    }

    plotter.prototype.drawReverse = function (e) {
        var
            // Variable que contiene el contexto 2D del canvas
            ctx,
            i;

        // Inicializamos las variables
        ctx = e.drawingContext;

        // Grafica los puntos
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(e.points[0].canvasx, e.points[0].canvasy);
        for (i = 1; i < e.points.length; i += 1) {
            ctx.lineTo(e.points[i].canvasx, e.points[i].canvasy);
        }
    };

    return plotter;

})();
