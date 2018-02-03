namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Attributes
{
    using Acloud.Proxy.Security;
    using System;
    using System.Net;
    using System.Net.Http;
    using System.Web;
    using System.Web.Http;
    using System.Web.Http.Controllers;

    /// <summary>
    /// Atributo personalizado para la verificacion de los permisos de un usuario en el sistema.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = true, AllowMultiple = true)]
    public class CustomAuthorizeAttribute : AuthorizeAttribute
    {
        /// <summary>
        /// Constructor por defecto
        /// </summary>
        public CustomAuthorizeAttribute() : base()
        {

        }
        
        /// <summary>
        /// Verificacion personalizada al comparar con el servidor que provee el token
        /// </summary>
        /// <param name="actionContext"></param>
        /// <returns></returns>
        protected override bool IsAuthorized(HttpActionContext actionContext)
        {
            var headerAuthorization = HttpContext.Current.Request.Headers.GetValues("Authorization");
            if (headerAuthorization == null)
            {
                // No existe un encabezado de autorizacion en la peticion HTTP
                return false;
            }
            try
            {
                var bearerToken = headerAuthorization[0].Split(' ')[1];
                return new AccountProxy().CheckAuthentication(bearerToken);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return false;
            }
        }

        /// <summary>
        /// Manejador de respuestas no autorizado por token expirado.
        /// </summary>
        /// <param name="actionContext"></param>
        protected override void HandleUnauthorizedRequest(HttpActionContext actionContext)
        {
            var response = new HttpResponseMessage
            {
                StatusCode = (HttpStatusCode)430,
                ReasonPhrase = "UnauthorizedToken"
            };
            actionContext.Response = response;
        }
    }
}