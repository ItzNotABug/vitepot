import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import type { Connect, Plugin, ResolvedConfig } from "vite";
import { generateAllTraps } from "./build/generate.js";
import { planTraps } from "./build/plan.js";
import type { VitePotOptions } from "./config.js";
import { normalizeConfig } from "./config.js";

/**
 * Format vitepot log message with honey-colored tag
 * Adds newline prefix to avoid conflicts with spinner animations
 */
function formatLog(message: string): string {
	// ANSI escape code for yellow/honey color (33 = yellow)
	const honey = "\x1b[33m";
	const reset = "\x1b[0m";
	return `${honey}[vitepot]${reset} ${message}`;
}

/**
 * Recursively scan a directory and return Set of relative file paths
 * All paths are normalized to forward slashes for cross-platform consistency
 */
function scanDirectory(dir: string, baseDir: string = dir): Set<string> {
	const files = new Set<string>();

	try {
		const entries = readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				// Recurse into subdirectories
				const subFiles = scanDirectory(fullPath, baseDir);
				for (const file of subFiles) {
					files.add(file);
				}
			} else if (entry.isFile()) {
				// Add relative path from baseDir, normalized to forward slashes
				const relativePath = relative(baseDir, fullPath);
				// Replace backslashes with forward slashes for Windows compatibility
				const normalizedPath = relativePath.replace(/\\/g, "/");
				files.add(normalizedPath);
			}
		}
	} catch (err) {
		// Log warning if directory scan fails (permissions, misconfiguration, etc.)
		// This ensures collision protection doesn't silently fail
		if (err instanceof Error) {
			console.warn(
				formatLog(
					`Warning: Failed to scan directory "${dir}" - collision detection may be incomplete: ${err.message}`,
				),
			);
		}
	}

	return files;
}

/**
 * Check if a trap file should be skipped due to collisions
 * Returns skip reason or null if you should emit
 */
function shouldSkipTrap(
	fileName: string,
	bundle: import("rollup").OutputBundle,
	publicFiles?: Set<string>,
): string | null {
	// Check bundle collision
	if (bundle[fileName]) {
		return "file already exists in bundle";
	}

	// Check public directory collision (using pre-built Set)
	if (publicFiles?.has(fileName)) {
		return "file already exists in public/";
	}

	return null;
}

export type {
	CustomTrap,
	CustomTrapContent,
	CustomTrapContext,
	TrapHelpers,
	TrapKind,
	VariantPreset,
	VitePotOptions,
} from "./config.js";

/**
 * VitePot - VitePress honeypot plugin
 *
 * Serves fake sensitive files to waste bot resources.
 * - In dev: serves traps from memory (zero disk writes)
 * - In build: emits static trap files to output
 * - In preview: serves built traps
 *
 * @example
 * ```ts
 * import { vitepot } from '@itznotabug/vitepot';
 *
 * export default {
 *   vite: {
 *     plugins: [
 *       vitepot({
 *         variants: ['cms-roots'],
 *         dirs: ['/legacy'],
 *       })
 *     ]
 *   }
 * }
 * ```
 */
