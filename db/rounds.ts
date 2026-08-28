import { env } from 'cloudflare:workers';
import { ensureSchema } from '@/db/hands';
import type { TrainingRoundRecord } from '@/lib/poker';

export async function listTrainingRounds(
  sessionId: string,
  limit = 50,
): Promise<TrainingRoundRecord[]> {
  await ensureSchema();
  const result = await env.DB.prepare(
    `SELECT record_json FROM training_rounds
     WHERE session_id = ?
     ORDER BY started_at DESC
     LIMIT ?`,
  )
    .bind(sessionId, limit)
    .all<{ record_json: string }>();

  return result.results.flatMap((row) => {
    try {
      return [JSON.parse(row.record_json) as TrainingRoundRecord];
    } catch {
      return [];
    }
  });
}

export async function saveTrainingRound(round: TrainingRoundRecord) {
  await ensureSchema();
  await env.DB.prepare(
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
    .bind(
      round.id,
      round.sessionId,
      round.startedAt,
      round.endedAt,
      round.status,
      round.handsPlayed,
      round.heroProfit,
      JSON.stringify(round),
    )
    .run();
}
