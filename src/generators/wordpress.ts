import type { Generator } from "./shared.js";
import { addWarningComment, createHeader } from "./shared.js";

/**
 * WordPress configuration file generator (wp-config.php)
 */
export const wordpressGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;
	const dbName = helpers.fakeDomain().split(".")[0];

	const header = createHeader(
		[
			"WordPress Configuration File",
			`Generated: ${helpers.fakeTimestamp()}`,
			addWarningComment(path, "slash").replace("//", "").trim(),
		],
		"slash",
	);

	const sections = [
		"<?php",
		header,
		"",
		"// Database settings",
		`define('DB_NAME', '${dbName}_wp');`,
		`define('DB_USER', 'wp_user');`,
		`define('DB_PASSWORD', '${helpers.fakeMysqlPassword()}');`,
		`define('DB_HOST', '${helpers.fakeTestNetIPv4()}');`,
		`define('DB_CHARSET', 'utf8mb4');`,
		`define('DB_COLLATE', '');`,
		"",
		"// Authentication keys and salts",
		`define('AUTH_KEY',         '${helpers.fakePhpSecret()}');`,
		`define('SECURE_AUTH_KEY',  '${helpers.fakePhpSecret()}');`,
		`define('LOGGED_IN_KEY',    '${helpers.fakePhpSecret()}');`,
		`define('NONCE_KEY',        '${helpers.fakePhpSecret()}');`,
		`define('AUTH_SALT',        '${helpers.fakePhpSecret()}');`,
		`define('SECURE_AUTH_SALT', '${helpers.fakePhpSecret()}');`,
		`define('LOGGED_IN_SALT',   '${helpers.fakePhpSecret()}');`,
		`define('NONCE_SALT',       '${helpers.fakePhpSecret()}');`,
		"",
		"// WordPress database table prefix",
		`$table_prefix = 'wp_';`,
		"",
		"// Debugging",
		`define('WP_DEBUG', false);`,
		`define('WP_DEBUG_LOG', false);`,
		"",
		"// Security",
		`define('DISALLOW_FILE_EDIT', true);`,
		`define('FORCE_SSL_ADMIN', true);`,
		"",
		"// WordPress URLs",
		`define('WP_SITEURL', 'https://${helpers.fakeDomain()}');`,
		`define('WP_HOME', 'https://${helpers.fakeDomain()}');`,
		"",
		"if (!defined('ABSPATH')) {",
		"    define('ABSPATH', __DIR__ . '/');",
		"}",
		"",
		"require_once ABSPATH . 'wp-settings.php';",
	];

	return sections.join("\n");
};

/**
 * WordPress xmlrpc.php generator
 * XMLRPC is a common attack vector
 */
export const xmlrpcGenerator: Generator = (ctx) => {
	const { path, helpers } = ctx;

	const sections = [
		"<?php",
		"// XML-RPC endpoint",
		`// ${addWarningComment(path, "slash").replace("//", "").trim()}`,
		"",
		'header("Content-Type: text/xml; charset=UTF-8");',
		"",
		"$response = <<<XML",
		'<?xml version="1.0" encoding="UTF-8"?>',
		"<methodResponse>",
		"  <fault>",
		"    <value>",
		"      <struct>",
		"        <member>",
		"          <name>faultCode</name>",
		"          <value><int>405</int></value>",
		"        </member>",
		"        <member>",
		"          <name>faultString</name>",
		"          <value><string>XML-RPC server accepts POST requests only.</string></value>",
		"        </member>",
		"      </struct>",
		"    </value>",
		"  </fault>",
		"</methodResponse>",
		"XML;",
		"",
		"echo $response;",
		"",
		`// Debug info - site: https://${helpers.fakeDomain()}`,
		`// Last modified: ${helpers.fakeTimestamp()}`,
	];

	return sections.join("\n");
};
