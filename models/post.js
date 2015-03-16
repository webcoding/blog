var mongodb = require('./db'),
    markdown = require('markdown').markdown,
    ObjectID = require('mongodb').ObjectID;

function Post(name, head, title, tags, post) {
  this.name = name;
  this.head = head;
  this.title = title.trim();
  this.tags = tags;
  this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
      date: date,
      year : date.getFullYear(),
      month : date.getFullYear() + "-" + (date.getMonth() + 1),
      day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
      minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
      date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
  }
  //要存入数据库的文档
  var post = {
      name: this.name,
      head: this.head,
      time: time,
      title: this.title,
      tags: this.tags,
      post: this.post,
      comments: [],
      reprint_info: {},
      pv: 0
  };
  //打开数据库
  //*
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //将文档插入 posts 集合
      collection.insert(post, {
        safe: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }
        callback(null);//返回 err 为 null
      });
    });
  });
  //*/
  // async.waterfall([
  //   function (cb) {
  //     mongodb.open(function (err, db) {
  //       cb(err, db);
  //     });
  //   },
  //   function (db, cb) {
  //     db.collection('posts', function (err, collection) {
  //       cb(err, collection);
  //     });
  //   },
  //   function (collection, cb) {
  //     collection.insert(post, {
  //       safe: true
  //     }, function (err, user) {
  //       cb(err, user);
  //     });
  //   }
  // ], function (err, user) {
  //   mongodb.close();
  //   callback(err, null);
  // });
};

//读取文章及其相关信息
Post.getAll = function(name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);//失败！返回 err
        }

        //解析 markdown 为 html
        docs.forEach(function (doc) {
          doc.post = markdown.toHTML(doc.post);
        });

        callback(null, docs);//成功！以数组形式返回查询的结果
      });
    });
  });
};

//由于开发迭代的原因，新增的字段在老数据里没有默认值
Post.dealData = function(name, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }

    //读取 posts 集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {
        "$or":[
          // {"pv":{"$exists":false}},
          // {"tags":{"$exists":false}},
          // {"comments":{"$exists":false}},
          {"reprint_info":{"$exists":false}}
        ]
      };
      if (name) {
        query.name = name;
      }
      //根据 query 对象查询文章
      collection.find(query).sort({
        time: -1
      }).toArray(function (err, docs) {
        if (err) {
          mongodb.close();
          return callback(err);//失败！返回 err
        }

        var updateDocs = [];
        //解析 markdown 为 html
        docs.forEach(function (doc) {
          doc.post = markdown.toHTML(doc.post);

          //TODO:更新默认值到数据库里
          //这里功能其效果了，但是页面会报错，数据库已经被修改达到目的
          collection.update(query, {
            $set: {
              // "pv": doc.pv || 0,
              // "tags": doc.tags || [],
              // "comments": doc.comments || [],
              "reprint_info": doc.reprint_info || {}
            }
          }, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });
        });
        
        updateDocs.push(doc);
        
        callback(null, updateDocs);//成功！以数组形式返回查询的结果
      });

    });
  });
};

//一次获取十篇文章
Post.getByPage = function(name, page, callback) {
  // var query = {};
  // async.waterfall([
  //   function (cb) {
  //     mongodb.open(function (err, db) {
  //       cb(err, db);
  //     });
  //   },
  //   function (db, cb) {
  //     db.collection('posts', function (err, collection) {
  //       cb(err, collection);
  //     });
  //   },
  //   function (collection, cb) {
  //     if (name) {
  //       query.name = name;
  //     }
  //     collection.count(query, {
  //       safe: true
  //     }, function (err, total) {
  //       console.log(total)
  //       cb(err, total ,collection);
  //     });
  //   },
  //   function (total, collection, cb){
  //     //console.log(total)
  //     collection.find(query, {
  //       skip: (page - 1)*5,
  //       limit: 5
  //     }).sort({
  //       time: -1
  //     }).toArray(function (err, docs, total) {
  //       cb(err, docs, total);
  //     });
  //   }
  // ], function (err, docs, total) {
  //   mongodb.close();
  //   docs.forEach(function (doc) {
  //     if(!doc.tags){
  //       doc.tags = [];
  //     }
  //     if(!doc.reprint_info){
  //       doc.reprint_info = {};
  //     }
  //     doc.post = markdown.toHTML(doc.post);
  //   });
  //   callback(err, docs, total);
  // });
  //打开数据库
  
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
        query.name = name;
      }
      //使用 count 返回特定查询的文档数 total
      collection.count(query, function (err, total) {
        //根据 query 对象查询，并跳过前 (page-1)*5 个结果，返回之后的 5 个结果
        collection.find(query, {
          skip: (page - 1)*5,
          limit: 5
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          //解析 markdown 为 html
          docs.forEach(function (doc) {
            if(!doc.tags){
              doc.tags = [];
            }
            if(!doc.reprint_info){
              doc.reprint_info = {};
            }
            doc.post = markdown.toHTML(doc.post);
          });  
          callback(null, docs, total);
        });
      });
    });
  });
  
};

