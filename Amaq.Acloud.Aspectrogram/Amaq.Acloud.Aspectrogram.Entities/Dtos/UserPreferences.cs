namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using Acloud.Entities.Core;
    using Amaq.Acloud.Entities.Administration;
    /// <summary>
    /// 
    /// </summary>
    public class UserPreferences
    {
        /// <summary>
        /// 
        /// </summary>
        public UserConfiguration UserConfiguration { get; set; }

        /// <summary>
        /// 
        /// </summary>
        public User User { get; set; }
    }
}
