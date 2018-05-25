/*
 * jcEventPlayer.js
 * Reproductor de eventos
 * @author Jorge Calderon
 */

var JcEventPlayer = {};

JcEventPlayer = (function () {
    "use strict";

    /*
     * Constructor.
     */
    JcEventPlayer = function () {
        var
            // Player container
            _container,
            // Define si el reproductor se encuentra habilitado o no
            _enabled,
            // Titulo a mostrar en el reproductor (nombre del activo)
            _titleBar,
            // Player Slider
            _slider,
            // Loader ProgressBar
            _loadIndicator,
            // Progress Bar
            _progressBar,
            // Play Pause Button
            _playPauseBtn,
            // Refresh Button
            _refreshBtn,
            // Step Forward Button
            _stepForwardBtn,
            // Forward Button
            _forwardBtn,
            // Backward Button
            _backwardBtn,
            // Step Backward Button
            _stepBackwardBtn,
            // Muestra el tiempo de reproduccion, asi como el total de duracion del evento (HH:MM:SS)
            _timerFeedback,
            // Porcentaje del progreso de carga de los eventos
            _progressPercentage,
            // Control para el setTimeOut del tiempo de carga del evento
            _loadTimer,
            // Control para el setTimeOut del tiempo de reproduccion del evento
            _timer,
            // Auto-referencia a la clase JcEventPlayer
            _this,
            // Id del reproductor
            _playerId,
            // Posicion actual
            _currentPosition,
            // Id de la tendencia historica
            _historicTrendId,
            // Id del nodo del activo que contiene la informacion a mostrar
            _assetNodeId,
            // Referencia al modo evento que hace solicitudes al servidor
            _eventMode,
            // Tiempo del evento que se ha cargado, disponible para reproduccion
            _loadedTime,
            // Tiempo total de la duracion del evento (en segundos)
            _duration,
            // Permite determinar si el evento se encuentra pausado o no
            _paused,
            // Referencia a la suscripcion para los diferentes valores de historico
            _subscriptionValues,
            // Referencia a la suscripcion de recarga de datos
            _newRangeSubscription,
            // Referencia a la suscripcion de cierre del historico
            _closeTrendSubscription,
            // Informacion general de puntos de medicion y subvariables asociadas al activo cargado en el reproductor
            _assetInfo,
            // Metodo privado para cambiar el tipo del boton de pausa o play segun accion del usuario
            _changeButtonType,
            // Metodo privado que muestra de forma permanente el tiempo actual de reproduccion y el tiempo total
            _changeTimerFeedback,
            // Metodo privado que gestiona  la carga de los diferentes valores del reproductor
            _loadValues,
            // Listado de Ids de Md Variable del reproductor
            _mdVariableIdList,
            // Valores cargados al reproductor
            //_loadedData,
            _timeStampArray,
            // Metodo privado que realiza la interaccion entre reproducir/pausar el evento
            _togglePlayPause,
            // Metodo privado que gestiona la reproduccion del evento
            _play,
            // Metodo privado que gestiona la pausa durante la reproduccion del evento
            _pause,
            // Metodo privado que actualiza el progreso de carga del evento
            _updateProgressBar,
            // Metodo privado que realiza la re-sincronizacion con el reproductor
            _refresh;

        _currentPosition = 0;
        _duration = 0;
        _progressPercentage = 0;
        _paused = true;
        _enabled = false;
        _eventMode = new EventTimeMode();
        _this = this;

        this.Create = function (path, timeStampArray, mdVariableIdList, historicTrendId, assetNodeId) {
            var
                parent,
                timeStamp;

            _loadedTime = 0;
            _playerId = Math.floor(Math.random() * 100000);
            _duration = timeStampArray.length;
            _historicTrendId = historicTrendId.toString();
            _mdVariableIdList = clone(mdVariableIdList);
            _timeStampArray = clone(timeStampArray);
            _assetNodeId = assetNodeId;
            // Creamos el DIV contenedor del reproductor de eventos
            _container = document.createElement("div");
            _container.id = "player" + _playerId;
            _container.style.width = "100%";

            _titleBar = document.createElement("div");
            _titleBar.id = "playerTitle" + _playerId;
            _titleBar.className = "text-center";
            $(_titleBar).html("<span>" + path + "</span>");
            $(_container).append(_titleBar);

            _slider = document.createElement("div");
            _slider.id = "slider" + _playerId;
            _slider.style.width = "88%";
            _slider.style.display = "inline-block";
            _slider.style.marginLeft = "1.5%";

            _progressBar = document.createElement("div");
            _progressBar.id = "progressBar" + _playerId;
            _progressBar.style.height = "8.5px";
            _progressBar.style.border = "none";
            $(_slider).append(_progressBar);
            $(_container).append(_slider);
            
            _loadIndicator = document.createElement("div");
            _loadIndicator.id = "loadIndicator" + _playerId;
            _loadIndicator.style.width = "10%";
            _loadIndicator.style.border = "none";
            _loadIndicator.style.display = "inline-block";
            _loadIndicator.style.height = "17px";
            _loadIndicator.className = "text-center";
            $(_loadIndicator).append("<i class=\"fa fa-spinner fa-pulse fa-2x\" style=\"display:inline-block;\"></i>");
            $(_loadIndicator).children().eq(0).show();
            $(_container).append(_loadIndicator);

            $(_slider).slider({
                value: 0,
                step: 1,
                range: "min",
                min: 0,
                max: _duration,
                slide: function (ev, ui) {
                    if (ui.value >= _loadedTime) {
                        return false;
                    }
                    _currentPosition = ui.value;
                    timeStamp = new Date(_timeStampArray[_currentPosition]).getTime();
                        PublisherSubscriber.publish("/player/refresh", timeStamp);
                        _changeTimerFeedback();
                },
                change: function (ev, ui) {
                    if (ui.value >= _loadedTime) {
                        return false;
                    }
                    _currentPosition = ui.value;
                    timeStamp = new Date(_timeStampArray[_currentPosition]).getTime();
                        PublisherSubscriber.publish("/player/refresh", timeStamp);
                        _changeTimerFeedback();
                }
            });
            $(_progressBar).progressbar({
                value: 0,
                step: 1
            });

            // Boton Play/Pause
            _playPauseBtn = document.createElement("button");
            _playPauseBtn.id = "playPauseBtn" + _playerId;
            _playPauseBtn.title = "Play";
            $(_playPauseBtn).append("<i class=\"fa fa-play\" aria-hidden=\"true\"></i>");
            $(_container).append(_playPauseBtn);
            $(_playPauseBtn).click(function () {
                if (_enabled) {
                    _togglePlayPause();
                }
            });

            // Boton Atras
            _stepBackwardBtn = document.createElement("button");
            _stepBackwardBtn.id = "stepBackwardBtn" + _playerId;
            _stepBackwardBtn.title = "Atrás";
            $(_stepBackwardBtn).append("<i class=\"fa fa-step-backward\" aria-hidden=\"true\"></i>");
            $(_container).append(_stepBackwardBtn);
            $(_stepBackwardBtn).click(function () {
                if (_enabled) {
                    _currentPosition -= 1;
                    _changeTimerFeedback();
                    $(_slider).slider("value", _currentPosition);
                }
            });

            // Boton Inicio
            _backwardBtn = document.createElement("button");
            _backwardBtn.id = "backwardBtn" + _playerId;
            _backwardBtn.title = "Inicio";
            $(_backwardBtn).append("<i class=\"fa fa-backward\" aria-hidden=\"true\"></i>");
            $(_container).append(_backwardBtn);
            $(_backwardBtn).click(function () {
                if (_enabled) {
                    _currentPosition = 0;
                    _changeTimerFeedback();
                    $(_slider).slider("value", _currentPosition);
                }
            });
            
            // Boton Fin
            _forwardBtn = document.createElement("button");
            _forwardBtn.id = "forwardBtn" + _playerId;
            _forwardBtn.title = "Fin";
            $(_forwardBtn).append("<i class=\"fa fa-forward\" aria-hidden=\"true\"></i>");
            $(_container).append(_forwardBtn);
            $(_forwardBtn).click(function () {
                if (_enabled) {
                    _currentPosition = _loadedTime - 1;
                    _changeTimerFeedback();
                    $(_slider).slider("value", _currentPosition);
                }
            });

            // Boton Siguiente
            _stepForwardBtn = document.createElement("button");
            _stepForwardBtn.id = "stepForwardBtn" + _playerId;
            _stepForwardBtn.title = "Siguiente";
            $(_stepForwardBtn).append("<i class=\"fa fa-step-forward\" aria-hidden=\"true\"></i>");
            $(_container).append(_stepForwardBtn);
            $(_stepForwardBtn).click(function () {
                if (_enabled) {
                    if (_currentPosition === _loadedTime - 1) {
                        return false;
                    }
                    _currentPosition += 1;
                    _changeTimerFeedback();
                    $(_slider).slider("value", _currentPosition);
                }
            });

            // Boton Refresh
            _refreshBtn = document.createElement("button");
            _refreshBtn.id = "refreshBtn" + _playerId;
            _refreshBtn.title = "Recargar";
            $(_refreshBtn).append("<i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>");
            $(_container).append(_refreshBtn);
            $(_refreshBtn).click(function () {
                _refresh();
            });


            // Indicador del tiempo transcurrido del total
            _timerFeedback = document.createElement("div");
            _timerFeedback.id = "timerFeedback" + _playerId;
            _timerFeedback.style.display = "inline";
            _timerFeedback.style.cssFloat = "right";
            _timerFeedback.style.marginTop = "4px";
            _timerFeedback.innerHTML = (_timeStampArray.length > 0) ? formatDate(new Date(_timeStampArray[0])) : "";
            $(_container).append(_timerFeedback);

            // Removemos el HTML del reproductor
            _this.Close();

            // Eliminamos la subscripcion (caso exista) de nuevos datos
            if (_newRangeSubscription) {
                _newRangeSubscription.remove();
            }

            // Agregamos todos los elementos del reproductor al contenedor padre
            parent = document.getElementById("jcEventPlayerParent");
            $(parent).html("");
            $(parent).append(_container);
            $("#mainTreeContainer").find("span.e-splitbar:eq(1)").show(); // Muestra el spliter del reproductor
            $("#mainTreeContainer").data("ejSplitter").expand(2);
            if (_timeStampArray.length > 0) {
                _eventMode.GetDynamicHistoricalData(_mdVariableIdList, _assetNodeId, _timeStampArray, _playerId);
                _loadValues(_mdVariableIdList);
            } else {
                $(_loadIndicator).children().eq(0).hide();
                $(_progressBar).progressbar({ value: 100 });
                $(_progressBar).find(".ui-progressbar-value").css({
                    "width": 100 + "%"
                });
            }

            if (_closeTrendSubscription) {
                _closeTrendSubscription.remove();
            }

            _closeTrendSubscription = PublisherSubscriber.subscribe("/historicClose/refresh", [_historicTrendId], function (data) {
                if (data[_historicTrendId]) {
                    $("#mainTreeContainer").find("span.e-splitbar:eq(1)").hide(); // Oculta el spliter del reproductor
                    $("#mainTreeContainer").data("ejSplitter").collapse(2);
                    _this.Close();
                }
            });
        };

        this.Close = function () {
            _eventMode.Stop();
            $("#jcEventPlayerParent").empty();
        };

        _changeButtonType = function (btn, value) {
            btn.title = value.capitalizeFirstLetter();
            btn.children[0].className = "fa fa-" + value;
        };

        _changeTimerFeedback = function () {
            var
                data;

            _timerFeedback.innerHTML = formatDate(new Date(_timeStampArray[_currentPosition]));
            data = [];
            data[_historicTrendId] = new Date(_timeStampArray[_currentPosition]);
            PublisherSubscriber.publish("/player/timeStamp", data);
        };

        _loadValues = function (mdVariableIdList) {
            if (_subscriptionValues) {
                _subscriptionValues.remove();
            }

            _subscriptionValues = PublisherSubscriber.subscribe("/historicValues/refresh", [_playerId], function (data) {
                var
                    // Indice de la posicion de data
                    index, i, j,
                    timeStampRange;

                for (index in data) {
                    if (data.hasOwnProperty(index)) {
                        if (index != _playerId) {
                            return;
                        }
                        timeStampRange = clone(data[index].TimeStampArray);
                    }
                }

                _loadedTime += timeStampRange.length;
                if (_loadedTime === _timeStampArray.length) {
                    _enabled = true;
                }
                _updateProgressBar();
            });
        };

        _togglePlayPause = function () {
            (_paused) ? _play() : _pause();
            _paused = !_paused;
        };

        _play = function () {
            _changeButtonType(_playPauseBtn, "pause");
            _changeTimerFeedback();
            if (_currentPosition === (_duration - 1)) {
                _pause();
                return;
            }
            _timer = setTimeout(function () {
                if (_currentPosition < _loadedTime) {
                    _currentPosition += 1;
                    $(_slider).slider("value", _currentPosition);
                }
                _play();
            }, 1000);
        };

        _pause = function () {
            _changeButtonType(_playPauseBtn, "play");
            clearTimeout(_timer);
        };

        _updateProgressBar = function () {
            _progressPercentage = Math.floor((_loadedTime / _duration) * 100);
            $(_progressBar).progressbar({ value: _progressPercentage });
            $(_progressBar).find(".ui-progressbar-value").css({
                "width": _progressPercentage + "%"
            });
            if (_progressPercentage === 100) {
                $(_loadIndicator).children().eq(0).hide();
            }
        };

        _refresh = function () {
            var
                pub,
                confirmation,
                timeStampArray;

            confirmation = true;
            if (_timeStampArray.length > 0) {
                confirmation = confirm("Está acción borrará la información previamente cargada. ¿Está seguro?");
            }

            if (confirmation) {
                if (_newRangeSubscription) {
                    _newRangeSubscription.remove();
                }

                _pause();
                _currentPosition = 0;
                _loadedTime = 0;
                _loadValues(_mdVariableIdList);
                _eventMode.Stop();
                _updateProgressBar();
                $(_slider).slider("value", _currentPosition);
                _paused = true;
                pub = [];
                pub[_historicTrendId] = true;
                // Suscribo la respuesta
                _newRangeSubscription = PublisherSubscriber.subscribe("/newTrendRange/refresh", [_historicTrendId], function (data) {
                    _timeStampArray = data[_historicTrendId];
                    _duration = _timeStampArray.length;
                    if (_timeStampArray.length > 0) {
                        _eventMode.GetDynamicHistoricalData(_mdVariableIdList, _assetNodeId, _timeStampArray, _playerId);
                        _loadValues(_mdVariableIdList);
                    } else {
                        $(_loadIndicator).children().eq(0).hide();
                        $(_progressBar).progressbar({ value: 100 });
                        $(_progressBar).find(".ui-progressbar-value").css({
                            "width": 100 + "%"
                        });
                    }
                    // Eliminar suscripcion.
                    _newRangeSubscription.remove();
                });
                // Publico que requiero actualizar el rango
                sleep(200).then(() => {
                    PublisherSubscriber.publish("/playerReload/refresh", pub);
                });
            }
        };
    };

    return JcEventPlayer;
})();


