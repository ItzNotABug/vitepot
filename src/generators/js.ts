import type { Generator } from "./shared.js";
import { addWarningComment, createHeader } from "./shared.js";

/**
 * JavaScript config file generator
 */
export const jsGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const header = createHeader(
		[
			"Production Configuration",
			`Generated: ${helpers.fakeTimestamp()}`,
			addWarningComment(path, "slash").replace("//", "").trim(),
		],
		"slash",
	);

	const sections = [
		header,
		"",
		"export default {",
		"  env: 'production',",
		`  apiUrl: 'https://${helpers.fakeDomain()}/api',`,
		`  apiKey: '${helpers.fakeApiToken()}',`,
		"",
		"  database: {",
		`    host: '${helpers.fakeTestNetIPv4()}',`,
		"    port: 3306,",
		`    name: '${helpers.fakeDomain().split(".")[0]}_db',`,
		"    user: 'app_user',",
		`    password: '${helpers.fakeMysqlPassword()}',`,
		"  },",
		"",
		"  redis: {",
		`    host: '${helpers.fakeTestNetIPv4()}',`,
		"    port: 6379,",
		"  },",
		"",
		"  jwt: {",
		`    secret: '${helpers.fakeJwtLikeSecret()}',`,
		"    expiresIn: '7d',",
		"  },",
		"",
		"  aws: {",
		`    accessKeyId: '${helpers.fakeCloudKey()}',`,
		`    secretAccessKey: '${helpers.fakeJwtLikeSecret()}',`,
		"    region: 'us-east-1',",
		"    bucket: 'production-files',",
		"  },",
		"",
		"  ai: {",
		`    openai: '${helpers.fakeApiToken()}',`,
		`    anthropic: '${helpers.fakeApiToken()}',`,
		`    google: '${helpers.fakeApiToken()}',`,
		"  },",
		"",
		"  supabase: {",
		`    url: 'https://${helpers.fakeDomain()}',`,
		`    anonKey: '${helpers.fakeJwtLikeSecret()}',`,
		"  },",
		"",
		"  clerk: {",
		`    secretKey: '${helpers.fakeApiToken()}',`,
		"  },",
		"",
		"  monitoring: {",
		`    sentry: 'https://${helpers.fakeApiToken()}@${helpers.fakeHostname()}/123',`,
		"  },",
		"};",
	];

	return sections.join("\n");
};
