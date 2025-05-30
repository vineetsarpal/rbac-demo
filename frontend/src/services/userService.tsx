import { API_BASE_URL } from "@/config"
import type { paths } from "@/types/openapi"

type User = paths["/auth/users/me/"]["get"]["responses"]["200"]["content"]["application/json"]
type Organization = paths["/users/{user_id}/organization"]["get"]["responses"]["200"]["content"]["application/json"]

export const userService = {
    // Get current user
    getCurrentUser: async (token: string | null): Promise<User> => {
        const res = await fetch(`${API_BASE_URL}/auth/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
        })
        if (!res.ok) {
            throw new Error ("Failed to fetch Current User")
            }
        return res.json()
    },

    // Get current user's organization

    getCurrentUserOrg: async (token: string | null): Promise<Organization> => {
         const res = await fetch(`${API_BASE_URL}/auth/users/me/organization`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        if (!res.ok) {
            throw new Error('Failed to fetch user organization');
        }
        return res.json()
    },

    getUserOrg: async (userId: string, token: string | null): Promise<Organization> => {
         const res = await fetch(`${API_BASE_URL}/users/${userId}/organization`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        if (!res.ok) {
            throw new Error('Failed to fetch user organization');
        }
        return res.json()
    },

}
