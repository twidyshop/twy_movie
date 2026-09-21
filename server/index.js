// Guardian backend — proxies the lk21.js scraper as JSON endpoints.
// Run: `npm run server` (default http://localhost:8787)
// When a production build exists in ../dist, it also serves the SPA (for Wasmer Edge).

import * as http from 'node:http'
import { URL } from 'node:url'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  home,
  browse,
  getGenres,
  getCountries,
  getYears,
  search,
  detail,
  stream,
} from './lk21.js'

const PORT = process.env.PORT || 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
}

/* Serve built SPA assets from ../dist, falling back to index.html for client routes. */
function serveStatic(req, res) {
  if (!fs.existsSync(DIST_DIR)) return false
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  let file = path.normalize(path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath))
  if (!file.startsWith(DIST_DIR)) { file = path.join(DIST_DIR, 'index.html') }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    const ext = path.extname(file)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
    return true
  }
  // SPA fallback for client-side routes
  const indexFile = path.join(DIST_DIR, 'index.html')
  if (urlPath.startsWith('/api')) return false
  if (fs.existsSync(indexFile)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    fs.createReadStream(indexFile).pipe(res)
    return true
  }
  return false
}

// reuse the same handle async wrapper but let 404 fall through to SPA
async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const p = url.pathname
  const q = url.searchParams
  const page = parseInt(q.get('page')) || 1
  const type = q.get('type') || ''
  const basePath = url.pathname.replace(/^\/api/, '')

  try {
    if (p === '/api/health') return setJson(res, 200, { ok: true })

    if (p === '/api/home') {
      const raw = await home()
      return setJson(res, 200, {
        sections: raw.sections.map((s) => ({
          type: s.type,
          title: s.title,
          seeAll: s.seeAll,
          items: (s.items || []).map((i) => normalizeItem(i)),
        })),
        latest: (raw.latest || []).map((i) => normalizeItem(i)),
      })
    }

    if (p.startsWith('/api/browse')) {
      const path = basePath.replace(/^\/browse/, '') || '/populer'
      const raw = await browse(path, page, type)
      return setJson(res, 200, {
        title: raw.title,
        page: raw.page,
        totalPages: raw.totalPages,
        items: (raw.items || []).map((i) => normalizeItem(i)),
        path,
      })
    }

    if (p === '/api/genres') {
      const list = await getGenres()
      return setJson(res, 200, { items: list, total: list.length })
    }
    if (p === '/api/countries') {
      const list = await getCountries()
      return setJson(res, 200, { items: list, total: list.length })
    }
    if (p === '/api/years') {
      const list = await getYears()
      return setJson(res, 200, { items: list, total: list.length })
    }

    if (p === '/api/search') {
      const query = q.get('q') || ''
      const raw = await search(query, page)
      return setJson(res, 200, {
        query: raw.query,
        page: raw.page,
        totalPages: raw.totalPages || 1,
        items: (raw.items || []).map((i) => normalizeItem(i)),
      })
    }

    if (p === '/api/detail') {
      const target = q.get('url') || ''
      if (!target) return setJson(res, 400, { error: 'url required' })
      const raw = await detail(target)
      return setJson(res, 200, {
        url: target,
        type: raw.type,
        title: raw.title,
        rating: raw.rating,
        votes: raw.votes || raw.votesMeta,
        genres: raw.genres || [],
        country: raw.country || [],
        director: raw.director,
        cast: raw.cast || [],
        release: raw.release,
        updated: raw.updated,
        synopsis: raw.synopsis,
        poster: raw.poster,
        trailer: raw.trailer,
        download: raw.download || '',
        playAwal: raw.playAwal || '',
        playTerbaru: raw.playTerbaru || '',
        players: (raw.players || []),
        seasons: raw.seasons || {},
        totalEpisodes: raw.totalEpisodes || 0,
        latestEpisode: raw.latestEpisode || '',
        related: (raw.related || []).map((i) => normalizeItem(i)),
      })
    }

    if (p === '/api/stream') {
      const target = q.get('url') || ''
      if (!target) return setJson(res, 400, { error: 'url required' })
      const raw = await stream(target)
      const players = await Promise.all((raw.players || []).map(async (pl) => ({
        ...pl,
        url: await resolvePlayerUrl(pl.url),
      })))
      // Hanya tampilkan server yang bisa di-embed & diputar dengan stabil: hydrax.
      // Server lain (p2p/turbovip/cast) diblokir di sisi host masing-masing.
      const only = players.filter((pl) => String(pl.server || '').toLowerCase() === 'hydrax')
      return setJson(res, 200, {
        ...raw,
        players: only.length ? only : players,
      })
    }

    // Reverse proxy for player hosts that block framing from our origin.
    if (p.startsWith('/pp/')) {
      const rest = p.slice(4) // /<host>/<path...>
      const slash = rest.indexOf('/')
      if (slash <= 0) return setJson(res, 400, { error: 'invalid proxy path' })
      const host = rest.slice(0, slash).toLowerCase()
      if (!PROXY_HOSTS.has(host)) return setJson(res, 403, { error: 'host not proxied' })
      const restPath = rest.slice(slash) || '/'
      const qs = url.searchParams.toString()
      return proxyPlayer(host, restPath, qs, res)
    }

    if (serveStatic(req, res)) return
    return setJson(res, 404, { error: 'not found', path: p })
  } catch (err) {
    return setJson(res, 500, { error: err.message, path: p })
  }
}

