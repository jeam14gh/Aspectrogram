namespace Amaq.Acloud.AsdaqService.Business
{
    using Libraries.LicenseManager;
    using log4net;
    using System.IO;

    internal static class LicenseBl
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Obtiene un valor lógico indicando si la instancia de Asdaq Service tiene una licencia de software válida
        /// </summary>
        /// <returns></returns>
        public static bool IsValidLicense()
        {
            var isValidLicense = false;

            // Validación de licenciamiento de Asdaq Service
            try
            {               
                var keyPath = string.Format(@"{0}\Keys\algen_pub.pem", AsdaqProperties.ExecutablePath); // Ruta del archivo pem que contiene la llave pública para validar la licencia
                var licensePath = string.Format(@"{0}\Asdaq.lic", AsdaqProperties.ExecutablePath); // Ruta del archivo de licencia
                var license = File.ReadAllText(licensePath);

                var licenseData =
                    new LicenseData(
                        AsdaqProperties.Product,
                        AsdaqProperties.MachineId,
                        AsdaqProperties.Company);

                isValidLicense = new LicenseGenerator(keyPath).verifyLicense(licenseData, license);
            }
            catch (System.Exception)
            {
                isValidLicense = false;
            }

            if (!isValidLicense)
            {
                MakeLicenseRequest();
            }

            return isValidLicense;
        }

        /// <summary>
        /// Genera un archivo de solicitud de licencia Asdaq, el cual debe ser enviado a A-MAQ por el cliente para la generación de la licencia
        /// </summary>
        private static void MakeLicenseRequest()
        {
            try
            {
                var keyPath = string.Format(@"{0}\Keys", AsdaqProperties.ExecutablePath);
                var lr = new LicenseRequester(keyPath);
                string request = lr.MakeRequest(new LicenseRequestData(AsdaqProperties.Product, Libraries.LicenseManager.Helpers.ComputerInfo.GetMachineId()));
                File.WriteAllText(AsdaqProperties.ExecutablePath +  @"\" + AsdaqProperties.Product + ".req", request);
            }
            catch(System.Exception ex)
            {
                log.Error("Ha ocurrido un error generando el archivo de solicitud de licencia " + AsdaqProperties.Product, ex);
            }
        }
    }
}
