namespace Amaq.Acloud.AsdaqService.Helpers
{
    using System.Collections.Generic;

    /// <summary>
    /// Representa un conjunto de métodos de extensión
    /// </summary>
    public static class ExtensionMethods
    {
        public static IEnumerable<T> SliceRow<T>(this T[,] array, int row)
        {
            for (var i = array.GetLowerBound(1); i <= array.GetUpperBound(1); i++)
            {
                yield return array[row, i];
            }
        }
    }
}