/* ------------------------------------------------------------------
 * Player proxy (/pp/<host>/<path>): some player hosts (playcdn.de for
 * p2p, gn1r5n.org for cast) refuse embedding from unknown origins via
 * CSP frame-ancestors / X-Frame-Options. We reverse-proxy those pages
 * through our own origin: the backend fetches them with the original
 * embedder's Referer (videonode.de) so the host treats us like the
 * original site, strips frame-blocking headers, and serves the content
 * from our domain. Relative URLs inside the page resolve back to the
 * same /pp/ prefix, keeping everything same-origin for the browser.
 * ------------------------------------------------------------------ */

// Hosts that get reverse-proxied (embedding blocked from our origin).
const PROXY_HOSTS = new Set(['playcdn.de', 'gn1r5n.org', 'www.playcdn.de'])
const EMBED_REFERER = 'https://videonode.de/'

function stripFrameBlocking(headers) {
  const out = {}
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase()
    if (key === 'x-frame-options') continue
    if (key === 'content-security-policy') {
      // Keep everything except frame-ancestors.
      const kept = v.split(';').map((s) => s.trim()).filter((s) => s && !/^frame-ancestors/i.test(s)).join('; ')
      if (kept) out[k] = kept
      continue
    }
    if (key === 'content-security-policy-report-only') {
      const kept = v.split(';').map((s) => s.trim()).filter((s) => s && !/^frame-ancestors/i.test(s)).join('; ')
      if (kept) out[k] = kept
      continue
    }
    out[k] = v
  }
  return out
}

async function proxyPlayer(host, restPath, qs, res) {
  const target = `https://${host}${restPath}${qs ? `?${qs}` : ''}`
  try {
    const up = await fetch(target, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
        'referer': EMBED_REFERER,
      },
    })
    const body = Buffer.from(await up.arrayBuffer())
    const ctype = up.headers.get('content-type') || 'application/octet-stream'
    const headers = stripFrameBlocking(Object.fromEntries(up.headers.entries()))
    headers['access-control-allow-origin'] = '*'
    headers['content-type'] = ctype
    headers['content-length'] = String(body.length)
    res.writeHead(up.status, headers)
    res.end(body)
  } catch (err) {
    setJson(res, 502, { error: err.message })
  }
}

/* ------------------------------------------------------------------
 * Player resolution: videonode.de pages are Cloudflare-challenged and
 * refuse iframe embedding (X-Frame-Options: SAMEORIGIN). Each videonode
 * wrapper (/iframe3/<host>/<id>) fetches its real player from
 * videonode.de/api.php (POST host=&id=) and injects it into an iframe.
 * We call that same API server-side (through the CORS proxy, since our
 * own IP gets the Cloudflare challenge) and return the real, embeddable
 * player URL (abyssplayer / turbovidhls / ...) to the frontend.
 * Results are cached — the returned id is stable for a given video.
 * ------------------------------------------------------------------ */

const PLAYER_CACHE = new Map() // url -> resolved player url
const PLAYER_CACHE_MAX = 300
const CORS_PROXY_BASE = (process.env.CORS_PROXY || 'https://uncors.netlify.app/').replace(/\/$/, '')
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

// A resolved player must never point back at the CORS proxy itself —
// embedding the proxy URL renders "<proxy> refused to connect".
function isProxyUrl(u) {
  try {
    return new URL(u).hostname === new URL(CORS_PROXY_BASE).hostname
  } catch {
    return false
  }
}

