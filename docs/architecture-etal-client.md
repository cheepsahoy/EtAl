# EtAL Client Architecture

## Role and boundary

`etal_client` is the complete user-facing application. It uses React 19, Vite, Mantine, D3, Lucide icons, and browser APIs. It imports search and citation-domain modules directly from [`oa_middleware`](architecture-oa-middleware.md).

The main architectural boundary is:

- React owns application state, UI composition, and lifecycle.
- D3 owns SVG descendants created inside `NetworkGraph` and maintains their positions, styles, and joins.
- Mantine owns component primitives and theme tokens; `index.css` supplies workspace layout and graph-specific presentation.

## Startup and application shell

`src/main.jsx` mounts React in `StrictMode`, imports Mantine and global CSS, and wraps `App` in `StyleControl`. `StyleControl` installs `etalTheme`, resolves semantic CSS variables, and forces a dark color scheme.

`App` nests `WorkspaceProvider` inside `NetworkGraphProvider`. `AppContent` switches on whether graph `data` exists:

- Before a graph loads, `WelcomeScreen` shows main page and search.
- After data exists, the navbar, SVG graph, footer, action bar, exploration drawer, and selected-work panel are mounted.
- While loading, `NetworkLoadingOverlay` covers the active screen.

## Search and graph loading

Both `WelcomeScreen` and `Navbar` render `SearchBar`.

1. Input updates trigger a debounced `etALSearch.autoComplete` request.
2. Autocomplete displays its first ten results.
3. “Search Deeper” runs a full work search and locally paginates up to 100 returned results in ten-result pages.
4. `CitationCard` fetches the selected complete OpenAlex work.
5. It calls `NetworkGraphProvider.loadData`.
6. `networkGraphService` instantiates `etalCitationMapper`, initializes it with the selected work, populates the conversation, and returns the frontend payload.

### Loading presentation

`loadData` resets selection and graph mode to citations, sets `loadingPhase` to `fetching`, and estimates time using the selected work's `cited_by_count`. When data arrives, the phase changes to `completing`; the bar animates to 100%, pauses briefly, and closes.

The estimate is based on an empirical milliseconds-per-citation constant. It is not network or record-level progress. Graph loading currently logs timing information to the console.

## State ownership

### NetworkGraphProvider

Owns graph-domain state and viewport actions:

- `data`, `loading`, `loadingPhase`, and `timeToLoadMS`.
- `selectedArticle`, stored as `{id}` or null.
- `graphMode`, limited to `citations` or `oracle`.
- `loadData`, `setArticle`, and `setGraphMode`.
- A registered controller containing `zoomIn`, `zoomOut`, and `resetView`.
- `isViewportReady`, used to disable footer controls before D3 registration.

Graph mode changes only relationship overlays. They do not fetch new data or rebuild the base scene.

### WorkspaceProvider

Owns presentation and panel state:

- The current action-bar action.
- Pinning for `selected` and `explore`.
- Derived open state for the selected-work panel and citation drawer.
- The measured citation drawer width.

Selecting an already-open pinnable action closes and unpins it. Beginning a graph load resets workspace state. The drawer uses `ResizeObserver` to report its width so the camera can shift.

Both context hooks throw outside their providers; preserve that guard.

## Graph data preparation

`NetworkGraph.jsx` receives the mapper payload and calls `prepareNetworkGraphData`:

- `sorted_citation_conversation` becomes the D3 node array.
- Node radius is a log scale over `centrality_score + 1`, ranging from 10 to 100 pixels.
- Node fill is a sequential log scale over a Plasma-derived palette.
- The first centrality-sorted node is fixed at the layout center. This is the highest-centrality node, usually but not formally guaranteed to equal `centralCitationID`.
- Remaining nodes receive target radial rings from a packed-circle approximation.
- Every `outgoing_cites_internal` entry becomes a directed source-to-target link.
- Maps index nodes plus incoming and outgoing links by ID.
- Graph bounds include the largest possible node and collision buffer.

The layout assumes a non-empty valid node array and does not explicitly recover from an empty D3 extent.

## D3 scene lifecycle

`NetworkGraph` stores the graph model, scene, camera, zoom behavior, and bounds in refs. Its scene-building effect runs for new data or semantic graph colors and destroys the prior simulation during cleanup.

`createNetworkGraphScene` clears the SVG and appends, in paint order:

1. Camera and zoom groups.
2. Neutral base-link group.
3. Hover-link overlay group.
4. Shared-link underlay group.
5. Citation-selected link group.
6. Oracle-selected link group.
7. Base-node group.
8. Hover-neighbor, shared-node, selected-node, and actively-hovered-node groups.

