namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using MongoDB.Driver;
    using MongoDB.Bson;
    using Acloud.Data;
    using System;

    /// <summary>
    /// Repository MdVariableExtension
    /// </summary>
    public class MdVariableExtensionRepository : CoreRepository<MdVariableExtension>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public MdVariableExtensionRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene las mdVariable asociadas al Id de Asset especificado.
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns>Listado de MdVariableExtension</returns>
        public List<MdVariableExtension> GetByAssetId(string assetId)
        {
            //var filter = builder.Eq(m => m.ParentId, assetId);
            //var projection = Builders<MdVariableExtension>.Projection.Exclude(m => m.AiMeasureMethod);
            //try
            //{
            //    return collection.Find(filter).Project<MdVariableExtension>(projection).ToListAsync().Result;
            //}
            //catch (Exception ex)
            //{
            //    Console.WriteLine(ex.Message);
            //    return null;
            //}
            var filter = builder.Eq(m => m.ParentId, assetId);
            //var projection = Builders<MdVariableExtension>.Projection.Exclude(m => m.AiMeasureMethod);
            try
            {
                return collection.Find(filter).ToListAsync().Result;
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Obtiene las mdVariable asociadas con cualquiera de los id asset especificados
        /// </summary>
        /// <param name="assetIdList">Lista de id asset</param>
        /// <returns>Lista de objetos de tipo MdVariableExtension</returns>
        public List<MdVariableExtension> GetByAssetId(List<string> assetIdList)
        {
            var filter = builder.In(m => m.ParentId, assetIdList);
            var projection = Builders<MdVariableExtension>.Projection.Exclude(m => m.AiMeasureMethod);
            return collection.Find(filter).Project<MdVariableExtension>(projection).ToListAsync().Result;
        }

        /// <summary>
        /// 
        /// </summary>
        public List<MdVariableExtension> GetTagById(List<string> mdVariableIdList)
        {
            var objectIdList = mdVariableIdList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("_id", objectIdList);
            var projection = Builders<MdVariableExtension>.Projection.Include(m => m.Name).Include(p => p.ParentId).Include(i=>i.AiMeasureMethod).Include(i=>i.SensorTypeCode);
            return collection.Find(filter).Project<MdVariableExtension>(projection).ToList();
        }

        /// <summary>
        /// Retorna un punto de medición por medio de su NodeId
        /// </summary>
        public MdVariableExtension GetByNodeId(string nodeId)
        {
            var filter = builder.Eq(m => m.NodeId, nodeId);
            return collection.Find(filter).FirstOrDefault();
        }

        /// <summary>
        /// Retorna una lista de puntos de medición atravez de una lista de nodeId
        /// </summary>
        public List<MdVariableExtension> GetByNodeId(List<string> nodeIdList)
        {
            var objectIdList = nodeIdList.Select(nodeId => new ObjectId(nodeId as string)).ToList();
            var filter = builder.In("NodeId", objectIdList);
            return collection.Find(filter).ToList();
        }

        /// <summary>
        /// Elimina varios puntos de medición por medio de una lista de Id
        /// </summary>
        public void DeleteManyById(List<string> idList)
        {
            var objectIdList = idList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("_id", objectIdList);
            collection.DeleteMany(filter);
        }

        /// <summary>
        /// Actualiza el AiMeasureMethod de un punto de medición
        /// </summary>
        public void UpdateAiMeasureMethod(MdVariableExtension mdVariable)
        {
            var filter = builder.Eq(m => m.Id, mdVariable.Id);
            var update = Builders<MdVariableExtension>.Update.
                Set(m => m.AiMeasureMethod, mdVariable.AiMeasureMethod);
            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Actuliza el AiMeasureMethod de los paramatros M y B de varios puntos de medición
        /// </summary>
        public void UpdateAiMeasureMethodOfMB(MdVariableExtension mdVariable)
        {
            var filter = builder.Eq(m => m.Id, mdVariable.Id);
            var update = Builders<MdVariableExtension>.Update.
                Set(m => m.AiMeasureMethod.M, mdVariable.AiMeasureMethod.M).
                Set(m => m.AiMeasureMethod.B, mdVariable.AiMeasureMethod.B).
                Unset(m => m.AiMeasureMethod.AiMethodId).
                Unset(m => m.AiMeasureMethod.Name).
                Unset(m => m.AiMeasureMethod.ParameterTypes).
                Unset(m => m.AiMeasureMethod.ParameterValues);
            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Actualiza un punto de medición incluyendo la propiedad ParameterValues
        /// </summary>
        public void UpdateIncludingParameterValues(MdVariableExtension mdVariable)
        {
            var filter = builder.Eq(m => m.Id, mdVariable.Id);
            var update = Builders<MdVariableExtension>.Update.
                Set(m => m.ParentId, mdVariable.ParentId).
                Set(m => m.Name, mdVariable.Name).
                Set(m => m.Description, mdVariable.Description).
                Set(m => m.NodeId, mdVariable.NodeId).
                Set(m => m.Sensibility, mdVariable.Sensibility).
                Set(m => m.SensorTypeCode, mdVariable.SensorTypeCode).
                Set(m => m.SensorAngle, mdVariable.SensorAngle).
                Set(m => m.AngularReferenceConfig, mdVariable.AngularReferenceConfig).
                Set(m => m.IsAngularReference, mdVariable.IsAngularReference).
                Set(m => m.AngularReferenceId, mdVariable.AngularReferenceId).
                Set(m => m.Integrate, mdVariable.Integrate).
                Set(m => m.AiMeasureMethod, mdVariable.AiMeasureMethod).
                Set(m => m.RotationDirection, mdVariable.RotationDirection).
                Set(m => m.Units, mdVariable.Units).
                Set(m => m.Orientation, mdVariable.Orientation).
                Set(m => m.RtdParams, mdVariable.RtdParams).
                Set(m => m.VoltageParams, mdVariable.VoltageParams).
                Set(m => m.CurrentParams, mdVariable.CurrentParams).
                Set(m => m.MagneticFlowParams, mdVariable.MagneticFlowParams);

            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Actualiza el AngularReferenceId de un punto de medición
        /// </summary>
        public void UpdateAngularReferenceId(string mdVariableId, string angularReferenceId)
        {
            var filter = builder.Eq(m => m.Id, mdVariableId);
            var update = Builders<MdVariableExtension>.Update.
                Set(m => m.AngularReferenceId, angularReferenceId);

            collection.UpdateMany(filter, update);
        }

        /// <summary>
        /// Actualiza una lista de puntos de acuerdo a la posicion que tenga en el listbox
        /// </summary>
        public void UpdateOrderPositionPoints(MdVariableExtension mdVariable)
        {
            var filter = builder.Eq(m => m.Id, mdVariable.Id);
            var update = Builders<MdVariableExtension>.Update.
                Set(m => m.OrderPosition, mdVariable.OrderPosition);

            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza el nombre de un punto de medición
        /// </summary>
        public void UpdateName(string id, string name)
        {
            var filter = builder.Eq(n => n.Id, id);
            var update = Builders<MdVariableExtension>.Update.Set(n => n.Name, name);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actuliza algunas propiedades de un punto de medición
        /// </summary>
        public void UpdateProperties(MdVariableExtension mdVariable)
        {
            var filter = builder.Eq(m => m.Id, mdVariable.Id);
            var update = Builders<MdVariableExtension>.Update.
                Set(m => m.Name, mdVariable.Name).
                Set(m => m.Orientation, mdVariable.Orientation).
                Set(m => m.SensorAngle, mdVariable.SensorAngle).
                Set(m => m.Units, mdVariable.Units).
                Set(m => m.Sensibility, mdVariable.Sensibility).
                Set(m => m.AiMeasureMethod, mdVariable.AiMeasureMethod).                
                //Set(m => m.AiMeasureMethod.M, mdVariable.AiMeasureMethod.M).
                //Set(m => m.AiMeasureMethod.B, mdVariable.AiMeasureMethod.B).
                Set(m => m.RtdParams, mdVariable.RtdParams).
                Set(m => m.VoltageParams, mdVariable.VoltageParams).
                Set(m => m.CurrentParams, mdVariable.CurrentParams).
                Set(m => m.MagneticFlowParams, mdVariable.MagneticFlowParams);
            collection.UpdateMany(filter, update);
        }
    }
}
