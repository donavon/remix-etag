# remix-etag

## Problem

Makes adding an `ETag` header to a response easy.

## Usage

```js
return etag({ request, response, options });
```

Where `request` is the incoming HTTP request, `response` is the outgoing HTTP response, and `options` is an object with the following properties:

### Options

| option         |                                                                                                                                                                                                                                                                                                                                         |
| :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `weak`         | Set to false to send a strong `ETag` header. Defaults to `true` (i.e. weak).                                                                                                                                                                                                                                                            |
| `cacheControl` | Add a `Cache-Control` header to the `Response` object. Defaults to "private, no-cache, max-age=0, must-revalidate". If you don't want to send the `Cache-Control` header, set `cacheControl` to `null`. See also `maxAge`. Note that if a `Cache-Control` header is already exists on the response headers, it will NOT be overwritten. |
| `maxAge`       | Specifies the `max-age` used in the `Cache-Control` header. Defaults to `0` (no caching). Will only be used if `cacheControl` is not `null`.                                                                                                                                                                                            |

### Is there a match?

We use the table below to determine if there is a match based on `options.match`, the `ETag` header, and the `If-None-Match` header (example hash values are shown).

| `ETag`    | `If-None-Match` | `weak` is `false` | `weak` is `true` |
| :-------- | :-------------- | :---------------- | :--------------- |
| W/"12345" | (not sent)      | ❌                | ❌               |
| W/"12345" | W/"67890"       | ❌                | ❌               |
| W/"12345" | W/"12345"       | ❌                | ✅               |
| W/"12345" | "12345"         | ❌                | ✅               |
| "12345"   | "12345"         | ✅                | ✅               |

## Example Code

Here is an example `handleRequest` from within `entry.server.tsx`. Import `remix-etag` and use it to set the `ETag` header.

```ts filename=entry.server.tsx lines=4,18,22
import { renderToString } from "react-dom/server";
import { RemixServer } from "remix";
import type { EntryContext } from "remix";
import { etag } from 'remix-etag';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  const response = new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
  return etag({ request, response });
}
```

## Example HTTP Session

If this is the first time on a website, you might send the following headers.

```
Host: hello-world.example.com
```

And the server might respond with the following headers.

```
Status Code: 200
cache-control: private, no-cache, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
etag: W/"4653-YRKtG4JGj5vQch6mw9SBl10xaoY"

<html><body>Hello World!</body></html>
```

Then, if you were to revisit the same site, you would send the following headers. Note that the `If-None-Match` header is set to the value that was initially returned in the `ETag` header.

```
Host: hello-world.example.com
If-None-Match: W/"4653-YRKtG4JGj5vQch6mw9SBl10xaoY"
```

If the site hasn't changed, the server will respond with a `304 Not Modified` status code and _without_ a body. The browser would then render the cached copy of the response.

```
Status Code: 304
cache-control: private, no-cache, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
etag: W/"4653-YRKtG4JGj5vQch6mw9SBl10xaoY"
```

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
