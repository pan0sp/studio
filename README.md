# Close the Loop Studio

The front door of https://studio.closetheloop.gr: the home page that lists the tools, the shared look they wear, and the router that sends each tool's path to that tool's own Cloudflare Worker.

Made by Panagiotis Panagiotakopoulos, [Close the Loop](https://closetheloop.gr). This repository: © 2026 Close the Loop, all rights reserved. Each tool has its own repository and licence.

## The tools

| Path | Tool | Worker | Repository | Licence |
| --- | --- | --- | --- | --- |
| `/` | Studio home | `studio` | this one | all rights reserved |
| `/model/` | Business Model, on the Flourishing Business Canvas | `fbc` | `pan0sp/FBC` (private) | all rights reserved; canvas © Antony Upward, CC BY-ND 4.0, used with permission |
| `/vsm/` | Viable System Explorer | `vsm` | `pan0sp/VSM` (public) | code AGPL-3.0-or-later, text CC BY-SA 4.0 |

Old addresses answer with a permanent 301 from Cloudflare Redirect Rules on the `closetheloop.gr` zone, path and query kept, for good: `fbc.closetheloop.gr` to `/model/`, `vsm.closetheloop.gr` to `/vsm/`.

## What is here

- `public/index.html`: the home page. Static.
- `public/shared/studio.css`: the shared design tokens (Close the Loop navy and gold for the chrome, state colours, type roles, tool identities) and the Close the Loop lockup. The home page links it. Tools copy the tokens they need into their own single-file builds rather than linking it, because each tool must keep working as a Claude artifact or opened from disk.
- `public/shared/icons.svg`: the interface glyphs as an SVG sprite (24 x 24, stroke only, 1.8 wide, round caps and joins), from Business Model.
- `public/share/`: images for link previews (the studio's and Business Model's), drawn by `node share.js` (needs Playwright; run it only when a card's wording or look changes, the PNGs are committed).
- `worker.mjs`: runs only for tool paths (`assets.run_worker_first`) and hands each to its Worker through a service binding. Everything else is a static file.
- `wrangler.jsonc`: the Worker `studio`, its assets and bindings.

## Rules for the studio

1. Each Close the Loop tool lives at `studio.closetheloop.gr/<slug>/` and owns everything below it. Slugs are short, lowercase, one word, and never change once shared.
2. The studio keeps the top level for itself: `/`, `/about/`, `/shared/`, `/share/`, and later `/account/` and `/api/`.
3. Code that is not ours (a partner's, a student's, a third-party widget) gets its own subdomain, never a path: one origin shares browser storage.
4. Each tool saves its work under a key that starts with its own name and a version. Existing keys never change.
5. Each tool's page names its canonical address with `<link rel="canonical">`.

## Adding a tool

1. In the tool's repository, deploy it as its own Worker. A tool that serves from its root (like `vsm`) needs only relative links; one that serves under its slug (like `fbc`) handles the prefix itself.
2. Here: add the binding in `wrangler.jsonc`, the slug in `TOOLS` in `worker.mjs` (`strip: true` for a root-served tool) and in `run_worker_first`, and a card on the home page.
3. Run `node tests/routes.js`, open a pull request, try its Preview URL, merge.

## Checks

```
node tests/routes.js
```

Runs the router locally with stand-ins for the tool Workers and checks the home page in Chromium. Playwright ships with the cloud containers; on your own machine run `npm i --no-save playwright && npx playwright install chromium` once. Screenshots land in `tests/.out/`.

## Publishing

Cloudflare Workers Builds deploys `main` as the Worker `studio`. Merging to `main` is publishing. Branches get Preview URLs.

## Cutover (done Nov 27 2026; kept for the record)

Before the cutover, the Worker `fbc` held `studio.closetheloop.gr` and served this home page from its own repository. The order mattered, because a custom domain can belong to one Worker only:

1. Connect this repository to Workers Builds (Workers & Pages, Create, Import a repository). The first build creates the Worker `studio`. Check it on its workers.dev address: home page, `/model/`, `/vsm/`.
2. In the Worker `fbc`, Settings, Domains & Routes: remove `studio.closetheloop.gr`. Leave `fbc.closetheloop.gr`.
3. In the Worker `studio`: add the custom domain `studio.closetheloop.gr`. Then uncomment the `routes` line in `wrangler.jsonc` and merge, so the next deploy keeps it.
4. Merge the `pan0sp/FBC` pull request that drops the home page, the `/vsm` proxy and the studio domain from `fbc`, so its next deploy does not take the domain back.

The site is down only between steps 2 and 3, a minute or two.
