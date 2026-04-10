// api/generate.js — Vercel serverless function
module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set in Vercel env vars' });

  const {
    headline,
    subheadline = '',
    article_url = 'friedocean.com',
    tone = 'sharp satirical',
    video_count = 5,
    platform = 'Instagram Reels and TikTok',
  } = req.body;

  if (!headline) return res.status(400).json({ error: 'Headline required' });

  const url = article_url || 'friedocean.com';

  const prompt = `You are the creative director of Fried Ocean — a sharp, unhinged satirical news brand. The Onion meets Extremely Online Gen Z. Irreverent, confident, slightly absurdist, zero chill.

HEADLINE: ${headline}
SUBHEADLINE: ${subheadline || '(none)'}
URL: ${url}
TONE: ${tone}
PLATFORM: ${platform}
COUNT: ${video_count}

Generate ${video_count} EXTREME, PUNCHY video variations. Each must be a genuinely different creative angle. Push the voice hard. Do not be safe.

HOOK RULES: Under 8 words. Cold open energy. No question marks. No exclamation points. Make someone stop scrolling mid-thumb. Be specific and weird, not generic.

For each video return:
- hook: The 1-6 word stopper
- hook_style: SCREAM / WHISPER / DEADPAN / URGENT / SARCASTIC
- caption: 1-3 punchy Fried Ocean sentences. End with URL. No hashtags here.
- hashtags: 5 niche specific hashtags. Not generic.
- cta: Max 6 words. Punchy.
- scene1_hook: Same hook formatted for giant text overlay
- scene2_headline: Headline rewritten as bold chyron, max 8 words
- scene3_detail: Key detail distilled to 1 punchy line, max 12 words
- scene4_cta: Final scene CTA text, max 6 words
- visual_direction: 1 sentence on visual treatment
- energy_level: 1-10
- bg_color: hex for background
- text_color: #ffffff or #0a0a0a only
- accent_color: hex for chyron bar

Return ONLY valid JSON, no markdown, no backticks:
{"videos":[{"hook":"","hook_style":"","caption":"","hashtags":[],"cta":"","scene1_hook":"","scene2_headline":"","scene3_detail":"","scene4_cta":"","visual_direction":"","energy_level":8,"bg_color":"#000000","text_color":"#ffffff","accent_color":"#cc2200"}]}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `OpenAI error ${response.status}` });
    }

    const data = await response.json();
    const raw = data.choices[0].message.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
