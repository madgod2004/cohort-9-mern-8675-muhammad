const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

export function normaliseHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // a bare domain is what people usually type, so assume https for it
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return null;
  }

  return url.toString();
}
