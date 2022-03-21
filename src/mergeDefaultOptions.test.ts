import { EtagOptions } from './ETagOptions.types';
import { mergeDefaultOptions } from './mergeDefaultOptions';

const testDefaultOptions = (initialOptions?: EtagOptions) => {
  const options = mergeDefaultOptions(initialOptions);

  test('options.weak defaults to true', () => {
    expect(options.weak).toBe(true);
  });
  test('options.cacheControl defaults to "private, no-cache, max-age=0, must-revalidate"', () => {
    expect(options.cacheControl).toBe(
      'private, no-cache, max-age=0, must-revalidate'
    );
  });
};

describe('mergeDefaultOptions', () => {
  describe('passed an empty object', () => {
    testDefaultOptions({});
  });

  describe('not passed anything', () => {
    testDefaultOptions();
  });

  describe('maxAge', () => {
    test('controls cacheControl "max-age"', () => {
      const options = mergeDefaultOptions({ maxAge: 123 });
      expect(options.cacheControl).toBe(
        'private, no-cache, max-age=123, must-revalidate'
      );
    });
    test('is ignored if cacheControl set"', () => {
      const options = mergeDefaultOptions({
        cacheControl: 'public, max-age=0',
        maxAge: 123,
      });
      expect(options.cacheControl).toBe('public, max-age=0');
    });
  });
});
