import etALSearch from '../../../../oa_middleware/etal/etalSearch'
import SuggestionList from './SuggestionList'
import {useMemo, useState} from 'react'
import utils from '../../front_end_utils/utils'
import {Search} from 'lucide-react'
import {Box, TextInput} from '@mantine/core'

function SearchBar() {
    const [searchResults, setSearchResults] = useState({
        waiting: true,
        id: null,
        results: [],
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [searchMode, setSearchMode] = useState('autocomplete')
    const [deepSearchLoading, setDeepSearchLoading] = useState(false)
    const debounceAutoComplete = useMemo(() => utils.debounceAsync(etALSearch.autoComplete), [])

    async function searchHandle(input) {
        const inputValue = input.target.value
        setSearchTerm(inputValue)
        setSearchMode('autocomplete')

        if (inputValue.trim().length !== 0) {
            const resp = await debounceAutoComplete(inputValue)
            setSearchResults(resp)
        } else {
            setSearchResults({waiting: true, id: null, results: []})
        }
    }

    async function searchDeeper() {
        if (searchTerm.trim().length === 0) {
            return
        }

        setDeepSearchLoading(true)
        try {
            const resp = await etALSearch.searchDeeper(searchTerm)
            setSearchMode('deep')
            setSearchResults(resp)
        } finally {
            setDeepSearchLoading(false)
        }
    }

    return (
        <Box className="searchArea">
            <TextInput
                id="articleSearch"
                aria-label="Search Papers, Books, DOI, Open Alex ID"
                placeholder="Search Papers, Books, DOI, Open Alex ID . . ."
                leftSection={<Search size={18} strokeWidth={1.5} />}
                radius="xl"
                size="md"
                variant="filled"
                onChange={searchHandle}
            />
            <SuggestionList
                searchResults={searchResults}
                setSearchResults={setSearchResults}
                searchMode={searchMode}
                onSearchDeeper={searchDeeper}
                deepSearchLoading={deepSearchLoading}
            />
        </Box>
    )
}

export default SearchBar
