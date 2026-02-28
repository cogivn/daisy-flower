# Requirements — Daisy Flower

**SDLC Version**: 6.1.0  
**Stage**: 01 - PLANNING  
**Status**: Active

---

## 1. Mục tiêu sản phẩm & kiến trúc hiện có

**Mục tiêu**: Xây dựng **website thương mại điện tử** cho phép:

- Trưng bày và bán **hoa tươi**, **sản phẩm liên quan đến hoa** (giỏ, hộp quà, phụ kiện, dịch vụ giao hoa).
- Quản trị nội dung và sản phẩm tập trung (Payload Admin).
- Trải nghiệm mua sắm rõ ràng trên frontend (duyệt, tìm kiếm, lọc, giỏ hàng, thanh toán).

**Bám sát kiến trúc đã setup**: Tech stack (Payload CMS, Next.js, SQLite), plugin ecommerce, bộ blocks và collections đã chọn. Các **trang (kể cả homepage) build động** từ collection `pages`: mỗi trang có `slug`, `hero`, `layout` (mảng blocks). Route `/` map với trang `slug: 'home'`; template chung tại `[slug]/page.tsx` → `RenderHero(hero)` + `RenderBlocks(layout)`. Bố cục layout homepage (thứ tự blocks) định nghĩa trong **seed** — xem [02-design: Trang động & Homepage layout](02-design/architecture-decisions.md#7-trang-động--homepage-layout-theo-seed) và [04-build: Seed & Homepage layout](04-build/sprint-plan.md#8-seed--homepage-layout).

---

## 2. User Stories — Must-Have (MVP)

### 2.1 Khách hàng (frontend)

#### US1: Xem danh sách sản phẩm theo danh mục

- **Là khách hàng**, tôi muốn **xem danh sách sản phẩm (hoa, quà tặng) theo danh mục** để chọn nhanh theo nhu cầu.
- **Chấp nhận**:
  - Có trang shop (`/shop`), có thể lọc theo category (query param `category`).
  - Mỗi sản phẩm hiển thị: ảnh (gallery hoặc meta.image), tên, giá; nếu có sale event active thì hiển thị giá sale (và có thể giá gốc gạch ngang).
- **Mapping hiện tại**:
  - Route: `src/app/(app)/shop/page.tsx`
  - Query: `payload.find({ collection: 'products', where: { categories: { contains: category } } })`
  - Component: `ProductCard` (`src/components/product/ProductCard.tsx`), layout sidebar categories từ `src/app/(app)/shop/layout.tsx`.

#### US2: Tìm kiếm sản phẩm theo từ khóa

- **Là khách hàng**, tôi muốn **tìm kiếm sản phẩm theo từ khóa** để tìm đúng loại hoa hoặc sản phẩm.
- **Chấp nhận**:
  - Ô tìm kiếm (ví dụ trong header) gửi sang `/shop?q=...`; có thể kết hợp `category`.
  - Kết quả cập nhật theo từ khóa (search trên `title` hoặc `description`).
- **Mapping hiện tại**:
  - Search component: `src/components/layout/search/Search.tsx` (debounce, chỉ auto-search khi `pathname.startsWith('/shop')`).
  - Shop page: `searchParams.q` → `where: { or: [ { title: { like: q } }, { description: { like: q } } ] }`.

#### US3: Xem chi tiết sản phẩm

- **Là khách hàng**, tôi muốn **xem chi tiết sản phẩm** (ảnh, mô tả, giá, biến thể nếu có) để quyết định mua.
- **Chấp nhận**:
  - Trang chi tiết tại `/products/[slug]`.
  - Hiển thị: gallery, mô tả (rich text), giá; nếu có sale event active: giá sale, có thể countdown.
  - Nút "Thêm vào giỏ" (và chọn biến thể nếu bật variants).
- **Mapping hiện tại**:
  - Route: `src/app/(app)/products/[slug]/page.tsx`
  - ProductCard dùng `product.meta?.image` hoặc `product.gallery?.[0]?.image` cho ảnh.

#### US4: Giỏ hàng và thanh toán

- **Là khách hàng**, tôi muốn **thêm sản phẩm vào giỏ hàng và tiến tới thanh toán** để hoàn tất mua hàng.
- **Chấp nhận**:
  - Giỏ hàng lưu được sản phẩm (cookie/cart API từ plugin ecommerce).
  - Có trang checkout (`/checkout`), có thể xác nhận đơn (`/checkout/confirm-order`).
  - Tích hợp thanh toán (Stripe); webhook cập nhật trạng thái đơn.
- **Mapping hiện tại**:
  - Routes: `src/app/(app)/checkout/page.tsx`, `src/app/(app)/checkout/confirm-order/page.tsx`
  - Payment: Stripe adapter trong `src/plugins/index.ts`; webhook tại `/api/payments/stripe/webhooks`.

---

### 2.2 Quản trị (admin)

#### US5: Quản lý danh mục (Categories)

- **Là chủ shop / admin**, tôi muốn **quản lý danh mục** để sắp xếp sản phẩm (hoa, quà tặng, v.v.).
- **Chấp nhận**:
  - CRUD categories trong Payload Admin.
  - Mỗi category: title, description (textarea), image (upload → media), slug (tự sinh hoặc nhập).
- **Mapping hiện tại**:
  - Collection: `src/collections/Categories.ts` — fields: `title`, `description`, `image`, `slugField()`.
  - Access: `read: () => true`, create/update/delete: `adminOnly`.

#### US6: Quản lý sản phẩm (Products)

- **Là admin**, tôi muốn **quản lý sản phẩm** (tên, mô tả, ảnh, giá, biến thể, tồn kho) để cập nhật catalog.
- **Chấp nhận**:
  - Collection products có: title, slug, description (rich text), gallery (array of image), giá (priceInUSD), variants, inventory.
  - Có thể gắn categories (nhiều-nhiều); có join với sale events (xem trong product sidebar).
- **Mapping hiện tại**:
  - Collection: `src/collections/Products/index.ts` (override từ `@payloadcms/plugin-ecommerce`).
  - Fields: title, description, gallery, layout blocks (CTA, Content, Media), Product Details tab (defaultCollection fields + relatedProducts), categories (relationship hasMany), saleEvents (join collection: sale-events, on: product), slug, meta (SEO).
  - Products được đăng ký qua plugin: `ecommercePlugin({ products: { productsCollectionOverride: ProductsCollection } })`.

#### US7: Cấu hình khuyến mãi (Sale events)

- **Là admin**, tôi muốn **cấu hình khuyến mãi theo thời gian** để chạy chiến dịch giảm giá.
- **Chấp nhận**:
  - Sale event: gắn với một product; có salePrice (USD), startsAt, endsAt; status (scheduled | active | expired) — thường do job cập nhật.
  - Admin có thể tạo/sửa từ product (join table) hoặc từ collection Sale events (admin hidden nhưng vẫn dùng được).
- **Mapping hiện tại**:
  - Collection: `src/collections/SaleEvents.ts` — title, product (relationship, readOnly khi tạo từ product), salePrice, status, startsAt, endsAt, notes.
  - Job: `src/jobs/saleEvents.ts` — task `refresh-sale-events`, cron `*/2 * * * *` (mỗi 2 phút), cập nhật status expired/active theo thời gian.

#### US8: Hệ thống voucher (mã giảm giá)

- **Là chủ shop / admin**, tôi muốn **tạo và quản lý voucher (mã giảm giá)** để chạy chiến dịch khuyến mãi theo mã, độc lập với sale events theo sản phẩm.
- **Là khách hàng**, tôi muốn **nhập mã voucher tại checkout** để được giảm giá đơn hàng (theo % hoặc số tiền cố định).
- **Chấp nhận**:
  - Admin: CRUD voucher — code (unique), loại (percent / fixed), giá trị, đơn tối thiểu (optional), số lần dùng tối đa (optional), thời hạn (validFrom / validTo), trạng thái active.
  - Checkout: ô nhập mã; validate (đúng code, còn hạn, còn lượt dùng, đơn đạt min); áp dụng giảm giá vào total; lưu voucher + discountAmount vào order.
  - Order: lưu voucher đã áp dụng (relationship hoặc code + discountAmount) để hiển thị và báo cáo.
- **Mapping (khi implement)**:
  - Collection mới: `src/collections/Vouchers.ts`.
  - Orders: mở rộng qua `ordersCollectionOverride` (voucher, discountAmount, voucherCode).
  - Checkout: component nhập mã + API/endpoint validate & apply voucher; cập nhật cart/order total.

#### US9: User levels (cấp độ thành viên)

- **Là chủ shop**, tôi muốn **phân cấp khách hàng theo level** (ví dụ Bronze, Silver, Gold, Platinum) để áp dụng ưu đãi khác nhau (giảm giá thêm, miễn phí giao hàng, v.v.).
- **Là khách hàng**, tôi muốn **biết level của mình và ưu đãi đi kèm** (trang tài khoản hoặc checkout).
- **Chấp nhận**:
  - User có field **level** (select: bronze, silver, gold, platinum hoặc tương đương); admin có thể chỉnh level cho từng user.
  - Logic nghiệp vụ (khi implement): có thể áp discount % theo level, điều kiện miễn phí ship theo level, v.v.; có thể lưu level vào JWT (saveToJWT) để dùng ở frontend/API.
  - Hiển thị level trên trang tài khoản; tại checkout có thể hiển thị ưu đãi theo level (nếu có).
- **Mapping (khi implement)**:
  - Users: thêm field `level` trong `src/collections/Users/index.ts`; optional `saveToJWT: true` nếu cần dùng ở client.
  - (Tùy chọn) Collection `UserLevels` nếu sau này cấu hình level theo bảng (tên, discountPercent, freeShippingThreshold, ...); MVP có thể chỉ dùng select cố định.

---

## 3. User Stories — Nice-to-Have (Post-MVP)

| Story | Mô tả ngắn |
|-------|------------|
| Wishlist | Lưu sản phẩm yêu thích (có thể dùng user collection hoặc cookie) |
| Đánh giá / bình luận | Review sản phẩm, rating (cần collection mới + UI) |
| Báo cáo đơn / tồn kho | Dashboard hoặc export đơn hàng, tồn kho trong admin |
| Đa ngôn ngữ / đa tiền tệ | Locale, multi-currency khi mở rộng thị trường |

*Lưu ý: Voucher (mã giảm giá) và User levels đã đưa vào Must-Have — xem US8, US9.*

---

## 4. Non-Functional Requirements

| NFR | Mô tả | Ghi chú |
|-----|--------|--------|
| **Performance** | Trang danh sách và chi tiết sản phẩm load < 3s (kết nối thường) | Server components, select field giới hạn, ảnh tối ưu |
| **Security** | Access control đúng; không lộ secret; validate input | AGENTS.md: overrideAccess khi có user, req trong hooks |
| **Khả năng mở rộng** | Thêm danh mục, thuộc tính sản phẩm, block trang mà không đổi kiến trúc lớn | Blocks trong Pages; Products override mở rộng fields |
| **Availability** | Admin và frontend chạy ổn định trên môi trường deploy | Phụ thuộc host (Vercel, VPS, v.v.) |

---

## 5. Phạm vi (Scope)

### Trong phạm vi (MVP)

- Catalog: sản phẩm (hoa + liên quan), danh mục, tìm kiếm (`q`), lọc (`category`).
- Trang: Trang chủ (blocks), shop, chi tiết sản phẩm, giỏ hàng, checkout, xác nhận đơn.
- Admin: Pages, Categories, Products (qua plugin), Media, Users, Sale events; Orders (plugin); **Vouchers** (khi implement); **User level** (field trên Users).
- Thanh toán: Stripe (webhook, env cấu hình).
- Sale events: Job cron cập nhật status; frontend hiển thị giá sale khi active.
- **Voucher**: Mã giảm giá tại checkout; áp dụng theo % hoặc fixed; lưu vào order (theo docs, chưa code).
- **User levels**: Cấp độ thành viên (bronze/silver/gold/platinum) trên User; dùng cho ưu đãi (theo docs, chưa code).

### Ngoài phạm vi (hiện tại)

- Ứng dụng mobile riêng (native).
- Marketplace đa seller.
- ERP / warehouse phức tạp, tích hợp vận chuyển bên thứ ba (có thể thêm sau trong 03-integrate).

---

## 6. Thuật ngữ (Glossary)

| Thuật ngữ | Ý nghĩa trong dự án |
|-----------|----------------------|
| **Product** | Sản phẩm bán (hoa, bó hoa, giỏ quà, phụ kiện) — collection từ plugin ecommerce, override trong `Products/index.ts`. |
| **Category** | Danh mục phân loại sản phẩm (ví dụ: Hoa tươi, Giỏ quà, Quà tặng) — collection `categories`. |
| **Sale event** | Đợt khuyến mãi theo thời gian gắn một product: salePrice, startsAt, endsAt, status. |
| **Block** | Khối nội dung trong trang (Hero, Content, ProductListing, SaleOffer, ShopByCategories, v.v.) — dùng trong Pages layout. |
| **Payload Admin** | Giao diện quản trị tại `/admin` (Next.js route trong `(payload)`). |
| **Gate** | Điểm kiểm tra chất lượng SDLC (G0.1, G1, G2, G3) — xem docs/sdlc. |
| **Voucher** | Mã giảm giá do admin tạo; khách nhập tại checkout; áp dụng vào đơn hàng (collection `vouchers`, mở rộng orders). |
| **User level** | Cấp độ thành viên (ví dụ bronze → platinum) lưu trên User; dùng để áp ưu đãi theo level. |

---

## 7. Gate G1 — Requirements Complete

- [x] User stories có tiêu chí chấp nhận và mapping với code (routes, collections).
- [x] Phạm vi trong/ngoài được định nghĩa.
- [x] Ưu tiên MVP vs Nice-to-Have; NFR đã liệt kê.
- [x] Khả năng đáp ứng bằng stack hiện tại (Payload, Next.js, plugin ecommerce) đã xác nhận.
- [x] Thuật ngữ nghiệp vụ đã ghi nhận.

---

*Tài liệu kế hoạch — Daisy Flower. SDLC 6.1.0, Stage 01.*
