var send = require('send-data')
var PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-upsert'))

var db = PouchDB('documents')

var remoteDb = process.env.COUCHDB || 'http://localhost:5984/bold'
var mime = require('mime-types')

PouchDB.sync(db, remoteDb, {
  live: true,
  retry: true
})

db.putIfNotExists('_design/web', {
    language: 'javascript',
    views: {
      urls: {
        map: function (doc) {
          var url = '/' + doc.profile.nickname
          if (doc.type === 'document') {
            if (doc.parent) {
              url +=  '/' + doc.parent
            }
            url += '/' + doc.name
          }
          emit(url, doc.body)
        }.toString()
      }
    }
  }, function (err, result) {
  if (err) return console.log(err)
  console.log(result)
})

var http = require('http')

var server = http.createServer((req, res) => {
  db.query('web/urls',{ key: req.url }).then((result) => {
    //console.log(result)
    if (result.rows && result.rows[0]) {
      var doc = result.rows[0]
      send(req, res, {
        body: doc.value,
        statusCode: 200,
        headers: {
          'content-type': mime.lookup(doc.key)
        }
      })
    } else {
      send(req, res, {
        statusCode: 404,
        body: 'File Not Found',
        headers: {
          'content-type': 'text/plain'
        }
      })
    }
  })
  .catch((err) => {
    console.log(err)
    send(req, res, {
      statusCode: 404,
      body: 'File Not Found',
      headers: {
        'content-type': 'text/plain'
      }
    })
  })
})

server.listen(process.env.PORT || 3000)
