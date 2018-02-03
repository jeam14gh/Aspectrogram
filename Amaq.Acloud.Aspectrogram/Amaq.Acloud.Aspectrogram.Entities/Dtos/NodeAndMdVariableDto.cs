using Amaq.Acloud.Entities.Core;
using Amaq.Acloud.Entities.Enums;
using Amaq.Acloud.Entities.ValueObjects;
using Amaq.Libraries.MongoDbRepository;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Amaq.Acloud.Aspectrogram.Entities.Dtos
{
    /// <summary>
    /// Entidades Node y MdVariable 
    /// </summary>
    public class NodeAndMdVariableDto
    {
        /// <summary>
        /// Entidad MdVariable
        /// </summary>        
        public MdVariableExtension MdVariableDto { get; set; }

        /// <summary>
        /// Entidad Node
        /// </summary>
        public Node NodeDto { get; set; }        
    }
}
