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

var location3d = {
    engine: {},
    scene: {},
    canvas: {},
    containerCanvas: {},
    events: {},
    vbles: {},
    contLoader: {}
};

var globalsLoc3d = {
    names: {
        pie: "pie-",
        portion: ["ribbonStructure-", "ribbonTape1-", "ribbonTape2-"],
        hex: "hexCompany-",
        namePlant: "namePlant-",
        beams: "beams-",
        hexBase: "hexBase-",
        beamsMat: "beamsMat-"
    },
    materials: {
        
        beams: []
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

var _cyl = {
    h: 30,
    d: 100
};

//var hexBases = [];

/*
var locateCyls = function (qty) {

    var rI, //radio Interno hexagono
        rE, //radio Externo Hexagono
        dCHexTodCCyl, //Distancia centro Hexàgono a distancia centro cilindro
        spaceExt,
        spaceInt,
        hex,
        lineHex,
        qtyHex,
        hCyl,
        rCyl,
        cyl,
        cylAngle,
        angleQtyHex,
        pointsHex,
        indsHex,
        colsHex,
        hexBase,
        posX,
        posY,
        posZ, h, i,
        count;

    qtyHex = Math.ceil(qty / 6);
    angle = 360 / (qty % 6);
    count = 0;

    rCyl = _cyl.d / 2;
    hCyl = _cyl.h / 2
    //spaceInt = (1 + (0.2 * qty)) * rCyl;
    spaceExt = 0.2 * rCyl;

    //rE = spaceInt + 2 * rCyl + spaceExt;
    //rI = Math.sin(60) * rE;

    for (h = 0; h < qtyHex; h++) {
        //angleQtyHex = 360 / ((qty - 6) % 6);

        if (qty > 6) {
            if (h < qtyHex - 1) {
                angleQtyHex = 360 / 6;
            } else {
                angleQtyHex = 360 / (qty % 6);
            }
        } else {
            angleQtyHex = 360 / (qty % 6);
        }

        //if()


        spaceInt = (1 + (0.2 * (qty + 6 * h))) * rCyl;
        rE = spaceInt + 2 * rCyl + spaceExt;
        rI = Math.sin(60) * rE;

        if (h == 0) {
            hexBase = createHexagons("hshshshs", rE);
        }

        if (count < qty) {
            for (i = 0; i < qty; i++) {

                if (i % 6 == 0 && i > 0) {
                    cylAngle = 0;
                    posX = posZ = 0;
                    posY = hCyl;
                } else {
                    cylAngle = i * angleQtyHex * Math.PI / 180;
                    posX = rI * Math.cos(cylAngle);
                    posY = hCyl;
                    posZ = rI * Math.sin(cylAngle);
                }

                cyl = new BABYLON.MeshBuilder.CreateCylinder("cyl-" + i, { diameterTop: rCyl, diameterBottom: rCyl, height: hCyl, tessellation: 32 }, scene);
                cyl.position = new BABYLON.Vector3(posX, posY, posZ);
                cyl.parent = hexBase;
                count++;

            }
        }

    }
    


};*/


var arrayGeoLoc = ["C", "NE", "E", "SE", "SO", "O", "NO"]; // ángulos -> 0, 30, 90, 150, 210, 270, 330

var locateCyls = function (array, geoLocType) {

    var rInt, //radio Interno hexagono
        rExt, //radio Externo Hexagono
        dCHexTodCCyl, //Distancia centro Hexàgono a distancia centro cilindro
        qtyHex,
        hCyl,
        rCyl,
        cyl,
        qty,
        idEntity,
        spaceCyl,
        actualRadInt,
        actualRadExt,
        dCHexToCCyl, //Distancia del centro del hexagono al centro del Cylindro
        cylAngle,
        angleQtyHex,
        pointsHex,
        indsHex,
        colsHex,
        hexBase,
        cylinders,
        posX,
        posY,
        posZ,
        i, j,
       // hexBases,
        count;

    qty = array.length;
    qtyHex = Math.ceil(qty / 6); //Cantidad de repeticiones de hexàgono
    count = 0;

    rCyl = _cyl.d / 2;
    hCyl = _cyl.h / 2
    spaceExt = 0.2 * rCyl;
    spaceCyl = 0.1 * rCyl;
    cylinders = [];

    if (qty > 0) {

        for (i = 0; i < qtyHex; i++) {
            if (i == 0) {
                if (qty != 6) {
                    numCylForHex = qty % 6;
                } else {
                    numCylForHex = 6;
                }
                
                if (qty % 6 != 0) {
                    angle = (360 / (qty % 6)) * Math.PI / 180;
                } else {
                    angle = 60 * Math.PI / 180;
                }
            }else{
                numCylForHex = 6;
                angle = 60 * Math.PI / 180;
            }

            switch(numCylForHex){
                case 1:
                    dCHexToCCyl = 0; 
                    break;
                case 2:
                case 3:
                    dCHexToCCyl = rCyl;
                    break;
                default:
                    if (i > 0) {
                        dCHexToCCyl = (Math.PI - angle) * (rCyl + spaceCyl) / (2 * angle);
                    } else {
                        dCHexToCCyl = (Math.PI - angle) * (rCyl + spaceCyl) / (angle);
                    }
            }
            
            actualRadInt = dCHexToCCyl + (rCyl + spaceCyl) * (i + 1);
            actualRadExt = actualRadInt / Math.sin(60 / (Math.PI / 180));
            
            for (j = 0; j < numCylForHex; j++) {
                idEntity = array[count].id;
                cylAngle = angle * j;
                if (i % 2 != 0) {
                    cylAngle = angle * j + 30 * Math.PI / 180;
                }
                posX = dCHexToCCyl * Math.cos(cylAngle);
                posY = hCyl;
                posZ = dCHexToCCyl * Math.sin(cylAngle);

                cyl = new BABYLON.MeshBuilder.CreateCylinder("cyl-" + idEntity, { diameterTop: rCyl, diameterBottom: rCyl, height: hCyl, tessellation: 32 }, scene);
                cyl.position = new BABYLON.Vector3(posX, posY, posZ);
                cylinders.push(cyl);
                count++;
            }
        }
    }

    hexBase = createHexagons(geoLocType, actualRadExt, cylinders);
    console.log(hexBase);

    return hexBase;
};

var createHexagons = function (geoLocType, rExt, cylinders) {

    var i, angle,
        pointsHex,
        pathLine,
        lineHex,
        indHex,
        colHex,
        indexVert,
        vertexData,
        hexagon;

    pointsHex = [];
    pathLine = [];
    indHex = [];
    colHex = [];
    indexVert = 0;
    angle = 60 * Math.PI / 180;
    colorHex = BABYLON.Color3.FromHexString("#002b35");

    for (i = 0; i < 6; i++) {
        pointsHex.push(0, 0, 0,
            rExt * Math.cos(angle * i), 0, rExt * Math.sin(angle * i),
            rExt * Math.cos(angle * (i + 1)), 0, rExt * Math.sin(angle * (i + 1)));
        indHex.push(indexVert, indexVert + 1, indexVert + 2);
        colHex.push(    colorHex.r, colorHex.g, colorHex.b, 1,
                        colorHex.r, colorHex.g, colorHex.b, 1,
                        colorHex.r, colorHex.g, colorHex.b, 1);
        pathLine.push(new BABYLON.Vector3(rExt * Math.cos(angle * i), 0, rExt * Math.sin(angle * i)));
        indexVert += 3;
    }
    pathLine.push(new BABYLON.Vector3(rExt * Math.cos(0), 0, rExt * Math.sin(0)));

    hexagon = new BABYLON.Mesh("hex-" + geoLocType, scene);
    hexagon.material = new BABYLON.StandardMaterial("matHex" + geoLocType, scene);
    hexagon.material.backFaceCulling = false;
    hexagon.material.specularColor = new BABYLON.Color3(0, 0, 0);
    hexagon.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    hexagon.material.freeze();

    vertexData = new BABYLON.VertexData();

    vertexData.positions = pointsHex;
    vertexData.indices = indHex;
    vertexData.colors = colHex;

    vertexData.applyToMesh(hexagon, 1);

    //hexagon.position = new BABYLON.Vector3(Math.random() * 1000, 0, Math.random() * 1000);

    line = BABYLON.Mesh.CreateLines("lineHex-" + geoLocType, pathLine, scene, true);
    line.parent = hexagon;
    line.color = BABYLON.Color3.FromHexString("#7feaff");

    for (i = 0; i < cylinders.length; i++) {
        cylinders[i].parent = hexagon;
    }

    return hexagon;
};

var arrayGeoLocType = {
    NO: [],
    NE: [],
    E: [],
    SE: [],
    SO: [],
    O: [],
    C: [],
};

var distributeGeoLocation = function () {

    var geoLocType,
        centerRadius,
        distanceFromCenter,
        radius,
        hexBases,
        array,
        mesh,
        type,
        posX,
        posY,
        posZ,
        i, j;

    hexBases = [];

    for (i = 0; i < entities.length; i++) {
        if (entities[i].GeoLoc) {
            geoLocType = entities[i].GeoLoc;
            arrayGeoLocType[geoLocType].push({
                id: entities[i].Id
            });
        }
    }

    for (i = 0; i < arrayGeoLoc.length; i++) {
        type = arrayGeoLoc[i];

        array = arrayGeoLocType[type];
        mesh = locateCyls(array, type);
        radius = mesh._boundingInfo.maximum.x / 2;
        if (i == 0) {
            centerRadius = radius;
            distanceFromCenter = 0;
        } else {
            distanceFromCenter = (centerRadius + radius) * (4 + Math.random() / 2);
            createConexionLines(type, ( 30 * Math.PI / 180) + i * 60 * Math.PI / 180, centerRadius, radius, distanceFromCenter);
        }

        hexBases.push({
            mesh: mesh,
            angle: 30 * Math.PI / 180 + i * 60 * Math.PI / 180,
            radius: radius,
            distance: distanceFromCenter
        });
    }

    for (i = 0; i < hexBases.length; i++) {
        mesh = hexBases[i].mesh;
        angle = hexBases[i].angle;
        radius = hexBases[i].radius;
        distance = hexBases[i].distance;

        posX = distance * Math.cos(angle);
        posZ = distance * Math.sin(angle);

        mesh.position = new BABYLON.Vector3(posX, 0, posZ);
    }
};

var randomVector = function () {
    var random_vector = BABYLON.Vector3.Zero();

    phi = Math.random() * Math.PI * 2.0;
    cos_theta = Math.random() * 2.0 - 1;

    theta = Math.acos(cos_theta);
    random_vector.x = Math.sin(theta) * Math.cos(phi);
    random_vector.y = Math.sin(theta) * Math.sin(phi);
    random_vector.z = Math.cos(theta);

    return random_vector;
};

var createConexionLines = function (type, angle, centerRad, meshRad, distance) {

    var path,
        p1,
        p2,
        line,
        x,
        y,
        z;

    x = 2 * centerRad * Math.sin(60 * Math.PI / 180) * Math.cos(angle);
    z = 2 * centerRad * Math.sin(60 * Math.PI / 180) * Math.sin(angle);
    p1 = new BABYLON.Vector3(x, 0, z);

    x = (-centerRad + distance - meshRad * Math.sin(60 * Math.PI / 180)) * Math.cos(angle);
    z = (-centerRad + distance - meshRad * Math.sin(60 * Math.PI / 180)) * Math.sin(angle);
    p2 = new BABYLON.Vector3(x, 0, z);

    line = BABYLON.Mesh.CreateDashedLines("lineConexion-" + type, [p1, p2], 10, 5, 10, scene, true);
    line.color = BABYLON.Color3.FromHexString("#8ffbff");
};

var deleteMeshes = function (qty) {

    var cyl;

    for (var i = 0; i < qty; i++) {
        cyl = scene.getMeshByName("cyl-" + i).dispose();
    }
   
};

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

var randomPerp = function (pos, normal, radius) {
    var random_point;

    do {
        random_point = BABYLON.Vector3.Cross(randomVector(), normal)

    } while (!random_point.lengthSquared());

    random_point = random_point.normalize();
    random_point.scaleInPlace(radius);
    random_point.addInPlace(pos);

    return random_point;
};


var createLightVertex = function (name) {

    var x0, x1,
        y0, y1,
        mesh,
        vertexData,
        alpha1,
        alpha2,
        color,
        points,
        index,
        ind,
        col;

    x0 = -1;
    x1 = 1;
    y0 = 0;
    y1 = 1;

    points = [];
    ind = [];
    col = [];
    index = 0;
    alpha1 = 1
    //alpha1 = Math.random();
    //alpha2 = alpha1 ;
    color = BABYLON.Color3.FromHexString("#ffffff");

    for (var i = 0; i < 1; i++) {
        points.push(x0, y0 + i, 0,
            x0, y1 + i, 0,
            x1, y0 + i, 0,
            x1, y0 + i, 0,
            x0, y1 + i, 0,
            x1, y1 + i, 0);
        ind.push(index, index + 1, index + 2,
            index + 3, index + 4, index + 5);
        /*
        col.push(color.r, color.g, color.b, alpha1, // 1 - 7
            color.r, color.g, color.b, alpha1,// 2 - 8
            color.r, color.g, color.b, alpha1,// 3 - 9
            color.r, color.g, color.b, alpha1,// 4 - 10
            color.r, color.g, color.b, alpha1,// 5 - 11
            color.r, color.g, color.b, alpha1// 6 - 12
            );*/

        index += 6;
    }

    //var normals = [];

    mesh = new BABYLON.Mesh("Light-" + name, scene);
    mesh.material = new BABYLON.StandardMaterial("Lightning", scene);
    mesh.material.specularColor = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0);
    mesh.material.emissiveColor = new BABYLON.Color4(1.0, 1.0, 0.0, 0.2);
    mesh.material.backFaceCulling = true;

    vertexData = new BABYLON.VertexData();
    //BABYLON.VertexData.ComputeNormals(points, ind, normals);


    vertexData.positions = points;
    vertexData.indices = ind;
    //vertexData.colors = col;

    vertexData.applyToMesh(mesh, 1);

    return mesh;
}

var createVariousLight = function () {

    var parentMesh,
        randVector;

    

    for (var i = 0; i < 10; i++) {
        randVector = randomVector().multiply(new BABYLON.Vector3(100, 100, 0));
        parentMesh = BABYLON.MeshBuilder.CreateBox("sparkleParent", { height: 1, width: 1, depth: 1 }, scene);
        parentMesh.position = randVector;


    }
    
    //randomVector
};


var scene, camera, plane;

//GeoLoc: Nueva propiedad para ubicaciòn en hexágonos
// "NO" - "NE" - "E" - "SE" - "SO" - "O" - "C"

var entities = [
    {
        Id: "11",
        Name: "GUATAPE",
        StatusColor: "#00FF00",
        Severity: 1,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "NO" 
    },
    {
        Id: "12",
        Name: "TASAJERA",
        StatusColor: "#00FF00",
        Severity: 1,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "NE" 
    },
    {
        Id: "13",
        Name: "PORCE II",
        StatusColor: "#FF0000",
        Severity:3,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "NO" 
    },
    {
        Id: "14",
        Name: "GUADALUPE III",
        StatusColor: "#00FF00",
        Severity: 1,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "NO" 
    },
    {
        Id: "15",
        Name: "GUADALUPE IV",
        StatusColor: "#FFFF00",
        Severity: 2,
        ParentId: "1",
        IsPlant: true,
        GeoLoc: "SO" 
    },
{
    Id: "16",
    Name: "PLAYAS",
    StatusColor: "#FFFF00",
    Severity: 2,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "SE" 
},
{
    Id: "17",
    Name: "TRONERAS",
    StatusColor: "#FF0000",
    Severity: 3,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "O" 
},
{
    Id: "18",
    Name: "TERMOSIERRA",
    StatusColor: "#FF0000",
    Severity: 3,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "E" 
},
{
    Id: "19",
    Name: "HERRADURA",
    StatusColor: "#FF0000",
    Severity: 3,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "E" 
},
{
    Id: "20",
    Name: "LA VUELTA",
    StatusColor: "#FF0000",
    Severity: 3,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "C" 
},
{
    Id: "21",
    Name: "PAJARITO",
    StatusColor: "#FF0000",
    Severity: 3,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "NO" 
},
    {
        Id: "22",
        Name: "PICACHO",
        StatusColor: "#00FF00",
        Severity: 1,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "NE" 
        },
    {
        Id: "23",
        Name: "PALENQUE",
        StatusColor: "#00FF00",
        Severity: 1,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "SO"
    },
    {
        Id: "24",
        Name: "PANTANILLO",
        StatusColor: "#FF0000",
        Severity: 3,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "C"
    },
    {
        Id: "25",
        Name: "SALVATORIANO",
        StatusColor: "#00FF00",
        Severity: 1,
        ParentId: "1",
        IsPlant: true,
        EntityType: 1,
        GeoLoc: "NE"
    },
    {
        Id: "26",
        Name: "GERONA",
        StatusColor: "#FFFF00",
        Severity: 2,
        ParentId: "1",
        IsPlant: true,
        GeoLoc: "SO"
    },
{
    Id: "27",
    Name: "AMOYA",
    StatusColor: "#FFFF00",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "SO"
},
{
    Id: "28",
    Name: "CALDERAS",
    StatusColor: "#FF0000",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "NE"
},
{
    Id: "29",
    Name: "SAN CARLOS",
    StatusColor: "#FF0000",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "O"
},
{
    Id: "30",
    Name: "TERMOCENTRO",
    StatusColor: "#FF0000",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "E"
},
{
    Id: "31",
    Name: "LA MIEL",
    StatusColor: "#FF0000",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "O"
},
{
    Id: "32",
    Name: "LIMONCITO I",
    StatusColor: "#FF0000",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "NO"
},
{
    Id: "33",
    Name: "LIMONCITO II",
    StatusColor: "#FF0000",
    Severity: 1,
    ParentId: "1",
    IsPlant: true,
    GeoLoc: "NE"
},
    {
        Id: "111",
        Name: "MÁQUINA 1",
        ParentId: "11",
        EntityType: 2,
        Severity : 4
    },
    {
        Id: "112",
        Name: "MÁQUINA 2",
        ParentId: "11",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "113",
        Name: "MÁQUINA 3",
        ParentId: "11",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "114",
        Name: "MÁQUINA 4",
        ParentId: "11",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "115",
        Name: "MÁQUINA 5",
        ParentId: "11",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "116",
        Name: "MÁQUINA 6",
        ParentId: "11",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "117",
        Name: "MÁQUINA 7",
        StatusColor: "#00FF00",
        ParentId: "11",
        EntityType: 2,
        Severity: 3
    },
        {
            Id: "121",
            Name: "MÁQUINA 1",
            ParentId: "12",
            EntityType: 2,
            Severity: 4
        },
    {
        Id: "122",
        Name: "MÁQUINA 2",
        ParentId: "12",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "123",
        Name: "MÁQUINA 3",
        ParentId: "12",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "124",
        Name: "MÁQUINA 4",
        ParentId: "12",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "125",
        Name: "MÁQUINA 5",
        ParentId: "12",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "126",
        Name: "MÁQUINA 6",
        ParentId: "12",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "127",
        Name: "MÁQUINA 7",
        StatusColor: "#00FF00",
        ParentId: "12",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "131",
        Name: "MÁQUINA 1",
        ParentId: "13",
        EntityType: 2,
        Severity: 4
    },
    {
        Id: "132",
        Name: "MÁQUINA 2",
        ParentId: "13",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "133",
        Name: "MÁQUINA 3",
        ParentId: "13",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "134",
        Name: "MÁQUINA 4",
        ParentId: "13",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "135",
        Name: "MÁQUINA 5",
        ParentId: "13",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "136",
        Name: "MÁQUINA 6",
        ParentId: "13",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "137",
        Name: "MÁQUINA 7",
        StatusColor: "#00FF00",
        ParentId: "13",
        EntityType: 2,
        Severity: 3
    },
    {
        Id: "138",
        Name: "MÁQUINA 8",
        ParentId: "13",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "139",
        Name: "MÁQUINA 9",
        StatusColor: "#00FF00",
        ParentId: "13",
        EntityType: 2,
        Severity: 3
    },
    {
        Id: "141",
        Name: "MÁQUINA 1",
        ParentId: "14",
        EntityType: 2,
        Severity: 1
    },
    {
        Id: "142",
        Name: "MÁQUINA 2",
        ParentId: "14",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "143",
        Name: "MÁQUINA 3",
        ParentId: "14",
        EntityType: 2,
        Severity: 4
    }
];


BABYLON.Effect.ShadersStore["beamsVertexShader"] = "\r\n" +
    "precision mediump float;\r\n" +

   "// Attributes\r\n" +
   "attribute vec3 position;\r\n" +
   "attribute vec2 uv;\r\n" +

   "// Uniforms\r\n" +
   "uniform mat4 worldViewProjection;\r\n" +

   "// Varying\r\n" +
   "varying vec2 vUV;\r\n" +

   "void main(void) {\r\n" +
   "vec4 p = vec4(position, 1.0);\r\n" +
   "vUV = uv;\r\n" +
   "gl_Position = worldViewProjection * p;\r\n" +
   "}\r\n";

   BABYLON.Effect.ShadersStore["beamsFragmentShader"] = "\r\n" +

  "precision mediump float;\r\n" +

   "// Uniforms\r\n" +
   "uniform vec3 baseColor;\r\n" +
   "uniform float time;\r\n" +
   "uniform float highlight;\r\n" +

   "// Varying\r\n" +
   "varying vec2 vUV;\r\n" +

   "void main(void) {\r\n" +
   "float intensity = (abs(sin(vUV.x * 30.0 + time)) + abs(cos(vUV.x * 10.78 + time * 1.75)) + abs(sin(vUV.x * 15.11 - time * 2.3))) / 3.0;\r\n" +
   "float mask = cos((vUV.y - 0.5) * 3.14) * cos((vUV.x - 0.5) * 3.14);\r\n" +
   "gl_FragColor = vec4(baseColor * intensity, mask * intensity);\r\n" +
   "if(highlight != 0.0){\r\n" +
    "gl_FragColor += vec4(0.02, 0.39, 0.83, 1.0) * mask * max((sin(vUV.y * 5.0 - highlight * 3.0 - 4.0) - 0.95) * 32.0, 0.0);\r\n" +
   "}\r\n"+
   "}\r\n";
  /* "precision highp float;\r\n" +

   "varying vec2 vUV;\r\n" +

   "uniform color4 meshColor;\r\n"  +

   //"uniform sampler2D textureSampler;\r\n" +

   "void main(void) {\r\n" +
   "    gl_FragColor = meshColor; \r\n" +
   "}\r\n"

 
"#ifdef GL_ES \r\n" +
"precision highp float;\r\n" +
    "#endif \r\n" +

      "// Uniforms\r\n" +
   "uniform vec3 colorMesh;\r\n" +

"void main(void) {\r\n" +
    "vec3 color = vec3(0.4, 0.2, 1.0);\r\n" +
    "gl_FragColor = vec4(colorMesh, 1.0);\r\n" +
 "}\r\n"





/*
var entities = [
    {
        Id: "11",
        Name: "GUATAPE",
        StatusColor: "#00FF00",
        ParentId: "1",
        IsPlant: true,
        EntityType: 1
    },
    {
        Id: "12",
        Name: "TASAJERA",
        StatusColor: "#00FF00",
        ParentId: "1",
        IsPlant: true,
        EntityType: 1
    },
    {
        Id: "13",
        Name: "PORCE II",
        StatusColor: "#FF0000",
        ParentId: "1",
        IsPlant: true,
        EntityType: 1
    },
    {
        Id: "14",
        Name: "GUADALUPE III",
        StatusColor: "#00FF00",
        ParentId: "1",
        IsPlant: true,
        EntityType: 1
    },
    {
        Id: "111",
        Name: "MÁQUINA 1",
        ParentId: "11",
        EntityType: 2,
        Severity : 4
    },
    {
        Id: "112",
        Name: "MÁQUINA 2",
        ParentId: "11",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "113",
        Name: "MÁQUINA 3",
        ParentId: "11",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "114",
        Name: "MÁQUINA 4",
        ParentId: "11",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "115",
        Name: "MÁQUINA 5",
        ParentId: "11",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "116",
        Name: "MÁQUINA 6",
        ParentId: "11",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "117",
        Name: "MÁQUINA 7",
        StatusColor: "#00FF00",
        ParentId: "11",
        EntityType: 2,
        Severity: 3
    },
        {
            Id: "121",
            Name: "MÁQUINA 1",
            ParentId: "12",
            EntityType: 2,
            Severity: 4
        },
    {
        Id: "122",
        Name: "MÁQUINA 2",
        ParentId: "12",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "123",
        Name: "MÁQUINA 3",
        ParentId: "12",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "124",
        Name: "MÁQUINA 4",
        ParentId: "12",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "125",
        Name: "MÁQUINA 5",
        ParentId: "12",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "126",
        Name: "MÁQUINA 6",
        ParentId: "12",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "127",
        Name: "MÁQUINA 7",
        StatusColor: "#00FF00",
        ParentId: "12",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "131",
        Name: "MÁQUINA 1",
        ParentId: "13",
        EntityType: 2,
        Severity: 4
    },
    {
        Id: "132",
        Name: "MÁQUINA 2",
        ParentId: "13",
        EntityType: 2,
        Severity: 3
    }, {
        Id: "133",
        Name: "MÁQUINA 3",
        ParentId: "13",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "134",
        Name: "MÁQUINA 4",
        ParentId: "13",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "135",
        Name: "MÁQUINA 5",
        ParentId: "13",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "136",
        Name: "MÁQUINA 6",
        ParentId: "13",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "137",
        Name: "MÁQUINA 7",
        StatusColor: "#00FF00",
        ParentId: "13",
        EntityType: 2,
        Severity: 3
    },
    {
        Id: "138",
        Name: "MÁQUINA 8",
        ParentId: "13",
        EntityType: 2,
        Severity: 1
    }, {
        Id: "139",
        Name: "MÁQUINA 9",
        StatusColor: "#00FF00",
        ParentId: "13",
        EntityType: 2,
        Severity: 3
    },
    {
        Id: "141",
        Name: "MÁQUINA 1",
        ParentId: "14",
        EntityType: 2,
        Severity: 1
    },
    {
        Id: "142",
        Name: "MÁQUINA 2",
        ParentId: "14",
        EntityType: 2,
        Severity: 4
    }, {
        Id: "143",
        Name: "MÁQUINA 3",
        ParentId: "14",
        EntityType: 2,
        Severity: 4
    }
    
    {
        Id: "15",
        Name: "GUADALUPE IV",
        StatusColor: "#FFFF00",
        ParentId: "1",
        IsPlant: true
    },
    {
        Id: "16",
        Name: "PLAYAS",
        StatusColor: "#FFFF00",
        ParentId: "1",
        IsPlant: true
    },
    {
        Id: "17",
        Name: "TRONERAS",
        StatusColor: "#FF0000",
        ParentId: "1",
        IsPlant: true
    },
    {
        Id: "18",
        Name: "TERMOSIERRA",
        StatusColor: "#FF0000",
        ParentId: "1",
        IsPlant: true
    },
    {
        Id: "19",
        Name: "HERRADURA",
        StatusColor: "#FF0000",
        ParentId: "1",
        IsPlant: true
    },
    {
        Id: "20",
        Name: "LA VUELTA",
        StatusColor: "#FF0000",
        ParentId: "1",
        IsPlant: true
    },
    {
        Id: "21",
        Name: "PAJARITO",
        StatusColor: "#FF0000",
        ParentId: "1",
        IsPlant: true
    }
    
];
*/

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


/*
BABYLON.Effect.ShadersStore["custom1VertexShader"] = "\r\n" +
    "precision highp float;\r\n" +

   "// Attributes\r\n" +
   "attribute vec3 position;\r\n" +
   "attribute vec2 uv;\r\n" +

   "// Uniforms\r\n" +
   "uniform mat4 worldViewProjection;\r\n" +
   "uniform float time;\r\n"+

   "// Varying\r\n" +
   "varying vec2 vUV;\r\n" +

   "void main(void) {\r\n" +
   "    gl_Position = worldViewProjection * vec4(position, 1.0);\r\n" +
   "vec3 p = position;\r\n" +
   "p.x = p.x + sin(2.0 * position.y + time);\r\n" +
   "p.y = p.y + sin(time + 4.0);\r\n" +
   "gl_Position = worldViewProjection * vec4(p, 1.0);\r\n" +
   "    vUV = uv;\r\n" +
   "}\r\n";

BABYLON.Effect.ShadersStore["custom1FragmentShader"] = "\r\n" +
  /* "precision highp float;\r\n" +

   "varying vec2 vUV;\r\n" +

   "uniform color4 meshColor;\r\n"  +

   //"uniform sampler2D textureSampler;\r\n" +

   "void main(void) {\r\n" +
   "    gl_FragColor = meshColor; \r\n" +
   "}\r\n"

 
"#ifdef GL_ES \r\n" +
"precision highp float;\r\n" +
    "#endif \r\n" +

      "// Uniforms\r\n" +
   "uniform vec3 colorMesh;\r\n" +

"void main(void) {\r\n" +
    "vec3 color = vec3(0.4, 0.2, 1.0);\r\n" +
    "gl_FragColor = vec4(colorMesh, 1.0);\r\n" +
 "}\r\n"


*/