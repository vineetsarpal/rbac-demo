import { API_BASE_URL } from "@/config";
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
import { Toaster, toaster } from "@/components/ui/toaster";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LuUser, LuSquareCheck, LuArrowLeft } from "react-icons/lu";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/dashboard/roles/$roleId")({
  component: RouteComponent,
});

type Role =
  paths["/roles/{role_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type Permission =
  paths["/permissions/{permission_id}"]["get"]["responses"]["200"]["content"]["application/json"];
type UpdatePayload =
  paths["/roles/{role_id}"]["put"]["requestBody"]["content"]["application/json"];

interface PermissionWithAssignment extends Permission {
  assigned: boolean;
}

const getRole = async (id: string, token: string | null) => {
  const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error fetching data!");
  return res.json();
};

const updateRole = async (payload: {
  id: string;
  data: UpdatePayload;
  token: string | null;
}) => {
  const { id, data, token } = payload;
  const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error updating role!");
  return res.json();
};

const getRolePermissions = async (roleId: string, token: string | null) => {
  const res = await fetch(`${API_BASE_URL}/roles/${roleId}/permissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error fetching data!");
  return res.json();
};

const deleteRole = async (payload: { id: string; token: string | null }) => {
  const { id, token } = payload;
  const res = await fetch(`${API_BASE_URL}/roles/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete role");
  return true;
};

function RouteComponent() {
  const { token, currentUser } = useAuth();
  const { roleId } = Route.useParams();
  const [editMode, setEditMode] = useState(false);
  const [permissions, setPermissions] = useState<PermissionWithAssignment[]>(
    []
  );
  const [initialPermissions, setInitialPermissions] = useState<
    PermissionWithAssignment[]
  >([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: roleData,
    isLoading,
    error,
  } = useQuery<Role>({
    queryKey: ["roles", roleId],
    queryFn: () => getRole(roleId, token),
    enabled: !!roleId,
  });

  const { register, handleSubmit, reset } = useForm<UpdatePayload>({
    defaultValues: roleData || {},
  });

  // Reset form when role data loads or updates
  useEffect(() => {
    if (roleData) {
      reset(roleData);
    }
  }, [roleData, reset]);

  // Edit mutation
  const { mutate: editMutate } = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", roleId] });
      setEditMode(false);
      toaster.create({
        title: "Role updated successfully",
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
    editMutate({ id: roleId, data: formData, token });
  };

  const { data: permissionData } = useQuery<PermissionWithAssignment[]>({
    queryKey: ["permissions", roleId],
    queryFn: () => getRolePermissions(roleId, token),
    enabled: !!roleId,
  });

  // Initialize roles state when roleData loads
  useEffect(() => {
    if (permissionData) {
      setPermissions(permissionData);
      setInitialPermissions(permissionData);
    }
  }, [permissionData]);

  // Mutation for saving changes
  const updateRolesMutation = useMutation({
    mutationFn: async (selectedPermissionIds: number[]) => {
      const res = await fetch(
        `${API_BASE_URL}/roles/${roleData?.id}/permissions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedPermissionIds),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update roles");
      }
      return res.json();
    },
    onSuccess: () => {
      toaster.create({
        title: "Role Permissions updated successfully",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["permissions", roleId] });
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
  const handleCheckboxChange = (permissionId: number) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === permissionId
          ? { ...permission, assigned: !permission.assigned }
          : permission
      )
    );
  };

  // Handle cancel button click
  const handleCancel = () => {
    setPermissions(initialPermissions);
    setEditMode(false);
  };

  // Save permissions to backend
  const handleSave = () => {
    if (!roleData?.id) {
      alert(`Role ID ${roleData?.id} not available to save permissions.`);
      return;
    }
    const selectedPermissionIds = permissions
      .filter((p) => p.assigned)
      .map((p) => p.id);
    updateRolesMutation.mutate(selectedPermissionIds);
  };

  // Delete
  const { mutate: deleteMutate, isPending } = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      navigate({ to: `/dashboard/roles` });
    },
  });

  const confirmDelete = () => {
    if (roleId && token) deleteMutate({ id: roleId, token });
  };

  if (isLoading || !roleData) return <p>Loading...</p>;

  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <Toaster />

      <Flex align="center" mb={6} gap={4}>
        <Heading size="lg">Role: {roleData?.name}</Heading>

        <Spacer />

        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/dashboard/roles" })}
        >
          <LuArrowLeft /> Back to Roles
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
              Role Details
            </Tabs.Trigger>
            <Tabs.Trigger value="permissions">
              <LuSquareCheck />
              Permissions
            </Tabs.Trigger>
            <Tabs.Indicator rounded="md" />
          </Tabs.List>

          <Tabs.Content value="details">
            <VStack gap={5} align="stretch" mt={4}>
              <Heading as="h2" size="lg" mb={2}>
                Role Details
              </Heading>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input {...register("name")} disabled={!editMode} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Input {...register("description")} disabled={!editMode} />
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
                        !currentUser?.permissions.includes("update:roles")
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
                            roleData?.name === "superadmin" ||
                            !currentUser?.permissions.includes("delete:roles")
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
                                This will permanently delete {roleData?.name}
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
                                disabled={
                                  roleData.name === "superadmin" ||
                                  roleData.name === "admin"
                                }
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

          <Tabs.Content value="permissions">
            <VStack gap={5} align="stretch" mt={4}>
              <Text fontSize="lg" fontWeight="semibold" mb={3}>
                Manage Permissions
              </Text>
              {permissions && permissions.length > 0 ? (
                <VStack align="flex-start" gap={3}>
                  {permissions.map((permission: PermissionWithAssignment) => (
                    <HStack key={permission.id} width="100%">
                      <Checkbox.Root
                        checked={permission.assigned}
                        onCheckedChange={() =>
                          handleCheckboxChange(permission.id)
                        }
                        id={`permission-${permission.id}`}
                        disabled={!editMode}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control borderRadius="md" borderWidth="2px" />
                        <Checkbox.Label ml={2}>
                          <Text fontSize="md">{permission.name}</Text>
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Text fontStyle="italic">
                  No permissions available to assign.
                </Text>
              )}
              <Spacer />
              <Flex justifyContent="center" mt={6}>
                {editMode ? (
                  <HStack w="100%" gap={4}>
                    <Button
                      onClick={handleSave}
                      loading={updateRolesMutation.isPending}
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
                    disabled={roleData?.name === "superadmin"}
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
