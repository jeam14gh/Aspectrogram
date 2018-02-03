namespace Amaq.Acloud.Aspectrogram.WebSite.Models.Business
{
    using Acloud.Business;
    using Data;
    using Entities;
    using System.Collections.Generic;
    using Entities.Dtos;
    using System.Threading.Tasks;
    using Aspectrogram.Models.Business;
    using System.Linq;
    using Acloud.Entities.Enums;

    using System.Linq;
    using System;
    /// <summary>
    /// Logica de negocio AssetExtension
    /// </summary>
    public class AssetExtensionBl : CoreBl<AssetExtension>
    {
        private AssetExtensionRepository _assetExtensionRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public AssetExtensionBl(string coreDbUrl) : base(coreDbUrl)
        {
            _assetExtensionRepository = new AssetExtensionRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene los asset con el asdaqId especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns>Lista de objetos de tipo AssetExtension</returns>
        public List<AssetExtension> GetByAsdaq(string asdaqId)
        {
            return _assetExtensionRepository.GetByAsdaq(asdaqId);
        }

        /// <summary>
        /// Obtiene el Id del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id del nodo</param>
        /// <returns></returns>
        public string GetAssetIdByNode(string nodeId)
        {
            return _assetExtensionRepository.GetAssetIdByNode(nodeId);
        }

        /// <summary>
        /// Obtiene el id y el asdaqId del asset con el nodeId especificado
        /// </summary>
        /// <param name="nodeId">Id de nodo</param>
        /// <returns></returns>
        public List<AssetIdAndAsdaqIdDto> GetIdAndAsdaqIdByNode(string nodeId)
        {
            var assetList = _assetExtensionRepository.GetIdAndAsdaqIdByNode(nodeId);
            List<AssetIdAndAsdaqIdDto> result = new List<AssetIdAndAsdaqIdDto>();
            if (assetList == null)
            {
                return null;
            }
            Parallel.ForEach(assetList, asset =>
            {
                result.Add(new AssetIdAndAsdaqIdDto(
                    asset.Id,
                    asset.AsdaqId,
                    asset.IsPrincipal,
                    asset.NodeId,
                    asset.PrincipalAssetId,
                    asset.RpmEventConfig,
                    asset.ConditionStatusEventsConfig,
                    asset.NormalInterval,
                    asset.AtrId,
                    asset.TripMultiply,
                    asset.TransientStatusTimeout,
                    asset.Description,
                    asset.NominalVelocity));
            });
            return result;
        }

        /// <summary>
        /// Elimina varios Assets de una lista
        /// </summary>
        public void DeleteMany(List<string> assets)
        {
            _assetExtensionRepository.DeleteMany(assets);
        }

        /// <summary>
        /// Actualiza algunas propiedades de un activo
        /// </summary>
        public void UpdateNameAndDescription(AssetToUpdateDto asset)
        {
            _assetExtensionRepository.UpdateNameAndDescription(asset);
        }

        /// <summary>
        /// Retorna un activo por medio de su nodeId
        /// </summary>
        public AssetExtension GetByNodeId(string nodeId)
        {
            return _assetExtensionRepository.GetByNodeId(nodeId);
        }

        /// <summary>
        /// 
        /// </summary>
        public AssetExtension Clone(AssetExtension asset)
        {
            var assetList = new List<AssetExtension>();
            var _asset = _assetExtensionRepository.GetById(asset.Id);
            return null;
        }

        /// <summary>
        /// Actualiza o elimina la propiedad AsdaqId de cada uno de los Asset's si existe una relación canal - punto de medición
        /// </summary>
        public void UpdateAsdaqId(List<string> assetIdList, string asdaqId, bool unset)
        {
            _assetExtensionRepository.UpdateAsdaqId(assetIdList, asdaqId, unset);
        }

        /// <summary>
        /// Elimina varios activos por medio de una lista de NodeId
        /// </summary>
        public void DeleteManyByNodeId(List<string> nodeIdList)
        {
            if (nodeIdList != null)
            {
                _assetExtensionRepository.DeleteManyByNodeId(nodeIdList);
            }
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad EventVelocity de un activo principal
        /// </summary>
        public void SaveEventVelocity(AssetExtension asset)
        {
            _assetExtensionRepository.SaveEventVelocity(asset);
        }

        /// <summary>
        /// Guarda los cambios hechos en la propiedad ConditionStatusEventsConfig de un activo principal
        /// </summary>
        public void SaveConditionStatusEventsConfig(AssetExtension asset)
        {
            var currentAsset = _assetExtensionRepository.GetById(asset.Id);

            // Preservar la estampa de tiempo del último evento generado por cada estado de condición.
            // Necesario para que el asdaq service pueda respetar la periodicidad configurada por cada estado de condición.
            asset.ConditionStatusEventsConfig?
                .ForEach(conditionStatusEvent =>
                {
                    conditionStatusEvent.LastSavedEvent =
                        currentAsset?.ConditionStatusEventsConfig?
                            .Where(currentConditionStatusEvent => currentConditionStatusEvent.StatusId == conditionStatusEvent.StatusId)?
                            .FirstOrDefault()?
                            .LastSavedEvent;
                });

            _assetExtensionRepository.SaveConditionStatusEventsConfig(asset);
        }

        /// <summary>
        /// Actualiza o elimina la propiedad AtrId de cada uno de los Asset's si existe una relación canal - punto de medición
        /// </summary>
        public void UpdateAtrId(List<string> assetIdList, string atrId, bool unset)
        {
            _assetExtensionRepository.UpdateAtrId(assetIdList, atrId, unset);
        }

        /// <summary>
        /// Retorna una lista de activos a partir de una lista de nodeId
        /// </summary>
        public List<AssetExtension> GetByNodeId(List<string> nodeIdList)
        {
            if (nodeIdList != null)
                return _assetExtensionRepository.GetByNodeId(nodeIdList);
            else
                return null;
        }

        /// <summary>
        /// Actualiza la propiedad AngularReferenceId del objeto RpmEventConfig de un activo
        /// </summary>
        public void UpdateAngularReferenceId(string assetId, string angularReferenceId)
        {
            _assetExtensionRepository.UpdateAngularReferenceId(assetId, angularReferenceId);
        }

        /// <summary>
        /// Actualiza la fecha del último evento generado para el estado de condición y el activo especificado
        /// </summary>
        /// <param name="lastSavedEventDto">Objeto que especifica el activo, el estado de condición y la estampa de tiempo del último evento generado</param>
        public void UpdateLastSavedEvent(LastSavedEventDto lastSavedEventDto)
        {
            if ((lastSavedEventDto == null) ||
                ((string.IsNullOrWhiteSpace(lastSavedEventDto.AssetId)) || (string.IsNullOrWhiteSpace(lastSavedEventDto.StatusId))))
            {
                return;
            }

            _assetExtensionRepository.UpdateLastSavedEvent(
                lastSavedEventDto.AssetId,
                lastSavedEventDto.StatusId,
                lastSavedEventDto.LastSavedEvent);
        }

        /// <summary>
        /// Actualiza el nombre de un activo
        /// </summary>
        public void UpdateName(string id, string name)
        {
            _assetExtensionRepository.UpdateName(id, name);
        }

        /// <summary>
        /// Actualiza una lista de activos de la vista resumen
        /// </summary>
        public void UpdateMany(List<AssetExtension> assets)
        {
            if (assets != null)
            {
                foreach (var a in assets)
                {
                    if (a.ConditionStatusEventsConfig[0] == null)
                        a.ConditionStatusEventsConfig = null;

                    _assetExtensionRepository.UpdateProperties(a);
                }
            }
        }
    }
}
