namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Amaq.Acloud.Aspectrogram.Entities;
    using Amaq.Acloud.Aspectrogram.Models.Data;
    using Amaq.Acloud.Business;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Web;

    /// <summary>
    /// Lógica de negocio BearingFaultFrequency
    /// </summary>
    public class BearingFaultFrequencyBl : CoreBl<BearingFaultFrequency>
    {
        private BearingFaultFrequencyRepository _bearingFaultFrequencyRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public BearingFaultFrequencyBl(string coreDbUrl) : base(coreDbUrl)
        {
            _bearingFaultFrequencyRepository = new BearingFaultFrequencyRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }
    }
}