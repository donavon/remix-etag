import { installGlobals } from '@remix-run/node';
import { createEtag } from './eTag';
import { etag } from '.';
import crypto from 'crypto';
import * as util from 'util';
// This installs globals such as "fetch", "Response", "Request" and "Headers".
installGlobals();

let data = 'Hello World';
let strongHash: string = `"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"`;
let weakHash: string = `W/"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"`;

beforeAll(async () => {
  Object.defineProperty(window, 'TextEncoder', {
    writable: true,
    value: util.TextEncoder,
  });
  Object.defineProperty(global.self, 'crypto', {
    value: {
      subtle: {
        digest: (algorithm: string, data: Uint8Array) => {
          return new Promise(resolve =>
            resolve(
              crypto
                .createHash(algorithm.toLowerCase().replace('-', ''))
                .update(data)
                .digest()
            )
          );
        },
      },
    },
  });

  data = 'Hello World';
  strongHash = await createEtag(data);
  weakHash = await createEtag(data, { weak: true });
});

const strongPostRequest = new Request('/', {
  method: 'POST',
  headers: {
    'if-none-match': strongHash,
  },
});

const strongRequest = new Request('/', {
  method: 'GET',
  headers: {
    'if-none-match': strongHash,
  },
});

const weakRequest = new Request('/', {
  method: 'GET',
  headers: {
    'if-none-match': weakHash,
  },
});

const defaultRequest = new Request('/', {
  method: 'GET',
});

const testThatNothingHappened = (request: Request, response: Response) => {
  test('returns the original response', async () => {
    const result = await etag({ response, request });
    expect(result).toBe(response);
  });
  test('does not add an ETag header', async () => {
    const result = await etag({ response, request });
    expect(result.headers.get('etag')).toBeNull();
  });
  test('does not add a Cache-Control header', async () => {
    const result = await etag({ response, request });
    expect(result.headers.get('cache-control')).toBeNull();
  });
};

describe('misc', () => {
  test("strong hashes don't match weak hashes", () => {
    expect(strongHash).not.toBe(weakHash);
  });
  test("strong hashes don't begin with 'W/'", () => {
    expect(strongHash).not.toMatch(/^W\//);
  });
  test("weak hashes begin with 'W/'", () => {
    expect(weakHash).toMatch(/^W\//);
  });
  test('computes the same strong hash for multiple calls', async () => {
    expect(await createEtag(data)).toBe(strongHash);
  });
  test('computes a same weak hash for multiple calls', async () => {
    expect(await createEtag(data, { weak: true })).toBe(weakHash);
  });
  test("strong and weak hashes differ only by the 'W/' prefix", () => {
    expect(strongHash).toBe(weakHash.replace(/^W\//, ''));
  });
  test("if a Cache-Control header already exists, don't override", async () => {
    const response = new Response(data, {
      headers: { 'cache-control': 'public, max-age=3600' },
    });
    const request = defaultRequest;
    const result = await etag({ response, request });

    expect(result).toBe(response);
    expect(result.headers.get('cache-control')).toBe('public, max-age=3600');
  });
});

describe('if request.method is something other than GET or HEAD', () => {
  testThatNothingHappened(strongPostRequest, new Response());
});

describe('if response.status is something other than 200', () => {
  testThatNothingHappened(strongRequest, new Response(data, { status: 404 }));
});

describe('if response.contentType is something other than html or json', () => {
  testThatNothingHappened(
    strongRequest,
    new Response(data, { headers: { 'content-type': 'text/plain' } })
  );
});

describe('if options.weak is true', () => {
  const options = { weak: true };

  describe('and sent a weak request', () => {
    const request = weakRequest;

    test('returns a new 304 response with a weak etag and cache-control headers', async () => {
      const response = new Response(data, {
        headers: { 'content-type': 'text/html' },
      });
      const result = await etag({ response, request, options });

      expect(result).not.toBe(response);
      expect(result.status).toBe(304);
      expect(result.headers.get('etag')).toBe(weakHash);
      expect(result.headers.get('cache-control')).toBe(
        'private, no-cache, max-age=0, must-revalidate'
      );
    });
  });

  describe('and sent a strong request', () => {
    const request = strongRequest;

    test('returns a new 304 response with a weak etag and cache-control headers', async () => {
      const response = new Response(data, {
        headers: { 'content-type': 'text/html' },
      });
      const result = await etag({ response, request, options });

      expect(result).not.toBe(response);
      expect(result.status).toBe(304);
      expect(result.headers.get('etag')).toBe(weakHash);
      expect(result.headers.get('cache-control')).toBe(
        'private, no-cache, max-age=0, must-revalidate'
      );
    });
  });

  describe('and sent a request without If-None-Match', () => {
    const request = defaultRequest;

    test('returns a response with a weak etag and cache-control headers', async () => {
      const response = new Response(data, {
        headers: { 'content-type': 'text/html' },
      });
      const result = await etag({ response, request, options });

      expect(result).toBe(response);
      expect(result.headers.get('etag')).toBe(weakHash);
      expect(result.headers.get('cache-control')).toBe(
        'private, no-cache, max-age=0, must-revalidate'
      );
    });
  });
});

describe('if options.weak is false (i.e. use strong hash)', () => {
  const options = { weak: false };

  describe('and sent a weak request', () => {
    const request = weakRequest;

    test('returns a the original response with a strong etag and cache-control headers', async () => {
      const response = new Response(data, {
        headers: { 'content-type': 'text/html' },
      });
      const result = await etag({ response, request, options });

      expect(result).toBe(response);
      expect(result.status).toBe(200);
      expect(result.headers.get('etag')).toBe(strongHash);
      expect(result.headers.get('cache-control')).toBe(
        'private, no-cache, max-age=0, must-revalidate'
      );
    });
  });

  describe('and sent a strong request', () => {
    const request = strongRequest;

    test('returns a new 304 response with a strong etag and cache-control headers', async () => {
      const response = new Response(data, {
        headers: { 'content-type': 'text/html' },
      });
      const result = await etag({ response, request, options });

      expect(result).not.toBe(response);
      expect(result.status).toBe(304);
      expect(result.headers.get('etag')).toBe(strongHash);
      expect(result.headers.get('cache-control')).toBe(
        'private, no-cache, max-age=0, must-revalidate'
      );
    });
  });

  describe('and sent a request without If-None-match', () => {
    const request = defaultRequest;

    test('returns a the original response with a strong etag and cache-control headers', async () => {
      const response = new Response(data, {
        headers: { 'content-type': 'text/html' },
      });
      const result = await etag({ response, request, options });

      expect(result).toBe(response);
      expect(result.status).toBe(200);
      expect(result.headers.get('etag')).toBe(strongHash);
      expect(result.headers.get('cache-control')).toBe(
        'private, no-cache, max-age=0, must-revalidate'
      );
    });
  });
});
