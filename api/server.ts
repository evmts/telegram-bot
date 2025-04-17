import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use(cors());

// Routes
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

// Export for Vercel serverless function
export default app;

// Start server if running directly (not for Vercel)
if (import.meta.url === import.meta.main) {
  const port = Number(process.env.PORT) || 3001;
  console.log(`Server starting on port ${port}`);
  
  serve({
    fetch: app.fetch,
    port
  });
}