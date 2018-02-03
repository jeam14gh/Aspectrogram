namespace Amaq.Acloud.Aspectrogram.Controllers
{
    using Api.Security;
    using System.Web.Mvc;

    public class BaseController : Controller
    {
        protected virtual new CustomPrincipal User
        {
            get { return HttpContext.User as CustomPrincipal; }
        }
    }
}