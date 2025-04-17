import { Effect, Context } from 'effect';
import { DatabaseService, TelegramMessage } from '../db';

// Define the ReportService interface
export interface ReportService {
  generateDailyReport(channelName: string): Effect.Effect<never, Error, string>;
  generateReportSince(channelName: string, since: Date): Effect.Effect<never, Error, string>;
}

// Create a tag for the ReportService
export const ReportService = {
  tag: Symbol.for('telegram-report-service')
};

// Helper to group messages by day
const groupMessagesByDay = (messages: TelegramMessage[]) => {
  const grouped = new Map<string, TelegramMessage[]>();
  
  for (const message of messages) {
    const day = message.date.toISOString().split('T')[0];
    if (!grouped.has(day)) {
      grouped.set(day, []);
    }
    grouped.get(day)!.push(message);
  }
  
  return grouped;
};

// Simple text-based report generation
// In a real application, you would use a more sophisticated AI model here
const createTextReport = (messages: TelegramMessage[], channelName: string, timeframe: string): string => {
  if (messages.length === 0) {
    return `No messages found in ${channelName} ${timeframe}.`;
  }
  
  const messagesByDay = groupMessagesByDay(messages);
  let report = `# Activity Report for ${channelName} ${timeframe}\n\n`;
  
  report += `## Summary\n`;
  report += `- Total messages: ${messages.length}\n`;
  report += `- Days with activity: ${messagesByDay.size}\n`;
  report += `- Most active day: ${getMostActiveDay(messagesByDay)}\n\n`;
  
  report += `## Message Breakdown by Day\n`;
  
  for (const [day, dayMessages] of Array.from(messagesByDay.entries()).sort()) {
    report += `### ${day} (${dayMessages.length} messages)\n\n`;
    
    // Include some sample messages from this day
    const sampleCount = Math.min(dayMessages.length, 5);
    for (let i = 0; i < sampleCount; i++) {
      const msg = dayMessages[i];
      report += `- ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}\n`;
    }
    
    if (dayMessages.length > sampleCount) {
      report += `- ...and ${dayMessages.length - sampleCount} more messages\n`;
    }
    
    report += '\n';
  }
  
  return report;
};

// Find the most active day
const getMostActiveDay = (messagesByDay: Map<string, TelegramMessage[]>): string => {
  let mostActiveDay = '';
  let maxMessages = 0;
  
  for (const [day, messages] of messagesByDay.entries()) {
    if (messages.length > maxMessages) {
      mostActiveDay = day;
      maxMessages = messages.length;
    }
  }
  
  return `${mostActiveDay} (${maxMessages} messages)`;
};

// Implement the ReportService
export const createReportService = (): ReportService => {
  return {
    generateDailyReport: (channelName: string) => {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      return Effect.gen(function* (_) {
        const database = yield* _(Effect.service(DatabaseService.tag));
        const messages = yield* _(database.getRecentMessages(channelName, yesterday));
        
        return createTextReport(messages, channelName, "for yesterday");
      });
    },
    
    generateReportSince: (channelName: string, since: Date) => {
      return Effect.gen(function* (_) {
        const database = yield* _(Effect.service(DatabaseService.tag));
        const messages = yield* _(database.getRecentMessages(channelName, since));
        
        const timeframe = `since ${since.toISOString().split('T')[0]}`;
        return createTextReport(messages, channelName, timeframe);
      });
    }
  };
};

// Create a layer for providing the ReportService
export const ReportLayer = Effect.layer(() => Effect.succeed(createReportService()));