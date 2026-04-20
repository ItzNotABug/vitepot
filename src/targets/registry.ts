import type { TrapKind } from "../config";
import { DEFAULT_CONTENT_TYPES } from "../constants.js";

/**
 * Infer generator kind from file path
 */
export function inferKindFromPath(path: string): TrapKind {
	// WordPress specific
	if (
		path.includes("wp-config") ||
		path.includes("wp-login") ||
		path.includes("xmlrpc")
	) {
		return "wordpress";
	}

	// Git specific
	if (path.includes(".git/")) {
		return "git";
	}

	// File extension based inference
	const ext = getExtension(path);
	switch (ext) {
		case ".env":
			return "env";
		case ".sql":
			return "sql";
		case ".log":
			return "log";
		case ".php":
			return "php";
		case ".json":
			return "json";
		case ".js":
		case ".mjs":
			return "js";
		case ".yml":
		case ".yaml":
			return "yaml";
		case ".py":
			return "python";
		case ".ini":
		case ".conf":
			return "ini";
		case ".htaccess":
		case ".htpasswd":
		case "web.config":
			return "server";
		default:
			return "text";
	}
}

/**
 * Get content type for a path
 */
export function getContentType(path: string): string {
	const ext = getExtension(path);
	return DEFAULT_CONTENT_TYPES[ext] ?? "text/plain";
}

/**
 * Get file extension from path (including dot)
 */
function getExtension(path: string): string {
	// Handle special cases
	if (path.endsWith(".htaccess")) return ".htaccess";
	if (path.endsWith(".htpasswd")) return ".htpasswd";
	if (path.endsWith("web.config")) return "web.config";

	// Handle paths ending with /
	if (path.endsWith("/")) return "";

	// Standard extension extraction
	const parts = path.split("/");
	const filename = parts[parts.length - 1];
	const dotIndex = filename.lastIndexOf(".");

	if (dotIndex === -1) {
		return "";
	}

	// For files starting with dot (.env, .gitignore), return the whole filename as extension
	if (dotIndex === 0) {
		return filename;
	}

	return filename.slice(dotIndex);
}
