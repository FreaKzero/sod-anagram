const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const os = require('os');

function openBrowser(url) {
  const platform = os.platform();

  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url]);
  } else if (platform === 'darwin') {
    spawn('open', [url]);
  } else {
    spawn('xdg-open', [url]);
  }
}

const ROOT = path.resolve('./')
const PORT = 3000
const DEBOUNCE_MS = 120

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
}

const clients = new Set()

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0])
  const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '')
  let filePath = path.join(ROOT, safePath)

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403)
    return res.end()
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      return res.end('Not found')
    }

    const ext = path.extname(filePath)
    let body = data

    if (ext === '.html') {
      body = Buffer.from(injectLiveReload(data.toString('utf8')))
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    })

    res.end(body)
  })
})

server.on('upgrade', (req, socket) => {
  if (req.headers.upgrade !== 'websocket') {
    socket.destroy()
    return
  }

  const key = req.headers['sec-websocket-key']
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64')

  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  )

  clients.add(socket)

  const cleanup = () => clients.delete(socket)
  socket.on('close', cleanup)
  socket.on('end', cleanup)
  socket.on('error', cleanup)
})

function broadcastReload() {
  if (clients.size === 0) return

  const msg = Buffer.from('reload')
  const frame = Buffer.concat([
    Buffer.from([0x81, msg.length]),
    msg
  ])

  for (const ws of clients) {
    if (ws.destroyed) {
      clients.delete(ws)
      continue
    }

    try {
      ws.write(frame)
    } catch {
      ws.destroy()
      clients.delete(ws)
    }
  }
}

let debounceTimer = null

function watchDir(dir) {
  fs.watch(dir, () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      broadcastReload()
    }, DEBOUNCE_MS)
  })

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      watchDir(path.join(dir, entry.name))
    }
  }
}

watchDir(ROOT)

function injectLiveReload(html) {
  if (html.includes('__LIVE_RELOAD__')) return html

  const snippet = `
<script id="__LIVE_RELOAD__">
(() => {
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://'
  const ws = new WebSocket(proto + location.host)

  ws.onmessage = e => e.data === 'reload' && location.reload()
  ws.onclose = () => setTimeout(() => location.reload(), 300)
})()
</script>
`

  if (html.includes('</body>')) {
    return html.replace('</body>', snippet + '\n</body>')
  }

  return html + snippet
}

server.listen(PORT, () => {
  console.log(`🚀 Dev server running at http://localhost:${PORT}`);
  openBrowser(`http://localhost:${PORT}`);
})
