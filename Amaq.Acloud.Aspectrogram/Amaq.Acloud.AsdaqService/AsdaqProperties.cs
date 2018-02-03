namespace Amaq.Acloud.AsdaqService
{
    using System.Configuration;
    using System.Collections.Generic;
    using Aspectrogram.Entities;
    using CrossCutting.Helpers;

    /// <summary>
    /// Propiedades comunes para todo el sistema
    /// </summary>
    public static class AsdaqProperties
    {
        /// <summary>
        /// Valor lógico que indica si el Asdaq Service va a alimentar una instancia local de Acloud que actúa como HMI
        /// </summary>
        public static bool UseRedundantAcloudForHMI
        {
            get
            {
                var appSetting = ConfigurationManager.AppSettings["UseRedundantAcloudForHMI"];
                return (!string.IsNullOrWhiteSpace(appSetting)) ? System.Convert.ToBoolean(appSetting) : false;
            }
        }

        /// <summary>
        /// Url servidor mongo local para la instancia local de Acloud que actúa como HMI
        /// </summary>
        public static string MongoUrlBaseForHMI
        {
            get
            {
                // Realizamos el decriptado de la informacion de conexion en el Web.Config
                var keyPhrase = "amaqAcloud2016";
                var strToDecode = ConfigurationManager.AppSettings["MongoUrlBaseForHMI"].ToString();
                return AesEnDecryption.DecryptWithPassword(strToDecode, keyPhrase);
            }
        }

        /// <summary>
        /// Conjunto de estados del Corp riesgo
        /// </summary>
        public static List<StatusExtension> RiskStatus { get; set; }

        /// <summary>
        /// Estado por defecto
        /// </summary>
        public static StatusExtension DefaultRiskStatus { get; set; }

        /// <summary>
        /// Ruta del ejecutable AsdaqService
        /// </summary>
        public static string ExecutablePath
        {
            get
            {
                var _pathBase = System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName;
                return _pathBase.Substring(0, _pathBase.LastIndexOf(@"\"));
            }
        }

        /// <summary>
        /// Ruta y nombre del archivo de configuración de Asdaq local
        /// </summary>
        public static string LocalAsdaqConfigFilePath
        {
            get
            {
                return string.Format(@"{0}\localAsdaqConfig.json", ExecutablePath);
            }
        }

        /// <summary>
        /// Ruta y nombre del archivo que contiene la lista de estados del Corp Risk
        /// </summary>
        public static string RiskStatusListFilePath
        {
            get
            {
                return string.Format(@"{0}\riskStatusList.json", ExecutablePath);
            }
        }

        /// <summary>
        /// Nombre de usuario
        /// </summary>
        public static string Serial
        {
            get { return ConfigurationManager.AppSettings["Serial"].ToString(); }
        }

        /// <summary>
        /// Clave de acceso
        /// </summary>
        public static string Password
        {
            get { return ConfigurationManager.AppSettings["Password"].ToString(); }
        }

        /// <summary>
        /// Valor lógico que indica si el asdaq debe escalar o no las formas de onda que por defecto son valores double a valores UInt16
        /// </summary>
        public static bool ScaleWaveformToUInt16
        {
            get
            {
                var appSetting = ConfigurationManager.AppSettings["ScaleWaveformToUInt16"];
                return (!string.IsNullOrWhiteSpace(appSetting)) ? System.Convert.ToBoolean(appSetting) : false;
            }
        }

        /// <summary>
        /// Ruta completa del archivo de base de datos local para acumulación de datos históricos que no se han podido guardar en el servidor
        /// </summary>
        public static string LocalHistoricalDatabase
        {
            get { return string.Format(@"{0}\LocalHistoricalData.db", ExecutablePath); }
        }

        /// <summary>
        /// Ruta completa del archivo de base de datos que contiene los últimos x minutos de datos históricos almacenados por activo principal y estampa de tiempo
        /// </summary>
        public static string LastMinsOfHistoricalDatabase
        {
            get { return string.Format(@"{0}\LastMinsOfHistoricalData.db", ExecutablePath); }
        }

        /// <summary>
        /// Ruta completa del archivo de base de datos local para acumulación de eventos grabados que no se han podido guardar en el servidor
        /// </summary>
        public static string LocalRecordedEventDatabase
        {
            get { return string.Format(@"{0}\LocalRecordedEvent.db", ExecutablePath); }
        }

        /// <summary>
        /// Ruta donde se almacenan los paquetes de los eventos
        /// </summary>
        public static string EventPackagesPath
        {
            get { return @"D:\EventPackages\"; }
        }

        /// <summary>
        /// Tamaño máximo en minutos para un paquete de evento
        /// </summary>
        public static double MaxEventPackageSize
        {
            // Por el momento medio minuto, pero es mejor que sea configurable por el usuario
            get { return 0.5; }
        }

        /// <summary>
        /// Id del asdaq
        /// </summary>
        public static string AsdaqId
        {
            get
            {
                return ConfigurationManager.AppSettings["AsdaqId"].ToString();
            }
        }

        /// <summary>
        /// Indica el número de segundos que debe esperar el asdaq antes de determinar que una subVariable ya no está siendo solicitada en tiempo real.
        /// El valor por defecto es 40 segundos
        /// </summary>
        public static double TimeoutOfRealTimeRequests
        {
            get
            {
                var appSetting = ConfigurationManager.AppSettings["TimeoutOfRealTimeRequests"];
                return (!string.IsNullOrWhiteSpace(appSetting)) ? System.Convert.ToDouble(appSetting) : 40.0;
            }
        }

        /// <summary>
        /// Máxima ventana de tiempo para el cálculo de velocidad
        /// </summary>
        public const uint WINDOW_IN_SECONDS = 6;

        ///// <summary>
        ///// Objeto lock para proteger el acceso concurrente al archivo de LiteDB que almacena los datos históricos localmente
        ///// </summary>
        //public static object LocalHistoricalDataLock = new object();

        /// <summary>
        /// Alias para el Asdaq
        /// </summary>
        public static string Alias
        {
            get { return ConfigurationManager.AppSettings["Serial"].ToString(); }
        }

        /// <summary>
        /// Tamaño en días de la colección local de datos históricos. Por defecto 2 días
        /// </summary>
        public static double HistoricalDataCollectionSizeInDays
        {
            get
            {
                var appSetting = ConfigurationManager.AppSettings["HistoricalDataCollectionSizeInDays"];
                return (!string.IsNullOrWhiteSpace(appSetting)) ? System.Convert.ToDouble(appSetting) : 2.0;
            }
        }

        /// <summary>
        /// Nombre de la empresa u organización dueña de la licencia de software de Asdaq Service
        /// </summary>
        public static string Company
        {
            get
            {
                return ConfigurationManager.AppSettings["Company"].ToString();
            }
        }

        /// <summary>
        /// Nombre con el cual se identifica al Asdaq Service como producto de software. Debe ser igual al nombre de producto con el cual se genera
        /// la licencia para el software Asdaq Service con la herramienta de Amaq Algen(Amaq License Generator)
        /// </summary>
        public static string Product
        {
            get
            {
                return "Asdaq";
            }
        }

        /// <summary>
        /// Id del procesador del computador, necesario para la validación de la licencia, ya que, para Asdaq Service decidimos que la licencia es OEM, lo que obliga
        /// al cliente a comprar otra licencia si instala  Asdaq Service en otro computador.
        /// </summary>
        public static string MachineId
        {
            get
            {
                return Libraries.LicenseManager.Helpers.ComputerInfo.GetMachineId();
            }
        }

        /// <summary>
        /// Numero de muestras que el Asdaq tiene configurado para leer
        /// Hasta el momento se tiene que todos los modulos se deben configurar igual
        /// Cuando se tengan diferentes modulos con diferente configuracion se debe cambiar esta propiedad
        /// </summary>
        public static int SamplesToRead { get; set; }
    }
}
