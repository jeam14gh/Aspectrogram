namespace Amaq.Acloud.Aspectrogram.Models
{
    /// <summary>
    /// Respuesta al proceso de login.
    /// </summary>
    public class LoginResponse
    {
        /// <summary>
        /// Mensaje del sistema.
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// URL a redirigir si la autenticacion es correcta.
        /// </summary>
        public string ReturnUrl { get; set; }
    }
}