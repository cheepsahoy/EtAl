import OA_API from '../open_alex_api/openAlexApi'

const OpenAlexAPI = new OA_API('')

class deepSearchManager {
    constructor(initial) {
        this.searchTerm = initial
        this.page = 1
        this.lastResult = []
    }

    async nextPage() {
        const response = await OpenAlexAPI.deepSearchByQuerry(this.searchTerm, this.page)
        if (response.error) {
            console.log(response.error)
            return
        }
        if (response.results.length === 0) {
            console.log('Reached the end of search')
            return
        }
        this.lastResult = response.results
        this.page++
        return response.results
    }

    reset(newSearch = '') {
        this.searchTerm = newSearch
        this.page = 1
        this.lastResult = []
    }
}

async function autoComplete(input) {
    return await OpenAlexAPI.simpleSearchByName(input)
}

function workToAutocompleteResult(work) {
    const authorNames = (work.authorships ?? []).map(authorship => authorship.author?.display_name).filter(Boolean)

    return {
        id: work.id,
        external_id: work.doi,
        display_name: work.title,
        entity_type: 'work',
        cited_by_count: work.cited_by_count,
        works_count: null,
        hint: authorNames.join(', '),
    }
}

async function searchDeeper(input) {
    const response = await OpenAlexAPI.deepSearchByQuerry(input, 1)

    return {
        ...response,
        results: response.results.map(workToAutocompleteResult),
    }
}

async function getWorkByOpenAlexID(openAlexID) {
    return await OpenAlexAPI.getSingleWorkByOpenAlexID(openAlexID)
}

function _extractOpenAlexID(openAlex_URL) {
    const regex = /(W\d+)/gm
    const alexID = openAlex_URL.match(regex)
    return alexID[0]
}

export default {
    autoComplete,
    searchDeeper,
    getWorkByOpenAlexID,
    _extractOpenAlexID,
    deepSearchManager,
}
