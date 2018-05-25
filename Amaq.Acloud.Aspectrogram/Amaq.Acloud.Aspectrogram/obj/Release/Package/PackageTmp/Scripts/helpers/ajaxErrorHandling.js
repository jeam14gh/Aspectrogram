/*
 * ajaxErrorHandling.js
 * Manejador de errores Asynchronous JavaScript And XML (AJAX)
 */

var AjaxErrorHandling = {};

AjaxErrorHandling = (function ()
{
    "use strict";

    AjaxErrorHandling = function () {
        var
            // Auto-referencia a la clase AjaxErrorHandling
            _this;

        _this = this;

        /*
         * Obtiene una cadena de texto que describe el tipo de error.
         * @param {Object} jqXHR Objeto que contiene los datos de la solicitud Ajax
         * @param {String} textStatus Cadena de texto que describe el error ocacionado
         */
        this.GetXHRStatusString = function (jqXHR, textStatus) {
            var
                txt,
                code;

            code = jqXHR.status;
            switch (code) {
                case 0:
                    txt = "No hay conexión: Verificar la red.";
                    break;
                case 200:
                    txt = _this.ResolveTextStatus(textStatus);
                    break;
                case 403:
                    txt = "No está permitido para consultar este recurso.";
                    break;
                case 404:
                    txt = "No se encuentra el recurso solicitado.";
                    break;
                case 500:
                    txt = "Error interno del servidor.";
                    break;
                case 503:
                    txt = "Servicio no disponible.";
                    break;
                default:
                    txt = "Codigo de estado no capturado. Verifique con el administrador del sistema.";
                    break;
            }
            return txt;
        };

        /*
         * Traduce la cadena de texto que describe el tipo de error.
         * @param {String} textStatus Cadena de texto que describe el error ocacionado
         */
        this.ResolveTextStatus = function (textStatus) {
            var
                txt;

            switch (textStatus) {
                case "parsererror":
                    txt = "Falló la interpretación de la respuesta JSON.";
                    break;
                case "timeout":
                    txt = "Tiempo de espera agotado.";
                    break;
                case "abort":
                    txt = "Solicitud Ajax abortada.";
                    break;
                default:
                    txt = textStatus;
                    break;
            }
            return txt;
        };
    };
    return AjaxErrorHandling;
})();