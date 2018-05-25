  /*var myVariables = {}
   ,varNames = ["name1","name2","name3"];
for (var i=0;i<varNames.length;i+=1){
    myVariables[varNames[i]] = 0;
}
myVariables.name1; //=> 0
*/

var urlBabylonFiles = "../Content/STL/";
var nodes = {};
var vbles = {};


var realVel = {
    location: {},
    asset: 3600,
    maxVel: 3600
};



var cascade3d = {
    engine: {},
    scene: {},
    canvas: {},
    containerCanvas: {},
    events: {},
    vbles: {},
    contLoader: {}
};

var fullSpecCascade3d = {
    engine: {},
    scene: {},
    canvas: {},
    containerCanvas: {},
    events: {},
    vbles: {},
    contLoader: {}
};

var vblesEventsEd = {
    click: {
        current: {
            meshName: ""
        },
        old: {
            meshName: ""
        },
        flag: false,
        canvas: ""
    },
    longClick: {
        current: {
            meshName: ""
        },
        old: {
            meshName: ""
        },
        flag: false
    },
    //currentEntity: "57a4bbc04a97bb8ee99696bd"
};



var uiEditorVbles = {
    file: {},
    load: {},
    object: {},
    trees: {}
};



var viewer3d = {
    engine: {},
    scene: {},
    canvas: {},
    containerCanvas: {},
    events: {},
    contLoader: {},
    parentId: {}
};


