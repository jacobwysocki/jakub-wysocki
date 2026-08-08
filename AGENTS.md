# Repository guidance

- **Desktop Mode, Ask Jakub, or a new Desktop App:** read [CONTEXT.md](./CONTEXT.md) and [docs/desktop-v2/README.md](./docs/desktop-v2/README.md) before changing code.
- **Desktop v2 work package:** read [docs/desktop-v2/AGENT-PLAN.md](./docs/desktop-v2/AGENT-PLAN.md), satisfy its entry criteria, and keep changes inside the assigned ownership.
- **Ask Jakub implementation:** also read [docs/desktop-v2/ASK-JAKUB.md](./docs/desktop-v2/ASK-JAKUB.md); its grounding, privacy, evidence, and failure rules are launch requirements.
- **Entity, structured-data, canonical URL, or public identity change:** read [docs/ENTITY.md](./docs/ENTITY.md) before editing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
