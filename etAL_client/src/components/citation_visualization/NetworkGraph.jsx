import * as d3 from 'd3'
import {useCallback, useMemo, useRef, useEffect, useState} from 'react'
import useNetworkGraphContext from '../../hooks/useNetworkGraphContext'
import useWorkspaceContext from '../../hooks/useWorkspaceContext'
import {ActionIcon, Group, SegmentedControl, Tooltip, useMantineTheme} from '@mantine/core'
import {Maximize2, Minus, Plus} from 'lucide-react'
import {getEtalSemanticColors} from '../../theme'
import NodeHoverCard from './NodeHoverCard'

const HOVER_DELAY_MS = 150
const HOVER_CARD_WIDTH = 280
const HOVER_CARD_HEIGHT_ESTIMATE = 112
const HOVER_CARD_GAP = 12

//
function nodeAndLinkMaker(data) {
    const uniqueIDs = data.sorted_citation_conversation
    const nodes = []
    const links = []
    for (const id of uniqueIDs) {
        nodes.push(id)

        const outgoingIDs = Object.keys(id.outgoing_cites_internal)
        for (const outgoingCite of outgoingIDs) {
            const template = {
                source: id.id,
                target: outgoingCite,
            }
            links.push(template)
        }
    }

    return [nodes, links]
}

//calculate optimal size. premise is to use a 'rollingCircle' approach to imagine average size (this is a 'worst case scenario') thinking about the biggest canvas needed. most likely most circles will be size 10, not between 10 and 100. The function is composed of many helper functions to calculate angles and such but the final output is simply useable data for d3's radial force
function optimalSizeCalculator(nodes, buffer) {
    const sortedNodes = [...nodes].sort((a, b) => b.centrality_score - a.centrality_score)
    const centralityScores = nodes.map(node => node.centrality_score + 1)
    const centralityDomain = d3.extent(centralityScores)
    const sizeScale = d3.scaleLog().domain(centralityDomain).range([10, 100]) //this is a "magic number" bc I decided that this range from 10 and 100 looks nice

    function angleOutput(radiA, radiB, layerRadi) {
        const numerator = (radiA + layerRadi) ** 2 + (radiB + layerRadi) ** 2 - (radiA + radiB) ** 2

        const denominator = 2 * (layerRadi + radiA) * (layerRadi + radiB)

        const output = Math.acos(numerator / denominator)

        return output
    }

    function dictionaryUpdater(dictionary, currentRing) {
        const startingPosition = currentRing[0].startingPosition
        for (const circle of currentRing) {
            dictionary[circle.id] = startingPosition
        }
    }

    function circlePacker(sortedCircles, ringBuffer) {
        const radiusDictionary = {}
        //establish central node, it will be skipped in future calculations
        const centralNode = sortedCircles[0]
        const centralRadius = sizeScale(centralNode.centrality_score + 1)
        radiusDictionary[centralNode.id] = 0

        let currentRadius = centralRadius + ringBuffer
        let currentRing = []
        let firstOnRing
        let previousCircle
        let angleSum = 0

        if (sortedCircles.length === 1) {
            return [radiusDictionary, currentRadius]
        }

        for (let i = 1; i < sortedCircles.length; i++) {
            const id = sortedCircles[i].id
            const centrality_score = sortedCircles[i].centrality_score
            const circleRadius = sizeScale(centrality_score + 1)
            const circleObj = {
                id: id,
                circleRadius: circleRadius,
            }

            if (currentRing.length === 0) {
                circleObj.startingPosition = currentRadius + ringBuffer + circleRadius
                firstOnRing = circleObj
                previousCircle = circleObj
                currentRing.push(circleObj)
            } else {
                const incrementValue = angleOutput(circleObj.circleRadius, previousCircle.circleRadius, currentRadius)
                const closureValue = angleOutput(circleObj.circleRadius, firstOnRing.circleRadius, currentRadius)

                if (angleSum + incrementValue + closureValue <= 2 * Math.PI) {
                    angleSum += incrementValue
                    previousCircle = circleObj
                    currentRing.push(circleObj)
                } else {
                    angleSum = 0
                    dictionaryUpdater(radiusDictionary, currentRing)
                    const ringExtender = currentRing[0].circleRadius
                    currentRadius += 2 * ringExtender + ringBuffer
                    currentRing = []
                    circleObj.startingPosition = currentRadius + ringBuffer + circleRadius
                    firstOnRing = circleObj
                    previousCircle = circleObj
                    currentRing.push(circleObj)
                }
            }
        }
        if (currentRing.length !== 0) {
            dictionaryUpdater(radiusDictionary, currentRing)
        }
        return [radiusDictionary, currentRadius]
    }

    const [radiusDictionary, finalRadius] = circlePacker(sortedNodes, buffer)
    const dimensions = 2 * finalRadius
    return {
        radiusDictionary: radiusDictionary,
        maxRadius: finalRadius,
        width: dimensions,
        height: dimensions,
    }
}

