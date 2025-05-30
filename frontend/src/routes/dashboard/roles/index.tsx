import { API_BASE_URL } from '@/config'
import { useAuth } from '@/contexts/AuthContext'
import type { paths } from '@/types/openapi'
import { Card, SimpleGrid } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/roles/')({
  component: RouteComponent,
})

type Role = paths["/roles/{role_id}"]["get"]["responses"]["200"]["content"]["application/json"]

const getRoles = async (token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/roles`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    if (!res.ok) throw new Error("Error fetching data")
    return res.json()
}

function RouteComponent() {
    const { token } = useAuth()
    const queryClient = useQueryClient()

    const { data, isLoading, error } = useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: () => getRoles(token),
        enabled: !!token
    })

    if (isLoading) return <p> Loading</p>

    if (error) return <p>Error: {error.message}</p>

    return (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={10}>
        {data?.map((role: Role) => (
            <Card.Root key={role.id}> 
                <Link to="/dashboard/roles/$roleId" params={{ roleId: role.id.toString() }} >
                <Card.Header>{role.name}</Card.Header>
                <Card.Body>
                    {role.description}
                </Card.Body>
                </Link>
            </Card.Root>
        ))}
        </SimpleGrid>
    )
}
