namespace Amaq.Acloud.Aspectrogram.Models.Data
{
    using Entities.Dtos;
    using Acloud.Data;
    using Acloud.Entities.Core;
    using MongoDB.Bson;
    using MongoDB.Driver;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;

    /// <summary>
    /// 
    /// </summary>
    public class NodeRepository : CoreRepository<Node>
    {
        /// <summary>
        /// Selecciona como Url de conexion la base de datos indicada por parametro.
        /// </summary>
        public NodeRepository(string dbUrl) : base(dbUrl)
        {

        }

        /// <summary>
        /// Elimina varios nodos por medio de una lista de Id
        /// </summary>
        public void DeleteMany(List<string> idList)
        {
            var objectIdList = idList.Select(id => new ObjectId(id as string)).ToList();
            var filter = builder.In("_id", objectIdList);
            collection.DeleteMany(filter);
        }

        /// <summary>
        /// Actualiza los estados de los nodos tipo MdVariable especificados
        /// </summary>
        /// <param name="mdVariableNodeList">Lista de nodos tipo MdVariable con el nuevo estado</param>
        public void UpdateManyMdVariableStatus(List<Node> mdVariableNodeList)
        {
            try
            {
                var locker = new object();
                var models = new WriteModel<Node>[mdVariableNodeList.Count];
                var r = 0;

                Parallel.ForEach(mdVariableNodeList, (mdVariableNode) =>
                {
                    var filter = builder.Eq("_id", new ObjectId(mdVariableNode.Id));

                    var update = Builders<Node>.Update
                        .Set(s => s.Status, mdVariableNode.Status);

                    lock (locker)
                    {
                        models[r] = new UpdateOneModel<Node>(filter, update);
                        r++;
                    }
                });

                collection.BulkWriteAsync(models).GetAwaiter().GetResult();
            }
            catch (System.Exception ex)
            {
                throw ex;
            }
        }

        /// <summary>
        /// Actualiza el nombre y la descripción de un node
        /// </summary>
        public void UpdateNameAndDescription(NodeToUpdateDto nodeDto)
        {
            var filter = builder.Eq(n => n.Id, nodeDto.Id);
            var update = Builders<Node>.Update.Set(n => n.Name, nodeDto.Name).Set(d => d.Description, nodeDto.Description);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Obtiene los nodos hijos usando el parentLevel
        /// </summary>
        /// <param name="parentLevel">Cadena de texto que representa el Level del nodo. Ejemplo: "1.1"</param>
        /// <returns></returns>
        public List<Node> GetChildren(string parentLevel)
        {
            parentLevel = parentLevel + @"\."; // Concatenar el caracter punto "." !IMPORTANTE
                                               // Los hijos son solo aquellos cuyo Level comienza por el parentLevel especificado
            var filter = builder.Regex(n => n.Level, new BsonRegularExpression(string.Format("/^{0}/", parentLevel)));
            return collection.Find(filter).SortBy(n => n.Level).ToList();
        }

        /// <summary>
        /// Retorna todos los nodos con el mismo parentId
        /// </summary>
        public List<Node> GetByParentId(string parentId)
        {
            var filter = builder.Eq(n => n.ParentId, parentId);
            return collection.Find(filter).ToList();
        }

        /// <summary>
        /// Actualiza la propiedad HasChild de un nodo
        /// </summary>
        public void UpdateHasChild(string id, bool hasChild)
        {
            var filter = builder.Eq(n => n.Id, id);
            var update = Builders<Node>.Update.Set(n => n.HasChild, hasChild);
            collection.UpdateOne(filter, update);
        }

        /// <summary>
        /// Actualiza el nombre de un nodo
        /// </summary>
        public void UpdateName(NodeToUpdateDto node)
        {
            var filter = builder.Eq(n => n.Id, node.Id);
            var update = Builders<Node>.Update.Set(n => n.Name, node.Name);
            collection.UpdateOne(filter, update);
        }
    }
}
