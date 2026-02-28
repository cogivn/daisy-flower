# Stripe — Hợp đồng tích hợp thanh toán

**SDLC Version**: 6.1.0  
**Stage**: 03 - INTEGRATE  
**Status**: Active

---

## 1. Tổng quan

Dự án dùng **Stripe** làm cổng thanh toán qua **Payload Ecommerce plugin** (stripe adapter). Luồng: frontend tạo PaymentIntent (qua Payload API), Stripe Elements nhập thẻ, confirm payment; Stripe gửi webhook về để cập nhật trạng thái đơn hàng.

---

## 2. Cấu hình (Environment)

| Biến | Mô tả | Ví dụ (test) |
|------|--------|----------------|
| `STRIPE_SECRET_KEY` | Secret key từ Stripe Dashboard (server) | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (client) | `pk_test_...` |
| `STRIPE_WEBHOOKS_SIGNING_SECRET` | Signing secret của webhook endpoint | `whsec_...` |

- **Lưu ý**: Secret key không được gửi ra client. Publishable key có thể public.
- **Webhook secret**: Tạo tại Stripe Dashboard → Developers → Webhooks → Add endpoint → chọn events → lấy "Signing secret".

---

## 3. Nơi dùng trong code

| Vị trí | Mục đích |
|--------|----------|
| `src/plugins/index.ts` | `stripeAdapter({ secretKey, publishableKey, webhookSecret })` — đăng ký adapter với plugin ecommerce. |
| `src/providers/index.tsx` | `stripeAdapterClient({ publishableKey })` — client Stripe (loadStripe, Elements). |
| `src/components/checkout/CheckoutPage.tsx` | `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`, bọc form bằng `<Elements>`. |
| `src/components/forms/CheckoutForm/index.tsx` | `useStripe()`, `useElements()`, `stripe.confirmPayment()`, sau đó gọi `confirmOrder('stripe', { ... })`. |

Webhook endpoint do **plugin ecommerce** cung cấp (Payload route), không nằm trong repo dưới dạng file route riêng; URL thường dạng: `https://<domain>/api/payments/stripe/webhooks`.

---

## 4. Events webhook (tham khảo)

Plugin thường lắng nghe các event Stripe liên quan thanh toán, ví dụ:

- `payment_intent.succeeded` — cập nhật order đã thanh toán.
- `payment_intent.payment_failed` — đánh dấu thất bại / retry.

Chi tiết chính xác events và payload do **@payloadcms/plugin-ecommerce** định nghĩa; khi debug có thể bật Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/stripe/webhooks` (script trong package.json: `stripe-webhooks`).

---

## 5. Kiểm tra local

1. Cấp đủ 3 biến env (test keys).
2. Chạy `pnpm dev`; vào trang checkout, nhập thẻ test (ví dụ `4242 4242 4242 4242`).
3. (Tùy chọn) Chạy `pnpm stripe-webhooks` để forward webhook từ Stripe CLI vào local.

---

*Tài liệu tích hợp — Daisy Flower. SDLC 6.1.0, Stage 03.*
