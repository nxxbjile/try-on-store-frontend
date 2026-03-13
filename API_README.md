# API Integration Readme

This is the frontend contract for the current backend implementation.

Base URL:
- Local: http://localhost:3001/api/v1

Authentication type:
- Clerk bearer token
- Header on protected routes: Authorization: Bearer <clerk_session_token>

## 1. Auth Bootstrapping Frontend Must Do

1. Sign in user on frontend using Clerk.
2. Call POST /users/me/sync after login (or on app bootstrap) to ensure Mongo user exists.
3. Call GET /users/me and cache role.
4. Call business routes.

If token is valid but local profile is missing, protected routes return:
- 401
- { "message": "User profile not found. Sync user profile before accessing protected routes" }

## 2. Common Error Shapes

This API is not fully envelope-standardized. Handle both:

1. Message-based errors:
- { "message": "..." }

2. Validation errors (Zod):
- { "errors": { "field": ["message"] } }

Frontend recommendation:
- if response.errors exists, show field errors
- else if response.message exists, show message
- else show generic error

## 3. Roles and Access

Role source:
- Mongo User.role
- values: user | admin

Admin-only routes:
- GET /users
- POST /products
- PATCH /products/:id
- DELETE /products/:id
- POST /products/:id/upload-main-image
- POST /products/:id/upload-gallery-image
- POST /products/:id/stock
- PATCH /products/:id/stock

Owner/admin routes:
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id
- POST /users/:id/upload-image
- GET /orders/:id
- PATCH /orders/:id
- DELETE /orders/:id
- PATCH /tryon/:id
- DELETE /tryon/:id

Authenticated routes:
- POST /users/me/sync
- GET /users/me
- POST /orders
- GET /orders
- all /cart routes
- POST /products/:id/buy
- GET /tryon
- GET /tryon/all
- POST /tryon

Public routes:
- GET /products
- GET /products/:id

## 4. Users API

### POST /users/me/sync
Auth: required

Purpose:
- create or update local Mongo user linked to Clerk id

Body JSON:
- name: string (required only when creating first profile)
- email: string (required only when creating first profile)
- image: string URL optional
- address: string optional
- phone: string optional

Success:
- 201 on create
- 200 on update
- returns full User object

Example response:
{
  "_id": "...",
  "clerkId": "user_...",
  "name": "Jane",
  "email": "jane@example.com",
  "address": "...",
  "phone": "...",
  "role": "user",
  "image": "https://...",
  "createdAt": "...",
  "updatedAt": "..."
}

Errors:
- 400 with errors object for invalid format
- 400 when first-time create misses name/email
- 401 auth required
- 409 duplicate email/clerk id

### GET /users/me
Auth: required

Success 200:
- full User object for authenticated caller

Errors:
- 401 auth required
- 401 profile not synced

### GET /users
Auth: admin

Query params:
- page default 1
- limit default 20
- search optional (name/email/address/phone contains)
- any extra query keys act as filters

Success 200:
{
  "users": [User],
  "count": 123,
  "page": "1",
  "per_page": 20,
  "total_pages": 7
}

Errors:
- 403 forbidden

### GET /users/:id
Auth: self or admin

Success 200:
- User object

Errors:
- 403 forbidden
- 404 not found

### PATCH /users/:id
Auth: self or admin

Body JSON accepted:
- name
- email
- address
- phone
- image

Ignored if sent:
- role

Success 200:
- updated User object

Errors:
- 400 zod errors
- 403 forbidden
- 404 not found

### DELETE /users/:id
Auth: self or admin

Success 200:
{ "message": "User deleted" }

### POST /users/:id/upload-image
Auth: self or admin
Content-Type: multipart/form-data

Form field:
- file (required)

Success 200:
{ "url": "https://public-supabase-url" }

Errors:
- 400 no file uploaded
- 500 upload failed

## 5. Products API

### GET /products
Auth: public

Query params:
- category
- name (contains, case-insensitive)
- size
- sort (default createdAt)
- order (asc or desc, default desc)
- page (default 1)
- limit (default 20)

Success 200:
{
  "products": [Product],
  "count": 200,
  "page": 1,
  "per_page": 20,
  "total_pages": 10
}

### GET /products/:id
Auth: public

Success 200:
- Product object

Errors:
- 404 not found

### POST /products
Auth: admin
Content-Type: JSON or multipart/form-data

Body fields used:
- name
- category (shirt | t-shirt | pants)
- description optional
- price
- discount optional
- sizes array OR JSON string
- stock array OR JSON string
- files (optional, multiple)

Success 201:
{
  "product": Product,
  "notUploaded": ["error uploading : file1.png"]
}

Errors:
- 403 non-admin
- 500 create failure

### PATCH /products/:id
Auth: admin

Body:
- partial product fields

Success 200:
- updated Product

Errors:
- 400 validation errors
- 404 product not found

### DELETE /products/:id
Auth: admin

Success 200:
{ "message": "Product deleted" }

### POST /products/:id/upload-main-image
Auth: admin
Content-Type: multipart/form-data
Form field: file

Success 200:
{ "url": "https://.../main.ext?t=timestamp" }

