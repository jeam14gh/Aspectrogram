namespace Amaq.Acloud.Aspectrogram.Controllers
{
    using System.Collections.Generic;
    using System.Web.Mvc;
    using Entities;
    using Proxy;
    using Entities.Dtos;

    [Authorize]
    public class ConfigController : Controller
    {
        // GET: Config
        public ActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Retorna todos los Atransmitter con el nombre de la MdVariable asociada con un canal.
        /// </summary>
        /// <returns></returns>
        public ActionResult Atr()
        {
            return View(new AtrProxy(Properties.AppUserState).GetAllWithMdVariableTag());
        }

        /// <summary>
        /// Actualiza todos los modulos asociados a un AtrId
        /// </summary>
        /// <param name="atrId"></param>
        /// <param name="modules"></param>
        /// <returns></returns>
        [HttpPost]
        public JsonResult UpdateModule(string atrId, List<AtrModule> modules)
        {
            new AtrProxy(Properties.AppUserState).UpdateModule(atrId, modules);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene que indica si el Atransmitter debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="atrId">Id Atransmitter</param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult ShouldReconfigure(string atrId)
        {
            return Json(new AtrProxy(Properties.AppUserState).ShouldReconfigure(atrId), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Actualiza un Atransmitter
        /// </summary>
        /// <param name="atr">Entidad Atr</param>
        [HttpPost]
        public JsonResult UpdateAtr(Atr atr)
        {
            //new AtrProxy(Properties.AppUserState).Update(atr);
            new AtrProxy(Properties.AppUserState).UpdateAliasAndDescription(atr);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Retorna todos los Asdaq
        /// </summary>
        /// <returns></returns>
        public ActionResult Asdaq()
        {
            return View(new AsdaqProxy(Properties.AppUserState).GetAllWithMdVariableTag());
        }

        /// <summary>
        /// Actualiza todos los dispositivos de adquisición (NiDevices y NiCompactDaqs) asociados a un Asdaq con su respectivo Id y por ultimo calcula y actualiza la M y B 
        /// de cada punto de medición que se le asocie un canal Aconditioner
        /// </summary>        
        [HttpPost]
        public JsonResult UpdateDevice(string asdaqId, List<NiDeviceDto> devices, List<MdVariableUpdateMBDto> mdVariablesDto)
        {
            new MdVariableExtensionProxy(Properties.AppUserState).CalculateMandB(mdVariablesDto);
            new AsdaqProxy(Properties.AppUserState).UpdateDevice(asdaqId, devices);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene e indica si el Asdaq debe obtener nuevamente su configuración
        /// </summary>
        /// <param name="asdaqId">Id Atransmitter</param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult ShouldReconfigureAsdaq(string asdaqId)
        {
            return Json(new AsdaqProxy(Properties.AppUserState).ShouldReconfigure(asdaqId), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Actualiza el Alias y MailAccountConfiguration de un Asdaq
        /// </summary>
        [HttpPost]
        public JsonResult UpdateAliasAndMailAccountAsdaq(Asdaq asdaq)
        {
            new AsdaqProxy(Properties.AppUserState).UpdateAliasAndMailAccountAsdaq(asdaq);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Reconfigura un Asdaq
        /// </summary>
        [HttpPost]
        public JsonResult Reconfigure(Asdaq asdaq)
        {
            new AsdaqProxy(Properties.AppUserState).Reconfigure(asdaq);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal
        /// </summary>
        [HttpPost]
        public JsonResult DeleteRelationshipMdVariableWithAiChannelsAsdaq(string asdaqId, NiDeviceDto device, List<MdVariableUpdateMBDto> mdVariablesDto)
        {
            new MdVariableExtensionProxy(Properties.AppUserState).CalculateMandB(mdVariablesDto);
            new AsdaqProxy(Properties.AppUserState).DeleteRelationshipMdVariableWithAiChannels(asdaqId, device);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Elimina la relación de puntos de medición con su respectivo canal
        /// </summary>
        [HttpPost]
        public JsonResult DeleteRelationshipMdVariableWithAiChannelsAtr(string atrId, List<AtrModule> modules)
        {
            new AtrProxy(Properties.AppUserState).DeleteRelationshipMdVariableWithAiChannels(atrId, modules);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene todos los dispositivos A-Conditioner
        /// </summary>
        [HttpGet]
        public JsonResult GetAllAconditioner()
        {
            return Json(new AconditionerProxy(Properties.AppUserState).GetAll(), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Obtiene todos los tipos de dispositivos A-Conditioner
        /// </summary>
        [HttpGet]
        public JsonResult GetAllAconditionerType()
        {
            return Json(new AconditionerTypeProxy(Properties.AppUserState).GetAll(), JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Actualiza la propiedad Reconfigure de un Atr
        /// </summary>
        [HttpPost]
        public JsonResult ReconfigureAtr(Atr atr)
        {
            new AtrProxy(Properties.AppUserState).UpdateReconfigure(atr);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Actualiza una lista de Aconditioners relacionados a un Asdaq y los parámetros
        /// M y B de los puntos de medición que influyan en cambios de ganancia o desplazamiento que estén relacionados a canales Asdaq
        /// </summary>
        [HttpPost]
        public JsonResult UpdateAconditionerByAsdaq(string asdaqId, List<Aconditioner> aconditioners, List<MdVariableUpdateMBDto> mdVariablesToUpdate)
        {
            new AsdaqProxy(Properties.AppUserState).UpdateAconditionerByAsdaq(asdaqId, aconditioners, mdVariablesToUpdate);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Elimina un Aconditioner relacionado a un Asdaq por medio del serial y los canales Asdaq que estén relacionados 
        /// </summary>
        [HttpPost]
        public JsonResult DeleteAconditionerBySerial(string asdaqId, string serial, List<NiDeviceDto> niDevices)
        {
            new AsdaqProxy(Properties.AppUserState).DeleteAconditionerBySerial(asdaqId, serial, niDevices);
            return Json("", JsonRequestBehavior.AllowGet);
        }

        /// <summary>
        /// Retorna una MdVariable por medio de su id
        /// </summary>
        [HttpGet]
        public JsonResult GetMdVariableById(string id)
        {
            return Json(new MdVariableExtensionProxy(Properties.AppUserState).GetById(id), JsonRequestBehavior.AllowGet);
        }
    }
}