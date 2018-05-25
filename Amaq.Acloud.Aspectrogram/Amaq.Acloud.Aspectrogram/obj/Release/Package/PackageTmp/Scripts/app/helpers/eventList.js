/*
 * eventList.js
 * Gestiona el listado de eventos.
 * @author Jorge Calderon
 */

var EventList = {};

EventList = (function () {
    "use strict";

    /*
     * Constructor.
     */
    EventList = function (assetName, width, height) {
        var
            _assetName,
            _widget,
            _closeButton,
            _titleBar,
            _widgetDataId,
            _gridstackItem,
            _containerList,
            _tableElement,
            _dataTableObj,
            _language,
            _createTable,
            _resizeDataTableToFitContainer;

        _widgetDataId = Math.floor(Math.random() * 100000);
        _assetName = assetName;

        _closeButton = document.createElement("a");
        _closeButton.className = "btn aw-button";
        $(_closeButton).append($("<i>", { "class": "fa fa-close fa-1x" }));
        $(_closeButton).bind("click", function () {
            var grid, el;
            if (_dataTableObj) _dataTableObj.destroy();
            grid = $(".grid-stack").data("gridstack");
            el = $(_containerList).parents().eq(2);
            grid.removeWidget(el);
            $(_containerList).remove();
        });

        _titleBar = document.createElement("div");
        _titleBar.id = "eventTitle" + _widgetDataId;
        _titleBar.className = "text-center";
        _titleBar.style.width = "100%";
        _titleBar.style.height = "8%";
        $(_titleBar).html("<h4>Eventos " + _assetName + "</h4>");

        _containerList = document.createElement("div");
        _containerList.id = "eventList" + _widgetDataId;
        _containerList.style.marginLeft = "2%";
        _containerList.style.width = "96%";
        _containerList.style.height = "92%";

        _widget = document.createElement("div");
        _widget.className = "aw-widget";
        _widget.style.width = '100%';
        _widget.style.height = '100%';
        _widget.style.border = "1px solid black";
        _gridstackItem = $.parseHTML("<div><div class=\"grid-stack-item-content\" data-id=\"" + _widgetDataId + "\"/><div/>");
        $(".grid-stack").data("gridstack").addWidget(_gridstackItem, 0, 0, width, height, true);
        $(_widget).append(_closeButton);
        $(_widget).append(_titleBar);
        $(_widget).append(_containerList);
        $(".grid-stack-item-content[data-id=\"" + _widgetDataId + "\"]").append(_widget);

        _language = {
            decimal: "",
            emptyTable: "No hay datos disponibles en la tabla",
            info: "Mostrando desde _START_ hasta _END_ de un total de _TOTAL_ registros",
            infoEmpty: "Mostrando desde 0 hasta 0 de un total de 0 registros",
            infoFiltered: "(Filtrado de un total de _MAX_ registros)",
            infoPostFix: "",
            thousands: ",",
            lengthMenu: "Mostrar _MENU_ por página",
            loadingRecords: "Cargando...",
            processing: "Procesando...",
            search: "Buscar:",
            zeroRecords: "No se encontraron registros coincidentes",
            paginate: {
                first: "Primera",
                last: "Última",
                next: "Siguiente",
                previous: "Anterior"
            },
            aria: {
                sortAscending: ": activar para ordenar la columna ascendente",
                sortDescending: ": activar para ordenar la columna descendente"
            }
        };

        _resizeDataTableToFitContainer = function () {
            var
                oTable,
                oDataTable,
                dtWrapper,
                panelHeight,
                toolbarHeights,
                scrollHeadHeight,
                height;

            oTable = $(_tableElement);
            oDataTable = oTable.dataTable();
            oDataTable.fnAdjustColumnSizing(false);

            // TableTools
            if (typeof (TableTools) != "undefined") {
                var tableTools = TableTools.fnGetInstance(table);
                if (tableTools != null && tableTools.fnResizeRequired()) {
                    tableTools.fnResizeButtons();
                }
            }
            dtWrapper = oTable.closest(".dataTables_wrapper");
            panelHeight = dtWrapper.parent().height();
            toolbarHeights = 0;
            dtWrapper.find(".fg-toolbar").each(function (i, obj) {
                toolbarHeights = toolbarHeights + $(obj).height();
            });
            scrollHeadHeight = dtWrapper.find(".dataTables_scrollHead").height();
            height = panelHeight - toolbarHeights - scrollHeadHeight;
            dtWrapper.find(".dataTables_scrollBody").height(height - 70);
            oDataTable._fnScrollDraw();
        };

        this.GetAll = function (assetId) {
            var
                data,
                parsedTableHeight,
                dataTableObj;

            $.ajax({
                url: "/Home/GetEventList",
                method: "GET",
                data: {
                    assetId: assetId
                },
                beforeSend: function () {
                    $(_containerList).append("<p>Cargando...</p>");
                },
                success: function (response) {
                    data = JSON.parse(response);
                    _createTable();
                },
                complete: function () {
                    $(_containerList).empty();
                    $(_containerList).append(_tableElement);
                    parsedTableHeight = $(_containerList).height() - 105 + "px";
                    _dataTableObj = $(_tableElement).DataTable({
                        data: data,
                        columns: [
                            { data: "Id", name: "Id", visible: false, searchable: false },
                            {
                                data: "TimeStamp", name: "TimeStamp", title: "Estampa de tiempo", render: function (val) {
                                    return formatDate(new Date(val));
                                }
                            },
                            {
                                data: "EventType", name: "EventType", title: "Tipo de evento", render: function (val) {
                                    return eventTypeList[parseInt(val) - 1];
                                }
                            },
                            {
                                data: "Status", name: "Status", title: "Estado", render: function (val) {
                                    return eventStatusList[parseInt(val) - 1].title;
                                }
                            },
                            {
                                data: "Duration", name: "Duration", title: "Duración", render: function (val) {
                                    return val.toFixed(2) + " min";
                                }
                            }
                        ],
                        bfilter: false,
                        responsive: true,
                        autoWidth: true,
                        scrollY: parsedTableHeight,
                        scrollCollapse: false,
                        language: _language,
                        fnDrawCallback: function (oSettings) {
                            _resizeDataTableToFitContainer();
                        },
                        fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                            $(nRow).addClass(eventStatusList[parseInt(aData["Status"]) - 1].cssClass);
                            return nRow;
                        }
                    });

                    $("#" + _tableElement.id + " tbody").on("dblclick", "tr", function () {
                        var
                            oTable,
                            iPos;

                        oTable = $(_tableElement).dataTable();
                        iPos = oTable.fnGetPosition(this);
                        eventPlayerObj.loadHeaderEvent(_assetName, oTable.fnGetData(iPos));
                    });

                    // Dispara el evento de Resize 
                    $('.grid-stack-item').on('resizestop', function () {
                        setTimeout(function () {
                            _resizeDataTableToFitContainer();
                        }, 100);
                    });
                },
                error: function (jqXHR, textStatus) {
                    console.error("Error: " + new AjaxErrorHandling().GetXHRStatusString(jqXHR, textStatus));
                }
            });
        };

        _createTable = function () {
            _tableElement = document.createElement("table");
            _tableElement.id = "table" + _widgetDataId;
            _tableElement.className = "table table-bordered table-sm dt-responsive nowrap";
        };
    };

    return EventList;
})();