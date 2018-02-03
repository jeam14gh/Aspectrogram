namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Representa la configuración de una cuenta de correo electrónico. Por el momento solo se requieren los
    /// parámetros SMTP, ya que estas cuentas son solo para envío y no para recepción.
    /// </summary>
    public class MailAccountConfiguration
    {
        /// <summary>
        /// Servidor SMTP
        /// </summary>
        public string SmtpServer { get; set; }

        /// <summary>
        /// Puerto SMTP
        /// </summary>
        public int SmtpPort { get; set; }

        /// <summary>
        /// Nombre de usuario
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Clave de acceso
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Valor lógico que indica si se utiliza o no un canal cifrado SSL para la gestión de correos electrónicos
        /// </summary>
        public bool UseSsl { get; set; }

        /// <summary>
        /// Direccion de correo electronico remitente.
        /// </summary>
        public string FromAddress { get; set; }
    }
}
