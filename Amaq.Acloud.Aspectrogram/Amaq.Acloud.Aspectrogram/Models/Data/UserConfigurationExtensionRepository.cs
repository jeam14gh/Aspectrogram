namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using Amaq.Acloud.Data;
    using Amaq.Acloud.Entities.Core;
    using MongoDB.Bson;
    using MongoDB.Driver;
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Web;
    /// <summary>
    /// 
    /// </summary>
    public class UserConfigurationExtensionRepository : CoreRepository<UserConfiguration>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public UserConfigurationExtensionRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// 
        /// </summary>
        public void UpdateByUser(UserConfiguration userConfiguration)
        {
            var filter = builder.Eq("UserId", new ObjectId(userConfiguration.UserId));
            var update = Builders<UserConfiguration>.Update.
            Set(uc => uc.MeasuresUnits, userConfiguration.MeasuresUnits).
            Set(uc => uc.Graphs, userConfiguration.Graphs).
            Set(uc => uc.WorkSpace, userConfiguration.WorkSpace);

            collection.UpdateOne(filter, update);
        }
    }
}