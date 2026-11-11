# Activity Tracker (Cloudflare Ready)

A sleek, responsive activity and focus tracking web application packaged for instant deployment to **Cloudflare Pages** or **Cloudflare Workers**.

---

## Project Structure

```text
Activity/
├── public/                  # Cloudflare deploy target (static assets)
│   ├── index.html           # Main UI markup
│   ├── style.css            # Styles & responsive design (light & dark mode)
│   ├── app.js               # Logic: timer, stats, storage, export/import
│   ├── _headers             # Cloudflare Pages security & caching headers
│   └── _redirects           # Cloudflare Pages routing fallback
├── src/
│   └── worker.js            # Cloudflare Worker handler with ASSETS binding
├── scripts/
│   └── build.js             # Asset sync script
├── wrangler.toml            # Cloudflare Wrangler configuration
├── package.json             # NPM package & Cloudflare deployment scripts
└── README.md
```

---

## Deployment to Cloudflare

You can deploy this application using **Cloudflare Pages** (recommended) or **Cloudflare Workers**.

### Method 1: Cloudflare Pages (Recommended)

Cloudflare Pages provides automated global CDN distribution and SSL.

#### Option A: Via Wrangler CLI
1. Log in to your Cloudflare account in the terminal:
   ```bash
   npx wrangler login
   ```
2. Deploy the `public` directory:
   ```bash
   npm run deploy
   # Or directly:
   npx wrangler pages deploy public --project-name=activity-tracker
   ```

#### Option B: Via Git / Cloudflare Dashboard
1. Push this repository to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository and configure:
   - **Framework preset**: `None`
   - **Build command**: `npm run build` (or leave empty)
   - **Build output directory**: `public`
4. Click **Save and Deploy**.

---

### Method 2: Cloudflare Workers (Static Assets)

This project is also configured for Cloudflare Workers using the native `[assets]` binding.

1. Log in:
   ```bash
   npx wrangler login
   ```
2. Deploy as a Worker:
   ```bash
   npm run deploy:worker
   # Or directly:
   npx wrangler deploy
   ```

---

## Local Development & Testing

To run the app locally with Cloudflare's edge simulation:

```bash
# Cloudflare Pages local preview
npm run dev
# (runs: npx wrangler pages dev public)

# Or Cloudflare Worker local preview
npm run dev:worker
# (runs: npx wrangler dev)
```

Alternatively, you can still open `public/index.html` directly in any web browser without any local servers or build tools.
