import { API_BASE_URL } from '@/config'
import { Button, Card, CloseButton, Dialog, Portal, SimpleGrid } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { paths } from '@/types/openapi'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/dashboard/users/')({
  component: RouteComponent,
})

type User = paths["/users/{user_id}"]["get"]["responses"]["200"]["content"]["application/json"]

const getUsers = async (token: string | null, token0: string | null = null) => {
    const bearerToken = token ? token : token0
    const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
            "Authorization": `Bearer ${bearerToken}`
        }
    })
    if (!res.ok) throw new Error("Error fetching data")
    return res.json()
}

const deleteUser = async (payload: {id: string, token: string | null})  => {
    const { id, token } = payload
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
        "Authorization": `Bearer ${token}`,
        },
    })
    if (!res.ok) throw new Error("Failed to delete User")
    return true
}

function RouteComponent() {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    const { data, isLoading, error } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: () => getUsers(token),
        enabled: !!token
    })

    const { mutate, isPending } = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] })
      }
    })

    const handleDeleteClick = (id: string) => {
      setIdToDelete(id)
    }

    const confirmDelete = () => {
      if (idToDelete && token) mutate({ id: idToDelete, token })
    }

    if (isLoading) return <p> Loading</p>

    if (error) return <p>Error: {error.message}</p>

    return (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={10}>
        {
            data?.map((user: User) => (
                <Card.Root key={user.id}> 
                    <Link to="/dashboard/users/$userId" params={{ userId: user.id.toString() }} >
                    <Card.Header>{user.name}</Card.Header>
                    <Card.Body>
                        Email: {user.email}
                    </Card.Body>
                    </Link>

                    <Card.Footer>
                    <Dialog.Root role="alertdialog">
                        <Dialog.Trigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(user.id.toString())}>
                            Delete
                        </Button>
                        </Dialog.Trigger>
                        <Portal>
                        <Dialog.Backdrop />
                        <Dialog.Positioner>
                            <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Are you sure?</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <p>
                                This will permanently delete User ID: {user.id}
                                </p>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="red" onClick={confirmDelete} loading={isPending}>Delete</Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                            </Dialog.Content>
                        </Dialog.Positioner>
                        </Portal>
                    </Dialog.Root> 
                    </Card.Footer>

                </Card.Root>
            ))
        }
        </SimpleGrid>
    )
}
