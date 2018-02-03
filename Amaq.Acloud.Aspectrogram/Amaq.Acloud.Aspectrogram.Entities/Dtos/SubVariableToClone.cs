namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Representa una SubVariable que se va a clonar en el sistema
    /// </summary>
    public class SubVariableToClone
    {
        /// <summary>
        /// Padre de la SubVariable
        /// </summary>
        public string ParentId { get; set; }

        /// <summary>
        /// Id de la MdVariable que a la vez es el parentId de la SubVariable
        /// </summary>
        public string MdVariableId { get; set; }
    }
}
