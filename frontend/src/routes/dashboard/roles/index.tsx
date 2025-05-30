import { API_BASE_URL } from '@/config'
import { useAuth } from '@/contexts/AuthContext'
import type { paths } from '@/types/openapi'
import { Button, Card, Dialog, Field, Flex, Heading, Input, Portal, SimpleGrid, useDisclosure } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

export const Route = createFileRoute('/dashboard/roles/')({
  component: RouteComponent,
})

type Role = paths["/roles/{role_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type CreateRolePayload = paths["/roles/"]["post"]["requestBody"]["content"]["application/json"]

const getRoles = async (token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/roles`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    if (!res.ok) throw new Error("Error fetching data")
    return res.json()
}

const createRole = async (payload: { data: CreateRolePayload, token: string | null }) => {
    const { data, token } = payload
    const res = await fetch(`${API_BASE_URL}/roles`, {
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

function CreateRoleDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const { register, handleSubmit, reset } = useForm<CreateRolePayload>()

    const { mutate: createMutate, isPending } = useMutation({
        mutationFn: createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] })
            reset()
            onClose()
        }
    })

    const onSubmit = (data: CreateRolePayload) => {
        createMutate({ data, token })
    }

    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                  <Dialog.Content>
                      <Dialog.Header>
                          <Dialog.Title>Create New Role</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                          <form onSubmit={handleSubmit(onSubmit)}>
                              <Field.Root>
                                  <Field.Label>Name</Field.Label>
                                  <Input {...register("name")} />
                              </Field.Root>                            
                              <Field.Root>
                                  <Field.Label>Description</Field.Label>
                                  <Input {...register("description")} />
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

    const { data, isLoading, error } = useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: () => getRoles(token),
        enabled: !!token
    })

    if (isLoading) return <p> Loading</p>

    if (error) return <p>Error: {error.message}</p>

    return (
    <>
        <Heading size="lg" mb={6}>
            Roles
        </Heading>

        <Flex justify="flex-end" mb={4}>
            <Button 
                onClick={onOpen}
                disabled={!currentUser?.permissions.includes("create:roles")}
            >
                Create New Role
            </Button>
        </Flex>
        
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
        <CreateRoleDialog isOpen={open} onClose={onClose} />
    </>
    )
}