async function fetchVideonodeApi(endpoint, body) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'accept': 'application/json, text/plain, */*',
        'user-agent': BROWSER_UA,
        'referer': 'https://videonode.de/',
      },
      body,
    })
    if (!res.ok) return ''
    const data = await res.json().catch(() => null)
    const embed = data && data.embedUrl
    if (typeof embed !== 'string' || !/^https?:\/\//.test(embed)) return ''
    if (isProxyUrl(embed)) return ''
    return embed.replace(/&amp;/g, '&')
  } catch {
    return ''
  }
}

/* videonode.de/iframe3/<host>/<id> -> POST /api.php {host,id} -> {embedUrl}
 * Try the host directly first (some servers can reach it), then fall back to
 * the CORS proxy (which passes Cloudflare's IP challenge). */
async function resolveVideonodeEmbed(url) {
  const m = url.match(/videonode\.de\/iframe\d*\/([^/?#]+)\/([^/?#]+)/i)
  if (!m) return ''
  const [, host, id] = m
  const body = `host=${encodeURIComponent(host)}&id=${encodeURIComponent(id)}`
  const direct = await fetchVideonodeApi('https://videonode.de/api.php', body)
  if (direct) return direct
  return fetchVideonodeApi(`${CORS_PROXY_BASE}/?destination=${encodeURIComponent('https://videonode.de/api.php')}`, body)
}

async function resolvePlayerUrl(url) {
  if (!url || !/^https?:\/\//.test(url)) return url
  if (PLAYER_CACHE.has(url)) return PLAYER_CACHE.get(url)
  let resolved = url

  // Only videonode wrappers need resolving — other hosts embed fine as-is.
  if (/videonode\.de/i.test(url)) {
    try {
      const embed = await resolveVideonodeEmbed(url)
      if (embed) resolved = embed
      else {
        // Fallback: scrape the wrapper HTML for a static iframe src.
        const wrapped = `${CORS_PROXY_BASE}/?destination=${encodeURIComponent(url)}`
        const res = await fetch(wrapped, { headers: { 'user-agent': BROWSER_UA, 'accept': 'text/html' } })
        if (res.ok) {
          const html = await res.text()
          const m = html.match(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/i)
          const inner = m && m[1]
          if (inner && !isProxyUrl(inner)) resolved = inner.replace(/&amp;/g, '&')
        }
      }
    } catch { /* keep original url */ }
  }

  // Hosts that block framing from unknown origins get reverse-proxied
  // through /pp/ so the player page loads from our own origin.
  if (/^https?:\/\//.test(resolved)) {
    try {
      const u = new URL(resolved)
      if (PROXY_HOSTS.has(u.hostname)) {
        resolved = `/pp/${u.hostname}${u.pathname}${u.search}`
      }
    } catch {}
  }

  // Never cache/hand back a proxy URL as the player source.
  if (isProxyUrl(resolved)) resolved = url

  if (PLAYER_CACHE.size >= PLAYER_CACHE_MAX) {
    const first = PLAYER_CACHE.keys().next().value
    PLAYER_CACHE.delete(first)
  }
  PLAYER_CACHE.set(url, resolved)
  return resolved
}

/* Normalize a raw scraper item into the shape the frontend Title expects. */
function normalizeItem(it, fallbackType = 'movie') {
  const isSeries = !!it.episode || !!it.season || it.type === 'series'
  return {
    id: it.slug || '',
    slug: it.slug || '',
    type: isSeries ? 'series' : 'movie',
    title: it.title || '',
    year: parseInt(String(it.year || '').replace(/\D/g, ''), 10) || undefined,
    rating: parseFloat(String(it.rating || '').replace(',', '.')) || 0,
    quality: it.quality || '',
    runtime: it.runtime || '',
    genre: (it.genre || '').split(',').map((g) => g.trim()).filter(Boolean),
    country: Array.isArray(it.country) ? it.country.join(', ') : (it.country || ''),
    synopsis: it.synopsis || '',
    poster: it.poster || '',
    backdrop: it.poster || '',
    accent: '#ee6849',
    episodes: it.episode ? parseInt(String(it.episode).replace(/\D/g, ''), 10) : undefined,
    url: it.url || '',
    ep: it.episode || '',
    season: it.season || '',
    typeHint: it.type || '',
  }
}

function setJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(data))
}



const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => setJson(res, 500, { error: err.message }))
})

server.listen(PORT, () => {
  console.log(`Guardian backend listening on http://localhost:${PORT}`)
})