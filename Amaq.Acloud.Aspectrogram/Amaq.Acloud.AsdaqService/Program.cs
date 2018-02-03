using System.IO;
using System.ServiceProcess;

namespace Amaq.Acloud.AsdaqService
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        static void Main()
        {
            ServiceBase[] ServicesToRun;
            ServicesToRun = new ServiceBase[]
            {
            new AsdaqService()
            };
            ServiceBase.Run(ServicesToRun);
        }
    }
}
