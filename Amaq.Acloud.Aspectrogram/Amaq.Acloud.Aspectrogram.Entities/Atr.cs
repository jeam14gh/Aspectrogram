namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Libraries.MongoDbRepository;
    using System.Collections.Generic;
    using Enums;
    using ValueObjects;

    /// <summary>
    /// Representa un canal análogo de entrada de un dispositivo Atransmiter
    /// </summary>
    public class AtrAiChannel : AiChannelBase
    { 
    }

    /// <summary>
    /// Representa un módulo de un dispositivo Atransmiter
    /// </summary>
    public class AtrModule
    {
        /// <summary>
        /// Nombre con el cual se conoce a un AtrModule de manera nemotécnica
        /// </summary>
        public string Alias { get; set; }
        /// <summary>
        /// Descripción del dispositivo Atransmitter
        /// </summary>
        public string Description { get; set; }
        /// <summary>
        /// Serial único del dispositivo Atransmitter
        /// </summary>
        public string Serial { get; set; }
        /// <summary>
        /// Indicador de la posición del módulo en el bus de comunicación
        /// </summary>
        public int Slot { get; set; }
        /// <summary>
        /// Tipo de módulo
        /// </summary>
        public AtrModuleType ModuleType { get; set; }
        /// <summary>
        /// Frecuencia en segundos de la subida de datos globales en tiempo real
        /// </summary>
        public int GlobalFrequency { get; set; }
        /// <summary>
        /// Frecuencia en segundos de la subida de señales en tiempo real
        /// </summary>
        public int StreamFrequency { get; set; }
        /// <summary>
        /// Frecuencia de muestreo
        /// </summary>
        public double SampleRate { get; set; }
        /// <summary>
        /// Número de muestras a leer por canal
        /// </summary>
        public int SamplesToRead { get; set; }
        /// <summary>
        /// Canales análogos de entrada del dispositivo
        /// </summary>
        public List<AtrAiChannel> AiChannels { get; set; }
    }

    /// <summary>
    /// Representa un sistema Atransmiter
    /// </summary>
    public class Atr : Entity
    {
        /// <summary>
        /// Nombre con el cual se conoce a un Atransmitter de manera nemotécnica
        /// </summary>
        public string Alias { get; set; }
        /// <summary>
        /// Descripción del dispositivo Atransmitter
        /// </summary>
        public string Description { get; set; }
        /// <summary>
        /// Serial único del dispositivo Atransmitter
        /// </summary>
        public string Serial { get; set; }
        /// <summary>
        /// Dirección Ip o nombre del host
        /// </summary>
        public string Host { get; set; }
        /// <summary>
        /// Si es true, indica que el dispositivo Atransmiter debe consultar nuevamente su configuración en el Acloud
        /// </summary>
        public bool Reconfigure { get; set; }
        /// <summary>
        /// Módulos instalados fisicamente
        /// </summary>
        public List<AtrModule> Modules { get; set; }

        /// <summary>
        /// Lista de id de subVariable y estampa de tiempo que representan solicitudes de subVariables en tiempo real desde los navegadores (Clientes)
        /// </summary>
        public List<RealTimeRequest> RealTimeRequests { get; set; }
    }
}
