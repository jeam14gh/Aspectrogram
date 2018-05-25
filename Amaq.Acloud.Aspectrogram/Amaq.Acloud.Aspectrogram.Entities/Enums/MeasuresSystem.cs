namespace Amaq.Acloud.Aspectrogram.Entities.Enums
{
    using System.ComponentModel.DataAnnotations;

    /// <summary>
    /// 
    /// </summary>
    public enum MeasuresSystem
    {
        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "Métrico")]
        Metric = 1,

        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "Imperial")]
        Imperial = 2,

        /// <summary>
        /// 
        /// </summary>
        [Display(Name = "Ambos")]
        Both = 3,
    }
}
