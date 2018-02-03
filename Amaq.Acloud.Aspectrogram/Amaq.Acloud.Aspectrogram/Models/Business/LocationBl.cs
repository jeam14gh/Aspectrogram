namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Data;
    using Acloud.Business;
    using Acloud.Entities.Core;
    using System.Collections.Generic;

    /// <summary>
    /// Logica de negocio LocationExtension
    /// </summary>
    public class LocationBl: CoreBl<Location>
    {
        /// <summary>
        /// Contiene una referencia al repositorio de locationRepository y sus metodos/atributos.
        /// </summary>
        private LocationRepository _locationRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public LocationBl(string coreDbUrl) : base(coreDbUrl)
        {
            _locationRepository = new LocationRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Elimina un Location por medio de su NodeId
        /// </summary>
        public void DeleteByNodeId(string nodeId)
        {
            _locationRepository.Delete(l => l.NodeId == nodeId);
        }

        /// <summary>
        /// Elimina varios Locations de una lista
        /// </summary>
        public void DeleteMany(List<string> locations)
        {
            _locationRepository.DeleteMany(locations);
        }
    }
}
