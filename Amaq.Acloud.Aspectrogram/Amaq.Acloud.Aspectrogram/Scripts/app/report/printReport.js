/*
 * PrintReport.js
 * con la librería jsPDF, se selecciona lo que está en el dashboard para imprimir en PDF 
 */

var PrintReport = {};

PrintReport = function () {
    "use strict";

    /*
     * Constructor.
     */
    PrintReport = function () {

        var
            //containerDashboard
            _contDashboard,
            //containerId Dashboard
            _contIdDashboard,
            //width Container Dashboard
            _widthContDashboard,
            //height Container Dashboard
            _heightContDashboard,
            //cantidad Páginas
            _qtyPages = 1,
            //Width en pixeles de cada página
            _widthMaxPage = 650,
            //Height en pixeles de cada página
            _heightMaxPage = 950,
            //Array con datos de las imágenes del reporte
            _dataImgReporte = [],
            //Array con datos de los textos del reporte
            _dataImgTxtReporte = [],
            _topDashboard,
            _leftDashboard,
            _maxHeight = 0,
            _contSize,
            _imgViewer3d,
            _imgWaterfall3d,
            _imgReportExport,
            _calculatePages,
            _createPDFReport,
            _orderByTop,
            _sortObject,
            _assemblePDF,
            _calculateTextSizeObj,
            _getImagesTextDahsboard,
            _createDialogPreview,
            _calculatePages;


        _contIdDashboard = "awContainer";
        _contDashboard = $("#" + _contIdDashboard);


        var scope = this;

        _getImagesTextDahsboard = function () {
           
            var idCont, topCont, leftCont, arrayImg, top, left, src, width, height, text;
            _topDashboard = _contDashboard.offset().top;
            _leftDashboard = _contDashboard.offset().left;
            
            _dataImgTxtReporte = [];

            //_dataImgReporte = {src: src, top: top, left: left, width: width, height: height}
            for (var i = 0; i < globalsReport.elemDygraph.length; i++) {
                idCont = globalsReport.elemDygraph[i].id;
                src = globalsReport.elemDygraph[i].src;
                topCont = $("#" + idCont).offset().top;
                top = topCont - _topDashboard;
                leftCont = $("#" + idCont).offset().left;
                left = leftCont - _leftDashboard;
                width = $("#" + idCont).width();
                height = $("#" + idCont).height();

                _dataImgTxtReporte.push({
                    id: globalsReport.elemDygraph[i].id,
                    src: src,
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    type: "img"
                });
            }

            for (var i = 0; i < globalsReport.elem3D.length; i++) {
                idCont = "containerParent-" + globalsReport.elem3D[i].id;
                src = globalsReport.elem3D[i].src;
                topCont = $("#" + idCont).offset().top;
                top = topCont - _topDashboard;
                leftCont = $("#" + idCont).offset().left;
                left = leftCont - _leftDashboard;
                width = $("#" + idCont).width();
                height = $("#" + idCont).height();

                _dataImgTxtReporte.push({
                    id: globalsReport.elem3D[i].id,
                    src: src,
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    type: "img"
                });
            }

            var fontSize;

            for (var i = 0; i < globalsReport.elemTxt.length; i++) {
                idCont = globalsReport.elemTxt[i].id;

                if ($("#" + idCont).text() == "") {
                    text = $("#" + idCont).val();
                }
                if ($("#" + idCont).val() == undefined) {
                    text = $("#" + idCont).text();
                }
                //text = $("#" + idCont).text();
                //text = globalsReport.elemTxt[i].text;
                topCont = $("#" + idCont).offset().top;
                leftCont = $("#" + idCont).offset().left;
                fontSize = $("#" + idCont).css("font-size");
                fontSize = fontSize.match(/\d/g);
                fontSize = fontSize.join("");
                fontSize = parseInt(fontSize);

                _dataImgTxtReporte.push({
                    id: globalsReport.elemTxt[i].id,
                    text: text,
                    fontSize: fontSize,
                    fontStyle: $("#" + idCont).css("font-style"),
                    fontWeight: $("#" + idCont).css("font-weight"),
                    textAlign: $("#" + idCont).css("text-align"),
                    top: topCont - _topDashboard,
                    left: leftCont - _leftDashboard,
                    width: $("#" + idCont).width(),
                    height: $("#" + idCont).height(),
                    type: "txt"
                });
            }

        };

        _orderByTop = function () {

            var orderTopImgTxt = [];
            var idData = "";

            for (var i = 0; i < _dataImgTxtReporte.length; i++) {
                idData = _dataImgTxtReporte[i].id;
                orderTopImgTxt.push({
                    [idData]: _dataImgTxtReporte[i].top
                });
            }

            _dataImgTxtReporte.sort(function (obj1, obj2) {
                // Ascending: first age less than the previous
                return obj1.top - obj2.top;
            });


        };

        _calculatePages = function () {

            var contGeneral = $("#awContainer");

            _widthContDashboard = contGeneral.width();
            _contSize = _widthMaxPage / (_widthContDashboard * 3.779527559);
            var acumulateHeight = 0;

            for (var i = 0; i < _dataImgTxtReporte.length; i++) {
            
                if (i > 0) {
                    if (_dataImgTxtReporte[i].top == _dataImgTxtReporte[i - 1].top) {
                        _dataImgTxtReporte[i].page = _qtyPages;
                        _dataImgTxtReporte[i].pageTop = _dataImgTxtReporte[i - 1].pageTop;
                    }
                    else {
                        if (_dataImgTxtReporte[i].height * _contSize + acumulateHeight > _heightMaxPage / 3.779527559) {
                            _qtyPages++;
                            _dataImgTxtReporte[i].page = _qtyPages;
                            _dataImgTxtReporte[i].pageTop = 0;
                            acumulateHeight = _dataImgTxtReporte[i].height * _contSize + 20;
                        }
                        else {
                            
                            _dataImgTxtReporte[i].page = _qtyPages;
                            _dataImgTxtReporte[i].pageTop = acumulateHeight + 20;
                            acumulateHeight = _dataImgTxtReporte[i].height * _contSize + acumulateHeight + 5;
                        }
                    }
                } else {
                    _dataImgTxtReporte[i].page = _qtyPages;
                    _dataImgTxtReporte[i].pageTop = 0;
                    acumulateHeight = _dataImgTxtReporte[i].height * _contSize;
                }
                

                _dataImgTxtReporte[i].left = _dataImgTxtReporte[i].left * _contSize;
                _dataImgTxtReporte[i].width = _dataImgTxtReporte[i].width * _contSize;
                _dataImgTxtReporte[i].height = _dataImgTxtReporte[i].height * _contSize;
                
            }

        };

        _assemblePDF = function () {

            var countPages = 1, iniXY = 20, arrayText;
            var src, text, left, top, width, height, fontSize, fontStyle, fontWeight, textAlign, fontType, fontFamily, topHeader;

            docReportPDF = new jsPDF();
 

            for (var i = 0; i < _dataImgTxtReporte.length; i++) {

                if (_dataImgTxtReporte[i].page != countPages) {
                    docReportPDF.addPage();
                    countPages++;
                }

                left = _dataImgTxtReporte[i].left + iniXY;
                top = _dataImgTxtReporte[i].pageTop + iniXY;
                width = _dataImgTxtReporte[i].width;
                height = _dataImgTxtReporte[i].height;

                if (_dataImgTxtReporte[i].type === "img") {
                    src = _dataImgTxtReporte[i].src;
                    docReportPDF.addImage(src, 'JPEG', left, top, width, height)
                }
                else if (_dataImgTxtReporte[i].type === "txt") {

                    text = _dataImgTxtReporte[i].text;
                    fontSize = _dataImgTxtReporte[i].fontSize;
                    fontStyle = _dataImgTxtReporte[i].fontStyle;
                    fontWeight = _dataImgTxtReporte[i].fontWeight;
                    textAlign = _dataImgTxtReporte[i].textAlign;
                    fontFamily = "arial";
                    width =  _dataImgTxtReporte[i].width;

                    if (fontWeight == "400" && fontStyle == "normal") {
                        fontType = "normal";
                    }
                    else if (fontWeight == "bold" && fontStyle == "normal") {
                        fontType = "bold";
                    }
                    else if (fontWeight == "bold" && fontStyle == "italic") {
                        fontType = "bolditalic";
                    }

                    docReportPDF.setFont(fontFamily);
                    docReportPDF.setFontType(fontType);
                    docReportPDF.setFontSize(fontSize * 0.55);
                    docReportPDF.setTextColor(0, 0, 0);

                    var widthStr, difWidthSize, sizeStr;

                    if (i == 0) {
                        topHeader = 5;
                    } else {
                        topHeader = 0;
                    }

                    if (textAlign == "center") {
                        arrayText = [];
                        arrayText = _calculateTextSizeObj(text, width, fontFamily, fontSize);
                        for (var j = 0; j < arrayText.length; j++) {

                            sizeStr = $.fn.textWidth(arrayText[j], fontSize + 'px ' + fontFamily);
                            difWidthSize = (width - sizeStr / 3.779527559) / 2;
                            docReportPDF.text(left + difWidthSize, top + (j + 1) * fontSize * 0.75 * 0.5 + topHeader, arrayText[j]);
                        }
                    } else if (textAlign == "justify") {
                        arrayText = [];
                        arrayText = _calculateTextSizeObj(text, width, fontFamily, fontSize);
                        for (var j = 0; j < arrayText.length; j++) {
                            docReportPDF.text(left, top + (j + 1) * fontSize * 0.75 * 0.5  , arrayText[j]);
                        }
                    }                   
                }
            }          
        };

        _calculateTextSizeObj = function (text, width, fontFamily, fontSize) {

            var arrayText = [], textAlt, sizeStr, widthPixels, qtyLines, lettersText = "", sizeLettersTxt;

            widthPixels = width * 3.7795275592 * 1.35;
            textAlt = text.split(/\n+/);

            for (var i = 0; i < textAlt.length; i++) {
                sizeStr = $.fn.textWidth(textAlt[i], fontSize + 'px ' + fontFamily);
                
                qtyLines = Math.ceil(sizeStr / widthPixels);

                if (qtyLines > 1) {
                    for (var j = 0; j < textAlt[i].length; j++) {
                        lettersText = lettersText + textAlt[i][j];
                        sizeLettersTxt = $.fn.textWidth(lettersText, fontSize  + 'px ' + fontFamily);

                        if (sizeLettersTxt > widthPixels && j != textAlt[i].length - 1) {
                            if (textAlt[i][j + 1] != " ") {
                                lettersText = lettersText + "-";
                            } 

                            arrayText.push(lettersText);
                            lettersText = "";
                        }
                        if (j == textAlt[i].length - 1) {
                            arrayText.push(lettersText);
                            lettersText = "";
                        }
                    }
                }
                else {
                    arrayText.push(textAlt[i]);
                }
            }

            if (textAlt.length == 1) {
                sizeStr = $.fn.textWidth(textAlt[0], fontSize + 'px ' + fontFamily);
                qtyLines = Math.ceil(sizeStr / widthPixels);
                if (qtyLines == 1) {
                    arrayText = textAlt;
                }
            }


            return arrayText;
        };

        this.loadDataToGlobalsReport = function () {

            var width, height, idContGraph, src, image, id3d, wId;
            var contGeneral = $("#awContainer");
            var contImg, contCanvas;


            for (var i = 0; i < globalsReport.elemDygraph.length; i++) {
                //if (globalsReport.elemDygraph[i].obj != null) {
                    idContGraph = globalsReport.elemDygraph[i].id;
                    width = $("#" + idContGraph).width();
                    height = $("#" + idContGraph).height();
                    contGeneral.append('<img id="imgToDygraph" width="' + width + 'px" height="' + height + 'px" style="display:none;"/>');
                    contImg = document.getElementById("imgToDygraph");

                    _imgReportExport = new ImageExport(globalsReport.elemDygraph[i].obj);
                    globalsReport.elemDygraph[i].src = _imgReportExport.asDataURL();
                    // Dygraph.Export.asPNG(globalsReport.elemDygraph[i].obj, contImg);
                    //globalsReport.elemDygraph[i].src = contImg.src.replace('image/png', 'image/octet-stream');
                    // globalsReport.elemDygraph[i].obj = null;
                    contImg.remove();
               // }
            }

            
            for (var j = 0; j < globalsReport.elem3D.length; j++) {

                wId = "-" + globalsReport.elem3D[j].id.split("-")[1];
                id3d = globalsReport.elem3D[j].id.split("-")[0];
                if (globalsReport.elem3D[j].type === "Viewer" && viewer3d.canvas[globalsReport.elem3D[j].id]) {
                    //id3d = viewer3d.canvas[globalsReport.elem3D[j].id;
                    _imgViewer3d = new ImgViewer3d(id3d, wId);
                    _imgViewer3d.flagSaveUrlReport = true;
                    _imgViewer3d.saveImage();
                } else if (globalsReport.elem3D[j].type === "Waterfall" && cascade3d.canvas[globalsReport.elem3D[j].id]) {
                    _imgWaterfall3d = new ImgWaterfall3d(id3d, "", wId, false);
                    _imgWaterfall3d.flagSaveUrlReport = true;
                    _imgWaterfall3d.saveImage();
                } else if (globalsReport.elem3D[j].type === "FullSpecWaterfall" && fullSpecCascade3d.canvas[globalsReport.elem3D[j].id]) {
                    _imgWaterfall3d = new ImgWaterfall3d(id3d, "", wId, true);
                    _imgWaterfall3d.flagSaveUrlReport = true;
                    _imgWaterfall3d.saveImage();
                }
            }
            
            _getImagesTextDahsboard();
            _orderByTop();
            _calculatePages();
            _assemblePDF();
           // localStorage.setItem("infoReport", JSON.stringify(globalsReport));
        };

        this.createDialogPreview = function () {
            /*$("#awContainer").append('<div id="dialogPDFPreview" width="500" height="500" style=""></div>');
            $("#dialogPDFPreview").ejDialog({
                title: "Vista Previa REPORTE",
                width: 800,
                height: 900,
                minWidth: 310,
                minHeight: 215,
                enableModal: true,
                close: function () {
                    $("#dialogPDFPreview_wrapper").remove();
                    $("#previewReport").show();
                },
            });

            $("#dialogPDFPreview").append('<iframe width="750" height=950" id="preview-pane" ></iframe>');*/

            scope.loadDataToGlobalsReport();
            /*
            $("#dialogPDFPreview").append('<button id="btnRefreshPDF">Refrescar</button>')
           
            $("#dialogPDFPreview").on("click", function () {
                _getImagesTextDahsboard();
                _orderByTop();
                _calculatePages();
                _assemblePDF();
                var string = docReportPDF.output('datauristring');
                $('#preview-pane').attr('src', string);
            });*/

            //var string = docReportPDF.output('datauristring');
            //$('#preview-pane').attr('src', string);
            var blob = docReportPDF.output("blob");
            window.open(URL.createObjectURL(blob), "_blank");

            /*
            _getImagesTextDahsboard();
            _orderByTop();
            _calculatePages();
            _assemblePDF();*/
        };

        this.savePDFReport = function () {
            scope.loadDataToGlobalsReport();
            _getImagesTextDahsboard();
            _orderByTop();
            _calculatePages();
            _assemblePDF();
            docReportPDF.save('reporte.pdf');
        };

    };
    return PrintReport;
}();
