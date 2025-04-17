import { Effect, Context, Schedule } from 'effect';
import { TelegramClientService } from './client';
import { DatabaseService, TelegramMessage } from '../db';

// Define the ScraperService interface
export interface ScraperService {
  scrapeChannel(channelName: string): Effect.Effect<never, Error, number>;
  scheduleScraping(channelName: string, interval: string | number): Effect.Effect<never, Error, void>;
}

// Create a tag for the ScraperService
export const ScraperService = {
  tag: Symbol.for('telegram-scraper-service')
};

// Implement the ScraperService
export const createScraperService = (): ScraperService => {
  return {
    scrapeChannel: (channelName: string) => {
      // Get the Telegram client from context
      const telegramClient = Effect.service(TelegramClientService.tag);
      
      // Get the DB service from context
      const db = Effect.service(DatabaseService.tag);
      
      return Effect.gen(function* (_) {
        // Get the client and database services
        const client = yield* _(telegramClient);
        const database = yield* _(db);
        
        // Get the last message ID for this channel
        const lastMessageId = yield* _(database.getLastMessageId(channelName));
        
        console.log(`Scraping channel ${channelName}, last message ID: ${lastMessageId}`);
        
        // Get new messages
        const messages = yield* _(client.getMessages(channelName, { minId: lastMessageId + 1 }));
        
        console.log(`Found ${messages.length} new messages in ${channelName}`);
        
        // If there are new messages, save them to the database
        if (messages.length > 0) {
          for (const msg of messages) {
            yield* _(database.saveMessage({
              id: msg.id,
              channel: channelName,
              text: msg.text,
              date: msg.date,
              senderId: msg.senderId,
              rawData: msg.rawData
            }));
          }
          
          // Return the highest message ID we've seen
          return Math.max(...messages.map(m => m.id));
        }
        
        return lastMessageId;
      });
    },
    
    scheduleScraping: (channelName: string, interval: string | number) => {
      // Schedule the scraping to run repeatedly
      const scheduledEffect = Effect.repeat(
        Effect.gen(function* (_) {
          const scraperService = yield* _(Effect.service(ScraperService.tag));
          yield* _(scraperService.scrapeChannel(channelName));
        }),
        typeof interval === 'string' 
          ? Schedule.spaced(interval) 
          : Schedule.spaced(interval)
      );
      
      // Run the scheduled effect in the background
      return Effect.fork(scheduledEffect);
    }
  };
};

// Create a layer for providing the ScraperService
export const ScraperLayer = Effect.layer(() => Effect.succeed(createScraperService()));