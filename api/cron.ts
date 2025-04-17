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

// Get channels to monitor from environment variables
const CHANNELS_TO_MONITOR = (process.env.TELEGRAM_CHANNELS || '')
  .split(',')
  .map(channel => channel.trim())
  .filter(Boolean);

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

// This function will be executed on the schedule defined in the cloud config
async function cronTask() {
  try {
    console.log('Running scheduled cron job at:', new Date().toISOString());
    
    if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
      console.error('Telegram API credentials not configured');
      return { success: false, error: 'Telegram API credentials not configured' };
    }
    
    if (CHANNELS_TO_MONITOR.length === 0) {
      console.error('No channels to monitor. Set TELEGRAM_CHANNELS environment variable');
      return { success: false, error: 'No channels to monitor' };
    }
    
    // Create the effect to scrape channels and generate reports
    const cronEffect = Effect.gen(function* (_) {
      const scraperService = yield* _(Effect.service(ScraperService.tag));
      const reportService = yield* _(Effect.service(ReportService.tag));
      
      const results = [];
      
      // Scrape each channel
      for (const channel of CHANNELS_TO_MONITOR) {
        try {
          const lastMessageId = yield* _(scraperService.scrapeChannel(channel));
          console.log(`Scraped channel ${channel}, last message ID: ${lastMessageId}`);
          
          // Generate a daily report
          const report = yield* _(reportService.generateDailyReport(channel));
          console.log(`Generated daily report for ${channel}`);
          
          results.push({
            channel,
            status: 'success',
            lastMessageId,
            reportLength: report.length
          });
        } catch (error) {
          console.error(`Error processing channel ${channel}:`, error);
          results.push({
            channel,
            status: 'error',
            error: (error as Error).message
          });
        }
      }
      
      return results;
    });
    
    // Run the effect with our layers
    const results = await Effect.runPromise(Effect.provide(cronEffect, MainLayer));
    
    console.log('Cron job completed successfully');
    return { success: true, results };
  } catch (error) {
    console.error('Cron job failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Export for Cloudflare Workers or other serverless platforms
export default async function handler() {
  const result = await cronTask();
  
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}