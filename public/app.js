
// ── Config ─────────────────────────────────────────
// If deployed on Vercel, API calls go to /api/generate (serverless)
// If using browser-direct mode, we call Anthropic directly with the key
// ── Status cycling ──────────────────────────────────
const STATUS_MSGS = [
  'CONTACTING SOURCES...',
  'BRIEFING THE ANCHORS...',
  'RUNNING THE NUMBERS...',
  'FACT-CHECKING (SKIPPED)...',
  'CLEARING WITH LEGAL...',
  'CONSULTING THE DATA...',
  'GOING TO PRESS...',
];
let _msgI = 0, _msgTimer;
function startStatus() {
  _msgI = 0;
  setStatus(STATUS_MSGS[0], true);
  _msgTimer = setInterval(() => {
    _msgI = (_msgI + 1) % STATUS_MSGS.length;
    setStatus(STATUS_MSGS[_msgI], true);
  }, 1900);
}
function stopStatus() { clearInterval(_msgTimer); }
function setStatus(txt, active = false) {
  document.getElementById('status-bar').className = 'status-bar' + (active ? ' active' : '');
  document.getElementById('status-txt').textContent = txt;
}
function showErr(msg) {
  const b = document.getElementById('error-box');
  b.style.display = 'block';
  b.textContent = '⚠  ' + msg;
}
function hideErr() { document.getElementById('error-box').style.display = 'none'; }

// ── Main handler ────────────────────────────────────
async function handleGenerate() {

  const headline = document.getElementById('headline').value.trim();
  const subheadline = document.getElementById('subheadline').value.trim();
  const article_url = document.getElementById('article_url').value.trim();
  const tone = document.getElementById('tone').value;
  const video_count = parseInt(document.getElementById('video_count').value);
  const platform = document.getElementById('platform').value;

  hideErr();
  if (!headline) { showErr('HEADLINE REQUIRED. We are a news organization.'); return; }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  startStatus();

  try {
    let videos;
    // Always use serverless — keys stored in Vercel env vars
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, subheadline, article_url, tone, video_count, platform }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${res.status}`);
    }
    const data = await res.json();
    videos = data.videos;

    stopStatus();
    setStatus(`${videos.length} VIDEOS READY — CLEARED FOR BROADCAST`);
    renderVideos(videos);

  } catch (err) {
    stopStatus();
    setStatus('FEED WENT DOWN');
    showErr(err.message);
  } finally {
    btn.disabled = false;
  }
}

async function callAnthropicDirect(apiKey, params) {
  const { headline, subheadline, article_url, tone, video_count, platform } = params;
  const url = article_url || 'friedocean.com';

  const prompt = buildPrompt({ headline, subheadline, url, tone, video_count, platform });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  const raw = data.choices[0].message.content || '';
  const clean = raw.replace(/```json[\s\S]*?```/g, m => m.slice(7, -3)).replace(/```/g, '').trim();
  return JSON.parse(clean).videos;
}

function buildPrompt({ headline, subheadline, url, tone, video_count, platform }) {
  return `You are the creative director of Fried Ocean — a sharp, unhinged satirical news brand. The Onion meets Extremely Online Gen Z. Irreverent, confident, slightly absurdist, zero chill.

HEADLINE: ${headline}
SUBHEADLINE: ${subheadline || '(none)'}
URL: ${url}
TONE: ${tone}
PLATFORM: ${platform}
COUNT: ${video_count}

Generate ${video_count} EXTREME, PUNCHY video variations. Each must be a genuinely different creative angle. Push the voice hard. Do not be safe.

HOOK RULES: Under 8 words. Cold open energy. No question marks. No exclamation points. Make someone stop scrolling mid-thumb. Be specific and weird, not generic.

For each video return:
- hook: The 1-6 word stopper (no punctuation except period or ellipsis)
- hook_style: SCREAM / WHISPER / DEADPAN / URGENT / SARCASTIC
- caption: 1-3 punchy Fried Ocean sentences. End with URL. No hashtags here.
- hashtags: 5 niche specific hashtags. Not generic. Think specific subculture.
- cta: Max 6 words. Punchy.
- scene1_hook: Same hook formatted for giant text overlay
- scene2_headline: Headline rewritten as bold chyron, max 8 words
- scene3_detail: Key detail distilled to 1 punchy line, max 12 words  
- scene4_cta: Final scene CTA text, max 6 words
- visual_direction: 1 sentence on visual treatment
- energy_level: 1-10
- bg_color: hex for background
- text_color: hex for main text (white #ffffff or near-black #0a0a0a only)
- accent_color: hex for chyron bar and accents

Return ONLY valid JSON, no markdown, no backticks:
{"videos":[{"hook":"","hook_style":"","caption":"","hashtags":[],"cta":"","scene1_hook":"","scene2_headline":"","scene3_detail":"","scene4_cta":"","visual_direction":"","energy_level":8,"bg_color":"#000000","text_color":"#ffffff","accent_color":"#cc2200"}]}`;
}

