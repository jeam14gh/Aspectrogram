namespace Amaq.Acloud.AsdaqService.LocalHistoricalData
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
    using System.Security;
    using Entities.Core;
    using Entities.Mappers;

    /// <summary>
    /// Representa un servicio continuo de registro de datos históricos represados localmente
    /// </summary>
    internal class HistoricalDataRegister
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private Task _registerTask;
        private Task _cleanerTask;
        private volatile bool _stop = false;
        private volatile List<AssetExtension> _principalAssets = null;
        private object _principalAssetsLock = new object();

        public List<AssetExtension> PrincipalAssets
        {
            get
            {
                return _principalAssets;
            }
            set
            {
                // Control de concurrencia
                lock (_principalAssetsLock)
                {
                    _principalAssets = value;
                }
            }
        }

        /// <summary>
        /// Inicial el servicio
        /// </summary>
        public void Start()
        {
            _stop = false;
            _registerTask = new Task(DoRegister);
            _registerTask.Start();
            _cleanerTask = new Task(Clean, TaskCreationOptions.LongRunning);
            _cleanerTask.Start();
        }

        /// <summary>
        /// Detiene el servicio
        /// </summary>
        public void Stop()
        {
            _stop = true;

            if (_registerTask != null)
            {
                _registerTask.GetAwaiter().GetResult();
            }

            //if(_cleanerTask != null)
            //{
            //    _cleanerTask.GetAwaiter().GetResult();
            //}
        }

        /// <summary>
        /// Elimina de la colección local de datos históricos, los registros que ya fueron almacenados en el servidor principal y
        /// que ya no se necesitan para nada
        /// </summary>
        private void Clean()
        {
            while (!_stop)
            {
                try
                {              
                    DateTime? lastTimeStamp;

                    lock (_principalAssetsLock)
                    {
                        _principalAssets?.ForEach(principalAsset =>
                        {
                            if (SecurityBl.AppUserStateForHMI == null)
                            {
                                SecurityBl.LoginForHMI();
                            }

                            try
                            {
                                lastTimeStamp =
                                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).FindMaxTimeStamp(principalAsset.Id)?.TimeStamp;
                            }
                            catch (SecurityException)
                            {
                                SecurityBl.LoginForHMI();
                                lastTimeStamp =
                                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).FindMaxTimeStamp(principalAsset.Id)?.TimeStamp;
                            }

                            if (lastTimeStamp != null)
                            {
                                var timeStampBase = lastTimeStamp.Value.AddDays(-AsdaqProperties.HistoricalDataCollectionSizeInDays);

                                try
                                {
                                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).DeleteStoredInMainServerByTimeStampLt(principalAsset.Id, timeStampBase);
                                }
                                catch (SecurityException)
                                {
                                    SecurityBl.LoginForHMI();
                                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).DeleteStoredInMainServerByTimeStampLt(principalAsset.Id, timeStampBase);
                                }
                            }
                        });
                    }
                }
                catch(Exception ex)
                {
                    log.Debug("Ha ocurrido un error en HistoricalDataRegister.Clean", ex);
                }

                System.Threading.Thread.Sleep(120000); // Descanso de 60 segundos para el procesador
            }
        }

        /// <summary>
        /// Intenta continuamente registrar dato históricos pendientes en el servidor principal
        /// </summary>
        private void DoRegister()
        {
            while (!_stop)
            {
                var historicalDataDtoList = new List<HistoricalDataDto>();
                try
                {
                    if (_principalAssets != null)
                    {                                                       
                        var now = DateTime.Now;

                        lock (_principalAssetsLock)
                        {
                            if (SecurityBl.AppUserStateForHMI == null)
                            {
                                SecurityBl.LoginForHMI();
                            }

                            // Gestionar histórico para la HMI
                            _principalAssets.ForEach(principalAsset =>
                            {                                                                  
                                var timeStampBase = now.AddSeconds(-(principalAsset.BufferCapacity * principalAsset.SecondsBetweenAcquisitions)).ToUniversalTime();
                                var localHistoricalDataBatch = new List<HistoricalData>();

                                try
                                {
                                    // Buscar solo los registros que no han sido almacenados en el servidor principal
                                    localHistoricalDataBatch =
                                        new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).FindByTimeStampLessThan(principalAsset.Id, timeStampBase, principalAsset.HistoricalDataUploadLimit, true);
                                }
                                catch (SecurityException ex)
                                {
                                    log.Debug(ex.Message);
                                    SecurityBl.LoginForHMI();
                                    // Buscar solo los registros que no han sido almacenados en el servidor principal
                                    localHistoricalDataBatch =
                                        new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).FindByTimeStampLessThan(principalAsset.Id, timeStampBase, principalAsset.HistoricalDataUploadLimit, true);
                                }

                                // Mongo devuelve las estampas de tiempo como UniversalTime, hay que convertirlas a LocalTime.
                                localHistoricalDataBatch.ForEach(h => { h.TimeStamp = h.TimeStamp.ToLocalTime(); });

                                //historicalDataDtoList = localHistoricalDataBatch.Map().ToList();

                                // Intento de guardado del lote de datos históricos en el servidor
                                if (/*historicalDataDtoList*/localHistoricalDataBatch.Count > 0)
                                {
                                    try
                                    {
                                        new HistoricalDataProxy(SecurityBl.AppUserState).AddMany(/*historicalDataDtoList*/localHistoricalDataBatch);
                                    }
                                    catch (SecurityException ex)
                                    {
                                        log.Debug(ex.Message);
                                        SecurityBl.Login();
                                        new HistoricalDataProxy(SecurityBl.AppUserState).AddMany(/*historicalDataDtoList*/localHistoricalDataBatch);
                                    }

                                    try
                                    {
                                        // Marcar en la bd HMI los registros que fueron almacenados en el servidor principal
                                        new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).SetAsStoredInMainServer(localHistoricalDataBatch.Select(h => h.Id).ToList());
                                    }
                                    catch (SecurityException ex)
                                    {
                                        log.Debug(ex.Message);
                                        SecurityBl.LoginForHMI();
                                        // Marcar en la bd HMI los registros que fueron almacenados en el servidor principal
                                        new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).SetAsStoredInMainServer(localHistoricalDataBatch.Select(h => h.Id).ToList());
                                    }
                                }
                            });               
                        }
                    }
                }
                catch (Exception ex)
                {
                    log.Error("Ha ocurrido un error en HistoricalDataRegister.DoRegister", ex);
                }

                System.Threading.Thread.Sleep(3000); // Descanso de 3 segundos para el procesador
            }
        }
        //private void DoWork()
        //{
        //    while (!_stop)
        //    {
        //        try
        //        {
        //            if (_principalAssets != null)
        //            {
        //                //lock (AsdaqProperties.LocalHistoricalDataLock)
        //                //{                                                          
        //                var now = DateTime.Now;

        //                lock (_principalAssetsLock)
        //                {                           
        //                    if (AsdaqProperties.UseRedundantAcloudForHMI)
        //                    {
        //                        if (SecurityBl.AppUserStateForHMI == null)
        //                        {
        //                            SecurityBl.LoginForHMI();
        //                        }
                                
        //                        // Gestionar histórico para la HMI
        //                        _principalAssets.ForEach(principalAsset =>
        //                        {
        //                            var localHistoricalDataBl = new LocalHistoricalDataBl(principalAsset.Id);
        //                            var historicalDataDtoList = new List<HistoricalDataDto>();
        //                            var timeStampBase = now.AddSeconds(-principalAsset.BufferCapacity);
        //                            var localHistoricalDataBatch = new List<Models.LocalHistoricalData>();

        //                            // Buscar solo los registros que no han sido almacenados en la instancia de mongo para la HMI
        //                            localHistoricalDataBatch =
        //                                localHistoricalDataBl.FindByTimeStampLessThanAsc(
        //                                    timeStampBase,
        //                                    60,
        //                                    true);

        //                            // Creación de Dto que se va a transferir
        //                            localHistoricalDataBatch.GroupBy(localHistoricalDataItem => localHistoricalDataItem.MdVariableId).ToList()
        //                                .ForEach(mdVariableGroup =>
        //                                {
        //                                    var historicalBySubVariable = new List<HistoricalSubVariableDto>();
        //                                    var subVariableCount = mdVariableGroup.ToList()[0].DataBySubVariable.Count;

        //                                    for (int i = 0; i < subVariableCount; i++)
        //                                    {
        //                                        var historical = new List<SubVariableDataItemDto>();

        //                                        mdVariableGroup.ToList().ForEach(localHistoricalDataItem =>
        //                                        {
        //                                            historical.Add(
        //                                                new SubVariableDataItemDto(
        //                                                    localHistoricalDataItem.TimeStamp,
        //                                                    localHistoricalDataItem.DataBySubVariable[i].StatusId,
        //                                                    localHistoricalDataItem.DataBySubVariable[i].Value,
        //                                                    localHistoricalDataItem.IsEvent,
        //                                                    localHistoricalDataItem.IsNormal,
        //                                                    localHistoricalDataItem.IsChangeOfRpm));
        //                                        });

        //                                        historicalBySubVariable.Add(
        //                                            new HistoricalSubVariableDto(
        //                                                mdVariableGroup.ToList()[0].DataBySubVariable[i].SubVariableId,
        //                                                historical));
        //                                    }

        //                                    historicalDataDtoList.Add(new HistoricalDataDto(mdVariableGroup.Key, historicalBySubVariable));
        //                                });

        //                            // Intento de guardado del lote de datos históricos en el servidor
        //                            if (historicalDataDtoList.Count > 0)
        //                            {
        //                                try
        //                                {
        //                                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).AddMany(historicalDataDtoList);
        //                                }
        //                                catch (SecurityException ex)
        //                                {                                            
        //                                    log.Debug(ex.Message);
        //                                    SecurityBl.LoginForHMI();
        //                                    new HistoricalDataProxy(SecurityBl.AppUserStateForHMI, true).AddMany(historicalDataDtoList);
        //                                }

        //                                for (int i = 0; i < localHistoricalDataBatch.Count; i++)
        //                                {
        //                                    localHistoricalDataBatch[i].StoredInMongoForHMI = true; // Marcar registro como guardado en mongoDB HMI
        //                                }

        //                                // Protege el acceso concurrente al archivo de base de datos local
        //                                lock (AsdaqProperties.LocalHistoricalDataLock)
        //                                {
        //                                    // Marcar en LiteDB los registros que ya fueron guardados en mongoDB HMI
        //                                    new LocalHistoricalDataBl(principalAsset.Id).Update(localHistoricalDataBatch);                                           
        //                                }
        //                            }
        //                        });
        //                    }

        //                    if (SecurityBl.AppUserState == null)
        //                    {
        //                        SecurityBl.Login();
        //                    }                            

        //                    // Gestionar subida de histórico al servidor por activo principal
        //                    _principalAssets.ForEach(principalAsset =>
        //                    {
        //                        var localHistoricalDataBl = new LocalHistoricalDataBl(principalAsset.Id);
        //                        var historicalDataDtoList = new List<HistoricalDataDto>();
        //                        var timeStampBase = now.AddSeconds(-principalAsset.BufferCapacity);
        //                        var localHistoricalDataBatch = new List<Models.LocalHistoricalData>();

        //                        // Protege el acceso concurrente al archivo de base de datos local
        //                        //lock (AsdaqProperties.LocalHistoricalDataLock)
        //                        //{
        //                        localHistoricalDataBatch =
        //                            localHistoricalDataBl.FindByTimeStampLessThanAsc(
        //                                timeStampBase,
        //                                20);
        //                        //}

        //                        // Creación de Dto que se va a transferir
        //                        localHistoricalDataBatch.GroupBy(localHistoricalDataItem => localHistoricalDataItem.MdVariableId).ToList()
        //                        .ForEach(mdVariableGroup =>
        //                        {
        //                            var historicalBySubVariable = new List<HistoricalSubVariableDto>();
        //                            var subVariableCount = mdVariableGroup.ToList()[0].DataBySubVariable.Count;

        //                            for (int i = 0; i < subVariableCount; i++)
        //                            {
        //                                var historical = new List<SubVariableDataItemDto>();

        //                                mdVariableGroup.ToList().ForEach(localHistoricalDataItem =>
        //                                {
        //                                    historical.Add(
        //                                        new SubVariableDataItemDto(
        //                                            localHistoricalDataItem.TimeStamp,
        //                                            localHistoricalDataItem.DataBySubVariable[i].StatusId,
        //                                            localHistoricalDataItem.DataBySubVariable[i].Value,
        //                                            localHistoricalDataItem.IsEvent,
        //                                            localHistoricalDataItem.IsNormal,
        //                                            localHistoricalDataItem.IsChangeOfRpm));
        //                                });

        //                                historicalBySubVariable.Add(
        //                                    new HistoricalSubVariableDto(
        //                                        mdVariableGroup.ToList()[0].DataBySubVariable[i].SubVariableId,
        //                                        historical));
        //                            }

        //                            historicalDataDtoList.Add(new HistoricalDataDto(mdVariableGroup.Key, historicalBySubVariable));
        //                        });

        //                        // Intento de guardado del lote de datos históricos en el servidor
        //                        if ((historicalDataDtoList.Count > 0) && (!Equals(SecurityBl.AppUserState, null)))
        //                        {
        //                            try
        //                            {
        //                                new HistoricalDataProxy(SecurityBl.AppUserState).AddMany(historicalDataDtoList);
        //                            }
        //                            catch (SecurityException ex)
        //                            {
        //                                SecurityBl.Login();
        //                                log.Debug(ex.Message);
        //                                new HistoricalDataProxy(SecurityBl.AppUserState).AddMany(historicalDataDtoList);
        //                            }

        //                            // Protege el acceso concurrente al archivo de base de datos local
        //                            lock (AsdaqProperties.LocalHistoricalDataLock)
        //                            {
        //                                // Eliminar lote de datos históricos de la base de datos local
        //                                new LocalHistoricalDataBl(principalAsset.Id).Delete(localHistoricalDataBatch.Select(l => l.Id.ToString()).ToList());
        //                            }
        //                        }
        //                    });
        //                }
        //                //}
        //            }
        //        }
        //        catch (Exception ex)
        //        {
        //            log.Debug("Ha ocurrido un error en HistoricalDataRegister", ex);
        //        }

        //        System.Threading.Thread.Sleep(3000); // Descanso de 4 segundos para el procesador
        //    }
        //}
    }
}
