/*
 * AppNavigation3d.js
 * 
 */

var AppNavigation3d = {};

AppNavigation3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    AppNavigation3d = function (width, height, aspectRatio) {

        var _scene,
            _canvas,
        // Contenedor HTML del input Text area
        _container,
        _contLoader,
        // Referencia a AspectrogramWidget
        _aWidget,
        _containerParentId = "containerParentLocation3d",
        // Bandera que determina habilita o deshabilita el draggable del grid
        _movableGrid = false,
        // Referencia al Id del widget
        _widgetId = Math.floor(Math.random() * 100000),
        _manageCanvas,
        _company3d,
        _loadMeshesLoc3d,
        _buildViewer3d;


        var scope = this;
        /*
         * Creamos el contenedor HTML de la grafica
         */
        _container = document.createElement("div");
        _container.id = "containerParentLocation3d";
        _container.style.width = "100%";
        _container.style.height = "100%";

        /*
         * Construye la visualizacion 3d, caso no exista.
         * @param {String} title Titulo a ser mostrado en la parte superior del chart
         */
        _buildViewer3d = function () {

            _manageCanvas = new ManageLocCanvas3d(_widgetId, _containerParentId);
            _manageCanvas.openCanvas();

            _scene = location3d.scene[_widgetId];
            _canvas = location3d.canvas[_widgetId];

            _company3d = new Company3d(_widgetId, _containerParentId);
            _company3d.loadCompany();


            /*
            _loadMeshesLoc3d = new LoadMeshesLoc3d(_containerParentId, _manageCanvas);
            _loadMeshesLoc3d.loadLocations();*/
        };


        this.Show = function () {

            var autoPosition = true;

            globalsLocation.flagOpen = true;

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
                autoPosition: true,
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

            });

            // Abrir AspectrogramWidget.
            _aWidget.open();

            _buildViewer3d();
        };

        this.Close = function () {

            globalsLocation.flagOpen = false;
            _manageCanvas.closeCanvas();
            var grid, el;
            grid = $(".grid-stack").data("gridstack");
            el = $(_container).parents().eq(2);
            grid.removeWidget(el);
            $(_container).remove();
        };

    };
    return AppNavigation3d;
})();