# Architecture Decisions — Daisy Flower

**SDLC Version**: 6.1.0  
**Stage**: 02 - DESIGN  
**Status**: Active

---

## 1. Tổng quan

Daisy Flower là **monolith tích hợp**: CMS + Admin + Frontend trong một codebase Next.js, dùng Payload CMS làm headless CMS và engine ecommerce (products, cart, orders). Frontend phục vụ cả trang marketing (Pages với blocks) và shop (listing, filter, search, product detail, checkout).

---

## 2. Decision 1: Payload CMS + Next.js

**Context**: Cần CMS quản lý trang (Pages), sản phẩm, danh mục, media và admin thân thiện; đồng thời frontend ecommerce nhanh, SEO-friendly.

**Decision**: Payload CMS 3.x (App Router) nhúng trong Next.js; frontend dùng React Server Components và client components khi cần (cart, search, filters).

**Lý do**:
- Một repo, một deployment; Payload cung cấp collections, hooks, access control.
- Plugin ecommerce (products, variants, cart, orders) sát nghiệp vụ bán hàng.
- Next.js App Router phù hợp SEO và trải nghiệm người dùng.

**Trade-offs**: Phụ thuộc ecosystem Payload; tùy biến sâu có thể cần can thiệp plugin.

**Cấu hình chính**:
- `src/payload.config.ts`: collections, globals (Header, Footer), plugins, db (SQLite), jobs (tasks + autoRun), typescript output.
- Plugins: `src/plugins/index.ts` — SEO, Form Builder, **Ecommerce** (customers = users, orders override, Stripe, ProductsCollection override).

---

## 3. Decision 2: Database — SQLite

**Context**: LITE tier ưu tiên đơn giản, chạy nhanh.

**Decision**: `@payloadcms/db-sqlite`; `DATABASE_URL` (file path hoặc connection string). Có thể chuyển sang PostgreSQL/MongoDB (adapters Payload) khi scale.

**Trade-offs**: SQLite không phù hợp ghi đồng thời rất lớn; với shop nhỏ/vừa là đủ.

---

## 4. Decision 3: Ecommerce model — Products, Categories, Sale Events

**Context**: Sản phẩm là hoa và hàng liên quan; cần danh mục, giá, khuyến mãi theo thời gian.

**Decision**:
- **Products**: Collection từ plugin ecommerce, override trong `src/collections/Products/index.ts` — title, slug, description (Lexical), gallery (array image + optional variantOption), layout blocks (CTA, Content, Media), Product Details (default + relatedProducts), **categories** (hasMany), **saleEvents** (join), meta (SEO).
- **Categories**: `src/collections/Categories.ts` — title, description, image, slug; access read public, write adminOnly.
- **SaleEvents**: `src/collections/SaleEvents.ts` — title, product (relationship, readOnly), salePrice, status (scheduled|active|expired), startsAt, endsAt, notes; admin hidden; job cập nhật status.

**Chi tiết collections (tham chiếu code)**:

| Collection | File | Key fields |
|------------|------|------------|
| **users** | `src/collections/Users/index.ts` | Auth + customer (plugin ecommerce: customers = users); *(khi có user levels)* level (select: bronze\|silver\|gold\|platinum) |
| **pages** | `src/collections/Pages/index.ts` | title, hero, layout (blocks), meta, slug; versions drafts |
| **categories** | `src/collections/Categories.ts` | title, description, image, slug |
| **media** | `src/collections/Media.ts` | Upload (ảnh, file) |
| **brands** | `src/collections/Brands.ts` | (nếu dùng cho sản phẩm) |
| **sale-events** | `src/collections/SaleEvents.ts` | title, product, salePrice, status, startsAt, endsAt, notes |
| **products** | Plugin + `src/collections/Products/index.ts` | title, slug, description, gallery, priceInUSD, variants, inventory, categories, saleEvents (join), meta |
| **orders** | Plugin (override trong plugins) | ordersCollectionOverride: thêm accessToken; payment qua Stripe; *(khi có voucher)* voucher, discountAmount, voucherCode |
| **vouchers** | *(chưa implement)* `src/collections/Vouchers.ts` | code, type (percent\|fixed), value, minOrderAmount?, maxUses?, usedCount?, validFrom?, validTo?, active |

**Lý do**: Tách sale theo sự kiện giúp nhiều đợt khuyến mãi; job refresh tránh phụ thuộc realtime.

