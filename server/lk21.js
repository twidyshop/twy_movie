/**
 *  Fitur  : Home sections, browse (genre/country/year/populer/dll), search,
 *           detail film & series (dengan episode), streaming servers, download link
 *  Pakai  : node lk21.js <cmd> [args]  (butuh: npm i cheerio)
 *
 *  CLI (output JSON):
 *    node lk21.js home
 *    node lk21.js browse /populer [page] [movie|series]
 *    node lk21.js genres | countries | years
 *    node lk21.js search <query> [page]
 *    node lk21.js detail <url>
 *    node lk21.js stream <url>
 *
 *  API (semua async, bisa di-import):
 *    home()                        -> { sections: [{type,title,seeAll,items}], latest: [] }
 *    browse(path, page, type)      -> listing /genre/x /country/x /year/x /populer /latest
 *                                     /latest-series /rating /release /most-commented
 *                                     /top-movie-today /quality/x  (type: movie|series)
 *    getGenres() / getCountries() / getYears()
 *    search(q, page)               -> via JSON API gudangvape
 *    detail(url)                   -> { type:'movie'|'series', ..., players/seasons }
 *    stream(url)                   -> { players:[{server,url}], nav:[] }
 */

import * as cheerio from 'cheerio'

const BASE = 'https://tv12.lk21official.cc'
const DRAMAMU = 'https://dramamu.lk21.de'          // detail series
const COVER = 'https://cover.showcdnx.com/wp-content/uploads/' // prefix poster hasil search
const SEARCH_API = 'https://gudangvape.com/search.php'

// CORS / IP-rotation proxy (Opsional). Contoh: https://uncors.netlify.app/
// Atur via env CORS_PROXY, misal:  CORS_PROXY=https://uncors.netlify.app/ npm run server
// Semua request keluar akan diteruskan lewat  ?destination=<url>
const CORS_PROXY = (process.env.CORS_PROXY || '').replace(/\/$/, '')

function proxied(url) {
  return CORS_PROXY ? `${CORS_PROXY}/?destination=${encodeURIComponent(url)}` : url
}

const hdrs = {
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8',
  referer: BASE + '/',
}

async function get(url, extra = {}) {
  const res = await fetch(proxied(url), { headers: { ...hdrs, ...extra } })
  return res.text()
}

async function getJSON(url) {
  const res = await fetch(proxied(url), {
    headers: {
      ...hdrs,
      accept: 'application/json, text/javascript, */*; q=0.01',
      'x-requested-with': 'XMLHttpRequest',
    },
  })
  return res.json()
}

/* ---------- parser item poster (home / listing / related) ---------- */

