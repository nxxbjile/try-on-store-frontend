# Payments API Contract (Payment-First Checkout, Razorpay, No Webhook)

This contract defines how frontend should integrate payments with the current backend implementation.

Base URL:
- Local: http://localhost:3001/api/v1

Payments route prefix:
- /payments

Auth model:
- Protected endpoints require Clerk token.
- Header: Authorization: Bearer <clerk_session_token>

Provider:
- Razorpay Test mode via server-side SDK.
- Server uses:
  - RAZORPAY_TEST_KEY_ID
  - RAZORPAY_TEST_KEY_SECRET

No webhook flow:
- This implementation does not use payment webhooks.
- Payment success is confirmed by frontend calling POST /payments/confirm-and-create-order with Razorpay signature payload.

Idempotency:
- Supported on initiate and confirm.
- Provide via either:
1. body.idempotencyKey
2. x-idempotency-key header
- Body value has precedence.

---

## 1. Payment Domain

### 1.1 Payment Object

```json
{
  "_id": "66f...",
  "order": "66e...",
  "user": "66d...",
  "amount": 2399.82,
  "currency": "INR",
  "method": "razorpay",
  "status": "pending",
  "initiateIdempotencyKey": "init:66e:1",
  "confirmIdempotencyKey": "confirm:66e:pay_abc",
  "gatewayTransactionId": "pay_abc123",
  "providerPayload": {
    "razorpayOrderId": "order_Qabc123",
    "razorpayOrderStatus": "created",
    "razorpayOrderReceipt": "ord_66e...",
    "razorpayOrderAmount": 239982,
    "razorpayOrderCurrency": "INR",
    "razorpayPaymentId": "pay_abc123",
    "razorpaySignature": "..."
  },
  "paidAt": "2026-03-14T12:00:00.000Z",
  "createdAt": "2026-03-14T11:58:00.000Z",
  "updatedAt": "2026-03-14T12:00:00.000Z"
}
```

### 1.2 Status Enum
- pending
- completed
- failed
- refunded

### 1.3 Valid Order Rule
- Order is created only after successful payment confirmation.
- There is no unpaid order created during checkout initiation.
- An order is valid for fulfillment only when order.paymentStatus === "completed".

---

## 2. Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /payments/initiate | User/Admin | Create payment intent + Razorpay order from cart snapshot |
| POST | /payments/confirm-and-create-order | User/Admin | Verify Razorpay payment and create order in one transaction |
| POST | /payments/cancel-intent | User/Admin | Mark payment intent as cancelled without creating order |
| GET | /payments/order/:orderId | User/Admin | Fetch payment by internal order id |
| GET | /payments/:id | User/Admin | Fetch payment by payment id |

---

## 3. Detailed API Contracts

## 3.1 POST /payments/initiate

Creates or reuses a pending Payment Intent and ensures a Razorpay Order exists.

Auth:
- Required
- Caller must be owner of order or admin

Headers:
- Authorization: Bearer <token>
- x-idempotency-key: <optional>

Body:
```json
{
  "items": [
    {
      "product": "66p...",
      "size": "M",
      "quantity": 1
    }
  ],
  "shippingAddress": "221B Baker Street",
  "notes": "Leave at door",
  "method": "razorpay",
  "idempotencyKey": "init:66e:1"
}
```

Validation:
- items: optional (if omitted, full cart is used)
- shippingAddress: required string
- notes: optional string
- method: optional enum [razorpay, card, upi, netbanking, wallet, mock_prepaid]
- idempotencyKey: optional trimmed string (1..128)

Success 200:
```json
{
  "paymentIntent": {
    "_id": "66f...",
    "status": "pending",
    "amount": 2399.82,
    "checkoutSnapshot": {
      "items": [
        {
          "product": "66p...",
          "name": "Premium Shirt",
          "size": "M",
          "quantity": 1,
          "priceAtCheckout": 1999,
          "discountAtCheckout": 10,
          "lineTotal": 1799.1
        }
      ],
      "shippingAddress": "221B Baker Street",
      "notes": "Leave at door",
      "subtotal": 1799.1,
      "taxAmount": 323.84,
      "totalAmount": 2122.94,
      "currency": "INR"
    },
    "providerPayload": {
      "razorpayOrderId": "order_Qabc123",
      "razorpayOrderAmount": 239982,
      "razorpayOrderCurrency": "INR"
    }
  },
  "razorpay": {
    "keyId": "rzp_test_xxx",
    "orderId": "order_Qabc123",
    "amount": 239982,
    "currency": "INR"
  },
  "nextAction": "open_razorpay_checkout",
  "instructions": "Use Razorpay Checkout, then POST /payments/confirm-and-create-order"
}
```

Behavior:
1. No internal order is created here.
2. Frozen cart snapshot is stored in payment intent.
3. If idempotency key matches an existing pending intent for this user, existing intent is reused.
4. If checkout payload is invalid against cart (missing items or excess quantity), request fails.

Errors:
- 400 validation error / already paid
- 403 forbidden
- 404 not applicable in initiate flow
- 409 duplicate idempotency conflict
- 500 Razorpay not configured / internal

---

## 3.2 POST /payments/confirm-and-create-order

Verifies Razorpay signature and creates internal order in the same DB transaction.

Auth:
- Required
- Caller must be owner of order or admin

Headers:
- Authorization: Bearer <token>
- x-idempotency-key: <optional>

Body:
```json
{
  "paymentIntentId": "66f...",
  "razorpay_order_id": "order_Qabc123",
  "razorpay_payment_id": "pay_abc123",
  "razorpay_signature": "generated_by_razorpay_checkout",
  "providerPayload": {
    "checkoutSource": "web"
  },
  "idempotencyKey": "confirm:66e:pay_abc123"
}
```

