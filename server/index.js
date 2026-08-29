// Guardian backend — proxies the lk21.js scraper as JSON endpoints.
// Run: `npm run server` (default http://localhost:8787)

import * as http from 'node:http'
import { URL } from 'node:url'
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
      return setJson(res, 200, raw)
    }

    return setJson(res, 404, { error: 'not found', path: p })
  } catch (err) {
    return setJson(res, 500, { error: err.message, path: p })
  }
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err) => setJson(res, 500, { error: err.message }))
})

server.listen(PORT, () => {
  console.log(`Guardian backend listening on http://localhost:${PORT}`)
})