var location3d = {
    engine: null,
    scene: null,
    canvas: null,
    containerCanvas: null,
    events: null,
    contLoader: null,
    parentId: null,
    loadLocations: null
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
            spec:{
                canvas: "canvas-Spec-",
                chart: "chart-Spec-"
            },
            spec100p: {
                canvas: "canvas-Spec100p-",
                chart: "chart-Spec100p-"
            },
            orb:{
                canvas: "canvas-Orb-",
                chart: "chart-Orb-"
            },
            orb1X: {
                canvas: "canvas-Orb1X-",
                chart: "chart-Orb1X-"
            },
            sCL:{
                canvas: "canvas-sCL-",
                chart: "chart-sCL-"
            },
            ShaftDef: {
                canvas: "canvas-ShaftDef-",
                chart: "chart-ShaftDef-",
                line: "line-ShaftDef"
            },
            waterfall:{
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
    /*
    flags: {
        plots: {
            spec: false,
            orb: false,
            sCL: false,
            waterfall: false
        },
        machineView: {
            housing: false,
            transparent: false,
            wireframe: false
        },
        various: {
            fullScreen: false
        },
        animation: false
    },
  
    colors: {
        clearColor: "#000000", //new BABYLON.Color3(0, 0, 0),
        wireframe: "#00B3FF", //new BABYLON.Color3(0, 0.7, 1), //(00b3ff)
        spec: {
            bl: "#99CCE6",
            bg: "#333380",
            lc: "#99CCE6"
        },
        orb: {
            bl: "#99CCE6",
            bg: "#333380",
            lc: "#99CCE6"
        },
        sCL: {
            bl: "#CCB380",
            bg: "#FFB380",
            lc: "#CCB380"
        },
        waterfall: {
            bl: "#99CCE6",
            bg: "#333380",
            lc: "#99CCE6"
        }
    }
      */
    
};

var globalsLocation = {
    flagOpen: false
};

var globalsReport = {
    'miniatures': [],
    'elemDygraph': [],
    'elem3D': [],
    'elemTxt': [],
    flagHeader: false,
    idHeader: ""
};

var idPpalDivsReport = {
    gral: "contGeneralReport",
    min: "reportImgMin",
    content: "reportContent"
};

function autoGrow(oField) {
    if (oField.scrollHeight > oField.clientHeight) {
        oField.style.height = oField.scrollHeight + "px";
    }
}

var docReportPDF;

var actualSrcImage = null;

var arrayBmp = ["AcuaLineal", "AcuaMundo", "AMAQ", "AmarilloLineal2", "arcoiris", "BlueJean", "frio", "hielo", "InfraRojo", "INVAMAQ", "PapelFino", "SangreyFuego", "Termico", "Termico2", "Termico3", "Tornasol", "TornasolInv", "VerdeLineal"];

var watConfig = {
    bGColor: "#FFFFFF",
    labelsColor: "#000000",
    specQty: 100,
    armQty: 5,
    type: "clasica",
    numChromeScale: 4,
    bilog: true
   
};


var fSWatConfig = {
    bGColor: "#FFFFFF",
    labelsColor: "#000000",
    specQty: 100,
    armQty: 5,
    type: "clasica",
    numChromeScale: 4,
    bilog: true
};


$.fn.toggleClick = function () {
    var functions = arguments
    return this.each(function () {
        var iteration = 0
        $(this).click(function () {
            functions[iteration].apply(this, arguments)
            iteration = (iteration + 1) % functions.length
        })
    })
};

var downloadURI = function (uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

var eliminateDuplicatesArray = function (arr) {
    var i,
        len = arr.length,
        out = [],
        obj = {};

    for (i = 0; i < len; i++) {
        obj[arr[i]] = 0;
    }
    for (i in obj) {
        out.push(i);
    }
    return out;
};

function checkDuplicateInObject(propertyName, inputArray) {
    var seenDuplicate = false,
        testObject = {};

    inputArray.map(function (item) {
        var itemPropertyName = item[propertyName];
        if (itemPropertyName in testObject) {
            testObject[itemPropertyName].duplicate = true;
            item.duplicate = true;
            seenDuplicate = true;
        }
        else {
            testObject[itemPropertyName] = item;
            delete item.duplicate;
        }
    });

    return seenDuplicate;
}

function removeDuplicates(originalArray, prop) {
    var newArray = [];
    var lookupObject = {};

    for (var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    for (i in lookupObject) {
        newArray.push(lookupObject[i]);
    }
    return newArray;
};

function removeDuplicates2(arr, prop) {
    var obj = {};
    for (var i = 0, len = arr.length; i < len; i++) {
        arr[i][prop] = parseFloat(arr[i][prop].toFixed(3));
        if (!obj[arr[i][prop]]) obj[arr[i][prop]] = arr[i];
    }
    var newArr = [];
    for (var key in obj) newArr.push(obj[key]);
    return newArr;
}

$.fn.textWidth = function (text, font) {
    if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
    $.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
    return $.fn.textWidth.fakeEl.width();
};


var galgasVi, TextVi = [], plotsVi, meshesTurbo = [], cylProbes = [], chartSpec = [];
galgasVi = {
    cyl: [],
    probe: [],
    cone: [],
    ind: [],

};

plotsVi = {

};

function hideMeshes(type, flagShow) {

    switch (type) {
        case "Text": visibilityMeshes(TextVi, flagShow); break;
        case "Galgas":  visibilityMeshes(galgasVi.cyl, flagShow);
                        visibilityMeshes(galgasVi.probe, flagShow);
                        visibilityMeshes(galgasVi.cone, flagShow);
                        visibilityMeshes(galgasVi.ind, flagShow);
                        visibilityMeshes(cylProbes, flagShow);
            break;
        case "PlotsSpec": visibilityMeshes(plotsVi.spec, flagShow); break;
        case "PlotsOrb": visibilityMeshes(plotsVi.orb, flagShow); break;
        case "Turbo": visibilityMeshes(meshesTurbo, flagShow); break;
    }
}

function visibilityMeshes(array, flag) {
    for (var i = 0; i < array.length; i++) {
        array[i].visibility = flag;
    }
};

function changePositionPlots() {
    plotsVi.spec[0].position.y = 210;
    plotsVi.spec[1].position.y = 210;
};

function changeSizePlotsSpec(size) {
    for (var i = 0; i < chartSpec.length; i++) {
        chartSpec[i].visibility = false;
        plotsVi.spec[i].scaling = new BABYLON.Vector3(plotsVi.spec[i].scaling.x * size, plotsVi.spec[i].scaling.y * size, plotsVi.spec[i].scaling.z * size);
    }
};

function smallerText(size) {
    for (var i = 0; i < TextVi.length; i++) {
        TextVi[i].scaling = new BABYLON.Vector3(size, size, size);
    }
};

function positionText() {
    var sizePlot = plotsVi.spec[0].scaling.x;
    for (var i = 0; i < TextVi.length; i++) {
        if (i > 1) {
            TextVi[i].position.y = TextVi[i].position.y - sizePlot / 1.5;
        }
        else {
            TextVi[i].position.y = TextVi[i].position.y - sizePlot / 1.5 + 27;
        }
        //plotsVi.spec[0]._bounding
        if (i % 2 === 0) {
            TextVi[i].position.x = TextVi[i].position.x + sizePlot / 1.2;
        } else {
            TextVi[i].position.x = TextVi[i].position.x - sizePlot / 1.2;
        }
    }
};

function plotsSpec() {
    //changePositionPlots();
    smallerText();
    positionText();
};

var chartProv;


var epmPlanta = {
    'location': {
        'parts': [
            {
                'fileName': 'EpmAguas',
                'partType': 'Location',
                'color': { 'r': 0.77, 'g': 0.77, 'b': 0.77 },
                'transform': [
                    { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y':1, 'z': 1 } }
                ]
            }
        ],
        'children': [
            {
                'id': '5834450b5ca9da6b0ca01d9e',
                'partType': 'Location',
                'name': 'DISTRIBUCION PRIMARIA',
                'transform': [
                    { 'pos': { 'x': 6000, 'y': 200, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
                ]
            }
        ]
    }
};

var distribucionPrimaria = {
    'location': {
        'parts': [
            {
                'fileName': 'DistribucionPrimaria',
                'partType': 'Location',
                'color': { 'r': 0.77, 'g': 0.77, 'b': 0.77 },
                'transform': [
                    { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
                ]
            }
        ],
        'children': [
            {
                'id': '5834530a5ca9da6b0ca01da4',
                'partType': 'Location',
                'name': 'BOMBEO BERLIN',
                'transform': [
                    { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
                ]
            }
        ]
    }
};

var bombeoberlin = {
    'location': {
        'parts': [
            {
                'fileName': 'Berlin',
                'partType': 'Location',
                'color': { 'r': 0.77, 'g': 0.77, 'b': 0.77 },
                'transform': [
                    { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
                ]
            }
        ],
        'children': [
            {
                'id': '583457605ca9da6b0ca01db6',
                'partType': 'Asset',
                'name': 'GRUPO1',
                'transform': [
                    { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
                ]
            },
            {
                'id': '583457715ca9da6b0ca01db8',
                'partType': 'Asset',
                'name': 'GRUPO2',
                'transform': [
                    { 'pos': { 'x': 0, 'y': 0, 'z': 0 }, 'rot': { 'x': 0, 'y': 0, 'z': 0 }, 'sca': { 'x': 1, 'y': 1, 'z': 1 } }
                ]
            }
        ]
    }
};





//function fixPositionPlots 

//var vi
//for (var i = 0; i < nodes["57f7fed0691ddf29a26be562"].points.children.length; i++){

//}
/*
var globalsReport = {
    'miniatures': [],
    'elemDygraph': [],
    'elem3D': [],
    'elemTxt': []
};*/
/*

var canvas = document.getElementById("mycanvas");
var img    = canvas.toDataURL("image/png");
document.write('<img src="'+img+'"/>');


var can = document.getElementById('canvas1');
var ctx = can.getContext('2d');

ctx.fillRect(50,50,50,50);

var img = new Image();
img.src = can.toDataURL();
document.body.appendChild(img);

var img = document.getElementById(imgId);
Dygraph.Export.asPNG(graph, img);
window.location.href = img.src.replace('image/png','image/octet-stream');
*/

