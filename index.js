'use strict'

var connect = require('connect')
var path = require('path')
var serveStatic = require('serve-static')
var serveStaticFile = require('connect-static-file')
var compression = require('compression')
var app = connect()
var httpProxy = require('http-proxy-middleware')

const PORT = 9000
const DIRECTORY = 'public'
const FILE = 'index.html'

exports.start = function (options, _onStarted) {
  options = options || {}

  let port = options.port || process.env.PORT || PORT
  let directory = options.directory || DIRECTORY
  let directories = options.directories || [directory]
  let file = options.file || FILE
  let proxy = options.proxy
  let onStarted = _onStarted || function () {}

  app.use(compression())

  // First, check the file system
  directories.forEach(function(directory) {
    app.use(serveStatic(directory, { extensions: ['html'] }))
  })

  // Then, serve the fallback file
  app.use(serveStaticFile(path.join(directory, file)))

  if (proxy && typeof proxy === 'string') {
    var mayProxy = /^(?!\/(index\.html$)).*$/
    app.use(mayProxy,
      // Pass the scope regex both to Express and to the middleware for proxying
      // of both HTTP and WebSockets to work without false positives.
      httpProxy(pathname => mayProxy.test(pathname), {
        target: proxy,
        logLevel: 'debug',
        onError: function (proxy) { console.log(proxy) },
        secure: false,
        changeOrigin: true
      })
    )
  }

  return app.listen(port, function (err) {
    onStarted(err, port)
  })
}
