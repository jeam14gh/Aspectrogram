using Amaq.Acloud.Entities.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Entidad donde hay un listado de nodos, activos, puntos de medicion y subvariables
    /// </summary>
    public class NodeAssetMdVarAndSubVarDto
    {
        /// <summary>
        /// Lista de nodos  
        /// </summary>
        public List<Node> Nodes { get; set; }
        /// <summary>
        /// Lista de activos
        /// </summary>
        public List<AssetExtension> Assets { get; set; }
        /// <summary>
        /// Lista de puntos de medicion 
        /// </summary>
        public List<MdVariableExtension> MdVariables { get; set; }
        /// <summary>
        /// Lista de subvariables
        /// </summary>
        public List<SubVariableExtension> SubVariables { get; set; }
    }
}
