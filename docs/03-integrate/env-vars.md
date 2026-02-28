# Biến môi trường (Environment variables)

**SDLC Version**: 6.1.0  
**Stage**: 03 - INTEGRATE  
**Status**: Active

---

## 1. Tổng quan

Tài liệu này liệt kê biến môi trường dùng trong dự án Daisy Flower. Copy `.env.example` thành `.env` và điền giá trị thực (không commit `.env`).

---

## 2. Danh sách biến

### Payload & Database

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `PAYLOAD_SECRET` | Có | Secret cho JWT/session Payload; sinh chuỗi ngẫu nhiên đủ mạnh. |
| `DATABASE_URL` | Có | Kết nối DB. **SQLite**: có thể dùng `file:./payload.db` hoặc đường dẫn file (tùy adapter). Template `.env.example` dùng MongoDB; dự án hiện tại dùng SQLite — xem `payload.config.ts` (`sqliteAdapter({ client: { url } })`). |

### Server URL (preview, link)

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `PAYLOAD_PUBLIC_SERVER_URL` | Khuyến nghị | URL server Payload (ví dụ `http://localhost:3000`). |
| `NEXT_PUBLIC_SERVER_URL` | Khuyến nghị | URL frontend (ví dụ `http://localhost:3000`). |

### Preview (draft)

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `PREVIEW_SECRET` | Tùy chọn | Secret cho preview draft (tránh truy cập trái phép). |

### Stripe (thanh toán)

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `STRIPE_SECRET_KEY` | Có (khi bật thanh toán) | Stripe secret key (server). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Có (khi bật thanh toán) | Stripe publishable key (client). |
| `STRIPE_WEBHOOKS_SIGNING_SECRET` | Có (khi dùng webhook) | Signing secret của webhook Stripe. |

Chi tiết: [api-payments-stripe.md](api-payments-stripe.md).

### Email (Payload Nodemailer)

Khi bật gửi email (xác nhận đơn, reset password, v.v.): cấu hình adapter trong `payload.config.ts` và thêm biến SMTP (host, port, user, pass) theo tài liệu Payload / Nodemailer. Hiện tại đoạn email trong config có thể bị comment.

### Khác (template / branding)

| Biến | Mô tả |
|------|--------|
| `COMPANY_NAME`, `SITE_NAME` | Tên công ty / site (có thể dùng trong layout, meta). |
| `TWITTER_*` | Twitter meta (tùy chọn). |
| `NEXT_PUBLIC_DEBUG_LAYOUT` | Bật outline/container debug trên frontend (`true`/`false`). |

---

## 3. Ví dụ `.env` (development)

```env
PAYLOAD_SECRET=your-secret-at-least-32-chars
DATABASE_URL=file:./payload.db

PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

PREVIEW_SECRET=demo-draft-secret
NEXT_PUBLIC_DEBUG_LAYOUT=false

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_...
```

---

## 4. Production

- Dùng giá trị production cho Stripe (và bật webhook production với signing secret tương ứng).
- `PAYLOAD_SECRET` và `PREVIEW_SECRET` phải đủ mạnh, không dùng giá trị mặc định.
- `DATABASE_URL` trỏ tới DB production (PostgreSQL/MongoDB nếu đã chuyển).
- `PAYLOAD_PUBLIC_SERVER_URL` và `NEXT_PUBLIC_SERVER_URL` = domain production (https).

---

*Tài liệu tích hợp — Daisy Flower. SDLC 6.1.0, Stage 03.*
