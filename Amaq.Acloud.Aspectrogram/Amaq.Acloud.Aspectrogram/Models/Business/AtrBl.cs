namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Entities;
    using Data;
    using Amaq.Acloud.Business;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;
    using WebSite.Models.Business;
    using Entities.ValueObjects;
    using Entities.Dtos;

    /// <summary>
    /// Lógica de negocio Atransmitter
    /// </summary>
    public class AtrBl : CoreBl<Atr>
    {
        /// <summary>
        /// Contiene una referencia al repositorio de AtrRepository y sus metodos/atributos.
        /// </summary>
        private AtrRepository _atrRepository = null;

        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public AtrBl(string coreDbUrl) : base(coreDbUrl)
        {
            _atrRepository = new AtrRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene que indica si el Atransmitter debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="atrId">Id Atransmitter</param>
        /// <returns></returns>
        public bool ShouldReconfigure(string atrId)
        {
            return _atrRepository.ShouldReconfigure(atrId);
        }
        /// <summary>
        /// Actauliza una lista de modulos por medio de un IdTransmitter seleccionado
        /// </summary>
        public void UpdateModule(string atrId, List<AtrModule> modules)
        {
            _atrRepository.UpdateModule(atrId, modules);            

            // Buscamos los puntos de medición existentes en los canales para obtener su AssetId
            var listAssetId = new List<string>();
            foreach (var m in modules)
            {
                var mdVariablesId = m.AiChannels.Where(w => w.MdVariableId != null).Select(s => s.MdVariableId).ToList();
                new MdVariableExtensionBl(CoreDbUrl).UpdateAiMeasureMethodOfMB(mdVariablesId);

                foreach (var ch in m.AiChannels)
                {
                    // Obtenemos el parentId de cada punto de medición existente en los canales Atr
                    if (!string.IsNullOrEmpty(ch.MdVariableId))
                    {
                        var parentId = new MdVariableExtensionBl(CoreDbUrl).GetById(ch.MdVariableId).ParentId;
                        listAssetId.Add(parentId);
                    }
                }
            }

            // Actualizamos la propiedad AtrId de cada uno de los activos obtenidos
            if (listAssetId.Count > 0)
                new AssetExtensionBl(CoreDbUrl).UpdateAtrId(listAssetId.Distinct().ToList(), atrId, false);
        }

        /// <summary>
        /// Obtiene la lista completa de los Atransmitter con el nombre de la mdVariable asociada a un Aichannel y no su Id.
        /// </summary>
        /// <returns></returns>
        public List<Atr> GetAllWithMdVariableTag()
        {
            var atrList = _atrRepository.ToList();
            var mdVariableIdList = new List<string>();

            Parallel.ForEach(atrList, a =>
            {
                Parallel.ForEach(a.Modules, m =>
                {
                    mdVariableIdList.AddRange(
                        m.AiChannels.Where(aich => !string.IsNullOrEmpty(aich.MdVariableId)).ToList()
                        .Select(aich => aich.MdVariableId).ToList());
                });
            });

            if (mdVariableIdList.Count > 0)
            {
                var mdVariableTagList = new MdVariableExtensionBl(CoreDbUrl).GetTagById(mdVariableIdList);

                // code new
                //if (mdVariableIdList.Count != mdVariableTagList.Count)
                //{
                //    var toUpdate = false;
                //    foreach (var m in mdVariableIdList)
                //    {
                //        var exist = mdVariableTagList.Exists(w => w.Id == m);
                //        if (!exist)
                //        {
                //            foreach (var a in atrList)
                //            {
                //                foreach (var md in a.Modules)
                //                {
                //                    foreach (var ch in md.AiChannels)
                //                    {
                //                        if (ch.MdVariableId == m)
                //                        {
                //                            ch.MdVariableId = null;
                //                            toUpdate = true;
                //                        }
                //                    }
                //                }

                //                if (toUpdate)
                //                {
                //                    _atrRepository.DeleteRelationshipMdVariableWithAiChannels(a.Id, a.Modules);
                //                    toUpdate = false;
                //                }
                //            }
                //        }
                //    }
                //}// end code new
                if (mdVariableTagList.Count > 0)
                {
                    var asset = new AssetExtensionBl(CoreDbUrl).GetById(mdVariableTagList.Select(s => s.ParentId).Distinct().ToList());

                    Parallel.ForEach(atrList, a =>
                    {
                        Parallel.ForEach(a.Modules, m =>
                        {
                            m.AiChannels.Where(aich => !string.IsNullOrEmpty(aich.MdVariableId)).ToList().ForEach(ai =>
                            {
                                ai.MdVariableTag = asset.Where(ast => ast.Id == mdVariableTagList.Where(md => md.Id == ai.MdVariableId).FirstOrDefault().ParentId).FirstOrDefault().Name + "/" +
                                    mdVariableTagList.Where(md => md.Id == ai.MdVariableId).FirstOrDefault().Name;
                            });
                        });
                    });
                }
            }

            return atrList;
        }

        /// <summary>
        /// Elimina relacion(es) de punto(s) de medición con Canal(es) Atr 
        /// </summary>
        public void DeleteRelationshipMdVariableWithAiChannels(string atrId, List<AtrModule> modules)
        {
            var aiChannelList = new List<AiChannelBase>();
            var listAssetId = new List<string>();

            foreach (var m in modules)
            {
                foreach (var ch in m.AiChannels)
                {
                    if (!string.IsNullOrEmpty(ch.MdVariableId))
                    {
                        var mdVar = new MdVariableExtensionBl(CoreDbUrl).GetById(ch.MdVariableId);
                        if (mdVar != null)
                        {
                            aiChannelList.Add(new AiChannelBase
                            {
                                MdVariableId = ch.MdVariableId,
                                AssetId = mdVar.ParentId,
                                Disassociate = ch.Disassociate
                            });
                        }

                        if (ch.Disassociate == true)
                            ch.MdVariableId = null;
                    }
                }
            }

            var groupByAssetId = aiChannelList.GroupBy(g => g.AssetId);
            foreach (var g in groupByAssetId)
            {
                var group = aiChannelList.Where(w => w.AssetId == g.Key).ToList();
                if (group.Where(a => a.Disassociate == true).Count() == group.Count())
                    listAssetId.Add(g.Key);
            }

            // Seteamos cada uno de los AtrId pertenecientes a cada Asset en null
            if (listAssetId.Count > 0)
                new AssetExtensionBl(CoreDbUrl).UpdateAtrId(listAssetId, null, true);

            _atrRepository.DeleteRelationshipMdVariableWithAiChannels(atrId, modules);

        }

        /// <summary>
        /// Actualiza la propiedad Reconfigure de un Atr
        /// </summary>
        public void UpdateReconfigure(Atr atr)
        {
            _atrRepository.UpdateReconfigure(atr);
        }

        /// <summary>
        /// Actualiza el alias y la descripción de un Atransmitter
        /// </summary>
        public void UpdateAliasAndDescription(Atr atr)
        {
            _atrRepository.UpdateAliasAndDescription(atr);
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del atr con el Id especificado
        /// </summary>
        public void ResetReconfigureFlag(string atrId)
        {
            _atrRepository.ResetReconfigureFlag(atrId);
        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del atr con el id especificado
        /// </summary>
        public List<RealTimeRequest> GetRealTimeRequests(string atrId)
        {
            if (string.IsNullOrEmpty(atrId))
                return null;

            return _atrRepository.GetRealTimeRequests(atrId);
        }

        /// <summary>
        /// Setea la propiedad "Disassociate" en true de todos los canales Atr relacionados con una lista de puntos de medición
        /// </summary>
        //public void SetDisassociateOnTrueInAiChannels(List<string> mdVariablesId)       
        public void SetDisassociateOnTrueInAiChannels(List<MdVariableExtension> mdVariables, string typeElimination)
        {
            var toDelete = false;
            var atrList = _atrRepository.Select(s => new { Modules = s.Modules, Id = s.Id }).ToList();
            foreach (var a in atrList)
            {
                foreach (var m in a.Modules)
                {
                    foreach (var ch in m.AiChannels.Where(w => w.MdVariableId != null))
                    {
                        var mdVar = mdVariables.Where(x => x.Id == ch.MdVariableId).FirstOrDefault();
                        if (mdVar != null)
                        {
                            ch.MdVariableId = null;
                            ch.Disassociate = true;
                            ch.AssetId = mdVar.ParentId;
                            toDelete = true;
                        }
                    }
                }

                if (toDelete)
                {
                    DeleteRelationshipAiChannels(a.Id, a.Modules, typeElimination);
                    toDelete = false;
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        public void DeleteRelationshipAiChannels(string atrId, List<AtrModule> modules, string typeElimination)
        {
            if (typeElimination == "point")
            {
                var aiChannelList = new List<AiChannelBase>();
                var listAssetId = new List<string>();

                foreach (var m in modules)
                {
                    foreach (var ch in m.AiChannels)
                    {
                        if (!string.IsNullOrEmpty(ch.MdVariableId))
                        {
                            if (ch.Disassociate == false)
                            {
                                var parentId = new MdVariableExtensionBl(CoreDbUrl).GetById(ch.MdVariableId).ParentId;
                                aiChannelList.Add(new AiChannelBase
                                {
                                    //MdVariableId = ch.MdVariableId,
                                    AssetId = parentId,
                                    Disassociate = false,
                                });
                            }
                        }

                        if (ch.Disassociate == true)
                        {
                            aiChannelList.Add(new AiChannelBase
                            {
                                //MdVariableId = ch.MdVariableId,
                                AssetId = ch.AssetId,
                                Disassociate = true,
                            });
                            //ch.MdVariableId = null; // Este se debe poner null ya que es el punto a desasociar del canal
                        }
                    }
                }

                var groupToDelete = aiChannelList.Where(g => g.Disassociate == true).GroupBy(g => g.AssetId);
                var groupNotToDelete = aiChannelList.Where(g => g.Disassociate == false).GroupBy(g => g.AssetId);
                foreach (var d in groupToDelete)
                {
                    if (groupNotToDelete.Count() == 0)
                        listAssetId.Add(d.Key);
                    else
                    {
                        var toDelete = groupNotToDelete.Where(w => w.Key == d.Key).Count();
                        if (toDelete == 0)
                            listAssetId.Add(d.Key);
                    }
                }

                // Seteamos cada uno de los AtrId pertenecientes a cada Asset en null
                if (listAssetId.Count > 0)
                    new AssetExtensionBl(CoreDbUrl).UpdateAtrId(listAssetId, null, true);
            }

            _atrRepository.DeleteRelationshipMdVariableWithAiChannels(atrId, modules);
        }

        /// <summary>
        /// Actualiza las solicitudes tiempo real de los atr especificados
        /// </summary>
        /// <param name="realTimeRequestsByAtrList">Lista de solicitudes tiempo por atr</param>
        public void UpdateRealTimeRequests(List<RealTimeRequestsByAtrDto> realTimeRequestsByAtrList)
        {
            var utcDateTime = TimeZoneInfo.ConvertTimeToUtc(DateTime.UtcNow, TimeZoneInfo.Utc);
            var now = TimeZoneInfo.ConvertTime(utcDateTime, TimeZoneInfo.Local);

            realTimeRequestsByAtrList.ForEach(realTimeRequestByAtr =>
            {
                var atrId = realTimeRequestByAtr.AtrId;
                var realTimeRequests =
                    realTimeRequestByAtr.SubVariableIdList
                        .Select(subVariableId => new RealTimeRequest(subVariableId, now)).ToList();

                _atrRepository.UpdateRealTimeRequests(atrId, realTimeRequests);
            });
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del atr con el id especificado
        /// </summary>
        /// <param name="atrId">Id de atr</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        public void DeleteRealTimeRequests(string atrId, List<string> subVariableIdList)
        {
            _atrRepository.DeleteRealTimeRequests(atrId, subVariableIdList);
        }
    }
}
