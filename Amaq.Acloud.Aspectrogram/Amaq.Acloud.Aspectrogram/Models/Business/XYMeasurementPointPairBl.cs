namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Acloud.Business;
    using Data;
    using Entities;
    using Entities.ValueObjects;
    using System.Collections.Generic;

    /// <summary>
    /// Logica de negocio para XYMeasurementPointPair
    /// </summary>
    public class XYMeasurementPointPairBl : CoreBl<XYMeasurementPointPair>
    {
        private XYMeasurementPointPairRepository _xyMeasurementPointPairRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public XYMeasurementPointPairBl(string coreDbUrl) : base(coreDbUrl)
        {
            _xyMeasurementPointPairRepository = new XYMeasurementPointPairRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene el correspondiente Par de la MdVariable pasada como parametro.
        /// </summary>
        /// <param name="mdVariableId">Id de la MdVariable a relacionar</param>
        /// <returns></returns>
        public XYMeasurementPointPair GetXYPair(string mdVariableId)
        {
            return _xyMeasurementPointPairRepository.GetXYPair(mdVariableId);
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables pasada como parametro.
        /// </summary>
        /// <param name="assetId">Id del Asset</param>
        /// <returns></returns>
        public List<XYMeasurementPointPair> GetXYPairByAssetId(string assetId)
        {
            return _xyMeasurementPointPairRepository.GetXYPairByAssetId(assetId);
        }

        /// <summary>
        /// Obtiene los pares configurados de las diferentes MdVariables para los activos con los id especificados.
        /// </summary>
        /// <param name="assetIdList">Lista de id de asset</param>
        /// <returns></returns>
        public List<XYMeasurementPointPair> GetXYPairByAssetId(List<string> assetIdList)
        {
            return _xyMeasurementPointPairRepository.GetXYPairByAssetId(assetIdList);
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
            return _xyMeasurementPointPairRepository.SetSclOptions(sclOpts, xMdVariableId, yMdVariableId);
        }

        /// <summary>
        /// Elimina todos los pares XY relacionados con un AssetId y guarda una lista de pares XY
        /// </summary>
        public void DeleteAndSaveXYMeasurementPointPair(string assetId, List<XYMeasurementPointPair> pairsXY)
        {
            _xyMeasurementPointPairRepository.DeleteByAssetId(assetId);

            if (pairsXY != null)
                _xyMeasurementPointPairRepository.AddMany(pairsXY);
        }

        /// <summary>
        /// Elimina un par XY por medio de una MdVariable Id
        /// </summary>
        public void DeleteByMdVariableId(string mdVariableId)
        {
            _xyMeasurementPointPairRepository.DeleteByMdVariableId(mdVariableId);
        }
    }
}