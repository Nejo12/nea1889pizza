CREATE TABLE `email_events` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
