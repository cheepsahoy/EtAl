import OA_API from '../open_alex_api/openAlexApi.js'

const OpenAlexAPI = new OA_API('')

class etalCitationMapper {
    constructor() {}

    /**
     * @param {OA_WorkObject} initialGetCite
     */
    initialize(initialGetCite) {
        this.centralCitationID = OpenAlexAPI._extractOpenAlexID(initialGetCite.id)
        this.citation_conversation = {}
        ;(this.citation_conversation[this.centralCitationID] = {
            doi: initialGetCite.doi ?? 'No DOI on record',
            id: this.centralCitationID,
            source: initialGetCite.primary_location?.source?.display_name ?? 'No primary source on record',
            publication_location:
                initialGetCite.primary_location?.landing_page_url ?? 'No publication location on record',
            title: initialGetCite.title ?? 'No primary title on record',
            pub_date: initialGetCite.publication_date ?? 'No publication date on record',
            citation: null,
            authors: {},
            outgoing_cites: {},
            outgoing_cites_internal: {},
            incoming_cites: {},
            abstract: null,
            centrality_score: 0,
            oracle_score: 0,
        }),
            this._extractAuthorDetails(initialGetCite.authorships, this.centralCitationID, this.citation_conversation)

        //need to go through outgoing cites, ammend citations_outgoing and citation_conversation
        this.citations_outgoing = {}
        for (const citationURL of initialGetCite.referenced_works) {
            const alexID = OpenAlexAPI._extractOpenAlexID(citationURL)
            //we have found some referenced_works are recursive
            if (alexID === this.centralCitationID) {
                continue
            }
            this.citations_outgoing[alexID] = {
                doi: null,
                id: alexID,
                title: null,
                pub_date: null,
                citation: null,
                authors: {},
                outgoing_cites: {},
                outgoing_cites_internal: {},
                incoming_cites: {},
                abstract: null,
                gravity_score: 1,
            }
            this.citations_outgoing[alexID].incoming_cites[this.centralCitationID] = 1
            this.citation_conversation[this.centralCitationID].outgoing_cites[alexID] = 1
        }
    }

    /**
     * @param {string} centralConversation OpenAlexID
     * @returns {Promise}
     */
    async populateConversation(centralConversation = this.centralCitationID) {
        const conversationalists = await OpenAlexAPI.getCites(centralConversation)

        //We populate citation_conversation w/ key-values and identites
        for (const artifact of conversationalists) {
            const artifactID = OpenAlexAPI._extractOpenAlexID(artifact.id)
            this.citation_conversation[artifactID] = {
                doi: artifact.doi ?? 'No DOI on record',
                id: artifactID,
                title: artifact.title ?? 'No primary title on record',
                pub_date: artifact.publication_date ?? 'No publication date on record',
                source: artifact.primary_location?.source?.display_name ?? 'No primary source on record',
                publication_location:
                    artifact.primary_location?.landing_page_url ?? 'No publication location on record',
                citation: null,
                authors: {},
                outgoing_cites: {},
                outgoing_cites_internal: {},
                incoming_cites: {},
                abstract: null,
                centrality_score: 0,
                oracle_score: 1,
            }
            this._extractAuthorDetails(artifact.authorships, artifactID, this.citation_conversation)
        }
        //After this initial pass, we need to go over the list again and, using their outgoing citations, establish webs of connections [who cites who?]
        for (const artifact of conversationalists) {
            const artifactID = OpenAlexAPI._extractOpenAlexID(artifact.id)
            for (const workURL of artifact.referenced_works) {
                const outgoingAlexID = OpenAlexAPI._extractOpenAlexID(workURL)

                //check for redundancy
                if (outgoingAlexID === artifactID) {
                    continue
                }

                //first: identify this as 'outgoing' for the initial artifact
                this.citation_conversation[artifactID].outgoing_cites[outgoingAlexID] = 1

                //Now we check to see if the out-going cite is part of the origional get-cite
                if (this.citation_conversation[outgoingAlexID]) {
                    //mark it as outgoing_internal
                    this.citation_conversation[artifactID].outgoing_cites_internal[outgoingAlexID] = 1
                    //we identify the artifactID as an INCOMING for the out-going cite,
                    this.citation_conversation[outgoingAlexID].incoming_cites[artifactID] = 1

                    // increases the out-going cite's centrality score
                    this.citation_conversation[outgoingAlexID].centrality_score += 1

                    //increases the artifact's oracle_score IF the outgoingAlexID isn't the central article (this will identify people IN the conversation even if they aren't cited)
                    if (outgoingAlexID !== this.centralCitationID) {
                        this.citation_conversation[artifactID].oracle_score += 1
                    }

                    //if it isn't in the central conversation, then it belongs in outgoing_cites
                } else if (this.citations_outgoing[outgoingAlexID]) {
                    //if it already exists, we increase its gravity and ammend its incoming cites
                    this.citations_outgoing[outgoingAlexID].gravity_score += 1

                    this.citations_outgoing[outgoingAlexID].incoming_cites[artifactID] = 1
                } else {
                    //otherwise, we need to create the entry
                    this.citations_outgoing[outgoingAlexID] = {
                        doi: null,
                        id: outgoingAlexID,
                        source: null,
                        title: null,
                        pub_date: null,
                        citation: null,
                        authors: {},
                        outgoing_cites: {},
                        outgoing_cites_internal: {},
                        incoming_cites: {
                            [artifactID]: 1,
                        },
                        abstract: null,
                        gravity_score: 1,
                    }
                }
            }
        }

        //save an array sorted for 'gravity' as citation_outgoing'
        const keys_citation_outgoing = Object.keys(this.citations_outgoing)
        this.sorted_citations_outgoing = []
        for (const key of keys_citation_outgoing) {
            // we don't want to include any citations with a gravity of 1 bc they are have no siblings
            if (this.citations_outgoing[key].gravity_score > 1) {
                this.sorted_citations_outgoing.push(this.citations_outgoing[key])
            }
        }
        //reverse ordered
        this.sorted_citations_outgoing.sort((a, b) => b.gravity_score - a.gravity_score)

        //same with citation_conversation: note, we can also resort this array according to oracle_score!
        const keys_citation_conversation = Object.keys(this.citation_conversation)
        this.sorted_citation_conversation = []
        for (const key of keys_citation_conversation) {
            this.sorted_citation_conversation.push(this.citation_conversation[key])
        }
        this.sorted_citation_conversation.sort((a, b) => b.centrality_score - a.centrality_score)
    }

