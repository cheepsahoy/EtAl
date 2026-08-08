import {useCallback, useMemo, useState} from 'react'
import {NetworkGraphContext} from '../hooks/useNetworkGraphContext'
import {
  estimateEtAlFetchTimeMS,
  GRAPH_COMPLETION_ANIMATION_MS,
  GRAPH_READY_HOLD_MS,
} from '../frontEndUtils/networkLoading'
import {fetchNetworkGraphData} from '../services/networkGraphService'

//-------------Shared Graph State-----------------
const initialState = {
  data: null,
  loading: false,
  loadingPhase: null,
  timeToLoadMS: null,
  selectedArticle: null,
  graphMode: "citations",
};

function NetworkGraphProvider({children}) {
  const [state, setStateInternal] = useState({...initialState})

  const updateState = useCallback(function updateState(newState) {
    setStateInternal((prev) => {
      return {...prev, ...newState}
    })
  }, [])

  //-------------Graph Loading Actions-----------------
  const loadData = useCallback(async function loadData(citationObj) {
    console.log('LOADING', citationObj)
    updateState({
      loading: true,
      loadingPhase: 'fetching',
      timeToLoadMS: estimateEtAlFetchTimeMS(citationObj.cited_by_count),
      selectedArticle: null,
      graphMode: 'citations',
    })

    try {
      const data = await fetchNetworkGraphData(citationObj)
      updateState({data, loadingPhase: 'completing'})

      await new Promise(resolve =>
        setTimeout(resolve, GRAPH_COMPLETION_ANIMATION_MS + GRAPH_READY_HOLD_MS),
      )

      console.log('SETTING LOADING FALSE')
      updateState({loading: false, loadingPhase: null})
    } catch (error) {
      updateState({loading: false, loadingPhase: null})
      throw error
    }
  }, [updateState])

  //-------------Graph Interaction Actions-----------------
  const setArticle = useCallback(function setArticle(articleId) {
    updateState({selectedArticle: {id: articleId}})
  }, [updateState])

  const setGraphMode = useCallback(function setGraphMode(mode) {
    if (mode === 'citations' || mode === 'oracle') {
      updateState({graphMode: mode})
    }
  }, [updateState])

  //-------------Context Interface-----------------
  const value = useMemo(
    () => ({...state, loadData, setArticle, setGraphMode}),
    [loadData, setArticle, setGraphMode, state],
  )

  return (
    <NetworkGraphContext.Provider value={value}>
      {children}
    </NetworkGraphContext.Provider>
  )
}

export default NetworkGraphProvider