**Trade-offs**: Sale event gắn một product; "sale theo category" sau này cần mở rộng model hoặc logic.

---

## 5. Decision 4: Frontend structure — App Router, blocks, layout

**Context**: Trang chủ đa block, trang shop cố định, chi tiết sản phẩm, giỏ/checkout.

**Decision**:
- **App Router**: `(app)/` = frontend công khai; `(payload)/` = admin (`/admin`).
- **Pages**: Nội dung từ collection `pages`; layout = hero + **blocks** (array). Render block theo `blockType` (xem bảng dưới).
- **Shop**: Route cố định `/shop`; layout có sidebar (categories, filters); query params `q`, `category`, `sort`.
- **Layout/UI**: Header (server + client), Footer (global), Tailwind; components dùng Radix (Button, v.v.) khi cần.

**Danh sách blocks (Pages layout)** — `src/collections/Pages/index.ts`:

| Block | Config | Mục đích |
|-------|--------|----------|
| CallToAction | `@/blocks/CallToAction/config` | CTA button/link |
| Content | `@/blocks/Content/config` | Rich text / Lexical |
| MediaBlock | `@/blocks/MediaBlock/config` | Ảnh/video |
| Archive | `@/blocks/ArchiveBlock/config` | Danh sách bài (blog) |
| Carousel | `@/blocks/Carousel/config` | Carousel ảnh/nội dung |
| ThreeItemGrid | `@/blocks/ThreeItemGrid/config` | Lưới 3 item |
| **ProductListing** | `@/blocks/ProductListing/config` | Danh sách sản phẩm (block) |
| Banner | `@/blocks/Banner/config` | Banner quảng cáo |
| FormBlock | `@/blocks/Form/config` | Form builder |
| PromoBanners | `@/blocks/PromoBanners/config` | Banner khuyến mãi |
| **SaleOffer** | `@/blocks/SaleOffer/config` | Khối sale (product + countdown) |
| ServiceFeatures | `@/blocks/ServiceFeatures/config` | Tính năng dịch vụ |
| **ShopByCategories** | `@/blocks/ShopByCategories/config` | Danh mục shop |
| BrandSlider | `@/blocks/BrandSlider/config` | Slider thương hiệu |
| **CategoryCarousel** | `@/blocks/CategoryCarousel/config` | Carousel danh mục |
| BlogBento | `@/blocks/BlogBento/config` | Bento blog |

**Routes frontend (chính)** — `src/app/(app)/`:

| Route | File | Mô tả |
|-------|------|--------|
| `/` | `page.tsx` | Trang chủ (dynamic từ pages hoặc default) |
| `/[slug]` | `[slug]/page.tsx` | Trang nội dung (pages by slug) |
| `/shop` | `shop/page.tsx` | Danh sách sản phẩm (filter q, category, sort) |
| `/products/[slug]` | `products/[slug]/page.tsx` | Chi tiết sản phẩm |
| `/checkout` | `checkout/page.tsx` | Checkout |
| `/checkout/confirm-order` | `checkout/confirm-order/page.tsx` | Xác nhận đơn |
| `/login`, `/logout`, `/create-account`, `/forgot-password` | Tương ứng | Auth |
| `/(account)/*` | `(account)/*` | Tài khoản, đơn hàng, địa chỉ |

**Globals**: Header, Footer — `src/globals/Header`, `src/globals/Footer`; dùng cho layout (menu, footer content).

---

## 6. Decision 5: Search & filter — Server-side, query params

**Context**: Khách cần tìm theo từ khóa và danh mục.

**Decision**:
- **Search**: Ô tìm trong header; trên shop gửi `q` (+ `category`). Chỉ chạy auto-search khi `pathname.startsWith('/shop')` để tránh redirect từ trang chủ về shop.
- **Filter**: Query param `category` (ID); danh sách categories lấy server-side (layout shop).
- **Implementation**: `payload.find({ collection: 'products', where: { _status: 'published', and: [ or title/description like q, categories contains category ] } })`.

**Trade-offs**: Khi catalog rất lớn hoặc cần tìm kiếm phức tạp, có thể thêm full-text hoặc search service.

---

## 7. Trang động & Homepage layout (theo seed)

**Kiến trúc phản ánh setup hiện có**: Tech stack, blocks và Payload đã chọn; tài liệu bám sát đúng cách trang được build.

### Trang build động từ Payload

