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

var http = require('http')

var server = http.createServer((req, res) => {
  // allow for subdomain.w3foo.com/index.html
  // to equal /[project]/index.html
  
  if (process.env.NODE === 'production') {
    project = req.headers.host.split('.')[0]
    req.url = '/' + project + req.url
  }
  // handle /owner/folder as /owner/folder/index.html
  //if (!~req.url.indexOf('.')) req.url = req.url + '/index.html'
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
