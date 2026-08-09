import etALSearch from "../../../../oa_middleware/etal/etalSearch";
import useNetworkGraphContext from "../../hooks/useNetworkGraphContext";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

function CitationCard({ citationObj, setSearchResults }) {
  const { loadData } = useNetworkGraphContext();
  const [loading, setLoading] = useState(false);

  //Populating template for CitationCard
  const template = {};
  template.title = citationObj.display_name ?? "No primary title on record";
  template.externalID = citationObj.external_id ?? "No DOI on record";
  template.id = etALSearch._extractOpenAlexID(citationObj.id);
  template.author = citationObj.hint ?? "No authors on record";
  template.citationsCount =
    citationObj.cited_by_count ?? "No citation data exists";

  //Creating clickHandler function
  async function clickHandler() {
    setLoading(true);
    try {
      const selectedWork = await etALSearch.getWorkByOpenAlexID(citationObj.id);
      setSearchResults({
        waiting: false,
        id: selectedWork.title,
      });

      await loadData(selectedWork);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper id={template.id} p="sm" radius="md" withBorder>
      <Stack gap={4}>
        <Title order={3} size="sm">{template.title}</Title>
        <Text size="xs" fs="italic" c="dimmed">
          {template.author}
        </Text>
        <Text size="xs" c="dimmed">
          {template.externalID}, cited by: {template.citationsCount}
        </Text>
        <Group justify="flex-end" mt="xs">
          <Button size="xs" variant="light" loading={loading} onClick={clickHandler}>
            Visualize article
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export default CitationCard;
