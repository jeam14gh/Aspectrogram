namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    using System.ComponentModel.DataAnnotations;
    
    /// <summary>
    /// 
    /// </summary>
    public enum TurningVelocity
    {
        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "CPS")]
        CPS = 1,

        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "Hz")]
        Hz = 2,

        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "CPM")]
        CPM = 3,

        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "RPM")]
        RPM =4
    }
    
}