// ── Render ──────────────────────────────────────────
const STYLE_NAMES = ['BLACKOUT','RED ALERT','NEWSPRINT','DARK ROOM','CRIME TAPE'];

function renderVideos(videos) {
  const out = document.getElementById('videos-out');
  const sec = document.getElementById('videos-section');
  out.innerHTML = '';
  sec.style.display = 'block';
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });

  videos.forEach((v, i) => {
    const styleName = STYLE_NAMES[i % STYLE_NAMES.length];
    const bg = v.bg_color || '#000000';
    const textCol = v.text_color || '#ffffff';
    const accent = v.accent_color || '#cc2200';
    const energyColor = v.energy_level >= 8 ? '#ff3300' : v.energy_level >= 5 ? '#ffcc00' : '#666';

    const card = document.createElement('div');
    card.className = 'vcard';
    card.style.borderLeftColor = accent;
    card.dataset.v = JSON.stringify(v);
    card.dataset.bg = bg;
    card.dataset.textcol = textCol;
    card.dataset.accent = accent;

    const ffcmd = buildFFmpeg(v, i + 1);
    const ts = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});

    card.innerHTML = `
      <div class="vcard-hdr" onclick="toggleCard(this)">
        <div class="vcard-num">${String(i+1).padStart(2,'0')}</div>
        <div class="vcard-title">
          <div class="vcard-meta">${styleName} &nbsp;·&nbsp; ${v.hook_style||'BOLD'} &nbsp;·&nbsp; ${platform || 'REELS+TIKTOK'}</div>
          <div class="vcard-hook">${escHtml(v.hook)}</div>
        </div>
        <div class="vcard-energy">
          <div class="energy-num" style="color:${energyColor};">${v.energy_level||'?'}</div>
          <div class="energy-label">ENERGY</div>
        </div>
        <div class="vcard-arrow">▼</div>
      </div>
      <div class="vcard-body" id="vbody-${i}">

        <div class="preview-wrap">
          <div class="preview-bg" style="background:${bg};" id="pbg-${i}"></div>
          <div class="preview-overlay"></div>
          <div class="preview-timestamp">${ts}</div>
          <div class="preview-corner" style="background:${accent};" id="pcorner-${i}">SCENE 1 — HOOK</div>
          <div class="preview-content">
            <div class="preview-scene-lbl" id="pscenelbl-${i}">DELIVER AS: ${v.hook_style||'BOLD'}</div>
            <div class="preview-main-text" style="color:${textCol};" id="pmain-${i}">${escHtml(v.scene1_hook || v.hook)}</div>
          </div>
          <div class="preview-chyron">
            <div class="chyron-brand" style="background:${accent};" id="pchbrand-${i}">FRIED OCEAN</div>
            <div class="chyron-scrolling">
              <div class="chyron-txt" id="pchtxt-${i}">${escHtml(v.scene2_headline)}</div>
            </div>
          </div>
        </div>

        <div class="scene-nav">
          <button class="scene-btn active" onclick="setScene(event,${i},1)">S1: HOOK</button>
          <button class="scene-btn" onclick="setScene(event,${i},2)">S2: HEADLINE</button>
          <button class="scene-btn" onclick="setScene(event,${i},3)">S3: DETAIL</button>
          <button class="scene-btn" onclick="setScene(event,${i},4)">S4: CTA</button>
        </div>

        <div class="copy-grid">
          <div class="copy-cell">
            <div class="copy-lbl">HOOK</div>
            <div class="copy-val display">${escHtml(v.hook)}</div>
          </div>
          <div class="copy-cell">
            <div class="copy-lbl">DELIVERY</div>
            <div class="copy-val mono">${v.hook_style||'BOLD'}</div>
          </div>
          <div class="copy-cell" style="grid-column:1/-1">
            <div class="copy-lbl">CAPTION (READY TO PASTE)</div>
            <div class="copy-val">${escHtml(v.caption)}</div>
          </div>
          <div class="copy-cell" style="grid-column:1/-1">
            <div class="copy-lbl">HASHTAGS</div>
            <div class="tags-row">${(v.hashtags||[]).map(h=>`<span class="tag">${escHtml(h)}</span>`).join('')}</div>
          </div>
          <div class="copy-cell">
            <div class="copy-lbl">SCENE 2 — HEADLINE CHYRON</div>
            <div class="copy-val">${escHtml(v.scene2_headline)}</div>
          </div>
          <div class="copy-cell">
            <div class="copy-lbl">SCENE 3 — DETAIL</div>
            <div class="copy-val">${escHtml(v.scene3_detail)}</div>
          </div>
          <div class="copy-cell">
            <div class="copy-lbl">SCENE 4 — CTA</div>
            <div class="copy-val">${escHtml(v.scene4_cta)}</div>
          </div>
          <div class="copy-cell">
            <div class="copy-lbl">VISUAL DIRECTION</div>
            <div class="copy-val" style="color:var(--muted);font-size:13px;">${escHtml(v.visual_direction)}</div>
          </div>
        </div>

        <div class="ffmpeg-section">
          <div class="ffmpeg-lbl">FFMPEG COMMAND — VIDEO ${String(i+1).padStart(2,'0')} — COPY AND RUN ON YOUR SERVER</div>
          <pre class="ffmpeg-code" id="ffcmd-${i}">${escHtml(ffcmd)}</pre>
        </div>

        <div class="render-section" id="render-${i}">
          <div class="render-status" id="render-status-${i}"></div>
          <video id="render-video-${i}" controls playsinline style="display:none;width:100%;max-height:400px;background:#000;"></video>
        </div>

        <div class="card-actions">
          <button class="act-btn danger" onclick="renderVideo(${i}, this)">▶ RENDER VIDEO</button>
          <button class="act-btn" onclick="copyCaption(${i}, this)">COPY CAPTION</button>
          <button class="act-btn" onclick="copyBrief(${i}, this)">COPY BRIEF</button>
          <button class="act-btn hi" onclick="copyAllBriefs(this)">COPY ALL ↗</button>
        </div>
      </div>
    `;
    out.appendChild(card);
  });
}

