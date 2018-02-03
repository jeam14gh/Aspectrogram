using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.ValueObjects
{
    /// <summary>
    /// Plantilla del correo en la configuración de eventos por estados de condición de un activo principal
    /// </summary>
    public class MailLayout
    {
        /// <summary>
        /// Asunto del correo   
        /// </summary>
        public string Subject { get; set; }
        /// <summary>
        /// Mensaje del correo
        /// </summary>
        public string Message { get; set; }
    }
}
