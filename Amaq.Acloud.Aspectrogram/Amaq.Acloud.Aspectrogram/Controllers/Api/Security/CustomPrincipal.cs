namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Security
{
    using System.Linq;
    using System.Security.Principal;

    public class CustomPrincipal : IPrincipal
    {
        public IIdentity Identity { get; private set; }
        public bool IsInRole(string role)
        {
            if (roles.Any(r => role.Contains(r)))
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public CustomPrincipal(string Username)
        {
            Identity = new GenericIdentity(Username);
        }

        public int UserId { get; set; }
        public string[] roles { get; set; }
    }
}