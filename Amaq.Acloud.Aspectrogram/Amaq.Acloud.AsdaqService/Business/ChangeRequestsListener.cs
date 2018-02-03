namespace Amaq.Acloud.AsdaqService.Business
{
    using Entities.Dtos;
    using Business;
    using log4net;
    using Proxy.Core;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Aspectrogram.Entities;
    using Aspectrogram.Proxy;
    using Models;
    using System.Security;
    using Aspectrogram.Entities.Dtos;

    /// <summary>
    /// Representa un servicio continuo de verificación y aplicación de cambios solicitados de información de subVariables y assets
    /// de forma dinámica
    /// </summary>
    internal class ChangeRequestsListener
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private Task _task;
        private volatile bool _stop = false;

        /// <summary>
        /// Evento que notifica entidades que han sido modificadas y requieren la aplicación inmediata de las modificaciones en el Asdaq
        /// </summary>
        public event EventHandler<ChangedEntities> ChangesToApply;

        /// <summary>
        /// Lanza el evento ChangesToApply
        /// </summary>
        protected virtual void OnChangesToApply(ChangedEntities changedEntities)
        {
            ChangesToApply?.Invoke(this, changedEntities);
        }

        /// <summary>
        /// Inicial el servicio
        /// </summary>
        public void Start()
        {
            _stop = false;
            _task = new Task(DoWork);
            _task.Start();
        }

        /// <summary>
        /// Detiene el servicio
        /// </summary>
        public void Stop()
        {
            _stop = true;

            if (_task != null)
            {
                _task.GetAwaiter().GetResult();
            }
        }

        /// <summary>
        /// Verifica continuamente si hay solicitudes de cambio de información de subVariables y/o assets que se deben reflejar 
        /// dinamicamente en el Asdaq Service
        /// </summary>
        private void DoWork()
        {
            while (!_stop)
            {
                try
                {
                    if (SecurityBl.AppUserState != null)
                    {
                        var existChanges = false;
                        var asdaqProxy = new AsdaqProxy(SecurityBl.AppUserState);
                        var changeRequests = new ChangeRequestsDto();
                        // Buscar solicitudes de cambio en la BD
                        try
                        {
                            changeRequests = asdaqProxy.GetChangeRequests(AsdaqProperties.AsdaqId);
                        }
                        catch (SecurityException ex)
                        {
                            SecurityBl.Login();
                            log.Debug(ex.Message);
                            changeRequests = asdaqProxy.GetChangeRequests(AsdaqProperties.AsdaqId);
                        }

                        
                        if(changeRequests != null)
                        {
                            var subVariableChangeRequests = changeRequests.SubVariableChangeRequests;
                            var assetChangeRequests = changeRequests.AssetChangeRequests;
                            List<SubVariableExtension> changedSubVariables = null;
                            List<AssetExtension> changedAssets = null;

                            if ((subVariableChangeRequests != null) && (subVariableChangeRequests.Count > 0))
                            {
                                var subVariableProxy = new SubVariableExtensionProxy(SecurityBl.AppUserState);

                                // Obtener subVariables que han sido modificadas
                                changedSubVariables =
                                    subVariableProxy.GetById(
                                        subVariableChangeRequests.Select(s => s.EntityId).ToList());

                                existChanges = true;
                            }

                            if((assetChangeRequests != null) && (assetChangeRequests.Count > 0))
                            {
                                var assetProxy = new AssetExtensionProxy(SecurityBl.AppUserState);

                                // Obtener assets que han sido modificados
                                changedAssets =
                                    assetProxy.GetById(
                                        assetChangeRequests.Select(s => s.EntityId).ToList());

                                existChanges = true;
                            }

                            if (existChanges)
                            {
                                // Notificar cambios al Asdaq Service
                                OnChangesToApply(new ChangedEntities(changedSubVariables, changedAssets));

                                log.Debug("Cambios dinámicos de información aplicados correctamente!");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    log.Debug("Ha ocurrido un error en ChangeRequestsListener", ex);
                }

                System.Threading.Thread.Sleep(4000); // Descanso de 4 segundos para el procesador
            }
        }
    }
}
