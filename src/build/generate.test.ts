import { describe, expect, test } from "bun:test";
import { generateAllTraps, generateTrapContent } from "./generate.js";
import type { ConcreteTrap } from "./plan.js";

describe("Content Generation", () => {
	describe("async custom content", () => {
		test("handles async string content", async () => {
			const trap: ConcreteTrap = {
				path: "/test.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: Promise.resolve("async content"),
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBe("async content");
			expect(result.contentType).toBe("text/plain");
		});

		test("handles async factory function", async () => {
			const trap: ConcreteTrap = {
				path: "/test.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: async (ctx) => {
					return `Generated for ${ctx.path}`;
				},
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBe("Generated for /test.txt");
		});

		test("handles async binary content", async () => {
			const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
			const trap: ConcreteTrap = {
				path: "/image.png",
				kind: "text",
				contentType: "image/png",
				source: "custom",
				customContent: Promise.resolve(binaryData),
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBeInstanceOf(Uint8Array);
			expect(result.content).toEqual(binaryData);
		});
	});

	describe("sync custom content", () => {
		test("handles sync string content", async () => {
			const trap: ConcreteTrap = {
				path: "/test.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: "sync content",
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBe("sync content");
		});

		test("handles sync binary content", async () => {
			const binaryData = new Uint8Array([0x1, 0x2, 0x3, 0x4]);
			const trap: ConcreteTrap = {
				path: "/binary.dat",
				kind: "text",
				contentType: "application/octet-stream",
				source: "custom",
				customContent: binaryData,
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBeInstanceOf(Uint8Array);
			expect(result.content).toEqual(binaryData);
		});

		test("preserves exact binary bytes", async () => {
			// Test with various byte values including null bytes
			const binaryData = new Uint8Array([
				0x00, 0xff, 0x80, 0x7f, 0x01, 0xfe,
			]);
			const trap: ConcreteTrap = {
				path: "/binary.bin",
				kind: "text",
				contentType: "application/octet-stream",
				source: "custom",
				customContent: binaryData,
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBeInstanceOf(Uint8Array);
			const resultArray = result.content as Uint8Array;
			expect(resultArray.length).toBe(6);
			expect(resultArray[0]).toBe(0x00);
			expect(resultArray[1]).toBe(0xff);
			expect(resultArray[2]).toBe(0x80);
		});

		test("handles sync factory function", async () => {
			const trap: ConcreteTrap = {
				path: "/test.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: (ctx) => {
					return `Generated for ${ctx.path} with domain ${ctx.helpers.fakeDomain()}`;
				},
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toContain("Generated for /test.txt");
			expect(result.content).toMatch(/\.test/);
		});
	});

	describe("empty custom content", () => {
		test("handles empty string content", async () => {
			const trap: ConcreteTrap = {
				path: "/empty.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: "",
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBe("");
			expect(result.contentType).toBe("text/plain");
		});

		test("handles empty binary content", async () => {
			const trap: ConcreteTrap = {
				path: "/empty.bin",
				kind: "text",
				contentType: "application/octet-stream",
				source: "custom",
				customContent: new Uint8Array(0),
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBeInstanceOf(Uint8Array);
			expect((result.content as Uint8Array).length).toBe(0);
		});

		test("handles async empty string content", async () => {
			const trap: ConcreteTrap = {
				path: "/async-empty.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: Promise.resolve(""),
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBe("");
		});

		test("handles factory returning empty string", async () => {
			const trap: ConcreteTrap = {
				path: "/factory-empty.txt",
				kind: "text",
				contentType: "text/plain",
				source: "custom",
				customContent: () => "",
			};

			const result = await generateTrapContent(trap);

			expect(result.content).toBe("");
		});
	});

	describe("built-in generators", () => {
		test("generates string content from built-in generators", async () => {
			const trap: ConcreteTrap = {
				path: "/.env",
				kind: "env",
				contentType: "text/plain",
				source: "builtin",
			};

			const result = await generateTrapContent(trap);

			expect(typeof result.content).toBe("string");
			expect(result.content).toContain("APP_NAME=");
		});
	});

	describe("generateAllTraps", () => {
		test("generates all traps in parallel", async () => {
			const traps: ConcreteTrap[] = [
				{
					path: "/.env",
					kind: "env",
					contentType: "text/plain",
					source: "builtin",
				},
				{
					path: "/custom.txt",
					kind: "text",
					contentType: "text/plain",
					source: "custom",
					customContent: "custom content",
				},
				{
					path: "/async.txt",
					kind: "text",
					contentType: "text/plain",
					source: "custom",
					customContent: Promise.resolve("async content"),
				},
			];

			const results = await generateAllTraps(traps);

			expect(results.length).toBe(3);
			expect(results[0].content).toContain("APP_NAME=");
			expect(results[1].content).toBe("custom content");
			expect(results[2].content).toBe("async content");
		});
	});
});
