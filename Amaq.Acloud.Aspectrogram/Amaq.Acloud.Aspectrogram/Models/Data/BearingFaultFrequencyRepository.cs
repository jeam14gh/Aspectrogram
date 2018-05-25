namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using Amaq.Acloud.Aspectrogram.Entities;
    using Amaq.Acloud.Data;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web;
    using System.Data.Odbc;
    using System.Data.OleDb;
    using System.Data;
    using Newtonsoft.Json;
    using System.Web.Script.Serialization;

    /// <summary>
    /// Repositorio BearingFaultFrequency
    /// </summary>
    public class BearingFaultFrequencyRepository : CoreRepository<BearingFaultFrequency>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public BearingFaultFrequencyRepository(string dbUrl) : base(dbUrl) { }
        
    }
}