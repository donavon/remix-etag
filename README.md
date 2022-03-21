# remix-etag

## Problem

explain what the problem is

## Example

Here is an example `handleRequest` from withing `entry.server.tsx`.

```ts filename=entry.server.tsx
import { etag } from 'remix-etag';

export default function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <LocaleContextProvider locales={locales}>
      <RemixServer context={remixContext} url={request.url} />
    </LocaleContextProvider>
  );
  const body = `<!DOCTYPE html>${markup}`;
  headers.set('Content-Type', 'text/html; charset=utf-8');

  const response = new Response(body, { status, headers });
  return etag({ request, response });
}
```

Here are some example requests and responses.

Request:

```

```

Response:

```

```

## Options

explain the options available

### Is there a match?

We use the table below to determine if there is a match based on `options.match`, the `ETag` header, and the `If-None-Match` header (example hash values are shown).

| `ETag`    | `If-None-Match` | `weak` is `false` | `weak` is `true` |
| :-------- | :-------------- | :---------------- | :--------------- |
| W/"12345" | (not sent)      | ❌                | ❌               |
| W/"12345" | W/"67890"       | ❌                | ❌               |
| W/"12345" | W/"12345"       | ❌                | ✅               |
| W/"12345" | "12345"         | ❌                | ✅               |
| "12345"   | "12345"         | ✅                | ✅               |

## Getting Started

Install the library with your package manager of choice, e.g.:

```

npm i remix-etag

```

or

```

yarn add remix-etag

```

## License

&copy; 2022 Donavon West. Released under [MIT license](./LICENSE).
