# @manyshape/surface-sdk

The API that Manyshape surfaces (generated or hand-written) program against inside the sandbox. Surfaces run under `sandbox="allow-scripts"` + CSP `default-src 'none'`: no network, no storage, no parent DOM. Everything below is the *only* I/O.

## Vanilla surfaces

[`guest-sdk.js`](guest-sdk.js) is injected into every surface iframe and exposes:

- `await facet.cap(capId, args)` - invoke a declared capability through the runtime's bridge (validated client-side against declared caps ∩ contract, re-authorized server-side).
- `facet.timeAgo(iso)` - "3h" / "2d" formatting helper.
- `facet.user` - current user id.

## React surfaces

Declare `framework: react` in the surface header and write JSX in `<script type="text/jsx">`. The runtime injects [`react-entry.js`](react-entry.js) (Preact + compat bundled to ~4KB, exposed as `window.React` / `window.ReactDOM`) and the server transpiles JSX with esbuild before the activation gate runs.

Extras for React surfaces:

- `const [threads, refresh] = useCap("mail.query", { filter: "inbox" })` - hook sugar over `facet.cap` for reads; call `refresh()` after mutations.
- `facet.cap(...)` works exactly as in vanilla for actions.

```jsx
<!--surface
name: focus-list
caps: mail.query, mail.archive
framework: react
intent: ...
-->
<div id="root"></div>
<script type="text/jsx">
  function App() {
    const [threads, refresh] = useCap("mail.query", { filter: "inbox" });
    if (!threads) return <p>Loading…</p>;
    return threads.map((t) => (
      <div key={t.id}>
        {t.subject}
        <button onClick={async () => { await facet.cap("mail.archive", { threadId: t.id }); refresh(); }}>Done</button>
      </div>
    ));
  }
  ReactDOM.render(<App />, document.getElementById("root"));
</script>
```
