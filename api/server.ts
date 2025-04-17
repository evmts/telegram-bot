import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Effect } from 'effect';

// Import our services
import { 
  TelegramClientService, 
  createTelegramClientLayer,
  ScraperService,
  ScraperLayer,
  ReportService,
  ReportLayer
} from '../src/lib/telegram';
import { DatabaseService, SqliteLayer } from '../src/lib/db';

// Get API credentials from environment variables
const TELEGRAM_API_ID = Number(process.env.TELEGRAM_API_ID || '0');
const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH || '';
const TELEGRAM_SESSION = process.env.TELEGRAM_SESSION || '';

// Create the Hono app
const app = new Hono();

// Middleware
app.use(cors());

// Check if Telegram credentials are configured
if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
  console.warn('⚠️ Telegram API credentials not configured. Set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables.');
}

// Create the service layers
const MainLayer = Effect.layer([
  SqliteLayer,
  createTelegramClientLayer({
    apiId: TELEGRAM_API_ID,
    apiHash: TELEGRAM_API_HASH,
    sessionString: TELEGRAM_SESSION
  }),
  ScraperLayer,
  ReportLayer
]);

// Basic routes
app.get('/', async (c) => {
  return c.json({
    message: 'Welcome to the AI Telegram API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/hello', async (c) => {
  return c.json({
    message: 'Hello, world!',
    timestamp: new Date().toISOString(),
  });
});

// Telegram scraping routes
app.post('/telegram/scrape', async (c) => {
  try {
    const { channel } = await c.req.json();
    
    if (!channel) {
      return c.json({ error: 'Channel name is required' }, 400);
    }
    
    // Create the effect to scrape the channel
    const scrapeEffect = Effect.gen(function* (_) {
      const scraperService = yield* _(Effect.service(ScraperService.tag));
      const lastMessageId = yield* _(scraperService.scrapeChannel(channel));
      return { lastMessageId, channel };
    });
    
    // Run the effect with our layers
    const result = await Effect.runPromise(Effect.provide(scrapeEffect, MainLayer));
    
    return c.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error scraping channel:', error);
    return c.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Generate report endpoint
app.post('/telegram/report', async (c) => {
  try {
    const { channel, days } = await c.req.json();
    
    if (!channel) {
      return c.json({ error: 'Channel name is required' }, 400);
    }
    
    // Calculate the date to start the report from
    const daysBack = Number(days) || 1;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    since.setHours(0, 0, 0, 0);
    
    // Create the effect to generate the report
    const reportEffect = Effect.gen(function* (_) {
      const reportService = yield* _(Effect.service(ReportService.tag));
      const report = yield* _(reportService.generateReportSince(channel, since));
      return { report, channel, since: since.toISOString() };
    });
    
    // Run the effect with our layers
    const result = await Effect.runPromise(Effect.provide(reportEffect, MainLayer));
    
    return c.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return c.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Export for Vercel serverless function
export default app;

// Start server if running directly (not for Vercel)
if (import.meta.url === import.meta.main) {
  const port = Number(process.env.PORT) || 3001;
  console.log(`Server starting on port ${port}`);
  
  // Don't start the server if Telegram credentials are missing
  if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
    console.error('Cannot start server: Telegram API credentials not configured');
    console.error('Set TELEGRAM_API_ID and TELEGRAM_API_HASH environment variables');
    process.exit(1);
  }
  
  serve({
    fetch: app.fetch,
    port
  });
}