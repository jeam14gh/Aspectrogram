namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Entities;
    using Data;
    using Acloud.Business;

    /// <summary>
    /// Logica de negocio SensorType
    /// </summary>
    public class SensorTypeBl : CoreBl<SensorType>
    {
        /// <summary>
        /// Contiene una referencia al repositorio de SensorTypeRepository y sus metodos/atributos.
        /// </summary>
        private SensorTypeRepository _sensorTypeRepository = null;

        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public SensorTypeBl(string coreDbUrl) : base(coreDbUrl)
        {
            _sensorTypeRepository = new SensorTypeRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }
    }
}
