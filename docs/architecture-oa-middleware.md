# EtAL OpenAlex Middleware Architecture

## Role and current boundary

`oa_middleware` contains OpenAlex access, search adapters, citation-network construction, and domain-oriented JSDoc. Its name is historical: it is not an active HTTP middleware or backend service.

The React client imports these modules directly and Vite bundles them for browser execution. Requests go from the user's browser to `https://api.openalex.org/`, and citation mapping happens in browser memory. See [the client architecture](architecture-etal-client.md) for state and visualization behavior.

The directory has its own package metadata and lockfile. Its runtime dependency is `dotenv`, used only by the local smoke script; browser paths do not depend on environment loading.

## Module map

```text
oa_middleware/
├── index.js                         Placeholder; no server implementation
├── open_alex_api/
│   ├── openAlexApi.js               Fetch wrapper and endpoint methods
│   ├── openAlexTextUtils.js         Recursive OpenAlex text normalization
│   └── types.js                     JSDoc payload/domain reference
├── etal/
│   ├── etalSearch.js                Search adapter used by React components
│   └── citationMapper.js            Conversation and score construction
├── package.json
└── test.js                          Ignored local live-API smoke script
```

## OpenAlex API wrapper

`openAlexApi.js` exports the `OA_API` class. Each client-side search or mapper module currently creates its own instance with an empty email and no token.

### Implemented operations

- `simpleSearchByName`: calls `autocomplete/works?q=...`.
- `deepSearchByQuerry`: calls `works` search with selected fields, 100 results per page.
- `getSingleWorkbyDOI`: retrieves a selected citation work by DOI.
- `getSingleWorkByOpenAlexID`: extracts a `W<digits>` identifier and retrieves one work.
- `getMultiWorks`: batches IDs in groups of 50 and retrieves selected outgoing-work fields.
- `getCites`: cursor-paginates all works whose references include a supplied work, requesting up to 200 per page.

OpenAlex field lists are static class values:

- Citation work fields include ID, DOI, title, publication date, location, authorships, references, and cited-by count.
- Outgoing work fields omit referenced works and cited-by count.
- Search fields include ID, DOI, title, authorships, and cited-by count.

The wrapper deliberately selects root-level OpenAlex fields to reduce browser payload size.

### Request construction

`_queryAPI` constructs a global `fetch` request against the OpenAlex API root, checks `response.ok`, parses JSON, and normalizes text. GET cursor parameters are assembled by the current caller-specific object convention rather than a general `URLSearchParams` abstraction.

Current credential limitations:

- The constructor stores an email but never sends it as a polite-pool parameter or header.
- When a token is supplied, `_queryAPI` attempts to assign `payload.headers.api_key` before creating `payload.headers`.
- Browser usage supplies neither email nor token.

There is no retry, backoff, request cancellation, timeout, cache, quota management, or rate-limit recovery.

### OpenAlex ID handling

`_extractOpenAlexID` matches the first `W<digits>` substring from a URL or identifier. Callers assume a match exists; invalid values can cause a null dereference. The search adapter also exposes a duplicate extraction helper to the client.

## Text normalization

`openAlexTextUtils.js` recursively mutates arrays and objects returned by OpenAlex. Only string values under `title` and `display_name` keys are normalized.

Normalization:

- Decodes a small named-entity table plus valid decimal and hexadecimal numeric entities.
- Removes only a controlled set of formatting tags: `b`, `em`, `i`, `strong`, `sub`, `sup`, and `u`.
- Leaves unknown tags and malformed/invalid entities intact.

This is targeted metadata cleanup, not a general HTML sanitizer. Do not treat it as safe rendering for arbitrary user HTML.

## Search adapter

`etal/etalSearch.js` presents the interface used by React:

- `autoComplete(input)` returns the OpenAlex autocomplete response.
- `searchDeeper(input)` requests page one of deep work search and maps work results into the autocomplete result shape.
- `getWorkByOpenAlexID(id)` fetches the work fields needed by the citation mapper.
- `_extractOpenAlexID(value)` supports IDs used as DOM/data keys.
- `deepSearchManager` maintains a term and page counter but is not used by the current UI.

Deep-search adaptation joins available authorship display names into `hint`, maps the work title into `display_name`, and maps DOI into `external_id`.

The `openAlexApi` import omits the `.js` extension. Vite resolves this path, but strict direct Node ESM execution may not.

## Citation mapper lifecycle

`citationMapper.js` exports `etalCitationMapper` and uses a module-level `OA_API` instance.

### Initialization

`initialize(initialGetCite)`:

1. Extracts the selected work's OpenAlex ID as `centralCitationID`.
2. Creates the central `citation_conversation` record.
3. Copies DOI, title, publication date, primary source, landing-page URL, and authors where available.
4. Initializes relationship maps and zero centrality/oracle scores.
5. Creates skeletal `citations_outgoing` entries for each work in `referenced_works`.
6. Records the central work as an incoming citer of those external entries.
7. Skips a recursive reference to the central ID.

