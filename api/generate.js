module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });

  const { headline, subheadline = '', article_url = 'friedocean.com', tone = 'sharp satirical', video_count = 1 } = req.body;
  if (!headline) return res.status(400).json({ error: 'Headline required' });

  const toneMap = {
    'outrage bait': 'Righteous indignation. The audience should feel personally cheated or wronged. Short, punchy, declarative.',
    'unhinged absurdist': 'Find the most absurd angle on the real facts. Lean into double entendres, sexual innuendo, or dark irony. Still grounded in the actual story.',
    'dry deadpan': 'Deliver the most damning or ridiculous fact completely straight. No jokes, no editorializing. Just the raw absurd truth stated flatly.'
  };

  const prompt = `You write short punchy video copy for Fried Ocean — a satirical news brand. Think The Onion meets social media. Your audience is adults who appreciate dark humor, sexual innuendo, and edgy comedy. Push boundaries but stay logical and story-relevant.

STORY: "${headline}"
DETAIL: "${subheadline || 'none'}"
TONE: ${toneMap[tone] || toneMap['outrage bait']}

Write copy that:
- Makes sense and directly relates to the actual story
- Is genuinely edgy, NSFW, uncomfortable in a funny way — use sexual innuendo freely when the story allows it
- Uses dark humor, profanity where it lands, and pushes right up to the line
- Still makes sense and relates to the actual story — no random weirdness
- Short and punchy — every word earns its place
- Should make someone think "I can't believe they posted that" but also share it anyway

FIELD RULES (STRICT):
hook: 4-6 words. One punchy line. No questions. No exclamation points. Can use innuendo or dark humor if natural.
scene1_hook: same as hook
scene2_headline: 5-8 words rewriting the headline. Punchy. Present tense. Can editorialize slightly.
scene3_detail: The single most interesting/absurd/damning fact from the story. 6-10 words. Just the fact, stated flat.
scene4_cta: write exactly the string "FOLLOW FOR MORE" — nothing else, no handle, no @ symbol
caption: 2 punchy sentences in Fried Ocean voice. Can be dark or use innuendo. Ends with: ${article_url}
hashtags: 5 relevant specific hashtags

Return ONLY valid JSON, no markdown:
{"videos":[{"hook":"","hook_style":"DEADPAN","caption":"","hashtags":["","","","",""],"cta":"FOLLOW FOR MORE","scene1_hook":"","scene2_headline":"","scene3_detail":"","scene4_cta":"FOLLOW FOR MORE","visual_direction":"","energy_level":8,"bg_color":"#0a0a0a","text_color":"#ffffff","accent_color":"#cc2200"}]}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 700,
        temperature: 0.9,
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
