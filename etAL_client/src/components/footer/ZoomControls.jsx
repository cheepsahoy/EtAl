import {ActionIcon, Group, Tooltip} from '@mantine/core'
import {Maximize2, Minus, Plus} from 'lucide-react'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'

function ZoomControls() {
    const {isViewportReady, zoomIn, zoomOut, resetView} = useNetworkGraphContext()

    return (
        <Group gap={4} wrap="nowrap">
            <Tooltip label="Zoom out">
                <ActionIcon
                    variant="default"
                    aria-label="Zoom out"
                    disabled={!isViewportReady}
                    onClick={zoomOut}>
                    <Minus size={16} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Reset view">
                <ActionIcon
                    variant="default"
                    aria-label="Reset graph view"
                    disabled={!isViewportReady}
                    onClick={resetView}>
                    <Maximize2 size={15} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom in">
                <ActionIcon
                    variant="default"
                    aria-label="Zoom in"
                    disabled={!isViewportReady}
                    onClick={zoomIn}>
                    <Plus size={16} />
                </ActionIcon>
            </Tooltip>
        </Group>
    )
}

export default ZoomControls
