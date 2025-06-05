import {
  Box,
  Container,
  Heading,
  Stack,
  VStack,
} from "@chakra-ui/react"

import { createFileRoute } from '@tanstack/react-router'
import AuthButton from "@/components/AuthButton"

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  
  return (
    <Box>
      <Container maxW="7xl" py={20} textAlign="center">
        <VStack gap={6}>
          <Heading fontSize={{ base: "3xl", md: "5xl" }}>
            RBAC Starter Kit
          </Heading>
          <Stack direction={{ base: "column", sm: "row" }} gap={4} mt={4} justify="center">
              <AuthButton />
          </Stack>
        </VStack>
      </Container>
    </Box>
  )
}