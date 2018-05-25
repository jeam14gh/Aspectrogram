/*
 * widgetHelper.js
 * Helper para la administracion de los widget.
 * @author Jorge Calderon
 */

var WidgetHelper = (function ()
{
    var _sortableDivClass;
    var _resizableDivClass;
    var _draggableDivClass;

    /*
     Constructor.
     */
    var WidgetHelper = function ()
    {
        _sortableDivClass = ".sortable";
        _resizableDivClass = ".resizableDiv";
        _draggableDivClass = '';//".draggableDiv";

        // Lanzadores de eventos click sobre los modales de creacion de widgets
        $("#updateWidget").click(function () {
            WidgetHelper.Update();
        });

        $("#createWidgetContent").click(function () {
            WidgetHelper.CreateWidgetContent();
        });
    }

    WidgetHelper.GetDashboardPosition = function ()
    {
        var i, dashboardIndex, tabsArray = $("#dashboardTabs li");
        dashboardIndex = 0;
        for (i = 0; i < tabsArray.length; i++)
        {
            if ($(tabsArray[i]).hasClass("active"))
            {
                dashboardIndex = i + 1;
                break;
            }
        }
        return dashboardIndex;
    }

    WidgetHelper.GetWidgetPosition = function (tempWidgetId)
    {
        var i, widgetIndex, widgetsArray = $(".resizableDiv");
        widgetIndex = 0;
        for (i = 0; i < widgetsArray.length; i++) {
            if (widgetsArray[i].id == tempWidgetId)
            {
                widgetIndex = i + 1;
                break;
            }
        }
        return widgetIndex;
    }

    WidgetHelper.ToolbarOptions = function (divId)
    {
        switch (divId)
        {
            case "widgetLock":
                WidgetHelper.Lock();
                break;
            case "widgetSave":
                break;
            case "widgetAdd":
                WidgetHelper.Add();
                break;
            default:
                break;
        }
    }

    WidgetHelper.Lock = function ()
    {
        if ($("#widgetLock").hasClass("fa-lock"))
        {
            $("#widgetLock").removeClass("fa-lock").addClass("fa-unlock");
            $("#widgetAdd").attr("disabled", "disabled");
            $(".divUnlock").addClass("widgetLock").removeClass("divUnlock");
        }
        else
        {
            $("#widgetLock").removeClass("fa-unlock").addClass("fa-lock");
            $("#widgetAdd").removeAttr("disabled");
            $(".widgetLock").addClass("divUnlock").removeClass("widgetLock");
        }

        //if ($(_sortableDivClass).data("ui-sortable"))
        //{
        //    $(_sortableDivClass).sortable("destroy");
        //}
        //else
        //{
        //    $(_sortableDivClass).sortable();
        //}

        if ($(_draggableDivClass).data("ui-draggable"))
        {
            $(_draggableDivClass).draggable("destroy");
        }
        else
        {
            //$(_draggableDivClass).draggable();
        }

        // Widget list se obtiene de forma dinamica desde la base de datos.
        var _widgetList = $(_resizableDivClass);
        for (var i = 0; i < _widgetList.length; i++)
        {
            if ($(_widgetList[i]).data("ui-resizable"))
            {
                $(_widgetList[i]).resizable("destroy");
            }
            else
            {
                $(_widgetList[i]).resizable();
            }
        }
    }

    WidgetHelper.Save = function ()
    {

    }

    WidgetHelper.Add = function ()
    {
        //$("#WidgetName").val("");
        //$("#widgetNameValidation").addClass("hidden");
        var tempId, newWidget;
        tempId = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 12);
        newWidget = '<div class="draggableDiv" minHeight=50 minWidth=50 id="' + tempId + '" ';
        newWidget += 'style="width:25%;height:30%;border: 1px darkblue dotted;" aspectRatio=false>';
        newWidget += '<a><span class="deleteWidget widgetToolbar glyphicon glyphicon-trash"></span></a>';
        newWidget += '<a><span class="editWidget widgetToolbar glyphicon glyphicon-pencil"></span></a>';
        newWidget += '<button onclick="widgetHelper.AddContent(\'' + tempId + '\');" class="btn btn-success" style="margin-left:10px;">Agregar contenido <span class="glyphicon glyphicon-cog"></span></button></div>';
        $(".sortable").append(newWidget);
        $(".deleteWidget").click(function () {
            this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
            return false;
        });
        $(".editWidget").click(function () {
            $("#MinimumHeight").val(this.parentNode.parentNode.attributes["minHeight"].value);
            $("#MinimumWidth").val(this.parentNode.parentNode.attributes["minWidth"].value);
            $("#WidthPercentage").val(this.parentNode.parentNode.style["width"].slice(0, -1));
            $("#HeightPercentage").val(this.parentNode.parentNode.style["height"].slice(0, -1));
            $("#AspectRatio").prop("checked", (this.parentNode.parentNode.attributes["aspectRatio"].value == "true"));
            $("#InputWidgetId").val(this.parentNode.parentNode.id);
            $("#addWidgetModal").modal('show');
            return false;
        });
        $("#widgetAdd").attr("disabled", "disabled");
        //$("#addWidgetModal").modal('show');
        //$('#addWidgetModal').on('shown.bs.modal', function () {
        //    $('#WidgetName').focus();
        //});
    }

    WidgetHelper.IsValidForm = function ()
    {
        var widthPercentage = $("#WidthPercentage").val(),
        heightPercentage = $("#HeightPercentage").val(),
        minimumWidth = $("#MinimumWidth").val(),
        minimumHeight = $("#MinimumHeight").val(),
        validation = false;
        if (widthPercentage != null && widthPercentage != "")
        {
            validation = true;
        }
        if (heightPercentage != null && heightPercentage != "")
        {
            validation = true;
        }
        return validation;
    }

    WidgetHelper.Update = function ()
    {
        var widthPercentage, heightPercentage, minimumWidth, minimumHeight, aspectRatio, inputWidgetId;

        if (WidgetHelper.IsValidForm())
        {
            widthPercentage = $("#WidthPercentage").val();
            heightPercentage = $("#HeightPercentage").val();
            minimumWidth = $("#MinimumWidth").val();
            minimumHeight = $("#MinimumHeight").val();
            aspectRatio = $("#AspectRatio")[0].checked;
            
            inputWidgetId = $("#InputWidgetId").val();
            $("#" + inputWidgetId)[0].style["width"] = widthPercentage + "%";
            $("#" + inputWidgetId)[0].style["height"] = heightPercentage + "%";
            $("#" + inputWidgetId).attr("minWidth", minimumWidth);
            $("#" + inputWidgetId).attr("minHeight", minimumHeight);
            $("#" + inputWidgetId).attr("aspectRatio", aspectRatio);

            $('#addWidgetModal').modal('toggle');
        }
    }

    WidgetHelper.AddContent = function (widgetId)
    {
        //$("#WidgetName").val("");
        $("#TempWidgetId").val(widgetId);
        $("#addContentModal").modal("show");
        $('#addContentModal').on('shown.bs.modal', function () {
            $('#WidgetName').focus();
        });
    }

    WidgetHelper.CreateWidgetContent = function ()
    {
        var name, description, contentType, source, foreignKey, controlId, tempWidgetId;
        //CAPTURAMOS CADA DATO NECESARIO DEL WIDGET
        // 1) NOMBRE
        name = $("#WidgetName").val();
        // 2) DESCRICION
        description = $("#WidgetDescription").val();
        // 3) TIPO DE CONTENIDO -> Define a que entidad relacionar la informacion y con el Id obtenido es usado en la entidad Widget.
        contentType = $("#ContentType option:selected").val();
        // 4) SOURCE
        source = $("#Source option:selected").val();
        // 5) FOREIGN KEY
        foreignKey = $("#ForeignKey option:selected").val();
        // 6) ID DEL CONTROL
        controlId = $("#ControlName option:selected").val();
        // 7) WIDGET ID TEMPORAL
        tempWidgetId = $("#TempWidgetId").val();

        var widgets = [{
            Index: WidgetHelper.GetWidgetPosition(tempWidgetId),
            WidthPercentage: $("#" + tempWidgetId)[0].style["width"].slice(0, -1),
            HeightPercentage: $("#" + tempWidgetId)[0].style["height"].slice(0, -1),
            MinimumWidth: $("#" + tempWidgetId)[0].attributes["minWidth"].value,
            MinimumHeight: $("#" + tempWidgetId)[0].attributes["minHeight"].value,
            AspectRatio: ($("#" + tempWidgetId)[0].attributes["aspectRatio"].value == "true"),
        }];

        var contentToAdd = {
            Name: name,
            Description: description,
            Source: source,
            ForeignKey: foreignKey,
            ContentType: contentType,
            ControlId: controlId
        };

        var request = $.ajax({
            url: "/Dashboard/UpdateDashboardContent",
            method: "POST",
            data: {
                Id: $("#dashboardTabs li.active")[0].id,
                Index: WidgetHelper.GetDashboardPosition(),
                Widgets: widgets,
                ContentToAdd: contentToAdd,
            },
        });

        request.done(function (response) {
            $("#addContentModal").modal("toggle");
            window.location.href = "/Dashboard/ConfigureDashboard?selectedDashboard=" + response;
        });

        request.fail(function (jqXHR, textStatus) {
            alert("Request failed: " + textStatus);
        });
    }

    WidgetHelper.ExpandCollapse = function (args)
    {
        var _expandedSize = args.expanded.size;
        var _collapsedSize = args.collapsed.size;

        if (_expandedSize > _collapsedSize || _expandedSize == 0)
        {
            // Al realizar un redimensionamiento del spliter lanzamos un evento de 'resize' en cada widget.
            var _widgetArray = $(".tab-pane.active").children().children().children();
            for (var i = 0; i < _widgetArray.length; i++)
            {
                $(_widgetArray[i]).trigger("resize");
                $(_widgetArray[i]).on("resize", function () {
                    // Desactivamos el trigger lanzado anteriormente.
                    $(_widgetArray[i]).off("resize");
                });
            }
        }
    }

    WidgetHelper.Resize = function ()
    {
        // Al realizar un 'resize' del spliter lanzamos un evento de 'resize' en cada widget.
        var _widgetArray = $(".tab-pane.active").children().children().children();
        for (var i = 0; i < _widgetArray.length; i++) {
            $(_widgetArray[i]).trigger("resize");
            $(_widgetArray[i]).on("resize", function () {
                // Desactivamos el trigger lanzado anteriormente.
                $(_widgetArray[i]).off("resize");
            });
        }
    }

    // Public Methods
    WidgetHelper.prototype.ToolbarOptions = WidgetHelper.ToolbarOptions;
    WidgetHelper.prototype.ExpandCollapse = WidgetHelper.ExpandCollapse;
    WidgetHelper.prototype.Resize = WidgetHelper.Resize;
    WidgetHelper.prototype.AddContent = WidgetHelper.AddContent;
    //WidgetHelper.prototype.Update = WidgetHelper.Update;
    WidgetHelper.prototype.GetDashboardPosition = WidgetHelper.GetDashboardPosition;

    return WidgetHelper;
})();