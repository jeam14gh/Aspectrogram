namespace Amaq.Acloud.AsdaqViewer
{
    using Microsoft.Win32;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.ServiceProcess;
    using System.Text;
    using System.Threading.Tasks;

    /// <summary>
    /// Representa un gestor del servicio Asdaq Service con funcionalidades para manipular el servicio Windows
    /// y para realizar cambios en la configuración de la aplicación, entre otras.
    /// </summary>
    internal class AsdaqServiceManager
    {
        private const string SERVICE_NAME = "Asdaq Service";
        private const string PROCESS_NAME = "AsdaqService";
        private ServiceController _service = null;
        private TimeSpan _timeout = TimeSpan.FromSeconds(30);
        private string _path = string.Empty;

        public AsdaqServiceManager()
        {
            _service = new ServiceController(SERVICE_NAME);
            _path = GetImagePath(); // Obtener la ruta donde está instalado el servicio
        }

        /// <summary>
        /// Inicia el servicio
        /// </summary>
        public void Start()
        {
            _service.Start();
            _service.WaitForStatus(ServiceControllerStatus.Running, _timeout);
        }

        /// <summary>
        /// Detiene el servicio
        /// </summary>
        public void Stop()
        {
            _service.Stop();
            _service.WaitForStatus(ServiceControllerStatus.Stopped, _timeout);
        }

        /// <summary>
        /// Reinicia el servicio
        /// </summary>
        public void Restart()
        {
            Stop();
            Start();
        }

        /// <summary>
        /// Obtiene la configuración actual de la aplicación
        /// </summary>
        /// <returns></returns>
        public object GetConfiguration()
        {
            return null;
        }

        /// <summary>
        /// Guarda la configuración especificada
        /// </summary>
        /// <param name="configuration"></param>
        public void SaveConfiguration(object configuration)
        {

        }

        /// <summary>
        /// Obtiene la ruta donde se encuentra instaldo Asdaq Service
        /// </summary>
        /// <returns></returns>
        private string GetImagePath()
        {
            string registryPath = @"SYSTEM\CurrentControlSet\Services\" + SERVICE_NAME;
            RegistryKey keyHKLM = Registry.LocalMachine;

            RegistryKey key;
            key = keyHKLM.OpenSubKey(registryPath);

            string value = key.GetValue("ImagePath").ToString();
            key.Close();

            return Environment.ExpandEnvironmentVariables(value);
        }
    }
}
