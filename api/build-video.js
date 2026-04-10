// api/build-video.js
// Railway Node.js server — receives video briefs, runs FFmpeg, uploads to Supabase
// POST /build  →  { videos: [...], job_id: "..." }
// GET  /status/:job_id  →  { status, progress, files: [] }

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const TMP = '/tmp/fo-videos';
fs.mkdirSync(TMP, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory job store (replace with Supabase for persistence)
const jobs = {};

// ─── POST /build ───────────────────────────────────────────────────────────────
app.post('/build', async (req, res) => {
  const { videos } = req.body;
  if (!videos || !Array.isArray(videos)) {
    return res.status(400).json({ error: 'videos array required' });
  }

  const jobId = uuid();
  jobs[jobId] = { status: 'queued', progress: 0, total: videos.length, files: [], errors: [] };
  res.json({ job_id: jobId, message: `Building ${videos.length} videos` });

  // Run async in background
  buildVideos(jobId, videos).catch(err => {
    jobs[jobId].status = 'failed';
    jobs[jobId].error = err.message;
  });
});

// ─── GET /status/:jobId ────────────────────────────────────────────────────────
app.get('/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ─── GET /health ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// ─── Core build function ───────────────────────────────────────────────────────
async function buildVideos(jobId, videos) {
  jobs[jobId].status = 'building';
  const job = jobs[jobId];

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const vidNum = String(i + 1).padStart(2, '0');
    const localPath = path.join(TMP, `${jobId}_video_${vidNum}.mp4`);

    try {
      job.progress = Math.round((i / videos.length) * 100);
      console.log(`[${jobId}] Building video ${vidNum}/${videos.length}...`);

      await renderVideo(v, vidNum, localPath);

      // Upload to Supabase
      const remotePath = `fried-ocean-videos/${jobId}/video_${vidNum}.mp4`;
      const fileBuffer = fs.readFileSync(localPath);
      const { error: uploadErr } = await supabase.storage
        .from('videos')
        .upload(remotePath, fileBuffer, { contentType: 'video/mp4', upsert: true });

      if (uploadErr) throw new Error(`Supabase upload failed: ${uploadErr.message}`);

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(remotePath);
      job.files.push({
        index: i + 1,
        url: urlData.publicUrl,
        hook: v.hook,
        caption: v.caption,
        hashtags: v.hashtags,
        energy_level: v.energy_level,
      });

      // Clean up local temp file
      fs.unlinkSync(localPath);
      console.log(`[${jobId}] Video ${vidNum} done → ${urlData.publicUrl}`);

    } catch (err) {
      console.error(`[${jobId}] Video ${vidNum} failed:`, err.message);
      job.errors.push({ index: i + 1, error: err.message });
    }
  }

  job.progress = 100;
  job.status = job.errors.length === videos.length ? 'failed' : 'complete';
  console.log(`[${jobId}] Job complete. ${job.files.length} videos built, ${job.errors.length} errors.`);
}

// ─── FFmpeg render ─────────────────────────────────────────────────────────────
function renderVideo(v, vidNum, outputPath) {
  return new Promise((resolve, reject) => {
    const bg    = (v.bg_color     || '#000000').replace('#', '');
    const accent = (v.accent_color || '#cc2200').replace('#', '');
    const txtCol = v.text_color === '#ffffff' ? 'white' : 'black';
    const font   = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

    const esc = s => (s || '').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const hook  = esc(v.scene1_hook  || v.hook);
    const hdln  = esc(v.scene2_headline || '');
    const dtl   = esc(v.scene3_detail   || '');
    const cta   = esc(v.scene4_cta      || '');
    const siteUrl = esc(v.cta || 'friedocean.com');

    // Scene durations: hook=3s, headline=2.5s, detail=3.5s, cta=3s = 12s total
    const filterComplex = `
      color=c=0x${bg}:size=1080x1920:rate=30[bg0];
      color=c=0x${bg}:size=1080x1920:rate=30[bg1];
      color=c=0x${bg}:size=1080x1920:rate=30[bg2];
      color=c=000000:size=1080x1920:rate=30[bg3];
      [bg0]
        drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
        drawtext=fontfile=${font}:text='FRIED OCEAN':fontcolor=white:fontsize=36:x=24:y=1851,
        drawrect=x=300:y=1830:w=780:h=90:color=black@0.9:t=fill,
        drawtext=fontfile=${font}:text='${hdln}':fontcolor=white:fontsize=26:x=316:y=1851,
        drawtext=fontfile=${font}:text='${hook}':fontcolor=${txtCol}:fontsize=100:
          x=(w-text_w)/2:y=720:
          alpha='if(lt(t,0.25),t/0.25,1)':
          shadowcolor=black@0.5:shadowx=4:shadowy=6,
        trim=duration=3,setpts=PTS-STARTPTS
      [s0];
      [bg1]
        drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
        drawtext=fontfile=${font}:text='BREAKING':fontcolor=white:fontsize=32:x=24:y=1855,
        drawrect=x=240:y=1830:w=840:h=90:color=black@0.9:t=fill,
        drawtext=fontfile=${font}:text='${hdln}':fontcolor=white:fontsize=26:x=256:y=1851,
        drawtext=fontfile=${font}:text='${hdln}':fontcolor=${txtCol}:fontsize=82:
          x=(w-text_w)/2:y=760:
          alpha='if(lt(t,0.2),t/0.2,1)':
          shadowcolor=black@0.5:shadowx=3:shadowy=5,
        trim=duration=2.5,setpts=PTS-STARTPTS
      [s1];
      [bg2]
        drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
        drawtext=fontfile=${font}:text='FRIED OCEAN':fontcolor=white:fontsize=36:x=24:y=1851,
        drawrect=x=300:y=1830:w=780:h=90:color=black@0.9:t=fill,
        drawtext=fontfile=${font}:text='${dtl}':fontcolor=white:fontsize=24:x=316:y=1855,
        drawtext=fontfile=${font}:text='${dtl}':fontcolor=${txtCol}:fontsize=68:
          x=(w-text_w)/2:y=800:
          alpha='if(lt(t,0.3),t/0.3,1)':
          shadowcolor=black@0.5:shadowx=2:shadowy=4,
        trim=duration=3.5,setpts=PTS-STARTPTS
      [s2];
      [bg3]
        drawrect=x=0:y=1830:w=1080:h=90:color=0x${accent}@1:t=fill,
        drawtext=fontfile=${font}:text='FRIED OCEAN':fontcolor=white:fontsize=36:x=24:y=1851,
        drawrect=x=300:y=1830:w=780:h=90:color=black@0.9:t=fill,
        drawtext=fontfile=${font}:text='${siteUrl}':fontcolor=white:fontsize=24:x=316:y=1855,
        drawtext=fontfile=${font}:text='${cta}':fontcolor=white:fontsize=96:
          x=(w-text_w)/2:y=680:
          alpha='if(lt(t,0.25),t/0.25,1)':
          shadowcolor=0x${accent}@0.9:shadowx=4:shadowy=4,
        drawrect=x=120:y=980:w=840:h=6:color=0x${accent}@1:t=fill,
        trim=duration=3,setpts=PTS-STARTPTS
      [s3];
      [s0][s1][s2][s3]concat=n=4:v=1:a=0[vout]
    `.replace(/\n\s*/g, ' ').trim();

    ffmpeg()
      .inputOptions(['-f', 'lavfi', '-i', `color=c=black:size=1080x1920:rate=30`])
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[vout]',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        '-t', '12',
        '-preset', 'fast',
        '-movflags', '+faststart',
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

app.listen(PORT, () => {
  console.log(`Fried Ocean Video Builder running on port ${PORT}`);
});
