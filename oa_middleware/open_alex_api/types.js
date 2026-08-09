//-----Et Al Wrapper-----

/**
 * @typedef {obj} etAL_frontEndPayload
 * @property {string} centralCitationID
 * @property {object < etAL_Conversation_Cite} citation_conversation
 * @property {object < etAL_Outgoing_Cite} citations_outgoing
 * @property {array < etAL_Conversation_Cite} sorted_citation_conversation
 * @property {array < etAL_Outgoing_Cite} sorted_citations_outgoing
 */
/**
 * @typedef {object} etAL_Conversation_Cite
 * @property {string} doi
 * @property {string} id
 * @property {string} title
 * @property {string} pub_date
 * @property {string} source
 * @property {string} publication_location
 * @property {string} citation
 * @property {object} authors
 * @property {object} outgoing_cites
 * @property {object} outgoing_cites_internal
 * @property {object} incoming_cites
 * @property {string} abstract
 * @property {number} centrality_score
 * @property {number} oracle_score
 */

/**
 * @typedef {object} etAL_Outgoing_Cite
 * @property {string} doi
 * @property {string} id
 * @property {string} title
 * @property {string} pub_date
 * @property {string} source
 * @property {string} citation
 * @property {object} authors
 * @property {object} outgoing_cites
 * @property {object} outgoing_cites_internal
 * @property {object} incoming_cites
 * @property {string} abstract
 * @property {number} gravity
 *
 */

//-----OpenAlexAPI-----

/**
 * @typedef {object} OA_AutocompleteSearch
 * @property {{count: integer, db_response_time_ms: integer, page: integer, per_page: integer}} meta
 * @property {array<OA_AutocompleteResult>} results
 */

/**
 * @typedef {object} OA_AutocompleteResult
 * @property {string} id
 * @property {string} external_id
 * @property {string} display_name
 * @property {string} entity_type
 * @property {integer} cited_by_count
 * @property {integer | null} works_count
 * @property {string} hint
 */

/**
 * @typedef {object} OA_WorkSearch
 * @property {{
 * 'count': integer,
 * 'db_response_time_ms': integer,
 * 'page': integer || null,
 * 'per_page': integer,
 * 'next_cursor'?: string
 * }} meta
 * @property {array<OA_WorkObject} results
 */
/**
 * @typedef {object} OA_WorkObject
 * @property {object} abstract_inverted_index
 * Each word is key, value is its word# in the abstract
 * @property {array<OA_AuthorshipObj} authorships
 * @property {object} apc_list
 * @property {{
 *  'value': integer,
 *  'currency': String,
 *  'provenance': String,
 *  'value_usd': integer,
 * }} apc_paid
 * @property {OA_LocationObj} best_oa_location
 * @property {{
 *  'volume': string,
 *  'issue': string,
 *  'first_page': string,
 *  'last_page': string,}} biblio
 * @property {{
 *  'value': integer,
 *  'is_in_top_1_percent': boolean,
 *  'is_in_top_10_percent': boolean}} citation_normalized_percentile
 * @property {string} cited_by_api_url
 * @property {integer} cited_by_count
 * @property {array} concepts
 * concepts are search term topics, they are objects with:
 * id: string,
 * wikidata: string,
 * display_name: string,
 * level: integer,
 * score: integer,
 * @property {array} corresponding_author_ids
 * @property {array} corresponding_institution_ids
 * @property {integer} countries_distinct_count
 * @property {array} counts_by_year
 * array contains object with properties explaining the year and # of citations that year
 * year: integer,
 * cited_by_count: integer,
 * @property {string} created_date
 * @property {string} display_name
 * @property {string} doi
 * @property {string} fulltext_origin
 * @property {integer} fwci
 * @property {array} grants
 * array contains objects with following properties:
 * funder: string,
 * funder_display_name: string,
 * award_id: string,
 * @property {boolean} has_fulltext
 * @property {string} id
 * @property {{
 *  'doi': string,
 *  'mag': integer,
 *  'openalex': string,
 *  'pmid': string,
 *  'pmcid': string,}} ids
 * @property {array} indexed_in
 * @property {integer} institutions_distinct_count
 * @property {boolean} is_paratext
 * @property {boolean} is_retracted
 * @property {array} keywords
 * provides an array of objects that are keywords. each index object has these properties:
 * id: string,
 * display_name: string,
 * score: integer,
 * @property {string} language
 * @property {string} license
 * @property {array < OA_LocationObj} locations
 * @property {integer} locations_count
 * @property {array} mesh
 * array of mesh properties, relevent for PubMed only
 * @property {OA_OpenAccessObj} open_access
 * @property {OA_LocationObj} primary_location
 * @property {{
 *  'id': string,
 *  'display_name': string,
 *  'score': integer,
 *  'subfield': object
 *      'id': integer,
 *      'display_name': string,
 *  'domain': object
 *      'id': integer,
 *      'display_name': string}} primary_topic
 * @property {string} publication_date
 * @property {string} publication_year
 * @property {array} referenced_works
 * @property {array} related_works
 * @property {array} sustainable_development_goals
 * contains objects with properties:
 * id: string,
 * display_name: string,
 * score: integer
 * @property {array} topics
 * top 3 ranked topics for the work, not reproducing because clutter
 * @property {string} title
 * @property {string} type
 * @property {string} type_crossref
 * @property {string} updated_date
 */

/**
 * @typedef {object} OA_OpenAccessObj
 * @property {boolean} any_repository_has_fulltext
 * @property {boolean} is_oa
 * @property {string} oa_status
 * @property {string} oa_url
 */

