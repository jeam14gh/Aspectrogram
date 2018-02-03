namespace Amaq.Acloud.Aspectrogram.Models.Business
{
    using System;
    using System.Collections.Generic;
    using Acloud.Business;
    using Data;
    using Entities;
    using Entities.Enums;
    using Entities.Dtos;
    using Entities.ValueObjects;
    using Libraries.MongoRepository.Repository;
    using System.Text;
    using Newtonsoft.Json;

    /// <summary>
    /// Logica de negocio RecordedEvent
    /// </summary>
    public class RecordedEventBl : CoreBl<RecordedEvent>
    {
        private RecordedEventRepository _recordedEventRepository = null;
        private GridFSRepository _gridFSRepository = null;
        private string CoreDbUrl;

        /// <summary>
        /// Inicializa una nueva instancia de RecordedEventBl
        /// </summary>
        public RecordedEventBl(string coreDbUrl): base(coreDbUrl)
        {
            _recordedEventRepository = new RecordedEventRepository(coreDbUrl);
            _gridFSRepository = new GridFSRepository(coreDbUrl);
            CoreDbUrl = coreDbUrl;
        }

        /// <summary>
        /// Registra un nuevo evento en el servidor
        /// </summary>
        /// <param name="recordedEventDto">Objeto con los datos necesarios para el registro del evento</param>
        /// <returns>Id del evento en el servidor o una cadena vacía si ocurre algún error</returns>
        public string Add(NewRecordedEventDto recordedEventDto)
        {
            var id = string.Empty;

            try
            {
                // Si el evento ya está grabado completamente se marca con EventStatus.Uploading
                var recordedEvent = new RecordedEvent()
                {
                    AssetId = recordedEventDto.AssetId,
                    StatusId = recordedEventDto.StatusId,
                    TimeStamp = recordedEventDto.TimeStamp,
                    EventType = recordedEventDto.EventType,
                    Duration = 0.0,
                    Status = (recordedEventDto.EventStatus != EventStatus.Recording) ? EventStatus.Uploading : EventStatus.Recording,   
                    Step = recordedEventDto.Step               
                };

                id = _recordedEventRepository.AddSingle(recordedEvent);

                // Guardar en GridFS el archivo assetInfo.json
                var assetInfoJsonFileId = _gridFSRepository.Upload("assetInfo.json", recordedEventDto.AssetInfoJsonBytes);
                recordedEvent.AssetInfoJsonFileId = assetInfoJsonFileId;
                _recordedEventRepository.Update(recordedEvent);
           
                return id;
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Registra un nuevo paquete de evento en el servidor
        /// </summary>
        /// <param name="newEventPackageDto">Objeto con la información necesaria para registrar un paquete de evento en el servidor</param>
        /// <returns>Valor lógico que indica si el paquete fue guardado correctamente o no</returns>
        public bool AddPackage(NewEventPackageDto newEventPackageDto)
        {
            try
            {
                var recordedEvent = new RecordedEventBl(CoreDbUrl).GetById(newEventPackageDto.RecordedEventId);

                var overallsPartId = _gridFSRepository.Upload(string.Format("o{0}.asd", newEventPackageDto.PackageIndex), newEventPackageDto.OverallsPart);
                var waveformsPartId = _gridFSRepository.Upload(string.Format("w{0}.asd", newEventPackageDto.PackageIndex), newEventPackageDto.WaveformsPart);

                if (recordedEvent.PackageFileIdList == null)
                {
                    recordedEvent.PackageFileIdList = new List<EventPackageFilesId>();
                }

                // Agregar info del nuevo paquete en el evento
                recordedEvent.PackageFileIdList.Add(new EventPackageFilesId()
                {
                    OverallsPartId = overallsPartId,
                    WaveformsPartId = waveformsPartId
                });

                recordedEvent.Duration += newEventPackageDto.PackageDuration; // Incrementar la duración del evento

                if (newEventPackageDto.EndOfEvent)
                {
                    recordedEvent.Status = EventStatus.Unread; // Se marca el evento como no leido, ya que fué cargado completamente en el servidor
                }
                else
                {
                    // Si el evento ya está grabado completamente se marca con EventStatus.Uploading
                    recordedEvent.Status = (newEventPackageDto.EventStatus != EventStatus.Recording) ? EventStatus.Uploading : EventStatus.Recording;
                }

                _recordedEventRepository.Update(recordedEvent); // Actualizar el evento en la base de datos
                return true;
            }
            catch (Exception ex)
            {
                // Falta escribir log aquí de la excepción y deshacer cambios que se alcanzaron a guardar como archivos de paquete y cambios en bd,
                // es decir nuestro propio Rollback
                Console.WriteLine(ex.Message);
                return false;
            }
        }

        /// <summary>
        /// Obtiene la cabecera del evento con toda la informacion relacionada al mismo
        /// </summary>
        /// <param name="eventId">Id del evento</param>
        /// <returns></returns>
        public AssetInfo GetEventHeader(string eventId)
        {
            byte[] file = _gridFSRepository.Download(_recordedEventRepository.GetEventHeader(eventId));
            return JsonConvert.DeserializeObject<AssetInfo>(Encoding.UTF8.GetString(file));
        }

        /// <summary>
        /// Obtiene el listado de eventos segun el Id del activo especificado
        /// </summary>
        /// <param name="assetId">Id del activo</param>
        /// <returns></returns>
        public List<RecordedEvent> GetByAssetId(string assetId)
        {
            return _recordedEventRepository.GetByAssetId(assetId);
        }

        /// <summary>
        /// Obtiene tanto el paquete de globales como el de formas de onda segun los Ids especificados
        /// </summary>
        /// <param name="overallPackageId">Id del paquete de valores globales a obtener</param>
        /// <param name="waveformPackageId">Id del paquete de formas de onda a obtener</param>
        /// <returns></returns>
        public SingleEventPackageDto GetPackages(string overallPackageId, string waveformPackageId)
        {
            return new SingleEventPackageDto
            {
                OverallPart = _gridFSRepository.Download(overallPackageId),
                WaveformPart = _gridFSRepository.Download(waveformPackageId)
            };
        }
    }
}
