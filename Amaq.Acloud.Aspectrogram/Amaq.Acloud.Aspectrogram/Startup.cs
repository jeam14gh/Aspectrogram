using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(Amaq.Acloud.Aspectrogram.Startup))]
namespace Amaq.Acloud.Aspectrogram
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
