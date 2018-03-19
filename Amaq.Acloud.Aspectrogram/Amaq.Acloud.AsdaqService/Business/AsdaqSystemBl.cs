namespace Amaq.Acloud.AsdaqService.Business
{
    using System.Configuration;
    using System.Linq;
    using Aspectrogram.Entities;
    using Helpers;
    using Aspectrogram.Proxy;
    using System.Threading.Tasks;
    using System;
    using Newtonsoft.Json;
    using System.IO;
    using System.Collections.Generic;
    using Aspectrogram.Entities.Enums;
    using Proxy.Administration;
    using log4net;

    using Models;
    using Aspectrogram.Entities.ValueObjects;
    using System.Security;
    using Entities.Administration;
    using Proxy.Core;
    using Entities.Core;

    /// <summary>
    /// Lógica de negocio Asdaq
    /// </summary>
    internal class AsdaqSystemBl
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private Task _reconfigRequestListener = null;

        /// <summary>
        /// Evento que notifica una solicitud de reconfiguración del sistema por parte de un usuario
        /// </summary>
        public event EventHandler ReconfigRequest;

        /// <summary>
        /// Lanza el evento ReconfigRequest
        /// </summary>
        protected virtual void OnReconfigRequest()
        {
            ReconfigRequest?.Invoke(this, null);
        }

        public AsdaqSystemBl()
        {
            _reconfigRequestListener = new TaskFactory().StartNew(() =>
            {
                while (true)
                {
                    try
                    {
                        ConfigurationManager.RefreshSection("appSettings");

                        if (Equals(SecurityBl.AppUserState, null))
                        {
                            SecurityBl.Login();
                        }

                        var reconfigure = IsRegistered() && ShouldReconfigure();

                        if (reconfigure)
                        {
                            OnReconfigRequest();
                        }

                        System.Threading.Thread.Sleep(10000);
                    }
                    catch(Exception ex)
                    {
                        log.Debug("Error en reconfigRequestListener", ex);
                    }
                }
            }, TaskCreationOptions.LongRunning);
        }

        /// <summary>
        /// Obtiene un valor que indica si el Asdaq está registrado en el sistema Acloud
        /// </summary>
        /// <returns></returns>
        public bool IsRegistered()
        {
            return !string.IsNullOrEmpty(AsdaqProperties.AsdaqId);
        }

        /// <summary>
        /// Actualiza las colecciones de MongoDB de la instancia de Acloud HMI
        /// </summary>
        /// <param name="asdaq">Objeto asdaq</param>
        /// <param name="tree">Lista de nodos que representan el árbol concerniente al asdaq</param>
        /// <param name="assets">Lista de activos monitoreados por el asdaq</param>
        /// <param name="xYMeasurementPointPairs">Lista de pares XY concernientes al asdaq</param>
        private void UpdateDatabaseForHMIAcloud(Asdaq asdaq, List<Node> tree, List<AssetExtension> assets, 
            List<XYMeasurementPointPair> xYMeasurementPointPairs)
        {
            if (SecurityBl.AppUserStateForHMI == null)
            {
                SecurityBl.LoginForHMI();
            }

            var asdaqProxy = new AsdaqProxy(SecurityBl.AppUserStateForHMI, true);
            var currentAsdaq = asdaqProxy.GetById(AsdaqProperties.AsdaqId);
            var currentAssets = new AssetExtensionProxy(SecurityBl.AppUserStateForHMI, true).GetAll();

            var mongoShell = new Libraries.MongoRepository.Admin.Shell(AsdaqProperties.MongoUrlBaseForHMI + SecurityBl.AppUserStateForHMI.DbName);

            //mongoShell.DropCollection("Category");
            //mongoShell.DropCollection("SensorType");
            //mongoShell.DropCollection("Status");
            mongoShell.DropCollection("Asdaq");
            mongoShell.DropCollection("Node");
            mongoShell.DropCollection("Asset");
            mongoShell.DropCollection("MdVariable");
            mongoShell.DropCollection("SubVariable");
            mongoShell.DropCollection("XYMeasurementPointPair");

            if(currentAsdaq != null)
            {
                asdaq.RealTimeRequests = currentAsdaq.RealTimeRequests; // Preservar solicitudes tiempo real actuales             
            }

            try
            {
            // Preservar la estampa de tiempo del último evento generado por cada estado de condición configurado
            assets?.ForEach(asset =>
            {
                asset.ConditionStatusEventsConfig?.ForEach(conditionStatusEvent =>
                {
                    conditionStatusEvent.LastSavedEvent =
                        currentAssets?
                            .Where(currentAsset => currentAsset.Id == asset.Id)?
                                .First()?
                            .ConditionStatusEventsConfig?
                                .Where(currentConditionStatusEvent => currentConditionStatusEvent.StatusId == conditionStatusEvent.StatusId)?
                                .First()?
                                .LastSavedEvent;

                });
            });
            }
            catch (Exception ex)
            {
                log.Debug("No se pudo preservar lastSaveEvent", ex);
            }

            asdaqProxy.AddSingle(asdaq);
            //new StatusExtensionProxy(SecurityBl.AppUserStateForHMI, true).AddMany(AsdaqProperties.RiskStatus);                 
            new NodeProxy(SecurityBl.AppUserStateForHMI, true).AddMany(tree);
            new AssetExtensionProxy(SecurityBl.AppUserStateForHMI, true).AddMany(assets);
            new MdVariableExtensionProxy(SecurityBl.AppUserStateForHMI, true).AddMany(asdaq.RelatedMeasurementPoints);
            new SubVariableExtensionProxy(SecurityBl.AppUserStateForHMI, true).AddMany(asdaq.RelatedMeasurementPoints.SelectMany(p => p.SubVariables).ToList());

            if ((xYMeasurementPointPairs != null) && (xYMeasurementPointPairs.Count > 0))
            {
                new XYMeasurementPointPairProxy(SecurityBl.AppUserStateForHMI, true).AddMany(xYMeasurementPointPairs);
            }
        }

        /// <summary>
        /// Obtiene toda la configuración del Asdaq
        /// </summary>
        /// <returns>Objeto Asdaq</returns>
        public Asdaq GetConfiguration()
        {
            var asdaq = new Asdaq();

            try
            {
                asdaq = new AsdaqProxy(SecurityBl.AppUserState).GetById(AsdaqProperties.AsdaqId);
            }
            catch (SecurityException ex)
            {
                SecurityBl.Login();
                log.Debug(ex.Message);
                asdaq = new AsdaqProxy(SecurityBl.AppUserState).GetById(AsdaqProperties.AsdaqId);
            }

            var nodeProxy = new NodeProxy(SecurityBl.AppUserState);            

            var setOfRiskStatus = new StatusExtensionProxy(SecurityBl.AppUserState).GetSetOfRiskStates();

            // Conjunto de estados con el cual el sistema va a tomar decisiones con base a las medidas calculadas
            AsdaqProperties.RiskStatus = setOfRiskStatus.OrderByDescending(s => s.Severity).ToList();

            // Respaldo local
            var jsonRiskStatus = JsonConvert.SerializeObject(AsdaqProperties.RiskStatus, Formatting.Indented);
            File.WriteAllText(AsdaqProperties.RiskStatusListFilePath, jsonRiskStatus);

            // El estado por defecto es el que tenga severidad 1. SIEMPRE DEBE EXISTIR EN LA BASE DE DATOS EL ESTADO POR DEFECTO
            AsdaqProperties.DefaultRiskStatus = AsdaqProperties.RiskStatus.Where(riskState => riskState.Severity == 1).FirstOrDefault();

            if (AsdaqProperties.DefaultRiskStatus == null)
            {
                log.Error("No se encontraron estados por defecto.");
                return null;
            }
            
            if (asdaq.NiDevices != null && asdaq.NiCompactDaqs != null)
            {
                FilterNiDevicesUsed(ref asdaq);
                FilterNiCompactDaqsUsed(ref asdaq);
            }
            else
            {
                log.Error("No se encontraron NiDevices ni NiCompactDaqs.");
                return null;
            }

            new MeasurementPointBl().GetByAsdaq(ref asdaq);

            var relatedAssets = new AssetBl().GetByMeasurementPoint(asdaq.RelatedMeasurementPoints);

            // Validar referencia angular asociada
            asdaq.RelatedMeasurementPoints
                .Where(mPoint => !string.IsNullOrEmpty(mPoint.AngularReferenceId))
                .ToList()
                .ForEach(p =>
                {
                    var relatedAngularReference =
                        asdaq.RelatedMeasurementPoints
                            .Where(relatedMp => relatedMp.Id == p.AngularReferenceId).FirstOrDefault();

                    if(relatedAngularReference == null)
                    {
                        var path =
                            relatedAssets
                                .Where(a => a.Id == p.ParentId).FirstOrDefault().Name;

                        path += "/" + p.Name;

                        log.Error("No se ha encontrado la referencia angular asociada al punto de medicion " + path + "(" + p.Id + ")");
                    }
                });

            // Resolver activos principales que tienen puntos de medición relacionados directamente
            asdaq.RelatedPrincipalAssets =
                relatedAssets
                    .Where(asset => asset.IsPrincipal || string.IsNullOrEmpty(asset.PrincipalAssetId))
                    .ToList();

            // Resolver subactivos
            var subAssets = 
                relatedAssets.Except(asdaq.RelatedPrincipalAssets).ToList();

            // Resolver activos principales a partir de subactivos
            if((subAssets != null) && (subAssets.Count > 0))
            {
                if(asdaq.RelatedPrincipalAssets == null)
                {
                    asdaq.RelatedPrincipalAssets = new List<AssetExtension>();
                }

                var principalAssetIdList =
                    subAssets.Select(subAsset => subAsset.PrincipalAssetId).Distinct().ToList();

                var principalAssets = new List<AssetExtension>();
                try
                {
                    principalAssets = new AssetExtensionProxy(SecurityBl.AppUserState).GetById(principalAssetIdList);
                }
                catch (SecurityException ex)
                {
                    SecurityBl.Login();
                    log.Debug(ex.Message);
                    principalAssets = new AssetExtensionProxy(SecurityBl.AppUserState).GetById(principalAssetIdList);
                }

                if ((principalAssets != null) && (principalAssets.Count > 0))
                {
                    asdaq.RelatedPrincipalAssets.AddRange(principalAssets);
                }
            }
            else
            {
                subAssets = new List<AssetExtension>();
            }

            if (asdaq.RelatedPrincipalAssets != null)
            {
                asdaq.RelatedPrincipalAssets.ForEach(principalAsset =>
                {
                    #region Obtener información para notificaciones

                    if (asdaq.MailAccountConfiguration != null)
                    {
                        List<string> userIdList = new List<string>();

                        // Obtener lista de usuarios que están configurados para ser notificados
                        if (principalAsset.ConditionStatusEventsConfig != null)
                        {
                            var userIdListPart1 =
                                principalAsset.ConditionStatusEventsConfig
                                    .Where(c => c.NotifyList != null)
                                    .SelectMany(c => c.NotifyList)
                                    .Select(n => n.UserId).ToList();

                            if ((userIdListPart1 != null) && (userIdListPart1.Count > 0))
                            {
                                userIdList.AddRange(userIdListPart1);
                            }
                        }

                        // Obtener lista de usuarios que están configurados para ser notificados
                        if (principalAsset.RpmEventConfig != null)
                        {
                            if (principalAsset.RpmEventConfig.NotifyList != null)
                            {
                                var userIdListPart2 =
                                    principalAsset.RpmEventConfig.NotifyList.Select(n => n.UserId).ToList();

                                if ((userIdListPart2 != null) && (userIdListPart2.Count > 0))
                                {
                                    userIdList.AddRange(userIdListPart2);
                                }
                            }
                        }

                        if (userIdList.Count > 0)
                        {
                            // Obtener información de correo electrónico y celular de los usuarios que requieren notificaciones
                            var userInfoList = new List<User>();
                            try
                            {
                                userInfoList = new UserProxy(SecurityBl.AppUserState).GetUserInfo(userIdList);
                            }
                            catch (SecurityException ex)
                            {
                                SecurityBl.Login();
                                log.Debug(ex.Message);
                                userInfoList = new UserProxy(SecurityBl.AppUserState).GetUserInfo(userIdList);
                            }

                            if (userInfoList != null)
                            {
                                userInfoList.ForEach(userInfo =>
                                {
                                    var info = userInfo.Companies[0];

                                // Si el usuario tiene correo o número de celular
                                if (!string.IsNullOrWhiteSpace(info.Email) || !string.IsNullOrWhiteSpace(info.Cellphone))
                                    {
                                        if (principalAsset.ConditionStatusEventsConfig != null)
                                        {
                                        // Mantener en memoria RAM la info de correo y celular para las notificaciones del usuario
                                        principalAsset.ConditionStatusEventsConfig
                                                .Where(c => c.NotifyList != null)
                                                .SelectMany(n => n.NotifyList)
                                                .Where(n => n.UserId == userInfo.Id)
                                                .ToList()
                                                .ForEach(notificationReceiver =>
                                                {
                                                    notificationReceiver.Email = info.Email;
                                                    notificationReceiver.Cellphone = info.Cellphone;
                                                });
                                        }
                                        if ((principalAsset.RpmEventConfig != null) && (principalAsset.RpmEventConfig.NotifyList != null))
                                        {
                                        // Mantener en memoria RAM la info de correo y celular para las notificaciones del usuario
                                        principalAsset.RpmEventConfig.NotifyList
                                                .Where(n => n.UserId == userInfo.Id)
                                                .ToList()
                                                .ForEach(notificationReceiver =>
                                                {
                                                    notificationReceiver.Email = info.Email;
                                                    notificationReceiver.Cellphone = info.Cellphone;
                                                });
                                        }
                                    }
                                });
                            }
                        }
                    }

                    #endregion Obtener información para notificaciones

                    var currentAssets = new List<AssetExtension>() { principalAsset };

                    var currentSubAssets =
                        relatedAssets
                            .Where(asset => asset.PrincipalAssetId == principalAsset.Id)
                            .ToList();

                    if((currentSubAssets != null) && (currentSubAssets.Count > 0))
                    {
                        currentAssets.AddRange(currentSubAssets);
                    }

                    principalAsset.PrincipalAssetId = principalAsset.Id;

                    foreach (var currentAsset in currentAssets)
                    {
                        // Setear el asset principal a cada punto de medición
                        asdaq.RelatedMeasurementPoints
                            .Where(relatedMeasurementPoint => relatedMeasurementPoint.ParentId == currentAsset.Id)
                            .ToList()
                            .ForEach(relatedMeasurementPoint =>
                            {
                                relatedMeasurementPoint.PrincipalAssetId = principalAsset.Id;
                            });                       
                    }

                    principalAsset.ConditionStatusEventsConfig?
                        .ForEach(c =>
                        {
                            c.DynamicActionOnEvent = DynamicActionOnEvent.None;
                        });

                    principalAsset.CanDetectRpmEvent = false;

                    if (principalAsset.RpmEventConfig == null)
                    {
                        return; // Continue ForEach
                    }

                    if (!principalAsset.RpmEventConfig.Enabled)
                    {
                        return; // Continue ForEach
                    }

                    principalAsset.RpmEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;

                    var relatedAngularReferences =
                        asdaq.RelatedMeasurementPoints
                            .Where(p => (p.IsAngularReference) && (p.PrincipalAssetId == principalAsset.Id))
                            .ToList();

                    if (relatedAngularReferences == null)
                    {
                        return;
                    }

                    var angularReference =
                        relatedAngularReferences
                            .Where(relatedAngularReference => relatedAngularReference.Id == principalAsset.RpmEventConfig.AngularReferenceId)
                            .FirstOrDefault();

                    if ((angularReference == null) || (angularReference.SubVariables == null))
                    {
                        return;
                    }

                    var rpmSubVariable =
                        angularReference.SubVariables
                            .Where(subVariable => subVariable.MeasureType == MeasureType.Rpm)
                            .FirstOrDefault();

                    if (rpmSubVariable == null)
                    {
                        return;
                    }

                    principalAsset.CanDetectRpmEvent = true;
                });

                // Obtener la cantidad de puntos de medición que tienen relación con cada activo principal.
                // Esta propiedad es importante para determinar el limit en las consultas de datos históricos del HistoricalDataRegister
                asdaq.RelatedPrincipalAssets
                    .ForEach(rpa =>
                    {
                        rpa.HistoricalDataUploadLimit =
                            asdaq.RelatedMeasurementPoints.Where(rmp => rmp.PrincipalAssetId == rpa.Id).Count();
                        var factor = Convert.ToInt32(Math.Round(AsdaqProperties.HistoricalDataUploadLimit / (double)rpa.HistoricalDataUploadLimit));
                        factor = (factor == 0) ? 1 : factor;
                        rpa.HistoricalDataUploadLimit *= factor;

                        rpa.HistoricalDataStreamUploadLimit =
                            asdaq.RelatedMeasurementPoints.Where(rmp => rmp.PrincipalAssetId == rpa.Id).Count();
                        var streamFactor = Convert.ToInt32(Math.Round(AsdaqProperties.HistoricalDataStreamUploadLimit / (double)rpa.HistoricalDataStreamUploadLimit));
                        streamFactor = (streamFactor == 0) ? 1 : streamFactor;
                        rpa.HistoricalDataStreamUploadLimit *= streamFactor;
                    });
            }

            if (AsdaqProperties.UseRedundantAcloudForHMI)
            {
                var xYMeasurementPointPairs =
                    new XYMeasurementPointPairProxy(SecurityBl.AppUserState).GetXYPairByAssetId(relatedAssets.Select(a => a.Id).ToList());

                // Obtener árbol que le compete al Asdaq
                var relatedTree = nodeProxy.GetTree(relatedAssets.Select(a => a.NodeId).ToList());
                var mdVariableNodes = nodeProxy.GetById(asdaq.RelatedMeasurementPoints.Select(p => p.NodeId).ToList());
                var assetFullList = asdaq.RelatedPrincipalAssets.Concat(subAssets).ToList();
                relatedTree.AddRange(mdVariableNodes); // Complementar el árbol con los nodos de tipo MdVariable

                try
                {
                    UpdateDatabaseForHMIAcloud(asdaq, relatedTree, /*relatedAssets*/assetFullList, xYMeasurementPointPairs);
                }
                catch (SecurityException ex)
                {
                    log.Debug("Ha ocurrido un error actualizando la base de datos de Acloud HMI", ex);

                    // Invalidar token
                    SecurityBl.AppUserStateForHMI = null;

                    // Dentro de este método se vuelve a solicitar el token si el actual está invalidado
                    UpdateDatabaseForHMIAcloud(asdaq, relatedTree, relatedAssets, xYMeasurementPointPairs);
                }
            }

            SaveLocalAsdaqConfig(asdaq);

            try
            {
                // Eliminar las solicitudes de cambio dinámico de información, ya que se acaba de obtener toda la información de la BD
                try
                {
                    new AsdaqProxy(SecurityBl.AppUserState).DeleteAllChangeRequests(AsdaqProperties.AsdaqId);
                }
                catch (SecurityException ex)
                {
                    SecurityBl.Login();
                    log.Debug(ex.Message);
                    new AsdaqProxy(SecurityBl.AppUserState).DeleteAllChangeRequests(AsdaqProperties.AsdaqId);
                }
            }
            catch(Exception ex)
            {
                log.Debug("Ha ocurrido un error en DeleteAllChangeRequests", ex);
            }

            return asdaq;
        }

        /// <summary>
        /// Obtiene toda la configuración del Asdaq almacenada localmente
        /// </summary>
        /// <returns>Objeto Asdaq</returns>
        public Asdaq GetLocalConfiguration()
        {
            Asdaq localAsdaqConfig = GetLocalAsdaqConfig();

            AsdaqProperties.RiskStatus = 
                (File.Exists(AsdaqProperties.RiskStatusListFilePath)) ? JsonConvert.DeserializeObject<List<StatusExtension>>(File.ReadAllText(AsdaqProperties.RiskStatusListFilePath)) : null;

            // El estado por defecto es el que tenga severidad 1. SIEMPRE DEBE EXISTIR EN LA BASE DE DATOS EL ESTADO POR DEFECTO
            AsdaqProperties.DefaultRiskStatus = (AsdaqProperties.RiskStatus != null) ? AsdaqProperties.RiskStatus.Where(riskState => riskState.Severity == 1).FirstOrDefault() : null;

            return localAsdaqConfig;
        }

        /// <summary>
        /// Obtiene un valor que indica si el asdaq tiene ai channels asociados con measurement points
        /// </summary>
        /// <param name="asdaqConfiguration">Objeto Asdaq</param>
        /// <returns></returns>
        public bool HasAiChannelsUsed(Asdaq asdaqConfiguration)
        {
            return ((asdaqConfiguration != null) || (asdaqConfiguration.NiDevices.Count > 0 || asdaqConfiguration.NiCompactDaqs.Count > 0));
        }

        /// <summary>
        /// Valida si el Asdaq debe obtener nuevamente su configuración
        /// </summary>
        public bool ShouldReconfigure()
        {
            try
            {
                return new AsdaqProxy(SecurityBl.AppUserState).ShouldReconfigure(AsdaqProperties.AsdaqId);
            }
            catch (SecurityException ex)
            {
                SecurityBl.Login();
                log.Debug(ex.Message);
                return new AsdaqProxy(SecurityBl.AppUserState).ShouldReconfigure(AsdaqProperties.AsdaqId);
            }
            catch (Exception)
            {
                return false;
            }
        }

        public void ResetReconfigureFlag()
        {
            try
            {
                new AsdaqProxy(SecurityBl.AppUserState).ResetReconfigureFlag(AsdaqProperties.AsdaqId);
            }
            catch (SecurityException ex)
            {
                SecurityBl.Login();
                log.Debug(ex.Message);
                new AsdaqProxy(SecurityBl.AppUserState).ResetReconfigureFlag(AsdaqProperties.AsdaqId);
            }
        }

        /// <summary>
        /// Registra el Asdaq en el sistema Acloud
        /// </summary>
        public void Register()
        {
            var niHardwareHelper = new NiHardwareHelper();

            var asdaq = new Asdaq()
            {
                Alias = AsdaqProperties.Alias,
                NiDevices = niHardwareHelper.GetNiDevices(),
                NiCompactDaqs = niHardwareHelper.GetNiCompactDaqs(),
                RealTimeRequests = new List<RealTimeRequest>()
            };

            var id = new AsdaqProxy(SecurityBl.AppUserState).AddSingle(asdaq);

            Configuration config = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None);
            config.AppSettings.Settings["AsdaqId"].Value = id;
            config.Save(ConfigurationSaveMode.Modified);
        }

        /// <summary>
        /// Aplica localmente los cambios dinamicamente en las entidades especificadas
        /// </summary>
        /// <param name="changedEntities"></param>
        public void ApplyChanges(ChangedEntities changedEntities)
        {
            Asdaq localAsdaqConfig = GetLocalAsdaqConfig();

            if (localAsdaqConfig == null)
            {
                return;
            }

            changedEntities.SubVariables?
                .ForEach(changedSubVariable =>
                {
                    var subVariable =
                        localAsdaqConfig.RelatedMeasurementPoints.SelectMany(m => m.SubVariables).Where(s => s.Id == changedSubVariable.Id).FirstOrDefault();

                    if(subVariable != null)
                    {
                        subVariable = changedSubVariable;                     
                    }
                });

            changedEntities.Assets?
                .ForEach(changedAsset =>
                {
                    var asset =
                        localAsdaqConfig.RelatedPrincipalAssets.Where(pa => pa.Id == changedAsset.Id).FirstOrDefault();

                    if (asset != null)
                    {
                        asset = changedAsset;                     
                    }
                });

            SaveLocalAsdaqConfig(localAsdaqConfig); // Guardar cambios en archivo
        }

        #region Private Methods

        // Filtrar solo los NiDevice con canales usados
        private void FilterNiDevicesUsed(ref Asdaq asdaq)
        {
            asdaq.NiDevices = asdaq.NiDevices.Where(d => d.AiChannels.Any(c => !string.IsNullOrEmpty(c.MdVariableId) && c.Enabled)).ToList();

            if (asdaq.NiDevices.Count > 0)
                for (int d = 0; d < asdaq.NiDevices.Count; d++)
                    asdaq.NiDevices[d].AiChannels =
                        asdaq.NiDevices[d].AiChannels.Where(ch => !string.IsNullOrEmpty(ch.MdVariableId) && ch.Enabled).ToList(); // Se filtran solo los canales usados
        }

        // Filtrar solo los NiCompactDaq con módulos serie C con canales usados
        private void FilterNiCompactDaqsUsed(ref Asdaq asdaq)
        {
            asdaq.NiCompactDaqs =
                asdaq.NiCompactDaqs.Where(cd => cd.CSeriesModules.Any(m => m.AiChannels.Any(c => !string.IsNullOrEmpty(c.MdVariableId) && c.Enabled))).ToList();

            if (asdaq.NiCompactDaqs.Count > 0)
                for (int c = 0; c < asdaq.NiCompactDaqs.Count; c++)
                    for (int m = 0; m < asdaq.NiCompactDaqs[c].CSeriesModules.Count; m++) // Se filtran solo los módulos usados
                        asdaq.NiCompactDaqs[c].CSeriesModules[m].AiChannels =
                            asdaq.NiCompactDaqs[c].CSeriesModules[m].AiChannels.Where(ch => !string.IsNullOrEmpty(ch.MdVariableId) && ch.Enabled).ToList(); // Se filtran solo los canales usados
        }

        /// <summary>
        /// Obtiene solo la información de Asdaq almacenada localmente
        /// </summary>
        /// <returns></returns>
        private Asdaq GetLocalAsdaqConfig()
        {
            return (File.Exists(AsdaqProperties.LocalAsdaqConfigFilePath)) ? JsonConvert.DeserializeObject<Asdaq>(File.ReadAllText(AsdaqProperties.LocalAsdaqConfigFilePath)) : null;
        }

        /// <summary>
        /// Guarda el objeto asdaq serializado como json en un archivo
        /// </summary>
        /// <param name="asdaq">Objeto asdaq que se va a guardar</param>
        private void SaveLocalAsdaqConfig(Asdaq asdaq)
        {
            var jsonAsdaq = JsonConvert.SerializeObject(asdaq, Formatting.Indented);
            File.WriteAllText(AsdaqProperties.LocalAsdaqConfigFilePath, jsonAsdaq);
        }

        #endregion Private Methods
    }
}
