namespace Amaq.Acloud.AsdaqViewer
{
    using System.Configuration;

    internal static class AsdaqViewerProperties
    {
        /// <summary>
        /// Url del módulo de vibraciones Aspectrogram del sistema Acloud
        /// </summary>
        public static string UrlAspectrogram
        {
            get { return ConfigurationManager.AppSettings["UrlAspectrogram"].ToString(); }
        }
    }
}
