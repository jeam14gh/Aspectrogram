var editor3d = {
    engine: {},
    scene: {},
    canvas: {},
    containerCanvas: {},
    events: {},
    contLoader: {}
};
var urlBabylonFiles = "../Content/STL/";
var nodes = {};
var vbles = {};


var globalsMenuEd = {
    utilsNames: {
        parent: "Parent-axis-",
        eye: {
            name: "eye",
            size: 0.5
        },
        posHelp: {
            name: "posHelp",
            size: 1.2
        },
        arrowTS: {
            name: "arrowTS",
            size: 0.8
        },
        helperAxis: {
            x: "lineAxisX-",
            y: "lineAxisY-",
            z: "lineAxisZ-",
        }
    },
    divsNames: {
        gral: "Ed3d-",
        Tier1: {
            gral: "Tier1-",
            file: "File",
            insert: "Insert",
            piece: "Piece",
            axisConfig: "Axis",
            sensorConfig: "Sensor",
            gralConfig: "General"
        },
        Tier2: {
            gral: "Tier2",
            inputsXYZ: {
                X: "InputX",
                Y: "InputY",
                Z: "InputZ",
            },
            file: {
                newFile: "BtnNewFile",
                openFile: "BtnOpenFile",
                saveFile: "BtnSaveFile",
            },
            insert: {
                location: "BtnNewLocation",
                moving: "BtnNewMoving",
                statics: "BtnNewStatics",
                housing: "BtnNewHousing",
            },
            piece: {
                move: "MovePiece",
                rotate: "RotatePiece",
                scaling: "ScalingPiece",
                clone: "ClonePiece",
                deletePiece: "DeletePiece",
                changeColor: "InColorMesh",
                cBAxis: "CBChangeAxis",
                inputsXYZ: {
                    X: "Piece-InputX",
                    Y: "Piece-InputY",
                    Z: "Piece-InputZ",
                }
            },
            axisConfig: {
                qtyAxis: "InQtyAxis",
                numAxis: "numAxis",
                longAxis: "longAxis",
                hor: "BtnAxisHor",
                ver: "BtnAxisVer",
                tSCW: "BtnTSCW",
                tSCCW: "BtnTSCCW",
                viewP: "BtnViewP",
                viewM: "BtnViewM",
                vel: "InVel",
                axisParent: "CBAxisParent",
                inputsXYZ: {
                    X: "AxisPos-InputX",
                    Y: "AxisPos-InputY",
                    Z: "AxisPos-InputZ"
                }
            },
            sensorConfig: {
                gralRadius: "InGralRadiusSensor",
                gralHeight: "InGralHeightSensor",
                addSensor: "BtnAddSensor",
                deleteSensor: "BtnDeleteSensor",
                points: "lBPoints",
                height: "InHeightSensor",
                axisRel: "CBRelAxis",
                relPart: "CBRelPiece",
                paralel: "InParalel",
                perpend: "InPerpend",
                angle: "InAngle",
                //axial: "CBAxial",
                sidePlus: "CBSidePlus",
                sideMinus: "CBSideMinus",
                inputsXYZ: {
                    X: "AxisPos-InputX",
                    Y: "AxisPos-InputY",
                    Z: "AxisPos-InputZ"
                }
            },
            gralConfig: {
                cbHousing: "cBHousing"
            }
        },
        Tree: {
            gral: 'divContTreeEd3d',
            pieces: {
                div: 'divContTreePiecesEd3d'
            },
            points: {
                div: 'divContTreePointsEd3d'
            },
            assets:{
                div: 'divContLibraryMachineEd3d'
            },
            sensors: {
                div: 'divContSensorsEd3d',
                pair: '-Pair',
                radial: '-Radial',
                axial: '-Axial',
                various: '-Various'
            },
        },
        toolbar: {
            div: 'divToolbar',
            children: [
                {
                    id: 'PiecesTree',
                    txt: 'Árbol Piezas',
                    child: 'divContTreePiecesEd3d'
                },
                {
                    id: 'PointsTree',
                    txt: 'Árbol Puntos',
                    child: 'divContTreePointsEd3d'
                },
                {
                    id: 'SubAssetsLibrary',
                    txt: 'Librería Subactivos',
                    child: 'divContLibrarySubAssetsEd3d'
                },
                {
                    id: 'PiecesLibrary',
                    txt: 'Librería Piezas',
                    child: 'divContLibraryPiecesEd3d'
                },
                {
                    id: 'MachineLibrary',
                    txt: 'Librería Activos',
                    child: 'divContLibraryMachineEd3d'
                }
            ]
        }
    },
    tooltips: {
        gral: "tooltipEd3d",
        file: {
            newFile: "Nuevo",
            openFile: "Abrir",
            saveFile: "Guardar",
        },
        insert: {
            location: "Ubicación",
            moving: "Móviles",
            statics: "Estáticas",
            housing: "Carcasas",
        },
        piece: {
            move: "Mover",
            rotate: "Rotar",
            scaling: "Escalar",
            clone: "Clonar",
            deletePiece: "Eliminar",
            changeColor: "Cambiar Color",
            cBAxis: "Asignar a eje"
        },
        axisConfig: {
            hor: "Posición Horizontal",
            ver: "Posición Vertical",
            tSCW: "Sentido horario",
            tSCCW: "Sentido antihorario",
            viewP: "Vista Positiva",
            viewM: "Vista Negativa"
        },
        sensorConfig: {
            gralRadius: "Radio Sensores",
            gralHeight: "Altura Sensores",
            addSensor: "Agregar",
            deleteSensor: "Eliminar"
        },
        gralConfig: {
            cbHousing: "cBHousing"
        }
    },
    modalOpen: {
        obj: null,
        id: "modalOpen",
        idCont: "modalOpenContent",
        idDivNames: "modalOpenDivNames"
             
    },
    constant: {},
    prop3d: {},
    meshNames: {},
    actualMeshName: {},
    actualSensorId: {},
    actualAxis: {},
    selectMesh: {},
    selectSensor: {},
    selectedLBPoint: {},
    flagSelectedEvent: {}
};