function setScene(e, cardIdx, sceneNum) {
  e.stopPropagation();
  const v = JSON.parse(document.querySelectorAll('.vcard')[cardIdx].dataset.v);
  const bg = document.querySelectorAll('.vcard')[cardIdx].dataset.bg;
  const textCol = document.querySelectorAll('.vcard')[cardIdx].dataset.textcol;
  const accent = document.querySelectorAll('.vcard')[cardIdx].dataset.accent;

  const scenes = {
    1: { lbl: 'SCENE 1 — HOOK', main: v.scene1_hook || v.hook, chyron: v.scene2_headline, corner: 'SCENE 1 — HOOK' },
    2: { lbl: 'SCENE 2 — HEADLINE', main: v.scene2_headline, chyron: v.scene2_headline, corner: 'SCENE 2 — HEADLINE' },
    3: { lbl: 'SCENE 3 — DETAIL', main: v.scene3_detail, chyron: v.scene2_headline, corner: 'SCENE 3 — DETAIL' },
    4: { lbl: 'SCENE 4 — CTA', main: v.scene4_cta, chyron: v.cta, corner: 'SCENE 4 — CTA' },
  };
  const s = scenes[sceneNum];

  document.getElementById(`pbg-${cardIdx}`).style.background = sceneNum === 4 ? '#000000' : bg;
  document.getElementById(`pmain-${cardIdx}`).textContent = s.main;
  document.getElementById(`pmain-${cardIdx}`).style.color = sceneNum === 4 ? '#ffffff' : textCol;
  document.getElementById(`pscenelbl-${cardIdx}`).textContent = s.lbl;
  document.getElementById(`pchtxt-${cardIdx}`).textContent = s.chyron;
  document.getElementById(`pcorner-${cardIdx}`).textContent = s.corner;
  document.getElementById(`pchbrand-${cardIdx}`).style.background = accent;

  const nav = document.getElementById(`vbody-${cardIdx}`).querySelector('.scene-nav');
  nav.querySelectorAll('.scene-btn').forEach((b,idx) => b.classList.toggle('active', idx === sceneNum-1));
}

