import * as d3 from 'd3'
import {useEffect} from 'react'
import {getNetworkRelationships} from './networkGraphData'
import {updateGraphOverlayPositions} from './networkGraphScene'

const HOVER_NEIGHBOR_RADIUS_OFFSET = 4
const HOVERED_NODE_RADIUS_OFFSET = 5
const SHARED_NODE_RADIUS_OFFSET = 7
const HOVER_NEIGHBOR_LINK_OFFSET = HOVER_NEIGHBOR_RADIUS_OFFSET + 3 / 2
const HOVERED_NODE_LINK_OFFSET = HOVERED_NODE_RADIUS_OFFSET + 5 / 2
const SHARED_NODE_LINK_OFFSET = SHARED_NODE_RADIUS_OFFSET + 6 / 2

function joinLinks(layer, links, className, getRadiusOffset) {
    const positionedLinks = links.map(link => ({
        ...link,
        sourceRadiusOffset: getRadiusOffset(link.source),
        targetRadiusOffset: getRadiusOffset(link.target),
    }))

    return layer
        .selectAll('line')
        .data(positionedLinks, link => link.key)
        .join('line')
        .attr('class', `graphOverlay isVisible ${className}`)
}

function joinNodes(layer, nodes, className, graph, radiusOffset) {
    return layer
        .selectAll('circle')
        .data(nodes, node => node.id)
        .join('circle')
        .attr('r', node => graph.sizeScale(node.centrality_score + 1) + radiusOffset)
        .attr('class', `graphOverlay isVisible ${className}`)
}

export default function useNetworkGraphSelection({
    svgRef,
    graphSceneRef,
    graphModelRef,
    data,
    graphColors,
    graphMode,
    selectedArticle,
    hoveredNodeId,
    setArticle,
}) {
    useEffect(() => {
        if (!data || !svgRef.current) return undefined

        const svg = d3.select(svgRef.current)
        svg.on('click.selectArticle', event => {
            if (!event.target.matches('.node')) return
            setArticle(d3.select(event.target).datum().id)
        })

        return () => svg.on('click.selectArticle', null)
    }, [data, setArticle, svgRef])

    useEffect(() => {
        const graph = graphModelRef.current
        const scene = graphSceneRef.current
        if (!graph || !scene) return

        const selectedNodeId = selectedArticle?.id ?? null
        const selected = getNetworkRelationships(graph, selectedNodeId, graphMode)
        const hovered = getNetworkRelationships(graph, hoveredNodeId, graphMode)
        const selectedNodeIds = new Set(selected.nodes.map(node => node.id))
        const selectedLinks = new Set(selected.links)
        const hoverOnlyLinks = hovered.links.filter(link => !selectedLinks.has(link))
        const sharedLinks = hovered.links.filter(link => selectedLinks.has(link))
        const hoverOnlyNeighbors = hovered.neighborNodes.filter(node => !selectedNodeIds.has(node.id))
        const sharedNodes = hovered.nodes.filter(
            node => node.id !== hoveredNodeId && selectedNodeIds.has(node.id),
        )
        const layers = scene.highlightLayers
        const visualRadiusOffsets = new Map([
            ...hoverOnlyNeighbors.map(node => [node.id, HOVER_NEIGHBOR_LINK_OFFSET]),
            ...sharedNodes.map(node => [node.id, SHARED_NODE_LINK_OFFSET]),
        ])
        if (hovered.targetNode) {
            visualRadiusOffsets.set(hovered.targetNode.id, HOVERED_NODE_LINK_OFFSET)
        }
        const getVisualRadiusOffset = node => visualRadiusOffsets.get(node.id) ?? 0

        scene.setBaseLinkRadiusOffset(getVisualRadiusOffset)
        joinLinks(layers.hoverLinks, hoverOnlyLinks, 'hoverPreviewLink', getVisualRadiusOffset)
        joinLinks(layers.sharedLinks, sharedLinks, 'sharedLinkUnderlay', getVisualRadiusOffset)
        joinLinks(layers.selectedLinks, selected.links, 'selectedLink', getVisualRadiusOffset)
        joinNodes(
            layers.hoverNeighbors,
            hoverOnlyNeighbors,
            'hoverPreviewNeighbor',
            graph,
            HOVER_NEIGHBOR_RADIUS_OFFSET,
        )
        joinNodes(
            layers.sharedNodes,
            sharedNodes,
            'sharedNodeHalo',
            graph,
            SHARED_NODE_RADIUS_OFFSET,
        )

        layers.selectedNodes
            .selectAll('circle')
            .data(selected.nodes, node => node.id)
            .join('circle')
            .attr('r', node => graph.sizeScale(node.centrality_score + 1))
            .style('fill', node => graph.colorScale(node.centrality_score + 1))
            .attr('class', node => {
                const roleClass =
                    node.id !== selectedNodeId
                        ? 'citerNode'
                        : graphMode === 'oracle'
                          ? 'oracleNode'
                          : 'citedNode'
                return `graphOverlay isVisible selectedNodeOverlay ${roleClass}`
            })

        joinNodes(
            layers.hoveredNode,
            hovered.targetNode ? [hovered.targetNode] : [],
            'hoveredNodeHalo',
            graph,
            HOVERED_NODE_RADIUS_OFFSET,
        )

        updateGraphOverlayPositions(layers, graph.sizeScale)
    }, [data, graphColors, graphMode, graphModelRef, graphSceneRef, hoveredNodeId, selectedArticle])
}
