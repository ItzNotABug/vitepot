import type { Generator } from "./shared.js";

/**
 * Log file generator
 * Creates realistic application log files
 */
export const logGenerator: Generator = (ctx) => {
	const { helpers } = ctx;
	const timestamp = helpers.fakeTimestamp();

	const sections = [
		`[${timestamp}] INFO: Application started`,
		`[${timestamp}] INFO: Environment: production`,
		`[${timestamp}] INFO: Database connected: ${helpers.fakeTestNetIPv4()}:3306`,
		`[${timestamp}] INFO: Redis connected: ${helpers.fakeTestNetIPv4()}:6379`,
		`[${timestamp}] WARN: Using default encryption key`,
		`[${timestamp}] INFO: API endpoint: https://${helpers.fakeDomain()}/api`,
		`[${timestamp}] DEBUG: API_KEY=${helpers.fakeApiToken()}`,
		`[${timestamp}] DEBUG: JWT_SECRET=${helpers.fakeJwtLikeSecret()}`,
		`[${timestamp}] INFO: Mail server: ${helpers.fakeHostname()}:587`,
		`[${timestamp}] DEBUG: SMTP_USER=${helpers.fakeEmail()}`,
		`[${timestamp}] DEBUG: SMTP_PASS=${helpers.fakeMysqlPassword()}`,
		`[${timestamp}] INFO: AWS S3 bucket: production-uploads`,
		`[${timestamp}] DEBUG: AWS_ACCESS_KEY=${helpers.fakeCloudKey()}`,
		`[${timestamp}] DEBUG: AWS_SECRET=${helpers.fakeJwtLikeSecret()}`,
		`[${timestamp}] WARN: Debug mode enabled in production!`,
		`[${timestamp}] INFO: Server listening on 0.0.0.0:3000`,
		`[${timestamp}] INFO: Admin panel: https://${helpers.fakeDomain()}/admin`,
		`[${timestamp}] DEBUG: Admin credentials: admin / ${helpers.fakeMysqlPassword()}`,
		`[${timestamp}] ERROR: Failed to redact sensitive data from logs`,
		`[${timestamp}] WARN: TODO: Fix log sanitization before deploy`,
	];

	return sections.join("\n");
};
