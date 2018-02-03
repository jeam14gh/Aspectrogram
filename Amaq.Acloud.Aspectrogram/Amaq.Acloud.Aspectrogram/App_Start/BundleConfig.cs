namespace Amaq.Acloud.Aspectrogram.WebSite
{
    using System.Web.Optimization;

#pragma warning disable CS1591 // Missing XML comment for publicly visible type or member 'BundleConfig'
    public class BundleConfig
#pragma warning restore CS1591 // Missing XML comment for publicly visible type or member 'BundleConfig'
    {
#pragma warning disable CS1591 // Missing XML comment for publicly visible type or member 'BundleConfig.RegisterBundles(BundleCollection)'
        public static void RegisterBundles(BundleCollection bundles)
#pragma warning restore CS1591 // Missing XML comment for publicly visible type or member 'BundleConfig.RegisterBundles(BundleCollection)'
        {
            /* Styles */

            bundles.Add(new StyleBundle("~/Content/bootstrap").Include(
                      "~/Content/bootstrap.min.css",
                      "~/Content/datepicker.css"));

            bundles.Add(new StyleBundle("~/Content/syncfusion").Include(
                      "~/Content/ej/web/default-theme/ej.theme.css",
                      "~/Content/ej/web/default-theme/ej.web.all.css"));
            
            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.min.css",
                      "~/Content/font-awesome.css",
                      "~/Content/aspectrogramWidget.css",
                      "~/Content/toolbarStyle.css",
                      "~/Content/site.css",
                      "~/Content/toastr.css",
                      "~/Content/areaSelect.css",
                      "~/Content/customContextMenu.css",
                      "~/Content/jcEventPlayer.css",
                      "~/Content/flipSwitch.css",
                      "~/Content/dygraphStyles.css"));

            bundles.Add(new StyleBundle("~/Content/jquery").Include(
                      "~/Content/jquery-ui.css",
                      "~/Content/jquery-dataTable.min.css"));

            bundles.Add(new StyleBundle("~/Content/login-css").Include(
                        "~/Content/bootstrap.min.css",
                        "~/Content/iconmoon.css",
                        "~/Content/funcionales.css",
                        "~/Content/login.css"));

            bundles.Add(new StyleBundle("~/Content/gridstack").Include(
                        "~/Content/gridstack.min.css"));

            bundles.Add(new StyleBundle("~/Content/amaq3d").Include(
                        "~/Content/themes/viewer3d/style.css",
                        "~/Content/themes/viewer3d/styleFilter.css",
                        "~/Content/themes/editor3d/style.css",
                        "~/Content/themes/waterfall3d/style.css"));

            /* Scripts */

            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js",
                        "~/Scripts/helpers/ajaxErrorHandling.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryui").Include(
                        "~/Scripts/jquery-ui-{version}.js",
                        "~/Scripts/jquery-dataTable.min.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/syncfusion").Include(
                        "~/Scripts/jsrender.min.js",
                        "~/Scripts/jquery.easing.1.3.min.js",
                        "~/Scripts/ej/ej.web.all.min.js",
                        "~/Scripts/ej/cultures/ej.culture.es-ES.js",
                        "~/Scripts/properties.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.min.js",
                      "~/Scripts/respond-min.js",
                      "~/Scripts/bootstrap-datepicker.js"));

            bundles.Add(new ScriptBundle("~/bundles/gridstack").Include(
                        "~/Scripts/lodash.min.js",
                        "~/Scripts/underscore-min.js",
                        "~/Scripts/gridstack.min.js"));

            bundles.Add(new ScriptBundle("~/bundles/dygraph").Include(
                "~/Scripts/dygraph/dygraph-combined.js",
                "~/Scripts/helpers/fileSaver.js",
                "~/Scripts/dygraph/plugins/serieSynchronizer.js",
                "~/Scripts/dygraph/plugins/plotter.js",
                "~/Scripts/dygraph/dygraph-operations.js",
                "~/Scripts/dygraph/plugins/image-export.js",
                "~/Scripts/dygraph/plugins/synchronizer.js"));

            bundles.Add(new ScriptBundle("~/bundles/areaSelect").Include(
                "~/Scripts/helpers/areaSelect.js"));

            bundles.Add(new ScriptBundle("~/bundles/toastr").Include(
                        "~/Scripts/toastr.min.js"));
        }
    }

    
}
