namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    using Enums;
    using MongoDB.Bson;
    using MongoDB.Bson.Serialization.Attributes;

    /// <summary>
    /// Diferentes opciones exclusivas para la visualizacion de la posicion del eje
    /// </summary>
    public class SclOptions
    {
        /// <summary>
        /// Valor de clearance en X
        /// </summary>
        public double XClearance { get; set; }
        /// <summary>
        /// Valor de clearance en Y
        /// </summary>
        public double YClearance { get; set; }

        /// <summary>
        /// Referencia de Gap con el que se galga el sensor en X o la que configure el usuario
        /// </summary>
        public double XGapReference { get; set; }

        /// <summary>
        /// Referencia de Gap con el que se galga el sensor en Y o la que configure el usuario
        /// </summary>
        public double YGapReference { get; set; }

        /// <summary>
        /// Posicion inicial de graficacion del clearance
        /// </summary>
        [BsonRepresentation(BsonType.String)]
        public ClearanceStartingPoint StartingPoint { get; set; }
    }
}
