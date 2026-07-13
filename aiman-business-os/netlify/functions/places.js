/* ============================================================
   places — the Lead Finder's "Scan for hot leads" backend.
   Free & keyless: geocodes the suburb with Nominatim, then pulls
   local businesses from OpenStreetMap via Overpass. Returns them
   in the shape the scanner already expects, so the client can
   rank the ones with a weak or missing website first.
   ============================================================ */

const UA = 'GroundworkLabsBusinessOS/1.0 (lead finder; +https://aiman-business-os.netlify.app)';

/* niche → OpenStreetMap tag filters */
const NICHE_FILTERS = {
  'Cafés':                  ['["amenity"="cafe"]'],
  'Restaurants':            ['["amenity"="restaurant"]', '["amenity"="fast_food"]'],
  'Barbers':                ['["shop"="hairdresser"]'],
  'Beauty salons':          ['["shop"="beauty"]', '["shop"="nails"]', '["shop"="hairdresser"]'],
  'Gyms / PTs':             ['["leisure"="fitness_centre"]', '["amenity"="gym"]'],
  'Physio / Allied health': ['["healthcare"="physiotherapist"]', '["healthcare"="clinic"]', '["amenity"="clinic"]'],
  'Mechanics':              ['["shop"="car_repair"]', '["shop"="tyres"]'],
  'Tutoring':               ['["amenity"="school"]', '["office"="educational_institution"]'],
  'Florists':               ['["shop"="florist"]'],
  'Fencing':                ['["craft"="fence"]', '["craft"="metal_construction"]'],
  'Landscaping':            ['["craft"="gardener"]', '["shop"="garden_centre"]'],
  'Plumbing':               ['["craft"="plumber"]'],
  'Electrical':             ['["craft"="electrician"]'],
  'Roofing':                ['["craft"="roofer"]'],
  'Cleaning':               ['["craft"="cleaning"]', '["shop"="dry_cleaning"]', '["shop"="laundry"]'],
  'Builders':               ['["craft"="builder"]', '["craft"="carpenter"]'],
  'Real estate':            ['["office"="estate_agent"]', '["shop"="estate_agent"]'],
  'Other':                  ['["shop"]', '["office"]', '["amenity"="cafe"]'],
};

exports.handler = async (event) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const qp = event.queryStringParameters || {};
  const trade = qp.trade || 'Other';
  const suburb = (qp.suburb || '').trim();
  if (!suburb) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'suburb required' }) };

  try {
    /* 1. geocode the suburb → bounding box (prefer a place/boundary, not a POI) */
    const gRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=au&q=${encodeURIComponent(suburb)}`,
      { headers: { 'User-Agent': UA } });
    if (!gRes.ok) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'geocode ' + gRes.status }) };
    const places = await gRes.json();
    const place = places.find(p => p.class === 'place' || p.class === 'boundary') || places[0];
    if (!place || !place.boundingbox) return { statusCode: 200, headers: cors, body: '[]' };
    const [s, n, w, e] = place.boundingbox.map(Number); // [south, north, west, east]
    const bbox = `${s},${w},${n},${e}`;

    /* 2. pull businesses of this trade inside the box */
    const filters = NICHE_FILTERS[trade] || NICHE_FILTERS['Other'];
    const query = `[out:json][timeout:25];(${filters.map(f => `node${f}(${bbox});way${f}(${bbox});`).join('')});out center tags 80;`;
    const oRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      body: 'data=' + encodeURIComponent(query),
    });
    if (!oRes.ok) return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'overpass ' + oRes.status }) };
    const data = await oRes.json();

    const seen = new Set();
    const results = (data.elements || []).map(el => {
      const t = el.tags || {};
      if (!t.name) return null;
      const website = t.website || t['contact:website'] || t.url || '';
      const phone = t.phone || t['contact:phone'] || t['contact:mobile'] || '';
      const addr = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
        + (t['addr:suburb'] ? (t['addr:street'] ? ', ' : '') + t['addr:suburb'] : '');
      return {
        name: t.name,
        address: addr || suburb,
        phone,
        website,
        rating: null,
        reviews: 0,
        maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.name + ' ' + suburb)}`,
      };
    }).filter(Boolean).filter(r => {
      const k = r.name.toLowerCase().trim();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    return { statusCode: 200, headers: cors, body: JSON.stringify(results) };
  } catch (err) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: String(err && err.message || err) }) };
  }
};
