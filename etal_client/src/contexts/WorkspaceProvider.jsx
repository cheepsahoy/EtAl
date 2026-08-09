import {useCallback, useEffect, useMemo, useReducer} from 'react'
import useNetworkGraphContext from '../hooks/useNetworkGraphContext'
import {WorkspaceContext} from '../hooks/useWorkspaceContext'

const initialState = {
    activeAction: null,
    citationMenuWidth: 0,
    pinnedActions: {
        selected: false,
        explore: false,
    },
}

//-------------Workspace State Transitions-----------------
function workspaceReducer(state, action) {
    if (action.type === 'select-action') {
        const isPinnable = action.action === 'selected' || action.action === 'explore'
        const isOpen = state.activeAction === action.action || state.pinnedActions[action.action]

        if (isPinnable && isOpen) {
            return {
                ...state,
                activeAction: state.activeAction === action.action ? null : state.activeAction,
                pinnedActions: {...state.pinnedActions, [action.action]: false},
            }
        }

        return {
            ...state,
            activeAction: action.action,
        }
    }

    if (action.type === 'close-action') {
        return {
            ...state,
            activeAction: state.activeAction === action.action ? null : state.activeAction,
            pinnedActions: {...state.pinnedActions, [action.action]: false},
        }
    }

    if (action.type === 'toggle-action-pin') {
        return {
            ...state,
            pinnedActions: {
                ...state.pinnedActions,
                [action.action]: !state.pinnedActions[action.action],
            },
        }
    }

    if (action.type === 'set-citation-menu-width') {
        return {...state, citationMenuWidth: action.width}
    }

    if (action.type === 'reset') {
        return {...initialState}
    }

    return state
}

function WorkspaceProvider({children}) {
    const [state, dispatch] = useReducer(workspaceReducer, initialState)
    const {loading} = useNetworkGraphContext()

    //-------------Workspace Actions-----------------
    const selectAction = useCallback(action => {
        dispatch({type: 'select-action', action})
    }, [])

    const closeAction = useCallback(action => {
        dispatch({type: 'close-action', action})
    }, [])

    const toggleActionPin = useCallback(action => {
        dispatch({type: 'toggle-action-pin', action})
    }, [])

    const setCitationMenuWidth = useCallback(width => {
        dispatch({type: 'set-citation-menu-width', width})
    }, [])

    const resetWorkspace = useCallback(() => {
        dispatch({type: 'reset'})
    }, [])

    useEffect(() => {
        if (loading) {
            resetWorkspace()
        }
    }, [loading, resetWorkspace])

    //-------------Context Interface-----------------
    const isSelectedArticleOpen = state.activeAction === 'selected' || state.pinnedActions.selected
    const isCitationMenuOpen = state.activeAction === 'explore' || state.pinnedActions.explore
    const value = useMemo(
        () => ({
            ...state,
            isSelectedArticleOpen,
            isCitationMenuOpen,
            selectAction,
            closeAction,
            toggleActionPin,
            setCitationMenuWidth,
            resetWorkspace,
        }),
        [
            closeAction,
            isCitationMenuOpen,
            isSelectedArticleOpen,
            resetWorkspace,
            selectAction,
            setCitationMenuWidth,
            state,
            toggleActionPin,
        ],
    )

    return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export default WorkspaceProvider
