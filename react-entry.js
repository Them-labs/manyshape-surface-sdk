// React runtime for Manyshape surfaces. Bundled server-side (esbuild, IIFE)
// and inlined into the sandbox srcdoc for surfaces with `framework: react`.
// Preact + compat keeps the payload ~4KB while giving agents the React API
// they were trained on. Same sandbox, same CSP, same capability bridge -
// the framework changes what language untrusted code is written in, not
// what it can do.

import * as compat from "preact/compat";

window.React = compat;
window.ReactDOM = compat;

// useCap(capId, args) -> [data, refresh]. Sugar over facet.cap for the
// read path; actions still call facet.cap directly.
window.useCap = (cap, args) => {
  const key = JSON.stringify(args ?? {});
  const [data, setData] = compat.useState(null);
  const [tick, setTick] = compat.useState(0);
  compat.useEffect(() => {
    let live = true;
    window.facet.cap(cap, args ?? {}).then(
      (d) => { if (live) setData(d); },
      (err) => { if (live) window.parent.postMessage({ type: "facet:error", message: String(err.message) }, "*"); }
    );
    return () => { live = false; };
  }, [cap, key, tick]);
  return [data, () => setTick((t) => t + 1)];
};
