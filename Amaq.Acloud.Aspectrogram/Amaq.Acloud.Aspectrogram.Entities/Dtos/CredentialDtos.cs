namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Credenciales de acceso y parametros necesarios para solicitar al servicio Web Api el bearer token de autenticacion.
    /// </summary>
    public class FullCredentialDto
    {
        /// <summary>
        /// Nombre de usuario en el sistema.
        /// </summary>
        public string UserName { get; set; }

        /// <summary>
        /// Password del usuario en el sistema.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Tipo de concesion para la autenticacion.
        /// </summary>
        public string GrantType { get; set; }

        /// <summary>
        /// Nombre de la base de datos a la cual tiene acceso el usuario.
        /// </summary>
        public string DbName { get; set; }

        /// <summary>
        /// Bandera para determinar si se almacena informacion del usuario en una cookie del navegador.
        /// </summary>
        public bool RememberMe { get; set; }

        /// <summary>
        /// URL a retornar al usuario una vez concluida la autenticacion de forma exitosa.
        /// </summary>
        public string ReturnUrl { get; set; }
    }
}
