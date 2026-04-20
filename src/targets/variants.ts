import type { VariantPreset } from "../config";

/**
 * Variant preset directory mappings
 * Maps variant names to directory prefixes
 */
export const VARIANT_DIRECTORIES: Record<VariantPreset, string[]> = {
	"cms-roots": ["/blog", "/site", "/wordpress"],
	"app-roots": ["/public", "/api"],
	"archive-roots": ["/backup", "/backups", "/old"],
};

/**
 * Get directories for a variant preset
 */
export function getVariantDirectories(variant: VariantPreset): string[] {
	return VARIANT_DIRECTORIES[variant] ?? [];
}

/**
 * Expand multiple variant presets into directories
 */
export function expandVariants(variants: VariantPreset[]): string[] {
	const dirs = new Set<string>();

	for (const variant of variants) {
		const variantDirs = getVariantDirectories(variant);
		for (const dir of variantDirs) {
			dirs.add(dir);
		}
	}

	return Array.from(dirs).sort();
}
