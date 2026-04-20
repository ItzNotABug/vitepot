import type { TrapKind } from "../config";

/**
 * Logical trap definition before expansion
 */
export interface LogicalTrap {
	/** Trap path (relative to any directory) */
	path: string;
	/** Generator kind */
	kind: TrapKind;
	/** Override content type (optional, defaults from extension) */
	contentType?: string;
	/** Compatible variant presets (empty = not compatible with variants) */
	compatibleVariants?: string[];
}

/**
 * Default trap set - the complete built-in trap collection
 * This is what users get out of the box
 */
export const DEFAULT_TRAPS: LogicalTrap[] = [
	// Environment and credentials
	{ path: "/.env", kind: "env" },
	{ path: "/.env.local", kind: "env" },
	{ path: "/.env.production", kind: "env" },
	{ path: "/.aws/credentials", kind: "ini" },
	{ path: "/id_rsa", kind: "text" },

	// Version control and source exposure
	{ path: "/.git/config", kind: "git" },
	{ path: "/.git/HEAD", kind: "git" },
	{ path: "/.git/index", kind: "text" },
	{ path: "/.git/logs/HEAD", kind: "log" },
	{ path: "/.svn/entries", kind: "text" },

	// CMS and PHP config
	{
		path: "/wp-config.php",
		kind: "wordpress",
		compatibleVariants: ["cms-roots"],
	},
	{
		path: "/wp-config.php.bak",
		kind: "wordpress",
		compatibleVariants: ["cms-roots"],
	},
	{
		path: "/config.php",
		kind: "php",
		compatibleVariants: ["app-roots"],
	},
	{
		path: "/config.inc.php",
		kind: "php",
		compatibleVariants: ["app-roots"],
	},
	{ path: "/settings.php", kind: "php" },
	{ path: "/configuration.php", kind: "php" },
	{ path: "/web.config", kind: "server", contentType: "application/xml" },

	// Backups and dumps
	{
		path: "/backup.sql",
		kind: "sql",
		compatibleVariants: ["archive-roots"],
	},
	{
		path: "/dump.sql",
		kind: "sql",
		compatibleVariants: ["archive-roots"],
	},
	{
		path: "/db.sql",
		kind: "sql",
		compatibleVariants: ["archive-roots"],
	},

	// Access control and server config
	{ path: "/.htpasswd", kind: "text" },
	{ path: "/.htaccess", kind: "server" },

	// Logs
	{ path: "/storage/logs/laravel.log", kind: "log" },
	{ path: "/debug.log", kind: "log" },
	{ path: "/error_log", kind: "log" },

	// WordPress admin and recon
	{
		path: "/wp-login.php",
		kind: "wordpress",
		compatibleVariants: ["cms-roots"],
	},
	{
		path: "/xmlrpc.php",
		kind: "wordpress",
		compatibleVariants: ["cms-roots"],
	},
	{
		path: "/wp-json/wp/v2/users",
		kind: "json",
		contentType: "application/json",
		compatibleVariants: ["cms-roots"],
	},

	// Framework and deployment config files
	{ path: "/vercel.json", kind: "json" },
	{ path: "/appsettings.json", kind: "json" },
	{ path: "/appsettings.Production.json", kind: "json" },
	{ path: "/next.config.js", kind: "js" },
	{ path: "/next.config.mjs", kind: "js" },
	{ path: "/nuxt.config.ts", kind: "js" }, // TypeScript config, but uses JS generator
	{ path: "/astro.config.mjs", kind: "js" },
	{ path: "/config/database.yml", kind: "yaml" },
	{ path: "/settings.py", kind: "python" },
	{ path: "/local_settings.py", kind: "python" },
	{ path: "/connectionstrings.config", kind: "ini" },
	{ path: "/php.ini", kind: "ini" },
	{ path: "/config.json", kind: "json" },
	{ path: "/credentials.json", kind: "json" },
	{ path: "/env.js", kind: "js" },
];

/**
 * Get all default traps
 */
export function getDefaultTraps(): LogicalTrap[] {
	return DEFAULT_TRAPS;
}

/**
 * Get traps compatible with a specific variant
 */
export function getTrapsForVariant(variant: string): LogicalTrap[] {
	return DEFAULT_TRAPS.filter((trap) =>
		trap.compatibleVariants?.includes(variant),
	);
}
