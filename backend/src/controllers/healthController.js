import { checkDatabaseConnection } from '../config/database.js';

export async function health(req, res) {
  let database = 'ok';

  try {
    await checkDatabaseConnection();
  } catch {
    database = 'unavailable';
  }

  return res.json({
    status: database === 'ok' ? 'ok' : 'degraded',
    message: 'Spilweb API is running.',
    services: {
      api: 'ok',
      database
    },
    timestamp: new Date().toISOString()
  });
}
