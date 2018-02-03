namespace Amaq.Acloud.Aspectrogram.WebSite
{
    using System.Web.Http;

#pragma warning disable CS1591 // Missing XML comment for publicly visible type or member 'WebApiConfig'
    public static class WebApiConfig
#pragma warning restore CS1591 // Missing XML comment for publicly visible type or member 'WebApiConfig'
    {
#pragma warning disable CS1591 // Missing XML comment for publicly visible type or member 'WebApiConfig.Register(HttpConfiguration)'
        public static void Register(HttpConfiguration config)
#pragma warning restore CS1591 // Missing XML comment for publicly visible type or member 'WebApiConfig.Register(HttpConfiguration)'
        {
            config.MapHttpAttributeRoutes();

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            //config.Filters.Add(new AuthorizeAttribute());
        }
    }
}
