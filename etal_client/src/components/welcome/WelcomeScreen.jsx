import { Box, Card, Container, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import SearchBar from "../search_functions/SearchBar";

const featureCards = ["feature-one", "feature-two", "feature-three"];

function WelcomeScreen() {
  return (
    <Box component="section" className="welcomeScreen" aria-labelledby="welcome-title">
      <Container size="md" w="100%">
        <Stack align="center" gap="md">
          <Stack align="center" gap={2}>
            <Title id="welcome-title" order={1} className="welcomeLogo">
              Et Al
            </Title>
            <Text c="dimmed" size="lg" ta="center">
              See the Conversation, Join the Conversation
            </Text>
          </Stack>

          <Box w="100%" maw={640}>
            <SearchBar />
          </Box>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" w="100%" mt="xl">
            {featureCards.map((feature) => (
              <Card key={feature} h={140} padding="lg" radius="md" withBorder aria-hidden="true" />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

export default WelcomeScreen;
