namespace Amaq.Acloud.AsdaqService
{
    using System.ComponentModel;
    using System.Configuration.Install;
    using System.ServiceProcess;

    [RunInstaller(true)]
    public partial class AsdaqInstaller : Installer
    {
        private ServiceInstaller serviceInstaller1;
        private ServiceProcessInstaller processInstaller;
        private const string NOMBRE = "Asdaq Service";

        /// <summary>
        /// Constructor por defecto
        /// </summary>
        public AsdaqInstaller()
        {
            // Instantiate installers for process and services.
            processInstaller = new ServiceProcessInstaller();
            serviceInstaller1 = new ServiceInstaller();
            // The services will run under the system account.
            processInstaller.Account = ServiceAccount.LocalSystem;
            //The services will be started manually.
            serviceInstaller1.StartType = ServiceStartMode.Automatic;
            //ServiceName must equal those on ServiceBase derived classes.
            serviceInstaller1.ServiceName = NOMBRE;
            serviceInstaller1.DisplayName = NOMBRE;

            serviceInstaller1.Description = "Encargado de la adquisición y procesamiento de señales del sistema de vibraciones de A-MAQ.";
            //Add installers to collection. Order is not important.
            Installers.Add(serviceInstaller1);
            Installers.Add(processInstaller);
        }
    }
}
