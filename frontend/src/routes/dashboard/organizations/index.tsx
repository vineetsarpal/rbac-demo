import { API_BASE_URL } from '@/config'
import { useAuth } from '@/contexts/AuthContext'
import type { paths } from '@/types/openapi'
import { Button, Card, Dialog, Field, Flex, Heading, Input, Portal, SimpleGrid, useDisclosure } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

export const Route = createFileRoute('/dashboard/organizations/')({
  component: RouteComponent,
})

type Organization = paths["/organizations/{organization_id}"]["get"]["responses"]["200"]["content"]["application/json"]
type CreateOrganizationPayload = paths["/organizations/"]["post"]["requestBody"]["content"]["application/json"]

const getOrganizations = async (token: string | null) => {
    const res = await fetch(`${API_BASE_URL}/organizations`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
    })

    if (!res.ok) throw new Error("Error fetching data!")
    return res.json()
}

const createOrganization = async (payload: { data: CreateOrganizationPayload, token: string | null }) => {
    const { data, token } = payload
    const res = await fetch(`${API_BASE_URL}/organizations`, {
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

function CreateOrganizationDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { token } = useAuth()
    const queryClient = useQueryClient()
    const { register, handleSubmit, reset } = useForm<CreateOrganizationPayload>()

    const { mutate: createMutate, isPending } = useMutation({
        mutationFn: createOrganization,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] })
            reset()
            onClose()
        }
    })

    const onSubmit = (data: CreateOrganizationPayload) => {
        createMutate({ data, token })
    }

    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
          <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                  <Dialog.Content>
                      <Dialog.Header>
                          <Dialog.Title>Create New Organization</Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                          <form onSubmit={handleSubmit(onSubmit)}>
                              <Field.Root>
                                  <Field.Label>Id</Field.Label>
                                  <Input {...register("id")} />
                              </Field.Root>                            
                              <Field.Root>
                                  <Field.Label>Name</Field.Label>
                                  <Input {...register("name")} />
                              </Field.Root>
                              <Field.Root mt={4}>
                                  <Field.Label>domain</Field.Label>
                                  <Input {...register("slug")} />
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

    const { data, isLoading, error } = useQuery<Organization[]>({
        queryKey: ['items'],
        queryFn: () => getOrganizations(token),
        staleTime: 5000,
        enabled: !!token
    })

    if (isLoading) return <p>Loading...</p>

    if (error) return <p>Error: {error.message}</p>

  return (
    <>
    <Heading size="lg" mb={6}>
        Organizations
    </Heading>

      <Flex justify="flex-end" mb={4}>
        <Button 
            onClick={onOpen}
            disabled={!currentUser?.permissions.includes("create:items")}
        >
            Create New Organization
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={10}>
        {
          data?.map((organization: Organization) => (
            <Card.Root key={organization.id}> 
                <Link to="/dashboard/organizations/$organizationId" params={{ organizationId: organization.id.toString() }} >
                <Card.Header>{organization.name}</Card.Header>
                <Card.Body>
                    domain: {organization.slug}
                </Card.Body>
                </Link>
            </Card.Root>
          ))
        }
      </SimpleGrid>
      <CreateOrganizationDialog isOpen={open} onClose={onClose} />
    </>
  )
}