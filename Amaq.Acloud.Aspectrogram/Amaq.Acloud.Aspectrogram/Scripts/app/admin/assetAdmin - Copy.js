/*
 * assetAdmin.js
 * 
 * @author Jhon Esneider Alvarez
 */

var AssetAdmin = {};

AssetAdmin = (function () {
    "use strict";
    /*Variables Globales
        copiedNodes, typeNode */

    /* Constructor */
    AssetAdmin = function () {
        // Declarar propiedades privadas;
        var
            // Auto-referencia a la clase MeasurementPointAdmin
            _this,
            // Tipo de operación a realizar (Crear, Editar, Clonar o Eliminar)
            _typeOperation,
            // Formulario (PopUp) para la clonación y edición de un asset.
            _createAssetDiaolog,
            // Objeto Asset
            _asset = {},
            // Lista de Node id's
            idList = [],
            // Id del asset principal para cada uno de sus SubAsset(SubActivos)
            _principalAssetId,
            // PopUp de confirmación para eliminar un activo
            _createConfirmDialogDeleting,
            // PopUp de configuración de evento de velocidad
            _createEventVelocity,
            // PopUp de configuración de evento de condición de estados
            _createEventConditionStatus,
            // Lista de KPH dentro de una activo principal o maquina
            _listRefAngular,
            // Lista de estados
            _listStatus,
            //
            _isCreatedGridNotifyList,
            // Usuarios relacionados con la compañia actual
            _usersCompanie,
            // StatusId seleccionado
            _statusId,
            // Autoincremento para darle una primaryKey única a cada notificación del gridNotifyList
            _index,
            // Datos originales al cargar el gridConditionStatus
            _conditionStatusOriginal,
            // Datos originales al cargar el formEventVelocity
            _eventVelocityOriginal,
            // Notificación seleccionada
            _selectedNotity,
            // Id del control donde se aplica clic sobre éste
            _controlId,
            // Posicion del cursor en un control
            _positionCursor,
            // Punto de medición par X seleccionado
            _pairXselected,
            // Punto de medición par Y seleccionado
            _pairYselected,
            // ParXY seleccionado
            _pairXYselected,
            // Cuerpo del correo predeterminado
            _subject, _message,
            // Objeto Node
            _node = {},
            // PopUp de vista resumen de puntos de medición y activos
            _createSummariesView,
            // Tipos de material en una RTD
            _materials, _coefficient,
            // Indica si se debe actualizar el hasChild de un nodo
            _updateHasChild,
            // Lista de nodeId
            _listNodeId,
            // 
            _dsTripMultiply,
            // 
            _existingStates;

        //_validatedFieldsSV;


        _subject = "{EstadoCondicion}, {RutaActivo}.";
        _message = "La maquina {RutaActivo} se encuentra en estado de {EstadoCondicion}. Estampa de tiempo: {EstampaTiempo}.";
        _this = this;
        _listRefAngular = [{ Name: "Ninguno", Id: "0" }];
        _listStatus = [{ Name: "Ninguno", Id: "0" }];
        _isCreatedGridNotifyList = false;
        _index = 0;
        _conditionStatusOriginal = [];
        _selectedNotity = null;
        _controlId = null;
        _positionCursor = null;
        _pairXselected = null;
        _pairYselected = null;
        _pairXYselected = null;
        _materials = new RTDCoefficient().Materials;
        _coefficient = new RTDCoefficient().Coefficients;
        //_heightWindow = $(window).height();
        //_widthWindow = $(window).width();
        _updateHasChild = false;
        _listNodeId = [];
        _existingStates = [];
        _dsTripMultiply = [{ Name: "Ninguno", Id: 1 }, { Name: "2X", Id: 2 }, { Name: "3X", Id: 3 }];
        //_validatedFieldsSV = true;

        this.Copy = function (asset) {
            copiedNodes = [];
            copiedNodes.push(asset);
            typeNode = 2;

            $("#locationMenu").ejMenu("enableItemByID", "pasteAssetMenuItem");
            popUp("success", "Activo " + copiedNodes[0].Name + " copiado!");

            _pairsXY = [];
            // Obtiene todos los Pares XY del activo a copiar
            GetAllPairsXY(selectedTreeNode.Id);
            _pairsXY = ej.distinct(_pairsXY, "XMdVariableId", true); // 
        };

        function GetAllPairsXY(parentId) {
            var mdvariables = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("ParentNodeId", "equal", parentId, false));
            if (mdvariables.length > 0) {
                for (var m = 0; m < mdvariables.length; m++) {
                    if (mdvariables[m].AssociatedMeasurementPointId != null) {
                        var mdVarAssociated = ej.DataManager(mdvariables).executeLocal(ej.Query().where("Id", "equal", mdvariables[m].AssociatedMeasurementPointId, false))[0];
                        if (mdVarAssociated.Orientation == 1) { // X
                            _pairsXY.push({
                                AssetId: mdVarAssociated.ParentId,
                                XMdVariableId: mdVarAssociated.Id,
                                YMdVariableId: mdvariables[m].Id,
                            });
                        } else if (mdVarAssociated.Orientation == 2) { // Y
                            _pairsXY.push({
                                AssetId: mdVarAssociated.ParentId,
                                XMdVariableId: mdvariables[m].Id,
                                YMdVariableId: mdVarAssociated.Id,
                            });
                        }
                    }
                }
            }
            var childrens = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", parentId, true).and("EntityType", "equal", 2, true)));

            for (var c = 0; c < childrens.length; c++) {
                GetAllPairsXY(childrens[c].Id);
            }
        }

        this.Create = function (asset) {
            _typeOperation = "createAsset";
            _asset = asset;

            $('#lblNameAsset').text("Nueva Etiqueta:");
            _createAssetDiaolog("Crear Activo");
        };

        this.Edit = function (asset) {
            _typeOperation = "editAsset";
            _asset = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", asset.Id, false))[0];
            //_asset = asset;

            $('#lblNameAsset').text("Etiqueta:");
            _createAssetDiaolog("Editar Activo " + _asset.Name);
        };

        this.Paste = function (asset) {

            if (copiedNodes.length > 0) {

                if (typeNode == 3) {
                    // Obtenemos el número de puntos de medición hermanos que existen para setear la propiedad OrderPosition 
                    var data = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("ParentId", "equal", asset.AssetId, false));
                    var nPosition = data.length == 0 ? 0 : ej.max(data, "OrderPosition").OrderPosition;
                }

                for (var n = 0; n < copiedNodes.length; n++) {
                    var _name = null;
                    var name = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", asset.Id, true).and("Name", "equal", copiedNodes[n].Name, true)));

                    if (typeNode == 3) {

                        // Validamos si existe el mismo nombre del nodo dentro de sus hermanos
                        if (name.length > 0) {
                            _name = copiedNodes[n].Name + "_copia";
                        }

                        //// Obtenemos el número de puntos de medición hermanos que existen para setear la propiedad OrderPosition 
                        //var data = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("ParentId", "equal", asset.AssetId, false));
                        //var nPosition = data.length == 0 ? 0 : ej.max(data, "OrderPosition").OrderPosition + 1;
                        nPosition += 1;

                        var _nodeAndMdVariableDto = {
                            NodeDto:
                                {
                                    Id: copiedNodes[n].NodeId,
                                    ParentId: asset.Id,
                                    Name: _name == null ? copiedNodes[n].Name : _name,
                                },
                            MdVariableDto:
                                {
                                    Id: copiedNodes[n].Id,
                                    ParentId: asset.AssetId,
                                    Name: _name == null ? copiedNodes[n].Name : _name,
                                    SubVariables: copiedNodes[n].SubVariables,
                                    OrderPosition: nPosition,
                                }
                        };

                        $.ajax({
                            url: "/Home/CopyNodeAndMdVariable",
                            method: "POST",
                            data: { nodeAndMdVariableDto: _nodeAndMdVariableDto },
                            success: function (response) {

                                var _node = response.NodeDto;
                                _node.EntityType = _node.Type;
                                delete _node.Type;
                                var _mdVar = response.MdVariableDto;
                                _mdVar.ParentNodeId = _node.ParentId;

                                //Agregamos el nuevo node al jsonTree
                                ej.DataManager(jsonTree).insert(_node);

                                //Agregamos el nuevo punto de medicion al mainCache de puntos de medición
                                ej.DataManager(mainCache.loadedMeasurementPoints).insert(_mdVar);

                                // Si no existen puntos de medición asociados a un activo se crea el listbox, de lo contrario se adiciona éste al listbox actual.
                                if (!$("#measurementPoints").data("ejListBox")) {
                                    listboxControl.CreateListbox(Node = { Id: _node.ParentId, AssetId: _mdVar.ParentId }, null);
                                } else {
                                    //$('#measurementPoints').ejListBox("addItem", { Id: _mdVar.Id, Name: _mdVar.Name, NodeId: _mdVar.NodeId, ParentNodeId: _mdVar.ParentNodeId });
                                    $('#measurementPoints').ejListBox("addItem", _mdVar);
                                    $("#measurementPoints").ejListBox("refresh", true);
                                }

                                popUp("success", "Se pegó correctamente el punto de medición " + _node.Name);
                            },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "A ocurrido un error. Intente nuevamente");
                            },
                        });
                    }
                    else if (typeNode == 2) {
                        var _parentId = null;
                        var _isPrincipal;
                        var _pplAssetId = null;
                        var nodeIdCopied = copiedNodes[n].Id;
                        var nodeNameCopied = copiedNodes[n].Name;

                        // Determina si el activo a pegar es principal o no
                        var _entityType = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("Id", "Equal", asset.Id, false))[0].EntityType;
                        if (_entityType == 1) {
                            _pplAssetId = null;
                            _isPrincipal = true;
                        } else if (_entityType == 2) {
                            // Busca el activo ppl para setear su Id a la propiedad PrincipalAssetId
                            searchAssetPrincipal(asset.AssetId);
                            _pplAssetId = _principalAssetId;
                            _isPrincipal = false;
                        }

                        // Validamos si existe el mismo nombre del nodo dentro de sus hermanos
                        if (name.length > 0) {
                            _name = copiedNodes[n].Name + "_copia";
                        }

                        $.ajax({
                            url: "/Home/GetNodeById",
                            data: { id: asset.Id },
                            method: "GET",
                            success: function (response) {
                                var _levelParent = response.Level;
                                _parentId = response.Id;
                                $.ajax({
                                    url: "/Home/GetNodeById",
                                    data: { id: nodeIdCopied },
                                    method: "GET",
                                    success: function (response) {
                                        var _node = response;
                                        // Seteamos el nuevo level al nodo apartir de sus hermanos que son tipo Asset
                                        var level = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", asset.Id, true).and("EntityType", "equal", 2, true))).length + 1;
                                        _node.Level = _levelParent + "." + level;
                                        _node.Name = _name == null ? nodeNameCopied : _name;
                                        _node.ParentId = _parentId;

                                        // Al pegar el activo se valida si fue en otro para actualizar la propiedad HasChild a true
                                        var arrayNode = [];
                                        var nod = ej.DataManager(jsonTree).executeLocal(ej.Query().where("Id", "equal", asset.Id, false))[0];

                                        if (nod.EntityType == 2) {
                                            arrayNode[0] = nod.Id; // NodeId
                                            arrayNode[1] = true; // HasChild
                                            ej.DataManager(jsonTree).update("Id", { Id: nod.Id, HasChild: true }, jsonTree);
                                        }

                                        $.ajax({
                                            url: "/Home/PasteNodeAndAsset",
                                            method: "POST",
                                            data: { node: _node, isPrincipal: _isPrincipal, pplAssetId: _pplAssetId, pairsXY: _pairsXY, updateNode: arrayNode },
                                            success: function (result) {

                                                var nodes = result.Nodes;
                                                var assets = result.Assets;
                                                var mdVariables = result.MdVariables;
                                                var subVariables = result.SubVariables;
                                                var nodesAsset = [];
                                                var parentNodeId = null;

                                                // Se recorren todos los nodos nuevos para agregar la propiedad EntityType y eliminar Type, ya que se opera con esta (EntityType) en diferente partes del sistema y los nodos tipo asset se van agregando al árbol para que se muestren en el.
                                                for (var i = 0; i < nodes.length; i++) {
                                                    if (nodes[i].Type == 2) {
                                                        nodes[i].htmlAttribute = { "data-nodetype": "asset-node" };
                                                        nodes[i].EntityType = 2;
                                                        delete nodes[i].Type;
                                                        var assetId = ej.DataManager(assets).executeLocal(new ej.Query().where("NodeId", "Equal", nodes[i].Id, false))[0].Id;
                                                        treeObj.addNode({ AssetId: assetId, EntityType: 2, Id: nodes[i].Id, Name: nodes[i].Name, ParentId: nodes[i].ParentId, htmlAttribute: { "data-nodetype": "asset-node" } }, treeObj.getSelectedNode());
                                                        //treeObj.addNode({ EntityType: 2, Id: nodes[i].Id, Name: nodes[i].Name, ParentId: nodes[i].ParentId, htmlAttribute: { "data-nodetype": "asset-node" } }, nodes[i].ParentId);
                                                    }
                                                    else if (nodes[i].Type == 3) {
                                                        nodes[i].EntityType = 3;
                                                        delete nodes[i].Type;
                                                    }
                                                }

                                                // Fusionamos los nuevos nodos con el jsonTree
                                                ej.merge(jsonTree, nodes);
                                                //var listNodes = { "added": nodes, "deleted": {}, "changed": {} };
                                                //ej.DataManager(jsonTree).saveChanges(listNodes);

                                                popUp("success", "Se pegó correctamente el activo " + _node.Name);
                                            },
                                            error: function (jqXHR, textStatus) {
                                                popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                                            }
                                        });
                                    },
                                    error: function (jqXHR, textStatus) {
                                        popUp("error", "A ocurrido un error al obtener el node. Intente nuevamente!");
                                    }
                                });
                            },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "A ocurrido un error al obtener el node. Intente nuevamente!");
                            }
                        });

                    }
                }

                // Al terminar el pegado y si son puntos de medición mostramos el icono de ordenar éstos.
                if (typeNode == 3) {
                    toOrder = false;
                    $("#orderbyPoints").removeClass("hidden");
                    $("#btnToOrderPoints>i").removeClass("fa-check"); // Quitamos el icono (chulo)
                    $("#btnToOrderPoints>i").addClass("fa-list-ol"); // Agregamos el icono (lista)
                    $("#btnCancelOrderPoints").addClass("hidden"); // Ocultamos el icono cancelar (X)
                }
            }
            else {
                popUp("error", "No hay elemento(s) copiado(s) para pegar!");
            }
        }

        this.ConfigurePairsXY = function (asset) {
            // Si existen puntos de medición en el activo se crea el formulario de configuración de pares XY
            if (typeof $("#measurementPoints").data("ejListBox") !== "undefined") {
                $("#formPairsXY").ejDialog({
                    title: "Configuración Pares XY - " + asset.Name,
                    showOnInit: false,
                    actionButtons: ["close"],
                    enableAnimation: true,
                    minWidth: "32%",
                    //minHeight: "95%",
                    width: "33%",
                    height: "70%",
                    maxHeight: _heightWindow,
                    maxWidth: _widthWindow,
                    //scrollSettings: { height: "69%", width: "34%" },
                    //allowScrolling: true,
                    enableResize: true,
                    allowDraggable: true,
                    zIndex: 11000,
                    enableModal: true,
                    isResponsive: true,
                    showRoundedCorner: true,
                    animation: {
                        show: { effect: "slide", duration: 500 },
                        hide: { effect: "fade", duration: 500 }
                    },
                    open: function (args) {
                        autoHeightEjDialog("#formPairsXY", _heightWindow);
                    },
                    beforeOpen: function (args) {
                        // Boton (>) para agregar un par XY 
                        $("#btnAddPairXY").click(function () {
                            if (_pairXselected && _pairYselected) {

                                // Agregamos el nuevo ParXY al listbox
                                $('#lbPointsXY').ejListBox("addItem", {
                                    Id: _pairXselected.Id + "-" + _pairYselected.Id,
                                    Name: _pairXselected.Name + " / " + _pairYselected.Name,
                                });

                                // Ocultamos los puntos X y Y que fueron agregados al listbox Pares XY
                                $('#lbPointsX > li[value=' + _pairXselected.Id + ']').hide();
                                $('#lbPointsY > li[value=' + _pairYselected.Id + ']').hide();

                                // Actualizamos los listbox (Puntos en X y Y) en su propiedad "AssociatedMeasurementPointId"
                                ej.DataManager($("#lbPointsX").data("ejListBox").model.dataSource).update("Id", { Id: _pairXselected.Id, AssociatedMeasurementPointId: _pairYselected.Id }, $("#lbPointsX").data("ejListBox").model.dataSource);
                                ej.DataManager($("#lbPointsY").data("ejListBox").model.dataSource).update("Id", { Id: _pairYselected.Id, AssociatedMeasurementPointId: _pairXselected.Id }, $("#lbPointsY").data("ejListBox").model.dataSource);

                                _pairXselected = null;
                                _pairYselected = null;
                                // Des-selecionamos el item de cada listBox Par X y Y
                                $('#lbPointsX').ejListBox("unselectAll");
                                $('#lbPointsY').ejListBox("unselectAll");

                            } else
                                popUp("error", "Seleccione un punto en X y Y para ser agregado como Par XY !");
                        });

                        // Boton (<) para desvincular un par XY
                        $("#btnDeletePairXY").click(function () {
                            if (_pairXYselected) {
                                // Elimina el item seleccionado
                                $('#lbPointsXY').ejListBox("removeItem", _pairXYselected.Id);
                                // Split del item seleccionado para obtener el punto X y Y, actualizar la propiedad "AssociatedMeasurementPointId" en null y ser agregado de nuevo al listbox perteneciente 
                                var idPoints = _pairXYselected.Id.split('-');
                                ej.DataManager($("#lbPointsX").data("ejListBox").model.dataSource).update("Id", { Id: idPoints[0], AssociatedMeasurementPointId: null }, $("#lbPointsX").data("ejListBox").model.dataSource);
                                ej.DataManager($("#lbPointsY").data("ejListBox").model.dataSource).update("Id", { Id: idPoints[1], AssociatedMeasurementPointId: null }, $("#lbPointsY").data("ejListBox").model.dataSource);
                                $("#lbPointsX").ejListBox("refresh");
                                $("#lbPointsY").ejListBox("refresh");

                                _pairXYselected = null;
                                // Des-selecionamos el item del listBox Par XY
                                $('#lbPointsXY').ejListBox("unselectAll");
                            } else
                                popUp("error", "Seleccione un Par XY para ser desagregado !");
                        });

                        // Guarda los cambios hechos en el formularion de "Configuración Pares XY" de un activo
                        $("#btnSavePairsXY").click(function () {
                            var pairsXY = $("#lbPointsXY").data("ejListBox").model.dataSource;
                            var listPairXY = [];

                            // Recorremos el listbox de pares XY para hacerle a cada item un split y asignarle su debido valor a la propiedad para ser enviada al servidor como una lista de tipo entidad.
                            for (var i = 0; i < pairsXY.length; i++) {
                                var splitXY = pairsXY[i].Id.split('-');

                                listPairXY.push({
                                    XMdVariableId: splitXY[0], // Posición [0] equivale el par X
                                    YMdVariableId: splitXY[1], // Posición [1] equivale el par Y
                                    AssetId: selectedTreeNode.AssetId,
                                });
                            }

                            $.ajax({
                                url: "/Home/DeleteAndSaveXYMeasurementPointPair",
                                method: "POST",
                                data: { assetId: selectedTreeNode.AssetId, pairsXY: listPairXY },
                                success: function (result) {

                                    var dsMdVariable = $("#lbPointsX").data("ejListBox").model.dataSource;
                                    // Actualizamos el dataSource del listBox de puntos de medición en su propiedad "AssociatedMeasurementPointId"
                                    for (var m = 0; m < dsMdVariable.length; m++) {
                                        ej.DataManager($("#measurementPoints").data("ejListBox").model.dataSource).
                                            update("Id", { Id: dsMdVariable[m].Id, AssociatedMeasurementPointId: dsMdVariable[m].AssociatedMeasurementPointId },
                                            $("#measurementPoints").data("ejListBox").model.dataSource);
                                    }

                                    $("#formPairsXY").ejDialog("close");
                                    popUp("success", "Se configuró correctamente los Pares XY del activo " + selectedTreeNode.Name);
                                },
                                error: function (jqXHR, textStatus) {
                                    popUp("error", "Ha ocurrido un error, intentelo de nuevo!");
                                }
                            });

                        });

                        // Cierre y cancela el formulario de "Configuración Pares XY" de un activo
                        $("#btnCancelPairsXY").click(function () {
                            $("#formPairsXY").addClass('hidden');
                            $("#formPairsXY").ejDialog("close");
                        });

                        createControlsPairsXY(asset);
                    },//Fin beforeOpen
                    close: function (args) {
                        $("#btnAddPairXY").off("click"); // Necesario desasociar el evento
                        $("#btnDeletePairXY").off("click"); // Necesario desasociar el evento
                        $("#btnSavePairsXY").off("click"); // Necesario desasociar el evento
                        $("#btnCancelPairsXY").off("click"); // Necesario desasociar el evento
                        $("#lbPointsX").ejListBox("destroy");
                        $("#lbPointsY").ejListBox("destroy");
                        $("#lbPointsXY").ejListBox("destroy");
                    },//Fin close
                });

                $("#formPairsXY").ejDialog("open");
                $("#formPairsXY").removeClass('hidden');
            } else
                popUp("error", "No hay puntos de medición para configurar pares XY !");
        }

        // Buscamos todos los Id's nodos de la descendencia de un nodo a eliminar
        function retriveNodeChildren(id) {
            var children = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("ParentId", "Equal", id, false));
            for (var i = 0; i < children.length; i++) {
                idList.push({ Id: children[i].Id, EntityType: children[i].EntityType });
                retriveNodeChildren(children[i].Id);
            }
        }

        this.Delete = function (asset) {
            _createConfirmDialogDeleting("<b>Eliminar</b>", "¿Desea eliminar el activo " + asset.Name + "?", asset);
        };

        this.EventVelocity = function (asset) {
            //_asset = asset;
            _asset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("Id", "equal", asset.Id, false))[0];
            GetListReferenceAngular(_asset);
            _createEventVelocity("Evento De Velocidad " + _asset.Name, _asset);
        };

        this.EventConditionStatus = function (asset) {
            //_asset = asset;
            _asset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("Id", "equal", asset.Id, false))[0];
            // Consultamos todos los usuarios relacionados con la misma compañia y abrimos el dialogo de eventos de condición
            $.ajax({
                url: "/Home/GetByCurrentCompany",
                method: "POST",
                data: {},
                success: function (response) {
                    _usersCompanie = response;
                    _createEventConditionStatus("Configuración Eventos Por Estados De Condición " + _asset.Name, _asset);
                },
                error: function (jqXHR, textStatus) {
                    popUp("error", "A ocurrido un error. Intente nuevamente!");
                }
            });
        };

        this.SummaryViewPoints = function (asset, isAdmin) {
            _asset = asset;
            if (_asset.IsPrincipal) {
                // Buscamos todos los activos (principal y sus subactivos si existen)
                var assets = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where(ej.Predicate("Id", "equal", _asset.Id, true).or("ParentId", "equal", _asset.Id, true)));
                if (assets.length > 0) {
                    // Recorremos cada uno de los activos encontrados y agregamos el elemento "fieldset" con el nombre del activo 
                    for (var s = 0; s < assets.length; s++) {
                        $("#formSummariesView > .container-fluid > #divPoints").append(
                            '<div id="' + assets[s].Id + '"><fieldset><legend>' + assets[s].Name + '</legend></fieldset></div>'
                        );
                    }
                }

                _createSummariesView("Vista resumen de activo y puntos de medición", _asset, assets, true, null, isAdmin);
            } else {
                // Agregamos el elemento "fieldset" con el nombre del activo
                $("#formSummariesView > .container-fluid > #divPoints").append('<div id="' + _asset.Id + '"><fieldset><legend>' + _asset.Name + '</legend></fieldset></div>');
                _createSummariesView("Vista resumen de puntos de medición del activo " + _asset.Name, _asset, [], false, null, isAdmin);
            }
        };

        this.SummaryViewAssets = function (location, isAdmin) {
            // Obtenemos todos los nodos hijos de una ubicación
            var nodes = ej.DataManager(jsonTree).executeLocal(ej.Query().where("ParentId", "equal", location.Id, false));
            if (nodes.length > 0) {
                var nodeIdListAsset = getListNodeIdAsset(nodes);
                var listAsset = getListAsset(nodeIdListAsset);

                $("#formSummariesView > .container-fluid > #divAssets").append('<div id="grid' + location.Id + '"></div><p></p>');
                _createSummariesView("Vista resumen activos", null, listAsset, false, location.Id, isAdmin);
            }
            else
                popUp("error", "No existen activos en esta ubicación!");
        };

        // Retorna una lista de nodeId de tipo Asset
        function getListNodeIdAsset(nodes) {
            for (var n = 0; n < nodes.length; n++) {
                if (nodes[n].EntityType == 2) {
                    _listNodeId.push(nodes[n].Id);
                }
                else if (nodes[n].EntityType == 1) {
                    var childrenNode = ej.DataManager(jsonTree).executeLocal(ej.Query().where("ParentId", "equal", nodes[n].Id, false));
                    getListNodeIdAsset(childrenNode);
                }
            }
            return _listNodeId;
        }

        // Retorna una lista de activos principales
        function getListAsset(nodeIdList) {
            _existingStates = [];
            // Lista de activos principales como padre de una ubicación
            var assets = getAssetsByLocationNodeId(nodeIdList);

            for (var a = 0; a < assets.length; a++) {

                if (assets[a].ConditionStatusEventsConfig == null)
                    assets[a].ConditionStatusEventsConfig = [];

                // Si este objeto es null, debemos agregarle la propiedad "Enabled" para que el grid de activos pinte de manera correcta el chechbox en su respectiva columna "Habilitado"
                if (assets[a].RpmEventConfig == null)
                    assets[a].RpmEventConfig = { Enabled: false, };

                // Recorremos "ConditionStatusEventsConfig" para encontrar cada uno de los estados y agregarlos en "_existingStates"
                for (var c = 0; c < assets[a].ConditionStatusEventsConfig.length; c++) {
                    _existingStates.push({ Id: assets[a].ConditionStatusEventsConfig[c].StatusId });
                }
            }

            // Obtenemos solos los statusId que existan dentro de todos los activos sin que se repita uno de ellos.
            _existingStates = ej.distinct(_existingStates, "Id", true);

            for (var x = 0; x < assets.length; x++) {

                if (assets[x].ConditionStatusEventsConfig.length == 0) {
                    for (var e = 0; e < _existingStates.length; e++) {
                        assets[x].ConditionStatusEventsConfig.push({
                            StatusId: _existingStates[e].Id,
                            Enabled: false,
                            Interval: null,
                            MinutesBefore: null,
                            MinutesAfter: null,
                            //Interval: "NA",
                            //MinutesBefore: "NA",
                            //MinutesAfter: "NA",
                            NotifyList: [],
                        });
                    }
                }

                // Recorremos los estados existentes y si un activo no lo tiene se la agregamos. Esto se debe hacer para que no hayan inconsistencias al crear el grid de activos
                for (var es = 0; es < _existingStates.length; es++) {
                    var exist = ej.DataManager(assets[x].ConditionStatusEventsConfig).executeLocal(ej.Query().where("StatusId", "equal", _existingStates[es].Id, false));
                    if (exist.length == 0) {
                        assets[x].ConditionStatusEventsConfig.push({
                            StatusId: _existingStates[es].Id,
                            Enabled: false,
                            Interval: null,
                            MinutesBefore: null,
                            MinutesAfter: null,
                            //Interval: "NA",
                            //MinutesBefore: "NA",
                            //MinutesAfter: "NA",
                            NotifyList: [],
                        });
                    }
                }

                // Se debe hace un orderBy a esta propiedad para que los datos de cada evento de estado se listen donde deben estar
                var orderByConditionStatus = ej.DataManager(assets[x].ConditionStatusEventsConfig).executeLocal(ej.Query().sortByDesc("StatusId"));
                assets[x].ConditionStatusEventsConfig = orderByConditionStatus;

                //if (assets[x].RpmEventConfig) {
                //    // Creamos la propiedad "AngularReferenceName" para poder mostrar en la columna "Marca de paso" su nombre
                //    assets[x].RpmEventConfig.AngularReferenceName = "";
                //    if (assets[x].RpmEventConfig.AngularReferenceId != null) {
                //        // Obtenemos desde base de datos la marca de paso y se la asignamos a la propiedad "AngularReferenceName"
                //        var point = getMdVariableById(assets[x].RpmEventConfig.AngularReferenceId);
                //        if (point)
                //            assets[x].RpmEventConfig.AngularReferenceName = point.Name;
                //    }
                //}
            }

            return assets;
        }

        // Retorna todos los activos relacionados con el nodeId de una ubicación
        function getAssetsByLocationNodeId(nodeIdList) {
            return JSON.parse($.ajax({
                type: "POST",
                url: "/Home/GetAssetsByNodeId",
                data: { nodeIdList: nodeIdList },
                dataType: 'json',
                async: false,
                success: function (data) {
                    return data;
                },
                error: function (data) {
                    popUp("error", "Error al obtener los activos principales. Recargue e intente nuevamente!");
                    return [];
                }
            }).responseText);
        };

        // Retorna un punto de medición por medio de su Id
        function getMdVariableById(id) {
            return JSON.parse($.ajax({
                type: "GET",
                url: "/Home/GetMdVariableById",
                data: { id: id },
                dataType: 'json',
                async: false,
                success: function (data) {
                    return data;
                },
                error: function (data) {
                    popUp("error", "Error al obtener el punto de medición. Recargue e intente nuevamente!");
                    return null;
                }
            }).responseText);
        };

        _createAssetDiaolog = function (_title) {
            $("#formAsset").ejDialog({
                title: _title,
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                width: 720,
                height: 420,
                minWidth: 720,
                minHeight: 420,
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                scrollSettings: { height: 430, width: 730 },
                allowScrolling: true,
                allowDraggable: true,
                enableResize: true,
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) {
                    autoHeightEjDialog("#formAsset", _heightWindow);
                },
                beforeOpen: function (args) {

                    if (_asset) {
                        if (_typeOperation == "createAsset") {
                            createControls(null);
                            // Si se crea un activo apartir de una ubicación o activo se muestra o no el campo de intervalo normal
                            if (_asset.EntityType == 2) {
                                $("#divNormalInterval").hide();
                                $("div#tmAndtst").hide();
                            }
                            else if (_asset.EntityType == 1) {
                                $("#divNormalInterval").show();
                                $("div#tmAndtst").show();
                            }
                        }
                        else {
                            createControls(_asset);
                            if (_asset.IsPrincipal) {
                                $("#divNormalInterval").show();
                                $("div#tmAndtst").show();
                            }
                            else {
                                $("#divNormalInterval").hide();
                                $("div#tmAndtst").hide();
                            }
                        }
                    }

                },//Fin beforeOpen
                close: function (args) {
                    $("#btnCloneOrEditAsset").off("click"); // Necesario desasociar el evento
                    $("#txtNameAsset").ejMaskEdit("destroy");
                    $("#txtDescriptionAsset").ejMaskEdit("destroy");
                    $("#txtNormalInterval").ejNumericTextbox("destroy");
                    $("#ddlTripMultiply").ejDropDownList("destroy");
                    $("#txtTransientStatusTimeout").ejNumericTextbox("destroy");
                    $("#formAsset").addClass('hidden');
                },//Fin close
            });

            $("#formAsset").ejDialog("open");
            $("#formAsset").removeClass('hidden');
        }

        // Crea los controles necesarios para el formulario de activos
        function createControls(_asset) {
            $("#txtNameAsset").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: _asset != null ? _asset.Name : "",
            });

            $("#txtDescriptionAsset").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: _asset != null ? _asset.Description : "",
                //validationRules: { required: true }, validationMessage: { required: "Descripción requerida" },
            });

            $("#txtNormalInterval").ejNumericTextbox({
                width: "50%",
                value: _asset != null ? _asset.NormalInterval : 0,
                minValue: 0,
                decimalPlaces: 3,
            });

            $("#ddlTripMultiply").ejDropDownList({
                width: "50%",
                dataSource: _dsTripMultiply,
                fields: { text: "Name", value: "Id" },
                value: _asset != null ? _asset.TripMultiply : 1,
                change: function (args) {
                    if (args.value == 1) {
                        $("#txtTransientStatusTimeout").ejNumericTextbox({ enabled: false });
                    } else {
                        $("#txtTransientStatusTimeout").ejNumericTextbox({ enabled: true });
                    }
                }
            });

            $("#txtTransientStatusTimeout").ejNumericTextbox({
                enabled: $("#ddlTripMultiply").ejDropDownList("getSelectedValue") == 1 ? false : true,
                width: "50%",
                value: _asset != null ? _asset.TransientStatusTimeout : 0,
                minValue: 0,
                decimalPlaces: 1,
            });
        }

        //Obtiene todos los valores de cada uno de los controles incluidos en el formulario de clonación y edicion de un activo
        function getFormValues() {
            var control =
                {
                    name: $("#txtNameAsset").val(),
                    description: $("#txtDescriptionAsset").val(),
                    normalInterval: $("#txtNormalInterval").ejNumericTextbox("getValue"),
                    tripMultiply: $("#ddlTripMultiply").ejDropDownList("getSelectedValue"),
                    transientStatusTimeout: $("#txtTransientStatusTimeout").ejNumericTextbox("getValue"),
                };
            return control;
        }

        //Boton "Guardar" para crear ó editar un activo
        $("#btnCloneOrEditAsset").click(function () {
            if (_typeOperation == "createAsset") {
                var input = getFormValues();
                $.ajax({
                    url: "/Home/GetNodeById",
                    data: { id: _asset.Id },
                    method: "GET",
                    success: function (response) {
                        _node = response;
                    },
                    complete: function (e) {
                        // Level nuevo para el node a crear
                        var level = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", _node.Id, true).and("EntityType", "equal", 2, true))).length + 1;
                        _node.Level = _node.Level + "." + level;

                        // Copia del activo donde se desplegó el contextMenu del árbol para crear a partir de allí el nuevo Activo y validar las propiedades IsPrincipal y PrincipalAssetId
                        var assetCopy = clone(_asset);
                        if (assetCopy.EntityType == 2) {
                            // Busca el activo ppl para setear su Id a la propiedad PrincipalAssetId
                            searchAssetPrincipal(assetCopy.AssetId);
                            assetCopy.PrincipalAssetId = _principalAssetId;
                            assetCopy.IsPrincipal = false;
                        } else if (assetCopy.EntityType == 3 || assetCopy.EntityType == 1) {
                            assetCopy.IsPrincipal = true;
                            assetCopy.PrincipalAssetId = null;
                        }

                        var entity = obj(_node, assetCopy, input, false)[0];

                        $.ajax({
                            url: "/Home/CreateNodeAndAsset",
                            method: "POST",
                            data: { node: entity.node, asset: entity.asset, updateHasChild: entity.updateHasChild },
                            async: false,
                            success: function (result) {
                                var newNode = {
                                    "added": [{
                                        EntityType: 2,
                                        HasChild: false,
                                        Id: result.nodeId,
                                        Name: entity.node.Name,
                                        ParentId: entity.node.ParentId,
                                        htmlAttribute: { "data-nodetype": "asset-node" },
                                        AssetId: result.assetId,
                                    }], "deleted": {}, "changed": {}
                                };

                                var newAsset = {
                                    "added": [{
                                        AssetId: result.assetId,
                                        IsPrincipal: assetCopy.IsPrincipal,
                                        PrincipalAssetId: assetCopy.PrincipalAssetId,
                                        EntityType: 2,
                                        Id: result.nodeId,
                                        Name: entity.node.Name,
                                        ParentId: entity.node.ParentId,
                                        NormalInterval: input.normalInterval,
                                        TripMultiply: input.tripMultiply,
                                        TransientStatusTimeout: input.transientStatusTimeout,
                                        Description: input.description
                                    }], "deleted": {}, "changed": {}
                                };

                                ej.DataManager(mainCache.loadedAssets).saveChanges(newAsset);

                                ej.DataManager(jsonTree).saveChanges(newNode);
                                /*htmlAttribute= Tipificar los nodos de tipo asset para asociarles menú contextual de opciones }*/
                                // Se agrega el nuevo nodo al treeview
                                treeObj.addNode({
                                    IsPrincipal: assetCopy.IsPrincipal,
                                    PrincipalAssetId: assetCopy.PrincipalAssetId,
                                    AssetId: result.assetId,
                                    EntityType: 2,
                                    Id: result.nodeId,
                                    Name: entity.node.Name,
                                    ParentId: entity.node.ParentId,
                                    htmlAttribute: { "data-nodetype": "asset-node" },
                                    NormalInterval: input.normalInterval
                                }, entity.node.ParentId);
                                //treeObj.addNode({ IsPrincipal: asset.IsPrincipal, PrincipalAssetId: asset.PrincipalAssetId, AssetId: result.assetId, EntityType: 2, Id: result.nodeId, Name: entity.node.Name, ParentId: entity.node.ParentId, htmlAttribute: { "data-nodetype": "asset-node" } }, treeObj.getSelectedNode());
                            },
                            complete: function (result) {
                                $("#formAsset").ejDialog("close");
                                popUp("success", "Se creo correctamente el activo " + entity.asset.Name);
                            },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "Ha ocurrido un error, intentelo de nuevo!");
                            }
                        });
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "A ocurrido un error al obtener el node. Intente nuevamente!");
                    }
                });
            }

            if (_typeOperation == "editAsset") {
                var input = getFormValues();

                var _Asset = {
                    Id: _asset.AssetId,
                    Name: input.name,
                    Description: input.description,
                    NodeId: _asset.Id,
                    NormalInterval: input.normalInterval != null ? input.normalInterval.toString().replace('.', ',') : null,
                    TripMultiply: input.tripMultiply,
                    TransientStatusTimeout: input.transientStatusTimeout != null ? input.transientStatusTimeout.toString().replace('.', ',') : 0,
                };

                $.ajax({
                    url: "/Home/UpdateNodeAndAsset",
                    method: "POST",
                    data: { asset: _Asset },
                    success: function (result) {
                        // Se actualizan los datos tanto en el jsonTree como el treeObj
                        ej.DataManager(jsonTree).update("Id", { Id: _Asset.NodeId, Name: _Asset.Name, Description: _Asset.Description }, jsonTree);
                        ej.DataManager(treeObj.currentSelectedData).update("Id", { Id: _Asset.NodeId, Name: _Asset.Name, Description: _Asset.Description }, treeObj.currentSelectedData);

                        // Actualizamos el mainCache de activos 
                        ej.DataManager(mainCache.loadedAssets).update("Id", {
                            Id: _Asset.NodeId,
                            Name: input.name,
                            Description: input.description,
                            NormalInterval: input.normalInterval,
                            TripMultiply: input.tripMultiply,
                            TransientStatusTimeout: input.transientStatusTimeout
                        }, mainCache.loadedAssets);

                        // Cambia el texto del arbol (treeView)
                        var color = $("#treeView li#" + _Asset.NodeId + " a.e-text>div>span")[0].style["color"];
                        $("#treeView li#" + _Asset.NodeId + ">div>#treeView_active>div").html("<span class='fa fa-diamond icon-large' style='background-color: transparent; color:" + color + "; padding: 2px;'></span> " + _Asset.Name);
                    },
                    complete: function (result) {
                        $("#formAsset").ejDialog("close");
                        popUp("success", "Se actualizó correctamente el activo " + input.name);
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                    }
                });
            }
        });

        function obj(node, asset, input, updateHasChild) {
            var nod = ej.DataManager(jsonTree).executeLocal(ej.Query().where("Id", "equal", node.Id, false))[0];

            if (nod.EntityType == 2) {
                updateHasChild = true;
                ej.DataManager(jsonTree).update("Id", { Id: nod.Id, HasChild: true }, jsonTree);
            }

            var _Node = {
                ParentId: node.Id,
                Level: node.Level,
                Name: input.name,
                Description: input.description,
                //HasChild: node.HasChild,
                HasChild: false,
                Type: 2,
                Status: [{ Corp: 3, StatusId: "" }]
            };

            var _Asset = {
                Name: input.name,
                Description: input.description,
                NodeId: null,
                IsPrincipal: asset.IsPrincipal,
                PrincipalAssetId: asset.PrincipalAssetId,
                NormalInterval: input.normalInterval != null ? input.normalInterval.toString().replace('.', ',') : null,
                TripMultiply: input.tripMultiply,
                TransientStatusTimeout: input.transientStatusTimeout != null ? input.transientStatusTimeout.toString().replace('.', ',') : 0,
            };

            var obj = [{ node: _Node, asset: _Asset, updateHasChild}];
            return obj;
        }

        // Busca el activo principal a través de un AssetId pasado
        function searchAssetPrincipal(assetId) {
            var asset = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "Equal", assetId, false))[0];
            if (asset.IsPrincipal == true) {
                _principalAssetId = asset.AssetId
                return;
            }
            else {
                var _assetId = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "Equal", asset.ParentId, false))[0].AssetId;
                searchAssetPrincipal(_assetId);
            }
        };

        _createConfirmDialogDeleting = function (title, question, asset) {
            $("#dialogDelete").ejDialog({
                showOnInit: false,
                title: title,
                allowDraggable: false,
                enableAnimation: true,
                width: "30%",
                height: "4%",
                enableResize: false,
                showHeader: true,
                enableModal: true,
                showRoundedCorner: true,
                animation: {
                    show: { effect: "slide", duration: 500 },
                    hide: { effect: "fade", duration: 500 }
                },
                beforeOpen: function (args) {
                    // Se cambia el texto de la pregunta de la etiqueta '<p>'
                    $("#pQuestion").text(question);

                    $("#btnDelete").ejButton({
                        size: "small",
                        type: "button",
                        imagePosition: "imageleft",
                        contentType: "textandimage",
                        showRoundedCorner: true,
                        prefixIcon: "e-icon e-delete",
                        click: function (args) {
                            idList.push({ Id: asset.Id, EntityType: asset.EntityType });
                            retriveNodeChildren(asset.Id);

                            // Verificamos si el parentId del activo eliminado se debe actualizar su propiedad HasChild en false (aplica sólo para nodo tipo activo)
                            var nodeId = null;
                            var brothers = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", asset.ParentId, true).and("EntityType", "equal", 2, true)));
                            // Si existen hermanos nodos tipo activo fuera del que se eliminará
                            if (brothers.length == 1) {
                                var parent = ej.DataManager(jsonTree).executeLocal(ej.Query().where("Id", "equal", asset.ParentId, false))[0];
                                if (parent.EntityType == 2) {
                                    nodeId = parent.Id;
                                    ej.DataManager(jsonTree).update("Id", { Id: parent.Id, HasChild: false }, jsonTree);
                                }
                            }

                            $.ajax({
                                url: "/Home/DeleteMany",
                                method: "POST",
                                data: { nodes: idList, nodeId: nodeId },
                                success: function (response) {
                                    $("#dialogDelete").addClass("hidden");
                                    $("#dialogDelete").ejDialog("destroy");

                                    for (var n = 0; n < idList.length; n++) {
                                        ej.DataManager(jsonTree).remove("Id", idList[n].Id);
                                        treeObj.removeNode($("#" + idList[n].Id));
                                    }

                                    if ($("#measurementPoints").data("ejListBox")) {
                                        $("#measurementPoints").ejListBox("destroy");
                                    }
                                    treeObj.selectNode($("#" + asset.ParentId));

                                    idList = [];
                                    popUp("success", "Activo " + asset.Name + " eliminado correctamente!");
                                },
                                error: function (jqXHR, textStatus) {
                                    popUp("error", "A ocurrido un error. Intente nuevamente!");
                                },
                            });
                        },
                    });

                    $("#btn_Cancel").ejButton({
                        size: "small",
                        type: "button",
                        imagePosition: "imageleft",
                        contentType: "textandimage",
                        showRoundedCorner: true,
                        prefixIcon: "e-icon e-cancel",
                        click: function (args) {
                            $("#dialogDelete").addClass("hidden");
                            $("#dialogDelete").ejDialog("destroy");
                        }
                    });
                },
                close: function (args) {
                    $("#dialogDelete").addClass('hidden');
                    $("#btnDelete").ejButton("destroy");
                    $("#btn_Cancel").ejButton("destroy");
                },
            });

            $("#dialogDelete").removeClass('hidden');
            $("#dialogDelete").ejDialog("open");
        };

        _createEventVelocity = function (title, asset) {
            $("#formEventVelocity").ejDialog({
                title: title,
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                width: "45%",
                height: "50%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                //scrollSettings: { height: "49%" },
                //allowScrolling: true,
                allowDraggable: true,
                enableResize: true,
                minWidth: "44%",
                //minHeight: "40%",
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: {
                    show: { effect: "slide", duration: 500 },
                    hide: { effect: "fade", duration: 500 }
                },
                open: function (args) {
                    autoHeightEjDialog("#formEventVelocity", _heightWindow);
                },
                beforeOpen: function (args) {

                    // Guarda los cambios hechos en el evento cambio de velocidad de un activo principal
                    $("#btnSaveEventVelocity").click(function () {
                        var rpmEventConfig = getFormValuesEventVelocity();


                        if (rpmEventConfig) {
                            // Si no hay KPH seleccionado, se setea en null la propiedad AngularReferenceId
                            if (rpmEventConfig.AngularReferenceId == "0") {
                                rpmEventConfig.AngularReferenceId = null;
                            }

                            var assetExt = {
                                Id: _asset.AssetId,
                                RpmEventConfig: rpmEventConfig,
                                AsdaqId: _asset.AsdaqId,
                            };

                            var _hasChanges = HasChangesEventVelocity(_eventVelocityOriginal, rpmEventConfig);
                            //alert("Hubieron Cambios: " + _hasChanges);

                            $.ajax({
                                url: "/Home/SaveEventVelocity",
                                method: "POST",
                                data: { asset: assetExt, hasChanges: _hasChanges },
                                success: function (result) {
                                    $("#formEventVelocity").ejDialog("close");

                                    // Actualizamos el mainCache de activos con los cambios hechos recientemente
                                    var updateAsset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("AssetId", "equal", assetExt.Id, false))[0];
                                    updateAsset.RpmEventConfig = assetExt.RpmEventConfig;

                                    popUp("success", "Se configuró correctamente el evento de velocidad!");
                                },
                                error: function (jqXHR, textStatus) {
                                    popUp("error", "Ha ocurrido un error, intentelo de nuevo!");
                                }
                            });
                        }
                        else {
                            popUp("error", "Campo(s) obligatorio(s)!");
                        }
                    });

                    // Cierre y cancela el formulario "Configurar evento de velocidad" de un activo principal
                    $("#btnCancelEventVelocity").click(function () {
                        $("#formEventVelocity").addClass('hidden');
                        $("#formEventVelocity").ejDialog("close");
                    });

                    // Copia del objeto original
                    _eventVelocityOriginal = clone(asset.RpmEventConfig);
                    createControlsEvent(asset);
                },//Fin beforeOpen
                close: function (args) {
                    $("#btnSaveEventVelocity").off("click"); // Necesario desasociar el evento
                    $("#btnCancelEventVelocity").off("click"); // Necesario desasociar el evento
                    $("#ddlAngularReferenceInAssetPpl").ejDropDownList("destroy");
                    $("#chbEnabled").ejCheckBox("destroy");
                    $("#txtDeltaRpm").ejNumericTextbox("destroy");
                    $("#txtLowRpm").ejNumericTextbox("destroy");
                    $("#txtUpperRpm").ejNumericTextbox("destroy");
                    $("#txtMinutesBefore").ejNumericTextbox("destroy");
                    $("#txtMinutesAfter").ejNumericTextbox("destroy");
                },//Fin close
            });

            $("#formEventVelocity").ejDialog("open");
            $("#formEventVelocity").removeClass('hidden');
        }

        // Crear los controles necesarios para el fomulario de eventos de cambio de velocidad
        function createControlsEvent(asset) {
            var angularReferenceId = "0";
            if (asset.RpmEventConfig != null) {
                if (asset.RpmEventConfig.AngularReferenceId != null)
                    angularReferenceId = asset.RpmEventConfig.AngularReferenceId;
            }

            $("#ddlAngularReferenceInAssetPpl").ejDropDownList({
                dataSource: _listRefAngular,
                fields: { text: "Name", value: "Id" },
                value: angularReferenceId,
                //value: asset.RpmEventConfig != null ? asset.RpmEventConfig.AngularReferenceId : "0",
                change: function (args) {
                    // Si no seleccionamos un KPH, no marcamos el checkbox (Habilitado) de lo contrario si.
                    if (args.value == "0") {
                        $("#chbEnabled").ejCheckBox({ checked: false });
                    } else {
                        $("#chbEnabled").ejCheckBox({ checked: true });
                    }
                }
            });

            $("#chbEnabled").ejCheckBox({
                size: "medium",
                checked: asset.RpmEventConfig != null ? asset.RpmEventConfig.Enabled : false,
            });

            $("#txtDeltaRpm").ejNumericTextbox({
                value: asset.RpmEventConfig != null ? asset.RpmEventConfig.DeltaRpm : 10,
                minValue: 0,
            });
            $("#txtLowRpm").ejNumericTextbox({
                value: asset.RpmEventConfig != null ? asset.RpmEventConfig.LowRpm : 40,
                minValue: 0,
                focusOut: function (args) {
                    $("#txtUpperRpm").ejNumericTextbox({ minValue: args.value + 1 });
                },
            });
            $("#txtUpperRpm").ejNumericTextbox({
                value: asset.RpmEventConfig != null ? asset.RpmEventConfig.UpperRpm : 1600,
                minValue: 0,
            });
            $("#txtMinutesBefore").ejNumericTextbox({
                value: asset.RpmEventConfig != null ? asset.RpmEventConfig.MinutesBefore : 5,
                minValue: 0,
                decimalPlaces: 2
            });
            $("#txtMinutesAfter").ejNumericTextbox({
                value: asset.RpmEventConfig != null ? asset.RpmEventConfig.MinutesAfter : 5,
                minValue: 0,
                decimalPlaces: 2
            });

        }

        // Obtiene todos los valores de cada uno de los controles que se presentan en el formulario de evento de velocidad
        function getFormValuesEventVelocity() {
            var deltaRpm = $("#txtDeltaRpm").ejNumericTextbox("getValue"),
                lowRpm = $("#txtLowRpm").ejNumericTextbox("getValue"),
                upperRpm = $("#txtUpperRpm").ejNumericTextbox("getValue"),
                minutesBefore = $("#txtMinutesBefore").ejNumericTextbox("getValue"),
                minutesAfter = $("#txtMinutesAfter").ejNumericTextbox("getValue");

            if (![deltaRpm, lowRpm, upperRpm, minutesBefore, minutesAfter].includes(null)) {
                return {
                    AngularReferenceId: $('#ddlAngularReferenceInAssetPpl').ejDropDownList("getSelectedValue"),
                    Enabled: $("#chbEnabled").ejCheckBox("isChecked"),
                    DeltaRpm: deltaRpm.toString().replace('.', ','),
                    LowRpm: lowRpm.toString().replace('.', ','),
                    UpperRpm: upperRpm.toString().replace('.', ','),
                    MinutesBefore: minutesBefore.toString().replace('.', ','),
                    MinutesAfter: minutesAfter.toString().replace('.', ','),
                };
                //return control;
            }
            else {
                validateFieldsEventVelocity({ deltaRpm, lowRpm, upperRpm, minutesBefore, minutesAfter});
                return null;
                }
        }

        // Busca todos los KPH desde un activo principal y toda su descendencia si la tiene
        function GetListReferenceAngular(asset) {
            var refAngulars = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", asset.AssetId, true).and("SensorTypeCode", "equal", 4, true)));
            for (var ra = 0; ra < refAngulars.length; ra++) {
                _listRefAngular.push(refAngulars[ra]);
            }

            var childrens = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", asset.Id, true).and("EntityType", "equal", 2, true)));
            for (var ch = 0; ch < childrens.length; ch++) {
                GetListReferenceAngular(childrens[ch]);
            }
        }

        _createEventConditionStatus = function (title, asset) {
            $("#formEventConditionStatus").ejDialog({
                title: title,
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                width: "65%",
                height: "55%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                scrollSettings: { height: "54%" },
                allowScrolling: true,
                allowDraggable: true,
                enableResize: true,
                //minWidth: "65%",
                //minHeight: "50%",
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: {
                    show: { effect: "slide", duration: 500 },
                    hide: { effect: "fade", duration: 500 }
                },
                open: function (args) {
                    autoHeightEjDialog("#formEventConditionStatus", _heightWindow);
                },
                beforeOpen: function (args) {

                    // Guarda los cambios hechos en el evento condición de estados de un activo principal
                    $("#btnSaveECS").click(function () {
                        var conditionStatus = $("#gridConditionStatus").data("ejGrid").model.dataSource;

                        for (var cs = 0; cs < conditionStatus.length; cs++) {
                            conditionStatus[cs].Interval = conditionStatus[cs].Interval.toString().replace('.', ',');
                            conditionStatus[cs].MinutesBefore = conditionStatus[cs].MinutesBefore.toString().replace('.', ',');
                            conditionStatus[cs].MinutesAfter = conditionStatus[cs].MinutesAfter.toString().replace('.', ',');

                            if (!conditionStatus[cs].NotifyList)
                                conditionStatus[cs].NotifyList = [];

                            // Si no se ha configurado la plantilla de correo se guardan por defecto la predeterminada
                            if (!conditionStatus[cs].MailLayout) {
                                conditionStatus[cs].MailLayout = {
                                    Subject: _subject,
                                    Message: _message,
                                };
                            }
                        }

                        var assetExt = {
                            Id: _asset.AssetId,
                            ConditionStatusEventsConfig: conditionStatus,
                            AsdaqId: _asset.AsdaqId,
                        };

                        var _hasChanges = HasChangesConditionStatus(_conditionStatusOriginal, conditionStatus);
                        //alert("Hubieron Cambios: " + _hasChanges);

                        $.ajax({
                            url: "/Home/SaveConditionStatusEventsConfig",
                            method: "POST",
                            data: { asset: assetExt, hasChanges: _hasChanges },
                            success: function (response) {
                                $("#formEventConditionStatus").ejDialog("close");
                                // Actualizamos el mainCache de activos con los cambios hechos recientemente
                                var updateAsset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("AssetId", "equal", assetExt.Id, false))[0];
                                updateAsset.ConditionStatusEventsConfig = assetExt.ConditionStatusEventsConfig;

                                popUp("success", "Se configuró correctamente el evento de estados de condición!");
                            },
                            complete: function (e) { },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "A ocurrido un error. Intente nuevamente!");
                            }
                        });
                    });

                    // Cierra y cancela el formulario "Configurar eventos de condición" de un activo principal
                    $("#btnCancelECS").click(function () {
                        $("#formEventConditionStatus").addClass('hidden');
                        $("#formEventConditionStatus").ejDialog("close");
                    });

                    if (asset.ConditionStatusEventsConfig == null)
                        asset.ConditionStatusEventsConfig = [];
                    else {
                        for (var cs = 0; cs < asset.ConditionStatusEventsConfig.length; cs++) {
                            if (asset.ConditionStatusEventsConfig[cs].NotifyList == null)
                                asset.ConditionStatusEventsConfig[cs].NotifyList = [];
                        }
                    }
                    // Copia del objeto original
                    _conditionStatusOriginal = JSON.parse(JSON.stringify(asset.ConditionStatusEventsConfig));
                    createGridEventConditionStatus(asset);
                },
                close: function (args) {
                    //$("#btnSaveEventVelocity").off("click"); // Necesario desasociar el evento
                    //$("#btnCancelEventVelocity").off("click"); // Necesario desasociar el evento
                    $("#btnSaveECS").off("click");
                    $("#btnCancelECS").off("click");
                    $("#gridConditionStatus").ejGrid("destroy");

                    if (_isCreatedGridNotifyList)
                        $("#gridNotifyList").ejGrid("destroy");

                    OffEventClick();

                },//Fin close
            });

            $("#formEventConditionStatus").ejDialog("open");
            $("#formEventConditionStatus").removeClass('hidden');
        }

        function createGridEventConditionStatus(asset) {
            // Filtramos la lista de estados con una severity mayor a 1 para mostrar 
            var filteredStatusList = ej.DataManager(arrayObjectStatus).executeLocal(ej.Query().where("Severity", "greaterThan", 1, false));

            $("#gridConditionStatus").ejGrid({
                dataSource: asset.ConditionStatusEventsConfig,
                locale: "es-ES",
                isResponsive: true,
                enableResponsiveRow: true,
                allowResizing: true,
                allowTextWrap: true,
                textWrapSettings: { wrapMode: ej.Grid.WrapMode.Header },
                //allowScrolling: true,
                //scrollSettings: { height: "500px", },
                gridLines: ej.Grid.GridLines.Both,
                editSettings: { allowAdding: true, rowPosition: "bottom", allowEditing: true, allowEditOnDblClick: true, editMode: "normal", allowDeleting: true, showDeleteConfirmDialog: true, showConfirmDialog: false },
                toolbarSettings: {
                    showToolbar: true,
                    toolbarItems: ["add", "update", "cancel", "delete"],
                },
                columns: [
                    { field: "Enabled", headerText: 'Habilitado', width: "5%", textAlign: "center", editType: "booleanedit", defaultValue: true },
                    { field: "StatusId", headerText: 'Estado Condición', textAlign: "center", width: "15%", editType: ej.Grid.EditingType.Dropdown, dataSource: filteredStatusList, foreignKeyField: "Id", foreignKeyValue: "Name", isPrimaryKey: true },
                    { field: "Interval", headerText: "Intervalo (min)", width: "15%", textAlign: "center", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 } },
                    { field: "MinutesBefore", headerText: "Tiempo Antes (min)", width: "25%", textAlign: "center", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 } },
                    { field: "MinutesAfter", headerText: "Tiempo Después (min)", width: "25%", textAlign: "center", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 } },
                    //{ headerText: "Plantilla Correo", textAlign: "center", templateID: "#btnTemplateMail", template: true, width: "5%" },
                    {
                        field: "", headerText: "Plantilla Correo", width: "15%",
                        commands:
                        [{
                            type: "details",
                            buttonOptions: {
                                contentType: "imageonly",
                                prefixIcon: "e-icon e-settings",
                                width: "50px",
                                size: "normal",
                                click: function (args) {
                                    if (!_statusId) {
                                        popUp("error", "Agregue primero un evento por estado de condición para poder configurar la plantilla de correo");
                                    } else
                                        CreateTemplateMail();
                                }
                            },
                        }],
                        isUnbound: true,
                        textAlign: ej.TextAlign.Center
                    },
                ],
                rowSelected: function (args) {
                    _statusId = args.data.StatusId;

                    if (args.data.NotifyList != null) {
                        var notifyList = args.data.NotifyList;
                        for (var nl = 0; nl < notifyList.length; nl++) {
                            var user = ej.DataManager(_usersCompanie).executeLocal(ej.Query().where("Id", "equal", notifyList[nl].UserId, false))[0];
                            if (user !== undefined) {  // Valida si el Id del usuario existe en BD
                                // Agregamos el statusId al NotifiyList para poder relacionarlo con el gridNotifyList
                                notifyList[nl].StatusId = args.data.StatusId;
                                notifyList[nl].Email = user.Companies[0].Email;
                                notifyList[nl].Index = _index++;
                            }
                        }
                        createGridNotifyList(notifyList);
                    }
                    else
                        createGridNotifyList([]);
                },
                actionComplete: function (args) {
                    if (args.requestType == "add") {
                        //$("#gridConditionStatusEnabled").prop('checked', true);
                        for (var cs = 0; cs < args.model.dataSource.length; cs++) {
                            var items = $('#gridConditionStatusStatusId').ejDropDownList("getListData");
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].value == args.model.dataSource[cs].StatusId) {
                                    $('#gridConditionStatusStatusId').ejDropDownList("disableItemsByIndices", i);
                                    break;
                                }
                            }
                        }
                    }
                    else if (args.requestType == "beginedit") {
                        $('#gridConditionStatusInterval').ejNumericTextbox({ minValue: 0 });
                        $('#gridConditionStatusMinutesBefore').ejNumericTextbox({ minValue: 0 });
                        $('#gridConditionStatusMinutesAfter').ejNumericTextbox({ minValue: 0 });

                    }

                    // Habilita o no el boton "Guardar" del ejDialog de Configuración eventos por estados de condición
                    if (["add", "beginedit"].includes(args.requestType)) {
                        $("#btnSaveECS").attr('disabled', 'disabled');
                    }
                    else { // "cancel","delete","save" 
                        $("#btnSaveECS").removeAttr('disabled');
                    }
                },
                toolbarClick: function (args) {
                    if (args.itemName == "Agregar") {
                        _statusId = null;
                        if (args.model.dataSource) {
                            if (args.model.dataSource.length == filteredStatusList.length)
                                args.cancel = true;
                        }
                    }
                },
                actionBegin: function (args) {
                    //if (["save","Actualizar"].includes(args.requestType)) {
                    if (args.requestType == "save") {
                        if ([args.data.StatusId, args.data.Interval, args.data.MinutesAfter, args.data.MinutesBefore].includes(null)) {
                            args.cancel = true;
                            popUp("error", "Todos los campos deben estar llenos!");
                        } else {
                            // Se debe setear esta propiedad de esta manera debido a un problema con el value del checkbox donde su valor queda "on"
                            args.data.Enabled = $("#gridConditionStatusEnabled").is(":checked");
                        }
                    }
                },
                allowKeyboardNavigation: true,
                pageSettings: { pageSize: 10 },
                showStackedHeader: true,
                //stackedHeaderRows: [{ stackedHeaderColumns: [{ headerText: "Eventos de condición de estados", column: "Enabled,StatusId,Interval,MinutesBefore,MinutesAfter" }] }],
                rowDataBound: function (args) {
                    var statu = ej.DataManager(arrayObjectStatus).executeLocal(ej.Query().where("Id", "equal", args.rowData.StatusId, false))[0];
                    var $element = $(args.row[0].children[1]);
                    //Le agregamos a la columna "Estado Condición" el icono "circulo" con el color perteneciente al tipo de estado                    
                    $element.html("<span class='fa fa-circle icon-large' style='background-color: transparent; color:" + statu.Color + "; padding: 2px;'></span> " + statu.Name);
                }
            });
        }

        function createGridNotifyList(notifiyList) {

            $("#gridNotifyList").ejGrid({
                dataSource: notifiyList,
                locale: "es-ES",
                isResponsive: true,
                //enableResponsiveRow: true,
                allowResizing: true,
                //allowScrolling: true,
                //scrollSettings: { height: "500px", },
                gridLines: ej.Grid.GridLines.Both,
                editSettings: { allowAdding: true, rowPosition: "bottom", allowEditing: true, allowEditOnDblClick: true, editMode: "normal", allowDeleting: true, showDeleteConfirmDialog: true, showConfirmDialog: false },
                toolbarSettings: {
                    showToolbar: true, toolbarItems: ["add", "edit", "delete", "update", "cancel"]
                },
                pageSettings: { pageSize: 10 },
                columns: [
                    { field: "Index", headerText: 'UserId', textAlign: "center", width: "5%", isPrimaryKey: true, visible: false },
                    { field: "UserId", headerText: 'Usuario', textAlign: "center", width: "20%", editType: ej.Grid.EditingType.Dropdown, dataSource: _usersCompanie, foreignKeyField: "Id", foreignKeyValue: "UserName", },
                    { field: "StatusId", headerText: 'StatusId', textAlign: "center", width: "5%", visible: false },
                    { field: "Email", headerText: "Correo", width: "35%", textAlign: "center", allowEditing: false },
                    { field: "SendMail", headerText: 'Enviar Correo', width: "15%", textAlign: "center", editType: "booleanedit", defaultValue: true, }// editParams: { checked: true } },
                ],
                showStackedHeader: true,
                stackedHeaderRows: [{ stackedHeaderColumns: [{ headerText: "Notificaciones", column: "Index,UserId,StatusId,Email,SendMail" }] }],
                actionComplete: function (args) {
                    if (args.requestType == "add") {
                        // Elimina el estilo del checkbox de la columna "Enviar Correo" para que se pueda ver al momento de agregar o editar una notificacion
                        //$("#gridNotifyListSendMail").removeAttr("style");
                        // Pone por defecto en true el checkbox de la columna "Enviar Correo" al agregar una notificación nueva
                        // $("#gridNotifyListSendMail").prop("checked", true);
                        //$("#gridNotifyListSendMail").ejCheckBox({ checked: true }); // sln temporal

                        // Desahibilitamos los usuarios (dropdownlist) de la columna "Usuarios" que ya existen.
                        var items = $('#gridNotifyListUserId').ejDropDownList("getListData");
                        for (var u = 0; u < args.model.dataSource.length; u++) {
                            for (var i = 0; i < items.length; i++) {
                                if (items[i].value == args.model.dataSource[u].UserId) {
                                    $('#gridNotifyListUserId').ejDropDownList("disableItemsByIndices", i);
                                    break;
                                }
                            }
                        }
                        ToChangeEmail();
                    }
                    else if (args.requestType == "save") {
                        // Al agregar un nuevo usuario se inserta el StatusId que se relaciona con éste y el Index que es la primaryKey de una fila unica
                        if (args.data.Index == null) {
                            args.data.StatusId = _statusId;
                            args.data.Index = _index++;

                            // Actualizamos el dataSource del gridConditionStatus
                            var conditionStatus = $("#gridConditionStatus").data("ejGrid").model.dataSource;
                            for (var cs = 0; cs < conditionStatus.length; cs++) {
                                if (conditionStatus[cs].StatusId == args.data.StatusId) {
                                    conditionStatus[cs].NotifyList = args.model.dataSource;
                                    break;
                                }
                            }

                            $("#gridNotifyList").ejGrid("refreshContent");
                        }
                    }
                    else if (args.requestType == "delete") {
                        // Actualizamos el dataSource del gridConditionStatus, al eliminar una notificación.
                        var conditionStatus = $("#gridConditionStatus").data("ejGrid").model.dataSource;
                        for (var cs = 0; cs < conditionStatus.length; cs++) {
                            if (conditionStatus[cs].StatusId == args.data.StatusId) {
                                conditionStatus[cs].NotifyList = args.model.dataSource;
                                break;
                            }
                        }
                        _selectedNotity = null;
                    }
                    else if (args.requestType == "beginedit") {
                        if (args.model.dataSource.length == _usersCompanie.length)
                            $("#gridNotifyListUserId").ejDropDownList("disable");
                        else {
                            $("#gridNotifyListUserId").ejDropDownList("enable");
                            ToChangeEmail();
                        }
                    }

                    // Habilita o no el boton "Guardar" del ejDialog de Configuración eventos por estados de condición
                    if (["add", "beginedit"].includes(args.requestType)) {
                        $("#btnSaveECS").attr('disabled', 'disabled');
                    } else { // "cancel","delete","save"
                        $("#btnSaveECS").removeAttr('disabled');
                    }
                },
                toolbarClick: function (args) {
                    // Cancela el evento clic de agregar si ya existen todos los usuarios relacionados a esta compañia
                    if (args.itemName == "Agregar") {
                        if (args.model.dataSource) {
                            if (args.model.dataSource.length == _usersCompanie.length)
                                args.cancel = true;
                        }
                        _selectedNotity = null;
                    }
                },
                rowSelected: function (args) {
                    // Notificación seleccionada
                    _selectedNotity = args.data;
                },
                actionBegin: function (args) {
                    if (args.requestType == "save") {
                        if (args.data.UserId == null) {
                            args.cancel = true;
                            popUp("error", "Seleccione un usuario!");
                        } else {
                            // Se debe setear esta propiedad de esta manera debido a un problema con el value del checkbox donde su valor queda "on"
                            args.data.SendMail = $("#gridNotifyListSendMail").is(":checked");
                        }
                    }
                },
                //queryCellInfo: function (args) {
                //    if (args.column.field == "SendMail" && !$(args.cell).find("input").hasClass("e-checkbox")) {
                //        $(args.cell).find("input").ejCheckBox({ checked: true });//render the ejCheckbox                        
                //    }
                //},
            });
            _isCreatedGridNotifyList = true;
        };

        // csA -> conditionStatusA (Objeto original)
        // csB -> conditionStatusB (Objeto actual)
        // Valida si hubieron cambios entre los dos parametros (csA, csB) para notificarselo al Asdaq
        function HasChangesConditionStatus(csA, csB) {
            var hasChanges = false;
            if (csA.length == csB.length) {
                for (var i = 0; i < csA.length; i++) {

                    var conditionStatu = ej.DataManager(csB).executeLocal(ej.Query().where("StatusId", "equal", csA[i].StatusId, false));
                    if (conditionStatu.length > 0) {
                        if ((csA[i].Enabled != conditionStatu[0].Enabled) || (csA[i].Interval != conditionStatu[0].Interval) || (csA[i].MinutesBefore != conditionStatu[0].MinutesBefore) || (csA[i].MinutesAfter != conditionStatu[0].MinutesAfter) || (csA[i].MailLayout != conditionStatu[0].MailLayout)) {
                            hasChanges = true;
                            break;
                        }

                        if (csA[i].NotifyList.length == conditionStatu[0].NotifyList.length) {

                            for (var n = 0; n < csA[i].NotifyList.length; n++) {
                                var user = ej.DataManager(csB[i].NotifyList).executeLocal(ej.Query().where("UserId", "equal", csA[i].NotifyList[n].UserId, false));
                                if (user.length > 0) {
                                    if (csA[i].NotifyList[n].SendMail != user[0].SendMail) {
                                        hasChanges = true;
                                        break;
                                    }
                                } else {
                                    hasChanges = true;
                                    break;
                                }
                            }

                        } else {
                            hasChanges = true;
                            break;
                        }
                    } else {
                        hasChanges = true;
                        break;
                    }
                }
            } else
                hasChanges = true;

            return hasChanges;
        }

        // rpmECA -> rpmEventConfigA (Objeto original)
        // rpmECB -> rpmEventConfigB (Objeto actual)
        // Valida si hubieron cambios entre los dos parametros (rpmECA, rpmECB) para notificarselo al Asdaq
        function HasChangesEventVelocity(rpmECA, rpmECB) {
            var hasChanges = false;
            if (rpmECA == null && rpmECB) {
                hasChanges = true;
            } else {
                if (!rpmECB)
                    hasChanges = true;
                else {
                    if ((rpmECA.AngularReferenceId != rpmECB.AngularReferenceId) || (rpmECA.Enabled != rpmECB.Enabled) || (rpmECA.DeltaRpm != rpmECB.DeltaRpm) || (rpmECA.LowRpm != rpmECB.LowRpm) || (rpmECA.UpperRpm != rpmECB.UpperRpm) || (rpmECA.MinutesBefore != rpmECB.MinutesBefore) || (rpmECA.MinutesAfter != rpmECB.MinutesAfter))
                        hasChanges = true;
                }
            }
            return hasChanges;
        }

        // Cambia el Email de forma dinámica del un usuario seleccionado en la columna "Usuario" del gridNotifyList
        function ToChangeEmail() {
            $('#gridNotifyListUserId').ejDropDownList({
                change: function (args) {
                    var user = ej.DataManager(_usersCompanie).executeLocal(ej.Query().where("Id", "equal", args.value, false));
                    if (user.length > 0) {
                        var data = $("#gridNotifyList").data("ejGrid").model.dataSource;
                        if (_selectedNotity) {
                            for (var i = 0; i < data.length; i++) {
                                if (data[i].UserId == _selectedNotity.UserId) {
                                    data[i].UserId = user[0].Id;
                                    data[i].Email = user[0].Companies[0].Email;
                                    $("#gridNotifyListEmail").val(data[i].Email);
                                }
                            }
                            _selectedNotity = null;
                        } else
                            $("#gridNotifyListEmail").val(user[0].Companies[0].Email); // Agregamos el nombre del email asociado al usuario seleccionado                   
                    }
                }
            });
        }

        function CreateTemplateMail() {
            $("#configurationTemplateMail").ejDialog({
                title: "Configuración Plantilla de Correo",
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                width: "50%",
                height: "60%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                scrollSettings: { height: "59%" },
                allowScrolling: true,
                allowDraggable: true,
                enableResize: true,
                //minWidth: "50%",
                //minHeight: "95%",
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: {
                    show: { effect: "slide", duration: 500 },
                    hide: { effect: "fade", duration: 500 }
                },
                open: function (args) {
                    autoHeightEjDialog("#configurationTemplateMail", _heightWindow);
                },
                beforeOpen: function (args) {
                    $("#btnOkTemplateMail").click(function () {
                        var conditionStatus = $("#gridConditionStatus").data("ejGrid").model.dataSource;
                        var statusId = $("#gridConditionStatus").ejGrid("getSelectedRecords")[0].StatusId; // statusId seleccionado del gridConditionStatus
                        for (var cs = 0; cs < conditionStatus.length; cs++) {
                            if (conditionStatus[cs].StatusId == statusId) {
                                conditionStatus[cs].MailLayout = {
                                    Subject: $("#txtSubject").val(),
                                    Message: $("#txtMessage").val()
                                };
                            }

                            if (!conditionStatus[cs].NotifyList)
                                conditionStatus[cs].NotifyList = [];
                        }
                        $("#configurationTemplateMail").ejDialog("close");
                    });

                    $("#btnCancelTemplateMail").click(function () {
                        $("#configurationTemplateMail").addClass('hidden');
                        $("#configurationTemplateMail").ejDialog("close");
                    });

                    $("#btnPathAsset").on('click', { text: "{RutaActivo}" }, function (e) { ChangeText(e.data.text); });
                    $("#btnStatuCondition").on('click', { text: "{EstadoCondicion}" }, function (e) { ChangeText(e.data.text); });
                    $("#btnTimeStamp").on('click', { text: "{EstampaTiempo}" }, function (e) { ChangeText(e.data.text); });

                    var conditionStatu = $("#gridConditionStatus").ejGrid("getSelectedRecords")[0];
                    var mailLayout = null;

                    if (typeof conditionStatu !== "undefined") {
                        if (conditionStatu.MailLayout != null || typeof (conditionStatu.MailLayout) !== "undefined")
                            mailLayout = conditionStatu.MailLayout;
                        else
                            mailLayout;
                    } else
                        mailLayout;

                    $("#txtSubject").val(mailLayout == null ? _subject : mailLayout.Subject);
                    $("#txtMessage").val(mailLayout == null ? _message : mailLayout.Message);
                },
                close: function (args) {
                    $("#txtSubject").val("");
                    $("#txtMessage").val("");
                    OffEventClick();
                },//Fin close
            });

            $("#configurationTemplateMail").ejDialog("open");
            $("#configurationTemplateMail").removeClass('hidden');
        }

        // Eventos (click,change) para obtener la posición del cursor en la configuración de plantila del correo
        $("#txtMessage").click(function () {
            _controlId = this.id;
            _positionCursor = this.selectionEnd;
        });

        $("#txtSubject").click(function () {
            _controlId = this.id;
            _positionCursor = this.selectionEnd;
        });

        $("#txtMessage").change(function () {
            _positionCursor = this.selectionEnd;
        });

        $("#txtSubject").change(function () {
            _positionCursor = this.selectionEnd;
        });

        // Función necesaria para desasociar el evento click 
        function OffEventClick() {
            $("#btnPathAsset").off("click");
            $("#btnStatuCondition").off("click");
            $("#btnTimeStamp").off("click");
            $("#btnOkTemplateMail").off("click");
            $("#btnCancelTemplateMail").off("click");
        }

        // Genera un nuevo texto a partir del parametro (MailLayout) que se desea agregar
        function ChangeText(text) {
            if (_controlId != null) {
                var oldText = $("#" + _controlId).val();
                var newText = $("#" + _controlId).val().substring(0, _positionCursor);
                newText += text + oldText.substring(newText.length);
                $("#" + _controlId).val(newText);
                _controlId = null;
            }
        }

        // Crea cada uno de los listbox en la configuración de Pares XY de un activo
        function createControlsPairsXY(asset) {
            var pointsXY = [];
            // Hacemos una copia de los puntos de medición asociados al activo seleccionado
            var mdVariables = JSON.parse(JSON.stringify($("#measurementPoints").data("ejListBox").model.dataSource));
            // Filtramos solo los puntos de medicíón que sean Proximidad y Accelerometros
            mdVariables = ej.DataManager(mdVariables).executeLocal(ej.Query().where(ej.Predicate("SensorTypeCode", "equal", 1, true).or("SensorTypeCode", "equal", 2, true).or("SensorTypeCode", "equal", 3, true)));

            // Creamos el DataSource para el listbox "lbPointsXY", donde se muestran los pares xy relacionados
            for (var m = 0; m < mdVariables.length; m++) {
                if (mdVariables[m].AssociatedMeasurementPointId) {

                    var pointAssociated = ej.DataManager(mdVariables).executeLocal(ej.Query().where("Id", "equal", mdVariables[m].AssociatedMeasurementPointId, false));
                    if (pointAssociated.length > 0) {
                        if (mdVariables[m].Orientation == 1) {
                            pointsXY.push({
                                Name: mdVariables[m].Name + " / " + pointAssociated[0].Name,
                                Id: mdVariables[m].Id + "-" + pointAssociated[0].Id,
                                Orientation: 1,
                                AssociatedMeasurementPointId: mdVariables[m].AssociatedMeasurementPointId,
                            });

                        } else if (mdVariables[m].Orientation == 2) {
                            pointsXY.push({
                                Name: pointAssociated[0].Name + " / " + mdVariables[m].Name,
                                Id: pointAssociated[0].Id + "-" + mdVariables[m].Id,
                                Orientation: 2,
                                AssociatedMeasurementPointId: mdVariables[m].AssociatedMeasurementPointId,
                            });
                        }
                    }
                }
            }

            $("#lbPointsX").ejListBox({
                dataSource: mdVariables,
                query: ej.Query().where(ej.Predicate("Orientation", "equal", 1, true).and("AssociatedMeasurementPointId", "equal", null, true)),
                fields: { text: "Name", value: "Id" },
                height: "300", width: "120%",
                select: function (args) {
                    _pairXselected = { Name: args.text, Id: args.value };
                },
                //itemsCount: 10, allowVirtualScrolling: true, itemHeight: "12px", totalItemsCount: 8
            });

            $("#lbPointsY").ejListBox({
                dataSource: mdVariables,
                query: ej.Query().where(ej.Predicate("Orientation", "equal", 2, true).and("AssociatedMeasurementPointId", "equal", null, true)),
                fields: { text: "Name", value: "Id" },
                height: "300", width: "120%",
                select: function (args) {
                    _pairYselected = { Name: args.text, Id: args.value };
                },
                //itemsCount: 10, allowVirtualScrolling: true, itemHeight: "12px",
            });

            $("#lbPointsXY").ejListBox({
                dataSource: ej.distinct(pointsXY, "Id", true),
                fields: { text: "Name", value: "Id" },
                height: "300", width: "100%",
                select: function (args) {
                    _pairXYselected = { Name: args.text, Id: args.value };
                },
                //itemsCount: 10, allowVirtualScrolling: true, itemHeight: "12px",
            });
        }

        /* Crea el popUp y antes de abrirse crea los respectivos grid's de activos y puntos de medición dependiendo del nodo seleccionado en el arbol.
        Parametros: 
            asset: Indica que fue seleccionado un activo ppal o subActivo del arbol. O que llegue null e indique que fue una ubicación.
            assets: Indica que fue seleccionado una ubicación o activo principal del arbol y que puede contener activos principales o subActivos respectivamente.
            isPrincipal: Indica si fue seleccionado un activo principal o subActivo
            locationNodeId: Aplica para una ubicación seleccionada en el arbol, si no lo es, su valor es null
        */
        _createSummariesView = function (title, asset, assets, isPrincipal, locationNodeId, isAdmin) {
            $("#formSummariesView").ejDialog({
                title: title,
                showOnInit: false,
                actionButtons: ["close", "maximize"],
                enableAnimation: true,
                width: "98%",
                minWidth: "85%",
                height: "90%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                //minHeight: "90%",
                //scrollSettings: { height: "89%", width: "90%" },
                scrollSettings: { height: "89%", },
                zIndex: 11000,
                allowDraggable: true,
                enableResize: true,
                allowScrolling: true,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) {
                    // Redimensiona el alto del popUp para evitar espacios vacios en el y aparezca el scroll cuando sea necesario
                    var _height = $("#divAssets").height() + $("#divPoints").height() + 60;
                    if (_height > _heightWindow)
                        _height = _heightWindow - 10;

                    $('#formSummariesView').data("ejDialog").option({ height: _height + "px" });
                    //$('#formSummariesView').ejDialog("option", "height", "500px");  //Otra forma

                    // Elimina el 1er headerCell y al segundo que pasa a ser el primero, su colspan es seteado en 2 en el grid de activos de la vista resumen
                    //$("#divAssets tr.e-stackedHeaderRow > th:first").remove();
                    //$("#divAssets tr.e-stackedHeaderRow > th:first").attr("colspan", 2);

                    // Oculta el fieldSet de un activo si no contiene puntos de medición
                    $("#divPoints").children('div').each(function () {
                        var exist = $("div#" + this.id + " > fieldset").children('div').length;
                        if (exist == 0)
                            $(this).addClass('hidden');
                    });
                },
                beforeOpen: function (args) {
                    if (!isAdmin) {
                        $("#btnCancelSummaryView").addClass("hidden");
                        $("#btnSaveSummaryView").addClass("hidden");
                    }

                    if (isPrincipal) {
                        // Si existen varios subActivos, buscamos por cada uno de ellos sus puntos de medición y creamos los grid's por sensorType
                        for (var s = 0; s < assets.length; s++) {
                            createGridPointsDynamically(assets[s], isAdmin);
                        }

                        // Agregamos el nuevo elemento "div" que seria donde se mapearia el grid de activos
                        $("#formSummariesView > .container-fluid > #divAssets").append('<div id="grid' + asset.Id + '"></div><p></p>');

                        // Si este objeto es null, debemos agregarle la propiedad "Enabled" para que el grid de activos pinte de manera correcta el chechbox en su respectiva columna "Habilitado"
                        if (asset.RpmEventConfig == null)
                            asset.RpmEventConfig = { Enabled: false, };

                        // Creamos el grid de activos que solo tendra un registro y grid's de puntos de medición asociados al activo
                        createGridAsset([asset], asset.Id, "AssetId", isAdmin);
                    }
                    else {
                        if (locationNodeId != null) { // Es una ubicación ya que el parametro "locationNodeId" llega con un valor
                            // Variable global (_Layout.cshtml)

                            // Recorremos todos los activos que descienden de la ubicación seleccionada para cargar el mainCache.loadedMeasurementPoints, ya que puede que no hayan sido cargados anteriormente.
                            for (var a = 0; a < assets.length; a++) {
                                $("#treeView").ejTreeView("selectNode", $("#" + assets[a].NodeId));
                            }
                            $("#treeView").ejTreeView("selectNode", $("#" + locationNodeId));

                            var interval = setInterval(function () {
                                if (_loadedListbox == assets.length) {
                                    stopInterval(interval);
                                    _loadedListbox = 0;
                                    createGridAsset(assets, locationNodeId, "Id", isAdmin);

                                    var _height = $("#divAssets").height() + $("#divPoints").height() + 120;
                                    if (_height > _heightWindow)
                                        _height = _heightWindow - 10;
                                    $('#formSummariesView').data("ejDialog").option({ height: _height + "px" });
                                }
                            }, 2000);

                        } else // Es un subActivo y unicamente creará los grid's de puntos de medición
                            createGridPointsDynamically(asset, isAdmin);
                    }
                },//Fin beforeOpen
                close: function (args) {
                    // Necesario desasociar el evento de los botones Aceptar y Cancelar
                    $("#btnCancelSummaryView").off("click");
                    $("#btnSaveSummaryView").off("click");
                    _loadedListbox = 0;
                    // Destruimos cada uno de los grid's existentes de puntos de medición y su elemento "fieldset" respectivo que lo contiene
                    $("#formSummariesView > .container-fluid > #divPoints").children('div').each(function () {
                        // Recorre cada fieldset para encontrar cada grid y asi destruirlo
                        $(this.children[0]).children('div').each(function () {
                            var idGrid = $(this).attr('id');
                            $("#" + idGrid).ejGrid("destroy");
                        });
                    });
                    // Eliminamos cada uno de los elementos que están dentro del div #divPoints
                    $("#formSummariesView > .container-fluid > #divPoints").children('div').remove();

                    // Destruimos cada uno de los grid's existentes de activos y su elemento "div" respectivo
                    $("#formSummariesView > .container-fluid > #divAssets").children('div').each(function () {
                        var idGrid = $(this).attr('id');
                        $("#" + idGrid).ejGrid("destroy");
                        $("#" + idGrid).remove();
                    });
                    // Eliminamos todos los elementos "p"
                    $("#formSummariesView > .container-fluid > #divAssets").children('p').remove();
                },//Fin close
            });

            $("#formSummariesView").ejDialog("open");
            $("#formSummariesView").removeClass('hidden');
        }

        // Crea un grid que lista todos los puntos de medición pertenecientes a un tipo de sensor a partir de un activo seleccionado en el árbol
        function createGridPointsBySensorType(points, id, sensorCode, sensorName, _edit) {
            $("#grid" + id).ejGrid({
                dataSource: points,
                locale: "es-ES",
                isResponsive: true,
                enableResponsiveRow: true,
                allowResizing: true,
                //allowScrolling: true,
                //scrollSettings: { height: "500px", },
                gridLines: ej.Grid.GridLines.Both,
                editSettings: { allowEditing: _edit, allowEditOnDblClick: _edit, editMode: "normal", },
                //editSettings: { allowEditing: _edit, editMode: "batch", },
                //toolbarSettings: {
                //    showToolbar: true,
                //    toolbarItems: [ "edit", "update", "cancel" ],
                //},
                pageSettings: { pageSize: 10 },
                columns: [
                    { field: "Id", headerText: 'MdVariableId', textAlign: "center", width: "5%", isPrimaryKey: true, visible: false },
                    { field: "Name", headerText: 'Nombre', textAlign: "center", width: "15%", },
                    { field: "Orientation", headerText: 'Orientación', textAlign: "center", width: "8%", dataSource: _orientation, foreignKeyField: "Code", foreignKeyValue: "Name", },
                    { field: "SensorAngle", headerText: "Ángulo", width: "5%", textAlign: "center", editType: "numericedit", editParams: { decimalPlaces: 1 } },
                    { field: "Units", headerText: 'Unidades', width: "5%", textAlign: "center", editType: "dropdownedit", foreignKeyField: "Code", foreignKeyValue: "Name", },

                    { field: "MagneticFlowParams.PolesCount", headerText: '# Polos', textAlign: "center", width: "5%", visible: false, editType: "numericedit" },
                    { field: "MagneticFlowParams.Pole1Angle", headerText: 'Ángulo Polo 1', textAlign: "center", width: "8%", visible: false, editType: "numericedit", editParams: { decimalPlaces: 1 } },
                    { field: "MagneticFlowParams.PolarGraphRange", headerText: "Rango Gráfica Polar", width: "8%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 1 } },
                    { field: "CurrentParams.Imax", headerText: 'Imax', width: "5%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "CurrentParams.Imin", headerText: 'Imin', textAlign: "center", width: "5%", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "VoltageParams.Vmax", headerText: 'Vmax', textAlign: "center", width: "5%", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "VoltageParams.Vmin", headerText: "Vmin", width: "5%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "Xmax", headerText: 'Xmax', width: "5%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "Xmin", headerText: 'Xmin', textAlign: "center", width: "5%", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "RtdParams.MaterialType", headerText: 'Material', textAlign: "center", width: "8%", visible: false, dataSource: _materials, foreignKeyField: "Code", foreignKeyValue: "Name", },
                    { field: "RtdParams.Ro", headerText: "Ro", width: "5%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "RtdParams.Coefficient", headerText: 'Coeficiente', width: "8%", textAlign: "center", visible: false, dataSource: _coefficient, foreignKeyField: "Value", foreignKeyValue: "Name", },
                    { field: "RtdParams.Iex", headerText: 'Iex', width: "5%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 3 } },
                    { field: "Sensibility", headerText: 'Sensibilidad', width: "8%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 5 } },
                    { field: "SensorTypeCode", headerText: 'Sensor', width: "1%", textAlign: "center", visible: false, },
                    { field: "InitialAxialPosition", headerText: 'Posición cero (V)', width: "8%", textAlign: "center", visible: false, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                ],
                showStackedHeader: true,
                //stackedHeaderRows: [{ stackedHeaderColumns: [{ headerText: sensorName, column: "Id,Name,Orientation,SensorAngle,Units" }] }],
                stackedHeaderRows: [{
                    stackedHeaderColumns: [
                        { headerText: sensorName, column: "Id,Name,Orientation,SensorAngle,Units,Sensibility,SensorTypeCode,InitialAxialPosition" },
                        { headerText: " ", column: "RtdParams.MaterialType,RtdParams.Ro,RtdParams.Coefficient,RtdParams.Iex" },
                        { headerText: " ", column: "MagneticFlowParams.PolesCount,MagneticFlowParams.Pole1Angle,MagneticFlowParams.PolarGraphRange,MagneticFlowParams.Imax,MagneticFlowParams.Imin,MagneticFlowParams.Xmax,MagneticFlowParams.Xmin" },
                        { headerText: " ", column: "CurrentParams.Imax,CurrentParams.Imin,CurrentParams.Xmax,CurrentParams.Xmin" },
                        { headerText: " ", column: "VoltageParams.Vmax,VoltageParams.Vmin,VoltageParams.Xmax,VoltageParams.Xmin" },
                    ]
                }],
                // Antes de cargar el grid se valida a que sensorType pertencen los puntos para mostrar sus respectivas columnas
                load: function (args) {
                    if (sensorCode == 4) { // KPH ó RA
                        args.model.columns[4].visible = false; // Unit
                    }
                    else if (sensorCode == 5) { // RTD
                        args.model.columns[14].visible = true; //MaterialType
                        args.model.columns[15].visible = true; //Ro
                        args.model.columns[16].visible = true; //Coefficient
                        args.model.columns[17].visible = true; //Iex
                    }
                    else if (sensorCode == 6) { // Voltaje
                        args.model.columns[10].visible = true; //Vmax
                        args.model.columns[11].visible = true; //Vmin

                        args.model.columns[12].field = "VoltageParams.Xmax";
                        args.model.columns[12].visible = true; //Xmax

                        args.model.columns[13].field = "VoltageParams.Xmin";
                        args.model.columns[13].visible = true; //Xmin
                    }
                    else if (sensorCode == 7) { // Corriente
                        args.model.columns[8].visible = true; //Imax
                        args.model.columns[9].visible = true; //Imin

                        args.model.columns[12].field = "CurrentParams.Xmax";
                        args.model.columns[12].visible = true; //Xmax

                        args.model.columns[13].field = "CurrentParams.Xmin";
                        args.model.columns[13].visible = true; //Xmin
                    }
                    else if (sensorCode == 9) { // Desplazamiento axial
                        args.model.columns[20].visible = true; // InitialAxialPosition
                    }
                    else if (sensorCode == 10) { // Flujo magnético
                        args.model.columns[5].visible = true; //PolesCount
                        args.model.columns[6].visible = true; //Pole1Angle
                        args.model.columns[7].visible = true; //PolarGraphRange

                        args.model.columns[8].field = "MagneticFlowParams.Imax";
                        args.model.columns[8].visible = true; //Imax

                        args.model.columns[9].field = "MagneticFlowParams.Imin";
                        args.model.columns[9].visible = true; //Imin

                        args.model.columns[12].field = "MagneticFlowParams.Xmax";
                        args.model.columns[12].visible = true; //Xmax

                        args.model.columns[13].field = "MagneticFlowParams.Xmin";
                        args.model.columns[13].visible = true; //Xmin
                    }
                    else if (sensorCode == 11) { // RDS
                        args.model.columns[3].visible = false; // SensorAngle
                        args.model.columns[4].visible = false; // Unit
                    }
                    else {
                        args.model.columns[18].visible = true; //Sensibility
                    }
                },
                dataBound: function (args) {
                    // Recorremos los puntos de medición antes de cargar los grid´s para crear dinámicamente las columnas "max y min" agrupadas por Status
                    var data = args.model.dataSource;
                    var status = ej.DataManager(arrayObjectStatus).executeLocal(ej.Query().where("Severity", "greaterThan", 2, false));
                    for (var d = 0; d < data.length; d++) {
                        if (data[d].SensorTypeCode != 4) {
                            var bands = data[d].Bands;
                            //if (bands.length == 0) {
                            //data[d].Bands = [];
                            for (var s = 0; s < status.length; s++) {
                                var exist = ej.DataManager(bands).executeLocal(ej.Query().where("StatusId", "equal", status[s].Id, false));
                                if (exist.length == 0) {
                                    data[d].Bands.push({
                                        UpperThreshold: { Value: null },
                                        LowerThreshold: { Value: null },
                                        StatusId: status[s].Id,
                                        Description: status[s].Name
                                    });
                                }
                            }
                            //}
                        }
                        //else {
                        //    data[d].Bands = [];
                        //}
                    }

                    if (!this._id.includes("grid4")) {
                        for (var b = 0; b < status.length; b++) {
                            //var headerText = ej.DataManager(args.model.stackedHeaderRows[0].stackedHeaderColumns).executeLocal(ej.Query().where("headerText", "equal", "Directa " + status[b].Name, false));
                            //if (headerText.length == 0) {
                            var column1 = { field: "Bands." + b + ".UpperThreshold.Value", headerText: "Max", textAlign: "center", type: "string", visible: true, width: "5%", editType: "numericedit", editParams: { decimalPlaces: 2 }, };
                            var column2 = { field: "Bands." + b + ".LowerThreshold.Value", headerText: "Min", textAlign: "center", type: "string", visible: true, width: "5%", editType: "numericedit", editParams: { decimalPlaces: 2 }, };
                            var column3 = { field: "Bands." + b + ".StatusId", headerText: "Estado", textAlign: "center", type: "string", visible: false, width: "5%", defaultValue: status[b].Id };
                            var column4 = { field: "Bands." + b + ".Description", headerText: "Descripción", textAlign: "center", type: "string", visible: false, width: "5%", defaultValue: status[b].Name };
                            this.model.stackedHeaderRows[0].stackedHeaderColumns.push({ column: "Bands." + b + ".UpperThreshold.Value, Bands." + b + ".LowerThreshold.Value, Bands." + b + ".StatusId, Bands." + b + ".Description", headerText: "Directa " + status[b].Name });

                            this.model.columns.push(column1, column2, column3, column4);
                            this._stackedHeaderRows_stackedHeaderColumns(this.model.stackedHeaderRows[0].stackedHeaderColumns);
                            this.columns(this.model.columns);
                            //}
                        }
                    }
                },
                actionComplete: function (args) {
                    if (args.requestType == "beginedit") {
                        // Se debe refrescar el ejDialog de la vista resumen para que el scroll se ajuste y no se pierdan los botones, debido a que la edición en un grid amplia el height de éste.
                        $("#formSummariesView").ejDialog("refresh");
                        var id = this._id;

                        if (![4, 11].includes(args.rowData.SensorTypeCode)) { // Que el sensor no sea KPH o RDS
                            var dsUnits = ej.DataManager(sensorTypes).executeLocal(ej.Query().where("Code", "equal", args.rowData.SensorTypeCode, false))[0].Units;
                            var exist = ej.DataManager(dsUnits).executeLocal(ej.Query().search(args.rowData.Units, "Name")).length;
                            if (exist == 0) {
                                dsUnits.push({ Code: args.rowData.Units, Name: args.rowData.Units });
                            }

                            $('#' + id + 'Units').ejDropDownList({
                                dataSource: dsUnits,
                                fields: { text: "Name", value: "Code" },
                                value: args.rowData.Units,
                                select: function (args) {
                                    if (args.value == "0") {
                                        createEjDialogOtherUnit("Unidad", id, args.model.dataSource);
                                    }
                                }
                            });
                        }

                        if (args.rowData.SensorTypeCode == 5) { // RTD

                            $('#' + id + 'RtdParamsMaterialType').ejDropDownList({
                                select: function (args) {
                                    $('#' + id + 'RtdParamsCoefficient').ejDropDownList({
                                        dataSource: ej.DataManager(_coefficient).executeLocal(ej.Query().where("Code", "equal", args.value, false)),
                                        fields: { text: "Name", value: "Value" },
                                        selectedIndex: 0
                                    });
                                }
                            });

                            $('#' + id + 'RtdParamsCoefficient').ejDropDownList({
                                dataSource: ej.DataManager(_coefficient).executeLocal(ej.Query().where("Code", "equal", args.rowData.RtdParams.MaterialType, false)),
                                fields: { text: "Name", value: "Value" },
                                value: args.rowData.RtdParams.Coefficient
                            });
                        }
                    }
                    else if (args.requestType == "save") {
                        // Se debe setear en true, ya que antes pasa por el evento actionBegin que impide el guardado de la fila si todo no está validado
                        _validatedFieldsSV = true;
                    }
                },
                actionBegin: function (args) {
                    if (args.requestType == "save") {
                        var d = args.data;
                        if ([d.Name, d.Orientation, d.SensorAngle].includes(null)) {
                            _validatedFieldsSV = false;
                            args.cancel = true;
                        }

                        if ([1, 2, 3, 8, 9].includes(d.SensorTypeCode)) { // PRX, VEL, ACC, Personalizado ó Desplazamiento axial
                            if (d.Sensibility == null) {
                                _validatedFieldsSV = false;
                                args.cancel = true;
                            }
                        }

                        if (d.SensorTypeCode == 5) { // RTD
                            if ([d.RtdParams.Ro, d.RtdParams.Iex].includes(null) || d.RtdParams.Coefficient == 0) {
                                _validatedFieldsSV = false;
                                args.cancel = true;
                            }
                        }
                        else if (d.SensorTypeCode == 6) { // Voltage
                            if ([d.VoltageParams.Vmax, d.VoltageParams.Vmin, d.VoltageParams.Xmax, d.VoltageParams.Xmin].includes(null)) {
                                _validatedFieldsSV = false;
                                args.cancel = true;
                            }
                        }
                        else if (d.SensorTypeCode == 7) { // Corriente
                            if ([d.CurrentParams.Vmax, d.CurrentParams.Vmin, d.CurrentParams.Xmax, d.CurrentParams.Xmin].includes(null)) {
                                _validatedFieldsSV = false;
                                args.cancel = true;
                            }
                        }
                        else if (d.SensorTypeCode == 9) { // Desplazamiento axial
                            if (d.InitialAxialPosition == null) {
                                _validatedFieldsSV = false;
                                args.cancel = true;
                            }
                        }
                        else if (d.SensorTypeCode == 10) { // Flujo Magnéctico
                            var mf = d.MagneticFlowParams;
                            if ([mf.Vmax, mf.Vmin, mf.Xmax, mf.Xmin, mf.PolesCount, mf.Pole1Angle, mf.PolarGraphRange].includes(null)) {
                                _validatedFieldsSV = false;
                                args.cancel = true;
                            }
                        }
                    }
                },
                //cellEdit: function (args) {
                //    this;
                //    var id = this._id;

                //    if (![4, 11].includes(args.rowData.SensorTypeCode)) { // Que el sensor no sea KPH o RDS
                //        var dsUnits = ej.DataManager(sensorTypes).executeLocal(ej.Query().where("Code", "equal", args.rowData.SensorTypeCode, false))[0].Units;
                //        var exist = ej.DataManager(dsUnits).executeLocal(ej.Query().search(args.rowData.Units, "Name")).length;
                //        if (exist == 0) {
                //            dsUnits.push({ Code: args.rowData.Units, Name: args.rowData.Units });
                //        }

                //        $('#' + id + 'Units').ejDropDownList({
                //            dataSource: dsUnits,
                //            fields: { text: "Name", value: "Code" },
                //            value: args.rowData.Units,
                //            select: function (args) {
                //                if (args.value == "0") {
                //                    createEjDialogOtherUnit("Unidad", id, args.model.dataSource);
                //                }
                //            }
                //        });
                //    }

                //    if (args.rowData.SensorTypeCode == 5) { // RTD

                //        $('#' + id + 'RtdParamsMaterialType').ejDropDownList({
                //            select: function (args) {
                //                $('#' + id + 'RtdParamsCoefficient').ejDropDownList({
                //                    dataSource: ej.DataManager(_coefficient).executeLocal(ej.Query().where("Code", "equal", args.value, false)),
                //                    fields: { text: "Name", value: "Value" },
                //                    selectedIndex: 0
                //                });
                //            }
                //        });

                //        $('#' + id + 'RtdParamsCoefficient').ejDropDownList({
                //            dataSource: ej.DataManager(_coefficient).executeLocal(ej.Query().where("Code", "equal", args.rowData.RtdParams.MaterialType, false)),
                //            fields: { text: "Name", value: "Value" },
                //            value: args.rowData.RtdParams.Coefficient
                //        });
                //    }
                //},
                //cellSave: function (args) {
                //    this;
                //},
                //recordClick: function (args) {
                //    this;
                //}
                //,
                //queryCellInfo: function (args) {
                //    this;
                //},
                //mergeCellInfo: function (args) {
                //    this;
                //},
            });
        };

        /* Crea un grid que lista uno o varios activos principales dependiendo la selección en el árbol (Activo o ubicación).
        Parametro "property" es usado para setear el valor del elemento "field" en la 1er columna, ya que si consultamos los activos desde base de datos a apartir de una ubicación 
        seleccionada su propiedad es "Id" pero si es un activo seleccionado se consulta en el mainCache que seria "AssetId"  */
        function createGridAsset(assets, id, property, _edit) {
            // Creamos una copia de "assets" para no afectar los datos originales
            var dsAssets = $.extend(true, [], assets);

            $("#grid" + id).ejGrid({
                dataSource: dsAssets,
                locale: "es-ES",
                isResponsive: true,
                enableResponsiveRow: true,
                allowResizing: true,
                gridLines: ej.Grid.GridLines.Both,
                editSettings: { allowEditing: _edit, allowEditOnDblClick: _edit, editMode: "normal", },
                //editSettings: { allowEditing: _edit, editMode: "batch", },
                //allowScrolling: true,
                //scrollSettings: { height: "500px", },
                //editSettings: { allowAdding: true, rowPosition: "bottom", allowEditing: true, allowEditOnDblClick: true, editMode: "normal", allowDeleting: true, showDeleteConfirmDialog: true, showConfirmDialog: false },
                //toolbarSettings: {
                //    showToolbar: true, toolbarItems: ["add", "update", "cancel", "delete"],
                //},
                allowTextWrap: true,
                textWrapSettings: { wrapMode: "header" },
                pageSettings: { pageSize: 10 },
                columns: [
                    { field: property, headerText: 'Id', textAlign: "center", width: "2%", isPrimaryKey: true, visible: false },
                    { field: "Name", headerText: 'Activo', textAlign: "center", width: "7%", },
                    { field: "NormalInterval", headerText: 'Periodicidad histórica (min)', textAlign: "center", width: "7%", editType: "numericedit", editParams: { decimalPlaces: 3 } },

                    { field: "RpmEventConfig.Enabled", headerText: 'Habilitado', type: "boolean", textAlign: "center", width: "5%", visible: true, editType: "booleanedit", defaultValue: true, },
                    //{ field: "RpmEventConfig.AngularReferenceName", headerText: 'Marca de paso', textAlign: "center", width: "5%", visible: true, editType: "dropdownedit", foreignKeyField: "Id", foreignKeyValue: "Name", },
                    { field: "RpmEventConfig.AngularReferenceId", headerText: 'Marca de paso', textAlign: "center", width: "5%", visible: true, dataSource: _listRefAngular, foreignKeyField: "Id", foreignKeyValue: "Name", },
                    { field: "RpmEventConfig.DeltaRpm", headerText: "&Delta; RPM", width: "4%", textAlign: "center", visible: true, editType: "numericedit", },
                    { field: "RpmEventConfig.LowRpm", headerText: 'RPM inferior', width: "5%", textAlign: "center", visible: true, editType: "numericedit", },
                    { field: "RpmEventConfig.UpperRpm", headerText: 'RPM superior', textAlign: "center", width: "5%", visible: true, editType: "numericedit", },
                    { field: "RpmEventConfig.MinutesAfter", headerText: 'Tiempo después (min)', textAlign: "center", width: "5%", visible: true, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                    { field: "RpmEventConfig.MinutesBefore", headerText: "Tiempo antes (min)", width: "5%", textAlign: "center", visible: true, editType: "numericedit", editParams: { decimalPlaces: 2 } },
                ],
                showStackedHeader: true,
                stackedHeaderRows: [{
                    stackedHeaderColumns: [
                        { headerText: "", column: property + ",Name,NormalInterval" },
                        { headerText: "Evento de velocidad", column: "RpmEventConfig.Enabled, RpmEventConfig.AngularReferenceId, RpmEventConfig.DeltaRpm, RpmEventConfig.LowRpm, RpmEventConfig.UpperRpm, RpmEventConfig.MinutesAfter, RpmEventConfig.MinutesBefore" },
                    ]
                }],
                load: function (args) {
                    var ds = args.model.dataSource;
                    for (var i = 0; i < ds.length; i++) {
                        //if (!ds[i].hasOwnProperty('AssetId')) {
                        //    args;
                        //}
                        if (ds[i].AssetId === undefined) {
                            ds[i].AssetId = ds[i].Id;
                            ds[i].Id = ds[i].NodeId;
                        }

                        GetListReferenceAngular(ds[i]);
                    }
                    args.model.columns[4].dataSource = _listRefAngular;
                },
                dataBound: function (args) {
                    // Recorremos los activos antes de cargar el grid para crear dinámicamente las columnas de cada propiedad del objeto "ConditionStatusEventsConfig"
                    var data = args.model.dataSource;

                    for (var d = 0; d < data.length; d++) {
                        var conditionStatus = data[d].ConditionStatusEventsConfig;

                        if (conditionStatus) {
                            for (var c = 0; c < conditionStatus.length; c++) {

                                var status = ej.DataManager(arrayObjectStatus).executeLocal(ej.Query().where("Id", "equal", conditionStatus[c].StatusId, false))[0];
                                // Buscamos si no existe el header por eventos de estados para ser creado con sus respectivas columnas
                                var headerText = ej.DataManager(args.model.stackedHeaderRows[0].stackedHeaderColumns).executeLocal(ej.Query().where("headerText", "equal", "Evento " + status.Name, false));

                                if (headerText.length == 0) {
                                    var column1 = { field: "ConditionStatusEventsConfig." + c + ".Enabled", headerText: "Habilitado", column: "", textAlign: "center", type: "boolean", visible: true, width: "5%", editType: "booleanedit" };
                                    var column2 = { field: "ConditionStatusEventsConfig." + c + ".Interval", headerText: "Intervalo (min)", column: "", textAlign: "center", type: "string", visible: true, width: "5%", editType: "numericedit", editParams: { decimalPlaces: 2 }, };
                                    var column3 = { field: "ConditionStatusEventsConfig." + c + ".MinutesBefore", headerText: "Tiempo antes (min)", column: "", textAlign: "center", type: "string", visible: true, width: "5%", editType: "numericedit", editParams: { decimalPlaces: 2 }, };
                                    var column4 = { field: "ConditionStatusEventsConfig." + c + ".MinutesAfter", headerText: "Tiempo después (min)", column: "", textAlign: "center", type: "string", visible: true, width: "5%", editType: "numericedit", editParams: { decimalPlaces: 2 }, };

                                    //args.model.stackedHeaderRows[0].stackedHeaderColumns[2].column += "ConditionStatusEventsConfig." + c + ".Enabled, ConditionStatusEventsConfig." + c + ".Interval, ConditionStatusEventsConfig." + c + ".MinutesBefore, ConditionStatusEventsConfig." + c + ".MinutesAfter,";

                                    this.model.stackedHeaderRows[0].stackedHeaderColumns.push({
                                        column: "ConditionStatusEventsConfig." + c + ".Enabled, ConditionStatusEventsConfig." + c + ".Interval, ConditionStatusEventsConfig." + c + ".MinutesBefore, ConditionStatusEventsConfig." + c + ".MinutesAfter",
                                        headerText: "Evento " + status.Name
                                    });

                                    this.model.columns.push(column1, column2, column3, column4);
                                    this._stackedHeaderRows_stackedHeaderColumns(this.model.stackedHeaderRows[0].stackedHeaderColumns);
                                    this.columns(this.model.columns);
                                }
                            }
                        }
                    }
                },
                actionComplete: function (args) {
                    if (args.requestType == "beginedit") {
                        var id = this._id; 

                        //$('#' + id + 'RpmEventConfigAngularReferenceId').ejDropDownList({
                        //    //dataSource: ej.DataManager(_listRefAngular).executeLocal(ej.Query().search(args.rowData.AssetId, "ParentId")),
                        //    dataSource: ej.DataManager(_listRefAngular).executeLocal(ej.Query().where("ParentId", "equal", args.rowData.AssetId, false)),
                        //    fields: { text: "Name", value: "Id" },
                        //    //value: (args.rowData.RpmEventConfig === undefined) ? null : args.rowData.RpmEventConfig.AngularReferenceId,
                        //});
                        var dsKph = $('#' + id + 'RpmEventConfigAngularReferenceId').ejDropDownList("getListData");
                        for (var i = 0; i < dsKph.length; i++) {
                            if (dsKph[i].value == "0")
                                continue;

                            var point = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("Id", "equal", dsKph[i].value, false))[0];

                            if (point.ParentId == args.rowData.AssetId)
                                $('#' + id + 'RpmEventConfigAngularReferenceId').ejDropDownList("enableItemsByIndices", i);
                            else
                                $('#' + id + 'RpmEventConfigAngularReferenceId').ejDropDownList("disableItemsByIndices", i);
                        }
                    }
                    else if (args.requestType == "save") {
                        // Se debe setear en true, ya que antes pasa por el evento actionBegin que impide el guardado de la fila si todo no está validado
                        _validatedFieldsSV = true;
                    }
                },
                actionBegin: function (args) {
                    if (args.requestType == "save") {
                        var d = args.data;
                        if ([d.Name, d.NormalInterval].includes(null)) {
                            _validatedFieldsSV = false;
                            args.cancel = true;
                        }

                        var rpm = d.RpmEventConfig;
                        rpm.AngularReferenceId = (rpm.AngularReferenceId == "0") ? null : rpm.AngularReferenceId;

                        if (rpm.Enabled && [rpm.AngularReferenceId, rpm.DeltaRpm, rpm.LowRpm, rpm.UpperRpm, rpm.MinutesAfter, rpm.MinutesAfter].includes(null)) {
                            _validatedFieldsSV = false;
                            args.cancel = true;
                        }

                        var condStatus = d.ConditionStatusEventsConfig;
                        for (var c in condStatus) {
                            if (condStatus.hasOwnProperty(c)) {
                                if (condStatus[c].Enabled && [condStatus[c].Interval, condStatus[c].MinutesBefore, condStatus[c].MinutesAfter].includes(null)) {
                                    _validatedFieldsSV = false;
                                    args.cancel = true;
                                }
                            }
                        }
                    }
                }
            });
        };

        function createGridPointsDynamically(asset, isAdmin) {
            // Puntos de medicion agrupados por su sensorType
            var pointsBySensorType = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("ParentId", "equal", asset.AssetId, false).group("SensorTypeCode"));
            // Id que se le asigna al Grid y que seria la combinación (grid + sensorTypeCode_parentId) para que sea único
            var id = "";

            // Recorre los grupos para crear cada uno de los grid's correspondientes a tipos de sensores
            for (var g = 0; g < pointsBySensorType.length; g++) {
                var _sensorType = ej.DataManager(sensorTypes).executeLocal(ej.Query().where("Code", "equal", pointsBySensorType[g].key, false))[0];
                var points = $.extend(true, [], pointsBySensorType[g].items);
                //var points = pointsBySensorType[g].items;

                for (var p = 0; p < points.length; p++) {
                    id = _sensorType.Code + '_' + points[p].ParentId;

                    points[p].Bands = []; // Definimos la propiedad "Bandas" al nivel del objeto principal (punto de medición)
                    var subVariables = points[p].SubVariables;
                    for (var s = 0; s < subVariables.length; s++) {
                        // Buscamos unicamente la subVariable de Directa
                        if ((subVariables[s].IsDefaultValue == true && subVariables[s].FromIntegratedWaveform == false) || (subVariables[s].IsDefaultValue == true && subVariables[s].FromIntegratedWaveform == true)) {
                            points[p].InitialAxialPosition = subVariables[s].InitialAxialPosition; // Sólo será utilizada para el sensor de Desplazamiento axial
                            var bands = subVariables[s].Bands;
                            if (bands != null) {
                                for (var b = 0; b < bands.length; b++) {
                                    points[p].Bands.push(bands[b]);
                                }
                            }
                        }
                    }
                }

                // Agregamos el nuevo elemento "div" que seria el contenedor de los puntos de medición (grid's por sensorType) asociados al activo
                $('#formSummariesView > .container-fluid > #divPoints > div[id="' + asset.Id + '"] > fieldset').append('<div id="grid' + id + '"></div><p></p>');
                createGridPointsBySensorType(points, id, _sensorType.Code, _sensorType.Name, isAdmin);
            }
        }

        // Busca a partir de un activo si tiene nodos hermanos tipo activo, si éste no los tiene actualiza el HasChild de su padre activo
        function searchAssetHasChildOnTrue(parentId, assets, x) {
            var brothers = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", parentId, true).and("EntityType", "equal", 2, true)));

            if (brothers.length == x) {
                var parent = ej.DataManager(jsonTree).executeLocal(ej.Query().where("Id", "equal", parentId, false))[0];

                if (parent.EntityType == 2) {
                    assets.push(parent.Id);
                    //arrayNode[0] = parent.Id; // NodeId
                    //arrayNode[1] = true; // HasChild
                    ej.DataManager(jsonTree).update("Id", { Id: parent.Id, HasChild: false }, jsonTree);
                    x--;
                    searchAssetHasChildOnTrue(parent.ParentId, assets, x);
                }
            }
            return assets;
        }

        function validateFieldsEventVelocity(fields) {

            if (fields.deltaRpm == null)
                $("#txtDeltaRpm").parent().parent().addClass("validateField");
            else
                $("#txtDeltaRpm").parent().parent().removeClass("validateField");

            if (fields.lowRpm == null)
                $("#txtLowRpm").parent().parent().addClass("validateField");
            else
                $("#txtLowRpm").parent().parent().removeClass("validateField");

            if (fields.upperRpm == null)
                $("#txtUpperRpm").parent().parent().addClass("validateField");
            else
                $("#txtUpperRpm").parent().parent().removeClass("validateField");

            if (fields.minutesBefore == null)
                $("#txtMinutesBefore").parent().parent().addClass("validateField");
            else
                $("#txtMinutesBefore").parent().parent().removeClass("validateField");

            if (fields.minutesAfter == null)
                $("#txtMinutesAfter").parent().parent().addClass("validateField");
            else
                $("#txtMinutesAfter").parent().parent().removeClass("validateField");
        }

        // Guarda todos los cambios hechos en la Vista resumen
        $("#btnSaveSummaryView").click(function () {
            var dsGrid = [];
            // Recorremos cada uno de los Grid's para obtener su dataSource

            $("#divPoints fieldset").children("div").each(function () {
                // Guarda todos los cambios del grid independientemente si aun está en modo edición
                $("#" + this.id).ejGrid("endEdit");
                dsGrid.pushArray($("#" + this.id).ejGrid("model.dataSource"));
            });

            // Guarda todos los cambios del grid independientemente si aun está en modo edición
            $('#divAssets > div').ejGrid("endEdit");

            // DataSource de activo(s)
            var dsAssets = $('#divAssets > div').ejGrid("model.dataSource");

            if (dsAssets.length == 0)
                dsAssets = [];

            if (_validatedFieldsSV) {
                for (var a = 0; a < dsAssets.length; a++) {

                    var rpm = dsAssets[a].RpmEventConfig;
                    if (rpm != null) {
                        if ((rpm.DeltaRpm == null) && (rpm.LowRpm == null) && (rpm.UpperRpm == null) && (rpm.MinutesAfter == null) && (rpm.MinutesAfter == null)) {
                            dsAssets[a].RpmEventConfig = null;
                        } else {
                            dsAssets[a].RpmEventConfig.MinutesAfter = rpm.MinutesAfter.toString().replace('.', ',');
                            dsAssets[a].RpmEventConfig.MinutesBefore = rpm.MinutesAfter.toString().replace('.', ',');
                        }
                    }

                    var condStatus = dsAssets[a].ConditionStatusEventsConfig;
                    if (condStatus != null) {
                        for (var c = 0; c < condStatus.length; c++) {
                            if ((condStatus[c].Interval == null) && (condStatus[c].MinutesBefore == null) && (condStatus[c].MinutesAfter == null)) {
                                ej.DataManager(condStatus).remove("StatusId", condStatus[c].StatusId);
                                c--;
                            } else {
                                condStatus[c].Interval = condStatus[c].Interval.toString().replace('.', ',');
                                condStatus[c].MinutesBefore = condStatus[c].MinutesBefore.toString().replace('.', ',');
                                condStatus[c].MinutesAfter = condStatus[c].MinutesAfter.toString().replace('.', ',');
                            }
                        }

                        if (condStatus.length == 0) {
                            dsAssets[a].ConditionStatusEventsConfig = [];
                        }
                    }
                }

                for (var i = 0; i < dsGrid.length; i++) {
                    var m, b;

                    var bands = dsGrid[i].Bands;
                    // Recorrre las bandas de la subVariable de directa para actualizarlas, excepto las que sean de un KPH
                    if (dsGrid[i].SensorTypeCode != 4) {
                        if (bands != null) {
                            if (bands.length == 0)
                                dsGrid[i].Bands = [];
                            else {
                                for (var x = 0; x < bands.length; x++) {

                                    var lower = (bands[x].LowerThreshold == null) ? null : bands[x].LowerThreshold.Value;
                                    var upper = (bands[x].UpperThreshold == null) ? null : bands[x].UpperThreshold.Value;
                                    //var lower = bands[x].LowerThreshold.Value;

                                    if ((lower == null) && (upper == null)) {
                                        dsGrid[i].Bands.splice(x, 1);
                                        x--;
                                        continue;
                                    }

                                    if (lower != null)
                                        bands[x].LowerThreshold.Value = lower.toString().replace('.', ',');

                                    if (upper != null)
                                        bands[x].UpperThreshold.Value = upper.toString().replace('.', ',');
                                }

                                var direct = ej.DataManager(dsGrid[i].SubVariables).executeLocal(ej.Query().where("IsDefaultValue", "equal", true, false));
                                if (direct.length == 1) {
                                    direct[0].Bands = dsGrid[i].Bands;

                                    if (dsGrid[i].SensorTypeCode == 9) { // Desplazamiento axial
                                        direct[0].InitialAxialPosition = dsGrid[i].InitialAxialPosition.toString().replace('.', ',');
                                    }
                                }
                            }
                        }
                    }

                    if ([1, 2, 3].includes(dsGrid[i].SensorTypeCode)) {
                        m = ((1000 / dsGrid[i].Sensibility) * 1).toString().replace('.', ',');
                        b = 0;
                    }

                    dsGrid[i].SensorAngle = dsGrid[i].SensorAngle.toString().replace('.', ',');
                    dsGrid[i].Sensibility = dsGrid[i].Sensibility.toString().replace('.', ',');

                    if (dsGrid[i].SensorTypeCode == 5) { //RTD
                        var coefficient = dsGrid[i].RtdParams.Coefficient,
                            ro = dsGrid[i].RtdParams.Ro,
                            iEx = dsGrid[i].RtdParams.Iex;

                        m = 1000 / (coefficient * ro * iEx);
                        b = -1 / coefficient;

                        dsGrid[i].RtdParams = {
                            MaterialType: dsGrid[i].RtdParams.MaterialType,
                            Coefficient: coefficient.toString().replace('.', ','),
                            Ro: ro.toString().replace('.', ','),
                            Iex: iEx.toString().replace('.', ','),
                        };
                    } else
                        dsGrid[i].RtdParams = null;

                    if (dsGrid[i].SensorTypeCode == 6) { //Voltage
                        var vMax = dsGrid[i].VoltageParams.Vmax,
                            vMin = dsGrid[i].VoltageParams.Vmin,
                            xMax = dsGrid[i].VoltageParams.Xmax,
                            xMin = dsGrid[i].VoltageParams.Xmin;

                        m = (xMax - xMin) / (vMax - vMin);
                        b = xMax - ((xMax - xMin) / (vMax - vMin) * vMax);

                        dsGrid[i].VoltageParams = {
                            Vmax: vMax.toString().replace('.', ','),
                            Vmin: vMin.toString().replace('.', ','),
                            Xmax: xMax.toString().replace('.', ','),
                            Xmin: xMin.toString().replace('.', ',')
                        };
                    } else
                        dsGrid[i].VoltageParams = null;

                    if (dsGrid[i].SensorTypeCode == 7) { //Corriente
                        var iMax = dsGrid[i].CurrentParams.Imax,
                            iMin = dsGrid[i].CurrentParams.Imin,
                            xMax = dsGrid[i].CurrentParams.Xmax,
                            xMin = dsGrid[i].CurrentParams.Xmin;

                        m = (xMax - xMin) / (1 * (iMax - iMin));
                        b = xMax - ((xMax - xMin) / (iMax - iMin) * iMax);

                        dsGrid[i].CurrentParams = {
                            Imax: iMax.toString().replace('.', ','),
                            Imin: iMin.toString().replace('.', ','),
                            Xmax: xMax.toString().replace('.', ','),
                            Xmin: xMin.toString().replace('.', ',')
                        };
                    } else
                        dsGrid[i].CurrentParams = null;

                    if (dsGrid[i].SensorTypeCode == 10) { //Flujo magnético
                        var iMax = dsGrid[i].MagneticFlowParams.Imax,
                            iMin = dsGrid[i].MagneticFlowParams.Imin,
                            xMax = dsGrid[i].MagneticFlowParams.Xmax,
                            xMin = dsGrid[i].MagneticFlowParams.Xmin;

                        m = (xMax - xMin) / (1 * (iMax - iMin));
                        b = xMax - ((xMax - xMin) / (iMax - iMin) * iMax);

                        dsGrid[i].MagneticFlowParams = {
                            PolesCount: dsGrid[i].MagneticFlowParams.PolesCount,
                            Pole1Angle: dsGrid[i].MagneticFlowParams.Pole1Angle.toString().replace('.', ','),
                            PolarGraphRange: dsGrid[i].MagneticFlowParams.PolarGraphRange.toString().replace('.', ','),
                            Imax: iMax.toString().replace('.', ','),
                            Imin: iMin.toString().replace('.', ','),
                            Xmax: xMax.toString().replace('.', ','),
                            Xmin: xMin.toString().replace('.', ','),
                        };
                    } else
                        dsGrid[i].MagneticFlowParams = null;

                    if ([1, 2, 3, 5, 6, 7, 10].includes(dsGrid[i].SensorTypeCode)) {
                        if (dsGrid[i].AiMeasureMethod == null) {
                            dsGrid[i].AiMeasureMethod = {
                                ParameterTypes: [],
                                ParameterValues: [],
                                M: m.toString().replace('.', ','),
                                B: b.toString().replace('.', ',')
                            };
                        }
                        else {
                            dsGrid[i].AiMeasureMethod.M = m.toString().replace('.', ',');
                            dsGrid[i].AiMeasureMethod.B = b.toString().replace('.', ',');
                        }
                    }
                }

                $.ajax({
                    url: "/Home/UpdateSummaryView",
                    //processData: false,
                    //datatType: 'json',
                    //data: { assets: dsAssets },
                    method: "POST",
                    data: { points: dsGrid, assets: dsAssets },
                    success: function (result) {
                        $("#formSummariesView").ejDialog("close");

                        for (var i = 0; i < dsGrid.length; i++) {
                            // Actualizamos el mainCache de activos con los cambios hechos recientemente
                            //ej.DataManager(mainCache.loadedMeasurementPoints).update("Id", dsGrid[i], mainCache.loadedMeasurementPoints);
                            var point = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("Id", "equal", dsGrid[i].Id, false))[0];
                            point.Name = dsGrid[i].Name;
                            point.Orientation = dsGrid[i].Orientation;
                            point.SensorAngle = dsGrid[i].SensorAngle;
                            point.Units = dsGrid[i].Units;
                            point.Sensibility = dsGrid[i].Sensibility;

                            if (point.SensorTypeCode == 5)
                                point.RtdParams = dsGrid[i].RtdParams;
                            else if (point.SensorTypeCode == 6)
                                point.VoltageParams = dsGrid[i].VoltageParams;
                            else if (point.SensorTypeCode == 7)
                                point.CurrentParams = dsGrid[i].CurrentParams;
                            else if (point.SensorTypeCode == 10)
                                point.MagneticFlowParams = dsGrid[i].MagneticFlowParams;

                            var direct = ej.DataManager(point.SubVariables).executeLocal(ej.Query().where("IsDefaultValue", "equal", true, false));
                            if (direct.length == 1) {
                                if (point.SensorTypeCode == 9)
                                    direct[0].InitialAxialPosition = dsGrid[i].InitialAxialPosition;
                            }
                        }

                        // Refrescamos el listbox de puntos si la vista resumen está a prtir de un activo de lo contrario se destruye por ser una ubicación
                        var points = $("#measurementPoints").data("ejListBox");

                        if (points !== undefined) {
                            if (selectedTreeNode.EntityType == 1)
                                points.destroy();
                            else
                                points.refresh();
                        }

                        // Recorremos los activos para actualizarlos en el mainCache de activos con los cambios hechos recientemente
                        for (var a = 0; a < dsAssets.length; a++) {
                            var asset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("Id", "equal", dsAssets[a].Id, false))[0];
                            asset.Name = dsAssets[a].Name;
                            asset.NormalInterval = dsAssets[a].NormalInterval;
                            asset.ConditionStatusEventsConfig = dsAssets[a].ConditionStatusEventsConfig;
                            asset.RpmEventConfig = dsAssets[a].RpmEventConfig;
                            // Seteamos el nombre del activo en el arbol (treeView)
                            $("#" + dsAssets[a].Id).find('.fa-diamond').parent().html("<span class='fa fa-diamond' icon-large' style='background-color: transparent;color:''; padding: 2px;'></span> " + dsAssets[a].Name);
                        }

                        popUp("success", "Se actualizó correctamente la vista resumen!");
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "Error al actualizar vista resumen!");
                    }
                });

            } else {
                popUp("error", "Existen campos vacios!");
            }
        });

        // Cancela todos los cambios hechos en la Vista resumen
        $("#btnCancelSummaryView").click(function () {
            $("#formSummariesView").addClass("hidden");
            $("#formSummariesView").ejDialog("close");
            _validatedFieldsSV = true;

            var points = $("#measurementPoints").data("ejListBox");

            if (points !== undefined) {
                if (selectedTreeNode.EntityType == 1)
                    points.destroy();
            }
        });

        function createEjDialogOtherUnit(title, id, dsUnits) {

            $("#txtOtherUnit").ejMaskEdit({
                width: "90%",
                inputMode: ej.InputMode.Text,
                //value: _asset != null ? _asset.Name : "",
            });

            $("#ejbAccept").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-checkmark",
                click: function (args) {
                    var unit = $("#txtOtherUnit").val().trim();
                    if (unit !== "") {
                        var exist = ej.DataManager(dsUnits).executeLocal(ej.Query().where("Name", "equal", unit, false)).length;
                        if (exist > 0) {
                            popUp("error", "Tipo de unidad existente!");
                        }
                        else {
                            $('#' + id + 'Units').ejDropDownList("addItem", { text: unit, value: unit });
                            $('#' + id + 'Units').ejDropDownList("selectItemByValue", unit);
                            $("#ejdOtherUnit").addClass("hidden");
                            $("#ejdOtherUnit").ejDialog("close");
                        }
                    } else {
                        popUp("error", "Ingresa un tipo de unidad para el sensor!");
                    }
                },
            });

            $("#ejbCancel").ejButton({
                size: "small",
                type: "button",
                imagePosition: "imageleft",
                contentType: "textandimage",
                showRoundedCorner: true,
                prefixIcon: "e-icon e-cancel",
                click: function (args) {
                    $("#ejdOtherUnit").addClass("hidden");
                    $("#ejdOtherUnit").ejDialog("close");
                }
            });

            $("#ejdOtherUnit").ejDialog({
                showOnInit: false,
                isResponsive: true,
                title: title,
                allowDraggable: true,
                enableAnimation: true,
                width: "15%",
                //maxWidth: "20%",
                height: "20%",
                //maxHeight: "25%",
                enableResize: true,
                showHeader: true,
                enableModal: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                close: function (args) {
                    //$("#ejbCancel").off("click"); // Necesario desasociar el evento
                    //$("#ejbAccept").off("click"); // Necesario desasociar el evento
                    $("#ejdOtherUnit").addClass('hidden');
                    $("#txtOtherUnit").ejMaskEdit("destroy");
                    $("#ejbCancel").ejButton("destroy");
                    $("#ejbAccept").ejButton("destroy");
                },
            });

            $("#ejdOtherUnit").removeClass('hidden');
            $("#ejdOtherUnit").ejDialog("open");
        }

        function stopInterval(_var) {
            clearInterval(_var);
        }
    };

    return AssetAdmin;
})();