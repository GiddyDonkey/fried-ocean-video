// api/generate.js — Vercel serverless function
// POST /api/generate
// Body: { headline, subheadline, article_url, tone, video_count, platform }
// Returns: { videos: [...] }

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-api-key'] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'Anthropic API key required' });
  }

  const {
    headline,
    subheadline = '',
    article_url = 'friedocean.com',
    tone = 'sharp satirical',
    video_count = 5,
    platform = 'Instagram Reels and TikTok',
  } = req.body;

  if (!headline) {
    return res.status(400).json({ error: 'Headline required' });
  }

  const prompt = `You are the creative director of Fried Ocean — a sharp, unhinged satirical news brand. The Onion meets Extremely Online Gen Z. Irreverent, confident, slightly absurdist, zero chill.

ARTICLE HEADLINE: ${headline}
SUBHEADLINE: ${subheadline || '(none)'}
URL: ${article_url}
TONE: ${tone}
PLATFORM: ${platform}
VIDEO COUNT: ${video_count}

Generate ${video_count} EXTREME, PUNCHY video variations. Each must feel like a different creative angle on the same story. Push the voice hard — do not be timid.

HOOK RULES: Under 8 words. Cold open energy. No question marks. No exclamation points. Should make someone stop scrolling immediately.

For EACH video return:
- hook: The 1-6 word stopper
- hook_style: One of SCREAM / WHISPER / DEADPAN / URGENT / SARCASTIC
- caption: 1-3 punchy sentences in Fried Ocean voice. End with the URL. No hashtags here.
- hashtags: Array of 5 specific niche hashtags (not generic like #funny)
- cta: Short CTA, max 6 words
- scene1_hook: Hook formatted for giant text overlay
- scene2_headline: Headline as bold chyron — max 8 words, rewrite if needed
- scene3_detail: Key detail condensed to 1 punchy line, max 12 words
- scene4_cta: CTA text for final scene, max 6 words
- visual_direction: 1 sentence on visual treatment feel
- energy_level: 1-10 (10 = maximum chaos)
- bg_color: hex color for background (match style)
- text_color: hex color for main text (white or near-black only)
- accent_color: hex accent color for chyron bar and highlights

Return ONLY valid JSON, no markdown, no backticks, no commentary:
{"videos":[{"hook":"...","hook_style":"...","caption":"...","hashtags":["..."],"cta":"...","scene1_hook":"...","scene2_headline":"...","scene3_detail":"...","scene4_cta":"...","visual_direction":"...","energy_level":8,"bg_color":"#000000","text_color":"#ffffff","accent_color":"#cc2200"}]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `Anthropic API error ${response.status}` });
    }

    const data = await response.json();
    const raw = data.content.map((b) => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message });
  }
}
