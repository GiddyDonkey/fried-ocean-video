module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const RAILWAY = 'https://fried-ocean-builder-production.up.railway.app';

  if (req.method === 'GET') {
    const { job_id } = req.query;
    if (!job_id) return res.status(400).json({ error: 'job_id required' });
    const r = await fetch(`${RAILWAY}/status/${job_id}`);
    return res.status(r.status).json(await r.json());
  }

  if (req.method === 'POST') {
    const { modifications } = req.body;
    const m = modifications || {};
    const r = await fetch(`${RAILWAY}/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos: [m] })
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
