namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using System.Collections.Generic;
    using Enums;
    using Acloud.Entities.ValueObjects;
    using Acloud.Entities.Enums;

    /// <summary>
    /// Representa la información de un asset necesaria para mostrar al usuario cuando se listan o reproducen eventos grabados
    /// </summary>
    public class AssetInfo
    {
        /// <summary>
        /// Nombre del asset
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// Lista de puntos de medición
        /// </summary>
        public List<MeasurementPointInfo> MeasurementPoints { get; set; }
    }

    /// <summary>
    /// Representa la información de un punto de medición necesaria para mostrar al usuario cuando se reproducen eventos grabados
    /// </summary>
    public class MeasurementPointInfo
    {
        /// <summary>
        /// Nombre del measurementPoint
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// Lista de subVariables
        /// </summary>
        public List<SubVariableInfo> SubVariables { get; set; }
    }

    /// <summary>
    /// Representa la información de una subVariable necesaria para mostrar al usuario cuando se reproducen eventos grabados
    /// </summary>
    public class SubVariableInfo
    {
        /// <summary>
        /// Nombre de la subVariable
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Tipo de medida derivado de una señal
        /// </summary>
        public MeasureType MeasureType { get; set; }

        /// <summary>
        /// Tipo de valor de la Sub-Variable.
        /// </summary>
        public ValueType ValueType { get; set; }

        /// <summary>
        /// Tipo de dato de la propiedad Value, ya sea de su valor directo o en caso de ser un array DataType indica el tipo de dato de los elementos del array
        /// </summary>
        public AmaqDataType DataType { get; set; }

        /// <summary>
        /// Indica si la subVariable está establecida como el valor por defecto que se mostrará de la MdVariable
        /// </summary>
        public bool IsDefaultValue { get; set; }

        /// <summary>
        /// Listado de zonas, cada una con 1 o 2 umbrales(LowerThreshold y UpperThreshold)
        /// </summary>
        public List<Band> Bands { get; set; }

        /// <summary>
        /// Valor máximo para la subVariable
        /// </summary>
        public double Maximum { get; set; }

        /// <summary>
        /// Valor mínimo para la subVariable
        /// </summary>
        public double Minimum { get; set; }

        /// <summary>
        /// Unidad en la que se expresa el valor de la Sub-Variable.
        /// </summary>
        public string Units { get; set; }
    }
}
