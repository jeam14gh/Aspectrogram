namespace Amaq.Acloud.AsdaqService.Helpers.CircularBuffer
{
    using System.Collections;
    using System.Collections.Generic;

    /// <summary>
    /// Buffer Circular para el manejo de datos Historicos
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public class CircularBuffer<T> : IEnumerable<T>
    {
        int head;
        T[] buffer;

        /// <summary>
        /// Cantidad de valores en la cola del buffer
        /// </summary>
        public int Count { get; set; }

        /// <summary>
        /// Capacidad maxima del buffer
        /// </summary>
        public int Capacity { get; set; }

        /// <summary>
        /// Posicion de la cabeza del buffer
        /// </summary>
        public int Head
        {
            get { return head; }
        }

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="length">Longitud del buffer</param>
        public CircularBuffer(int length)
        {
            buffer = new T[length];
            Count = 0;
            Capacity = length - 1;
            head = Capacity - 1;
        }

        /// <summary>
        /// Metodo de 'encolamiento'
        /// </summary>
        /// <param name="item"></param>
        public void Enqueue(T item)
        {
            head = (head + 1) % Capacity;
            buffer[head] = item;
            if (Count < Capacity)
            {
                Count += 1;
            }
        }

        /// <summary>
        /// Obtener el valor de la cabeza del buffer
        /// </summary>
        /// <returns></returns>
        public T getHead()
        {
            return buffer[head];
        }

        /// <summary>
        /// Obtener el valor del buffer en la posicion especificada
        /// </summary>
        /// <param name="index">Posicion del buffer</param>
        /// <returns></returns>
        public T getAtPosition(int index)
        {
            return buffer[index];
        }

        /// <summary>
        /// Retorna un objeto Enumerador que puede ser
        /// usado para iterar atraves de la colleccion
        /// </summary>
        /// <returns></returns>
        public IEnumerator<T> GetEnumerator()
        {
            if (Count == 0 || Capacity == 0)
            {
                yield break;
            }

            for (var i = 0; i < Count; ++i)
            {
                yield return getAtPosition(i);
            }
        }

        /// <summary>
        /// Personalizacion del metodo GetEnumerator
        /// </summary>
        /// <returns></returns>
        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }


    ///// <inheritdoc />
    //public class CircularBuffer<T> : ICircularBuffer<T>, IEnumerable<T>
    //{
    //    private volatile T[] _buffer;
    //    private int _head;
    //    private int _tail;

    //    /// <inheritdoc />
    //    public CircularBuffer(int capacity)
    //    {
    //        if (capacity < 0)
    //            throw new ArgumentOutOfRangeException("capacity", "must be positive");

    //        _buffer = new T[capacity];
    //        _head = capacity - 1;
    //    }

    //    /// <inheritdoc />
    //    public int Count { get; private set; }

    //    /// <inheritdoc />
    //    public int Head
    //    {
    //        get { return _head; }
    //    }

    //    /// <inheritdoc />
    //    public int Tail
    //    {
    //        get { return _tail; }
    //    }

    //    /// <inheritdoc />
    //    public int Capacity
    //    {
    //        get { return _buffer.Length; }
    //        set
    //        {
    //            if (value < 0)
    //                throw new ArgumentOutOfRangeException("value", "must be positive");

    //            if (value == _buffer.Length)
    //                return;

    //            var buffer = new T[value];
    //            var count = 0;

    //            while (Count > 0 && count < value)
    //                buffer[count++] = Dequeue();

    //            _buffer = buffer;
    //            Count = count;
    //            _head = count - 1;
    //            _tail = 0;
    //        }
    //    }

    //    /// <inheritdoc />
    //    public T Enqueue(T item)
    //    {
    //        _head = (_head + 1) % Capacity;
    //        //var overwritten = _buffer[_head];
    //        _buffer[_head] = item;

    //        if (Count == Capacity)
    //        {
    //            _tail = (_tail + 1) % Capacity;
    //        }
    //        else
    //        {
    //            ++Count;
    //        }

    //        return _buffer[_head];//overwritten;
    //    }

    //    /// <inheritdoc />
    //    public T Dequeue()
    //    {
    //        if (Count == 0)
    //            throw new InvalidOperationException("queue exhausted");

    //        var dequeued = _buffer[_tail];
    //        _buffer[_tail] = default(T);
    //        _tail = (_tail + 1) % Capacity;
    //        --Count;

    //        return dequeued;
    //    }

    //    /// <inheritdoc />
    //    public void Clear()
    //    {
    //        _head = Capacity - 1;
    //        _tail = 0;
    //        Count = 0;
    //    }

    //    /// <inheritdoc />
    //    public T this[int index]
    //    {
    //        get
    //        {
    //            if (index < 0 || index >= Count)
    //                throw new ArgumentOutOfRangeException("index");

    //            return _buffer[(_tail + index) % Capacity];
    //        }
    //        set
    //        {
    //            if (index < 0 || index >= Count)
    //                throw new ArgumentOutOfRangeException("index");

    //            _buffer[(_tail + index) % Capacity] = value;
    //        }
    //    }

    //    /// <inheritdoc />
    //    public int IndexOf(T item)
    //    {
    //        for (var i = 0; i < Count; ++i)
    //            if (Equals(item, this[i]))
    //                return i;

    //        return -1;
    //    }

    //    /// <inheritdoc />
    //    public void Insert(int index, T item)
    //    {
    //        if (index < 0 || index > Count)
    //            throw new ArgumentOutOfRangeException("index");

    //        if (Count == index)
    //            Enqueue(item);
    //        else
    //        {
    //            var last = this[Count - 1];

    //            for (var i = index; i < Count - 2; ++i)
    //                this[i + 1] = this[i];

    //            this[index] = item;
    //            Enqueue(last);
    //        }
    //    }

    //    /// <inheritdoc />
    //    public void RemoveAt(int index)
    //    {
    //        if (index < 0 || index >= Count)
    //            throw new ArgumentOutOfRangeException("index");

    //        for (var i = index; i > 0; --i)
    //            this[i] = this[i - 1];

    //        Dequeue();
    //    }

    //    public IEnumerator<T> GetEnumerator()
    //    {
    //        if (Count == 0 || Capacity == 0)
    //            yield break;

    //        for (var i = 0; i < Count; ++i)
    //            yield return this[i];
    //    }

    //    IEnumerator IEnumerable.GetEnumerator()
    //    {
    //        return GetEnumerator();
    //    }
    //}
}
