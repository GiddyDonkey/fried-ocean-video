module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not set' });

  const { headline, subheadline = '', article_url = 'friedocean.com', tone = 'sharp satirical', video_count = 1, platform = 'Instagram Reels and TikTok' } = req.body;
  if (!headline) return res.status(400).json({ error: 'Headline required' });

  const tones = {
    'outrage bait': 'Maximum righteous indignation. The audience should feel personally wronged. Short, punchy, declarative. Like a friend texting you in all caps.',
    'unhinged absurdist': 'Completely unhinged. The joke should come from an unexpected angle that makes no logical sense but is weirdly perfect. Think The Onion at its most deranged.',
    'dry deadpan': 'Zero emotion. Deliver the most insane information like reading a grocery list. The comedy is entirely in the contrast. Clinical language, absurd content.'
  };

  const prompt = `You are a writer for Fried Ocean, a viral satirical news brand. Your job: write SHORT, PUNCHY video copy that makes people stop scrolling.

STORY: ${headline}
DETAIL: ${subheadline || 'none'}
TONE: ${tones[tone] || tones['outrage bait']}

STRICT RULES:
- hook: MAX 6 WORDS. A single declarative statement. No questions. No exclamation points. Make it land like a punch. Examples of good hooks: "Nobody asked him to leave", "Turns out fires are hot", "Study confirms what we knew"
- scene1_hook: same as hook, formatted for big text
- scene2_headline: rewrite the headline as a 6-8 word chyron. Punchy. Present tense.
- scene3_detail: ONE sentence, max 10 words, the most absurd/damning specific fact from the story
- scene4_cta: "FOLLOW FOR MORE"
- caption: 2 short punchy sentences in Fried Ocean voice. End with the URL. Do NOT include hashtags here.
- hashtags: 5 specific relevant hashtags
- bg_color: dark hex color that fits the mood
- text_color: #ffffff
- accent_color: bold hex accent

Return ONLY valid JSON:
{"videos":[{"hook":"","hook_style":"DEADPAN","caption":"","hashtags":[],"cta":"FOLLOW FOR MORE","scene1_hook":"","scene2_headline":"","scene3_detail":"","scene4_cta":"FOLLOW FOR MORE","visual_direction":"","energy_level":8,"bg_color":"#0a0a0a","text_color":"#ffffff","accent_color":"#cc2200"}]}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o', max_tokens: 800, temperature: 0.95, messages: [{ role: 'user', content: prompt }] }),
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
