import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const databaseFile = path.resolve(currentDir, '../../../database/spilweb_database.sql');
const sql = await readFile(databaseFile, 'utf8');

const connection = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  multipleStatements: true
});

try {
  await connection.query(sql);
  console.log('Applied database/spilweb_database.sql');
  console.log('Spilweb database installation completed.');
} finally {
  await connection.end();
}
