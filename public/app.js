// ── State ────────────────────────────────────────────
let generatedVideos = [];
let selectedIdx = null;

// ── Status ───────────────────────────────────────────
const STATUS_MSGS = ['CONTACTING SOURCES...','BRIEFING THE ANCHORS...','RUNNING THE NUMBERS...','FACT-CHECKING (SKIPPED)...','CLEARING WITH LEGAL...','GOING TO PRESS...'];
let _mi = 0, _mt;
function startStatus() { _mi = 0; setStatus(STATUS_MSGS[0], true); _mt = setInterval(() => { _mi = (_mi+1) % STATUS_MSGS.length; setStatus(STATUS_MSGS[_mi], true); }, 1900); }
function stopStatus() { clearInterval(_mt); }
function setStatus(t, active) { const b = document.getElementById('status-bar'); b.className = 'status-wrap' + (active ? ' active' : ''); document.getElementById('status-txt').textContent = t; }
function showErr(m) { const b = document.getElementById('error-box'); b.style.display = 'block'; b.textContent = '⚠  ' + m; }
function hideErr() { document.getElementById('error-box').style.display = 'none'; }

// ── Generate ─────────────────────────────────────────
const TONES = [
  { key: 'outrage bait', label: 'OUTRAGE BAIT', desc: 'Maximum emotional reaction' },
  { key: 'unhinged absurdist', label: 'UNHINGED', desc: 'Scroll-stopping weirdness' },
  { key: 'dry deadpan', label: 'DEADPAN', desc: 'The "wait what" reaction' },
];

async function handleGenerate() {
  const headline = document.getElementById('headline').value.trim();
  const subheadline = document.getElementById('subheadline').value.trim();
  const article_url = document.getElementById('article_url').value.trim();

  hideErr();
  if (!headline) { showErr('HEADLINE REQUIRED.'); return; }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  startStatus();

  try {
    // Fire 3 parallel requests, one per tone
    const requests = TONES.map(t =>
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, subheadline, article_url, tone: t.key, video_count: 1, platform: 'Instagram Reels and TikTok' }),
      }).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error || `Error ${r.status}`); }))
    );

    const results = await Promise.all(requests);
    generatedVideos = results.map((r, i) => ({ ...r.videos[0], _tone: TONES[i] }));
    selectedIdx = null;
    stopStatus();
    setStatus('RENDERING ALL 3 VIDEOS...');
    renderGrid(generatedVideos, article_url);
    // Auto-render all 3 in parallel
    Promise.all([0, 1, 2].map(i => renderOne(i))).then(() => {
      setStatus('3 VIDEOS READY — SELECT ONE TO POST');
    });
  } catch(err) {
    stopStatus();
    setStatus('');
    showErr(err.message);
  } finally {
    btn.disabled = false;
  }
}

