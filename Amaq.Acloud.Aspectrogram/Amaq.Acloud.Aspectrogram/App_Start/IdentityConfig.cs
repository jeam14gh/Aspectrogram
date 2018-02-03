namespace Amaq.Acloud.Aspectrogram
{
    using Microsoft.AspNet.Identity;
    using Models;

    /// <summary>
    /// Configura la aplicacion de gestion de usuarios usado en esta aplicacion.
    /// </summary>
    public class ApplicationUserManager : UserManager<ApplicationUser>
    {
        /// <summary>
        /// Inicializa la gestion de usuarios
        /// </summary>
        /// <param name="store"></param>
        public ApplicationUserManager(IUserStore<ApplicationUser> store)
            : base(store)
        {
        }
    }
}