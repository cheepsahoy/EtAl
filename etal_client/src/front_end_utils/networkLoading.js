// Empirical browser-side Et Al timing based on:
// 809 citations in ~1,855 ms and 5,000 citations in ~11,985 ms.
export const ETAL_FETCH_MS_PER_CITATION = 2.4

// TUNING KNOB: increase this value (for example, toward 2) when Et Al requests
// move behind a server and the added network/server overhead can be measured.
export const ETAL_SERVER_LATENCY_MULTIPLIER = 1

export const MINIMUM_ESTIMATED_FETCH_MS = 400
export const GRAPH_COMPLETION_ANIMATION_MS = 3000
export const GRAPH_READY_HOLD_MS = 500

export function estimateEtAlFetchTimeMS(citationCount) {
    const normalizedCitationCount = Math.max(Number(citationCount) || 0, 0)
    const measuredEstimate = normalizedCitationCount * ETAL_FETCH_MS_PER_CITATION * ETAL_SERVER_LATENCY_MULTIPLIER

    return Math.max(measuredEstimate, MINIMUM_ESTIMATED_FETCH_MS)
}
