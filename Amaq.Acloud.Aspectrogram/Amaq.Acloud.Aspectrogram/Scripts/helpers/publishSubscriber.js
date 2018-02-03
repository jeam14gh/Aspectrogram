/*
 * AMAQ 2016
 * Publisher/Subscriber
 * @author ACLOUD TEAM
 */

var PublisherSubscriber = {};

PublisherSubscriber = (function () {
    var
        // Objecto que mantiene las diferentes publicaciones de informacion (topicos)
        _topics,
        // Abreviacion para determinar si existe la propiedad "topico" solicitado dentro del array de "topicos"
        _hOP;

    _topics = {};
    _hOP = _topics.hasOwnProperty;

    return {
        subscribe: function (topic, items, listener) {
            // Creamos el objeto del topico solicitado si este aun no existe
            if (!_hOP.call(_topics, topic)) _topics[topic] = [];

            // Agregamos la funcion a la cola de escucha (listener)
            _topics[topic].push({
                items: items,
                listener: listener
            });
            // Indice de suscripcion
            var index = _topics[topic].length - 1;

            // Provee un manejo para poder remover o eliminar la suscripcion
            return {
                remove: function () {
                    //_topics[topic].splice(index, 1);
                    delete _topics[topic][index];
                },
                attachItems: function(items) {
                    _topics[topic][index].items.pushArray(items);
                },
                detachItems: function (items) {
                    if (items.length == 0) return;
                    var
                        // Actual indice de suscripcion
                        current,
                        // Contador
                        i, pos;

                    //current = [];
                    //for (i = 0; i < _topics[topic][index].items.length; i++) {
                    //    current[_topics[topic][index].items[i]] = _topics[topic][index].items[i];
                    //}
                    //for (i = 0; i < items.length; i += 1) {
                    //    if (current.hasOwnProperty.call(current, items[i])) {
                    //        pos = _topics[topic][index].items.findIndex(x => x == items[i]);
                    //        current.splice(pos, 1);
                    //    }
                    //}
                    for (i = 0; i < items.length; i += 1) {
                        pos = _topics[topic][index].items.findIndex(x => x == items[i]);
                        if (pos >= 0) {
                            _topics[topic][index].items.splice(pos, 1);
                        }
                    }
                }
            };
        },
        publish: function (topic, info) {
            // Caso no exista el "topico" o no existan funciones a la escucha (listener), no hacer nada
            if (!_hOP.call(_topics, topic)) return;

            var
                // Datos a enviar a los suscriptores
                data2Send,
                // Item actual de la iteracion
                item,
                // Contadores
                i, j;

            data2Send = {};
            // Loop a traves del cual se envia la informacion a las funciones a la escucha
            for (i = 0; i < _topics[topic].length; i += 1) {
                if (!_topics[topic][i]) {
                    continue;
                }
                if (_topics[topic][i].items) {
                    for (j = 0; j < _topics[topic][i].items.length; j += 1) {
                        item = _topics[topic][i].items[j];
                        if (!info.hasOwnProperty.call(info, item)) {
                            data2Send = {};
                            break;
                        }
                        data2Send[item] = info[item];
                    }

                    if (Object.keys(data2Send).length !== 0) {
                        _topics[topic][i].listener(data2Send);
                    }
                }
                else { // Para canales PublisherSubscriber que no requieren información, como el applyfilter
                    _topics[topic][i].listener(info);
                }
            }
        }
    };
})();
