# Sprint Plan — Daisy Flower

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Active

---

## 1. Tổng quan

Dự án đang ở giai đoạn **BUILD**: codebase Payload + Next.js đã có Pages, Categories, Products (ecommerce plugin), SaleEvents, Media, Users; frontend có trang chủ (blocks), shop (listing, filter, search), chi tiết sản phẩm, giỏ hàng và tích hợp Stripe. Sprint plan dùng để **đồng bộ tiến độ** và **định hướng công việc tiếp theo**; có mapping file/component và convention để dev/AI agent tham chiếu nhanh.

**Giám sát tiến độ theo feature**: Dùng [project-progress.md](project-progress.md) để xem feature nào đã xong, đang làm, chưa làm và **cần handle gì tiếp theo**. Cập nhật file đó khi hoàn thành hoặc bắt đầu feature.

**Skills cho agent**: Khi sửa Payload (collections, hooks, access, API) hoặc layout/responsive (blocks, trang), dùng skill tương ứng — xem [agent-skills.md](agent-skills.md).

---

## 2. Sprint hiện tại — Củng cố MVP & trải nghiệm

**Mục tiêu**: Hoàn thiện luồng mua hàng (shop → product → cart → checkout), ổn định sale events và tìm kiếm/lọc; sẵn sàng soft launch cho shop hoa.

### 2.1 Nhóm công việc & mapping file

#### Shop & catalog

| Task | File / vị trí chính | Ghi chú |
|------|----------------------|--------|
| Listing, filter category, search `q` | `src/app/(app)/shop/page.tsx` | `payload.find` với `where` (category, or title/description like). |
| Layout shop (sidebar categories) | `src/app/(app)/shop/layout.tsx` | Lấy categories server-side, truyền xuống sidebar. |
| ProductCard (ảnh, tên, giá, link) | `src/components/product/ProductCard.tsx` | Ảnh: `product.meta?.image` hoặc `product.gallery?.[0]?.image`. |
| Search (header, debounce, chỉ trên /shop) | `src/components/layout/search/Search.tsx` | Debounce 500ms; `pathname.startsWith('/shop')` mới auto redirect/search. |
| Chi tiết sản phẩm | `src/app/(app)/products/[slug]/page.tsx` | Fetch by slug; hiển thị gallery, mô tả, giá, sale, thêm giỏ. |

#### Sale & khuyến mãi

| Task | File / vị trí | Ghi chú |
|------|----------------|--------|
| Job refresh sale events | `src/jobs/saleEvents.ts` | Task `refresh-sale-events`; cron `*/2 * * * *`; chỉ update doc cần đổi status. |
| Block SaleOffer (countdown, giá sale) | `src/blocks/SaleOffer/` | Component.tsx (server) lấy active event; Component.client.tsx countdown; khi hết hạn hiển thị giá gốc. |
| Hiển thị giá sale trên ProductCard / product page | `ProductCard`, product detail | Dữ liệu sale từ product.saleEvents hoặc query active event theo product + time. |

#### Cart & checkout

