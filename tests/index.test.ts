import { describe, expect, test } from "bun:test";
import { vitepot } from "../src/vitepot";

describe("vitepot plugin", () => {
	test("package entry resolves correctly", () => {
		expect(vitepot).toBeDefined();
		expect(typeof vitepot).toBe("function");
	});

	test("exported API is callable", () => {
		const plugin = vitepot();
		expect(plugin).toBeDefined();
		expect(plugin.name).toBe("vitepot");
	});

	test("returns a valid Vite plugin shape", () => {
		const plugin = vitepot();
		expect(plugin.name).toBe("vitepot");
		// expect(plugin.enforce).toBe("pre");
		expect(typeof plugin.configResolved).toBe("function");
		expect(typeof plugin.configureServer).toBe("function");
		expect(typeof plugin.configurePreviewServer).toBe("function");
		expect(typeof plugin.generateBundle).toBe("function");
	});

	test("accepts options", () => {
		const plugin = vitepot({
			enabled: true,
			variants: ["cms-roots"],
			dirs: ["/blog"],
			custom: [{ path: "/.env" }],
		});

		expect(plugin.name).toBe("vitepot");
	});

	test("works with empty options", () => {
		const plugin = vitepot({});
		expect(plugin.name).toBe("vitepot");
	});

	test("works with no options", () => {
		const plugin = vitepot();
		expect(plugin.name).toBe("vitepot");
	});
});
