import {createContext, useContext} from 'react'

export const WorkspaceContext = createContext(null)

function useWorkspaceContext() {
    const context = useContext(WorkspaceContext)

    if (context === null) {
        throw new Error('useWorkspaceContext must be used within WorkspaceProvider')
    }

    return context
}

export default useWorkspaceContext
