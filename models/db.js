var settings = require('../settings'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Connection = mongodb.Connection,
    Server = mongodb.Server;

//var connectMongo = "mongodb://" + settings.host + settings.port + mongodb.Db;


module.exports = new Db(settings.db, new Server(settings.host, settings.port), {safe: true});

