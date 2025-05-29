import { useForm } from "react-hook-form"
import { Input, VStack,Field, Button, Text } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/services/authService"

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from "react"


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
    </>
  )
}
