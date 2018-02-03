namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using Acloud.Data;
    using Entities;
    using Entities.ValueObjects;
    using MongoDB.Driver;
    using System.Collections.Generic;

    /// <summary>
    /// Repositorio XYMeasurementPointPair
    /// </summary>
    public class XYMeasurementPointPairRepository : CoreRepository<XYMeasurementPointPair>
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="dbUrl">URL del repositorio</param>
        public XYMeasurementPointPairRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene el correspondiente Par de la MdVariable pasada como parametro.
        /// </summary>
        /// <param name="mdVariableId">Id de la MdVariable a relacionar</param>
        /// <returns></returns>
        public XYMeasurementPointPair GetXYPair(string mdVariableId)
        {
            var filter = builder.Or(builder.Eq(m => m.XMdVariableId, mdVariableId), builder.Eq(m => m.YMdVariableId, mdVariableId));
            return collection.Find(filter).FirstOrDefault();
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables pasada como parametro.
        /// </summary>
        /// <param name="assetId">Id del Asset</param>
        /// <returns></returns>
        public List<XYMeasurementPointPair> GetXYPairByAssetId(string assetId)
        {
            var filter = builder.Eq(m => m.AssetId, assetId);
            return collection.Find(filter).ToListAsync().Result;
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables para los activos con los id especificados.
        /// </summary>
        /// <param name="assetIdList">Lista de id de asset</param>
        /// <returns></returns>
        public List<XYMeasurementPointPair> GetXYPairByAssetId(List<string> assetIdList)
        {
            var filter = builder.In(m => m.AssetId, assetIdList);
            return collection.Find(filter).ToListAsync().Result;
        }

        /// <summary>
        /// Define las diferentes opciones de visualizacion del SCL, como Gaps de referencias,
        /// diametros de clearance y punto de inicio del clearance plot.
        /// </summary>
        /// <param name="sclOpts">Opciones del Shaft Centerline</param>
        /// <param name="xMdVariableId">Id de la MdVariable orientada en X</param>
        /// <param name="yMdVariableId">Id de la MdVariable orientada en Y</param>
        /// <returns></returns>
        public string SetSclOptions(SclOptions sclOpts, string xMdVariableId, string yMdVariableId)
        {
            var filter = builder.Eq(xy => xy.XMdVariableId, xMdVariableId) & builder.Eq(xy => xy.YMdVariableId, yMdVariableId);
            var update = Builders<XYMeasurementPointPair>.Update.Set(xy => xy.SclOptions, sclOpts);
            collection.UpdateOne(filter, update);
            return "Ok";
        }

        /// <summary>
        /// Elimina todos los ParesXY que tengan el mismo AssetId relacionado
        /// </summary>
        public void DeleteByAssetId(string assetId)
        {
            var filter = builder.Eq(m => m.AssetId, assetId);
            collection.DeleteMany(filter);
        }

        /// <summary>
        /// Elimina un par XY por medio de una MdVariable Id
        /// </summary>
        public void DeleteByMdVariableId(string mdVariableId)
        {
            var filter = builder.Or(builder.Eq(m => m.XMdVariableId, mdVariableId), builder.Eq(m => m.YMdVariableId, mdVariableId));
            collection.DeleteOne(filter);
        }
    }
}