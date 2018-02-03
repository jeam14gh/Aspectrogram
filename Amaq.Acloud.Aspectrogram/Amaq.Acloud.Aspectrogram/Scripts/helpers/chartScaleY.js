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
            // Array de objetos que contienen los diferentes valores que corresponden al
            // maximo valor en Y para cada uno de los graficos
            _maximumYValues;

        _this = this;
        _maximumYValues = [];

        /*
         * Agregar un grafico con el respectivo tipo de sensor para realizar escala en Y segun el maximo valor
         * @param {String} graphType Cadena de texto que identifica el tipo de grafica que se desea agregar
         * @param {Integer} widgetId Identificacion del Widget que 
         * @param {Integer} sensorCode Tipo de sensor ligado a la grafica
         * @param {Double} largestY Valor maximo en Y del grafico que se desea agregar
         */
        this.AttachGraph = function (graphType, widgetId, sensorCode, largestY) {
            Concurrent.Thread.create(function (graphType, widgetId, sensorCode, largestY, maximumYValues) {
                var
                    dataToPublish,
                    currentWidget,
                    largest;

                if (!maximumYValues[graphType]) {
                    maximumYValues[graphType] = [];
                }

                if (!maximumYValues[graphType][sensorCode]) {
                    maximumYValues[graphType][sensorCode] = [];
                }

                maximumYValues[graphType][sensorCode][widgetId] = largestY;
                dataToPublish = [];
                largest = 0;
                for (currentWidget in maximumYValues[graphType][sensorCode]) {
                    if (maximumYValues[graphType][sensorCode][currentWidget] > largest) {
                        largest = maximumYValues[graphType][sensorCode][currentWidget];
                    }
                }
                dataToPublish[sensorCode] = largest;
                PublisherSubscriber.publish("/scale/" + graphType, dataToPublish);
            }, graphType, widgetId, sensorCode, largestY, _maximumYValues);
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
                    dataToPublish,
                    currentWidget,
                    largest;

                delete maximumYValues[graphType][sensorCode][widgetId];
                dataToPublish = [];
                largest = 0;
                for (currentWidget in maximumYValues[graphType][sensorCode]) {
                    if (maximumYValues[graphType][sensorCode][currentWidget] > largest) {
                        largest = maximumYValues[graphType][sensorCode][currentWidget];
                    }
                }
                dataToPublish[sensorCode] = largest;
                PublisherSubscriber.publish("/scale/" + graphType, dataToPublish);
            }, graphType, widgetId, sensorCode, _maximumYValues);
        };
    };

    return ChartScaleY;
})();