| Task | File / vị trí | Ghi chú |
|------|----------------|--------|
| Giỏ hàng, cập nhật / xóa item | Plugin ecommerce + components checkout | Cart state/API do plugin cung cấp. |
| Trang checkout, Stripe Elements | `src/app/(app)/checkout/page.tsx`, `src/components/checkout/CheckoutPage.tsx` | Load Stripe, Elements wrapper; cần `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. |
| Form thanh toán, confirmPayment | `src/components/forms/CheckoutForm/index.tsx` | useStripe, confirmPayment, sau đó confirmOrder('stripe', ...). |
| Xác nhận đơn | `src/app/(app)/checkout/confirm-order/page.tsx`, `ConfirmOrder.tsx` | Hiển thị kết quả sau thanh toán. |
| Webhook Stripe | Plugin ecommerce (Payload route) | URL: `/api/payments/stripe/webhooks`; cần `STRIPE_WEBHOOKS_SIGNING_SECRET`. |

#### Admin & nội dung

| Task | File / vị trí | Ghi chú |
|------|----------------|--------|
| Categories CRUD | `src/collections/Categories.ts` | Access: read public, write adminOnly. |
| Products (override) | `src/collections/Products/index.ts` | Join saleEvents; categories; gallery; meta SEO. |
| Sale events | `src/collections/SaleEvents.ts` | Admin hidden; tạo từ product (join) hoặc trực tiếp. |
| Pages, blocks | `src/collections/Pages/index.ts` | Layout: hero + blocks (ProductListing, SaleOffer, ShopByCategories, ...). |
| Render block theo type | `src/app/(app)/[slug]/page.tsx` (hoặc layout) | Map blockType → component tương ứng. |

#### Kỹ thuật & chất lượng

| Task | Ghi chú |
|------|--------|
| `pnpm generate:types` | Chạy sau mỗi lần sửa schema (collections, globals). |
| `pnpm generate:importmap` | Chạy sau khi tạo/sửa component dùng trong admin (AGENTS.md). |
| Access control | Khi gọi Local API với `user` thì đặt `overrideAccess: false`; hooks luôn truyền `req` cho nested operations. |
| Security | Đọc `.cursor/rules/security-critical.mdc` hoặc AGENTS.md; không hardcode secret. |

#### Voucher & User levels (theo docs — chưa implement)

| Task | File / vị trí dự kiến | Ghi chú |
|------|------------------------|--------|
| Collection Vouchers | `src/collections/Vouchers.ts` | code, type, value, minOrderAmount, maxUses, usedCount, validFrom, validTo, active; access adminOnly write. |
| Đăng ký Vouchers | `src/payload.config.ts` | Thêm vào `collections: [..., Vouchers]`. |
| Field level trên Users | `src/collections/Users/index.ts` | level (select: bronze, silver, gold, platinum); optional saveToJWT. |
| Mở rộng Orders (voucher) | `src/plugins/index.ts` | ordersCollectionOverride: thêm voucher (relationship), discountAmount, voucherCode. |
| Validate & apply voucher | Endpoint hoặc server action / API route | Validate code; kiểm tra validFrom/validTo, usedCount < maxUses, total >= minOrderAmount; trả về discount; khi tạo order tăng usedCount (hook hoặc trong flow). |
| Checkout UI voucher | `src/components/checkout/` hoặc form checkout | Ô nhập mã; gọi validate; hiển thị discount; gửi voucher khi submit order. |
| Hiển thị level | Trang account, optional checkout | Đọc user.level (từ JWT hoặc query); hiển thị ưu đãi theo level nếu có logic. |

*Chi tiết yêu cầu và thiết kế: [01-planning § US8, US9](01-planning/requirements.md), [02-design § 11](02-design/architecture-decisions.md#11-voucher--user-levels-theo-docs--chưa-implement).*

---

## 3. Convention & patterns (ghi chú build)

### 3.1 Search

- **Chỉ chạy auto-search** khi `pathname.startsWith('/shop')` để tránh redirect từ trang chủ về shop khi user đang ở `/`.

### 3.2 Product image

- Payload shape: gallery item có `.image` (relation to media). Dùng `product.meta?.image` hoặc `product.gallery?.[0]?.image` cho ảnh đại diện.

### 3.3 Sale event

- Lấy event **active** theo product + khoảng thời gian (startsAt, endsAt) qua Local API.
- Job **chỉ cập nhật** document có status thực sự cần đổi (expired: endsAt < now; active: now trong [startsAt, endsAt]) để giảm ghi DB.

### 3.4 Naming

- File: **kebab-case** (ví dụ `sale-events.ts` cho slug; tên file config có thể PascalCase trong blocks).
- Collection slug: **kebab-case** (e.g. `sale-events`, `products` từ plugin).

### 3.5 Block mới

- Thêm config trong `src/blocks/<BlockName>/config.ts`.
- Đăng ký trong `src/collections/Pages/index.ts` (layout.blocks).
- Component (Server hoặc Client) đặt trong block folder; nếu dùng hook/client thì `Component.client.tsx`.
- Chạy `generate:importmap` nếu block dùng trong admin.

---

## 4. Definition of Done (cho từng task)

- Code chạy đúng trên môi trường dev (`pnpm dev`).
- Không hardcode secret; biến nhạy cảm dùng env (xem `docs/03-integrate/env-vars.md`).
- Thay đổi collection/global có access control thì đảm bảo role/access đã cấu hình và test.
- Nếu sửa schema: đã chạy `generate:types` (và `generate:importmap` nếu liên quan admin components).

---

## 5. Sprint tiếp theo (định hướng)

- **Soft launch**: Deploy (Vercel hoặc host khác), cấu hình domain, SSL, env production.
- **Nội dung**: Seed hoặc nhập sản phẩm/danh mục thật; tạo 1–2 sale events mẫu.
- **Monitoring**: Log lỗi, health check cơ bản (tùy chọn).
- **Nice-to-have**: Wishlist, coupon, SEO (meta, sitemap) theo requirements.

---

## 6. Troubleshooting (thường gặp)

| Triệu chứng | Nguyên nhân có thể | Cách xử lý |
|-------------|--------------------|------------|
| Shop redirect về /shop khi gõ ở trang chủ | Search effect chạy khi pathname chưa phải /shop | Giới hạn effect: `pathname.startsWith('/shop')` (đã áp trong Search). |
| Ảnh sản phẩm không hiện | Sai path ảnh (gallery vs meta) | Dùng `product.gallery?.[0]?.image` hoặc `product.meta?.image` (object media có url). |
| Sale giá không đổi sau khi hết hạn | Job chưa chạy hoặc cron sai | Kiểm tra `payload.config.ts` tasks + jobs.autoRun; xem log job. |
| Button is not defined (ProductListing) | Thiếu import Button | Import từ `@/components/ui/button` (đã sửa trong codebase). |
| Type lỗi sau khi sửa collection | Chưa generate types | Chạy `pnpm generate:types`. |
| Checkout không load Stripe | Thiếu env Stripe | Đặt `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (và secret cho server). |

