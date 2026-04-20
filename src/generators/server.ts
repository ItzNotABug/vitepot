import type { Generator } from "./shared.js";
import { addWarningComment } from "./shared.js";

/**
 * Apache .htaccess generator
 */
export const htaccessGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const sections = [
		`# ${addWarningComment(path, "hash").replace("#", "").trim()}`,
		`# Production .htaccess - ${helpers.fakeTimestamp()}`,
		"",
		"# Rewrite rules",
		"RewriteEngine On",
		"RewriteCond %{HTTPS} off",
		`RewriteRule ^(.*)$ https://${helpers.fakeDomain()}/$1 [R=301,L]`,
		"",
		"# Security headers",
		'Header set X-Frame-Options "SAMEORIGIN"',
		'Header set X-XSS-Protection "1; mode=block"',
		'Header set X-Content-Type-Options "nosniff"',
		"",
		"# Authentication (temporary)",
		"AuthType Basic",
		'AuthName "Protected Area"',
		"AuthUserFile /var/www/.htpasswd",
		"Require valid-user",
		"",
		"# Error pages",
		"ErrorDocument 404 /404.html",
		"ErrorDocument 500 /500.html",
	];

	return sections.join("\n");
};

/**
 * Apache .htpasswd generator
 */
export const htpasswdGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	// Apache MD5 password hashes (fake but realistic format)
	const sections = [
		`# ${addWarningComment(path, "hash").replace("#", "").trim()}`,
		`# Generated: ${helpers.fakeTimestamp()}`,
		`admin:$apr1$${helpers.fakePhpSecret().slice(0, 8)}$${helpers.fakePhpSecret().slice(0, 22)}`,
		`user:$apr1$${helpers.fakePhpSecret().slice(0, 8)}$${helpers.fakePhpSecret().slice(0, 22)}`,
		`deploy:$apr1$${helpers.fakePhpSecret().slice(0, 8)}$${helpers.fakePhpSecret().slice(0, 22)}`,
	];

	return sections.join("\n");
};

/**
 * Nginx web.config generator
 */
export const webConfigGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const sections = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<!-- ${addWarningComment(path, "hash").replace("#", "").trim()} -->`,
		"<configuration>",
		"  <system.webServer>",
		"    <rewrite>",
		"      <rules>",
		'        <rule name="Force HTTPS" stopProcessing="true">',
		'          <match url="(.*)" />',
		"          <conditions>",
		'            <add input="{HTTPS}" pattern="off" />',
		"          </conditions>",
		`          <action type="Redirect" url="https://${helpers.fakeDomain()}/{R:1}" redirectType="Permanent" />`,
		"        </rule>",
		"      </rules>",
		"    </rewrite>",
		'    <httpErrors errorMode="Custom">',
		'      <remove statusCode="404" />',
		'      <error statusCode="404" path="/404.html" responseMode="File" />',
		"    </httpErrors>",
		"  </system.webServer>",
		"</configuration>",
	];

	return sections.join("\n");
};
