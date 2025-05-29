import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card, SimpleGrid, CloseButton, Dialog, Portal } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type { paths } from "@/types/openapi"
import { API_BASE_URL } from "@/config"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

import { createFileRoute } from '@tanstack/react-router'


export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
})

type Item = paths["/items/{item_id}"]["get"]["responses"]["200"]["content"]["application/json"]

const getPolicies = async (token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/items`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
    })

    if (!res.ok) throw new Error("Error fetching data!")
    return res.json()
}

const deletePolicy = async (payload: {id: string, token: string | null})  => {
  const { id, token } = payload
  const res = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to delete policy")
  return true
}

function RouteComponent() {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const [idToDelete, setIdToDelete] = useState<string | null>(null)

    const { data, isLoading, error } = useQuery<Item[]>({
        queryKey: ['policies'],
        queryFn: () => getPolicies(token),
        staleTime: 5000,
        enabled: !!token
    })

    const { mutate, isPending } = useMutation({
      mutationFn: deletePolicy,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["policies"] })
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
        data?.map((item: Item) => (
              <Card.Root key={item.id}> 
                <Link to="/dashboard/items/$itemId" params={{ itemId: item.id.toString() }} >
                  <Card.Header>{item.name}</Card.Header>
                  <Card.Body>
                      Price: {item.price}
                  </Card.Body>
                </Link>

                <Card.Footer>
                  <Dialog.Root role="alertdialog">
                    <Dialog.Trigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(item.id.toString())}>
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
                              This will permanently delete Policy ID: {item.id}
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