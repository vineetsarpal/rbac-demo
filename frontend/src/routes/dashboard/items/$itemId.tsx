import { Button, Field, Flex, Heading, HStack, Input, SimpleGrid, Spacer } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { paths } from "@/types/openapi"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { API_BASE_URL } from "@/config"
import { CloseButton, Dialog, Portal } from "@chakra-ui/react"
import { useAuth } from "@/contexts/AuthContext"

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LuArrowLeft } from "react-icons/lu"


export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
})

type Item = paths["/items/{item_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type UpdatePayload = paths["/items/{item_id}"]["put"]["requestBody"]["content"]["application/json"]

const getItem = async (id: string, token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    })
    if (!res.ok) throw new Error("Error fetching data!")
    return res.json()
}

const updateItem = async (payload : { id: string, data: UpdatePayload, token: string | null }) => {
    const { id, data, token } = payload
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Error updating item!")
    return res.json()
}

const deleteItem = async (payload: {id: string, token: string | null})  => {
  const { id, token } = payload
  const res = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to delete item")
  return true
}

function RouteComponent() {
    const { itemId } = Route.useParams()
    const { token, currentUser } = useAuth()
    const [editMode, setEditMode] = useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data: itemData, isLoading, error } = useQuery<Item>({
        queryKey: ["items", itemId],
        queryFn: () => getItem(itemId, token),
    })

    const { register, handleSubmit, reset } = useForm<UpdatePayload>({
        defaultValues: itemData ? itemData : {},
      })

    // Reset the form when the data is loaded or updated
    useEffect(() => {
        if (itemData) {
            reset(itemData)
        }
    }, [itemData, reset])

    // Edit
    const { mutate: editMutate } = useMutation({
        mutationFn: updateItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items', itemId] });
            navigate({ to: `/dashboard/items/${itemId}`})
            setEditMode(false)
        }
    })

    const onSubmit = (formData: UpdatePayload) => {
        editMutate({ id: itemId, data: formData, token })
    }

    // Delete
    const { mutate: deleteMutate, isPending } = useMutation({
      mutationFn: deleteItem,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] })
        navigate({ to: `/dashboard/items`})
      }
    })

    const confirmDelete = () => {
      if (itemId && token) deleteMutate({ id: itemId, token })
    }

    if (isLoading || !itemData) return <p>Loading...</p>

    if (error) return <p>Error: {error.message}</p>

  return (
    <>
      <Flex align="center" mb={6} gap={4}>
        <Heading size="lg">
          Item: {itemData?.name}
        </Heading>

        <Spacer />
        
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/dashboard/items" })}
        >
         <LuArrowLeft /> Back to Items
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
          <Field.Root>
              <Field.Label>Name</Field.Label>
              <Input {...register("name")} disabled={!editMode} />
          </Field.Root>
          <Field.Root>
              <Field.Label>Description</Field.Label>
              <Input {...register("description")} disabled={!editMode} />
          </Field.Root>          
          <Field.Root>
              <Field.Label>Price</Field.Label>
              <Input {...register("price")} disabled={!editMode} />
          </Field.Root>
      </SimpleGrid>

      <Flex justifyContent="center" mt={6}>
        {editMode ? (
            <HStack justify="flex-end">
                <Button onClick={handleSubmit(onSubmit)} colorScheme="blue">
                    Save
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        reset()
                        setEditMode(false)
                    }}
                >
                    Cancel
                </Button>
            </HStack>
            ) : (
            <HStack justify="center" width="100%">
                <Button
                    alignSelf="flex-end" 
                    onClick={() => setEditMode(true)} 
                    disabled={!currentUser?.permissions.includes("update:items")}
            >
                Edit
            </Button>
            <Dialog.Root role="alertdialog">
                <Dialog.Trigger asChild>
                  <Button 
                    variant="solid"
                    colorPalette={"red"}
                    disabled={!currentUser?.permissions.includes("delete:items")}
                    >
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
                          This will permanently delete {itemData?.name}
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
            </HStack>
        )}
      </Flex>
    </>
  )
}