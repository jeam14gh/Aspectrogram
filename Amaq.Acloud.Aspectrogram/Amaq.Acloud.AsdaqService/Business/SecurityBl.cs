namespace Amaq.Acloud.AsdaqService.Business
{
    using System.Text;
    using System.Security;
    using Newtonsoft.Json;
    using Entities.Dtos;
    using Proxy.Security;
    using Helpers;
    using Proxy.Models;

    internal static class SecurityBl
    {
        private static volatile AppUserState _userState = null;

        private static volatile AppUserState _userStateForHMI = null;

        public static volatile bool TokenIsValid;

        private static object _lock = new object();

        /// <summary>
        /// Informacion de la identidad del usuario en el servicio Web API
        /// </summary>
        public static AppUserState AppUserState
        {
            get
            {
                return _userState;
            }
            set
            {
                _userState = value;
            }
        }

        /// <summary>
        /// Informacion de la identidad del usuario en el servicio Web API HMI
        /// </summary>
        public static AppUserState AppUserStateForHMI
        {
            get
            {
                return _userStateForHMI;
            }
            set
            {
                _userStateForHMI = value;
            }
        }

        /// <summary>
        /// Gestiona el inicio de sesión con el sistema Acloud y almacena el access token en memoria
        /// </summary>
        public static void Login()
        {
            var serialBase64 = Encoding.UTF8.EncodeBase64(AsdaqProperties.Serial);
            var passwordBase64 = Encoding.UTF8.EncodeBase64(AsdaqProperties.Password);
            var serializedCredentials = JsonConvert.SerializeObject(new FullCredentialsDto(serialBase64, passwordBase64, "", true));

            AppUserState = null;
            var response = new AccountProxy().GetTokenAsync(serializedCredentials).GetAwaiter().GetResult();
            if (response == null)
            {
                throw new SecurityException("No se pudo obtener el token de seguridad. Por favor verifique las credenciales de acceso.");
            }

            AppUserState = response;
            TokenIsValid = true;
        }

        /// <summary>
        /// Gestiona el inicio de sesión con el sistema Acloud HMI y almacena el access token en memoria
        /// </summary>
        public static void LoginForHMI()
        {
            // Este siempre es el Serial para el Asdaq en la instancia de Acloud HMI
            var serialBase64 = Encoding.UTF8.EncodeBase64("AsdaqHMI"); //Encoding.UTF8.EncodeBase64(AsdaqProperties.Serial);
            var passwordBase64 = Encoding.UTF8.EncodeBase64(AsdaqProperties.Password);
            var serializedCredentials = JsonConvert.SerializeObject(new FullCredentialsDto(serialBase64, passwordBase64, "", true));

            AppUserStateForHMI = null;
            var response = new AccountProxy(true).GetTokenAsync(serializedCredentials).GetAwaiter().GetResult();
            if (response == null)
            {
                throw new SecurityException("No se pudo obtener el token de seguridad. Por favor verifique las credenciales de acceso.");
            }

            AppUserStateForHMI = response;
        }

        /// <summary>
        /// Gestiona un nuevo token de acceso al sistema Acloud y sobre-escribe el existente en memoria con el nuevo.
        /// </summary>
        public static void RefreshToken()
        {
            lock (_lock)
            {
                if (TokenIsValid)
                {
                    return;
                }

                var response = new AccountProxy().RefreshTokenAsync(AppUserState.RefreshToken).GetAwaiter().GetResult();
                if (response == null)
                {
                    throw new SecurityException("No se pudo obtener el nuevo token de seguridad basado en RefreshToken.");
                }

                AppUserState = response;
                TokenIsValid = true;
            }
        }
    }
}
