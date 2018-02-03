namespace Amaq.Acloud.Aspectrogram.Entities
{
    /// <summary>
    /// Informacion del producto (ASDAQ).
    /// </summary>
    public class Account
    {
        /// <summary>
        /// Direccion fisica MAC.
        /// </summary>
        public string PhysicalAddress { get; set; }

        /// <summary>
        /// Clave generada aleatoriamente.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Id de la empresa donde se instala el producto.
        /// </summary>
        public string CompanyId { get; set; }

        /// <summary>
        /// Tipo de producto, esto es ASDAQ, ATRANSMITER, etc.
        /// </summary>
        public string Category { get; set; }
    }
}
