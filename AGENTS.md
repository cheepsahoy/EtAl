# EtAL Repository Guide

## Purpose and current topology

EtAL is a scholarly-conversation visualizer. A user selects an OpenAlex work, EtAL fetches the works that cite it, and the browser builds an interactive citation network. The graph supports incoming **Citations** relationships and outgoing **Oracles** relationships for a selected work.

The application is currently browser-only. `etal_client` imports `oa_middleware` directly, calls OpenAlex from the browser, and constructs graph data in memory. There is no backen.

More information can be found in the subsystem references.

- [Client architecture](docs/architecture-etal-client.md): React state, UI, D3 scene, graph interactions, styling, Vite, and deployment.
- [OpenAlex middleware architecture](docs/architecture-oa-middleware.md): API access, search adapters, citation mapping, payloads, scores.

This is the only project-owned `AGENTS.md`. Keep always-needed instructions here and detailed implementation explanations in the architecture documents.

## Working rules

- Use Mantine for UI and `etal_client/src/theme.js` for reusable semantic colors. Expose semantic CSS variables when CSS or SVG presentation needs them.
- React owns application state and component lifecycle. D3 owns SVG children created inside `NetworkGraph`; update them through graph scene/selection modules.
- Check base, hover, shared, citation-selected, and oracle-selected states when changing graph behavior. One relationship can occupy multiple interaction states.

## Repository map

```text
.
├── AGENTS.md                         Always-loaded project guidance
├── docs/
│   ├── architecture-etal-client.md   Client and visualization reference
│   └── architecture-oa-middleware.md OpenAlex/domain reference
├── etal_client/                      React 19 + Vite browser application
│   ├── src/components/               Search, graph, menus, footer, panels
│   ├── src/contexts/                 Graph and workspace state
│   ├── src/services/                 Browser-side graph loading
│   ├── src/theme.js                  Theme and semantic graph colors
│   └── src/index.css                 Global layout and SVG presentation
├── oa_middleware/
│   ├── open_alex_api/                API wrapper and text normalization
│   ├── etal/                         Search adapter and citation mapper
└── .github/workflows/deploy.yml      GitHub Pages deployment
```

The client imports middleware modules through relative paths outside its source directory. Vite bundles them into the browser application.

## Commands

GitHub Pages uses Node 22.12. Use a compatible Node 22 release. The root, client, and middleware have separate package metadata and lockfiles.

Use the correctly cased client path from repository root:

```bash
npm ci --prefix etal_client
npm run dev --prefix etal_client
npm run lint --prefix etal_client
npm run build --prefix etal_client
```

Install middleware dependencies separately when needed:

Vite development does not use `dist`. Restart the dev server and hard-refresh if local modules appear stale. `build` creates hashed production assets.

## End-to-end flow

1. `SearchBar` calls browser-imported OpenAlex autocomplete or deep search.
2. `CitationCard` fetches the selected full work and calls `NetworkGraphProvider.loadData`.
3. `networkGraphService` creates an `etalCitationMapper` in the browser.
4. The mapper fetches every work citing the central work and derives internal directed relationships and scores.
5. The provider stores the payload and moves the estimated loading UI from `fetching` to `completing`.
6. `NetworkGraph` prepares D3 scales, indexes, layout, SVG layers, simulation, and viewport controller.
7. Selection and hover effects perform keyed joins into dedicated overlay layers without rebuilding the base graph.

The payload contains `centralCitationID`, keyed conversation/outgoing objects, and centrality- and gravity-sorted arrays. Consult the middleware architecture before changing its shape.

## Critical graph invariants

- Internal links point from a citing source work to a cited target work.
- Citation mode selects incoming links; oracle mode selects outgoing links.
- Base links always represent the complete neutral graph.
- Hover-only links, oracle-selected links, citation-selected, etc. live in distinct D3 layers.
- React context mode changes update overlay joins; they do not refetch data or recreate the base simulation.
- D3 resources and event handlers must be released by their scene or hook cleanup.

## Minimum validation

For normal client changes run:

```bash
npm run lint --prefix etAL_client
npm run build --prefix etAL_client
git diff --check
```

Also exercise affected states manually when tests do not exist: initial search, graph loading, node hover, node selection, citation/oracle switching, shared hover plus selection, zoom/reset, and drawer resizing as relevant.

## Planned, not implemented

- Handling for rate limiting
- IndexedDB caching / user history
- shareable OpenAlex-ID routes
- shared outgoing-reference visualization + mode
- citation management / export (w/ Zotero-like integration)
- help page
