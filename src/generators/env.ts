import type { Generator } from "./shared.js";
import { addWarningComment } from "./shared.js";

/**
 * Environment file generator
 * Creates realistic .env files with fake credentials
 */
export const envGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const sections = [
		// Warning comment that looks like careless leak
		addWarningComment(path, "hash"),
		"",
		// App metadata
		'APP_NAME="Production App"',
		"APP_ENV=production",
		`APP_KEY=${helpers.fakePhpSecret()}`,
		"APP_DEBUG=false",
		`APP_URL=https://${helpers.fakeDomain()}`,
		"",
		// Database config
		`DB_CONNECTION=mysql`,
		`DB_HOST=${helpers.fakeTestNetIPv4()}`,
		"DB_PORT=3306",
		`DB_DATABASE=${helpers.fakeDomain().split(".")[0]}_prod`,
		"DB_USERNAME=root",
		`DB_PASSWORD=${helpers.fakeMysqlPassword()}`,
		"",
		// Cache and session
		"CACHE_DRIVER=redis",
		"SESSION_DRIVER=redis",
		`REDIS_HOST=${helpers.fakeTestNetIPv4()}`,
		"REDIS_PASSWORD=null",
		"REDIS_PORT=6379",
		"",
		// Mail config
		"MAIL_MAILER=smtp",
		`MAIL_HOST=${helpers.fakeHostname()}`,
		"MAIL_PORT=587",
		`MAIL_USERNAME=${helpers.fakeEmail()}`,
		`MAIL_PASSWORD=${helpers.fakeMysqlPassword()}`,
		"MAIL_ENCRYPTION=tls",
		`MAIL_FROM_ADDRESS=${helpers.fakeEmail()}`,
		`MAIL_FROM_NAME="\${APP_NAME}"`,
		"",
		// Cloud credentials
		`AWS_ACCESS_KEY_ID=${helpers.fakeCloudKey()}`,
		`AWS_SECRET_ACCESS_KEY=${helpers.fakeJwtLikeSecret()}`,
		"AWS_DEFAULT_REGION=us-east-1",
		"AWS_BUCKET=production-uploads",
		"",
		// API keys
		`API_SECRET=${helpers.fakeApiToken()}`,
		`JWT_SECRET=${helpers.fakeJwtLikeSecret()}`,
		"",
		// Third-party services
		`STRIPE_KEY=${helpers.fakeApiToken()}`,
		`STRIPE_SECRET=${helpers.fakeApiToken()}`,
		`GOOGLE_CLIENT_ID=${helpers.fakeCloudKey()}`,
		`GOOGLE_CLIENT_SECRET=${helpers.fakeJwtLikeSecret()}`,
		"",
		// AI Services (2024-2025 trending)
		`OPENAI_API_KEY=${helpers.fakeApiToken()}`,
		`ANTHROPIC_API_KEY=${helpers.fakeApiToken()}`,
		`GOOGLE_API_KEY=${helpers.fakeApiToken()}`,
		`GEMINI_API_KEY=${helpers.fakeApiToken()}`,
		`HUGGINGFACE_API_KEY=${helpers.fakeApiToken()}`,
		`REPLICATE_API_TOKEN=${helpers.fakeApiToken()}`,
		`COHERE_API_KEY=${helpers.fakeApiToken()}`,
		"",
		// Vector Databases & AI Infrastructure
		`PINECONE_API_KEY=${helpers.fakeApiToken()}`,
		`PINECONE_ENVIRONMENT=us-east-1-aws`,
		`WEAVIATE_API_KEY=${helpers.fakeApiToken()}`,
		`QDRANT_API_KEY=${helpers.fakeApiToken()}`,
		"",
		// Modern Database Services
		`SUPABASE_URL=https://${helpers.fakeDomain()}`,
		`SUPABASE_ANON_KEY=${helpers.fakeJwtLikeSecret()}`,
		`SUPABASE_SERVICE_ROLE_KEY=${helpers.fakeJwtLikeSecret()}`,
		`NEON_DATABASE_URL=postgresql://user:${helpers.fakeMysqlPassword()}@${helpers.fakeHostname()}/dbname`,
		`PLANETSCALE_DATABASE_URL=mysql://user:${helpers.fakeMysqlPassword()}@${helpers.fakeHostname()}/dbname`,
		`RAILWAY_DATABASE_URL=postgresql://user:${helpers.fakeMysqlPassword()}@${helpers.fakeHostname()}/dbname`,
		"",
		// Auth & Identity Services
		`CLERK_SECRET_KEY=${helpers.fakeApiToken()}`,
		`CLERK_PUBLISHABLE_KEY=${helpers.fakeApiToken()}`,
		`AUTH0_CLIENT_ID=${helpers.fakeCloudKey()}`,
		`AUTH0_CLIENT_SECRET=${helpers.fakeJwtLikeSecret()}`,
		`AUTH0_DOMAIN=${helpers.fakeDomain()}`,
		"",
		// Communication & Email Services
		`RESEND_API_KEY=${helpers.fakeApiToken()}`,
		`SENDGRID_API_KEY=${helpers.fakeApiToken()}`,
		`TWILIO_ACCOUNT_SID=${helpers.fakeApiToken()}`,
		`TWILIO_AUTH_TOKEN=${helpers.fakeApiToken()}`,
		"",
		// Monitoring & Analytics
		`SENTRY_DSN=https://${helpers.fakeApiToken()}@${helpers.fakeHostname()}/123456`,
		`SENTRY_AUTH_TOKEN=${helpers.fakeApiToken()}`,
		`DATADOG_API_KEY=${helpers.fakeApiToken()}`,
		`MIXPANEL_TOKEN=${helpers.fakeApiToken()}`,
		`POSTHOG_API_KEY=${helpers.fakeApiToken()}`,
		"",
		// Deployment & Infrastructure
		`VERCEL_TOKEN=${helpers.fakeApiToken()}`,
		`CLOUDFLARE_API_TOKEN=${helpers.fakeApiToken()}`,
		`CLOUDFLARE_ACCOUNT_ID=${helpers.fakeCloudKey()}`,
		`NETLIFY_AUTH_TOKEN=${helpers.fakeApiToken()}`,
		`RAILWAY_TOKEN=${helpers.fakeApiToken()}`,
	];

	return sections.join("\n");
};
