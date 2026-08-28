import { env } from 'cloudflare:workers';
import type { HandRecord } from '@/lib/poker';

const CREATE_HANDS_SQL = `
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
  )
`;

const CREATE_SESSION_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_hand_histories_session_played
  ON hand_histories (session_id, played_at)
`;

const CREATE_ROUNDS_SQL = `
  CREATE TABLE IF NOT EXISTS training_rounds (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    status TEXT NOT NULL,
    hands_played INTEGER NOT NULL,
    hero_profit INTEGER NOT NULL,
    record_json TEXT NOT NULL
  )
`;

const CREATE_ROUND_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_training_rounds_session_started
  ON training_rounds (session_id, started_at)
`;

export async function ensureSchema() {
  if (!env.DB) throw new Error('牌局数据库尚未连接');
  await env.DB.batch([
    env.DB.prepare(CREATE_HANDS_SQL),
    env.DB.prepare(CREATE_SESSION_INDEX_SQL),
    env.DB.prepare(CREATE_ROUNDS_SQL),
    env.DB.prepare(CREATE_ROUND_INDEX_SQL),
    env.DB.prepare('PRAGMA optimize'),
  ]);
}

export async function listHandRecords(
  sessionId: string,
  limit = 100,
): Promise<HandRecord[]> {
  await ensureSchema();
  const result = await env.DB.prepare(
    `SELECT record_json FROM hand_histories
     WHERE session_id = ?
     ORDER BY played_at DESC
     LIMIT ?`,
  )
    .bind(sessionId, limit)
    .all<{ record_json: string }>();

  return result.results.flatMap((row) => {
    try {
      return [JSON.parse(row.record_json) as HandRecord];
    } catch {
      return [];
    }
  });
}

export async function saveHandRecord(record: HandRecord) {
  await ensureSchema();
  await env.DB.prepare(
    `INSERT INTO hand_histories
      (id, session_id, hand_number, played_at, hero_profit, pot, showdown, result_text, record_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       session_id = excluded.session_id,
       hand_number = excluded.hand_number,
       played_at = excluded.played_at,
       hero_profit = excluded.hero_profit,
       pot = excluded.pot,
       showdown = excluded.showdown,
       result_text = excluded.result_text,
       record_json = excluded.record_json`,
  )
    .bind(
      record.id,
      record.sessionId,
      record.handNumber,
      record.playedAt,
      record.heroProfit,
      record.pot,
      record.showdown ? 1 : 0,
      record.resultText,
      JSON.stringify(record),
    )
    .run();
}
