namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using Acloud.Business;
    using Data;
    using Entities;
    using System.Collections.Generic;

    /// <summary>
    /// Logica de negocio StatusExtension
    /// </summary>
    public class StatusExtensionBl : CoreBl<StatusExtension>
    {
        private StatusExtensionRepository _statusExtensionRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Constructor
        /// </summary>
        public StatusExtensionBl(string coreDbUrl): base(coreDbUrl)
        {
            _statusExtensionRepository = new StatusExtensionRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Obtiene el conjunto de estados del Corp riesgo
        /// </summary>
        /// <returns>Lista de objetos de tipo StatusExtension</returns>
        public List<StatusExtension> GetSetOfRiskStates()
        {
            return _statusExtensionRepository.GetSetOfRiskStates();
        }
    }
}
