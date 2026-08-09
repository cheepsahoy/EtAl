import {normalizeOpenAlexText} from './openAlexTextUtils.js'

class OA_API {
    #api_token

    constructor(your_token = null) {
        this.#api_token = your_token
    }

    //-------------Public Functions-----------------
    //note we can request mulitple works with the pipe symbol '|', see
    //https://blog.ourresearch.org/fetch-multiple-dois-in-one-openalex-api-request/
    //max 100 w/ single API request
    //author returns must use the open-alex ID associated with the

    /**
     *
     * @param {string} searchQuerry
     * @returns {Promise<OA_AutocompleteSearch>}
     */
    async simpleSearchByName(searchQuerry) {
        const searchParam = encodeURIComponent(searchQuerry.trim())
        const searchPath = `autocomplete/works?q=${searchParam}`

        return await this._queryAPI('GET', searchPath)
    }

    async deepSearchByQuerry(searchQuerry, page = 1) {
        const encodedSearch = encodeURIComponent(searchQuerry.trim())
        const finalPath =
            `works?select=${OA_API.SEARCH_WORK_FIELDS}&search=${encodedSearch}` + `&per-page=100&page=${page}`

        return await this._queryAPI('GET', finalPath)
    }

    /**
     *
     * @param {string} doi
     * @returns {Promise<OA_WorkObject}
     */
    async getSingleWorkbyDOI(doi) {
        let doiURL = OA_API.OPEN_ALEX_DOI_URL + doi
        let resp = await this._queryAPI('GET', `works/${doiURL}?select=${OA_API.CITATION_WORK_FIELDS}`)
        return resp
    }

    /**
     * @param {string} openAlexID
     * @returns {Promise<OA_WorkObject>}
     */
    async getSingleWorkByOpenAlexID(openAlexID) {
        const extractedID = this._extractOpenAlexID(openAlexID)
        return await this._queryAPI('GET', `works/${extractedID}?select=${OA_API.CITATION_WORK_FIELDS}`)
    }

    /**
     *
     * @param {array} alexIDArray
     * @returns {Promise<OA_WorkObject[]}
     */
    async getMultiWorks(alexIDArray) {
        let finalProduct = []
        let miniBuilder = []
        for (const alexID of alexIDArray) {
            if (miniBuilder.length === 50) {
                let pathConjoin = miniBuilder.join('|')
                let finalPath =
                    `works?per-page=100&select=${OA_API.OUTGOING_WORK_FIELDS}&filter=openalex:` + pathConjoin
                let resp = await this._queryAPI('GET', finalPath)
                let results = resp.results
                finalProduct = finalProduct.concat(results)
                miniBuilder = []
            }
            miniBuilder.push(alexID)
        }

        if (miniBuilder.length > 0) {
            let pathConjoin = miniBuilder.join('|')
            let finalPath = `works?per-page=100&select=${OA_API.OUTGOING_WORK_FIELDS}&filter=openalex:` + pathConjoin
            let resp = await this._queryAPI('GET', finalPath)
            let results = resp.results
            finalProduct = finalProduct.concat(results)
            miniBuilder = []
        }

        return finalProduct
    }

    /**
     *
     * @param {*} alexID
     * @returns {Promise<OA_WorkObject[]}
     */
    async getCites(alexID) {
        let paramObj = {}
        paramObj[alexID] = 1
        paramObj['&cursor='] = '*'

        let fullCites = []
        let path = `works?per-page=200&select=${OA_API.CITATION_WORK_FIELDS}&filter=cites:`

        console.time('FirstQuery')
        let resp = await this._queryAPI('GET', path, paramObj)
        console.timeEnd('FirstQuery')
        paramObj['&cursor='] = resp.meta.next_cursor
        fullCites = fullCites.concat(resp.results)

        while (resp.meta.next_cursor && resp.results.length) {
            console.time('loopQuerry')
            resp = await this._queryAPI('GET', path, paramObj)
            console.timeEnd('loopQuerry')
            paramObj['&cursor='] = resp.meta.next_cursor
            fullCites = fullCites.concat(resp.results)
        }
        return fullCites
    }

    //-------------Static Values-----------------
    static OPEN_ALEX_URL = 'https://api.openalex.org/'
    static OPEN_ALEX_DOI_URL = 'https://doi.org/'
    // OpenAlex select supports root-level fields only, so nested author and
    // source details are requested through their complete parent objects.
    static CITATION_WORK_FIELDS = [
        'id',
        'doi',
        'title',
        'publication_date',
        'primary_location',
        'authorships',
        'referenced_works',
        'cited_by_count',
    ].join(',')
    static OUTGOING_WORK_FIELDS = ['id', 'doi', 'title', 'publication_date', 'primary_location', 'authorships'].join(
        ',',
    )
    static SEARCH_WORK_FIELDS = ['id', 'doi', 'title', 'authorships', 'cited_by_count'].join(',')

    //-------------Private Functions------------------
    /**
     *
     * @param {string} method
     * @param {string} path
     * @param {object} params
     * @returns {Promise}
     */
    async _queryAPI(method, path, params = '') {
        const methodUpper = method.toUpperCase()
        let fixedPath = OA_API.OPEN_ALEX_URL + path

        let payload = {
            method: methodUpper,
        }

        /**
         * the API code has changed w/ Open Alex. you actually append it to the end of the request, I'll make the change later.
         */
        /*   if (this.#api_token) {
            payload.headers.api_key = this.#api_token
        } */

        if (params !== '' && methodUpper == 'POST') {
            payload.body = JSON.stringify(params)
        }

        if (params !== '' && methodUpper == 'GET') {
            let pathAdd = ''
            for (const key in params) {
                pathAdd += key
                if (key === '&cursor=') {
                    pathAdd += params[key]
                }
            }
            fixedPath = fixedPath += pathAdd
            fixedPath = encodeURI(fixedPath)
        }

        const resp = await fetch(fixedPath, payload)
        if (!resp.ok) {
            throw new Error(`API error: ${resp.status} ${resp.statusText}`)
        }
        return normalizeOpenAlexText(await resp.json())
    }

    /**
     *
     * @param {string} openAlex_URL
     * @returns {string} this is JUST the ID# of the openalex ID
     */
    _extractOpenAlexID(openAlex_URL) {
        const regex = /(W\d+)/gm
        const alexID = openAlex_URL.match(regex)
        return alexID[0]
    }
}

export default OA_API
