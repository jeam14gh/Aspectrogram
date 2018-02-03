/*
 * rtdCoefficient.js
 * 
 * @author Jhon Esneider Alvarez M
 */

var RTDCoefficient = {};

RTDCoefficient = (function () {
    "use strict";
    var
            // Auto-referencia a la clase MeasurementPointAdmin
            _this;

    _this = this;

    /* Constructor */
    RTDCoefficient = function () {
        this.Materials = [
            {
                Name: "Cobre",
                Code: 1,
            },
            {
                Name: "Niquel",
                Code: 2,
            },
            {
                Name: "Platino",
                Code: 3,
            },
        ];

        this.Coefficients = [
            {
                Name: 0.00427,
                Code: 1,
                Value: 0.00427
            },
            {
                Name: 0.00672,
                Code: 2,
                Value: 0.00672
            },
            {
                Name: 0.00385,
                Code: 3,
                Value: 0.00385
            },
            {
                Name: 0.003902,
                Code: 3,
                Value: 0.003902
            },
        ]
    };

    return RTDCoefficient;
})();
