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
    const { modifications } = req.body;
    const m = modifications || {};

    const bg = m.background_color_1 || '#cc2200';
    const textCol = m.text_color_1 || '#ffffff';
    const accent = m.accent_color || '#cc2200';
    const hook = m.hook || 'FRIED OCEAN';
    const headline = m.scene2_headline || 'BREAKING NEWS';
    const detail = m.scene3_detail || 'The detail goes here';
    const cta = m.scene4_cta || 'Link in bio';

    const source = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      frame_rate: '30',
      duration: 12,
      elements: [
        {
          type: 'text',
          track: 1,
          time: 0,
          duration: 12,
          text: hook,
          font_family: 'Oswald',
          font_weight: '700',
          font_size: '10 vmin',
          fill_color: textCol,
          x: '50%',
          y: '30%',
          width: '90%',
          x_alignment: '50%',
          y_alignment: '50%',
          background_color: bg,
          background_x_padding: '100%',
          background_y_padding: '100%'
        },
        {
          type: 'text',
          track: 2,
          time: 0,
          duration: 12,
          text: 'FRIED OCEAN',
          font_family: 'Oswald',
          font_weight: '700',
          font_size: '3 vmin',
          fill_color: '#ffffff',
          x: '5%',
          y: '97%',
          x_anchor: '0%',
          y_anchor: '100%',
          background_color: accent,
          background_x_padding: '30%',
          background_y_padding: '30%'
        }
      ]
    };

    const payload = { source };
    console.log('Sending to Creatomate:', JSON.stringify(payload).substring(0, 500));

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    console.log('Creatomate response:', JSON.stringify(data).substring(0, 500));
    return res.status(r.status).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