// ── Render Grid ──────────────────────────────────────
function renderGrid(videos, article_url) {
  const wrap = document.getElementById('videos-wrap');
  const grid = document.getElementById('videos-grid');
  const postPanel = document.getElementById('post-panel');
  const capPanel = document.getElementById('caption-panel');
  wrap.style.display = 'block';
  postPanel.classList.remove('show');
  capPanel.classList.remove('show');
  grid.innerHTML = '';

  const STYLES = [
    { bg: '#0a0a0a' }, { bg: '#cc2200' }, { bg: '#0a1628' }
  ];

  videos.forEach((v, i) => {
    const style = STYLES[i % STYLES.length];
    const card = document.createElement('div');
    card.className = 'vcard';
    card.dataset.v = JSON.stringify(v);
    card.dataset.idx = i;
    card.dataset.article_url = article_url || '';
    card.onclick = () => selectCard(i);

    const bg = v.bg_color || style.bg;
    const textCol = v.text_color || '#ffffff';
    const accent = v.accent_color || '#cc2200';

    card.innerHTML = `
      <div class="vcard-num">${i+1}</div>
      <div class="vcard-tone-badge" style="position:absolute;top:10px;right:10px;font-family:var(--font-mono);font-size:9px;letter-spacing:1px;color:#fff;background:rgba(0,0,0,0.6);padding:3px 7px;border-radius:3px;z-index:3;">${v._tone ? v._tone.label : ''}</div>
      <div class="vcard-preview" id="preview-${i}">
        <video id="video-${i}" autoplay muted loop playsinline></video>
        <div class="vcard-bg" style="background:${bg};"></div>
        <div class="vcard-hook" style="color:${textCol};">${escHtml(v.scene1_hook || v.hook)}</div>
        <div class="vcard-chyron">
          <div class="chyron-brand" style="background:${accent};">FRIED OCEAN</div>
          <div class="chyron-ticker">${escHtml(v.scene2_headline || '')}</div>
        </div>
      </div>
      <div class="render-status" id="rstatus-${i}">CLICK TO SELECT · RENDER READY</div>
      <div class="vcard-footer">
        <button class="cap-btn" style="flex:1;" onclick="event.stopPropagation(); showCaption(${i})">COPY CAPTION</button>
        <button class="cap-btn" id="rbtn-${i}" onclick="event.stopPropagation(); window.open(document.querySelectorAll('.vcard')[${i}].dataset.url||'#','_blank')">↓ DL</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── Select Card ──────────────────────────────────────
function selectCard(idx) {
  selectedIdx = idx;
  document.querySelectorAll('.vcard').forEach((c, i) => {
    c.classList.toggle('selected', i === idx);
  });
  const v = generatedVideos[idx];
  const postPanel = document.getElementById('post-panel');
  postPanel.classList.add('show');
  document.getElementById('post-hdr-sub').textContent = `VIDEO ${idx+1} — ${(v.hook||'').toUpperCase()}`;
  ['btn-tiktok','btn-reels','btn-shorts'].forEach(id => {
    document.getElementById(id).disabled = false;
  });
  document.getElementById('post-status').textContent = '';
  showCaption(idx);
}

// ── Show Caption ─────────────────────────────────────
function showCaption(idx) {
  const v = generatedVideos[idx];
  const panel = document.getElementById('caption-panel');
  panel.classList.add('show');
  document.getElementById('cap-text').textContent = v.caption || '';
  const tagsRow = document.getElementById('tags-row');
  tagsRow.innerHTML = (v.hashtags||[]).map(h => `<span class="tag">${escHtml(h)}</span>`).join('');
}

// ── Copy Caption ─────────────────────────────────────
function copyCap() {
  if (selectedIdx === null) return;
  const v = generatedVideos[selectedIdx];
  const text = (v.caption||'') + '\n\n' + (v.hashtags||[]).join(' ');
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-cap-btn');
    btn.textContent = 'COPIED ✓';
    setTimeout(() => btn.textContent = 'COPY CAPTION + TAGS', 1500);
  });
}

// ── Render One Video ─────────────────────────────────
async function renderOne(idx) {
  const v = generatedVideos[idx];
  const cards = document.querySelectorAll('.vcard');
  const card = cards[idx];
  const article_url = card.dataset.article_url || '';
  const statusEl = document.getElementById(`rstatus-${idx}`);
  const btn = document.getElementById(`rbtn-${idx}`);
  const videoEl = document.getElementById(`video-${idx}`);
  const origLabel = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'RENDERING...';
  statusEl.className = 'render-status rendering';
  statusEl.innerHTML = '<div class="rs-spin"></div>SUBMITTING TO RAILWAY...';

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
        article_url: article_url,
        variant_index: idx
      }})
    });

    if (!submitRes.ok) { const e = await submitRes.json().catch(() => ({})); throw new Error(e.error || `Error ${submitRes.status}`); }
    const job = await submitRes.json();
    const jobId = job.job_id;
    if (!jobId) throw new Error(JSON.stringify(job));

    statusEl.innerHTML = '<div class="rs-spin"></div>BUILDING VIDEO...';

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > 90) { clearInterval(poll); statusEl.className = 'render-status'; statusEl.textContent = '⚠ TIMED OUT'; btn.disabled = false; btn.textContent = origLabel; return; }
      try {
        const r = await fetch(`/api/creatomate?job_id=${jobId}`);
        const data = await r.json();
        if (data.status === 'complete' && data.files && data.files.length > 0) {
          clearInterval(poll);
          const url = data.files[0].url;
          statusEl.className = 'render-status done';
          statusEl.textContent = '✓ RENDER COMPLETE — CLICK TO DOWNLOAD';
          statusEl.onclick = () => window.open(url, '_blank');
          videoEl.src = url;
          videoEl.autoplay = true;
          videoEl.muted = true;
          videoEl.loop = true;
          videoEl.playsInline = true;
          videoEl.classList.add('loaded');
          videoEl.play().catch(() => {});
          // Hide placeholder
          const bg = card.querySelector('.vcard-bg');
          const hook = card.querySelector('.vcard-hook');
          const chyron = card.querySelector('.vcard-chyron');
          if (bg) bg.style.display = 'none';
          if (hook) hook.style.display = 'none';
          if (chyron) chyron.style.display = 'none';
          btn.textContent = '↓ DOWNLOAD';
          btn.disabled = false;
          btn.onclick = (e) => { e.stopPropagation(); window.open(url, '_blank'); };
          // Store URL for posting
          card.dataset.url = url;
          setStatus(`VIDEO ${idx+1} RENDERED — SELECT AND POST`);
        } else if (data.status === 'failed') {
          clearInterval(poll);
          statusEl.className = 'render-status';
          statusEl.textContent = `⚠ FAILED: ${data.error || 'unknown'}`;
          btn.disabled = false;
          btn.textContent = origLabel;
        } else {
          statusEl.innerHTML = `<div class="rs-spin"></div>BUILDING... (${data.progress || 0}%)`;
        }
      } catch(e) {}
    }, 3000);

  } catch(err) {
    statusEl.className = 'render-status';
    statusEl.textContent = `⚠ ${err.message}`;
    btn.disabled = false;
    btn.textContent = origLabel;
  }
}

// ── Post To Platform ─────────────────────────────────
async function postTo(platform) {
  if (selectedIdx === null) return;
  const card = document.querySelectorAll('.vcard')[selectedIdx];
  const videoUrl = card.dataset.url;
  const v = generatedVideos[selectedIdx];

  if (!videoUrl) {
    document.getElementById('post-status').textContent = '⚠ Render this video first before posting.';
    return;
  }

  const statusEl = document.getElementById('post-status');
  const platformNames = { tiktok: 'TikTok', reels: 'Instagram Reels', shorts: 'YouTube Shorts' };
  const platformName = platformNames[platform];

  // For now — copy the video URL and caption to clipboard, open the platform
  const caption = (v.caption || '') + '\n\n' + (v.hashtags || []).join(' ');
  await navigator.clipboard.writeText(caption).catch(() => {});

  const urls = {
    tiktok: 'https://www.tiktok.com/upload',
    reels: 'https://www.instagram.com/reels/new',
    shorts: 'https://studio.youtube.com'
  };

  statusEl.innerHTML = `✓ Caption copied to clipboard. <a href="${videoUrl}" target="_blank" style="color:var(--black);font-weight:500;">Download video</a> then post to <a href="${urls[platform]}" target="_blank" style="color:var(--black);font-weight:500;">${platformName}</a>.`;
}

// ── Helpers ───────────────────────────────────────────
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Keyboard ──────────────────────────────────────────
document.addEventListener('keydown', e => { if ((e.metaKey||e.ctrlKey) && e.key === 'Enter') handleGenerate(); });
