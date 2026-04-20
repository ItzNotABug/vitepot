import { describe, expect, test } from "bun:test";
import { planTraps } from "../src/build/plan.js";
import { normalizeConfig } from "../src/config.js";

describe("path expansion and planning", () => {
	test("expands built-in traps to root by default", () => {
		const config = normalizeConfig({});
		const plan = planTraps(config);

		expect(plan.traps.length).toBeGreaterThan(0);

		// All traps should be at root
		const rootTraps = plan.traps.filter((t) => t.path.startsWith("/"));
		expect(rootTraps.length).toBe(plan.traps.length);

		// Check some expected traps
		const paths = plan.traps.map((t) => t.path);
		expect(paths).toContain("/.env");
		expect(paths).toContain("/wp-config.php");
		expect(paths).toContain("/.git/config");
	});

	test("expands traps to explicit dirs", () => {
		const config = normalizeConfig({
			dirs: ["/blog", "/site"],
		});
		const plan = planTraps(config);

		const paths = plan.traps.map((t) => t.path);

		// Root traps
		expect(paths).toContain("/.env");

		// Expanded to /blog
		expect(paths).toContain("/blog/.env");

		// Expanded to /site
		expect(paths).toContain("/site/.env");
	});

	test("expands compatible traps to preset variant dirs", () => {
		const config = normalizeConfig({
			variants: ["cms-roots"],
		});
		const plan = planTraps(config);

		const paths = plan.traps.map((t) => t.path);

		// Root WP traps
		expect(paths).toContain("/wp-config.php");

		// Expanded to variant dirs
		expect(paths).toContain("/blog/wp-config.php");
		expect(paths).toContain("/site/wp-config.php");
		expect(paths).toContain("/wordpress/wp-config.php");
	});

	test("expands custom traps with local dirs", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/custom.env",
					dirs: ["/staging", "/dev"],
				},
			],
		});
		const plan = planTraps(config);

		const paths = plan.traps.map((t) => t.path);

		// Should be in specified dirs only
		expect(paths).toContain("/staging/custom.env");
		expect(paths).toContain("/dev/custom.env");

		// Should NOT be in root (since custom dirs were specified)
		expect(paths).not.toContain("/custom.env");
	});

	test("dedupes same output path from multiple sources", () => {
		const config = normalizeConfig({
			dirs: ["/blog", "/blog"], // Duplicates
		});
		const plan = planTraps(config);

		// Count occurrences of /blog/.env - should only be 1
		const blogEnvCount = plan.traps.filter(
			(t) => t.path === "/blog/.env",
		).length;
		expect(blogEnvCount).toBe(1);
	});

	test("custom trap overrides built-in path", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/.env",
					content: "CUSTOM_CONTENT=true",
				},
			],
		});
		const plan = planTraps(config);

		const envTrap = plan.traps.find((t) => t.path === "/.env");
		expect(envTrap).toBeDefined();
		expect(envTrap?.source).toBe("custom");
		expect(envTrap?.customContent).toBe("CUSTOM_CONTENT=true");

		// Built-in should be skipped
		expect(plan.skipped.length).toBeGreaterThan(0);
		const skippedEnv = plan.skipped.find((s) => s.path === "/.env");
		expect(skippedEnv).toBeDefined();
	});

	test("logs skipped collisions", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/.env",
					content: "OVERRIDE=true",
				},
			],
		});
		const plan = planTraps(config);

		// Should have skipped built-in .env
		expect(plan.skipped.length).toBeGreaterThan(0);

		// Each skipped should have path and reason
		for (const skipped of plan.skipped) {
			expect(skipped.path).toBeDefined();
			expect(skipped.reason).toBeDefined();
			expect(typeof skipped.path).toBe("string");
			expect(typeof skipped.reason).toBe("string");
		}
	});

	test("returns empty when disabled", () => {
		const config = normalizeConfig({
			enabled: false,
		});
		const plan = planTraps(config);

		expect(plan.traps).toEqual([]);
		expect(plan.skipped).toEqual([]);
	});

	test("all concrete traps have required fields", () => {
		const config = normalizeConfig({});
		const plan = planTraps(config);

		for (const trap of plan.traps) {
			expect(trap.path).toBeDefined();
			expect(trap.kind).toBeDefined();
			expect(trap.contentType).toBeDefined();
			expect(trap.source).toBeDefined();

			expect(typeof trap.path).toBe("string");
			expect(typeof trap.kind).toBe("string");
			expect(typeof trap.contentType).toBe("string");
			expect(["builtin", "custom"]).toContain(trap.source);
		}
	});

	test("infers kind when not specified", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/test.sql",
					// No kind specified
				},
			],
		});
		const plan = planTraps(config);

		const sqlTrap = plan.traps.find((t) => t.path.endsWith("/test.sql"));
		expect(sqlTrap?.kind).toBe("sql");
	});

	test("uses explicit kind when specified", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/test.txt",
					kind: "php",
				},
			],
		});
		const plan = planTraps(config);

		const trap = plan.traps.find((t) => t.path.endsWith("/test.txt"));
		expect(trap?.kind).toBe("php");
	});

	test("uses explicit contentType when specified", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/test.xyz",
					contentType: "application/x-custom",
				},
			],
		});
		const plan = planTraps(config);

		const trap = plan.traps.find((t) => t.path.endsWith("/test.xyz"));
		expect(trap?.contentType).toBe("application/x-custom");
	});

	test("preserves custom content", () => {
		const customContent = "MY_SECRET=123";
		const config = normalizeConfig({
			custom: [
				{
					path: "/secrets.env",
					content: customContent,
				},
			],
		});
		const plan = planTraps(config);

		const trap = plan.traps.find((t) => t.path.endsWith("/secrets.env"));
		expect(trap?.customContent).toBe(customContent);
	});

	test("handles nested paths correctly", () => {
		const config = normalizeConfig({
			dirs: ["/api/v1"],
		});
		const plan = planTraps(config);

		const paths = plan.traps.map((t) => t.path);

		// Should create nested paths
		expect(paths).toContain("/api/v1/.env");
		expect(paths).toContain("/api/v1/wp-config.php");
	});
});
