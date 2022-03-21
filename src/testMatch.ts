import computeETag from 'etag';

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

type TestMatch = {
  request: Request;
  text: string;
  headers: Headers;
  weak: boolean;
};

/**
 * The raw `testMatch` function that could be used to compare the RemixContext.routeData and
 * return early without rendering the page if `true` is returned.
 */
export const testMatch = ({
  request,
  text,
  headers,
  weak,
}: TestMatch): boolean => {
  const etagHash = computeETag(text, { weak });
  headers.set('ETag', etagHash);

  const ifNoneMatch = request.headers.get('if-none-match');
  const isMatch = computeMatch(weak, ifNoneMatch, etagHash);
  return isMatch;
};
