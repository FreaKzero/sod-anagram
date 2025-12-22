import http from 'http'
import fs from 'fs'
import path from 'path'
import url from 'url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, 'pages')
const PORT = 3000

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url)
  let pathname = path.join(ROOT, parsedUrl.pathname)

  if (fs.existsSync(pathname) && fs.statSync(pathname).isDirectory()) {
    pathname = path.join(pathname, 'index.html')
  }

  fs.readFile(pathname, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('404 Not Found')
      return
    }

    const ext = path.extname(pathname)
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
    })
    res.end(data)
  })
}).listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`)
})
