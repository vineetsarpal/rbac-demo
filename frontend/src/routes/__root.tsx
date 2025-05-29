import { createRootRoute, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { Container } from "@chakra-ui/react"
import Navbar from "@/components/Navbar"

export const Route = createRootRoute({
  component: () => {
    return (  
      <>
        <Container h={"100vh"} maxW={"full"} p={0} position="relative" overflow={"auto"}>
          <Navbar />
          <Outlet />
          <TanStackRouterDevtools />
        </Container>
      </>
    )
  },
})