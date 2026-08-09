import {Progress, Stack, Text} from '@mantine/core'
import {useEffect, useRef, useState} from 'react'
import {GRAPH_COMPLETION_ANIMATION_MS} from '../../front_end_utils/networkLoading'

const FETCH_TARGET = 90

function NetworkLoadingBar({estimatedLoadingTimeMS, loadingPhase}) {
    const [progress, setProgress] = useState(0)
    const progressRef = useRef(0)
    const animationFrameRef = useRef(null)

    function updateProgress(value) {
        progressRef.current = value
        setProgress(value)
    }

    useEffect(() => {
        if (loadingPhase !== 'fetching') {
            return undefined
        }

        const startedAt = performance.now()
        const estimate = Math.max(estimatedLoadingTimeMS || 0, 1)

        function animateFetchProgress(now) {
            const elapsed = now - startedAt
            const nextProgress = Math.min((elapsed / estimate) * FETCH_TARGET, FETCH_TARGET)
            updateProgress(nextProgress)

            if (nextProgress < FETCH_TARGET) {
                animationFrameRef.current = requestAnimationFrame(animateFetchProgress)
            }
        }

        animationFrameRef.current = requestAnimationFrame(animateFetchProgress)
        return () => cancelAnimationFrame(animationFrameRef.current)
    }, [estimatedLoadingTimeMS, loadingPhase])

    useEffect(() => {
        if (loadingPhase !== 'completing') {
            return undefined
        }

        const startedAt = performance.now()
        const startingProgress = progressRef.current

        function animateCompletion(now) {
            const elapsedRatio = Math.min((now - startedAt) / GRAPH_COMPLETION_ANIMATION_MS, 1)
            const easedRatio = 1 - (1 - elapsedRatio) ** 3
            updateProgress(startingProgress + (100 - startingProgress) * easedRatio)

            if (elapsedRatio < 1) {
                animationFrameRef.current = requestAnimationFrame(animateCompletion)
            }
        }

        animationFrameRef.current = requestAnimationFrame(animateCompletion)
        return () => cancelAnimationFrame(animationFrameRef.current)
    }, [loadingPhase])

    return (
        <Stack gap={6}>
            <Progress
                value={progress}
                animated={loadingPhase === 'fetching'}
                size="lg"
                radius="xl"
                aria-label="Graph loading progress"
                styles={{section: {transition: 'none'}}}
            />
            <Text size="xs" c="dimmed" ta="right">
                {Math.round(progress)}%
            </Text>
        </Stack>
    )
}

export default NetworkLoadingBar
