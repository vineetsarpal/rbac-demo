import { useAuth } from "@/contexts/AuthContext"
import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  VStack,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { userService } from "@/services/userService"

import { createFileRoute, Link } from '@tanstack/react-router'
import AuthButton from "@/components/AuthButton"

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
    const { isLoggedIn, token } = useAuth()

    const { data: userData } = useQuery({
        queryKey: ["currentUser", token],
        queryFn: () => userService.getCurrentUser(token),
        staleTime: 5 * 60 * 1000,
        enabled: isLoggedIn && !!token,
    })

    const { data: orgData } = useQuery({
        queryKey: ["currentUserOrg", userData?.id, token],
        queryFn: () => userService.getCurrentUserOrg(userData!.id.toString(),token),
        staleTime: 5 * 60 * 1000,
        enabled: isLoggedIn && !!token && !!userData
    })
  
  return (
    <Box>
      <Container maxW="7xl" py={20} textAlign="center">
        <VStack gap={6}>
          <Heading fontSize={{ base: "3xl", md: "5xl" }}>
            RBAC Demo
          </Heading>
          <Stack direction={{ base: "column", sm: "row" }} gap={4} mt={4} justify="center">
              <AuthButton />
              {isLoggedIn ? 
                <Link to="/">
                    <Button size="lg">Welcome, {userData?.name} from {orgData?.name}</Button>
                </Link> : null
                }
          </Stack>
        </VStack>
      </Container>
    </Box>
  )
}