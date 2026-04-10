// api/creatomate.js — Vercel serverless function
// POST /api/creatomate — submit a render
// GET  /api/creatomate?render_id=xxx — poll render status

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CREATOMATE_API_KEY not set in Vercel env vars' });

  // GET — poll render status
  if (req.method === 'GET') {
    const { render_id } = req.query;
    if (!render_id) return res.status(400).json({ error: 'render_id required' });

    const r = await fetch(`https://api.creatomate.com/v1/renders/${render_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  // POST — submit render
  if (req.method === 'POST') {
    const { template_id, modifications } = req.body;
    if (!template_id) return res.status(400).json({ error: 'template_id required' });

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ template_id, modifications })
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
