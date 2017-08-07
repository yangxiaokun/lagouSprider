/**
 * Created by yangxk on 2017/7/8.
 */
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient
var async = require('async')
var db = undefined
var dbhost = 'localhost'
var dbport = '27017'
var dbName = 'lagou'

var dburl = 'mongodb://' + dbhost + ':' + dbport + '/' + dbName
function DB () {
  MongoClient.connect(dburl, function (err, client) {
    if (err) {
      console.log('connect db failed!' + err)
    } else {
      console.log('Connected correctly to server')
      db = client
      db.on('error', function () {
        console.log('数据库连接出现异常')
      })
      db.on('ha', function () {
        console.log('数据库连接可用性检查')
      })
      db.on('reconnect', function () {
        console.log('数据库重连完成')
      })
    }
  })
}
exports.db = async function () {
  if (db !== undefined) {
    return db
  } else {
    db = await MongoClient.connect(dburl)
    db.on('error', function () {
      console.log('数据库连接出现异常')
    })
    db.on('ha', function () {
      console.log('数据库连接可用性检查')
    })
    db.on('reconnect', function () {
      console.log('数据库重连完成')
    })
    return db
  }
}
