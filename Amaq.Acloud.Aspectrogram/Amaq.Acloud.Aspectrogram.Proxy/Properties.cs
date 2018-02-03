namespace Amaq.Acloud.Aspectrogram.Proxy
{
    using System.Configuration;
    using System.Collections.Generic;
    using Entities;

    /// <summary>
    /// Propiedades comunes para todo el sistema
    /// </summary>
    internal static class Properties
    {
        /// <summary>
        /// Url del api Aspectrogram
        /// </summary>
        public static string UrlLocalApi
        {
            get { return ConfigurationManager.AppSettings["UrlLocalApi"].ToString(); }
        }

        /// <summary>
        /// Url del api Aspectrogram del PC Industrial, que actúa como HMI
        /// </summary>
        public static string UrlLocalApiForHMI
        {
            get { return ConfigurationManager.AppSettings["UrlLocalApiForHMI"].ToString(); }
        }

        /// <summary>
        /// Conjunto de estados del Corp riesgo
        /// </summary>
        public static List<StatusExtension> RiskStates { get; set; }

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
    }
}
