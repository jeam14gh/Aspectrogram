/*
 * measuresSystem.js
 * 
 * @author Jhon Esneider Alvarez M
 */

var MeasuresSystem = {};

MeasuresSystem = (function () {
    "use strict";
    var
            // Auto-referencia a la clase MeasurementPointAdmin
            _this;

    _this = this;  

    /* Constructor */
    MeasuresSystem = function () {
        this.Measures = [
            {
                Text: "Métrico",
                Value: 1,
            },
            {
                Text: "Inglés",//Imperial
                Value: 2,
            },
            {
                Text: "Ambos",
                Value: 3,
            },
        ];

        this.TurningVelocityUnits = [
            {
                Text: "Rpm",
                Value: 4,
            },
            {
                Text: "Cps",
                Value: 3,
            },
            {
                Text: "Cpm",
                Value: 0,
            },
        ];

        this.Displacement = [
            {
                Text: "mm",
                MeasureId: 1,
                Value: "mm"
            },
            {
                Text: "um",
                MeasureId: 1,
                Value: "um"
            },
            {
                Text: "in",
                MeasureId: 2,
                Value: "in"
            },
            {
                Text: "mil",
                MeasureId: 2,
                Value: "mil"
            },
            {
                Text: "mil",
                MeasureId: 3,
                Value: "mil"
            },
            {
                Text: "mm",
                MeasureId: 3,
                Value: "mm"
            },
            {
                Text: "um",
                MeasureId: 3,
                Value: "um"
            },
            {
                Text: "in",
                MeasureId: 3,
                Value: "in"
            },            
        ];

        this.Velocity = [
            {
                Text: "mm/s",
                MeasureId: 1,
                Value: "mm/s"
            },
            {
                Text: "in/s",
                MeasureId: 2,
                Value: "in/s"
            },
            {
                Text: "in/s",
                MeasureId: 3,
                Value: "in/s"
            },
            {
                Text: "mm/s",
                MeasureId: 3,
                Value: "mm/s"
            },
        ];

        this.Acceleration = [
            {
                Text: "g",
                MeasureId: 1,
                Value: "g"
            },
            {
                Text: "mg",
                MeasureId: 1,
                Value: "mg"
            },
            {
                Text: "m/s^2",
                MeasureId: 1,
                Value: "m/s^2"
            },
            {
                Text: "mm/s^2",
                MeasureId: 1,
                Value: "mm/s^2"
            },
            {
                Text: "g",
                MeasureId: 2,
                Value: "g"
            },
            {
                Text: "mg",
                MeasureId: 2,
                Value: "mg"
            },
            {
                Text: "g",
                MeasureId: 3,
                Value: "g"
            },
            {
                Text: "mg",
                MeasureId: 3,
                Value: "mg"
            },
            {
                Text: "m/s^2",
                MeasureId: 3,
                Value: "m/s^2"
            },
            {
                Text: "mm/s^2",
                MeasureId: 3,
                Value: "mm/s^2"
            },
        ];

        this.RangesHz = [
            {
                Text: "Auto",
                Value: 0,
            },
            {
                Text: 500,
                Value: 1,
            },
            {
                Text: 1000,
                Value: 2,
            },
            {
                Text: 8000,
                Value: 3,
            },
            {
                Text: 10000,
                Value: 4,
            },
            {
                Text: "Otro",
                Value: 5,
            },
        ];

        this.RangesCpm = [
            {
                Text: "Auto",
                Value: 0,
            },
            {
                Text: 30000,
                Value: 1,
            },
            {
                Text: 60000,
                Value: 2,
            },
            {
                Text: 480000,
                Value: 3,
            },
            {
                Text: 600000,
                Value: 4,
            },
            {
                Text: "Otro",
                Value: 5,
            },
        ];

        this.DefaultCursor = [
            {
                Text: "Normal",
                Value: "Normal",
            },
            {
                Text: "Armónico",
                Value: "Armónico",
            },
            {
                Text: "Bandeamiento",
                Value: "Bandeamiento",
            },
            {
                Text: "Ninguno",
                Value: "Ninguno",
            },
        ];
    };

    return MeasuresSystem;
})();