Link groups precede nodes so node visuals cover links. Node accents paint above the base nodes. Overlay groups ignore pointer events; base nodes own pointer enter/leave and delegated click selection.

The force simulation applies:

- Collision radius = scaled node radius + 10-pixel buffer.
- Centering force, disabled only for graphs of two nodes or fewer.
- Strong radial force toward each packed ring.

Each tick positions base nodes, base links, and every active overlay. `destroy` stops the simulation and removes D3 zoom listeners. Add cleanup for any future timers, observers, simulations, or namespaced handlers.

## Relationship selection and layers

Internal link direction is always citing source to cited target.

`getNetworkRelationships` determines neighbors:

- **Citations mode:** incoming links for the selected/hovered target; neighbors are citing sources.
- **Oracle mode:** outgoing links for the selected/hovered source; neighbors are cited targets.

`useNetworkGraphSelection` computes selected links, hover-only links, shared links, hover-only neighbors, and shared nodes before keyed joins:

- Base links show the full graph neutrally.
- Hover-only links are amber, dashed previews.
- Shared hover/selection relationships receive a wide translucent amber underlay.
- Citation-selected links join only into `selectedLinks` and use the selected-link color.
- Oracle-selected links are excluded from `selectedLinks`, join only into `oracleLinks`, and receive semantic oracle green directly on the D3 selection.
- Unselected base links remain neutral in oracle mode.

Selected neighbor nodes use the citer style. The target node uses cited styling in citation mode and oracle styling in oracle mode. A mode change reruns these joins without recreating the simulation.

### Link geometry

`networkGraphLinkPosition.js` calculates geometric circle-edge endpoints. It normalizes the source-to-target vector and offsets each endpoint by the node radius. Coincident nodes fall back to center coordinates to avoid invalid SVG values.

Visual accents extend the endpoint offset:

- Hover neighbor: radius + 4 padding + half of a 3-pixel stroke.
- Active hovered node: radius + 5 padding + half of a 5-pixel stroke.
- Shared node: radius + 7 padding + half of a 6-pixel stroke.

The neutral base link beneath a highlight uses the same active offset map, preventing a translucent line from bleeding below dashed or halo outlines. Update geometry constants whenever corresponding CSS radius offsets or strokes change.

## Hover and viewport behavior

Graph highlighting begins immediately on pointer entry. `NodeHoverCard` appears after 150 ms and chooses a position inside SVG bounds. Pointer leave, zoom/pan start, graph replacement, and relevant viewport changes clear hover and its timer.

`useNetworkGraphViewport` separates D3 zoom from workspace-camera layout:

- Interactive zoom is constrained to 0.25–8.
- Fit calculations account for viewport, navbar, action bar, margins, footer controls, and drawer width.
- Opening the right drawer translates the camera left by half its width.
- The SVG viewBox follows its rendered bounds.
- Resize observers refit for SVG, navbar, and action-bar changes.
- Footer controls zoom by 1.25 or 0.75 and reset to fit.

Do not merge drawer camera translation into D3's zoom transform; they solve different layout concerns.

## Styling

Mantine supplies UI primitives. Prefer theme props and focused CSS hooks over a parallel ad hoc design system. Use inline styles for computed runtime geometry or D3-applied SVG values.

`src/theme.js` defines:

- `milkyPurple`: primary UI and citation-node accents.
- `petrolSpace`: dark canvas, surfaces, text, neutral nodes, and links.
- `redNebula`: citation-selected links.
- `amberPulse`: hover previews and attention accents.
- `oracleGreen`: oracle scores, nodes, and selected links.
- `plasmaCore`: D3-generated node centrality palette.

`getEtalSemanticColors` is the shared semantic interface for React and D3. `etalCssVariablesResolver` exposes roles used by `index.css`. Add semantic roles rather than scattering raw palette indices.

`index.css` owns the fixed full-viewport shell, internal overflow, stacking, translucent surfaces, graph SVG classes, the narrow-screen logo rule, and reduced-motion camera behavior. The body intentionally does not scroll. Inter is the UI font; Newsreader is the wordmark. Google Fonts are fetched at runtime.

## Build and deployment

Use Node 22 and the commands in root `AGENTS.md`. Vite's `base` is `/EtAl/`, matching the case-sensitive GitHub Pages project path.

The Pages workflow on pushes to `main` or manual dispatch:

1. Checks out the repository.
2. Installs Node 22.12 and caches `etal_client/package-lock.json`.
3. Runs `npm ci` and `npm run build` inside `etal_client`.
4. Uploads `dist` and deploys it to GitHub Pages.

## Known limitations

- A failed replacement load leaves old graph data while dismissing the overlay.
- Browser graph construction can be expensive for highly cited works.
- Loading progress is estimated rather than measured.
