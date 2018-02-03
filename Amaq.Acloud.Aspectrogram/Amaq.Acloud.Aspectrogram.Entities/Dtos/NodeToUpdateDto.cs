using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Entidad node
    /// </summary>
    public class NodeToUpdateDto
    {
        /// <summary>
        /// Id del node
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Nombre del node
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Descripción del node
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Tipo de nodo
        /// </summary>
        public int EntityType { get; set; }

        /// <summary>
        /// Id del tipo de entidad
        /// </summary>
        public string EntityId { get; set; }
    }
}
