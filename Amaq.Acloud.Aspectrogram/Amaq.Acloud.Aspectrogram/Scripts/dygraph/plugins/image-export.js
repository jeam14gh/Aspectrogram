/*
 * @license
 * Lo llame ImageExport porque en un futuro puede contener mas formatos diferentes a PNG (talvez!)
 * Copyright 2016 Jorge Calderon (jorgenhoc@gmail.com)
 */

/*global Dygraph:false */

var ImageExport = {};

ImageExport = (function () {

    "use strict";

    /*
     * Constructor
     * @param {Object} dygraph Referencia a la grafica que se desea exportar como imagen
     * @param {Object} customAttrs Atributos personalizados del usuario para el estilo de la imagen final
     * @param {String} name Nombre deseado para exportar la imagen
     */
    ImageExport = function (dygraph, name, userOptions) {
        var
            _defaultAttrs,
            _dygraph,
            _name,
            _userOptions,
            _this,
            _asCanvas,
            _createCanvas,
            _drawPlot,
            _getPlugin,
            _putLabel,
            // Altura del selector de rango
            _rangeHeight,
            _putVerticalLabelY1,
            _putVerticalLabelY2,
            _putText,
            _drawLegend,
            _putLabelAnnotation,
            _putTextAnnotation,
            _drawHeaderInfo;

        _dygraph = dygraph;
        _name = name || "";
        _userOptions = userOptions;
        _this = this;
        _rangeHeight = 0;

        _defaultAttrs = {
            // Color de fondo en la imagen
            backgroundColor: "transparent",
            // Tipo de letra y color del texto que se muestra en la parte superior del chart (titulo)
            titleFont: "bold 18px serif",
            titleFontColor: "black",
            // Tipo de letra y color del texto que se muestra en la parte inferior del eje X y a la izquierda del eje Y
            axisLabelFont: "bold 14px serif",
            axisLabelFontColor: "black",
            // Tipo de letra y color del texto en las etiquetas de los ejes
            labelFont: "normal 12px serif",
            labelFontColor: "black",
            // Tipo de letra y color del texto en las descripciones de cada una de las series
            legendFont: "bold 12px serif",
            legendFontColor: "black",
            // Posicion por defecto para los label verticales
            vLabelLeft: 20,
            // Altura del area que contiene todas las descripciones de cada una de las series
            legendHeight: 20,
            legendMargin: 20,
            lineHeight: 30,
            maxlabelsWidth: 0,
            labelTopMargin: 35,
            magicNumbertop: 8
        };

        this.isSupported = function () {
            try {
                var
                    canvas,
                    ctx;
                canvas = _createCanvas();
                ctx = canvas.getContext("2d");
                return (!!canvas.toDataURL && !!ctx.fillText);
            } catch (e) {
                console.log("El navegador no soporta la creación de elementos canvas.");
            }
            return false;
        };

        this.asDataURL = function () {
            var
                dygraph,
                userOptions,
                canvas,
                src;

            dygraph = _dygraph;
            userOptions = _userOptions;
            canvas = _asCanvas(dygraph, userOptions);
            return canvas.toDataURL();
        };

        this.asPNG = function () {
            var
                src,
                imgData,
                arraybuffer,
                view,
                i,
                blob,
                builder;
            src = _this.asDataURL();
            imgData = atob(src.split(",")[1]);
            arraybuffer = new ArrayBuffer(imgData.length);
            view = new Uint8Array(arraybuffer);
            for (i = 0; i < imgData.length; i += 1) {
                view[i] = imgData.charCodeAt(i) & 0xff;
            }
            try {
                // Metodo recomendado
                blob = new Blob([arraybuffer], { type: "application/octet-stream" });
            } catch (e) {
                // La API BlobBuilder ha sido desaprobado en favor de Blob, sin embargo navegadores antiguos desconocen el constructor Blob.
                // IE10 soporta BlobBuilder, pero dado que el constructor de Blob tambien funciona, no hay necesidad de agregar MSBlobBuilder.
                builder = new (window.WebKitBlobBuilder || window.MozBlobBuilder);
                builder.append(arraybuffer);
                blob = builder.getBlob("application/octet-stream");
            }
            _name += formatDate(new Date()).split(" ")[1].split(".")[0] + ".png";
            saveAs(blob, _name);
        };

        _asCanvas = function (dygraph, userOptions) {
            var
                options,
                // Factores de ajuste del chart + Alto del DIV de encabezado
                factorSize,
                canvas;

            options = {};
            factorSize = {};
            canvas = _createCanvas();
            Dygraph.update(options, _defaultAttrs);
            Dygraph.update(options, userOptions);
            // Alto y ancho de la grafica en pixeles (referencia el DIV parent)
            factorSize.headerHeight = $(dygraph.maindiv_).parent().children()[0].clientHeight;
            canvas.width = dygraph.canvas_.width;
            canvas.height = dygraph.canvas_.height + factorSize.headerHeight;
            factorSize.horizontal = (canvas.width / dygraph.width_);
            factorSize.vertical = (dygraph.canvas_.height / dygraph.height_);
            // Dibujamos lo sobre el canvas la grafica incluyendo ejes y labels
            _drawPlot(canvas, dygraph, options, factorSize);
            // Dibujamos los legends
            //_drawLegend(canvas, dygraph, options, factorSize);
            // Dibujamos la informacion en el encabezado de la grafica
            _drawHeaderInfo(canvas, dygraph, options, factorSize);
            return canvas;
        };

        _createCanvas = function () {
            var
                canvas,
                isIE;
            canvas = document.createElement("canvas");
            isIE = (/MSIE/.test(navigator.userAgent) && !window.opera);
            if (isIE && (typeof (G_vmlCanvasManager) !== undefined)) {
                canvas = G_vmlCanvasManager.initElement(canvas);
            }
            return canvas;
        };

        _drawPlot = function (canvas, dygraph, options, factorSize) {
            var
                // Contexto del canvas
                ctx,
                // Referencia al canvas que tiene la grafica (el "hidden" es el que tiene todos los puntos)
                hiddenCanvas,
                // Contador
                i,
                // Informacion correspondiente al plugin de selector de rango
                rangePlugin,
                // Informacion correspondiente al plugin de ejes
                axesPlugin,
                // Informacion correspondiente al plugin de labels
                labelsPlugin,
                // Informacion correspondiente al plugin de anotaciones
                annotationPlugin,
                // Color de la anotacion
                annotationColor;

            // Obtenemos el contexto del canvas sobre el cual vamos a dibujar
            ctx = canvas.getContext("2d");
            // Agregamos el background definido por el usuario como un rectangulo de ese color
            ctx.fillStyle = options.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            // Obtenemos la grafica "hidden" del chart y lo dibujamos como una imagen sobre el contexto
            hiddenCanvas = dygraph.hidden_;
            ctx.drawImage(hiddenCanvas, 0, factorSize.headerHeight);
            // Obtenemos la informacion de los ejes a traves de plugin Axes Plugin
            axesPlugin = _getPlugin(dygraph, "Axes Plugin");
            if (axesPlugin) {
                axesPlugin = axesPlugin.plugin;
                // Eje X
                for (i = 0; i < axesPlugin.xlabels_.length; i += 1) {
                    _putLabel(ctx, axesPlugin.xlabels_[i], options, options.labelFont, options.labelFontColor, factorSize);
                }
                // Eje Y
                for (i = 0; i < axesPlugin.ylabels_.length; i += 1) {
                    _putLabel(ctx, axesPlugin.ylabels_[i], options, options.labelFont, options.labelFontColor, factorSize);
                }
            }
            labelsPlugin = _getPlugin(dygraph, "ChartLabels Plugin");
            if (labelsPlugin) {
                labelsPlugin = labelsPlugin.plugin;
                // Obtenemos la informacion del selector de rango (caso exista, se resta la altura de este al la posicion "top" del xLabel)
                rangePlugin = _getPlugin(dygraph, "RangeSelector Plugin");
                if (rangePlugin) {
                    rangePlugin = rangePlugin.plugin;
                    _rangeHeight = (rangePlugin.fgcanvas_) ? rangePlugin.fgcanvas_.height : 0;
                }
                // Titulo
                _putLabel(ctx, labelsPlugin.title_div_, options, options.titleFont, options.titleFontColor, factorSize);
                // Label X
                if (labelsPlugin.xlabel_div_) {
                    labelsPlugin.xlabel_div_.style.width = canvas.width.toString() + "px";
                    _putLabel(ctx, labelsPlugin.xlabel_div_, options, options.axisLabelFont, options.axisLabelFontColor, factorSize, _rangeHeight);
                }
                // Label Y1
                _putVerticalLabelY1(ctx, labelsPlugin.ylabel_div_, options, options.axisLabelFont, options.axisLabelFontColor, "center", factorSize);
                // Label Y2
                _putVerticalLabelY2(ctx, labelsPlugin.y2label_div_, options, options.axisLabelFont, options.axisLabelFontColor, "center", factorSize);
            }
            annotationPlugin = _getPlugin(dygraph, "Annotations Plugin");
            if (annotationPlugin) {
                annotationPlugin = annotationPlugin.plugin;
                annotationColor = "#FF0000";
                for (i = 0; i < annotationPlugin.annotations_.length; i += 1) {
                    _putLabelAnnotation(ctx, annotationPlugin.annotations_[i], options, options.labelFont, annotationColor, factorSize);
                }
            }
        };

        /*
         * Obtiene un plugin basado en el valor retornado por su propio metodo toString
         * @param {Object} dygraph
         * @param {String} name Nombre del plugin a buscar
         */
        _getPlugin = function (dygraph, name) {
            for (var i = 0; i < dygraph.plugins_.length; i += 1) {
                if (dygraph.plugins_[i].plugin.toString() == name) {
                    return dygraph.plugins_[i];
                }
            }
            return null;
        };

        _putLabel = function (ctx, divLabel, options, font, color, factorSize, rangeHeight) {
            if (!divLabel || !divLabel.style) {
                return;
            }

            var
                top,
                left,
                bottom,
                width,
                height;

            top = parseInt(divLabel.style.top, 10) * factorSize.vertical + factorSize.headerHeight;
            if (rangeHeight) {
                top -= rangeHeight;
            }
            left = parseInt(divLabel.style.left, 10) * factorSize.horizontal + 10;
            if (!divLabel.style.top.length) {
                bottom = parseInt(divLabel.style.bottom, 10);
                height = parseInt(divLabel.style.height, 10);
                top = ctx.canvas.height - options.legendHeight - bottom - height;
            }
            // FIXME: Remover este numero 'magico' necesario para obtener la linea de altura
            top = top + options.magicNumbertop;
            // Ancho
            width = parseInt(divLabel.style.width, 10);
            switch (divLabel.style.textAlign) {
                case "center":
                    left = left + Math.ceil(width / 2);
                    break;
                case "right":
                    left = left + width;
                    break;
                default:
                    break;
            }
            _putText(ctx, left, top, divLabel, font, color);
        };

        _putVerticalLabelY1 = function (ctx, divLabel, options, font, color, textAlign, factorSize) {
            if (!divLabel) {
                return;
            }

            var
                top,
                left,
                text,
                textDim;

            top = parseInt(divLabel.style.top, 10) - factorSize.headerHeight;
            left = parseInt(divLabel.style.left, 10) + parseInt(divLabel.style.width, 10) / 2;
            text = divLabel.innerText || divLabel.textContent;

            // FIXME: El valor de la propiedad 'left' es frecuentemente 0, usada la opcion.
            if (!left) {
                left = options.vLabelLeft;
            }

            if (textAlign == "center") {
                textDim = ctx.measureText(text);
                top = Math.ceil((ctx.canvas.height - textDim.width) / 2 + textDim.width) - factorSize.headerHeight;
            }

            ctx.save();
            ctx.translate(0, ctx.canvas.height);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = color;
            ctx.font = font;
            ctx.textAlign = textAlign;
            ctx.fillText(text, top, left);
            ctx.restore();
        };

        _putVerticalLabelY2 = function (ctx, divLabel, options, font, color, textAlign, factorSize) {
            if (!divLabel) {
                return;
            }

            var
                top,
                right,
                text;

            top = parseInt(divLabel.style.top, 10) - factorSize.headerHeight;
            right = parseInt(divLabel.style.right, 10) + parseInt(divLabel.style.width, 10) * 2;
            text = divLabel.innerText || divLabel.textContent;

            if (textAlign == "center") {
                top = Math.ceil(ctx.canvas.height / 2) - factorSize.headerHeight;
            }

            ctx.save();
            ctx.translate(parseInt(divLabel.style.width, 10), 0);
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = color;
            ctx.font = font;
            ctx.textAlign = textAlign;
            ctx.fillText(text, top, right - ctx.canvas.width);
            ctx.restore();
        };

        _putText = function (ctx, left, top, divLabel, font, color) {
            var
                textAlign,
                text;
            textAlign = divLabel.style.textAlign || "left";
            text = divLabel.innerText || divLabel.textContent;
            ctx.fillStyle = color;
            ctx.font = font;
            ctx.textAlign = textAlign;
            ctx.textBaseline = "middle";
            ctx.fillText(text, left, top);
        };

        _drawLegend = function (canvas, dygraph, options, factorSize) {
            var
                // Contexto sobre el cual se dibujara en el canvas
                ctx,
                // Margen superior de la grafica
                labelTopMargin,
                // Margen entre labels
                labelMargin,
                // Colores de las series
                colors,
                labelsDescrip,
                // Labels que representan a cada una de las series en la grafica
                labels,
                // Ancho de los labels
                labelsWidth,
                // Contador
                i,
                labelsX,
                labelsY,
                labelVisibility,
                usedColorCount;

            ctx = canvas.getContext("2d");
            labelsWidth = 0;
            labelTopMargin = 10;
            labelMargin = 5;
            colors = dygraph.getColors();
            // Eliminamos el primer label, ya que este representa la dimension de tiempo en la grafica
            labels = dygraph.attr_("labels").slice(1);
            for (i = 0; i < labels.length; i += 1) {
                labels[i] = "- " + labels[i];
                labelsWidth += (ctx.measureText(labels[i]).width + labelMargin) * factorSize.horizontal;
            }
            // Adicionamos un texto al comienzo de los labels que indique "Series: "
            labelsDescrip = "Series: ";
            labelsWidth += (ctx.measureText(labelsDescrip).width + labelMargin) * factorSize.horizontal;
            // Calculamos las posiciones X y Y de inicio para los labels (incluyendo prelabels)
            labelsX = Math.floor((canvas.width - labelsWidth) / 2);
            labelsY = canvas.height - options.legendHeight + labelTopMargin - _rangeHeight;
            labelVisibility = dygraph.attr_("visibility");
            ctx.font = options.legendFont;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            ctx.fillText(labelsDescrip, labelsX, labelsY);
            labelsX += ctx.measureText(labelsDescrip).width + labelMargin;
            usedColorCount = 0;
            for (i = 0; i < labels.length; i += 1) {
                if (labelVisibility[i]) {
                    ctx.fillStyle = colors[usedColorCount];
                    ctx.fillText(labels[i], labelsX, labelsY);
                    usedColorCount += 1;
                    labelsX += ctx.measureText(labels[i]).width + labelMargin;
                }
            }
        };

        _putLabelAnnotation = function (ctx, divLabel, options, font, color, factorSize) {
            if (!divLabel) {
                return;
            }

            if (!divLabel.style && divLabel.div) {
                divLabel = divLabel.div;
            }

            var
                top,
                left,
                bottom,
                width,
                height;

            top = parseFloat(divLabel.style.top) * factorSize.vertical + factorSize.headerHeight;
            left = parseFloat(divLabel.style.left) * factorSize.horizontal;
            if (!divLabel.style.top.length) {
                bottom = parseFloat(divLabel.style.bottom);
                height = parseFloat(divLabel.style.height);
                top = ctx.canvas.height - bottom - height;
            }
            width = parseFloat(divLabel.offsetWidth || divLabel.style.width);
            height = parseFloat(divLabel.offsetHeight || divLabel.style.height);
            _putTextAnnotation(ctx, left, top, width, height, divLabel, font, color);
        };

        _putTextAnnotation = function (ctx, left, top, width, height, divLabel, font, color) {
            if (!divLabel.style && divLabel.div) {
                divLabel = divLabel.div;
            }
            var
                textAlign,
                text;

            textAlign = divLabel.style.textAlign || "center";
            text = divLabel.innerText || divLabel.textContent;

            ctx.beginPath();
            ctx.rect(left, top, width, height);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = color;
            ctx.font = font;
            ctx.textAlign = textAlign;
            ctx.textBaseline = "bottom";
            ctx.fillText(text, left + width / 2, top + height);
            ctx.lineWidth = 1;
            ctx.strokeStyle = color;
            ctx.stroke();
        };

        _drawHeaderInfo = function (canvas, dygraph, options, factorSize) {
            var
                // Contexto sobre el cual se dibujara en el canvas
                ctx,
                text,
                headerList,
                i;

            ctx = canvas.getContext("2d");
            headerList = $(dygraph.maindiv_).parent().children().eq(0).children();
            ctx.font = $(headerList[0]).css("font");
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "black";
            text = headerList[0].innerText || headerList[0].textContent;
            text += headerList[1].innerText || headerList[1].textContent;
            ctx.fillText(text, 15, 12);
            for (i = 2; i < headerList.length; i += 1) {
                text = headerList[i].innerText || headerList[i].textContent;
                ctx.font = $(headerList[i]).css("font");
                ctx.fillText(text, 15, 13 * i);
            }
        };
    };

    return ImageExport;
})();
