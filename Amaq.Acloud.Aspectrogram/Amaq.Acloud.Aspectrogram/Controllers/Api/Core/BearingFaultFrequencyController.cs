using Amaq.Acloud.Aspectrogram.Controllers.Api.Attributes;
using Amaq.Acloud.Aspectrogram.Entities;
using Amaq.Acloud.Aspectrogram.Models.Business;
using Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;

namespace Amaq.Acloud.Aspectrogram.Controllers.Api.Core
{
    /// <summary>
    /// Controlador de Frecuencia de falla del rodamiento
    /// </summary>
    [CustomAuthorize]
    public class BearingFaultFrequencyController : GenericController<BearingFaultFrequency>
    {

    }
}