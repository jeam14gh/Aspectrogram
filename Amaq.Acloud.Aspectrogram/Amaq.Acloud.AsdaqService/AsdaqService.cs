namespace Amaq.Acloud.AsdaqService
{
    using System;
    using System.Linq;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.ServiceProcess;
    using System.Threading.Tasks;
    using Aspectrogram.Entities;
    using Business;
    using LocalHistoricalData;
    using log4net;
    using System.Reflection;
    using Models;
    using Aspectrogram.Proxy;
    using Aspectrogram.Entities.Dtos;
    using Aspectrogram.Entities.ValueObjects;
    using System.Security;
    using Microsoft.Win32;

    /// <summary>
    /// Servicio que gestiona toda la adquisicion y la sincroniza con el servidor de base de datos
    /// </summary>
    public partial class AsdaqService : ServiceBase
    {
        #region Datos de prueba
        private Asdaq _asdaq1MSeriesMock = null;
        private Asdaq _asdaqMSeriesSyncMock = null;
        private Asdaq _asdaq1CompactDaqMock = null;
        #endregion Datos de prueba

        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        private AcquisitionBl _acquisitionBl = null;
        private AsdaqSystemBl _asdaqSystem = null;
        private HistoricalDataRegister _historicalDataRegister = null;
        private ChangeRequestsListener _changeRequestsListener = null;
        private object _startAcquisitionLock = new object();
        private bool _isValidLicense = false;

        /// <summary>
        /// Constructor
        /// </summary>
        public AsdaqService()
        {
            //Debugger.Launch();

            InitializeComponent();

            _isValidLicense = LicenseBl.IsValidLicense(); // Verficar licenciamiento de la aplicación

            CheckMongoDBService();

            if (_isValidLicense)
            {
                // Si se usa la conexión redundante, se necesita el objeto historicalDataRegister que se encarga de registrar
                // los datos históricos en el servidor principal
                if (AsdaqProperties.UseRedundantAcloudForHMI)
                {
                    _historicalDataRegister = new HistoricalDataRegister();
                }

                _changeRequestsListener = new ChangeRequestsListener();

                _changeRequestsListener.ChangesToApply +=
                    (object sender, ChangedEntities changedEntities) =>
                    {
                        try
                        {
                            _asdaqSystem?.ApplyChanges(changedEntities); // Aplicar y guardar cambios localmente
                            _acquisitionBl?.ApplyChanges(changedEntities); // Aplicar cambios dinámicamente sin interrumpir la adquisición

                        var changeRequests =
                                new ChangeRequestsDto(
                                    changedEntities.SubVariables?.Select(s => new ChangeRequest(s.Id)).ToList(),
                                    changedEntities.Assets?.Select(a => new ChangeRequest(a.Id)).ToList());

                        // Eliminar ChangeRequests en la BD
                        try
                            {
                                new AsdaqProxy(SecurityBl.AppUserState).DeleteChangeRequests(AsdaqProperties.AsdaqId, changeRequests);
                            }
                            catch (SecurityException ex)
                            {
                                SecurityBl.Login();
                                log.Debug(ex.Message);
                                new AsdaqProxy(SecurityBl.AppUserState).DeleteChangeRequests(AsdaqProperties.AsdaqId, changeRequests);
                            }
                        }
                        catch (Exception) { }
                    };

                #region Datos de prueba
                _asdaq1CompactDaqMock = new Asdaq()
                {
                    Alias = "Asdaq 1 CompactDaq Mock",
                    NiDevices = null,
                    NiCompactDaqs = new List<NiCompactDaq>()
                {
                    new NiCompactDaq()
                    {
                        Name = "cDAQ1",
                        CSeriesModules = new List<NiDevice>()
                        {
                            new NiDevice()
                            {
                                Name = "cDAQ1Mod1",
                                ProductCategory = "CSeriesModule",
                                IsMasterNiDevice = false,
                                MasterNiDeviceName = string.Empty,
                                SampleRate = 3938,
                                SamplesToRead = 4096,
                                TerminalConfiguration = "Differential",
                                DoChannels = null,
                                AiChannels = new List<NiAiChannel>()
                                {
                                    new NiAiChannel()
                                    {
                                        Name = "cDAQ1Mod1/ai0",
                                        ByPassed = false,
                                        Enabled = true
                                    }
                                }
                            }
                        }
                    }
                }
                };

                _asdaq1MSeriesMock = new Asdaq()
                {
                    Alias = "Asdaq 1 M Series Mock",
                    NiDevices = new List<NiDevice>()
                {
                    new NiDevice()
                    {
                        Name = "Dev2",
                        ProductCategory = "MSeriesDaq",
                        IsMasterNiDevice = false,
                        MasterNiDeviceName = string.Empty,
                        SampleRate = 4096,
                        SamplesToRead = 4096,
                        TerminalConfiguration = "Nrse",
                        DoChannels = null,
                        AiChannels = new List<NiAiChannel>()
                        {
                            new NiAiChannel()
                            {
                                Name = "Dev2/ai0",
                                ByPassed = false,
                                Enabled = true
                            }
                        }
                    }
                }
                };

                _asdaqMSeriesSyncMock = new Asdaq()
                {
                    Alias = "Asdaq M Series Sync Mock",
                    NiDevices = new List<NiDevice>()
                {
                    new NiDevice()
                    {
                        Name = "Dev2",
                        ProductCategory = "MSeriesDaq",
                        IsMasterNiDevice = true,
                        MasterNiDeviceName = string.Empty,
                        SampleRate = 4096,
                        SamplesToRead = 4096,
                        TerminalConfiguration = "Nrse",
                        DoChannels = null,
                        AiChannels = new List<NiAiChannel>()
                        {
                            new NiAiChannel()
                            {
                                Name = "Dev2/ai0",
                                ByPassed = false,
                                Enabled = true
                            }
                        }
                    },
                    new NiDevice()
                    {
                        Name = "Dev3",
                        ProductCategory = "MSeriesDaq",
                        IsMasterNiDevice = false,
                        MasterNiDeviceName = "Dev2",
                        SampleRate = 4096,
                        SamplesToRead = 4096,
                        TerminalConfiguration = "Nrse",
                        DoChannels = null,
                        AiChannels = new List<NiAiChannel>()
                        {
                            new NiAiChannel()
                            {
                                Name = "Dev3/ai0",
                                ByPassed = false,
                                Enabled = true
                            }
                        }
                    }
                }
                };
                #endregion

                _asdaqSystem = new AsdaqSystemBl();

                _asdaqSystem.ReconfigRequest +=
                    (object sender, EventArgs arguments) =>
                    {
                        try
                        {
                            log.Info("REINICIANDO SISTEMA...");
                            var asdaqConfig = _asdaqSystem.GetConfiguration(); // Config servidor

                            // Proteger llamada concurrente a StartAcquisition
                            lock (_startAcquisitionLock)
                            {
                                StartAcquisition(asdaqConfig);
                            }
                            _asdaqSystem.ResetReconfigureFlag();
                        }
                        catch (Exception ex)
                        {
                            log.Error("Se ha producido un error al tratar de reconfigurar el sistema Asdaq", ex);
                        }
                    };
            }
            else
            {
                log.Info("AsdaqService no tiene una licencia de software o la licencia es invalida ):");
                log.Info("SISTEMA INICIADO!!");
            }
        }

        /// <summary>
        /// Inicio del servicio Windows
        /// </summary>
        /// <param name="args"></param>
        protected override void OnStart(string[] args)
        {
            if (_isValidLicense)
            {
                if (_historicalDataRegister != null)
                {
                    _historicalDataRegister.Start();
                }

                _changeRequestsListener.Start();

                new TaskFactory().StartNew(StartSystem);
            }
            else
            {
                base.OnStart(args);
            }
        }

        /// <summary>
        /// Parada de servicio Windows
        /// </summary>
        protected override void OnStop()
        {
            if (_isValidLicense)
            {
                StopAcquisition();

                if (_historicalDataRegister != null)
                {
                    _historicalDataRegister.Stop();
                }

                if (_changeRequestsListener != null)
                {
                    _changeRequestsListener.Stop();
                }
            }
            else
            {
                base.OnStop();
            }

            log.Info("SISTEMA DETENIDO!!");
        }

        private void StopAcquisition()
        {
            if (_acquisitionBl != null)
                _acquisitionBl.Dispose();
        }

        private void StartAcquisition(Asdaq asdaqConfig)
        {
            if ((asdaqConfig == null) || (!_asdaqSystem.HasAiChannelsUsed(asdaqConfig)))
            {
                log.Warn("No se han encontrado datos de configuracion local o AiChannels relacionados para que AsdaqService pueda trabajar");
                return;
            }

            try
            {
                if ((asdaqConfig.RelatedPrincipalAssets != null) && (asdaqConfig.RelatedPrincipalAssets.Count > 0))
                {
                    if (AsdaqProperties.UseRedundantAcloudForHMI)
                    {
                        if (SecurityBl.AppUserStateForHMI == null)
                        {
                            SecurityBl.LoginForHMI();
                        }
                    }
                    else
                    {
                        if (SecurityBl.AppUserState == null)
                        {
                            SecurityBl.Login();
                        }
                    }

                    List<AssetExtension> relatedPrincipalAssets = null;

                    try
                    {
                        relatedPrincipalAssets =
                            new AssetExtensionProxy(
                                (AsdaqProperties.UseRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                AsdaqProperties.UseRedundantAcloudForHMI)
                                    .GetById(asdaqConfig.RelatedPrincipalAssets.Select(p => p.Id).ToList());
                    }
                    catch (SecurityException ex)
                    {
                        log.Debug(ex.Message);

                        if (AsdaqProperties.UseRedundantAcloudForHMI)
                        {
                            SecurityBl.LoginForHMI();
                        }
                        else
                        {
                            SecurityBl.Login();
                        }

                        relatedPrincipalAssets =
                            new AssetExtensionProxy(
                                (AsdaqProperties.UseRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                AsdaqProperties.UseRedundantAcloudForHMI)
                                    .GetById(asdaqConfig.RelatedPrincipalAssets.Select(p => p.Id).ToList());
                    }

                    // Convertir las estampas de tiempo a LocalTime, ya que mongo las devuelve como UniversalTime
                    relatedPrincipalAssets?
                        .Where(r => r.ConditionStatusEventsConfig != null)
                        .SelectMany(c => c.ConditionStatusEventsConfig)
                        .Where(c => c.LastSavedEvent != null)
                        .ToList()
                        .ForEach(c =>
                        {
                            c.LastSavedEvent = c.LastSavedEvent.Value.ToLocalTime();
                        });

                    // Obtener la configuración de evento de la bd local, principalmente para obtener la fecha del último evento generado por cada estado
                    // de condición configurado
                    relatedPrincipalAssets?.ForEach(currentPrincipalAsset =>
                    {
                        var conditionStatusEventsConfig = 
                            asdaqConfig.RelatedPrincipalAssets
                                .Where(r => r.Id == currentPrincipalAsset.Id)
                                .FirstOrDefault()?
                                .ConditionStatusEventsConfig;

                        conditionStatusEventsConfig?
                            .ForEach(csec =>
                            {
                                csec.LastSavedEvent = 
                                    currentPrincipalAsset.ConditionStatusEventsConfig?.Where(c => c.StatusId == csec.StatusId).FirstOrDefault()?.LastSavedEvent;
                            });
                    });
                }
            }
            catch (Exception ex)
            {
                log.Error("Ha ocurrido un error obteniendo LastSavedEvent para complementar la configuración local", ex);
            }

            if (_historicalDataRegister != null)
            {
                _historicalDataRegister.PrincipalAssets = asdaqConfig.RelatedPrincipalAssets;
            }

            StopAcquisition();
            _acquisitionBl = new AcquisitionBl(asdaqConfig);

            // Esta validación es temporal, ya que, AsdaqProperties.SamplesToRead solo lo usa el filtro pasa altos, pero este filtro no puede ser instanciado por el momento
            // por cada unidad de adquisición, por lo que hace mandatorio asumir el número de muestras como global para todas las unidades de adquisición.
            if((asdaqConfig.NiCompactDaqs != null) && (asdaqConfig.NiCompactDaqs.Count > 0))
            {
                AsdaqProperties.SamplesToRead = asdaqConfig.NiCompactDaqs[0].CSeriesModules[0].SamplesToRead;
            }
            else
            {
                AsdaqProperties.SamplesToRead = asdaqConfig.NiDevices[0].SamplesToRead;
            }
            
            _acquisitionBl.ConfigureAndStart();

            log.Info("SISTEMA INICIADO!!");
        }

        private void StartSystem()
        {
            try
            {
                // Si no se ha obtenido el token de acceso
                if (Equals(SecurityBl.AppUserState, null))
                {
                    try
                    {
                        SecurityBl.Login(); // Intentar obtener token de acceso
                        // Contingencia para crear AiMeasureMethod para una MdVariable específica, mientras 
                        // se desarrolla el catálogo para esto
                        //new MeasurementPointBl().SetAiMeasureMethodTest();
                    }
                    catch(Exception ex)
                    {
                        Debug.WriteLine(ex.Message);
                    }
                }

                if (!_asdaqSystem.IsRegistered())
                {
                    // Si ya se obtuvo el token de acceso
                    if (!Equals(SecurityBl.AppUserState, null))
                    {
                        _asdaqSystem.Register();

                        if (_asdaqSystem.IsRegistered())
                            log.Info("ASDAQ REGISTRADO CORRECTAMENTE!!");
                    }
                }
                else if (!_asdaqSystem.ShouldReconfigure())
                {
                    var asdaqConfig = _asdaqSystem.GetLocalConfiguration(); // Config local

                    // Proteger llamada concurrente a StartAcquisition
                    lock (_startAcquisitionLock)
                    {
                        StartAcquisition(asdaqConfig);
                    }
                }
            }
            catch (Exception ex)
            {
                log.Error("Error general al iniciar el sistema", ex);
                System.Threading.Thread.Sleep(5000); // Esperar 5 segundos
                StartSystem();
            }
        }

        /// <summary>
        /// Valida que el servicio Windows de Mongo esté en ejecución, si no está en ejecución, entonces lo inicia.
        /// </summary>
        private void CheckMongoDBService()
        {
            try
            {
                var serviceName = "MongoDB";
                var mongoDBService = new ServiceController(serviceName);

                try
                {
                    if (mongoDBService.Status == ServiceControllerStatus.Stopped)
                    {
                        var imagePath = GetImagePathForService(serviceName);
                        var index = imagePath.IndexOf(@"\bin\") + 1;
                        var dbPath = imagePath.Substring(0, index) + @"..\data\db\";
                        System.IO.File.Delete(dbPath + "mongod.lock");

                        TimeSpan timeout = TimeSpan.FromMilliseconds(10000.0);
                        mongoDBService.Start();
                        mongoDBService.WaitForStatus(ServiceControllerStatus.Running, timeout);
                    }
                }
                catch (System.ServiceProcess.TimeoutException)
                {
                    throw new Exception("El servicio MongoDB no pudo iniciar correctamente en un periodo de tiempo determinado");
                }
            }
            catch (Exception ex)
            {
                log.Error("Ha ocurrido un error en la verificacion del servicio MongoDB:\n" + ex.Message);
            }
        }

        /// <summary>
        /// Obtiene la ruta del servicio Windows con el nombre especificado como parámetro
        /// </summary>
        /// <param name="serviceName">Nombre del servicio</param>
        /// <returns></returns>
        private string GetImagePathForService(string serviceName)
        {
            string registryPath = @"SYSTEM\CurrentControlSet\Services\" + serviceName;
            RegistryKey keyHKLM = Registry.LocalMachine;
            var key = keyHKLM.OpenSubKey(registryPath);
            string value = key.GetValue("ImagePath").ToString();
            key.Close();
            return Environment.ExpandEnvironmentVariables(value);
        }
    }
}
