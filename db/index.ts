import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'riverlab.db');

let db: DatabaseSync | null = null;

/**
 * Returns the shared SQLite connection, creating the database file and schema
 * on first use. Uses Node's built-in `node:sqlite`, so there is no native
 * dependency to install. Set `RIVERLAB_DB_PATH` to store the database outside
 * the default `<cwd>/data/riverlab.db` location.
 */
export function getDb(): DatabaseSync {
  if (db) return db;

  const dbPath = process.env.RIVERLAB_DB_PATH ?? DEFAULT_DB_PATH;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const database = new DatabaseSync(dbPath);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS hand_histories (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      hand_number INTEGER NOT NULL,
      played_at TEXT NOT NULL,
      hero_profit INTEGER NOT NULL,
      pot INTEGER NOT NULL,
      showdown INTEGER NOT NULL,
      result_text TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_hand_histories_session_played
      ON hand_histories (session_id, played_at);
    CREATE TABLE IF NOT EXISTS training_rounds (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT NOT NULL,
      hands_played INTEGER NOT NULL,
      hero_profit INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_training_rounds_session_started
      ON training_rounds (session_id, started_at);
  `);

  db = database;
  return database;
}
