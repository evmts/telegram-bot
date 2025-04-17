# AI Telegram App

A TypeScript application with an Astro frontend and a Hono backend, deployable to Vercel.

## Project Structure

- `src/` - Astro frontend files
- `api/` - Hono backend API
- `public/` - Static assets

## Features

- TypeScript support
- Astro frontend framework
- Hono backend API
- Vercel deployment configuration
- Scheduled cron jobs via Vercel

## Development

1. Install dependencies:

```bash
npm install
```

2. Start the frontend development server:

```bash
npm run dev
```

3. Start the API development server:

```bash
npm run api:dev
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file includes configuration for:

- Build commands
- API routes
- Cron jobs (scheduled to run daily at midnight)

To deploy:

1. Push to your GitHub repository
2. Connect to Vercel
3. Deploy

## Cron Jobs

The application includes a scheduled cron job that runs daily at midnight. The cron job is implemented in `api/cron.ts` and configured in `vercel.json`.