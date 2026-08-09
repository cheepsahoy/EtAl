import {createContext, useContext} from 'react'

export const NetworkGraphContext = createContext(null)

function useNetworkGraphContext() {
  const context = useContext(NetworkGraphContext)

  if (context === null) {
    throw new Error('useNetworkGraphContext must be used within NetworkGraphProvider')
  }

  return context
}

export default useNetworkGraphContext
