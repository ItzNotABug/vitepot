import { describe, expect, test } from "bun:test";
import type { TrapKind } from "../config";
import { createTrapHelpers } from "../utils/helpers.js";
import { getGenerator } from "./index.js";
import type { GeneratorContext } from "./shared.js";

describe("Generator Registry", () => {
	test("getGenerator returns correct generator for each kind", () => {
		const kinds = [
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
		] as const;

		for (const kind of kinds) {
			const generator = getGenerator(kind, `/${kind}-test`);
			expect(generator).toBeDefined();
			expect(typeof generator).toBe("function");
		}
	});

	test("getGenerator returns path-specific overrides", () => {
		const paths = ["/xmlrpc.php", "/.htpasswd", "/web.config"];

		for (const path of paths) {
			const generator = getGenerator("text", path);
			expect(generator).toBeDefined();
			expect(typeof generator).toBe("function");
		}
	});

	test("getGenerator returns text generator for text kind", () => {
		const generator = getGenerator("text", "/readme.txt");
		expect(generator).toBeDefined();
		expect(typeof generator).toBe("function");
	});
});

describe("Generator Output", () => {
	function createContext(path: string): GeneratorContext {
		return {
			path,
			helpers: createTrapHelpers(path),
		};
	}

	describe("env generator", () => {
		test("generates valid env file with all sections", () => {
			const generator = getGenerator("env", "/.env");
			const ctx = createContext("/.env");
			const output = generator(ctx);

			// Check for key sections
			expect(output).toContain("APP_NAME=");
			expect(output).toContain("DB_CONNECTION=");
			expect(output).toContain("REDIS_HOST=");
			expect(output).toContain("MAIL_MAILER=");
			expect(output).toContain("AWS_ACCESS_KEY_ID=");

			// Check for warning comment
			expect(output).toMatch(/(TODO|FIXME|WARNING|NOTE|SECURITY):/);
		});

		test("generates deterministic output for same path", () => {
			const generator = getGenerator("env", "/.env");
			const output1 = generator(createContext("/.env"));
			const output2 = generator(createContext("/.env"));

			expect(output1).toBe(output2);
		});

		test("generates different output for different paths", () => {
			const generator = getGenerator("env", "/.env");
			const output1 = generator(createContext("/.env"));
			const output2 = generator(createContext("/.env.local"));

			expect(output1).not.toBe(output2);
		});
	});

	describe("wordpress generator", () => {
		test("generates valid wp-config.php", () => {
			const generator = getGenerator("wordpress", "/wp-config.php");
			const ctx = createContext("/wp-config.php");
			const output = generator(ctx);

			expect(output).toContain("<?php");
			expect(output).toContain("define('DB_NAME'");
			expect(output).toContain("define('AUTH_KEY'");
			expect(output).toContain("$table_prefix");
			expect(output).toContain("wp-settings.php");
		});

		test("xmlrpc.php uses specific generator", () => {
			const generator = getGenerator("wordpress", "/xmlrpc.php");
			const ctx = createContext("/xmlrpc.php");
			const output = generator(ctx);

			expect(output).toContain("<?php");
			expect(output).toContain("XML-RPC");
			expect(output).toContain("methodResponse");
		});
	});

	describe("sql generator", () => {
		test("generates valid SQL dump", () => {
			const generator = getGenerator("sql", "/backup.sql");
			const ctx = createContext("/backup.sql");
			const output = generator(ctx);

			expect(output).toContain("-- MySQL dump");
			expect(output).toContain("CREATE TABLE");
			expect(output).toContain("INSERT INTO");
			expect(output).toContain("DROP TABLE IF EXISTS");
		});
	});

	describe("git generator", () => {
		test("generates valid git config", () => {
			const generator = getGenerator("git", "/.git/config");
			const ctx = createContext("/.git/config");
			const output = generator(ctx);

			expect(output).toContain("[core]");
			expect(output).toContain('[remote "origin"]');
			expect(output).toContain('[branch "main"]');
			expect(output).toContain("[user]");
		});

		test("/.git/HEAD uses ref format", () => {
			const generator = getGenerator("git", "/.git/HEAD");
			const ctx = createContext("/.git/HEAD");
			const output = generator(ctx);

			expect(output).toBe("ref: refs/heads/main");
			expect(output).not.toContain("[core]");
			expect(output).not.toContain("[user]");
		});

		test("nested .git/HEAD also uses ref format", () => {
			const generator = getGenerator("git", "/backup/.git/HEAD");
			const ctx = createContext("/backup/.git/HEAD");
			const output = generator(ctx);

			expect(output).toBe("ref: refs/heads/main");
		});
	});

	describe("server generators", () => {
		test("generates valid .htaccess", () => {
			const generator = getGenerator("server", "/.htaccess");
			const ctx = createContext("/.htaccess");
			const output = generator(ctx);

			expect(output).toContain("RewriteEngine");
			expect(output).toContain("Header set");
			expect(output).toContain("AuthType");
		});

		test(".htpasswd uses specific generator", () => {
			const generator = getGenerator("server", "/.htpasswd");
			const ctx = createContext("/.htpasswd");
			const output = generator(ctx);

			expect(output).toContain("$apr1$");
			expect(output).toContain("admin:");
		});

		test("web.config uses specific generator", () => {
			const generator = getGenerator("server", "/web.config");
			const ctx = createContext("/web.config");
			const output = generator(ctx);

			expect(output).toContain("<?xml version");
			expect(output).toContain("<configuration>");
			expect(output).toContain("<system.webServer>");
		});
	});

	describe("json generators", () => {
		test("generates valid JSON config", () => {
			const generator = getGenerator("json", "/config.json");
			const ctx = createContext("/config.json");
			const output = generator(ctx);

			expect(() => JSON.parse(output)).not.toThrow();

			const parsed = JSON.parse(output);
			expect(parsed).toHaveProperty("api");
			expect(parsed).toHaveProperty("database");
			expect(parsed).toHaveProperty("services");
		});
	});

	describe("js generator", () => {
		test("generates valid JavaScript config", () => {
			const generator = getGenerator("js", "/config.js");
			const ctx = createContext("/config.js");
			const output = generator(ctx);

			expect(output).toContain("export default");
			expect(output).toContain("apiUrl:");
			expect(output).toContain("database:");
			expect(output).toContain("aws:");
		});
	});

	describe("yaml generator", () => {
		test("generates valid YAML config", () => {
			const generator = getGenerator("yaml", "/config.yml");
			const ctx = createContext("/config.yml");
			const output = generator(ctx);

			expect(output).toContain("app:");
			expect(output).toContain("database:");
			expect(output).toContain("services:");
			expect(output).toContain("  driver:");
		});
	});

	describe("python generator", () => {
		test("generates valid Python config", () => {
			const generator = getGenerator("python", "/settings.py");
			const ctx = createContext("/settings.py");
			const output = generator(ctx);

			expect(output).toContain("APP_NAME =");
			expect(output).toContain("DATABASE =");
			expect(output).toContain("CACHES =");
			expect(output).toContain("EMAIL_BACKEND =");
		});
	});

	describe("ini generator", () => {
		test("generates valid INI config", () => {
			const generator = getGenerator("ini", "/config.ini");
			const ctx = createContext("/config.ini");
			const output = generator(ctx);

			expect(output).toContain("[app]");
			expect(output).toContain("[database]");
			expect(output).toContain("[cache]");
			expect(output).toContain("[aws]");
		});
	});

	describe("log generator", () => {
		test("generates realistic log file", () => {
			const generator = getGenerator("log", "/app.log");
			const ctx = createContext("/app.log");
			const output = generator(ctx);

			expect(output).toContain("INFO:");
			expect(output).toContain("DEBUG:");
			expect(output).toContain("WARN:");
			expect(output).toContain("ERROR:");
		});
	});

	describe("text generator", () => {
		test("generates plain text notes", () => {
			const generator = getGenerator("text", "/notes.txt");
			const ctx = createContext("/notes.txt");
			const output = generator(ctx);

			expect(output).toContain("=== Database ===");
			expect(output).toContain("=== API Keys ===");
			expect(output).toContain("=== AWS Credentials ===");
			expect(output).toContain("WARNING:");
		});
	});

	describe("php generator", () => {
		test("generates valid PHP config", () => {
			const generator = getGenerator("php", "/config.php");
			const ctx = createContext("/config.php");
			const output = generator(ctx);

			expect(output).toContain("<?php");
			expect(output).toContain("return [");
			expect(output).toContain("'database' =>");
			expect(output).toContain("'cache' =>");
		});
	});
});

