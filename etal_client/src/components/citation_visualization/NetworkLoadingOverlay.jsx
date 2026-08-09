import {Paper, Stack, Text} from '@mantine/core'
import NetworkLoadingBar from './NetworkLoadingBar'

function NetworkLoadingOverlay({estimatedLoadingTimeMS, loadingPhase}) {
    const message =
        loadingPhase === 'completing' ? 'Preparing your visualization…' : 'Mapping the scholarly conversation…'

    return (
        <div className="networkLoadingOverlay" role="status" aria-live="polite">
            <Paper className="networkLoadingMessage" p="lg" radius="md" shadow="md">
                <Stack gap="sm">
                    <Text fw={700}>{message}</Text>
                    <NetworkLoadingBar estimatedLoadingTimeMS={estimatedLoadingTimeMS} loadingPhase={loadingPhase} />
                </Stack>
            </Paper>
        </div>
    )
}

export default NetworkLoadingOverlay
