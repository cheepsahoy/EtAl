import etalCitationMapper from '../../../oa_middleware/etal/citationMapper'

/**
 * @param {OA_WorkObject} citationObj
 * @returns {Promise<etAL_frontEndPayload>}
 */
export async function fetchNetworkGraphData(citationObj) {
    const citationConversation = new etalCitationMapper()
    citationConversation.initialize(citationObj)
    console.log('Handling click in citation card, setting searchResult id to', citationObj.title)

    const start = performance.now()
    console.log(
        `beginning populate conversation call for ${
            citationConversation.citation_conversation[citationConversation.centralCitationID].title
        }`,
    )
    await citationConversation.populateConversation()
    const duration = performance.now() - start
    console.log(`finished populating conversation, performance time was ${duration} ms`)

    return {
        centralCitationID: citationConversation.centralCitationID,
        citation_conversation: citationConversation.citation_conversation,
        citations_outgoing: citationConversation.citations_outgoing,
        sorted_citation_conversation: citationConversation.sorted_citation_conversation,
        sorted_citations_outgoing: citationConversation.sorted_citations_outgoing,
    }
}
