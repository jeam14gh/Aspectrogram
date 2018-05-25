/*
 * subVariables.js
 * @author Jhon Esneider Alvarez M
 */

var SubVariables = {};

SubVariables = (function () {
    "use strict";
    var
            // Auto-referencia a la clase SubVariables
            _this;

    _this = this;

    /* Constructor */
    SubVariables = function (id) {
        this.Directa = {
            Id: id,
            ParentId: "",
            Name: "Directa",
            Description: "Directa",
            ValueType: 1,
            Value: null,
            Units: null,
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: true,
            MeasureType: 0,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Amplitud1x = {
            Id: id,
            ParentId: "",
            Name: "Amplitud 1X",
            Description: "Amplitud 1X",
            ValueType: 1,
            Value: null,
            Units: null,
            Status: [arrayObjectStatus[0].Id],
            Bands: null,
            Maximum: 1000.0,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 4,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Fase1x = {
            Id: id,
            ParentId: "",
            Name: "Fase 1X",
            Description: "Fase 1X",
            ValueType: 1,
            Value: null,
            Units: "°",
            Status: [arrayObjectStatus[0].Id],
            Bands: null,
            Maximum: 360.0,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 6,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.WaveForm = {
            Id: id,
            ParentId: "",
            Name: "Forma de onda",
            Description: "Forma de onda",
            ValueType: 3,
            Value: null,
            Units: null,
            Bands: null,
            IsDefaultValue: false,
            MeasureType: null,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Original = {
            Id: id,
            ParentId: "",
            Name: "Original",
            Description: "Original",
            ValueType: 1,
            Value: null,
            Units: null,
            Bands: null,
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
            isOriginal: true,
        };

        this.Gap = {
            Id: id,
            ParentId: "",
            Name: "GAP",
            Description: "GAP",
            ValueType: 1,
            Value: null,
            Units: "V",
            Status: [arrayObjectStatus[0].Id],
            Bands: null,
            Maximum: -3.0,
            Minimum: -18.0,
            IsDefaultValue: false,
            MeasureType: 7,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Pulsos = {
            Id: id,
            ParentId: "",
            Name: "Pulsos",
            Description: "Pulsos",
            ValueType: 5,
            Value: null,
            Units: null,
            Status: [arrayObjectStatus[0].Id],
            Bands: null,
            Maximum: 0.0,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 0,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Resistencia = {
            Id: id,
            ParentId: "",
            Name: "Resistencia",
            Description: "Resistencia",
            ValueType: 1,
            Value: null,
            Units: "Ω", //"&#8486;",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: true,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Inductancia = {
            Id: id,
            ParentId: "",
            Name: "Inductancia",
            Description: "Inductancia",
            ValueType: 1,
            Value: null,
            Units: "mH",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.Capacitancia = {
            Id: id,
            ParentId: "",
            Name: "Capacitancia",
            Description: "Capacitancia",
            ValueType: 1,
            Value: null,
            Units: "uF",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.VoltajeCampo = {
            Id: id,
            ParentId: "",
            Name: "Voltaje Campo",
            Description: "Voltaje Campo",
            ValueType: 1,
            Value: null,
            Units: "V",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.CorrienteCampo = {
            Id: id,
            ParentId: "",
            Name: "Corriente Campo",
            Description: "Corriente Campo",
            ValueType: 1,
            Value: null,
            Units: "A",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.DCFugasTierra = {
            Id: id,
            ParentId: "",
            Name: "DC Fugas Tierra",
            Description: "DC Fugas Tierra",
            ValueType: 1,
            Value: null,
            Units: "V",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };

        this.AmpFugasTierra = {
            Id: id,
            ParentId: "",
            Name: "Amp Fugas Tierra",
            Description: "Amp Fugas Tierra",
            ValueType: 1,
            Value: null,
            Units: "V",
            Bands: [],
            Maximum: 1,
            Minimum: 0.0,
            IsDefaultValue: false,
            MeasureType: 1,
            FromIntegratedWaveform: 0,
            ThresholdLatency: 0,
            InitialAxialPosition: 0,
            DeadBand: 0,
        };
    };

    return SubVariables;
})();