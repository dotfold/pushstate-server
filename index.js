'use strict'

var express = require('express')
var path = require('path')
var serveStatic = require('serve-static')
var serveStaticFile = require('connect-static-file')
var compression = require('compression')
var app = express()
var httpProxy = require('http-proxy-middleware')

const PORT = 9000
const DIRECTORY = 'public'
const FILE = 'index.html'

exports.start = function (options, _onStarted) {
  options = options || {}

  const port = options.port || process.env.PORT || PORT
  const directory = options.directory || DIRECTORY
  const directories = options.directories || [directory]
  const file = options.file || FILE
  const proxy = options.proxy
  const onStarted = _onStarted || function () {}

  const proxyOptions = {
    target: proxy,
    logLevel: 'debug',
    onError: function (proxy) { console.log(proxy) },
    secure: false,
    changeOrigin: true
  }

  app.use(compression())

  // First, check the file system
  directories.forEach(function(directory) {
    app.use(serveStatic(directory, { extensions: ['html'] }))
  })

  // Check if the request matches the proxy string, if used
  if (proxy && typeof proxy === 'string') {
    var mayProxy = /^(?!\/(index\.html$)).*$/
    app.use(mayProxy,
      httpProxy(pathname => mayProxy.test(pathname), proxyOptions)
    )
  }

  // Then, serve the fallback file
  app.use(serveStaticFile(path.join(directory, file)))

  return app.listen(port, function (err) {
    onStarted(err, port)
  })
}
