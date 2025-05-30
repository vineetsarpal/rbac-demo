import { API_BASE_URL } from '@/config'
import { Button, Card, Dialog, Field, Flex, Heading, Input, Portal, SimpleGrid, useDisclosure } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { paths } from '@/types/openapi'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'

export const Route = createFileRoute('/dashboard/users/')({
  component: RouteComponent,
})

type User = paths["/users/{user_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type CreateUserPayload = paths["/users/"]["post"]["requestBody"]["content"]["application/json"]

const getUsers = async (token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
    if (!res.ok) throw new Error("Error fetching data")
    return res.json()
}

const createUser = async (payload: { data: CreateUserPayload, token: string | null }) => {
    const { data, token } = payload
    const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Error creating user!")
    return res.json()
}

function CreateUserDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { token, currentUser } = useAuth()
    const queryClient = useQueryClient()

    const defaultValues = {
        organization_id: currentUser?.organization_id?.toString() || ''
    }

    const { register, handleSubmit, reset } = useForm<CreateUserPayload>({
        defaultValues
    })


    const { mutate: createMutate, isPending } = useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            reset()
            onClose()
        }
    })

    const onSubmit = (data: CreateUserPayload) => {
        createMutate({ data, token })
    }

    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                  <Dialog.Content>
                      <Dialog.Header>
                          <Dialog.Title>Create New User</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                            <Field.Root>
                                <Field.Label>Username</Field.Label>
                                <Input {...register("username")} />
                            </Field.Root>                            
                            <Field.Root>
                                <Field.Label>Password</Field.Label>
                                <Input type="password" {...register("password")} />
                            </Field.Root>
                            <Field.Root mt={4}>
                                <Field.Label>Email</Field.Label>
                                <Input type="email" {...register("email")} />
                            </Field.Root>
                            <Field.Root mt={4}>
                                <Field.Label>Full Name</Field.Label>
                                <Input {...register("name")} />
                            </Field.Root>
                            {currentUser?.is_platform_admin? (
                                <Field.Root mt={4}>
                                <Field.Label>Organization ID:</Field.Label>
                                <Input {...register("organization_id")} />
                            </Field.Root>    
                            ) : (
                            <Input type="hidden" {...register("organization_id")} />
                            )}                                                          
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
        </form>
      </Dialog.Root>
    )
}

function RouteComponent() {
    const { token, currentUser } = useAuth()
    const { open, onOpen, onClose } = useDisclosure()

    const { data, isLoading, error } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: () => getUsers(token),
        enabled: !!token
    })

    if (isLoading) return <p> Loading</p>

    if (error) return <p>Error: {error.message}</p>

    return (
        <>
            <Heading size="lg" mb={6}>
                Users
            </Heading>

            <Flex justify="flex-end" mb={4}>
                <Button 
                    onClick={onOpen}
                    disabled={!currentUser?.permissions.includes("create:users")}
                >
                    Create New User
                </Button>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={10}>
            {data?.map((user: User) => (
                <Card.Root key={user.id}> 
                    <Link to="/dashboard/users/$userId" params={{ userId: user.id.toString() }} >
                    <Card.Header>{user.name}</Card.Header>
                    <Card.Body>
                        Email: {user.email}
                    </Card.Body>
                    </Link>
                </Card.Root>
            ))}
            </SimpleGrid>
            <CreateUserDialog isOpen={open} onClose={onClose} />
        </>
    )
}
