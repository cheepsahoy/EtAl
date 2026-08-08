import {CircleHelp, FileText, History, Network} from 'lucide-react'
import {Paper, Stack} from '@mantine/core'
import ActionButton from './ActionButton'
import useWorkspaceContext from '../../hooks/useWorkspaceContext'

function ActionBar() {
    const {activeAction, isCitationMenuOpen, isSelectedArticleOpen, selectAction} = useWorkspaceContext()

    return (
        <Paper component="nav" className="actionBar" aria-label="Workspace actions" p={4} radius="md" shadow="md" withBorder>
            <Stack className="actionBarActions" gap={2}>
                <ActionButton
                    active={isSelectedArticleOpen}
                    icon={FileText}
                    label="Selected Article"
                    onClick={() => selectAction('selected')}
                />
                <ActionButton
                    active={isCitationMenuOpen}
                    icon={Network}
                    label="Explore Graph"
                    onClick={() => selectAction('explore')}
                />
                <ActionButton
                    active={activeAction === 'history'}
                    icon={History}
                    label="History"
                    onClick={() => selectAction('history')}
                />
                <ActionButton
                    active={activeAction === 'help'}
                    icon={CircleHelp}
                    label="Help"
                    onClick={() => selectAction('help')}
                />
            </Stack>
        </Paper>
    )
}

export default ActionBar