export function vitepot(options?: VitePotOptions): Plugin {
	const config = normalizeConfig(options);

	// Plan traps once at plugin initialization
	const plan = planTraps(config);

	// Generated traps promise (initialized lazily and cached)
	let generatedTrapsPromise: Promise<
		Map<string, Awaited<ReturnType<typeof generateAllTraps>>[number]>
	> | null = null;

	// Normalized base path (captured in configResolved)
	let normalizedBase = "/";

	// Track if we're in SSR build pass (true = skip emission)
	let isSSRBuild = false;

	// Store resolved config for access in generateBundle
	let resolvedConfig: ResolvedConfig | null = null;

	// Accumulate build messages to log at the end
	let buildMessages: Array<{ level: "info" | "warn"; message: string }> = [];

	// Initialize traps lazily and cache the promise
	const getTraps = async () => {
		if (!generatedTrapsPromise) {
			generatedTrapsPromise = generateAllTraps(plan.traps).then(
				(traps) => {
					// Create lookup map for fast path matching
					return new Map(traps.map((trap) => [trap.path, trap]));
				},
			);
		}
		return generatedTrapsPromise;
	};

	// Shared middleware handler for dev and preview
	const trapMiddleware: Connect.NextHandleFunction = async (
		req,
		res,
		next,
	) => {
		// Only handle GET requests
		if (req.method !== "GET") {
			return next();
		}

		// Clean URL (remove query string)
		let url = req.url?.split("?")[0] || "";

		// Strip base prefix if present
		if (normalizedBase !== "/" && url.startsWith(normalizedBase)) {
			url = url.slice(normalizedBase.length - 1); // Keep leading slash
		}

		// Get traps (cached after first call)
		const trapsByPath = await getTraps();

		// Check if this path matches a trap
		const trap = trapsByPath.get(url);
		if (!trap) {
			return next();
		}

		// Serve trap content (handle both string and binary)
		res.statusCode = 200;
		res.setHeader("Content-Type", trap.contentType);

		if (typeof trap.content === "string") {
			res.setHeader("Content-Length", Buffer.byteLength(trap.content));
			res.end(trap.content);
		} else {
			// Uint8Array - serve as binary
			res.setHeader("Content-Length", trap.content.length);
			res.end(Buffer.from(trap.content));
		}
	};

	return {
		name: "vitepot",

		enforce: "pre",

		async configResolved(config): Promise<void> {
			// Store resolved config for later use
			resolvedConfig = config;

			// Capture and normalize base path
			const base = config.base || "/";
			normalizedBase = base.endsWith("/") ? base : `${base}/`;

			// Detect SSR build pass (VitePress runs dual build: SSR + client)
			// Skip trap emission during SSR pass to avoid duplicate work
			if (config.command === "build") {
				isSSRBuild = !!config.build.ssr;
			}

			// Pre-generate traps during config resolution
			const trapMap = await getTraps();

			// Log trap count in dev mode (immediate, no spinner)
			if (config.command === "serve") {
				config.logger.info(
					formatLog(`${trapMap.size} traps ready for dev`),
				);
			}
		},

		configureServer(server): void {
			// Dev mode: serve traps from memory (zero disk writes)
			// Register middleware directly (not in returned function) for correct ordering
			server.middlewares.use(trapMiddleware);
		},

		configurePreviewServer(server): void {
			// Preview mode: serve traps (same as dev)
			// Register middleware directly for correct ordering
			server.middlewares.use(trapMiddleware);
		},

		async generateBundle(_outputOptions, bundle): Promise<void> {
			// Skip emission during SSR build pass
			if (isSSRBuild) {
				return;
			}

			// Build mode: emit trap files with collision detection
			if (!config.enabled) {
				return;
			}

			// Get generated traps
			const trapsByPath = await getTraps();
			const traps = Array.from(trapsByPath.values());

			// Build Set of public directory files once (optimization)
			const publicFiles = resolvedConfig?.publicDir
				? scanDirectory(resolvedConfig.publicDir)
				: undefined;

			// Emit each trap as an asset (with collision detection)
			let emittedCount = 0;
			for (const trap of traps) {
				// Remove leading slash for file path
				const fileName = trap.path.startsWith("/")
					? trap.path.slice(1)
					: trap.path;

				// Check for collisions
				const skipReason = shouldSkipTrap(
					fileName,
					bundle,
					publicFiles,
				);

				if (skipReason) {
					buildMessages.push({
						level: "warn",
						message: `Skipping trap "${trap.path}" - ${skipReason}`,
					});
					continue;
				}

				// Emit the trap file
				this.emitFile({
					type: "asset",
					fileName,
					source: trap.content, // Can be string or Uint8Array
				});
				emittedCount++;
			}

			buildMessages.push({
				level: "info",
				message: `${emittedCount} traps emitted`,
			});
		},

		closeBundle(): void {
			// Log all accumulated messages at the end (after build completes)
			if (!isSSRBuild && buildMessages.length > 0) {
				for (const msg of buildMessages) {
					if (msg.level === "warn") {
						console.warn(formatLog(msg.message));
					} else {
						console.info(formatLog(msg.message));
					}
				}
				// Clear messages for next build
				buildMessages = [];
			}
		},
	};
}
