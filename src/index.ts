import { EtagOptions } from './ETagOptions.types';
import { mergeDefaultOptions } from './mergeDefaultOptions';
import { testMatch } from './testMatch';

type SendEtagResponseArgs = {
  request: Request;
  response: Response;
  options?: EtagOptions;
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

  const isMatch = await testMatch({ request, text: body, headers, weak });
  return isMatch ? new Response('', { status: 304, headers }) : response;
};
