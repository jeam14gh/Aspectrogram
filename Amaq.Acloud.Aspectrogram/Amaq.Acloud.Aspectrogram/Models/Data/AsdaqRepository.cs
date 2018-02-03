namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using MongoDB.Driver;
    using MongoDB.Bson;
    using Acloud.Data;
    using Entities.ValueObjects;
    using Entities.Dtos;
    using MongoDB.Driver.Linq;
    /// <summary>
    /// Repository Asdaq
    /// </summary>
    public class AsdaqRepository : CoreRepository<Asdaq>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public AsdaqRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene un valor que indica si el Asdaq debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        /// <returns></returns>
        public bool ShouldReconfigure(string asdaqId)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaqId));
            var projection = Builders<Asdaq>.Projection.Include(atr => atr.Reconfigure);
            var result = collection.Find(filter).Project<Asdaq>(projection).FirstOrDefault();

            return (result != null) ? result.Reconfigure : false;
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del asdaq con el Id especificado
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        public void ResetReconfigureFlag(string asdaqId)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaqId));
            var update = Builders<Asdaq>.Update.Set(a => a.Reconfigure, false);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        public List<RealTimeRequest> GetRealTimeRequests(string asdaqId)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaqId));
            var projection = Builders<Asdaq>.Projection.Include(a => a.RealTimeRequests);
            var response = collection.Find(filter).Project<Asdaq>(projection).FirstOrDefault();
            if (response == null)
            {
                response = new Asdaq();
                response.RealTimeRequests = new List<RealTimeRequest>();
            }
            return response.RealTimeRequests;
        }

        /// <summary>
        /// Actualiza las solicitudes tiempo real del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="realTimeRequests">Solicitudes tiempo real para el asdaq</param>
        public void UpdateRealTimeRequests(string asdaqId, List<RealTimeRequest> realTimeRequests)
        {
            var currentRealTimeRequests = GetRealTimeRequests(asdaqId);

            if (currentRealTimeRequests == null)
            {
                currentRealTimeRequests = new List<RealTimeRequest>();
            }
            else
            {
                currentRealTimeRequests.ForEach(currentRealTimeRequest =>
                {
                    currentRealTimeRequest.TimeStamp = currentRealTimeRequest.TimeStamp.ToLocalTime();
                });
            }

            bool exist;

            realTimeRequests.ForEach(realTimeRequest =>
            {
                exist = false;

                if (currentRealTimeRequests != null)
                {
                    currentRealTimeRequests.ForEach(currentRealTimeRequest =>
                    {
                        if (currentRealTimeRequest.SubVariableId == realTimeRequest.SubVariableId)
                        {
                            currentRealTimeRequest.TimeStamp = realTimeRequest.TimeStamp;
                            exist = true;
                            return;
                        }
                    });
                }

                if (!exist)
                {
                    currentRealTimeRequests.Add(realTimeRequest);
                }
            });

            var filter = builder.Eq("_id", new ObjectId(asdaqId));
            var update = Builders<Asdaq>.Update.Set(a => a.RealTimeRequests, currentRealTimeRequests);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        public void DeleteRealTimeRequests(string asdaqId, List<string> subVariableIdList)
        {
            var objectIdList = subVariableIdList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.Eq("_id", new ObjectId(asdaqId));

            var update =
                Builders<Asdaq>.Update
                    .PullFilter(r => r.RealTimeRequests, Builders<RealTimeRequest>.Filter.In("SubVariableId", objectIdList));

            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Obtiene las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        public Asdaq GetChangeRequests(string asdaqId)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaqId));
            var projection = Builders<Asdaq>.Projection.Include(a => a.SubVariableChangeRequests).Include(a => a.AssetChangeRequests);
            var response = collection.Find(filter).Project<Asdaq>(projection).FirstOrDefault();
            return response;
        }

        /// <summary>
        /// Actualiza las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="subVariableChangeRequests">Lista de id de subVariables a eliminar de la lista SubVariableChangeRequests</param>
        /// <param name="assetChangeRequests">Lista de id de assets a eliminar de la lista AssetChangeRequests</param>
        public void UpdateChangeRequests(string asdaqId, List<ChangeRequest> subVariableChangeRequests, List<ChangeRequest> assetChangeRequests)
        {
            var currentChangeRequests = GetChangeRequests(asdaqId);

            if (subVariableChangeRequests != null)
            {
                if (currentChangeRequests.SubVariableChangeRequests == null)
                {
                    currentChangeRequests.SubVariableChangeRequests = new List<ChangeRequest>();
                }

                subVariableChangeRequests
                    .ForEach(subVariableChangeRequest =>
                    {
                        var exist =
                            currentChangeRequests.SubVariableChangeRequests
                                .Any(s => s.EntityId == subVariableChangeRequest.EntityId);

                        if (!exist)
                        {
                            currentChangeRequests.SubVariableChangeRequests
                                .Add(subVariableChangeRequest);
                        }
                    });

            }

            if (assetChangeRequests != null)
            {
                if (currentChangeRequests.AssetChangeRequests == null)
                {
                    currentChangeRequests.AssetChangeRequests = new List<ChangeRequest>();
                }

                assetChangeRequests
                    .ForEach(assetChangeRequest =>
                    {
                        var exist =
                            currentChangeRequests.AssetChangeRequests
                                .Any(s => s.EntityId == assetChangeRequest.EntityId);

                        if (!exist)
                        {
                            currentChangeRequests.AssetChangeRequests
                                .Add(assetChangeRequest);
                        }
                    });
            }

            var filter = builder.Eq("_id", new ObjectId(asdaqId));

            var update =
                Builders<Asdaq>.Update
                    .Set(a => a.SubVariableChangeRequests, currentChangeRequests.SubVariableChangeRequests)
                    .Set(a => a.AssetChangeRequests, currentChangeRequests.AssetChangeRequests);

            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Elimina todas las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        public void DeleteAllChangeRequests(string asdaqId)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaqId));

            var update =
                Builders<Asdaq>.Update
                    .Set(a => a.SubVariableChangeRequests, null)
                    .Set(a => a.AssetChangeRequests, null);

            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Elimina las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="subVariableChangeRequests">Lista de id de subVariables a eliminar de la lista SubVariableChangeRequests</param>
        /// <param name="assetChangeRequests">Lista de id de assets a eliminar de la lista AssetChangeRequests</param>
        public void DeleteChangeRequests(string asdaqId, List<ChangeRequest> subVariableChangeRequests, List<ChangeRequest> assetChangeRequests)
        {
            var objectSubVariableIdList = (subVariableChangeRequests != null) ? subVariableChangeRequests.Select(c => new ObjectId(c.EntityId as string)).ToList() : null;
            var objectAssetIdList = (assetChangeRequests != null) ? assetChangeRequests.Select(c => new ObjectId(c.EntityId as string)).ToList() : null;
            var filter = builder.Eq("_id", new ObjectId(asdaqId));

            UpdateDefinition<Asdaq> update = null;

            if (objectSubVariableIdList != null)
            {
                update = Builders<Asdaq>.Update.PullFilter(r => r.SubVariableChangeRequests, Builders<ChangeRequest>.Filter.In("EntityId", objectSubVariableIdList));
            }

            if (objectAssetIdList != null)
            {
                if (update == null)
                {
                    update = Builders<Asdaq>.Update.PullFilter(r => r.AssetChangeRequests, Builders<ChangeRequest>.Filter.In("EntityId", objectAssetIdList));
                }
                else
                {
                    update.PullFilter(r => r.AssetChangeRequests, Builders<ChangeRequest>.Filter.In("EntityId", objectAssetIdList));
                }
            }

            if (update != null)
            {
                collection.UpdateOne(filter, update);
            }
        }

        /// <summary>
        /// Reconfigura un asdaq
        /// </summary>
        public void Reconfigure(Asdaq asdaq)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaq.Id));
            var update = Builders<Asdaq>.Update.Set(a => a.Reconfigure, asdaq.Reconfigure);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza el Alias y MailAccountConfiguration de un Asdaq
        /// </summary>
        public void UpdateAliasAndMailAccountAsdaq(Asdaq asdaq)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaq.Id));
            var update = Builders<Asdaq>.Update
                .Set(a => a.Alias, asdaq.Alias)
                .Set(a => a.MailAccountConfiguration, asdaq.MailAccountConfiguration);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza todos los NiCompactDaqs por medio de su Asdaq Id
        /// </summary>
        public void UpdateNiCompactDaqsById(string asdaqId, List<NiCompactDaq> niCompactDaqs)
        {
            var filter = builder.Eq("_id", new ObjectId(asdaqId));
            var update = Builders<Asdaq>.Update.Set(a => a.NiCompactDaqs, niCompactDaqs);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza los NiCompactDaqs pertenecientes a un Asdaq
        /// </summary>
        public void UpdateNiCompactDaqs(string asdaqId, List<NiCompactDaq> niCompactDaqs)
        {
            var filter = builder.Eq(e => e.Id, asdaqId);
            var updateNiCompactDaqs = Builders<Asdaq>.Update.Set(s => s.NiCompactDaqs, niCompactDaqs);
            collection.UpdateOne(filter, updateNiCompactDaqs);
        }

        /// <summary>
        /// Actualiza una lista de Aconditioners relacionados a un Asdaq
        /// </summary>
        public void UpdateAconditionerByAsdaq(string asdaqId, List<Aconditioner> aconditioners)
        {
            var filter = builder.Eq(e => e.Id, asdaqId);
            var update = Builders<Asdaq>.Update.Set(s => s.Aconditioners, aconditioners);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Elimina un Aconditioner relacionado a un Asdaq por medio del serial y los canales Asdaq que estén relacionados 
        /// </summary>
        public void DeleteAconditionerBySerial(string asdaqId, string serial)
        {
            var filter = builder.Eq(e => e.Id, asdaqId);
            var update = Builders<Asdaq>.Update.PullFilter(a => a.Aconditioners, acon => acon.Serial == serial);
            collection.FindOneAndUpdate(filter, update);
        }
    }
}
