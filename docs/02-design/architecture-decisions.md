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
| **vouchers** | `src/collections/Vouchers.ts` | code, type (percent\|fixed), value, scope, assignMode, minOrderAmount?, maxUses?, usedCount?, validFrom?, validTo?, active; hooks auto-gen code, validate. |

**Lý do**: Tách sale theo sự kiện giúp nhiều đợt khuyến mãi; job refresh tránh phụ thuộc realtime.

**Trade-offs**: Sale event gắn một product; "sale theo category" sau này cần mở rộng model hoặc logic.

---

## 5. Decision 4: Frontend structure — App Router, blocks, layout

**Context**: Trang chủ đa block, trang shop cố định, chi tiết sản phẩm, giỏ/checkout.

**Decision**:
- **App Router**: `(app)/` = frontend công khai; `(payload)/` = admin (`/admin`).
- **Pages**: Nội dung từ collection `pages`; layout = hero + **blocks** (array). Render block theo `blockType` (xem bảng dưới).
- **Shop**: Route cố định `/shop`; layout có sidebar (categories, filters); query params `q`, `category`, `sort`.
- **Layout/UI**: Header (server + client), Footer (global), Tailwind; components dùng Radix (Button, Sheet, v.v.) khi cần.

**Cấu trúc Header (client)** — `src/components/Header/index.client.tsx`:
- **Top bar** (ẩn mobile): topBarContent (global), dropdown Ngôn ngữ, dropdown Theme (Light/Dark).
- **Middle**: Trên mobile: nút MobileMenu (trái), logo LUKANI (giữa), khu vực icon (phải). Trên desktop: logo (trái), Search (giữa), User / Wishlist / Cart (phải). Cart dùng `OpenCartButton` (icon + badge số lượng) và component `Cart` với `renderTrigger`; có thể hiển thị thêm subtotal trên màn rộng (xl).
- **Categories bar**: Nút dropdown "Categories" (All Categories + danh sách categories từ CMS), nav links (từ global Header), block "Call us 24/7" + số điện thoại (global contactNumber). Bar có sticky khi scroll (fixed top).
- **MobileMenu** — `src/components/Header/MobileMenu.tsx`: Sheet mở từ trái; nav items (CMSLink), block "My account" (Orders, Addresses, Manage account, Log out khi đã đăng nhập; Login / Create account khi chưa), Theme switcher (Light/Dark) ở cuối. Đóng khi resize > md hoặc khi pathname/searchParams thay đổi.
- **Cart**: `OpenCartButton` (`src/components/Cart/OpenCart.tsx`) — icon giỏ hàng + badge số lượng (khi > 0); không có nút bọc, dùng làm trigger cho drawer Cart.

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

## 11. Voucher & User levels

