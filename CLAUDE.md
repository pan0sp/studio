# Close the Loop Studio: notes for Claude

The front door of studio.closetheloop.gr. `README.md` describes the layout, the rules, adding a tool and the cutover; this file holds how to work here.

## Working with Panos

- Write in Canadian English. No em dashes in prose (UI text, docs, commit messages, replies).
- Ask before merging to `main`: merging is publishing.
- After finishing a task, add a short **Forks** section (at most three one-line items) only when: you chose between approaches that give meaningfully different results (name the discarded one); you assumed something not stated; something contradicted the request's framing; you noticed something worth doing that was out of scope. Otherwise write nothing.
- Look at screenshots after visual changes (`tests/.out/`).

## Decisions (do not undo without asking)

- Tools live at paths, one Worker and one repository each, behind this router (decided Nov 25-27 2026). Outside code gets a subdomain. The name is Close the Loop Studio (renamed from Flourishing Studio on Nov 26).
- The studio look is Close the Loop's: navy chrome, sparing gold, Raleway display, Comfortaa only for the wordmark. Tokens live in `public/shared/studio.css`; tools copy them in at build time and never fetch them at run time. Each tool keeps its own subject colours inside the chrome and, for now, its own body face (Business Model: Fira Sans; VSM: Open Sans).
- The Worker `fbc` keeps its name (Workers Builds is tied to it) even though it now serves only Business Model.
- Old hosts 301 to their paths for good; they are Cloudflare dashboard Redirect Rules, not code here.
