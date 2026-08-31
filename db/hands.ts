import { getDb } from '@/db';
import type { HandRecord } from '@/lib/poker';

export function listHandRecords(
  sessionId: string,
  limit = 100,
): HandRecord[] {
  const rows = getDb()
    .prepare(
      `SELECT record_json FROM hand_histories
       WHERE session_id = ?
       ORDER BY played_at DESC
       LIMIT ?`,
    )
    .all(sessionId, limit) as Array<{ record_json: string }>;

  return rows.flatMap((row) => {
    try {
      return [JSON.parse(row.record_json) as HandRecord];
    } catch {
      return [];
    }
  });
}

export function saveHandRecord(record: HandRecord) {
  getDb()
    .prepare(
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
    .run(
      record.id,
      record.sessionId,
      record.handNumber,
      record.playedAt,
      record.heroProfit,
      record.pot,
      record.showdown ? 1 : 0,
      record.resultText,
      JSON.stringify(record),
    );
}
