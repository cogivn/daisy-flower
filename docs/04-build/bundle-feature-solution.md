**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Design / Planning (chưa implement)

---

## 1. Tổng quan

Tài liệu này mô tả **solution & kế hoạch phát triển** cho tính năng **sản phẩm bó hoa/bundle (Composite Products)** trong Daisy Flower:

- Bó hoa được **build từ các sản phẩm con** (products simple) đã tồn tại, mỗi sản phẩm con có **giá** và **tồn kho** riêng.
- Khi bán bó hoa:
  - Không được vượt quá tồn kho thật của từng sản phẩm con.
  - Voucher, level discount và thuế (VAT) vẫn hoạt động đúng, phản ánh **mix sản phẩm con**.
- Admin có quy trình rõ ràng để tạo bó hoa từ catalog hiện tại, không nhân đôi dữ liệu.

**Tham chiếu**:  
- Requirements: (sẽ bổ sung mapping US khi có user story chính thức)  
- Design: [02-design § 14](../02-design/architecture-decisions.md#14-decision-14-bundle-products--bó-hoa-composite-products)  
- Hướng dẫn end user/admin: [guides/bundle-setup-workflow.md](../guides/bundle-setup-workflow.md)

---

## 2. Mô hình dữ liệu: Products & BundleItems (BOM)

### 2.1 Phân loại Product: simple vs bundle

**Mục tiêu**: Không tạo collection mới, mà mở rộng `products` để hỗ trợ **bundle/bó hoa**.

Đề xuất thêm field mới trên collection `products`:

- `productKind: 'simple' | 'bundle'`
  - `simple` (mặc định): sản phẩm đơn như hiện tại.
  - `bundle`: bó hoa/combo được build từ nhiều sản phẩm con.

Quy ước:

- `simple`:
  - Dùng `inventory` (product-level) và/hoặc `variants[].inventory` (variant-level) làm nguồn truth về tồn kho.
- `bundle`:
  - `inventory` có thể để `0` hoặc read-only, **không dùng để bán trực tiếp**.
  - Tồn kho khả dụng của bó hoa được suy ra từ tồn kho các sản phẩm con (xem §3).

### 2.2 BundleItems (Bill of Materials)

Khi `productKind === 'bundle'`, product có thêm field:

- `bundleItems`: array of:
  - `product`: relationship → `products` (phase 1 chỉ cho phép chọn `productKind = 'simple'` để tránh vòng lặp phức).
  - `quantity`: number (số lượng đơn vị sản phẩm con trong 1 bó, `min: 1`).
  - (Tuỳ chọn, giai đoạn sau) `overrideUnitPriceInVND`: number — nếu cần giá bó hoa không chỉ bằng tổng giá con.

**Ràng buộc & validate**:

- Không cho chọn **chính product hiện tại** làm component (tránh A chứa A).
- Không cho vòng lặp trực tiếp kiểu A → B → A (nếu sau này cho phép bundle chứa bundle).
- Mỗi `bundleItem.quantity > 0`.
- UI admin:
  - Chỉ hiển thị tab/section `Bundle composition` khi `productKind === 'bundle'`.
  - Có thể ẩn hoặc đặt `inventory` của bundle là read-only để tránh admin chỉnh tay sai.

---

## 3. Chiến lược tồn kho: pre-allocated (mô hình được chọn)

### 3.1 Công thức tồn kho khả dụng cho bó hoa

Giả sử:

- Bó hoa `B` có `bundleItems = [ (product_i, qty_i) ]` cho i = 1..n.
- `inventory_i` là tồn kho hiện tại của `product_i` (simple product).

Số bó hoa tối đa có thể build từ tồn kho hiện tại là:

```text
maxBundlesAvailable = min_i floor(inventory_i / qty_i)
```

Ví dụ:

- Bó A = 3 lan, 1 hồng, 5 cúc.
- Tồn kho: lan = 10, hồng = 1, cúc = 20.
- `maxBundlesAvailable = min( floor(10/3), floor(1/1), floor(20/5) ) = min(3,1,4) = 1`.

### 3.2 Hiển thị tồn kho bó hoa (frontend)

Tại trang `/products/[slug]`:

- Nếu `productKind === 'bundle'`:
  - Fetch `bundleItems` + inventory của các `product` con.
  - Tính `maxBundlesAvailable`.
  - Hiển thị:
    - Nếu `maxBundlesAvailable > 0`: \"Có thể bán tối đa **N bó** dựa trên tồn kho hiện tại\".
    - Nếu `maxBundlesAvailable = 0`: disable Add to Cart, hiển thị thông báo hết hàng.

### 3.3 Kiểm tra khi Add to Cart

Khi user nhấn Add to Cart cho bó hoa với quantity `Q_bundles`:

1. Từ BOM, tính nhu cầu trên từng sản phẩm con:
   - `requiredQty[product_i] = Q_bundles * qty_i`.
2. (Tuỳ biến) Tính thêm `alreadyInCartQty[product_i]` nếu đồng thời cho phép bán lẻ child:
   - Đảm bảo `inventory_i >= requiredQty[product_i] + alreadyInCartQty[product_i]`.
3. Nếu bất kỳ `product_i` **không đủ tồn**:
   - Reject add; trả về message:
     - VD: `Không đủ hoa lan để thêm bó hoa này (cần 3, còn 2 trong kho).`

Khi user **tăng số lượng bó** trong cart:

- Lặp lại quy trình kiểm tra tương tự dựa trên tổng quantity bó trong cart.

### 3.4 Đồng bộ tồn kho khi tạo Order (critical)

Để tránh **oversell** do nhiều user checkout cùng lúc:

- Kiểm tra tồn kho quan trọng nhất phải xảy ra **ở bước tạo order / chuyển status**, không chỉ tại Add to Cart.

Đề xuất flow (ở hooks `orders`):

1. Khi `orders.beforeChange` (operation `create`, hoặc khi chuyển status sang `processing/completed`):
   - Đọc các items (từ cart liên quan hoặc trực tiếp từ order).
   - Với mỗi item:
     - Nếu là **bundle** → expand BOM thành nhu cầu `needed[product_i] += qty_i * quantityBundles`.
     - Nếu là **simple product** → `needed[product] += quantity`.
   - Thu được map `needed: productId -> totalRequired`.
2. Trong **1 transaction**:
   - Fetch inventory hiện tại cho tất cả `productId` trong `needed`.
   - Nếu tồn kho bất kỳ sản phẩm nào **< needed[productId]**:
     - Throw error, rollback order.
   - Nếu đủ:
     - Update `inventory = inventory - needed[productId]` cho từng product.

Kết quả:

- Đảm bảo **không có đơn nào vượt tồn kho**, kể cả khi 2 user checkout gần như đồng thời.
- Vì tồn kho con giảm, `maxBundlesAvailable` của bó hoa sẽ tự giảm theo (không cần cập nhật riêng).

### 3.5 Pre-allocated bundle stock (được áp dụng)

Mô hình **được áp dụng cho Daisy Flower** là:

- Sử dụng tồn kho **riêng cho bundle** (có thể dùng chính field `inventory`), và:
  - Khi admin **tăng số bó**:
    - Hệ thống dùng BOM để kiểm tra tồn kho con đủ cho số bó tăng thêm.
    - Nếu đủ → trừ tồn kho con tương ứng và cập nhật tồn kho bundle.
  - Khi admin **giảm số bó** (thu hồi bó chưa bán):
    - Hệ thống cộng trả lại tồn kho con tương ứng.
- Khi bán bó hoa:
  - Checkout chỉ trừ tồn kho bundle (không động thêm vào kho con, vì kho con đã bị trừ lúc phát hành).

Mô hình này phục vụ rất tốt các case \"đóng gói sẵn\" (VD: chuẩn bị trước 20 bó ngày lễ) và giúp checkout đơn giản, trong khi vẫn đảm bảo không vượt tồn kho thực tế của các sản phẩm con nhờ bước phát hành/thu hồi có kiểm soát.

---

## 4. Biểu diễn bundle trong Carts & Orders

### 4.1 Nguyên tắc chung

Mục tiêu là **không phá vỡ** logic sẵn có của plugin ecommerce + hooks:

- `applyCartDiscounts` đang phụ trách:
  - Tính `originalSubtotal`, `voucherDiscount`, `levelDiscount`, `subtotal`.
  - Tính `taxAmount`, `taxRates` theo `taxClasses` của product/category/global.
- Carts & Orders đã override để lưu:
  - `voucher`, `voucherCode`, `discountAmount`, `levelDiscount`.
  - `taxAmount`, `taxRates`.

=> Không muốn dạy `applyCartDiscounts` hiểu khái niệm mới \"bundle\" ngay từ đầu, tránh tăng complexity.

### 4.2 Phương án ưu tiên: Expand bó hoa thành nhiều dòng sản phẩm con

**Về dữ liệu**:

- Khi user add 1 bó hoa vào cart:
  - Thực chất backend sẽ tạo **nhiều `CartItem`** tương ứng với các sản phẩm con:
    - VD bó \"Bouquet A\" (3 lan, 1 hồng, 5 cúc) →  
      - item 1: product = `orchid`, quantity = `3 * số_bó`.  
      - item 2: product = `rose`, quantity = `1 * số_bó`.  
      - item 3: product = `chrysanthemum`, quantity = `5 * số_bó`.  
  - Mỗi item con có metadata JSON, ví dụ:
    - `bundleMeta = { bundleProductId, bundleName, quantityPerBundle }`.

**Về UI**:

- Cart/Checkout/Order detail group các dòng có cùng `bundleMeta.bundleProductId`:
  - Hiển thị:
    - Header: tên bó hoa (VD \"Bouquet A\", ảnh đại diện, tổng giá).
    - Bên dưới: danh sách thành phần (3x lan, 1x hồng, 5x cúc) — đọc từ metadata/BOM.
- Người dùng:
  - Chỉ được chỉnh quantity ở **cấp bundle** (tăng/giảm số bó).
  - Không chỉnh số lượng từng dòng component để tránh phá vỡ cấu trúc.

**Lợi ích**:

- **Voucher & level discount**:
  - `applyCartDiscounts` vẫn tính discount trên tổng subtotal của từng product như hiện tại.
  - Voucher scope `specific` theo product vẫn hoạt động chính xác (chỉ những product thuộc scope mới được giảm).
- **Thuế**:
  - Mỗi component product có `taxClasses` riêng (hoặc thừa hưởng category/default).
  - `applyCartDiscounts` phân bổ discount và tính thuế từng dòng → tổng thuế của order tự phản ánh đúng mix thành phần bó hoa.
- **Đơn giản hoá hooks**:
  - Không phải chỉnh toán học trong `applyCartDiscounts` để hiểu khái niệm bundle ở phase 1.

### 4.3 Phương án khác (ít khuyến nghị cho MVP)

Phương án khác là giữ bó hoa là **1 dòng `CartItem`** riêng, với:

- Field `bundleDefinition` chứa BOM.
- `applyCartDiscounts` cần:
  - Expand logic để tính subtotal/thuế theo BOM.
  - Quản lý discount theo per-component trong 1 item phức tạp.

Nhược điểm:

- Đụng rất sâu vào `applyCartDiscounts` (voucher, level, tax).
- Tăng rủi ro bug trên tính toán giá/thuế.

=> **Không khuyến nghị** cho MVP; có thể cân nhắc nếu sau này có yêu cầu UX hoặc kế toán rất đặc thù.

---

## 5. Ảnh hưởng tới Thuế (Tax) của bó hoa

### 5.1 Mô hình mặc định (khuyến nghị)

Với phương án 4.2 (expand items con):

- Không cần thay đổi gì trong:
  - `TaxSettings` / `taxes` / `taxClasses`.
  - Hook `applyCartDiscounts`.
- Hệ thống hiện tại đã:
  - Phân bổ `voucherDiscount` + `levelDiscount` xuống từng dòng theo tỷ lệ `lineTotal/baseSubtotal`.
  - Tính thuế cho từng dòng dựa trên:
    - `Product.taxClasses`.
    - `Category.taxClasses`.
    - `TaxSettings.defaultTaxClasses`.
- Bó hoa, trên thực tế:
  - Là tổng hợp của nhiều dòng sản phẩm con.
  - Nếu component nào miễn thuế → phần đó không bị tính VAT.
  - Nếu component nào có VAT 8%/10% → phần đó được tính đúng VAT tương ứng.

### 5.2 Bundle có thuế riêng (mở rộng tương lai)

Nếu sau này có nhu cầu:

- Bó hoa có chính sách thuế riêng (không đơn thuần là tổng thuế thành phần), có thể:
  - Cho phép đặt `taxClasses` trực tiếp trên product bundle.
  - Định nghĩa rõ quy tắc:
    - Dùng thuế bundle **ghi đè** children?  
    - Hay kết hợp (phức tạp, thường tránh nếu không có lý do pháp lý rõ ràng).
  - Mở rộng `applyCartDiscounts` để:
    - Nhận diện items thuộc bundle.
    - Tính toán `taxAmount` theo quy tắc mới, ghi nhận snapshot rõ ràng cho kế toán.

Đề xuất:

- Phase 1 (MVP) giữ mô hình **thuế theo children** để:
  - Giảm complexity.
  - Đảm bảo tính đúng và dễ audit.

---

## 6. Kế hoạch phát triển (Sprint)

### 6.1 Sprint 1 — Data model & Admin

1. **Mở rộng Products**:
   - Thêm field `productKind` (`simple` \| `bundle`).
   - Thêm field `bundleItems` (array) với validate (product simple, quantity > 0, tránh vòng lặp).
2. **Admin UI**:
   - Tab/section \"Bundle composition\" chỉ hiển thị khi `productKind === 'bundle'`.
   - Ẩn hoặc đặt `inventory` của bundle read-only.
3. **Types**:
   - Chạy `pnpm generate:types` để cập nhật `payload-types.ts`.

### 6.2 Sprint 2 — Backend logic & Inventory

1. **Add to Cart / Cart hooks**:
   - Endpoint/hook khi add bundle:
     - Kiểm tra tồn kho theo BOM.
     - Expand bundle thành các `CartItem` child + metadata bundling.
2. **Order hooks**:
   - Viết hook `orders.beforeChange` để:
     - Expand nhu cầu từ bundle + simple items thành `needed[productId]`.
     - Kiểm tra & trừ tồn trong transaction; reject order nếu thiếu.

### 6.3 Sprint 3 — Frontend UI

1. **Product page**:
   - Khi `productKind === 'bundle'`, hiển thị:
     - Thành phần bó hoa (danh sách products con + quantity).
     - `maxBundlesAvailable`.
2. **Cart & Checkout UI**:
   - Group các `CartItem` con theo `bundleMeta.bundleProductId`.
   - Cho phép chỉnh quantity ở cấp bundle; không cho chỉnh lẻ từng component.

### 6.4 Sprint 4 — Tests & Docs

1. **Tests**:
   - Unit/integration test:
     - Không cho add bundle khi `inventory` bundle = 0.
     - Khi admin tăng/giảm `inventory` bundle, tồn kho con thay đổi đúng theo BOM.
     - Thuế đơn hàng đúng khi mix sản phẩm miễn thuế và chịu thuế.
2. **Docs**:
   - Cập nhật:
     - `architecture-decisions.md` (Decision 14 — đã có).
     - `sprint-plan.md` (tracking US bundle).
     - `guides/bundle-setup-workflow.md` (hướng dẫn end user).

---

## 7. Optional: Nhập kho (Goods Receipts) & Stock Movements

Tính năng này **không bắt buộc** cho MVP, nhưng được đề xuất cho giai đoạn sau nếu cần quản lý kho chi tiết hơn (biết đã nhập bao nhiêu, nhập khi nào, từ đâu).

### 7.1 Goods Receipts / Phiếu nhập kho

- Tạo collection mới `goods-receipts` (tên gợi ý):
  - `code`: mã phiếu (GR-0001...).
  - `supplier`: thông tin nhà cung cấp (text hoặc relationship).
  - `receivedAt`: ngày/giờ nhập kho.
  - `items`: array:
    - `product`: relationship → `products` (simple hoặc bundle tuỳ rule).
    - `quantity`: số lượng nhập.
    - (Tuỳ chọn) `unitCost`: giá vốn để tính cost.
- Hook `afterChange` (hoặc `beforeChange` khi status chuyển sang `received`):
  - Với mỗi item:
    - **Cộng** `quantity` vào `inventory` sản phẩm tương ứng.

### 7.2 Stock Movements / Lịch sử dịch chuyển kho

- Tạo collection `stock-movements` (log chỉ đọc):
  - `product`: relationship → `products`.
  - `type`: `'purchase' | 'sale_online' | 'sale_offline' | 'bundle_issue' | 'bundle_return' | 'manual_adjust' | ...`.
  - `quantityChange`: +10, -3, ...
  - `reference`: liên kết tới `order`, `goods-receipt` hoặc ID nghiệp vụ khác.
  - `createdAt`: thời điểm ghi nhận.
- Mỗi khi:
  - Nhập kho (phiếu nhập),
  - Bán online (order),
  - Bán offline (endpoint barcode),
  - Phát hành/thu hồi bundle,
  - Điều chỉnh tồn thủ công,
- Hệ thống đều tạo 1 bản ghi `stock-movement`. Điều này cho phép:
  - Audit từng sản phẩm: đã nhập/xuất/điều chỉnh bao nhiêu và khi nào.

### 7.3 Offline sales / Barcode endpoint (gợi ý)

- Thêm endpoint (ví dụ) `POST /api/offline-sales`:
  - Body: `{ barcode, quantity, direction: 'decrease' | 'increase', channel: 'offline' }`.
  - Backend:
    - Tìm product/bundle theo `barcode`.
    - Trừ/hoàn `inventory` tương ứng (simple hoặc bundle pre-allocated).
    - Ghi log `stock-movement` type `sale_offline` hoặc `manual_adjust`.
- Có thể build một **POS mini app** (web) dùng camera/đầu đọc barcode để gọi endpoint này, giúp bán offline cập nhật kho realtime giống online.

---

*Tài liệu solution Bundle — Daisy Flower. SDLC 6.1.0, Stage 04 (BUILD).*