**Trạng thái**: **Đã implement.** Chi tiết sprint và file mapping: [04-build/sprint-plan.md § Voucher & User Levels](04-build/sprint-plan.md#voucher--user-levels--sprint-tracking).

**Context**: Cần mã giảm giá (voucher) áp tại checkout và cấp độ thành viên (user level) để phân ưu đãi theo khách hàng.

**Decision (đã triển khai; mô tả thiết kế dưới đây)**:

### Voucher

- **Collection `vouchers`** (file `src/collections/Vouchers.ts`): code (text, unique, required), type (`percent` | `fixed`), value (number), minOrderAmount (optional), maxUses (optional), usedCount (number, default 0), validFrom / validTo (date, optional), active (boolean). Access: read có thể public (chỉ validate qua API) hoặc adminOnly; create/update/delete adminOnly.
- **Orders**: Mở rộng qua `ordersCollectionOverride` trong plugin — thêm field voucher (relationship to vouchers), discountAmount (number), voucherCode (text, lưu mã đã áp để hiển thị). Khi áp voucher: tăng usedCount của voucher (hook afterCreate order hoặc trong API apply).
- **Checkout**: Ô nhập mã; gọi endpoint hoặc Local API để validate (code tồn tại, active, trong khoảng validFrom–validTo, usedCount < maxUses, order total >= minOrderAmount); tính discount; gửi voucherId hoặc code khi tạo order; server tính lại total và lưu discountAmount + voucher vào order.
- **Validation**: Trùng thời gian với sale event trên sản phẩm: voucher áp vào order total (sau khi đã tính giá sản phẩm có thể đã sale). Quy ước: voucher giảm trên tổng đơn (subtotal hoặc total tùy quy ước); percent giới hạn max 100.

### User levels

- **Field trên Users**: Thêm `level` (select: `bronze`, `silver`, `gold`, `platinum` hoặc tương đương), defaultValue `bronze`; admin chỉnh. Optional: `saveToJWT: true` để frontend/API biết level không cần query user.
- **Logic nghiệp vụ (tùy chọn khi implement)**: Ví dụ level silver = 5% giảm thêm, gold = 10%, platinum = 15% + free shipping; áp tại checkout khi tính total. Có thể đặt bảng cấu hình (collection UserLevels) sau; MVP đủ field level + logic if/else hoặc map level → discount%.
- **Hiển thị**: Trang tài khoản hiển thị level hiện tại; checkout có thể hiển thị “Ưu đãi theo level” (nếu có).

**Lưu ý**: Đã implement đầy đủ (collections, hooks, endpoints, frontend VoucherInput + PriceBreakdown + UserLevelCard). Tham chiếu code và test: [04-build/sprint-plan.md](04-build/sprint-plan.md).

---

## 13. Decision 13: Tax (VAT)

**Trạng thái**: **Đã implement (backend + checkout UI).** Core logic thuế đang chạy theo thiết kế; các điểm còn lại (verify Stripe amount, test chuyên cho thuế) được theo dõi trong [04-build/sprint-plan.md](04-build/sprint-plan.md#tax-us10--sprint-tracking-core-đã-implement). Thiết kế và solution: [04-build/tax-feature-solution.md](04-build/tax-feature-solution.md).

**Context**: Shop bán hoa tại Việt Nam cần tuân thủ thuế VAT (Luật Thuế GTGT, VAT Law 48/2024/QH15 có hiệu lực 01/07/2025). Thuế suất phổ biến: 0%, 5%, 8% (tạm thời), 10%. Cần tính thuế trên đơn hàng, hiển thị rõ tại checkout và lưu vào order để hóa đơn, báo cáo.

**Decision**:

### Mô hình thuế

- **Tax mode**:  
  - `exclusive` (mặc định) — giá sản phẩm chưa thuế; thuế cộng thêm vào subtotal.  
  - `inclusive` — giá đã gồm thuế; hệ thống bóc tách phần thuế nội bộ, **không cộng thêm** cho khách.
- **Tax base**: Luôn tính trên **subtotal sau khi trừ voucher và level discount** (số tiền khách thực trả sau giảm giá).
- **Tax classes**: Thuế không còn là 1 số `%` cứng mà được định nghĩa qua collection `taxes` (name, rate) và gán cho Products / Categories / TaxSettings.

### Cấu hình (Global TaxSettings)

- `taxMode` (select: `exclusive` \| `inclusive`): chế độ giá.
- `defaultTaxClasses` (optional, hasMany → `taxes`):  
  - Nếu rỗng: không có thuế mặc định, chỉ tax gắn trên product/category mới áp dụng.  
  - Nếu có: dùng làm nhóm thuế fallback khi product/category không có taxClasses.
- Thứ tự resolve tax classes cho 1 dòng: `Product.taxClasses` → `Category.taxClasses` → `TaxSettings.defaultTaxClasses` → 0%.

### Mở rộng dữ liệu

| Vị trí | Field mới | Mô tả |
|--------|-----------|--------|
| **Carts** (override) | `originalSubtotal`, `voucherDiscount`, `levelDiscount` | Base cho discount & thuế. |
| **Carts** | `taxAmount` (number, default 0) | Tổng thuế dòng. |
| **Carts** | `taxRates` (json, readOnly) | Snapshot `{ name, rate, amount }[]`. |
| **Orders** (override) | `discountAmount`, `levelDiscount` | Snapshot giảm giá. |
| **Orders** | `taxAmount`, `taxRates` | Snapshot thuế tại thời điểm thanh toán. |
| **Globals** | `TaxSettings` | `taxMode`, `defaultTaxClasses`. |

### Luồng

1. **applyCartDiscounts**: Recalculate subtotal, voucher, level discounts, rồi resolve taxClasses theo thứ tự ưu tiên và tính `taxAmount`, `taxRates` dựa trên `taxMode`.
2. **copyVoucherToOrder**: Copy `voucher`, `discountAmount`, `levelDiscount`, `taxAmount`, `taxRates` từ cart sang order khi tạo đơn.
3. **Order total**: Với `exclusive`, tổng = subtotal sau giảm + `taxAmount` (+ shipping). Với `inclusive`, tổng = subtotal sau giảm (không cộng thêm thuế).
4. **PriceBreakdown**:  
   - Exclusive: hiển thị dòng thuế và cộng vào Total.  
   - Inclusive: chỉ hiển thị Subtotal/discounts; không show dòng thuế cho khách (thuế chỉ để report).

### Tích hợp Stripe

- Plugin ecommerce tạo PaymentIntent từ **cart total**. Cart total phải = `subtotal + taxAmount` (exclusive). Cần đảm bảo hook `applyCartDiscounts` set `data.subtotal` là số **chưa thuế** (taxable amount) và có field `taxAmount`; plugin có thể dùng `subtotal + taxAmount` làm amount, hoặc cần override adapter nếu plugin chỉ dùng `subtotal`. **Kiểm tra** plugin ecommerce: cart total = subtotal hay subtotal + shipping + tax. Nếu chỉ subtotal → cần mở rộng hoặc patch để total = subtotal + taxAmount.

### Mở rộng — US10.1 (thuế theo sản phẩm/danh mục)

- **Product**: gắn trực tiếp `taxClasses` để override category/global.
- **Category**: gắn `taxClasses` cho nhóm sản phẩm.
- Logic fallback: `Product.taxClasses` → `Category.taxClasses` → `TaxSettings.defaultTaxClasses` → 0%.
- Chi tiết tính toán xem thêm [04-build/tax-feature-solution.md](tax-feature-solution.md).

---

## 14. Decision 14: Bundle products / Bó hoa (Composite Products)

**Trạng thái**: **Chưa implement (thiết kế đã chốt).** Giải pháp chi tiết: [04-build/bundle-feature-solution.md](04-build/bundle-feature-solution.md). Hướng dẫn end user/admin: [guides/bundle-setup-workflow.md](guides/bundle-setup-workflow.md).

**Context**: Shop hoa cần bán các **bó hoa/bundle** được build từ nhiều sản phẩm con (hoa lan, hoa hồng, hoa cúc, phụ kiện...) vốn đã là product riêng có giá và tồn kho. Khi bán bó hoa:

- Không được vượt quá tồn kho thực tế của từng sản phẩm con.
- Giá, voucher, level discount và **thuế (tax)** phải phản ánh đúng mix sản phẩm con.
- Admin cần quy trình rõ ràng để tạo bó hoa từ catalog hiện có, không nhân đôi dữ liệu sản phẩm.

**Decision (mô hình & nguyên tắc)**:

### 14.1 Mô hình dữ liệu

- Phân loại `products` bằng field mới, ví dụ `productKind: 'simple' | 'bundle'`:
  - `simple`: sản phẩm đơn (như hiện tại) — dùng `inventory`/`variants.inventory` trực tiếp.
  - `bundle`: bó hoa/combo — inventory khả dụng **không dùng trực tiếp** `inventory` mà suy ra từ các sản phẩm con.
- Khi `productKind === 'bundle'`, bổ sung field `bundleItems` (BOM):
  - `product`: relationship → `products` (giới hạn chọn `productKind = 'simple'` ở phase 1).
  - `quantity`: số lượng đơn vị sản phẩm con trong 1 bó (min 1).
  - (Tuỳ chọn về sau) `overrideUnitPriceInVND`: nếu cần override cách tính giá bó.
- Ràng buộc:
  - Không cho chọn chính nó hoặc tạo vòng lặp trực tiếp (A chứa A, A chứa B chứa lại A).
  - Mỗi `bundleItem` có `quantity > 0`.
  - UI admin chỉ hiện `bundleItems` khi `productKind === 'bundle'`; có thể ẩn/readonly `inventory` cho bundle để tránh nhầm.

### 14.2 Chiến lược tồn kho

- Bó hoa **không có tồn kho riêng**; số bó tối đa build được từ tồn kho hiện có được tính bằng:
  - `maxBundlesAvailable = min_i floor(inventory_i / quantity_i)` với `inventory_i` là tồn kho của từng sản phẩm con.
- Ở trang product bundle:
  - Hiển thị \"Có thể bán tối đa N bó (theo tồn kho hiện tại)\" dựa trên `maxBundlesAvailable`.
  - Disable Add to Cart khi `maxBundlesAvailable = 0`.
- Khi Add to Cart / tăng số lượng bó trong cart:
  - Từ BOM tính `requiredQty[child] = quantityBundles * quantityChildInBOM`.
  - Kiểm tra với `child.inventory` (và lượng child đã nằm trong cart nếu cần) — nếu bất kỳ child thiếu tồn → chặn thao tác, trả message cụ thể.
- Khi tạo order (hoặc khi status chuyển sang `processing/completed`):
  - Expand nhu cầu từ các bó hoa và sản phẩm lẻ thành tổng `needed[productId]` cho toàn order.
  - Trong 1 transaction: kiểm tra `inventory >= needed` cho từng product; nếu thiếu → reject order; nếu đủ → trừ `inventory` từng product con tương ứng.
  - Sau khi trừ tồn con, tồn khả dụng của bundle tự động giảm (do phụ thuộc công thức trên).
- Mở rộng tương lai (không bắt buộc MVP):
  - Hỗ trợ mô hình \"pre-allocated bundle stock\" (admin phát hành trước X bó, trừ tồn child ngay lúc phát hành) bằng field như `bundleAllocatedStock` + hooks/job riêng.

### 14.3 Biểu diễn trong Cart/Order

- **Nguyên tắc**: Tận dụng tối đa logic `applyCartDiscounts` hiện có (voucher, level, thuế) → tránh thêm nhánh logic phức tạp.
- Phương án ưu tiên:
  - Về dữ liệu, một bó hoa trong cart/order **được expand thành nhiều dòng** ứng với các sản phẩm con:
    - VD bó \"Bouquet A\" (3 lan, 1 hồng, 5 cúc) → các `CartItem` tương ứng với `orchid`, `rose`, `chrysanthemum` với quantity đã nhân theo số bó.
  - Thêm metadata trên `CartItem`/`OrderItem` (JSON), ví dụ:
    - `bundleMeta = { bundleProductId, bundleName, quantityPerBundle }`.
  - UI (CartModal, Checkout, Order detail) group các dòng cùng `bundleProductId` dưới một header \"Bouquet A\" để người dùng vẫn cảm nhận là 1 bó hoa.
- Lợi ích:
  - **Voucher & level discount**: giữ nguyên stacking và proration như hiện tại; discount áp trên subtotal thực tế của từng product.
  - **Thuế**: logic thuế hiện có (theo `taxClasses` của product/category/global) tự động áp đúng cho từng thành phần của bó.
  - Đơn giản hoá hooks: không cần sửa `applyCartDiscounts` để hiểu khái niệm \"bundle\" ở phase 1.

### 14.4 Ảnh hưởng tới thuế (Tax)

- Mặc định, bó hoa **kế thừa thuế từ các sản phẩm con**:
  - Mỗi child product có `taxClasses` riêng (hoặc từ category/default); `applyCartDiscounts` đã tính `taxAmount`, `taxRates` theo từng dòng.
  - Order tax là tổng thuế của tất cả dòng; phần nào miễn thuế → không có tax; phần nào 8%/10% → có tax tương ứng.
- Không cần thêm config mới trong `TaxSettings` để hỗ trợ bundle ở phase 1.
- Nếu cần bundle có thuế riêng (khác với mix children) trong tương lai:
  - Có thể allow `taxClasses` trực tiếp trên product bundle và quy ước rõ: dùng thuế ở cấp bundle hay children.
  - Khi đó cần mở rộng `applyCartDiscounts` để xử lý logic này một cách nhất quán.

---

## 15. Gate G2 — Design Approved

- [x] Công nghệ chính (Payload, Next.js, DB) và cấu trúc thư mục đã ghi nhận.
- [x] Mô hình dữ liệu (collections, fields chính) và luồng sale (job) đã mô tả.
- [x] Frontend (routes, blocks, shop, search/filter) đã định rõ.
- [x] Điểm tích hợp (payment, email, jobs) đã liệt kê.
- [x] Thiết kế tính năng thuế (Tax US10) và bundle/bó hoa (composite products) đã được ghi nhận ở mức kiến trúc.

---

*Tài liệu thiết kế — Daisy Flower. SDLC 6.1.0, Stage 02.*
