/**
 * Target management - built-in trap sets, variants, and registry
 */

export type { LogicalTrap } from "./defaults.js";
export {
	DEFAULT_TRAPS,
	getDefaultTraps,
	getTrapsForVariant,
} from "./defaults.js";
export { getContentType, inferKindFromPath } from "./registry.js";
export {
	expandVariants,
	getVariantDirectories,
	VARIANT_DIRECTORIES,
} from "./variants.js";
