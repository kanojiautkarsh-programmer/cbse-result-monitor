# CBSE Class 10 Result Monitor

Real-time monitoring dashboard for CBSE Class 10 result updates. Monitors multiple sources and displays updates on a public dashboard.

## Features

- Monitors r/cbse subreddit for discussions
- Checks CBSE official website (cbse.gov.in)
- Checks DigiLocker for result availability
- Checks UMANG portal for updates
- Public dashboard with live updates
- Auto-refresh every minute
- Cron job runs every hour

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Storage**: Vercel KV
- **Hosting**: Vercel
- **Scheduling**: Vercel Cron

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Vercel KV

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing
3. Go to Storage tab
4. Create a new KV database
5. Copy the URL and Token

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
KV_REST_API_URL=your_kv_url_here
KV_REST_API_TOKEN=your_kv_token_here
```

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### 5. Set Cron Secret

In Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add:
   - Name: `CRON_SECRET`
   - Value: (generate a random string)

## Usage

### Local Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Trigger Cron Manually

```bash
curl -X GET "https://your-project.vercel.app/api/cron/check-updates" \
  -H "Authorization: Bearer your_cron_secret"
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── cron/check-updates/route.ts  # Cron endpoint
│   │   └── updates/route.ts              # API to fetch updates
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                          # Dashboard UI
├── lib/
│   ├── storage.ts                        # Vercel KV operations
│   └── scrapers/
│       ├── index.ts
│       ├── reddit.ts
│       ├── cbse.ts
│       ├── digilocker.ts
│       └── umang.ts
├── package.json
├── vercel.json                           # Cron schedule config
├── tailwind.config.js
└── postcss.config.js
```

## Cron Schedule

The cron job runs every hour. To change this, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-updates",
      "schedule": "0 */1 * * *"  // Every hour
    }
  ]
}
```

### Cron Schedule Examples

| Schedule | Cron Expression |
|----------|-----------------|
| Every 30 mins | `*/30 * * * *` |
| Every hour | `0 */1 * * *` |
| Every 6 hours | `0 */6 * * *` |
| Daily at midnight | `0 0 * * *` |

## License

MIT
