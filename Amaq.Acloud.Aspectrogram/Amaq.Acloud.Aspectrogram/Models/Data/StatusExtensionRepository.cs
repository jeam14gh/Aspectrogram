namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using System.Linq;
    using System.Collections.Generic;
    using Entities;
    using MongoDB.Driver;
    using Acloud.Data;

    /// <summary>
    /// Repository StatusExtension
    /// </summary>
    public class StatusExtensionRepository : CoreRepository<StatusExtension>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public StatusExtensionRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Obtiene el conjunto de estados del Corp riesgo
        /// </summary>
        /// <returns>Lista de objetos de tipo StatusExtension</returns>
        public List<StatusExtension> GetSetOfRiskStates()
        {
            var filter = builder.Eq(s => s.Corp, Acloud.Entities.Enums.Corp.Risk);
            return collection.Find(filter).ToList();
        }
    }
}