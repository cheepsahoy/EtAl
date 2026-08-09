import {useCallback, useEffect, useRef, useState} from 'react'

const HOVER_DELAY_MS = 150
const HOVER_CARD_WIDTH = 280
const HOVER_CARD_HEIGHT_ESTIMATE = 112
const HOVER_CARD_GAP = 12

function calculateHoverCardPosition(nodeElement) {
    const container = nodeElement.ownerSVGElement?.getBoundingClientRect()
    const nodeBounds = nodeElement.getBoundingClientRect()
    if (!container) return null

    const cardWidth = Math.min(HOVER_CARD_WIDTH, Math.max(container.width - HOVER_CARD_GAP * 2, 1))
    const nodeCenterX = nodeBounds.left - container.left + nodeBounds.width / 2
    const nodeCenterY = nodeBounds.top - container.top + nodeBounds.height / 2
    const rightOfNode = nodeBounds.right - container.left + HOVER_CARD_GAP
    const leftOfNode = nodeBounds.left - container.left - cardWidth - HOVER_CARD_GAP
    const preferRight = nodeCenterX >= container.width / 2
    const preferredLeft = preferRight ? rightOfNode : leftOfNode
    const fallbackLeft = preferRight ? leftOfNode : rightOfNode
    const positionFits = position =>
        position >= HOVER_CARD_GAP && position + cardWidth <= container.width - HOVER_CARD_GAP
    const desiredLeft = positionFits(preferredLeft) ? preferredLeft : fallbackLeft
    const left = Math.min(
        Math.max(desiredLeft, HOVER_CARD_GAP),
        Math.max(container.width - cardWidth - HOVER_CARD_GAP, HOVER_CARD_GAP),
    )
    const top = Math.min(
        Math.max(nodeCenterY - HOVER_CARD_HEIGHT_ESTIMATE / 2, HOVER_CARD_GAP),
        Math.max(container.height - HOVER_CARD_HEIGHT_ESTIMATE - HOVER_CARD_GAP, HOVER_CARD_GAP),
    )

    return {left, top}
}

export default function useNetworkGraphHover(resetKey) {
    const hoverTimerRef = useRef()
    const [hoveredNodeId, setHoveredNodeId] = useState(null)
    const [hoverCard, setHoverCard] = useState(null)

    const hideNodePreview = useCallback(() => {
        window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = undefined
        setHoveredNodeId(null)
        setHoverCard(null)
    }, [])

    const showNodePreview = useCallback((event, article) => {
        window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = undefined
        setHoveredNodeId(article.id)
        setHoverCard(null)

        const position = calculateHoverCardPosition(event.currentTarget)
        if (!position) return

        hoverTimerRef.current = window.setTimeout(() => {
            setHoverCard({article, position})
            hoverTimerRef.current = undefined
        }, HOVER_DELAY_MS)
    }, [])

    useEffect(() => {
        hideNodePreview()
    }, [hideNodePreview, resetKey])

    useEffect(() => () => window.clearTimeout(hoverTimerRef.current), [])

    return {
        hoveredNodeId,
        hoverCard,
        showNodePreview,
        hideNodePreview,
    }
}
