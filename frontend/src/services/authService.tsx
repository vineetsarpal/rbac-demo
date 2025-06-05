import { API_BASE_URL } from "@/config"
import type { paths } from "@/types/openapi"

type FormData = {
  username: string
  password: string
};

type LoginResponse = {
  access_token: string
  token_type: string
}

type User = paths["/auth/users/me/"]["get"]["responses"]["200"]["content"]["application/json"]


export const authService = {
  // Login API call
  signIn: async (data: FormData): Promise<LoginResponse> => {
    const form = new URLSearchParams();
    form.append("username", data.username)
    form.append("password", data.password)

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    
    if (!res.ok) throw new Error("Invalid credentials")
    return res.json();
  },

  hasPermission(user: User, requiredPermission: string): boolean {
    return user?.permissions.includes(requiredPermission)
  }
}