- Mọi trang nội dung (kể cả **homepage**) lấy từ collection **pages** theo `slug`.
- Route **`/`** dùng cùng template với **`/[slug]`**: `src/app/(app)/page.tsx` re-export từ `[slug]/page.tsx`; `slug` mặc định là `'home'`.
- Template: `queryPageBySlug(slug)` → lấy document page → render **`<RenderHero {...hero} />`** + **`<RenderBlocks blocks={layout} />`**.
- Nếu chưa seed và `slug === 'home'`: fallback dùng **`homeStaticData()`** (`src/endpoints/seed/home-static.ts`).
- Block map: `src/blocks/RenderBlocks.tsx` — `blockType` → component (shopByCategories, saleOffer, productListing, blogBento, content, mediaBlock, …).

### Homepage layout — bố cục theo seed

Bố cục layout homepage (thứ tự blocks) định nghĩa trong **`src/endpoints/seed/home.ts`** (hàm `homePageData`). Seed gọi khi tạo page `slug: 'home'` trong `src/endpoints/seed/index.ts`. Thứ tự **layout[]**:

| # | blockType | blockName (seed) | Nội dung chính |
|---|-----------|------------------|----------------|
| 1 | `shopByCategories` | Shop By Categories | Title, description, exploreMoreLink, categories (IDs). Hiện khi có categories. |
| 2 | `saleOffer` | Limited Time Offer | sectionTitle, sectionDescription, highlight; product (ID) — sản phẩm đang sale. |
| 3 | `productListing` | Homepage Product Listing | heading, sectionDescription, enableSearch, tabs: All / Bouquets / Indoor Plants / Outdoor Plants / Dried Flowers (mỗi tab: categories, limit 8). |
| 4 | `blogBento` | From the Blog | eyebrow, heading, description, seeMoreLink, items[] (6 bài: kicker, title, excerpt, image, link). |
| 5 | `content` | Content Block | columns: full (Core features) + oneThird x 5 (Admin Dashboard, Preview, Page Builder, SEO, Dark Mode). |
| 6 | `mediaBlock` | Media Block | media (hero image). |

**Hero (homepage)**: `type: 'highImpact'`, 3 slides — mỗi slide: image, featured, title, description, button (label, url); links: Shop Now, View Deals; richText (h1 + paragraph).

**Categories seed** (`src/endpoints/seed/index.ts` — `categorySeedData`): Bouquets, Indoor Plants, Outdoor Plants, Dried Flowers, Flower Accessories, Gift Boxes, Wedding Flowers, Birthday Flowers, Sympathy & Condolences, Office & Corporate. Home page seed dùng 4 category đầu (hoặc theo thứ tự categoryDocs) cho Shop By Categories và ProductListing tabs.

Chỉnh sửa bố cục homepage: sửa trong Admin (Pages → Home) hoặc chỉnh dữ liệu seed trong `home.ts` rồi chạy lại seed.

---

## 8. Decision 6: Jobs — Sale event status refresh

**Context**: Sale events có startsAt/endsAt; cần status active/expired theo thời gian.

**Decision**: Payload **Tasks**: `src/jobs/saleEvents.ts`.
- **Task slug**: `refresh-sale-events`.
- **Schedule**: `cron: '*/2 * * * *'` (mỗi 2 phút), queue `default`.
- **Logic**:
  1. Update documents `status != 'expired'` và `endsAt < now` → `status: 'expired'`.
  2. Update documents `status != 'active'` và `startsAt <= now <= endsAt` → `status: 'active'`.
- **Config**: `payload.config.ts` → `tasks: [refreshSaleEventsTask]`, `jobs.autoRun: [{ cron: '* * * * *', queue: 'default' }]`.

**Trade-offs**: Độ trễ tối đa ~2 phút; frontend có thể dùng countdown để hiển thị "còn X phút".

---

## 9. Cấu trúc thư mục nguồn (tóm tắt)