describe("Generator Safety", () => {
	function createContext(path: string): GeneratorContext {
		return {
			path,
			helpers: createTrapHelpers(path),
		};
	}

	test("env generator uses safe test-net IPs", () => {
		verifyTestNetIPs("/.env", "env");
	});

	test("wordpress generator uses safe test-net IPs", () => {
		verifyTestNetIPs("/wp-config.php", "wordpress");
	});

	test("json generator uses safe test-net IPs", () => {
		verifyTestNetIPs("/config.json", "json");
	});

	test("python generator uses safe test-net IPs", () => {
		verifyTestNetIPs("/settings.py", "python");
	});

	function verifyTestNetIPs(path: string, kind: string) {
		const testNetRanges = ["192.0.2.", "198.51.100.", "203.0.113."];
		const generator = getGenerator(kind as TrapKind, path);
		const output = generator(createContext(path));

		const ipMatches = output.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g);
		if (ipMatches) {
			for (const ip of ipMatches) {
				const hasTestNetPrefix = testNetRanges.some((range) =>
					ip.startsWith(range),
				);
				expect(hasTestNetPrefix).toBe(true);
			}
		}
	}

	test("env generator uses safe RFC 2606 domains", () => {
		verifySafeDomains("/.env", "env");
	});

	test("wordpress generator uses safe RFC 2606 domains", () => {
		verifySafeDomains("/wp-config.php", "wordpress");
	});

	test("json generator uses safe RFC 2606 domains", () => {
		verifySafeDomains("/config.json", "json");
	});

	test("python generator uses safe RFC 2606 domains", () => {
		verifySafeDomains("/settings.py", "python");
	});

	function verifySafeDomains(path: string, kind: string) {
		const generator = getGenerator(kind as TrapKind, path);
		const output = generator(createContext(path));

		// Check for .test TLD (RFC 2606 reserved)
		const domainMatches = output.match(/[a-z0-9.-]+@?[a-z0-9-]+\.test/gi);
		expect(domainMatches).toBeTruthy();
		expect(domainMatches?.length).toBeGreaterThan(0);

		// Ensure NO real TLDs are present
		const realTLDs = /\.(com|net|org|biz|info|io|dev|co|me)\b/gi;
		const realMatches = output.match(realTLDs);
		if (realMatches) {
			// Filter out known safe patterns (like "info:" in comments)
			const unsafeMatches = realMatches.filter(
				(match) => !output.match(new RegExp(`#.*${match}`, "i")),
			);
			expect(unsafeMatches.length).toBe(0);
		}
	}
});
