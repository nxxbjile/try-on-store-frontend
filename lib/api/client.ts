import axios, { AxiosRequestConfig } from "axios"

type TokenGetter = (() => Promise<string | null> | string | null) | null

let authTokenGetter: TokenGetter = null
let inMemoryAuthToken: string | null = null

export function setAuthTokenGetter(getter: TokenGetter) {
  authTokenGetter = getter
}

export function setInMemoryAuthToken(token: string | null) {
  inMemoryAuthToken = token
}

async function resolveAuthToken() {
  if (authTokenGetter) {
    try {
      return await authTokenGetter()
    } catch {
      return null
    }
  }

  return inMemoryAuthToken
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1",
})

apiClient.interceptors.request.use(async (config) => {
  const token = await resolveAuthToken()

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function extractApiError(error: any, fallback = "API Error") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.name?.[0] ||
    error?.response?.data?.errors?.email?.[0] ||
    error?.message ||
    fallback
  )
}

export async function apiRequest<T = any>(path: string, config: AxiosRequestConfig = {}) {
  try {
    const res = await apiClient({ url: path, ...config })
    return res.data as T
  } catch (error: any) {
    throw new Error(extractApiError(error))
  }
}