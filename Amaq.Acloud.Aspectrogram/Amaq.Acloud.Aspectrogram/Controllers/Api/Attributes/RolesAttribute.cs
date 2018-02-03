namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Attributes
{
    using System;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Web.Http;
    using System.Web.Http.Controllers;

    /// <summary>
    /// Atributo personalizado para la verificacion de los roles de un usuario en el sistema.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, Inherited = true, AllowMultiple = true)]
    public class RolesAttribute : AuthorizeAttribute
    {
        private bool _authorized = false;

        /// <summary>
        /// Constructor para inicializar los roles requeridos para cada metodo o clase
        /// </summary>
        /// <param name="roles">Diferentes roles autorizados para el metodo o clase</param>
        public RolesAttribute(params string[] roles)
        {
            Roles = string.Join(",", roles);
        }

        /// <summary>
        /// Personalizacion del respuesta a una respuesta Unauthorized del atributo RolesAttribute
        /// </summary>
        /// <param name="actionContext">Contexto de la accion/metodo</param>
        protected override void HandleUnauthorizedRequest(HttpActionContext actionContext)
        {
            actionContext.Response = new HttpResponseMessage
            {
                StatusCode = (HttpStatusCode)429,
                Content = new StringContent("El usuario no cuenta con los permisos necesarios para realizar esta operacion."),
                ReasonPhrase = "RoleAccessDenied"
            };
        }

        /// <summary>
        /// Verificacion personalizada al comparar los roles permitidos por metodo/accion
        /// </summary>
        /// <param name="actionContext">Contexto de la accion/metodo</param>
        /// <returns>Verdadero o falso segun el(los) rol(es) del usuario</returns>
        protected override bool IsAuthorized(HttpActionContext actionContext)
        {
            var roles = actionContext.ControllerContext.Request.Headers.GetValues("roles").FirstOrDefault().ToString();
            var userRoles = roles.Split(',').ToList();
            foreach (var role in Roles.Split(','))
            {
                if (userRoles.Any(s => s == role))
                {
                    _authorized = true;
                    break;
                }
            }

            if (_authorized)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}