var globals3d = {
    load: {
        qtyFiles: {},
        qtyLoaded: {}
    },
    names: {
        parents: {
            location: "Parent-Loc-", //Continua con id de location
            asset: "Parent-Asset-", //Continua con id del asset
            axis: "Parent-Axis-", //continua con Numero de eje + "-" + id del Asset,
            parentAxis: "ParentParent-Axis-"
        },
        sensor: {
            parent: "ParentSensor-",
            materialInd: "SensorIndMat-",
            probe: "SensorProbe-",
            cone: "SensorCone-",
            levelCyl: "SensorCyl-",
            levelInd: "SensorInd-",
            lineConeProbe: "SensorLineCP-"
        },
        plots: {
            trend: {
                canvas: "canvas-Trend-",
                chart: "chart-Trend-",
                bands: "trend-Band"
            },
            spec: {
                canvas: "canvas-Spec-",
                chart: "chart-Spec-"
            },
            spec100p: {
                canvas: "canvas-Spec100p-",
                chart: "chart-Spec100p-"
            },
            orb: {
                canvas: "canvas-Orb-",
                chart: "chart-Orb-"
            },
            sCL: {
                canvas: "canvas-sCL-",
                chart: "chart-sCL-"
            },
            ShaftDef: {
                canvas: "canvas-ShaftDef-",
                chart: "chart-ShaftDef-",
                line: "line-ShaftDef"
            },
            waterfall: {
                canvas: "canvas-waterfall-",
                chart: "chart-waterfall-"
            }
        },
        text: {
            texture: "Texture-Canvas-Text-",
            plane: "Plane-Canvas-Text-"
        }

        // lineColor: "#99CCE6"
    },
    bufferTrend: {},
    bufferLength: 500,
    paresQty: {},
    flags: {
    },
    colors: {
    },
    vel: {
        location: {},
        asset: {
            //axis:[]
            axis: {}

        }
    },
    filteredSV: {

    },
    infoViewer: {
        timeStamp: {},
        asset: {}
    }
};

var vblesEventsEd = {
    click: {
        current: {
            meshName: ""
        },
        old: {
            meshName: ""
        },
        flag: false
    }
    //currentEntity: "57a4bbc04a97bb8ee99696bd"
};


