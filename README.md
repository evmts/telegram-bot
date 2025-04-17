# AI Telegram Monitor

A Telegram channel monitoring application built with:
- Hono.js - Fast, lightweight API framework
- GramJS - Telegram client library for Node.js
- Effect-TS - Functional effect system for TypeScript
- Astro - Fast frontend framework
- SQLite - Embedded database
- SST - Infrastructure as code for Cloudflare deployment

## Project Structure

- `src/` - Astro frontend files and library code
  - `lib/` - Core functionality modules
    - `telegram/` - Telegram API interaction services
    - `db/` - Database services
- `api/` - Hono backend API endpoints
- `data/` - SQLite database storage
- `public/` - Static assets
- `stacks/` - SST infrastructure stacks for Cloudflare deployment

## Features

- ✅ Monitor multiple Telegram channels for new messages
- ✅ Store messages in a local SQLite database
- ✅ Generate activity reports using basic message analysis
- ✅ Scheduled scraping via cron job
- ✅ REST API endpoints for triggering scrapes and generating reports
- ✅ TypeScript support
- ✅ Scheduled cron jobs

## Setup

### Requirements

- Node.js 18+
- Telegram API credentials

### Configuration

1. **Get Telegram API Credentials**:
   - Visit [https://my.telegram.org/apps](https://my.telegram.org/apps)
   - Create a new application
   - Note your API ID and API Hash

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the project root with:
   ```
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   TELEGRAM_CHANNELS=channel1,channel2,channel3
   # Optional: Add your saved session string after first run
   TELEGRAM_SESSION=session_string
   ```

### First Run Authentication

The first time you run the application, you'll need to authenticate with Telegram:

1. Start the API server:
   ```bash
   pnpm run api:dev
   ```

2. The console will prompt you for:
   - Your phone number (with country code)
   - The authentication code sent to your Telegram app
   - Your 2FA password (if enabled)

3. After successful authentication, a session string will be printed to the console.
   Add this to your `.env` file as `TELEGRAM_SESSION` to avoid re-authentication.

## Development

### Local Development (without SST)

1. Start the frontend development server:
   ```bash
   pnpm run dev
   ```

2. Start the API development server:
   ```bash
   pnpm run api:dev
   ```

3. Run the cron job manually:
   ```bash
   pnpm run cron
   ```

### SST Development and Deployment

For Cloudflare deployment using SST:

1. Set up Cloudflare credentials:
   ```bash
   export CLOUDFLARE_API_TOKEN=your_token_here
   export CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   ```

2. For development with local changes and remote resources:
   ```bash
   pnpm sst:dev
   ```

3. For production deployment:
   ```bash
   pnpm sst:deploy --stage prod
   ```

4. To remove all deployed resources:
   ```bash
   pnpm sst:remove --stage prod
   ```

## API Endpoints

### Scrape a Channel

```http
POST /telegram/scrape
Content-Type: application/json

{
  "channel": "channelname"
}
```

### Generate a Report

```http
POST /telegram/report
Content-Type: application/json

{
  "channel": "channelname",
  "days": 7
}
```

## Cron Jobs

The application includes a scheduled cron job that runs daily at midnight. The cron job:

1. Scrapes all configured channels for new messages
2. Stores the messages in the SQLite database
3. Generates daily activity reports

## Architecture

This application uses a functional architecture with Effect-TS:

- **Services** - Core functionality is implemented as Effect-TS services
  - `TelegramClientService` - Handles Telegram API communication
  - `DatabaseService` - Manages SQLite database operations
  - `ScraperService` - Controls the scraping logic
  - `ReportService` - Generates channel activity reports

- **APIs** - Exposed via Hono.js HTTP endpoints
  - `/telegram/scrape` - Trigger a manual scrape
  - `/telegram/report` - Generate a custom report

- **Infrastructure** - Managed via SST
  - `Database` - Cloudflare D1 SQLite-compatible database
  - `API` - Hono API deployed as a Cloudflare Worker
  - `Cron` - Scheduled Cloudflare Worker for periodic tasks

## References

- [GramJS Documentation](https://gram.js.org/)
- [Effect-TS Documentation](https://effect-ts.github.io/effect/docs/ai/ai)
- [SST Documentation](https://sst.dev/docs/start/cloudflare/worker/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Database](https://developers.cloudflare.com/d1/)