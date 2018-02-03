namespace Amaq.Acloud.AsdaqService.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using NationalInstruments.DAQmx;
    using Aspectrogram.Entities;
    using Helpers;
    using log4net;
    using System.Globalization;

    /// <summary>
    /// Representa las muestras adquiridas por cada Ai Channel asociado a una NiTask. Cada NiTask corresponde a un NiDevice o NiCompactDaq
    /// </summary>
    public class NiSamplesAcquired
    {
        /// <summary>
        /// Nombre del dispositivo en el NiMax
        /// </summary>
        public string DeviceId { get; set; }
        /// <summary>
        /// Requerido para la estrategía de adquisición Multitask
        /// </summary>
        public string FullId { get; set; }
        /// <summary>
        /// Frecuencia de muestreo de las señales adquiridas
        /// </summary>
        public double SampleRate { get; set; }
        /// <summary>
        /// Estampa de tiempo para las muestras adquiridas por cada Ai Channel
        /// </summary>
        public DateTime TimeStamp { get; set; }
        /// <summary>
        /// Muestras adquiridas por cada Ai Channel
        /// </summary>
        public double[,] Samples { get; set; }
    }

    /// <summary>
    /// Gestiona la adquisición de datos a través de hardware National Instruments M Series, X Series, C Series y CompactDaq
    /// </summary>
    public class NiAcquisition
    {
        private static readonly ILog log = LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        private class NiTask
        {
            public NationalInstruments.DAQmx.Task Task { get; set; }
            public NationalInstruments.DAQmx.Task RunningTask { get; set; }
            public AnalogMultiChannelReader AnalogInReader { get; set; }
            public AsyncCallback AnalogCallback { get; set; }
            public double SampleRate { get; set; }
            public int SamplesToRead { get; set; }
            private AITerminalConfiguration _terminalConfiguration;
            public AutoResetEvent AdquisitionDone;

            /// <summary>
            /// Mantiene en memoria RAM la señal adquirida por cada Ai Channel de la NiTask
            /// </summary>
            public NiSamplesAcquired SamplesAcquired { get; set; }

            /// <summary>
            /// Crea canales análogos de entrada dinamicamente
            /// </summary>
            /// <param name="niAiChannel"></param>
            /// <param name="name">Nombre del dispositivo o módulo de adquisición</param>
            private void CreateAiChannelDynamically(NiAiChannel niAiChannel, string name)
            {
                var parameterTypes = niAiChannel.AiMeasureMethod.ParameterTypes.Select(t => Type.GetType(t)).ToArray();
                Type parameterType = null;

                // Solo si el parámetro es Enum se realiza conversión ya que el valor se está almacenando como string en BD
                for (int i = 0; i < niAiChannel.AiMeasureMethod.ParameterValues.Count; i++)
                {
                    parameterType = parameterTypes[i];

                    if (parameterType.IsEnum)
                        niAiChannel.AiMeasureMethod.ParameterValues[i] = Enum.Parse(parameterType, niAiChannel.AiMeasureMethod.ParameterValues[i].ToString());
                }

                // Resolver y llamar método dinamicamente
                //var parameterTypes = aiMeasureMethod.ParameterValues.Select(p => p.GetType()).ToArray();
                var type = typeof(AIChannelCollection);
                var aiMethod = type.GetMethod(niAiChannel.AiMeasureMethod.Name, parameterTypes);

                //var sensibilityInVolts = 7.87 / 1000; // Conversión de milivoltios a voltios
                //var m = AconditionerFactor * (1 / (sensibilityInVolts));
                //var b = 0.0;

                // Setear dinamicamente el nombre del canal físico
                var physicalChannelNameParameter = aiMethod.GetParameters().Where(p => p.Name == "physicalChannelName").FirstOrDefault();
                niAiChannel.AiMeasureMethod.ParameterValues[physicalChannelNameParameter.Position] = niAiChannel.Name;

                var maximumValueParameter = aiMethod.GetParameters().Where(p => p.Name == "maximumValue").FirstOrDefault();
                var minimumValueParameter = aiMethod.GetParameters().Where(p => p.Name == "minimumValue").FirstOrDefault();

                // Crear una copia, para no modificar la lista original, esto es necesario cuando la adquisición se reinicia,
                // ya que la lista original se estaba quedando con el último valor modificado con base a M y B.
                var parameterValues = new List<object>(niAiChannel.AiMeasureMethod.ParameterValues);

                if (maximumValueParameter != null && minimumValueParameter != null)
                {
                    var unscaledMaximum = 0.0;
                    var unscaledMinimum = 0.0;

                    try
                    {
                        unscaledMaximum = (double)parameterValues[maximumValueParameter.Position];
                        unscaledMinimum = (double)parameterValues[minimumValueParameter.Position];
                    }
                    catch (Exception ex)
                    {
                        log.Error("Error al tratar de convertir al tipo Double los parametros mínimo y máximo para el punto de medición " + name);
                        throw ex;
                    }

                    // Se configura el valor máximo y mínimo en términos de la escala lineal que se le va a aplicar a las señales
                    parameterValues[maximumValueParameter.Position] =
                        unscaledMaximum * niAiChannel.AiMeasureMethod.M + niAiChannel.AiMeasureMethod.B;

                    parameterValues[minimumValueParameter.Position] =
                        unscaledMinimum * niAiChannel.AiMeasureMethod.M + niAiChannel.AiMeasureMethod.B;
                }

                var args = parameterValues.ToArray();
                var aiChannel = aiMethod.Invoke(Task.AIChannels, args);

                // Lógica para crear customScales de National Instruments para el AiChannel
                var unitsParameter = aiMethod.GetParameters().Where(p => p.Name == "units").FirstOrDefault();                

                if((unitsParameter != null) && (parameterValues[unitsParameter.Position].ToString() == "FromCustomScale"))
                {
                    var scaleName = Guid.NewGuid().ToString(); // Asegurar nombre único para la escala personalizada de cada AiChannel
                    var linearScale = new LinearScale(scaleName, niAiChannel.AiMeasureMethod.M, niAiChannel.AiMeasureMethod.B); // Crear escala lineal
                    ((AIChannel)aiChannel).CustomScaleName = scaleName; // Setear el nombre de la escala que se va a utilizar                   
                }
                // Lógica para crear customScales de National Instruments para el AiChannel

                // Gestión de acople DC ó AC dependiendo de si la tarjeta de adquisición o módulo de cDAQ tiene característica de acople
                var aiCouplings = DaqSystem.Local.LoadDevice(name).AICouplings.ToString()?.Replace(" ", string.Empty)?.Split(',')?.ToList();

                if (aiCouplings != null)
                {
                    if (aiCouplings.Contains(niAiChannel.AiMeasureMethod.AiCoupling))
                    {
                        ((AIChannel)aiChannel).Coupling =
                            (AICoupling)Enum.Parse(typeof(AICoupling), niAiChannel.AiMeasureMethod.AiCoupling);
                    }
                }
                // Gestión de acople DC ó AC dependiendo de si la tarjeta de adquisición o módulo de cDAQ tiene característica de acople
            }

            public NiTask(string chasisName, List<NiDevice> cSeriesModules, int samplesToRead, double sampleRate, int taskIndex)
            {
                SampleRate = sampleRate;
                SamplesToRead = samplesToRead;

                AdquisitionDone = new AutoResetEvent(false);

                SamplesAcquired = new NiSamplesAcquired();
                SamplesAcquired.DeviceId = chasisName; // ?
                SamplesAcquired.FullId = chasisName + taskIndex.ToString();
                SamplesAcquired.SampleRate = SampleRate;

                // El nombre para la tarea está compuesto por el nombre del chasis y el indice o 
                // consecutivo de la tarea asociada al grupo de C Series Modules
                Task = new NationalInstruments.DAQmx.Task(chasisName + taskIndex.ToString());

                // Agregar a la tarea los AiChannels de cada módulo relacionados con MdVariables 
                cSeriesModules.ForEach(
                    m => m.AiChannels.ForEach(ai =>
                    {
                        CreateAiChannelDynamically(ai, m.Name);
                    })
                );

                Task.Timing.ConfigureSampleClock(
                    "",
                    SampleRate,
                    SampleClockActiveEdge.Rising,
                    SampleQuantityMode.ContinuousSamples,
                    SamplesToRead
                );

                AnalogInReader = new AnalogMultiChannelReader(Task.Stream);
                AnalogInReader.SynchronizeCallbacks = true;
            }

            public NiTask(NiDevice niDevice)
            {
                SampleRate = niDevice.SampleRate;
                SamplesToRead = niDevice.SamplesToRead;
                _terminalConfiguration = (AITerminalConfiguration)Enum.Parse(typeof(AITerminalConfiguration), niDevice.TerminalConfiguration);

                AdquisitionDone = new AutoResetEvent(false);

                SamplesAcquired = new NiSamplesAcquired();
                SamplesAcquired.DeviceId = niDevice.Name;
                SamplesAcquired.FullId = niDevice.Name;
                SamplesAcquired.SampleRate = SampleRate;

                Task = new NationalInstruments.DAQmx.Task(niDevice.Name);

                // Agregar canales a la tarea
                foreach (var aiChannel in niDevice.AiChannels)
                {
                    CreateAiChannelDynamically(aiChannel, niDevice.Name);
                }

                Task.Timing.ConfigureSampleClock(
                    "",
                    SampleRate,
                    SampleClockActiveEdge.Rising,
                    SampleQuantityMode.ContinuousSamples,
                    SamplesToRead
                );

                AnalogInReader = new AnalogMultiChannelReader(Task.Stream);
                AnalogInReader.SynchronizeCallbacks = true;
            }

            public void Stop()
            {
                if (Task != null)
                {
                    RunningTask = null;
                    Task.Dispose();
                    Task = null;
                }
            }

            public void Dispose()
            {
                Stop();
            }
        }

        private List<NiDevice> _niDevices = null;
        private List<NiTask> _niTasks = null; // Tareas National Instruments
        //private List<NationalInstruments.DAQmx.Task> RunningTaskList { get; set; }
        private string _chasisName = null;
        private volatile bool _stop = false;
        private System.Threading.Tasks.Task _acquisitionNotifier = null;

        /// <summary>
        /// Evento que notifica las muestras adquiridas
        /// </summary>
        public event EventHandler<List<NiSamplesAcquired>> AdquisitionDone;

        /// <summary>
        /// Lanza el evento AdquisitionDone
        /// </summary>
        /// <param name="e"></param>
        protected virtual void OnAdquisitionDone(List<NiSamplesAcquired> e)
        {
            AdquisitionDone?.Invoke(this, e);
        }

        /// <summary>
        /// Crea una nueva instancia de NiAcquisition
        /// </summary>
        /// <param name="niDevice">El NI Device asociado a esta NiAcquisition</param>
        public NiAcquisition(NiDevice niDevice)
        {
            _niDevices = new List<NiDevice>();
            _niDevices.Add(niDevice);
        }

        /// <summary>
        /// Crea una nueva instancia de NiAcquisition
        /// </summary>
        /// <param name="syncronizedNiDevices">El NI Device maestro y sus correspondientes NI Device esclavos</param>
        public NiAcquisition(List<NiDevice> syncronizedNiDevices)
        {
            _niDevices = syncronizedNiDevices;
        }

        /// <summary>
        /// Crea una nueva instancia de NiAcquisition
        /// </summary>
        /// <param name="chasisName">Nombre del chásis CompactDaq</param>
        /// <param name="cSeriesModules">La lista de módulos de la serie C</param>
        public NiAcquisition(string chasisName, List<NiDevice> cSeriesModules)
        {
            _niDevices = cSeriesModules;
            _chasisName = chasisName;
        }

        /// <summary>
        /// Inicia la adquisición de datos
        /// </summary>
        public void Start()
        {
            if (_niDevices == null)
            {
                return; // Si ningún dispositivo tiene canal relacionado a algún punto de medición
            }

            _niTasks = null;
            _niTasks = new List<NiTask>();

            try
            {
                var productCategory = (ProductCategory)Enum.Parse(typeof(ProductCategory), _niDevices[0].ProductCategory);

                switch (productCategory)
                {
                    case ProductCategory.UsbDaq:
                        var niUsbTask = new NiTask(_niDevices[0]);

                        niUsbTask.Task.Control(TaskAction.Verify);
                        niUsbTask.RunningTask = niUsbTask.Task;

                        _niTasks.Add(niUsbTask); // Crear tarea para la adquisición 

                        break;
                    case ProductCategory.XSeriesDaq:
                    case ProductCategory.MSeriesDaq:
                        if (_niDevices.Count > 1)
                        {
                            var niMasterDevice = _niDevices.Where(d => d.IsMasterNiDevice).FirstOrDefault();

                            // Por el momento solo sincronizamos tarjetas M Series
                            var niMasterTask = new NiTask(niMasterDevice);

                            niMasterTask.Task.Timing.ReferenceClockSource = "OnboardClock";
                            niMasterTask.Task.Control(TaskAction.Verify);

                            niMasterTask.RunningTask = niMasterTask.Task;

                            _niTasks.Add(niMasterTask); // Crear tarea para la adquisición 

                            var niSlaveDevices = _niDevices.Where(d => d.Name != niMasterDevice.Name).ToList();

                            foreach (var niSlaveDevice in niSlaveDevices)
                            {
                                var niSlaveTask = new NiTask(niSlaveDevice);

                                niSlaveTask.Task.Timing.ReferenceClockSource = niMasterTask.Task.Timing.ReferenceClockSource;
                                niSlaveTask.Task.Timing.ReferenceClockRate = niMasterTask.Task.Timing.ReferenceClockRate;

                                niSlaveTask.Task.Triggers.StartTrigger.ConfigureDigitalEdgeTrigger(
                                    "/" + niMasterDevice.Name + "/" + "ai/StartTrigger",
                                    DigitalEdgeStartTriggerEdge.Rising
                                );

                                niSlaveTask.Task.Control(TaskAction.Verify);

                                _niTasks.Add(niSlaveTask);
                            }
                        }
                        else
                        {
                            var niTask = new NiTask(_niDevices[0]);

                            niTask.Task.Control(TaskAction.Verify);

                            niTask.RunningTask = niTask.Task;

                            _niTasks.Add(niTask); // Crear tarea para la adquisición 
                        }

                        break;
                    case ProductCategory.CSeriesModule: // Módulos instalados en un chasis CompactDaq
                        // Truco para los chasis CompactDaq que son con bus TCP/IP(Rutinas necesarias debido a un problema de National Instruments)
                        var chasis = DaqSystem.Local.LoadDevice(_chasisName);

                        // Si es un dispositivo Tcp físico
                        if ((!chasis.IsSimulated) && (chasis.BusType == DeviceBusType.Tcpip))
                        {
                            try
                            {
                                chasis.UnreserveNetworkDevice();
                            }
                            catch (Exception){}

                            chasis.ReserveNetworkDevice(true);
                        }
                        // Truco para los chasis CompactDaq que son con bus TCP/IP(Rutinas necesarias debido a un problema de National Instruments)

                        // Distinguir las diferentes tareas de national instruments configuradas para los diferentes módulos
                        _niDevices
                            .GroupBy(cSeriesModule => cSeriesModule.TaskIndex)
                            .ToList()
                            .ForEach(cSeriesModulesByTaskIndex =>
                            {
                                var cSeriesModules = cSeriesModulesByTaskIndex.ToList(); // Grupo de módulos

                                var samplesToRead = cSeriesModules[0].SamplesToRead;
                                var sampleRate = cSeriesModules[0].SampleRate;

                                // Tarea de national instruments para un grupo de módulos
                                var niCSeriesModulesTask = 
                                    new NiTask(_chasisName, cSeriesModules, samplesToRead, sampleRate, cSeriesModules[0].TaskIndex);

                                niCSeriesModulesTask.Task.Control(TaskAction.Verify);
                                niCSeriesModulesTask.RunningTask = niCSeriesModulesTask.Task;

                                _niTasks.Add(niCSeriesModulesTask); // Crear tarea para la adquisición 
                            });

                        break;
                }
               
                StartTasks();
            }
            catch (Exception ex)
            {
                //System.Diagnostics.Debug.Print(ex.Message);
                throw ex;
            }
        }

        /// <summary>
        /// Detiene la adquisición
        /// </summary>
        public void Stop()
        {
            if(_niTasks == null)
            {
                return;
            }

            // Detener tareas
            _niTasks.ForEach(t => t.Stop());

            _stop = true;
            _niTasks.ForEach(t => t.AdquisitionDone.Set()); // Señalamiento para terminar thread que se encuentra en espera

            if(_acquisitionNotifier != null)
            {
                _acquisitionNotifier.Wait(); // Esperar que el subproceso termine con normalidad
            }

            _stop = false;

            // Destruir objetos
            _niTasks.ForEach(t => t.Dispose());
        }

        /// <summary>
        /// Reinicia la adquisición
        /// </summary>
        public void Restart()
        {
            try
            {
                Stop();
                Start();
            }
            catch(Exception ex)
            {
                log.Debug("Ha ocurrido un error reiniciando la adquisicion", ex);
                System.Threading.Thread.Sleep(1000); // Descanso para el procesador
                Restart();
            }
        }

        /// <summary>
        /// Inicia todas las tareas de adquisición de datos
        /// </summary>
        private void StartTasks()
        {
            var i = 0;

            foreach (var niTask in _niTasks)
            {
                // Callback de adquisición
                niTask.AnalogCallback = new AsyncCallback((IAsyncResult ar) =>
                {
                    try
                    {
                        if (niTask.RunningTask != null && niTask.RunningTask == ar.AsyncState)
                        {
                            var dataVolt = niTask.AnalogInReader.EndReadMultiSample(ar);
                            // Estampa de tiempo
                            niTask.SamplesAcquired.TimeStamp = DateTime.SpecifyKind(
                                DateTime.Parse(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff")),
                                DateTimeKind.Local);
                            niTask.SamplesAcquired.Samples = dataVolt; // Muestras adquiridas por cada AI Channel

                            // Señalar que la tarea terminó la adquisición
                            niTask.AdquisitionDone.Set();

                            niTask.AnalogInReader.BeginReadMultiSample(niTask.SamplesToRead, niTask.AnalogCallback, niTask.RunningTask);
                        }
                    }
                    catch (DaqException dex)
                    {
                        System.Diagnostics.Debug.Print("Error al adquirir: " + dex.Message);
                        Restart();
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.Print(ex.Message);
                        Restart();
                    }
                });

                i++;
            }

            i = 0;

            foreach (var niTask in _niTasks)
            {
                // Iniciar adquisición
                niTask.AnalogInReader.BeginReadMultiSample(niTask.SamplesToRead, niTask.AnalogCallback, niTask.RunningTask);

                i++;
            }

            // Notificador de datos adquiridos
            _acquisitionNotifier = new TaskFactory().StartNew(() =>
            {
                while (true)
                {
                    WaitHandle.WaitAll(_niTasks.Select(t => t.AdquisitionDone).ToArray());

                    if (_stop)
                    {
                        return; // romper el ciclo while para que el thread termine
                    }

                    OnAdquisitionDone(_niTasks.Select(t => t.SamplesAcquired).ToList());
                }
            }, TaskCreationOptions.LongRunning);
        }
    }
}
