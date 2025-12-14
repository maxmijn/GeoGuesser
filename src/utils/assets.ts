/**
 * Get the full URL for an asset in the public folder
 * This handles Vite's base URL configuration
 */
export function getAssetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}
