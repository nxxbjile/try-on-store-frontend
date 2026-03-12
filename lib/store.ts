import { create } from "zustand"
import { createJSONStorage, persist, StateStorage } from "zustand/middleware"
import axios, { AxiosRequestConfig } from "axios"

const storage: StateStorage =
  typeof window !== "undefined"
    ? window.localStorage
    : {
      getItem: async () => null,
      setItem: async () => { },
      removeItem: async () => { },
    }

// Types
type User = {
  _id: string
  name: string
  email: string
  address?: string
  phone?: string
  role: "user" | "admin"
  image?: string | null
  createdAt: string
  updatedAt: string
}

type RegisterData = {
  name: string
  email: string
  password: string
  address?: string
  phone?: string
}

type UpdateProfileData = {
  name?: string
  email?: string
  address?: string
  phone?: string
  image?: string
}

type Product = {
  _id: string
  name: string
  description: string
  category: "shirt" | "t-shirt" | "pants"
  price: number
  discount?: number
  images: string[]
  sizes: string[]
  colors: string[]
  stock: Array<{
    size: string
    color: string
    quantity: number
  }>
  createdAt: string
  updatedAt: string
}

type CartItem = {
  product: string
  size: string
  quantity: number
  name: string
  price: number
  discount?: number
  images: [string]
}

type TryonImage = {
  _id: string
  user: string
  product: string
  image: string
  createdAt: string
  updatedAt: string
}

// Store type
type StoreState = {
  hasHydrated: boolean,
  setHasHydrated: (hydrated: boolean) => void
  // Auth state
  user: User | null
  isAuthLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUserProfile: (data: UpdateProfileData) => Promise<void>
  updateUserImage: (data: any) => Promise<void>

  // Cart state
  cartItems: CartItem[]
  getCartItems: () => Promise<void>
  addToCart: (product: string, size: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string, size: string, quantity: number) => Promise<void>
  removeProductFromCart: (product: string, size: string) => Promise<void>
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  calculateSubtotal: () => number
  calculateTotal: () => number

  // Try-on state
  tryonImages: TryonImage[]
  isTryonLoading: boolean
  tryonError: string | null
  getTryons: () => Promise<TryonImage[] | null>
  replaceProductImagesWithTryOns: () => Promise<void>
  generateTryon: (productId: string) => Promise<TryonImage | null>
  getTryonForProduct: (productId: string) => TryonImage | null

  // Orders CRUD
  createOrder: (products: { product: string, size: string, quantity: number }[], shippingAddress: string, notes: string) => Promise<any>
  getOrders: (params?: Record<string, any>) => Promise<any>
  getOrder: (orderId: string) => Promise<any>
  updateOrder: (orderId: string, update: any) => Promise<any>
  deleteOrder: (orderId: string) => Promise<void>

  // Products CRUD
  products: Product[]
  getProducts: (params?: any) => Promise<any>
  getProduct: (productId: string) => Promise<any>
  createProduct: (product: any) => Promise<any>
  updateProduct: (productId: string, update: any) => Promise<any>
  deleteProduct: (productId: string) => Promise<void>

  // User CRUD
  getUsers: (params?: any) => Promise<any>
  getUser: (userId: string) => Promise<any>
  deleteUser: (userId: string) => Promise<void>

  // Sidebar state
  isSidebarOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void

  // Theme state
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
}

// Helper to get/set/remove JWT token in localStorage
const TOKEN_KEY = "tryon_jwt"
function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token)
}
function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem(TOKEN_KEY)
  return null
}
function removeToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY)
}

// Axios instance with baseURL from env variable
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api/v1"
})

// Axios request interceptor for JWT
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY)

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

// Helper for API requests
async function apiFetch(path: string, options: AxiosRequestConfig = {}) {
  try {
    const res = await api({ url: path, ...options })
    return res.data
  } catch (err: any) {
    console.error(err)
    const message = (err.response && err.response.data?.message) || err.message || "API Error"
    throw new Error(message)
  }
}

