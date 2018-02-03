namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Representa un objeto con el estado de un nodo tipo MdVariable
    /// </summary>
    public class MdVariableNodeStatusDto
    {
        /// <summary>
        /// Id del nodo MdVariable
        /// </summary>
        public string NodeId { get; set; }
        /// <summary>
        /// Id del estado
        /// </summary>
        public string StatusId { get; set; }
    }
}
