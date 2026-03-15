import { create } from "zustand"
import { createJSONStorage, persist, StateStorage } from "zustand/middleware"
import { apiRequest, setInMemoryAuthToken } from "@/lib/api/client"

const storage: StateStorage =
  typeof window !== "undefined"
    ? window.localStorage
    : {
      getItem: async () => null,
      setItem: async () => { },
      removeItem: async () => { },
    }


const TAX_RATE = 0.18
const SHIPPING_FEE = 0

const roundCurrency = (value: number) => Math.round(value * 100) / 100
const normalizeId = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "_id" in value) {
    const maybeId = (value as { _id?: unknown })._id
    return typeof maybeId === "string" ? maybeId : ""
  }
  return ""
}

type PricingBreakdown = {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

function calculateCartPricing(cartItems: CartItem[]): PricingBreakdown {
  const subtotal = roundCurrency(
    cartItems.reduce((total, item) => {
      // If discount is "20" => 20%, if "0.2" => 20%
      const normalizedDiscount = item.discount
        ? item.discount > 1
          ? item.discount / 100
          : item.discount
        : 0

      const itemPrice = item.price * (1 - normalizedDiscount)
      return total + itemPrice * item.quantity
    }, 0),
  )

  const shipping = SHIPPING_FEE
  const tax = roundCurrency(subtotal * TAX_RATE)
  const total = roundCurrency(subtotal + shipping + tax)

  return { subtotal, shipping, tax, total }
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

type OrderProductInput = {
  product: string
  size: string
  quantity: number
}

type CreatePaymentOrderPayload = {
  items: OrderProductInput[]
  shippingAddress: string
  notes?: string
  method?: "razorpay" | "card" | "upi" | "netbanking" | "wallet" | "mock_prepaid"
  idempotencyKey?: string
}

type PaymentOrderResponse = {
  paymentIntent: {
    _id: string
    status: "pending" | "completed" | "failed" | "refunded" | "cancelled"
    amount: number
    checkoutSnapshot?: {
      items: Array<{
        product: string
        size: string
        quantity: number
        lineTotal: number
      }>
      shippingAddress: string
      notes?: string
      subtotal: number
      taxAmount: number
      totalAmount: number
      currency: string
    }
    providerPayload?: {
      razorpayOrderId?: string
      razorpayOrderAmount?: number
      razorpayOrderCurrency?: string
    }
  }
  razorpay: {
    keyId: string
    orderId: string
    amount: number
    currency: string
  }
  nextAction?: string
  instructions?: string
}

type VerifyPaymentPayload = {
  paymentIntentId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  providerPayload?: Record<string, unknown>
  idempotencyKey?: string
}

type VerifyPaymentResponse = {
  message?: string
  payment?: {
    _id: string
    status: "pending" | "completed" | "failed" | "refunded" | "cancelled"
  }
  order?: {
    _id: string
    paymentStatus?: string
    paymentId?: string
  }
}

type CancelPaymentIntentPayload = {
  paymentIntentId: string
  reason?: string
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
  updateUserImage: (data: any) => Promise<string | null>

  // Cart state
  cartItems: CartItem[]
  getCartItems: () => Promise<void>
  addToCart: (product: string, size: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string, size: string, quantity: number) => Promise<void>
  removeProductFromCart: (product: string, size: string) => Promise<void>
  updateQuantity: (productId: string, size: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  calculatePricingBreakdown: () => PricingBreakdown
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
  paymentInProgress: boolean
  paymentError: string | null
  createPaymentOrder: (payload: CreatePaymentOrderPayload) => Promise<PaymentOrderResponse>
  verifyPayment: (payload: VerifyPaymentPayload) => Promise<VerifyPaymentResponse>
  cancelPaymentIntent: (payload: CancelPaymentIntentPayload) => Promise<any>
  createOrder: (products: OrderProductInput[], shippingAddress: string, notes: string) => Promise<any>
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
  uploadProductMainImage: (productId: string, file: File) => Promise<string>
  uploadProductGalleryImage: (productId: string, file: File) => Promise<string>
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
  themePreset: "minimal" | "soft-contrast"
  setThemePreset: (preset: "minimal" | "soft-contrast") => void
  uiDensity: "comfortable" | "compact"
  setUiDensity: (density: "comfortable" | "compact") => void
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
          const data = await apiRequest("/users/login", {
            method: "POST",
            data: { email, password },
          })

          console.log("login response: ", data);
          setInMemoryAuthToken(data.token)
          console.log("token: ", data.token);
          const user = await apiRequest(`/users/${data.user._id}`)
          console.log("get user response: ", user);
          set({ user })
          const userCart = await apiRequest('/cart', {
            method: "GET",
          })
        } catch (error) {
          setInMemoryAuthToken(null)
          set({ user: null })
          throw error
        } finally {
          set({ isAuthLoading: false })
        }
      },
      register: async (data) => {
        set({ isAuthLoading: true })
        try {
          await apiRequest("/users/register", {
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
        setInMemoryAuthToken(null)
        set({ user: null, cartItems: [], tryonImages: [] })
      },
      updateUserProfile: async (data) => {
        set({ isAuthLoading: true })
        try {
          const user = get().user
          if (!user) throw new Error("Not logged in")
          const updated = await apiRequest(`/users/${user._id}`, {
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
          const currentUser = await apiRequest("/users/me", {
            method: "GET",
          })
          const userId = currentUser?._id

          if (!userId) {
            throw new Error("User profile not found")
          }

          const res = await apiRequest(`/users/${userId}/upload-image`, {
            method: "POST",
            data
          })

          const storeUser = get().user
          if (storeUser) {
            set({ user: { ...storeUser, image: res.url } })
          }

          return typeof res?.url === "string" ? res.url : null
        } catch (err) {
          console.log("UpdateUserImage Error :", err);
          throw err
        } finally {
          set({ isAuthLoading: false })
        }
      },
      // Cart state
      cartItems: [],
      getCartItems: async () => {
        try {
          const res = await apiRequest("/cart")
          set({ cartItems: res.items })
        } catch (err: any) {
          const message = err?.message?.toLowerCase?.() || ""
          const isAuthError =
            message.includes("authentication required") ||
            message.includes("unauthorized") ||
            message.includes("401") ||
            message.includes("not logged in")

          if (isAuthError) {
            set({ cartItems: [] })
            return
          }

          throw err
        }
      },
      addToCart: async (product, size, quantity) => {
        try {
          await apiRequest("/cart/add", {
            method: "POST",
            data: {
              product,
              size,
              quantity,
            },
          })
          const res = await apiRequest("/cart")
          set({ cartItems: res.items })

        } catch (error) {
          console.error(error)
          throw error
        }
      },
      removeFromCart: async (productId, size, quantity = 1) => {
        try {
          const removed = await apiRequest("/cart/remove", {
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
          // const res = await apiRequest("/cart")
          // set({cartItems: res.items})
        } catch (error) {
          console.error(error)
          throw error
        }
      },
      removeProductFromCart: async (product, size) => {
        const removed = await apiRequest("/cart/remove-product", {
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
            await apiRequest("/cart/clear", {
              method: "POST"
            })
          } catch (error) {
            console.error(error)
          }
        }
        set({ cartItems: [] })
      },
      calculatePricingBreakdown: () => {
        return calculateCartPricing(get().cartItems)
      },
      calculateSubtotal: () => {
        return get().calculatePricingBreakdown().subtotal
      },
      calculateTotal: () => {
        return get().calculatePricingBreakdown().total
      },

      // Try-on state
      tryonImages: [],
      isTryonLoading: false,
      tryonError: null,
      getTryons: async () => {
        try {
          const user = get().user
          if (!user) return null
          const data = await apiRequest(`/tryon/all?user=${user._id}`)
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
          const data = await apiRequest("/tryon", {
            method: "POST",
            data: { product: productId },
          })

          // Upsert latest try-on for this product instead of duplicating stale entries.
          const targetProductId = normalizeId(productId)
          set((state) => {
            const index = state.tryonImages.findIndex(
              (item) => normalizeId(item.product) === targetProductId,
            )

            if (index >= 0) {
              const next = [...state.tryonImages]
              next[index] = { ...next[index], ...data }
              return { tryonImages: next }
            }

            return { tryonImages: [...state.tryonImages, data] }
          })

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
        const targetProductId = normalizeId(productId)
        const tryons = get().tryonImages

        // Search from the end so the latest generated record wins.
        for (let i = tryons.length - 1; i >= 0; i -= 1) {
          if (normalizeId(tryons[i].product) === targetProductId) {
            return tryons[i]
          }
        }

        return null
      },

      // Orders CRUD
      paymentInProgress: false,
      paymentError: null,
      createPaymentOrder: async (payload) => {
        set({ paymentInProgress: true, paymentError: null })
        try {
          const data = await apiRequest("/payments/initiate", {
            method: "POST",
            data: {
              items: payload.items,
              shippingAddress: payload.shippingAddress,
              ...(payload.notes ? { notes: payload.notes } : {}),
              method: payload.method || "razorpay",
              ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
            },
          })

          return data as PaymentOrderResponse
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create payment order"
          set({ paymentError: message })
          throw error
        } finally {
          set({ paymentInProgress: false })
        }
      },
      verifyPayment: async (payload) => {
        set({ paymentInProgress: true, paymentError: null })
        try {
          const data = await apiRequest("/payments/confirm-and-create-order", {
            method: "POST",
            data: {
              paymentIntentId: payload.paymentIntentId,
              razorpay_order_id: payload.razorpay_order_id,
              razorpay_payment_id: payload.razorpay_payment_id,
              razorpay_signature: payload.razorpay_signature,
              ...(payload.providerPayload ? { providerPayload: payload.providerPayload } : {}),
              ...(payload.idempotencyKey ? { idempotencyKey: payload.idempotencyKey } : {}),
            },
          })

          return data as VerifyPaymentResponse
        } catch (error) {
          const message = error instanceof Error ? error.message : "Payment verification failed"
          set({ paymentError: message })
          throw error
        } finally {
          set({ paymentInProgress: false })
        }
      },
      cancelPaymentIntent: async (payload) => {
        try {
          const data = await apiRequest("/payments/cancel-intent", {
            method: "POST",
            data: {
              paymentIntentId: payload.paymentIntentId,
              ...(payload.reason ? { reason: payload.reason } : {}),
            },
          })
          return data
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to cancel payment intent"
          set({ paymentError: message })
          throw error
        }
      },
      createOrder: async (products, shippingAddress, notes = "") => {
        try {
          const data = await apiRequest("/orders", {
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
          const data = await apiRequest(`/orders${query}`)
          return data
        } catch (error) {
          throw error
        }
      },
      getOrder: async (orderId) => {
        try {
          const data = await apiRequest(`/orders/${orderId}`)
          return data
        } catch (error) {
          throw error
        }
      },
      updateOrder: async (orderId, update) => {
        try {
          const data = await apiRequest(`/orders/${orderId}`, {
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
          await apiRequest(`/orders/${orderId}`, { method: "DELETE" })
        } catch (error) {
          throw error
        }
      },

      // Products CRUD
      products: [],
      getProducts: async (params) => {
        try {
          const query: any = params ? "?" + new URLSearchParams(params).toString() : ""
          const data = await apiRequest(`/products${query}`)
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
          const data = await apiRequest(`/products/${productId}`)
          return data
        } catch (error) {
          console.error(error)
          throw error
        }
      },
      createProduct: async (product) => {
        try {
          const data = await apiRequest("/products", {
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
          const data = await apiRequest(`/products/${productId}`, {
            method: "PATCH",
            data: update,
          })
          return data
        } catch (error) {
          throw error
        }
      },
      uploadProductMainImage: async (productId, file) => {
        try {
          const formData = new FormData()
          formData.append("file", file)

          const data = await apiRequest<{ url: string }>(`/products/${productId}/upload-main-image`, {
            method: "POST",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            data: formData,
          })

          return data.url
        } catch (error) {
          throw error
        }
      },
      uploadProductGalleryImage: async (productId, file) => {
        try {
          const formData = new FormData()
          formData.append("file", file)

          const data = await apiRequest<{ url: string }>(`/products/${productId}/upload-gallery-image`, {
            method: "POST",
            headers: {
              "Content-Type": "multipart/form-data",
            },
            data: formData,
          })

          return data.url
        } catch (error) {
          throw error
        }
      },
      deleteProduct: async (productId) => {
        try {
          await apiRequest(`/products/${productId}`, { method: "DELETE" })
        } catch (error) {
          throw error
        }
      },

      // User CRUD
      getUsers: async (params) => {
        try {
          const query = params ? "?" + new URLSearchParams(params).toString() : ""
          const data = await apiRequest(`/users${query}`)
          return data
        } catch (error) {
          throw error
        }
      },
      getUser: async (userId) => {
        try {
          const data = await apiRequest(`/users/${userId}`)
          return data
        } catch (error) {
          throw error
        }
      },
      deleteUser: async (userId) => {
        try {
          await apiRequest(`/users/${userId}`, { method: "DELETE" })
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
      themePreset: "minimal",
      setThemePreset: (themePreset) => set({ themePreset }),
      uiDensity: "comfortable",
      setUiDensity: (uiDensity) => set({ uiDensity }),
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
        themePreset: state.themePreset,
        uiDensity: state.uiDensity,
        paymentError: state.paymentError,
      }),
    },
  ),
)
