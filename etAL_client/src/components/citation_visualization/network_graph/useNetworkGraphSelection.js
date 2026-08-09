import * as d3 from 'd3'
import {useEffect} from 'react'
import {getNetworkRelationships} from './networkGraphData'
import {updateGraphOverlayPositions} from './networkGraphScene'

function joinLinks(layer, links, className) {
    return layer
        .selectAll('line')
        .data(links, link => link.key)
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

        joinLinks(layers.hoverLinks, hoverOnlyLinks, 'hoverPreviewLink')
        joinLinks(layers.sharedLinks, sharedLinks, 'sharedLinkUnderlay')
        joinLinks(layers.selectedLinks, selected.links, 'selectedLink')
        joinNodes(layers.hoverNeighbors, hoverOnlyNeighbors, 'hoverPreviewNeighbor', graph, 4)
        joinNodes(layers.sharedNodes, sharedNodes, 'sharedNodeHalo', graph, 7)

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
            5,
        )

        updateGraphOverlayPositions(layers)
    }, [data, graphColors, graphMode, graphModelRef, graphSceneRef, hoveredNodeId, selectedArticle])
}
