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
    video_count = 1,
    platform = 'Instagram Reels and TikTok',
  } = req.body;

  if (!headline) return res.status(400).json({ error: 'Headline required' });

  const url = article_url || 'friedocean.com';

  const toneInstructions = {
    'outrage bait': `OUTRAGE BAIT TONE: Write like you're genuinely offended on behalf of the audience. Righteous indignation. Point the finger hard. Use words like "NOBODY is talking about this", "this is actually insane", "how is this legal". Make people want to share it to prove a point. The joke should feel like a real grievance.`,
    'unhinged absurdist': `UNHINGED ABSURDIST TONE: Complete detachment from reality. Non-sequiturs welcome. The hook should make zero logical sense but be weirdly compelling. Think Adult Swim at 3am. Go somewhere nobody expected. The funnier it is that this is a "news story", the better. Be genuinely weird, not just random.`,
    'dry deadpan': `DRY DEADPAN TONE: Deliver insane information like it's completely normal. Zero emotion. Clinical language about absurd facts. Think: a boring government press release about something deeply unhinged. The comedy comes entirely from the contrast between the delivery and the content. Never wink at the camera.`
  };

  const toneGuide = toneInstructions[tone] || toneInstructions['outrage bait'];

  const prompt = `You are the head writer at Fried Ocean — a satirical news brand that makes The Onion look tame. Your content lives on TikTok and Instagram Reels. Your audience is chronically online, deeply cynical, and they've seen everything. To make them stop scrolling you need to be genuinely shocking, darkly funny, or so absurd it breaks their brain.

${toneGuide}

RULES — BREAK THESE AND YOU'RE FIRED:
- No corporate-safe language. No "interesting", "fascinating", "surprising". 
- No question marks in hooks. Statements only. Declarative. Confident.
- No exclamation points. Enthusiasm is cringe.
- The hook must make someone laugh, wince, or say "what the fuck" out loud.
- Be SPECIFIC and WEIRD. "Man does thing" is fired. "Man discovers loophole" is fired. Specificity is comedy.
- Dark is good. Uncomfortable is good. The line exists only where it stops being funny.
- Each tone variation must feel like a completely different writer wrote it.
- Scene 2 headline: rewrite the actual story headline as a punchy chyron. Max 8 words. Make it land harder than the original.
- Scene 3 detail: pull the most damning/absurd/specific fact from the story. One sentence. No editorializing — just the raw fact, stated flatly.
- Caption: 2-3 sentences. Fried Ocean voice. End with the article URL. The caption should make someone want to both share it AND feel slightly guilty about sharing it.

HEADLINE: ${headline}
SUBHEADLINE: ${subheadline || '(none provided)'}
URL: ${url}
TONE: ${tone}
PLATFORM: ${platform}

Generate ${video_count} video(s). Push as hard as you can. If your first instinct is too safe, double it.

Return ONLY valid JSON, no markdown, no backticks:
{"videos":[{"hook":"","hook_style":"SCREAM|WHISPER|DEADPAN|URGENT|SARCASTIC","caption":"","hashtags":[],"cta":"FOLLOW FOR MORE","scene1_hook":"","scene2_headline":"","scene3_detail":"","scene4_cta":"FOLLOW FOR MORE","visual_direction":"","energy_level":10,"bg_color":"#000000","text_color":"#ffffff","accent_color":"#cc2200"}]}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        temperature: 1.1,
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
