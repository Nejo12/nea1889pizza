CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`guests` integer NOT NULL,
	`notes` text NOT NULL,
	`status` text NOT NULL,
	`table_ids` text DEFAULT '[]' NOT NULL,
	`duration` integer DEFAULT 75 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `occupancy` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`table_id` text NOT NULL,
	`date` text NOT NULL,
	`minute` integer NOT NULL
);
