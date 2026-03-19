# TMRW Comms Portal

Member journey communications tracker and ops tool.

## Deploy to Vercel

### Option A: Via GitHub (recommended)

1. Create a new repo on GitHub (e.g. `tmrw-comms-portal`)
2. Push this folder to it:
   ```bash
   cd tmrw-portal
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/tmrw-comms-portal.git
   git push -u origin main
   ```
3. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
4. Framework Preset: **Vite** (should auto-detect)
5. Click Deploy

### Option B: Via Vercel CLI

```bash
npm i -g vercel
cd tmrw-portal
vercel
```

Follow the prompts. Done.

## Local Development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Data Storage

Data persists in the browser's localStorage. Each browser/device has its own copy. Use the Download CSV button to export, or Reset to restore defaults.
