/*
 * EventsLoc3d.js
 * Manejo de variables para la creación de Canvas 3d (Editor o Visor)
 */

var EventsLoc3d = {};

EventsLoc3d = (function () {
    "use strict";

    /*
     * Constructor.
     */
    EventsLoc3d = function (wId, parentContId) {


        var _scene,
            _scope,
            _vbles,
            _putInitialConditions,
            _initializeVbles,
            _selectedMeshName;

        _scope = this;

        _initializeVbles = function () {
            _scene = location3d.scene[wId];
            _vbles = location3d.vbles[wId];
            scene = _scene;
            camera = _scene.activeCamera;
        }();

        this.onMouseMove = function (e) {
            e.preventDefault();

            var lastMeshSelected,
                pickInfo,
                idPlant;

            pickInfo = _scene.pick(_scene.pointerX, _scene.pointerY, null, null, null);
            

            if (pickInfo.hit) {
                _selectedMeshName = pickInfo.pickedMesh.name;

                if (_selectedMeshName.indexOf("ribbonTape2") != -1 || _selectedMeshName.indexOf("ribbonTape1") != -1 || _selectedMeshName.indexOf("ribbonStructure") != -1 || _selectedMeshName.indexOf("hex") != -1) {
                    idPlant = _selectedMeshName.split("-")[1];
                    _putInitialConditions();
                    for (var i = 0; i < _vbles.plants.shape.length; i++) {
                        if (pickInfo.pickedMesh.parent == _vbles.plants.shape[i]) {
                            for (var j = 0; j < _vbles.plants.shape[i]._children.length; j++) {
                                _vbles.plants.shape[i]._children[j].material.alpha = 0.9;
                            }
                        }
                    }
                    _scene.getMeshByName(globalsLoc3d.names.namePlant + idPlant).visibility = true;
                }
            }
        };

        _putInitialConditions = function () {
            
            for (var i = 0; i < _vbles.plants.shape.length; i++) {
                for (var j = 0; j < _vbles.plants.shape[i]._children.length; j++) {
                    _vbles.plants.shape[i]._children[j].material.alpha = 0.5;
                }
                _vbles.plants.text[i].visibility = false;
            }
            

        };

    };
    return EventsLoc3d;
})();