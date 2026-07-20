<p align="center">
  <img src="assets/manyshape-logo.png" alt="Manyshape" width="340">
</p>

# @manyshape/surface-sdk

**The API your interface runs against inside the sandbox.** A "surface" is one self-contained HTML file — the personal interface a user's agent (or you, by hand) builds for an app. It runs in a locked-down iframe:

```
sandbox="allow-scripts"   +   CSP default-src 'none'
→ no network, no storage, no cookies, no access to the parent page
```

So there is exactly one way in and out: the `facet` capability bridge described below. If it's not here, a surface can't do it.

## Install

Surfaces don't `import` this package — the runtime **injects** these files into the iframe for you. You only install it if you host your own runtime (see [manyshape-examples](https://github.com/Them-labs/manyshape-examples)):

```sh
npm install @manyshape/surface-sdk
```

It ships two files: [`guest-sdk.js`](guest-sdk.js) (the `facet` API, always injected) and [`react-entry.js`](react-entry.js) (the Preact-based React runtime, injected only for React surfaces).

## The `facet` API (every surface)

| Member | What it does |
| --- | --- |
| `await facet.cap(capId, args)` | Call a declared capability. Validated client-side against `declared caps ∩ contract`, then re-authorized on your server. Returns the handler's `data`, or throws on failure. |
| `facet.user` | The current user's id. |
| `facet.timeAgo(iso)` | Formatting helper: an ISO date → `"3h"`, `"2d"`. |

### Anatomy of a surface

Every surface starts with a header comment declaring which capabilities it uses and (optionally) its framework:

```html
<!--surface
name: focus-list
caps: mail.query, mail.archive
framework: vanilla
intent: One line per row. Archiving completes the task.
-->
<ul id="list"></ul>
<script>
  const threads = await facet.cap("mail.query", { filter: "inbox" });
  document.getElementById("list").innerHTML =
    threads.map((t) => `<li>${t.subject} · ${facet.timeAgo(t.date)}</li>`).join("");
</script>
```

Declaring a capability you didn't list in `caps` — or one the contract doesn't grant — fails the activation gate before the surface ever renders.

## React surfaces

Add `framework: react` to the header and write JSX in `<script type="text/jsx">`. The runtime transpiles it with esbuild before the gate runs and injects `react-entry.js` (Preact + compat, ~4KB, exposed as `window.React` / `window.ReactDOM`). **Don't import or load React yourself** — it's already there.

One extra helper is available in React surfaces:

- `const [data, refresh] = useCap(capId, args)` — a hook that reads a capability. `data` is `undefined` while loading; call `refresh()` after a mutation to re-fetch.
- `facet.cap(...)` still works for actions/mutations, exactly as in vanilla.

```jsx
<!--surface
name: focus-list
caps: mail.query, mail.archive
framework: react
intent: A board you check things off.
-->
<div id="root"></div>
<script type="text/jsx">
  function App() {
    const [threads, refresh] = useCap("mail.query", { filter: "inbox" });
    if (!threads) return <p>Loading…</p>;
    return threads.map((t) => (
      <div key={t.id}>
        {t.subject}
        <button onClick={async () => {
          await facet.cap("mail.archive", { threadId: t.id });
          refresh();
        }}>Done</button>
      </div>
    ));
  }
  ReactDOM.render(<App />, document.getElementById("root"));
</script>
```

## How it fits

- The **vendor side** (contract, authority router, gate primitives) is [@manyshape/sdk](https://github.com/Them-labs/manyshape-sdk).
- A full **runtime** that injects these files and runs the activation gate is in [manyshape-examples](https://github.com/Them-labs/manyshape-examples).

MIT · [Them Labs, Inc.](https://github.com/Them-labs)
