/**
 * lib/urlHelper.ts
 * Helper utility to safely format, sanitize, and distinguish internal vs external URLs.
 * Prevents external links (like padlet.com, drive.google.com) from resolving to internal 404 paths.
 */

export function sanitizeUrl(rawUrl: string | undefined | null): { url: string; isInternal: boolean } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { url: "#", isInternal: true };
  }

  const trimmed = rawUrl.trim();

  if (trimmed === "" || trimmed === "#") {
    return { url: "#", isInternal: true };
  }

  // Internal routes (e.g., /hub, /info, /contact, /documents/123, #section)
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return { url: trimmed, isInternal: true };
  }

  // Already has absolute protocol (http://, https://, mailto:, tel:, //)
  if (/^(https?:\/\/|mailto:|tel:|\/\/)/i.test(trimmed)) {
    return { url: trimmed, isInternal: false };
  }

  // External domain missing http/https (e.g. padlet.com/xyz, drive.google.com/xyz, instagram.com/xyz)
  return { url: `https://${trimmed}`, isInternal: false };
}
