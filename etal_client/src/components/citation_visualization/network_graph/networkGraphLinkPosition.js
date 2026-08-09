function getNodeRadius(node, sizeScale) {
    return sizeScale(node.centrality_score + 1)
}

function getVisualRadius(node, sizeScale, radiusOffset = 0) {
    return getNodeRadius(node, sizeScale) + radiusOffset
}

function getLinkEndpoints(link, sizeScale, sourceRadiusOffset, targetRadiusOffset) {
    const deltaX = link.target.x - link.source.x
    const deltaY = link.target.y - link.source.y
    const distance = Math.hypot(deltaX, deltaY)

    if (distance === 0) {
        return {
            x1: link.source.x,
            y1: link.source.y,
            x2: link.target.x,
            y2: link.target.y,
        }
    }

    const unitX = deltaX / distance
    const unitY = deltaY / distance
    const sourceRadius = getVisualRadius(link.source, sizeScale, sourceRadiusOffset)
    const targetRadius = getVisualRadius(link.target, sizeScale, targetRadiusOffset)

    return {
        x1: link.source.x + unitX * sourceRadius,
        y1: link.source.y + unitY * sourceRadius,
        x2: link.target.x - unitX * targetRadius,
        y2: link.target.y - unitY * targetRadius,
    }
}

export function positionLinksAtNodeEdges(selection, sizeScale, getRadiusOffset) {
    selection.each(function positionLink(link) {
        const sourceRadiusOffset = getRadiusOffset ? getRadiusOffset(link.source) : link.sourceRadiusOffset
        const targetRadiusOffset = getRadiusOffset ? getRadiusOffset(link.target) : link.targetRadiusOffset
        const endpoints = getLinkEndpoints(link, sizeScale, sourceRadiusOffset, targetRadiusOffset)

        this.setAttribute('x1', endpoints.x1)
        this.setAttribute('y1', endpoints.y1)
        this.setAttribute('x2', endpoints.x2)
        this.setAttribute('y2', endpoints.y2)
    })
}
