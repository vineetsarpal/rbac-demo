import { useForm } from "react-hook-form"
import { Input, VStack,Field, Button, Text, HStack } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/services/authService"

import { createFileRoute, useNavigate } from '@tanstack/react-router'


export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

type FormData = {
    username: string
    password: string
}

function RouteComponent() {
    const { register, handleSubmit } = useForm<FormData>()
    const navigate = useNavigate()
    const { login, isLoggedIn } = useAuth()
    
    if (isLoggedIn) {
        navigate({ to: "/" })
    }

    const { mutate, isPending, error } = useMutation({
        mutationFn: authService.signIn,
        onSuccess: (data) => {
            login(data.access_token),
            navigate({ to: "/" })
        },
    })

    const onSubmit = (data: FormData) => {
        mutate(data)
    }

    const signInAsGuest = () => {
        const guestCredentials = { username: "guest", password: "guest" }
        mutate(guestCredentials) // Automatically submit with guest credentials
    }

  return (
    <>
        <form onSubmit={handleSubmit(onSubmit)}>
            <VStack maxW={500} mt={20} mx={"auto"}  gap={5} align={"stretch"}>
                <Field.Root>
                    <Field.Label>Username</Field.Label>
                    <Input {...register("username")} />
                </Field.Root>
                <Field.Root>
                    <Field.Label>Password</Field.Label>
                    <Input type="password" {...register("password")} />
                </Field.Root>
                <Button type="submit" loading={isPending}>Sign In</Button>
                <HStack>
                    <Field.Root>
                        <Field.Label>Don't have an account?</Field.Label>
                    </Field.Root>
                    <Button variant="plain" onClick={signInAsGuest}>
                            <u>Continue as guest</u>
                    </Button>
                </HStack>
                <Text color={"red"}>{error && error.message}</Text>
            </VStack>
        </form>
    </>
  )
}
