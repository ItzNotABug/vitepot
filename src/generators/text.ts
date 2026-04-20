import type { Generator } from "./shared.js";

/**
 * Plain text file generator
 * Fallback for unknown file types
 */
export const textGenerator: Generator = (ctx) => {
	const { helpers } = ctx;

	const sections = [
		"Production Configuration Notes",
		`Generated: ${helpers.fakeTimestamp()}`,
		"TODO: Remove this file before deploying!",
		"",
		"=== Environment Details ===",
		`Site: https://${helpers.fakeDomain()}`,
		`API: https://${helpers.fakeDomain()}/api`,
		"",
		"=== Database ===",
		`Host: ${helpers.fakeTestNetIPv4()}`,
		"Port: 3306",
		`Database: ${helpers.fakeDomain().split(".")[0]}_db`,
		"User: app_user",
		`Password: ${helpers.fakeMysqlPassword()}`,
		"",
		"=== Cache ===",
		`Redis: ${helpers.fakeTestNetIPv4()}:6379`,
		"",
		"=== API Keys ===",
		`API Key: ${helpers.fakeApiToken()}`,
		`JWT Secret: ${helpers.fakeJwtLikeSecret()}`,
		"",
		"=== AWS Credentials ===",
		`Access Key: ${helpers.fakeCloudKey()}`,
		`Secret Key: ${helpers.fakeJwtLikeSecret()}`,
		"Region: us-east-1",
		"Bucket: production-uploads",
		"",
		"=== Mail Server ===",
		`Host: ${helpers.fakeHostname()}`,
		"Port: 587",
		`Username: ${helpers.fakeEmail()}`,
		`Password: ${helpers.fakeMysqlPassword()}`,
		"",
		"WARNING: This file contains sensitive production credentials!",
		"FIXME: Move to proper secrets management",
	];

	return sections.join("\n");
};
