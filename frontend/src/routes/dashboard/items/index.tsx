import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {  Button, Card, Dialog, Field, Flex, Heading, Input, Portal, SimpleGrid, useDisclosure } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type { paths } from "@/types/openapi"
import { API_BASE_URL } from "@/config"
import { useAuth } from "@/contexts/AuthContext"
import { useForm } from "react-hook-form"

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
})

type Item = paths["/items/{item_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type CreateItemPayload = paths["/items/"]["post"]["requestBody"]["content"]["application/json"]

const getItems = async (token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/items`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
    })

    if (!res.ok) throw new Error("Error fetching data!")
    return res.json()
}

const createItem = async (payload: { data: CreateItemPayload, token: string | null }) => {
    const { data, token } = payload
    const res = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Error creating item!")
    return res.json()
}

function CreateItemDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const { register, handleSubmit, reset } = useForm<CreateItemPayload>()

    const { mutate: createMutate, isPending } = useMutation({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] })
            reset()
            onClose()
        }
    })

    const onSubmit = (data: CreateItemPayload) => {
        createMutate({ data, token })
    }

    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                  <Dialog.Content>
                      <Dialog.Header>
                          <Dialog.Title>Create New Item</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                          <form onSubmit={handleSubmit(onSubmit)}>
                              <Field.Root>
                                  <Field.Label>Name</Field.Label>
                                  <Input {...register("name")} />
                              </Field.Root>
                              <Field.Root mt={4}>
                                  <Field.Label>Price</Field.Label>
                                  <Input {...register("price")} type="number" />
                              </Field.Root>
                          </form>
                      </Dialog.Body>
                      <Dialog.Footer>
                          <Button variant="outline" onClick={onClose}>Cancel</Button>
                          <Button 
                              colorScheme="blue" 
                              onClick={handleSubmit(onSubmit)}
                              loading={isPending}
                          >
                              Create
                          </Button>
                      </Dialog.Footer>
                  </Dialog.Content>
              </Dialog.Positioner>
          </Portal>
      </Dialog.Root>
    )
}

function RouteComponent() {
    const { token, currentUser } = useAuth()
    const { open, onOpen, onClose } = useDisclosure()

    const { data, isLoading, error } = useQuery<Item[]>({
        queryKey: ['items'],
        queryFn: () => getItems(token),
        staleTime: 5000,
        enabled: !!token
    })

    if (isLoading) return <p>Loading...</p>

    if (error) return <p>Error: {error.message}</p>

  return (
    <>
    <Heading size="lg" mb={6}>
      Items
    </Heading>
      <Flex justify="flex-end" mb={4}>
        <Button 
            onClick={onOpen}
            disabled={!currentUser?.permissions.includes("create:items")}
        >
            Create New Item
        </Button>
      </Flex>
      
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
                </Card.Root>
          ))
        }
      </SimpleGrid>
      <CreateItemDialog isOpen={open} onClose={onClose} />
    </>
  )
}