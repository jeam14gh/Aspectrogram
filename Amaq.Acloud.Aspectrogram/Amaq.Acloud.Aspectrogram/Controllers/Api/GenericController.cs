namespace Amaq.Acloud.Aspectrogram.WebSite.Controllers.Api
{
    using Libraries.MongoDbRepository;
    using Business;
    using System.Web.Http;
    using System.Collections.Generic;
    using Aspectrogram.Controllers.Api.Attributes;
    using System.Web.Http.Controllers;
    using System.Linq;
    using log4net;
    using System;

    /// <summary>
    /// Representa un controlador generico para las operaciones comunes sobre el tipo especificado
    /// </summary>
    /// <typeparam name="T">Tipo concreto</typeparam>
    [CustomAuthorize]
    public class GenericController<T> : ApiController where T : IEntity<string>
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Url de la base base de datos (URL Server + DbName)
        /// </summary>
        protected string CoreDbUrl;

        /// <summary>
        /// Inicializa la variable CoreDbUrl que es heredada por todos los Api Controller
        /// </summary>
        /// <param name="controllerContext"></param>
        protected override void Initialize(HttpControllerContext controllerContext)
        {
            base.Initialize(controllerContext);
            string dbName = controllerContext.Request.Headers.GetValues("dbName").FirstOrDefault();
            CoreDbUrl = string.Format("{0}{1}", Aspectrogram.Properties.MongoUrlBase, dbName);
        }

        /// <summary>
        /// Obtiene un documento segun su Id en la base de datos.
        /// </summary>
        /// <param name="entityId">Id del documento en la base datos</param>
        /// <returns>El documento requerido</returns>
        [HttpGet]
        public virtual IHttpActionResult GetById(string entityId)
        {
            try
            {
                var type = typeof(T);
                return Ok(new CoreBl<T>(CoreDbUrl).GetById(entityId));
            }
            catch(Exception ex)
            {
                log.Error(ex);
                throw ex;
            }
        }

        /// <summary>
        /// Obtiene un listado de documentos segun un listado de Ids especificados.
        /// </summary>
        /// <param name="listEntityId">Listado de Ids de los diferentes documentos en la base datos</param>
        /// <returns>Listado de documentos requeridos</returns>
        [HttpPost]
        public virtual IHttpActionResult GetById(List<string> listEntityId)
        {
            return Ok(new CoreBl<T>(CoreDbUrl).GetById(listEntityId));
        }

        /// <summary>
        /// Encuentra un documento (el primero caso exista mas de una coincidencia) segun las propiedades conocidas del mismo.
        /// </summary>
        /// <param name="entity">Entidad con los valores conocidos con los que se realizara la busqueda</param>
        /// <returns>El primer documento que coincida con los valores conocidos de la entidad</returns>
        [HttpPost]
        public virtual IHttpActionResult Find(T entity)
        {
            return Ok(new CoreBl<T>(CoreDbUrl).Find(entity));
        }

        /// <summary>
        /// Inserta un nuevo documento en la base de datos.
        /// </summary>
        /// <param name="entity">Documento a insertar</param>
        /// <returns>El Id generado para el documento insertado</returns>
        [HttpPost]
        public virtual IHttpActionResult AddSingle([FromBody]T entity)
        {
            return Ok(new CoreBl<T>(CoreDbUrl).AddSingle(entity));
        }

        /// <summary>
        /// Inserta la lista de entidades en la base de datos
        /// </summary>
        /// <param name="entityList">Lista de entidades</param>
        /// <returns></returns>
        [HttpPost]
        public virtual IHttpActionResult AddMany(List<T> entityList)
        {
            new CoreBl<T>(CoreDbUrl).AddMany(entityList);
            return Ok();
        }

        /// <summary>
        /// Obtiene la lista completa de documentos que pertenecen a la entidad.
        /// </summary>
        /// <returns>Listado de documentos</returns>
        [HttpGet]
        public virtual IHttpActionResult GetAll()
        {
            return Ok(new CoreBl<T>(CoreDbUrl).GetAll());
        }

        /// <summary>
        /// Actualizar un documento de una entidad.
        /// </summary>
        /// <param name="entity">Entidad a actualizar</param>
        /// <returns></returns>
        [HttpPost]
        public IHttpActionResult Update([FromBody] T entity)
        {
            return Ok(new CoreBl<T>(CoreDbUrl).Update(entity));
        }
    }
}