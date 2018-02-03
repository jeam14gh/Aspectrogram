namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using Acloud.Data;
    using Acloud.Entities.Core;
    using MongoDB.Bson;
    using System.Collections.Generic;
    using System.Linq;

    public class LocationRepository : CoreRepository<Location>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public LocationRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Elimina varios Locations
        /// </summary>
        public void DeleteMany(List<string> locations)
        {
            var objectIdList = locations.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("_id", objectIdList);

            collection.DeleteMany(filter);
        }
    }
}
