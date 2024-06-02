export function getHeaderValue(
  headersInit: HeadersInit,
  key: string
): string | null {
  const headers =
    headersInit instanceof Headers ? headersInit : new Headers(headersInit);

  return headers.get(key);
}
