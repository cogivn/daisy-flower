# Giám sát tiến độ dự án — Daisy Flower

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Active

---

## 1. Mục đích

Tài liệu này là **nơi theo dõi tiến độ** theo feature: feature nào đã xong, đang làm, chưa làm; dự án đang ở đâu và **cần handle gì tiếp theo**. Cập nhật file này mỗi khi bắt đầu/hoàn thành một feature hoặc đổi ưu tiên.

---

## 2. Trạng thái theo feature

**Chú thích trạng thái**: **Chưa làm** | **Đang làm** | **Xong**

| # | Feature | Ref | Trạng thái | Ghi chú |
|---|---------|-----|------------|--------|
| 1 | Trang chủ (homepage) — hero + blocks động | Seed, [slug]/page | **Xong** | Layout từ seed; RenderHero + RenderBlocks. |
| 2 | Trang nội dung động (pages by slug) | — | **Xong** | `/`, `/[slug]`, fallback home static. |
| 3 | **US1** — Shop: danh sách sản phẩm, lọc category | [01-planning](01-planning/requirements.md) | **Xong** | shop/page.tsx, sidebar categories, ProductCard. |
| 4 | **US2** — Tìm kiếm sản phẩm (q) | 01-planning | **Xong** | Search.tsx, chỉ auto trên /shop. |
| 5 | **US3** — Chi tiết sản phẩm | 01-planning | **Xong** | products/[slug], gallery, giá, thêm giỏ. |
| 6 | **US4** — Giỏ hàng + Checkout + Stripe | 01-planning | **Xong** | Cart, checkout, confirm-order; webhook Stripe. |
| 7 | **US5** — Admin: Quản lý Categories | 01-planning | **Xong** | Categories.ts, CRUD admin. |
| 8 | **US6** — Admin: Quản lý Products | 01-planning | **Xong** | Products override, gallery, saleEvents join. |
| 9 | **US7** — Sale events + job refresh | 01-planning | **Xong** | SaleEvents.ts, job refresh-sale-events cron. |
| 10 | **US8** — Hệ thống voucher | 01-planning, 02-design §11 | **Xong** | Sprint 1 (Data model) + Sprint 2 (Business logic + 33 tests + 8 bug fixes) + Sprint 3 (VoucherInput + PriceBreakdown) xong. |
| 11 | **US9** — User levels | 01-planning, 02-design §11 | **Xong** | Sprint 1 (UserLevelSettings, Users fields) + Sprint 2 (totalSpent sync, level recalc, stacking) + Sprint 3 (UserLevelCard on account page) xong. |
| 12 | Auth: Login, Logout, Tạo tài khoản, Quên MK | — | **Xong** | Routes + Payload auth. |
| 13 | Trang tài khoản: đơn hàng, địa chỉ | — | **Xong** | (account)/orders, account, addresses. |
| 14 | Find order (tra cứu đơn) | — | **Xong** | find-order page. |

*Ref = tham chiếu requirements hoặc design.*

---

## 3. Tiến độ tổng thể

- **Đã xong**: MVP luồng mua hàng (trang chủ, shop, tìm kiếm/lọc, chi tiết sản phẩm, giỏ hàng, checkout Stripe), admin (Pages, Categories, Products, Sale events, Media, Users, Orders), auth và tài khoản, job sale events, sale countdown badge. **Voucher (US8)** và **User levels (US9)** hoàn thành toàn bộ (backend + frontend UI).
- **Chưa làm**: Nice-to-have: wishlist, đánh giá, báo cáo, đa ngôn ngữ (xem [01-planning](01-planning/requirements.md)).

---

## 4. Ưu tiên — Cần handle tiếp theo

Cập nhật thứ tự khi hoàn thành hoặc đổi kế hoạch.

1. **Kiểm tra Gate G3 (Ship Ready)** — Checklist trong [sprint-plan §7](sprint-plan.md#7-gate-g3-ship-ready--checklist-trước-khi-deploy); test Stripe, job, access control, voucher E2E.
2. **Soft launch** — Deploy staging/production; cấu hình env, domain; seed hoặc nhập nội dung thật.
3. **Nice-to-have** — Wishlist, coupon nâng cao, báo cáo đơn/tồn kho, SEO (meta, sitemap).

---

## 5. Cập nhật file này

- Khi **bắt đầu** một feature: đổi trạng thái thành **Đang làm**, ghi giai đoạn hoặc assignee vào cột Ghi chú (tùy chọn).
- Khi **hoàn thành** một feature: đổi thành **Xong**, ghi ngắn gọn (vd. "Done 2025-02" hoặc để trống).
- Khi đổi **ưu tiên**: sửa mục **§4. Ưu tiên — Cần handle tiếp theo**.
- Có thể thêm cột **Ngày cập nhật** hoặc dùng git history thay cho ngày trong file.

---

*Tài liệu giám sát tiến độ — Daisy Flower. SDLC 6.1.0, Stage 04.*
