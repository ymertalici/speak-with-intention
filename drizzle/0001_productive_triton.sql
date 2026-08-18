CREATE TABLE `programAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`grantedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `programAccess_id` PRIMARY KEY(`id`),
	CONSTRAINT `programAccess_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `weekProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`completedTaskIds` text NOT NULL,
	`reflection` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `weekProgress_user_week_unique` UNIQUE(`userId`,`weekNumber`)
);
--> statement-breakpoint
ALTER TABLE `programAccess` ADD CONSTRAINT `programAccess_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programAccess` ADD CONSTRAINT `programAccess_grantedByUserId_users_id_fk` FOREIGN KEY (`grantedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekProgress` ADD CONSTRAINT `weekProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `weekProgress_user_idx` ON `weekProgress` (`userId`);