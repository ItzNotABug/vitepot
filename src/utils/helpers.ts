import { en, Faker } from "@faker-js/faker";
import type { TrapHelpers } from "../config";

/**
 * Per-file coherent fake identity profile
 * Ensures consistent domain/hostname/email within one trap file
 */
interface FileProfile {
	domain: string;
	baseName: string;
	user: string;
	email: string;
	hostname: string;
	ipAddress: string;
	dbName: string;
}

/**
 * Create trap helpers with deterministic Faker instance based on path
 * Generates a coherent per-file profile for consistency
 */
export function createTrapHelpers(path: string): TrapHelpers {
	// Create a new Faker instance seeded deterministically by path hash
	const faker = new Faker({ locale: en });
	const seed = hashString(path);
	faker.seed(seed);

	// Generate coherent per-file profile (memoized on first access)
	let profile: FileProfile | null = null;
	const getProfile = (): FileProfile => {
		if (!profile) {
			const baseName = faker.word.adjective() + faker.word.noun();
			const userName = faker.internet.username().toLowerCase();
			profile = {
				domain: `${baseName}.test`,
				baseName,
				user: userName,
				email: `${userName}@${baseName}.test`,
				hostname: `${faker.word.noun()}-${faker.number.int({ min: 1, max: 99 })}.${baseName}.test`,
				ipAddress: (() => {
					const ranges = ["192.0.2", "198.51.100", "203.0.113"];
					const range = faker.helpers.arrayElement(ranges);
					return `${range}.${faker.number.int({ min: 1, max: 254 })}`;
				})(),
				dbName: `${baseName.replace(/[^a-z0-9]/g, "_")}_prod`,
			};
		}
		return profile;
	};

	return {
		fakeDomain(): string {
			// Return consistent domain from profile
			return getProfile().domain;
		},

		fakeEmail(): string {
			// Return consistent email from profile
			return getProfile().email;
		},

		fakeHostname(): string {
			// Return consistent hostname from profile
			return getProfile().hostname;
		},

		fakeTestNetIPv4(): string {
			// Return consistent IP from profile
			return getProfile().ipAddress;
		},

		fakeMysqlPassword(): string {
			// Strong password with special chars
			return faker.internet.password({
				length: faker.number.int({ min: 16, max: 24 }),
				memorable: false,
				pattern: /[A-Za-z0-9!@#$%^&*]/,
			});
		},

		fakeApiToken(): string {
			// API token format: prefix_alphanumeric
			const prefix = faker.helpers.arrayElement([
				"sk_live",
				"pk_live",
				"api",
				"token",
			]);
			const token = faker.string.alphanumeric(32);
			return `${prefix}_${token}`;
		},

		fakePhpSecret(): string {
			// PHP-style 64-character hex secret (Laravel APP_KEY format)
			return faker.string.hexadecimal({
				length: 64,
				casing: "lower",
				prefix: "",
			});
		},

		fakeJwtLikeSecret(): string {
			// JWT-like base64 secret
			return faker.string.alphanumeric({
				length: faker.number.int({ min: 32, max: 48 }),
			});
		},

		fakeCloudKey(): string {
			// AWS-like access key: AKIA + 16 uppercase alphanumeric
			const key = faker.string.alphanumeric({
				length: 16,
				casing: "upper",
			});
			return `AKIA${key}`;
		},

		fakeTimestamp(): string {
			// Recent timestamp (within last 30 days)
			const past = faker.date.recent({ days: 30 });
			return past.toISOString();
		},

		// Provider-specific token formats
		fakeOpenAIKey(): string {
			// OpenAI format: sk-proj-XXXX (48 chars base64-like)
			return `sk-proj-${faker.string.alphanumeric({ length: 48 })}`;
		},

		fakeAnthropicKey(): string {
			// Anthropic format: sk-ant-apiXX-XXXX (long base64-like)
			const version = faker.helpers.arrayElement(["api03", "api04"]);
			return `sk-ant-${version}-${faker.string.alphanumeric({ length: 64 })}`;
		},

		fakeGoogleAIKey(): string {
			// Google AI format: AIzaSyXXXX (39 chars)
			return `AIzaSy${faker.string.alphanumeric({ length: 33 })}`;
		},

		fakeHuggingFaceToken(): string {
			// HuggingFace format: hf_XXXX
			return `hf_${faker.string.alphanumeric({ length: 34 })}`;
		},

		fakeStripeKey(): string {
			// Stripe format: sk_live_XXXX or pk_live_XXXX
			const type = faker.helpers.arrayElement(["sk", "pk"]);
			return `${type}_live_${faker.string.alphanumeric({ length: 24 })}`;
		},

		fakeSupabaseKey(): string {
			// Supabase anon key is a JWT-like token (very long)
			const parts = [
				faker.string.alphanumeric({ length: 36 }),
				faker.string.alphanumeric({ length: 400 }),
				faker.string.alphanumeric({ length: 43 }),
			];
			return parts.join(".");
		},

		fakeClerkKey(): string {
			// Clerk format: sk_live_XXXX or pk_live_XXXX
			const type = faker.helpers.arrayElement(["sk", "pk"]);
			return `${type}_live_${faker.string.alphanumeric({ length: 40 })}`;
		},

		fakeVercelToken(): string {
			// Vercel format: long alphanumeric
			return faker.string.alphanumeric({ length: 24 });
		},

		fakeSentryDSN(): string {
			// Sentry DSN format: https://PUBLIC@HOST/PROJECT_ID
			// Use consistent domain from profile
			const publicKey = faker.string.hexadecimal({
				length: 32,
				prefix: "",
				casing: "lower",
			});
			const projectId = faker.number.int({ min: 1, max: 999999 });
			return `https://${publicKey}@${getProfile().domain}/${projectId}`;
		},
	};
}

/**
 * Simple string hash function for seeding
 */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}
