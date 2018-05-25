using Amaq.Acloud.Aspectrogram.Models.Data;
using Amaq.Acloud.Business;
using Amaq.Acloud.Entities.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    /// <summary>
    /// 
    /// </summary>
    public class UserConfigurationExtensionBl : CoreBl<UserConfiguration>
    {
        private UserConfigurationExtensionRepository _userConfigurationExtensionRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public UserConfigurationExtensionBl(string coreDbUrl) : base(coreDbUrl)
        {
            _userConfigurationExtensionRepository = new UserConfigurationExtensionRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// 
        /// </summary>
        public void UpdateByUser(UserConfiguration userConfiguration)
        {
            _userConfigurationExtensionRepository.UpdateByUser(userConfiguration);
        }
    }
}