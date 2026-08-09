import * as d3 from 'd3'

const NODE_BUFFER_SIZE = 10
const SMALLEST_NODE = 10
const LARGEST_NODE = 100

function calculatePackedLayout(nodes, sizeScale) {
    const sortedNodes = [...nodes].sort((a, b) => b.centrality_score - a.centrality_score)
    const radiusById = {}
    const centralNode = sortedNodes[0]
    const centralRadius = sizeScale(centralNode.centrality_score + 1)
    radiusById[centralNode.id] = 0

    let currentRadius = centralRadius + NODE_BUFFER_SIZE
    let currentRing = []
    let firstOnRing
    let previousCircle
    let angleSum = 0

    function angleBetween(circleA, circleB, layerRadius) {
        const numerator =
            (circleA + layerRadius) ** 2 +
            (circleB + layerRadius) ** 2 -
            (circleA + circleB) ** 2
        const denominator = 2 * (layerRadius + circleA) * (layerRadius + circleB)
        return Math.acos(numerator / denominator)
    }

    function commitRing() {
        if (currentRing.length === 0) return
        const startingPosition = currentRing[0].startingPosition
        currentRing.forEach(circle => {
            radiusById[circle.id] = startingPosition
        })
    }

    for (let index = 1; index < sortedNodes.length; index += 1) {
        const node = sortedNodes[index]
        const circle = {
            id: node.id,
            radius: sizeScale(node.centrality_score + 1),
        }

        if (currentRing.length === 0) {
            circle.startingPosition = currentRadius + NODE_BUFFER_SIZE + circle.radius
            firstOnRing = circle
            previousCircle = circle
            currentRing.push(circle)
            continue
        }

        const increment = angleBetween(circle.radius, previousCircle.radius, currentRadius)
        const closure = angleBetween(circle.radius, firstOnRing.radius, currentRadius)

        if (angleSum + increment + closure <= 2 * Math.PI) {
            angleSum += increment
            previousCircle = circle
            currentRing.push(circle)
            continue
        }

        angleSum = 0
        commitRing()
        currentRadius += 2 * currentRing[0].radius + NODE_BUFFER_SIZE
        currentRing = []
        circle.startingPosition = currentRadius + NODE_BUFFER_SIZE + circle.radius
        firstOnRing = circle
        previousCircle = circle
        currentRing.push(circle)
    }

    commitRing()

    return {
        radiusById,
        layoutCenter: currentRadius,
        layoutDiameter: currentRadius * 2,
    }
}

function appendToIndex(index, id, link) {
    const entries = index.get(id)
    if (entries) {
        entries.push(link)
    } else {
        index.set(id, [link])
    }
}

export function prepareNetworkGraphData(data, graphColors) {
    const nodes = data.sorted_citation_conversation
    const nodeById = new Map(nodes.map(node => [node.id, node]))
    const correctedDomain = d3.extent(nodes, node => node.centrality_score + 1)
    const sizeScale = d3.scaleLog().domain(correctedDomain).range([SMALLEST_NODE, LARGEST_NODE])
    const nodeInterpolator = d3.piecewise(d3.interpolateRgb, graphColors.nodePalette)
    const colorScale = d3.scaleSequentialLog(nodeInterpolator).domain(correctedDomain)
    const layout = calculatePackedLayout(nodes, sizeScale)
    const centralNodeId = nodes[0].id

    nodes.forEach(node => {
        if (node.id === centralNodeId) {
            node.fx = layout.layoutCenter
            node.fy = layout.layoutCenter
        }
    })

    const incomingLinksById = new Map()
    const outgoingLinksById = new Map()
    const links = []

    nodes.forEach(source => {
        Object.keys(source.outgoing_cites_internal).forEach(targetId => {
            const target = nodeById.get(targetId)
            if (!target) return

            const link = {source, target, key: `${source.id}->${target.id}`}
            links.push(link)
            appendToIndex(outgoingLinksById, source.id, link)
            appendToIndex(incomingLinksById, target.id, link)
        })
    })

    const graphBoundsPadding = LARGEST_NODE + NODE_BUFFER_SIZE

    return {
        nodes,
        links,
        nodeById,
        incomingLinksById,
        outgoingLinksById,
        sizeScale,
        colorScale,
        nodeBufferSize: NODE_BUFFER_SIZE,
        radiusById: layout.radiusById,
        layoutCenter: layout.layoutCenter,
        layoutDiameter: layout.layoutDiameter,
        bounds: {
            width: layout.layoutDiameter + graphBoundsPadding * 2,
            height: layout.layoutDiameter + graphBoundsPadding * 2,
            centerX: layout.layoutCenter,
            centerY: layout.layoutCenter,
        },
    }
}

export function getNetworkRelationships(graph, targetId, graphMode) {
    const targetNode = targetId == null ? null : graph.nodeById.get(targetId) ?? null
    if (!targetNode) return {targetNode: null, neighborNodes: [], nodes: [], links: []}

    const links =
        graphMode === 'oracle'
            ? graph.outgoingLinksById.get(targetId) ?? []
            : graph.incomingLinksById.get(targetId) ?? []
    const neighborNodes = links.map(link => (graphMode === 'oracle' ? link.target : link.source))

    return {
        targetNode,
        neighborNodes,
        nodes: [targetNode, ...neighborNodes],
        links,
    }
}
