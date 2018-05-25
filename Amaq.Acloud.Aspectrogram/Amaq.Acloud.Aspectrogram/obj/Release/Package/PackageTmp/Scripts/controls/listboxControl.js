/*
 * listboxControl.js
 * Gestiona los ajustes de configuracion los puntos de medicion.
 * @author Jorge Calderon
 */

var ListboxControl = {};

ListboxControl = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ListboxControl = function (nodeId) {
        // Propiedades privadas.
        var
            // Id del nodo seleccionado.
            _nodeId,
            // Auto-referencia al control.
            _this,
            // Resolver el contenido de la lista
            _populateListBox,
            _getMeasurementPointsByAsset,
            _getMeasurementPointsByAssetList,
            _getAssetIdAndAsdaqId,
            _measurementPointsWithStatus,
            // Indica si los items "Configurar eventos de condición" y "Configurar evento de velocidad" del contextMenu Activo ya ha sido creado
            _isCreatedItemsEvents,
            // Función para editar el nombre de un punto de medición
            _editMeasurementPoint,
            // Función para cancelar la edición de un punto de medición
            _cancelEditMeasurementPoint;

        _nodeId = nodeId;
        _this = this;
        _isCreatedItemsEvents = false;

        _populateListBox = function (data) {
            var
                allSubVariables,
                sensorType,
                index,
                numericSubVariables,
                subVariablesGroupBySensor,
                i, j;

            mdVariableList = data;
            allSubVariables = [];
            sensorType = "";
            index = 0;
            for (i = 0; i < mdVariableList.length; i += 1) {
                if (!mdVariableList[i].SensorTypeCode) {
                    continue;
                }
                sensorType = ej.DataManager(sensorTypes).executeLocal(new ej.Query().where("Code", "equal", mdVariableList[i].SensorTypeCode))[0].Name;
                for (j = 0; j < mdVariableList[i].SubVariables.length; j += 1) {
                    allSubVariables.push(mdVariableList[i].SubVariables[j]);
                    allSubVariables[index].SensorTypeCode = mdVariableList[i].SensorTypeCode;
                    // Propiedad por la cual se van a agrupar los diferentes tipos de medida
                    allSubVariables[index].SensorType = sensorType;
                    index += 1;
                }
            }

            distinctMeasures = [];
            subVariableList = allSubVariables;
            numericSubVariables = ej.DataManager(allSubVariables).executeLocal(new ej.Query().where("ValueType", "equal", 1));
            subVariablesGroupBySensor = [];
            subVariablesGroupBySensor.pushArray(ej.DataManager(numericSubVariables).executeLocal(
                        new ej.Query().where("FromIntegratedWaveform", "equal", false).group("SensorTypeCode")));
            subVariablesGroupBySensor.pushArray(ej.DataManager(numericSubVariables).executeLocal(
                        new ej.Query().where("FromIntegratedWaveform", "equal", true).group("SensorTypeCode")));

            for (i = 0; i < subVariablesGroupBySensor.length; i += 1) {
                distinctMeasures.pushArray(ej.distinct(
                    subVariablesGroupBySensor[i].items,
                    "MeasureType",
                    true
                ));
            }

            //distinctMeasures = ej.distinct(numericSubVariables, "MeasureType", true);
            selectedMdVariable = null;
            $("#measurementPoints").ejListBox({
                fields: {
                    id: "Id",
                    value: "Name",
                    text: "Name"
                },
                dataSource: ej.DataManager(data).executeLocal(ej.Query().sortBy("OrderPosition", ej.sortOrder.Ascending, false)),
                template: "<div style='height:26px;margin:2px' id=\"${NodeId}\">" +
                                "<div style='display:inline;margin: 5px 0px;position:absolute' id=\"${NodeId}\" >" +
                                    "<span class=\"fa fa-circle icon-large\" style=\"background-color:transparent;color:black;padding:2px;\"></span> ${Name}" +
                                "</div>" +
                                "<div class='upDown hidden' style='width:10%;display:inline; float:right; padding: 0px 5px'><i id='upPoint' class='fa fa-chevron-up'></i><br><i id='downPoint' class='fa fa-chevron-down'></i></div>" +
                            "</div>",
                //itemHeight:"26px",
                width: "100%",
                height: "100%",
                allowDrag: true,
                allowDrop: true,
                allowMultiSelection: true,
                itemDragStart: function (args) {
                    this.selectItemByIndex(args.items[0].index); // Selecciona el item que va hacer arrastrado
                },
                // Obtiene el id del punto de medicion arrastrado para relacionar entre un canal, sea de un Asdaq o Atr.
                itemDrop: function (args) {
                    // Si existen varios puntos de medición seleccionados no permite hacer esta función en un canal Asdaq
                    var dataset = $('#measurementPoints').ejListBox("getSelectedItems");
                    if (dataset.length == 1) {
                        // Id del punto de medición arrastrado.
                        var mdVariableItemDrop = dataset[0].data.Id;
                        // Nombre del chilgrid donde es soltado el punto de medición
                        var childGridCurrent = args.dropTarget[0].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.id;
                        // Canales pertenecientes al childgrid actual donde se soltó el punto de medición.
                        var aiChannelsGridCurrent = $("#" + childGridCurrent + " > #detailGridDevice").data("ejGrid");

                        if (typeof aiChannelsGridCurrent != "undefined") {
                            var _index = $(args.dropTarget[0]).parent()[0].rowIndex, // Index del punto arrastrado
                                ds = aiChannelsGridCurrent.model.dataSource,
                                aiChannel = aiChannelsGridCurrent.model.currentViewData[_index],
                                state = true,
                                pathName = "", // Ruta de donde se encuentra relacionado el punto de medición 
                                isAtr = false;

                            if (!aiChannel.MdVariableId) {

                                // Atransmitter: Se valida que la MdVariable no esté asociada con otro AiChannel
                                if (typeof atr != "undefined") {
                                    isAtr = true;
                                    for (var a = 0; a < atr.length; a++) {
                                        for (var m = 0; m < atr[a].Modules.length; m++) {
                                            for (var c = 0; c < atr[a].Modules[m].AiChannels.length; c++) {
                                                if (atr[a].Modules[m].AiChannels[c].MdVariableId == mdVariableItemDrop) {
                                                    pathName = atr[a].Alias + " - " + atr[a].Modules[m].Alias;
                                                    state = false;
                                                }
                                            }
                                        }
                                    }
                                }

                                if (typeof $("#GridAsdaq").data("ejGrid") !== "undefined") {
                                    var asdaq = $("#GridAsdaq").data("ejGrid").model.dataSource;
                                    // Asdaq: Se valida que la MdVariable no esté asociada con otro AiChannel
                                    if (typeof asdaq != "undefined") {
                                        for (var i = 0; i < asdaq.length; i++) {
                                            for (var m = 0; m < asdaq[i].NiDevices.length; m++) {
                                                for (var a = 0; a < asdaq[i].NiDevices[m].AiChannels.length; a++) {
                                                    if (asdaq[i].NiDevices[m].AiChannels[a].MdVariableId == mdVariableItemDrop) {
                                                        pathName = asdaq[i].Alias + " - " + asdaq[i].NiDevices[m].Name;
                                                        state = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                // Seteamos MdVariableId y MdVariableTag para un AiChannel
                                if (state) {
                                    //var nameAsset = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", args.items[0].data.ParentId, false))[0].Name; //old
                                    var nameAsset = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("AssetId", "equal", dataset[0].data.ParentId, false))[0].Name;

                                    for (var i = 0; i < ds.length; i++) {
                                        if (ds[i].Name == aiChannel.Name) {

                                            ds[i].MdVariableTag = nameAsset + "/" + dataset[0].data.Name;
                                            ds[i].MdVariableId = mdVariableItemDrop;

                                            if (!isAtr) {
                                                _pointByToAssociate = {
                                                    Index: _index,
                                                    MdVarIdNew: mdVariableItemDrop,
                                                    DeviceName: ds[i].Name.split('/')[0],
                                                };                                            

                                                // Valida si al relacionar un punto de medición tipo ACC o VEL puede ser Excitación IEPE                                            
                                                ds[i].SensorTypeCode = dataset[0].data.SensorTypeCode; 

                                                // Consulta y valida el valor de AICurrentExcitationValue a nivel de módulo Asdaq para marcar la casilla ExcitationIEPE
                                                var devices = $("#GridNiDevices").ejGrid("model.dataSource");
                                                var aICurrentExcitationValue = ej.DataManager(devices).executeLocal(ej.Query().where("Name", "equal", _pointByToAssociate.DeviceName, false))[0]["AICurrentExcitationValue"];
                                                aICurrentExcitationValue = parseFloat(aICurrentExcitationValue.toString().replace(',', '.'));

                                                if (aICurrentExcitationValue > 0) {
                                                    if ([2, 3].includes(ds[i].SensorTypeCode))
                                                        ds[i].ExcitationIEPE = true;
                                                }
                                            }

                                            aiChannelsGridCurrent.updateRecord("Name", ds[i]);
                                            // Al actualizar el canal los checkbox's vuelven a des-habilitarse, por ello se buscan para volverlos a habilitar, excepto el de Excitacion IEPE
                                            $(aiChannelsGridCurrent.element).find(".e-gridcontent tbody tr:eq("+ i +") :checkbox").each(function(ind,v) {
                                                if (this.parentNode.dataset.cell != "Excitación IEPE")
                                                    $(this).removeAttr("disabled");
                                            });
                                            break;
                                        }
                                    }
                                }

                                // Mensaje de alerta
                                if (!state) {
                                    popUp("error", "El punto de medición ya está relacionado en " + pathName);
                                }
                            }
                        }
                    }
                    else {
                        args.cancel = true;
                    }
                },
                select: function (args) {
                    if (args.data) {
                        _selectedEntityType = 3;
                        // Valida si cancela el modo edición del punto al seleccionar otro
                        if (selectedMdVariable != args.data.Id) {
                            _cancelEditMeasurementPoint("select");
                        }

                        selectedMdVariable = args.data.Id;
                        selectedMeasurementPoint = args.data;
                        //_originalDataPoint = $.extend(true, _originalDataPoint, selectedMeasurementPoint);
                        _originalDataPoint = $.extend(true, {}, selectedMeasurementPoint);
                    }

                    // Des-habilitamos el item "Pegar" del contextMenu de ubicación                    
                    $("#locationMenu").ejMenu("disableItemByID", "pasteAssetMenuItem");

                    if (args.event) {
                        if (args.event.target.id == "upPoint") {
                            $('#measurementPoints').ejListBox("moveUp");

                            //var points = $("#measurementPoints").data("ejListBox").model.dataSource;
                            //ej.DataManager(points).update("Id", { Id: args.data.Id, OrderPosition: args.index }, points);
                        }
                        else if (args.event.target.id == "downPoint") {
                            $('#measurementPoints').ejListBox("moveDown");
                        }
                    }
                },
                create: function (args) {
                    ListboxControl.ManageAssetMenu();                    
                },
                itemDragStop: function (args) {
                    // Cancela el Drag si no es relación punto - canal Asdaq
                    //if (args.target.localName != "td")
                    if($(args.target).attr("data-cell") != "Punto de Medición")
                        args.cancel = true;

                    if ($('#txtEditPoint').length > 0) 
                        args.cancel = true;
                },
            });

            // Evento copiar del ListBoxControl para puntos de medición
            $("#measurementPoints_container").on("keydown", function (e) {
                if (e.ctrlKey && e.which == 67) { // Ctrl+C
                    if (_selectedEntityType == 3) {
                        if (selectedMdVariable) {
                            new MeasurementPointAdmin().Copy(selectedMeasurementPoint);
                        }
                    }
                }
            });

            ListboxControl.ResolveMeasurementPointsStatus(_measurementPointsWithStatus);
        };

        _getAssetIdAndAsdaqId = function (assetNode) {
            var
                assetNodeId,
                tmpAsset,
                populate,
                tmp,
                i;

            assetNodeId = assetNode.Id || _nodeId;
            $.ajax({
                url: "/Home/GetAssetIdAndAsdaqId",
                method: "GET",
                data: {
                    nodeId: assetNodeId
                },
                beforeSend: function () {
                    $("#listboxLoadingIndicator").removeClass("hidden");
                },
                success: function (result) {
                    result = JSON.parse(JSON.stringify(result));
                    $("#listboxLoadingIndicator").addClass("hidden");
                    for (i = 0; i < result.length; i += 1) {
                        tmp = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", result[i].NodeId, false));
                        if (tmp.length === 0) {
                            populate = (result[i].NodeId === assetNodeId) ? true : false;
                            if (!result[i].IsPrincipal) {
                                tmpAsset = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("Id", "equal", result[i].NodeId, false))[0];
                                // Agregamos las propiedades AssetId, AsdaqId, IsPrincipal, RpmEventConfig, ConditionStatusEventsConfig, NormalInterval,AtrId
                                tmpAsset.AssetId = result[i].AssetId;
                                tmpAsset.AsdaqId = result[i].AsdaqId;
                                tmpAsset.IsPrincipal = result[i].IsPrincipal;
                                tmpAsset.PrincipalAssetId = result[i].PrincipalAssetId;
                                tmpAsset.RpmEventConfig = null;
                                tmpAsset.ConditionStatusEventsConfig = [];
                                tmpAsset.NormalInterval = result[i].NormalInterval;
                                tmpAsset.AtrId = result[i].AtrId;
                                tmpAsset.NodeId = result[i].NodeId;
                                tmpAsset.Description = result[i].Description;
                                tmpAsset.TripMultiply = result[i].TripMultiply;
                                tmpAsset.TransientStatusTimeout = result[i].TransientStatusTimeout;

                                tmp = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", result[i].NodeId, false));
                                mainCache.loadedAssets.pushArray([tmpAsset]);
                            } else {
                                // Agregamos las propiedades AssetId, AsdaqId, IsPrincipal, RpmEventConfig, ConditionStatusEventsConfig, NormalInterval,AtrId
                                assetNode.AssetId = result[i].AssetId;
                                assetNode.AsdaqId = result[i].AsdaqId;
                                assetNode.IsPrincipal = result[i].IsPrincipal;
                                assetNode.PrincipalAssetId = result[i].PrincipalAssetId;
                                assetNode.RpmEventConfig = result[i].RpmEventConfig;
                                assetNode.ConditionStatusEventsConfig = result[i].ConditionStatusEventsConfig;
                                assetNode.NormalInterval = result[i].NormalInterval;
                                assetNode.AtrId = result[i].AtrId;
                                assetNode.NodeId = result[i].NodeId;
                                assetNode.Description = result[i].Description;
                                assetNode.TripMultiply = result[i].TripMultiply;
                                assetNode.TransientStatusTimeout = result[i].TransientStatusTimeout;
                                assetNode.NominalVelocity = result[i].NominalVelocity;

                                tmp = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", result[i].NodeId, false));
                                mainCache.loadedAssets.pushArray([assetNode]);
                            }
                            _getMeasurementPointsByAsset(result[i].AssetId, result[i].NodeId, populate);
                        }
                    }
                    //_getMeasurementPointsByAssetList(result);
                },
                complete: function (result) {
                    ListboxControl.ManageAssetMenu();
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        }

        _getMeasurementPointsByAsset = function (assetId, assetNodeId, populate) {
            $.ajax({
                url: "/Home/GetMeasurementPointsByAsset",
                method: "GET",
                data: {
                    assetId: assetId
                },
                async: false,
                beforeSend: function () {
                    $("#listboxLoadingIndicator").removeClass("hidden");
                },
                success: function (result) {
                    if (result.length > 0) {
                        for (var i = 0; i < result.length; i += 1) {
                            // Para guardar referencia del nodeId del asset padre de los measurement points
                            result[i].ParentNodeId = assetNodeId;
                        }
                        // Almacenamos la informacion en la memoria RAM
                        mainCache.loadedMeasurementPoints.pushArray(result);
                        if (populate) {
                            // Crear control ejListBox con los items
                            _populateListBox(result);
                        }
                    }
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                },
                complete: function () {
                    $("#listboxLoadingIndicator").addClass("hidden");
                    ListboxControl.ManageAssetMenu();
                }
            });
        };

        _this.CreateListbox = function (selectedTreeNode, measurementPointsWithStatus) {
            if (!selectedTreeNode) {
                return;
            }

            _measurementPointsWithStatus = measurementPointsWithStatus;

            var nodeToFind = selectedTreeNode.Id || _nodeId;
            if ($("#measurementPoints").data("ejListBox")) {
                $("#measurementPoints").ejListBox("destroy");
            }
            var dataManager = new ej.DataManager(mainCache.loadedMeasurementPoints);
            var measurementPoints = dataManager.executeLocal(new ej.Query().where("ParentNodeId", "equal", nodeToFind, false));
            selectedAsset = selectedTreeNode;

            if (measurementPoints.length > 0) {
                // Crear listBox con los measurement points encontrados en mainCache
                _populateListBox(measurementPoints);
            } else {
                var assetNode = ej.DataManager(mainCache.loadedAssets).executeLocal(new ej.Query().where("Id", "equal", nodeToFind, false));

                if (assetNode.length === 0) {
                    _getAssetIdAndAsdaqId(selectedTreeNode);
                }
                else {
                    _getMeasurementPointsByAsset(assetNode[0].AssetId, assetNode[0].Id, !assetNode[0].IsPrincipal);
                }
            }
        };

        $("#btnToOrderPoints").click(function () {
            if (!toOrder) {
                toOrder = true;
                $("#btnToOrderPoints>i").removeClass("fa-list-ol");
                $("#btnToOrderPoints>i").addClass("fa-check");
                $("#btnCancelOrderPoints").removeClass("hidden");
                $("#measurementPoints").children('li').each(function () {
                    $(this).find(".upDown").removeClass("hidden");
                });
            }
            else {
                toOrder = false;
                $("#measurementPoints").children('li').each(function () {
                    $(this).find(".upDown").addClass("hidden");
                });

                var points = $("#measurementPoints").data("ejListBox").model.dataSource;
                var orderedPoints = $("#measurementPoints").data("ejListBox").element[0].childNodes;
                for (var op = 0; op < orderedPoints.length; op++) {
                    ej.DataManager(points).update("Id", { Id: orderedPoints[op].id, OrderPosition: op }, points);
                }

                $.ajax({
                    url: "/Home/UpdateOrderPositionPoints",
                    method: "POST",
                    data: { mdVariables: points },
                    success: function (result) {

                    },
                    complete: function (result) {
                        $("#btnToOrderPoints>i").removeClass("fa-check");
                        $("#btnToOrderPoints>i").addClass("fa-list-ol");
                        $("#btnCancelOrderPoints").addClass("hidden");
                        popUp("success", "Se actualizó la posición de cada uno de los puntos de medición");
                    },
                    error: function (result) {
                        popUp("error", "Error al actualizar la posición de cada uno de los puntos de medición");
                    }
                });
            }
        });

        // Reordena los puntos de medición del listbox 
        $("#btnCancelOrderPoints").click(function () {
            if (toOrder) {
                toOrder = false;

                var points = $("#measurementPoints").data("ejListBox").model.dataSource;

                $("#measurementPoints").ejListBox({
                    dataSource: ej.DataManager(points).executeLocal(ej.Query().sortBy("OrderPosition", ej.sortOrder.Ascending, false))
                });
                $("#measurementPoints").data("ejListBox").refresh();

                //var points = $("#measurementPoints").data("ejListBox").model.dataSource;

                //$("#measurementPoints").children('li').each(function (index, value) {
                //    if (value.id !== points[index].Id) {
                //        $("#measurementPoints").data("ejListBox").refresh();
                //        return false;
                //    }
                //});               

                $("#measurementPoints").children('li').each(function () {
                    $(this).find(".upDown").addClass("hidden");
                });
                $("#btnToOrderPoints>i").removeClass("fa-check");
                $("#btnToOrderPoints>i").addClass("fa-list-ol");
                $("#btnCancelOrderPoints").addClass("hidden");
            }
        });

        _editMeasurementPoint = function () {
            // Valida que no esté creado mas de un vez el textbox y no esté en ordenamiento de puntos
            if ($('#txtEditPoint').length == 0 && !toOrder) {
                // Se deshabilita el drag and drog del listbox para que permita editar dentro del textbox "txtEditPoint"
                //$('#measurementPoints').data("ejListBox").option({ allowDrag: false, allowDrop: false });
                $("li#" + selectedMeasurementPoint.Id + " > div").children('div').hide();
                $("li#" + selectedMeasurementPoint.Id + " > div").append("<input id='txtEditPoint' class='e-ejinputtext' type='text' value='" + selectedMeasurementPoint.Name + "'/>");
                $("#txtEditPoint").focus();
                $("#txtEditPoint").css("color", "black"); // Se agrega este estilo debido a que el evento hover del listbox oculta el texto
                document.getElementById("txtEditPoint").setSelectionRange($("#txtEditPoint").val().length, $("#txtEditPoint").val().length); // Posiciona el cursor en la ultima letra

                $('#txtEditPoint').keyup(function (e) {
                    if (e.keyCode == 13) { // Enter
                        var node = {
                            Id: selectedMeasurementPoint.NodeId,
                            Name: $('#txtEditPoint').val(),
                            EntityType: 3,
                            EntityId: selectedMeasurementPoint.Id
                        };

                        $.ajax({
                            url: "/Home/UpdateNameInTreeNode",
                            method: "POST",
                            data: { nodeDto: node },
                            success: function (response) { },
                            complete: function (e) {
                                $("#txtEditPoint").remove(); // Elimina el textbox creado al editar un punto de medición
                                $("li#" + selectedMeasurementPoint.Id + " > div").children('div').show();

                                // Se actualizan los datos tanto en el jsonTree como el mainCache de puntos
                                ej.DataManager(jsonTree).update("Id", { Id: node.Id, Name: node.Name }, jsonTree);
                                ej.DataManager(mainCache.loadedMeasurementPoints).update("Id", { Id: node.EntityId, Name: node.Name }, mainCache.loadedMeasurementPoints);
                                $("#measurementPoints").ejListBox("refresh", true);
                                //$('#measurementPoints').data("ejListBox").option({ allowDrag: true, allowDrop: true });
                            },
                            error: function (jqXHR, textStatus) {
                                //$('#measurementPoints').data("ejListBox").option({ allowDrag: true, allowDrop: true });
                                popUp("error", "A ocurrido un error al actualizar. Intente nuevamente!");
                            }
                        });
                    }
                });
            }
        }

        _cancelEditMeasurementPoint = function (eventType) {
            if (typeof event !== "undefined" && (event.which == 27 || eventType == "select")) {
                if ($('#txtEditPoint').length > 0) {
                    $("#txtEditPoint").remove(); // Elimina el textbox creado al editar un punto de medición
                    $("li#" + selectedMeasurementPoint.Id + " > div").children('div').show();
                    //$('#measurementPoints').data("ejListBox").option({ allowDrag: true, allowDrop: true });
                }
            }
        }

        // Eventos del listbox de puntos de medición solo para usuarios tipo administrador
        $("#measurementPoints").on({
            dblclick: function () {
                if (roles.indexOf("Admin") == 0) {
                    _editMeasurementPoint();
                }
            },
            keydown: function () {
                if (roles.indexOf("Admin") == 0) {
                    _cancelEditMeasurementPoint("keydown");
                }
            },
        });

        // Creamos la vista del arbol
        _this.CreateListbox();
    };

    return ListboxControl;

})();

ListboxControl.ResolveMeasurementPointsStatus = function (measurementPoints) {
    // Pintar color de estados en el listbox de puntos de medición
    if (!measurementPoints) {
        return;
    }

    // Recorrido de puntos de medición
    for (var j = 0; j < measurementPoints.length; j++) {
        var itemInListbox = $("div#" + measurementPoints[j].NodeId + " > span");

        if (itemInListbox) {
            var currentStatus = new ej.DataManager(arrayObjectStatus).executeLocal(new ej.Query().where("Id", "equal", measurementPoints[j].StatusId, false))[0];

            if (currentStatus) {
                // Setear color de estado al item del listbox de puntos de medición
                itemInListbox.attr("style", "background-color: transparent; color:" + currentStatus.Color + "; padding: 2px;");
            }
        }
    }
}

ListboxControl.ManageAssetMenu = function () {
    // Si no existen los items "Configurar evento de velocidad" y "Configurar eventos de condición" del contextMenu Activo, estos se crean
    if ($("li#eventVelocityMenuItem").length == 0 && $("li#eventConditionStatusMenuItem").length == 0) {
        $("#assetMenu").data("ejMenu").insert([{ id: "eventVelocityMenuItem", text: "Configurar evento de velocidad" }], "#liAdmin");
        $("#assetMenu").data("ejMenu").insert([{ id: "eventConditionStatusMenuItem", text: "Configurar eventos de condición" }], "#liAdmin");
        _isCreatedItemsEvents = true;
    }

    // Consultamos el activo seleccionado del arbol y se valida si no es principal para eliminar los items de eventos del contextMenu Activo
    if (mainCache.loadedAssets.length > 0) {
        var asset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("Id", "equal", selectedTreeNode.Id, false))[0];
        if (typeof asset !== "undefined") {
            if (asset.IsPrincipal == false) {
                if (_isCreatedItemsEvents) {
                    $("#assetMenu").ejMenu("remove", ["#eventVelocityMenuItem"]);
                    $("#assetMenu").ejMenu("remove", ["#eventConditionStatusMenuItem"]);
                }
            }
        }
    }
}