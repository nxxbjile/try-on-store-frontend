# Try-On Store Backend API Documentation

A robust, headless, decoupled backend for a fashion e-commerce platform with user, product, order, cart, and try-on management. Built with Node.js, Express, MongoDB, Supabase Storage, and more.

---

## Table of Contents

- [Setup](#setup)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Users](#users)
  - [Products](#products)
  - [Orders](#orders)
  - [Cart](#cart)
  - [Tryon](#tryon)
- [Image Upload](#image-upload)
- [Roles & Permissions](#roles--permissions)
- [Seeding](#seeding)
- [Environment Variables](#environment-variables)
- [Request Fields & Params](#request-fields--params)
- [CORS](#cors)

---

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values.

3. **Run the server:**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000/api/v1/`

---

## Authentication

- **Register:** `POST /api/v1/users/register`
- **Login:** `POST /api/v1/users/login`
- All protected routes require a JWT token in the `Authorization` header:  
  `Authorization: Bearer <token>`

---

## API Endpoints

### Users

| Method | Endpoint                       | Description                                 | Auth         |
|--------|------------------------------- |---------------------------------------------|--------------|
| POST   | `/users/register`              | Register a new user                         | No           |
| POST   | `/users/login`                 | Login, returns JWT token                    | No           |
| GET    | `/users`                       | Get all users (admin only, paginated)       | Admin        |
| GET    | `/users/:id`                   | Get own user data                           | User/Admin   |
| PATCH  | `/users/:id`                   | Update own user data                        | User/Admin   |
| DELETE | `/users/:id`                   | Delete own user                             | User/Admin   |
| POST   | `/users/:id/upload-image`      | Upload user profile image                   | User/Admin   |

### Products

| Method | Endpoint                                | Description                                 | Auth         |
|--------|---------------------------------------- |---------------------------------------------|--------------|
| GET    | `/products`                             | List products (filter, pagination)          | User/Admin   |
| GET    | `/products/:id`                         | Get product details                         | User/Admin   |
| POST   | `/products`                             | Create product (optionally with image)      | Admin        |
| PATCH  | `/products/:id`                         | Update product                              | Admin        |
| DELETE | `/products/:id`                         | Delete product                              | Admin        |
| POST   | `/products/:id/upload-main-image`       | Upload/replace main image                   | Admin        |
| POST   | `/products/:id/upload-gallery-image`    | Upload gallery image                        | Admin        |
| POST   | `/products/:id/buy`                     | Buy a product (creates order)               | User/Admin   |
| POST   | `/products/:id/stock`                   | Add stock entry (size, color, quantity)     | Admin        |
| PATCH  | `/products/:id/stock`                   | Update stock quantity for size/color        | Admin        |

### Orders

| Method | Endpoint              | Description                                 | Auth         |
|--------|---------------------- |---------------------------------------------|--------------|
| POST   | `/orders`             | Create order                                | User/Admin   |
| GET    | `/orders`             | List orders (user: own, admin: all)         | User/Admin   |
| GET    | `/orders/:id`         | Get order details                           | User/Admin   |
| PATCH  | `/orders/:id`         | Update order                                | User/Admin   |
| DELETE | `/orders/:id`         | Delete order                                | User/Admin   |

### Cart

| Method | Endpoint         | Description                        | Auth       |
|--------|------------------|------------------------------------|------------|
| GET    | `/cart`          | Get current user's cart (products) | User/Admin |
| POST   | `/cart/add`      | Add product to cart                | User/Admin |
| POST   | `/cart/remove`   | Remove product from cart           | User/Admin |
| POST   | `/cart/book`     | Book (checkout) products from cart | User/Admin |

### Tryon

| Method | Endpoint              | Description                                 | Auth         |
|--------|---------------------- |---------------------------------------------|--------------|
| GET    | `/tryon?user=&product=` | Get a tryon for a user/product           | User/Admin   |
| POST   | `/tryon`              | Create a tryon (generates tryon image)      | User/Admin   |
| PATCH  | `/tryon/:id`          | Update tryon image                          | User/Admin   |
| DELETE | `/tryon/:id`          | Delete tryon                                | User/Admin   |

---

## Image Upload

- **User images** are uploaded to Supabase Storage at `users/[userId]/raw/filename`.
- **Product main image:** `products/[productId]/main.ext`
- **Product gallery images:** `products/[productId]/gallery/filename`
- **Tryon images:** `users/[userId]/tryon/filename`

Send images as `multipart/form-data` with the field name `file`.

---

## Roles & Permissions

- **User:** Can only access and modify their own data, see products, buy products, see and manage their own orders, cart, and tryons.
- **Admin:** Can manage all users, products, orders, cart, and tryons.

---

## Seeding

To seed 20 fake users:

```bash
node src/seedUsers.js
```

---

## Environment Variables

See `.env.example` for all required variables:

- `MONGO_URI`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAPIDAPI_KEY` (for tryon image generation)
- `FRONTEND_URL` (allowed frontend origin for CORS, e.g. `http://localhost:5173`)

---

## Request Fields & Params

### Users

#### Register (`POST /users/register`)
- **Body (JSON):**
  - `name` (string, required)
  - `email` (string, required)
  - `password` (string, required, min 6 chars)
  - `address` (string, optional)
  - `phone` (string, optional)

#### Login (`POST /users/login`)
- **Body (JSON):**
  - `email` (string, required)
  - `password` (string, required)

#### Update User (`PATCH /users/:id`)
- **Body (JSON):**
  - Any of: `name`, `email`, `address`, `phone`

#### Upload User Image (`POST /users/:id/upload-image`)
- **FormData:**
  - `file` (image file, required)

---

### Products

#### Create Product (`POST /products`)
- **Body (JSON or FormData):**
  - `name` (string, required)
  - `description` (string, optional)
  - `category` (string, required: "shirt", "t-shirt", "pants")
  - `price` (number, required)
  - `discount` (number, optional)
  - `sizes` (array of strings, optional)
  - `colors` (array of strings, optional)
  - `stock` (array of objects, required):  
    Each object: `{ size: string, color: string, quantity: number }`
  - `file` (image file, optional, FormData only)

#### Update Product (`PATCH /products/:id`)
- **Body (JSON):**
  - Any updatable product fields

#### Upload Main Image (`POST /products/:id/upload-main-image`)
- **FormData:**
  - `file` (image file, required)

#### Upload Gallery Image (`POST /products/:id/upload-gallery-image`)
- **FormData:**
  - `file` (image file, required)

#### Buy Product (`POST /products/:id/buy`)
- **Body (JSON):**
  - `size` (string, required)
  - `color` (string, required)
  - `quantity` (number, optional, default 1)
  - `shippingAddress` (string, required)

#### Add Product Stock (`POST /products/:id/stock`)
- **Body (JSON):**
  - `size` (string, required)
  - `color` (string, required)
  - `quantity` (number, required)

#### Update Product Stock (`PATCH /products/:id/stock`)
- **Body (JSON):**
  - `size` (string, required)
  - `color` (string, required)
  - `quantity` (number, required)

---

### Orders

#### Create Order (`POST /orders`)
- **Body (JSON):**
  - `products` (array, required):  
    Each object: `{ product: string, size: string, color: string, quantity: number }`
  - `shippingAddress` (string, required)

#### Get Orders (`GET /orders`)
- **Query Params:**
  - `page` (number, optional)
  - `limit` (number, optional)
  - `user` (string, admin only, optional)

---

### Cart

#### Get Cart (`GET /cart`)
- No params. Returns the user's cart with product details.

#### Add to Cart (`POST /cart/add`)
- **Body (JSON):**
  - `product` (string, required)

#### Remove from Cart (`POST /cart/remove`)
- **Body (JSON):**
  - `product` (string, required)

#### Book Cart Items (`POST /cart/book`)
- **Body (JSON):**
  - `products` (array of product ids, required)
  - `shippingAddress` (string, required)

---

### Tryon

#### Get Tryon (`GET /tryon`)
- **Query Params:**
  - `user` (string, required)
  - `product` (string, required)

#### Create Tryon (`POST /tryon`)
- **Body (JSON):**
  - `product` (string, required)

#### Update Tryon (`PATCH /tryon/:id`)
- **Body (JSON):**
  - `image` (string, required)

---

## CORS

CORS (Cross-Origin Resource Sharing) is **enabled** for all routes using the `cors` middleware.  
By default, only requests from the URL specified in `FRONTEND_URL` are allowed.  
If `FRONTEND_URL` is not set, all origins are allowed (not recommended for production).

---

## Notes

- All endpoints return JSON.
- Pagination: Use `?page=<n>&limit=<n>` on list endpoints.
- Filtering: Pass query params matching model fields.
- For tryon generation, the backend uses an external API (RapidAPI) and stores the result in Supabase Storage.

---

## License

MIT

