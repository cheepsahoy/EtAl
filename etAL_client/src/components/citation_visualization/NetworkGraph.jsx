import {useEffect, useMemo, useRef} from 'react'
import {useMantineTheme} from '@mantine/core'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'
import useWorkspaceContext from '../../hooks/useWorkspaceContext'
import {getEtalSemanticColors} from '../../theme'
import NodeHoverCard from './NodeHoverCard'
import {prepareNetworkGraphData} from './network_graph/networkGraphData'
import {createNetworkGraphScene} from './network_graph/networkGraphScene'
import useNetworkGraphHover from './network_graph/useNetworkGraphHover'
import useNetworkGraphSelection from './network_graph/useNetworkGraphSelection'
import useNetworkGraphViewport from './network_graph/useNetworkGraphViewport'

function NetworkGraph() {
    const {isCitationMenuOpen, citationMenuWidth} = useWorkspaceContext()
    const {
        data,
        selectedArticle,
        setArticle,
        graphMode,
        registerGraphViewport,
    } = useNetworkGraphContext()
    const svgRef = useRef()
    const graphSceneRef = useRef()
    const graphModelRef = useRef()
    const cameraLayerRef = useRef()
    const zoomBehaviorRef = useRef()
    const graphBoundsRef = useRef()
    const theme = useMantineTheme()
    const graphColors = useMemo(() => getEtalSemanticColors(theme).graph, [theme])
    const {hoveredNodeId, hoverCard, showNodePreview, hideNodePreview} = useNetworkGraphHover(data)

    useEffect(() => {
        if (!data || !svgRef.current) return undefined

        const graph = prepareNetworkGraphData(data, graphColors)
        const scene = createNetworkGraphScene({
            svgElement: svgRef.current,
            graph,
            onNodeEnter: showNodePreview,
            onNodeLeave: hideNodePreview,
            onInteractionStart: hideNodePreview,
        })

        graphModelRef.current = graph
        graphSceneRef.current = scene
        cameraLayerRef.current = scene.cameraLayer
        zoomBehaviorRef.current = scene.zoomBehavior
        graphBoundsRef.current = graph.bounds

        return () => {
            scene.destroy()
            graphModelRef.current = undefined
            graphSceneRef.current = undefined
            cameraLayerRef.current = undefined
            zoomBehaviorRef.current = undefined
            graphBoundsRef.current = undefined
        }
    }, [data, graphColors, hideNodePreview, showNodePreview])

    useNetworkGraphViewport({
        svgRef,
        cameraLayerRef,
        zoomBehaviorRef,
        graphBoundsRef,
        data,
        sceneKey: graphColors,
        isCitationMenuOpen,
        citationMenuWidth,
        hideNodePreview,
        registerGraphViewport,
    })

    useNetworkGraphSelection({
        svgRef,
        graphSceneRef,
        graphModelRef,
        data,
        graphColors,
        graphMode,
        selectedArticle,
        hoveredNodeId,
        setArticle,
    })

    return (
        <div className="visualization">
            <svg ref={svgRef} width="100%" height="100%" />
            {hoverCard && (
                <NodeHoverCard
                    article={hoverCard.article}
                    graphMode={graphMode}
                    position={hoverCard.position}
                />
            )}
        </div>
    )
}

export default NetworkGraph
