import type { TrapHelpers } from "../config";

/**
 * Generator context passed to all generators
 */
export interface GeneratorContext {
	/** The trap path being generated */
	path: string;
	/** Fake data helpers */
	helpers: TrapHelpers;
}

/**
 * Generator function signature
 */
export type Generator = (ctx: GeneratorContext) => string;

/**
 * Comment styles for different file types
 */
export function addComment(
	text: string,
	style: "hash" | "slash" | "html",
): string {
	switch (style) {
		case "hash":
			return `# ${text}`;
		case "slash":
			return `// ${text}`;
		case "html":
			return `<!-- ${text} -->`;
	}
}

/**
 * Create a header comment block
 */
export function createHeader(
	lines: string[],
	style: "hash" | "slash" | "html",
): string {
	return lines.map((line) => addComment(line, style)).join("\n");
}

/**
 * Add warning comment that looks like a careless leak
 * Uses path-based selection for determinism
 */
export function addWarningComment(
	path: string,
	style: "hash" | "slash",
): string {
	const warnings = [
		"TODO: Remove before deploy!",
		"FIXME: This should not be in production",
		"WARNING: Contains production credentials",
		"NOTE: Temporary config for testing",
		"SECURITY: Review this before merging",
	];

	// Use path hash for deterministic selection
	let hash = 0;
	for (let i = 0; i < path.length; i++) {
		hash = (hash << 5) - hash + path.charCodeAt(i);
		hash = hash & hash;
	}
	const index = Math.abs(hash) % warnings.length;
	const warning = warnings[index];
	return addComment(warning, style);
}
