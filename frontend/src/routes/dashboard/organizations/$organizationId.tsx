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

export const Route = createFileRoute(
  '/dashboard/organizations/$organizationId',
)({
  component: RouteComponent,
})

type Organization = paths["/organizations/{organization_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type UpdatePayload = paths["/organizations/{organization_id}"]["put"]["requestBody"]["content"]["application/json"]

const getOrganization = async (id: string, token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    })
    if (!res.ok) throw new Error("Error fetching data!")
    return res.json()
}

const updateOrganization = async (payload : { id: string, data: UpdatePayload, token: string | null }) => {
    const { id, data, token } = payload
    const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Error updating organization!")
    return res.json()
}

const deleteOrganization = async (payload: {id: string, token: string | null})  => {
  const { id, token } = payload
  const res = await fetch(`${API_BASE_URL}/organizations/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error("Failed to delete organization")
  return true
}

function RouteComponent() {
    const { organizationId } = Route.useParams()
    const { token, currentUser } = useAuth()
    const [editMode, setEditMode] = useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data: organizationData, isLoading, error } = useQuery<Organization>({
        queryKey: ["organizations", organizationId],
        queryFn: () => getOrganization(organizationId, token),
    })

    const { register, handleSubmit, reset } = useForm<UpdatePayload>({
        defaultValues: organizationData ? organizationData : {},
      })

    // Reset the form when the data is loaded or updated
    useEffect(() => {
        if (organizationData) {
            reset(organizationData)
        }
    }, [organizationData, reset])

    // Edit
    const { mutate: editMutate } = useMutation({
        mutationFn: updateOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations', organizationId] });
            navigate({ to: `/dashboard/organizations/${organizationId}`})
            setEditMode(false)
        }
    })

    const onSubmit = (formData: UpdatePayload) => {
        editMutate({ id: organizationId, data: formData, token })
    }

    // Delete
    const { mutate: deleteMutate, isPending } = useMutation({
      mutationFn: deleteOrganization,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["organizations"] })
        navigate({ to: `/dashboard/organizations`})
      }
    })

    const confirmDelete = () => {
      if (organizationId && token) deleteMutate({ id: organizationId, token })
    }

    if (isLoading || !organizationData) return <p>Loading...</p>

    if (error) return <p>Error: {error.message}</p>

  return (
    <>
      <Flex align="center" mb={6} gap={4}>
        <Heading size="lg">
          Organization: {organizationData?.name}
        </Heading>

        <Spacer />
        
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/dashboard/organizations" })}
        >
         <LuArrowLeft /> Back to Organizations
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
          <Field.Root>
              <Field.Label>Id</Field.Label>
              <Input {...register("id")} disabled={!editMode} />
          </Field.Root>        
          <Field.Root>
              <Field.Label>Name</Field.Label>
              <Input {...register("name")} disabled={!editMode} />
          </Field.Root>
          <Field.Root>
              <Field.Label>Domain</Field.Label>
              <Input {...register("slug")} disabled={!editMode} />
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
                    disabled={
                      organizationData.id === "superadmin" ||
                      !currentUser?.permissions.includes("update:organizations")}
            >
                Edit
            </Button>
            <Dialog.Root role="alertdialog">
                <Dialog.Trigger asChild>
                  <Button 
                    variant="solid"
                    colorPalette={"red"}
                    disabled={
                      organizationData.slug === ""
                      || !currentUser?.permissions.includes("delete:organizations")
                      || currentUser.organization_id === organizationData.id
                    }
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
                          This will permanently delete {organizationData?.name}
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