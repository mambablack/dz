import { getDb } from '@/db';
import type { TrainingRoundRecord } from '@/lib/poker';

export function listTrainingRounds(
  sessionId: string,
  limit = 50,
): TrainingRoundRecord[] {
  const rows = getDb()
    .prepare(
      `SELECT record_json FROM training_rounds
       WHERE session_id = ?
       ORDER BY started_at DESC
       LIMIT ?`,
    )
    .all(sessionId, limit) as Array<{ record_json: string }>;

  return rows.flatMap((row) => {
    try {
      return [JSON.parse(row.record_json) as TrainingRoundRecord];
    } catch {
      return [];
    }
  });
}

export function saveTrainingRound(round: TrainingRoundRecord) {
  getDb()
    .prepare(
      `INSERT INTO training_rounds
        (id, session_id, started_at, ended_at, status, hands_played, hero_profit, record_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         session_id = excluded.session_id,
         started_at = excluded.started_at,
         ended_at = excluded.ended_at,
         status = excluded.status,
         hands_played = excluded.hands_played,
         hero_profit = excluded.hero_profit,
         record_json = excluded.record_json
       WHERE excluded.status = 'completed'
          OR (
            training_rounds.status != 'completed'
            AND excluded.hands_played >= training_rounds.hands_played
          )`,
    )
    .run(
      round.id,
      round.sessionId,
      round.startedAt,
      round.endedAt,
      round.status,
      round.handsPlayed,
      round.heroProfit,
      JSON.stringify(round),
    );
}
