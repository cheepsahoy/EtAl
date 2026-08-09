import * as d3 from 'd3'
import {useCallback, useEffect, useMemo, useRef} from 'react'

export default function useNetworkGraphViewport({
    svgRef,
    cameraLayerRef,
    zoomBehaviorRef,
    graphBoundsRef,
    data,
    sceneKey,
    isCitationMenuOpen,
    citationMenuWidth,
    hideNodePreview,
    registerGraphViewport,
}) {
    const drawerStateRef = useRef({isOpen: isCitationMenuOpen, width: citationMenuWidth})
    drawerStateRef.current = {isOpen: isCitationMenuOpen, width: citationMenuWidth}

    const fitGraph = useCallback(
        (animate = true) => {
            if (!svgRef.current || !zoomBehaviorRef.current || !graphBoundsRef.current) return

            const svgElement = svgRef.current
            const svg = d3.select(svgElement)
            const viewport = svgElement.getBoundingClientRect()
            const viewportWidth = Math.max(viewport.width, 1)
            const viewportHeight = Math.max(viewport.height, 1)
            const navBottom = document.querySelector('.navBar')?.getBoundingClientRect().bottom ?? 0
            const actionBarRight = document.querySelector('.actionBar')?.getBoundingClientRect().right ?? 0
            const drawer = drawerStateRef.current
            const drawerWidth = drawer.isOpen ? drawer.width : 0
            const margin = 24
            const controlsClearance = 64
            const leftClearance = Math.max(actionBarRight + margin, margin)
            const availableWidth = Math.max(viewportWidth - drawerWidth - leftClearance - margin, 1)
            const availableHeight = Math.max(viewportHeight - navBottom - margin - controlsClearance, 1)
            const bounds = graphBoundsRef.current
            const scale = Math.min(
                8,
                Math.max(0.1, Math.min(availableWidth / bounds.width, availableHeight / bounds.height)),
            )
            const visibleCenterX = leftClearance + availableWidth / 2
            const visibleCenterY = navBottom + availableHeight / 2
            const cameraOffsetX = -drawerWidth / 2
            const translateX = visibleCenterX - bounds.centerX * scale - cameraOffsetX
            const translateY = visibleCenterY - bounds.centerY * scale
            const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)

            svg.attr('viewBox', `0 0 ${viewportWidth} ${viewportHeight}`)
            const target = animate ? svg.transition().duration(220) : svg
            target.call(zoomBehaviorRef.current.transform, transform)
        },
        [graphBoundsRef, svgRef, zoomBehaviorRef],
    )

    const zoomIn = useCallback(() => {
        if (!svgRef.current || !zoomBehaviorRef.current) return
        d3.select(svgRef.current).transition().duration(180).call(zoomBehaviorRef.current.scaleBy, 1.25)
    }, [svgRef, zoomBehaviorRef])

    const zoomOut = useCallback(() => {
        if (!svgRef.current || !zoomBehaviorRef.current) return
        d3.select(svgRef.current).transition().duration(180).call(zoomBehaviorRef.current.scaleBy, 0.75)
    }, [svgRef, zoomBehaviorRef])

    const resetView = useCallback(() => fitGraph(), [fitGraph])
    const controller = useMemo(() => ({zoomIn, zoomOut, resetView}), [resetView, zoomIn, zoomOut])

    useEffect(() => {
        if (!data || !zoomBehaviorRef.current) return undefined
        return registerGraphViewport(controller)
    }, [controller, data, registerGraphViewport, sceneKey, zoomBehaviorRef])

    useEffect(() => {
        hideNodePreview()
        if (!cameraLayerRef.current) return
        const drawerWidth = isCitationMenuOpen ? citationMenuWidth : 0
        cameraLayerRef.current.attr('transform', `translate(${-drawerWidth / 2} 0)`)
    }, [cameraLayerRef, citationMenuWidth, hideNodePreview, isCitationMenuOpen, sceneKey])

    useEffect(() => {
        const svgElement = svgRef.current
        const navElement = document.querySelector('.navBar')
        const actionBarElement = document.querySelector('.actionBar')
        if (!data || !svgElement || !zoomBehaviorRef.current) return undefined

        fitGraph(false)
        const observer = new ResizeObserver(() => fitGraph(false))
        observer.observe(svgElement)
        if (navElement) observer.observe(navElement)
        if (actionBarElement) observer.observe(actionBarElement)

        return () => observer.disconnect()
    }, [data, fitGraph, sceneKey, svgRef, zoomBehaviorRef])
}
