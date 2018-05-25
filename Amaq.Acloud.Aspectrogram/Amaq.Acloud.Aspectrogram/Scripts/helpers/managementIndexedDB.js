/*
 * AMAQ 2018
 * Administracion de la base de datos local
 * @author ACLOUD TEAM
 */

// keyRange = [objRecord.SubVariableId, objRecord.TimeStamp];
// Adicionalmente openCursor tiene el parametro direccion: "next", "nextunique", "prev", "prevunique"
var ManagementIndexedDB,
    indexedDB;

indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
ManagementIndexedDB = (function () {
    "use strict";

    /*
     * Constructor.
     */
    ManagementIndexedDB = function (dbName, assetNodeIdList, fnSuccess) {
        var
            DB_VERSION,
            COMBINED_INDEX,
            TIMESTAMP_INDEX,
            _openDB,
            _dbConnection,
            _onError,
            _displayMessage,
            _createItem,
            _readItem,
            _updateItem,
            _deleteItem,
            _getAll,
            _count,
            _getStored,
            _putMany;

        _dbConnection = null;
        DB_VERSION = 1;
        COMBINED_INDEX = "subVariableId_timeStamp_1";
        TIMESTAMP_INDEX = "timeStamp_1";

        /*
         * Funcion que se auto-ejecuta que emula el constructor de la clase
         */
        _openDB = (function () {
            var
                dbRequest;

            if (!indexedDB) {
                // En caso de que el navegador no soporte IndexedDB es necesario reportar el error
                _onError({ name: "Your browser does not support IndexedDB." });
                return;
            }

            // Solicitamos que se abra la base de datos
            // (indexedDB es un objeto de IDBFactory, por lo cual, se creara en caso de no existir)
            dbRequest = window.indexedDB.open(dbName, DB_VERSION);
            dbRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };

            // Si se activa el evento onupgradeneeded, esta funcion se llama una vez que se complete dicho evento
            dbRequest.onsuccess = function (evt) {
                // Almacena una referencia a la conexion con la base de datos (objeto IDBDatabase)
                _dbConnection = evt.target.result;
                fnSuccess();
            };

            dbRequest.onupgradeneeded = function (evt) {
                var
                    db, i,
                    osNumeric,
                    osStream;

                db = evt.target.result;
                for (i = 0; i < assetNodeIdList.length; i += 1) {
                    // Crear los almacenes de objetos
                    osNumeric = db.createObjectStore(assetNodeIdList[i] + "numeric", { keyPath: ["subVariableId", "timeStamp"] });
                    osStream = db.createObjectStore(assetNodeIdList[i] + "stream", { keyPath: ["subVariableId", "timeStamp"] });
                    // Crear indices para el almacen osNumeric
                    osNumeric.createIndex(COMBINED_INDEX, ["subVariableId", "timeStamp"], { unique: true });
                    osNumeric.createIndex(TIMESTAMP_INDEX, "timeStamp", { unique: false });
                    // Crear indices para el almacen osStream
                    osStream.createIndex(COMBINED_INDEX, ["subVariableId", "timeStamp"], { unique: true });
                    osStream.createIndex(TIMESTAMP_INDEX, "timeStamp", { unique: false });
                }
            };
        })();

        _onError = function (objError) {
            _displayMessage(objError.message, true, objError.name);
        };

        _displayMessage = function (message, isError, name) {
            if (isError && message !== null && name !== null) {
                if (name !== "ConstraintError") {
                    console.error(name + ": " + message);
                }
            }
        };

        _createItem = function (newRecord, objStoreName, fnSuccess) {
            var
                transaction,
                objectStore,
                osRequest;

            // Inicia una transaccion de lectura/escritura para agregar los datos
            transaction = _dbConnection.transaction([objStoreName], "readwrite");
            // Abre el almacen de objetos de la transaccion
            objectStore = transaction.objectStore(objStoreName);
            // Agrega el objeto newRecord al almacen de objetos
            osRequest = objectStore.add(newRecord);
            // Informa sobre un error al tratar de agregar el nuevo elemento en la base de datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            osRequest.onsuccess = function (evt) {
                // Respuesta de la base de datos
                if (fnSuccess) {
                    fnSuccess(evt.target.result);
                }
            };
        };

        _readItem = function (objStoreName, keyRange, multiKey, fnSuccess) {
            var
                resolved,
                data,
                indexLength,
                transaction,
                index, i,
                currentKey,
                osRequest;

            data = [];
            resolved = 0;
            indexLength = (!multiKey) ? 1 : keyRange.length;

            function complete() {
                resolved += 1;
                if (resolved === indexLength) {
                    // Respuesta de la base de datos
                    if (fnSuccess) {
                        fnSuccess(data);
                    }
                }
            }

            // Inicia una transaccion de lectura para leer los datos
            transaction = _dbConnection.transaction([objStoreName], "readonly");
            // Obtiene el indice del almacen de objetos
            index = transaction.objectStore(objStoreName).index(COMBINED_INDEX);
            for (i = 0; i < indexLength; i += 1) {
                currentKey = (!multiKey) ? clone(keyRange) : clone(keyRange[i]);
                // Abre un cursor para el KeyRange especifico
                osRequest = index.openCursor(IDBKeyRange.only(currentKey));
                // Informa sobre un error al tratar de encontrar los datos
                osRequest.onerror = function (evt) {
                    _onError(evt.target.error);
                };
                // Procesa los datos que coinciden con el KeyRange especifico
                osRequest.onsuccess = function (evt) {
                    var
                        cursor;

                    cursor = evt.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        cursor.continue();
                    } else {
                        complete();
                    }
                };
            }
        };

        _updateItem = function (objToUpdate, objStoreName, keyRange) {
            var
                transaction,
                index,
                osRequest;

            // Inicia una transaccion de lectura para actualizar los datos
            transaction = _dbConnection.transaction([objStoreName], "readonly");
            // Obtiene el indice del almacen de objetos
            index = transaction.objectStore(objStoreName).index(COMBINED_INDEX);
            // Abre un cursor para el KeyRange especifico
            osRequest = index.openCursor(IDBKeyRange.only(keyRange));
            // Informa sobre un error al tratar de actualizar los datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            // Procesa los datos que coinciden con el KeyRange especifico
            osRequest.onsuccess = function (evt) {
                var
                    cursor;

                cursor = evt.target.result;
                if (cursor) {
                    // REALIZAR EL UPDATE
                    //cursor.update(objToUpdate);
                    cursor.continue();
                }
            };
        };

        _deleteItem = function (objStoreName, keyRange) {
            var
                transaction,
                index,
                osRequest;

            // Inicia una transaccion de lectura/escritura para borrar los datos
            transaction = _dbConnection.transaction([objStoreName], "readwrite");
            // Obtiene el indice del almacen de objetos
            index = transaction.objectStore(objStoreName).index(COMBINED_INDEX);
            // Abre el almacen de objetos de la transaccion
            osRequest = index.openCursor(IDBKeyRange.only(keyRange));
            // Informa sobre un error al tratar de eliminar los datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            // Procesa los datos que coinciden con el KeyRange especifico
            osRequest.onsuccess = function (evt) {
                var
                    cursor;

                cursor = evt.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
        };

        _getAll = function (objStoreName, fnSuccess) {
            var
                transaction,
                objectStore,
                osRequest;

            // Inicia una transaccion de lectura para obtener la lista completa de datos
            transaction = _dbConnection.transaction([objStoreName], "readonly");
            // Abre el almacen de objetos de la transaccion
            objectStore = transaction.objectStore(objStoreName);
            // Lista los diferentes objetos del almacen de objetos
            osRequest = objectStore.getAll();
            // Informa sobre un error al tratar de listar los datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            // Procesa la lista de los datos
            osRequest.onsuccess = function (evt) {
                // Respuesta de la base de datos
                if (fnSuccess) {
                    fnSuccess(evt.target.result);
                }
            };
        };

        _count = function (objStoreName, keyRange, fnSuccess) {
            var
                transaction,
                objectStore,
                osRequest;

            // Inicia una transaccion de lectura para obtener la lista completa de datos
            transaction = _dbConnection.transaction([objStoreName], "readonly");
            // Abre el almacen de objetos de la transaccion
            objectStore = transaction.objectStore(objStoreName);
            // Realiza la operacion de 'contar' la cantidad de objetos del almacen de objetos
            osRequest = (keyRange) ? objectStore.count() : objectStore.count(keyRange);
            // Informa sobre un error al tratar de listar los datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            // Procesa la lista de los datos
            osRequest.onsuccess = function (evt) {
                // Respuesta de la base de datos
                if (fnSuccess) {
                    fnSuccess(evt.target.result);
                }
            };
        };

        _getStored = function (objStoreName, subVariableIdList, timeStampList, fnSuccess) {
            var
                transaction,
                index,
                lower,
                upper,
                keyRange,
                osRequest,
                data;

            data = [];
            // Inicia una transaccion de lectura para obtener la lista completa de datos
            transaction = _dbConnection.transaction([objStoreName], "readonly");
            // Obtiene el indice del almacen de objetos
            index = transaction.objectStore(objStoreName).index(TIMESTAMP_INDEX);
            lower = new Date(timeStampList[0]).getTime();
            upper = new Date(timeStampList[timeStampList.length - 1]).getTime();
            keyRange = IDBKeyRange.bound(lower, upper);
            // Abre un cursor para el KeyRange especifico
            osRequest = index.get(keyRange);
            // Informa sobre un error al tratar de listar los datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            // Procesa la lista de los datos
            index.openCursor().onsuccess = function (evt) {
                var
                    resp,
                    cursor,
                    group,
                    i, j;

                resp = [];
                cursor = evt.target.result;
                if (cursor) {
                    if (lower <= cursor.value.timeStamp && upper >= cursor.value.timeStamp) {
                        data.push({ subVariableId: cursor.value.subVariableId, timeStamp: cursor.value.timeStamp });
                    }
                    cursor.continue();
                } else {
                    group = ej.DataManager(data).executeLocal(new ej.Query().group("timeStamp"));
                    for (i = 0; i < group.length; i += 1) {
                        // Solo se asume que la informacion esta completa cuando todas las subvariables existen
                        if (group[i].items.length === subVariableIdList.length) {
                            resp.push(group[i].key);
                        }
                    }
                    // Respuesta de la base de datos
                    if (fnSuccess) {
                        fnSuccess(resp);
                    }
                }
            };
        };

        _putMany = function (objStoreName, recordList, fnSuccess) {
            var
                transaction,
                objectStore,
                items, i,
                osRequest;

            // Inicia una transaccion de lectura/escritura para agregar los datos
            transaction = _dbConnection.transaction([objStoreName], "readwrite");
            // Abre el almacen de objetos de la transaccion
            objectStore = transaction.objectStore(objStoreName);
            items = recordList.length;
            i = 0;
            putNext();

            function putNext() {
                if (i < items) {
                    // Agrega el objeto al almacen de objetos
                    osRequest = objectStore.put(recordList[i]).onsuccess = putNext;
                    i += 1;
                } else {
                    if (fnSuccess) {
                        fnSuccess(items);
                    }
                }
            };
            
            // Informa sobre un error al tratar de agregar el nuevo elemento en la base de datos
            osRequest.onerror = function (evt) {
                _onError(evt.target.error);
            };
            osRequest.onsuccess = function (evt) {
                // Respuesta de la base de datos
                if (fnSuccess) {
                    fnSuccess(evt.target.result);
                }
            };
        };

        this.AddNumericItem = function (newRecord, assetNodeId, fnSuccess) {
            _createItem(newRecord, assetNodeId + "numeric", fnSuccess);
        };

        this.AddNumericItemList = function (recordList, assetNodeId, fnSuccess) {
            _putMany(assetNodeId + "numeric", recordList, fnSuccess);
        };

        this.AddStreamItem = function (newRecord, assetNodeId, fnSuccess) {
            _createItem(newRecord, assetNodeId + "stream", fnSuccess);
        };

        this.AddStreamItemList = function (recordList, assetNodeId, fnSuccess) {
            _putMany(assetNodeId + "stream", recordList, fnSuccess);
        };

        this.GetAllNumerics = function (assetNodeId, fnSuccess) {
            _getAll(assetNodeId + "numeric", fnSuccess);
        };

        this.GetAllStreams = function (assetNodeId, fnSuccess) {
            _getAll(assetNodeId + "stream", fnSuccess);
        };

        this.GetNumericBySubVariableIdAndTimeStamp = function (subVariableId, timeStamp, assetNodeId, fnSuccess) {
            _readItem(assetNodeId + "numeric", [subVariableId, timeStamp], false, fnSuccess);
        };

        this.GetNumericBySubVariableIdAndTimeStampList = function (subVariableIdList, timeStampList, assetNodeId, fnSuccess) {
            var
                keyRange,
                i, j;

            keyRange = [];
            for (i = 0; i < subVariableIdList.length; i += 1) {
                for (j = 0; j < timeStampList.length; j += 1) {
                    keyRange.push([subVariableIdList[i], timeStampList[j]]);
                }
            }
            _readItem(assetNodeId + "numeric", keyRange, true, fnSuccess);
        };

        this.GetStreamBySubVariableIdAndTimeStamp = function (subVariableId, timeStamp, assetNodeId, fnSuccess) {
            _readItem(assetNodeId + "stream", [subVariableId, timeStamp], false, fnSuccess);
        };

        this.GetStreamBySubVariableIdAndTimeStampList = function (subVariableIdList, timeStampList, assetNodeId, fnSuccess) {
            var
                keyRange,
                i, j;

            keyRange = [];
            for (i = 0; i < subVariableIdList.length; i += 1) {
                for (j = 0; j < timeStampList.length; j += 1) {
                    keyRange.push([subVariableIdList[i], timeStampList[j]]);
                }
            }
            _readItem(assetNodeId + "stream", keyRange, true, fnSuccess);
        };

        this.RemoveNumericItem = function (subVariableId, timeStamp, asseId) {
            _deleteItem(assetNodeId + "numeric", [subVariableId, timeStamp]);
        };

        this.RemoveStreamItem = function (subVariableId, timeStamp, assetNodeId) {
            _deleteItem(assetNodeId + "stream", [subVariableId, timeStamp]);
        };

        this.CountAllNumerics = function (assetNodeId, fnSuccess) {
            _count(assetNodeId + "numeric", undefined, fnSuccess);
        };

        this.CountAllStreams = function (fnSuccess, assetNodeId) {
            _count(assetNodeId + "stream", undefined, fnSuccess);
        };

        this.GetStoredNumerics = function (subVariableIdList, timeStampList, assetNodeId, fnSuccess) {
            _getStored(assetNodeId + "numeric", subVariableIdList, timeStampList, fnSuccess);
        };

        this.GetStoredStreams = function (subVariableIdList, timeStampList, assetNodeId, fnSuccess) {
            _getStored(assetNodeId + "stream", subVariableIdList, timeStampList, fnSuccess);
        };

        this.DropDatabase = function () {
            var
                DBDeleteRequest;

            if (_dbConnection !== undefined && _dbConnection !== null) {
                // Cerramos la conexion
                _dbConnection.close();
                // Solicitamos eliminar la base de datos
                // (indexedDB es un objeto de IDBFactory, por lo cual, se creara en caso de no existir)
                DBDeleteRequest = window.indexedDB.deleteDatabase(dbName);
                DBDeleteRequest.onerror = function (evt) {
                    _onError(evt.target.error);
                };
                DBDeleteRequest.onblocked = function () {
                    _onError({ name: "Blocked DB", message: "Couldn't delete database due to the operation being blocked" });
                };
                // Si se activa el evento onupgradeneeded, esta funcion se llama una vez que se complete dicho evento
                DBDeleteRequest.onsuccess = function (evt) {
                    fnSuccess();
                };
            }
        };
    };

    return ManagementIndexedDB;
})();