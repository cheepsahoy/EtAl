import {Group} from '@mantine/core'
import CitationSwitch from './CitationSwitch'
import ZoomControls from './ZoomControls'

function FooterBar() {
    return (
        <Group component="footer" className="footerBar" gap="xs" wrap="nowrap" aria-label="Graph controls">
            <CitationSwitch />
            <ZoomControls />
        </Group>
    )
}

export default FooterBar