---

## 7. Gate G3 (Ship Ready) — Checklist trước khi deploy

- [ ] Các user story MVP thao tác được trên staging.
- [ ] Không lộ secret; access control đã kiểm tra.
- [ ] Job sale events chạy đúng theo lịch (cron).
- [ ] Thanh toán test (Stripe test mode) thành công end-to-end.
- [ ] README hoặc docs deploy có hướng dẫn env và chạy lần đầu (có thể dùng `docs/03-integrate/env-vars.md`).

---

## 8. Seed & Homepage layout

**Bám sát kiến trúc đã setup**: Các trang build động từ Payload; homepage = page `slug: 'home'`. Bố cục layout (hero + thứ tự blocks) định nghĩa trong seed.

### Seed files tham chiếu

| File | Mục đích |
|------|----------|
| `src/endpoints/seed/index.ts` | Entry: reset DB, tạo media, categories, products, variant types/options, **pages** (home + contact), addresses, transactions, …; gọi `homePageData()` khi tạo page home. |
| `src/endpoints/seed/home.ts` | **`homePageData({ metaImage, heroImages, categories, product, blogImages })`** — trả về document page cho `slug: 'home'`: hero (highImpact, 3 slides), **layout[]** (thứ tự blocks). |
| `src/endpoints/seed/home-static.ts` | **`homeStaticData()`** — fallback khi chưa seed: page home tối giản (hero lowImpact + richText). |
| `src/endpoints/seed/contact-page.ts` | Dữ liệu page Contact (form, layout). |

### Thứ tự layout homepage (từ `home.ts`)

1. **Shop By Categories** — chỉ thêm khi có categories; title, description, exploreMoreLink, categories.
2. **Limited Time Offer** (saleOffer) — sectionTitle, highlight, product (sản phẩm sale).
3. **Homepage Product Listing** (productListing) — Featured Products, tabs: All, Bouquets, Indoor Plants, Outdoor Plants, Dried Flowers.
4. **From the Blog** (blogBento) — 6 items (kicker, title, excerpt, image, link).
5. **Content Block** (content) — Core features + 5 cột oneThird.
6. **Media Block** (mediaBlock) — 1 ảnh.

### Render động

- **`src/app/(app)/page.tsx`** → re-export **`[slug]/page.tsx`** (slug mặc định `'home'`).
- **`src/app/(app)/[slug]/page.tsx`** → `queryPageBySlug(slug)`; nếu `!page && slug === 'home'` dùng `homeStaticData()`; render `<RenderHero {...hero} />` + `<RenderBlocks blocks={layout} />`.
- **`src/blocks/RenderBlocks.tsx`** — map `blockType` → component; mỗi block nhận props từ `layout[i]`.

Chỉnh bố cục homepage: Admin → Pages → Home (sửa layout blocks) hoặc sửa `home.ts` rồi chạy lại seed.

---

*Tài liệu build — Daisy Flower. SDLC 6.1.0, Stage 04.*
