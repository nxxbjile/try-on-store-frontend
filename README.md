# Try-On Store Frontend

Frontend application for a fashion e-commerce experience with virtual try-on, Clerk authentication, cart and checkout flows, and Razorpay payment integration.

## What This Repo Contains

- Next.js App Router storefront UI
- Clerk-based authentication and protected routes
- Product browsing, search, categories, product detail pages
- Cart, checkout, and order history flows
- Admin area for product, order, and customer management
- Razorpay checkout integration (payment-first flow)

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand (state management)
- Axios (API client)
- Clerk (auth)
- Razorpay (payments)

## Prerequisites

- Node.js 20+
- pnpm 9+
- A running backend API compatible with this frontend contracts:
  - `API_README.md`
  - `PAYMENTS_API_CONTRACT.md`

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Fill in keys in `.env.local` (see Environment Variables below).

4. Start development server:

```bash
pnpm dev
```

5. Open:

- http://localhost:3000

## Environment Variables

The project includes `.env.example` with the required values.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public API base URL used by the frontend API client |
| `API_BASE_URL` | Recommended | Server-side API base URL used by middleware/admin checks (falls back to `NEXT_PUBLIC_API_BASE_URL`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for frontend auth |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key for server/middleware |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in route |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up route |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Yes | Post sign-in redirect |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Yes | Post sign-up redirect |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | Yes | Force redirect after sign-in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | Yes | Force redirect after sign-up |
| `RAZORPAY_TEST_KEY_ID` | Yes (payments) | Razorpay server key id |
| `RAZORPAY_TEST_KEY_SECRET` | Yes (payments) | Razorpay server key secret |
| `NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID` | Yes (payments) | Razorpay key id for client checkout |

## Scripts

- `pnpm dev` - Start local development server
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run Next.js lint checks

## Backend Compatibility

This frontend expects a backend implementing:

- User profile sync with Clerk token (`POST /users/me/sync`)
- Role-based access (`user`, `admin`)
- Product, cart, order, and try-on APIs
- Payments API (initiate, confirm-and-create-order, cancel intent)

Read the backend contracts in:

- `API_README.md`
- `PAYMENTS_API_CONTRACT.md`

Default local API base expected by frontend:

- `http://localhost:3001/api/v1`

## Authentication and Access

Protected areas include:

- `/cart`
- `/checkout`
- `/orders`
- `/profile`
- `/admin` (admin role required)

Notes:

- Auth is Clerk-based.
- Middleware validates auth for protected routes.
- Admin routes perform a backend role check via `/users/me`.

## Payment Flow (Razorpay)

This repo uses a payment-first checkout flow:

1. Create payment intent from cart snapshot (`/payments/initiate`)
2. Open Razorpay checkout on frontend
3. Confirm payment and create order in one call (`/payments/confirm-and-create-order`)
4. Optionally cancel intent (`/payments/cancel-intent`)

No webhook flow is assumed by default in the current contract.

## Project Structure (High Level)

- `app/` - Route segments and pages (storefront, auth, checkout, admin)
- `components/` - Reusable UI and domain components
- `lib/` - API client, app store, helpers, Razorpay loader
- `providers/` - Context providers
- `hooks/` - Shared React hooks
- `public/` - Static assets
- `styles/` - Global styles

## Deployment Notes

- Deployable to platforms like Vercel.
- Ensure all required env vars are configured in deployment settings.
- Confirm backend CORS and auth settings allow your frontend domain.

## Troubleshooting

- 401 on protected API routes:
  - Ensure Clerk is configured and user is signed in.
  - Ensure backend user profile is synced (`/users/me/sync`).

- Admin page redirects to home:
  - Verify backend returns `role: admin` from `/users/me`.

- Razorpay checkout fails to open:
  - Verify `NEXT_PUBLIC_RAZORPAY_TEST_KEY_ID` is set.
  - Check network access to `https://checkout.razorpay.com/v1/checkout.js`.

- Generic API errors:
  - Confirm `NEXT_PUBLIC_API_BASE_URL` points to a running backend.

## Security Notes

- Do not commit real secrets in `.env.local`.
- Rotate Clerk and Razorpay keys if they are exposed.
- Use test keys for development.

