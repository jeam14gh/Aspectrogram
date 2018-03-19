namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using MongoDB.Driver;
    using MongoDB.Bson;
    using Acloud.Data;
    using Acloud.Entities.Enums;
    using System.Threading.Tasks;
    using Entities.Enums;
    using Acloud.Entities.ValueObjects;

    /// <summary>
    /// Repository SubVariableExtension
    /// </summary>
    public class SubVariableExtensionRepository : CoreRepository<SubVariableExtension>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public SubVariableExtensionRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene las subVariables asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <param name="includeRealTimeData">Indica si se incluyen los datos tiempo real en el resultado(Value y TimeStamp)</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetByMdVariableId(List<string> mdVariableIdList, bool includeRealTimeData = false)
        {
            var filter = builder.In(s => s.ParentId, mdVariableIdList);
            ProjectionDefinition<SubVariableExtension> projection = null;

            if (!includeRealTimeData)
                projection = Builders<SubVariableExtension>.Projection.Exclude(s => s.Value).Exclude(s => s.TimeStamp); // Propiedades tiempo real

            if (projection != null)
                return collection.Find(filter).Project<SubVariableExtension>(projection).ToListAsync().Result;
            else
                return collection.Find(filter).ToListAsync().Result;
        }

        /// <summary>
        /// Obtiene las subVariables con valor de tipo Amaq Stream asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetSignal(List<string> mdVariableIdList)
        {
            var objectIdList = mdVariableIdList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("ParentId", objectIdList) & builder.Eq(s => s.ValueType, ValueType.Waveform);
            return collection.Find(filter).ToList();
        }

        /// <summary>
        /// Obtiene las subVariables con medidas globales asociadas con cualquiera de los id de mdVariable especificados
        /// </summary>
        /// <param name="mdVariableIdList">Lista de id de mdVariable</param>
        /// <returns>Lista de tipo SubVariableExtension</returns>
        public List<SubVariableExtension> GetOverallMeasure(List<string> mdVariableIdList)
        {
            var objectIdList = mdVariableIdList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("ParentId", objectIdList) & builder.Eq(s => s.ValueType, ValueType.Numeric) & builder.Ne("MeasureType", BsonNull.Value);
            return collection.Find(filter).ToList();
        }

        /// <summary>
        /// Obtiene datos tiempo real de las subVariables con los id especificados.
        /// </summary>
        /// <param name="subVariableIdList">Listado de Ids de subVariable</param>
        /// <returns>Datos tiempo real</returns>
        public List<SubVariableExtension> GetRealTimeData(List<string> subVariableIdList)
        {
            var filter = builder.In(s => s.Id, subVariableIdList);
            var projection =
                Builders<SubVariableExtension>.Projection
                    .Include(s => s.Id)
                    .Include(s => s.ValueType)
                    .Include(s => s.Value)
                    .Include(s => s.TimeStamp)
                    .Include(s => s.Status);
            return collection.Find(filter).Project<SubVariableExtension>(projection).ToList();
        }

        /// <summary>
        /// Actualiza las subVariables con la información especificada para cada una, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeDataList">Lista de subVariables con los datos a actualizar</param>
        public void UpdateManyRealTimeData(List<SubVariableExtension> realTimeDataList)
        {
            try
            {
                var locker = new object();
                var models = new WriteModel<SubVariableExtension>[realTimeDataList.Count];
                var r = 0;

                Parallel.ForEach(realTimeDataList, (realTimeData) =>
                {
                    var filter = builder.Eq("_id", new ObjectId(realTimeData.Id));

                    var update = Builders<SubVariableExtension>.Update
                        .Set(s => s.Value, realTimeData.Value)
                        .Set(s => s.TimeStamp, realTimeData.TimeStamp)
                        .Set(s => s.Status, realTimeData.Status);

                    lock (locker)
                    {
                        models[r] = new UpdateOneModel<SubVariableExtension>(filter, update);
                        r++;
                    }
                });

                collection.BulkWriteAsync(models).GetAwaiter().GetResult();
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine(ex.Message);
            }
        }

        /// <summary>
        /// Actualiza la subVariable con la información especificada, pero solo las propiedades necesarias para tiempor real
        /// </summary>
        /// <param name="realTimeData">SubVariable con los datos a actualizar</param>
        public void UpdateRealTimeData(SubVariableExtension realTimeData)
        {
            var filter = builder.Eq("_id", new ObjectId(realTimeData.Id));

            var update = Builders<SubVariableExtension>.Update
                            .Set(s => s.Value, realTimeData.Value)
                            .Set(s => s.TimeStamp, realTimeData.TimeStamp)
                            .Set(s => s.Status, realTimeData.Status);

            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Obtiene una lista de SubVariables por parentId y despues las clona
        /// </summary>
        public List<SubVariableExtension> GetAndCloneSubVariblesByParentId(string parentId)
        {
            var filter = builder.Eq("ParentId", new ObjectId(parentId));
            return collection.Find(filter).ToList();
        }

        /// <summary>
        /// Elimina las SubVariables que su parentId sea igual
        /// </summary>
        public void DeleteByParentId(string parentId)
        {
            var filter = builder.Eq("ParentId", new ObjectId(parentId));
            collection.DeleteMany(filter);
        }

        /// <summary>
        /// Actualiza una lista de SubVariables
        /// </summary>
        public void UpdateMany(List<SubVariableExtension> subVariables)
        {
            foreach (var s in subVariables)
            {
                var filter = builder.Eq("_id", new ObjectId(s.Id));
                var update = Builders<SubVariableExtension>.Update.
                    Set(sb => sb.ParentId, s.ParentId).
                    Set(sb => sb.Name, s.Name).
                    Set(sb => sb.Description, s.Description).
                    Set(sb => sb.ValueType, s.ValueType).
                    Set(sb => sb.Units, s.Units).
                    Set(sb => sb.ThresholdLatency, s.ThresholdLatency).
                    Set(sb => sb.Bands, s.Bands).
                    Set(sb => sb.Maximum, s.Maximum).
                    Set(sb => sb.Minimum, s.Minimum).
                    Set(sb => sb.IsDefaultValue, s.IsDefaultValue).
                    Set(sb => sb.DeadBand, s.DeadBand).
                    Set(sb => sb.MinimumHistoricalDataBand, s.MinimumHistoricalDataBand).
                    Set(sb => sb.MeasureType, s.MeasureType).
                    Set(sb => sb.FromIntegratedWaveform, s.FromIntegratedWaveform).
                    Set(sb => sb.GapCalibrationValue, s.GapCalibrationValue).
                    Set(sb => sb.InitialAxialPosition, s.InitialAxialPosition);

                collection.UpdateOne(filter, update);
            }
        }

        /// <summary>
        /// Define los valores de referencia/compensacion de Amplitud y Fase 1x
        /// Usado para compensar Bode y Polar
        /// </summary>
        /// <param name="mdVariableId">Id de la MdVariable a compensar</param>
        /// <param name="amplitude">Amplitud 1X de referencia</param>
        /// <param name="phase">Fase 1X de referencia</param>
        public void SetCompesation(string mdVariableId, double amplitude, double phase)
        {
            var filter = builder.Eq(s => s.ParentId, mdVariableId) & builder.Eq(s => s.MeasureType, MeasureType.Amplitude1x);
            var update = Builders<SubVariableExtension>.Update.Set(s => s.ReferenceCompesation, amplitude);
            collection.UpdateOne(filter, update);
            filter = builder.Eq(s => s.ParentId, mdVariableId) & builder.Eq(s => s.MeasureType, MeasureType.Phase1x);
            update = Builders<SubVariableExtension>.Update.Set(s => s.ReferenceCompesation, phase);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza la subvariable de Directa 
        /// </summary>
        public void UpdateDirect(SubVariableExtension subVariable, List<Band> bands)
        {
            var filter = builder.Eq(s=>s.Id, subVariable.Id);
            var update = Builders<SubVariableExtension>.Update.
                    Set(sb => sb.Bands, bands).
                    Set(sb => sb.InitialAxialPosition, subVariable.InitialAxialPosition); 
            collection.UpdateOne(filter, update);
        }
    }
}
