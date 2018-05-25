var UserPreferencesAdmin = {};

UserPreferencesAdmin = (function () {
    "use strict";
    /*Variables Globales
        xCoordinateUnits, windowing */

    /* Constructor */
    UserPreferencesAdmin = function () {
        // Declarar propiedades privadas;
        var
            // Auto-referencia a la clase MeasurementPointAdmin
            _this,
            // Tipos de medida
            _measures,
            // Tipos de medidas en velocidad de giro
            _turningVelocityUnits,
            // Tipos de unidades que se manejan en cada uno de ellos
            _displacement, _velocity, _acceleration,
            _nColumn,
            _defaultCursor, _rangesHz, _rangesCpm, _xScaleOptions,
            // EjDialog de administración de preferencias de usuario
            _openDiaologUserPreferences;

        _this = this;
        _nColumn = 1;
        _measures = new MeasuresSystem().Measures;
        _turningVelocityUnits = new MeasuresSystem().TurningVelocityUnits;
        _displacement = new MeasuresSystem().Displacement;
        _velocity = new MeasuresSystem().Velocity;
        _acceleration = new MeasuresSystem().Acceleration;
        _xScaleOptions = new MeasuresSystem().XscaleOptions;
        _rangesHz = new MeasuresSystem().RangesHz;
        _rangesCpm = new MeasuresSystem().RangesCpm;
        _defaultCursor = new MeasuresSystem().DefaultCursor;

        this.Open = function () {
            _openDiaologUserPreferences("PREFERENCIAS", null);
        };

        _openDiaologUserPreferences = function (_title, _location) {
            $("#dialogUserPreferences").ejDialog({
                title: _title,
                showOnInit: false,
                actionButtons: ["close"],
                enableAnimation: true,
                //minHeight: "25%",
                width: "60%",
                height: "70%",
                minWidth: "60%",
                minHeight: "70%",
                maxHeight: _heightWindow,
                maxWidth: _widthWindow,
                scrollSettings: { height: "71%" },
                allowScrolling: true,
                allowDraggable: true,
                enableResize: true,
                zIndex: 11000,
                enableModal: true,
                isResponsive: true,
                showRoundedCorner: true,
                animation: { show: { effect: "slide", duration: 500 }, hide: { effect: "fade", duration: 500 } },
                open: function (args) {
                    autoHeightEjDialog("#dialogUserPreferences", _heightWindow);
                    $(".e-resize-handle").removeClass("e-js");
                },
                beforeOpen: function (args) {
                    createControls();
                },
                close: function (args) {
                    $("#btnSavePreferences").off("click"); // Necesario desasociar el evento
                    // PROFILE CONTROLS
                    $("#txt_userName").ejMaskEdit("destroy");
                    $("#txt_userEmail").ejMaskEdit("destroy");
                    $("#txt_userPass").ejMaskEdit("destroy");
                    $("#txtCompany").ejMaskEdit("destroy");
                    $("#txt_userOccupation").ejMaskEdit("destroy");
                    $("#txt_userPhoneNumbre").ejMaskEdit("destroy");
                    $("#txt_userCellPhone").ejMaskEdit("destroy");
                    // UNITS CONTROLS
                    $("#txtUMeasure").ejDropDownList("destroy");
                    $("#txtUTurningVelocity").ejDropDownList("destroy");
                    $("#txtUFrequency").ejDropDownList("destroy");
                    $("#txtUDisplacement").ejDropDownList("destroy");
                    $("#txtUVelocity").ejDropDownList("destroy");
                    $("#txtUAcceleration").ejDropDownList("destroy");
                    // GRAPHS CONTROLS
                    $("#txtGDisplacementX").ejDropDownList("destroy");
                    $("#txtGVelocityX").ejDropDownList("destroy");
                    $("#txtGAccelerationX").ejDropDownList("destroy");
                    $("#txtGWindowing").ejDropDownList("destroy");
                    $("#txtGCursorDefualt").ejDropDownList("destroy");
                    $("#txtGNumberHarmonic").ejNumericTextbox("destroy");
                    $("#txtOtherDisplacementX").ejNumericTextbox("destroy");
                    $("#txtOtherVelocityX").ejNumericTextbox("destroy");
                    $("#txtOtherAccelerationX").ejNumericTextbox("destroy");

                    $("#dialogUserPreferences").addClass('hidden');
                },//Fin close
            });

            $("#dialogUserPreferences").ejDialog("open");
            $("#dialogUserPreferences").removeClass('hidden');
        }

        // Crea los controles necesarios para el formulario de activos
        function createControls() {
            var user = mainCache.userPreferences.User;
            var userConfig = mainCache.userPreferences.UserConfiguration;

            if (userConfig.Graphs) {
                if (userConfig.Graphs.Acceleration) {
                    if (userConfig.Graphs.Acceleration.XScaleOption == 5)
                        $("#AccX").removeClass("hidden");
                }
                if (userConfig.Graphs.Displacement) {
                    if (userConfig.Graphs.Displacement.XScaleOption == 5)
                        $("#DisX").removeClass("hidden");
                }
                if (userConfig.Graphs.Velocity) {
                    if (userConfig.Graphs.Velocity.XScaleOption == 5)
                        $("#VelX").removeClass("hidden");
                }
            } else {
                userConfig.Graphs = {
                    Displacement: { XScaleOption: 0, Auto: true, },
                    Velocity: { XScaleOption: 0, Auto: true, },
                    Acceleration: { XScaleOption: 0, Auto: true, },
                    Windowing: 0,
                    CursorDefualt: "Normal",
                    NumberHarmonic: 5
                };
            }

            if (userConfig.MeasuresUnits == null) {
                userConfig.MeasuresUnits = {
                    MeasuresSystem: 1,
                    TurningVelocity: 4,
                    Frequency: 0,
                    Displacement: "um",
                    Velocity: "mm/s",
                    Acceleration: "g"
                };
            }

            if (userConfig.WorkSpace == null) {
                userConfig.WorkSpace = { ColumnsNumber: 1 };
            }

           // var fr = (userConfig.MeasuresUnits.Frequency == null) ? 0 : userConfig.MeasuresUnits.Frequency;
            var ranges = loadXscaleOptions(userConfig.MeasuresUnits.Frequency);

            var nColumn = mainCache.userPreferences.UserConfiguration.WorkSpace.ColumnsNumber;
            $("#infoWorkSpace").find("img[data-img='" + nColumn + "']").addClass("addBorder");

            // ::::: Controles de información de usuario :::::
            $("#txt_userName").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: user.FullName,
                //validationRules: { required: true },
                //validationMessage: { required: "*" }
            });

            $("#txt_userEmail").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: user.UserName,
            });

            $("#txt_userPass").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Password,
                //value: ,
            });

            $("#txtCompany").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: user.Company,
            });

            $("#txt_userOccupation").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: user.Occupation,
            });

            $("#txt_userPhoneNumbre").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: user.PhoneNumber,
            });

            $("#txt_userCellPhone").ejMaskEdit({
                width: "100%",
                inputMode: ej.InputMode.Text,
                value: user.CellPhoneNumber,
            });

            // ::::: Controles de información de espectros
            $("#txtGDisplacementX").ejDropDownList({
                width: "100%",
                dataSource: ranges,
                fields: { text: "Text", value: "Value" },
                value: userConfig.Graphs.Displacement.XScaleOption,
                change: function (args) {
                    if (args.value == 5) {
                        $("td#DisX").removeClass("hidden");
                    } else {
                        $("td#DisX").addClass("hidden");
                    }
                }
            });


            $("#txtGVelocityX").ejDropDownList({
                width: "100%",
                dataSource: ranges,
                fields: { text: "Text", value: "Value" },
                value: userConfig.Graphs.Velocity.XScaleOption,
                change: function (args) {
                    if (args.value == 5) {
                        $("td#VelX").removeClass("hidden");
                    } else {
                        $("td#VelX").addClass("hidden");
                    }
                }
            });


            $("#txtGAccelerationX").ejDropDownList({
                width: "100%",
                dataSource: ranges,
                fields: { text: "Text", value: "Value" },
                value: userConfig.Graphs.Acceleration.XScaleOption,
                change: function (args) {
                    if (args.value == 5) {
                        $("td#AccX").removeClass("hidden");
                    } else {
                        $("td#AccX").addClass("hidden");
                    }
                }
            });

            $("#txtOtherDisplacementX").ejNumericTextbox({
                width: "100%",
                value: (userConfig.Graphs.Displacement.XScaleOption == 5) ? userConfig.Graphs.Displacement.XScaleValue : null,
                //decimalPlaces:,
                minValue: ranges[1].Text,
                maxValue: ranges[4].Text,
            });

            $("#txtOtherVelocityX").ejNumericTextbox({
                width: "100%",
                value: (userConfig.Graphs.Velocity.XScaleOption == 5) ? userConfig.Graphs.Velocity.XScaleValue : null,
                //decimalPlaces:,
                minValue: ranges[1].Text,
                maxValue: ranges[4].Text,
            });

            $("#txtOtherAccelerationX").ejNumericTextbox({
                width: "100%",
                value: (userConfig.Graphs.Acceleration.XScaleOption == 5) ? userConfig.Graphs.Acceleration.XScaleValue : null,
                //decimalPlaces:,
                minValue: ranges[1].Text,
                maxValue: ranges[4].Text,
            });

            $("#txtGWindowing").ejDropDownList({
                width: "100%",
                dataSource: Object.keys(windowing).map(function (key) {
                    return windowing[key];
                }),
                fields: { text: "Text", value: "Value" },
                value: userConfig.Graphs.Windowing,
            });

            $("#txtGCursorDefualt").ejDropDownList({
                width: "100%",
                dataSource: _defaultCursor,
                fields: { text: "Text", value: "Value" },
                value: userConfig.Graphs.CursorDefualt,
            });

            $("#txtGNumberHarmonic").ejNumericTextbox({
                width: "100%",
                value: userConfig.Graphs.NumberHarmonic,
                minValue: 0,
                maxValue: 10,
            });

            // ::::: Controles de información de unidades :::::
            $("#txtUMeasure").ejDropDownList({
                width: "100%",
                dataSource: _measures,
                fields: { text: "Text", value: "Value" },
                value: userConfig.MeasuresUnits.MeasuresSystem,
                change: function (args) {
                    var displacemnt = ej.DataManager(_displacement).executeLocal(ej.Query().where("MeasureId", "equal", args.value, false));
                    $("#txtUDisplacement").ejDropDownList({ dataSource: displacemnt });
                    var acceleration = ej.DataManager(_acceleration).executeLocal(ej.Query().where("MeasureId", "equal", args.value, false));
                    $("#txtUAcceleration").ejDropDownList({ dataSource: acceleration });
                    var velocity = ej.DataManager(_velocity).executeLocal(ej.Query().where("MeasureId", "equal", args.value, false));
                    $("#txtUVelocity").ejDropDownList({ dataSource: velocity });
                }
            });

            $("#txtUTurningVelocity").ejDropDownList({
                width: "100%",
                dataSource: _turningVelocityUnits,
                fields: { text: "Text", value: "Value" },
                value: userConfig.MeasuresUnits.TurningVelocity,
                change: function (args) {

                }
            });

            $("#txtUFrequency").ejDropDownList({
                width: "100%",
                dataSource: Object.keys(xCoordinateUnits).map(function (key) {
                    return xCoordinateUnits[key];
                }),
                fields: { text: "Text", value: "Value" },
                value: userConfig.MeasuresUnits.Frequency,
                change: function (args) {
                    var ranges = loadXscaleOptions(args.value);

                    $("#txtGDisplacementX").ejDropDownList({
                        dataSource: ranges, value:0, 
                    });
                    $("#txtGVelocityX").ejDropDownList({
                        dataSource: ranges, value: 0, 
                    });
                    $("#txtGAccelerationX").ejDropDownList({
                        dataSource: ranges, value: 0, 
                    });

                    $("#txtOtherDisplacementX").ejNumericTextbox({
                         minValue: ranges[1].Text, maxValue: ranges[4].Text
                    });

                    $("#txtOtherVelocityX").ejNumericTextbox({
                         minValue: ranges[1].Text, maxValue: ranges[4].Text
                    });

                    $("#txtOtherAccelerationX").ejNumericTextbox({
                        minValue: ranges[1].Text, maxValue: ranges[4].Text
                    });

                    $("#infoGraphs").find("input[data-xScaleValue]").each(function () {
                        $(this).closest('span.e-widget').removeClass("validate-field");
                    });
                }
            });

            $("#txtUDisplacement").ejDropDownList({
                width: "100%",
                dataSource: _displacement,
                fields: { text: "Text", value: "Value" },
                value: userConfig.MeasuresUnits.Displacement,
                change: function (args) {

                }
            });

            $("#txtUVelocity").ejDropDownList({
                width: "100%",
                dataSource: _velocity,
                fields: { text: "Text", value: "Value" },
                value: userConfig.MeasuresUnits.Velocity,
                change: function (args) {

                }
            });

            $("#txtUAcceleration").ejDropDownList({
                width: "100%",
                dataSource: _acceleration,
                fields: { text: "Text", value: "Value" },
                value: userConfig.MeasuresUnits.Acceleration,
                change: function (args) {

                }
            });

        }

        //Obtiene todos los valores de cada uno de los controles incluidos en el formulario de clonación y edicion de un activo
        function getValuesForm() {
            var control =
                {
                    UserConfiguration: {
                        UserId: mainCache.userPreferences.User.Id, //Admin
                        MeasuresUnits: {
                            MeasuresSystem: $("#txtUMeasure").ejDropDownList("getSelectedValue"),
                            TurningVelocity: $("#txtUTurningVelocity").ejDropDownList("getSelectedValue"),
                            Frequency: $("#txtUFrequency").ejDropDownList("getSelectedValue"),
                            Displacement: $("#txtUDisplacement").ejDropDownList("getSelectedValue"),
                            Velocity: $("#txtUVelocity").ejDropDownList("getSelectedValue"),
                            Acceleration: $("#txtUAcceleration").ejDropDownList("getSelectedValue"),
                        },
                        Graphs: {
                            Displacement: getValuesRange("txtGDisplacementX", "txtOtherDisplacementX"),
                            Velocity: getValuesRange("txtGVelocityX", "txtOtherVelocityX"),
                            Acceleration: getValuesRange("txtGAccelerationX", "txtOtherAccelerationX"),
                            Windowing: $("#txtGWindowing").ejDropDownList("getSelectedValue"),
                            CursorDefualt: $("#txtGCursorDefualt").ejDropDownList("getSelectedValue"),
                            NumberHarmonic: $("#txtGNumberHarmonic").ejNumericTextbox("getValue"),
                        },
                        WorkSpace: {
                            ColumnsNumber: _nColumn, //(_nColumn == null) ? $("#infoWorkSpace").find("img.addBorder").data('img') : _nColumn,
                        }
                    },
                    User: {
                        Id: mainCache.userPreferences.User.Id,
                        FullName: $("#txt_userName").ejMaskEdit("get_StrippedValue"),
                        UserName: $("#txt_userEmail").ejMaskEdit("get_StrippedValue"),
                        PasswordHash: $("#txt_userPass").ejMaskEdit("get_StrippedValue"),
                        Company: $("#txtCompany").ejMaskEdit("get_StrippedValue"),
                        Occupation: $("#txt_userOccupation").ejMaskEdit("get_StrippedValue"),
                        PhoneNumber: $("#txt_userPhoneNumbre").ejMaskEdit("get_StrippedValue"),
                        CellPhoneNumber: $("#txt_userCellPhone").ejMaskEdit("get_StrippedValue"),
                    }
                };
            return control;
        }

        function loadXscaleOptions(frecuency) {
            if ([0, 4].includes(frecuency)) { // CPM, RPM
                return _rangesCpm;
            } else {
                return _rangesHz
            }
        }

        function getValuesRange(ddlId, ntId) {
            var xScaleOption = $("#" + ddlId).ejDropDownList("getSelectedValue"),
                auto = false,
                xScaleValue = null,
                data, obj;

            if (xScaleOption == 0) {
                auto = true;
            } else if (xScaleOption == 5) {
                xScaleValue = $("#" + ntId).ejNumericTextbox("getValue");
            } else {
                data = $("#" + ddlId).ejDropDownList("getListData");
                xScaleValue = data[xScaleOption]["Text"];
            }

            obj = new Object({ XScaleOption: xScaleOption, Auto: auto, XScaleValue: xScaleValue });

            return obj;
        }

        function ValidateFields(element, value, save) {
            //var save = true;

            if (isEmpty(value)) {
                save = false;
                $(element).closest('span.e-widget').addClass("validate-field");
            }
            else
                $(element).closest('span.e-widget').removeClass("validate-field");

            return save;
        }

        $("#btnSavePreferences").click(function () {
            var data = getValuesForm(),
                _save = true,
                freq;

            $("#dialogUserPreferences").find("input[data-propertyname]").each(function () {
                var _value = $.trim($(this).val()),
                    _element,
                    propertyName = $(this).attr("data-propertyName");

                if (["Graphs.Displacement", "Graphs.Velocity", "Graphs.Acceleration"].includes(propertyName)) {
                    if (_value == 5) {  // Indica que la opcion es "Otro"
                        _element = $("#infoGraphs").find("input[data-xScaleValue='" + propertyName + "']");
                        _value = $(_element).val();

                        _save = ValidateFields(_element, _value, _save);
                        //if (isEmpty(_value)){
                        //    save = false;
                        //    $(_element).closest('span.e-widget').addClass("validate-field");
                        //}
                        //else
                        //    $(_element).closest('span.e-widget').removeClass("validate-field");
                    } else {
                        _save = ValidateFields(this, _value, _save);
                    }
                } else {
                    _save = ValidateFields(this, _value, _save);
                    //if (isEmpty(_value)){
                    //    save = false;
                    //    $(this).closest('span.e-widget').addClass("validate-field");
                    //}
                    //else
                    //    $(this).closest('span.e-widget').removeClass("validate-field");
                }
            });

            freq = data.UserConfiguration.MeasuresUnits.Frequency;
            if (_save) {
                ej.DataManager(mainCache.userPreferences.UserConfiguration).update("UserId", data.UserConfiguration, mainCache.userPreferences.UserConfiguration);
                ej.DataManager(mainCache.userPreferences.User).update("Id", data.User, mainCache.userPreferences.User);
                //$.ajax({
                //    url: "/Home/UpdateUserPreferences",
                //    data: JSON.stringify({ userPreferences: data }),
                //    contentType: "application/json; charset=utf-8",
                //    method: "POST",
                //    success: function (result) {
                //        mainCache.userPreferences.UserConfiguration.MeasuresUnits.Frequency = freq;
                //        mainCache.userPreferences.UserConfiguration.WorkSpace.ColumnsNumber = _nColumn;
                //        $("#dialogUserPreferences").ejDialog("close");
                //        popUp("success", "Se actualizó correctamente las preferencias de usuario!");
                //    },
                //    complete: function (result) {

                //    },
                //    error: function (jqXHR, textStatus) {
                //        popUp("error", "Ha ocurrido un error, intentelo de nuevo!")
                //    }
                //});
            } else
                popUp("warning", "Existen campos vacios. Por favor verifique!");

        });

        $("ul#listPreferences>li").click(function () {
            $(this).siblings().removeClass("liActive");
            $(this).addClass("liActive");
        })

        $("#infoWorkSpace img").click(function () {
            $("#infoWorkSpace").find("img").removeClass("addBorder");
            $(this).addClass("addBorder");
            _nColumn = $(this).data("img");
        });

        $(".typePreference").click(function (event) {
            event.preventDefault();
            var menuId = this.id;
            switch (menuId) {
                case "profile":
                    hideFrames("infoProfile", menuId);
                    break;
                case "workSpace":
                    hideFrames("infoWorkSpace", menuId);
                    break;
                case "units":
                    hideFrames("infoUnits", menuId);
                    break;
                case "graphs":
                    hideFrames("infoGraphs", menuId);
                    break;
            }
        });

        // Muestra el frame de la preferencia seleccionada y oculta los demás
        function hideFrames(idFrame, idLi) {

            $("#listPreferences").children('li').each(function () {
                if (this.id == idLi)
                    $(this).addClass('active');
                else
                    $(this).removeClass('active');
            });

            //$("div#" + id).removeClass("hidden");

            $("#framePreferences").children('div').each(function () {
                if (this.id == idFrame)
                    $(this).removeClass('hidden');
                else
                    $(this).addClass('hidden');
            });
        }
    };

    return UserPreferencesAdmin;
})();