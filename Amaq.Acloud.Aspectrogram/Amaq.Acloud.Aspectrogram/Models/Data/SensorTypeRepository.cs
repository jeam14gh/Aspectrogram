namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using Entities;
    using Acloud.Data;

    /// <summary>
    /// Repository SensorType
    /// </summary>
    public class SensorTypeRepository : CoreRepository<SensorType>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public SensorTypeRepository(string dbUrl) : base(dbUrl)
        {

        }
    }
}
