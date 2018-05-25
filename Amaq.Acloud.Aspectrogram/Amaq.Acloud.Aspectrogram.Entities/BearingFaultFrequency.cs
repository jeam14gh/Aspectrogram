using Amaq.Libraries.MongoDbRepository;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

/// <summary>
/// Frecuencia de falla del rodamiento
/// </summary>
public class BearingFaultFrequency : Entity
{
    /// <summary>
    /// Marca del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "Marca")]
    public string Mark { get; set; }

    /// <summary>
    /// Referencia del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "Referencia")]
    public string Reference { get; set; }

    /// <summary>
    /// Número de bolas del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "NBolas")]
    public int NumberOfBalls { get; set; }

    /// <summary>
    /// FC, Frecuencia fundamental del tren
    /// </summary>
    //[JsonProperty(PropertyName = "FC")]
    public double FundamentalTrainFrequency { get; set; }

    /// <summary>
    /// FB, Frecuencia de giro de la bola
    /// </summary>
    //[JsonProperty(PropertyName = "FB")]
    public double BallSpinFrequency { get; set; }

    /// <summary>
    /// FO, Frecuencia del exterior del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "FO")]
    public double FrequencyOuter { get; set; }

    /// <summary>
    /// FI, Frecuencia del interior del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "FI")]
    public double FrequencyInner { get; set; }

    /// <summary>
    /// Diámetro de paso del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "DPitch")]
    [BsonIgnoreIfDefault]
    public double PitchDiameter { get; set; }

    /// <summary>
    /// Diámetro de las bolas del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "DBolas")]
    [BsonIgnoreIfDefault]
    public double BallsDiameter { get; set; }

    /// <summary>
    /// Tetha del rodamiento
    /// </summary>
    //[JsonProperty(PropertyName = "Tetha")]
    [BsonIgnoreIfDefault]
    public double ContactAngle { get; set; }
}
