import { describe, expect, test } from "bun:test";
import { normalizeConfig } from "../src/config.js";

describe("config normalization", () => {
	test("accepts empty options", () => {
		const config = normalizeConfig();
		expect(config.enabled).toBe(true);
		expect(config.variants).toEqual([]);
		expect(config.dirs).toContain("/");
		expect(config.custom).toEqual([]);
	});

	test("defaults enabled correctly", () => {
		const config1 = normalizeConfig({ enabled: false });
		expect(config1.enabled).toBe(false);

		const config2 = normalizeConfig({ enabled: true });
		expect(config2.enabled).toBe(true);

		const config3 = normalizeConfig({});
		expect(config3.enabled).toBe(true);
	});

	test("adds root when dirs is omitted", () => {
		const config = normalizeConfig({});
		expect(config.dirs).toContain("/");
		expect(config.dirs).toHaveLength(1);
	});

	test("adds root when dirs is present without /", () => {
		const config = normalizeConfig({ dirs: ["/blog", "/site"] });
		expect(config.dirs).toContain("/");
		expect(config.dirs).toContain("/blog");
		expect(config.dirs).toContain("/site");
	});

	test("dedupes repeated dirs", () => {
		const config = normalizeConfig({
			dirs: ["/", "/blog", "/blog", "/site"],
		});
		expect(config.dirs).toEqual(["/", "/blog", "/site"]);
	});

	test("normalizes trailing slashes on dirs", () => {
		const config = normalizeConfig({
			dirs: ["/blog/", "/site/", "/api"],
		});
		expect(config.dirs).toEqual(["/", "/api", "/blog", "/site"]);
	});

	test("normalizes leading slashes on dirs", () => {
		const config = normalizeConfig({
			dirs: ["blog", "site"],
		});
		expect(config.dirs).toContain("/blog");
		expect(config.dirs).toContain("/site");
	});

	test("rejects malformed custom paths", () => {
		expect(() =>
			normalizeConfig({
				custom: [{ path: "no-leading-slash.php" }],
			}),
		).toThrow(/must start with/);
	});

	test("rejects custom file paths ending with /", () => {
		expect(() =>
			normalizeConfig({
				custom: [{ path: "/config.php/" }],
			}),
		).toThrow(/must not end with/);
	});

	test("preserves valid custom file paths", () => {
		const config = normalizeConfig({
			custom: [
				{ path: "/.env" },
				{ path: "/wp-config.php" },
				{ path: "/backup.sql", kind: "sql" },
			],
		});

		expect(config.custom).toHaveLength(3);
		expect(config.custom[0].path).toBe("/.env");
		expect(config.custom[1].path).toBe("/wp-config.php");
		expect(config.custom[2].path).toBe("/backup.sql");
		expect(config.custom[2].kind).toBe("sql");
	});

	test("normalizes custom trap dirs", () => {
		const config = normalizeConfig({
			custom: [
				{
					path: "/.env",
					dirs: ["blog/", "/site"],
				},
			],
		});

		// Custom trap dirs don't add root automatically
		expect(config.custom[0].dirs).toEqual(["/blog", "/site"]);
	});

	test("preserves variants", () => {
		const config = normalizeConfig({
			variants: ["cms-roots", "app-roots"],
		});

		expect(config.variants).toEqual(["cms-roots", "app-roots"]);
	});
});
