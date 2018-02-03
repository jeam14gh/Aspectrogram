namespace Amaq.Acloud.AsdaqService.Business
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Aspectrogram.Entities;
    using Aspectrogram.Proxy;
    using System.Threading.Tasks;
    using Aspectrogram.Entities.ValueObjects;
    using Entities.ValueObjects;
    using Models;
    using Helpers.CircularBuffer;
    using Aspectrogram.Entities.Enums;
    using log4net;
    using Entities.Serializers;
    using System.Reflection;
    using Libraries.Mail;
    using Proxy.Core;
    using System.Security;
    using Entities.Core;
    using Entities.Mappers;
    using Aspectrogram.Entities.Dtos;

    /// <summary>
    /// Lógica de negocio para assets
    /// </summary>
    internal class AssetBl
    {
        private static readonly ILog log = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);

        private object _locker = new object();

        /// <summary>
        /// Cambia de manera especial la configuración de un evento de velocidad, para que posteriormente sea aplicada en
        /// la lógica de detección de eventos del Asdaq
        /// </summary>
        /// <param name="currentRpmEventConfig">Configuración actual</param>
        /// <param name="changedRpmEventConfig">configuración nueva</param>
        public static void ChangeRpmEventConfig(RpmEventConfig currentRpmEventConfig, RpmEventConfig changedRpmEventConfig)
        {
            if (changedRpmEventConfig == null)
            {
                if (currentRpmEventConfig != null)
                {
                    currentRpmEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.Delete;
                }
            }
            else
            {
                if (currentRpmEventConfig == null)
                {
                    currentRpmEventConfig = changedRpmEventConfig;
                    currentRpmEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;
                }
                else
                {
                    currentRpmEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;
                    currentRpmEventConfig.NotifyList = changedRpmEventConfig.NotifyList; // La lista de notificados si puede cambiar inmediatamente

                    // Validar si hay cambios en alguna propiedad de la configuración del evento
                    if ((currentRpmEventConfig.AngularReferenceId != changedRpmEventConfig.AngularReferenceId) ||
                        (currentRpmEventConfig.DeltaRpm != changedRpmEventConfig.DeltaRpm) ||
                        (currentRpmEventConfig.LowRpm != changedRpmEventConfig.LowRpm) ||
                        (currentRpmEventConfig.UpperRpm != changedRpmEventConfig.UpperRpm) ||
                        (currentRpmEventConfig.MinutesBefore != changedRpmEventConfig.MinutesBefore) ||
                        (currentRpmEventConfig.MinutesAfter != changedRpmEventConfig.MinutesAfter) ||
                        (currentRpmEventConfig.Enabled != changedRpmEventConfig.Enabled))
                    {
                        currentRpmEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.Update;
                        currentRpmEventConfig.ConfigChanges = changedRpmEventConfig;
                    }
                }
            }
        }

        /// <summary>
        /// Cambia de manera especial la configuración de eventos de estado de condición, para que posteriormente sea aplicada en
        /// la lógica de detección de eventos del Asdaq
        /// </summary>
        /// <param name="currentConditionStatusEventsConfig">Configuración actual</param>
        /// <param name="changedConditionStatusEventsConfig">Configuración nueva</param>
        public static void ChangeConditionStatusEventsConfig(
            List<ConditionStatusEventConfig> currentConditionStatusEventsConfig, List<ConditionStatusEventConfig> changedConditionStatusEventsConfig)
        {
            if ((changedConditionStatusEventsConfig == null) || (changedConditionStatusEventsConfig.Count == 0))
            {
                currentConditionStatusEventsConfig?
                    .ForEach(currentConditionStatusEventConfig =>
                    {
                        currentConditionStatusEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.Delete;
                    });
            }
            else
            {
                if (currentConditionStatusEventsConfig == null)
                {
                    currentConditionStatusEventsConfig = new List<ConditionStatusEventConfig>();
                }

                changedConditionStatusEventsConfig?
                    .ForEach(changedConditionStatusEventConfig =>
                    {
                        changedConditionStatusEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;

                        var currentConditionStatusEventConfig =
                            currentConditionStatusEventsConfig
                                .Where(c => c.StatusId == changedConditionStatusEventConfig.StatusId).FirstOrDefault();

                        if (currentConditionStatusEventConfig != null)
                        {
                            currentConditionStatusEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;
                            currentConditionStatusEventConfig.MailLayout = changedConditionStatusEventConfig.MailLayout;
                            currentConditionStatusEventConfig.NotifyList = changedConditionStatusEventConfig.NotifyList; // La lista de notificados si puede cambiar inmediatamente

                            // Validar si hay cambios en alguna propiedad de la configuración del evento
                            if ((currentConditionStatusEventConfig.Interval != changedConditionStatusEventConfig.Interval) ||
                                (currentConditionStatusEventConfig.MinutesBefore != changedConditionStatusEventConfig.MinutesBefore) ||
                                (currentConditionStatusEventConfig.MinutesAfter != changedConditionStatusEventConfig.MinutesAfter) ||
                                (currentConditionStatusEventConfig.Enabled != changedConditionStatusEventConfig.Enabled))
                            {
                                currentConditionStatusEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.Update;
                                currentConditionStatusEventConfig.ConfigChanges = changedConditionStatusEventConfig;
                            }
                        }
                        else
                        {
                            currentConditionStatusEventsConfig.Add(changedConditionStatusEventConfig);
                        }
                    });
            }
        }

        /// <summary>
        /// Aplica los cambios de configuración que haya pendientes para RpmEventConfig del activo especificado
        /// </summary>
        /// <param name="asset">Objeto asset</param>
        public static void ApplyRpmEventConfigChanges(AssetExtension asset)
        {
            // Aplicar cambios en la configuración del evento dinámicamente
            switch (asset.RpmEventConfig.DynamicActionOnEvent)
            {
                case DynamicActionOnEvent.Update:
                    var lastEvent = asset.RpmEventConfig.LastEvent;
                    asset.RpmEventConfig = asset.RpmEventConfig.ConfigChanges;
                    asset.RpmEventConfig.LastEvent = lastEvent; // Recuperar estampa de tiempo del último evento generado
                    asset.RpmEventConfig.ConfigChanges = null;
                    asset.RpmEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;
                    asset.CanDetectRpmEvent = asset.RpmEventConfig.Enabled;
                    break;
                case DynamicActionOnEvent.Delete:
                    asset.RpmEventConfig = null; // Eliminar configuración
                    asset.CanDetectRpmEvent = false;
                    break;
                default:
                    break;
            }
        }

        /// <summary>
        /// Obtiene los asset de los measurement points especificados
        /// </summary>
        /// <param name="measurementPoints">Lista de measurement points</param>
        /// <returns></returns>
        public List<AssetExtension> GetByMeasurementPoint(List<MdVariableExtension> measurementPoints)
        {
            try
            {
                return new AssetExtensionProxy(SecurityBl.AppUserState).GetById(measurementPoints.Select(v => v.ParentId).Distinct().ToList());
            }
            catch (SecurityException ex)
            {
                SecurityBl.Login();
                log.Debug(ex.Message);
                return new AssetExtensionProxy(SecurityBl.AppUserState).GetById(measurementPoints.Select(v => v.ParentId).Distinct().ToList());
            }
        }

        /// <summary>
        /// Resuelve el estado de condición de cada asset y de sus measurement point asociados
        /// </summary>
        /// <param name="assets">Lista de todos los asset</param>
        /// <param name="measurementPoints">Lista de todos los measurement point</param>
        /// <param name="currentStatusByAsset">Diccionario de estado de condición actual para cada asset y sus measurementPoints</param>
        public void StatusResolve(ref List<AssetExtension> assets, List<MdVariableExtension> measurementPoints,
            ref Dictionary<string, CurrentStatusByAsset> currentStatusByAsset)
        {
            new MeasurementPointBl().StatusResolve(assets, ref measurementPoints, ref currentStatusByAsset); // Resolver estado de measurementPoints

            var currentStatusByAssetList = currentStatusByAsset;

            // Procesamiento en paralelo para agilizar la resolución de estados
            Parallel.ForEach(assets, (asset) =>
            {
                // El estado del asset es el estado del measurementPoint con mayor severidad o criticidad
                //var moreCriticalMeasurementPoint = measurementPoints.Where(m => m.ParentId == asset.Id).OrderByDescending(m => m.StatusSeverity).FirstOrDefault();
                var currentStatusAsset = currentStatusByAssetList[asset.Id];
                var moreCriticalStatus = currentStatusAsset.CurrentStatusByMeasurementPoint.Select(p => p.Value).OrderByDescending(p => p.Severity).FirstOrDefault();

                if (!string.IsNullOrEmpty(moreCriticalStatus.StatusId))
                {
                    currentStatusAsset.StatusId = moreCriticalStatus.StatusId;
                    currentStatusAsset.TimeStamp = DateTime.Now; // Estampa de tiempo del nuevo estado de condición del asset
                }

                List<MdVariableExtension> angularReferences = measurementPoints.Where(m => m.PrincipalAssetId == asset.Id && m.IsAngularReference).ToList();
                // Validar atraves de las marcas de paso si la máquina está girando o no
                asset.IsRotating =
                    ((angularReferences != null) && (angularReferences.Count > 0)) ?
                    angularReferences.SelectMany(a => a.SubVariables).Any(s => (s.MeasureType == MeasureType.Rpm) && ((s.Value != null) && ((double)s.Value > 0.0))) :
                    true;
            });
        }

        /// <summary>
        /// Gestiona la grabación de eventos para cada asset
        /// </summary>
        /// <param name="assets">Lista de assets</param>
        /// <param name="measurementPoints">Lista de measurementPoints</param>
        /// <param name="acquisitionBuffer">Búfer circular del sistema</param>
        /// <param name="eventsInProcessByAsset">Referencia del evento en proceso por cada asset</param>
        /// <param name="currentStatusByAsset">Diccionario de estado de condición actual para cada asset y sus measurementPoints</param>
        /// <param name="mailAccountConfiguration">Configuración de cuenta de correo electrónico que usa el Asdaq para enviar notificaciones por correo a usuarios</param>
        public void ManageHistoricalData(ref List<AssetExtension> assets, ref List<MdVariableExtension> measurementPoints,
            Dictionary<string, Dictionary<string, CircularBuffer<BufferDataItem>>> acquisitionBuffer,
            ref Dictionary<string, EventsInProcess> eventsInProcessByAsset, Dictionary<string, CurrentStatusByAsset> currentStatusByAsset,
            MailAccountConfiguration mailAccountConfiguration)
        {
            var _eventsInProcessByAsset = eventsInProcessByAsset;
            var _measurementPoints = measurementPoints;
            var now = DateTime.Now;

            var angularReferences =
                _measurementPoints.Where(p => p.IsAngularReference && p.AngularReferenceConfig != null).ToList();

            Parallel.ForEach(assets, (asset) =>
            {
                try
                {
                    // Si no se adquirieron señales en la actual unidad de adquisición para los puntos del activo entonces realizamos un continue del ForEach
                    if (!_measurementPoints.Any(p => p.PrincipalAssetId == asset.Id))
                    {
                        return;
                    }

                    var assetAcquisitionBuffer = acquisitionBuffer[asset.Id];
                    var index = assetAcquisitionBuffer.Values.First().Head;

                    var isChangeOfRpm = false;
                    //var isEvent = false;                   
                    var normalIntervalElapsed = false;
                    var anyDeadBandTriggered = false;

                    var eventsInProcess = _eventsInProcessByAsset[asset.Id]; // Obtener eventos en proceso del asset actual
                    eventsInProcess.IsNormal = false; // Inicializar variable para que solo pueda llegar a ser true en las validaciones de mas abajo
                    eventsInProcess.IsChangeOfConditionStatus = false;

                    var relatedMeasurementPoints =
                        _measurementPoints
                            .Where(p => /*p.ParentId*/p.PrincipalAssetId == asset.Id)
                            .ToList();

                    // Marcas de paso asociadas al asset actual
                    var relatedAngularReferences =
                        (angularReferences != null) ? angularReferences.Where(angularReference => /*angularReference.ParentId*/angularReference.PrincipalAssetId == asset.Id).ToList() : null;

                    if ((eventsInProcess.RpmEvent == null) && (asset.RpmEventConfig != null))
                    {
                        // Validar y aplicar cambios de configuración pendientes para el evento de cambio de velocidad, previo a la evaluación del evento
                        ApplyRpmEventConfigChanges(asset);
                    }

                    if ((asset.ConditionStatusEventsConfig != null) && (asset.ConditionStatusEventsConfig.Count > 0))
                    {
                        string statusId = eventsInProcess.ConditionStatusEvent?.StatusId; // devuelve el statusId del evento en proceso o cadena vacía
                        var eventsToRemove = new List<string>(); // Lista de statusId de los eventos que se deben eliminar de la lista ConditionStatusEventsConfig

                        var conditionStatusEventsConfig = asset.ConditionStatusEventsConfig.Where(e => e.StatusId != statusId).ToList();

                        for (int i = 0; i < conditionStatusEventsConfig.Count; i++)
                        {
                            // Aplicar cambios en la configuración del evento dinámicamente
                            switch (conditionStatusEventsConfig[i].DynamicActionOnEvent)
                            {
                                case DynamicActionOnEvent.Update:
                                    conditionStatusEventsConfig[i].Enabled = conditionStatusEventsConfig[i].ConfigChanges.Enabled;
                                    conditionStatusEventsConfig[i].Interval = conditionStatusEventsConfig[i].ConfigChanges.Interval;
                                    conditionStatusEventsConfig[i].MinutesAfter = conditionStatusEventsConfig[i].ConfigChanges.MinutesAfter;
                                    conditionStatusEventsConfig[i].MinutesBefore = conditionStatusEventsConfig[i].ConfigChanges.MinutesBefore;
                                    conditionStatusEventsConfig[i] = conditionStatusEventsConfig[i].ConfigChanges;                                       
                                    conditionStatusEventsConfig[i].ConfigChanges = null;
                                    conditionStatusEventsConfig[i].DynamicActionOnEvent = DynamicActionOnEvent.None;
                                    break;
                                case DynamicActionOnEvent.Delete:
                                    eventsToRemove.Add(conditionStatusEventsConfig[i].StatusId);
                                    break;
                                default:
                                    break;
                            }
                        }

                        // Eliminar la configuración de eventos marcados para ser eliminados
                        asset.ConditionStatusEventsConfig.RemoveAll(csec => eventsToRemove.Contains(csec.StatusId));
                    }

                    #region Detectar eventos

                    // Si hay bandas mínimas configuradas y se supera alguna, entonces se validan eventualidades
                    if ((assetAcquisitionBuffer.Values.First().getAtPosition(index).TimeStamp > DateTime.MinValue) && (MinHistoricalDataBandTriggered(asset.Id, relatedMeasurementPoints))) 
                    {
                        isChangeOfRpm = DetectRpmEvent(ref asset, relatedAngularReferences, ref eventsInProcess, now);
                        DetectConditionStatusEvent(ref asset, currentStatusByAsset[asset.Id], ref eventsInProcess, mailAccountConfiguration);
                        normalIntervalElapsed = NormalIntervalElapsed(ref asset, now);
                        anyDeadBandTriggered = AnyDeadBandTriggered(asset.Id, ref relatedMeasurementPoints);
                    }

                    #endregion Detectar eventos

                    #region Procesar eventos

                    if (eventsInProcess.RpmEvent != null)
                    {
                        // Validar si se cancela el evento por que el usuario lo deshabilitó o borró la configuración
                        if ((asset.RpmEventConfig.DynamicActionOnEvent == DynamicActionOnEvent.Delete) ||
                            ((asset.RpmEventConfig.DynamicActionOnEvent == DynamicActionOnEvent.Update) && (!asset.RpmEventConfig.ConfigChanges.Enabled)))
                        {
                            // Aplicar cambios de configuración al evento de cambio de velocidad
                            ApplyRpmEventConfigChanges(asset);

                            eventsInProcess.MinutesBeforeStored = false;
                            eventsInProcess.StoringMinutesBefore = false;
                            eventsInProcess.RpmEvent = null; // Cancelar el evento
                            isChangeOfRpm = false;                               
                        }
                    }

                    if (eventsInProcess.ConditionStatusEvent != null)
                    {
                        var conditionStatusEventConfig =
                            asset.ConditionStatusEventsConfig.Where(csec => csec.StatusId == eventsInProcess.ConditionStatusEvent.StatusId).First();

                        // Validar si se cancela el evento por que el usuario lo deshabilitó o borró la configuración
                        if ((conditionStatusEventConfig.DynamicActionOnEvent == DynamicActionOnEvent.Delete) ||
                            ((conditionStatusEventConfig.DynamicActionOnEvent == DynamicActionOnEvent.Update) && (!conditionStatusEventConfig.ConfigChanges.Enabled)))
                        {
                            // Aplicar cambios de configuración al evento de estado de condición
                            // Aplicar cambios en la configuración del evento dinámicamente
                            switch (conditionStatusEventConfig.DynamicActionOnEvent)
                            {
                                case DynamicActionOnEvent.Update:
                                    var lastEvent = conditionStatusEventConfig.LastSavedEvent;
                                    conditionStatusEventConfig = conditionStatusEventConfig.ConfigChanges;
                                    conditionStatusEventConfig.LastSavedEvent = lastEvent; // Recuperar estampa de tiempo del último evento generado
                                    conditionStatusEventConfig.ConfigChanges = null;
                                    conditionStatusEventConfig.DynamicActionOnEvent = DynamicActionOnEvent.None;
                                    break;
                                case DynamicActionOnEvent.Delete:
                                    asset.ConditionStatusEventsConfig.Remove(conditionStatusEventConfig); // Eliminar la configuración del evento
                                    break;
                                default:
                                    break;
                            }

                            eventsInProcess.MinutesBeforeStored = false;
                            eventsInProcess.StoringMinutesBefore = false;
                            eventsInProcess.ConditionStatusEvent = null; // Cancelar el evento
                            eventsInProcess.IsNormal = false;
                        }
                    }

                    if (eventsInProcess.RpmEvent != null || eventsInProcess.ConditionStatusEvent != null)
                    {
                        //isEvent = true;
                        eventsInProcess.IsChangeOfConditionStatus = eventsInProcess.ConditionStatusEvent != null;

                        if ((!eventsInProcess.MinutesBeforeStored) && (!eventsInProcess.StoringMinutesBefore))
                        {
                            eventsInProcess.StoringMinutesBefore = true;

                            // En segundo plano para evitar perdida de paquetes de evento
                            new TaskFactory().StartNew(() =>
                            {
                                try
                                {
                                    // Almacenar tiempo antes para el evento
                                    StoreMinutesBefore(
                                    asset,
                                    relatedMeasurementPoints,
                                    eventsInProcess,
                                    acquisitionBuffer[asset.Id],
                                    isChangeOfRpm,
                                    eventsInProcess.IsChangeOfConditionStatus);
                                }
                                catch (Exception ex)
                                {
                                    log.Error("Ha ocurrido un error almacenando tiempo antes para un evento", ex);
                                }
                            }, TaskCreationOptions.LongRunning);
                        }

                        if (eventsInProcess.RpmEvent != null)
                        {
                            var endOfEvent =
                                ((now - eventsInProcess.RpmEvent.LastEvent).TotalMinutes >= eventsInProcess.RpmEvent.MinutesAfter);

                            if (endOfEvent)
                            {
                                var modifiedInBuffer = false;

                                acquisitionBuffer[asset.Id].Values
                                    .SelectMany(mdVariables => mdVariables.Where(mdVariable => mdVariable.TimeStamp == eventsInProcess.RpmEvent.LastEvent && !mdVariable.StoredInBD))
                                    .ToList()?
                                    .ForEach(bufferItem =>
                                    {
                                        bufferItem.IsNormal = true;
                                        modifiedInBuffer = true;
                                    });

                                if (!modifiedInBuffer)
                                {
                                    // En segundo plano para evitar perdida de paquetes de evento
                                    new TaskFactory().StartNew(() =>
                                    {
                                        try
                                        {
                                            var useRedundantAcloudForHMI = AsdaqProperties.UseRedundantAcloudForHMI;

                                            if (useRedundantAcloudForHMI)
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

                                            new HistoricalDataProxy(
                                                (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                                useRedundantAcloudForHMI)
                                                    .SetAsIsNormalByTimeStamp(asset.Id, eventsInProcess.RpmEvent.LastEvent);
                                        }
                                        catch (Exception)
                                        {
                                            //log.Error("Ha ocurrido un error almacenando tiempo antes para un evento", ex);
                                        }
                                    }, TaskCreationOptions.LongRunning);                                  
                                }

                                // Liberar evento de cambios de velocidad, para permitir la detección de nuevos eventos
                                eventsInProcess.MinutesBeforeStored = false;
                                eventsInProcess.StoringMinutesBefore = false;
                                eventsInProcess.RpmEvent = null;
                            }
                            else
                            {
                                isChangeOfRpm = true;
                            }
                        }

                        if (eventsInProcess.ConditionStatusEvent != null)
                        {
                            var endOfEvent =
                                ((now - eventsInProcess.ConditionStatusEvent.LastSavedEvent.Value).TotalMinutes >= eventsInProcess.ConditionStatusEvent.MinutesAfter);

                            if (endOfEvent)
                            {
                                //log.Debug(
                                //    string.Format("EL EVENTO PARA {0} GENERADO {1} A FINALIZADO!!!", asset.Name, eventsInProcess.ConditionStatusEvent.LastSavedEvent.Value.ToString("dd/MM/yyyy HH:mm:ss")));

                                // Liberar evento de estado de condición, para permitir la detección de nuevos eventos
                                eventsInProcess.MinutesBeforeStored = false;
                                eventsInProcess.StoringMinutesBefore = false;
                                eventsInProcess.ConditionStatusEvent = null;                               
                            }
                        }
                    }
                    else if (normalIntervalElapsed || anyDeadBandTriggered) // Si es intervalo normal o se superó alguna banda muerta
                    {
                        //isEvent = false;
                        eventsInProcess.IsChangeOfConditionStatus = false;
                    }

                    // Marcar elementos en el búfer como elementos del evento actual
                    assetAcquisitionBuffer.Values
                        .ToList()
                        .ForEach(mdVariable =>
                        {
                            mdVariable.getAtPosition(index).IsNormal = normalIntervalElapsed || eventsInProcess.IsNormal;
                            mdVariable.getAtPosition(index).IsChangeOfRpm = isChangeOfRpm;
                            mdVariable.getAtPosition(index).IsChangeOfConditionStatus = eventsInProcess.IsChangeOfConditionStatus;
                        });

                    #endregion Procesar eventos
                }
                catch (Exception ex)
                {
                    log.Error("Ha ocurrido un error en la gestion de datos historicos del asset: " + asset.Name, ex);
                }
            });
        }

        /// <summary>
        /// Retorna el siguiente evento por cambio de estado de condición que se debe comenzar a grabar
        /// </summary>
        /// <param name="currentAsset">Asset actual</param>
        /// <param name="currentStatus">Estado de condición actual para el asset</param>
        /// <param name="eventsInProcess">Eventos actuales del asset</param>
        /// <param name="mailAccountConfiguration">Configuración de cuenta de correo electrónico que usa el Asdaq para enviar notificaciones por correo a usuarios</param>
        /// <returns></returns>
        private void DetectConditionStatusEvent(ref AssetExtension currentAsset, CurrentStatusByAsset currentStatus, ref EventsInProcess eventsInProcess,
             MailAccountConfiguration mailAccountConfiguration)
        {
            if (eventsInProcess.ConditionStatusEvent != null)
            {
                return; // Solo se permite un evento de estado de condición a la vez
            }

            var asset = currentAsset;

            if (!string.IsNullOrEmpty(currentStatus.StatusId) && asset.ConditionStatusEventsConfig != null)
            {
                var conditionStatusEventConfig = asset.ConditionStatusEventsConfig.Where(c => c.StatusId == currentStatus.StatusId).FirstOrDefault();

                // Si hay configuración de evento para el estado de condición y está activado para grabar el evento
                if ((conditionStatusEventConfig != null) && (conditionStatusEventConfig.Enabled))
                {
                    if ((conditionStatusEventConfig.LastSavedEvent == null) ||
                        ((currentStatus.TimeStamp - conditionStatusEventConfig.LastSavedEvent).Value.TotalMinutes >= conditionStatusEventConfig.Interval))
                    {
                        conditionStatusEventConfig.LastSavedEvent = currentStatus.TimeStamp;
                        eventsInProcess.ConditionStatusEvent = conditionStatusEventConfig; // Nuevo evento por estado de condición

                        // Marcar inicio de evento de estado de condición como IsNormal, para que en una gráfica liviana de tendencia se el valor que generó el cambio de estado de condición
                        eventsInProcess.IsNormal = true;

                        new TaskFactory().StartNew(() =>
                        {
                            try
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

                                var lastSavedEventDto = 
                                    new LastSavedEventDto(asset.Id, conditionStatusEventConfig.StatusId, conditionStatusEventConfig.LastSavedEvent);

                                try
                                {
                                    new AssetExtensionProxy(
                                        (AsdaqProperties.UseRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                        AsdaqProperties.UseRedundantAcloudForHMI)
                                            .UpdateLastSavedEvent(lastSavedEventDto);
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

                                    new AssetExtensionProxy(
                                        (AsdaqProperties.UseRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                                        AsdaqProperties.UseRedundantAcloudForHMI)
                                            .UpdateLastSavedEvent(lastSavedEventDto);
                                }
                            }
                            catch(Exception ex)
                            {
                                log.Debug("Ha ocurrido un error actualizando LastSavedEvent", ex);
                            }
                        }, TaskCreationOptions.LongRunning);

                        // Procesador correos electrónicos de notificación de usuario en segundo plano
                        new TaskFactory().StartNew(() =>
                        {
                            if ((mailAccountConfiguration != null) && (conditionStatusEventConfig.NotifyList != null) && (conditionStatusEventConfig.MailLayout != null))
                            {
                                // Resolver y obtener ruta de activo desde la base de datos
                                var path = new NodeProxy(SecurityBl.AppUserState).GetPath(asset.NodeId);

                                var layoutParams = new Dictionary<string, string>();
                                layoutParams.Add("{RutaActivo}", string.Format(@"{0}\{1}", path, asset.Name));
                                layoutParams.Add("{EstadoCondicion}", AsdaqProperties.RiskStatus.Where(r => r.Id == conditionStatusEventConfig.StatusId).First()?.Name);
                                layoutParams.Add("{EstampaTiempo}", currentStatus.TimeStamp?.ToString("dd/MM/yyyy HH:mm:ss"));

                                var subject = conditionStatusEventConfig.MailLayout.Subject;

                                // Resolver parámetros de plantilla de asunto
                                layoutParams.ToList().ForEach((layoutParam) =>
                                {
                                    subject = subject.Replace(layoutParam.Key, layoutParam.Value);
                                });

                                var message = conditionStatusEventConfig.MailLayout.Message;

                                // Resolver parámetros de plantilla de mensaje
                                layoutParams.ToList().ForEach((layoutParam) =>
                                {
                                    message = message.Replace(layoutParam.Key, layoutParam.Value);
                                });

                                // Obtener lista de destinatarios de correo electrónico
                                var recipientList =
                                    conditionStatusEventConfig.NotifyList
                                        .Where(notificationReceiver =>
                                            notificationReceiver.SendMail &&
                                            !string.IsNullOrWhiteSpace(notificationReceiver.Email))
                                            .Select(notificationReceiver => notificationReceiver.Email)
                                            .ToList();

                                if (recipientList != null)
                                {
                                    // Procesamiento en paralelo
                                    Parallel.ForEach(recipientList, (recipient) =>
                                    {
                                            try
                                            {               
                                                if ((!string.IsNullOrWhiteSpace(mailAccountConfiguration.SmtpServer)) &&
                                                   (mailAccountConfiguration.SmtpPort > 0) &&
                                                   (!string.IsNullOrWhiteSpace(mailAccountConfiguration.UserName)))
                                                {
                                                    MailManager.Send(
                                                        mailAccountConfiguration.SmtpServer,
                                                        mailAccountConfiguration.SmtpPort,
                                                    mailAccountConfiguration.FromAddress,
                                                        recipient,
                                                        subject,
                                                        message,
                                                        false,
                                                    mailAccountConfiguration.UserName,
                                                        CrossCutting.Helpers.AesEnDecryption.DecryptWithPassword(mailAccountConfiguration.Password, "amaqAcloud2016"),
                                                        mailAccountConfiguration.UseSsl);
                                                log.Info("Correo electrónico enviado a: " + recipient);
                                                }
                                            }
                                            catch (Exception ex)
                                            {
                                                log.Error("Ha ocurrido un error enviando correo a " + recipient, ex);
                                            }
                                    });
                                }
                            }
                        }, TaskCreationOptions.LongRunning);

                        log.Debug("Evento por estado de condicion disparado");
                    }
                }
            }
        }

        /// <summary>
        /// Retorna el siguiente evento por arranque o parada con base en medidas de velocidad que se debe comenzar a grabar
        /// </summary>
        /// <param name="currentAsset">Asset actual</param>
        /// <param name="relatedAngularReferences">Puntos de medición de referencia angular asociados al asset</param>
        /// <param name="eventsInProcess"></param>
        /// <param name="now"></param>
        /// <returns></returns>
        private bool DetectRpmEvent(ref AssetExtension currentAsset, List<MdVariableExtension> relatedAngularReferences, ref EventsInProcess eventsInProcess, DateTime now)
        {
            if (!currentAsset.CanDetectRpmEvent)
            {
                return false;
            }

            var _currentAsset = currentAsset;
            var rpmEventConfig = _currentAsset.RpmEventConfig;

            var rpmSubVariable =
                    relatedAngularReferences
                        .Where(relatedAngularReference => relatedAngularReference.Id == _currentAsset.RpmEventConfig.AngularReferenceId)
                        .FirstOrDefault()
                        .SubVariables
                            .Where(subVariable => subVariable.MeasureType == MeasureType.Rpm)
                            .FirstOrDefault();

            var currentRpm = Convert.ToDouble(rpmSubVariable.Value);

            if (_currentAsset.LastDeltaRpmTriggered == null)
            {
                _currentAsset.LastDeltaRpmTriggered = currentRpm; // Semilla (Seed) del algoritmo de cambios de velocidad
            }

            // Si las rpm actuales están en la banda especificada
            if ((currentRpm >= rpmEventConfig.LowRpm && currentRpm <= rpmEventConfig.UpperRpm))
            {
                if (Math.Abs(currentRpm - _currentAsset.LastDeltaRpmTriggered.Value) >= rpmEventConfig.DeltaRpm)
                {
                    _currentAsset.LastDeltaRpmTriggered = currentRpm; // Cambio de velocidad

                    if (eventsInProcess.RpmEvent == null)
                    {
                        eventsInProcess.RpmEvent = rpmEventConfig;
                    }

                    eventsInProcess.RpmEvent.LastEvent = now; // Estampa de tiempo del cambio de velocidad
                    _currentAsset.LastChangeOfRpm = now; // Estampa de tiempo del último cambio de velocidad de la máquina
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Devuelve un valor lógico que indica si ya ha transcurrido el tiempo configurado en NormalInterval desde la última vez que
        /// transcurrió NormalInterval
        /// </summary>
        /// <param name="currentAsset"></param>
        /// <param name="now"></param>
        /// <returns></returns>
        private bool NormalIntervalElapsed(ref AssetExtension currentAsset, DateTime now)
        {
            if (currentAsset.NormalInterval <= 0.0)
            {
                return false;
            }

            // Si se supera NormalInterval o si NormalInterval en segundos es menor o igual a los segundos entre adquisiciones
            if ((currentAsset.LastNormalInterval == null) ||
                ((now - currentAsset.LastNormalInterval).Value.TotalMinutes >= currentAsset.NormalInterval) ||
                ((currentAsset.NormalInterval * 60) <= currentAsset.SecondsBetweenAcquisitions ))
            {
                currentAsset.LastNormalInterval = now;
                log.Debug("NormalInterval disparado");
                return true;
            }

            return false;
        }

        /// <summary>
        /// Valida si al menos una subVariable de alguno de los puntos de medición del asset especificado ha superado 
        /// la banda mínima para el almacenamiento de datos históricos
        /// </summary>
        /// <param name="assetId">Id de asset</param>
        /// <param name="measurementPoints">Lista de measurementPoints</param>
        /// <returns></returns>
        private bool MinHistoricalDataBandTriggered(string assetId, List<MdVariableExtension> measurementPoints)
        {
            var subVariables = measurementPoints
                //.Where(p => p.PrincipalAssetId == assetId)
                .SelectMany(p => p.SubVariables)
                .Where(s => s.MinimumHistoricalDataBand != null).ToList();

            if (subVariables == null)
            {
                return true;
            }

            return
                subVariables.Count == 0
                ||
                subVariables.Where(s =>
                    ((s.MinimumHistoricalDataBand.UpperThreshold != null) && (Convert.ToDouble(s.Value) >= s.MinimumHistoricalDataBand.UpperThreshold.Value))
                    ||
                    ((s.MinimumHistoricalDataBand.LowerThreshold != null) && (Convert.ToDouble(s.Value) <= s.MinimumHistoricalDataBand.LowerThreshold.Value)))
                    .Any();
        }

        /// <summary>
        /// Valida si al menos una subVariable de alguno de los puntos de medición del asset especificado ha superado 
        /// la banda muerta configurada para el almacenamiento de datos históricos
        /// </summary>
        /// <param name="assetId">Id de asset</param>
        /// <param name="measurementPoints">Lista de measurementPoints</param>
        /// <returns></returns>
        private bool AnyDeadBandTriggered(string assetId, ref List<MdVariableExtension> measurementPoints)
        {
            var anyDeadBandTriggered = false;

            // Obtener subVariables con banda muerta configurada
            var subVariablesWithDeadBand =
                measurementPoints
                    //.Where(p => p.ParentId == assetId)
                    .SelectMany(p => p.SubVariables)
                    .Where(s => s.DeadBand > 0).ToList();

            if (subVariablesWithDeadBand == null)
            {
                return false;
            }

            subVariablesWithDeadBand.ForEach(s =>
            {
                if (s.DeadBand > 0.0)
                {
                    var scaledDeadBand = s.DeadBand * (s.Maximum - s.Minimum) / 100; // Conversión de deadBand porcentual a valor en escala real

                    // Validación de banda muerta para cada subVariable
                    if ((s.LastValueByDeadBand == null) || (Math.Abs(Convert.ToDouble(s.Value) - s.LastValueByDeadBand.Value) >= scaledDeadBand))
                    {
                        s.LastValueByDeadBand = Convert.ToDouble(s.Value);
                        anyDeadBandTriggered = true;
                    }
                }
            });

            return anyDeadBandTriggered;
        }

        private void SaveHistoricalData(AssetExtension principalAsset, List<SubVariableExtension> subVariables, bool isNormal, bool isEvent, bool isChangeOfRpm)
        {
            if (SecurityBl.AppUserStateForHMI == null)
            {
                SecurityBl.LoginForHMI();
            }

            var hasStreams = true;
            var localHistoricalDataList = new List<HistoricalData>();

            try
            {
                subVariables
                    .Select(s => s.ParentId)
                    .Distinct().ToList()
                    .ForEach(mdVarId =>
                    {
                        var filteredSubVariables = subVariables.Where(s => s.ParentId == mdVarId).ToList();

                        localHistoricalDataList.Add(new HistoricalData(
                            mdVarId,
                            subVariables.Where(s => s.ParentId == mdVarId).First().TimeStamp,
                            filteredSubVariables
                                .Where(fs => fs.ValueType == Entities.Enums.ValueType.Numeric)?
                                .Select(s =>
                                    new NumericDataItem(
                                        s.Id,
                                        (s.Status != null) ? s.Status[0] : string.Empty,
                                        (double)s.Value))?.ToList(),
                            filteredSubVariables
                                .Where(fs => fs.ValueType == Entities.Enums.ValueType.Waveform)?
                                .Select(s =>
                                    new StreamDataItem(
                                        s.Id,
                                        (s.Status != null) ? s.Status[0] : string.Empty,
                                        (byte[])s.Value))?.ToList(),
                            isEvent,
                            isNormal,
                            isChangeOfRpm,
                            hasStreams,
                            principalAsset.Id,
                            false
                         ));
                    });
                //subVariables
                //    .Select(s => s.ParentId)
                //    .Distinct().ToList()
                //    .ForEach(mdVarId =>
                //    {
                //        localHistoricalDataList.Add(new HistoricalData(                           
                //            mdVarId,
                //            subVariables.Where(s => s.ParentId == mdVarId).First().TimeStamp,
                //            subVariables
                //                .Where(s => s.ParentId == mdVarId)
                //                .Select(s =>
                //                    new SubVariableDataItem(
                //                        s.Id,
                //                        (s.Status != null) ? s.Status[0] : string.Empty,
                //                        s.Value)).ToList(),
                //            isEvent,
                //            isNormal,
                //            isChangeOfRpm,
                //            principalAsset.Id,
                //            false
                //         ));
                //    });

                try
                {
                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).AddMany(localHistoricalDataList/*.Map().ToList()*/); // Respaldo local de datos históricos en LiteDB
                    log.Debug("Datos historicos guardados correctamente en HistoricalData para HMI");
                }
                catch (SecurityException)
                {
                    SecurityBl.LoginForHMI();
                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).AddMany(localHistoricalDataList/*.Map().ToList()*/); // Respaldo local de datos históricos en LiteDB
                    log.Debug("Datos historicos guardados correctamente en HistoricalData para HMI");
                }
            }
            catch (Exception ex)
            {
                log.Error("Ha ocurrido un error almacenando datos historicos en HistoricalData para HMI", ex);
            }
        }
        
        private byte[] ObjectToByteArray(object value)
        {
            var type = value.GetType();
            byte[] binaryArray = null;

            switch (Type.GetTypeCode(type))
            {
                case TypeCode.Boolean:
                    binaryArray = BitConverter.GetBytes((bool)value);
                    break;
                case TypeCode.Char:
                    binaryArray = BitConverter.GetBytes((char)value);
                    break;
                case TypeCode.SByte:
                    binaryArray = new byte[] { (byte)((sbyte)value) };
                    break;
                case TypeCode.Byte:
                    binaryArray = new byte[] { (byte)value };
                    break;
                case TypeCode.Int16:
                    binaryArray = BitConverter.GetBytes((short)value);
                    break;
                case TypeCode.UInt16:
                    binaryArray = BitConverter.GetBytes((ushort)value);
                    break;
                case TypeCode.Int32:
                    binaryArray = BitConverter.GetBytes((int)value);
                    break;
                case TypeCode.UInt32:
                    binaryArray = BitConverter.GetBytes((uint)value);
                    break;
                case TypeCode.Int64:
                    binaryArray = BitConverter.GetBytes((long)value);
                    break;
                case TypeCode.UInt64:
                    binaryArray = BitConverter.GetBytes((ulong)value);
                    break;
                case TypeCode.Single:
                    binaryArray = BitConverter.GetBytes((float)value);
                    break;
                case TypeCode.Double:
                    binaryArray = BitConverter.GetBytes((double)value);
                    break;
                case TypeCode.Decimal:
                    binaryArray = BitConverterExt.GetBytes((decimal)value);
                    break;
                case TypeCode.String:
                    binaryArray = BitConverterExt.GetBytes((string)value);
                    break;
                default:
                    break;
            }
            return binaryArray;
        }

        /// <summary>
        /// Convierte una lista de valores de subVariables de una estampa de tiempo específica en un fragmento de paquete de evento
        /// </summary>
        /// <param name="valuesByTime">Lista de valores de subVariables de una estampa de tiempo específica</param>
        /// <returns></returns>
        private PackageFragment ConvertToPackageFragment(ValuesByTime valuesByTime)
        {
            List<byte> overallsBuffer = new List<byte>();
            List<byte> waveformsBuffer = new List<byte>();
            double totalMilliseconds = 0;

            // Si entre los valores hay waveforms, entonces guardamos la estampa de tiempo
            if (valuesByTime.Values.Any(value => value.GetType().IsArray))
            {
                totalMilliseconds = (valuesByTime.TimeStamp.ToUniversalTime() - DateTime.Parse("1970/01/01")).TotalMilliseconds;
                waveformsBuffer.AddRange(BitConverter.GetBytes(totalMilliseconds));
            }

            // Si entre los valores hay overalls, entonces guardamos la estampa de tiempo
            if (valuesByTime.Values.Any(value => !value.GetType().IsArray))
            {
                totalMilliseconds = (valuesByTime.TimeStamp.ToUniversalTime() - DateTime.Parse("1970/01/01")).TotalMilliseconds;
                overallsBuffer.AddRange(BitConverter.GetBytes(totalMilliseconds));
            }

            valuesByTime.Values.ForEach(value =>
            {
                var type = value.GetType();

                // Si es un array es xq es una forma de onda o posiciones de referencia angular
                if (value.GetType().IsArray)
                {
                    var bytes = (byte[])value;
                    waveformsBuffer.AddRange(BitConverter.GetBytes(bytes.Length)); // Cantidad de datos del array
                    waveformsBuffer.AddRange(bytes); // Valor de la subVariable como flujo de bytes                       
                }
                else
                {
                    overallsBuffer.AddRange(ObjectToByteArray(value)); // Valor de la subVariable como flujo de bytes
                }
            });

            return new PackageFragment(overallsBuffer.ToArray(), waveformsBuffer.ToArray());
        }

        private void StoreMinutesBefore(AssetExtension principalAsset, List<MdVariableExtension> measurementPoints, EventsInProcess eventsInProcess,
            Dictionary<string, CircularBuffer<BufferDataItem>> assetAcquisitionBuffer, bool isChangeOfRpm, bool isChangeOfConditionStatus)
        {
            var useRedundantAcloudForHMI = AsdaqProperties.UseRedundantAcloudForHMI;

            if (useRedundantAcloudForHMI)
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

            var minutesBefore =
                (eventsInProcess.RpmEvent != null) ? eventsInProcess.RpmEvent.MinutesBefore : eventsInProcess.ConditionStatusEvent.MinutesBefore;

            if (minutesBefore > 0.0)
            {
                CircularBuffer<BufferDataItem> angularReferenceBuffer = null;

                if (eventsInProcess.RpmEvent != null)
                {
                    // Obtener el búfer de la referencia angular
                    angularReferenceBuffer = assetAcquisitionBuffer[eventsInProcess.RpmEvent.AngularReferenceId];
                }

                var requestedPositions = (int)Math.Round((minutesBefore * 60) / principalAsset.SecondsBetweenAcquisitions);
                var firstElement = (angularReferenceBuffer != null) ? angularReferenceBuffer : assetAcquisitionBuffer.Values.ElementAt(0);
                var availablePositions = firstElement.Count;

                // Si hay menos de lo solicitado en el búfer
                if (availablePositions < requestedPositions)
                {
                    requestedPositions = availablePositions;
                }

                var baseIndex = firstElement.Head;
                var index = baseIndex % firstElement.Capacity; // Indice basado en la capacidad máxima del búfer

                #region MongoDB

                List<HistoricalData> lastMinsOfHistoricalData = null;
                var now = DateTime.Now;
                var timeStampBase = now.AddSeconds(-(principalAsset.BufferCapacity * principalAsset.SecondsBetweenAcquisitions + 1));

                try
                {
                    lastMinsOfHistoricalData = 
                        new HistoricalDataProxy(
                            (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState, 
                            useRedundantAcloudForHMI)
                                .FindByTimeStampGreaterThan(principalAsset.Id, timeStampBase);
                }
                catch (SecurityException)
                {
                    if (useRedundantAcloudForHMI)
                    {
                        SecurityBl.LoginForHMI();
                    }
                    else
                    {
                        SecurityBl.Login();
                    }

                    lastMinsOfHistoricalData =
                        new HistoricalDataProxy(
                            (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                            useRedundantAcloudForHMI)
                                .FindByTimeStampGreaterThan(principalAsset.Id, timeStampBase);
                }

                var historicalToUpdateIdList = new List<string>();
                var historicalDataNormalIdList = new List<string>(); // Lista de id de los registros de histórico que se van a marcar como IsNormal en la base de datos
                var historicalToAdd = new List<HistoricalData>();

                var seedIndex = -1; // Indice del registro en el búfer que se está evaluando si su valor de velocidad está repetido a lo largo de cierta cantidad de registros del tiempo antes.
                var rpmEqualCountLimit = 6; // Cantidad de veces que se puede repetir un valor de velocidad, antes de marcar el registro en la posición seedIndex como IsNormal.
                var rpmEqualCount = 0; // Contador de registros con igual valor de velocidad en el tiempo antes
                var rpmEqualTriggered = false;

                // Recorrido de lo mas reciente a lo más viejo
                for (int j = 0; j < requestedPositions; j++)
                {
                    if (firstElement.getAtPosition(index).TimeStamp > DateTime.MinValue)
                    {
                        // Algoritmo que valida si la velocidad se repite por x cantidad de veces 
                        if (!rpmEqualTriggered)
                        {
                            if ((isChangeOfRpm) && ((seedIndex == -1) || (firstElement.getAtPosition(index).Rpm != firstElement.getAtPosition(seedIndex).Rpm)))
                            {
                                seedIndex = index;
                                rpmEqualCount = 0;
                            }
                            else
                            {
                                if (seedIndex != -1)
                                {
                                    rpmEqualCount++;

                                    if (rpmEqualCount == rpmEqualCountLimit)
                                    {
                                        assetAcquisitionBuffer.Values
                                            .ToList()
                                            .ForEach(mdVariable =>
                                            {
                                                mdVariable.getAtPosition(seedIndex).IsNormal = true;
                                            });

                                        rpmEqualTriggered = true;
                                    }
                                }
                            }
                        }

                        // Si la velocidad es 0 entonces detenemos el almacenamiento de tiempo antes, ya que significa que no hay información útil de la máquina que justifique guardarla en la base de datos
                        var stop = ((isChangeOfRpm) && (firstElement.getAtPosition(index).Rpm <= 0.0));
                        
                        if (stop)
                        {
                            break; // Terminar ciclo de almacenamiento de tiempo antes para un evento de velocidad, si la velocidad es igual a 0, para no guardar información inútil en la base de datos
                        }
                    }

                    index = (index - 1) % firstElement.Capacity; // Decremento del indice

                    // Control de indices negativos
                    if (index < 0)
                    {
                        index += firstElement.Capacity;
                    }
                }

                index = baseIndex % firstElement.Capacity; // Indice basado en la capacidad máxima del búfer

                // Recorrido de lo mas reciente a lo más viejo
                for (int j = 0; j < requestedPositions; j++)
                {
                    if (firstElement.getAtPosition(index).TimeStamp > DateTime.MinValue)
                    {
                        // Si la velocidad es 0 entonces detenemos el almacenamiento de tiempo antes, ya que significa que no hay información útil de la máquina que justifique guardarla en la base de datos
                        var stop = ((isChangeOfRpm) && (firstElement.getAtPosition(index).Rpm <= 0.0));

                        // Marcar como IsNormal el primer dato del tiempo antes de cambio de velocidad que se encuentre con velocidad igual a 0, o en su defecto el dato más antiguo
                        var isNormal = (isChangeOfRpm) && (stop || ((j == (requestedPositions - 1)) && (!rpmEqualTriggered)));

                        // Validar primero las estampas que existen actualmente
                        var historicalExisting =
                            lastMinsOfHistoricalData
                                .Where(
                                    l => l.TimeStamp == firstElement.getAtPosition(index).TimeStamp.ToUniversalTime())
                                .ToList();

                        if ((historicalExisting != null) && (historicalExisting.Count > 0))
                        {
                            if (isChangeOfRpm)
                            {
                                historicalExisting.Select(h => h.IsChangeOfRpm = true);
                                historicalToUpdateIdList.AddRange(historicalExisting.Select(h => h.Id).ToList());

                                // Alimentar la lista de registros existentes en BD que se deben marcar como IsNormal
                                if (isNormal)
                                {
                                    historicalDataNormalIdList.AddRange(historicalExisting.Select(h => h.Id).ToList());
                                }
                            }
                        }
                        else
                        {
                            // Marcar elementos en el búfer como elementos del evento actual
                            assetAcquisitionBuffer.Values
                                .ToList()
                                .ForEach(mdVariable =>
                                {
                                    mdVariable.getAtPosition(index).IsChangeOfRpm = isChangeOfRpm;                                    
                                    mdVariable.getAtPosition(index).IsNormal |= isNormal; // Operación Or necesaria
                                    mdVariable.getAtPosition(index).IsChangeOfConditionStatus = isChangeOfConditionStatus;
                                });
                        }

                        if (stop)
                        {
                            break; // Terminar ciclo de almacenamiento de tiempo antes para un evento de velocidad, si la velocidad es igual a 0, para no guardar información inútil en la base de datos
                        }
                    }

                    index = (index - 1) % firstElement.Capacity; // Decremento del indice

                    // Control de indices negativos
                    if (index < 0)
                    {
                        index += firstElement.Capacity;
                    }
                }

                // Actualizar existentes
                if (historicalToUpdateIdList.Count > 0)
                {
                    try
                    {
                        new HistoricalDataProxy(
                            (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                            useRedundantAcloudForHMI)
                                .UpdateEventType(historicalToUpdateIdList, isChangeOfConditionStatus, isChangeOfRpm);
                    }
                    catch (SecurityException)
                    {
                        if (useRedundantAcloudForHMI)
                        {
                            SecurityBl.LoginForHMI();
                        }
                        else
                        {
                            SecurityBl.Login();
                        }

                        new HistoricalDataProxy(
                            (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                            useRedundantAcloudForHMI)
                                .UpdateEventType(historicalToUpdateIdList, isChangeOfConditionStatus, isChangeOfRpm);
                    }
                }

                if(historicalDataNormalIdList.Count > 0)
                {
                    try
                    {
                        new HistoricalDataProxy(
                            (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                            useRedundantAcloudForHMI)
                                .SetAsIsNormal(historicalDataNormalIdList);
                    }
                    catch (SecurityException)
                    {
                        if (useRedundantAcloudForHMI)
                        {
                            SecurityBl.LoginForHMI();
                        }
                        else
                        {
                            SecurityBl.Login();
                        }

                        new HistoricalDataProxy(
                            (useRedundantAcloudForHMI) ? SecurityBl.AppUserStateForHMI : SecurityBl.AppUserState,
                            useRedundantAcloudForHMI)
                                .SetAsIsNormal(historicalDataNormalIdList);
                    }
                }

                #endregion MongoDB
            }

            eventsInProcess.MinutesBeforeStored = true;
            eventsInProcess.StoringMinutesBefore = false;
        }

        /// <summary>
        /// Obtiene el tipo de dato Amaq del valor especificado
        /// </summary>
        /// <param name="value">Valor</param>
        /// <returns></returns>
        private AmaqDataType GetAmaqDataType(object value)
        {
            var type = value.GetType();
            var typeCode = (type.IsArray) ? Type.GetTypeCode(type.GetElementType()) : Type.GetTypeCode(type);
            var dataType = AmaqDataType.Double;

            switch (typeCode)
            {
                case TypeCode.SByte:
                    dataType = AmaqDataType.SignedByte;
                    break;
                case TypeCode.Byte:
                    dataType = AmaqDataType.Byte;
                    break;
                case TypeCode.Int16:
                    dataType = AmaqDataType.Int16;
                    break;
                case TypeCode.UInt16:
                    dataType = AmaqDataType.UnsignedInt16;
                    break;
                case TypeCode.Int32:
                    dataType = AmaqDataType.Int32;
                    break;
                case TypeCode.UInt32:
                    dataType = AmaqDataType.UnsignedInt32;
                    break;
                case TypeCode.Single:
                    dataType = AmaqDataType.Single;
                    break;
                case TypeCode.Double:
                    dataType = AmaqDataType.Double;
                    break;
                default:
                    break;
            }

            return dataType;
        }
    }
}
