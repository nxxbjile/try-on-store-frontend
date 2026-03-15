# Product Rich Text API Contract

This contract defines how frontend should create, edit, and display product rich text descriptions.

Base URL:
- Local: http://localhost:3001/api/v1

Auth:
- Admin token required for create/update product endpoints.
- Public access for read endpoints.

## 1. Rich Text Field

Canonical field:
- `descriptionRich` (string, optional)

Meaning:
- Stores HTML generated from admin WYSIWYG editor (CKEditor).
- Backend sanitizes HTML before persistence.
- Frontend should treat this field as read-only HTML on product details page.

## 2. Endpoints

### POST /products
Auth: admin
Content-Type: multipart/form-data OR application/json

Purpose:
- Create product with optional rich text description.

Request fields:
- `name` string required
- `category` enum required: shirt | t-shirt | pants
- `price` number required
- `discount` number optional
- `sizes` array or JSON string optional
- `stock` array or JSON string required
- `description` string optional (legacy/plain)
- `descriptionRich` string optional (HTML from WYSIWYG)
- `files` multiple image files optional (multipart only)

Example (multipart key-value semantics):
- name: "Linen Summer Shirt"
- category: "shirt"
- price: "2499"
- discount: "10"
- sizes: "[\"S\",\"M\",\"L\"]"
- stock: "[{\"size\":\"S\",\"quantity\":6},{\"size\":\"M\",\"quantity\":8}]"
- descriptionRich: "<h3>Fabric</h3><p>Premium linen blend.</p><ul><li>Breathable</li><li>Lightweight</li></ul>"

Success 201:
{
  "product": {
    "_id": "...",
    "name": "Linen Summer Shirt",
    "category": "shirt",
    "price": 2499,
    "discount": 10,
    "descriptionRich": "<h3>Fabric</h3><p>Premium linen blend.</p><ul><li>Breathable</li><li>Lightweight</li></ul>",
    "sizes": ["S", "M", "L"],
    "stock": [{ "size": "S", "quantity": 6 }, { "size": "M", "quantity": 8 }],
    "images": ["https://..."],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "notUploaded": []
}

Validation error 400:
{
  "errors": {
    "fieldName": ["message"]
  }
}

### PATCH /products/:id
Auth: admin
Content-Type: application/json

Purpose:
- Partial updates for product fields including rich text.

Request body example:
{
  "descriptionRich": "<h2>About Product</h2><p>Updated details with <strong>formatted</strong> text.</p>"
}

Success 200:
- Updated Product object including `descriptionRich`.

Errors:
- 400 validation errors
- 404 product not found

### GET /products
Auth: public

Purpose:
- Fetch product list with product objects that may include `descriptionRich`.

### GET /products/:id
Auth: public

Purpose:
- Fetch single product including `descriptionRich` for details page rendering.

## 3. Sanitization Rules (Backend)

Backend strips unsafe content from `descriptionRich`, including:
- script/style tags
- HTML comments
- inline event handlers (`onclick`, etc.)
- disallowed tags/attributes
- unsafe links (for example javascript: URLs)

Allowed formatting baseline:
- Tags: p, br, strong, b, em, i, u, ul, ol, li, a, h1, h2, h3, h4, blockquote
- Attributes for `a`: href, target, rel

Frontend note:
- Do not depend on unsupported tags/attributes; they may be removed on save.

## 4. Frontend Rendering Contract

Admin add/edit modal:
- Use CKEditor (or equivalent WYSIWYG) to edit rich description.
- Save HTML output directly into `descriptionRich`.

Product details page:
- Render `descriptionRich` only inside About Product section.
- Render as read-only HTML.
- Do not render rich description below title.
- If empty, show fallback text: "No product details yet".

## 5. Frontend AI Implementation Checklist

1. Add CKEditor field in product create modal bound to `descriptionRich`.
2. Add CKEditor field in product edit modal prefilled from API `descriptionRich`.
3. Ensure create submits `descriptionRich` in multipart form payload.
4. Ensure edit submits `descriptionRich` in PATCH JSON payload.
5. On details page, render sanitized `descriptionRich` in About Product section (read-only).
6. Hide/remove old description placement under title.
