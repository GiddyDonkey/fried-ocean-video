# FRIED OCEAN — Video Command Center

Satirical content video generator. Generates hooks, captions, FFmpeg commands,
and (via Railway) actual MP4 files — all from a headline.

---

## Architecture

```
Browser (Vercel)           Railway (optional)
─────────────────          ──────────────────
public/index.html    →     api/build-video.js
api/generate.js            (FFmpeg + Supabase upload)
(Anthropic API)
```

- **Vercel**: hosts the frontend + `/api/generate` serverless function
- **Railway**: runs the FFmpeg video builder (optional — you can use the FFmpeg commands locally too)

---

## Deploy to Vercel (step by step)

### Option A — GitHub (recommended, auto-deploys on push)

1. Create a new GitHub repo called `fried-ocean-video`
2. Push this folder:
   ```bash
   cd fried-ocean
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/YOUR_USERNAME/fried-ocean-video.git
   git push -u origin main
   ```
3. Go to vercel.com → Log in → "Add New Project"
4. Click "Import Git Repository" → select `fried-ocean-video`
5. Framework Preset: **Other**
6. Root Directory: leave blank (or `./`)
7. Build Command: leave blank
8. Output Directory: `public`
9. Click "Environment Variables" → Add:
   - `ANTHROPIC_API_KEY` = your key (sk-ant-...)
10. Click "Deploy"
11. Your URL: `https://fried-ocean-video.vercel.app`

### Option B — Drag and drop (fastest, no GitHub needed)

1. Go to vercel.com/new
2. Drag the entire `fried-ocean` folder onto the page
3. Set output directory to `public`
4. Add `ANTHROPIC_API_KEY` environment variable
5. Deploy

### Option C — Vercel CLI

```bash
npm i -g vercel
cd fried-ocean
vercel --prod
# Follow prompts, set output dir to public
```

---

## Deploy video builder to Railway (optional)

Only needed if you want actual MP4 files built server-side.

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select `fried-ocean-video`
3. Railway will detect `nixpacks.toml` and install FFmpeg automatically
4. Add environment variables in Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Copy the Railway URL
6. In Vercel dashboard → add env var:
   - `NEXT_PUBLIC_VIDEO_BUILDER_URL` = your Railway URL

---

## Using the tool

1. Open your Vercel URL
2. Enter your Anthropic API key (if not set in Vercel env vars)
3. Paste a Fried Ocean headline
4. Choose tone, count, platform
5. Hit Generate (or Cmd+Enter)
6. Each video card gives you:
   - Hook + delivery style
   - Caption ready to paste
   - Hashtags
   - Per-scene text for all 4 scenes
   - FFmpeg command to run locally or on Railway

---

## Running FFmpeg locally

```bash
# Install FFmpeg on Mac
brew install ffmpeg

# Copy an FFmpeg command from any video card and run it
ffmpeg -f lavfi -i "color=c=0x000000:..." ...
```

---

## Supabase storage bucket

Create a bucket called `videos` in your Supabase project with public access enabled.

```sql
-- In Supabase SQL editor
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true);
```
