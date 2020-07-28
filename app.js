const http = require('http')
var url = require('url')
const fs = require('fs')
const path = require('path')
const types = require('./mine.js').types
const config = require('./config').Expires
const PORT = 8080

const server = http.createServer((req, res) => {
  const pathName = url.parse(req.url).pathname
  const realPath = `assets${pathName}`
  const ext = path.extname(pathName).slice(1) || 'unknow'
  const contentType = types[ext] || 'text/plain'

  if (ext.match(config.fileMatch)) {
    let expires = new Date()
    expires.setTime(expires.getTime() + config.maxAge * 1000)
    res.setHeader('Expires', expires.toUTCString())
    res.setHeader('Cache-Control', `max-age=${config.maxAge}`)
  }
  // 读取文件信息
  fs.stat(realPath, (err, stats) => {
    let lastModified
    if (stats) {
      lastModified = stats.mtime.toUTCString()
      res.setHeader('Last-Modified', lastModified)
    }
    if (req.headers['if-modified-since'] && req.headers['if-modified-since'] === lastModified) {
      res.writeHead(304, 'Not Modified')
      res.end()
    } else {
      fs.readFile(realPath, 'binary', (err, file) => {
        if (err) {
          // 文件不存在
          if (err.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
          }
          res.end()
        } else {
          res.writeHead(200, contentType)
          res.write(file, 'binary')
          res.end()
        }
      })
    }
  })
})

server.listen(PORT, () => {
  console.log('Server runing at port : ' + PORT)
})