function toggleCard(hdr) {
  const body = hdr.nextElementSibling;
  const arrow = hdr.querySelector('.vcard-arrow');
  const open = body.classList.toggle('open');
  arrow.textContent = open ? '▲' : '▼';
  if (open) hdr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function buildFFmpeg(v, num) {
  const bg = (v.bg_color || '#000000').replace('#','');
  const accent = (v.accent_color || '#cc2200').replace('#','');
  const txtCol = (v.text_color === '#ffffff' || !v.text_color) ? 'white' : 'black';
  const out = `video_${String(num).padStart(2,'0')}.mp4`;
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

  const esc = s => (s||'').replace(/'/g,"\\'").replace(/:/g,'\\:').replace(/\[/g,'\\[').replace(/\]/g,'\\]');

  const hook = esc(v.scene1_hook || v.hook);
  const hdln = esc(v.scene2_headline || '');
  const dtl  = esc(v.scene3_detail  || '');
  const cta  = esc(v.scene4_cta    || '');

  return `ffmpeg \\
  -f lavfi -i "color=c=0x${bg}:size=1080x1920:rate=30" \\
  -f lavfi -i "color=c=0x${bg}:size=1080x1920:rate=30" \\
  -f lavfi -i "color=c=0x${bg}:size=1080x1920:rate=30" \\
  -f lavfi -i "color=c=000000:size=1080x1920:rate=30" \\
  -filter_complex "
    [0:v]
      drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
      drawtext=fontfile=${font}:
        text='FRIED OCEAN':fontcolor=white:fontsize=36:
        x=24:y=1851,
      drawrect=x=300:y=1830:w=780:h=90:color=black@0.88:t=fill,
      drawtext=fontfile=${font}:
        text='${hdln}':fontcolor=white:fontsize=26:
        x=316:y=1851:
        textfile_size=760x80,
      drawtext=fontfile=${font}:
        text='${hook}':fontcolor=${txtCol}:fontsize=110:
        x=(w-text_w)/2:y=(h*0.38-text_h/2):
        alpha='if(lt(t,0.25),t/0.25,1)':
        shadowcolor=black@0.5:shadowx=4:shadowy=6
    [s1];
    [1:v]
      drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
      drawtext=fontfile=${font}:
        text='BREAKING':fontcolor=white:fontsize=32:
        x=24:y=1855,
      drawrect=x=240:y=1830:w=840:h=90:color=black@0.88:t=fill,
      drawtext=fontfile=${font}:
        text='${hdln}':fontcolor=white:fontsize=26:
        x=256:y=1851:
        textfile_size=820x80,
      drawtext=fontfile=${font}:
        text='${hdln}':fontcolor=${txtCol}:fontsize=86:
        x=(w-text_w)/2:y=(h*0.4-text_h/2):
        alpha='if(lt(t,0.2),t/0.2,1)':
        shadowcolor=black@0.5:shadowx=3:shadowy=5
    [s2];
    [2:v]
      drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
      drawtext=fontfile=${font}:
        text='FRIED OCEAN':fontcolor=white:fontsize=36:
        x=24:y=1851,
      drawrect=x=300:y=1830:w=780:h=90:color=black@0.88:t=fill,
      drawtext=fontfile=${font}:
        text='${dtl}':fontcolor=white:fontsize=24:
        x=316:y=1855:
        textfile_size=760x80,
      drawtext=fontfile=${font}:
        text='${dtl}':fontcolor=${txtCol}:fontsize=68:
        x=(w-text_w)/2:y=(h*0.42-text_h/2):
        alpha='if(lt(t,0.3),t/0.3,1)':
        shadowcolor=black@0.5:shadowx=2:shadowy=4
    [s3];
    [3:v]
      drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
      drawtext=fontfile=${font}:
        text='FRIED OCEAN':fontcolor=white:fontsize=36:
        x=24:y=1851,
      drawrect=x=300:y=1830:w=780:h=90:color=black@0.88:t=fill,
      drawtext=fontfile=${font}:
        text='friedocean.com':fontcolor=white:fontsize=24:
        x=316:y=1855,
      drawtext=fontfile=${font}:
        text='${cta}':fontcolor=white:fontsize=96:
        x=(w-text_w)/2:y=(h*0.38-text_h/2):
        alpha='if(lt(t,0.25),t/0.25,1)':
        shadowcolor=0x${accent}@0.8:shadowx=4:shadowy=4,
      drawrect=x=120:y=(h*0.38+text_h/2+80):w=840:h=5:
        color=0x${accent}@1:t=fill
    [s4];
    [s1][s2][s3][s4]concat=n=4:v=1:a=0[vout]
  " \\
  -map "[vout]" \\
  -c:v libx264 -pix_fmt yuv420p \\
  -r 30 -t 12 -preset fast \\
  -movflags +faststart \\
  ${out}`;
}

// ── Copy helpers ────────────────────────────────────
function copyText(elId, btn, label) {
  const el = document.getElementById(elId);
  navigator.clipboard.writeText(el.textContent).then(() => flash(btn, label || 'COPY', 'COPIED ✓'));
}

function copyCaption(idx, btn) {
  const v = JSON.parse(document.querySelectorAll('.vcard')[idx].dataset.v);
  const text = v.caption + '\n\n' + (v.hashtags||[]).join(' ');
  navigator.clipboard.writeText(text).then(() => flash(btn, 'COPY CAPTION', 'COPIED ✓'));
}

function copyBrief(idx, btn) {
  const v = JSON.parse(document.querySelectorAll('.vcard')[idx].dataset.v);
  const text = [
    `VIDEO ${idx+1} BRIEF`,
    `─────────────────────`,
    `HOOK: ${v.hook}`,
    `DELIVERY: ${v.hook_style}`,
    `ENERGY: ${v.energy_level}/10`,
    ``,
    `CAPTION:`,
    v.caption,
    ``,
    `HASHTAGS: ${(v.hashtags||[]).join(' ')}`,
    ``,
    `SCENE 1 (HOOK): ${v.scene1_hook}`,
    `SCENE 2 (HEADLINE): ${v.scene2_headline}`,
    `SCENE 3 (DETAIL): ${v.scene3_detail}`,
    `SCENE 4 (CTA): ${v.scene4_cta}`,
    ``,
    `VISUAL: ${v.visual_direction}`,
  ].join('\n');
  navigator.clipboard.writeText(text).then(() => flash(btn, 'COPY BRIEF', 'COPIED ✓'));
}

function copyAllBriefs(btn) {
  const cards = document.querySelectorAll('.vcard');
  const all = Array.from(cards).map((c,i) => {
    const v = JSON.parse(c.dataset.v);
    return [
      `══ VIDEO ${i+1} ══`,
      `HOOK: ${v.hook}  [${v.hook_style}]`,
      `CAPTION: ${v.caption}`,
      `HASHTAGS: ${(v.hashtags||[]).join(' ')}`,
      `S1: ${v.scene1_hook} | S2: ${v.scene2_headline} | S3: ${v.scene3_detail} | S4: ${v.scene4_cta}`,
    ].join('\n');
  }).join('\n\n');
  navigator.clipboard.writeText(all).then(() => flash(btn, 'COPY ALL ↗', 'ALL COPIED ✓'));
}

function flash(btn, original, msg) {
  btn.textContent = msg;
  setTimeout(() => btn.textContent = original, 1600);
}

function escHtml(str) {
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Keyboard shortcut ────────────────────────────────

const CREATOMATE_TEMPLATE_ID = '612bea09-5b1a-4be5-86b2-e7e51457e28e';

async function renderVideo(idx, btn) {
  const v = JSON.parse(document.querySelectorAll('.vcard')[idx].dataset.v);
  const statusEl = document.getElementById(`render-status-${idx}`);
  const videoEl = document.getElementById(`render-video-${idx}`);
  const origLabel = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'RENDERING...';
  videoEl.style.display = 'none';
  statusEl.innerHTML = '<div class="render-spinner"></div>SUBMITTING TO RAILWAY...';

  try {
    const submitRes = await fetch('/api/creatomate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modifications: {
        hook: v.scene1_hook || v.hook,
        scene2_headline: v.scene2_headline,
        scene3_detail: v.scene3_detail,
        scene4_cta: v.scene4_cta,
        background_color_1: v.bg_color || '#000000',
        background_color_2: v.bg_color || '#000000',
        text_color_1: v.text_color || '#ffffff',
        text_color_2: v.text_color || '#ffffff',
        accent_color: v.accent_color || '#cc2200',
        article_url: document.getElementById('article_url').value.trim() || '',
        variant_index: idx
      }})
    });

    if (!submitRes.ok) {
      const e = await submitRes.json().catch(() => ({}));
      throw new Error(e.error || `Server error ${submitRes.status}`);
    }

    const job = await submitRes.json();
    const jobId = job.job_id;
    if (!jobId) throw new Error(JSON.stringify(job));

    statusEl.innerHTML = '<div class="render-spinner"></div>BUILDING VIDEO ON RAILWAY...';

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > 90) {
        clearInterval(poll);
        statusEl.innerHTML = '⚠ TIMED OUT';
        btn.disabled = false;
        btn.textContent = origLabel;
        return;
      }
      try {
        const r = await fetch(`/api/creatomate?job_id=${jobId}`);
        const data = await r.json();

        if (data.status === 'complete' && data.files && data.files.length > 0) {
          clearInterval(poll);
          const url = data.files[0].url;
          statusEl.innerHTML = '✓ RENDER COMPLETE — CLICK TO DOWNLOAD';
          statusEl.style.cursor = 'pointer';
          statusEl.onclick = () => window.open(url, '_blank');
          videoEl.src = url;
          videoEl.style.display = 'block';
          btn.textContent = '↓ DOWNLOAD';
          btn.disabled = false;
          btn.onclick = () => window.open(url, '_blank');
        } else if (data.status === 'failed') {
          clearInterval(poll);
          statusEl.innerHTML = `⚠ FAILED: ${data.error || 'unknown'}`;
          btn.disabled = false;
          btn.textContent = origLabel;
        } else {
          statusEl.innerHTML = `<div class="render-spinner"></div>BUILDING... (${data.progress || 0}%)`;
        }
      } catch(e) {}
    }, 3000);

  } catch(err) {
    statusEl.innerHTML = `⚠ ${err.message}`;
    btn.disabled = false;
    btn.textContent = origLabel;
  }
}

// DEAD CODE REPLACED - old renderVideo below this point is removed
function _OLD_renderVideo(idx, btn) {
}

<!-- 1775872593 -->