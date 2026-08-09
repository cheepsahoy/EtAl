import * as d3 from 'd3'

function positionLinks(selection) {
    selection
        .attr('x1', link => link.source.x)
        .attr('y1', link => link.source.y)
        .attr('x2', link => link.target.x)
        .attr('y2', link => link.target.y)
}

function positionNodes(selection) {
    selection.attr('cx', node => node.x).attr('cy', node => node.y)
}

function makeHighlightLayer(zoomLayer) {
    return zoomLayer.append('g').attr('class', 'graphHighlightLayer').attr('aria-hidden', 'true')
}

export function updateGraphOverlayPositions(highlightLayers) {
    positionLinks(highlightLayers.hoverLinks.selectAll('line'))
    positionLinks(highlightLayers.sharedLinks.selectAll('line'))
    positionLinks(highlightLayers.selectedLinks.selectAll('line'))
    positionNodes(highlightLayers.hoverNeighbors.selectAll('circle'))
    positionNodes(highlightLayers.sharedNodes.selectAll('circle'))
    positionNodes(highlightLayers.selectedNodes.selectAll('circle'))
    positionNodes(highlightLayers.hoveredNode.selectAll('circle'))
}

export function createNetworkGraphScene({
    svgElement,
    graph,
    onNodeEnter,
    onNodeLeave,
    onInteractionStart,
}) {
    const svg = d3
        .select(svgElement)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('preserveAspectRatio', 'none')

    svg.selectAll('*').remove()

    const cameraLayer = svg.append('g').attr('class', 'cameraLayer')
    const zoomLayer = cameraLayer.append('g').attr('class', 'zoomLayer')
    const zoomBehavior = d3
        .zoom()
        .scaleExtent([0.25, 8])
        .on('start.hoverPreview', onInteractionStart)
        .on('zoom', event => zoomLayer.attr('transform', event.transform))

    svg.call(zoomBehavior).on('dblclick.zoom', null)

    const baseLinks = zoomLayer
        .append('g')
        .attr('class', 'baseLinkLayer')
        .selectAll('.link')
        .data(graph.links, link => link.key)
        .join('line')
        .attr('class', 'link')
        .attr('pointer-events', 'none')

    const highlightLayers = {
        hoverLinks: makeHighlightLayer(zoomLayer),
        sharedLinks: makeHighlightLayer(zoomLayer),
        selectedLinks: makeHighlightLayer(zoomLayer),
    }

    const baseNodes = zoomLayer
        .append('g')
        .attr('class', 'baseNodeLayer')
        .selectAll('.node')
        .data(graph.nodes, node => node.id)
        .join('circle')
        .attr('r', node => graph.sizeScale(node.centrality_score + 1))
        .style('fill', node => graph.colorScale(node.centrality_score + 1))
        .attr('class', node => `node node-${node.id}`)
        .on('pointerenter.hoverPreview', onNodeEnter)
        .on('pointerleave.hoverPreview', onNodeLeave)

    highlightLayers.hoverNeighbors = makeHighlightLayer(zoomLayer)
    highlightLayers.sharedNodes = makeHighlightLayer(zoomLayer)
    highlightLayers.selectedNodes = makeHighlightLayer(zoomLayer)
    highlightLayers.hoveredNode = makeHighlightLayer(zoomLayer)

    const centerStrength = graph.nodes.length > 2 ? 1 : 0
    const simulation = d3
        .forceSimulation(graph.nodes)
        .force(
            'collide',
            d3.forceCollide().radius(node => graph.nodeBufferSize + graph.sizeScale(node.centrality_score + 1)),
        )
        .force('center', d3.forceCenter(graph.layoutCenter, graph.layoutCenter).strength(centerStrength))
        .force(
            'radial',
            d3
                .forceRadial(node => graph.radiusById[node.id], graph.layoutCenter, graph.layoutCenter)
                .strength(0.9),
        )
        .on('tick', () => {
            positionNodes(baseNodes)
            positionLinks(baseLinks)
            updateGraphOverlayPositions(highlightLayers)
        })

    return {
        cameraLayer,
        zoomBehavior,
        highlightLayers,
        destroy() {
            simulation.stop()
            svg.on('.zoom', null)
        },
    }
}
