# GitHub + Render.com Workflow

## ✅ Security Setup Complete

Your `.gitignore` now excludes:
- `build/` - Never commit this! Contains built files with server code
- `.env.local` - Your local API keys
- `node_modules/` - Dependencies
- `.svelte-kit/` - Build cache

## Workflow for GitHub + Render.com

### 1. Initial Setup (One Time)
```bash
# Initialize git
git init

# Add all files (build/ will be excluded automatically)
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub remote
git remote add origin YOUR_GITHUB_REPO_URL

# Push to GitHub
git push -u origin main
```

### 2. On Render.com Dashboard

**Environment Variables** (under "Environment" tab):
```
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
node build
```

### 3. How It Works

1. You push **source code only** to GitHub (no `build/` folder)
2. Render.com pulls your code from GitHub
3. Render.com runs `npm run build` on their servers using the environment variables you set
4. Render.com starts your app with `node build`
5. Your API keys **never** appear in GitHub - they only exist on Render's servers

## What Gets Committed to GitHub

✅ Source code (`src/` folder)
✅ Configuration files (`svelte.config.js`, `package.json`)
✅ `.env.example` (template without real keys)
✅ `.gitignore`

❌ `build/` folder (ignored)
❌ `.env.local` (ignored)
❌ `node_modules/` (ignored)
❌ `.svelte-kit/` (ignored)

## Important Notes

- **NEVER** commit the `build/` folder
- **NEVER** commit `.env.local` with real API keys
- Render.com builds your app on their servers
- API keys are set in Render's dashboard, not in code
- This keeps your keys completely secure


git remote add origin https://github.com/itsliuhongyu/testwebsite