Validation:
- paymentIntentId: required
- razorpay_order_id: required
- razorpay_payment_id: required
- razorpay_signature: required
- providerPayload: optional object
- idempotencyKey: optional trimmed string (1..128)

Success 200:
```json
{
  "message": "Payment completed and order created",
  "payment": {
    "_id": "66f...",
    "status": "completed",
    "gatewayTransactionId": "pay_abc123",
    "confirmIdempotencyKey": "confirm:66e:pay_abc123",
    "paidAt": "2026-03-14T12:00:00.000Z"
  },
  "order": {
    "_id": "66e...",
    "paymentStatus": "completed",
    "paymentId": "66f..."
  }
}
```

Idempotent duplicate 200:
```json
{
  "message": "Duplicate confirm call handled idempotently",
  "payment": { "...": "..." },
  "order": { "...": "..." }
}
```

Already completed 200:
```json
{
  "message": "Payment already completed",
  "payment": { "...": "..." },
  "order": { "...": "..." }
}
```

Behavior:
1. Signature verification performed as HMAC_SHA256(secret, "<razorpay_order_id>|<razorpay_payment_id>").
2. paymentIntent.razorpayOrderId must match submitted razorpay_order_id.
3. Stock is revalidated from frozen snapshot before creating order.
4. On success:
- payment.status => completed
- create order document (first time)
- order.paymentStatus => completed
- payment.gatewayTransactionId => razorpay_payment_id
- booked cart items for this order are removed
5. Repeated confirms are idempotent and return same created order.

Errors:
- 400 invalid body / invalid signature / mismatched razorpay order id / stock failure
- 403 forbidden (not owner/admin)
- 404 payment intent not found
- 409 duplicate transaction/idempotency collision
- 500 internal

---

## 3.3 POST /payments/cancel-intent

Marks pending payment intent as cancelled (no order creation, no cart mutation).

Auth:
- Required
- Caller must be owner or admin

Body:
```json
{
  "paymentIntentId": "66f...",
  "reason": "user closed checkout"
}
```

Success 200:
```json
{
  "message": "Payment intent cancelled",
  "paymentIntent": { "_id": "66f...", "status": "cancelled" }
}
```

Behavior:
1. If intent is already failed/cancelled, returns 200 idempotent response.
2. If intent is completed, returns 400.
3. Cart remains unchanged.

---

## 3.4 GET /payments/order/:orderId

Auth:
- Required
- Owner or admin

Success 200:
- full Payment object

Errors:
- 403 forbidden
- 404 order not found or payment missing
- 500 internal

---

## 3.5 GET /payments/:id

Auth:
- Required
- Owner or admin

Success 200:
- full Payment object (with populated order summary)

Errors:
- 403 forbidden
- 404 payment not found
- 500 internal

---

## 4. Frontend Checkout Sequence (Required)

1. Initiate payment intent:
- POST /payments/initiate with cart checkout payload
- receive paymentIntentId + razorpay.keyId + razorpay.orderId

2. Open Razorpay Checkout:
- pass key, order_id, amount, currency
- collect callback payload from Razorpay:
- razorpay_order_id
- razorpay_payment_id
- razorpay_signature

3. Confirm and create order with backend:
- POST /payments/confirm-and-create-order with above fields + paymentIntentId

4. On failure/cancel:
- optionally call POST /payments/cancel-intent
- cart remains unchanged
- no order is created

5. Poll/get status if needed:
- GET /payments/order/:orderId

UI rule:
- Order does not exist until confirm-and-create-order returns success.
- Treat checkout as successful only after order is returned.

---

## 5. Error Shapes

Validation error:
```json
{
  "errors": {
    "field": ["message"]
  }
}
```

Message error:
```json
{
  "message": "..."
}
```

Frontend parser:
1. If errors exists, show field-level messages.
2. Else if message exists, show message.
3. Else fallback generic error.

---

## 6. cURL Examples

## 6.1 Initiate

```bash
curl -X POST http://localhost:3001/api/v1/payments/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: init:66e:1" \
  -d '{
    "shippingAddress": "221B Baker Street",
    "items": [
      {"product": "66p123...", "size": "M", "quantity": 1}
    ],
    "method": "razorpay"
  }'
```

## 6.2 Confirm-and-create-order after Razorpay checkout success

```bash
curl -X POST http://localhost:3001/api/v1/payments/confirm-and-create-order \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: confirm:intent66f:pay_abc123" \
  -d '{
    "paymentIntentId": "66f123...",
    "razorpay_order_id": "order_Qabc123",
    "razorpay_payment_id": "pay_abc123",
    "razorpay_signature": "signature_from_checkout"
  }'
```

## 6.3 Cancel intent

```bash
curl -X POST http://localhost:3001/api/v1/payments/cancel-intent \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "66f123...",
    "reason": "user cancelled payment"
  }'
```

## 6.4 Fetch by order

```bash
curl -X GET http://localhost:3001/api/v1/payments/order/66e123... \
  -H "Authorization: Bearer <token>"
```

---

## 7. Notes

1. Amount units:
- Internal order.totalAmount is decimal currency value.
- Razorpay order amount is integer paise.

2. Transactions:
- Internal DB updates for payment/order/cart are transaction-protected.
- Requires Mongo replica set support (Atlas supports this).

3. Future extensions:
- Refund API can reuse existing payment status enum (refunded).
- Webhook support can be added later if required, but is intentionally excluded now.
