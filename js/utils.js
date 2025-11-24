export function extractId(raw){
  if(!raw) return null;
  try { raw = raw.trim(); } catch(e) {}
  const idPattern = /^[a-zA-Z0-9_-]{11}$/;
  if(idPattern.test(raw)) return raw;
  if(!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let u;
  try { u = new URL(raw); } catch(e) { return null; }
  const host = u.hostname.replace(/^www\./,'');
  if(host === 'youtu.be') {
    const seg = u.pathname.split('/').filter(Boolean)[0];
    return seg && seg.length ? seg : null;
  }
  if(host.endsWith('youtube.com')) {
    if(u.searchParams.get('v')) {
      const v = u.searchParams.get('v');
      return v || null;
    }
    const parts = u.pathname.split('/').filter(Boolean);
    if(parts[0] === 'embed' && parts[1]) return parts[1];
    if(parts[0] === 'shorts' && parts[1]) return parts[1];
  }
  return null;
}

// Extract playlist id from a URL or raw id.
// Basic support: look for 'list=' query param or accept plausible playlist id patterns.
export function extractPlaylistId(raw){
  if(!raw) return null;
  try { raw = raw.trim(); } catch(e) {}
  // Direct id heuristic (YouTube playlist ids often start with PL, UU, LL, OL, RD)
  const directPattern = /^(PL|UU|LL|OL|RD)[A-Za-z0-9_-]{10,}$/i;
  if(directPattern.test(raw)) return raw;
  if(!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let u;
  try { u = new URL(raw); } catch(e) { return null; }
  const listParam = u.searchParams.get('list');
  if(listParam && directPattern.test(listParam)) return listParam;
  return null;
}

export function buildEmbed(id){
  const base = 'https://www.youtube.com/embed/' + encodeURIComponent(id);
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  return `${base}?${params.toString()}`;
}

export function escapeHtml(str){
  return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]));
}

const metaCache = new Map();
export async function fetchMeta(id){
  if(metaCache.has(id)) return metaCache.get(id);
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 4500);
  try {
    const resp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {signal: controller.signal});
    clearTimeout(timeout);
    if(!resp.ok) throw new Error('oEmbed status ' + resp.status);
    const data = await resp.json();
    const meta = { title: data.title || id, thumb: data.thumbnail_url || `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
    metaCache.set(id, meta);
    return meta;
  } catch(e){
    clearTimeout(timeout);
    const meta = { title: id, thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg` };
    metaCache.set(id, meta);
    return meta;
  }
}
