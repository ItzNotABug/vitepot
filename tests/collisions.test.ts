import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import type {
	NormalizedOutputOptions,
	OutputBundle,
	PluginContext,
} from "rollup";
import type { ResolvedConfig } from "vite";
import { vitepot } from "../src/vitepot";

/**
 * Helper to create minimal PluginContext for testing
 */
function createMockPluginContext() {
	interface EmittedFile {
		type: "asset";
		fileName: string;
		source: string | Uint8Array;
	}

	const emittedFiles: EmittedFile[] = [];

	const context: Pick<PluginContext, "emitFile" | "warn"> = {
		emitFile: (file) => {
			emittedFiles.push(file as EmittedFile);
			return "";
		},
		warn: (log) => {
			// Not used anymore, but keep for compatibility
			const message =
				typeof log === "string"
					? log
					: typeof log === "function"
						? log()
						: log.message || "";
			const finalMessage =
				typeof message === "string" ? message : message.message || "";
			console.warn(finalMessage);
		},
	};

	return { context, emittedFiles };
}

/**
 * Helper to create minimal ResolvedConfig for testing
 */
function createMockResolvedConfig(
	overrides?: Partial<ResolvedConfig>,
): ResolvedConfig {
	const noop = () => {};
	return {
		command: "build",
		logger: {
			info: noop,
			warn: noop,
			error: noop,
			clearScreen: noop,
			hasWarned: false,
			warnOnce: noop,
		},
		build: {
			ssr: false,
		},
		...overrides,
	} as ResolvedConfig;
}

