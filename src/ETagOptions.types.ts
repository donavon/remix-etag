export type EtagOptions = {
  /**
   * Add a `Cache-Control` header to the `Response` object.
   * Defaults to "private, no-cache, max-age=0, must-revalidate".
   * If you don't want to send the `Cache-Control` header, set `cacheControl` to `null`.
   * See also `maxAge`.
   * Note that if a `Cache-Control` header is already set, it will NOT be overwritten.
   */
  cacheControl?: string | null;

  /**
   * Specifies the `max-age` used in the `Cache-Control` header.
   * Defaults to `0` (no caching). Will only be used if `cacheControl` is not `null`.
   */
  maxAge?: number;

  /**
   * Specifies if the generated ETag will include the weak validator mark (that is, the leading W/).
   * The actual entity tag is the same. Defaults to `true`.
   */
  weak?: boolean;
};
