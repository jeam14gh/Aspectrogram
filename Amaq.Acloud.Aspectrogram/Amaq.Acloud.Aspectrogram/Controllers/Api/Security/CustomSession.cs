namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Security
{
    using System.Web;

    /// <summary>
    /// Mantiene una sesion con la informacion del usuario logueado.
    /// </summary>
    public static class CustomSession
    {
        private static string _sessionUserName = "username";
        private static string _sessionToken = "accessToken";

        /// <summary>
        /// Sesion de usuario.
        /// </summary>
        public static string UserName
        {
            get
            {
                if (HttpContext.Current == null)
                {
                    return string.Empty;
                }
                var sessionUser = HttpContext.Current.Session[_sessionUserName];
                if (sessionUser != null)
                {
                    return sessionUser as string;
                }
                return null;
            }

            set
            {
                HttpContext.Current.Session[_sessionUserName] = value;
            }
        }

        /// <summary>
        /// Token de acceso al Web Api.
        /// </summary>
        public static string AccessToken
        {
            get
            {
                if (HttpContext.Current == null)
                {
                    return string.Empty;
                }
                var sessionToken = HttpContext.Current.Session[_sessionToken];
                if (sessionToken != null)
                {
                    return sessionToken as string;
                }
                return null;
            }

            set
            {
                HttpContext.Current.Session[_sessionToken] = value;
            }
        }
    }
}