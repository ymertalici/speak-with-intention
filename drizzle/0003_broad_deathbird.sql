CREATE TABLE `practiceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`practiceType` varchar(32) NOT NULL,
	`focus` varchar(40),
	`sourceText` text NOT NULL,
	`feedbackJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `practiceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyCoachSummaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStart` varchar(16) NOT NULL,
	`metricsJson` text NOT NULL,
	`summaryJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyCoachSummaries_id` PRIMARY KEY(`id`),
	CONSTRAINT `weeklyCoachSummaries_user_week_unique` UNIQUE(`userId`,`weekStart`)
);
--> statement-breakpoint
ALTER TABLE `practiceHistory` ADD CONSTRAINT `practiceHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weeklyCoachSummaries` ADD CONSTRAINT `weeklyCoachSummaries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `practiceHistory_user_created_idx` ON `practiceHistory` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `practiceHistory_user_type_created_idx` ON `practiceHistory` (`userId`,`practiceType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `weeklyCoachSummaries_user_created_idx` ON `weeklyCoachSummaries` (`userId`,`createdAt`);