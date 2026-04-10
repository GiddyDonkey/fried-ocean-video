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

    const source = {
      output_format: 'mp4',
      width: 1080,
      height: 1920,
      frame_rate: '30 fps',
      duration: 12,
      elements: [
        {
          type: 'video', track: 1, time: 0, duration: 3,
          elements: [
            { type: 'shape', shape: 'rectangle', track: 1, x: '50%', y: '50%', width: '100%', height: '100%', fill_color: m.background_color_1 || '#cc2200' },
            { type: 'text', track: 2, x: '50%', y: '42%', width: '85%', font_family: 'Oswald', font_weight: '700', font_size: '12 vmin', fill_color: m.text_color_1 || '#ffffff', text: m.hook || 'FRIED OCEAN', x_alignment: '50%', y_alignment: '50%' },
            { type: 'shape', shape: 'rectangle', track: 3, x: '0%', y: '100%', width: '26%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: m.accent_color || '#cc2200' },
            { type: 'text', track: 4, x: '2.5%', y: '96.5%', width: '24%', font_family: 'Oswald', font_weight: '700', font_size: '2.8 vmin', fill_color: '#ffffff', text: 'FRIED OCEAN', x_anchor: '0%', y_anchor: '50%' },
            { type: 'shape', shape: 'rectangle', track: 5, x: '26%', y: '100%', width: '74%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: '#000000', opacity: '88%' },
            { type: 'text', track: 6, x: '28%', y: '96.5%', width: '70%', font_family: 'IBM Plex Mono', font_size: '2.2 vmin', fill_color: '#ffffff', text: m.scene2_headline || 'BREAKING NEWS', x_anchor: '0%', y_anchor: '50%' }
          ]
        },
        {
          type: 'video', track: 1, time: 3, duration: 2.5,
          elements: [
            { type: 'shape', shape: 'rectangle', track: 1, x: '50%', y: '50%', width: '100%', height: '100%', fill_color: m.background_color_2 || '#000000' },
            { type: 'text', track: 2, x: '50%', y: '42%', width: '85%', font_family: 'Oswald', font_weight: '700', font_size: '9 vmin', fill_color: m.text_color_2 || '#ffffff', text: m.scene2_headline || 'BREAKING NEWS', x_alignment: '50%', y_alignment: '50%' },
            { type: 'shape', shape: 'rectangle', track: 3, x: '0%', y: '100%', width: '22%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: m.accent_color || '#cc2200' },
            { type: 'text', track: 4, x: '2.5%', y: '96.5%', width: '20%', font_family: 'Oswald', font_weight: '700', font_size: '2.8 vmin', fill_color: '#ffffff', text: 'BREAKING', x_anchor: '0%', y_anchor: '50%' },
            { type: 'shape', shape: 'rectangle', track: 5, x: '22%', y: '100%', width: '78%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: '#000000', opacity: '88%' },
            { type: 'text', track: 6, x: '24%', y: '96.5%', width: '74%', font_family: 'IBM Plex Mono', font_size: '2.2 vmin', fill_color: '#ffffff', text: m.scene2_headline || 'BREAKING NEWS', x_anchor: '0%', y_anchor: '50%' }
          ]
        },
        {
          type: 'video', track: 1, time: 5.5, duration: 3.5,
          elements: [
            { type: 'shape', shape: 'rectangle', track: 1, x: '50%', y: '50%', width: '100%', height: '100%', fill_color: m.background_color_1 || '#cc2200' },
            { type: 'text', track: 2, x: '50%', y: '42%', width: '85%', font_family: 'Oswald', font_weight: '700', font_size: '7.5 vmin', fill_color: m.text_color_1 || '#ffffff', text: m.scene3_detail || 'More details here', x_alignment: '50%', y_alignment: '50%' },
            { type: 'shape', shape: 'rectangle', track: 3, x: '0%', y: '100%', width: '26%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: m.accent_color || '#cc2200' },
            { type: 'text', track: 4, x: '2.5%', y: '96.5%', width: '24%', font_family: 'Oswald', font_weight: '700', font_size: '2.8 vmin', fill_color: '#ffffff', text: 'FRIED OCEAN', x_anchor: '0%', y_anchor: '50%' },
            { type: 'shape', shape: 'rectangle', track: 5, x: '26%', y: '100%', width: '74%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: '#000000', opacity: '88%' },
            { type: 'text', track: 6, x: '28%', y: '96.5%', width: '70%', font_family: 'IBM Plex Mono', font_size: '2.2 vmin', fill_color: '#ffffff', text: m.scene3_detail || 'More details here', x_anchor: '0%', y_anchor: '50%' }
          ]
        },
        {
          type: 'video', track: 1, time: 9, duration: 3,
          elements: [
            { type: 'shape', shape: 'rectangle', track: 1, x: '50%', y: '50%', width: '100%', height: '100%', fill_color: '#000000' },
            { type: 'text', track: 2, x: '50%', y: '40%', width: '85%', font_family: 'Oswald', font_weight: '700', font_size: '11 vmin', fill_color: '#ffffff', text: m.scene4_cta || 'Link in bio', x_alignment: '50%', y_alignment: '50%' },
            { type: 'shape', shape: 'rectangle', track: 3, x: '50%', y: '52%', width: '80%', height: '0.3%', x_anchor: '50%', fill_color: m.accent_color || '#cc2200' },
            { type: 'shape', shape: 'rectangle', track: 4, x: '0%', y: '100%', width: '26%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: m.accent_color || '#cc2200' },
            { type: 'text', track: 5, x: '2.5%', y: '96.5%', width: '24%', font_family: 'Oswald', font_weight: '700', font_size: '2.8 vmin', fill_color: '#ffffff', text: 'FRIED OCEAN', x_anchor: '0%', y_anchor: '50%' },
            { type: 'shape', shape: 'rectangle', track: 6, x: '26%', y: '100%', width: '74%', height: '4.7%', x_anchor: '0%', y_anchor: '100%', fill_color: '#000000', opacity: '88%' },
            { type: 'text', track: 7, x: '28%', y: '96.5%', width: '70%', font_family: 'IBM Plex Mono', font_size: '2.2 vmin', fill_color: '#ffffff', text: 'friedocean.com', x_anchor: '0%', y_anchor: '50%' }
          ]
        }
      ]
    };

    const r = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source })
    });
    return res.status(r.status).json(await r.json());
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
