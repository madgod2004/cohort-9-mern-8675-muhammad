const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

export function normaliseHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const hasPort = /^[a-z0-9.-]+:\d+(?:[/?#]|$)/i.test(trimmed);
  const hasScheme = !hasPort && /^[a-z][a-z0-9+.-]*:/i.test(trimmed);

  // a bare domain is what people usually type, so assume https for it
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

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
