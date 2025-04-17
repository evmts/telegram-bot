import Database from 'better-sqlite3';
import { Effect } from 'effect';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the database path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/telegram.db');

// Create a tag for the DatabaseService
export interface DatabaseService {
  getLastMessageId(channelId: string): Effect.Effect<never, Error, number>;
  saveMessage(message: TelegramMessage): Effect.Effect<never, Error, void>;
  getRecentMessages(channelId: string, since: Date): Effect.Effect<never, Error, TelegramMessage[]>;
}

export const DatabaseService = {
  tag: Symbol.for('telegram-db-service')
};

export interface TelegramMessage {
  id: number;
  channel: string;
  text: string;
  date: Date;
  senderId?: number;
  rawData?: string;
}

// Create a SQLite implementation of the DatabaseService
export const createSqliteService = (): DatabaseService => {
  // Initialize the database
  const db = new Database(DB_PATH);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_messages (
      id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      text TEXT,
      date TEXT NOT NULL,
      sender_id INTEGER,
      raw_data TEXT,
      PRIMARY KEY (id, channel)
    );
    
    CREATE INDEX IF NOT EXISTS idx_channel_date ON telegram_messages (channel, date);
  `);
  
  return {
    getLastMessageId: (channelId: string) => Effect.try({
      try: () => {
        const stmt = db.prepare('SELECT MAX(id) as lastId FROM telegram_messages WHERE channel = ?');
        const result = stmt.get(channelId) as { lastId: number | null };
        return result.lastId ?? 0;
      },
      catch: (error) => new Error(`Failed to get last message ID: ${error}`)
    }),
    
    saveMessage: (message: TelegramMessage) => Effect.try({
      try: () => {
        const stmt = db.prepare(`
          INSERT INTO telegram_messages (id, channel, text, date, sender_id, raw_data)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT (id, channel) DO NOTHING
        `);
        
        stmt.run(
          message.id,
          message.channel,
          message.text,
          message.date.toISOString(),
          message.senderId,
          message.rawData
        );
      },
      catch: (error) => new Error(`Failed to save message: ${error}`)
    }),
    
    getRecentMessages: (channelId: string, since: Date) => Effect.try({
      try: () => {
        const stmt = db.prepare(`
          SELECT id, channel, text, date, sender_id, raw_data
          FROM telegram_messages
          WHERE channel = ? AND date >= ?
          ORDER BY date ASC
        `);
        
        const rows = stmt.all(channelId, since.toISOString()) as any[];
        
        return rows.map(row => ({
          id: row.id,
          channel: row.channel,
          text: row.text,
          date: new Date(row.date),
          senderId: row.sender_id,
          rawData: row.raw_data
        }));
      },
      catch: (error) => new Error(`Failed to get recent messages: ${error}`)
    })
  };
};

// Layer for providing the DatabaseService
export const SqliteLayer = Effect.layer(() => Effect.succeed(createSqliteService()));