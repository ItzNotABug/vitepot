/**
 * Generator registry
 * Maps trap kinds to their generator functions
 */

import type { TrapKind } from "../config";
import { envGenerator } from "./env.js";
import { gitConfigGenerator, gitHeadGenerator } from "./git.js";
import { iniGenerator } from "./ini.js";
import { jsGenerator } from "./js.js";
import { jsonGenerator } from "./json.js";
import { logGenerator } from "./log.js";
import { phpGenerator } from "./php.js";
import { pythonGenerator } from "./python.js";
import {
	htaccessGenerator,
	htpasswdGenerator,
	webConfigGenerator,
} from "./server.js";
import type { Generator } from "./shared.js";
import { sqlGenerator } from "./sql.js";
import { textGenerator } from "./text.js";
import { wordpressGenerator, xmlrpcGenerator } from "./wordpress.js";
import { yamlGenerator } from "./yaml.js";

/**
 * Generator registry mapping kind to generator function
 */
const GENERATOR_MAP: Record<TrapKind, Generator> = {
	env: envGenerator,
	wordpress: wordpressGenerator,
	php: phpGenerator,
	sql: sqlGenerator,
	git: gitConfigGenerator,
	server: htaccessGenerator, // Default server generator
	json: jsonGenerator,
	js: jsGenerator,
	yaml: yamlGenerator,
	python: pythonGenerator,
	ini: iniGenerator,
	log: logGenerator,
	text: textGenerator,
};

/**
 * Special filename-specific generator overrides
 * Maps basename to generator (works for any directory)
 */
const FILENAME_SPECIFIC_GENERATORS: Record<string, Generator> = {
	HEAD: gitHeadGenerator, // .git/HEAD
	"xmlrpc.php": xmlrpcGenerator,
	".htpasswd": htpasswdGenerator,
	"web.config": webConfigGenerator,
};

/**
 * Get generator for a given kind and path
 */
export function getGenerator(kind: TrapKind, path: string): Generator {
	// Extract basename from path (e.g., '/blog/xmlrpc.php' -> 'xmlrpc.php')
	const basename = path.split("/").pop() || "";

	// Check for filename-specific overrides first
	const filenameOverride = FILENAME_SPECIFIC_GENERATORS[basename];
	if (filenameOverride) {
		return filenameOverride;
	}

	// Fall back to kind-based generator
	return GENERATOR_MAP[kind] ?? textGenerator;
}

/**
 * Export all generator types for testing
 */
export type { Generator, GeneratorContext } from "./shared.js";
