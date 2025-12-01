import http from 'http';
import { createApp } from './app.js';
import config, { validateConfig } from './config/index.js';
import { initializeSocketIO } from './socket/index.js';

// Validate required environment variables
validateConfig();

const app = createApp();
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  httpServer.close(() => {
    console.log('HTTP server closed');
    io.close(() => {
      console.log('Socket.IO server closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
httpServer.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - http://localhost:${config.PORT}/api/test`);
  console.log(`   - http://localhost:${config.PORT}/api/health`);
  console.log(`   - http://localhost:${config.PORT}/api/ads`);
  console.log(`   - http://localhost:${config.PORT}/api/categories`);
  console.log(`   - http://localhost:${config.PORT}/api/search`);
  console.log(`💬 Socket.IO messaging ready on ws://localhost:${config.PORT}`);
});
