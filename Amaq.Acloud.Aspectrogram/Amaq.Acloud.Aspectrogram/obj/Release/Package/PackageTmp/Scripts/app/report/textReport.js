/*
 * TextReport.js
 * crea un Widget con un textArea y proporciones predeterminadas
 */

var TextReport = {};

TextReport = function () {
    "use strict";

    /*
     * Constructor.
     */
    TextReport = function (width, height, aspectRatio, flagHeader) {

        var
            // Contenedor HTML del input Text area
            _container,
            // Contenedor HTML del input Text area
            _container,
            // Referencia a AspectrogramWidget
            _aWidget,
            // Bandera que determina habilita o deshabilita el draggable del grid
            _movableGrid = false,
            // Referencia al Id del widget
            _widgetId = Math.floor(Math.random() * 100000),
            _srcImages,
            _fontSize,
            _createTextMenu,
            _createTextArea,
            _createHeader;



        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "textAreaInput" + Math.floor(Math.random() * 100000);
        _container.style.width = "100%";
        _container.style.height = "100%";




        var scope = this;

        _createTextArea = function () {
            var fontSize = 11;
            var textAlign = "justify";
            var fontWeight = "normal";
            var fontStyle = "normal";

            var container = $("#" + _container.id);

            container.addClass("headerReportClass");
            

            var textArea = $('<textarea autofocus id="child-'  + _container.id + '" style="height: 100%; width: 100%; font-size: ' + fontSize + 'px; text-align: ' + textAlign + '; font-weight: ' + fontWeight + '; padding-top: 15px;" />');
            container.append(textArea);

            globalsReport.elemTxt.push({
                id: 'child-' + _container.id,
                text: $("#child-" + _container.id).text(),
                fontSize: fontSize,
                textAlign: textAlign,
                fontWeight: fontWeight,
                fontStyle: fontStyle
            });
        };

        _createHeader = function () {
            var parentId, parentName, nodeName, pathName;
            var fontSize = 22;
            var textAlign = "center";
            var fontWeight = "bold";
            var fontStyle = "normal";

            globalsReport.elemTxt

            nodeName = selectedTreeNode.Name;
            parentId = selectedTreeNode.ParentId;

            if (parentId == "") {
                pathName = nodeName;
            }
            else {
                for (var i = 0; i < treeObj.model.fields.dataSource.length; i++) {
                    if (treeObj.model.fields.dataSource[i].Id == parentId) {
                        parentName = treeObj.model.fields.dataSource[i].Name;
                    }
                }
                pathName = parentName + " - " + nodeName;                
            }
            
            var container = $("#" + _container.id);

            container.addClass("headerReportClass");
            var textArea = $('<textarea  autofocus id="child-' + _container.id + '" style="height: 100%; width: 100%; font-size: ' + fontSize + 'px; text-align: ' + textAlign + '; font-weight: ' + fontWeight + '; padding-top: 20px;" />');
            textArea.val(pathName);
            container.append(textArea);



            globalsReport.elemTxt.push({
                id: 'child-' + _container.id,
                text: $("#child-" + _container.id).text(),
                fontSize: fontSize,
                textAlign: textAlign,
                fontWeight: fontWeight,
                fontStyle: fontStyle
            });
          
        };

        var _fontSize = [8, 10, 11, 12, 14, 16, 20, 22];

        _srcImages = "../Content/images/report/";

        var _elemMenu = [
            {
                name: "fontSize",
                type: "dropDown",
                elements: _fontSize
            },
            {
                name: "bold",
                type: "icon",
                img: "Bold"
            },
            {
                name: "italic",
                type: "icon",
                img: "Italic"
            },
            {
                name: "center",
                type: "icon",
                img: "AlignCenter"
            },
            {
                name: "justify",
                type: "icon",
                img: "Justify"
            }
        ];

        _createTextMenu = function () {
            var container = $("#" + _container.id);
            var btnSelected, value, flagEnter = false;

            container.append('<div id="menuTxt' + _widgetId + '" style="top: 0px; left:0px; position: absolute; display: inline-block; border-"></div>');
            $("#menuTxt" + _widgetId).addClass("textMenuReport");
            //$("#menuTxt" + _widgetId).
            for (var i = 0; i < _elemMenu.length; i++) {
                if (_elemMenu[i].type == "icon") {
                    $("#menuTxt" + _widgetId).append('<div id="menuTxt'  + "-" + _widgetId + "-" + _elemMenu[i].name + '" style="display: inline-block; position: relative;"><img src="' + _srcImages + _elemMenu[i].img + '.png" width="15px" height="15px" class="btnMenuViewer3d"/></div>');
                    $("#menuTxt" + "-" + _widgetId + "-" + _elemMenu[i].name).click(function (args) {
                        $("#menuTxt" + _widgetId).show();
                        btnSelected = args.currentTarget.id.split("-")[2];
                        switch (btnSelected) {
                            case "bold":
                                if ($("#child-" + _container.id).css("font-weight") == "bold") {
                                    $("#child-" + _container.id).css({ "font-weight": "400" });
                                } else {
                                    $("#child-" + _container.id).css({ "font-weight": "bold" });
                                } break;
                            case "italic":
                                if ($("#child-" + _container.id).css("font-style") == "italic") {
                                    $("#child-" + _container.id).css({ "font-style": "normal" });
                                } else {
                                    $("#child-" + _container.id).css({ "font-style": "italic" });
                                } break;
                            case "center":
                                $("#child-" + _container.id).css({ "text-align": "center" });
                                break;
                            case "justify":
                                $("#child-" + _container.id).css({ "text-align": "justify" });
                                break;
                        }
                    });
                } else if (_elemMenu[i].type == "dropDown") {
                    $("#menuTxt" + _widgetId).append('<select id="menuTxt' + _elemMenu[i].name + "-" + _widgetId + '" style="margin: 4px; height: 15px;">')
                    for (var j = 0; j < _elemMenu[i].elements.length; j++) {
                        $("#menuTxt" + _elemMenu[i].name + "-" + _widgetId).append('<option value="' + _elemMenu[i].elements[j] + '">' + _elemMenu[i].elements[j] + "px " + '</option>');
                    }

                    $("#menuTxt" + _elemMenu[i].name + "-" + _widgetId).click(function (args) {
                        value = args.currentTarget.value + "px";
                        $("#child-" + _container.id).css({ "font-size": value });
                    });
                }
               
            }

            $("#menuTxt" + _widgetId).hide();

            $("#child-" + _container.id).on("focus", function () {
                $("#menuTxt" + _widgetId).show();
            });

            $("#child-" + _container.id).on("focusout", function () {
                if (flagEnter == false) {
                    $("#menuTxt" + _widgetId).hide();
                }
            });

            container.on("mouseenter", function () {
                flagEnter = true;
            });
            container.on("mouseleave", function () {
                flagEnter = false;
            });
        };



        this.Show = function () {

            var autoPosition, settingsMenu;

            if (flagHeader) {
                autoPosition = false;
            } else {
                autoPosition = true;
            }

            // Agregamos los items al menu de opciones para la grafica
            settingsMenu = [];
            /*
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Puntos de medición...", "measurementPointsMenuItem"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Filtro...", "filterMenuItem"));
            settingsMenu.push(AspectrogramWidget.createSettingsMenuElement("item", "Exportar imagen", "saveImageLive" + _widgetId));
            */


            /*
             * Creamos la referencia al AspectrogramWidget.
             */
            _aWidget = new AspectrogramWidget({
                widgetId: _widgetId,
                parentId: "awContainer",
                content: _container,
                title: "Texto",
                width: width,
                height: height,
                minHeight: 1,
                autoPosition: autoPosition,
                aspectRatio: aspectRatio,
                pause: false,
                //onSettingsMenuItemClick: _onSettingsMenuItemClick, // Callback de evento click sobre un item del menú de opciones
                onClose: function () {
                    scope.Close();
                },
                onPause: function () {
                    _pause = !_pause;
                },
                onMove: function () {
                    _movableGrid = !_movableGrid;
                    var gridStack = $(".grid-stack").data("gridstack");
                    var grid = $(".grid-stack-item-content[data-id=\"" + _widgetId + "\"]").parent();
                    gridStack.movable(grid, _movableGrid);
                }
                // Abrir AspectrogramWidget.
           
            });

            // Abrir AspectrogramWidget.
            _aWidget.open();

            if (flagHeader) {
                _createHeader();
                globalsReport.flagHeader = true;
                globalsReport.idHeader = _widgetId;
            } else {
                _createTextArea();
               
            }
            /*
            $("#btn_" + _widgetId).on("click", function (args) {
                console.log(args.currentTarget.id);
            });*/
            var container = $("#" + _container.id);
            _createTextMenu();
        };

        this.Close = function () {

            var grid, el;
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();

            if (globalsReport.idHeader === _widgetId) {
                globalsReport.idHeader = "";
                globalsReport.flagHeader = false;
            }

            $.each(globalsReport.elemTxt, function (i) {
                if (globalsReport.elemTxt[i].id === 'child-' + _container.id) {
                    globalsReport.elemTxt.splice(i, 1);
                    return false;
                }
            });
        };

    };
    return TextReport;
}();
