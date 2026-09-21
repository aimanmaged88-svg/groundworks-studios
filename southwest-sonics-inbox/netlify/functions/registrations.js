// Reads registration submissions from the Netlify Forms API.
// Needs two env vars on this site: NETLIFY_API_TOKEN and SONICS_FORM_ID.
export default async (req) => {
  const token  = process.env.NETLIFY_API_TOKEN;
  const formId = process.env.SONICS_FORM_ID;
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  if (!token || !formId) return json({ ok: false, reason: "not_configured" });

  try {
    const r = await fetch(
      `https://api.netlify.com/api/v1/forms/${formId}/submissions?per_page=200`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) return json({ ok: false, reason: "api_error", status: r.status });
    const raw = await r.json();
    const rows = raw.map((s) => ({
      id: s.id,
      at: s.created_at,
      data: s.data || {},
    }));
    return json({ ok: true, count: rows.length, rows });
  } catch (e) {
    return json({ ok: false, reason: "fetch_failed", message: String(e) });
  }
};
