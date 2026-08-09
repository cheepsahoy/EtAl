import {createTheme} from '@mantine/core'
import * as d3 from 'd3'

const milkyPurple = [
    '#f7ecff',
    '#e7d6fc',
    '#caabf1',
    '#ad7de7',
    '#9356de',
    '#8946db',
    '#7c31d8',
    '#6a24c0',
    '#5e1eac',
    '#511798',
]

const petrolSpace = [
    '#e5f6f7',
    '#c5e2e4',
    '#97c1c5',
    '#6c9da3',
    '#477b83',
    '#2e6069',
    '#1c4650',
    '#102f38',
    '#081d24',
    '#030e13',
]
const redNebula = [
    '#ffedf4',
    '#f6dbe4',
    '#e6b6c6',
    '#d68ea6',
    '#c86c8b',
    '#c0577a',
    '#bd4b71',
    '#a73c60',
    '#963355',
    '#852849',
]
const amberPulse = [
    '#fff7e6',
    '#ffe6bf',
    '#ffd699',
    '#ffc266',
    '#ffad33',
    '#ff9900',
    '#cc7a00',
    '#995c00',
    '#663d00',
    '#331f00',
]

const plasmaCore = Array.from({length: 10}, (_, index) => d3.interpolatePlasma(index / 9))

const oracleGreen = [
    '#0a0f0d',
    '#0d2f24',
    '#155d47',
    '#1f7d60',
    '#26a37c',
    '#30c999',
    '#66e4b5',
    '#99f2d1',
    '#c0fbe7',
    '#e3fff8',
]

export const etalTheme = createTheme({
    colors: {
        milkyPurple,
        amberPulse,
        plasmaCore,
        oracleGreen,
        redNebula,
        petrolSpace,
    },
    primaryColor: 'milkyPurple',
    fontFamily: 'Inter, sans-serif',
    fontSizes: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    lineHeights: {
        xs: '1',
        sm: '1.2',
        md: '1.4',
        lg: '1.6',
        xl: '1.8',
    },
    defaultRadius: 'md',
    radius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '20px',
    },
    shadows: {
        xs: '0 1px 2px rgba(0,0,0,0.1)',
        sm: '0 2px 4px rgba(0,0,0,0.1)',
        md: '0 4px 8px rgba(0,0,0,0.12)',
        lg: '0 8px 16px rgba(0,0,0,0.14)',
        xl: '0 12px 24px rgba(0,0,0,0.16)',
    },
})

export function getEtalSemanticColors(theme) {
    return {
        canvas: theme.colors.petrolSpace[8],
        surface: theme.colors.petrolSpace[7],
        surfaceStrong: theme.colors.petrolSpace[6],
        border: theme.colors.petrolSpace[5],
        text: theme.colors.petrolSpace[0],
        textMuted: theme.colors.petrolSpace[2],
        graph: {
            nodePalette: theme.colors.plasmaCore.slice(2),
            nodeOutline: theme.colors.petrolSpace[4],
            link: theme.colors.petrolSpace[6],
            selectedLink: theme.colors.redNebula[8],
            citedNode: theme.colors.milkyPurple[3],
            citerNode: theme.colors.milkyPurple[6],
            oracleFill: theme.colors.oracleGreen[5],
            oracleStroke: theme.colors.oracleGreen[8],
            hoverPreview: theme.colors.amberPulse[4],
        },
    }
}

export function etalCssVariablesResolver(theme) {
    const colors = getEtalSemanticColors(theme)

    return {
        variables: {},
        light: {},
        dark: {
            '--etal-color-canvas': colors.canvas,
            '--etal-color-surface': colors.surface,
            '--etal-color-surface-strong': colors.surfaceStrong,
            '--etal-color-border': colors.border,
            '--etal-color-text': colors.text,
            '--etal-color-text-muted': colors.textMuted,
            '--etal-graph-node-outline': colors.graph.nodeOutline,
            '--etal-graph-link': colors.graph.link,
            '--etal-graph-link-selected': colors.graph.selectedLink,
            '--etal-graph-node-cited': colors.graph.citedNode,
            '--etal-graph-node-citer': colors.graph.citerNode,
            '--etal-graph-node-oracle': colors.graph.oracleFill,
            '--etal-graph-node-oracle-stroke': colors.graph.oracleStroke,
            '--etal-graph-hover-preview': colors.graph.hoverPreview,
        },
    }
}
