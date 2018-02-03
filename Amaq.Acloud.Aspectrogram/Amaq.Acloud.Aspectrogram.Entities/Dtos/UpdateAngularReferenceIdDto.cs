using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Actualiza la propiedad AngularReferenceId de un punto de medición o activo (RpmEventConfig) cuando existe un copiar - pegar 
    /// </summary>
    public class UpdateAngularReferenceIdDto
    {
        /// <summary>
        /// Id antiguo de un punto de medición
        /// </summary>
        public string IdOld { get; set; }

        /// <summary>
        /// Tipo de sensor de un punto de medición
        /// </summary>
        public int SensorTypeCode { get; set; }

        /// <summary>
        /// Id nuevo de un punto de medición o activo
        /// </summary>
        public string IdNew { get; set; }

        /// <summary>
        /// AngularReferenceId antiguo de un punto de medición o activo (RpmEventConfig)
        /// </summary>
        public string AngularReferenceIdOld { get; set; }

        /// <summary>
        /// Incializa una nueva instancia de UpdateAngularReferenceIdDto sin parametros
        /// </summary>
        public UpdateAngularReferenceIdDto () {}

        /// <summary>
        /// Incializa una nueva instancia de UpdateAngularReferenceIdDto para puntos de medición
        /// </summary>
        /// <param name="idOld">Id antiguo de un punto de medición</param>
        /// <param name="sensorTypeCode"> Tipo de sensor de un punto de medición</param>
        /// <param name="idNew">Id nuevo de un punto de medición</param>
        /// <param name="angularReferenceIdOld">AngularReferenceId antiguo de un punto de medición</param>
        public UpdateAngularReferenceIdDto (string idOld, int sensorTypeCode, string idNew, string angularReferenceIdOld) {
            this.IdOld = idOld;
            this.SensorTypeCode = sensorTypeCode;
            this.IdNew = idNew;
            this.AngularReferenceIdOld = angularReferenceIdOld;
        }

        /// <summary>
        /// Incializa una nueva instancia de UpdateAngularReferenceIdDto para activos
        /// </summary>
        /// <param name="idNew">Id nuevo de un activo</param>
        /// <param name="angularReferenceIdOld">AngularReferenceId antiguo del objeto RpmEventConfig de un activo</param>
        public UpdateAngularReferenceIdDto(string idNew, string angularReferenceIdOld)
        {
            this.IdNew = idNew;
            this.AngularReferenceIdOld = angularReferenceIdOld;
        }
    }
}