var assetsLibrary = [
    { id: "idALTurbinas", pid: "", hasChild: true, txt: "Turbinas" },
    //{ id: "idALHidraulicas", pid: "idALTurbinas", hasChild: true, txt: "Hidráulicas" },
    { id: "idALFrancisVertical", pid: "idALTurbinas", hasChild: false, txt: "Francis Vertical" },
    { id: "idALFrancisHorizontal", pid: "idALTurbinas", hasChild: false, txt: "Francis Horizontal" },
    { id: "idALPeltonVertical", pid: "idALTurbinas", hasChild: false, txt: "Pelton Vertical" },
    { id: "idALPeltonHorizontal", pid: "idALTurbinas", hasChild: false, txt: "Pelton Horizontal" },
    //{ id: "idALTermicas", pid: "idALTurbinas", hasChild: true, txt: "Térmicas" },
    { id: "idALVapor", pid: "idALTurbinas", hasChild: false, txt: "Vapor" },
    //{ id: "idALGas", pid: "idALTurbinas", hasChild: false, txt: "Gas" },
    //{ id: "idALVaporReductor", pid: "idALTurbinas", hasChild: false, txt: "Vapor Reductor" },
    { id: "idALGasReductor", pid: "idALTurbinas", hasChild: false, txt: "Gas Reductor" },
    { id: "idALCompresores", pid: "", hasChild: true, txt: "Compresores" },
    { id: "idALGasHumedo", pid: "idALCompresores", hasChild: false, txt: "Gas Húmedo" },
    { id: "idALCoker", pid: "idALCompresores", hasChild: false, txt: "Coker" },
    { id: "idALBombas", pid: "", hasChild: true, txt: "Bombas" },
    { id: "idALMultietapa", pid: "idALBombas", hasChild: false, txt: "Multietapa" },
    //{ id: "idALCentrifuga", pid: "idALBombas", hasChild: false, txt: "Centrífuga" },
    { id: "idALMonobloque", pid: "idALBombas", hasChild: false, txt: "Monobloque" },
];

/*
 { id: "idALAssets", pid: "", hasChild: true, txt: "Turbinas" },
    { id: "idALTurbinas", pid: "idALAssets", hasChild: true, txt: "Turbinas" },
    //{ id: "idALHidraulicas", pid: "idALTurbinas", hasChild: true, txt: "Hidráulicas" },
    { id: "idALFrancisVertical", pid: "idALTurbinas", hasChild: false, txt: "Francis Vertical" },
    { id: "idALFrancisHorizontal", pid: "idALTurbinas", hasChild: false, txt: "Francis Horizontal" },
    { id: "idALPeltonVertical", pid: "idALTurbinas", hasChild: false, txt: "Pelton Vertical" },
    { id: "idALPeltonHorizontal", pid: "idALTurbinas", hasChild: false, txt: "Pelton Horizontal" },
    //{ id: "idALTermicas", pid: "idALTurbinas", hasChild: true, txt: "Térmicas" },
    { id: "idALVapor", pid: "idALTurbinas", hasChild: false, txt: "Vapor" },599c885c3898db2bf4b96eef
    //{ id: "idALGas", pid: "idALTurbinas", hasChild: false, txt: "Gas" },
    //{ id: "idALVaporReductor", pid: "idALTurbinas", hasChild: false, txt: "Vapor Reductor" },
    { id: "idALGasReductor", pid: "idALTurbinas", hasChild: false, txt: "Gas Reductor" },59dcd27a9cbe7e25d052a614
    { id: "idALCompresores", pid: "idALAssets", hasChild: true, txt: "Compresores" },
    { id: "idALGasHumedo", pid: "idALCompresores", hasChild: false, txt: "Gas Húmedo" },57fea387691d525051277386
    { id: "idALCoker", pid: "idALCompresores", hasChild: false, txt: "Coker" },57feb97b691d5250512773a6
    { id: "idALBombas", pid: "idALAssets", hasChild: true, txt: "Bombas" },
    { id: "idALMultietapa", pid: "idALBombas", hasChild: false, txt: "Multietapa" },
    //{ id: "idALCentrifuga", pid: "idALBombas", hasChild: false, txt: "Centrífuga" },59b6a6473898db4c84afb260
    { id: "idALMonobloque", pid: "idALBombas", hasChild: false, txt: "Monobloque" },583457605ca9da6b0ca01db6
*/