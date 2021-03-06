﻿Number.prototype.padLeft = function (base, chr) {
    var len = (String(base || 10).length - String(this).length) + 1;
    return len > 0 ? new Array(len).join(chr || '0') + this : this;
}
// usage
//=> 3..padLeft() => '03'
//=> 3..padLeft(100,'-') => '--3' 

String.prototype.JsFormat = function () {
    //var s = arguments[0];
    //for (var i = 0; i < arguments.length - 1; i++) {
    //    var reg = new RegExp("\\{" + i + "\\}", "gm");
    //    s = s.replace(reg, arguments[i + 1]);
    //}
    //return s;
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
    });
};

$.fn.size = function () {
    return this.length;
};

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};

Array.prototype.pushArray = function (arr) {
    this.push.apply(this, arr);
};

Array.prototype.isArray = function (obj) {
    return !!obj && obj.constructor === Array;
};

Array.prototype.range = function (start, count) {
    return Array.apply(0, Array(count)).map(function (element, index) {
        return index + start;
    });
};

Array.prototype.clean = function () {
    var
        i;

    for (i = 0; i < this.length; i += 1) {
        if (this[i] == undefined) {
            this.splice(i, 1);
            i -= 1;
        }
    }
    return this;
};

var arrayColumn = (arr, n) => arr.map(x => x[n]);

function xyOnArc(cx, cy, radius, radianAngle) {
    var x = cx + radius * Math.cos(radianAngle);
    var y = cy + radius * Math.sin(radianAngle);
    return ({
        x: x,
        y: y
    });
}

Date.prototype.toLocal = function () {
    var
        d,
        offset;

    d = this;
    offset = d.getTimezoneOffset() / 60;
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDay(), d.getUTCHours() - offset, d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
};

function deg2Rad(degrees) {
    return degrees * Math.PI / 180;
}

function clone(obj) {
    var
        copy,
        attr;

    if (null == obj || "object" != typeof obj) {
        return obj;
    }
    copy = obj.constructor();
    for (attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            copy[attr] = obj[attr];
        }
    }
    return copy;
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

String.prototype.toMMSS = function () {
    var a = parseInt(this, 10),
        b = Math.floor(a / 3600),
        c = Math.floor((a - 3600 * b) / 60),
        d = a - 3600 * b - 60 * c;

    return c += 60 * b, c < 10 && (c = "0" + c), d < 10 && (d = "0" + d), c + ":" + d
};

String.prototype.capitalizeFirstLetter = function () { return this.charAt(0).toUpperCase() + this.slice(1) };

String.prototype.isEmpty = function () {
    return (this.length === 0 || !this.trim());
};

function isDate(val) {
    var d = new Date(val);
    return !isNaN(d.valueOf());
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var isEmpty = function (obj) {
    var
        key;

    // Valor nulo o indefinido corresponde a un valor "empty"
    if (obj == null) {
        return true;
    }

    // Si el objeto posse una longitud mayor a cero, es un valor no "empty"
    if (obj.length > 0) {
        return false;
    }
    if (obj.length === 0) {
        return true;
    }

    // En este punto deberia ser un objeto de tipo "object", caso no sea, corresponde a un valor "empty"
    if (typeof obj !== "object") {
        return true;
    }

    for (key in obj) {
        if (hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}

var JsonToCSVConvert = function (JSONData, ReportTitle, ShowLabel, labels) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    var CSV = '';
    //Set Report title in first row or line

    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";

        //This loop will extract the label from 1st index of on array
        //for (var index in arrData[0]) {
        //    //Now convert each value to string and comma-seprated
        //    row += index + ';';
        //}

        // Obtenemos en una fila los headers
        for (var x = 0; x < labels.length; x++) {
            row += labels[x] + ';';
        }

        row = row.slice(0, -1);

        //append Label row with line break
        CSV += row + '\r\n';
    }

    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";

        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '";';
        }

        row.slice(0, row.length - 1);

        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }

    var blob = new Blob([CSV], { type: "application/csv;charset=utf-8;" });
    saveAs(blob, ReportTitle + ".csv");

    ////Generate a file name
    //var fileName = "Report_";
    ////this will remove the blank-spaces from the title and replace it with an underscore
    //fileName += ReportTitle.replace(/ /g, "_");

    ////Initialize file format you want csv or xls
    //var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    //// Now the little tricky part.
    //// you can use either>> window.open(uri);
    //// but this will not work in some browsers
    //// or you will not get the correct file extension    

    ////this trick will generate a temp <a /> tag
    //var link = document.createElement("a");
    //link.href = uri;
    //link.target = "_blank";
    ////set the visibility hidden so it will not effect on your web-layout
    //link.style = "visibility:hidden";
    //link.download = fileName + ".csv";

    ////this part will append the anchor tag and remove it after automatic click
    //document.body.appendChild(link);
    //link.click();
    //document.body.removeChild(link);
};