//获取一篇文章
Post.getOne = function(_id, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询，修改为 _id
      var query = {
        "_id": new ObjectID(_id)
      };
      collection.findOne(query, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        //doc.post = markdown.toHTML(doc.post);
        if (doc) {
          //每访问 1 次，pv 值增加 1
          collection.update(query, {
            $inc: {"pv": 1}
          }, function (err) {
            mongodb.close();
            if (err) {
              console.log(err)
              return callback(err);
            }
          });

          //解析 markdown 为 html
          doc.post = markdown.toHTML(doc.post);
          if(!doc.comments){
            doc.comments = [];
          }
          if(!doc.tags){
            doc.tags = [];
          }
          if(!doc.reprint_info){
            doc.reprint_info = {};
          }
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });

        }

        callback(null, doc);//返回查询的一篇文章
      });

      

    });
  });
};

//返回原始发表的内容（markdown 格式）
Post.edit = function(_id, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      var query = {
        "_id": new ObjectID(_id)
      };
      collection.findOne(query, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        if(!doc.tags){
          doc.tags = [];
        }
        callback(null, doc);//返回查询的一篇文章（markdown 格式）
      });
    });
  });
};

//更新一篇文章及其相关信息
Post.update = function(_id, post, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //更新文章内容
      var query = {
        "_id": new ObjectID(_id)
      };
      collection.update(query, {
        $set: {post: post}
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

//返回所有文章存档信息
Post.getArchive = function(callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //返回只包含 name、time、title 属性的文档组成的存档数组
      collection.find({}, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//删除一篇文章
Post.remove = function(_id, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取 posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //查询要删除的文档
      var query = {
        "_id": new ObjectID(_id)
      };
      collection.findOne(query, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        //如果有 reprint_from，即该文章是转载来的，先保存下来 reprint_from
        // var reprint_from = "";
        // if (doc.reprint_info.reprint_from) {
        //   reprint_from = doc.reprint_info.reprint_from;
        // }
        // if (reprint_from != "") {
        //   //更新原文章所在文档的 reprint_to
        //   collection.update({
        //     "name": reprint_from.name,
        //     "time.day": reprint_from.day,
        //     "title": reprint_from.title
        //   }, {
        //     $pull: {
        //       "reprint_info._id": _id}
        //   }, function (err) {
        //     if (err) {
        //       mongodb.close();
        //       return callback(err);
        //     }
        //   });
        // }

        //删除转载来的文章所在的文档
        collection.remove(query, {
          w: 1
        }, function (err) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null);
        });
      });
    });
  });
};


//返回所有标签
Post.getTags = function(callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //distinct 用来找出给定键的所有不同值
      collection.distinct("tags", function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //查询所有 tags 数组内包含 tag 的文档
      //并返回只含有 name、time、title 组成的数组
      collection.find({
        "tags": tag
      }, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, "i");
      collection.find({
        "title": pattern
      }, {
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time: -1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
         return callback(err);
        }
        callback(null, docs);
      });
    });
  });
};


//转载一篇文章
Post.reprint = function(from_id, reprinted, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //找到被转载的文章的原文档
      var query = {
        "_id": new ObjectID(from_id)
      };
      collection.findOne(query, function (err, doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }

        var date = new Date();
        var time = {
            date: date,
            year : date.getFullYear(),
            month : date.getFullYear() + "-" + (date.getMonth() + 1),
            day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        }

        delete doc._id;//注意要删掉原来的 _id

        doc.name = reprinted.name;
        doc.head = reprinted.head;
        doc.time = time;
        doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
        doc.comments = [];
        doc.reprint_info = {"from_id": from_id};
        doc.pv = 0;

        //将转载生成的副本修改后存入数据库，并返回存储后的文档
        collection.insert(doc, {
          safe: true
        }, function (err, post) {
          if (err) {
            mongodb.close();
            return callback(err);
          }

          //更新被转载的原文档的 reprint_info 内的 reprinted
          collection.update(query, {
            $push: {
              "reprint_info.reprinted": post._id
            }
          }, function (err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });

          callback(err, post[0]);
        });


      });
    });
  });
};




