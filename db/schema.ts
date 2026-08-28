import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const handHistories = sqliteTable(
  'hand_histories',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    handNumber: integer('hand_number').notNull(),
    playedAt: text('played_at').notNull(),
    heroProfit: integer('hero_profit').notNull(),
    pot: integer('pot').notNull(),
    showdown: integer('showdown', { mode: 'boolean' }).notNull(),
    resultText: text('result_text').notNull(),
    recordJson: text('record_json').notNull(),
  },
  (table) => [index('idx_hand_histories_session_played').on(table.sessionId, table.playedAt)],
);