var tableToExcel = (function () {
    var uri = 'data:application/vnd.ms-excel;base64,'
      , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>'
      , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
      , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
    return function (table, name) {
        if (!table.nodeType) table = document.getElementById(table)
        var ctx = { worksheet: name || 'Worksheet', table: table.innerHTML }
        document.getElementById("dlink" + name).href = uri + base64(format(template, ctx));
        document.getElementById("dlink" + name).download = name + '.xls';
        document.getElementById("dlink" + name).click();
        //window.open( uri + base64(format(template, ctx)))
    }
})();

/*
* @param {string} wId: Id el Widget
* @param {string} name: Nombre del chart
* @param {array} labels: Nombre de los Ejes X y Y
* @param {array} data: Datos para crear la tabla
* @param {bool} flagTrend: Bandera para saber si es tendencia
*/
var createTableToExcel = function (contParentId, contId, name, labels, data, flagTrend) {

    var strTd, strTh, dataNum;

    $("#" + contId).remove();

    $(contParentId).append('<a id="dlink' + name + '"  style="display:none;"></a>');
    $(contParentId).append('<table id="' + contId + '" style="display:none; text-align:center;">' +
        '<caption><b>' + name + '</b></caption>' +
        '<colgroup align="center" span="' + data[0].length + '"></colgroup>' +
        '<thead></thead><tbody></tbody></table>');

    strTh = '';
    for (var i = 0; i < labels.length; i++) {
        strTh = strTh.concat('<th>' + labels[i] + '</th>');
    }
    $("#" + contId + " > thead").append('<tr>' + strTh + '</tr>');

    for (var i = 0; i < data.length; i++) {
        strTd = '';
        for (var j = 0; j < data[0].length; j++) {
            if (data[i][0] !== undefined) {
                if (data[i][j] !== null) {

                    if (isNumeric(data[i][j])) {
                        dataNum = data[i][j];
                        dataNum = dataNum.toFixed(4);
                        dataNum = dataNum.replace('.', ',')
                    }
                    else if (!isNumeric(data[i][j]) && isDate(data[i][j])) {
                        dataNum = data[i][j];
                        dataNum = dataNum.toLocaleDateString() + " " + dataNum.toTimeString().split("GMT")[0];

                    }
                    else {
                        dataNum = data[i][j];

                    }
                    strTd = strTd.concat('<td>' + dataNum + '</td>');
                } else {
                    strTd = strTd.concat('<td>' + 0 + '</td>');
                }
            }
        }
        $("#" + contId + " > tbody").append('<tr>' + strTd + '</tr>');
    }
};

/* 
   Redimensiona el alto del EjDialog para evitar espacios vacios en el y aparezca el scroll cuando sea necesario
   @param {string} id: Id del ejDialog
   @param {int} heightWindow: Alto original de la ventana de window
*/
function autoHeightEjDialog(id, heightWindow) {
    var _height = $(id).parent().height();
    var container = $(id + " > div:eq(0)").height() + 50;
    $(id).data("ejDialog").option({ height: container + "px", allowScrolling: true, scrollSettings: { height: _height } });
    $(id).ejDialog("refresh");
}