    /**
     * @param {array<etAL_Outgoing_Cite} slidingWindow
     */
    async identifyOutgoingCitations(slidingWindow) {
        //this should be dynamic. rather then get 'outgoing citations' for the thousands of outgoing citations there will be a sliding window on that sorted array and when the user reaches the end of it we will call this function
        //this is a WIP
    }

    /**
     * @param {etAL_Conversation_Cite} etAlCitation
     * @returns {object}
     */
    async sharedOutgoing(etAlCitation) {
        //input = one work's reference page, output = all works that share

        const comparedID = etAlCitation.id

        //populate information for all 'out-going'
        const outgoingArray = this._convertOutgoingToCitationArray(etAlCitation)
        this._identifyOutgoing(outgoingArray)

        //Then ?????? - this is a WIP
    }

    //-----------Utilities--------------

    /**
     * @param {array<etAL_Outgoing_Cite} citationArray
     */
    async _identifyOutgoing(citationArray) {
        const unidentifiedCites = []
        for (const cite of citationArray) {
            if (cite.title) {
                continue
            }
            unidentifiedCites.push(cite.id)
        }

        const identifiedCitations = await OpenAlexAPI.getMultiWorks(unidentifiedCites)

        for (const citation of identifiedCitations) {
            const alexID = OpenAlexAPI._extractOpenAlexID(citation.id)
            this.citations_outgoing[alexID].doi = citation.doi
            this.citations_outgoing[alexID].source = citation.primary_location.source.display_name
            this.citations_outgoing[alexID].title = citation.title
            this.citations_outgoing[alexID].pub_date = citation.publication_date
            this._extractAuthorDetails(citation.authorships, alexID, this.citations_outgoing)
        }
    }

    /**
     * @param {etAL_Conversation_Cite} conversation_citation
     * @returns {array<etAL_Outgoing_Cite}
     */
    _convertOutgoingToCitationArray(conversation_citation) {
        const outgoingArray = []
        const outgoingKeys = Object.keys(conversation_citation.outgoing_cites)
        for (const key of outgoingKeys) {
            outgoingArray.push(this.citations_outgoing[key])
        }
        return outgoingArray
    }

    /**
     * @param {array<OA_AuthorshipObj} authorObjList
     * @param {string} workID
     * @param {object} citation_track
     */
    _extractAuthorDetails(authorObjList, workID, citation_track) {
        for (const authorObj of authorObjList) {
            citation_track[workID].authors[authorObj.author.display_name] = 1
        }
    }
}

export default etalCitationMapper
