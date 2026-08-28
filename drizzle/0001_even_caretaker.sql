CREATE TABLE `training_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`status` text NOT NULL,
	`hands_played` integer NOT NULL,
	`hero_profit` integer NOT NULL,
	`record_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_training_rounds_session_started` ON `training_rounds` (`session_id`,`started_at`);