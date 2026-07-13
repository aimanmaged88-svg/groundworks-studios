/* ============================================================
   importsite — "build from their current website".
   Fetches a business's existing site server-side (bypassing the
   browser's cross-origin block) and pulls out the name, tagline,
   brand colour, logo, phone, email and section headings, so the
   Website Studio can pre-fill a fresh mockup based on their site.
   Keyless. Heuristic parse — no external AI needed.
   ============================================================ */

exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  let url = (event.queryStringParameters && event.queryStringParameters.url || '').trim();
  if (!url) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'url required' }) };
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let html = '';
  let finalUrl = url;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GroundworkLabsOS/1.0; +https://aiman-business-os.netlify.app)' },
      redirect: 'follow',
    });
    finalUrl = r.url || url;
    if (!r.ok) return { statusCode: 200, headers: cors, body: JSON.stringify({ error: 'fetch_failed', status: r.status }) };
    html = (await r.text()).slice(0, 500000);
  } catch (e) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ error: 'unreachable' }) };
  }

  const dec = (s) => (s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  const grab = (re) => { const m = html.match(re); return m ? dec(m[1]) : ''; };

  let origin = '';
  try { origin = new URL(finalUrl).origin; } catch (e) {}
  const abs = (u) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith('//')) return 'https:' + u;
    return origin + (u.startsWith('/') ? '' : '/') + u;
  };

  let business = grab(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
    || grab(/<title[^>]*>([^<]+)<\/title>/i);
  business = business.split(/[|–—\-·:]/)[0].trim().slice(0, 60);

  const tagline = (grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)).slice(0, 130);

  const accentRaw = grab(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
  const accent = /^#?[0-9a-f]{3,8}$/i.test(accentRaw) ? (accentRaw.startsWith('#') ? accentRaw : '#' + accentRaw) : '';

  const logo = abs(
    grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || grab(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
    || grab(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
  );

  const phone = (
    (html.match(/href=["']tel:([^"']+)["']/i) || [])[1]
    || (html.match(/\b(0[2-8][\s-]?\d{4}[\s-]?\d{4}|04\d{2}[\s-]?\d{3}[\s-]?\d{3})\b/) || [])[1]
    || ''
  ).trim();
  const email = ((html.match(/href=["']mailto:([^"'?]+)/i) || [])[1] || '').trim();

  const services = [];
  const seen = new Set();
  const heads = html.matchAll(/<h[23][^>]*>\s*([^<]{3,42})\s*<\/h[23]>/gi);
  for (const m of heads) {
    const s = dec(m[1]);
    const k = s.toLowerCase();
    if (s && !seen.has(k) && !/^(home|about|about us|contact|contact us|menu|blog|news|gallery|reviews|testimonials|faq|faqs)$/i.test(s)) {
      seen.add(k);
      services.push(s);
    }
    if (services.length >= 6) break;
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ business, tagline, accent, logo, phone, email, services }) };
};
