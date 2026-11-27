// Close the Loop Studio at studio.closetheloop.gr: the front door for every tool.
// The Worker runs only for tool paths (assets.run_worker_first); everything else is a static file
// from public/ (the home page, shared/ styles and icons, share/ images).
// Each tool is its own Worker, reached through a service binding, deployed from its own repo:
//   /model/*  Business Model, the Worker `fbc` (pan0sp/FBC), which serves its pages under /model/ itself
//   /vsm/*    Viable System Explorer, the Worker `vsm` (pan0sp/VSM), which serves from its root
// To add a tool: a binding in wrangler.jsonc, a line in TOOLS, its path in run_worker_first, a card on the home page.
const TOOLS = {
  model: { binding: 'MODEL', strip: false },
  vsm: { binding: 'VSM', strip: true }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url), p = url.pathname;
    const slug = p.split('/')[1], tool = TOOLS[slug];
    if (!tool) return env.ASSETS.fetch(request);
    const base = '/' + slug;
    if (p === base) return redirect(url, base + '/');
    const svc = env[tool.binding];
    if (!svc) return new Response('This tool is not connected here yet.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    const inner = new URL(url);
    if (tool.strip) inner.pathname = p.slice(base.length) || '/';
    const res = await svc.fetch(new Request(inner, request));
    const loc = res.headers.get('location');
    if (!tool.strip || !loc || !loc.startsWith('/')) return res;
    // a redirect from a tool that lives at its own root stays under the tool's path
    const out = new Response(res.body, res); out.headers.set('location', base + loc); return out;
  }
};

function redirect(url, path) {
  const to = new URL(path, url); to.search = url.search; return Response.redirect(to.toString(), 301);
}
