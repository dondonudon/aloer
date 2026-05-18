/**
 * Appends `?from=<encodedCurrentUrl>` to a detail page href so the detail
 * page can navigate back to the exact filtered list URL.
 */
export function withFromParam(detailHref: string, currentHref: string): string {
  return `${detailHref}?from=${encodeURIComponent(currentHref)}`;
}

/**
 * Reads the `from` search param and returns it if it's a safe relative URL
 * (starts with `/`). Falls back to `fallback` otherwise, guarding against
 * open-redirect attacks.
 */
export function resolveBackHref(
  searchParams: Record<string, string | string[] | undefined>,
  fallback: string,
): string {
  const raw = typeof searchParams.from === "string" ? searchParams.from : "";
  return raw.startsWith("/") ? raw : fallback;
}
