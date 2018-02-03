using CefSharp;
using CefSharp.WinForms;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Amaq.Acloud.AsdaqViewer
{
    public partial class frmMain : Form
    {
        public ChromiumWebBrowser chromiumBrowser;

        public frmMain()
        {
            InitializeComponent();

            // Cambios en controls del formulario para una mejor experiencia de usuario en una interfaz touch
            var font = new System.Drawing.Font(Font.Name, 14F);

            foreach (Control control in Controls)
            {
                control.Font = font;
            }

            EnterFullScreenMode(this);

            Cef.EnableHighDPISupport(); // Importante para evitar parpadeo en Windows 7 o superior

            //Only perform layout when control has completly finished resizing
            // Carga más rápido la aplicación Web
            ResizeBegin += (s, e) => SuspendLayout();
            ResizeEnd += (s, e) => ResumeLayout(true);

            InitializeChromium();
        }

        private void InitializeChromium()
        {
            CefSettings settings = new CefSettings();
            Cef.Initialize(settings);
            chromiumBrowser = new ChromiumWebBrowser(AsdaqViewerProperties.UrlAspectrogram);
            pnlBrowserContainer.Controls.Add(chromiumBrowser);
            chromiumBrowser.Dock = DockStyle.Fill;
        }

        public void EnterFullScreenMode(Form targetForm)
        {
            targetForm.WindowState = FormWindowState.Normal;
            targetForm.FormBorderStyle = FormBorderStyle.None;
            targetForm.WindowState = FormWindowState.Maximized;
        }

        public void LeaveFullScreenMode(Form targetForm)
        {
            targetForm.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Sizable;
            targetForm.WindowState = FormWindowState.Normal;
        }

        private void frmMain_FormClosing(object sender, FormClosingEventArgs e)
        {
            Cef.Shutdown();
        }

        private void btnReload_Click(object sender, EventArgs e)
        {
            chromiumBrowser.Reload(true); // Recargar y limpiar caché, equivale al ctrl + F5 en los navegadores Chrome y Firefox
            //btnReload.Image = Properties.Resources.Close_24x24;
        }
    }
}
