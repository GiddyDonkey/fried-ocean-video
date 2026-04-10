module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'CREATOMATE_API_KEY not set' });

  if (req.method === 'GET') {
    const { render_id } = req.query;
    const r = await fetch(`https://api.creatomate.com/v1/renders/${render_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return res.status(r.status).json(await r.json());
  }

  if (req.method === 'POST') {
    const { modifications } = req.body || {};
    const m = modifications || {};

    const bg1 = m.background_color_1 || '#cc2200';
    const bg2 = m.background_color_2 || '#1a1a1a';
    const textCol1 = m.text_color_1 || '#ffffff';
    const textCol2 = m.text_color_2 || '#ffffff';
    const accent = m.accent_color || '#cc2200';
    const hook = m.hook || 'FRIED OCEAN';
    const headline = m.scene2_headline || 'BREAKING NEWS';
    const detail = m.scene3_detail || 'The detail goes here';
    const cta = m.scene4_cta || 'Link in bio';

    const RECT = 'M 0 0 L 100 0 L 100 100 L 0 100 Z';

    const scene = (time, duration, bgColor, textColor, mainText, fontSize, chyronColor, chyronText) => ([
      {
        type: 'shape',
        track: 1,
        time, duration,
        x: '50%', y: '50%',
        width: '100%', height: '100%',
        fill_color: bgColor,
        path: RECT
      },
      {
        type: 'text',
        track: 2,
        time, duration,
        x: '50%', y: '45%',
        width: '90%', height: '60%',
        text: mainText,
        font_family: 'Oswald',
        font_weight: '700',
        font_size: fontSize,
        fill_color: textColor,
        x_alignment: '50%',
        y_alignment: '50%'
      },
      {
        type: 'shape',
        track: 3,
        time, duration,
        x: '50%', y: '94%',
        width: '100%', height: '8%',
        fill_color: chyronColor,
        path: RECT
      },
      {
        type: 'text',
        track: 4,
        time, duration,
        x: '50%', y: '94%',
        width: '90%', height: '6%',
        text: chyronText,
        font_family: 'Oswald',
        font_weight: '700',
        font_size: '52',
        fill_color: '#ffffff',
        x_alignment: '50%',
        y_alignment: '50%'
      }
    ]);

    const elements = [
      ...scene(0,    3,   bg1,       textCol1,  hook,     '140', '#000000', 'FRIED OCEAN'),
      ...scene(3,    2.5, bg2,       textCol2,  headline, '120', accent,    'BREAKING'),
      ...scene(5.5,  3.5, bg1,       textCol1,  detail,   '100', '#000000', 'FRIED OCEAN'),
      ...scene(9,    3,   '#000000', '#ffffff', cta,      '120', accent,    'friedocean.com'),
    ];

    const source = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      frame_rate: 30,
      duration: 12,
      elements
    };

    if (req.query && req.query.debug === '1') {
      return res.status(200).json({ version: 'v2-flat-shapes', element_count: elements.length, source });
    }

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source })
    });
    const data = await r.json();
    if (Array.isArray(data) && data[0]) data[0].__version = 'v2-flat-shapes';
    return res.status(r.status).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
