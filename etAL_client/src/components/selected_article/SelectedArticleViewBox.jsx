import {
    ActionIcon,
    Affix,
    Button,
    Collapse,
    Divider,
    Group,
    Paper,
    Stack,
    Table,
    Text,
    Title,
    Tooltip,
    Transition,
    UnstyledButton,
} from '@mantine/core'
import {ChevronDown, ChevronUp, Pin, X} from 'lucide-react'
import {useState} from 'react'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'
import useWorkspaceContext from '../../hooks/useWorkspaceContext'

function displayValue(value, fallback) {
    return value && value !== 'No DOI on record' ? value : fallback
}

function publicationYear(publicationDate) {
    const year = String(publicationDate ?? '').match(/\b\d{4}\b/)
    return year?.[0] ?? 'Year unavailable'
}

function DetailToggle({expanded, onClick}) {
    return (
        <Group gap="xs" wrap="nowrap">
            <Divider style={{flex: 1}} />
            <UnstyledButton
                type="button"
                onClick={onClick}
                aria-expanded={expanded}
                aria-controls="selected-work-details">
                <Group gap={3} wrap="nowrap">
                    <Text c="milkyPurple.3" fw={600} size="xs">
                        {expanded ? 'Less Detail' : 'More Detail'}
                    </Text>
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </Group>
            </UnstyledButton>
            <Divider style={{flex: 1}} />
        </Group>
    )
}

const selectedWorkTransition = {
    in: {opacity: 1, transform: 'translateX(0) scale(1)'},
    out: {opacity: 0, transform: 'translateX(-8px) scale(0.98)'},
    common: {transformOrigin: 'top left'},
    transitionProperty: 'opacity, transform',
}

function SelectedArticleViewBox() {
    const [isExpanded, setIsExpanded] = useState(false)
    const {data, selectedArticle} = useNetworkGraphContext()
    const {isSelectedArticleOpen, pinnedActions, closeAction, toggleActionPin} = useWorkspaceContext()
    const article = selectedArticle?.id ? data?.citation_conversation?.[selectedArticle.id] : null
    const citedByCount = Number.isFinite(article?.centrality_score) ? article.centrality_score : 0
    const citingCount = Number.isFinite(article?.oracle_score) ? article.oracle_score + 1 : 0
    const authors = Object.keys(article?.authors ?? {}).join(', ') || 'No authors on record'

    const details = article
        ? [
              ['Source', displayValue(article.source, 'No primary source on record')],
              ['DOI', displayValue(article.doi, 'No DOI on record')],
          ]
        : []

    return (
        <Affix
            className="selectedArticleViewBox"
            withinPortal={false}
            position={{
                top: 'var(--etal-workspace-top)',
                left: 'calc(var(--etal-action-bar-left) + var(--etal-action-bar-width) + var(--etal-action-bar-gap))',
            }}
            zIndex={4}>
            <Transition
                mounted={isSelectedArticleOpen}
                transition={selectedWorkTransition}
                duration={220}
                timingFunction="ease">
                {transitionStyles => (
                    <Paper
                        component="aside"
                        aria-live="polite"
                        p="sm"
                        radius="md"
                        shadow="md"
                        withBorder
                        style={transitionStyles}>
                        <Stack gap={4}>
                            <Group justify="space-between" wrap="nowrap">
                                <Text c="milkyPurple.4" fw={700} size="xs" tt="uppercase">
                                    Selected Work
                                </Text>
                                <Group gap={2} wrap="nowrap">
                                    <Tooltip
                                        label={pinnedActions.selected ? 'Unpin selected work' : 'Pin selected work'}>
                                        <ActionIcon
                                            size="sm"
                                            variant={pinnedActions.selected ? 'light' : 'subtle'}
                                            aria-label={
                                                pinnedActions.selected ? 'Unpin selected work' : 'Pin selected work'
                                            }
                                            aria-pressed={pinnedActions.selected}
                                            onClick={() => toggleActionPin('selected')}>
                                            <Pin size={14} fill={pinnedActions.selected ? 'currentColor' : 'none'} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Close selected work">
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            aria-label="Close selected work"
                                            onClick={() => closeAction('selected')}>
                                            <X size={15} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                            {article ? (
                                <>
                                    <Title order={2} size="sm">
                                        {displayValue(article.title, 'No title on record')}
                                    </Title>
                                    <Text size="xs" c="dimmed">
                                        {authors} * {publicationYear(article.pub_date)}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Citing{' '}
                                        <Text component="span" inherit c="amberPulse.4" fw={700}>
                                            {citedByCount.toLocaleString()}
                                        </Text>{' '}
                                        {' * '} Cited by{' '}
                                        <Text component="span" inherit c="oracleGreen.5" fw={700}>
                                            {citingCount.toLocaleString()}
                                        </Text>
                                    </Text>
                                    <Collapse
                                        in={isExpanded}
                                        transitionDuration={260}
                                        transitionTimingFunction="ease">
                                        <Table
                                            id="selected-work-details"
                                            layout="fixed"
                                            withRowBorders={false}
                                            horizontalSpacing={0}
                                            verticalSpacing={3}
                                            mt={4}>
                                            <Table.Tbody>
                                                {details.map(([label, value]) => (
                                                    <Table.Tr key={label}>
                                                        <Table.Th w={104} fz="xs" style={{verticalAlign: 'top'}}>
                                                            {label}
                                                        </Table.Th>
                                                        <Table.Td fz="xs" style={{overflowWrap: 'anywhere'}}>
                                                            {value}
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                        <Group gap="xs" justify="center" mt="xs">
                                            <Button
                                                component="a"
                                                size="xs"
                                                variant="light"
                                                href={`https://openalex.org/${article.id}`}
                                                target="_blank"
                                                rel="noreferrer">
                                                OpenAlex ↗
                                            </Button>
                                            <Button size="xs" variant="default" disabled>
                                                Works Cited ↗
                                            </Button>
                                        </Group>
                                    </Collapse>
                                    <DetailToggle
                                        expanded={isExpanded}
                                        onClick={() => setIsExpanded(current => !current)}
                                    />
                                </>
                            ) : (
                                <Text size="xs" c="dimmed">
                                    No Selected Work
                                </Text>
                            )}
                        </Stack>
                    </Paper>
                )}
            </Transition>
        </Affix>
    )
}

export default SelectedArticleViewBox