Missing central bibliographic values receive human-readable fallback strings. Authors are stored as object keys with value `1`, effectively a name set rather than an ordered typed array.

### Conversation population

`populateConversation(centralConversation)` defaults to the central ID:

1. `getCites` fetches every work that cites the central work.
2. Each result becomes a conversation record with bibliographic fields and empty relationship maps.
3. Non-central conversation works begin with `oracle_score: 1`, representing their known central-work citation relationship.
4. A second pass examines every result's `referenced_works`.
5. Every reference enters the source's `outgoing_cites` map.
6. References to another conversation work also enter `outgoing_cites_internal`; the target records the source in `incoming_cites`.
7. The internal target's `centrality_score` increments.
8. The source's `oracle_score` increments when that internal target is not the central work.
9. References outside the conversation update or create `citations_outgoing` records and increment gravity.
10. Conversation records are sorted descending by centrality.
11. External outgoing records with gravity above one are sorted descending into `sorted_citations_outgoing`.

The relationship direction is always citing source to cited target. The client relies on this for incoming citation selection and outgoing oracle selection.

## Scores

### Centrality score

For a conversation work, `centrality_score` counts internal incoming references discovered during the mapper's second pass. The client uses it for default ranking, node size, node color, and citation-mode relationship presentation.

### Oracle score

For non-central conversation works, `oracle_score` begins at one and increments for each additional internal work it cites other than the central work. It therefore represents how broadly a work references participants in the same conversation. The client uses it for oracle ranking and display, while oracle graph relationships themselves come from the actual outgoing-link index.

### Gravity score

For references outside the conversation, `gravity_score` counts how many conversation sources reference that external work. Gravity-one records remain in `citations_outgoing` but are excluded from `sorted_citations_outgoing`. The current client does not visualize this result.

These are implementation semantics, not normalized bibliometric measures. Confirm product meaning before changing labels, adjusting displayed counts, or publishing them as stable external APIs.

## Frontend payload

`networkGraphService` returns mapper state as:

```js
{
    centralCitationID,
    citation_conversation,
    citations_outgoing,
    sorted_citation_conversation,
    sorted_citations_outgoing,
}
```

Conversation entries use this effective shape:

```js
{
    doi,
    id,
    title,
    pub_date,
    source,
    publication_location,
    citation,
    authors,
    outgoing_cites,
    outgoing_cites_internal,
    incoming_cites,
    abstract,
    centrality_score,
    oracle_score,
}
```

External outgoing entries are similar but use `gravity_score`. They may remain skeletal until `_identifyOutgoing` fetches details. `citation` and `abstract` are currently null placeholders.

The JSDoc in `open_alex_api/types.js` is descriptive only; it is not runtime validation or TypeScript. Some names and annotations are stale, so use mapper/service code as the source of truth.

## Client integration

The browser service performs the mapper lifecycle and logs timing. `NetworkGraphProvider` stores the payload. The client then:

- Uses `sorted_citation_conversation` as D3 nodes.
- Converts `outgoing_cites_internal` to directed links.
- Builds incoming/outgoing indexes for citation and oracle graph modes.
- Uses `citation_conversation` for selected-work details.
- Uses the sorted conversation array for centrality and oracle ranking menus.

Changing the payload or relationship maps requires coordinated updates in the client architecture. Preserve OpenAlex `W...` IDs as stable keys.

## Package commands and testing

Install package dependencies from repository root with:

```bash
npm ci --prefix oa_middleware
```

`package.json` defines `npm test` as `node test.js`. The current local test script loads `../.env`, creates an `OA_API` with `OPEN_ALEX_EMAIL`, performs a real autocomplete request, and logs metadata. Root `.gitignore` ignores `test.js` and `test_data`, so these are not reliable fresh-clone tests.

There are no mocked API tests, mapper fixtures in version control, contract tests, or retry/error-path tests. Network-dependent smoke calls should not be treated as deterministic CI validation.

## Known limitations and planned middleware work

- `index.js` contains no server implementation.
- `identifyOutgoingCitations` and `sharedOutgoing` are unfinished.
- `_identifyOutgoing` is only reached by unfinished paths and assumes nested source fields exist.
- API credential, retry, cancellation, throttling, and rate-limit behavior are incomplete.
- Fetching all citing works may require many cursor pages and substantial browser processing.
- No cache prevents repeated requests for a previously loaded work.
- Data objects are mutable, loosely shaped JavaScript with no runtime schema validation.
- Console timing remains in production execution paths.
- External outgoing/gravity results are computed but unused by the visualization.

Planned direction includes moving requests behind a protected server, abuse prevention, database-backed response caching, controlled expansion of outgoing works, richer gravity analysis, and citation-list/export support. None is implemented today.