export function parseItem($, el) {
  const a = $(el).find('a[itemprop="url"], a').first()
  const img = $(el).find('img').first()
  const poster = img.attr('src') || img.attr('data-src') || ''
  return {
    title: $(el).find('.poster-title').text().trim(),
    slug: (a.attr('href') || '').replace(/^\//, '').replace(/\/$/, ''),
    url: a.attr('href')?.startsWith('http') ? a.attr('href') : `${BASE}${a.attr('href') || ''}`,
    year: $(el).find('.year').text().trim(),
    rating: $(el).find('.poster .rating [itemprop="ratingValue"]').text().trim() || ($(el).find('.poster .rating').text().match(/\d+(\.\d+)?/) || [''])[0],
    quality: $(el).find('.poster .label').text().trim(),
    episode: $(el).find('.episode strong').text().trim(),
    season: ($(el).find('.duration:not([itemprop])').text().trim() || '').replace('S.', ''),
    runtime: $(el).find('.duration[itemprop="duration"]').text().trim(),
    genre: $(el).find('meta[itemprop="genre"]').attr('content') || '',
    poster: poster.startsWith('http') ? poster : poster ? COVER + poster : '',
  }
}

/* ---------- HOME : semua section + daftar film terbaru ---------- */

export async function home() {
  const html = await get(BASE + '/')
  const $ = cheerio.load(html)
  const sections = []

  $('.widget[data-type]').each((_, w) => {
    const type = $(w).attr('data-type') || ''
    const title = $(w).find('.header h2').text().trim()
    const seeAll = $(w).find('.header a').attr('href') || ''
    if ($(w).attr('id') === 'you-may-wrapper') return
    const items = []
    $(w).find('li.slider, #you-may-also-like li').each((_, el) => items.push(parseItem($, el)))
    sections.push({
      type,
      title,
      seeAll: seeAll.startsWith('http') ? seeAll : `${BASE}${seeAll}`,
      items,
    })
  })

  const latest = []
  $('#post-container article, .gallery-grid article').each((_, el) => latest.push(parseItem($, el)))

  return { sections, latest }
}

/* ---------- BROWSE : /genre/x, /country/x, /year/x, /populer, /latest, /rating, /release, /most-commented, /top-movie-today, /quality/x ---------- */

export async function browse(path, page = 1, type = '') {
  let url = path.startsWith('http') ? path : `${BASE}/${path.replace(/^\//, '')}`
  if (page > 1) url += `${url.endsWith('/') ? '' : '/'}page/${page}`
  if (type && ['movie', 'series', 'both'].includes(type)) url += `${url.includes('?') ? '&' : '?'}type=${type}`

  const html = await get(url)
  const $ = cheerio.load(html)

  const title = $('h1').first().text().trim()
  const items = []
  $('.gallery-grid article, #post-container article').each((_, el) => items.push(parseItem($, el)))

  const totalPages = $('.pagination li:not(.active) a')
    .map((_, a) => parseInt($(a).attr('href')?.match(/page\/(\d+)/)?.[1] || $(a).text(), 10))
    .get()
    .filter(n => !isNaN(n))
  const last = totalPages.length ? Math.max(...totalPages) : 1

  return { title, page, totalPages: last, items }
}

/* ---------- daftar genre / negara / tahun ---------- */

export async function getGenres() {
  const html = await get(BASE + '/genre/')
  const $ = cheerio.load(html)
  return [...new Set($('a[href^="/genre/"]').map((_, a) => ({
    slug: $(a).attr('href').split('/').filter(Boolean)[1],
    name: $(a).text().trim(),
  })).get())].filter(g => g.name)
}

export async function getCountries() {
  const html = await get(BASE + '/country/')
  const $ = cheerio.load(html)
  const map = new Map()
  $('a[href^="/country/"]').each((_, a) => {
    const s = $(a).attr('href').split('/').filter(Boolean)[1]
    map.set(s, { slug: s, name: $(a).text().trim() })
  })
  return [...map.values()]
}

export async function getYears() {
  const html = await get(BASE + '/year/')
  const $ = cheerio.load(html)
  return [...new Set($('a[href^="/year/"]').map((_, a) => $(a).attr('href').split('/').filter(Boolean)[1]).get())]
}

/* ---------- SEARCH (JSON API) ---------- */

export async function search(query, page = 1) {
  const url = `${SEARCH_API}?s=${encodeURIComponent(query)}&page=${page}`
  const data = await getJSON(url)
  const items = (data?.data || data?.items || []).map(it => ({
    title: it.title,
    slug: it.slug,
    url: `${BASE}/${it.slug}`,
    year: it.year,
    rating: it.rating,
    quality: it.quality,
    episode: it.episode || undefined,
    season: it.season || undefined,
    runtime: it.runtime || undefined,
    type: it.type || undefined,
    poster: it.poster?.startsWith('http') ? it.poster : it.poster ? COVER + it.poster : '',
  }))
  return { query, page, totalPages: data?.totalPages || data?.total_pages || 1, items }
}

/* ---------- DETAIL : film (tv10) / series (redirect ke dramamu) ---------- */

export async function detail(url) {
  let html = await get(url)

  // Series di tv10 -> halaman pengalihan dengan tombol #openNow
  const $tmp = cheerio.load(html)
  const openNow = $tmp('#openNow').attr('href')
  if (openNow) {
    return detailSeries(openNow, html)
  }
  return detailMovie(html, url)
}

function parseDetailCore($) {
  const infoTag = $('.info-tag span').map((_, el) => $(el).text().trim()).get()
  const tags = $('.tag-list .tag a').map((_, el) => ({
    type: $(el).attr('href').split('/').filter(Boolean)[0],
    slug: $(el).attr('href').split('/').filter(Boolean)[1],
    name: $(el).text().trim(),
  })).get()

  const meta = {}
  $('.detail p').each((_, el) => {
    const label = $(el).find('span').text().replace(':', '').trim()
    const val = $(el).clone().find('span').remove().end().text().trim()
    if (label) meta[label] = val
  })
  const terbaru = $('.meta-info > p').first().find('a').text().trim()

  return {
    title: $('h1').first().text().trim(),
    infoTag,
    rating: $('.rating-number').attr('data-base-rating') || '',
    votes: $('.rating-users').attr('data-base-votes') || '',
    genres: tags.filter(t => t.type === 'genre').map(t => t.name),
    country: tags.filter(t => t.type === 'country').map(t => t.name),
    director: meta['Sutradara'] || '',
    cast: (meta['Bintang Film'] || '').split(',').map(s => s.trim()).filter(Boolean),
    release: meta['Release'] || '',
    updated: meta['Updated'] || '',
    votesMeta: meta['Votes'] || '',
    synopsis: $('.synopsis').text().trim(),
    latestEpisode: terbaru,
    poster: ($('.detail img').attr('src') || $('.detail img').attr('data-src') || ''),
    trailer: $('.trailer-series iframe, .simple-box iframe').attr('src') || '',
  }
}

export async function detailMovie(html, url) {
  const $ = cheerio.load(html)
  const core = parseDetailCore($)

  const playLinks = []
  $('.movie-action a').each((_, a) => {
    const href = $(a).attr('href') || ''
    const text = $(a).text().replace(/\s+/g, ' ').trim()
    if (/^\/|^https?:\/\//.test(href) && !/^#/.test(href)) playLinks.push({ text, url: href })
  })

  const players = []
  $('#player-list a[data-url], #player-list li a').each((_, a) => {
    players.push({
      server: $(a).attr('data-server') || $(a).text().trim().toLowerCase(),
      url: $(a).attr('data-url') || $(a).attr('href'),
    })
  })

  return {
    type: 'movie',
    url,
    ...core,
    download: $('a[title^="Download"]').attr('href') || '',
    playAwal: playLinks[0]?.url || '',
    playTerbaru: playLinks[1]?.url || '',
    players: players.filter(p => p.url),
    related: [],
  }
}

export async function detailSeries(url) {
  const $ = cheerio.load(await get(url))
  const core = parseDetailCore($)

  // episodes dari JSON #season-data
  const seasons = {}
  const sd = $('#season-data').text()
  if (sd) {
    try {
      const parsed = JSON.parse(sd)
      for (const [s, eps] of Object.entries(parsed)) {
        seasons[s] = eps.map(e => ({
          episode: e.episode_no,
          title: e.title,
          slug: e.slug,
          url: `${DRAMAMU}/${e.slug}`,
        }))
      }
    } catch {}
  }

  const playLinks = []
  $('.movie-action a').each((_, a) => {
    const href = $(a).attr('href') || ''
    const text = $(a).text().replace(/\s+/g, ' ').trim()
    if (!/^(#|\/country|\/genre)/.test(href)) playLinks.push({ text, url: href })
  })

  const related = []
  $('.widget[data-type] li.slider').each((_, el) => related.push(parseItem($, el)))

  return {
    type: 'series',
    url,
    ...core,
    seasons,
    totalEpisodes: Object.values(seasons).reduce((n, e) => n + e.length, 0),
    playAwal: playLinks[0]?.url || '',
    playTerbaru: playLinks[1]?.url || '',
    related,
  }
}

/* ---------- STREAMING : server player (movie tv10 / episode dramamu) ---------- */

export async function stream(url) {
  const html = await get(url)
  const $ = cheerio.load(html)

  const players = []
  $('#player-list a[data-url], #player-list li a').each((_, a) => {
    const server = $(a).attr('data-server') || $(a).text().trim().toLowerCase()
    const u = $(a).attr('data-url') || $(a).attr('href')
    if (u && u !== '#') players.push({ server, url: u, active: $(a).hasClass('active') })
  })
  if (!players.length) {
    const src = $('#main-player').attr('src')
    if (src) players.push({ server: 'p2p', url: src, active: true })
  }

  // episode sebelumnya/berikutnya
  const nav = []
  $('a:contains("EPISODE SEBELUMNYA"), a:contains("EPISODE BERIKUTNYA"), .prev-episode a, .next-episode a').each((_, a) => {
    const href = $(a).attr('href')
    if (href && /^\/|^https?:/.test(href)) nav.push({ text: $(a).text().trim(), url: href })
  })

  return {
    url,
    title: $('h1').first().text().trim(),
    players,
    nav,
  }
}