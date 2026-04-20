import type { Generator } from "./shared.js";
import { addWarningComment, createHeader } from "./shared.js";

/**
 * Generic PHP file generator
 * Creates config-like PHP files
 */
export const phpGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const header = createHeader(
		[
			"PHP Configuration",
			`Generated: ${helpers.fakeTimestamp()}`,
			addWarningComment(path, "slash").replace("//", "").trim(),
		],
		"slash",
	);

	const sections = [
		"<?php",
		header,
		"",
		"// Application config",
		"return [",
		`    'app_name' => 'Production App',`,
		`    'app_url' => 'https://${helpers.fakeDomain()}',`,
		`    'environment' => 'production',`,
		"",
		"    // Database",
		"    'database' => [",
		"        'driver' => 'mysql',",
		`        'host' => '${helpers.fakeTestNetIPv4()}',`,
		"        'port' => 3306,",
		`        'database' => '${helpers.fakeDomain().split(".")[0]}_db',`,
		"        'username' => 'app_user',",
		`        'password' => '${helpers.fakeMysqlPassword()}',`,
		"        'charset' => 'utf8mb4',",
		"    ],",
		"",
		"    // Cache",
		"    'cache' => [",
		"        'driver' => 'redis',",
		`        'host' => '${helpers.fakeTestNetIPv4()}',`,
		"        'port' => 6379,",
		"    ],",
		"",
		"    // API keys",
		`    'api_key' => '${helpers.fakeApiToken()}',`,
		`    'api_secret' => '${helpers.fakeJwtLikeSecret()}',`,
		"",
		"    // Cloud storage",
		"    'storage' => [",
		`        'access_key' => '${helpers.fakeCloudKey()}',`,
		`        'secret_key' => '${helpers.fakeJwtLikeSecret()}',`,
		"        'bucket' => 'production-files',",
		"        'region' => 'us-east-1',",
		"    ],",
		"];",
	];

	return sections.join("\n");
};
