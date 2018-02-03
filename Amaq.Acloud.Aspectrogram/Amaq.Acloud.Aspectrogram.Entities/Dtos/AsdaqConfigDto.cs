namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using ValueObjects;
    using Amaq.Libraries.MongoRepository.Attributes;
    using MongoDB.Bson.Serialization.Attributes;
    using System.Collections.Generic;

    /// <summary>
    /// Representa un sistema Asdaq
    /// </summary>
    public class AsdaqConfigDto
    {
        /// <summary>
        /// Id del Asdaq
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Nombre con el cual se conoce a un Asdaq de manera nemotécnica
        /// </summary>
        public string Alias { get; set; }

        /// <summary>
        /// Si es true, indica que el Asdaq debe consultar nuevamente su configuración en el Acloud
        /// </summary>
        public bool Reconfigure { get; set; }

        /// <summary>
        /// Dispositivos NI registrados en el Asdaq
        /// </summary>
        public List<NiDeviceDto> NiDevices { get; set; }
        
        /// <summary>
        /// Measurement points asociados al Asdaq
        /// </summary>
        [IgnoreProperty]
        [BsonIgnore]
        public List<MdVariableExtension> RelatedMeasurementPoints { get; set; }

        /// <summary>
        /// Configuración de una cuenta de correo electrónico, necesaria en caso de que se requiera el envío de correos electrónicos
        /// por eventos disparados
        /// </summary>
        public MailAccountConfiguration MailAccountConfiguration { get; set; }

        /// <summary>
        /// Lista de dispositivos Aconditioners con relación a un Asdaq 
        /// </summary>
        public List<Aconditioner> Aconditioners { get; set; }
    }

    /// <summary>
    /// Representa un Chasis CompactDaq de National Instruments
    /// </summary>
    public class NiDeviceDto
    {
        /// <summary>
        /// Corresponde al DeviceID que expone NI como identificador del dispositivo
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Indica si el dispositivo es M Series, X Series, UsbDaq, CompactDaq, CSeriesModule, etc...
        /// </summary>
        public string ProductCategory { get; set; }        

        /// <summary>
        /// Frecuencia de muestreo
        /// </summary>
        public double SampleRate { get; set; }

        /// <summary>
        /// Número de muestras a leer por canal
        /// </summary>
        public int SamplesToRead { get; set; }

        /// <summary>
        /// Configuración de terminal differential, nrse, rse, pseudodifferential según el NiDevice
        /// </summary>
        public string TerminalConfiguration { get; set; }

        /// <summary>
        /// Lista filtrada de configuraciones de terminal compatibles con el NiDevice
        /// </summary>
        public List<string> CompatibleTerminalConfigurations { get; set; }

        /// <summary>
        /// Canales análogos de entrada del dispositivo
        /// </summary>
        public List<NiAiChannel> AiChannels { get; set; }

        /// <summary>
        /// Medidas National Instruments compatibles con el dispositivo
        /// </summary>
        public List<string> CompatibleMeasures { get; set; }

        /// <summary>
        /// Máxima corriente de excitación en Amperios (A) para sensores IEPE
        /// </summary>
        public double AICurrentExcitationValue { get; set; }

        /// <summary>
        /// Indica el nombre del producto de NI (NI9323, NI9234...)
        /// </summary>
        public string ProductType { get; set; }

        /// <summary>
        /// Rango de frecuencia en Hz
        /// </summary>
        public double FrecuencyRange { get; set; }

        /// <summary>
        /// Número de líneas para el espectro
        /// </summary>
        public double NumberOfLines { get; set; }

        /// <summary>
        /// Tiempo de muestro 
        /// </summary>
        public double SamplingTime { get; set; }

        /// <summary>
        /// Delta de frecuencia
        /// </summary>
        public double FrecuencyDelta { get; set; }
    }
}
