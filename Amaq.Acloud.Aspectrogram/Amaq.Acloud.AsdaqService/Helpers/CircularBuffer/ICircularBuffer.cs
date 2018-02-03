namespace Amaq.Acloud.AsdaqService.Helpers.CircularBuffer
{
    /// <summary>
    /// Representa un búfer circular con herramientas y propiedades básicas para su administración
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public interface ICircularBuffer<T>
    {
        /// <summary>
        /// Cabeza del buffer circular. Puntero actual de escritura
        /// </summary>
        int Head { get; }
        /// <summary>
        /// Cola del buffer circular. Puntero del primer elemento
        /// </summary>
        int Tail { get; }
        /// <summary>
        /// Cantidad de elementos agregados al búfer
        /// </summary>
        int Count { get; }
        /// <summary>
        /// Capacidad total del búfer
        /// </summary>
        int Capacity { get; set; }
        /// <summary>
        /// Agrega un elemento al búfer
        /// </summary>
        /// <param name="item"></param>
        /// <returns></returns>
        T Enqueue(T item);
        /// <summary>
        /// Elimina el primer elemento agregado al búfer
        /// </summary>
        /// <returns></returns>
        T Dequeue();
        /// <summary>
        /// Limpia el búfer
        /// </summary>
        void Clear();
        /// <summary>
        /// Enumera los elementos del búfer
        /// </summary>
        /// <param name="index"></param>
        /// <returns></returns>
        T this[int index] { get; set; }
        /// <summary>
        /// Obtiene el indice del elemento especificado
        /// </summary>
        /// <param name="item"></param>
        /// <returns></returns>
        int IndexOf(T item);
        /// <summary>
        /// Inserta un elemento en una posición especifica
        /// </summary>
        /// <param name="index"></param>
        /// <param name="item"></param>
        void Insert(int index, T item);
        /// <summary>
        /// Elemento el elemento con el indice especificado
        /// </summary>
        /// <param name="index"></param>
        void RemoveAt(int index);
    }
}
