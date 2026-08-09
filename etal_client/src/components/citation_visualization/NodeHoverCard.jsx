import {Paper, Stack, Text} from '@mantine/core'

function publicationYear(publicationDate) {
    const year = String(publicationDate ?? '').match(/\b\d{4}\b/)
    return year?.[0] ?? 'Year unavailable'
}

function condensedAuthor(authors) {
    const authorNames = Object.keys(authors ?? {})
    if (authorNames.length === 0) return 'Unknown author'
    if (authorNames.length === 1) return authorNames[0]

    const firstAuthorLastName = authorNames[0].trim().split(/\s+/).at(-1)
    return `${firstAuthorLastName} et al.`
}

function NodeHoverCard({article, graphMode, position}) {
    const isOracleMode = graphMode === 'oracle'
    const score = isOracleMode ? article.oracle_score : article.centrality_score

    return (
        <Paper
            className="nodeHoverCard"
            p="sm"
            radius="md"
            shadow="lg"
            withBorder
            style={{left: position.left, top: position.top}}>
            <Stack gap={3}>
                <Text fw={700} size="sm" lineClamp={2}>
                    {article.title || 'No title on record'}
                </Text>
                <Text c="dimmed" size="xs" lineClamp={1}>
                    {publicationYear(article.pub_date)} · {condensedAuthor(article.authors)}
                </Text>
                <Text c="dimmed" size="xs">
                    {isOracleMode ? 'Citing ' : 'Cited by '}
                    <Text component="span" inherit c={isOracleMode ? 'oracleGreen.5' : 'amberPulse.4'} fw={700}>
                        {Number.isFinite(score) ? score.toLocaleString() : '0'}
                    </Text>
                </Text>
            </Stack>
        </Paper>
    )
}

export default NodeHoverCard
