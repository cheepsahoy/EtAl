import {Button, Stack, Text} from '@mantine/core'
import {createElement} from 'react'

function ActionButton({active, icon, label, onClick}) {
    return (
        <Button
            className="actionBarButton"
            variant="subtle"
            color="milkyPurple"
            fullWidth
            h="auto"
            data-active={active || undefined}
            aria-pressed={active}
            onClick={onClick}>
            <Stack align="center" gap={3}>
                {createElement(icon, {size: 19, strokeWidth: 1.6, 'aria-hidden': true})}
                <Text component="span" size="xs" ta="center" lh={1.1}>
                    {label}
                </Text>
            </Stack>
        </Button>
    )
}

export default ActionButton