function NetworkGraph() {
    const {isCitationMenuOpen, citationMenuWidth} = useWorkspaceContext()
    const {data, selectedArticle, setArticle, graphMode, setGraphMode} = useNetworkGraphContext()
    const svgRef = useRef()
    const zoomBehaviorRef = useRef()
    const cameraLayerRef = useRef()
    const graphBoundsRef = useRef()
    const hoverTimerRef = useRef()
    const drawerStateRef = useRef({isOpen: isCitationMenuOpen, width: citationMenuWidth})
    const [hoverPreview, setHoverPreview] = useState(null)
    const theme = useMantineTheme()
    const graphColors = useMemo(() => getEtalSemanticColors(theme).graph, [theme])

    drawerStateRef.current = {isOpen: isCitationMenuOpen, width: citationMenuWidth}

    console.log('before render', selectedArticle)

    const hideNodePreview = useCallback(() => {
        window.clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = undefined
        setHoverPreview(null)
    }, [])

    const showNodePreview = useCallback((event, article) => {
        window.clearTimeout(hoverTimerRef.current)

        const container = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
        const nodeBounds = event.currentTarget.getBoundingClientRect()
        if (!container) return

        const cardWidth = Math.min(HOVER_CARD_WIDTH, Math.max(container.width - HOVER_CARD_GAP * 2, 1))
        const nodeCenterX = nodeBounds.left - container.left + nodeBounds.width / 2
        const nodeCenterY = nodeBounds.top - container.top + nodeBounds.height / 2
        const rightPosition = nodeBounds.right - container.left + HOVER_CARD_GAP
        const leftPosition = nodeBounds.left - container.left - cardWidth - HOVER_CARD_GAP
        const placeOutwardRight = nodeCenterX >= container.width / 2
        const outwardPosition = placeOutwardRight ? rightPosition : leftPosition
        const alternatePosition = placeOutwardRight ? leftPosition : rightPosition
        const positionFits = position => position >= HOVER_CARD_GAP && position + cardWidth <= container.width - HOVER_CARD_GAP
        const desiredLeft = positionFits(outwardPosition) ? outwardPosition : alternatePosition
        const left = Math.min(
            Math.max(desiredLeft, HOVER_CARD_GAP),
            Math.max(container.width - cardWidth - HOVER_CARD_GAP, HOVER_CARD_GAP),
        )
        const top = Math.min(
            Math.max(nodeCenterY - HOVER_CARD_HEIGHT_ESTIMATE / 2, HOVER_CARD_GAP),
            Math.max(container.height - HOVER_CARD_HEIGHT_ESTIMATE - HOVER_CARD_GAP, HOVER_CARD_GAP),
        )

        hoverTimerRef.current = window.setTimeout(() => {
            setHoverPreview({article, position: {left, top}})
            hoverTimerRef.current = undefined
        }, HOVER_DELAY_MS)
    }, [])

    useEffect(() => () => window.clearTimeout(hoverTimerRef.current), [])

    const fitGraph = useCallback((animate = true) => {
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
    }, [])

    //useEffect for initial rendering
    useEffect(() => {
        console.log('we are drawing', data)

        //Early escape for empty props
        if (data === null) {
            console.log('we nulled')
            return
        }

        const centralArticleID = data.sorted_citation_conversation[0].id
        const [nodes, links] = nodeAndLinkMaker(data)

        const nodeBufferSize = 10
        const smallestNode = 10
        const largestNode = 100

        const sizes = optimalSizeCalculator(nodes, nodeBufferSize)
        const width = sizes.width
        const height = sizes.height
        const viewBoxPadding = largestNode + nodeBufferSize

        graphBoundsRef.current = {
            width: width + viewBoxPadding * 2,
            height: height + viewBoxPadding * 2,
            centerX: width / 2,
            centerY: height / 2,
        }

        console.log('caluclating width and height:', width, height)

        nodes.forEach(d => {
            if (d.id === centralArticleID) {
                d.fx = width / 2
                d.fy = height / 2
            }
        })

        const svg = d3
            .select(svgRef.current)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('preserveAspectRatio', 'none')

        //clear previous content on new render
        svg.selectAll('*').remove()

        const cameraLayer = svg.append('g').attr('class', 'cameraLayer')
        const zoomLayer = cameraLayer.append('g').attr('class', 'zoomLayer')
        cameraLayerRef.current = cameraLayer
        const zoomBehavior = d3
            .zoom()
            .scaleExtent([0.25, 8])
            .on('start.hoverPreview', hideNodePreview)
            .on('zoom', event => zoomLayer.attr('transform', event.transform))

        zoomBehaviorRef.current = zoomBehavior
        svg.call(zoomBehavior).on('dblclick.zoom', null)
        fitGraph(false)

        //the + 1 transformation is necessary bc centrality score very likely includes 0s. Whenever the scales are called add + 1 to their check
        const correctedDomainValue = d3.extent(nodes, d => d.centrality_score + 1)

        const nodeInterpolator = d3.piecewise(d3.interpolateRgb, graphColors.nodePalette)
        const colorScale = d3.scaleSequentialLog(nodeInterpolator).domain(correctedDomainValue)

        const sizeScale = d3.scaleLog().domain(correctedDomainValue).range([smallestNode, largestNode]) //this is a "magic number" bc I decided that this range from 10 and 100 looks nice

        const idToNode = {}
        nodes.forEach(node => {
            idToNode[node.id] = node
        })
        const resolvedLinks = links.map(link => {
            const fixedEntry = {
                source: idToNode[link.source],
                target: idToNode[link.target],
            }
            return fixedEntry
        })

        const link = zoomLayer
            .append('g')
            .attr('stroke-width', 1.5)
            .selectAll('.link')
            .data(resolvedLinks)
            .join('line')
            .attr('class', d => `link source-${d.source} target-${d.target}`)
            .attr('pointer-events', 'none')

        const node = zoomLayer
            .append('g')
            .selectAll('.node')
            .data(nodes)
            .join('circle')
            .attr('r', d => sizeScale(d.centrality_score + 1))
            .style('fill', d => colorScale(d.centrality_score + 1))
            .attr('class', d => `node node-${d.id}`)
            .on('pointerenter.hoverPreview', showNodePreview)
            .on('pointerleave.hoverPreview', hideNodePreview)

        const centerStrength = nodes.length > 2 ? 1 : 0 //with less than 2 the radial force is overwhelmed by the center force
        const simulation = d3
            .forceSimulation(nodes)
            .force(
                'collide',
                d3.forceCollide().radius(d => nodeBufferSize + sizeScale(d.centrality_score + 1)), //radius is hard coded based on range above, could be rendered more dynamically?
            )
            .force('center', d3.forceCenter(width / 2, height / 2).strength(centerStrength))
            .force(
                'radial',
                d3
                    .forceRadial(d => sizes.radiusDictionary[d.id], width / 2, height / 2)
                    .strength(() => {
                        return 0.9 //could be rendered more dynamically?
                    }),
            )

        // svg.on("click", (event) => {
        //   const clickTarget = event.target;
        //   if (clickTarget.matches(".node")) {
        //     const datum = d3.select(clickTarget).datum();
        //     const targetID = datum.id;
        //     setArticle(targetID);
        //   }
        // });

        simulation.on('tick', () => {
            node.attr('cx', d => d.x).attr('cy', d => d.y)

            link.attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
        })

        return () => {
            simulation.stop()
            svg.on('.zoom', null)
        }
    }, [data, fitGraph, graphColors, hideNodePreview, showNodePreview])

    useEffect(() => {
        hideNodePreview()
        if (!cameraLayerRef.current) return
        const drawerWidth = isCitationMenuOpen ? citationMenuWidth : 0
        cameraLayerRef.current.attr('transform', `translate(${-drawerWidth / 2} 0)`)
    }, [citationMenuWidth, hideNodePreview, isCitationMenuOpen])

    useEffect(() => {
        const svgElement = svgRef.current
        const navElement = document.querySelector('.navBar')
        const actionBarElement = document.querySelector('.actionBar')
        if (!svgElement) return undefined

        const observer = new ResizeObserver(() => fitGraph(false))
        observer.observe(svgElement)
        if (navElement) observer.observe(navElement)
        if (actionBarElement) observer.observe(actionBarElement)

        return () => observer.disconnect()
    }, [data, fitGraph])

    // Keep graph interaction independent from whether an article is selected.
    useEffect(() => {
        if (!data) {
            return
        }

        const graph = d3.select(svgRef.current)

        graph.on('click', event => {
            const clickTarget = event.target
            if (clickTarget.matches('.node')) {
                const datum = d3.select(clickTarget).datum()
                setArticle(datum.id)
            }
        })

        return () => graph.on('click', null)
    }, [data, setArticle])

    //useEffect for rehilghting on clicks
    useEffect(() => {
        if (!selectedArticle) {
            return
        }
        const targetID = selectedArticle.id
        if (targetID === null) {
            return
        }
        const graph = d3.select(svgRef.current)

        const citingObj = {}

        if (graphMode === 'oracle') {
            graph.selectAll('.link').classed('selectedLink', d => {
                if (d.source.id === targetID) {
                    citingObj[d.target.id] = true
                    return true
                } else {
                    return false
                }
            })

            graph
                .selectAll('.node')
                .classed('oracleNode', d => {
                    if (d.id === targetID) {
                        return true
                    } else {
                        return false
                    }
                })
                .classed('citedNode', false)
                .classed('citerNode', d => {
                    if (citingObj[d.id]) {
                        return true
                    } else {
                        return false
                    }
                })
        } else {
            graph.selectAll('.link').classed('selectedLink', d => {
                if (d.target.id === targetID) {
                    citingObj[d.source.id] = true
                    return true
                } else {
                    return false
                }
            })

            graph
                .selectAll('.node')
                .classed('oracleNode', false)
                .classed('citedNode', d => {
                    if (d.id === targetID) {
                        return true
                    } else {
                        return false
                    }
                })
                .classed('citerNode', d => {
                    if (citingObj[d.id]) {
                        return true
                    } else {
                        return false
                    }
                })
        }
    }, [graphMode, selectedArticle])

    function changeZoom(scaleFactor) {
        if (!zoomBehaviorRef.current) return
        d3.select(svgRef.current).transition().duration(180).call(zoomBehaviorRef.current.scaleBy, scaleFactor)
    }

    function resetZoom() {
        fitGraph()
    }

    return (
        <div className="visualization">
            <svg
                ref={svgRef}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
            {hoverPreview && (
                <NodeHoverCard
                    article={hoverPreview.article}
                    graphMode={graphMode}
                    position={hoverPreview.position}
                />
            )}
            {data && (
                <Group className="graphZoomControls" gap="xs" wrap="nowrap">
                    <SegmentedControl
                        size="xs"
                        value={graphMode}
                        onChange={setGraphMode}
                        aria-label="Graph relationship mode"
                        data={[
                            {label: 'Citations', value: 'citations'},
                            {label: 'Oracles', value: 'oracle'},
                        ]}
                    />
                    <Group gap={4} wrap="nowrap">
                        <Tooltip label="Zoom out">
                            <ActionIcon variant="default" aria-label="Zoom out" onClick={() => changeZoom(0.75)}>
                                <Minus size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reset view">
                            <ActionIcon variant="default" aria-label="Reset graph view" onClick={resetZoom}>
                                <Maximize2 size={15} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Zoom in">
                            <ActionIcon variant="default" aria-label="Zoom in" onClick={() => changeZoom(1.25)}>
                                <Plus size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            )}
        </div>
    )
}

export default NetworkGraph
