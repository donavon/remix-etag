import computeETag from 'etag';

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

type SendEtagResponseArgs = {
  request: Request;
  response: Response;
  options?: EtagOptions;
};

const stripLeadingWeak = (hash: string) => hash.replace(/^W\//, '');

const testWeak = (hash: string) => hash.startsWith('W/');

const computeMatch = (
  weak: boolean,
  ifNoneMatch: string | null,
  etagHash: string
): boolean => {
  if (ifNoneMatch === null) return false;

  if (weak) {
    return stripLeadingWeak(ifNoneMatch) === stripLeadingWeak(etagHash);
  }
  return (
    !testWeak(ifNoneMatch) && !testWeak(etagHash) && ifNoneMatch === etagHash
  );
};

export const mergeDefaultOptions = (
  options: EtagOptions = {}
): Required<EtagOptions> => {
  const {
    maxAge = 0,
    cacheControl = `private, no-cache, max-age=${maxAge}, must-revalidate`,
    weak = true,
  } = options;
  return {
    cacheControl,
    maxAge,
    weak,
  };
};

/**
 * Handles all aspect of ETag/If-None-Match header generation.
 * If the `If-None-Match` header is present in the `Request` object, and it matches the calculated
 * hash value of the response body, it will return a `304 Not Modified` response.
 * Otherwise, an `ETag` header is added to the `Response` object.
 */
export const etag = async ({
  request,
  response,
  options,
}: SendEtagResponseArgs): Promise<Response> => {
  const { cacheControl, weak } = mergeDefaultOptions(options);

  const { headers } = response;
  const contentType = headers.get('content-type') ?? '';
  const isResponseHtml = contentType.startsWith('text/html');
  const isResponseJson = contentType.startsWith('application/json');

  const shouldComputeETag =
    (request.method === 'GET' || request.method === 'HEAD') &&
    response.status === 200 &&
    (isResponseHtml || isResponseJson);
  if (!shouldComputeETag) return response;

  const hasCacheControl = headers.has('Cache-Control');
  if (!hasCacheControl && cacheControl) {
    headers.set('Cache-Control', cacheControl);
  }

  // We clone the response so we can read the body, which is a one-time operation.
  const clonedResponse = response.clone();
  const body = await clonedResponse.text();

  const etagHash = computeETag(body, { weak });
  headers.set('ETag', etagHash);

  const ifNoneMatch = request.headers.get('if-none-match');
  const isMatch = computeMatch(weak, ifNoneMatch, etagHash);

  return isMatch ? new Response(void 0, { status: 304, headers }) : response;
};
