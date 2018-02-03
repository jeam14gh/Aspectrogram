namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    using Acloud.Entities.Enums;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;
    using System.Threading.Tasks;

    /// <summary>
    /// Representa un nodo que se va a eliminar en el sistema
    /// </summary>
    public class NodeToDeleteDto
    {
        /// <summary>
        /// Id del nodo
        /// </summary>
        public string Id { get; set; }
        /// <summary>
        /// Tipo de entidad del nodo
        /// </summary>
        public EntityType EntityType { get; set; }
    }
}
