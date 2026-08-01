import app from './app.js';
import { checkDatabaseConnection, closeDatabasePool } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    await checkDatabaseConnection();
    logger.info('MySQL connection established');
  } catch (error) {
    logger.warn(`MySQL is not available yet: ${error.message}`);
  }

  const server = app.listen(env.port, () => {
    logger.info(`${env.appName} API listening on port ${env.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down Spilweb API');
    server.close(async () => {
      await closeDatabasePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
