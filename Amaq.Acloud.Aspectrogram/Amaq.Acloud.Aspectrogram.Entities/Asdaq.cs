namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Libraries.MongoDbRepository;
    using MongoDB.Bson.Serialization.Attributes;
    using System.Collections.Generic;
    using ValueObjects;

    /// <summary>
    /// Representa un canal análogo de entrada de un dispositivo NI
    /// </summary>
    public class NiAiChannel : AiChannelBase
    {
        /// <summary>
        ///  Configuración necesaria para la llamada dinámica a un método AiChannel de National Instruments
        /// </summary>
        [BsonIgnore]
        public AiMeasureMethod AiMeasureMethod { get; set; }
    }

    /// <summary>
    /// Representa un Chasis CompactDaq de National Instruments
    /// </summary>
    public class NiCompactDaq
    {
        /// <summary>
        /// Corresponde al DeviceID que expone NI como identificador del dispositivo
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// Módulos de la C Series instalados en el chasis
        /// </summary>
        public List<NiDevice> CSeriesModules { get; set; }
    }

    /// <summary>
    /// Representa un dispositivo NI como una entidad con propiedades necesarias para el sistema A-SPECTROGRAM
    /// </summary>
    public class NiDevice
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
        /// Indica si el NiDevice es el maestro en la estrategia de sincronización de dispositivos M Series(PCI)
        /// </summary>
        public bool IsMasterNiDevice { get; set; }

        /// <summary>
        /// Id del NiDevice maestro en la estrategia de sincronización de dispositivo s M Series(PCI)
        /// </summary>
        public string MasterNiDeviceName { get; set; }

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
        /// Canales digitales de salida(Relés) del dispositivo
        /// </summary>
        public List<string> DoChannels { get; set; }

        /// <summary>
        /// Medidas National Instruments compatibles con el dispositivo
        /// </summary>
        public List<string> CompatibleMeasures { get; set; }

        /// <summary>
        /// Indice o consecutivo de la tarea de national instruments desde la cual se van a adquirir señales para los canales 
        /// de un C Series Module de un chasis CompactDaq
        /// </summary>
        public int TaskIndex { get; set; }

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

    /// <summary>
    /// Representa un sistema Asdaq
    /// </summary>
    public class Asdaq : Entity
    {
        /// <summary>
        /// Nombre con el cual se conoce a un Asdaq de manera nemotécnica
        /// </summary>
        public string Alias { get; set; }

        /// <summary>
        /// Si es true, indica que el Asdaq debe consultar nuevamente su configuración en el Acloud
        /// </summary>
        public bool Reconfigure { get; set; }

        /// <summary>
        /// Configuración de una cuenta de correo electrónico, necesaria en caso de que se requiera el envío de correos electrónicos
        /// por eventos disparados
        /// </summary>
        public MailAccountConfiguration MailAccountConfiguration { get; set; }

        /// <summary>
        /// Dispositivos NI registrados en el Asdaq
        /// </summary>
        public List<NiDevice> NiDevices { get; set; }

        /// <summary>
        /// Chasis CompactDaq NI registrados en el Asdaq
        /// </summary>
        public List<NiCompactDaq> NiCompactDaqs { get; set; }

        /// <summary>
        /// Lista de id de subVariable y estampa de tiempo que representan solicitudes de subVariables en tiempo real desde los navegadores (Clientes)
        /// </summary>
        public List<RealTimeRequest> RealTimeRequests { get; set; }

        /// <summary>
        /// Lista de id de subVariables a las cuales se les ha realizado cambios considerables para que el asdaq los tome dinamicamente.
        /// Por ejemplo dos cambios muy importantes son ajuste de medida y bandas
        /// </summary>
        public List<ChangeRequest> SubVariableChangeRequests { get; set; }

        /// <summary>
        /// Lista de id de assets a los cuales se les ha realizado cambios considerables para que el asdaq los tome dinamicamente.
        /// Por ejemplo cambios en la configuración de los eventos y cambios de NormalInterval para histórico
        /// </summary>
        public List<ChangeRequest> AssetChangeRequests { get; set; }

        /// <summary>
        /// Measurement points asociados al Asdaq
        /// </summary>
        [Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public List<MdVariableExtension> RelatedMeasurementPoints { get; set; }

        /// <summary>
        /// Assets principales asociados al Asdaq. Son los que poseen la configuración de eventos
        /// </summary>
        [Libraries.MongoRepository.Attributes.IgnoreProperty]
        [BsonIgnore]
        public List<AssetExtension> RelatedPrincipalAssets { get; set; }

        /// <summary>
        /// Lista de dispositivos Aconditioners con relación a un Asdaq 
        /// </summary>
        public List<Aconditioner> Aconditioners { get; set; }
    }

    /// <summary>
    /// Representa un canal con relación a un Asdaq
    /// </summary>
    public class Channel
    {
        /// <summary>
        /// Numero de un canal asociado a un Asdaq
        /// </summary>
        public int Number { get; set; }
        
        /// <summary>
        /// Ganancia de un canal con relación a un Asdaq
        /// </summary>
        public double Gain { get; set; }
        
        /// <summary>
        /// Desplazamiento de un canal con relacion a un Asdaq
        /// </summary>
        public double Displacement { get; set; }
    }
}