// Create store with persistence
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated })
      },
      // Auth state
      user: null,
      isAuthLoading: false,
      login: async (email, password) => {
        set({ isAuthLoading: true })
        try {
          const data = await apiFetch("/users/login", {
            method: "POST",
            data: { email, password },
          })

          console.log("login response: ", data);
          setToken(data.token)
          console.log("token: ", data.token);
          const user = await apiFetch(`/users/${data.user._id}`)
          console.log("get user response: ", user);
          set({ user })
          const userCart = await apiFetch('/cart', {
            method: "GET",
          })
        } catch (error) {
          removeToken()
          set({ user: null })
          throw error
        } finally {
          set({ isAuthLoading: false })
        }
      },
      register: async (data) => {
        set({ isAuthLoading: true })
        try {
          await apiFetch("/users/register", {
            method: "POST",
            data,
          })
        } catch (error) {
          throw error
        } finally {
          set({ isAuthLoading: false })
        }
      },
      logout: () => {
        removeToken()
        set({ user: null, cartItems: [], tryonImages: [] })
      },
      updateUserProfile: async (data) => {
        set({ isAuthLoading: true })
        try {
          const user = get().user
          if (!user) throw new Error("Not logged in")
          const updated = await apiFetch(`/users/${user._id}`, {
            method: "PATCH",
            data,
          })
          set({ user: updated })
        } catch (error) {
          throw error
        } finally {
          set({ isAuthLoading: false })
        }
      },

      updateUserImage: async (data: any) => {
        set({ isAuthLoading: true });
        try {
          const user = get().user;
          if (!user) throw new Error("Not logged in");

          const res = await apiFetch(`/users/${user._id}/upload-image`, {
            method: "POST",
            data
          })

          set({ user: { ...user, image: res.url } })
        } catch (err) {
          console.log("UpdateUserImage Error :", err);
        } finally {
          set({ isAuthLoading: false })
        }
      },
      // Cart state
      cartItems: [],
      getCartItems: async () => {
        try {
          if (!get().user) {
            console.error("not logged in");
          }
          const res = await apiFetch("/cart");
          set({ cartItems: res.items });
          console.log("GetCartItems Response: ", res);
        } catch (err) {
          console.error("getCartItems Error :", err);
          throw err;
        }
      },
      addToCart: async (product, size, quantity) => {
        try {
          await apiFetch("/cart/add", {
            method: "POST",
            data: {
              product,
              size,
              quantity,
            },
          })
          const res = await apiFetch("/cart")
          set({ cartItems: res.items })

        } catch (error) {
          console.error(error)
          throw error
        }
      },
      removeFromCart: async (productId, size, quantity = 1) => {
        try {
          const removed = await apiFetch("/cart/remove", {
            method: "POST",
            data: { product: productId, size, quantity },
          })
          // remove the item from the persistence as well
          const newCartItems = get().cartItems.map((item) => {
            if (item.product === productId) {
              if (item.quantity === 1) {
                const itemsLeft: CartItem[] = get().cartItems.filter(item => item.product !== productId);
                set({ cartItems: itemsLeft.length >= 1 ? itemsLeft : [] });
              }
              return { ...item, quantity: item.quantity - quantity }
            }
            return item;
          }).filter((item) => item !== undefined);

          set({ cartItems: newCartItems });
          // const res = await apiFetch("/cart")
          // set({cartItems: res.items})
        } catch (error) {
          console.error(error)
          throw error
        }
      },
      removeProductFromCart: async (product, size) => {
        const removed = await apiFetch("/cart/remove-product", {
          method: "POST",
          data: { product, size }
        })

        const newCartItems = get().cartItems.filter(item => !(item.product === product && item.size === size));

        set({ cartItems: newCartItems })
      },
      updateQuantity: async (productId, size, quantity) => {
        await get().removeFromCart(
          productId,
          size,
          quantity
        );
        await get().addToCart(
          productId,
          size,
          quantity,
        )
      },
      clearCart: async () => {
        const cartItems = get().cartItems
        for (const item of cartItems) {
          try {
            // use clear cart endpoint
            await apiFetch("/cart/clear", {
              method: "POST"
            })
          } catch (error) {
            console.error(error)
          }
        }
        set({ cartItems: [] })
      },
      calculateSubtotal: () => {
        const cartItems = get().cartItems
        return cartItems.reduce((total, item) => {
          const itemPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price
          return total + itemPrice * item.quantity
        }, 0)
      },
      calculateTotal: () => {
        const subtotal = get().calculateSubtotal()
        const shipping = subtotal > 100 ? 0 : 10
        const tax = subtotal * 0.08
        return subtotal + shipping + tax
      },

      // Try-on state
      tryonImages: [],
      isTryonLoading: false,
      tryonError: null,
      getTryons: async () => {
        try {
          const user = get().user
          if (!user) return null
          const data = await apiFetch(`/tryon/all?user=${user._id}`)
          console.log("getTryons res : ", data);
          set({ tryonImages: data })
          return data
        } catch (error) {
          set({ tryonError: "Failed to fetch try-on images" })
          return null
        }
      },
      replaceProductImagesWithTryOns: async () => {
        await get().getTryons();
        const tryonProductImages = get().products.map((product) => {
          let productTryonImage = get().tryonImages.find(item => item.product === product._id)
          return {
            ...product,
            image: productTryonImage
          }
        })

        // set the products array to new products with tryon images of the user
        set({ products: tryonProductImages });
      },
      generateTryon: async (productId) => {
        set({ isTryonLoading: true, tryonError: null })
        try {
          const data = await apiFetch("/tryon", {
            method: "POST",
            data: { product: productId },
          })
          // the product tryon already exists update the image
          if (get().tryonImages.find(item => item.product == productId)) {
            const newTryonImages = get().tryonImages.map(item => {
              if (item.product === productId) {
                return {
                  ...item,
                  image: data.image
                }
              }
              return item;
            })
            set({ tryonImages: newTryonImages });
          }

          set((state) => ({ tryonImages: [...state.tryonImages, data] }))
          console.log("generateTryon Res ", data);
          return data
        } catch (error) {
          set({ tryonError: "Failed to generate try-on image" })
          return null
        } finally {
          set({ isTryonLoading: false })
        }
      },
      getTryonForProduct: (productId) => {
        return get().tryonImages.find((tryon) => tryon.product === productId) || null
      },

      // Orders CRUD
      createOrder: async (products, shippingAddress, notes = "") => {
        try {
          const data = await apiFetch("/orders", {
            method: "POST",
            data: { products, shippingAddress, notes },
          })
          return data
        } catch (error) {
          throw error
        }
      },
      getOrders: async (params?: Record<string, any>) => {
        try {
          const query = params ? "?" + new URLSearchParams(params).toString() : "";
          const data = await apiFetch(`/orders${query}`)
          return data
        } catch (error) {
          throw error
        }
      },
      getOrder: async (orderId) => {
        try {
          const data = await apiFetch(`/orders/${orderId}`)
          return data
        } catch (error) {
          throw error
        }
      },
      updateOrder: async (orderId, update) => {
        try {
          const data = await apiFetch(`/orders/${orderId}`, {
            method: "PATCH",
            data: update,
          })
          return data
        } catch (error) {
          throw error
        }
      },
      deleteOrder: async (orderId) => {
        try {
          await apiFetch(`/orders/${orderId}`, { method: "DELETE" })
        } catch (error) {
          throw error
        }
      },

      // Products CRUD
      products: [],
      getProducts: async (params) => {
        try {
          const query: any = params ? "?" + new URLSearchParams(params).toString() : ""
          const data = await apiFetch(`/products${query}`)
          set({ products: data.products })
          console.log("getProducts res: ", data);
          return data;
        } catch (error) {
          console.error(error)
          throw error
        }
      },
      getProduct: async (productId) => {
        try {
          const data = await apiFetch(`/products/${productId}`)
          return data
        } catch (error) {
          console.error(error)
          throw error
        }
      },
      createProduct: async (product) => {
        try {
          const data = await apiFetch("/products", {
            method: "POST",
            headers: {
              'Content-Type': "multipart/form-data"
            },
            data: product,
          })
          return data
        } catch (error) {
          throw error
        }
      },
      updateProduct: async (productId, update) => {
        try {
          const data = await apiFetch(`/products/${productId}`, {
            method: "PATCH",
            data: update,
          })
          return data
        } catch (error) {
          throw error
        }
      },
      deleteProduct: async (productId) => {
        try {
          await apiFetch(`/products/${productId}`, { method: "DELETE" })
        } catch (error) {
          throw error
        }
      },

      // User CRUD
      getUsers: async (params) => {
        try {
          const query = params ? "?" + new URLSearchParams(params).toString() : ""
          const data = await apiFetch(`/users${query}`)
          return data
        } catch (error) {
          throw error
        }
      },
      getUser: async (userId) => {
        try {
          const data = await apiFetch(`/users/${userId}`)
          return data
        } catch (error) {
          throw error
        }
      },
      deleteUser: async (userId) => {
        try {
          await apiFetch(`/users/${userId}`, { method: "DELETE" })
        } catch (error) {
          throw error
        }
      },

      // Sidebar state
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      openSidebar: () => set({ isSidebarOpen: true }),
      closeSidebar: () => set({ isSidebarOpen: false }),

      // Theme state
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "tryon-store",
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      skipHydration: typeof window === "undefined",
      partialize: (state) => ({
        user: state.user,
        cartItems: state.cartItems,
        tryonImages: state.tryonImages,
        theme: state.theme,
      }),
    },
  ),
)
