// Facet guest SDK - injected into every surface iframe. This is the ONLY
// doorway out of the sandbox: surfaces run under CSP default-src 'none' with
// no ambient network or storage, and talk to the world exclusively through
// postMessage to the runtime's capability bridge.
(() => {
  let lastGesture = 0;
  addEventListener("pointerdown", () => { lastGesture = Date.now(); }, true);
  addEventListener("keydown", () => { lastGesture = Date.now(); }, true);

  const pending = new Map();
  let seq = 0;

  window.facet = {
    user: "__FACET_USER__",
    cap(cap, args = {}) {
      return new Promise((resolve, reject) => {
        const reqId = ++seq;
        pending.set(reqId, { resolve, reject });
        parent.postMessage(
          { type: "facet:cap", reqId, cap, args, gestureAge: Date.now() - lastGesture },
          "*"
        );
      });
    },
    timeAgo(iso) {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 60) return "now";
      if (s < 3600) return Math.floor(s / 60) + "m";
      if (s < 86400) return Math.floor(s / 3600) + "h";
      return Math.floor(s / 86400) + "d";
    },
  };

  addEventListener("message", (e) => {
    const m = e.data;
    if (!m || m.type !== "facet:cap:result") return;
    const p = pending.get(m.reqId);
    if (!p) return;
    pending.delete(m.reqId);
    m.ok ? p.resolve(m.data) : p.reject(new Error(m.error));
  });

  addEventListener("error", (e) => {
    parent.postMessage({ type: "facet:error", message: String(e.message) }, "*");
  });

  parent.postMessage({ type: "facet:ready" }, "*");
})();
