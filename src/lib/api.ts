/**
 * Utility to resolve API URLs reliably in container and sandboxed iframe environments.
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    window.location.origin !== 'null' &&
    !window.location.origin.startsWith('blob:') &&
    !window.location.origin.startsWith('about:')
  ) {
    return `${window.location.origin}${normalizedPath}`;
  }
  return normalizedPath;
}

/**
 * Safe fetch helper that gracefully handles errors and status checks
 */
export async function safeFetchJson<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; status?: number; error?: string }> {
  try {
    const url = getApiUrl(endpoint);
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      let errText = `HTTP Error ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.error) errText = errJson.error;
      } catch {
        // ignore
      }
      return { ok: false, status: res.status, error: errText };
    }

    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network request failed' };
  }
}
