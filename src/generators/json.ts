import type { Generator } from "./shared.js";

/**
 * Generic JSON config generator
 */
export const jsonGenerator: Generator = (ctx) => {
	const { helpers } = ctx;

	const config = {
		name: "production-app",
		version: "1.0.0",
		environment: "production",
		timestamp: helpers.fakeTimestamp(),
		api: {
			baseUrl: `https://${helpers.fakeDomain()}/api`,
			key: helpers.fakeApiToken(),
			secret: helpers.fakeJwtLikeSecret(),
		},
		database: {
			host: helpers.fakeTestNetIPv4(),
			port: 3306,
			name: `${helpers.fakeDomain().split(".")[0]}_db`,
			user: "app_user",
			password: helpers.fakeMysqlPassword(),
		},
		cache: {
			driver: "redis",
			host: helpers.fakeTestNetIPv4(),
			port: 6379,
		},
		services: {
			stripe: {
				publicKey: helpers.fakeApiToken(),
				secretKey: helpers.fakeApiToken(),
			},
			aws: {
				accessKeyId: helpers.fakeCloudKey(),
				secretAccessKey: helpers.fakeJwtLikeSecret(),
				region: "us-east-1",
				bucket: "production-uploads",
			},
			ai: {
				openai: helpers.fakeApiToken(),
				anthropic: helpers.fakeApiToken(),
				google: helpers.fakeApiToken(),
				huggingface: helpers.fakeApiToken(),
			},
			database: {
				supabase: {
					url: `https://${helpers.fakeDomain()}`,
					anonKey: helpers.fakeJwtLikeSecret(),
				},
				neon: `postgresql://user:${helpers.fakeMysqlPassword()}@${helpers.fakeHostname()}/db`,
			},
			auth: {
				clerk: {
					secretKey: helpers.fakeApiToken(),
					publishableKey: helpers.fakeApiToken(),
				},
			},
			monitoring: {
				sentry: `https://${helpers.fakeApiToken()}@${helpers.fakeHostname()}/123`,
				datadog: helpers.fakeApiToken(),
			},
		},
		_comment: "TODO: Remove before deploy!",
	};

	return JSON.stringify(config, null, 2);
};
