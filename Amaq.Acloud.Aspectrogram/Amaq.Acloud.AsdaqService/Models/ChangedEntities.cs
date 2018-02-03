namespace Amaq.Acloud.AsdaqService.Models
{
    using Aspectrogram.Entities;
    using System.Collections.Generic;

    /// <summary>
    /// Representa las entidades modificadas que un Asdaq debe aplicar dinamicamente
    /// </summary>
    public class ChangedEntities
    {
        /// <summary>
        /// Lista de subVariables modificadas
        /// </summary>
        public List<SubVariableExtension> SubVariables { get; set; }
        /// <summary>
        /// Lista de assets modificados
        /// </summary>
        public List<AssetExtension> Assets { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de ChangedEntities
        /// </summary>
        /// <param name="subVariables"></param>
        /// <param name="assets"></param>
        public ChangedEntities(List<SubVariableExtension> subVariables, List<AssetExtension> assets)
        {
            SubVariables = subVariables;
            Assets = assets;
        }
    }
}
