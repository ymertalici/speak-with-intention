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
ALTER TABLE `xpEvents` ADD CONSTRAINT `xpEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contextualVocabulary_user_idx` ON `contextualVocabularyResults` (`userId`);--> statement-breakpoint
CREATE INDEX `placementAttempts_user_idx` ON `placementAttempts` (`userId`);--> statement-breakpoint
CREATE INDEX `xpEvents_user_created_idx` ON `xpEvents` (`userId`,`createdAt`);