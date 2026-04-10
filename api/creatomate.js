// api/creatomate.js — Vercel serverless function
// POST /api/creatomate — submit a render
//   body: { variables: {...} }                         -> render the local fried-ocean-reel source with {{var}} substitution
//   body: { template_id, modifications }               -> render an existing Creatomate template
//   body: { source, modifications? }                   -> render a raw source
// GET  /api/creatomate?render_id=xxx                   -> poll render status
//
// Note: Creatomate's REST API is read-only for templates (GET /v1/templates works,
// POST/PATCH/PUT do not). To programmatically change the layout, pass the full source
// in the render call instead of relying on template_id.

const fs = require('fs');
const path = require('path');

const DEFAULT_VARIABLES = {
  hook: 'THIS CHANGES EVERYTHING',
  scene2_headline: 'BREAKING NEWS',
  scene3_detail: 'Here is the detail you need to know right now',
  scene4_cta: 'FOLLOW FOR MORE',
  background_color_1: '#0a2540',
  background_color_2: '#ff4d00',
  text_color_1: '#ffffff',
  text_color_2: '#ffffff',
  accent_color: '#ffcc00',
};

function loadFriedOceanSource(variables) {
  const filePath = path.join(__dirname, '..', 'templates', 'fried-ocean-reel.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const merged = { ...DEFAULT_VARIABLES, ...(variables || {}) };
  const substituted = raw.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) =>
    merged[key] !== undefined ? String(merged[key]) : match
  );
  const source = JSON.parse(substituted);
  // Strip metadata fields that aren't part of RenderScript
  delete source._comment;
  delete source._variables;
  return source;
}

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
    const { template_id, modifications, source, variables } = req.body || {};

    let payload;
    if (source) {
      payload = { source, ...(modifications ? { modifications } : {}) };
    } else if (template_id) {
      payload = { template_id, ...(modifications ? { modifications } : {}) };
    } else {
      // Default: use the local Fried Ocean reel source with variable substitution
      try {
        payload = { source: loadFriedOceanSource(variables) };
      } catch (e) {
        return res.status(500).json({ error: 'Failed to load local template source', detail: e.message });
      }
    }

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
