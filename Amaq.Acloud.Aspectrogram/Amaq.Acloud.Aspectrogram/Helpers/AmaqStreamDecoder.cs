namespace Amaq.Acloud.Aspectrogram.Helpers
{
    using Entities.Enums;
    using Models;
    using System;
    using System.IO;
    using System.Collections.Generic;

    /// <summary>
    /// Representa un decodificador Amaq Stream de cierta información como señales, posiciones de keyphasor y valores globales derivados de señal.
    /// Amaq Stream es un formato estandar de Amaq para la interoperabilidad en la comunicación de señales, keyphasor y valores globales entre diferentes sistemas
    /// </summary>
    public static class AmaqStreamDecoder
    {
        private const byte SIGNAL_VERSION = 1; // Versión actual del stream para señales
        private const byte SPECTRUM_VERSION = 2; // Versión actual del stream para espectros

        /// <summary>
        /// Decodifica los bytes crudos que representan un Amaq Stream de señal y los convierte a un objeto de tipo AmaqStreamSignal
        /// </summary>
        /// <param name="rawAmaqStreamSignal">Bytes crudos que representan un Amaq Stream de señal</param>
        public static AmaqStreamSignal Decode(byte[] rawAmaqStreamSignal)
        {
            var binaryReader = new BinaryReader(new MemoryStream(rawAmaqStreamSignal));

            binaryReader.ReadByte(); // Versión señal

            var streamType = (StreamType)binaryReader.ReadByte(); // Tipo stream

            if (streamType != StreamType.Signal)
                throw new Exception("El parametro rawAmaqStreamSignal no es un stream de tipo StreamType.Signal");

            var signalDataType = (AmaqDataType)binaryReader.ReadByte(); // Tipo de los datos de la señal
            var id = new Guid(binaryReader.ReadBytes(16)).ToString(); // MdVariableId. No se usa actualmente
            binaryReader.ReadDouble(); // Estampa de tiempo. No se usa actualmente
            binaryReader.ReadByte(); // Cantidad de valores globales. No se usa actualmente
            var signalScaleFactor = binaryReader.ReadInt32(); // Factor de escala de la señal
            var signalAveraging = binaryReader.ReadDouble(); // Promedio de la señal
            var signalLength = binaryReader.ReadInt32(); // Longitud de la señal
            binaryReader.ReadByte(); // Dimensión del array de señales. No se usa actualmente, por lo que solo estamos trabajando con los datos en Y de la señal
            var sampleTime = binaryReader.ReadDouble(); // Tiempo total de la señal
            var keyphasorPositionsLength = binaryReader.ReadUInt32(); // Longitud del vector de posiciones de keyphasor

            var signalData = new List<XYData>();

            switch (signalDataType)
            {
                case AmaqDataType.Double:
                    for (int i = 0; i < signalLength; i++)
                        signalData.Add(new XYData(0, binaryReader.ReadDouble()));

                    break;
                default:
                    throw new NotImplementedException();
            }

            var keyphasorPositions = new List<uint>();
            
            for (int i = 0; i < keyphasorPositionsLength; i++)
                keyphasorPositions.Add(binaryReader.ReadUInt32());

            return new AmaqStreamSignal(signalData, sampleTime, keyphasorPositions);
        }
    }
}
