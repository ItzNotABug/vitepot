import type { Generator } from "./shared.js";
import { addWarningComment } from "./shared.js";

/**
 * INI/conf file generator
 */
export const iniGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const sections = [
		`; ${addWarningComment(path, "hash").replace("#", "").trim()}`,
		`; Production configuration - ${helpers.fakeTimestamp()}`,
		"",
		"[app]",
		'name = "Production App"',
		"environment = production",
		`url = https://${helpers.fakeDomain()}`,
		`secret_key = ${helpers.fakePhpSecret()}`,
		"debug = false",
		"",
		"[database]",
		"driver = mysql",
		`host = ${helpers.fakeTestNetIPv4()}`,
		"port = 3306",
		`database = ${helpers.fakeDomain().split(".")[0]}_db`,
		"username = app_user",
		`password = ${helpers.fakeMysqlPassword()}`,
		"",
		"[cache]",
		"driver = redis",
		`host = ${helpers.fakeTestNetIPv4()}`,
		"port = 6379",
		"",
		"[mail]",
		"driver = smtp",
		`host = ${helpers.fakeHostname()}`,
		"port = 587",
		`username = ${helpers.fakeEmail()}`,
		`password = ${helpers.fakeMysqlPassword()}`,
		"encryption = tls",
		"",
		"[aws]",
		`access_key_id = ${helpers.fakeCloudKey()}`,
		`secret_access_key = ${helpers.fakeJwtLikeSecret()}`,
		"region = us-east-1",
		"bucket = production-uploads",
		"",
		"[api]",
		`key = ${helpers.fakeApiToken()}`,
		`secret = ${helpers.fakeJwtLikeSecret()}`,
		"",
		"[ai]",
		`openai_key = ${helpers.fakeApiToken()}`,
		`anthropic_key = ${helpers.fakeApiToken()}`,
		`google_key = ${helpers.fakeApiToken()}`,
		"",
		"[supabase]",
		`url = https://${helpers.fakeDomain()}`,
		`key = ${helpers.fakeJwtLikeSecret()}`,
		"",
		"[monitoring]",
		`sentry_dsn = https://${helpers.fakeApiToken()}@${helpers.fakeHostname()}/123`,
	];

	return sections.join("\n");
};
