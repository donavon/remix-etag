async function entityTag(entity: string): Promise<string> {
  if (entity.length === 0) {
    // fast-path empty
    return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
  }
  const target = new TextEncoder().encode(entity);
  const hash = await crypto.subtle.digest('SHA-1', target).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(function(b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
    return hashHex;
  });

  return `"${hash}"`;
}

/**
 * Create a simple ETag.
 */

export async function createEtag(
  entity: string,
  options?: { weak: boolean }
): Promise<string> {
  if (entity == null) {
    throw new TypeError('argument entity is required');
  }

  // generate entity tag
  const tag = await entityTag(entity);

  return options?.weak ? `W/${tag}` : tag;
}
