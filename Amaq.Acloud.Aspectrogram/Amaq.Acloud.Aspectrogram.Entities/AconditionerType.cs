namespace Amaq.Acloud.Aspectrogram.Entities
{
    using Amaq.Libraries.MongoDbRepository;
    using System.Collections.Generic;

    /// <summary>
    /// Representa el detalle de un tipo de dispositivo Aconditioner desarrollado por A-MAQ
    /// </summary>
    public class AconditionerType: Entity
    {
        /// <summary>
        /// Nombre de un dispositivo Aconditioner
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Referencia de un dispositivo Aconditioner
        /// </summary>
        public string Reference { get; set; }

        /// <summary>
        /// Description de un dispositivo Aconditioner
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Lista de canales nominales de un Aconditioner
        /// </summary>
        public List<Channel> Channels { get; set; }
    }
}
