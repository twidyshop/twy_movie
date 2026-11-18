import { home, browse, getGenres, getCountries, getYears, search, detail, stream } from '../server/lk21.js'

const BASE = 'https://tv12.lk21official.cc'
function normalizeItem(it) {
  const isSeries = !!it.episode || !!it.season || it.type === 'series'
  return {
    id: it.slug || '', slug: it.slug || '', type: isSeries ? 'series' : 'movie',
    title: it.title || '', year: parseInt(String(it.year || '').replace(/\\D/g, ''), 10) || undefined,
    rating: parseFloat(String(it.rating || '').replace(',', '.')) || 0, quality: it.quality || '',
    runtime: it.runtime || '', genre: (it.genre || '').split(',').map(g => g.trim()).filter(Boolean),
    country: Array.isArray(it.country) ? it.country.join(', ') : (it.country || ''),
    synopsis: it.synopsis || '', poster: it.poster || '', backdrop: it.poster || '',
    accent: '#ee6849', episodes: it.episode ? parseInt(String(it.episode).replace(/\\D/g, ''), 10) : undefined,
    url: it.url || '', ep: it.episode || '', season: it.season || '', typeHint: it.type || '',
  }
}
const json = (res, status, data) => { res.status(status).json(data) }

export default async function handler(req, res) {
  const path = '/' + (Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path || ''))
  const q = new URL(req.url, 'https://vercel.invalid').searchParams
  const page = parseInt(q.get('page') || '1', 10) || 1
  const type = q.get('type') || ''
  try {
    if (path === '/health') return json(res, 200, { ok: true })
    if (path === '/home') {
      const raw = await home()
      return json(res, 200, { sections: (raw.sections || []).map(s => ({ type:s.type,title:s.title,seeAll:s.seeAll,items:(s.items||[]).map(normalizeItem) })), latest:(raw.latest||[]).map(normalizeItem) })
    }
    if (path.startsWith('/browse')) {
      const browsePath = path.replace(/^\\/browse/, '') || '/populer'
      const raw = await browse(browsePath, page, type)
      return json(res, 200, { title:raw.title,page:raw.page,totalPages:raw.totalPages,items:(raw.items||[]).map(normalizeItem),path:browsePath })
    }
    if (path === '/genres') { const items=await getGenres(); return json(res,200,{items,total:items.length}) }
    if (path === '/countries') { const items=await getCountries(); return json(res,200,{items,total:items.length}) }
    if (path === '/years') { const items=await getYears(); return json(res,200,{items,total:items.length}) }
    if (path === '/search') {
      const raw=await search(q.get('q')||'',page)
      return json(res,200,{query:raw.query,page:raw.page,totalPages:raw.totalPages||1,items:(raw.items||[]).map(normalizeItem)})
    }
    if (path === '/detail') {
      const target=q.get('url')||''; if(!target) return json(res,400,{error:'url required'})
      const raw=await detail(target)
      return json(res,200,{url:target,type:raw.type,title:raw.title,rating:raw.rating,votes:raw.votes||raw.votesMeta,genres:raw.genres||[],country:raw.country||[],director:raw.director,cast:raw.cast||[],release:raw.release,updated:raw.updated,synopsis:raw.synopsis,poster:raw.poster,trailer:raw.trailer,download:raw.download||'',playAwal:raw.playAwal||'',playTerbaru:raw.playTerbaru||'',players:raw.players||[],seasons:raw.seasons||{},totalEpisodes:raw.totalEpisodes||0,latestEpisode:raw.latestEpisode||'',related:(raw.related||[]).map(normalizeItem)})
    }
    if (path === '/stream') {
      const target=q.get('url')||''; if(!target) return json(res,400,{error:'url required'})
      return json(res,200,await stream(target))
    }
    return json(res,404,{error:'not found',path})
  } catch (e) {
    console.error('API error:',path,e)
    return json(res,500,{error:e?.message||'Internal server error',path})
  }
}
