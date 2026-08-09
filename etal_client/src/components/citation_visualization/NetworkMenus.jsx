import MenuInConversation from '../citation_menus/MenuInConversation'
import MenuOracles from '../citation_menus/MenuOracles'
import {ActionIcon, Drawer, Group, Tabs, Text, Tooltip} from '@mantine/core'
import {Pin, X} from 'lucide-react'
import {useEffect, useRef} from 'react'
import useWorkspaceContext from '../../hooks/useWorkspaceContext'

function NetworkMenus() {
    const drawerRootRef = useRef(null)
    const {isCitationMenuOpen, pinnedActions, closeAction, toggleActionPin, setCitationMenuWidth} =
        useWorkspaceContext()

    useEffect(() => {
        if (!isCitationMenuOpen) return undefined

        const drawer = drawerRootRef.current?.querySelector('.citationDrawer')
        if (!drawer) return undefined

        function reportWidth() {
            setCitationMenuWidth(drawer.getBoundingClientRect().width)
        }

        reportWidth()
        const observer = new ResizeObserver(reportWidth)
        observer.observe(drawer)
        return () => observer.disconnect()
    }, [isCitationMenuOpen, setCitationMenuWidth])

    return (
        <Drawer
            ref={drawerRootRef}
            opened={isCitationMenuOpen}
            onClose={() => closeAction('explore')}
            position="right"
            size="min(440px, 88vw)"
            padding="lg"
            withOverlay={false}
            trapFocus={false}
            lockScroll={false}
            returnFocus={false}
            closeOnClickOutside={false}
            withCloseButton={false}
            classNames={{
                content: 'citationDrawer',
                header: 'citationDrawerHeader',
                title: 'citationDrawerTitle',
                body: 'citationDrawerBody',
            }}
            title={
                <Group justify="space-between" wrap="nowrap" w="100%">
                    <Text c="milkyPurple.4" fw={700} size="xs" tt="uppercase">
                        Explore the Citation Graph
                    </Text>
                    <Group gap={2} wrap="nowrap">
                        <Tooltip label={pinnedActions.explore ? 'Unpin explore tab' : 'Pin explore tab'}>
                            <ActionIcon
                                size="sm"
                                variant={pinnedActions.explore ? 'light' : 'subtle'}
                                aria-label={pinnedActions.explore ? 'Unpin explore tab' : 'Pin explore tab'}
                                aria-pressed={pinnedActions.explore}
                                onClick={() => toggleActionPin('explore')}>
                                <Pin size={14} fill={pinnedActions.explore ? 'currentColor' : 'none'} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Close explore tab">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                aria-label="Close explore tab"
                                onClick={() => closeAction('explore')}>
                                <X size={15} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            }>
            <Tabs defaultValue="internal" keepMounted={false}>
                <Tabs.List grow mb="md">
                    <Tabs.Tab value="internal">Ordered By Citations</Tabs.Tab>
                    <Tabs.Tab value="oracle">
                        <Group component="span" gap={4} wrap="nowrap">
                            <span>Ordered By Oracle</span>
                            <Tooltip
                                label="Oracles are the term we use to describe the works that determine the most important players in a scholarly conversation. The higher an oracle score, the more players in the conversation are cited by the selected work."
                                position="bottom"
                                multiline
                                w={280}
                                withArrow>
                                <Text
                                    component="span"
                                    c="amberPulse.4"
                                    fw={700}
                                    aria-label="Explains what an Oracle means in EtAl ">
                                    [?]
                                </Text>
                            </Tooltip>
                        </Group>
                    </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="oracle">
                    <MenuOracles />
                </Tabs.Panel>
                <Tabs.Panel value="internal">
                    <MenuInConversation />
                </Tabs.Panel>
            </Tabs>
        </Drawer>
    )
}

export default NetworkMenus