### POST /products/:id/upload-gallery-image
Auth: admin
Content-Type: multipart/form-data
Form field: file

Success 200:
{ "url": "https://..." }

### POST /products/:id/stock
Auth: admin

Body:
- size: string
- color: string
- quantity: number

Success 201:
- Product object

Errors:
- 400 missing fields
- 404 product not found
- 409 duplicate stock entry

### PATCH /products/:id/stock
Auth: admin

Body:
- size: string
- color: string
- quantity: number

Success 200:
- Product object

Errors:
- 400 missing fields
- 404 stock entry missing

### POST /products/:id/buy
Auth: authenticated

Body:
- size: string required
- color: string required
- quantity: number optional default 1
- shippingAddress: string required

Success 201:
- created Order object

Errors:
- 400 required fields missing
- 400 insufficient stock
- 404 user not found
- 404 product not found

## 6. Orders API

### POST /orders
Auth: authenticated

Body:
{
  "products": [
    {
      "product": "productId",
      "size": "M",
      "quantity": 2
    }
  ],
  "shippingAddress": "...",
  "notes": "optional"
}

Success 201:
- created Order object

Errors:
- 400 zod errors
- 400 product not found
- 400 insufficient stock

### GET /orders
Auth: authenticated

Behavior:
- user role gets own orders only
- admin role gets all orders, or filtered by query.user

Query params:
- page default 1
- limit default 20
- user (admin filter)
- any additional query keys are applied as filters

Success 200:
{
  "success": true,
  "orders": [Order],
  "count": 30,
  "per_page": "20",
  "page": "1",
  "total_pages": 2
}

### GET /orders/:id
Auth: owner or admin

Success 200:
- Order with populated user and products.product

Errors:
- 403 forbidden
- 404 not found

### PATCH /orders/:id
Auth: owner or admin

Body:
- any order fields (current implementation is permissive)

Success 200:
- updated Order

### DELETE /orders/:id
Auth: owner or admin

Success 200:
{ "message": "Order deleted" }

## 7. Cart API

### GET /cart
Auth: authenticated

Query:
- user (admin can read specific user cart)

Success 200:
- if empty/not found: { "items": [] }
- otherwise:
{
  "items": [
    {
      "product": "productId",
      "name": "...",
      "price": 100,
      "discount": 0,
      "images": ["..."],
      "quantity": 2,
      "size": "M"
    }
  ]
}

### POST /cart/add
Auth: authenticated

Body:
- product: string required
- quantity: number optional default 1
- size: string

Success 200:
{ "items": [ ... ] }

Errors:
- 400 product is required
- 400 quantity must be at least 1

### POST /cart/remove
Auth: authenticated

Body:
- product: string
- quantity: number optional default 1
- size: string

Success 200:
{ "items": [ ... ] }

Errors:
- 404 cart not found

### POST /cart/remove-product
Auth: authenticated

Body:
- product: string
- size: string

Success 200:
{ "message": "Product removed" }

Known edge case:
- If cart does not exist, implementation may throw and return 500.

### POST /cart/clear
Auth: authenticated

Body:
- user optional (intended for admin clear another user)

Success 200:
{ "message": "Cart Cleared" }

Errors:
- 404 cart not found

### POST /cart/book
Auth: authenticated

Body:
- products: string[] required
- shippingAddress: string required

Success 201:
{
  "order": Order,
  "cart": Cart
}

Errors:
- 400 no products
- 400 shippingAddress missing
- 404 cart not found
- 400 some products not found

## 8. Try-On API

### GET /tryon
Auth: authenticated

Query:
- product: required
- user: optional (admin only practical use)

Behavior:
- non-admin always resolves to own user
- admin can query another user or defaults to own

Success 200:
- Tryon object

Errors:
- 400 product is required
- 403 forbidden cross-user for non-admin
- 404 tryon not found

### GET /tryon/all
Auth: authenticated

Query:
- user optional (admin can choose)

Success 200:
- Tryon[]

### POST /tryon
Auth: authenticated

Body:
- product: productId required

Success 201:
- created Tryon object

Errors:
- 400 product is required
- 400 user or user image not found
- 400 product or product image not found
- 500 external API/storage errors

### PATCH /tryon/:id
Auth: owner or admin

Body:
- image optional (only this field is applied)

Success 200:
- updated Tryon object

### DELETE /tryon/:id
Auth: owner or admin

Success 200:
{ "message": "Tryon deleted" }

## 9. Practical Frontend Checklist

1. Always call /users/me/sync after auth.
2. Cache /users/me and branch UI by role.
3. For try-on, require profile image before allowing action.
4. Handle both errors and message error formats.
5. Parse pagination fields defensively (some are strings).
6. Retry after sync when backend returns profile-not-found 401.

## 10. Known Contract Mismatches to Keep in Mind

1. Product stock model currently stores size and quantity, but some endpoints also expect color.
2. /cart/clear route uses middleware designed for an :id route pattern and may need backend cleanup.
3. Error payload shape is not fully standardized across controllers.

If you want, next I can standardize these endpoints so frontend has one consistent response envelope and strictly typed behavior.
