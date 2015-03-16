var settings = require('../settings'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Connection = mongodb.Connection,
    Server = mongodb.Server;

//var connectMongo = "mongodb://" + settings.host + settings.port + mongodb.Db;

//   var mongoose = require('mongoose');
//   var serverUrl = 'mongodb://'+settings.host+':'+settings.port+'/'+settings.db;
//   mongoose.connect(serverUrl);

// module.exports = mongoose;

module.exports = new Db(settings.db, new Server(settings.host, settings.port), {safe: true});

// module.exports = function() {
//   return new Db(settings.db, new Server(settings.host, settings.port), {safe: true, poolSize: 1});
// }