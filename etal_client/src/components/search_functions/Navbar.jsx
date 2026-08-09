import SearchBar from './SearchBar'
import {Box, Container, Title} from '@mantine/core'

function Navbar() {
    return (
        <Box component="header" className="navBar" py="lg">
            <Title order={1} className="navLogo">
                Et Al
            </Title>
            <Container size="sm">
                <SearchBar />
            </Container>
        </Box>
    )
}
export default Navbar
