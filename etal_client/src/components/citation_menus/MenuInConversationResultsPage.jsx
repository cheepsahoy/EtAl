import MenuInConversationCard from './MenuInConversationCard'
import { Button, Group, Stack, Text } from '@mantine/core'

function MenuInConversationResultsPage({pageNumber, setPageNumber, subData, scoreMode = 'citations'}) {
    if (subData.length === 0) {
        return <Text size="sm" c="dimmed">Waiting on data...</Text>
    } else {
        const lastPageIndex = subData.length - 1
        const relevantPage = subData[Math.min(pageNumber, lastPageIndex)]

        function backWardsHandler() {
            if (pageNumber === 0) {
                return
            } else {
                setPageNumber(prev => Math.max(prev - 1, 0))
            }
        }

        function forwardsHandler() {
            setPageNumber(prev => Math.min(prev + 1, lastPageIndex))
        }

        return (
            <Stack gap="sm">
                <Stack gap="xs">
                    {relevantPage.map(article => {
                        const uniqueID = article.id ?? 'end-results'
                        return (
                            <div key={uniqueID}>
                                <MenuInConversationCard data={article} scoreMode={scoreMode} />
                            </div>
                        )
                    })}
                </Stack>
                <Group grow>
                    <Button variant="default" size="xs" onClick={backWardsHandler} disabled={pageNumber === 0}>
                        Page Back
                    </Button>
                    <Button variant="default" size="xs" onClick={forwardsHandler} disabled={pageNumber >= lastPageIndex}>
                        Page Forward
                    </Button>
                </Group>
            </Stack>
        )
    }
}

export default MenuInConversationResultsPage
