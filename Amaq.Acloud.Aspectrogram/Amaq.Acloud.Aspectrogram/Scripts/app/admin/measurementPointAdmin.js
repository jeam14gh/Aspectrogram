/*
 * measurementPointAdmin.js
 * 
 * @author Jhon Esneider Alvarez M
 */


var MeasurementPointAdmin = {};

MeasurementPointAdmin = (function () {
    "use strict";

    /* Constructor */
    MeasurementPointAdmin = function () {
        // Declarar propiedades privadas;
        var
            // Auto-referencia a la clase MeasurementPointAdmin
            _this,
            // PopUp para la clonación y edición de puntos de medición.
            _createMeasurementPointDiaolog,
            // Tipo de operación a realizar (Crear, Editar, Clonar o Eliminar)
            _typeOperation,
            // Función para crear los diferentes tipos de controles dependiendo del sensorType obtenido
            _createControlsForSensorType,
            // PopUp de confirmación para eliminar un punto de medición
            _createConfirmDialogDeleting,
            // SubVarible seleccionada
            _subVariableSelected,
            // Objeto mdVariable 
            _objMdVariable,
            // Objeto node
            _node,
            // NodeId del asset al crear punto de medición
            _assetNodeId,
            // ParentId del punto de medición al crearlo
            _mdVariableParentId = null,
            // Lista de tipos de formas de ondas integradas
            _arrayIntegratedWaveform,
            // Lista de tipos de medición
            _measureType,
            // Tipos de direcciones de rotacion en una referencia angular 
            _rotationDirection,
            // Lista de subvariables de un punto de medición
            subVariables = [],
            // Autoincremento para darle una primaryKey única a una subvariable que se quiere agregar en el gridSubVariables
            _idSubVariable = 0,
            // Autoincremento para darle una primaryKey única a cada fila de un banda
            _index = 0,
            // Subvariable Directa, Amplitud 1X, Fase 1X, Gap, Forma de onda, Pulsos 
            _directa, _amplitud1x, _fase1x, _gap, _waveForm, _pulsos,
            // Subvariable original solo para el caso de un Accelerometro y éste sea integrado
            _original,
            // Crea los controles respectivos para calcular la M y B de un punto de medición de sensores tipo Voltaje y Corriente
            _createFieldsVoltageOrCurrent,
            // Crea los controles respectivos para calcular la M y B de un punto de medición de sensor tipo RTD
            _createFieldsRTD,
            // Indica si se crearon los controles para voltaje o corriente
            _isCreatedFieldsVolOrCur,
            // Indica si se crearon los controles para RTD
            _isCreatedFieldsRTD,
            // Array del valor de unos tipos de sensores
            sensorTypeNumeric,
            // Valor del coeficiente sengun tipo de material
            _coefficients,
            // Datos originales al cargar el gridSubVariables
            _subVariablesOriginal,
            // Lista de todos los KPH por activo principal
            _listRefAngular,
            // Crea los controles respectivos al sensor de flujo magnético
            _createFieldsMagneticFlow,
            // Indica si se crearon los controles de flujo magnético
            _isCreatedFieldsMagneticFlow,
            _createdControls = false,
            operation,
            _sensorValue = null;

        _this = this;
        _isCreatedFieldsRTD = false;
        _isCreatedFieldsVolOrCur = false;
        _isCreatedFieldsMagneticFlow = false;
        sensorTypeNumeric = [0, 1, 2, 3, 4, 9]; 
        _coefficients = new RTDCoefficient().Coefficients;
        _listRefAngular = [{ Name: "Ninguno", Id: "0" }];
        _subVariablesOriginal = [];

        // Lista de subvariables por defecto al seleccionar un tipo de sensor al momento de crear un punto de medición.  
        _directa = new SubVariables(_idSubVariable++).Directa;
        _amplitud1x = new SubVariables(_idSubVariable++).Amplitud1x;
        _fase1x = new SubVariables(_idSubVariable++).Fase1x;
        _waveForm = new SubVariables(null).WaveForm;
        _original = new SubVariables(_idSubVariable++).Original;
        _gap = new SubVariables(_idSubVariable++).Gap;
        _pulsos = new SubVariables(_idSubVariable++).Pulsos;

        _measureType = [ 
                        { text: "Pico", value: 1 },
                        { text: "Pico a Pico", value: 2 },
                        { text: "RMS", value: 3 },
                        { text: "Amplitud 1X", value: 4 },
                        { text: "Fase 1X", value: 6 },
                        { text: "Fase", value: 5 },
                        { text: "GAP", value: 7 },
                        { text: "Promedio", value: 8 },
                        { text: "RPM", value: 9 },
                        { text: "Posición Axial", value: 10 }];

        _arrayIntegratedWaveform = [
                    { text: "Original", value: 0 },
                    { text: "Integrado", value: 1 }];

        _rotationDirection = [{ Name: "CCW", Code: 2 },
                                { Name: "CW", Code: 1 }]; 

        _createFieldsMagneticFlow = function (pc, p1a, pgr) {
            _isCreatedFieldsMagneticFlow = true;
            $("#txtPolesCount").ejNumericTextbox({ value: pc != null ? pc : 1, });
            $("#txtPole1Angle").ejNumericTextbox({ value: p1a != null ? p1a : 0, decimalPlaces: 1, });
            $("#txtPolarGraphRange").ejNumericTextbox({ decimalPlaces: 1, value: pgr != null ? pgr : 2 });
        };

        // Crea ciertos controles para un tipo de sensor Corriente o Voltaje
        _createFieldsVoltageOrCurrent = function (eMax, eMin, vMax, vMin) {
            _isCreatedFieldsVolOrCur = true;
            $("#txtEntryMax").ejNumericTextbox({ value: eMax, decimalPlaces: 2, });
            $("#txtEntryMin").ejNumericTextbox({ value: eMin, decimalPlaces: 2, });
            $("#txtVarMax").ejNumericTextbox({ decimalPlaces: 2, value: vMax != null ? vMax : null });
            $("#txtVarMin").ejNumericTextbox({ decimalPlaces: 2, value: vMin != null ? vMin : null });
        };

        // Crea ciertos controles para un tipo de sensor RTD
        _createFieldsRTD = function (material, coefficient, ro, iEx) {
            _isCreatedFieldsRTD = true;
            var _data = ej.DataManager(_coefficients).executeLocal(ej.Query().where("Code", "equal", material, false));

            $("#ddlCoefficient").ejDropDownList({
                dataSource: _data,
                fields: { text: "Name", value: "Value" },
                //selectedIndex: 0,
                enabled: _data.length > 1 ? true : false,
                value: coefficient != null ? coefficient : null,
            });

            $("#ddlMaterial").ejDropDownList({
                dataSource: _materials,
                //cascadeTo: "ddlCoefficient",
                fields: { text: "Name", value: "Code" },
                value: material,
                change: function (args) {
                    var data = ej.DataManager(_coefficients).executeLocal(ej.Query().where("Code", "equal", args.value, false));

                    $('#ddlCoefficient').ejDropDownList(
                    {
                        dataSource: data,
                        enabled: data.length > 1 ? true : false,
                    });
                    $('#ddlCoefficient').ejDropDownList("selectItemsByIndices", 0);
                },
            });
            $("#txtRo").ejNumericTextbox({ value: ro, decimalPlaces: 2, });
            $("#txtIex").ejNumericTextbox({ value: iEx, decimalPlaces: 3, minValue: 0 });
        };

        _createMeasurementPointDiaolog = function (_title) {
            $("#formMdVariable").ejDialog({
                title: _title,
                showOnInit: false,
                actionButtons: ["close", "maximize"],
                enableAnimation: true,
                width: "95%",
                height: "94%",
                minWidth: "93%",
                //minHeight: "94%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                allowDraggable: true,
                enableResize: true,
                //allowScrolling: true,
                //scrollSettings: { height: "40%" },
                position: { X: 50, Y: 10 },
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) {
                    if (_typeOperation != "createMdVariable") {
                        subVariables = clone(ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", selectedMeasurementPoint.Id, false).select("SubVariables"))[0]);

                        for (var s = 0; s < subVariables.length; s++) {
                            if (subVariables[s].FromIntegratedWaveform == true) {
                                subVariables[s].FromIntegratedWaveform = 1;
                            } else if (subVariables[s].FromIntegratedWaveform == false) {
                                subVariables[s].FromIntegratedWaveform = 0;
                            }
                            // No permite que se muestren las Subvariables forma de onda y Pulsos al cargar el grid. //a no ser que el tipo de sensor sea RTD 
                            if (subVariables[s].ValueType == 3 || subVariables[s].ValueType == 5) {
                                ej.DataManager(subVariables).remove("Id", subVariables[s].Id);
                                s--;
                                continue;
                            }
                            subVariables[s].ThresholdLatency = ConvertMillisecondsToSeconds(subVariables[s].ThresholdLatency);
                            subVariables[s].InitialAxialPosition = subVariables[s].InitialAxialPosition;
                            subVariables[s].DeadBand = subVariables[s].DeadBand;
                            subVariables[s].MinimumHistoricalDataBand = subVariables[s].MinimumHistoricalDataBand;
                        }

                        _subVariablesOriginal = JSON.parse(JSON.stringify(subVariables));
                    }

                    var bands = [];

                    //Grid de subvariables 
                    $("#gridSubVariables").ejGrid({
                        dataSource: subVariables,
                        locale: "es-ES",
                        isResponsive: true,
                        enableResponsiveRow: true,
                        gridLines: ej.Grid.GridLines.Both,
                        allowResizing: true,
                        //allowScrolling: true,
                        //scrollSettings: { height: "500px", },
                        editSettings: { allowAdding: true, rowPosition: "top", allowEditing: true, allowEditOnDblClick: true, editMode: "normal", allowDeleting: true, showDeleteConfirmDialog: false, showConfirmDialog: false },
                        toolbarSettings: {
                            showToolbar: true,
                            toolbarItems: ["add", "update", "cancel", "delete"],
                        },
                        rowSelected: function (args) {
                            _subVariableSelected = args.data;

                            // Habilita o desahibilita el icono de eliminar al seleccionar una subvariable directa o velocidad
                            var $toolbar = $("#gridSubVariables_toolbarItems");
                            if (args.data.IsDefaultValue || args.data.MeasureType == 4 || args.data.MeasureType == 6) {
                                $toolbar.ejToolbar("disableItem", $("#gridSubVariables_delete"));
                            } else {
                                $toolbar.ejToolbar("enableItem", $("#gridSubVariables_delete"));
                            }
                        },
                        toolbarClick: function (args) {
                            if (args.itemName == "Agregar")
                                _subVariableSelected = null;

                            // Elimina una subvariable en base de datos cuando está en modo de edición de un pto de medición
                            if (_typeOperation == "editMdVariable") {
                                if (args.itemName == "Eliminar") {
                                    var subVariableId = args.model.selectedRecords[0].Id;
                                    if (subVariableId.toString().length == 24) {
                                        $.ajax({
                                            url: "/Home/DeleteSubVariableById",
                                            method: "POST",
                                            data: { id: subVariableId },
                                            success: function (response) { },
                                            complete: function (e) {
                                                // Se elimina la subvariable del dataSource del grid
                                                ej.DataManager(subVariables).remove("Id", subVariableId);
                                                //$("#gridSubVariables").ejGrid("batchSave");
                                                $("#gridSubVariables").ejGrid("refreshToolbar");
                                                // Se elimina la subvariable del mainCache
                                                ej.DataManager(ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", selectedMeasurementPoint.Id, false).select("SubVariables"))[0]).remove("Id", subVariableId);
                                                popUp("success", "Se eliminó correctamente la SubVariable!");
                                            },
                                            error: function (jqXHR, textStatus) {
                                                popUp("error", "A ocurrido un error. Intente nuevamente!");
                                            }
                                        });
                                    }
                                }
                            }
                        },
                        pageSettings: { pageSize: 10 },
                        columns: [
                                  { field: "Id", headerText: "Id", width: "1%", allowEditing: false, isPrimaryKey: true, visible: false },
                                  { field: "ParentId", headerText: "IdPadre", width: "1%", allowEditing: false, visible: false, defaultValue: _objMdVariable != null ? _objMdVariable.Id : "" },
                                  { field: "Name", headerText: "Nombre", width: "15%", textAlign: "center", allowEditing: true },
                                  //{ field: "Description", headerText: "Descripción", width: "20%", textAlign: "center", },
                                  { field: "MeasureType", headerText: "Cálculo", width: "15%", textAlign: "center", editType: ej.Grid.EditingType.Dropdown, dataSource: _measureType, foreignKeyField: "value", foreignKeyValue: "text", },
                                  { field: "Units", headerText: "Unidad", width: "15%", textAlign: "center", },
                                  { field: "Maximum", headerText: "Máximo", width: "15%", textAlign: "center", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 } },
                                  { field: "Minimum", headerText: "Mínimo", width: "15%", textAlign: "center", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 } },
                                  { field: "FromIntegratedWaveform", headerText: 'Fuente', textAlign: "center", width: "15%", editType: ej.Grid.EditingType.Dropdown, dataSource: _arrayIntegratedWaveform, foreignKeyField: "value", foreignKeyValue: "text", allowEditing: true, visible: false },
                                  {
                                      field: "Config", headerText: "Bandas", width: "8%",
                                      commands:
                                      [{
                                          type: "details",
                                          buttonOptions: {
                                              contentType: "imageonly",
                                              prefixIcon: "e-icon e-settings",
                                              width: "50px",
                                              size: "normal",
                                              click: function (args) {
                                                  if (!_subVariableSelected) {
                                                      popUp("error", "Actualice primero la SubVariable para configurar sus Bandas!");
                                                  }
                                                  else {
                                                      var sensorType = $("#ddlSensorType").ejDropDownList("getSelectedValue");
                                                      if (((sensorType == 1) && (_subVariableSelected.MeasureType == 7)) || // Si es PRX y la subVariable GAP ó
                                                          (((sensorType == 9) && ((_subVariableSelected.MeasureType == 7) || (_subVariableSelected.IsDefaultValue))))) { // Si es Desplazamiento axial y la subVariable es GAP o Directa
                                                          CreateDialogBands(_subVariableSelected, true, "Umbral Máx", "LowerThreshold.Value");
                                                      } else {
                                                          CreateDialogBands(_subVariableSelected, false, "Umbral", "LowerThreshold");
                                                      }
                                                  }
                                              }
                                          },
                                      }],
                                      isUnbound: true,
                                      textAlign: ej.TextAlign.Center
                                  },
                        ],
                        showStackedHeader: true,
                        stackedHeaderRows: [{ stackedHeaderColumns: [{ headerText: "SubVariables", column: "Id,ParentId,Name,MeasureType,Units,Maximum,Minimum,FromIntegratedWaveform,Config" }] }],
                        load: function (args) {
                            var subVariable = args.model.dataSource;
                            if (_typeOperation != "createMdVariable") {
                                // Si el pto de medición tiene la propiedad Integrate en true, se pone visible la columna Fuente
                                if (_objMdVariable.Integrate) {
                                    args.model.columns[7].visible = true;
                                }
                            }
                        },
                        actionComplete: function (args) {
                            if (args.requestType == "add") {
                                _idSubVariable++;
                            }
                            else if (args.requestType == "save") {
                                if (_typeOperation == "createMdVariable") {
                                    if (!args.data.Id) {
                                        args.data.Id = _idSubVariable;
                                    }
                                    args.data.Bands = [];
                                } else if (_typeOperation == "editMdVariable") {
                                    if (!args.data.Id) {
                                        args.data.Id = _idSubVariable;
                                    }
                                }
                            }

                            // Habilita o no el boton "Guardar" del ejDialog de punto de medición
                            if (["add", "beginedit"].includes(args.requestType)) {
                                $("#btnCreateOrEditMdVariable").attr('disabled', 'disabled');
                            } else { // "cancel","delete","save"
                                $("#btnCreateOrEditMdVariable").removeAttr('disabled');
                            } 
                        },
                        actionBegin: function (args) {
                            // Al momento de guardar una subVariable valida que todos los campos esten llenos y que el máximo sea mayor al mínimo
                            if (args.requestType == "save") {
                                if ([args.data.Name, args.data.MeasureType, args.data.Units, args.data.Minimum, args.data.Maximum].includes(null)) {
                                    args.cancel = true;
                                    popUp("error", "Todos los campos deben estar llenos!");
                                } else {
                                    if (args.data.Maximum <= args.data.Minimum) {
                                        args.cancel = true;
                                        popUp("error", "El campo máximo debe ser mayor al mínimo!");
                                    }
                                }
                            }
                        }
                    });

                    var kph = $('#ddlAngularReference').ejDropDownList("getSelectedValue");
                    var integrate = $("#chbIntegrate").ejCheckBox("isChecked");
                    var sensorType = $('#ddlSensorType').ejDropDownList("getSelectedValue");

                    if (_typeOperation != "createMdVariable") {
                        var tr = validateVisibilityRows(subVariables, kph, integrate, []);

                        for (var i = 0; i < tr.length; i++) {
                            if (sensorType == 11) // Si es RDS se muestran todas sus Subvariables.
                                break;                            

                            if (tr[i].action == "removeClass")
                                $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children("tr:eq('" + tr[i].index + "')").removeClass("hidden");
                            else
                                $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children("tr:eq('" + tr[i].index + "')").addClass("hidden");
                        }

                        if (sensorType == 11) // RDS
                            $("#gridSubVariables").ejGrid("hideColumns", ["Cálculo"]);                        
                    }

                    autoHeightEjDialog("#formMdVariable", _heightWindow);
                },
                beforeOpen: function (args) {
                    if (_typeOperation != "createMdVariable") {
                        $("#divSaveWaveform").hide();
                        $("#magneticFlowFields").addClass('hidden');
                    }
                    else {
                        $("#voltageOrCurrentFields").addClass('hidden');
                        $("#sensorCustomFields").addClass('hidden');
                        $("#rtdFields").addClass('hidden');
                        $("#divSensibility").hide();
                        $("#magneticFlowFields").addClass('hidden');
                    }
                },//Fin beforeOpen
                close: function (args) {
                    $("#lblSensibility").text("Sensibilidad [mV/Unidad]");
                    $("#btnCreateOrEditMdVariable").off("click"); // Necesario desasociar el evento
                    $("#btnCancelMdVariable").off("click");
                    $("#txtName").ejMaskEdit("destroy");
                    $("#txtDescription").ejMaskEdit("destroy");
                    // Es necesario habilitar el dropdownlist antes de destruirlo debido a un bug de Syncfusion cuando se habilita o deshabilita el control
                    $('#ddlSensorType').ejDropDownList("enable");
                    $("#ddlSensorType").ejDropDownList("destroy");
                    $("#txtUnit").ejMaskEdit("destroy");
                    $("#ddlRotationDirection").ejDropDownList("destroy");
                    $("#chbIntegrate").ejCheckBox("destroy");
                    $("#txtSensorAngle").ejNumericTextbox("destroy");
                    $("#chbWaveform").ejCheckBox("destroy");
                    $("#txtSensibility").ejNumericTextbox("destroy");
                    $("#txtMinimumNoiseInVolts").ejNumericTextbox("destroy");
                    $("#txtTresholdPercentage").ejPercentageTextbox("destroy");
                    $("#txtHysteresisTresholdPercentage").ejPercentageTextbox("destroy");
                    $("#txtRefAngularM").ejNumericTextbox("destroy");
                    $("#txtRefAngularB").ejNumericTextbox("destroy");
                    $("#ddlAngularReference").ejDropDownList("destroy");
                    $("#gridSubVariables").ejGrid("destroy");
                    $("#formMdVariable").addClass('hidden');
                    $("#voltageOrCurrentFields").addClass('hidden');
                    $("#rtdFields").addClass('hidden');
                    $("#sensorCustomFields").addClass('hidden');
                    $("#btnCreateOrEditMdVariable").removeAttr('disabled');
                    $("#ddlUnits").ejDropDownList("destroy");

                    if (_isCreatedFieldsRTD) {
                        $("#ddlMaterial").ejDropDownList("destroy");
                        $("#ddlCoefficient").ejDropDownList("destroy");
                        $("#txtRo").ejNumericTextbox("destroy");
                        $("#txtIex").ejNumericTextbox("destroy");
                    }
                    if (_isCreatedFieldsVolOrCur) {
                        $("#txtEntryMax").ejNumericTextbox("destroy");
                        $("#txtEntryMin").ejNumericTextbox("destroy");
                        $("#txtVarMax").ejNumericTextbox("destroy");
                        $("#txtVarMin").ejNumericTextbox("destroy");
                    }
                    if (_isCreatedFieldsMagneticFlow) {
                        $("#txtPolesCount").ejNumericTextbox("destroy");
                        $("#txtPole1Angle").ejNumericTextbox("destroy");
                        $("#txtPolarGraphRange").ejNumericTextbox("destroy");
                    }

                    $("#txtPositionCero").ejNumericTextbox("destroy");
                    $('#ddlOrientation').ejDropDownList("destroy");

                    if (_typeOperation == "editMdVariable") {
                        ej.DataManager(mainCache.loadedMeasurementPoints).update("Id", _originalDataPoint, mainCache.loadedMeasurementPoints);
                        _originalDataPoint = {};
                    }

                    _createdControls = false;
                },//Fin close
            });

            $("#formMdVariable").ejDialog("open");
            $("#formMdVariable").removeClass('hidden');
        }

        function CreateDialogBands(subVariable, visible, text, fieldName) {

            $("#txtThresholdLatency").ejNumericTextbox({
                width: "100%",
                value: subVariable.ThresholdLatency,//*
                decimalPlaces: 1,
            });

            $("#txtDeadBand").ejNumericTextbox({
                width: "100%",
                value: subVariable.DeadBand,
                decimalPlaces: 2,
            });

            var bandMinimum = subVariable.MinimumHistoricalDataBand;

            if (!bandMinimum || typeof bandMinimum === "undefined")
                bandMinimum = null;

            $("#txtUpperThreshold").ejNumericTextbox({
                width: "100%",
                value: bandMinimum == null ? null : bandMinimum.UpperThreshold.Value,
                //value: bandMinimum.UpperThreshold.Value,
                decimalPlaces: 1,
                //minValue: 0.1
            });
            
            //$("#txtLowerThreshold").ejNumericTextbox({
            //    width: "100%",
            //    value: bandMinimum == null ? null : bandMinimum.LowerThreshold.Value,
            //    //value: bandMinimum.LowerThreshold.Value,
            //    decimalPlaces: 1,
            //});            

            // Filtramos la lista de estados con una severity mayor a 1 para mostrar 
            var filteredStatusList = ej.DataManager(arrayObjectStatus).executeLocal(ej.Query().where("Severity", "greaterThan", 1, false));

            //Grid de bandas
            $("#gridBands").ejGrid({
                dataSource: subVariable.Bands,
                locale: "es-ES",
                isResponsive: true,
                enableResponsiveRow: true,
                allowScrolling: true,
                gridLines: ej.Grid.GridLines.Both,
                //scrollSettings: { height: "500px", },
                load: function (args) {
                    this;
                    var bands = args.model.dataSource;
                    if (bands && bands[0] != null) {
                        for (var i = 0; i < bands.length; i++) {
                            bands[i].Index = _index++;
                        }
                        args.model.dataSource = bands;
                    }
                },
                //queryString: "Id",
                editSettings: { allowAdding: true, rowPosition: "top", allowEditing: true, allowEditOnDblClick: true, editMode: ej.Grid.EditMode.Normal, showConfirmDialog: false, allowDeleting: true, showDeleteConfirmDialog: true },
                toolbarSettings: {
                    showToolbar: true, toolbarItems: ["add", "update", "cancel", "delete"]
                },
                columns: [
                  { field: "Index", headerText: 'Id', textAlign: "center", width: "5%", visible: false, isPrimaryKey: true },
                  { field: "StatusId", headerText: 'Estado Condición', textAlign: "center", width: "35%", editType: ej.Grid.EditingType.Dropdown, dataSource: filteredStatusList, foreignKeyField: "Id", foreignKeyValue: "Name", },
                  { field: "Description", headerText: 'Nombre', textAlign: "center", width: "40%", },
                  { field: "UpperThreshold.Value", headerText: text, textAlign: "center", width: "10%", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 } },
                  { field: fieldName, headerText: 'Umbral Mín', textAlign: "center", width: "10%", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, visible: visible, defaultValue: "" },
                  //{ field: "LowerThreshold.Value", headerText: 'Umbral Mín', textAlign: "center", width: "10%", editType: ej.Grid.EditingType.Numeric, editParams: { decimalPlaces: 2 }, visible: visible, defaultValue: df },
                ],
                showStackedHeader: true,
                stackedHeaderRows: [{ stackedHeaderColumns: [{ headerText: "Bandas", column: "Description,UpperThreshold.Value,LowerThreshold.Value,StatusId" }] }],
                queryCellInfo: function (args) {
                    //var statusId = args.data.StatusId;
                    //var name = args.foreignKeyData.Name;
                    //var color = args.foreignKeyData.Color;
                    //var $element = $(args.cell);

                    ////Le agregamos a la columna estado un icono "circulo" con el color perteneciente al tipo de estado
                    //if (args.column.headerText == "Estado Condición") {
                    //    $element.html("<span class='fa fa-circle icon-large' style='background-color: transparent; color:" + color + "; padding: 2px;'></span> " + name);
                    //}
                },
                rowDataBound: function (args) {
                    var statu = ej.DataManager(arrayObjectStatus).executeLocal(ej.Query().where("Id", "equal", args.rowData.StatusId, false))[0];
                    var $element = $(args.row[0].children[1]);
                    //Le agregamos a la columna "Estado Condición" el icono "circulo" con el color perteneciente al tipo de estado                    
                    $element.html("<span class='fa fa-circle icon-large' style='background-color: transparent; color:" + statu.Color + "; padding: 2px;'></span> " + statu.Name);                    
                    
                },
                actionComplete: function (args) {
                    if (args.requestType == "add")
                        _index++;
                    else if (args.requestType == "save")
                        args.data.Index = _index;                    

                    // Habilita o no el boton "Aceptar" del ejDialog de Configuración de Bandas
                    if (["add", "beginedit"].includes(args.requestType)) {
                        $("#btnSaveBands").attr('disabled', 'disabled');

                        // Al seleccionar un estado de condición seteamos el campo "Nombre" con el item seleccionado
                        $('#gridBandsStatusId').ejDropDownList({
                            select: function (args) {
                                $("#gridBandsDescription").val(args.text);
                            }
                        })
                    }
                    else { // "cancel","delete","save"
                        $("#btnSaveBands").removeAttr('disabled');
                    }
                },
                actionBegin: function (args) {
                    if (args.requestType == "save") {
                        var fieldLowerThreshold = args.model.columns[4].visible;
                        var showMessage = false;
                        if (fieldLowerThreshold) {
                            if (args.data.LowerThreshold.Value == null) {
                                args.cancel = true;
                                popUp("error", "Todos los campos deben estar llenos!");
                                return;
                            }
                        }

                        if ([args.data.StatusId, args.data.Description, args.data.UpperThreshold.Value].includes(null)) {
                            args.cancel = true;
                            popUp("error", "Todos los campos deben estar llenos!");
                        }

                    }
                }
            });

            $("#formBands").ejDialog({
                title: "Configuración de Bandas",
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                width: "50%",
                minWidth: "50%",
                height: "60%",
                //minHeight: "95%",
                //scrollSettings: { height: "100%" },
                zIndex: 11000,
                allowDraggable: true,
                enableResize: true,
                allowScrolling: false,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) { },
                beforeOpen: function (args) {

                    // Guarda los cambios hechos en la configuración de bandas
                    $("#btnSaveBands").click(function () {
                        var upperThreshold = $("#txtUpperThreshold").ejNumericTextbox("getValue");
                        //var lowerThreshold = $("#txtLowerThreshold").ejNumericTextbox("getValue");

                        var subvariable = $("#gridSubVariables").ejGrid("getSelectedRecords")[0];
                        subvariable.Bands = $("#gridBands").data("ejGrid").model.dataSource;

                        if ((upperThreshold == null) || (upperThreshold == 0)) {
                            subvariable.MinimumHistoricalDataBand = null;
                        }
                        else {
                            subvariable.MinimumHistoricalDataBand = {
                                UpperThreshold: { Value: upperThreshold },
                                LowerThreshold: null,
                                //LowerThreshold: (lowerThreshold == null) ? null : { Value: lowerThreshold },
                            };
                        }

                        subvariable.DeadBand = $("#txtDeadBand").ejNumericTextbox("getValue");
                        subvariable.ThresholdLatency = $("#txtThresholdLatency").ejNumericTextbox("getValue");
                        $("#formBands").addClass('hidden');
                        $("#formBands").ejDialog("close");
                    });

                    // Cierre y cancela el formulario "Configurar evento de velocidad" de un activo principal
                    $("#btnCancelBands").click(function () {
                        $("#formBands").addClass('hidden');
                        $("#formBands").ejDialog("close");
                    });
                },//Fin beforeOpen
                close: function (args) {
                    $("#btnSaveBands").off("click"); // Necesario desasociar el evento
                    $("#btnCancelBands").off("click"); // Necesario desasociar el evento
                    $("#txtThresholdLatency").ejNumericTextbox("destroy");
                    $("#txtDeadBand").ejNumericTextbox("destroy");
                    $("#txtUpperThreshold").ejNumericTextbox("destroy");
                    //$("#txtLowerThreshold").ejNumericTextbox("destroy");
                    $("#gridBands").ejGrid("destroy");
                    $("#btnSaveBands").removeAttr('disabled');
                },//Fin close
            });

            $("#formBands").ejDialog("open");
            $("#formBands").removeClass('hidden');
        }

        this.Create = function (parentId, nodeId) {
            _typeOperation = "createMdVariable";
            _assetNodeId = nodeId;
            _mdVariableParentId = parentId;
            $("#notRefenceAngularFields").hide();
            $("#refenceAngularFields").hide();
            $("#divCheckbox").hide();
            $('#lblNombre').text("Nueva Etiqueta:");
            $("#divPositionCero").addClass('hidden');
            operation = "create";
            CreateControlsPoints(null, _mdVariableParentId);
            _createdControls = true;
            _createMeasurementPointDiaolog("Nuevo Punto de Medición ");
        };

        this.Copy = function (mdVariable) {
            var dataset = $('#measurementPoints').ejListBox("getSelectedItems");
           
            if (dataset.length > 1) {
                copiedNodes = [];
                for (var d = 0; d < dataset.length; d++) {
                    copiedNodes.push(dataset[d].data);
                }
                popUp("success", "Puntos de medición copiados!");
            } else {
                copiedNodes = [];
                copiedNodes.push(mdVariable);
                popUp("success", "Punto de medición " + copiedNodes[0].Name + " copiado!");
            }

            //copyNode = mdVariable;
            typeNode = 3;
            $("#locationMenu li#pasteAssetMenuItem").addClass('disabled');
            //$("#locationMenu").ejMenu("disableItemByID", "pasteAssetMenuItem");
            //popUp("success", "Punto de medición " + copyNode.Name + " copiado!");
        }

        this.Edit = function (mdVariableId) {
            _typeOperation = "editMdVariable";
            $("#notRefenceAngularFields").hide();
            $("#refenceAngularFields").hide();
            $("#divCheckbox").hide();

            $.ajax({
                url: "/Home/GetMdVariableById",
                method: "GET",
                data: { id: mdVariableId },
                success: function (response) {
                    _objMdVariable = response;
                },
                complete: function (e) {

                    //if (_objMdVariable) {
                    //    if (_objMdVariable.SensorTypeCode == 4) {
                    //        $("#refenceAngularFields").show();
                    //    } else {
                    //        $("#notRefenceAngularFields").show();
                    //    }
                    //}

                    $('#lblNombre').text("Etiqueta:");
                    operation = "edit";
                    CreateControlsPoints(_objMdVariable, _objMdVariable.ParentId);
                    _createdControls = true;
                    _createMeasurementPointDiaolog("Editar Punto de Medición " + _objMdVariable.Name);
                },
                error: function (jqXHR, textStatus) {
                    popUp("error", "A ocurrido un error. Intente nuevamente!");
                }
            });
        };

        this.Delete = function () {
            var pointsSelected = $('#measurementPoints').ejListBox("getSelectedItems");
            var title;

            if (pointsSelected.length > 1)
                title = "¿Desea eliminar estos puntos de medición?";
            else
                title = "¿Desea eliminar el punto de medición " + selectedMeasurementPoint.Name + "?";
            
            _createConfirmDialogDeleting("<b>Eliminar</b>", title);
        };

        //Función que retorna una lista de SubVariables del gridSubvariables
        function getListSubVariables(mdVariableId, parentId, operation) {
            var _subVariables = $("#gridSubVariables").ejGrid("getCurrentViewData");
            var _listSubVariables = [];
            var thresholdLatency;

            for (var i = 0; i < _subVariables.length; i++) {

                if (_subVariables[i].FromIntegratedWaveform == 1) {
                    _subVariables[i].FromIntegratedWaveform = true;
                } else if (_subVariables[i].FromIntegratedWaveform == 0) {
                    _subVariables[i].FromIntegratedWaveform = false;
                }

                if (operation == "Actualizar") {
                    parentId = _subVariables[i].ParentId;
                }

                _subVariables[i].Maximum = _subVariables[i].Minimum != null ? _subVariables[i].Maximum.toString().replace('.', ',') : null;
                _subVariables[i].Minimum = _subVariables[i].Minimum != null ? _subVariables[i].Minimum.toString().replace('.', ',') : null;

                // Cuando se agregó una nueva subVariable y no existe esta propiedad
                if ((typeof _subVariables[i].ThresholdLatency === "undefined") || _subVariables[i].ThresholdLatency == null)
                    _subVariables[i].ThresholdLatency = 0;
                else {
                    thresholdLatency = ConvertSecondsToMilliseconds(_subVariables[i].ThresholdLatency);
                    _subVariables[i].ThresholdLatency = thresholdLatency.toString().replace('.', ',');
                }

                if (typeof _subVariables[i].InitialAxialPosition !== "undefined")
                    _subVariables[i].InitialAxialPosition = _subVariables[i].InitialAxialPosition != 0 ? _subVariables[i].InitialAxialPosition.toString().replace('.', ',') : 0;

                // Validamos si la subvariable es tipo numérica para asignarle la propiedad "DeadBand"
                if (_subVariables[i].ValueType == 3 || _subVariables[i].ValueType == 5)
                    _subVariables[i].DeadBand = "";
                else {
                    if (_subVariables[i].DeadBand == null) // Si el campo se deja vacio
                        _subVariables[i].DeadBand = "";
                    else
                        _subVariables[i].DeadBand = _subVariables[i].DeadBand != 0 ? _subVariables[i].DeadBand.toString().replace('.', ',') : 0;
                }

                if (_subVariables[i].MinimumHistoricalDataBand) {
                    //var lowerThreshold = _subVariables[i].MinimumHistoricalDataBand.LowerThreshold;
                    var upperThreshold = _subVariables[i].MinimumHistoricalDataBand.UpperThreshold;

                    //_subVariables[i].MinimumHistoricalDataBand.LowerThreshold = (lowerThreshold != null) ? { Value: lowerThreshold.Value.toString().replace('.', ',') } : null;
                    _subVariables[i].MinimumHistoricalDataBand.LowerThreshold = null;
                    _subVariables[i].MinimumHistoricalDataBand.UpperThreshold = (upperThreshold != null) ? { Value: upperThreshold.Value.toString().replace('.', ',') } : null;
                }

                if (_subVariables[i].Bands) {
                    for (var x = 0; x < _subVariables[i].Bands.length; x++) {
                        if (_subVariables[i].Bands[x] != null) {
                            var upperT = _subVariables[i].Bands[x].UpperThreshold;
                            var lowerT = _subVariables[i].Bands[x].LowerThreshold;

                            if (upperT && upperT.Value) {
                                _subVariables[i].Bands[x].UpperThreshold.Value = upperT.Value.toString().replace('.', ',');
                            }
                            if (lowerT && lowerT.Value) {
                                _subVariables[i].Bands[x].LowerThreshold.Value = lowerT.Value.toString().replace('.', ',');
                            }
                        }
                    }
                } else {
                    _subVariables[i].Bands = [];
                }

                _listSubVariables[i] = {
                    Id: operation == "Create" ? null : _subVariables[i].Id,
                    ParentId: operation == "Create" ? null : parentId,
                    Name: _subVariables[i].Name,
                    Description: _subVariables[i].Description,
                    ValueType: _subVariables[i].ValueType,
                    Units: _subVariables[i].Units,
                    ThresholdLatency: _subVariables[i].ThresholdLatency,
                    Bands: _subVariables[i].Bands,
                    Maximum: _subVariables[i].Maximum,
                    Minimum: _subVariables[i].Minimum,
                    IsDefaultValue: _subVariables[i].IsDefaultValue,
                    DeadBand: _subVariables[i].DeadBand,
                    MinimumHistoricalDataBand: _subVariables[i].MinimumHistoricalDataBand,
                    MeasureType: _subVariables[i].MeasureType,
                    FromIntegratedWaveform: _subVariables[i].FromIntegratedWaveform,
                    GapCalibrationValue: _subVariables[i].GapCalibrationValue,
                    InitialAxialPosition: _subVariables[i].InitialAxialPosition
                };
            }
            return _listSubVariables;
        }

        //Obtiene todos los valores de cada uno de los controles incluidos en el formulario de clonación y edicion de una MdVariable
        function getFormValues() {
            var _sensorType = $('#ddlSensorType').ejDropDownList("getSelectedValue");
            var _sensibility = $("#txtSensibility").ejNumericTextbox("getValue");
            var _angularReferenceId = $('#ddlAngularReference').ejDropDownList("getSelectedValue");
            var vMax = null;
            var vMin = null;
            var xMax = null;
            var xMin = null;
            var polesCount = null;
            var pole1Angle = null;
            var polarGraphRange = null;
            var material = null;
            var coefficient = null;
            var ro = null;
            var iEx = null;
            var m = null;
            var b = null, minimumNoiseInVolts, tresholdPercentage, hysteresisTresholdPercentage;

            if (_sensorType == 6 || _sensorType == 7 || _sensorType == 10) {
                vMax = $("#txtEntryMax").ejNumericTextbox("getValue"); // Tambien aplica como Imax para el caso del sensor tipo corriente o flujo magnético
                vMin = $("#txtEntryMin").ejNumericTextbox("getValue"); // Tambien aplica como Imin para el caso del sensor tipo corriente o flujo magnético
                xMax = $("#txtVarMax").ejNumericTextbox("getValue");
                xMin = $("#txtVarMin").ejNumericTextbox("getValue");

                if (_sensorType == 10) {
                    polesCount = $("#txtPolesCount").ejNumericTextbox("getValue");
                    pole1Angle = $("#txtPole1Angle").ejNumericTextbox("getValue");
                    polarGraphRange = $("#txtPolarGraphRange").ejNumericTextbox("getValue");
                }

            }
            else if (_sensorType == 5) {
                material = $('#ddlMaterial').ejDropDownList("getSelectedValue");
                coefficient = $('#ddlCoefficient').ejDropDownList("getSelectedValue");
                ro = $("#txtRo").ejNumericTextbox("getValue");
                iEx = $("#txtIex").ejNumericTextbox("getValue");
            }
            else if (_sensorType == 8) {
                m = $("#txtRefAngularM").ejNumericTextbox("getValue");
                b = $("#txtRefAngularB").ejNumericTextbox("getValue");
            }
            else if (_sensorType == 4) {
                minimumNoiseInVolts = $("#txtMinimumNoiseInVolts").ejNumericTextbox("getValue");
                tresholdPercentage = $("#txtTresholdPercentage").ejPercentageTextbox("getValue");
                hysteresisTresholdPercentage = $("#txtHysteresisTresholdPercentage").ejPercentageTextbox("getValue");
            }

            var mVoltage = null;
            var bVoltage = null;
            var factor = 1;
            var rin = 1;
            var _sensorAngle = $("#txtSensorAngle").ejNumericTextbox("getValue");

            var control = {
                name: $("#txtName").val(),
                description: $("#txtDescription").val(),
                sensorType: _sensorType,
                unit: $("#txtUnit").val(),
                sensorAngle: _sensorAngle != null ? _sensorAngle.toString().replace('.', ',') : null,
                sensibility: _sensibility != null ? _sensibility.toString().replace('.', ',') : null,
                orientation: $('#ddlOrientation').ejDropDownList("getSelectedValue"),

                vMax: vMax,
                vMin: vMin,
                xMax: xMax,
                xMin: xMin,
                polesCount: polesCount,
                pole1Angle: pole1Angle,
                polarGraphRange: polarGraphRange,
                ro: ro,
                iEx: iEx,
                m: m,
                b: b,
                minimumNoiseInVolts: minimumNoiseInVolts,
                tresholdPercentage: tresholdPercentage,
                hysteresisTresholdPercentage: hysteresisTresholdPercentage,
            };

            if (_sensorType == 1 || _sensorType == 2 || _sensorType == 3) { // Priximidad, Acelerometro ó Velocimetro 

                if (_sensorType == 2) {
                    control.Integrate = $("#chbIntegrate").ejCheckBox("isChecked");
                }
                control.angularReferenceId = _angularReferenceId;
                control.parameterM = ((1000 / _sensibility) * factor).toString().replace('.', ',');
                control.parameterB = 0;
            }
            else if (_sensorType == 4) { // Referencia Angular
                if (![minimumNoiseInVolts, tresholdPercentage, hysteresisTresholdPercentage].includes(null)) {
                    control.RotationDirection = $('#ddlRotationDirection').ejDropDownList("getSelectedValue");
                    control.minimumNoiseInVolts = minimumNoiseInVolts.toString().replace('.', ',');
                    control.tresholdPercentage = tresholdPercentage.toString().replace('.', ',');
                    control.hysteresisTresholdPercentage = hysteresisTresholdPercentage.toString().replace('.', ',');
                }
            }
            else if (_sensorType == 8) { // Personalizado                
                if (![m, b].includes(null)) {
                    control.angularReferenceId = _angularReferenceId;
                    control.parameterM = m.toString().replace('.', ',');
                    control.parameterB = b.toString().replace('.', ',');
                    control.sensibility = 1; // "0,0D"; // Hace que no guarde en base de datos, ya que en la entidad esta propiedad tiene [BsonIgnoreIfDefault]
                }
            }
            else if (_sensorType == 9) { // Desplazamiento axial
                control.angularReferenceId = _angularReferenceId;
                control.parameterM = ((1000 / _sensibility) * factor).toString().replace('.', ',');
                control.parameterB = 0;
            }

            if (_sensorType == 5) { // RTD
                if (![ro, iEx].includes(null)) {
                    mVoltage = 1000 / (coefficient * ro * iEx);
                    bVoltage = -1 / coefficient;
                    control.parameterM = mVoltage.toString().replace('.', ',');
                    control.parameterB = bVoltage.toString().replace('.', ',');
                    control.angularReferenceId = _angularReferenceId;
                    control.RtdParams = {
                        MaterialType: material,
                        Coefficient: coefficient.toString().replace('.', ','),
                        Ro: ro.toString().replace('.', ','),
                        Iex: iEx.toString().replace('.', ','),
                    };
                    control.sensibility = 1; // "0,0D";
                }
            } else
                control.RtdParams = null;

            if (_sensorType == 6) { // Voltaje
                if (![vMax, vMin, xMax, xMin].includes(null)) {
                    mVoltage = (xMax - xMin) / (vMax - vMin);
                    bVoltage = xMax - ((xMax - xMin) / (vMax - vMin) * vMax);
                    control.parameterM = mVoltage.toString().replace('.', ',');
                    control.parameterB = bVoltage.toString().replace('.', ',');
                    control.angularReferenceId = _angularReferenceId;
                    control.VoltageParams = {
                        Vmax: vMax.toString().replace('.', ','),
                        Vmin: vMin.toString().replace('.', ','),
                        Xmax: xMax.toString().replace('.', ','),
                        Xmin: xMin.toString().replace('.', ','),
                    };
                    control.sensibility = 1; // "0,0D";
                }
            } else
                control.VoltageParams = null;

            if (_sensorType == 7) { // Corriente
                if (![vMax, vMin, xMax, xMin].includes(null)) {
                    mVoltage = (xMax - xMin) / (rin * (vMax - vMin));
                    bVoltage = xMax - ((xMax - xMin) / (vMax - vMin) * vMax);
                    control.parameterM = mVoltage.toString().replace('.', ',');
                    control.parameterB = bVoltage.toString().replace('.', ',');
                    control.angularReferenceId = _angularReferenceId;
                    control.CurrentParams = {
                        Imax: vMax.toString().replace('.', ','),
                        Imin: vMin.toString().replace('.', ','),
                        Xmax: xMax.toString().replace('.', ','),
                        Xmin: xMin.toString().replace('.', ','),
                    };
                    control.sensibility = 1; // "0,0D";
                }
            } else
                control.CurrentParams = null;

            if (_sensorType == 10) { // Flujo magnético
                if (![vMax, vMin, xMax, xMin, polesCount, pole1Angle, polarGraphRange].includes(null)) {
                    mVoltage = (xMax - xMin) / (rin * (vMax - vMin));
                    bVoltage = xMax - ((xMax - xMin) / (vMax - vMin) * vMax);
                    control.parameterM = mVoltage.toString().replace('.', ',');
                    control.parameterB = bVoltage.toString().replace('.', ',');
                    control.angularReferenceId = _angularReferenceId;
                    control.MagneticFlowParams = {
                        PolesCount: polesCount,
                        Pole1Angle: pole1Angle.toString().replace('.', ','),
                        PolarGraphRange: polarGraphRange.toString().replace('.', ','),
                        Imax: vMax.toString().replace('.', ','),
                        Imin: vMin.toString().replace('.', ','),
                        Xmax: xMax.toString().replace('.', ','),
                        Xmin: xMin.toString().replace('.', ','),
                    };
                    control.sensibility = 1; // "0,0D";
                }
            } else
                control.MagneticFlowParams = null;

            return control;
        }

        //Boton "Guardar" para crear ó editar un punto de medición
        $("#btnCreateOrEditMdVariable").click(function () {
            if (_typeOperation == "createMdVariable") { // Crear
                var input = getFormValues();
                var save = validateFields(input);
                if (save) {
                    // Obtenemos el número de puntos de medición hermanos que existen para setear la propiedad OrderPosition
                    var data = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where("ParentNodeId", "equal", selectedTreeNode.Id, false));
                    var nPosition = data.length == 0 ? 0 : ej.max(data, "OrderPosition").OrderPosition + 1;

                    var _nodeAndMdVariableDto = {
                        NodeDto:
                            {
                                ParentId: _assetNodeId,
                                Name: input.name,
                                Description: input.description,
                                Type: 3,
                                HasChild: false,
                                Categories: { PrincipalCategory: "56ccc5792c18982eb4839e02" },
                                Status: [{ Corp: 3, StatusId: "" }]
                            },
                        MdVariableDto:
                            {
                                ParentId: _mdVariableParentId,
                                Name: input.name,
                                Description: input.description,
                                IsRealTime: true,
                                UserResponsible: null,
                                NodeId: null,
                                Sensibility: input.sensibility,
                                SensorTypeCode: input.sensorType,
                                SensorAngle: input.sensorAngle,
                                AngularReferenceConfig:
                                {
                                    MinimumNoiseInVolts: input.minimumNoiseInVolts,
                                    TresholdPercentage: input.tresholdPercentage,
                                    HysteresisTresholdPercentage: input.hysteresisTresholdPercentage
                                },
                                IsAngularReference: (input.sensorType == 4) ? true : false,
                                AngularReferenceId: input.angularReferenceId != "0" ? input.angularReferenceId : null,
                                Integrate: input.Integrate,
                                AiMeasureMethod: {
                                    AiMethodId: null,
                                    Name: "",
                                    ParameterTypes: [],
                                    ParameterValues: [],
                                    M: input.parameterM == null ? 1 : input.parameterM,
                                    B: input.parameterB,
                                },
                                RotationDirection: input.RotationDirection,
                                Units: input.unit,
                                Orientation: input.orientation, 
                                OrderPosition: nPosition,
                            }
                    };

                    if (input.sensorType == 4) {
                        var _instance = $("#gridSubVariables").ejGrid("instance").model.currentViewData;
                        _instance.push(_pulsos);
                        $("#gridSubVariables").ejGrid("dataSource", _instance);
                    } else if (input.sensorType == "5") {
                        if (input.RtdParams)
                            _nodeAndMdVariableDto.MdVariableDto.RtdParams = input.RtdParams;
                    } else if (input.sensorType == "6") {
                        if (input.VoltageParams)
                            _nodeAndMdVariableDto.MdVariableDto.VoltageParams = input.VoltageParams;
                    } else if (input.sensorType == "7") {
                        if (input.CurrentParams)
                            _nodeAndMdVariableDto.MdVariableDto.CurrentParams = input.CurrentParams;
                    } else if (input.sensorType == "10") {
                        if (input.MagneticFlowParams)
                            _nodeAndMdVariableDto.MdVariableDto.MagneticFlowParams = input.MagneticFlowParams;
                    }

                    // Indica si se guarda la forma de onda o no
                    var saveWaveform = $("#chbWaveform").ejCheckBox("isChecked");
                    if (saveWaveform && input.sensorType != "11") {
                        var _instance = $("#gridSubVariables").ejGrid("instance").model.currentViewData;
                        _instance.push(_waveForm);
                        $("#gridSubVariables").ejGrid("dataSource", _instance);
                    }

                    var _subVariables = getListSubVariables(null, null, "Create");
                    if (input.sensorType == "9") {
                        ej.DataManager(_subVariables).update("IsDefaultValue",
                            {
                                IsDefaultValue: true,
                                InitialAxialPosition: $("#txtPositionCero").ejNumericTextbox("getValue").toString().replace('.', ','),
                            }, _subVariables);
                    }

                    // Guarda el nuevo Node, mdVariable y sus respectivas subvariables en base de datos
                    $.ajax({
                        url: "/Home/CreateNodeMdVariableAndSubVariables",
                        method: "POST",
                        data: { nodeAndMdVariableDto: _nodeAndMdVariableDto, subVariables: _subVariables },
                        success: function (result) {
                            var _newMdVariable = result.mdVariable;
                            var _newNode = result.node;
                            var _listSubVariableId = result.listSubVariableId;

                            for (var i = 0; i < _subVariables.length; i++) {
                                _subVariables[i].Id = _listSubVariableId[i];
                                _subVariables[i].ParentId = _newMdVariable.Id;
                            }

                            //Agregamos el nuevo node al jsonTree
                            var newNode = {
                                "added": [{
                                    Id: _newNode.Id,
                                    HasChild: false,
                                    ParentId: _newNode.ParentId,
                                    Name: _newNode.Name,
                                    Description: _newNode.Description,
                                    EntityType: 3,
                                    Categories: _newNode.Categories,
                                    Status: _newNode.Status
                                }], "deleted": {}, "changed": {}
                            };

                            var updateJsonTree = ej.DataManager(jsonTree).saveChanges(newNode);
                            _newMdVariable.SubVariables = _subVariables;
                            _newMdVariable.ParentNodeId = _newNode.ParentId;
                            var newMdVariable = { "added": [_newMdVariable], "deleted": {}, "changed": {} };

                            ej.DataManager(mainCache.loadedMeasurementPoints).saveChanges(newMdVariable);
                            // Si no existen puntos de medición asociados a un activo se crea el listbox, de lo contrario se adiciona éste al listbox actual.
                            if (!$("#measurementPoints").data("ejListBox")) {
                                listboxControl.CreateListbox(Node = { Id: _newNode.ParentId, AssetId: _newMdVariable.ParentId }, null);
                            } else {
                                $('#measurementPoints').ejListBox("addItem", {
                                    Id: _newMdVariable.Id,
                                    Name: _newMdVariable.Name,
                                    NodeId: _newNode.Id,
                                    ParentId: _newMdVariable.ParentId,
                                    ParentNodeId: _newNode.ParentId,
                                    SensorTypeCode: 3,
                                    Orientation: input.orientation,
                                    AssociatedMeasurementPointId: null,
                                });
                                $("#measurementPoints").ejListBox("refresh", true);
                            }
                        },
                        complete: function (result) {
                            _index = 0;
                            $("#formMdVariable").ejDialog("close");
                            popUp("success", "Se creó correctamente el punto de medición!");
                        },
                        error: function (jqXHR, textStatus) {
                            popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                        }
                    });
                }
                else {
                    popUp("error", "Campo(s) obligatorio(s)!");
                }
            }//Fin crear

            if (_typeOperation == "editMdVariable") {//Editar
                var input = getFormValues();
                var update = validateFields(input);
                if (update) {
                    var _mdVariable = {
                        Id: _objMdVariable.Id,
                        ParentId: _objMdVariable.ParentId,
                        Name: input.name,
                        Description: input.description,
                        IsRealTime: _objMdVariable.IsRealTime,
                        UserResponsible: _objMdVariable.UserResponsible,
                        NodeId: _objMdVariable.NodeId,
                        Sensibility: input.sensibility,
                        SensorTypeCode: input.sensorType,
                        SensorAngle: input.sensorAngle,
                        AngularReferenceConfig:
                        {
                            MinimumNoiseInVolts: input.minimumNoiseInVolts,
                            TresholdPercentage: input.tresholdPercentage,
                            HysteresisTresholdPercentage: input.hysteresisTresholdPercentage
                        },
                        IsAngularReference: (input.sensorType == 4) ? true : false,
                        AngularReferenceId: input.angularReferenceId != "0" ? input.angularReferenceId : null,
                        Integrate: input.Integrate,
                        AiMeasureMethod: {},
                        RotationDirection: input.RotationDirection,
                        Units: input.unit,
                        Orientation: input.orientation,
                    };

                    if (_objMdVariable.AiMeasureMethod) {
                        _mdVariable.AiMeasureMethod.AiMethodId = _objMdVariable.AiMeasureMethod.AiMethodId;
                        _mdVariable.AiMeasureMethod.Name = _objMdVariable.AiMeasureMethod.Name;
                        _mdVariable.AiMeasureMethod.ParameterTypes = _objMdVariable.AiMeasureMethod.ParameterTypes != null ? _objMdVariable.AiMeasureMethod.ParameterTypes : [];
                        _mdVariable.AiMeasureMethod.ParameterValues = _objMdVariable.AiMeasureMethod.ParameterValues != null ? _objMdVariable.AiMeasureMethod.ParameterValues : [];
                        _mdVariable.AiMeasureMethod.M = input.parameterM == null ? 1 : input.parameterM;
                        _mdVariable.AiMeasureMethod.B = input.parameterB;
                    } else {
                        _mdVariable.AiMeasureMethod = null;
                    }

                    if (input.sensorType == "5") {
                        if (input.RtdParams)
                            _mdVariable.RtdParams = input.RtdParams;
                    } else if (input.sensorType == "6") {
                        if (input.VoltageParams)
                            _mdVariable.VoltageParams = input.VoltageParams;
                    } else if (input.sensorType == "7") {
                        if (input.CurrentParams)
                            _mdVariable.CurrentParams = input.CurrentParams;
                    } else if (input.sensorType == "10") {
                        if (input.MagneticFlowParams)
                            _mdVariable.MagneticFlowParams = input.MagneticFlowParams;
                    }

                    $.ajax({
                        url: "/Home/UpdateMdVariableAndNode",
                        method: "POST",
                        data: { mdVariable: _mdVariable },
                        success: function (result) {

                            var _subVariables = getListSubVariables(_objMdVariable.Id, null, "Actualizar");
                            // Si el pto de medición es "Desplazamiento axial" la subvariable "Directa" se le setea la propiedad "InitialAxialPosition"
                            if (input.sensorType == "9") {
                                ej.DataManager(_subVariables).update("IsDefaultValue",
                                    {
                                        IsDefaultValue: true,
                                        InitialAxialPosition: $("#txtPositionCero").ejNumericTextbox("getValue").toString().replace('.', ','),
                                    }, _subVariables);
                            }

                            //var hasChanges = HasChangesSubVariables(_subVariablesOriginal, _subVariables);
                            //alert(hasChanges);                        

                            $.ajax({
                                url: "/Home/UpdateSubVariables",
                                data: { subVariables: _subVariables },
                                method: "POST",
                                success: function (result) { },
                                complete: function (result) {

                                    //Actualiza el nombre del punto de medición editado
                                    selectedMeasurementPoint.Name = input.name;
                                    selectedMeasurementPoint.Orientation = input.orientation;
                                    selectedMeasurementPoint.SensorTypeCode = input.sensorType;
                                    selectedMeasurementPoint.Units = input.unit;
                                    selectedMeasurementPoint.SensorAngle = input.sensorAngle;
                                    selectedMeasurementPoint.RtdParams = input.RtdParams,
                                    selectedMeasurementPoint.CurrentParams = input.CurrentParams;
                                    selectedMeasurementPoint.VoltageParams = input.VoltageParams;
                                    selectedMeasurementPoint.MagneticFlowParams = input.MagneticFlowParams;

                                    $("#measurementPoints").ejListBox("refresh", true);
                                    ej.DataManager(mainCache.loadedMeasurementPoints).update("Id", _mdVariable, mainCache.loadedMeasurementPoints);

                                    $("#formMdVariable").ejDialog("close");
                                    popUp("success", "Se actualizó correctamente el punto de medición!");
                                },
                                error: function (jqXHR, textStatus) {
                                    popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                                }
                            });

                        },
                        error: function (jqXHR, textStatus) {
                            popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                        }
                    });
                }
                else {
                    popUp("error", "Campo(s) obligatorio(s)!");
                }
            }//Fin editar
        });

        // Boton "Cancelar" para crear o editar un punto de medición
        $("#btnCancelMdVariable").click(function () {
            if (_typeOperation == "editMdVariable") {
                ej.DataManager(mainCache.loadedMeasurementPoints).update("Id", _originalDataPoint, mainCache.loadedMeasurementPoints);
                _originalDataPoint = {};
            }
            $("#formMdVariable").ejDialog("close");
            _createdControls = false;
        });

        _createConfirmDialogDeleting = function (title, question) {
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
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
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
                            var dsPoints = [];
                            var listPoints= $('#measurementPoints').ejListBox("getSelectedItems");
                            $.each(listPoints, function (i, item) {
                                dsPoints.push(item.data);
                            });                            

                            $.ajax({
                                //url: "/Home/DeleteMdVariableById",
                                url: "/Home/DeleteManyMdVariable",
                                method: "POST",
                                //data: { mdVariableId: selectedMeasurementPoint.Id, asdaqId: selectedTreeNode.AsdaqId },
                                data: { mdVariables: dsPoints },
                                success: function (response) { },
                                complete: function (response) {
                                    $("#dialogDelete").ejDialog("close");

                                    //Se elimina el item del listbox de puntos de medición
                                    $('#measurementPoints').ejListBox("removeSelectedItems");
                                    //Se elimina el punto de medición del mainCache y jsonTree
                                    for (var p = 0; p < dsPoints.length; p++) {
                                        ej.DataManager(mainCache.loadedMeasurementPoints).remove("Id", dsPoints[p].Id);
                                        ej.DataManager(jsonTree).remove("Id", dsPoints[p].NodeId);
                                    }

                                    // Si no existen mas puntos de medición en el listbox éste se destruye para que no se presente un error de diseño
                                    var children = ej.DataManager(jsonTree).executeLocal(new ej.Query().where("ParentId", "equal", selectedMeasurementPoint.ParentNodeId, false));
                                    if (children.length == 0) {
                                        $("#measurementPoints").ejListBox("destroy");
                                    }

                                    popUp("success", "Punto(s) de medición eliminado(s) correctamente!");
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
                            $("#dialogDelete").ejDialog("close");
                        }
                    });
                },
                close: function (args) {
                    $("#btnDelete").ejButton("destroy");
                    $("#btn_Cancel").ejButton("destroy");
                    //this.destroy();
                    $("#dialogDelete").addClass('hidden');
                },
            });

            $("#dialogDelete").removeClass('hidden');
            $("#dialogDelete").ejDialog("open");
        };

        function clearGrid(dataSource) {
            var count = dataSource.length;
            for (var d = 0; d < count; d++) {
                $("#gridSubVariables").ejGrid("deleteRecord", "Id", { Id: dataSource[0].Id });
            }
        }

        function setCellValue(fieldName, cellValue, TypesSubVariable) {
            var data = $("#gridSubVariables").ejGrid("instance").model.currentViewData;
            for (var d = 0; d < data.length; d++) {
                if (TypesSubVariable == "ado") {
                    if (data[d].Id == _amplitud1x.Id || data[d].Id == _directa.Id || data[d].Id == _original.Id) {
                        data[d][fieldName] = cellValue;
                    }
                } else if (TypesSubVariable == "adf") {
                    if (data[d].Id == _amplitud1x.Id || data[d].Id == _directa.Id || data[d].Id == _fase1x.Id) {
                        data[d][fieldName] = cellValue;
                    }
                } else if (TypesSubVariable == "ad") {
                    if (data[d].Id == _directa.Id || data[d].Id == _amplitud1x.Id) {
                        data[d][fieldName] = cellValue;
                    }
                } else if (TypesSubVariable == "af") {
                    if (data[d].Id == _amplitud1x.Id || data[d].Id == _fase1x.Id) {
                        data[d][fieldName] = cellValue;
                    }
                }
                else if (TypesSubVariable == "d") {
                    if (data[d].Id == _directa.Id) {
                        data[d][fieldName] = cellValue;
                    }
                }
                else if (TypesSubVariable == "do") {
                    if (data[d].Id == _directa.Id || data[d].Id == _original.Id) {
                        data[d][fieldName] = cellValue;
                    }
                }
                else if (TypesSubVariable == "o") {
                    if (data[d].Id == _original.Id) {
                        data[d][fieldName] = cellValue;
                    }
                }
            }
            //data[fieldName] = cellValue; // Asignamos el valor al dataSource de la celda especifica
            //var columnIndex = instance.getColumnIndexByField(fieldName) + 1; // Obtenemos el indice de la columna
            //var $element = $(tr).find('td').eq(columnIndex);
            //$element.text(cellValue); // Seteamos el valor para la celda
            $("#gridSubVariables").ejGrid("refreshContent", true);
        }

        function GetListReferenceAngular(parentId) {
            var asset = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("AssetId", "equal", parentId, false))[0];
            if (asset.IsPrincipal == true) {
                var childrens = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", asset.AssetId, true).and("SensorTypeCode", "equal", 4, true)));
                for (var c = 0; c < childrens.length; c++) {
                    _listRefAngular.push(childrens[c]);
                }
                return;
            } else {
                var brothers = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("ParentId", "equal", asset.ParentId, false));
                for (var b = 0; b < brothers.length; b++) {
                    var refAngulars = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(ej.Query().where(ej.Predicate("ParentId", "equal", brothers[b].AssetId, true).and("SensorTypeCode", "equal", 4, true)));
                    for (var ra = 0; ra < refAngulars.length; ra++) {
                        _listRefAngular.push(refAngulars[ra]);
                    }
                }

                if (brothers.length > 0) {
                    var assetId = ej.DataManager(mainCache.loadedAssets).executeLocal(ej.Query().where("Id", "equal", brothers[0].ParentId, false))[0].AssetId;
                    GetListReferenceAngular(assetId);
                }
            }
        }

        // svA -> subVariablesA (Objeto original)
        // svB -> subVariablesB (Objeto actual)
        // Valida si hubieron cambios entre los dos parametros (svA, svB) para notificarselo al Asdaq
        function HasChangesSubVariables(svA, svB) {
            var hasChanges = false;
            if (svA.length == svB.length) {
                for (var i = 0; i < svA.length; i++) {

                }
            } else
                hasChanges = true;

            return hasChanges;
        }

        // Covierte segundos a milisegundos
        function ConvertSecondsToMilliseconds(seconds) {
            return (seconds * 1000);
        }

        // Convierte milisegundos a segundos
        function ConvertMillisecondsToSeconds(milliseconds) {
            return (milliseconds / 1000);
        }

        function updateFieldsGridSubVariables(integrate, unit) {
            var data = $("#gridSubVariables").data("ejGrid").model.dataSource;
            if (integrate) {
                // Actualiza la propiedad FromIntegratedWaveForm en true de Directa, Amplitud 1x y Fase 1x
                ej.DataManager(data).update("IsDefaultValue", { IsDefaultValue: true, MeasureType: 3, FromIntegratedWaveform: 1, Units: unit != null ? unit : "" }, data);
                ej.DataManager(data).update("MeasureType", { MeasureType: 4, FromIntegratedWaveform: 1, Units: (unit != null) ? unit : "" }, data);
                ej.DataManager(data).update("MeasureType", { MeasureType: 6, FromIntegratedWaveform: 1 }, data);
            } else {
                // Actualiza la propiedad FromIntegratedWaveForm en false de Directa, Amplitud 1x y Fase 1x
                ej.DataManager(data).update("IsDefaultValue", { IsDefaultValue: true, MeasureType: 1, FromIntegratedWaveform: 0, Units: unit != null ? unit : "" }, data);
                ej.DataManager(data).update("MeasureType", { MeasureType: 4, FromIntegratedWaveform: 0, Units: (unit != null) ? unit : "" }, data);
                ej.DataManager(data).update("MeasureType", { MeasureType: 6, FromIntegratedWaveform: 0 }, data);
            }
            //$("#gridSubVariables").ejGrid("dataSource", data);
            $("#gridSubVariables").ejGrid("refreshContent");
        }

        // Valida ciertos campos pertenecientes a un punto de medición tanto en creación como edición.
        function validateFields(fields) {
            var validated = true;

            if (fields.sensorType == "") {
                $("#ddlSensorType").parent().parent().addClass("validateField");
                validated = false;
            } else {
                $("#ddlSensorType").parent().parent().removeClass("validateField");
            }

            if (fields.name.trim() == "") {
                $("#txtName").parent().parent().addClass("validateField");
                validated = false;
            } else {
                $("#txtName").parent().parent().removeClass("validateField");
            }

            if (fields.sensorType != 4) { // Diferente a la Referencia angular que no necesita unidad
                if (fields.unit.trim() == "") {
                    $("#txtUnit").parent().parent().addClass("validateField");
                    $("#ddlUnits").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtUnit").parent().parent().removeClass("validateField");
                    $("#ddlUnits").parent().parent().removeClass("validateField");
                }
            }

            if (fields.sensorAngle == null) {
                $("#txtSensorAngle").parent().parent().addClass("validateField");
                validated = false;
            } else {
                $("#txtSensorAngle").parent().parent().removeClass("validateField");
            }

            if (!["5", "6", "7", "8", "10"].includes(fields.sensorType)) { // Diferentes al tipo de sensor 5, 6, 7, 8 10
                if (fields.sensibility == null) {
                    $("#txtSensibility").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtSensibility").parent().parent().removeClass("validateField");
                }
            }

            if (fields.sensorType == 4) { // Referencia angular
                if (fields.minimumNoiseInVolts == null) {
                    $("#txtMinimumNoiseInVolts").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtMinimumNoiseInVolts").parent().parent().removeClass("validateField");
                }

                if (fields.tresholdPercentage == null) {
                    $("#txtTresholdPercentage").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtTresholdPercentage").parent().parent().removeClass("validateField");
                }

                if (fields.hysteresisTresholdPercentage == null) {
                    $("#txtHysteresisTresholdPercentage").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtHysteresisTresholdPercentage").parent().parent().removeClass("validateField");
                }
            }
            else if (fields.sensorType == 5) { // RTD
                if (fields.ro == null) {
                    $("#txtRo").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtRo").parent().parent().removeClass("validateField");
                }

                if (fields.iEx == null) {
                    $("#txtIex").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtIex").parent().parent().removeClass("validateField");
                }
            }
            else if (["6", "7", "10"].includes(fields.sensorType)) { // Voltaje, Corriente o Flujo magnéctico
                if (fields.vMax == null) {
                    $("#txtEntryMax").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtEntryMax").parent().parent().removeClass("validateField");
                }

                if (fields.vMin == null) {
                    $("#txtEntryMin").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtEntryMin").parent().parent().removeClass("validateField");
                }

                if (fields.xMax == null) {
                    $("#txtVarMax").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtVarMax").parent().parent().removeClass("validateField");
                }

                if (fields.xMin == null) {
                    $("#txtVarMin").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtVarMin").parent().parent().removeClass("validateField");
                }

                if (fields.sensorType == 10) { // Flujo magnético
                    if (fields.polesCount == null) {
                        $("#txtPolesCount").parent().parent().addClass("validateField");
                        validated = false;
                    } else {
                        $("#txtPolesCount").parent().parent().removeClass("validateField");
                    }

                    if (fields.pole1Angle == null) {
                        $("#txtPole1Angle").parent().parent().addClass("validateField");
                        validated = false;
                    } else {
                        $("#txtPole1Angle").parent().parent().removeClass("validateField");
                    }

                    if (fields.polarGraphRange == null) {
                        $("#txtPolarGraphRange").parent().parent().addClass("validateField");
                        validated = false;
                    } else {
                        $("#txtPolarGraphRange").parent().parent().removeClass("validateField");
                    }
                }
            }
            else if (fields.sensorType == 8) { // Personalizado
                if (fields.m == null) {
                    $("#txtRefAngularM").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtRefAngularM").parent().parent().removeClass("validateField");
                }

                if (fields.b == null) {
                    $("#txtRefAngularB").parent().parent().addClass("validateField");
                    validated = false;
                } else {
                    $("#txtRefAngularB").parent().parent().removeClass("validateField");
                }
            }
            else if (fields.sensorType == 11) { // RDS
                if (!validated) {
                    if (fields.name.trim() != "")
                        validated = true;
                }
            }

            return validated;
        }

        // Validad las subVariables que serán visibles dependiendo el tipo de caso
        function validateVisibilityRows(subVariables, kph, integrate, tr) {

            $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children('tr').each(function () {
                if (subVariables[this.rowIndex].FromIntegratedWaveform == 0) {
                    if (integrate)
                        tr.push({ index: this.rowIndex, action: "removeClass" });//$(this).removeClass("hidden");                    
                }

                if ((subVariables[this.rowIndex].MeasureType == 4) || (subVariables[this.rowIndex].MeasureType == 6)) {
                    if (kph == "0")
                        tr.push({ index: this.rowIndex, action: "addClass" }); //$(this).addClass("hidden");                    
                    else
                        tr.push({ index: this.rowIndex, action: "removeClass" }); //$(this).removeClass("hidden");
                }
                else if (subVariables[this.rowIndex].MeasureType == 7) {
                    tr.push({ index: this.rowIndex, action: "removeClass" });
                }
                else {
                    if (!integrate) {
                        if (!subVariables[this.rowIndex].IsDefaultValue)
                            tr.push({ index: this.rowIndex, action: "addClass" });//$(this).addClass("hidden");                        
                    }
                }
            });

            return tr;
        }

        // Cambia los valores de Sensibilidad y los rangos (Máximo y Mínimo) de la SubVariable Directa al seleccionar un tipo de unidad
        function ChangeSensibilityAndRangesByUnit(sensorType, unit, integrate) {
            var subVariables = $("#gridSubVariables").data("ejGrid").model.dataSource;
            var updateData = null;
            switch (parseInt(sensorType)) {
                case 0:
                    updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: null, Minimum: null }, subVariables);
                    $("#txtSensibility").ejNumericTextbox({ value: null });
                    break;
                case 1: // Proximidad
                    if (unit == "um") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: 1000, Minimum: 0 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 7.87 });
                    }
                    else if (unit == "mils") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: 40, Minimum: 0 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 200 });
                    }
                    break;
                case 2: // Acelerómetro    
                    if (unit == "g") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: 50, Minimum: 0 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 100 });
                    }
                    else if (unit == "mg") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: integrate == true ? "mm/s" : unit, Maximum: integrate == false ? 50000 : 40, Minimum: 0, FromIntegratedWaveform: integrate == true ? 1 : 0, MeasureType: integrate == true ? 3 : 1 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 0.1 });
                    }
                    else if (unit == "m/s^2") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: 500, Minimum: 0 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 10 });
                    }

                    if (!integrate) {
                        for (var i = 0; i < subVariables.length; i++) {
                            if (subVariables[i].MeasureType == 6 || subVariables[i].MeasureType == 7) // Fase 1X, GAP
                                continue;

                            var subvariable = ej.DataManager(subVariables).update("Id", { Id: subVariables[i].Id, Units: unit, }, subVariables);
                            if (subvariable != null) {
                                $("#gridSubVariables").ejGrid("updateRecord", "Id", subvariable);
                            }
                        }
                        return;
                    } else {
                        var original = ej.DataManager(subVariables).executeLocal(ej.Query().where(
                            ej.Predicate("MeasureType", "notequal", 4, true)
                            .and("MeasureType", "notequal", 6, true)
                            .and("IsDefaultValue", "notequal", true, true)));

                        if (original.length == 1) {
                            original[0].Units = unit;
                            original[0].Maximum = integrate == false ? 50000 : 40,
                            original[0].Minimum = 0,
                            original = original[0];
                            $("#gridSubVariables").ejGrid("updateRecord", "Id", original);
                        }
                    }
                    break;
                case 3: // Velocímetro
                    if (unit == "mm/s") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: 1250, Minimum: 0 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 4 });
                    }
                    else if (unit == "In/s") {
                        updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit, Maximum: 50, Minimum: 0 }, subVariables);
                        $("#txtSensibility").ejNumericTextbox({ value: 100 });
                    }
                    break;
                default:
                    updateData = ej.DataManager(subVariables).update("IsDefaultValue", { IsDefaultValue: true, Units: unit }, subVariables);
                    break;
            }

            if (updateData != null)
                $("#gridSubVariables").ejGrid("updateRecord", "IsDefaultValue", updateData);

            var updateAmplitud = ej.DataManager(subVariables).update("MeasureType", { MeasureType: 4, Units: integrate == true ? "mm/s" : unit, FromIntegratedWaveform: integrate == true ? 1 : 0 }, subVariables);
            if (updateAmplitud != null)
                $("#gridSubVariables").ejGrid("updateRecord", "MeasureType", updateAmplitud);

            var updateFase = ej.DataManager(subVariables).update("MeasureType", { MeasureType: 6, FromIntegratedWaveform: integrate == true ? 1 : 0 }, subVariables);
            if (updateFase != null)
                $("#gridSubVariables").ejGrid("updateRecord", "MeasureType", updateFase);
        }

        // Crea todos los controles necesarios para la gestión de un punto de medición.
        function CreateControlsPoints(data, parentId) {

            GetListReferenceAngular(parentId);

            $("#txtName").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: operation == "create" ? null : data.Name,
                change: function (args) {
                    if (operation == "create")
                        $("#txtDescription").val(args.value);
                }
            });

            $("#txtDescription").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: operation == "create" ? null : data.Description
            });

            $("#ddlSensorType").ejDropDownList({
                dataSource: sensorTypes,
                fields: { text: "Name", value: "Code" },
                value: operation == "create" ? 0 : data.SensorTypeCode,
                width: "100%",
                enabled: operation == "create" ? true : false,
                change: function (args) {
                    if (_createdControls) {

                        if (operation == "create") {
                            $("#ddlAngularReference").data("ejDropDownList").selectItemByValue("0");
                            $("#chbIntegrate").ejCheckBox({ checked: false });
                            $("#divUnit").show();
                            $("#divSaveWaveform").show();

                            _directa.Units = "";
                            _directa.FromIntegratedWaveform = 0;
                            _directa.Maximum = 1;
                            $("#txtUnit").ejMaskEdit({ value: null });
                            $("#lblSensibility").text("Sensibilidad [mV/Unidad]");
                            var _instance = $("#gridSubVariables").ejGrid("instance");
                        }
                        $("#gridSubVariables").ejGrid("hideColumns", "Fuente");
                        $("#voltageOrCurrentFields").addClass('hidden');
                        $("#sensorCustomFields").addClass('hidden');
                        $("#magneticFlowFields").addClass('hidden');
                        $("#notRefenceAngularFields").show();
                        $("#rtdFields").addClass('hidden');
                        $("#refenceAngularFields").hide();
                        $("#divSensibility").hide();
                        $("#divCheckbox").hide();
                        $("#divPositionCero").addClass('hidden');
                        $('#ddlUnits').ejDropDownList("enable");
                        $("#txtUnit").parent().parent().addClass("hidden");

                        $("#divOrientation").show();
                        $("#divSensorAngle").show();
                        $("#gridSubVariables").ejGrid("showColumns", ["Cálculo"]);

                        if (args.selectedValue == "1") { //Proximidad
                            $("#divSensibility").show();

                            if (operation == "create") {
                                $("#divSaveWaveform").hide();
                                clearGrid(_instance.model.dataSource);
                                _directa.Maximum = 1000;
                                _directa.MeasureType = 2;
                                _instance.model.dataSource.push(_directa, _gap);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "2") { //Acelerometro
                            $("#divSensibility").show();

                            if (operation == "create") {
                                $("#divSaveWaveform").hide();
                                $("#divCheckbox").show();
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 1;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                            else {
                                if (data.Integrate != null)
                                    $("#divCheckbox").show();
                            }
                        }
                        else if (args.selectedValue == "3") { //Velocimetro
                            $("#divSensibility").show();

                            if (operation == "create") {
                                $("#divSaveWaveform").hide();
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 3;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "4") { // Referencia Angular
                            $("#divSensibility").show();
                            $("#notRefenceAngularFields").hide();
                            $("#refenceAngularFields").show();

                            if (operation == "create") {
                                $("#divSaveWaveform").hide();
                                $("#divUnit").hide();
                                clearGrid(_instance.model.dataSource);
                                _directa.Units = "RPM";
                                _directa.MeasureType = 9;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "5") { //RTD
                            $("#rtdFields").removeClass('hidden');
                            $("#notRefenceAngularFields").hide();

                            if (operation == "edit") {
                                if (!_isCreatedFieldsRTD) {
                                    _createFieldsRTD(3, 0.00385, 100, 1);
                                }
                                $("#divSensibility").hide();
                            }
                            else {
                                _createFieldsRTD(3, 0.00385, 100, 1);
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 8;
                                _directa.Units = $("#txtUnit").val();
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "6") { //Voltaje
                            $("#voltageOrCurrentFields").removeClass('hidden');
                            $("#lblEntryMax").text("Vmáx [V]:");
                            $("#lblEntryMin").text("Vmín [V]:");

                            if (operation == "edit") {
                                if (!_isCreatedFieldsVolOrCur) {
                                    _createFieldsVoltageOrCurrent(5, 0, null, null);
                                }
                                $("#divSensibility").hide();
                            }
                            else {
                                _createFieldsVoltageOrCurrent(5, 0, null, null);
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 2;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "7") { //Corriente
                            $("#voltageOrCurrentFields").removeClass('hidden');
                            $("#lblEntryMax").text("Imáx [mA]:");
                            $("#lblEntryMin").text("Imín [mA]:");

                            if (operation == "edit") {
                                if (!_isCreatedFieldsVolOrCur) {
                                    _createFieldsVoltageOrCurrent(20, 4, null, null);
                                }
                                $("#divSensibility").hide();
                            }
                            else {
                                _createFieldsVoltageOrCurrent(20, 4, null, null);
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 3;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "8") { //Personalizado
                            $("#sensorCustomFields").removeClass('hidden');
                            if (operation == "edit") {
                                $("#divSensibility").hide();
                            }
                            else {
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 2;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "9") { // Desplazamiento axial
                            $("#divSensibility").show();
                            $("#divPositionCero").removeClass('hidden');
                            $("#notRefenceAngularFields").hide();

                            if (operation == "create") {
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 10;
                                _instance.model.dataSource.push(_directa, _gap);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "10") { // Flujo magnético
                            $("#magneticFlowFields").removeClass('hidden');
                            $("#voltageOrCurrentFields").removeClass('hidden');
                            $("#lblEntryMax").text("Imáx [mA]:");
                            $("#lblEntryMin").text("Imín [mA]:");

                            if (operation == "edit") {
                                $("#divSensibility").hide();
                                if (!_isCreatedFieldsMagneticFlow)
                                    _createFieldsMagneticFlow(1, 0, 2);

                                if (!_isCreatedFieldsVolOrCur)
                                    _createFieldsVoltageOrCurrent(20, 0, 2, -2);
                            }
                            else {
                                _createFieldsVoltageOrCurrent(20, 0, 2, -2);
                                _createFieldsMagneticFlow(1, 0, 2);
                                clearGrid(_instance.model.dataSource);
                                _directa.MeasureType = 2;
                                _instance.model.dataSource.push(_directa);
                                $("#gridSubVariables").ejGrid("dataSource", _instance.model.dataSource);
                            }
                        }
                        else if (args.selectedValue == "11") { // RDS
                            $("#divUnit").hide();
                            $("#divOrientation").hide();
                            $("#divSensorAngle").hide();
                            $("#divSaveWaveform").hide();
                            $("#notRefenceAngularFields").hide();
                            if (operation == "create") {
                                $("#gridSubVariables").ejGrid("dataSource", []);
                                $("#gridSubVariables").ejGrid("dataSource", [
                                    new SubVariables(_idSubVariable++).Resistencia, new SubVariables(_idSubVariable++).Inductancia, new SubVariables(_idSubVariable++).Capacitancia,
                                    new SubVariables(_idSubVariable++).VoltajeCampo, new SubVariables(_idSubVariable++).CorrienteCampo, 
                                    new SubVariables(_idSubVariable++).DCFugasTierra, new SubVariables(_idSubVariable++).AmpFugasTierra]);
                            }
                            $("#gridSubVariables").ejGrid("hideColumns", ["Cálculo"]);
                        }

                        $("#ddlUnits").ejDropDownList({
                            dataSource: ej.DataManager(sensorTypes).executeLocal(ej.Query().where("Code", "equal", args.selectedValue, false))[0].Units,
                        });

                        autoHeightEjDialog("#formMdVariable", _heightWindow);
                    } // end _createdControls
                },
                create: function (args) {
                    if (operation == "edit") {
                        var sensorType = args.model.value;
                        if (sensorType == "2" && sensorType != null) { //Acelerometro
                            $("#divCheckbox").show();
                        }
                    }
                },
            });

            $("#txtUnit").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: operation == "edit" ? data.Units : null,
                cssClass: "hidden",
                focusOut: function (args) {
                    if (args.value) {
                        $("#lblVarMax").text("Xmáx [" + args.value + "]:");
                        $("#lblVarMin").text("Xmín [" + args.value + "]:");
                        $("#lblSensibility").text("Sensibilidad [mV/" + args.value + "]");

                        if (operation == "edit")
                            ChangeSensibilityAndRangesByUnit(0, args.value, $("#chbIntegrate").ejCheckBox("isChecked"));
                        else
                            ChangeSensibilityAndRangesByUnit("", args.value, false);
                    }
                },
            });

            var dsUnits, _value, st = $("#ddlSensorType").ejDropDownList("getSelectedValue");

            if (operation == "edit") {
                dsUnits = ej.DataManager(sensorTypes).executeLocal(ej.Query().where("Code", "equal", data.SensorTypeCode, false))[0].Units;
                _value = data.Units;

                var exist = ej.DataManager(dsUnits).executeLocal(ej.Query().where("Code", "equal", _value, false)).length;
                if (exist == 0) {
                    $("#txtUnit").parent().parent().removeClass("hidden");
                    _value = "0"; // Selecciona el item "Otro"
                }
            }

            $("#ddlUnits").ejDropDownList({
                dataSource: operation == "edit" ? dsUnits : [],
                fields: { text: "Name", value: "Code" },
                value: operation == "edit" ? _value : null,
                width: "100%",
                enabled: operation == "edit" ? (data.Integrate == true ? false : true) : false,
                change: function (args) {
                    var integrate = $("#chbIntegrate").ejCheckBox("isChecked");

                    if (args.selectedValue != "0") {
                        $("#txtUnit").val(args.selectedValue);
                        $("#txtUnit").parent().parent().addClass("hidden");
                        $("#lblVarMax").text("Xmáx [" + args.value + "]:");
                        $("#lblVarMin").text("Xmín [" + args.value + "]:");
                        $("#lblSensibility").text("Sensibilidad [mV/" + args.value + "]");

                        ChangeSensibilityAndRangesByUnit($("#ddlSensorType").ejDropDownList("getSelectedValue"), args.selectedValue, integrate);
                    }
                    else {
                        $("#txtUnit").val("");
                        $("#txtUnit").parent().parent().removeClass("hidden");
                        ChangeSensibilityAndRangesByUnit(0, "", false);
                        setCellValue("Units", "", "o");
                    }
                },
            });

            $("#ddlRotationDirection").ejDropDownList({
                dataSource: ej.DataManager(_rotationDirection),
                fields: { text: "Name", value: "Code" },
                value: operation == "edit" ? data.RotationDirection : 1,
                width: "100%",
            });

            $("#chbIntegrate").ejCheckBox({
                size: "medium",
                checked: operation == "edit" ? (data.Integrate ? true : false) : false,
                change: function (args) {
                    if (operation == "edit") {
                        var data = $("#gridSubVariables").data("ejGrid").model.dataSource;
                        var unit = $("#txtUnit").val();
                        var kph = $("#ddlAngularReference").ejDropDownList("getSelectedValue");
                        if (args.isChecked) {
                            $("#gridSubVariables").ejGrid("showColumns", "Fuente");
                            updateFieldsGridSubVariables(true, "mm/s");
                            var exist = ej.DataManager(data).executeLocal(ej.Query().where("FromIntegratedWaveform", "equal", 0, false));
                            if (exist.length == 0) {
                                _original.ParentId = selectedMeasurementPoint.Id;
                                _original.Units = unit;
                                $("#gridSubVariables").data("ejGrid").addRecord(_original);
                            }
                            else {
                                var tr = validateVisibilityRows(data, kph, true, []);

                                for (var i = 0; i < tr.length; i++) {
                                    if (tr[i].action == "removeClass")
                                        $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children("tr:eq('" + tr[i].index + "')").removeClass("hidden");
                                    else
                                        $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children("tr:eq('" + tr[i].index + "')").addClass("hidden");
                                }
                            }

                            $('#ddlUnits').ejDropDownList("selectItemByValue", "mg");
                            $('#ddlUnits').ejDropDownList("disable");
                        }
                        else {
                            $("#gridSubVariables").ejGrid("hideColumns", "Fuente");
                            updateFieldsGridSubVariables(false, unit);

                            for (var i = 0; i < data.length; i++) {
                                if (data[i].MeasureType != 6) {
                                    var updateData = ej.DataManager(data).update("Id", { Id: data[i].Id, Units: $("#ddlUnits").ejDropDownList("getSelectedValue"), }, data);
                                    if (updateData != null) {
                                        $("#gridSubVariables").ejGrid("updateRecord", "Id", updateData);
                                    }
                                }
                            }

                            var tr = validateVisibilityRows(data, kph, false, []);
                            for (var i = 0; i < tr.length; i++) {
                                if (tr[i].action == "removeClass")
                                    $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children("tr:eq('" + tr[i].index + "')").removeClass("hidden");
                                else
                                    $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children("tr:eq('" + tr[i].index + "')").addClass("hidden");
                            }

                            $('#ddlUnits').ejDropDownList("enable");
                        }
                    }
                    else {
                        var sensorType = $('#ddlSensorType').ejDropDownList("getSelectedValue");
                        if (sensorType == "2") {
                            if (args.isChecked) {
                                $("#gridSubVariables").ejGrid("showColumns", "Fuente");
                                $("#gridSubVariables").ejGrid("addRecord", _original);
                                $('#ddlUnits').ejDropDownList("selectItemByValue", "mg");
                                $('#ddlUnits').ejDropDownList("disable");
                            } else {
                                $("#gridSubVariables").ejGrid("hideColumns", "Fuente");
                                $("#gridSubVariables").ejGrid("deleteRecord", "Id", { Id: _original.Id });
                                $('#ddlUnits').ejDropDownList("enable");
                            }
                        }
                        ChangeSensibilityAndRangesByUnit(sensorType, $("#ddlUnits").ejDropDownList("getSelectedValue"), args.isChecked);
                    }
                },
            });

            $("#chbWaveform").ejCheckBox({
                size: "medium",
                checked: true,
            });

            $("#txtSensorAngle").ejNumericTextbox({
                width: "100%",
                value: operation == "edit" ? data.SensorAngle : 0,
                decimalPlaces: 1,
            });

            $("#txtSensibility").ejNumericTextbox({
                width: "100%",
                value: operation == "edit" ? (data.Sensibility != null ? data.Sensibility : 1) : 1,
                decimalPlaces: 5,
                minValue: 0,
            });

            $("#txtMinimumNoiseInVolts").ejNumericTextbox({
                width: "100%",
                value: operation == "edit" ? (data.AngularReferenceConfig != null ? data.AngularReferenceConfig.MinimumNoiseInVolts : 0) : 1,
                decimalPlaces: 2,
            });

            $("#txtTresholdPercentage").ejPercentageTextbox({
                width: "100%",
                value: operation == "edit" ? (data.AngularReferenceConfig != null ? data.AngularReferenceConfig.TresholdPercentage : 0) : 0.6,
                decimalPlaces: 2,
            });

            $("#txtHysteresisTresholdPercentage").ejPercentageTextbox({
                width: "100%",
                value: operation == "edit" ? (data.AngularReferenceConfig != null ? data.AngularReferenceConfig.HysteresisTresholdPercentage : 0) : 0.4,
                decimalPlaces: 2,
            });

            $("#ddlAngularReference").ejDropDownList({
                dataSource: _listRefAngular,
                fields: { text: "Name", value: "Id" },
                value: operation == "edit" ? (data.AngularReferenceId != null ? data.AngularReferenceId : "0") : "0",
                width: "100%",
                change: function (args) {
                    if (operation == "edit") {
                        var data = $("#gridSubVariables").data("ejGrid").model.dataSource;
                        if (args.value != "0") {
                            var exist = ej.DataManager(data).executeLocal(ej.Query().where(ej.Predicate("MeasureType", "equal", 4, true).or("MeasureType", "equal", 6, true)));
                            if (exist.length == 0) {
                                var integrate = $("#chbIntegrate").ejCheckBox("isChecked");
                                if (integrate) {
                                    _amplitud1x.ParentId = selectedMeasurementPoint.Id;
                                    _amplitud1x.Units = "mm/s";
                                    _amplitud1x.FromIntegratedWaveform = 1;
                                    _fase1x.ParentId = selectedMeasurementPoint.Id;
                                    _fase1x.FromIntegratedWaveform = 1;
                                } else {
                                    _amplitud1x.ParentId = selectedMeasurementPoint.Id;
                                    _amplitud1x.Units = $("#txtUnit").val();
                                    _amplitud1x.FromIntegratedWaveform = 0;
                                    _fase1x.ParentId = selectedMeasurementPoint.Id;
                                    _fase1x.FromIntegratedWaveform = 0;
                                }
                                data.push(_amplitud1x, _fase1x);
                                $("#gridSubVariables").ejGrid("dataSource", data);
                            }
                            else {
                                $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children('tr').each(function () {
                                    if (data[this.rowIndex].MeasureType == 4 || data[this.rowIndex].MeasureType == 6)
                                        $(this).removeClass("hidden");
                                });
                            }
                        }
                        else {
                            $("#gridSubVariables > .e-gridcontent > div > .e-table > tbody").children('tr').each(function () {
                                if (data[this.rowIndex].MeasureType == 4 || data[this.rowIndex].MeasureType == 6)
                                    $(this).addClass("hidden");
                            });
                        }
                    }
                    else {
                        var _instance = $("#gridSubVariables").ejGrid("instance").model.currentViewData;
                        var sensorType = $('#ddlSensorType').ejDropDownList("getSelectedValue");
                        var integrate = $("#chbIntegrate").ejCheckBox("isChecked");
                        var unit = $("#txtUnit").val();
                        if (args.value != "0") {
                            if (sensorType == "1" || sensorType == "2" || sensorType == "3") {
                                var exist = ej.DataManager(_instance).executeLocal(ej.Query().where(
                                ej.Predicate("MeasureType", "equal", 4, true).or("MeasureType", "equal", 6, true)));

                                if (exist.length == 0) {
                                    $("#gridSubVariables").ejGrid("addRecord", _amplitud1x);
                                    $("#gridSubVariables").ejGrid("addRecord", _fase1x);
                                }
                            }
                            ChangeSensibilityAndRangesByUnit(sensorType, unit, integrate);
                        }
                        else {
                            $("#gridSubVariables").ejGrid("deleteRecord", "Id", { Id: _amplitud1x.Id });
                            $("#gridSubVariables").ejGrid("deleteRecord", "Id", { Id: _fase1x.Id });
                            ChangeSensibilityAndRangesByUnit(sensorType, unit, integrate);
                        }
                    }
                }
            });

            $("#txtRefAngularM").ejNumericTextbox({
                width: "100%",
                value: operation == "edit" ? (data.AiMeasureMethod != null ? data.AiMeasureMethod.M : 1) : 1,
                decimalPlaces: 2,
            });

            $("#txtRefAngularB").ejNumericTextbox({
                width: "100%",
                value: operation == "edit" ? (data.AiMeasureMethod != null ? data.AiMeasureMethod.B : 0) : 0,
                decimalPlaces: 2,
            });

            var _subVariables;
            if (operation == "edit") {
                _subVariables = ej.DataManager(mainCache.loadedMeasurementPoints).executeLocal(new ej.Query().where("Id", "equal", data.Id, false))[0].SubVariables;
                _subVariables = ej.DataManager(_subVariables).executeLocal(new ej.Query().where("IsDefaultValue", "equal", true, false));

                if (_subVariables.length == 0)
                    _subVariables = null;
            }

            $("#txtPositionCero").ejNumericTextbox({
                width: "100%",
                value: operation == "edit" ? (_subVariables[0].InitialAxialPosition != 0 ? _subVariables[0].InitialAxialPosition : 10) : 10,
                decimalPlaces: 2,
                focusOut: function (args) {
                    // Cambia el valor de la propiedad InitialAxialPosition de la subvariable "Directa"
                    var sensorType = $('#ddlSensorType').ejDropDownList("getSelectedValue");
                    if (sensorType == 9)
                        ej.DataManager(
                            $("#gridSubVariables").data("ejGrid").model.dataSource).update("IsDefaultValue",
                            { IsDefaultValue: true, InitialAxialPosition: args.value },
                            $("#gridSubVariables").data("ejGrid").model.dataSource);
                    else
                        ej.DataManager(
                            $("#gridSubVariables").data("ejGrid").model.dataSource).update("IsDefaultValue",
                            { IsDefaultValue: true, InitialAxialPosition: 0 },
                            $("#gridSubVariables").data("ejGrid").model.dataSource);
                }
            });

            $("#ddlOrientation").ejDropDownList({
                dataSource: ej.DataManager(_orientation),
                fields: { text: "Name", value: "Code" },
                value: operation == "edit" ? (data.Orientation != 0 ? data.Orientation : "1") : "1",
                width: "100%",
            });

            if (operation == "edit") {
                $("#divUnit").show();
                $("#divOrientation").show();
                $("#divSensorAngle").show();
                $("#divSaveWaveform").show();
                $("#notRefenceAngularFields").show();
                $("#refenceAngularFields").hide();

                //if (data.SensorTypeCode in sensorTypeNumeric)
                if (sensorTypeNumeric.includes(data.SensorTypeCode))
                    $("#divSensibility").show();
                else
                    $("#divSensibility").hide();

                if (data.SensorTypeCode == "4") { // RA
                    $("#divUnit").hide();
                    $("#notRefenceAngularFields").hide();
                    $("#refenceAngularFields").show();
                }
                else if (data.SensorTypeCode == "5") { // RTD
                    $("#rtdFields").removeClass('hidden');
                    $("#notRefenceAngularFields").hide();
                    if (data.RtdParams != null)
                        _createFieldsRTD(data.RtdParams.MaterialType, data.RtdParams.Coefficient, data.RtdParams.Ro, data.RtdParams.Iex);
                    else
                        _createFieldsRTD(3, 0.00385, 100, 1);
                } else if (data.SensorTypeCode == "6") { // Voltaje
                    $("#voltageOrCurrentFields").removeClass('hidden');
                    $("#lblEntryMax").text("Vmáx [V]:");
                    $("#lblEntryMin").text("Vmín [V]:");
                    if (data.VoltageParams != null)
                        _createFieldsVoltageOrCurrent(data.VoltageParams.Vmax, data.VoltageParams.Vmin, data.VoltageParams.Xmax, data.VoltageParams.Xmin)
                    else
                        _createFieldsVoltageOrCurrent(5, 0, null, null);
                } else if (data.SensorTypeCode == "7") { // Corrriente
                    $("#voltageOrCurrentFields").removeClass('hidden');
                    $("#lblEntryMax").text("Imáx [mA]:");
                    $("#lblEntryMin").text("Imín [mA]:");
                    if (data.CurrentParams != null)
                        _createFieldsVoltageOrCurrent(data.CurrentParams.Imax, data.CurrentParams.Imin, data.CurrentParams.Xmax, data.CurrentParams.Xmin)
                    else
                        _createFieldsVoltageOrCurrent(20, 4, null, null);
                } else if (data.SensorTypeCode == "8") { // Personalizado
                    $("#sensorCustomFields").removeClass('hidden');
                } else if (data.SensorTypeCode == "9") { // Desplazamiento axial
                    $("#divPositionCero").removeClass('hidden');
                    $("#notRefenceAngularFields").hide();
                } else if (data.SensorTypeCode == "10") { // Flujo magnético
                    $("#magneticFlowFields").removeClass('hidden');
                    if (data.MagneticFlowParams != null) {
                        _createFieldsMagneticFlow(data.MagneticFlowParams.PolesCount, data.MagneticFlowParams.Pole1Angle, data.MagneticFlowParams.PolarGraphRange);
                        _createFieldsVoltageOrCurrent(data.MagneticFlowParams.Imax, data.MagneticFlowParams.Imin, data.MagneticFlowParams.Xmax, data.MagneticFlowParams.Xmin);
                    } else {
                        _createFieldsMagneticFlow(1, 0, 2);
                        _createFieldsVoltageOrCurrent(20, 0, 2, -2);
                    }

                    $("#voltageOrCurrentFields").removeClass('hidden');
                    $("#lblEntryMax").text("Imáx [mA]:");
                    $("#lblEntryMin").text("Imín [mA]:");
                } else if (data.SensorTypeCode == "11") { // RDS
                    $("#divUnit").hide();
                    $("#divOrientation").hide();
                    $("#divSensorAngle").hide();
                    $("#divSaveWaveform").hide();
                    $("#notRefenceAngularFields").hide();
                }
            }
        }
    };

    return MeasurementPointAdmin;
})();