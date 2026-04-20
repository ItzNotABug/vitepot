import type { Generator } from "./shared.js";
import { addWarningComment, createHeader } from "./shared.js";

/**
 * Python config file generator
 */
export const pythonGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const header = createHeader(
		[
			"Production Configuration",
			`Generated: ${helpers.fakeTimestamp()}`,
			addWarningComment(path, "hash").replace("#", "").trim(),
		],
		"hash",
	);

	const sections = [
		header,
		"",
		"# Application settings",
		"APP_NAME = 'production-app'",
		"ENVIRONMENT = 'production'",
		`APP_URL = 'https://${helpers.fakeDomain()}'`,
		`SECRET_KEY = '${helpers.fakePhpSecret()}'`,
		"DEBUG = False",
		"",
		"# Database configuration",
		"DATABASE = {",
		"    'ENGINE': 'django.db.backends.mysql',",
		`    'NAME': '${helpers.fakeDomain().split(".")[0]}_db',`,
		"    'USER': 'app_user',",
		`    'PASSWORD': '${helpers.fakeMysqlPassword()}',`,
		`    'HOST': '${helpers.fakeTestNetIPv4()}',`,
		"    'PORT': '3306',",
		"}",
		"",
		"# Cache configuration",
		"CACHES = {",
		"    'default': {",
		"        'BACKEND': 'django.core.cache.backends.redis.RedisCache',",
		`        'LOCATION': 'redis://${helpers.fakeTestNetIPv4()}:6379/1',`,
		"    }",
		"}",
		"",
		"# Email configuration",
		"EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'",
		`EMAIL_HOST = '${helpers.fakeHostname()}'`,
		"EMAIL_PORT = 587",
		"EMAIL_USE_TLS = True",
		`EMAIL_HOST_USER = '${helpers.fakeEmail()}'`,
		`EMAIL_HOST_PASSWORD = '${helpers.fakeMysqlPassword()}'`,
		"",
		"# AWS configuration",
		`AWS_ACCESS_KEY_ID = '${helpers.fakeCloudKey()}'`,
		`AWS_SECRET_ACCESS_KEY = '${helpers.fakeJwtLikeSecret()}'`,
		"AWS_STORAGE_BUCKET_NAME = 'production-uploads'",
		"AWS_S3_REGION_NAME = 'us-east-1'",
		"",
		"# API keys",
		`API_KEY = '${helpers.fakeApiToken()}'`,
		`JWT_SECRET = '${helpers.fakeJwtLikeSecret()}'`,
		`STRIPE_API_KEY = '${helpers.fakeApiToken()}'`,
		"",
		"# AI Services",
		`OPENAI_API_KEY = '${helpers.fakeApiToken()}'`,
		`ANTHROPIC_API_KEY = '${helpers.fakeApiToken()}'`,
		`GOOGLE_API_KEY = '${helpers.fakeApiToken()}'`,
		`HUGGINGFACE_API_KEY = '${helpers.fakeApiToken()}'`,
		"",
		"# Database Services",
		`SUPABASE_URL = 'https://${helpers.fakeDomain()}'`,
		`SUPABASE_KEY = '${helpers.fakeJwtLikeSecret()}'`,
		`NEON_DATABASE_URL = 'postgresql://user:${helpers.fakeMysqlPassword()}@${helpers.fakeHostname()}/db'`,
		"",
		"# Auth & Monitoring",
		`CLERK_SECRET_KEY = '${helpers.fakeApiToken()}'`,
		`SENTRY_DSN = 'https://${helpers.fakeApiToken()}@${helpers.fakeHostname()}/123'`,
	];

	return sections.join("\n");
};
