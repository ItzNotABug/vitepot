import type { CustomTrap, NormalizedConfig, TrapKind } from "../config.js";
import type { LogicalTrap } from "../targets";
import {
	expandVariants,
	getContentType,
	getDefaultTraps,
	inferKindFromPath,
} from "../targets";

/**
 * Concrete trap after expansion and resolution
 */
export interface ConcreteTrap {
	/** Full path including directory prefix */
	path: string;
	/** Generator kind */
	kind: TrapKind;
	/** Content type (MIME type) */
	contentType: string;
	/** Source: 'builtin' or 'custom' */
	source: "builtin" | "custom";
	/** Custom content override (if from custom trap) */
	customContent?: CustomTrap["content"];
}

/**
 * Plan result with all concrete traps
 */
export interface TrapPlan {
	/** All concrete traps deduplicated and resolved */
	traps: ConcreteTrap[];
	/** Traps that were skipped due to collisions */
	skipped: Array<{
		path: string;
		reason: string;
	}>;
}

/**
 * Plan all traps based on config
 * Merges built-in + custom, expands across dirs/variants, dedupes
 */
export function planTraps(config: NormalizedConfig): TrapPlan {
	if (!config.enabled) {
		return { traps: [], skipped: [] };
	}

	// Step 1: Collect all directories (root + variants + explicit dirs)
	const allDirs = collectDirectories(config);

	// Step 2: Collect logical traps (built-in + custom)
	const logicalTraps = collectLogicalTraps(config);

	// Step 3: Expand traps across all directories
	const expanded = expandTrapsAcrossDirs(logicalTraps, allDirs);

	// Step 4: Deduplicate and handle collisions
	const { traps, skipped } = deduplicateTraps(expanded);

	return { traps, skipped };
}

/**
 * Directory metadata with variant tracking
 */
interface DirectoryInfo {
	path: string;
	/** Variant this dir belongs to (undefined = root or explicit dir) */
	variant?: string;
}

/**
 * Collect all directories to expand traps into, with variant metadata
 */
function collectDirectories(config: NormalizedConfig): DirectoryInfo[] {
	const dirMap = new Map<string, DirectoryInfo>();

	// Always include root
	dirMap.set("/", { path: "/" });

	// Add variant preset directories with metadata
	if (config.variants.length > 0) {
		for (const variant of config.variants) {
			const variantDirs = expandVariants([variant]);
			for (const dir of variantDirs) {
				dirMap.set(dir, { path: dir, variant });
			}
		}
	}

	// Add explicit dirs (not tied to any variant)
	for (const dir of config.dirs) {
		if (!dirMap.has(dir)) {
			dirMap.set(dir, { path: dir });
		}
	}

	return Array.from(dirMap.values()).sort((a, b) =>
		a.path.localeCompare(b.path),
	);
}

/**
 * Collect all logical traps (built-in + custom)
 */
function collectLogicalTraps(config: NormalizedConfig): Array<{
	trap: LogicalTrap | CustomTrap;
	source: "builtin" | "custom";
	dirs?: string[];
}> {
	const traps: Array<{
		trap: LogicalTrap | CustomTrap;
		source: "builtin" | "custom";
		dirs?: string[];
	}> = [];

	// Add built-in traps
	const builtinTraps = getDefaultTraps();
	for (const trap of builtinTraps) {
		traps.push({ trap, source: "builtin" });
	}

	// Variant-compatible traps are already included in default traps
	// Expansion happens in the expand phase

	// Add custom traps
	for (const customTrap of config.custom) {
		traps.push({
			trap: customTrap,
			source: "custom",
			dirs: customTrap.dirs,
		});
	}

	return traps;
}

/**
 * Expand logical traps across directories
 */
function expandTrapsAcrossDirs(
	logicalTraps: Array<{
		trap: LogicalTrap | CustomTrap;
		source: "builtin" | "custom";
		dirs?: string[];
	}>,
	allDirs: DirectoryInfo[],
): ConcreteTrap[] {
	const concrete: ConcreteTrap[] = [];

	for (const item of logicalTraps) {
		const expanded = expandSingleTrap(item, allDirs);
		concrete.push(...expanded);
	}

	return concrete;
}

/**
 * Expand a single logical trap across its target directories
 */
function expandSingleTrap(
	item: {
		trap: LogicalTrap | CustomTrap;
		source: "builtin" | "custom";
		dirs?: string[];
	},
	allDirs: DirectoryInfo[],
): ConcreteTrap[] {
	const { trap, source, dirs } = item;
	const concrete: ConcreteTrap[] = [];

	// Custom traps with explicit dirs - use those exact paths
	if (dirs && dirs.length > 0) {
		for (const dir of dirs) {
			const concreteTrap = createConcreteTrap(trap, dir, source);
			concrete.push(concreteTrap);
		}
		return concrete;
	}

	// Built-in traps - filter by compatibleVariants
	const compatibleVariants =
		"compatibleVariants" in trap ? trap.compatibleVariants : undefined;

	for (const dirInfo of allDirs) {
		// Skip variant dirs if trap has no compatible variants
		if (dirInfo.variant && !compatibleVariants) {
			continue;
		}

		// Skip variant dirs if trap doesn't list this variant as compatible
		if (
			dirInfo.variant &&
			compatibleVariants &&
			!compatibleVariants.includes(dirInfo.variant)
		) {
			continue;
		}

		const concreteTrap = createConcreteTrap(trap, dirInfo.path, source);
		concrete.push(concreteTrap);
	}

	return concrete;
}

/**
 * Create a concrete trap from a logical trap and directory
 */
function createConcreteTrap(
	trap: LogicalTrap | CustomTrap,
	dir: string,
	source: "builtin" | "custom",
): ConcreteTrap {
	const fullPath = dir === "/" ? trap.path : `${dir}${trap.path}`;

	const kind =
		"kind" in trap && trap.kind ? trap.kind : inferKindFromPath(fullPath);

	const contentType =
		"contentType" in trap && trap.contentType
			? trap.contentType
			: getContentType(fullPath);

	const concreteTrap: ConcreteTrap = {
		path: fullPath,
		kind,
		contentType,
		source,
	};

	// Add custom content if present (check property existence, not truthiness)
	if (source === "custom" && "content" in trap) {
		concreteTrap.customContent = trap.content;
	}

	return concreteTrap;
}

/**
 * Deduplicate traps and handle collisions
 * Custom traps override built-in traps at same path
 */
function deduplicateTraps(traps: ConcreteTrap[]): {
	traps: ConcreteTrap[];
	skipped: Array<{ path: string; reason: string }>;
} {
	const seen = new Map<string, ConcreteTrap>();
	const skipped: Array<{ path: string; reason: string }> = [];

	for (const trap of traps) {
		const existing = seen.get(trap.path);

		if (!existing) {
			// First occurrence
			seen.set(trap.path, trap);
			continue;
		}

		// Collision detected
		if (trap.source === "custom" && existing.source === "builtin") {
			// Custom overrides built-in
			skipped.push({
				path: existing.path,
				reason: "overridden by custom trap",
			});
			seen.set(trap.path, trap);
		} else if (trap.source === "builtin" && existing.source === "custom") {
			// Built-in doesn't override custom
			skipped.push({
				path: trap.path,
				reason: "custom trap takes precedence",
			});
		} else {
			// Same source - keep first, skip duplicate
			skipped.push({
				path: trap.path,
				reason: "duplicate from same source",
			});
		}
	}

	return {
		traps: Array.from(seen.values()),
		skipped,
	};
}
