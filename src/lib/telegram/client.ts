import { StringSession } from 'telegram/sessions';
import { TelegramClient } from 'telegram';
import { Effect, Context } from 'effect';
import { Api } from 'telegram';
import input from 'input';

// Define the TelegramClientService interface
export interface TelegramClientService {
  getMessages(channel: string, options?: { minId?: number; limit?: number }): 
    Effect.Effect<never, Error, Array<{
      id: number;
      text: string;
      date: Date;
      senderId?: number;
      rawData: string;
    }>>;
}

// Create a tag for the TelegramClientService
export const TelegramClientService = {
  tag: Symbol.for('telegram-client-service')
};

// Configuration for the Telegram client
interface TelegramConfig {
  apiId: number;
  apiHash: string;
  sessionString?: string;
  phoneNumber?: string;
}

// Implementation of the TelegramClientService
export const createTelegramClientService = async (config: TelegramConfig): Promise<TelegramClientService> => {
  // Create a string session from the stored session string or empty string
  const stringSession = new StringSession(config.sessionString || '');
  
  // Create and connect the Telegram client
  const client = new TelegramClient(
    stringSession,
    config.apiId,
    config.apiHash,
    { connectionRetries: 5 }
  );
  
  // Start the client
  await client.start({
    phoneNumber: async () => 
      config.phoneNumber || await input.text('Please enter your phone number: '),
    password: async () => 
      await input.text('Please enter your 2FA password (if any): '),
    phoneCode: async () => 
      await input.text('Enter the login code sent by Telegram: '),
    onError: (err) => console.error('Error during authentication:', err),
  });
  
  console.log('Connected to Telegram!');
  
  // If no session string was provided, log the new one for future use
  if (!config.sessionString) {
    console.log('Session string for future use:', client.session.save());
  }
  
  return {
    getMessages: (channelName: string, options = {}) => Effect.tryPromise({
      try: async () => {
        // Find the channel entity
        const entity = await client.getInputEntity(channelName);
        
        // Get messages from the channel
        const messages = await client.getMessages(entity, {
          limit: options.limit || 100,
          minId: options.minId,
        });
        
        // Map the messages to our format
        return messages.map(msg => ({
          id: msg.id,
          text: msg.message || '',
          date: new Date(msg.date * 1000), // Convert timestamp to Date
          senderId: msg.fromId?.userId || undefined,
          rawData: JSON.stringify(msg),
        }));
      },
      catch: (error) => new Error(`Failed to get messages from ${channelName}: ${error}`)
    })
  };
};

// Create a layer for providing the TelegramClientService
export const createTelegramClientLayer = (config: TelegramConfig) => 
  Effect.layer(() => 
    Effect.tryPromise(() => 
      createTelegramClientService(config)
    )
  );