namespace Amaq.Acloud.AsdaqService.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using NationalInstruments.DAQmx;
    using Aspectrogram.Entities;

    /// <summary>
    /// Representa un administrador de hardware National Instruments
    /// </summary>
    public class NiHardwareHelper
    {
        private List<Device> _cDaqs = null;
        private List<Device> _devs = null;

        /// <summary>
        /// Crea una nueva instancia de NiHardwareManager
        /// </summary>
        public NiHardwareHelper()
        {
            // Buscar todo el hardware National Instruments conectado al PC
            var devNames = DaqSystem.Local.Devices;

            // Omitir CSeriesModules ya que pertenecen a un Chasis y no se pueden tratar por aparte
            var allDevs = devNames.Select(dn =>
                    DaqSystem.Local.LoadDevice(dn)
                ).ToList().Where(d =>
                        d.ProductCategory != ProductCategory.CSeriesModule
                    ).ToList();

            _cDaqs = allDevs.Where(d => d.ProductCategory == ProductCategory.CompactDaqChassis).ToList(); // Chasis CompactDaq
            _devs = allDevs.Except(_cDaqs).ToList(); // Resto de dispositivos
        }

        /// <summary>
        /// Obtiene todos los dispositivos NI conectados al PC, excepto los de tipo chasis CompactDaq
        /// </summary>
        /// <returns></returns>
        public List<NiDevice> GetNiDevices()
        {
            List<NiDevice> niDevices = (_devs != null) ? new List<NiDevice>() : null;

            // Mapeo a entidades Aspectrogram
            _devs.ForEach(d =>
            {
                var terminalConfigurations = DaqSystem.Local.LoadPhysicalChannel(d.AIPhysicalChannels[0]).AITerminalConfigurations.ToString().Split(',').ToList();

                niDevices.Add(new NiDevice()
                {
                    Name = d.DeviceID,
                    ProductCategory = d.ProductCategory.ToString(),
                    SampleRate = d.AIMaximumMultiChannelRate,
                    SamplesToRead = Convert.ToInt32(d.AIMaximumMultiChannelRate),
                    TerminalConfiguration = terminalConfigurations.LastOrDefault(),
                    CompatibleTerminalConfigurations = terminalConfigurations,
                    IsMasterNiDevice = false,
                    MasterNiDeviceName = "",
                    AiChannels = d.AIPhysicalChannels.Select(ch => new NiAiChannel() { Name = ch, ByPassed = false, Enabled = true }).ToList(),
                    DoChannels = null,
                    CompatibleMeasures = d.AISupportedMeasurementTypes.Select(m => m.ToString()).ToList(),
                    AICurrentExcitationValue = (d.AICurrentInternalExcitationDiscreteValues.Length > 0) ? d.AICurrentInternalExcitationDiscreteValues.Max() : 0.0,
                    ProductType = d.ProductType                    
                });
            });

            return niDevices;
        }

        /// <summary>
        /// Obtiene todos los dispositivos NI CompactDaq conectados al PC
        /// </summary>
        /// <returns></returns>
        public List<NiCompactDaq> GetNiCompactDaqs()
        {
            List<NiCompactDaq> niCompactDaqs = (_cDaqs != null) ? new List<NiCompactDaq>() : null;

            _cDaqs.ForEach(c =>
            {
                var niCompactDaq = new NiCompactDaq() { Name = c.DeviceID };
                var moduleNames = c.ChassisModuleDeviceNames.ToList();

                List<NiDevice> cSeriesModules = (moduleNames != null) ? new List<NiDevice>() : null;

                moduleNames.Select(m => DaqSystem.Local.LoadDevice(m)).ToList().ForEach(d =>
                {
                    var terminalConfigurations = DaqSystem.Local.LoadPhysicalChannel(d.AIPhysicalChannels[0]).AITerminalConfigurations.ToString().Split(',').ToList();

                    cSeriesModules.Add(new NiDevice()
                    {
                        Name = d.DeviceID,
                        ProductCategory = d.ProductCategory.ToString(),
                        SampleRate = d.AIMaximumMultiChannelRate,
                        SamplesToRead = Convert.ToInt32(d.AIMaximumMultiChannelRate),
                        TerminalConfiguration = terminalConfigurations.LastOrDefault(),
                        CompatibleTerminalConfigurations = terminalConfigurations,
                        IsMasterNiDevice = false,
                        MasterNiDeviceName = "",
                        AiChannels = d.AIPhysicalChannels.Select(ch => new NiAiChannel() { Name = ch, ByPassed = false, Enabled = true }).ToList(),
                        DoChannels = null,
                        CompatibleMeasures = d.AISupportedMeasurementTypes.Select(m => m.ToString()).ToList(),
                        AICurrentExcitationValue = (d.AICurrentInternalExcitationDiscreteValues.Length > 0) ? d.AICurrentInternalExcitationDiscreteValues.Max() : 0.0,
                        ProductType = d.ProductType
                    });
                });

                niCompactDaq.CSeriesModules = cSeriesModules;
                niCompactDaqs.Add(niCompactDaq);
            });

            return niCompactDaqs;
        }
    }
}
