namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Acloud.Business;
    using WebSite.Models.Business;
    using Data;
    using Entities;
    using Entities.Dtos;
    using Entities.ValueObjects;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;

    /// <summary>
    /// Lógica de negocio Asdaq
    /// </summary>
    public class AsdaqBl : CoreBl<Asdaq>
    {
        /// <summary>
        /// Contiene una referencia al repositorio de AsdaqRepository y sus metodos/atributos.
        /// </summary>
        private AsdaqRepository _asdaqRepository = null;

        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public AsdaqBl(string coreDbUrl) : base(coreDbUrl)
        {
            _asdaqRepository = new AsdaqRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene que indica si el Asdaq debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        /// <returns></returns>
        public bool ShouldReconfigure(string asdaqId)
        {
            return _asdaqRepository.ShouldReconfigure(asdaqId);
        }

        /// <summary>
        /// Resetea al valor false, la propiedad Reconfigure del asdaq con el Id especificado
        /// </summary>
        /// <param name="asdaqId">Id Asdaq</param>
        public void ResetReconfigureFlag(string asdaqId)
        {
            _asdaqRepository.ResetReconfigureFlag(asdaqId);
        }

        /// <summary>
        /// Obtiene toda la coleccion Asdaq con el nombre de la mdVariable asociada a un Aichannel y no su MdVariableId.
        /// </summary>
        /// <returns></returns>
        public List<AsdaqConfigDto> GetAllWithMdVariableTag()
        {
            var asdaqList = _asdaqRepository.ToList();
            var mdVariableIdList = new List<string>();
            var asdaqConfigList = new List<AsdaqConfigDto>();
            foreach (var asdaq in asdaqList)
            {
                foreach (var a in asdaq.NiDevices)
                {
                    mdVariableIdList.AddRange(
                        a.AiChannels.Where(aich => !string.IsNullOrEmpty(aich.MdVariableId)).ToList()
                        .Select(aich => aich.MdVariableId).ToList());
                }

                //Aichannels de CompactDaqs
                foreach (var c in asdaq.NiCompactDaqs.SelectMany(a => a.CSeriesModules))
                {
                    mdVariableIdList.AddRange(
                        c.AiChannels.Where(ch => !string.IsNullOrEmpty(ch.MdVariableId)).ToList()
                        .Select(s => s.MdVariableId).ToList());
                }
            }

            if (mdVariableIdList.Count > 0)
            {
                var mdVariableTagList = new MdVariableExtensionBl(CoreDbUrl).GetTagById(mdVariableIdList);
                var asset = new AssetExtensionBl(CoreDbUrl).GetById(mdVariableTagList.Select(s => s.ParentId).Distinct().ToList());

                foreach (var asdaq in asdaqList)
                {
                    foreach (var n in asdaq.NiDevices)
                    {
                        n.AiChannels.Where(aich => !string.IsNullOrEmpty(aich.MdVariableId)).ToList().ForEach(ai =>
                        {
                            ai.MdVariableTag = asset.Where(a => a.Id == mdVariableTagList.Where(md => md.Id == ai.MdVariableId).FirstOrDefault().ParentId).FirstOrDefault().Name + "/" +
                                mdVariableTagList.Where(md => md.Id == ai.MdVariableId).FirstOrDefault().Name;
                        });
                    }

                    // Puntos de medición que puede tener excitación IEPE (Accelerómetro, Velocímetro y Personalizado)
                    var pointsIEPE = new int[] { 2, 3, 8 };

                    //Aichannels de CompactDaqs
                    foreach (var m in asdaq.NiCompactDaqs.SelectMany(a => a.CSeriesModules))
                    {
                        
                        m.AiChannels.Where(ch => !string.IsNullOrEmpty(ch.MdVariableId)).ToList().ForEach(mdt =>
                        {
                            // Validamos si el punto de medición tiene excitación IEPE
                            var point = mdVariableTagList.Where(w => w.Id == mdt.MdVariableId).FirstOrDefault();
                            mdt.SensorTypeCode = point.SensorTypeCode;

                            if (m.AICurrentExcitationValue > 0)
                            {
                                if (pointsIEPE.Contains(point.SensorTypeCode))
                                {
                                    if (point.AiMeasureMethod.ParameterValues != null)
                                    {
                                        if (point.AiMeasureMethod.Name == "CreateAccelerometerChannel")
                                        {
                                            if ((point.AiMeasureMethod.ParameterValues[7].ToString() == "Internal") && (Convert.ToDecimal(point.AiMeasureMethod.ParameterValues[8]) > 0))
                                                mdt.ExcitationIEPE = true;
                                        }
                                    }
                                }
                            }                                                       

                            // Le agregamos la ruta al punto de medición
                            mdt.MdVariableTag = asset.Where(a => a.Id == mdVariableTagList.Where(md => md.Id == mdt.MdVariableId).FirstOrDefault().ParentId).FirstOrDefault().Name + "/" +
                                mdVariableTagList.Where(l => l.Id == mdt.MdVariableId).FirstOrDefault().Name;
                        });
                    }
                }
            }

            for (int i = 0; i < asdaqList.Count; i++)
            {
                if (asdaqList[i].MailAccountConfiguration != null)
                {
                    if (!string.IsNullOrEmpty(asdaqList[i].MailAccountConfiguration.Password))
                    {
                        asdaqList[i].MailAccountConfiguration.Password = CrossCutting.Helpers.AesEnDecryption.DecryptWithPassword(asdaqList[i].MailAccountConfiguration.Password, "amaqAcloud2016");
                        var encodePassword = System.Text.Encoding.UTF8.GetBytes(asdaqList[i].MailAccountConfiguration.Password);
                        asdaqList[i].MailAccountConfiguration.Password = Convert.ToBase64String(encodePassword);
                    }
                }
            }

            //Mapeo de la entidad Asdaq a AsdaqConfigDto
            asdaqConfigList.AddRange(asdaqList.Select(s => new AsdaqConfigDto
            {
                Id = s.Id,
                Alias = s.Alias,
                Reconfigure = s.Reconfigure,
                MailAccountConfiguration = s.MailAccountConfiguration,
                Aconditioners = s.Aconditioners,
                NiDevices = s.NiDevices.Select(nc => new NiDeviceDto
                {
                    Name = nc.Name,
                    ProductCategory = nc.ProductCategory,
                    SampleRate = nc.SampleRate,
                    SamplesToRead = nc.SamplesToRead,
                    TerminalConfiguration = nc.TerminalConfiguration,
                    CompatibleTerminalConfigurations = nc.CompatibleTerminalConfigurations,
                    AiChannels = nc.AiChannels,
                    CompatibleMeasures = null,
                    // Se incluyen estas propiedades ↓ debido a que ciertos Asdaq no son de tipo CompactDaqs 
                    AICurrentExcitationValue = nc.AICurrentExcitationValue,
                    ProductType = nc.ProductType,
                    FrecuencyRange = nc.FrecuencyRange,
                    NumberOfLines = nc.NumberOfLines,
                    SamplingTime = nc.SamplingTime,
                    FrecuencyDelta = nc.FrecuencyDelta
                }).ToList()
                .Concat(s.NiCompactDaqs.SelectMany(cs => cs.CSeriesModules.Select(m => new NiDeviceDto
                {
                    Name = m.Name,
                    ProductCategory = m.ProductCategory,
                    SampleRate = m.SampleRate,
                    SamplesToRead = m.SamplesToRead,
                    TerminalConfiguration = m.TerminalConfiguration,
                    CompatibleTerminalConfigurations = m.CompatibleTerminalConfigurations,
                    AiChannels = m.AiChannels,
                    CompatibleMeasures = m.CompatibleMeasures,
                    AICurrentExcitationValue = m.AICurrentExcitationValue,
                    ProductType = m.ProductType,
                    FrecuencyRange = m.FrecuencyRange,
                    NumberOfLines= m.NumberOfLines,
                    SamplingTime= m.SamplingTime,
                    FrecuencyDelta= m.FrecuencyDelta
                })).ToList()).ToList()

                //.Concat(s.NiCompactDaqs.Select(ndt => new NiDeviceDto
                //{
                //    Name = ndt.Name,
                //    ProductCategory = "CompactDaq",
                //    SampleRate = 0,
                //    SamplesToRead = 0,
                //    TerminalConfiguration = "NA",
                //    AiChannels = ndt.CSeriesModules.SelectMany(sl => sl.AiChannels).ToList()
                //}).ToList()).ToList()

            }));

            return asdaqConfigList;
        }

        /// <summary>
        /// Actualiza todos los dispositivos de adquisición (NiDevices y NiCompactDaqs) asociados a un AsdaqId
        /// </summary>
        public void UpdateDevice(string asdaqId, List<NiDeviceDto> devices)
        {
            // Obtiene todos los Aichannels del Asdaq y toma unicamente los canales relacionados para actualizar el AiMeasureMethod de cada punto de medición. 
            for (int d = 0; d < devices.Count; d++)
            {
                var channels = devices[d].AiChannels.Where(m => m.MdVariableId != null).ToList();//
                
                // Verificamos si el dispositivo es compatible o no con un Acelerometro para actualizar el AiMeasureMethod de cada punto de medición.
                if (devices[d].CompatibleMeasures != null)
                {
                    if (devices[d].CompatibleMeasures.Exists(e => e == "Accelerometer"))
                        new MdVariableExtensionBl(CoreDbUrl).UpdateAiMeasureMethod(channels, true, devices[d].AICurrentExcitationValue);
                    else
                        new MdVariableExtensionBl(CoreDbUrl).UpdateAiMeasureMethod(channels, false, devices[d].AICurrentExcitationValue);
                }
            }

            var assetIdList = new List<string>();
            var asdaq = _asdaqRepository.GetById(asdaqId);

            var _niDevices = devices.Where(w => w.ProductCategory != "CSeriesModule").Select(nd => new NiDevice
            {
                Name = nd.Name,
                ProductCategory = nd.ProductCategory,
                SampleRate = nd.SampleRate,
                SamplesToRead = nd.SamplesToRead,
                TerminalConfiguration = nd.TerminalConfiguration,
                AiChannels = nd.AiChannels
            }).ToList();

            var _niCompactDaqs = devices.Where(w => w.ProductCategory == "CSeriesModule").Select(c => new NiDevice
            {
                Name = c.Name,
                ProductCategory = c.ProductCategory,
                SampleRate = c.SampleRate,
                SamplesToRead = c.SamplesToRead,
                TerminalConfiguration = c.TerminalConfiguration,
                AiChannels = c.AiChannels,
                FrecuencyRange = c.FrecuencyRange,
                NumberOfLines = c.NumberOfLines,
                SamplingTime= c.SamplingTime,
                FrecuencyDelta= c.FrecuencyDelta
            }).ToList();

            var niDevicesList = asdaq.NiDevices;

            for (int x = 0; x < niDevicesList.Count; x++)
            {
                for (int i = 0; i < _niDevices.Count; i++)
                {
                    if (niDevicesList[x].Name == _niDevices[i].Name)
                    {
                        niDevicesList[x].Name = _niDevices[i].Name;
                        niDevicesList[x].ProductCategory = _niDevices[i].ProductCategory;
                        niDevicesList[x].SampleRate = _niDevices[i].SampleRate;
                        niDevicesList[x].SamplesToRead = _niDevices[i].SamplesToRead;
                        niDevicesList[x].TerminalConfiguration = _niDevices[i].TerminalConfiguration;
                        niDevicesList[x].AiChannels = _niDevices[i].AiChannels;
                        _niDevices.RemoveAt(i);
                        break;
                    }
                }
            }

            var cdaqModules = asdaq.NiCompactDaqs.SelectMany(s => s.CSeriesModules).ToList();

            for (int i = 0; i < cdaqModules.Count; i++)
            {
                for (int c = 0; c < _niCompactDaqs.Count; c++)
                {
                    if (_niCompactDaqs[0].Name == cdaqModules[i].Name)
                    {
                        cdaqModules[i].Name = _niCompactDaqs[0].Name;
                        cdaqModules[i].ProductCategory = _niCompactDaqs[0].ProductCategory;
                        cdaqModules[i].SampleRate = _niCompactDaqs[0].SampleRate;
                        cdaqModules[i].SamplesToRead = _niCompactDaqs[0].SamplesToRead;
                        cdaqModules[i].TerminalConfiguration = _niCompactDaqs[0].TerminalConfiguration;
                        cdaqModules[i].AiChannels = _niCompactDaqs[0].AiChannels;
                        cdaqModules[i].FrecuencyRange = _niCompactDaqs[0].FrecuencyRange;
                        cdaqModules[i].NumberOfLines = _niCompactDaqs[0].NumberOfLines;
                        cdaqModules[i].SamplingTime = _niCompactDaqs[0].SamplingTime;
                        cdaqModules[i].FrecuencyDelta = _niCompactDaqs[0].FrecuencyDelta;
                        _niCompactDaqs.RemoveAt(c);
                        break;
                    }
                }

            }

            _asdaqRepository.Update(asdaq);

            for (int nd = 0; nd < asdaq.NiDevices.Count; nd++)
            {
                for (int ch = 0; ch < asdaq.NiDevices[nd].AiChannels.Count; ch++)
                {
                    var mdVariableId = asdaq.NiDevices[nd].AiChannels[ch].MdVariableId;
                    if (!string.IsNullOrEmpty(mdVariableId))
                    {
                        var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).GetById(mdVariableId);
                        assetIdList.Add(_mdVariable.ParentId);
                    }
                }
            }

            if (assetIdList.Count == 0)
            {
                for (int nc = 0; nc < asdaq.NiCompactDaqs.Count; nc++)
                {
                    for (int csm = 0; csm < asdaq.NiCompactDaqs[nc].CSeriesModules.Count; csm++)
                    {
                        for (int aic = 0; aic < asdaq.NiCompactDaqs[nc].CSeriesModules[csm].AiChannels.Count; aic++)
                        {
                            var mdVariableId = asdaq.NiCompactDaqs[nc].CSeriesModules[csm].AiChannels[aic].MdVariableId;
                            if (!string.IsNullOrEmpty(mdVariableId))
                            {
                                var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).GetById(mdVariableId);
                                assetIdList.Add(_mdVariable.ParentId);
                            }
                        }
                    }
                }
            }

            // Actualizamos la propiedad AsdaqId de cada uno de los activos obtenidos
            if (assetIdList.Count > 0)
                new AssetExtensionBl(CoreDbUrl).UpdateAsdaqId(assetIdList.Distinct().ToList(), asdaqId, false);

        }

        /// <summary>
        /// Obtiene las solicitudes tiempo real del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        public List<RealTimeRequest> GetRealTimeRequests(string asdaqId)
        {
            if (string.IsNullOrEmpty(asdaqId))
            {
                return null;
            }

            return _asdaqRepository.GetRealTimeRequests(asdaqId);
        }

        /// <summary>
        /// Actualiza las solicitudes tiempo real de los asdaq especificados
        /// </summary>
        /// <param name="realTimeRequestsByAsdaqList">Lista de solicitudes tiempo por asdaq</param>
        public void UpdateRealTimeRequests(List<RealTimeRequestsByAsdaqDto> realTimeRequestsByAsdaqList)
        {
            var utcDateTime = TimeZoneInfo.ConvertTimeToUtc(DateTime.UtcNow, TimeZoneInfo.Utc);
            var now = TimeZoneInfo.ConvertTime(utcDateTime, TimeZoneInfo.Local);

            realTimeRequestsByAsdaqList.ForEach(realTimeRequestByAsdaq =>
            {
                var asdaqId = realTimeRequestByAsdaq.AsdaqId;
                var realTimeRequests =
                    realTimeRequestByAsdaq.SubVariableIdList
                        .Select(subVariableId => new RealTimeRequest(subVariableId, now)).ToList();

                _asdaqRepository.UpdateRealTimeRequests(asdaqId, realTimeRequests);
            });
        }

        /// <summary>
        /// Elimina las solicitudes tiempo real especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="subVariableIdList">Lista de id de subVariables a eliminar de la lista de solicitudes tiempo real</param>
        public void DeleteRealTimeRequests(string asdaqId, List<string> subVariableIdList)
        {
            _asdaqRepository.DeleteRealTimeRequests(asdaqId, subVariableIdList);
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal y valida si el AsdaqId del Asset debe setearse en null
        /// </summary>
        public void DeleteRelationshipMdVariableWithAiChannels(string asdaqId, NiDeviceDto device)
        {
            var asdaq = _asdaqRepository.GetById(asdaqId);
            var aiChannelList = new List<AiChannelBase>();
            var assetIdList = new List<string>();

            var niDevices = asdaq.NiDevices.Where(d => d.Name == device.Name).FirstOrDefault();
            var niCompactDaqs = asdaq.NiCompactDaqs.SelectMany(m => m.CSeriesModules).Where(c => c.Name == device.Name).FirstOrDefault();

            if (niDevices != null)
            {
                for (int i = 0; i < niDevices.AiChannels.Count; i++)
                {
                    if (!string.IsNullOrEmpty(device.AiChannels[i].MdVariableId))
                    {
                        var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).GetById(device.AiChannels[i].MdVariableId);
                        aiChannelList.Add(new AiChannelBase
                        {
                            MdVariableId = device.AiChannels[i].MdVariableId,
                            AssetId = _mdVariable.ParentId,
                            Disassociate = device.AiChannels[i].Disassociate,
                        });
                    }

                    if (device.AiChannels[i].Disassociate == true)
                    {
                        var name = device.AiChannels[i].Name;
                        var mdVar = niDevices.AiChannels.Where(c => c.Name == name).FirstOrDefault();
                        if (mdVar != null)
                        {
                            var _index = niDevices.AiChannels.Select((property, index) => new { Property = property, Index = index }).Where(w => w.Property.Name == name).Select(s => s.Index).FirstOrDefault();
                            niDevices.AiChannels[_index].MdVariableId = null;
                        }
                    }
                }
            }

            if (niCompactDaqs != null)
            {               
                for (int i = 0; i < niCompactDaqs.AiChannels.Count; i++)
                {
                    if (!string.IsNullOrEmpty(device.AiChannels[i].MdVariableId))
                    {
                        var _mdVariable = new MdVariableExtensionBl(CoreDbUrl).GetById(device.AiChannels[i].MdVariableId);
                        aiChannelList.Add(new AiChannelBase
                        {
                            MdVariableId = device.AiChannels[i].MdVariableId,
                            AssetId = _mdVariable.ParentId,
                            Disassociate = device.AiChannels[i].Disassociate,
                        });

                        if (device.AiChannels[i].Disassociate)
                        {
                            var name = device.AiChannels[i].Name;
                            var channel = niCompactDaqs.AiChannels.Where(c => c.Name == name).FirstOrDefault();
                            if (channel != null)
                            {
                                var _index = niCompactDaqs.AiChannels.Select((property, index) => new { Property = property, Index = index }).Where(w => w.Property.Name == name).Select(s => s.Index).FirstOrDefault();
                                niCompactDaqs.AiChannels[_index].MdVariableId = null;
                            }

                            if (_mdVariable.AiMeasureMethod != null)
                                new MdVariableExtensionBl(CoreDbUrl).setPropertiesAiMeasureMethod(_mdVariable);                            
                        }
                    }
                    //if (device.AiChannels[i].Disassociate == true)
                    //{
                    //    var name = device.AiChannels[i].Name;
                    //    var channel = niCompactDaqs.AiChannels.Where(c => c.Name == name).FirstOrDefault();
                    //    if (channel != null)
                    //    {
                    //        new MdVariableExtensionBl(CoreDbUrl).setPropertiesAiMeasureMethod(channel.MdVariableId);
                    //        var _index = niCompactDaqs.AiChannels.Select((property, index) => new { Property = property, Index = index }).Where(w => w.Property.Name == name).Select(s => s.Index).FirstOrDefault();
                    //        niCompactDaqs.AiChannels[_index].MdVariableId = null;
                    //    }
                    //}
                }
            }

            _asdaqRepository.Update(asdaq);

            var groupMdVariablesForAssetId = aiChannelList.GroupBy(g => g.AssetId);
            foreach (var gr in groupMdVariablesForAssetId)
            {
                var group = aiChannelList.Where(aich => aich.AssetId == gr.Key).ToList();
                if (group.Where(a => a.Disassociate == true).Count() == group.Count())
                {
                    assetIdList.Add(gr.Key);
                }
            }

            // Seteamos cada uno de los AsdaqId pertenecientes a cada Asset en null
            if (assetIdList.Count > 0)
                new AssetExtensionBl(CoreDbUrl).UpdateAsdaqId(assetIdList, null, true);
        }

        /// <summary>
        /// Reconfigura un asdaq
        /// </summary>
        public void Reconfigure(Asdaq asdaq)
        {
            _asdaqRepository.Reconfigure(asdaq);
        }

        /// <summary>
        /// Actualiza el Alias y MailAccountConfiguration de un Asdaq
        /// </summary>
        public void UpdateAliasAndMailAccountAsdaq(Asdaq asdaq)
        {
            if (asdaq.MailAccountConfiguration != null)
            {
                if (!string.IsNullOrEmpty(asdaq.MailAccountConfiguration.Password))
                {
                    var decodePassword = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(asdaq.MailAccountConfiguration.Password));
                    asdaq.MailAccountConfiguration.Password = CrossCutting.Helpers.AesEnDecryption.EncryptWithPassword(decodePassword, "amaqAcloud2016");
                }
            }

            _asdaqRepository.UpdateAliasAndMailAccountAsdaq(asdaq);
        }

        /// <summary>
        /// Obtiene las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <returns></returns>
        public ChangeRequestsDto GetChangeRequests(string asdaqId)
        {
            if (string.IsNullOrEmpty(asdaqId))
            {
                return null;
            }

            var asdaq = _asdaqRepository.GetChangeRequests(asdaqId);
            return (asdaq == null) ? null : new ChangeRequestsDto(asdaq.SubVariableChangeRequests, asdaq.AssetChangeRequests);
        }

        /// <summary>
        /// Actualiza las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="changeRequests">Objeto con las solicitudes de cambio de subVariables y assets</param>
        public void UpdateChangeRequests(string asdaqId, ChangeRequestsDto changeRequests)
        {
            if (!string.IsNullOrEmpty(asdaqId))
                _asdaqRepository.UpdateChangeRequests(asdaqId, changeRequests.SubVariableChangeRequests, changeRequests.AssetChangeRequests);
        }

        /// <summary>
        /// Elimina todas las solicitudes de cambio de información de subVariables y assets del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        public void DeleteAllChangeRequests(string asdaqId)
        {
            _asdaqRepository.DeleteAllChangeRequests(asdaqId);
        }

        /// <summary>
        /// Elimina las solicitudes de cambio de información de subVariables y assets especificadas del asdaq con el id especificado
        /// </summary>
        /// <param name="asdaqId">Id de asdaq</param>
        /// <param name="changeRequests">Lista de id de subVariables a eliminar de la lista SubVariableChangeRequests</param>
        public void DeleteChangeRequests(string asdaqId, ChangeRequestsDto changeRequests)
        {
            if (changeRequests == null)
            {
                return;
            }

            _asdaqRepository.DeleteChangeRequests(
                asdaqId,
                changeRequests.SubVariableChangeRequests,
                changeRequests.AssetChangeRequests);
        }

        /// <summary>
        /// Actualiza una lista de puntos de medición en null de canales Asdaq si existen
        /// </summary>
        public void UpdateMdVaraibleIdOfAiChannel(List<string> mdVariablesId)
        {
            var toUpdate = false;
            var asdaqList = _asdaqRepository.Select(s => new { NiCompactDaqs = s.NiCompactDaqs, Id = s.Id }).ToList();
            foreach (var a in asdaqList)
            {
                foreach (var n in a.NiCompactDaqs)
                {
                    foreach (var c in n.CSeriesModules)
                    {
                        foreach (var ch in c.AiChannels.Where(m => m.MdVariableId != null))
                        {
                            var exist = mdVariablesId.Any(x => x == ch.MdVariableId);
                            if (exist)
                            {
                                ch.MdVariableId = null;
                                toUpdate = true;
                            }
                        }
                    }
                }

                if (toUpdate)
                {
                    _asdaqRepository.UpdateNiCompactDaqsById(a.Id, a.NiCompactDaqs);
                    toUpdate = false;
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="mdVariables"></param>
        /// <param name="typeElimination"></param>
        public void SetDisassociateOnTrueInAiChannels(List<MdVariableExtension> mdVariables, string typeElimination)
        {
            var toDelete = false;
            var asdaqList = _asdaqRepository.Select(s => new { NiCompactDaqs = s.NiCompactDaqs, Id = s.Id }).ToList();
            foreach (var a in asdaqList)
            {
                foreach (var c in a.NiCompactDaqs.SelectMany(s => s.CSeriesModules).ToList())
                {
                    foreach (var ch in c.AiChannels.Where(w => w.MdVariableId != null))
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
                    DeleteRelationshipAiChannels(a.Id, a.NiCompactDaqs, typeElimination);
                    toDelete = false;
                }
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="asdaqId"></param>
        /// <param name="niCompactDaqs"></param>
        /// <param name="typeElimination"></param>
        public void DeleteRelationshipAiChannels(string asdaqId, List<NiCompactDaq> niCompactDaqs, string typeElimination)
        {
            if (typeElimination == "point")
            {
                var aiChannelList = new List<AiChannelBase>();
                var listAssetId = new List<string>();

                foreach (var c in niCompactDaqs.SelectMany(s => s.CSeriesModules).ToList())
                {
                    foreach (var ch in c.AiChannels)
                    {
                        if (!string.IsNullOrEmpty(ch.MdVariableId))
                        {
                            if (ch.Disassociate == false)
                            {
                                var parentId = new MdVariableExtensionBl(CoreDbUrl).GetById(ch.MdVariableId).ParentId;
                                aiChannelList.Add(new AiChannelBase
                                {
                                    AssetId = parentId,
                                    Disassociate = false,
                                });
                            }
                        }

                        if (ch.Disassociate == true)
                        {
                            aiChannelList.Add(new AiChannelBase
                            {
                                AssetId = ch.AssetId,
                                Disassociate = true,
                            });
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

                // Actualizamos o eliminamos la propiedad AsdaqId perteneciente a un Asset
                if (listAssetId.Count > 0)
                    new AssetExtensionBl(CoreDbUrl).UpdateAsdaqId(listAssetId, null, true);
            }

            _asdaqRepository.UpdateNiCompactDaqs(asdaqId, niCompactDaqs);
        }

        /// <summary>
        /// Actualiza una lista de Aconditioners relacionados a un Asdaq y los parámetros
        /// M y B de los puntos de medición que influyan en cambios de ganancia o desplazamiento que estén relacionados a canales Asdaq
        /// </summary>
        public void UpdateAconditionerByAsdaq(string asdaqId, List<Aconditioner> aconditioners, List<MdVariableUpdateMBDto> mdVariablesToUpdate)
        {
            // Actualiza una lista de puntos de medición en sus parámetros M y B.
            if (mdVariablesToUpdate != null)
            {
                var points = new List<MdVariableUpdateMBDto>();
                var _aconditioners = _asdaqRepository.Where(w => w.Id == asdaqId).FirstOrDefault().Aconditioners;

                foreach (var p in mdVariablesToUpdate)
                {
                    var channel = _aconditioners.Where(w => w.Serial == p.Serial).FirstOrDefault().AconChannels.
                                    Where(w => w.Number == p.Channel).FirstOrDefault();

                    if (channel.Gain != p.Gain || channel.Displacement != p.Displacement)
                    {
                        points.Add(new MdVariableUpdateMBDto
                        {
                            MdVariableId = p.MdVariableId,
                            Gain = channel.Gain,
                            Displacement = channel.Displacement,
                            Recalculate = true,
                        });
                    }
                    else
                    {
                        // Si el Gain y Displacement son iguales en BD, seteamos "MdVariableId" en Null ya que no hay necesidad de volver a calcular la M y B de este punto de medición.
                        p.MdVariableId = null;
                    }
                }

                if (points.Count > 0)
                    mdVariablesToUpdate.AddRange(points);

                // Eliminamos todas las MdVariablesId que estén en Null
                mdVariablesToUpdate.RemoveAll(w => w.MdVariableId == null);

                new MdVariableExtensionBl(CoreDbUrl).CalculateMandB(mdVariablesToUpdate);
            }

            _asdaqRepository.UpdateAconditionerByAsdaq(asdaqId, aconditioners);
        }

        /// <summary>
        /// Elimina un Aconditioner relacionado a un Asdaq por medio del serial y los canales Asdaq que estén relacionados 
        /// </summary>
        public void DeleteAconditionerBySerial(string asdaqId, string serial, List<NiDeviceDto> niDevices)
        {
            var pointsToRecalculate = new List<MdVariableUpdateMBDto>();
            var points = niDevices
                .SelectMany(n => n.AiChannels)
                .Where(ai => ai.SerialAcon == serial && ai.MdVariableId != null).Select(s => new { id = s.MdVariableId, channel = s.AconChannel }).ToList();

            if (points.Count > 0)
            {
                var aconditioners = _asdaqRepository.Where(w => w.Id == asdaqId).FirstOrDefault().Aconditioners;
                var channels = aconditioners.Where(w => w.Serial == serial).FirstOrDefault().AconChannels;

                foreach (var p in points)
                {
                    var channel = channels.Where(w => w.Number == p.channel).FirstOrDefault();

                    pointsToRecalculate.Add(new MdVariableUpdateMBDto()
                    {
                        MdVariableId = p.id,
                        Gain = channel.Gain,
                        Displacement = channel.Displacement,
                        Recalculate = true,
                    });
                }

                new MdVariableExtensionBl(CoreDbUrl).CalculateMandB(pointsToRecalculate);
            }

            niDevices
                .SelectMany(n => n.AiChannels)
                .Where(ai => ai.SerialAcon == serial)
                .ToList()
                .ForEach(ai => { ai.SerialAcon = null; ai.AconChannel = null; });

            if (niDevices.Count > 0)
                UpdateDevice(asdaqId, niDevices);

            _asdaqRepository.DeleteAconditionerBySerial(asdaqId, serial);
        }
    }
}
