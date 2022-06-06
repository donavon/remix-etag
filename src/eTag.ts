const entityTag = async (entity: string): Promise<string> => {
  if (entity.length === 0) {
    return '"0a4d55a8d778e5022fab701977c5d840bbc486d0"';
  }

  const target = new TextEncoder().encode(entity);
  const hashBuffer = await crypto.subtle.digest('SHA-1', target);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map(function(b) {
      return b.toString(16).padStart(2, '0');
    })
    .join('');

  return `"${hashHex}"`;
};

/**
 * Create a simple ETag.
 */

export const createEtag = async (
  entity: string,
  options?: { weak: boolean }
): Promise<string> => {
  if (entity == null) {
    throw new TypeError('argument entity is required');
  }

  // generate entity tag
  const tag = await entityTag(entity);

  return options?.weak ? `W/${tag}` : tag;
};
