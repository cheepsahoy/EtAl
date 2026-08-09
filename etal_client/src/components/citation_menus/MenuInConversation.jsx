import {useState, useMemo, useEffect} from 'react'
import MenuInConversationResultsPage from './MenuInConversationResultsPage'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'
import {Paper, Title} from '@mantine/core'

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

function MenuInConversation() {
    const [pageNumber, setPageNumber] = useState(0)
    const {data} = useNetworkGraphContext()
    const subdivdedArray = useMemo(() => {
        if (data === null) {
            return []
        } else {
            const newArray = [...data.sorted_citation_conversation]
            return arraySubdivider(newArray)
        }
    }, [data])

    useEffect(() => {
        setPageNumber(0)
    }, [data])

    return (
        <Paper component="section" p="md" radius="md" withBorder>
            <Title order={3} size="sm" mb="sm">
                Ordered by Citation Count
            </Title>
            <MenuInConversationResultsPage
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
                subData={subdivdedArray}
            />
        </Paper>
    )
}

export default MenuInConversation
