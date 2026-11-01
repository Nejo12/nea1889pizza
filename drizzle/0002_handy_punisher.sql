CREATE TABLE `auth_configuration` (
	`id` text PRIMARY KEY NOT NULL,
	`publishable_key` text NOT NULL,
	`encrypted_secret` text NOT NULL,
	`active` integer DEFAULT 0 NOT NULL,
	`revision` text NOT NULL
);