describe("Public Directory Collision Detection", () => {
	let tempDir: string;
	let publicDir: string;

	beforeEach(() => {
		// Create temp directory structure for each test
		tempDir = mkdtempSync(join(tmpdir(), "vitepot-test-"));
		publicDir = join(tempDir, "public");
		mkdirSync(publicDir, { recursive: true });
	});

	afterEach(() => {
		// Cleanup temp directory after each test
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("skips trap when file exists in public root", async () => {
		// Create a real .htaccess file in public/
		writeFileSync(join(publicDir, ".htaccess"), "real htaccess content");

		const plugin = vitepot({
			custom: [
				{
					path: "/.htaccess",
					content: "trap content",
				},
			],
		});

		const warnings: string[] = [];
		const warnSpy = spyOn(console, "warn").mockImplementation(
			(msg: string) => {
				warnings.push(msg);
			},
		);

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		// Call configResolved
		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		// Call generateBundle
		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context,
				outputOptions,
				bundle,
				false,
			);
		}

		// Call closeBundle to flush accumulated messages
		if (typeof plugin.closeBundle === "function") {
			await plugin.closeBundle.call(context);
		}

		// Restore console.warn
		warnSpy.mockRestore();

		// .htaccess should NOT be emitted
		const htaccessTrap = emittedFiles.find(
			(f) => f.fileName === ".htaccess",
		);
		expect(htaccessTrap).toBeUndefined();

		// Should have warning about public/ collision
		const collisionWarning = warnings.find(
			(w) => w.includes(".htaccess") && w.includes("public/"),
		);
		expect(collisionWarning).toBeDefined();
	});

	test("skips trap when file exists in nested public subdirectory", async () => {
		// Create nested directory structure: public/api/
		mkdirSync(join(publicDir, "api"), { recursive: true });

		// Create a real config.php in public/api/
		writeFileSync(
			join(publicDir, "api", "config.php"),
			"real config content",
		);

		const plugin = vitepot({
			custom: [
				{
					path: "/config.php",
					dirs: ["/api"],
				},
			],
		});

		const warnings: string[] = [];
		spyOn(console, "warn").mockImplementation((msg: string) => {
			warnings.push(msg);
		});

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Call closeBundle to flush accumulated messages
		if (typeof plugin.closeBundle === "function") {
			await plugin.closeBundle.call(context as PluginContext);
		}

		// api/config.php should NOT be emitted
		const configTrap = emittedFiles.find(
			(f) => f.fileName === "api/config.php",
		);
		expect(configTrap).toBeUndefined();

		// Should have warning
		const collisionWarning = warnings.find(
			(w) => w.includes("api/config.php") && w.includes("public/"),
		);
		expect(collisionWarning).toBeDefined();
	});

	test("skips trap when file exists in deeply nested public path", async () => {
		// Create deep nesting: public/legacy/backup/old/
		mkdirSync(join(publicDir, "legacy", "backup", "old"), {
			recursive: true,
		});

		// Create a real file deep in the tree
		writeFileSync(
			join(publicDir, "legacy", "backup", "old", "database.sql"),
			"real backup",
		);

		const plugin = vitepot({
			custom: [
				{
					path: "/legacy/backup/old/database.sql",
					content: "trap backup",
				},
			],
		});

		const warnings: string[] = [];
		const warnSpy = spyOn(console, "warn").mockImplementation(
			(msg: string) => {
				warnings.push(msg);
			},
		);

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Call closeBundle to flush accumulated messages
		if (typeof plugin.closeBundle === "function") {
			await plugin.closeBundle.call(context as PluginContext);
		}

		// Restore console.warn
		warnSpy.mockRestore();

		// Should NOT emit the deeply nested trap
		const sqlTrap = emittedFiles.find(
			(f) => f.fileName === "legacy/backup/old/database.sql",
		);
		expect(sqlTrap).toBeUndefined();

		// Should warn about collision
		expect(
			warnings.some(
				(w) =>
					w.includes("legacy/backup/old/database.sql") &&
					w.includes("public/"),
			),
		).toBe(true);
	});

	test("emits trap when file does NOT exist in public", async () => {
		// Public directory exists but is empty
		const plugin = vitepot({
			custom: [
				{
					path: "/.env",
					content: "trap env content",
				},
			],
		});

		const warnings: string[] = [];
		const warnSpy = spyOn(console, "warn").mockImplementation(
			(msg: string) => {
				warnings.push(msg);
			},
		);

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Call closeBundle to flush accumulated messages
		if (typeof plugin.closeBundle === "function") {
			await plugin.closeBundle.call(context as PluginContext);
		}

		// Restore console.warn
		warnSpy.mockRestore();

		// .env SHOULD be emitted (no collision)
		const envTrap = emittedFiles.find((f) => f.fileName === ".env");
		expect(envTrap).toBeDefined();
		expect(envTrap?.source).toBe("trap env content");

		// Should NOT have collision warning for .env
		const envWarning = warnings.find(
			(w) => w.includes(".env") && w.includes("public/"),
		);
		expect(envWarning).toBeUndefined();
	});

	test("handles publicDir with no files gracefully", async () => {
		// Empty public directory
		const plugin = vitepot({
			custom: [
				{
					path: "/test.txt",
					content: "test content",
				},
			],
		});

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Should emit normally when public is empty
		const testTrap = emittedFiles.find((f) => f.fileName === "test.txt");
		expect(testTrap).toBeDefined();
	});

	test("handles missing publicDir gracefully", async () => {
		// Point to non-existent directory
		const nonExistentDir = join(tempDir, "does-not-exist");

		const plugin = vitepot({
			custom: [
				{
					path: "/test.txt",
					content: "test content",
				},
			],
		});

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir: nonExistentDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		// Should not throw when publicDir doesn't exist
		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Should still emit traps when publicDir is missing
		const testTrap = emittedFiles.find((f) => f.fileName === "test.txt");
		expect(testTrap).toBeDefined();
	});

	test("handles multiple collisions correctly", async () => {
		// Create multiple files in public/
		writeFileSync(join(publicDir, ".env"), "real env");
		writeFileSync(join(publicDir, ".htaccess"), "real htaccess");
		mkdirSync(join(publicDir, "api"), { recursive: true });
		writeFileSync(join(publicDir, "api", "config.php"), "real config");

		const plugin = vitepot({
			custom: [
				{ path: "/.env", content: "trap env" },
				{ path: "/.htaccess", content: "trap htaccess" },
				{ path: "/config.php", dirs: ["/api"] },
				{ path: "/safe.txt", content: "should emit" }, // No collision
			],
		});

		const warnings: string[] = [];
		const warnSpy = spyOn(console, "warn").mockImplementation(
			(msg: string) => {
				warnings.push(msg);
			},
		);

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Call closeBundle to flush accumulated messages
		if (typeof plugin.closeBundle === "function") {
			await plugin.closeBundle.call(context as PluginContext);
		}

		// Restore console.warn
		warnSpy.mockRestore();

		// Should NOT emit colliding files
		expect(emittedFiles.find((f) => f.fileName === ".env")).toBeUndefined();
		expect(
			emittedFiles.find((f) => f.fileName === ".htaccess"),
		).toBeUndefined();
		expect(
			emittedFiles.find((f) => f.fileName === "api/config.php"),
		).toBeUndefined();

		// SHOULD emit non-colliding file
		expect(
			emittedFiles.find((f) => f.fileName === "safe.txt"),
		).toBeDefined();

		// Should have 3 collision warnings
		const collisionWarnings = warnings.filter((w) => w.includes("public/"));
		expect(collisionWarnings.length).toBe(3);
	});

	test("normalizes Windows backslashes to forward slashes", async () => {
		// This test verifies cross-platform path handling
		// On Windows, nested paths would use backslashes (api\\config.php)
		// On POSIX, they use forward slashes (api/config.php)
		// VitePot normalizes everything to forward slashes internally

		// Create nested structure
		mkdirSync(join(publicDir, "api"), { recursive: true });
		writeFileSync(join(publicDir, "api", "config.php"), "real config");

		const plugin = vitepot({
			custom: [
				{
					path: "/config.php",
					dirs: ["/api"],
				},
			],
		});

		const warnings: string[] = [];
		const warnSpy = spyOn(console, "warn").mockImplementation(
			(msg: string) => {
				warnings.push(msg);
			},
		);

		const mockConfig = createMockResolvedConfig({
			command: "build",
			publicDir,
		});

		if (typeof plugin.configResolved === "function") {
			await plugin.configResolved(mockConfig);
		}

		const { context, emittedFiles } = createMockPluginContext();

		if (typeof plugin.generateBundle === "function") {
			const outputOptions: NormalizedOutputOptions =
				{} as NormalizedOutputOptions;
			const bundle: OutputBundle = {};
			await plugin.generateBundle.call(
				context as PluginContext,
				outputOptions,
				bundle,
				false,
			);
		}

		// Call closeBundle to flush accumulated messages
		if (typeof plugin.closeBundle === "function") {
			await plugin.closeBundle.call(context as PluginContext);
		}

		// Restore console.warn
		warnSpy.mockRestore();

		// Regardless of platform path separator, collision should be detected
		// because scanDirectory normalizes backslashes to forward slashes
		const configTrap = emittedFiles.find(
			(f) => f.fileName === "api/config.php",
		);
		expect(configTrap).toBeUndefined();

		// Should detect collision even on Windows where native path would be api\\config.php
		const collisionWarning = warnings.find(
			(w) => w.includes("api/config.php") && w.includes("public/"),
		);
		expect(collisionWarning).toBeDefined();

		// Verify the file was created with platform-native separator
		// but still detected as a collision after normalization
		const createdPath = join(publicDir, "api", "config.php");
		const expectedSeparator = sep; // '\\' on Windows, '/' on POSIX
		if (expectedSeparator === "\\") {
			// On Windows, join() uses backslashes
			expect(createdPath).toContain("\\");
		}
		// Collision detection should work regardless
	});
});
