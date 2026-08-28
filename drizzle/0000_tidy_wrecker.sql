CREATE TABLE `hand_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`hand_number` integer NOT NULL,
	`played_at` text NOT NULL,
	`hero_profit` integer NOT NULL,
	`pot` integer NOT NULL,
	`showdown` integer NOT NULL,
	`result_text` text NOT NULL,
	`record_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_hand_histories_session_played` ON `hand_histories` (`session_id`,`played_at`);