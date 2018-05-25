
(function () {
    // Constructor
    this.AspectrogramWidget = function () {
        // Propiedades publicas
        this.closeButton = null;
        this.moveButton = null;
        this.pauseButton = null;
        this.settingsButton = null;
        this.reloadButton = null;
        this.widget = null;

        var _settingsMenuItemSelector = null; // Selector necesario para enlazar el evento click de los items del menú de opciones

        // Definimos las opciones por defecto
        var defaults = {
            content: "",
            minWidth: 4,
            minHeight: 4,
            title: "",
            asset: "",
            autoPosition: true,
            measurementPointList: [],
            seriesName: [],
            pause: false,
            reload: false, // Opcion de recargar los graficos de tendencia
            settingsMenu: null, // Menú de opciones de la gráfica. Array de objetos SettingsMenuElement
            graphType: "", // Tipo de grafica
            timeMode: null,
            asdaqId: null, // Id del asdaq al cual están asociadas las subVariables para la gráfica. SOLO APLICA PARA TIEMPO REAL
            atrId: null, // Id del atr al cual están asociadas las subVariables para la gráfica. SOLO APLICA PARA TIEMPO REAL
            subVariableIdList: [], // Listado de Ids de las subVariables necesarias para la grafica
            customContentInTitleBar: "",
            parentWidth: "0%",
            parentHeight: "0%",
        }

        // Crea las opciones al extender los valores por defecto con los valores de opciones pasados por argumento
        if (arguments[0] && typeof arguments[0] === "object") {
            this.options = extendDefaults(defaults, arguments[0]);
        } else {
            this.options = defaults;
        }
    };

    // Metodos publicos

    /*
     * Gestiona la eliminacion del listado de subvariables subscritas para consulta y la eliminacion del widget
     */
    AspectrogramWidget.prototype.close = function () {
        var _this = this;
        if (this.options.onClose) {
            // Desencadenar evento onClose, este es pasado como un callback en el constructor de AspectrogramWidget
            this.options.onClose();
        }
        _manageCache(this.options.timeMode, this.options.graphType, this.options.subVariableIdList, "delete", this.options.asdaqId, this.options.atrId);
        // Elimina el widget
        $(_this.widget).remove();
    };

    /*
     * Gestiona la creacion del widget y su contenido
     */
    AspectrogramWidget.prototype.open = function () {
        buildWidget.call(this);
        initializeEvents.call(this);
    };

    AspectrogramWidget.prototype.manageCache = function (subVariableIdList, action) {
        // Actualizar la lista de subVariableId de la grafica actual por la lista especificada, solo si action == "update"
        if (action == "update") {
            this.options.subVariableIdList = $.extend(true, [], subVariableIdList);
        }
        _manageCache(this.options.timeMode, this.options.graphType, subVariableIdList, action, this.options.asdaqId, this.options.atrId);
    };

    /*
     * Muestra el texto especificado inmediatamente despues del título de la ventana
     * @param {String} text Cadena de texto que se desea mostrar
     */
    AspectrogramWidget.prototype.setTextAfterTitle = function (text) {
        $("#textAfterTitle" + this.options.widgetId).text(text);
    };

    /*
     * Crea elementos para el menú de opciones de un AspectrogramWidget
     * @param {String} type Indica el tipo de elemento de menú que se va a crear. Los posibles valores son ('item', 'submenu', 'divider')
     * @param {String} text Cadena de texto que se muestra al usuario como opción de menú
     * @param {String} name Nombre único con el cual se va a identificar la opción de menú en el event handler especificado en el constructor de AspectrogramWidget
     * @param {Array} children Array de objetos SettingsMenuElement, solo aplica para type 'submenu'
     */
    AspectrogramWidget.createSettingsMenuElement = function (type, text, name, children) {
        if (!type) {
            throw new Error('parametro type indefinido');
        }

        if (type != 'divider') {
            if (!text) {
                throw new Error('parametro text requerido');
            }

            if (!name && (type == 'submenu' || type == 'item')) {
                throw new Error('parametro name requerido');
            }
        }

        return {
            type: type, 
            text: text || null,
            name: name || null,
            children: children || null
        };
    }

    // Metodos privados

   /*
    * Gestiona cambios en la cache de subVariable RT
    * @param {Array} subVariables Array de objetos de tipo subVariable que se van a manejar en cache RT
    * @param {String} graphType Tipo de grafico Aspectrogram("signal", "orbit", "bar", etc...)
    */
    var _updateCacheRT = function (subVariableIdList, graphType, action, asdaqId, atrId) {
        var
            // Banderas
            exist, asdaqExist, atrExist,
            // Contadores
            i, j, k, r, s;

        exist = false;
        for (i = 0; i < subVariableIdList.length; i += 1) {
            for (j = 0; j < subVariableRTList.length; j += 1) {
                if (subVariableRTList[j].id == subVariableIdList[i]) {
                    if (action == "update") {
                        subVariableRTList[j].linkedGraphs.push(graphType);
                        exist = true;
                    }
                    else { // action == "delete"
                        for (k = 0; k < subVariableRTList[j].linkedGraphs.length; k += 1) {
                            if (subVariableRTList[j].linkedGraphs[k] == graphType) {
                                subVariableRTList[j].linkedGraphs.splice(k, 1); // Eliminar
                                break;//return;
                            }
                        }

                        if (subVariableRTList[j].linkedGraphs.length == 0) {
                            subVariableRTList.splice(j, 1); // Eliminar

                            // Buscar asdaq
                            for (r = 0; r < realTimeRequestsByAsdaqList.length; r++) {
                                if (realTimeRequestsByAsdaqList[r].AsdaqId == asdaqId) {
                                    // Buscar id de subVariable
                                    for (s = 0; s < realTimeRequestsByAsdaqList[r].SubVariableIdList.length; s++) {
                                        if (realTimeRequestsByAsdaqList[r].SubVariableIdList[s] == subVariableIdList[i]) {
                                            realTimeRequestsByAsdaqList[r].SubVariableIdList.splice(s, 1); // Eliminar id de subVariable
                                            break;
                                        }
                                    }

                                    if (realTimeRequestsByAsdaqList[r].SubVariableIdList.length == 0) {
                                        realTimeRequestsByAsdaqList.splice(r, 1); // Eliminar asdaq de la lista
                                    }

                                    break;
                                }
                            }

                            // Buscar atr
                            for (r = 0; r < realTimeRequestsByAtrList.length; r++) {
                                if (realTimeRequestsByAtrList[r].AtrId == atrId) {
                                    // Buscar id de subVariable
                                    for (s = 0; s < realTimeRequestsByAtrList[r].SubVariableIdList.length; s++) {
                                        if (realTimeRequestsByAtrList[r].SubVariableIdList[s] == subVariableIdList[i]) {
                                            realTimeRequestsByAtrList[r].SubVariableIdList.splice(s, 1); // Eliminar id de subVariable
                                            break;
                                        }
                                    }

                                    if (realTimeRequestsByAtrList[r].SubVariableIdList.length == 0) {
                                        realTimeRequestsByAtrList.splice(r, 1); // Eliminar atr de la lista
                                    }

                                    break;
                                }
                            }
                        }
                    }

                    break;
                }
            }

            if (!exist && action == "update") {
                subVariableRTList.push({ id: subVariableIdList[i], linkedGraphs: [graphType] });

                var realTimeRequestsByAsdaq = { AsdaqId: asdaqId, SubVariableIdList: [] };
                asdaqExist = false;

                // Buscar asdaq
                for (var r = 0; r < realTimeRequestsByAsdaqList.length; r++) {
                    if (realTimeRequestsByAsdaqList[r].AsdaqId == asdaqId) {
                        realTimeRequestsByAsdaq = realTimeRequestsByAsdaqList[r];
                        asdaqExist = true;
                        break;
                    }
                }

                if (!asdaqExist) {
                    realTimeRequestsByAsdaqList.push(realTimeRequestsByAsdaq); // Agregar asdaq a la lista
                }

                // agregar id de subVariable a la lista de solicitudes tiempo real para el atr especificado
                realTimeRequestsByAsdaq.SubVariableIdList.push(subVariableIdList[i]);

                var realTimeRequestsByAtr = { AtrId: atrId, SubVariableIdList: [] };
                atrExist = false;

                // Buscar atr
                for (var r = 0; r < realTimeRequestsByAtrList.length; r++) {
                    if (realTimeRequestsByAtrList[r].AtrId == atrId) {
                        realTimeRequestsByAtr = realTimeRequestsByAtrList[r];
                        atrExist = true;
                        break;
                    }
                }

                if (!atrExist) 
                    realTimeRequestsByAtrList.push(realTimeRequestsByAtr); // Agregar atr la lista

                // agregar id de subVariable a la lista de solicitudes tiempo real para el atr especificado
                realTimeRequestsByAtr.SubVariableIdList.push(subVariableIdList[i]);
            }
            exist = false;
        }
    };

   /*
    * Gestiona los objetos en caché necesarios para el Aspectrogram graph que se va a crear
    */
    var _manageCache = function (timeMode, graphType, subVariableIdList, action, asdaqId, atrId) {
        switch (timeMode) {
            case 0: // Tiempo Real
                _updateCacheRT(subVariableIdList, graphType, action, asdaqId, atrId);
                break;
        }
    };

    var _createSettingsMenu = function (settingsMenuElements, widgetId) {
        var
            iterateSettingsMenuElements,
            mainCreated,
            settingsMenuContainer;

        _settingsMenuItemSelector = "#menu_" + widgetId + " .settingsMenuItem";
        mainCreated = false;
        settingsMenuContainer = $("<div id=\"menu_" + widgetId + "\" class=\"dropdown aw-menu-container\"></div>");

        iterateSettingsMenuElements = function (childs, text) {
            var
                c,
                settingsMenuHTML,
                settingsMenuObject;

            if (!mainCreated) {
                settingsMenuHTML = $("<ul class=\"dropdown-menu aw-menu\" role=\"menu\" aria-labelledby=\"btn_" + widgetId + "\" style=\"position: relative !important;\"></ul>");
                settingsMenuObject = settingsMenuHTML;
                mainCreated = true;
            }
            else {
                settingsMenuHTML = $("<li style=\"width:100%;\" class=\"small dropdown-submenu pull-left\"></li>");
                settingsMenuHTML.append("<a role=\"menuitem\" tabindex=\"-1\" href=\"#\">" + text + "</a>");
                settingsMenuObject = $("<ul class=\"dropdown-menu aw-menu aw-scrollable-menu\"></ul>");
                settingsMenuHTML = settingsMenuHTML.append(settingsMenuObject);
            }

            for (c = 0; c < childs.length; c+=1) {
                switch (childs[c].type) {
                    case "submenu":
                        settingsMenuObject.append(iterateSettingsMenuElements(childs[c].children, childs[c].text)) // llamada recursiva
                        break;
                    case "item":
                        settingsMenuObject.append("<li><a href=\"#\" class=\"small settingsMenuItem\" data-value=\"" + childs[c].name + "\" tabIndex=\"-1\">" + childs[c].text + "</a></li>");
                        break;
                    case "divider":
                        settingsMenuObject.append("<li role=\"presentation\" class=\"divider\"></li>");
                        break;
                    default:
                        continue;
                }
            }

            return settingsMenuHTML;
        }

        if (!settingsMenuElements) {
            return;
        }

        if (settingsMenuElements.length == 0) {
            return;
        }
             
        return settingsMenuContainer.append(iterateSettingsMenuElements(settingsMenuElements));
    }

    var _widgetHeader = function (self) {
        var
            header,
            pointList,
            pointTitle,
            tMode,
            i,
            menu,
            moveButtonRightPos;

        moveButtonRightPos = 0;

        self.closeButton = $("<a>", { "class": "btn aw-button" });
        self.closeButton.append($("<i>", { "class": "fa fa-close fa-1x" }));
        $(self.widget).append(self.closeButton);

        self.moveButton = $("<a>", { "class": "btn aw-button aw-move" });
        self.moveButton.append($("<i>", { "class": "fa fa-lock fa-1x" }));
        $(self.widget).append(self.moveButton);

        // Si se especificaron opciones de menú en el constructor de AspectrogramWidget
        if (self.options.settingsMenu) {
            moveButtonRightPos += 25;

            menu = _createSettingsMenu(self.options.settingsMenu, self.options.widgetId); // Crear menú HTML formateado con Bootstrap
            $(self.widget).append(menu); // Agregar menú al AspectrogramWidget

            // Crear botón de menú de opciones y agregarlo al AspectrogramWidget
            self.settingsButton = $("<a>", { "class": "btn aw-button aw-settings dropdown-toggle", "id": "btn_" + self.options.widgetId, "role": "button", "data-toggle": "dropdown", "data-target": "#menu_" + +self.options.widgetId });
            self.settingsButton.append($("<i>", { "class": "fa fa-gear fa-1x" }));
            $(self.widget).append(self.settingsButton);
        }
       
        // Mostrar el boton de pausa, solo si se configuro de esta forma en el widget
        if (self.options.pause) {
            if (self.settingsButton) {
                self.settingsButton.css("right", "50px");
                if (menu) {
                    menu.css("right", "75px");
                }
            }

            moveButtonRightPos += 25;
            self.pauseButton = $("<a>", { "class": "btn aw-button aw-pause" });
            self.pauseButton.append($("<i>", { "class": "fa fa-pause fa-1x" }));
            $(self.widget).append(self.pauseButton);
        }

        // Mostrar el boton de recargar, solo si se configuro de esta forma en el widget
        if (self.options.reload) {
            self.reloadButton = $("<a>", { "class": "btn aw-button aw-reload" });
            self.reloadButton.append($("<i>", { "class": "fa fa-refresh fa-1x" }));
            $(self.widget).append(self.reloadButton);
        }

        if (self.reloadButton !== null) {
            moveButtonRightPos += 25;
            self.reloadButton.css("right", moveButtonRightPos + "px");
        }

        if (self.moveButton) {
            moveButtonRightPos += 25;
            self.moveButton.css("right", moveButtonRightPos + "px");
        }

        header = self.options.content.childNodes[0];
        if (self.options.timeMode == 0) {
            tMode = "Tiempo Real";
        } else if (self.options.timeMode == 1) {
            tMode = "Histórico";
        } else {
            tMode = "";
        }
        $(header).append("<span class=\"aw-title\">" + (tMode == "" ? "" : tMode + ", ") + self.options.title + " : " + self.options.asset + "</span>");
        $(header).append("<span class=\"aw-title\" id=\"{0}\"></span>".JsFormat("textAfterTitle" + self.options.widgetId));
        pointList = self.options.measurementPointList;
        for (i = 0; i < pointList.length; i += 1) {
            // Crea un DIV para cada uno de los puntos de medicion involucrados donde se mostrara el valor de directa y el angulo del sensor
            $(header).append("<div id=\"point" + pointList[i] + self.options.widgetId + "\" class=\"lineBreaking\"><span>&nbsp;</span></div>");
        }
        for (i = 0; i < self.options.seriesName.length; i += 1) {
            $(header).append("<div id=\"" + self.options.seriesName[i] + self.options.widgetId + "\" class=\"aw-serieName\"><span>&nbsp;</span></div>");
        }

        //if (menu) {
            
        //    $(document.body).on('click', '#menu_' + self.options.widgetId + ' .settingsMenuItem', function (event) {
        //        var $target = $(event.currentTarget),
        //            val = $target.attr('data-value');
        //    });
        //}

        //if (menu) {
        //    $('.aw-menu a').on('click', function (event) {
        //        var $target = $(event.currentTarget),
        //            val = $target.attr('data-value'),
        //            $inp = $target.find('input'),
        //            idx;

        //        if ((idx = self.measurementPointVisibility.indexOf(val)) > -1) {
        //            self.measurementPointVisibility.splice(idx, 1);
        //            setTimeout(function () { $inp.prop('checked', false) }, 0);
        //            //$inp.prop('checked', false);
        //        } else {
        //            self.measurementPointVisibility.push(val);
        //            setTimeout(function () { $inp.prop('checked', true) }, 0);
        //            //$inp.prop('checked', true);
        //        }

        //        $target.blur();

        //        return false;
        //    });
        //}
    };

    function buildWidget() {
        // Crea el elemento contenedor del widget
        this.widget = document.createElement("div");
        this.widget.className = "aw-widget";
        this.widget.aspectRatio = this.options.aspectRatio;
        this.widget.style.width = "100%";
        this.widget.style.height = "100%";
        this.widget.style.border = "1px solid black";
        // Crea el header del widget
        _widgetHeader(this);
        $(this.widget).append(this.options.customContentInTitleBar);
        // Agrega el contenedor de la grafica al widget
        $(this.widget).append(this.options.content);
        // Crea el contenor gridstack
        var gridStack = $(".grid-stack").data("gridstack");
        var el = $.parseHTML("<div><div class=\"grid-stack-item-content\" data-id=\"" + this.options.widgetId + "\"/><div/>");
        var gridWidth = this.options.width;
        var gridHeight = this.options.height;
        var autoPosition = this.options.autoPosition;
        // addWidget(el, [x, y, width, height, autoPosition, minWidth, maxWidth, minHeight, maxHeight, id])
        gridStack.addWidget(el, 0, 0, gridWidth, gridHeight, autoPosition, this.options.minWidth, 12, this.options.minHeight, 12);
        // Agrega el widget al contenedor gridstack
        $(".grid-stack-item-content[data-id=\"" + this.options.widgetId + "\"]").append(this.widget);
        //gridStack.resizable($(".grid-stack-item-content[data-id=\"" + this.options.widgetId + "\"]").parent(), false);
        // Gestiona objetos necesarios en cache para el Aspectrogram graph
        _manageCache(this.options.timeMode, this.options.graphType, this.options.subVariableIdList, "update", this.options.asdaqId, this.options.atrId);
    }

    function initializeEvents() {
        if (this.closeButton) {
            this.closeButton.bind("click", this.close.bind(this));
        }

        if (this.moveButton) {
            this.moveButton.bind("click", (function () {
                if (this.options.onMove) {
                    // Desencadenar evento onMove, el cual es pasado como un callback en el constructor de AspectrogramWidget
                    this.options.onMove();
                }

                icon = $(this.moveButton).find("i");
                icon.toggleClass("fa-unlock-alt fa-lock");
            }).bind(this));
        }

        if (this.pauseButton) {
            this.pauseButton.bind("click", (function () {
                if (this.options.onPause) {
                    // Desencadenar evento onPause, este es pasado como un callback en el constructor de AspectrogramWidget
                    this.options.onPause();
                }

                icon = $(this.pauseButton).find("i");
                icon.toggleClass("fa-pause fa-play");
            }).bind(this));
        }

        // Manejador de evento para cuando el usuario presiona click sobre alguna opción del menú
        if (this.settingsButton) {
            $(_settingsMenuItemSelector).bind('click', (function (event) {
                var $target = $(event.currentTarget),
                    val = $target.attr('data-value');

                if (this.options.onSettingsMenuItemClick) {
                    // Desencadenar evento onSettingsMenuClick, este es pasado como un callback en el constructor de AspectrogramWidget
                    this.options.onSettingsMenuItemClick(event);
                }
            }).bind(this));
        }

        if (this.reloadButton) {
            this.reloadButton.bind("click", (function () {
                if (this.options.onReload) {
                    // Desencadenar evento onReload, el cual es pasado como un callback en el constructor de AspectrogramWidget
                    this.options.onReload();
                }
            }).bind(this));
        }
    }

    function extendDefaults(source, properties) {
        var property;
        for (property in properties) {
            if (properties.hasOwnProperty(property)) {
                source[property] = properties[property];
            }
        }
        return source;
    }
}());