```
src/
├── app/
│   ├── (app)/                    # Frontend
│   │   ├── page.tsx, [slug]/page.tsx, shop/, products/[slug]/, checkout/, login, ...
│   │   └── (account)/            # orders, account, addresses
│   └── (payload)/admin/          # Payload Admin
├── blocks/                       # Block config + Component (Server/Client)
│   ├── ProductListing, SaleOffer, ShopByCategories, CategoryCarousel, ...
│   └── */config.ts, */Component.tsx hoặc Component.client.tsx
├── collections/                  # Users, Pages, Categories, Media, Brands, SaleEvents
│   └── Products/                 # Override plugin ecommerce
├── globals/                      # Header, Footer
├── components/                   # UI dùng chung (Header, Grid, product/ProductCard, layout/search/Search)
├── access/                       # adminOnly, adminOrPublishedStatus, ...
├── hooks/                        # (nếu có, ví dụ revalidatePage)
├── jobs/                         # saleEvents.ts (task refresh-sale-events)
├── plugins/                      # SEO, Form, Ecommerce (Stripe, Products override)
├── payload.config.ts
└── payload-types.ts              # Generated
```

---

## 10. Integration points (Stage 03)

| Tích hợp | Mô tả | Chi tiết |
|----------|--------|----------|
| **Stripe** | Thanh toán | Adapter trong plugins; webhook `/api/payments/stripe/webhooks`; env: STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOKS_SIGNING_SECRET. |
| **Email** | Nodemailer | Cấu hình trong payload (đoạn email bị comment trong config); SMTP qua env. |
| **Media** | Lưu file | Payload Media (local); có thể gắn storage adapter (S3, v.v.) sau. |

Chi tiết contract Stripe và env: `docs/03-integrate/`.

---

## 11. Voucher & User levels (theo docs — chưa implement)

**Context**: Cần mã giảm giá (voucher) áp tại checkout và cấp độ thành viên (user level) để phân ưu đãi theo khách hàng.

**Decision (đã ghi trong requirements; triển khai sau)**:

### Voucher

- **Collection `vouchers`** (file `src/collections/Vouchers.ts`): code (text, unique, required), type (`percent` | `fixed`), value (number), minOrderAmount (optional), maxUses (optional), usedCount (number, default 0), validFrom / validTo (date, optional), active (boolean). Access: read có thể public (chỉ validate qua API) hoặc adminOnly; create/update/delete adminOnly.
- **Orders**: Mở rộng qua `ordersCollectionOverride` trong plugin — thêm field voucher (relationship to vouchers), discountAmount (number), voucherCode (text, lưu mã đã áp để hiển thị). Khi áp voucher: tăng usedCount của voucher (hook afterCreate order hoặc trong API apply).
- **Checkout**: Ô nhập mã; gọi endpoint hoặc Local API để validate (code tồn tại, active, trong khoảng validFrom–validTo, usedCount < maxUses, order total >= minOrderAmount); tính discount; gửi voucherId hoặc code khi tạo order; server tính lại total và lưu discountAmount + voucher vào order.
- **Validation**: Trùng thời gian với sale event trên sản phẩm: voucher áp vào order total (sau khi đã tính giá sản phẩm có thể đã sale). Quy ước: voucher giảm trên tổng đơn (subtotal hoặc total tùy quy ước); percent giới hạn max 100.

### User levels

- **Field trên Users**: Thêm `level` (select: `bronze`, `silver`, `gold`, `platinum` hoặc tương đương), defaultValue `bronze`; admin chỉnh. Optional: `saveToJWT: true` để frontend/API biết level không cần query user.
- **Logic nghiệp vụ (tùy chọn khi implement)**: Ví dụ level silver = 5% giảm thêm, gold = 10%, platinum = 15% + free shipping; áp tại checkout khi tính total. Có thể đặt bảng cấu hình (collection UserLevels) sau; MVP đủ field level + logic if/else hoặc map level → discount%.
- **Hiển thị**: Trang tài khoản hiển thị level hiện tại; checkout có thể hiển thị “Ưu đãi theo level” (nếu có).

**Lưu ý**: Chưa viết code; chỉ bổ sung docs. Khi implement: tạo collection Vouchers, đăng ký trong `payload.config.ts`; sửa Users (level); sửa plugins (orders override); thêm endpoint/component checkout cho voucher.

---

## 12. Gate G2 — Design Approved

- [x] Công nghệ chính (Payload, Next.js, DB) và cấu trúc thư mục đã ghi nhận.
- [x] Mô hình dữ liệu (collections, fields chính) và luồng sale (job) đã mô tả.
- [x] Frontend (routes, blocks, shop, search/filter) đã định rõ.
- [x] Điểm tích hợp (payment, email, jobs) đã liệt kê.

---

*Tài liệu thiết kế — Daisy Flower. SDLC 6.1.0, Stage 02.*
