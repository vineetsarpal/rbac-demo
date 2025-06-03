import { API_BASE_URL } from "@/config";
import { useAuth } from "@/contexts/AuthContext";
import type { paths } from "@/types/openapi";
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  Portal,
  Spacer,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { userService } from "@/services/userService";
import { Toaster, toaster } from "@/components/ui/toaster";
import { LuArrowLeft, LuSquareCheck, LuUser } from "react-icons/lu";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/dashboard/users/$userId")({
  component: RouteComponent,
});

type User =
  paths["/users/{user_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type Role =
  paths["/roles/{role_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type Organization =
  paths["/organizations/{organization_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type UpdatePayload =
  paths["/users/{user_id}"]["put"]["requestBody"]["content"]["application/json"];

interface RoleWithAssignment extends Role {
  assigned: boolean;
}

const getUser = async (id: string, token: string | null) => {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error fetching data!");
  return res.json();
};

const updateUser = async (payload: {
  id: string;
  data: UpdatePayload;
  token: string | null;
}) => {
  const { id, data, token } = payload;
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error updating user!");
  return res.json();
};

const getUserRoles = async (userId: string | any) => {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/roles`);
  if (!res.ok) throw new Error("Error fetching data!");
  return res.json();
};

const deleteUser = async (payload: { id: string; token: string | null }) => {
  const { id, token } = payload;
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return true;
};

function RouteComponent() {
  const { userId } = Route.useParams();
  const { token, currentUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [roles, setRoles] = useState<RoleWithAssignment[]>([]);
  const [initialRoles, setInitialRoles] = useState<RoleWithAssignment[]>([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["users", userId],
    queryFn: () => getUser(userId, token),
    enabled: !!userId,
  });

  const { register, handleSubmit, reset } = useForm<UpdatePayload>({
    defaultValues: userData || {},
  });

  // Reset form when user data loads or updates
  useEffect(() => {
    if (userData) {
      reset(userData);
    }
  }, [userData, reset]);

  // Edit mutation
  const { mutate: editMutate } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", userId] });
      setEditMode(false);
      toaster.create({
        title: "User updated successfully",
        type: "success",
      });
    },
    onError: (error) => {
      toaster.create({
        title: error.message,
        type: "error",
      });
    },
  });

  const onSubmit = (formData: UpdatePayload) => {
    editMutate({ id: userId, data: formData, token });
  };

  const { data: roleData } = useQuery<RoleWithAssignment[]>({
    queryKey: ["roles", userId],
    queryFn: () => getUserRoles(userId),
    enabled: !!userId,
  });

  const { data: organizationData } = useQuery<Organization>({
    queryKey: ["users", userId, "organization"],
    queryFn: () => userService.getUserOrg(userId, token),
    enabled: !!userId && !!token,
  });

  // Initialize roles state when roleData loads
  useEffect(() => {
    if (roleData) {
      setRoles(roleData);
      setInitialRoles(roleData);
    }
  }, [roleData]);

  // Mutation for saving changes
  const updateUsersMutation = useMutation({
    mutationFn: async (selectedRoleIds: number[]) => {
      const res = await fetch(`${API_BASE_URL}/users/${userData?.id}/roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedRoleIds),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update roles");
      }
      return res.json();
    },
    onSuccess: () => {
      toaster.create({
        title: "User roles updated successfully",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["roles", userId] });
      setEditMode(false);
    },
    onError: (error) => {
      toaster.create({
        title: error,
        type: "error",
      });
    },
  });

  // Handle checkbox change
  const handleCheckboxChange = (roleId: number) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, assigned: !role.assigned } : role
      )
    );
  };

  // Handle cancel button click
  const handleCancel = () => {
    setRoles(initialRoles);
    setEditMode(false);
  };

  // Save roles to backend
  const handleSave = () => {
    if (!userData?.id) {
      alert(`User ID ${userData?.id} not available to save roles.`);
      return;
    }
    const selectedRoleIds = roles.filter((r) => r.assigned).map((r) => r.id);
    updateUsersMutation.mutate(selectedRoleIds);
  };

  // Delete
  const { mutate: deleteMutate, isPending } = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({ to: `/dashboard/users` });
    },
  });

  const confirmDelete = () => {
    if (userId && token) deleteMutate({ id: userId, token });
  };

  if (isLoading || !userData) return <p>Loading...</p>;

  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <Toaster />

      <Flex align="center" mb={6} gap={4}>
        <Heading size="lg">User: {userData?.name}</Heading>

        <Spacer />

        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/dashboard/users" })}
        >
          <LuArrowLeft /> Back to Users
        </Button>
      </Flex>

      <Box
        p={6}
        borderWidth="1px"
        borderRadius="lg"
        shadow="md"
        w="100%"
        maxW="md"
        mx="auto"
      >
        <Tabs.Root defaultValue="details" variant="plain">
          <Tabs.List bg="bg.muted" rounded="lg" p="1">
            <Tabs.Trigger value="details">
              <LuUser />
              User Details
            </Tabs.Trigger>
            <Tabs.Trigger value="roles">
              <LuSquareCheck />
              Roles
            </Tabs.Trigger>
            <Tabs.Indicator rounded="md" />
          </Tabs.List>

          <Tabs.Content value="details">
            <VStack gap={5} align="stretch" mt={4}>
              <Heading as="h2" size="lg" mb={2}>
                User Details
              </Heading>

              {currentUser?.is_platform_admin ? (
                <Field.Root>
                  <Field.Label>Organization Id</Field.Label>
                  <Input {...register("organization_id")} disabled={!editMode} />
              </Field.Root>
              ) : (
                <>
                  <Text>Organization: {organizationData?.name}</Text>
                  <Input {...register("organization_id")} type="hidden" />
                </>
              )}
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input {...register("name")} disabled={!editMode} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Username</Field.Label>
                <Input {...register("username")} disabled={!editMode} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input {...register("email")} disabled={!editMode} />
              </Field.Root>

              <Flex justifyContent="center" mt={6}>
                {editMode ? (
                  <HStack w={"100%"} gap={4}>
                    <Button
                      onClick={handleSubmit(onSubmit)}
                      loadingText="Saving..."
                      flex={1}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        reset();
                        setEditMode(false);
                      }}
                      flex={1}
                    >
                      Cancel
                    </Button>
                  </HStack>
                ) : (
                  <HStack w={"100%"} gap={4}>
                    <Button
                      alignSelf="flex-end"
                      onClick={() => setEditMode(true)}
                      disabled={
                        !currentUser?.permissions.includes("update:users")
                      }
                      flex={1}
                    >
                      Edit
                    </Button>
                    <Dialog.Root role="alertdialog">
                      <Dialog.Trigger asChild>
                        <Button
                          variant="solid"
                          colorPalette={"red"}
                          disabled={
                            userData.username === "superadmin" ||
                            !currentUser?.permissions.includes(
                              "delete:users"
                            ) ||
                            currentUser.id === userData.id
                          }
                          flex={1}
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
                                This will permanently delete {userData?.name}
                              </p>
                            </Dialog.Body>
                            <Dialog.Footer>
                              <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </Dialog.ActionTrigger>
                              <Button
                                colorPalette="red"
                                onClick={confirmDelete}
                                loading={isPending}
                                disabled={userData.username === "superadmin"}
                              >
                                Delete
                              </Button>
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
            </VStack>
          </Tabs.Content>

          <Tabs.Content value="roles">
            <VStack gap={5} align="stretch" mt={4}>
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Manage Roles
              </Text>
              {roles && roles.length > 0 ? (
                <VStack align="flex-start" gap={3}>
                  {roles.map((role: RoleWithAssignment) => (
                    <HStack key={role.id} width="100%">
                      <Checkbox.Root
                        checked={role.assigned}
                        onCheckedChange={() => handleCheckboxChange(role.id)}
                        id={`role-${role.id}`}
                        disabled={!editMode}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control borderRadius="md" borderWidth="2px" />
                        <Checkbox.Label ml={2}>
                          <Text fontSize="md">{role.name}</Text>
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text fontStyle="italic">
                  No roles available to assign.
                </Text>
              )}
              <Spacer />
              <Flex justifyContent="center" mt={6}>
                {editMode ? (
                  <HStack w="100%" gap={4}>
                    <Button
                      onClick={handleSave}
                      loading={updateUsersMutation.isPending}
                      loadingText="Saving..."
                      flex={1}
                    >
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel} flex={1}>
                      Cancel
                    </Button>
                  </HStack>
                ) : (
                  <Button
                    onClick={() => setEditMode(true)}
                    w="100%"
                    disabled={userData?.username === "superadmin"}
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </>
  );
}
