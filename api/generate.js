module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });

  const { headline, subheadline = '', article_url = 'friedocean.com', tone = 'sharp satirical', video_count = 1, platform = 'Instagram Reels and TikTok' } = req.body;
  if (!headline) return res.status(400).json({ error: 'Headline required' });

  const toneMap = {
    'outrage bait': 'Righteous indignation. Make the audience feel personally wronged by this news.',
    'unhinged absurdist': 'Absurd angle on a real story. Unexpected but still connected to the actual facts.',
    'dry deadpan': 'Deliver the facts completely straight, as if this is normal. No jokes, just facts stated flatly.'
  };

  const prompt = `You write short-form video copy for Fried Ocean, a satirical news brand like The Onion.

REAL STORY HEADLINE: "${headline}"
DETAIL: "${subheadline || 'none'}"
TONE: ${toneMap[tone] || toneMap['outrage bait']}

Write copy that satirizes the ACTUAL story. Stay connected to the real facts. Be edgy and dark but make sense.

RULES:
- hook: 4-6 words MAX. One punchy statement about this specific story. No questions. No exclamation points.
- scene2_headline: Rewrite the headline in 5-7 words. Present tense. Sharp. Must relate to the actual story.
- scene3_detail: The single most absurd or damning fact from the story. 8 words MAX. Just the fact.
- caption: 2 sentences. Satirical. References the actual story. Ends with: ${article_url}
- scene4_cta: exactly "FOLLOW FOR MORE" — nothing else
- bg_color: a dark hex color
- accent_color: a bold contrasting hex color

Return ONLY this exact JSON structure with no extra text:
{"videos":[{"hook":"","hook_style":"DEADPAN","caption":"","hashtags":["","","","",""],"cta":"FOLLOW FOR MORE","scene1_hook":"","scene2_headline":"","scene3_detail":"","scene4_cta":"FOLLOW FOR MORE","visual_direction":"","energy_level":8,"bg_color":"#0a0a0a","text_color":"#ffffff","accent_color":"#cc2200"}]}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 600,
        temperature: 0.85,
        messages: [{ role: 'user', content: prompt }]
      }),
    });
    if (!response.ok) { const e = await response.json().catch(() => ({})); return res.status(response.status).json({ error: e.error?.message || `Error ${response.status}` }); }
    const data = await response.json();
    const raw = data.choices[0].message.content || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
