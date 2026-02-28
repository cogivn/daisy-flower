# Integrate — Contracts & third-party

**SDLC Version**: 6.1.0  
**Stage**: 03 - INTEGRATE  
**Status**: Active

---

## 1. Mục đích

Thư mục này mô tả **hợp đồng tích hợp** (API, webhook, dịch vụ bên thứ ba) và **biến môi trường** dùng trong dự án Daisy Flower.

---

## 2. Tài liệu trong thư mục

| File | Nội dung |
|------|----------|
| [api-payments-stripe.md](api-payments-stripe.md) | Stripe: cấu hình, env, nơi dùng trong code, webhook, kiểm tra local. |
| [env-vars.md](env-vars.md) | Danh sách biến môi trường (Payload, DB, URL, Stripe, email, debug). |

---

## 3. Hiện trạng tích hợp

| Tích hợp | Trạng thái | Ghi chú |
|----------|------------|--------|
| **Stripe** | Đang dùng | Adapter trong plugin ecommerce; checkout dùng Stripe Elements; webhook cập nhật order. |
| **Email (Nodemailer)** | Có thể chưa bật | Payload hỗ trợ; cấu hình trong config + env SMTP. |
| **Media** | Local | Lưu qua Payload Media; có thể gắn S3/storage adapter sau. |

---

## 4. Khi thêm tích hợp mới

- Tạo file mới trong `docs/03-integrate/`, **kebab-case** (ví dụ `third-party-shipping.md`).
- Mô tả: mục đích, endpoint/API, auth, biến env, nơi gọi trong code, cách test.
- Cập nhật [env-vars.md](env-vars.md) nếu có biến mới.
- Không đặt version hoặc ngày trong tên file.

---

*Tài liệu tích hợp — Daisy Flower. SDLC 6.1.0, Stage 03.*
