import { describe, expect, test } from "bun:test";
import {
	DEFAULT_TRAPS,
	expandVariants,
	getContentType,
	getDefaultTraps,
	getTrapsForVariant,
	getVariantDirectories,
	inferKindFromPath,
} from "../src/targets";

describe("built-in target set", () => {
	test("contains all intended v1 default traps", () => {
		const traps = getDefaultTraps();
		expect(traps.length).toBeGreaterThan(0);
		expect(traps).toEqual(DEFAULT_TRAPS);
	});

	test("contains high-value sensitive files", () => {
		const paths = DEFAULT_TRAPS.map((t) => t.path);
		expect(paths).toContain("/.env");
		expect(paths).toContain("/wp-config.php");
		expect(paths).toContain("/.git/config");
		expect(paths).toContain("/backup.sql");
	});

	test("contains admin/recon endpoints", () => {
		const paths = DEFAULT_TRAPS.map((t) => t.path);
		expect(paths).toContain("/wp-login.php");
		expect(paths).toContain("/xmlrpc.php");
	});

	test("contains framework config files", () => {
		const paths = DEFAULT_TRAPS.map((t) => t.path);
		expect(paths).toContain("/vercel.json");
		expect(paths).toContain("/next.config.js");
		expect(paths).toContain("/nuxt.config.ts");
		expect(paths).toContain("/settings.py");
	});

	test("excludes intentionally removed non-sensitive traps", () => {
		const paths = DEFAULT_TRAPS.map((t) => t.path);
		// These should NOT be in the default set
		expect(paths).not.toContain("/robots.txt");
		expect(paths).not.toContain("/sitemap.xml");
		expect(paths).not.toContain("/.well-known/security.txt");
	});

	test("all traps have valid kinds", () => {
		const validKinds = [
			"env",
			"wordpress",
			"php",
			"sql",
			"git",
			"server",
			"json",
			"js",
			"yaml",
			"python",
			"ini",
			"log",
			"text",
		];

		for (const trap of DEFAULT_TRAPS) {
			expect(validKinds).toContain(trap.kind);
		}
	});

	test("all traps have absolute paths", () => {
		for (const trap of DEFAULT_TRAPS) {
			expect(trap.path.startsWith("/")).toBe(true);
		}
	});
});

describe("variant preset expansion", () => {
	test("cms-roots expands to correct directories", () => {
		const dirs = getVariantDirectories("cms-roots");
		expect(dirs).toEqual(["/blog", "/site", "/wordpress"]);
	});

	test("app-roots expands to correct directories", () => {
		const dirs = getVariantDirectories("app-roots");
		expect(dirs).toEqual(["/public", "/api"]);
	});

	test("archive-roots expands to correct directories", () => {
		const dirs = getVariantDirectories("archive-roots");
		expect(dirs).toEqual(["/backup", "/backups", "/old"]);
	});

	test("expandVariants combines multiple presets", () => {
		const dirs = expandVariants(["cms-roots", "app-roots"]);
		expect(dirs).toContain("/blog");
		expect(dirs).toContain("/site");
		expect(dirs).toContain("/public");
		expect(dirs).toContain("/api");
	});

	test("expandVariants deduplicates directories", () => {
		const dirs = expandVariants(["cms-roots", "cms-roots"]);
		const unique = new Set(dirs);
		expect(dirs.length).toBe(unique.size);
	});

	test("expandVariants returns sorted directories", () => {
		const dirs = expandVariants(["archive-roots", "cms-roots"]);
		const sorted = [...dirs].sort();
		expect(dirs).toEqual(sorted);
	});
});

describe("variant compatibility", () => {
	test("only compatible traps are returned for variant", () => {
		const cmsTraps = getTrapsForVariant("cms-roots");
		const paths = cmsTraps.map((t) => t.path);

		// Should include WP files
		expect(paths).toContain("/wp-config.php");
		expect(paths).toContain("/wp-login.php");

		// Should NOT include non-compatible files
		expect(paths).not.toContain("/.env");
		expect(paths).not.toContain("/.git/config");
	});

	test("traps without compatibleVariants are not included", () => {
		const cmsTraps = getTrapsForVariant("cms-roots");
		const envTrap = cmsTraps.find((t) => t.path === "/.env");
		expect(envTrap).toBeUndefined();
	});

	test("archive-roots gets SQL dumps", () => {
		const archiveTraps = getTrapsForVariant("archive-roots");
		const paths = archiveTraps.map((t) => t.path);

		expect(paths).toContain("/backup.sql");
		expect(paths).toContain("/dump.sql");
		expect(paths).toContain("/db.sql");
	});

	test("app-roots gets PHP configs", () => {
		const appTraps = getTrapsForVariant("app-roots");
		const paths = appTraps.map((t) => t.path);

		expect(paths).toContain("/config.php");
		expect(paths).toContain("/config.inc.php");
	});
});

describe("path to kind inference", () => {
	test("infers wordpress from wp- files", () => {
		expect(inferKindFromPath("/wp-config.php")).toBe("wordpress");
		expect(inferKindFromPath("/wp-login.php")).toBe("wordpress");
		expect(inferKindFromPath("/xmlrpc.php")).toBe("wordpress");
	});

	test("infers git from .git/ paths", () => {
		expect(inferKindFromPath("/.git/config")).toBe("git");
		expect(inferKindFromPath("/.git/HEAD")).toBe("git");
	});

	test("infers from file extensions", () => {
		expect(inferKindFromPath("/.env")).toBe("env");
		expect(inferKindFromPath("/backup.sql")).toBe("sql");
		expect(inferKindFromPath("/error.log")).toBe("log");
		expect(inferKindFromPath("/config.php")).toBe("php");
		expect(inferKindFromPath("/data.json")).toBe("json");
		expect(inferKindFromPath("/config.js")).toBe("js");
		expect(inferKindFromPath("/config.yml")).toBe("yaml");
		expect(inferKindFromPath("/settings.py")).toBe("python");
		expect(inferKindFromPath("/app.ini")).toBe("ini");
	});

	test("infers server for server config files", () => {
		expect(inferKindFromPath("/.htaccess")).toBe("server");
		expect(inferKindFromPath("/web.config")).toBe("server");
	});

	test("defaults to text for unknown files", () => {
		expect(inferKindFromPath("/unknown-file")).toBe("text");
		expect(inferKindFromPath("/readme.md")).toBe("text");
	});
});

describe("content type mapping", () => {
	test("returns correct content types", () => {
		expect(getContentType("/.env")).toBe("text/plain");
		expect(getContentType("/config.php")).toBe("text/plain");
		expect(getContentType("/data.json")).toBe("application/json");
		expect(getContentType("/config.yml")).toBe("text/yaml");
		expect(getContentType("/config.js")).toBe("text/javascript");
	});

	test("defaults to text/plain for unknown", () => {
		expect(getContentType("/unknown")).toBe("text/plain");
	});

	test("handles paths with directories", () => {
		expect(getContentType("/storage/logs/app.log")).toBe("text/plain");
		expect(getContentType("/config/database.yml")).toBe("text/yaml");
	});

	test("handles edge case paths ending with /", () => {
		// Tests robustness of getContentType utility with unusual input
		expect(getContentType("/some-path/")).toBe("text/plain");
	});
});
