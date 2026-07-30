import { buildApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './prisma/client.js';

const app = buildApp();

// Graceful shutdown
const shutdown = async (signal) => {
  app.log.info(`Received ${signal}, shutting down gracefully…`);
  await app.close();
  await prisma.$disconnect();
  process.exit(signal === 'SIGTERM' ? 0 : 1);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  app.log.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

// Start server
await app.listen({ port: env.PORT, host: '0.0.0.0' });
app.log.info(`🚀  Server running on http://0.0.0.0:${env.PORT}`);
