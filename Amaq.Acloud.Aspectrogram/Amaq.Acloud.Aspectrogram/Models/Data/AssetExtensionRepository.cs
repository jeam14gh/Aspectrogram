namespace Amaq.Acloud.Aspectrogram.WebSite.Models.Data
{
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using MongoDB.Driver;
    using Acloud.Data;
    using MongoDB.Bson;
    using Entities.Dtos;
    using System;
    /// <summary>
    /// Repository AssetExtension
    /// </summary>
    public class AssetExtensionRepository : CoreRepository<AssetExtension>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public AssetExtensionRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene los asset con el asdaqId especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns>Lista de objetos de tipo AssetExtension</returns>
        public List<AssetExtension> GetByAsdaq(string asdaqId)
        {
            var filter = builder.Eq(u => u.AsdaqId, asdaqId);
            // Excluir La lista de eventos grabados y la lista de eventos programados
            var projection = Builders<AssetExtension>.Projection.Exclude(a => a.ScheduledEvents);
            return collection.Find(filter).Project<AssetExtension>(projection).ToList();
        }

        /// <summary>
        /// Obtiene el Id del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo</param>
        /// <returns></returns>
        public string GetAssetIdByNode(string nodeId)
        {
            var filter = builder.Eq(a => a.NodeId, nodeId);
            var projection = Builders<AssetExtension>.Projection.Include(a => a.Id);
            var result = collection.Find(filter).Project<AssetExtension>(projection).FirstOrDefault();

            return (result != null) ? result.Id : string.Empty;
        }

        /// <summary>
        /// Obtiene el Id y el AsdaqId del activo correspondiente al nodo especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo</param>
        /// <returns></returns>
        public List<AssetExtension> GetIdAndAsdaqIdByNode(string nodeId)
        {
            FilterDefinition<AssetExtension> filter;
            ProjectionDefinition<AssetExtension> projection;
            List<AssetExtension> result = new List<AssetExtension>();
            filter = builder.Eq(a => a.NodeId, nodeId);
            projection = Builders<AssetExtension>.Projection.Include(a => a.Id).Include(a => a.IsPrincipal).Include(a => a.AsdaqId).Include(a => a.PrincipalAssetId)
                        .Include(a => a.NodeId).Include(a => a.RpmEventConfig).Include(a => a.ConditionStatusEventsConfig).Include(a => a.NormalInterval)
                        .Include(a => a.AtrId).Include(a => a.TripMultiply).Include(a => a.TransientStatusTimeout).Include(a => a.Description).Include(a => a.NominalVelocity);
            AssetExtension current = collection.Find(filter).Project<AssetExtension>(projection).FirstOrDefault();
            if (current == null)
            {
                return null;
            }
            result.Add(current);
            if (current.IsPrincipal)
            {
                filter = builder.Eq(a => a.PrincipalAssetId, current.Id);
                projection = Builders<AssetExtension>.Projection.Include(a => a.Id).Include(a => a.PrincipalAssetId)
                            .Include(a => a.AsdaqId).Include(a => a.NodeId)
                            .Include(a => a.AtrId).Include(a => a.TripMultiply).Include(a => a.TransientStatusTimeout).Include(a => a.Description);
                result.AddRange(collection.Find(filter).Project<AssetExtension>(projection).ToList());
            }
            return result;
        }

        /// <summary>
        /// Elimina un Asset por medio de su NodeId
        /// </summary>
        public void DeleteByNodeId(string nodeId)
        {
            var filter = builder.Eq("NodeId", new ObjectId(nodeId));
            collection.DeleteOne(filter);
        }

        /// <summary>
        /// Elimina varios Assets
        /// </summary>
        public void DeleteMany(List<string> assets)
        {
            var objectIdList = assets.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("_id", objectIdList);
            collection.DeleteMany(filter);
        }

        /// <summary>
        /// Actualiza algunas propiedades de un activo
        /// </summary>
        public void UpdateNameAndDescription(AssetToUpdateDto asset)
        {
            var filter = builder.Eq(n => n.Id, asset.Id);
            var update = Builders<AssetExtension>.Update.
                Set(n => n.Name, asset.Name).
                Set(d => d.Description, asset.Description).
                Set(d => d.NormalInterval, asset.NormalInterval).
                Set(u => u.TripMultiply, asset.TripMultiply).
                Set(u => u.TransientStatusTimeout, asset.TransientStatusTimeout);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Retorna un activo por medio de su nodeId
        /// </summary>
        /// <param name="nodeId"></param>
        /// <returns></returns>
        public AssetExtension GetByNodeId(string nodeId)
        {
            var filter = builder.Eq(a => a.NodeId, nodeId);
            var result = collection.Find(filter).FirstOrDefault();
            return result;
        }

        /// <summary>
        /// Actualiza o elimina la propiedad AsdaqId de cada uno de los Asset's si existe una relación canal - punto de medición
        /// </summary>
        public void UpdateAsdaqId(List<string> assetIdList, string asdaqId, bool unset)
        {
            var filter = builder.In(a => a.Id, assetIdList);
            UpdateDefinition<AssetExtension> update = null;
            update = (unset) ? Builders<AssetExtension>.Update.Unset(a => a.AsdaqId)
                             : Builders<AssetExtension>.Update.Set(a => a.AsdaqId, asdaqId);
            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Elimina varios activos por medio de una lista de NodeId
        /// </summary>
        public void DeleteManyByNodeId(List<string> nodeIdList)
        {
            var objectIdList = nodeIdList.Select(nodeId => new ObjectId(nodeId as string)).ToList();
            var filter = builder.In("NodeId", objectIdList);
            collection.DeleteMany(filter);
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad EventVelocity de un activo principal
        /// </summary>
        public void SaveEventVelocity(AssetExtension asset)
        {
            var filter = builder.Eq(a => a.Id, asset.Id);
            var update = Builders<AssetExtension>.Update.Set(n => n.RpmEventConfig, asset.RpmEventConfig);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad EventVelocity de un activo principal
        /// </summary>
        public void SaveConditionStatusEventsConfig(AssetExtension asset)
        {
            var filter = builder.Eq(a => a.Id, asset.Id);
            var update = Builders<AssetExtension>.Update.Set(n => n.ConditionStatusEventsConfig, asset.ConditionStatusEventsConfig);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza o elimina la propiedad AtrId de cada uno de los Asset's si existe una relación canal - punto de medición
        /// </summary>
        public void UpdateAtrId(List<string> assetIdList, string atrId, bool unset)
        {
            var filter = builder.In(a => a.Id, assetIdList);
            UpdateDefinition<AssetExtension> update = null;
            update = (unset) ? Builders<AssetExtension>.Update.Unset(a => a.AtrId)
                             : Builders<AssetExtension>.Update.Set(a => a.AtrId, atrId);
            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Retorna una lista de activos a partir de una lista de nodeId
        /// </summary>
        public List<AssetExtension> GetByNodeId(List<string> nodeIdList)
        {
            var objectIdList = nodeIdList.Select(nodeId => new ObjectId(nodeId as string)).ToList();
            var filter = builder.In("NodeId", objectIdList);
            var result = collection.Find(filter).ToList();
            return result;
        }

        /// <summary>
        /// Actualiza la propiedad AngularReferenceId del objeto RpmEventConfig de un activo
        /// </summary>
        public void UpdateAngularReferenceId(string assetId, string angularReferenceId)
        {
            var filter = builder.Eq(m => m.Id, assetId);
            var update = Builders<AssetExtension>.Update.
                Set(m => m.RpmEventConfig.AngularReferenceId, angularReferenceId);

            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Actualiza la fecha del último evento generado para el estado de condición y el activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <param name="statusId">Id del estado de condición</param>
        /// <param name="lastSavedEvent">Estampa de tiempo</param>
        public void UpdateLastSavedEvent(string assetId, string statusId, DateTime? lastSavedEvent)
        {
            var filter =
                Builders<AssetExtension>.Filter.And(
                    Builders<AssetExtension>.Filter.Where(a => a.Id == assetId),
                    Builders<AssetExtension>.Filter.ElemMatch(a => a.ConditionStatusEventsConfig, c => c.StatusId == statusId));

            var update = Builders<AssetExtension>.Update.Set(a => a.ConditionStatusEventsConfig[-1].LastSavedEvent, lastSavedEvent);

            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza el nombre de un activo
        /// </summary>
        public void UpdateName(string id, string name)
        {
            var filter = builder.Eq(n => n.Id, id);
            var update = Builders<AssetExtension>.Update.Set(n => n.Name, name);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza ciertas propiedad de un activo
        /// </summary>
        public void UpdateProperties(AssetExtension asset)
        {
            var filter = builder.Eq(n => n.NodeId, asset.Id);
            var update = Builders<AssetExtension>.Update.Set(n => n.Name, asset.Name).
                Set(n => n.NormalInterval, asset.NormalInterval).
                Set(n => n.RpmEventConfig, asset.RpmEventConfig).
                Set(n => n.ConditionStatusEventsConfig, asset.ConditionStatusEventsConfig);
            collection.UpdateOne(filter, update);
        }
    }
}
