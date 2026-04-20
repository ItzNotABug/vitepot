/**
 * Variant preset names for common directory patterns
 */
export type VariantPreset = "cms-roots" | "app-roots" | "archive-roots";

/**
 * Generator kind - determines which content generator to use
 */
export type TrapKind =
	| "env"
	| "wordpress"
	| "php"
	| "sql"
	| "git"
	| "server"
	| "json"
	| "js"
	| "yaml"
	| "python"
	| "ini"
	| "log"
	| "text";

/**
 * Custom trap content - can be static or dynamically generated
 * Supports sync strings/binary, async Promises, and factory functions
 */
export type CustomTrapContent =
	| string
	| Uint8Array
	| Promise<string | Uint8Array>
	| ((
			ctx: CustomTrapContext,
	  ) => string | Uint8Array | Promise<string | Uint8Array>);

/**
 * Context passed to custom content generators
 */
export interface CustomTrapContext {
	/** The trap path being generated */
	path: string;
	/** Fake data helpers for consistent generation */
	helpers: TrapHelpers;
}

/**
 * Helpers for generating consistent fake data
 */
export interface TrapHelpers {
	fakeDomain(): string;
	fakeEmail(): string;
	fakeHostname(): string;
	fakeTestNetIPv4(): string;
	fakeMysqlPassword(): string;
	fakeApiToken(): string;
	fakePhpSecret(): string;
	fakeJwtLikeSecret(): string;
	fakeCloudKey(): string;
	fakeTimestamp(): string;
	// Provider-specific token formats
	fakeOpenAIKey(): string;
	fakeAnthropicKey(): string;
	fakeGoogleAIKey(): string;
	fakeHuggingFaceToken(): string;
	fakeStripeKey(): string;
	fakeSupabaseKey(): string;
	fakeClerkKey(): string;
	fakeVercelToken(): string;
	fakeSentryDSN(): string;
}

/**
 * Custom trap definition
 */
export interface CustomTrap {
	/** Trap path (must start with /) */
	path: string;
	/** Generator kind (optional, inferred if omitted) */
	kind?: TrapKind;
	/** Custom content (overrides generator) */
	content?: CustomTrapContent;
	/** Custom content type (overrides default) */
	contentType?: string;
	/** Directories to expand this trap into (in addition to root) */
	dirs?: string[];
}

/**
 * VitePot plugin options
 */
export interface VitePotOptions {
	/** Enable/disable plugin (default: true) */
	enabled?: boolean;
	/** Variant presets to enable */
	variants?: VariantPreset[];
	/** Additional directories to expand traps into */
	dirs?: string[];
	/** Custom trap definitions */
	custom?: CustomTrap[];
}

/**
 * Normalized internal config
 */
export interface NormalizedConfig {
	enabled: boolean;
	variants: VariantPreset[];
	dirs: string[];
	custom: CustomTrap[];
}

/**
 * Normalize and validate user config
 */
export function normalizeConfig(options?: VitePotOptions): NormalizedConfig {
	const enabled = options?.enabled ?? true;
	const variants = options?.variants ?? [];
	const dirs = normalizeDirs(options?.dirs ?? []);
	const custom = normalizeCustom(options?.custom ?? []);

	return {
		enabled,
		variants,
		dirs,
		custom,
	};
}

/**
 * Normalize directory paths
 * - Ensures root (/) is always included
 * - Deduplicates
 * - Normalizes slashes
 */
function normalizeDirs(dirs: string[]): string[] {
	const normalized = new Set<string>(["/", ...normalizeOnLoop(dirs)]);
	return Array.from(normalized).sort();
}

/**
 * Normalize custom trap directories (without adding root)
 */
function normalizeCustomDirs(dirs: string[]): string[] {
	const normalized = normalizeOnLoop(dirs);
	return Array.from(normalized).sort();
}

/**
 * Normalizes directory paths into unique absolute paths.
 *
 * - Adds a leading `/`
 * - Removes trailing `/` except for root
 *
 * @param dirs Directory paths to normalize.
 * @returns A set of normalized paths.
 */
function normalizeOnLoop(dirs: string[]): Set<string> {
	const normalized = new Set<string>();

	for (const dir of dirs) {
		if (!dir) continue;

		const path = dir.startsWith("/") ? dir : `/${dir}`;
		normalized.add(
			path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path,
		);
	}

	return normalized;
}

/**
 * Normalize and validate custom traps
 */
function normalizeCustom(custom: CustomTrap[]): CustomTrap[] {
	return custom.map((trap) => {
		// Validate path starts with /
		if (!trap.path.startsWith("/")) {
			throw new Error(
				`[vitepot] Custom trap path must start with '/': ${trap.path}`,
			);
		}

		// File traps should not end with /
		if (trap.path.endsWith("/") && trap.path !== "/") {
			throw new Error(
				`[vitepot] Custom file trap path must not end with '/': ${trap.path}`,
			);
		}

		// Normalize dirs if present
		const normalizedTrap: CustomTrap = {
			...trap,
		};

		if (trap.dirs) {
			// For custom trap dirs, don't add root automatically
			normalizedTrap.dirs = normalizeCustomDirs(trap.dirs);
		}

		return normalizedTrap;
	});
}
