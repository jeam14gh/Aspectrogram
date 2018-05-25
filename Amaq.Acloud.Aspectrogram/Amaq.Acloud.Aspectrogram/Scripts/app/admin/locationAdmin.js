var LocationAdmin = {};

LocationAdmin = (function () {
    "use strict";

    /* Constructor */
    LocationAdmin = function () {
        // Declarar propiedades privadas;
        var
            // Auto-referencia a la clase MeasurementPointAdmin
            _this,
            // Tipo de operación a realizar (Crear, Editar, Clonar o Eliminar)
            _typeOperation,
            // Formulario (PopUp) para la clonación y edición de un asset.
            _createLocationDiaolog,
            // PopUp de confirmación para eliminar una ubicación
            _createConfirmDialogDeleting,
            // Objeto location
            _locationNode = {},
            // Objeto Node
            _node = {},
            _nodeId,
            // Lista de nodos
            _listNodes;

        _this = this;
        _listNodes = [];

        this.Create = function (locationNode) {
            _typeOperation = "createLocation";
            _nodeId = locationNode.Id;
            _createLocationDiaolog("Nueva ubicación", null)
        };

        this.Edit = function (locationNode) {
            _typeOperation = "editLocation";
            _nodeId = locationNode.Id;
            _createLocationDiaolog("Editar ubicación " + locationNode.Name, locationNode);
        };

        this.Delete = function (locationNode) {
            _createConfirmDialogDeleting("<b>Eliminar</b>", "¿Desea eliminar la ubicación " + locationNode.Name + "?", locationNode);
        };

        _createLocationDiaolog = function (_title, _location) {
            $("#formLocation").ejDialog({
                title: _title,
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                //minHeight: "25%",
                width: "25%",
                height: "35%",
                minWidth: "25%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                scrollSettings: { height: "34%" },
                allowScrolling: true,
                allowDraggable: true,
                enableResize: true,
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) {
                    autoHeightEjDialog("#formLocation", _heightWindow);
                    $(".e-resize-handle").removeClass("e-js");
                },
                beforeOpen: function (args) {

                    if (!_location) {
                        if (_typeOperation == "createLocation")
                            createControls(null);
                    } else {
                        if (_typeOperation == "editLocation")
                            createControls(_location);
                    }

                },//Fin beforeOpen
                close: function (args) {
                    $("#btnCreateOrEditLocation").off("click"); // Necesario desasociar el evento
                    $("#txtNameLocation").ejMaskEdit("destroy");
                    $("#txtDescriptionLocation").ejMaskEdit("destroy");
                    $("#formLocation").addClass('hidden');
                },//Fin close
            });

            $("#formLocation").ejDialog("open");
            $("#formLocation").removeClass('hidden');
        }

        // Crea los controles necesarios para el formulario de activos
        function createControls(_location) {
            $("#txtNameLocation").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: _location != null ? _location.Name : "",
            });

            $("#txtDescriptionLocation").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: _location != null ? _location.Description : "",
            });
        }

        //Obtiene todos los valores de cada uno de los controles incluidos en el formulario de clonación y edicion de un activo
        function getFormValues() {
            var control =
                {
                    name: $("#txtNameLocation").val(),
                    description: $("#txtDescriptionLocation").val(),
                };
            return control;
        }

        //Boton "Guardar" para crear ó editar una ubicación
        $("#btnCreateOrEditLocation").click(function () {

            if (_typeOperation == "createLocation") {
                var input = getFormValues();
                $.ajax({
                    url: "/Home/GetNodeById",
                    data: { id: _nodeId },
                    method: "GET",
                    success: function (response) {
                        _node = response;
                    },
                    complete: function (e) {
                        var _level, parentId;
                        
                        if (_node) {
                            _level = ej.DataManager(jsonTree).executeLocal(ej.Query().where("ParentId", "equal", _node.Id, false)).length + 1;
                            _level = _node.Level + "." + _level;
                            parentId = _node.Id;
                        }
                        else { // Si no existe el 1er nodo en el árbol nos indicará lo siguiente
                            _level = 1;
                            parentId = '';
                        }

                        _node = {
                            ParentId: parentId,
                            Level: _level,
                            Name: input.name,
                            Description: input.description,
                            Type: 1,
                        };

                        $.ajax({
                            url: "/Home/CreateNode",
                            data: { node: _node },
                            method: "POST",
                            success: function (response) {
                                _node = response;
                            },
                            complete: function (e) {
                                var newNode = {
                                    "added": [{
                                        EntityType: 1,
                                        HasChild: false,
                                        Id: _node.Id,
                                        Name: _node.Name,
                                        ParentId: _node.ParentId == null ? "" : _node.ParentId,
                                        htmlAttribute: { "data-nodetype": "location-node" },
                                    }], "deleted": {}, "changed": {}
                                };
                                ej.DataManager(jsonTree).saveChanges(newNode);

                                // htmlAttribute= Tipificar los nodos de tipo asset para asociarles menú contextual de opciones
                                if (_nodeId) 
                                    //Se agrega el nuevo nodo al treeview
                                    treeObj.addNode({ EntityType: 1, Id: _node.Id, Name: _node.Name, ParentId: _node.ParentId, htmlAttribute: { "data-nodetype": "location-node" } }, treeObj.getSelectedNode());
                                else { // Solo aplica cuando se haya creado la 1er ubicación al árbol (treeView)
                                    selectedTreeNode = ej.DataManager(jsonTree).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", "", true).or("ParentId", "equal", null, true)))[0];
                                    // Inicializamos el control del TreeView con el nodo principal del arbol.
                                    treeViewControl = new TreeViewControl(selectedTreeNode.Id);
                                }

                                $("#formLocation").ejDialog("close");
                                popUp("success", "Se creo correctamente la ubicación " + _node.Name);
                            },
                            error: function (jqXHR, textStatus) {
                                popUp("error", "Error al crear la ubicación. Intente nuevamente!");
                            }
                        });
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "A ocurrido un error. Intente nuevamente!");
                    },
                });
            }

            if (_typeOperation == "editLocation") {
                var input = getFormValues();
                _node = {
                    Id: _nodeId,
                    Name: input.name,
                    Description: input.description
                };

                $.ajax({
                    url: "/Home/UpdateNameAndDescriptionOfNode",
                    method: "POST",
                    data: { nodeDto: _node },
                    success: function (result) {
                        // Se actualizan los datos tanto en el jsonTree como el treeObj
                        ej.DataManager(jsonTree).update("Id", _node, jsonTree);
                        ej.DataManager(treeObj.currentSelectedData).update("Id", _node, treeObj.currentSelectedData);

                        // Cambia el texto del arbol (treeView)
                        var color = $("#treeView li#" + _node.Id + " a.e-text>div>span")[0].style["color"];
                        $("#treeView li#" + _node.Id + ">div>#treeView_active>div").html("<span class='fa fa-map-marker icon-large' style='background-color: transparent; color:" + color + "; padding: 2px;'></span> " + _node.Name);
                    },
                    complete: function (result) {
                        $("#formLocation").ejDialog("close");
                        popUp("success", "Se actualizó correctamente la ubicación " + input.name);
                    },
                    error: function (jqXHR, textStatus) {
                        popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                    }
                });
            }

        });

        function hierarchyNodeDesc(parentId) {
            var childrens = ej.DataManager(jsonTree).executeLocal(ej.Query().where("ParentId", "equal", parentId, false));

            for (var i = 0; i < childrens.length; i++) {
                _listNodes.push(childrens[i]);
                hierarchyNodeDesc(childrens[i].Id);
            }
            //return _listNodes;
        }

        _createConfirmDialogDeleting = function (title, question, locationNode) {
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

                            _listNodes.push(locationNode);
                            hierarchyNodeDesc(locationNode.Id);
                            var _nodeIdList = ej.DataManager(_listNodes).executeLocal(ej.Query().select(["Id"]));
                            var _nodeIdListAsset = ej.DataManager(_listNodes).executeLocal(ej.Query().where("EntityType", "equal", 2, false).select(["Id"]));
                            var _nodeIdListMdVariable = ej.DataManager(_listNodes).executeLocal(ej.Query().where("EntityType", "equal", 3, false).select(["Id"]));

                            $.ajax({
                                url: "/Home/DeleteLocation",
                                method: "POST",
                                data: { nodeIdList: _nodeIdList, nodeIdListAsset: _nodeIdListAsset, nodeIdListMdVariable: _nodeIdListMdVariable },
                                success: function (response) { },
                                complete: function (response) {
                                    $("#dialogDelete").addClass("hidden");
                                    $("#dialogDelete").ejDialog("destroy");

                                    for (var n = 0; n < _nodeIdList.length; n++) {
                                        ej.DataManager(jsonTree).remove("Id", _nodeIdList[n]);
                                        treeObj.removeNode($("#" + _nodeIdList[n]));
                                    }

                                    if ($("#measurementPoints").data("ejListBox")) {
                                        $("#measurementPoints").ejListBox("destroy");
                                    }
                                    treeObj.selectNode($("#" + locationNode.ParentId));
                                    
                                    popUp("success", "Se eliminó correctamente la ubicación " + locationNode.Name);
                                },
                                error: function (jqXHR, textStatus) {
                                    popUp("error", "A ocurrido un error. Intente nuevamente!");
                                }
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
                    $(".e-resize-handle").removeClass("e-js");
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

    };

    return LocationAdmin;
})();