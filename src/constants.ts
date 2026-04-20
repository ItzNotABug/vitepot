/**
 * Plugin name and log prefix
 */
export const PLUGIN_NAME = "vitepot";
export const LOG_PREFIX = `[${PLUGIN_NAME}]`;

/**
 * Variant preset directory mappings
 */
export const VARIANT_DIRS: Record<string, string[]> = {
	"cms-roots": ["/blog", "/site", "/wordpress"],
	"app-roots": ["/public", "/api"],
	"archive-roots": ["/backup", "/backups", "/old"],
};

/**
 * Default content types by file extension
 */
export const DEFAULT_CONTENT_TYPES: Record<string, string> = {
	".php": "text/plain",
	".env": "text/plain",
	".sql": "text/plain",
	".log": "text/plain",
	".txt": "text/plain",
	".yml": "text/yaml",
	".yaml": "text/yaml",
	".json": "application/json",
	".xml": "application/xml",
	".js": "text/javascript",
	".mjs": "text/javascript",
	".ts": "text/typescript",
	".mts": "text/typescript",
	".py": "text/x-python",
	".ini": "text/plain",
	".conf": "text/plain",
	".config": "text/plain",
	".pem": "text/plain",
	".key": "text/plain",
	".crt": "text/plain",
	".html": "text/html",
};
