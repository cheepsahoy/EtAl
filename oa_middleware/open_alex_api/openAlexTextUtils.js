const HTML_ENTITIES = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: '\u00a0',
    quot: '"',
}

const OPENALEX_TEXT_FIELDS = new Set(['display_name', 'title'])
const OPENALEX_FORMATTING_TAGS = new Set(['b', 'em', 'i', 'strong', 'sub', 'sup', 'u'])

function decodeNumericEntity(entity) {
    const isHex = entity.toLowerCase().startsWith('#x')
    const value = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)

    if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) {
        return null
    }

    return String.fromCodePoint(value)
}

export function decodeHTMLText(value) {
    if (typeof value !== 'string' || !value.includes('&')) {
        return value
    }

    return value.replace(/&(#x[\da-f]+|#\d+|[a-z][\da-z]+);/gi, (match, entity) => {
        if (entity.startsWith('#')) {
            return decodeNumericEntity(entity) ?? match
        }

        return HTML_ENTITIES[entity.toLowerCase()] ?? match
    })
}

export function stripHTMLFormatting(value) {
    if (typeof value !== 'string' || !value.includes('<')) {
        return value
    }

    return value.replace(/<\/?([a-z][\w-]*)(?:\s[^<>]*?)?\s*\/?>/gi, (match, tagName) => {
        return OPENALEX_FORMATTING_TAGS.has(tagName.toLowerCase()) ? '' : match
    })
}

export function normalizeHTMLText(value) {
    return stripHTMLFormatting(decodeHTMLText(value))
}

export function normalizeOpenAlexText(payload) {
    if (Array.isArray(payload)) {
        payload.forEach(normalizeOpenAlexText)
        return payload
    }

    if (!payload || typeof payload !== 'object') {
        return payload
    }

    for (const [key, value] of Object.entries(payload)) {
        if (OPENALEX_TEXT_FIELDS.has(key) && typeof value === 'string') {
            payload[key] = normalizeHTMLText(value)
        } else if (value && typeof value === 'object') {
            normalizeOpenAlexText(value)
        }
    }

    return payload
}