/**
 * @typedef {object} OA_AuthorshipObj
 * @property {array} affiliations
 * @property {{
 * 'id': string,
 * 'display_name': string,
 * 'orcid': 'string'
 * }} author
 * @property {string} author_position
 * @property {array} countries
 * @property {array} institutions
 * each institution is an object with the following properties:
 * id: string,
 * display_name: string,
 * ror: string,
 * country_code: string,
 * type: string,
 * lineage: array
 * @property {boolean} is_corresponding
 * @property {array} raw_affiliation_strings
 * @property {string} raw_author_name
 */

/**
 * @typedef {object} OA_LocationObj
 * @property {boolean} is_accepted
 * @property {boolean} is_oa
 * @property {boolean} is_published
 * @property {string} landing_page_url
 * @property {string} license
 * @property {{
 *  'id': string,
 *  'display_name': string,
 *  'issn_1': string,
 *  'issn': array,
 *  'host_organization': string,
 *  'type': string}} source
 * @property {string} pdf_url
 * @property {string} version
 * 3 versions possible: publishedVersion || acceptedVersion || submittedVersion
 */

/**
 * @typedef {OA_dehydrated_InstitutionObj} OA_InstitutionObj
 * @property {array < OA_dehydrated_InstitutionObj} associated_institutions
 * //also contains a "relationship" property, possible values are: parent || child || related
 * @property {integer} cited_by_count
 * @property {array < {
 *  "year": integer,
 *  "works_count": integer,
 *  "cited_by_count": integer}} counts_by_year
 * @property {string} created_date
 * @property {array} display_name_alternatives
 * @property {{
 *  "city": string,
 *  "geonames_city_id": string,
 *  "region": string,
 *  "country_code": string,
 *  "country": string,
 *  "latitude": integer,
 *  "longitude": integer}} geo
 * @property {string} homepage_url
 * @property {
 *  "grid"?: string,
 *  "mag"?: integer,
 *  "openalex"?: string,
 *  "ror"?: string,
 *  "wikipedia"?: string,
 *  "wikidata"?: string} ids
 * @property {string} image_thumbnail_url
 * @property {boolean} is_super_system
 * @property {string} image_url
 * @property {object} international
 * //key-value pairs of the institution's display_name in different languages, e.g.: "ar": شابل هيل, "es": Universidad .... etc.
 * @property {array < } repositories
 */

/**
 * @typedef {OA_dehydrated_Author} OA_AuthorObj
 * @property {array < {
 *  "institution": OA_dehydrated_InstitutionObj,
 *  "years": integer}} affiliations
 * @property {integer} cited_by_count
 * @property {array < {
 *  "year": integer,
 *  "works_count": integer,
 *  "cited_by_count": integer}} counts_by_year
 * @property {string} created_date
 * @property {string} display_name_alternatives
 * @property {
 *  "openalex"?: string,
 *  "orcid"?: string,
 *  "scopus"?: string,
 *  "twitter"?: string,
 *  "wikipedia"?: string} ids
 * @property {array < OA_dehydrated_InstitutionObj} last_known_institutions
 * @property {
 *  "2yr_mean_citedness": integer,
 *  "h_index": integer,
 *  "i10_index": integer} summary_stats
 * @property {string} updated_date
 * @property {string} works_api_url
 * @property {integer} works_count
 */

/**
 * @typedef {OA_dehydrated_SourceObj} OA_SourceObj
 * @property {string} abbreviated_title
 * @property {array} alternate_titles
 * @property {array} apc_prices
 * @property {integer} apc_usd
 * @property {integer} cited_by_count
 * @property {string} country_code
 * @property {array < {
 *  "year": integer,
 *  "works_count": integer,
 *  "cited_by_count": integer}} counts_by_year
 * @property {string} created_date
 * @property {string} homepage_url
 * @property {
 *  "fatcat"?: string,
 *  "issn"?: array,
 *  "issn_1"?: string,
 *  "mag"?: integer,
 *  "openalex"?: string,
 *  "wikidata"?: string} ids
 * @property {array} societies
 * @property {
 *  "2yr_mean_citedness": integer,
 *  "h_index": integer,
 *  "i10_index": integer} summary_stats
 * @property {string} updated_date
 * @property {string} works_api_url
 * @property {integer} works_count
 */

//------Dehyrdated Objects-----
//These objects are "thinner" versions of larger objects that are often passed as properties above
//for sake of convienance it is easier to think of these as Parents
/**
 * @typedef {object} OA_dehydrated_InstitutionObj
 * @property {string} country_code
 * @property {string} display_name
 * @property {string} id
 * @property {array} lineage
 * @property {string} ror
 * @property {string} type
 * //Possible values: education || healthcare || company || archive || nonprofit || government || facility || other
 */

/**
 * @typedef {object} OA_dehydrated_SourceObj
 * @property {string} display_name
 * @property {string} host_organization
 * @property {array} host_organization_lineage
 * @property {string} host_organization_name
 * @property {string} id
 * @property {boolean} is_core
 * @property {boolean} is_in_doaj
 * @property {boolean} is_oa
 * @property {array} issn
 * @property {string} issn_1
 * @property {string} type
 * //Possible values: journal || repository || conference || ebook platform|| book series || metadata || other
 */

/**
 * @typedef {object} OA_dehydrated_ConceptObj
 * @property {string} display_name
 * @property {string} id
 * @property {integer} level
 * @property {string} wikidata
 */

/**
 * @typedef {object} OA_dehydrated_Author
 * @property {string} id
 * @property {string} display_name
 * @property {stirng} orcid
 */
