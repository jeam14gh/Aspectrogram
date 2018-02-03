namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using System;
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using Libraries.MongoDbRepository.Repository;
    using MongoDB.Driver;
    using MongoDB.Driver.Linq;
    using MongoDB.Bson;
    using Acloud.Data;
    using Entities.ValueObjects;

    /// <summary>
    /// Repository Atransmitter
    /// </summary>
    public class AtrRepository : CoreRepository<Atr>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public AtrRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene que indica si el Atransmitter debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="atrId">Id Atransmitter</param>
        /// <returns></returns>
        public bool ShouldReconfigure(string atrId)
        {
            var filter = builder.Eq("_id", new ObjectId(atrId));
            var projection = Builders<Atr>.Projection.Include(atr => atr.Reconfigure);
            var result = collection.Find(filter).Project<Atr>(projection).FirstOrDefault();

            return (result != null) ? result.Reconfigure : false;
        }

        /// <summary>
        /// Se reccorre cada uno de los modulos y sus respectivos canales que tenga un A-transmitter seleccionado y se actualizan éstos.
        /// </summary>
        /// <param name="atrId">Id del A-transmitter</param>
        /// <param name="modules">Lista de modulos de un A-transmitter</param>
        public void UpdateModule(string atrId, List<AtrModule> modules)
        {
            modules.ForEach(module =>
            {
                var filter = builder.Eq("_id", new ObjectId(atrId)) & builder.Eq("Modules.Serial", module.Serial);
                var update = Builders<Atr>.Update
                    .Set("Modules.$.Alias", module.Alias)
                    .Set("Modules.$.Description", module.Description)
                    .Set("Modules.$.GlobalFrequency", module.GlobalFrequency)
                    .Set("Modules.$.StreamFrequency", module.StreamFrequency)
                    .Set("Modules.$.SampleRate", module.SampleRate)
                    .Set("Modules.$.SamplesToRead", module.SamplesToRead);

                collection.UpdateOne(filter, update);

                var i = 0;
                module.AiChannels.ForEach(a =>
                {
                    var updateAiChannel = Builders<Atr>.Update
                        .Set(string.Format("Modules.$.AiChannels.{0}.ByPassed", i), a.ByPassed)
                        .Set(string.Format("Modules.$.AiChannels.{0}.Enabled", i), a.Enabled)
                        .Set(string.Format("Modules.$.AiChannels.{0}.MdVariableId", i), a.MdVariableId);
                    collection.UpdateOne(filter, updateAiChannel);
                    i++;
                });

                #region Codigo avanzado
                //var type = Type.GetType("AtrModule");
                //var properties = type.GetProperties(System.Reflection.BindingFlags.Public).Where(p => p.CanWrite).ToList();
                //var myUpdate = Builders<Atr>.Update;

                //properties.ForEach(p =>
                //{
                //    myUpdate.Set("Modules.$." + p.Name, module.GetType().GetProperty(p.Name).GetValue(module));
                //});
                #endregion
            });
        }

        /// <summary>
        /// Elimina relacion(es) de punto(s) de medición con Canal(es) Atr 
        /// </summary>
        //public void DeleteRelationshipMdVariableWithAiChannels(string atrId, AtrModule module)
        public void DeleteRelationshipMdVariableWithAiChannels(string atrId, List<AtrModule> modules)
        {
            modules.ForEach(module =>
            {
                var filter = builder.Eq("_id", new ObjectId(atrId)) & builder.Eq("Modules.Serial", module.Serial);
                var i = 0;
                module.AiChannels.ForEach(a =>
                {
                    var updateAiChannel = Builders<Atr>.Update
                        .Set(string.Format("Modules.$.AiChannels.{0}.MdVariableId", i), a.MdVariableId);
                    collection.UpdateOne(filter, updateAiChannel);
                    i++;
                });
            });

            //var filter = builder.Eq("_id", new ObjectId(atrId));
            //for (int i = 0; i < module.AiChannels.Count; i++)
            //{
            //    var update = Builders<Atr>.Update.Set(string.Format("Modules.0.AiChannels.{0}.MdVariableId", i), module.AiChannels[i].MdVariableId);
            //    collection.UpdateOne(filter, update);
            //}
        }

        /// <summary>
        /// Actualiza la propiedad Reconfigure de un Atr
        /// </summary>
        public void UpdateReconfigure(Atr atr)
        {
            var filter = builder.Eq(e => e.Id, atr.Id);
            var update = Builders<Atr>.Update.Set(a => a.Reconfigure, atr.Reconfigure);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza el alias y la descripción de un Atransmitter
        /// </summary>
        public void UpdateAliasAndDescription(Atr atr)
        {
            var filter = builder.Eq(e => e.Id, atr.Id);
            var update = Builders<Atr>.Update.Set(a => a.Alias, atr.Alias).
                Set(d => d.Description, atr.Description);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del atr con el Id especificado
        /// </summary>
        public void ResetReconfigureFlag(string atrId)
        {
            var filter = builder.Eq(e => e.Id, atrId);
            var update = Builders<Atr>.Update.Set(a => a.Reconfigure, false);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del atr con el id especificado
        /// </summary>
        public List<RealTimeRequest> GetRealTimeRequests(string atrId)
        {
            var filter = builder.Eq(e => e.Id, atrId);
            var projection = Builders<Atr>.Projection.Include(a => a.RealTimeRequests);
            var response = collection.Find(filter).Project<Asdaq>(projection).FirstOrDefault();
            return (response == null) ? null : response.RealTimeRequests;
        }

        /// <summary>
        /// Actualiza las solicitudes tiempo real del atr con el id especificado
        /// </summary>
        /// <param name="atrId">Id de atr</param>
        /// <param name="realTimeRequests">Solicitudes tiempo real para el atr</param>
        public void UpdateRealTimeRequests(string atrId, List<RealTimeRequest> realTimeRequests)
        {
            var currentRealTimeRequests = GetRealTimeRequests(atrId);

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

            var filter = builder.Eq("_id", new ObjectId(atrId));
            var update = Builders<Atr>.Update.Set(a => a.RealTimeRequests, currentRealTimeRequests);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del atr con el id especificado
        /// </summary>
        /// <param name="atrId">Id de asdaq</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        public void DeleteRealTimeRequests(string atrId, List<string> subVariableIdList)
        {
            var objectIdList = subVariableIdList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.Eq("_id", new ObjectId(atrId));

            var update =
                Builders<Atr>.Update
                    .PullFilter(r => r.RealTimeRequests, Builders<RealTimeRequest>.Filter.In("SubVariableId", objectIdList));

            collection.UpdateOne(filter, update);
        }
    }
}
