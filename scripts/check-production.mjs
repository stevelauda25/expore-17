import fs from 'node:fs'
import { createServer } from 'node:http'
import { resolve, extname } from 'node:path'
import { productionSmoke } from './production-smoke.mjs'
const bundles = fs.readdirSync('dist/assets').filter(file => file.endsWith('.js')).map(file => fs.readFileSync(`dist/assets/${file}`, 'utf8')).join('\n')
for (const identifier of ['__phase2Test', 'explainFailures', 'fixture-saving', 'Explain presentation fixture', 'Phase 1 presentation fixtures', 'localhost:', '127.0.0.1:']) {
  if (bundles.includes(identifier)) throw new Error(`Development-only identifier leaked into production: ${identifier}`)
}
console.log('All production chunks exclude test adapters, fixtures and localhost URLs.')
const root = resolve('dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' }
const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  let path = resolve(root, `.${pathname}`)
  if (!path.startsWith(`${root}/`) || !fs.existsSync(path) || !fs.statSync(path).isFile()) path = `${root}/index.html`
  response.setHeader('Content-Type', types[extname(path)] ?? 'application/octet-stream')
  response.end(fs.readFileSync(path))
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
try { await productionSmoke(`http://127.0.0.1:${server.address().port}`, { local: true }) }
finally { await new Promise(resolve => server.close(resolve)) }
