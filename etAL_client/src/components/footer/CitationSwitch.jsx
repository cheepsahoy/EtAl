import {SegmentedControl} from '@mantine/core'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'

function CitationSwitch() {
    const {graphMode, setGraphMode} = useNetworkGraphContext()

    return (
        <SegmentedControl
            size="xs"
            value={graphMode}
            onChange={setGraphMode}
            aria-label="Graph relationship mode"
            data={[
                {label: 'Citations', value: 'citations'},
                {label: 'Oracles', value: 'oracle'},
            ]}
        />
    )
}

export default CitationSwitch
