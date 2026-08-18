CREATE TABLE `contextualVocabularyResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` varchar(64) NOT NULL,
	`correct` boolean NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contextualVocabularyResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `contextualVocabulary_user_exercise_unique` UNIQUE(`userId`,`exerciseId`)
);
--> statement-breakpoint
CREATE TABLE `learningProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`xp` int NOT NULL DEFAULT 0,
	`cefrLevel` varchar(8),
	`placementScore` int NOT NULL DEFAULT 0,
	`placementCompleted` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learningProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `placementAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attemptKey` varchar(64) NOT NULL,
	`questionId` varchar(48) NOT NULL,
	`difficulty` int NOT NULL,
	`selectedIndex` int NOT NULL,
	`correct` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `placementAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `placementAttempts_attempt_question_unique` UNIQUE(`userId`,`attemptKey`,`questionId`)
);
--> statement-breakpoint
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
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(128) NOT NULL,
	`name` text,
	`email` varchar(320),
	`passwordHash` varchar(255),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
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
CREATE TABLE `xpEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`source` varchar(32) NOT NULL,
	`sourceRef` varchar(96) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xpEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `xpEvents_reward_unique` UNIQUE(`userId`,`source`,`sourceRef`)
);
--> statement-breakpoint
ALTER TABLE `contextualVocabularyResults` ADD CONSTRAINT `contextualVocabularyResults_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learningProfiles` ADD CONSTRAINT `learningProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `placementAttempts` ADD CONSTRAINT `placementAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practiceHistory` ADD CONSTRAINT `practiceHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programAccess` ADD CONSTRAINT `programAccess_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `programAccess` ADD CONSTRAINT `programAccess_grantedByUserId_users_id_fk` FOREIGN KEY (`grantedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weekProgress` ADD CONSTRAINT `weekProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weeklyCoachSummaries` ADD CONSTRAINT `weeklyCoachSummaries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `xpEvents` ADD CONSTRAINT `xpEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contextualVocabulary_user_idx` ON `contextualVocabularyResults` (`userId`);--> statement-breakpoint
CREATE INDEX `placementAttempts_user_idx` ON `placementAttempts` (`userId`);--> statement-breakpoint
CREATE INDEX `practiceHistory_user_created_idx` ON `practiceHistory` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `practiceHistory_user_type_created_idx` ON `practiceHistory` (`userId`,`practiceType`,`createdAt`);--> statement-breakpoint
CREATE INDEX `weekProgress_user_idx` ON `weekProgress` (`userId`);--> statement-breakpoint
CREATE INDEX `weeklyCoachSummaries_user_created_idx` ON `weeklyCoachSummaries` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `xpEvents_user_created_idx` ON `xpEvents` (`userId`,`createdAt`);