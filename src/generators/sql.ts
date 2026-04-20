import type { Generator } from "./shared.js";
import { addWarningComment } from "./shared.js";

/**
 * SQL dump file generator
 * Creates realistic-looking database backup files
 */
export const sqlGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;
	const dbName = helpers.fakeDomain().split(".")[0];
	const timestamp = helpers.fakeTimestamp();

	const sections = [
		`-- ${addWarningComment(path, "slash").replace("//", "").trim()}`,
		`-- MySQL dump ${timestamp}`,
		`-- Host: ${helpers.fakeTestNetIPv4()}`,
		`-- Database: ${dbName}_prod`,
		"--",
		"-- Table structure for table `users`",
		"--",
		"",
		"DROP TABLE IF EXISTS `users`;",
		"CREATE TABLE `users` (",
		"  `id` int(11) NOT NULL AUTO_INCREMENT,",
		"  `username` varchar(255) NOT NULL,",
		"  `email` varchar(255) NOT NULL,",
		"  `password` varchar(255) NOT NULL,",
		"  `created_at` timestamp NULL DEFAULT NULL,",
		"  PRIMARY KEY (`id`)",
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
		"",
		"--",
		"-- Dumping data for table `users`",
		"--",
		"",
		"INSERT INTO `users` (`id`, `username`, `email`, `password`, `created_at`) VALUES",
		`(1, 'admin', '${helpers.fakeEmail()}', '$2y$10$${helpers.fakePhpSecret().slice(0, 53)}', '${timestamp}'),`,
		`(2, 'user', '${helpers.fakeEmail()}', '$2y$10$${helpers.fakePhpSecret().slice(0, 53)}', '${timestamp}');`,
		"",
		"--",
		"-- Table structure for table `sessions`",
		"--",
		"",
		"DROP TABLE IF EXISTS `sessions`;",
		"CREATE TABLE `sessions` (",
		"  `id` varchar(255) NOT NULL,",
		"  `user_id` int(11) DEFAULT NULL,",
		"  `ip_address` varchar(45) DEFAULT NULL,",
		"  `payload` text,",
		"  `last_activity` int(11) NOT NULL,",
		"  PRIMARY KEY (`id`)",
		") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
		"",
		"--",
		"-- Database credentials (for reference)",
		`-- DB_HOST: ${helpers.fakeTestNetIPv4()}`,
		`-- DB_USER: root`,
		`-- DB_PASS: ${helpers.fakeMysqlPassword()}`,
		"--",
	];

	return sections.join("\n");
};
