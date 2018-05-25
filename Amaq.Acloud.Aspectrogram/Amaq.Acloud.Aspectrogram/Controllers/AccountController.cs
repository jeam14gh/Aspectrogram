namespace Amaq.Acloud.Aspectrogram.Controllers
{
    using Entities.Dtos;
    using System.Threading.Tasks;
    using System.Web.Mvc;
    using Newtonsoft.Json;
    using System.Web.Security;
    using System.Web;
    using System;
    using Models;
    using Acloud.Entities.Dtos;
    using CrossCutting.Helpers;
    using Acloud.Proxy.Security;
    using Entities;
    using System.Net.Http;
    using System.Collections.Generic;
    using System.Configuration;
    using System.Security;
    using Api.Attributes;
    using System.Security.Claims;
    using Microsoft.AspNet.Identity;
    using Microsoft.Owin.Security;
    using Acloud.Proxy.Models;

    /// <summary>
    /// Gestiona las cuentas de los usuarios en el sistema
    /// </summary>
    [CustomAuthorize]
    public class AccountController : Controller
    {
        private IAuthenticationManager AuthenticationManager
        {
            get { return HttpContext.GetOwinContext().Authentication; }
        }

        /// <summary>
        /// Autenticacion de usuarios por medio de un formulario web.
        /// </summary>
        /// <param name="returnUrl">URL a retornar posterior al login</param>
        /// <returns>Formulario web de autenticacion</returns>
        [AllowAnonymous]
        public ActionResult Login(string returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        /// <summary>
        /// Valida la informacion de un usuario que intenta acceder al sistema
        /// </summary>
        /// <param name="model">Informacion necesaria para el login</param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        public async Task<JsonResult> Login(FullCredentialDto model)
        {
            LoginResponse loginResponse = new LoginResponse();
            loginResponse.ReturnUrl = model.ReturnUrl;

            if (ModelState.IsValid)
            {
                try
                {
                    string serializedModel = JsonConvert.SerializeObject(model);
                    var bearerData = await new AccountProxy().GetTokenAsync(serializedModel);

                    if (bearerData != null)
                    {
                        IdentitySignin(bearerData, model.RememberMe);
                        //SignInAsync(Base64.Decode(model.UserName), model.RememberMe, bearerData.AccessToken);
                        // Identidad confirmada
                        loginResponse.Message = "Ok";
                        return await Task.FromResult(Json(loginResponse, JsonRequestBehavior.AllowGet));
                    }
                }
                catch (SecurityException ex)
                {
                    loginResponse.Message = ex.Message;
                    return await Task.FromResult(Json(loginResponse, JsonRequestBehavior.AllowGet));
                }
            }
            // Identidad incorrecta
            loginResponse.Message = "Acceso denegado";
            return await Task.FromResult(Json(loginResponse, JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Obtiene las empresas relacionadas al usuario que intenta iniciar sesion en el sistema
        /// </summary>
        /// <param name="model">Informacion basica del usuario en el sistema</param>
        /// <returns></returns>
        [HttpPost]
        [AllowAnonymous]
        public async Task<JsonResult> GetCompanies(BasicCredentialsDto model)
        {
            string response = string.Empty;
            try
            {
                var context = System.Web.HttpContext.Current;
                model.ModuleId = ConfigurationManager.AppSettings["ModuleId"];
                model.CallerIp = context.Request.ServerVariables["REMOTE_ADDR"];
                model.UserAgent = context.Request.UserAgent;
                var companies = await new AccountProxy().GetCompaniesAsync(model);
                response = JsonConvert.SerializeObject(companies);
            }
            catch (Exception ex)
            {
                response = ex.Message;
            }
            return await Task.FromResult(Json(Base64.Encode(response), JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// Login para los diferentes productos o dispositivos AMAQ.
        /// </summary>
        /// <param name="model">Informacion del producto o dispositivo</param>
        /// <returns>Token de acceso al sistema</returns>
        [HttpPost]
        [AllowAnonymous]
        public async Task<JsonResult> ProductLogin(Account model)
        {
            if (ModelState.IsValid)
            {
                // Realizamos el hash del password en este punto.
                string password = Base64.Decode(model.Password);
                var passwordHash = HashEncryption.GetHashSha512(password, "password");

                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("username", model.PhysicalAddress),
                    new KeyValuePair<string, string>("password", Base64.Encode(passwordHash)),
                    new KeyValuePair<string, string>("grant_type", "password"),
                    new KeyValuePair<string, string>("isDevice", "true")
                });

                var bearerData = await new AccountProxy().GetTokenAsync(content);
                if (bearerData != null)
                {
                    SignInAsync(Base64.Decode(model.PhysicalAddress), true, bearerData.AccessToken, bearerData.RefreshToken);
                    return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
                }
            }
            return await Task.FromResult(Json("", JsonRequestBehavior.AllowGet));
        }

        /// <summary>
        /// POST: /Account/LogOff
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> LogOff()
        {
            var flag = await new AccountProxy().Logout(Properties.AppUserState.AccessToken);
            if (flag)
            {
                IdentitySignout();
            }
            return RedirectToAction("Index", "Home");
        }

        #region Helpers

        /// <summary>
        /// Crea los diferentes claims y realiza la autenticacion del usuario una vez se confirma la identidad del mismo en el sistema
        /// </summary>
        /// <param name="appUserState">Objecto con la informacion obtenida del usuario</param>
        /// <param name="isPersistent"></param>
        /// <param name="providerKey"></param>
        public void IdentitySignin(AppUserState appUserState, bool isPersistent = false, string providerKey = null)
        {
            var claims = new List<Claim>();

            // Claims requeridos
            claims.Add(new Claim(ClaimTypes.NameIdentifier, appUserState.UserId));
            claims.Add(new Claim(ClaimTypes.Name, appUserState.Name));
            // Personalizacion del objeto AppUserState
            claims.Add(new Claim("roles", string.Join(",", appUserState.Roles)));
            // Token de acceso
            claims.Add(new Claim("accessToken", appUserState.AccessToken));
            // RefreshToken
            claims.Add(new Claim("refreshToken", appUserState.RefreshToken));
            // Nombre de la base de datos del usuario
            claims.Add(new Claim("dbName", appUserState.DbName));
            
            var identity = new ClaimsIdentity(claims, DefaultAuthenticationTypes.ApplicationCookie);
            AuthenticationManager.SignIn(new AuthenticationProperties()
            {
                AllowRefresh = true,
                IsPersistent = isPersistent,
                ExpiresUtc = DateTime.UtcNow.AddDays(7)
            }, identity);
        }

        /// <summary>
        /// Realiza el cierre de la session de usuario
        /// </summary>
        public void IdentitySignout()
        {
            AuthenticationManager.SignOut(DefaultAuthenticationTypes.ApplicationCookie,
                                          DefaultAuthenticationTypes.ExternalCookie);
        }

        /// <summary>
        /// Registro de sesión de usuario con ApplicationCookie
        /// </summary>
        /// <param name="userName">Nombre de usuario en el sistema</param>
        /// <param name="rememberme">Bandera para determinar si se almacena informacion del usuario en una cookie del navegador</param>
        /// <param name="accessToken">Token de acceso a los Servicios de A-Cloud</param>
        /// <param name="refreshToken">Refresh Token</param>
        private void SignInAsync(string userName, bool rememberme, string accessToken, string refreshToken)
        {
            FormsAuthentication.SignOut();
            FormsAuthentication.SetAuthCookie(userName, rememberme);
            HttpCookie cookie = new HttpCookie("Token");
            cookie.Expires = DateTime.Now.AddDays(1);
            cookie.Values["accessToken"] = accessToken;
            cookie.Values["refreshToken"] = refreshToken;
            HttpContext.Response.Cookies.Add(cookie);
        }

        #endregion
    }
}