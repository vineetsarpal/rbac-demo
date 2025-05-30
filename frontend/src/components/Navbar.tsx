import { Button, Flex, Heading, HStack, Spacer, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { ColorModeButton, useColorModeValue } from "@/components/ui/color-mode"
import AuthButton from "./AuthButton"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { userService } from "@/services/userService"

function Navbar() {
    const { isLoggedIn, token, currentUser } = useAuth()
    const bgNav = useColorModeValue('gray.50','')

    const { data: orgData } = useQuery({
        queryKey: ["currentUserOrg", currentUser?.id, token],
        queryFn: () => userService.getCurrentUserOrg(token),
        staleTime: 5 * 60 * 1000,
        enabled: isLoggedIn && !!token && !!currentUser
    })

  return (
    <Flex as={"nav"} px={10} py={2} gap={2} alignItems={"center"} wrap={"wrap"} bg={isLoggedIn ? bgNav : ''}>
        <HStack gap={10}>
            <Link to="/"  activeProps={{ className: 'font-bold' }} activeOptions={{ exact: true }}>
                <Heading size="3xl" fontWeight="bold">{orgData?.name}</Heading>
            </Link> 
        </HStack>
    
        <Spacer />

        <HStack gap={5}>
            {(isLoggedIn) && 
                <Link to='/dashboard'>
                    <Button variant={"solid"} rounded="full">Dashboard</Button>
                </Link>
            }   
            {isLoggedIn && <Text>Hi, {currentUser?.name} </Text>}
            <AuthButton />
            <ColorModeButton />
        </HStack>
    </Flex>
  )
}

export default Navbar