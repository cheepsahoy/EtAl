import {useEffect, useMemo, useState} from 'react'
import {Paper, Title} from '@mantine/core'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'
import MenuInConversationResultsPage from './MenuInConversationResultsPage'

function arraySubdivider(array) {
    const subdivdedArray = []
    let arraySlice = []

    for (const entry of array) {
        if (arraySlice.length < 10) {
            arraySlice.push(entry)
        } else {
            subdivdedArray.push(arraySlice)
            arraySlice = [entry]
        }
    }
    arraySlice.push({data: 'End of results'})
    subdivdedArray.push(arraySlice)

    return subdivdedArray
}

function MenuOracles() {
    const [pageNumber, setPageNumber] = useState(0)
    const {data} = useNetworkGraphContext()
    const subdivdedArray = useMemo(() => {
        if (data === null) {
            return []
        }

        const newArray = [...data.sorted_citation_conversation]
        newArray.sort((a, b) => b.oracle_score - a.oracle_score)
        return arraySubdivider(newArray)
    }, [data])

    useEffect(() => {
        setPageNumber(0)
    }, [data])

    return (
        <Paper component="section" p="md" radius="md" withBorder>
            <Title order={3} size="sm" mb="sm">
                Ordered by Oracle Score
            </Title>
            <MenuInConversationResultsPage
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
                subData={subdivdedArray}
                scoreMode="oracle"
            />
        </Paper>
    )
}

export default MenuOracles
