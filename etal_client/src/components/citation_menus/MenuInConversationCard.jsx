import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'
import {Button, Group, HoverCard, Paper, Stack, Table, Text} from '@mantine/core'

function lastNameExtractor(string) {
    const regex = /\b(\w+)$/
    const match = string.match(regex)
    if (match) {
        return match[1]
    } else {
        return null
    }
}

function finalAuthorName(authorArray) {
    if (authorArray.length === 0) {
        return 'Unknown author'
    }

    const authorNames = []
    if (authorArray.length > 3) {
        authorNames.push(lastNameExtractor(authorArray[0]))
        authorNames.push(' et al.')
    } else if (authorArray.length !== 1) {
        const finalNamePosition = authorArray.length - 1
        for (let i = 0; i < authorArray.length; i++) {
            if (i === finalNamePosition) {
                authorNames.push('and ')
                authorNames.push(authorArray[i])
            } else {
                authorNames.push(authorArray[i])
                authorNames.push(', ')
            }
        }
    } else {
        authorNames.push(authorArray[0])
    }
    const finalName = authorNames.join('')
    return finalName
}

function publicationYear(publicationDate) {
    const year = String(publicationDate ?? '').match(/\b\d{4}\b/)
    return year?.[0] ?? 'Year unavailable'
}

function detailValue(value, fallback) {
    return value && value !== 'No DOI on record' ? value : fallback
}

function MenuInConversationCard({data, scoreMode = 'citations'}) {
    const {setArticle} = useNetworkGraphContext()

    if (data.data) {
        const uniqueID = 'endResults'
        const payload = data.data

        return (
            <Text id={uniqueID} ta="center" size="sm" c="dimmed" py="sm">
                {payload}
            </Text>
        )
    } else {
        const uniqueID = data.id
        const score = scoreMode === 'oracle' ? data.oracle_score : data.centrality_score
        const title = data.title
        const doi = data.doi
        const publicationDate = data.pub_date
        const source = data.source

        const authorArray = Object.keys(data.authors)
        const finalName = finalAuthorName(authorArray)
        const fullAuthorList = authorArray.length > 0 ? authorArray.join(', ') : 'No authors on record'
        const year = publicationYear(publicationDate)

        const citationDetails = [
            ['Title', detailValue(title, 'No title on record')],
            ['Authors', fullAuthorList],
            ['Published', detailValue(publicationDate, 'No publication date on record')],
            ['Source', detailValue(source, 'No primary source on record')],
            ['DOI', detailValue(doi, 'No DOI on record')],
            ['OpenAlex ID', uniqueID],
        ]

        function buttonHandler() {
            setArticle(uniqueID)
            return
        }

        return (
            <Paper id={uniqueID} p="sm" radius="md" withBorder>
                <Group align="flex-start" gap="sm" justify="space-between" wrap="nowrap" mb="sm">
                    <HoverCard
                        width={340}
                        shadow="md"
                        position="left-start"
                        openDelay={250}
                        closeDelay={100}
                        withinPortal>
                        <HoverCard.Target>
                            <Button
                                variant="subtle"
                                color="amberPulse"
                                size="compact-sm"
                                aria-label={`View citation details for ${title}`}
                                styles={{
                                    root: {
                                        flex: 1,
                                        height: 'auto',
                                        minWidth: 0,
                                        padding: 'var(--mantine-spacing-xs)',
                                        textAlign: 'left',
                                        whiteSpace: 'normal',
                                    },
                                    label: {
                                        overflow: 'visible',
                                        whiteSpace: 'normal',
                                    },
                                }}>
                                “{title}”, by {finalName} ({year})
                            </Button>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                            <Stack gap="xs">
                                <Text fw={700} size="sm">
                                    Citation details
                                </Text>
                                <Table layout="fixed" withRowBorders={false} horizontalSpacing={0} verticalSpacing="xs">
                                    <Table.Tbody>
                                        {citationDetails.map(([label, value]) => (
                                            <Table.Tr key={label}>
                                                <Table.Th w={82} fz="xs" style={{verticalAlign: 'top'}}>
                                                    {label}
                                                </Table.Th>
                                                <Table.Td fz="xs" style={{overflowWrap: 'anywhere'}}>
                                                    {value}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Stack>
                        </HoverCard.Dropdown>
                    </HoverCard>

                    <Text c="oracleGreen.5" size="sm" fw={700} ta="right" style={{flexShrink: 0}}>
                        {scoreMode === 'oracle' ? (
                            <>
                                Cites {score.toLocaleString()} {score === 1 ? 'Work' : 'Works'}
                            </>
                        ) : (
                            <>
                                Cited by {score.toLocaleString()} {score === 1 ? 'Work' : 'Works'}
                            </>
                        )}
                    </Text>
                </Group>

                <Group gap="xs">
                    <Button size="xs" variant="light" onClick={buttonHandler}>
                        Locate in graph
                    </Button>
                    <Button
                        component="a"
                        size="xs"
                        variant="subtle"
                        href={`https://openalex.org/${uniqueID}`}
                        target="_blank"
                        rel="noreferrer">
                        Open article
                    </Button>
                </Group>
            </Paper>
        )
    }
}

export default MenuInConversationCard
