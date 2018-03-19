/*
 * chartScaleY.js
 * Jorge Calderon (2017)
 * AMAQ S.A.
 */

var ChartScaleY = {};

ChartScaleY = (function () {
    "use strict";

    ChartScaleY = function () {
        var
            // Auto-referencia a la clase ChartScaleY
            _this,
            // Array de objetos que contienen los diferentes valores que corresponden a los
            // valores minimos y maximos en Y para cada uno de los graficos
            _maximumYValues;

        _this = this;
        _maximumYValues = [];

        /*
         * Agregar un grafico con el respectivo tipo de sensor para realizar escala en Y segun el maximo valor
         * @param {String} graphType Cadena de texto que identifica el tipo de grafica que se desea agregar
         * @param {Integer} widgetId Identificacion del Widget que 
         * @param {Integer} sensorCode Tipo de sensor ligado a la grafica
         * @param {Double} minY Valor minimo en Y del grafico que se desea agregar
         * @param {Double} maxY Valor maximo en Y del grafico que se desea agregar
         */
        this.AttachGraph = function (graphType, widgetId, sensorCode, minY, maxY) {
            Concurrent.Thread.create(function (graphType, widgetId, sensorCode, minY, maxY, maximumYValues) {
                var
                    // Listado de objetos widgets de cada una de las graficas abiertas del mismo tipo de sensor
                    widgetObjList,
                    // Array de valores maximos y minimos de todas las graficas del mismo tipo de sensor
                    minMaxArray,
                    // Contador
                    i,
                    // Informacion de valores maximos y minimos de las graficas abiertas del mismo tipo de sensor
                    dataToPublish;

                if (!maximumYValues[graphType]) {
                    maximumYValues[graphType] = [];
                }
                if (!maximumYValues[graphType][sensorCode]) {
                    maximumYValues[graphType][sensorCode] = [];
                }
                maximumYValues[graphType][sensorCode][widgetId] = [minY, maxY];
                widgetObjList = maximumYValues[graphType][sensorCode];
                minMaxArray = [];
                for (i = 0; i < Object.keys(widgetObjList).length; i += 1) {
                    minMaxArray.push(widgetObjList[Object.keys(widgetObjList)[i]]);
                }
                dataToPublish = [];
                dataToPublish[sensorCode] = [arrayColumn(minMaxArray, 0).min(), arrayColumn(minMaxArray, 1).max()];
                PublisherSubscriber.publish("/scale/" + graphType, dataToPublish);
            }, graphType, widgetId, sensorCode, minY, maxY, _maximumYValues);
        };

        /*
         * Remover un grafico con el respectivo tipo de sensor para realizar escala en Y segun el maximo valor
         * @param {String} graphType Cadena de texto que identifica el tipo de grafica que se desea agregar
         * @param {Integer} widgetId Identificacion del Widget que 
         * @param {Integer} sensorCode Tipo de sensor ligado a la grafica
         */
        this.DetachGraph = function (graphType, widgetId, sensorCode) {
            Concurrent.Thread.create(function (graphType, widgetId, sensorCode, maximumYValues) {
                var
                    // Listado de objetos widgets de cada una de las graficas abiertas del mismo tipo de sensor
                    widgetObjList,
                    // Array de valores maximos y minimos de todas las graficas del mismo tipo de sensor
                    minMaxArray,
                    // Contador
                    i,
                    // Informacion de valores maximos y minimos de las graficas abiertas del mismo tipo de sensor
                    dataToPublish;

                if (maximumYValues[graphType]) {
                    widgetObjList = maximumYValues[graphType][sensorCode];
                    // Borramos el objeto widget de la lista de objetos
                    delete widgetObjList[widgetId];
                    minMaxArray = [];
                    for (i = 0; i < Object.keys(widgetObjList).length; i += 1) {
                        minMaxArray.push(widgetObjList[Object.keys(widgetObjList)[i]]);
                    }
                    largest = 0;
                    for (currentWidget in maximumYValues[graphType][sensorCode]) {
                        if (maximumYValues[graphType][sensorCode][currentWidget] > largest) {
                            largest = maximumYValues[graphType][sensorCode][currentWidget];
                        }
                    }
                    dataToPublish = [];
                    dataToPublish[sensorCode] = [arrayColumn(minMaxArray, 0).min(), arrayColumn(minMaxArray, 1).max()];
                    PublisherSubscriber.publish("/scale/" + graphType, dataToPublish);
                }
            }, graphType, widgetId, sensorCode, _maximumYValues);
        };
    };

    return ChartScaleY;
})();