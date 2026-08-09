import CitationCard from "./CitationCard";
import etALSearch from "../../../../oa_middleware/etal/etalSearch";
import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

const RESULTS_PER_PAGE = 10;

function SuggestionList({
  searchResults,
  setSearchResults,
  searchMode,
  onSearchDeeper,
  deepSearchLoading,
}) {
  const [pageNumber, setPageNumber] = useState(0);
  const suggestionsRef = useRef(null);
  const results = searchResults.results ?? [];
  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const exhausted = searchMode === "deep" && pageNumber >= totalPages;
  const start = searchMode === "deep" ? pageNumber * RESULTS_PER_PAGE : 0;
  const renderData = results.slice(start, start + RESULTS_PER_PAGE);

  useEffect(() => {
    setPageNumber(0);
  }, [searchMode, searchResults]);

  useEffect(() => {
    suggestionsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageNumber, searchMode, searchResults]);

  if (searchResults.waiting) {
    return null;
  } else if (searchResults.id) {
    return null;
  } else if (results.length === 0) {
    return (
      <Paper ref={suggestionsRef} className="searchSuggestions" p="md" radius="md" shadow="lg">
        <Text size="sm" ta="center">
          No result found. Try a different search.
        </Text>
      </Paper>
    );
  } else {
    return (
      <Paper ref={suggestionsRef} className="searchSuggestions" p="xs" radius="md" shadow="lg">
        <Stack gap="xs">
          {exhausted ? (
            <Stack align="center" gap="xs" py="sm">
              <Text size="sm" ta="center">
                No result found. Try a different search.
              </Text>
              <Button size="xs" variant="default" onClick={() => setPageNumber(totalPages - 1)}>
                Page Back
              </Button>
            </Stack>
          ) : (
            <>
              {renderData.map((citation) => (
                <div key={etALSearch._extractOpenAlexID(citation.id)}>
                  <CitationCard citationObj={citation} setSearchResults={setSearchResults} />
                </div>
              ))}

              {searchMode === "autocomplete" ? (
                <Button
                  size="xs"
                  variant="subtle"
                  loading={deepSearchLoading}
                  onClick={onSearchDeeper}
                >
                  Still haven&apos;t found it? Search Deeper.
                </Button>
              ) : (
                <Group justify="space-between" wrap="nowrap">
                  <Button
                    size="xs"
                    variant="default"
                    disabled={pageNumber === 0}
                    onClick={() => setPageNumber((current) => Math.max(current - 1, 0))}
                  >
                    Page Back
                  </Button>
                  <Text size="xs" c="dimmed" ta="center">
                    Page {pageNumber + 1} of {totalPages}
                  </Text>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setPageNumber((current) => current + 1)}
                  >
                    Page Forward
                  </Button>
                </Group>
              )}
            </>
          )}
        </Stack>
      </Paper>
    );
  }
}

export default SuggestionList;
