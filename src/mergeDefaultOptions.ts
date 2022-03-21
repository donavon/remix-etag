import { EtagOptions } from './ETagOptions.types';

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
