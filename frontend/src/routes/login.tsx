import { useForm } from "react-hook-form"
import { Input, VStack,Field, Button, Text, Box, AlertTitle, AlertDescription, AlertRoot, HStack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/services/authService"

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from "react"
import { FiAlertCircle } from "react-icons/fi"


export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

type FormData = {
    username: string
    password: string
}

const sampleCredentials = [
    { role: "Superadmin", username: "\\superadmin", password: "superadmin" },
    { role: "Acme Admin", username: "acme\\admin", password: "admin" },
    { role: "Acme Editor", username: "acme\\editor", password: "editor" },
    { role: "Acme Viewer", username: "acme\\viewer", password: "viewer" },
    { role: "FooBar Admin", username: "foobar\\admin", password: "admin" },
    { role: "FooBar Editor", username: "foobar\\editor", password: "editor" },
    { role: "FooBar Viewer", username: "foobar\\viewer", password: "viewer" },
  ]

function RouteComponent() {
    const { register, handleSubmit } = useForm<FormData>()
    const navigate = useNavigate()
    const { login, isLoggedIn } = useAuth()

    useEffect(() => {
        if (isLoggedIn) {
            navigate({ to: "/dashboard" });
        }
    }, [isLoggedIn, navigate]);

    const { mutate, isPending, error } = useMutation({
        mutationFn: authService.signIn,
        onSuccess: (data) => {
            login(data.access_token),
            navigate({ to: "/dashboard" })
        },
    })

    const onSubmit = (data: FormData) => {
        mutate(data)
    }

  return (
    <>
        <form onSubmit={handleSubmit(onSubmit)}>
            <VStack maxW={500} mt={20} mx={"auto"}  gap={5} align={"stretch"}>
                <Field.Root>
                    <Field.Label>Username</Field.Label>
                    <Field.HelperText>Please enter in the format: domain\username. <br />e.g. acme\admin</Field.HelperText>
                    <Input {...register("username")} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Password</Field.Label>
                    <Input type="password" {...register("password")} />
                </Field.Root>
                <Button type="submit" loading={isPending}>Sign In</Button>
                <Text color={"red"}>{error && error.message}</Text>
            </VStack>
        </form>

        {/* Sample credentials info */}
      <Box maxW={500} mx="auto" mt={10} mb={10}>
        <AlertRoot
          status="info"
          borderRadius="md"
          flexDirection="column"
          alignItems="start"
          p={4}
        >
           <HStack mb={2} gap={2}>
            <FiAlertCircle />
            <AlertTitle>Sample Credentials</AlertTitle>
          </HStack>
        <AlertDescription w="full">
            <VStack align="stretch" gap={2}>
                {sampleCredentials.map(({ role, username, password}) => (
                    <Text key={username}>
                        <Text as="span" fontWeight="bold">{role}:</Text>{" "}
                        <Text>username: {username} pwd: {password}</Text>
                    </Text>
                ))}
                <Text mt={2} color="red.500" fontWeight="medium">
                Note: Remove these credentials/info box before deploying to production.
                </Text>
            </VStack>
        </AlertDescription>
        </AlertRoot>
      </Box>
    </>
  )
}
