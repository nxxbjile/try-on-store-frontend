import { apiClient, extractApiError } from "@/lib/api/client"

export type SyncUserPayload = {
  name?: string
  email?: string
  image?: string
  address?: string
  phone?: string
}

export type BackendUserProfile = {
  _id?: string
  name?: string
  email?: string
  role?: "user" | "admin"
  image?: string
  address?: string
  phone?: string
}

function normalizeUserPayload(data: any): BackendUserProfile {
  const user = data?.user ?? data?.data ?? data

  return {
    _id: typeof user?._id === "string" ? user._id : undefined,
    name: typeof user?.name === "string" ? user.name : undefined,
    email: typeof user?.email === "string" ? user.email : undefined,
    role: user?.role === "admin" || user?.role === "user" ? user.role : undefined,
    image: typeof user?.image === "string" ? user.image : undefined,
    address: typeof user?.address === "string" ? user.address : undefined,
    phone: typeof user?.phone === "string" ? user.phone : undefined,
  }
}

export async function syncBackendUserProfile(token: string, payload: SyncUserPayload = {}) {
  try {
    const response = await apiClient.post("/users/me/sync", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return normalizeUserPayload(response.data)
  } catch (error: any) {
    throw new Error(extractApiError(error, "Failed to sync user profile"))
  }
}

export async function fetchBackendUserProfile(token: string) {
  try {
    const response = await apiClient.post(
      "/users/me/sync",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    return normalizeUserPayload(response.data)
  } catch (error: any) {
    throw new Error(extractApiError(error, "Failed to fetch backend profile"))
  }
}
