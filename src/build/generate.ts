import { getGenerator } from "../generators";
import { createTrapHelpers } from "../utils/helpers.js";
import type { ConcreteTrap } from "./plan.js";

/**
 * Generated trap content (can be text or binary)
 */
export interface GeneratedTrap {
	/** Full path including directory prefix */
	path: string;
	/** Generated content (text or binary) */
	content: string | Uint8Array;
	/** Content type (MIME type) */
	contentType: string;
}

/**
 * Generate content for a concrete trap (async-aware)
 */
export async function generateTrapContent(
	trap: ConcreteTrap,
): Promise<GeneratedTrap> {
	// Check for custom content override (property existence, not truthiness)
	if (trap.customContent !== undefined) {
		const rawContent =
			typeof trap.customContent === "function"
				? trap.customContent({
						path: trap.path,
						helpers: createTrapHelpers(trap.path),
					})
				: trap.customContent;

		// Await if promise, otherwise use directly
		const content = await Promise.resolve(rawContent);

		return {
			path: trap.path,
			content, // Preserve as string | Uint8Array (including empty)
			contentType: trap.contentType,
		};
	}

	// Use generator to create content (generators are always sync and return strings)
	const generator = getGenerator(trap.kind, trap.path);
	const content = generator({
		path: trap.path,
		helpers: createTrapHelpers(trap.path),
	});

	return {
		path: trap.path,
		content,
		contentType: trap.contentType,
	};
}

/**
 * Generate content for all traps in a plan (async)
 */
export async function generateAllTraps(
	traps: ConcreteTrap[],
): Promise<GeneratedTrap[]> {
	return Promise.all(traps.map((trap) => generateTrapContent(trap)));
}
