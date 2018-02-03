/*
 * treeViewControl.js
 * Gestiona los ajustes de configuracion del arbol.
 * @author Jorge Calderon
 */

/* globals treeObj:true, selectedTreeNode:true, jsonTree, listboxControl, dataManager, ej */

var TreeViewControl = {};
// Variable global _Layout: selectedMeasurementPoint

TreeViewControl = (function () {

    "use strict";

    /*
     * Constructor.
     */
    TreeViewControl = function (nodeId) {
        // Propiedades privadas.
        var
            // Nodos de tipo MdVariables
            _allNodesMdVariables,
            // Intervalo de tiempo (10 segundos) para resolver los estados
            _interval = 10000,
            // Basado en el _interval, a las cuantas veces ya pasaron aproximadamente 20 seg sin recibir datos
            _noDataStatusTimeout = 20 / (_interval / 1000),
            // Auto-referencia a la clase TreeViewControl
            _this,
            // Metodo privado que realiza la sincronizacion de los estados en el navegador con los datos en servidor
            _sincronizeStatusNode,
            // Metodo privado que es invocado cada vez que se selecciona un nodo en el arbol
            _onTreeNodeSelect,
            // Metodo privado que obtiene los nodos hijos de un nodo en especifico
            _retriveNodeChildren,
            // Metodo privado que obtiene la informacion de un nodo especifico
            _getNode,
            // Metodo privado que resuelve los estados de los diferentes nodos en el arbol
            _statusResolve,
            // MdVariables agrupadas por asset
            _allMdVariablesGroups,
            _beforeAssetMenuOpen,
            _beforeMeasurementPointMenuOpen,
            _assetMenuItemClick,
            _measurementPointMenuItemClick,
            _locationMenuItemClick,
            _beforeLocationMenuOpen,
            _loadProperties3d,
            // Nodo seleccionado de tipo ubicación
            _selectedLocation,
            // Crear los Context Menus de Location y Asset
            _createContextMenus, _createContextMenuLocation, _createContextMenu,
            // 
            _poll,
            // Método privado que resuelve y retorna los nodos que apuntan a activos principales
            _getPrincipalAssetNodes,
            // Método privado que setea el estado especificado al nodo especificado y sus hijos de manera recursiva
            _setStatusDescendent,
            _statusByMdVariable,
            // Función para editar un nodo del árbol
            _editTreeNode,
            // Función para cancelar la edición de un nodo del árbol
            _cancelEditTreeNode;

        _this = this;

        /*
         * PUBLIC
         * Busqueda de nodos por nombre.
         */
        this.SearchNodes = function () {
            // Removemos el nodo seleccionado
            treeObj.unselectNode(selectedTreeNode);
            var treeElement, searchVal;

            treeElement = treeObj.element;
            // Obtener la cadena de texto digitada en el input text.
            searchVal = $("#searchBox").val();

            // Verificamos que exista algun texto para realizar la busqueda.
            if (searchVal) {
                treeObj.expandAll();
                searchVal = searchVal.toLowerCase();

                var matchedNode = [], otherNodes = [], p, resultNodes, i, currentNode, parentNode, parentNodeSecond, childrenUl;

                // Buscamos en cada uno de los elementos "a" en el arbol.
                var linkNodes = treeElement.find("ul > li > div > a");
                for (p = 0; p < linkNodes.length; p += 1) {
                    if ($(linkNodes[p]).text().toLowerCase().indexOf(searchVal) !== -1) {
                        // Almacenamos los nodos que coinciden con la busqueda.
                        matchedNode.push(linkNodes[p]);
                    } else {
                        // Almacenamos los nodos que NO coinciden con la busqueda.
                        otherNodes.push(linkNodes[p]);
                    }
                }

                // Encuentra los elementos Li padre de los nodos coincidentes y define Display "block".
                resultNodes = treeElement.find(matchedNode).closest("li").css("display", "block");
                // Encuentra los elementos Li padre de los nodos NO coincidentes y define Display "none".
                treeElement.find(otherNodes).closest("li").css("display", "none");

                // Recorremos los nodos padre coincidentes.
                for (i = 0; i < resultNodes.length; i += 1) {
                    currentNode = $(resultNodes[i]);
                    // Obtenemos los elementos Li padre de los nodos coincidentes y define Display "block".
                    parentNode = currentNode.parents("ul").closest("li").css("display", "block");
                    if (parentNode.length > 0) {
                        // Llamamos la funcion expandNode si el nodo padre tiene hijos.
                        treeObj.expandNode(parentNode);
                        if (treeObj.model.expandedNodes.indexOf($(treeObj._liList).index(parentNode)) === -1) {
                            // Obtenemos los elementos Li padre de los nodos coincidentes y define Display "block".
                            parentNodeSecond = parentNode.parents("ul").closest("li").css("display", "block");
                            if (parentNodeSecond.length > 0) {
                                treeObj.expandNode(parentNodeSecond);
                            }
                        }
                    }

                    childrenUl = currentNode.children("ul");
                    if (childrenUl.length > 0 && childrenUl.children("li:visible").length === 0) {
                        currentNode.children("ul").children("li").css("display", "block");
                        // Llamamos la funcion expandNode si resultNodes[i] tiene hijos.
                        treeObj.expandNode(resultNodes[i]);
                    }
                }
            } else {
                treeElement.find("ul > li").css("display", "block");
                treeObj.collapseAll();
            }
        };

        /*
         * PUBLIC
         * Crea la vista del arbol.
         */
        this.CreateTreeView = function () {
            var dataManager, promise, principalParent, i;
            _allNodesMdVariables = new ej.DataManager(jsonTree).executeLocal(new ej.Query().where("EntityType", "equal", 3, false).select("Id"));

            //Metodo que se ejecuta cada 10 segundos para sincronizar y resolver los estados del arbol
            _sincronizeStatusNode(_allNodesMdVariables, _getNode, _statusResolve, _interval);

            dataManager = new ej.DataManager(jsonTree);
            promise = dataManager.executeLocal(new ej.Query().where("EntityType", "notEqual", 3, false));

            for (i = 0; i < promise.length; i += 1) {
                if (promise[i].EntityType == 2) {
                    promise[i].htmlAttribute = { "data-nodetype": "asset-node" }; // Tipificar los nodos de tipo asset para asociarles menú contextual de opciones
                }
                else {
                    promise[i].htmlAttribute = { "data-nodetype": "location-node" }; // Tipificar los nodos de tipo location
                }
            }

            $("#treeView").ejTreeView({
                allowEditing: true,
                fields: {
                    id: "Id",
                    parentId: "ParentId",
                    text: "Name",
                    hasChild: "HasChild",
                    dataSource: promise,
                    expanded: "Expanded",
                    htmlAttribute: "htmlAttribute" // Propiedad con atributos html personalizados para el elemento <li> que representa el nodo
                },
                template: "#treeTemplate",
                allowKeyboardNavigation: true,
                nodePaste: function (args) {
                    this;
                },
                nodeClick: function (args) {
                    if (selectedTreeNode.EntityType == 2)
                        _selectedEntityType = 2;
                },
                beforeSelect: function (args) {
                    _cancelEditTreeNode();
                },
                beforeExpand: function (args) {
                    _onTreeNodeSelect(args.id);
                },
                nodeSelect: function (args) {
                    _onTreeNodeSelect(args.id);

                    //if (_selectedEntityType == 1) {
                    //    //$("#assetMenu").data("ejMenu").hide();
                    //    //$("#locationMenu").data("ejMenu").show();
                    //    _createContextMenu("locationMenu", "li[data-nodetype='location-node']", _locationMenuItemClick, _beforeLocationMenuOpen, "pasteAssetMenuItem");
                    //}
                    //else if (_selectedEntityType == 2) {
                    //    //$("#locationMenu").data("ejMenu").hide();
                    //    //$("#assetMenu").data("ejMenu").show();
                    //    //$("#locationMenu").ejMenu("destroy");
                    //    _createContextMenu("assetMenu", "li[data-nodetype='asset-node']", _assetMenuItemClick, _beforeAssetMenuOpen, "pasteMenuItem");
                    //}

                    // Ocultamos o no el item "Pegar" del contextMenu de ubicación, dependiendo del EntityType del nodo seleccionado
                    if (copiedNodes.length > 0) {
                        if (typeNode == 2) {
                            $("#locationMenu li#pasteAssetMenuItem").removeClass('disabled');
                            //$("#locationMenu").ejMenu("enableItemByID", "pasteAssetMenuItem");
                        } else if (typeNode == 3) {
                            $("#locationMenu li#pasteAssetMenuItem").addClass('disabled');
                            $("#assetMenu li#pasteMenuItem").removeClass('disabled');
                            //$("#locationMenu").ejMenu("disableItemByID", "pasteAssetMenuItem");
                            //$("#assetMenu").ejMenu("enableItemByID", "pasteMenuItem");
                        }
                    }

                    var node = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("Id", "equal", args.id, false))[0];
                    if (node.EntityType == 2) {
                        _selectedEntityType = 2;

                        var points = ej.DataManager(jsonTree).executeLocal(new ej.Query().where(
                            ej.Predicate("ParentId", "equal", args.id, true).and("EntityType", "equal", 3, true))).length;

                        // Validamos si existen puntos de medición para ver si se muestra el botón de ordenamientos de puntos
                        if (points > 0) {
                            toOrder = false;
                            $("#orderbyPoints").removeClass("hidden");
                            $("#btnToOrderPoints>i").removeClass("fa-check"); // Quitamos el icono (chulo)
                            $("#btnToOrderPoints>i").addClass("fa-list-ol"); // Agregamos el icono (lista)
                            $("#btnCancelOrderPoints").addClass("hidden"); // Ocultamos el icono cancelar (X)
                        } else {
                            $("#orderbyPoints").addClass("hidden");
                        }
                    }
                    else if (node.EntityType == 1) {
                        _selectedEntityType = 1;
                        $("#orderbyPoints").addClass("hidden");
                    }
                },
                nodeAdd: function (args) {
                    $("#locationMenu").ejMenu("destroy");
                    $("#assetMenu").ejMenu("destroy");
                    _createContextMenus();
                },
            });

            $(".treeViewFilter").removeClass("hidden");
            treeObj = $("#treeView").data("ejTreeView");

            // Valida si se crean estos eventos, si el usuario tiene rol de Administrador.
            if (roles.indexOf("Admin") == 0) {
                // Eventos del árbol que no son propios del control Syncfusion                    
                $("#treeView").on({
                    dblclick: function () {
                        _editTreeNode();
                    },
                    copy: function () {
                        if (_selectedEntityType == 2)
                            new AssetAdmin().Copy(selectedTreeNode);
                        else if (_selectedEntityType == 1) {
                            copiedNodes = [];
                            popUp("warning", "No se permite copiar ubicación!");
                        }
                        //else if (_selectedEntityType == 3) {
                        //    if (selectedMdVariable)
                        //        new MeasurementPointAdmin().Copy(selectedMeasurementPoint);
                        //}
                    },
                    paste: function () {
                        if (selectedTreeNode.EntityType == 1)
                            new AssetAdmin().Paste(selectedTreeNode);
                        else if (selectedTreeNode.EntityType == 2)
                            new AssetAdmin().Paste(selectedTreeNode);
                    },
                    keydown: function (e) {
                        if (e.which == 113) { //F2
                            _editTreeNode();
                        }
                        else if (e.which == 27) { // ESC 
                            _cancelEditTreeNode();
                        }
                    }
                });
            }

            //_createContextMenuLocation();
            _createContextMenus();
            //_createContextMenu("locationMenu", "li[data-nodetype='location-node']", _locationMenuItemClick, _beforeLocationMenuOpen, "pasteAssetMenuItem");

            // Menú contextual de opciones de puntos de medición
            $("#measurementPointMenu").ejMenu({
                menuType: ej.MenuType.ContextMenu,
                openOnClick: false,
                contextMenuTarget: "#measurementPoints",
                showArrow: true,
                click: _measurementPointMenuItemClick,
                beforeOpen: _beforeMeasurementPointMenuOpen,
                open: function (args) {
                    var listbox = $('#measurementPoints').data("ejListBox");
                    // Si existe más de un item seleccionado se des-habilitan las opciones de tiempo real, editar y eliminar un punto de medición
                    if (listbox.getSelectedItems().length > 1) {
                        $("li#realTimeMenuItem").addClass('disabled');
                        $("li#editMeasurementPointMenuItem").addClass('disabled');
                        //this.disableItemByID("deleteMeasurementPointMenuItem");
                    }
                    else {
                        $("li#realTimeMenuItem").removeClass("disabled");
                        $("li#editMeasurementPointMenuItem").removeClass("disabled");
                        //this.enableItemByID("deleteMeasurementPointMenuItem");
                    }
                },
            });

            //principalParent = dataManager.executeLocal(new ej.Query().where("ParentId", "equal", "", false));
            principalParent = dataManager.executeLocal(new ej.Query().where(ej.Predicate("ParentId", "equal", "", true).or("ParentId", "equal", null, true)));
            treeObj.expandNode(principalParent[0].Id);
            treeObj.selectNode(principalParent[0].Id);

            // Ocultar indicador de carga
            $("#treeLoadingIndicator").hide();
            $("#treeView.e-treeview-wrap > ul").attr("style", "overflow:visible;");

            // Muestra el icono de ordenar puntos de medición
            //$("#orderbyPoints").removeClass("hidden");
            // Menu contextual en el arbol para eliminar items dentro del mismo
            //_this.RemoveNodeItem();
        };

        _createContextMenus = function () {
            // Menú contextual de opciones de ubicaciones
            $("#locationMenu").ejMenu({
                menuType: ej.MenuType.ContextMenu,
                openOnClick: false,
                contextMenuTarget: "li[data-nodetype='location-node']",
                showArrow: true,
                click: _locationMenuItemClick,
                beforeOpen: _beforeLocationMenuOpen,
                create: function (args) {
                    if (copiedNodes.length == 0) {
                        $("#locationMenu li#pasteAssetMenuItem").addClass('disabled');
                        //$("#locationMenu").ejMenu("disableItemByID", "pasteAssetMenuItem");
                    }
                },
                open: function (args) {
                    //$("#assetMenu").ejMenu("destroy");
                },
            });

            // Menú contextual de opciones de activo
            $("#assetMenu").ejMenu({
                menuType: ej.MenuType.ContextMenu,
                openOnClick: false,
                contextMenuTarget: "li[data-nodetype='asset-node']",
                showArrow: true,
                click: _assetMenuItemClick,
                beforeOpen: _beforeAssetMenuOpen,
                create: function (args) {
                    if (copiedNodes.length == 0) {
                        $("#assetMenu li#pasteMenuItem").addClass('disabled');
                        //$("#assetMenu").ejMenu("disableItemByID", "pasteMenuItem");
                    }
                },
                open: function (args) {
                    //$("#locationMenu").ejMenu("destroy");
                },
            });
        };

        _createContextMenu = function (id, target, fnClick, fnBeforeOpen, item) {
            // Menú contextual de opciones de ubicaciones
            $("#" + id).ejMenu({
                menuType: ej.MenuType.ContextMenu,
                openOnClick: false,
                contextMenuTarget: target,
                showArrow: true,
                click: fnClick,
                beforeOpen: fnBeforeOpen,
                create: function (args) {
                    if (copiedNodes.length == 0) {
                        $("#" + id).ejMenu("disableItemByID", item);
                    }
                },
            });
        };

        //_createContextMenuLocation = function (i) {
        //    // Menú contextual de opciones de ubicaciones
        //    $("#locationMenu").ejMenu({
        //        menuType: ej.MenuType.ContextMenu,
        //        openOnClick: false,
        //        contextMenuTarget: "li[data-nodetype='location-node']",
        //        showArrow: true,
        //        click: _locationMenuItemClick,
        //        beforeOpen: _beforeLocationMenuOpen,
        //        create: function (args) {
        //            if (copiedNodes.length == 0) {
        //                $("#locationMenu").ejMenu("disableItemByID", "pasteAssetMenuItem");
        //            }
        //        }
        //    });
        //};

        /*
         * PRIVATE
         * Resuelve y retorna la lista de nodos que apuntan a activos principales
         */
        _getPrincipalAssetNodes = function () {
            var
                principalAssetNodes, assetNodes;

            principalAssetNodes = [];
            assetNodes = new ej.DataManager(jsonTree).executeLocal(new ej.Query().where("EntityType", "equal", 2, false));

            if (!assetNodes) {
                return [];
            }

            for (var i = 0; i < assetNodes.length; i++) {
                var parent = _getNode(assetNodes[i].ParentId);

                // Si el nodo padre es una ubicación, entonces es un nodo activo principal
                if (parent.EntityType == 1) {
                    principalAssetNodes.push(assetNodes[i]);
                }
            }

            return principalAssetNodes;
        }

        /*
         * PRIVATE
         * Setea el estado especificado al nodo especificado y sus hijos, de manera recursiva.
         */
        _setStatusDescendent = function (node, status) {
            node.Severity = status.Severity;
            node.StatusId = status.Id;
            node.StatusColor = status.Color;

            if (!_statusByMdVariable)
                return;

            // Buscar en response.StatusByMdVariable las que coinciden con parentId=Id y marcarlas con estado sin datos
            for (var j = 0; j < _statusByMdVariable.length; j++) {
                if (_statusByMdVariable[j].ParentId == node.Id) {
                    _statusByMdVariable[j].StatusId = status.Id;
                }
            }

            // Resolver hijos y marcarlos con estado sin datos           
            for (var i = 0; i < jsonTree.length; i++) {
                if (jsonTree[i].ParentId == node.Id) {
                    _setStatusDescendent(jsonTree[i], status);
                }
            }
        }

        /*
         * PRIVATE
         * Sincroniza la informacion del estado de los nodos.
         * De forma constante, cada 10 segundos se consulta la informacion
         * de estados de nodos del servidor y se resuelven los estados.
         */
        _sincronizeStatusNode = function (allNodesMdVariables, getNode, statusResolve, interval) {
            var
                status, isNoDataStatus;

            var principalAssetNodes = _getPrincipalAssetNodes();
            var principalAssetNodeIdList = new ej.DataManager(principalAssetNodes).executeLocal(new ej.Query().select("Id"));

            $.ajax({
                url: "/Home/GetStatusById",
                method: "POST",
                dataType: "json",
                data: {
                    mdVariableIdList: allNodesMdVariables,
                    principalAssetNodeIdList: principalAssetNodeIdList
                },
                success: function (response) {
                    if (response) {
                        response = JSON.parse(response);
                        _statusByMdVariable = response.StatusByMdVariable;

                        // Resolver a partir de los nodos que son activos principales, el estado sin datos y el estado apagado
                        if (response.RTPropertiesByPrincipalAssetNode) {
                            for (var i = 0; i < response.RTPropertiesByPrincipalAssetNode.length; i++) {
                                var node = _getNode(response.RTPropertiesByPrincipalAssetNode[i].Id);

                                if (!node.timeoutCounter) {
                                    node.timeoutCounter = 0;
                                }

                                if (node.timeoutCounter >= _noDataStatusTimeout) {
                                    status = noDataStatus; // Estado sin datos
                                    _setStatusDescendent(node, status); // Setear estado al nodo actual y toda su descendencia de forma recursiva
                                }
                                else if (!response.RTPropertiesByPrincipalAssetNode[i].IsRotating) {
                                    status = machineStoppedStatus; // Estado máquina apagada
                                    _setStatusDescendent(node, status); // Setear estado al nodo actual y toda su descendencia de forma recursiva
                                }

                                if ((node.LastRealTimeModify) && (response.RTPropertiesByPrincipalAssetNode[i].LastRealTimeModify != node.LastRealTimeModify)) {
                                    node.timeoutCounter = 0;
                                }
                                else {
                                    node.timeoutCounter = node.timeoutCounter + 1;
                                }

                                node.LastRealTimeModify = response.RTPropertiesByPrincipalAssetNode[i].LastRealTimeModify;
                            }
                        }

                        if (_statusByMdVariable) {
                            //Nodos de tipo MdVariables agrupados por ParentId
                            _allMdVariablesGroups =
                                new ej.DataManager(_statusByMdVariable).executeLocal(new ej.Query().group("ParentId"));

                            for (var i = 0; i < _allMdVariablesGroups.length; i++) {
                                var parent = getNode(_allMdVariablesGroups[i].key);

                                if (parent)
                                    statusResolve(parent, _allMdVariablesGroups[i].items);
                            }

                            // Resolver estados en el listbox de puntos de medición
                            if (selectedAsset) {
                                for (var i = 0; i < _allMdVariablesGroups.length; i++) {
                                    if (selectedAsset.Id == _allMdVariablesGroups[i].key) {
                                        ListboxControl.ResolveMeasurementPointsStatus(_allMdVariablesGroups[i].items);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                },
                error: function (jqXHR, textStatus) {
                    popUp("error", "Error al resolver los estados del árbol");
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                },
                complete: function () {
                    for (var i = 0; i < jsonTree.length; i++) {
                        if (jsonTree[i].StatusColor) {
                            if ((!jsonTree[i].LastStatusColor) || (jsonTree[i].LastStatusColor != jsonTree[i].StatusColor)) {
                                jsonTree[i].LastStatusColor = jsonTree[i].StatusColor;

                                //Cambio de color de cada Node
                                $("#" + jsonTree[i].Id + " > div > a.e-text > div > span:nth-child(1)").attr("style",
                                    "background-color: transparent; color:" + jsonTree[i].StatusColor + "; padding: 2px;");
                            }
                        }

                        //Seteo de la propiedad Severity de cada node para resolver de nuevo su estado
                        jsonTree[i].Severity = 0;
                    }
                    setTimeout(function () {
                        _sincronizeStatusNode(allNodesMdVariables, getNode, statusResolve, interval);
                    }, interval);
                }
            });
        };

        /*
         * PRIVATE
         * Dispara las diferentes acciones para cuando se selecciona un nodo en el arbol.
         * @param {String} selectedNodeId Id del nodo seleccionado.
         */
        _onTreeNodeSelect = function (selectedNodeId) {
            var i;
            // Si el nodo ya esta previamente seleccionado no hacer nada (no repetir el proceso para el mismo nodo)
            if (selectedNodeId !== selectedTreeNode.Id) {
                var dataManager = new ej.DataManager(jsonTree);
                selectedTreeNode = dataManager.executeLocal(new ej.Query().where("Id", "equal", selectedNodeId, false))[0];

                // Si es un Asset, consultar las MdVariable
                if (selectedTreeNode.EntityType == 2) {
                    var measurementPointsWithStatus = null;

                    if (_allMdVariablesGroups) {
                        // Resolver estados en el listbox de puntos de medición
                        for (i = 0; i < _allMdVariablesGroups.length; i += 1) {
                            if (selectedTreeNode.Id == _allMdVariablesGroups[i].key) {
                                measurementPointsWithStatus = _allMdVariablesGroups[i].items;
                                break;
                            }
                        }
                    }

                    listboxControl.CreateListbox(selectedTreeNode, measurementPointsWithStatus);
                    // Contador que ayuda a cargar la vista resumen de activos a partir de una ubicación
                    _loadedListbox += 1;
                } else {
                    selectedAsset = null;
                    selectedMdVariable = null;
                }


                //loadMeshesNodeSel
            }
        };

        /*
         * PRIVATE
         * Obtiene los nodos hijos...
         * @param {String} id
         * @param {Array} promise
         */
        _retriveNodeChildren = function (id, idList) {
            var
                // Listado de hijos segun el NodeId como parametro
                children,
                // Contador
                i;

            children = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("ParentId", "Equal", id, false));
            for (i = 0; i < children.length; i += 1) {
                idList.push({ Id: children[i].Id, EntityType: children[i].EntityType });
                _retriveNodeChildren(children[i].Id);
            }
        };

        /*
         * PRIVATE
         * Resuelve los estados para los diferentes nodos en el arbol
         * @param {Object} parent
         * @param {Array} children
         */
        _statusResolve = function (parent, children) {
            var
                severity,
                statusId,
                statusColor,
                statusIdList,
                currentStatus,
                i;

            severity = -2;
            statusIdList = new ej.DataManager(children).executeLocal(new ej.Query().group("StatusId"));

            // Asignamos el StatusId y el StatusColor a cada nodo segun los estados definidos en el servidor (arrayObjectStatus)
            for (i = 0; i < statusIdList.length; i += 1) {
                if (statusIdList[i].key) {
                    currentStatus = new ej.DataManager(arrayObjectStatus).executeLocal(new ej.Query().where("Id", "equal", statusIdList[i].key, false))[0];
                    if (currentStatus) {
                        if (currentStatus.Severity >= severity) {
                            severity = currentStatus.Severity;
                            statusId = currentStatus.Id;
                            statusColor = currentStatus.Color;
                        }
                    }
                }
            };

            // Definimos el estado de cada uno de los nodes
            // Si severity es menor o igual a 0 significa que el nodo está en estado maquina apagada o sin datos
            if (((!parent.Severity) || (parent.Severity < severity)) || (severity <= 0)) {
                parent.Severity = severity;
                parent.StatusId = statusId;
                parent.StatusColor = statusColor;

                var node = _getNode(parent.Id);
                node.StatusId = statusId;
                node.StatusColor = statusColor;

                var nextParent = _getNode(parent.ParentId);
                if (nextParent) {
                    // Buscamos todos los hermanos de su nodo padre, de lo contrario solo pasamos su unico hijo
                    var siblings = ej.DataManager(jsonTree).executeLocal(ej.Query().where("ParentId", "equal", parent.ParentId, false));
                    if (siblings.length > 0) {
                        _statusResolve(nextParent, siblings);
                    } else {
                        _statusResolve(nextParent, [parent]);
                    }
                    //_statusResolve(nextParent, [parent]); //original
                }
            }
        }
        /*
         * PRIVATE
         * Obtiene el objeto Node por Id
         * @param {Object} parent
         * @param {Array} children
         */
        _getNode = function (id) {
            var node = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("Id", "equal", id, false));
            return (node.length > 0) ? node[0] : null;
        }

        _beforeLocationMenuOpen = function beforeOpen(args) {
            var selectedNode = $(args.target).closest('.e-item');

            if (!$(args.target).hasClass('e-node-disable'))
                treeObj.selectNode(selectedNode);

            _selectedLocation = _getNode(selectedNode[0].id);
        }

        _beforeAssetMenuOpen = function beforeOpen(args) {
            var selectedNode = $(args.target).closest('.e-item');

            if (!$(args.target).hasClass('e-node-disable'))
                treeObj.selectNode(selectedNode);
        }

        _beforeMeasurementPointMenuOpen = function beforeOpen(args) {
            var
                i,
                selectedIndex,
                listbox = $('#measurementPoints').data("ejListBox");

            if (!args.target.id) {
                args.cancel = true;
                return;
            }

            if (listbox) {
                for (var i = 0; i < listbox.listitems.length; i += 1) {
                    if (listbox.listitems[i].NodeId == args.target.id) {
                        listbox.selectItemByIndex(i); // Seleccionar item en el listbox
                        //selectedIndex = i;
                        break;
                    }
                }
            }
        }

        _locationMenuItemClick = function (args) {
            args.event.preventDefault();
            var menuItem = args.ID;

            if (_selectedLocation != null) {
                switch (menuItem) {
                    case "newLocationMenuItem":
                        new LocationAdmin().Create(_selectedLocation);
                        break;
                    case "editLocationMenuItem":
                        new LocationAdmin().Edit(_selectedLocation);
                        break;
                    case "deleteLocationMenuItem":
                        new LocationAdmin().Delete(_selectedLocation);
                        break;
                    case "newAssetMenuItem":
                        new AssetAdmin().Create(_selectedLocation);
                        break;
                    case "pasteAssetMenuItem":
                        new AssetAdmin().Paste(_selectedLocation);
                        break;
                    case "summaryViewAssetsMenuItem":
                        var isAdmin = JSON.parse($("#summaryViewAssetsMenuItem").attr("isAdmin"));
                        new AssetAdmin().SummaryViewAssets(_selectedLocation, isAdmin);
                        break;
                    default:
                        popUp("warning", "Funcionalidad desactivada temporalmente.");
                }
            }
            else {
                popUp("info", "Seleccione el activo deseado.");
            }
        }

        _assetMenuItemClick = function (args) {
            args.event.preventDefault();
            var menuItem = args.ID;

            if (selectedAsset != null) {
                switch (menuItem) {
                    case "liveTrendMenuItem":
                        new LiveTrendGraph(12, 5, true).Show();
                        break;
                    case "viewer3dMenuItem":
                        _loadProperties3d();
                        /*
                        if (selectedTreeNode.Properties3d !== null) {
                            new App3d(0, 12, 6, false, selectedTreeNode.Id, "Viewer").Show();
                        }*/
                        break;
                    case "editor3dMenuItem":

                        window.open('/Home/Editor3d?selectedId=' + selectedTreeNode.Id, '_blank');
                        break;
                    case "barGraphMenuItem":
                        new BarChartGraph(0, 12, 4, true).Show();
                        break;
                    case "historicalTrendMenuItem":
                        new HistoricalTrendGraph(12, 5, true).Show();
                        break;
                    case "editAssetMenuItem":
                        new AssetAdmin().Edit(selectedAsset);
                        break;
                    case "copyAssetMenuItem":
                        new AssetAdmin().Copy(selectedAsset);
                        break;
                    case "pasteMenuItem":
                        new AssetAdmin().Paste(selectedAsset);
                        break;
                    case "deleteAssetMenuItem":
                        new AssetAdmin().Delete(selectedAsset);
                        break;
                    case "newAssetMenuItem":
                        new AssetAdmin().Create(selectedAsset);
                        break;
                    case "newMeasurementPointMenuItem":
                        new MeasurementPointAdmin().Create(selectedAsset.AssetId, selectedAsset.Id);
                        break;
                    case "eventVelocityMenuItem":
                        new AssetAdmin().EventVelocity(selectedAsset);
                        break;
                    case "eventConditionStatusMenuItem":
                        new AssetAdmin().EventConditionStatus(selectedAsset);
                        break;
                    case "pairsXYMenuItem":
                        new AssetAdmin().ConfigurePairsXY(selectedAsset);
                        break;
                    case "summaryViewPointsMenuItem":
                        var isAdmin = JSON.parse($("#summaryViewPointsMenuItem").attr("isAdmin"));
                        new AssetAdmin().SummaryViewPoints(selectedAsset, isAdmin);
                        break;
                    default:
                        popUp("warning", "Funcionalidad desactivada temporalmente.");
                }
            }
            else {
                popUp("info", "Seleccione el activo deseado.");
            }
        }

        _measurementPointMenuItemClick = function (args) {
            args.event.preventDefault();
            var menuItem = args.ID;

            if (selectedMdVariable != null) {
                switch (menuItem) {
                    case "waveformMenuItem":
                        new WaveformGraph(0, 6, 4, true).Show();
                        break;
                    case "spectrumMenuItem":
                        new SpectrumGraph(0, 6, 4, true).Show();
                        break;
                    case "orbitSpectrumMenuItem":
                        new FullSpectrumGraph(0, 12, 5, true).Show();
                        break;
                    case "orbitMenuItem":
                        new OrbitGraph(0, 12, 5, true).Show();
                        break;
                    case "sclMenuItem":
                        new ShaftPositionGraph(0, 6, 6, true).Show();
                        break;
                    case "editMeasurementPointMenuItem":
                        new MeasurementPointAdmin().Edit(selectedMeasurementPoint.Id);
                        break;
                    case "copyMeasurementPointMenuItem":
                        new MeasurementPointAdmin().Copy(selectedMeasurementPoint);
                        break;
                    case "deleteMeasurementPointMenuItem":
                        new MeasurementPointAdmin().Delete();
                        break;
                    default:
                        popUp("warning", "Funcionalidad desactivada temporalmente.");
                }
            }
            else {
                popUp("info", "Seleccione el punto de medición deseado.");
            }
        }

        _poll = function () {
            var asset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where(ej.Predicate("Id", "equal", selectedTreeNode.Id, true).and("EntityType", "equal", 2, true)))[0];
            if (!asset) {
                $("#assetMenu").ejMenu("disable");
                setTimeout(_poll, 500);
            } else {
                $("#assetMenu").ejMenu("enable");
            }
            return;
        };

        _loadProperties3d = function () {
            var
                assetId,
                locationId,
                mdVariableId;

            assetId = selectedAsset.AssetId;
            mdVariableId = (mainCache.loadedMeasurementPoints.length > 0) ? mainCache.loadedMeasurementPoints[0].Id : null;

            if (selectedTreeNode.EntityType === 1) {
                // Caso Ubicaciones 3D
            } else if (selectedTreeNode.EntityType === 2) {
                $.ajax({
                    url: "/Home/GetAssetProperties3d",
                    method: "GET",
                    data: {
                        assetId: assetId
                    },
                    success: function (result) {
                        if (result) {
                            new App3d(0, 12, 6, false, selectedTreeNode.Id, "Viewer").Show();
                        }
                    },
                    error: function (jqXHR, textStatus) {
                        console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                    }
                });
            }
        };

        _editTreeNode = function () {
            if ($('#txtEditNode').length == 0) {
                $("#treeView").data("ejTreeView").option({ allowKeyboardNavigation: false }); // Deshabilita la navegación en el árbol por medio del teclado
                $("li#" + selectedTreeNode.Id + " > div >a> div").hide();
                $("li#" + selectedTreeNode.Id + " > div >a").append("<input id='txtEditNode' type='text' value='" + selectedTreeNode.Name + "'/>");
                $("#txtEditNode").focus();
                $("#txtEditNode").css("color", "black"); // Se agrega este estilo debido a que el evento hover del treeView oculta el texto
                document.getElementById("txtEditNode").setSelectionRange($("#txtEditNode").val().length, $("#txtEditNode").val().length); // Posiciona el cursor en la ultima letra

                $('#txtEditNode').keyup(function (e) {
                    // Si oprime Enter dentro del textbox guarda los cambios en BD
                    if (e.keyCode == 13) {
                        var node = {
                            Id: selectedTreeNode.Id,
                            Name: $('#txtEditNode').val(),
                            EntityType: selectedTreeNode.EntityType,
                            EntityId: (selectedTreeNode.EntityType == 2) ? selectedTreeNode.AssetId : null
                        };

                        $.ajax({
                            url: "/Home/UpdateNameInTreeNode",
                            method: "POST",
                            data: { nodeDto: node },
                            success: function (response) { },
                            complete: function (e) {
                                $("#txtEditNode").remove(); // Elimina el textbox creado al editar un nodo del arbol
                                $("li#" + selectedTreeNode.Id + " > div >a> div").show();

                                // Se actualizan los datos tanto en el jsonTree como el treeObj
                                ej.DataManager(jsonTree).update("Id", { Id: node.Id, Name: node.Name }, jsonTree);
                                ej.DataManager(treeObj.currentSelectedData).update("Id", { Id: node.Id, Name: node.Name }, treeObj.currentSelectedData);

                                var iconClass = "fa fa-map-marker";

                                // Actualizamos el mainCache de activos 
                                if (node.EntityType == 2) {
                                    ej.DataManager(mainCache.loadedAssets).update("Id", { Id: node.Id, Name: node.Name }, mainCache.loadedAssets);
                                    iconClass = "fa fa-diamond";
                                }

                                // Cambia el texto del arbol (treeView)
                                var color = $("#treeView li#" + node.Id + " a.e-text>div>span")[0].style["color"];
                                $("#treeView li#" + node.Id + ">div>#treeView_active>div").html("<span class='" + iconClass + "' icon-large' style='background-color: transparent; color:" + color + "; padding: 2px;'></span> " + node.Name);
                                $("#treeView").data("ejTreeView").option({ allowKeyboardNavigation: true }); // Habilita la navegación en el árbol por medio del teclado
                            },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "A ocurrido un error al actualizar. Intente nuevamente!");
                            }
                        });
                    }
                });
            }
        }

        _cancelEditTreeNode = function () {
            if ($('#txtEditNode').length > 0) {
                $("#treeView").data("ejTreeView").option({ allowKeyboardNavigation: true }); // Habilita la navegación en el árbol por medio del teclado
                $("#txtEditNode").remove(); // Elimina el textbox creado al editar un nodo del arbol
                $("li#" + selectedTreeNode.Id + " > div >a> div").show();
            }
        }

        // Creamos la vista del arbol
        _this.CreateTreeView();
    };

    return TreeViewControl;
})();