import { Button, Field, Flex, HStack, Input, SimpleGrid } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { paths } from "@/types/openapi"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { API_BASE_URL } from "@/config"
import { useAuth } from "@/contexts/AuthContext"

import { createFileRoute, useNavigate } from '@tanstack/react-router'


export const Route = createFileRoute('/dashboard/items/$itemId')({
  component: RouteComponent,
})

type Item = paths["/items/{item_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type UpdatePayload = paths["/items/{item_id}"]["put"]["requestBody"]["content"]["application/json"]

const getItem = async (id: string, token: string | null) => {
    const bearerToken = token
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
         headers: {
            "Authorization": `Bearer ${bearerToken}`,
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

function RouteComponent() {
    const { itemId } = Route.useParams()
    const { token } = useAuth()
    const [editMode, setEditMode] = useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data, isLoading, error } = useQuery<Item>({
        queryKey: ["items", itemId],
        queryFn: () => getItem(itemId, token),
    })

    const { register, handleSubmit, reset } = useForm<UpdatePayload>({
        defaultValues: data ? data : {},
      })

    // Reset the form when the data is loaded or updated
    useEffect(() => {
        if (data) {
            reset(data)
        }
    }, [data, reset])

    const { mutate } = useMutation({
        mutationFn: updateItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items', itemId] });
            navigate({ to: `/items/${itemId}`})
            setEditMode(false)
        }
    })

    const onSubmit = (formData: UpdatePayload) => {
        mutate({ id: itemId, data: formData, token })
    }

    if (isLoading || !data) return <p>Loading...</p>

    if (error) return <p>Error: {error.message}</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
            <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input {...register("name")} disabled={!editMode} />
            </Field.Root>
            <Field.Root>
                <Field.Label>Price</Field.Label>
                <Input {...register("price")} disabled={!editMode} />
            </Field.Root>
        </SimpleGrid>

        <Flex justifyContent="center" mt={6}>
            {editMode ? (
                <HStack justify="flex-end">
                    <Button type="submit" colorScheme="blue">Save</Button>
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
                <Button alignSelf="flex-end" onClick={() => setEditMode(true)}>Edit</Button>
            )}
        </Flex>
    </form>
  )
}