# Tax Feature — Solution & Development Plan

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Design / Planning (đã có foundation + backend logic)

---

## 1. Tổng quan

Tài liệu này mô tả **kiến trúc và solution backend** cho tính năng **thuế (VAT)** trong Daisy Flower, bám sát code hiện tại:

- Dùng **Tax Classes** (collection `taxes`) để định nghĩa nhiều loại thuế khác nhau.
- **TaxSettings** (global) điều khiển **taxMode**:  
  - `exclusive`: giá chưa thuế, thuế cộng thêm.  
  - `inclusive`: giá đã gồm thuế, hệ thống chỉ bóc tách thuế nội bộ, **không cộng thêm cho khách**.
- Thuế có thể gắn **theo product**, **theo category**, hoặc **fallback từ `TaxSettings.defaultTaxClasses`** (nếu có).
- Logic thực hiện trong hook `applyCartDiscounts` (carts) và `copyVoucherToOrder` (orders).

**Tham chiếu**:  
- Requirements: [01-planning US10 & US10.1](01-planning/requirements.md)  
- Design: [02-design § 13](02-design/architecture-decisions.md#13-decision-13-tax-vat)  
- Hướng dẫn end user: [guides/tax-setup-workflow.md](guides/tax-setup-workflow.md)

---

## 2. Tech Stack & luồng giá

### 2.1 Tech stack

| Thành phần | Công nghệ |
|------------|-----------|
| CMS & Ecommerce | Payload CMS 3.x, @payloadcms/plugin-ecommerce |
| Frontend | Next.js 15 App Router, React Server/Client Components |
| Payment | Stripe (stripeAdapter) |
| Currency | VND (decimals: 0 — giá lưu trực tiếp, không nhân hệ số) |

### 2.2 Luồng giá hiện tại

1. Từ giá product/variant (hoặc sale price) → tính **originalSubtotal**.
2. Áp dụng **voucher** + **level discount** → tính **subtotal sau giảm giá**.
3. Từ subtotal + taxClasses → tính **taxAmount**, **taxRates** (theo `taxMode`).
4. Frontend dùng `subtotal`, `taxAmount`, `taxMode` để hiển thị **Total**:
   - `exclusive`: Total = Subtotal sau giảm + Tax.
   - `inclusive`: Total = Subtotal sau giảm (tax đã nằm trong giá).

---

## 3. Data model: Taxes, TaxSettings, Products/Categories

### 3.1 Collection `Taxes`

- `name`: Tên thuế (VD: `VAT 8%`, `VAT 10%`, `Thuế rượu 20%`).
- `rate`: Số phần trăm (0–100).

### 3.2 Global `TaxSettings`

File: `src/globals/TaxSettings.ts`

- `taxMode`: `exclusive` \| `inclusive`
  - `exclusive`: giá **chưa** gồm thuế → thuế cộng thêm vào subtotal.
  - `inclusive`: giá **đã** gồm thuế → thuế chỉ bóc tách nội bộ, không cộng thêm.
- `defaultTaxClasses` (optional, hasMany → `taxes`)
  - Nếu rỗng → **không có thuế mặc định**, chỉ product/category có taxClasses mới bị tính thuế.
  - Nếu có → dùng làm **fallback** khi product/category không có taxClasses riêng.

### 3.3 Products & Categories

- `Products`: field `taxClasses` (hasMany → `taxes`).
- `Categories`: field `taxClasses` (hasMany → `taxes`).

### 3.4 Carts & Orders

**Carts** (override qua plugin ecommerce):

- Thêm:
  - `originalSubtotal`
  - `voucherDiscount`, `levelDiscount`
  - `taxAmount`, `taxRates`
  - `shippingFee` (logic shipping sẽ được mô tả trong `shipping-feature-solution.md`)

**Orders** (override):

- Thêm:
  - `discountAmount`, `levelDiscount`
  - `taxAmount`, `taxRates`
  - `shippingFee`

---

## 4. Logic backend trong `applyCartDiscounts`

File: `src/hooks/carts/applyCartDiscounts.ts`

### 4.1 Các phase chính

1. **Early exit** cho cart rỗng → set tất cả về 0, clear voucher.
2. **Thu thập ID**:
   - Product IDs, Variant IDs, Voucher ID, Customer ID.
3. **Fetch song song** (Promise.all):
   - `sale-events` (active),
   - `products` (priceInVND, taxClasses, categories),
   - `variants` (priceInVND),
   - `voucher`,
   - `user`,
   - `user-level-settings`,
   - `tax-settings`.
4. **Chuẩn bị caches**:
   - `salePriceMap`, `productPriceMap`, `variantPriceMap`, `productMap`.
   - Gom Category IDs + TaxClass IDs từ products.
5. **Fetch categories** (1 batch) để lấy `taxClasses` từ category.
6. **Fetch taxes** (1 batch) dựa trên tất cả taxClass IDs từ product/category/`defaultTaxClasses`.

### 4.2 Tính base subtotal & giảm giá

1. **Base subtotal**:
   - `baseSubtotal = Σ (itemPrice × quantity)` (ưu tiên sale price).
   - `data.originalSubtotal = baseSubtotal`.
2. **Voucher**:
   - Validate publish, thời gian, minOrderAmount, maxUses, scope (`all` hoặc `specific`).
   - Tính `voucherDiscount`, clamp theo `maxDiscount` nếu có.
3. **Level discount**:
   - Dựa trên `user.level` + `UserLevelSettings.levels`, tính theo % của `baseSubtotal`.
4. **Tổng discount**:
   - `totalDiscount = min(voucherDiscount + levelDiscount, baseSubtotal)`.
   - Nếu vượt baseSubtotal → pro-rate lại `levelDiscount` để tổng không vượt 100%.
5. **Subtotal sau giảm**:
   - `data.subtotal = max(0, baseSubtotal - totalDiscount)`.

### 4.3 Resolve tax classes theo ưu tiên

Với mỗi item:

1. `lineTotal = itemPrice × quantity`.
2. `itemWeight = baseSubtotal > 0 ? lineTotal / baseSubtotal : 0`.
3. `itemDiscount = totalDiscount × itemWeight`.
4. `discountedLineTotal = max(0, lineTotal - itemDiscount)`.
5. Lấy danh sách taxClass IDs:
   - Nếu `product.taxClasses` có → dùng danh sách đó.
   - Ngược lại, gom tất cả `taxClasses` từ các `categories` mà product thuộc về.
   - Nếu vẫn không có → dùng `TaxSettings.defaultTaxClasses` (nếu set).
   - Nếu không có gì → dòng đó không chịu thuế (0%).

### 4.4 Tính thuế theo `taxMode`

Đọc `taxMode` từ `TaxSettings`:

- `exclusive`:
  - `itemTaxAmount = discountedLineTotal × rate / 100`.
- `inclusive`:
  - `itemTaxAmount = discountedLineTotal - discountedLineTotal / (1 + rate / 100)`.

Mỗi dòng có thể có nhiều taxClasses → loop qua từng `tid`:

- Cộng vào `totalTaxAmount`.
- Cập nhật `taxRates[tid] = { name, rate, amount }`.

Cuối cùng:

- `data.taxAmount = Math.round(totalTaxAmount)`.
- `data.taxRates = Object.values(taxRatesOutput).map(({ name, rate, amount }) => ({ name, rate, amount: Math.round(amount) }))`.

### 4.5 Ảnh hưởng lên tổng tiền

- **exclusive**:
  - Tổng khách phải trả (chưa tính shipping) = `subtotalSauGiảm + taxAmount`.
  - CheckoutPage đang cộng thêm `taxAmount` nếu `taxMode === 'exclusive'`.
- **inclusive**:
  - Giá đã gồm thuế, `taxAmount` chỉ để bóc tách nội bộ.
  - CheckoutPage **không cộng thêm** `taxAmount`; Total = Subtotal sau giảm giá.
  - `PriceBreakdown` **không render** hàng thuế khi `taxMode === 'inclusive'`.

Stripe integration: cần đảm bảo PaymentIntent.amount khớp với logic này (thực hiện trong phần payments/adapter; docs này chỉ mô tả constraint).

---

## 5. Tối ưu query

Để tránh N+1 queries:

- **1 batch global**:
  - UserLevelSettings, TaxSettings.
- **1 batch products/variants/sales/voucher/user**:
  - `products`, `variants`, `sale-events`, `vouchers`, `users`.
- **1 batch categories**:
  - Dựa trên Category IDs từ products.
- **1 batch taxes**:
  - Dựa trên taxClass IDs từ product/category/TaxSettings.

Phần còn lại dùng Map trong bộ nhớ, complexity O(N) theo số items trong cart.

---

## 6. US10 vs US10.1

- **US10 — Thuế mặc định**:
  - Cấu hình ở `TaxSettings.defaultTaxClasses` (có thể để trống).
  - Dùng như fallback chung cho toàn shop khi product/category không có taxClasses.
- **US10.1 — Thuế theo sản phẩm/danh mục**:
  - Gắn taxClasses trực tiếp vào Products/Categories để override default.
  - Fallback thứ tự: `Product.taxClasses` → `Category.taxClasses` → `defaultTaxClasses` → 0%.

Ở cả hai, `taxMode` quyết định:

- **exclusive**: Thuế cộng thêm, hiển thị tại checkout.
- **inclusive**: Thuế đã nằm trong giá; không cộng thêm, không show tax row cho khách.

---

*Tài liệu solution Tax — Daisy Flower. Đồng bộ với code hiện tại (TaxSettings, Taxes, applyCartDiscounts, PriceBreakdown).* 

# Tax Feature — Solution & Development Plan

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Design / Planning (chuẩn bị implement)

---

## 1. Tổng quan

Tài liệu mô tả **solution** và **kế hoạch phát triển** cho tính năng **thuế (VAT)** trên nền tảng Daisy Flower. Kiến trúc được thiết kế theo mô hình **Tax Classes (Nhóm Thuế)** thông qua Collection độc lập, cho phép áp dụng mức thuế linh hoạt cho từng dòng sản phẩm khác nhau trong cùng một đơn hàng, đáp ứng các tiêu chuẩn thương mại điện tử cấp độ doanh nghiệp và khả năng bảo lưu biểu thuế theo thời gian.

**Tham chiếu**: [01-planning US10 & US10.1](01-planning/requirements.md), [02-design § 13](02-design/architecture-decisions.md#13-decision-13-tax-vat). **Hướng dẫn end user**: [guides/tax-setup-workflow.md](guides/tax-setup-workflow.md).

---

## 2. Tech Stack & Bối cảnh hiện tại

### 2.1 Tech stack

| Thành phần | Công nghệ |
|------------|-----------|
| CMS & Ecommerce | Payload CMS 3.x, @payloadcms/plugin-ecommerce |
| Frontend | Next.js 15 App Router, React Server/Client Components |
| Payment | Stripe (stripeAdapter) |
| Currency | VND (decimals: 0 — giá lưu trực tiếp, không nhân hệ số) |

### 2.2 Luồng giá hiện tại
`Carts` đang được tính tổng = `(Item price * quantity) - Voucher Discount - Level Discount`. Plugin dùng tổng này làm Amount cho Checkout/Stripe.

---

## 3. Kiến trúc Tax Classes (Nhóm Thuế)

### 3.1 Cấu trúc cơ sở dữ liệu mới
Thay vì gán cứng 1 mức thuế chung, chúng ta chuyển sang mô hình linh hoạt với 1 Collection và 1 Global Config.

**A. Collection `Taxes` (Các nhóm thuế)**
Cho phép Admin tạo không giới hạn định nghĩa thuế:
- `name`: Tên loại thuế (VD: "VAT Hoa tươi", "VAT Cây cảnh", "Thuế tiêu thụ đặc biệt").
- `rate`: Phần trăm thuế suất (`0, 5, 8, 10...`).

**B. Global Config `TaxSettings`**
Chỉ dùng để cấu hình rules chung toàn hệ thống:
- `defaultTaxClass`: Relation tới `Taxes` collection. Nhóm thuế dự phòng mặc định khi sản phẩm hay danh mục không được gắn bất cứ loại thuế nào.
- `taxMode`: `exclusive` (Giá chưa thuế, thuế cộng thêm) hoặc `inclusive` (Giá đã gồm thuế). *MVP hiện tại chốt Exclusive.*

**C. Quan hệ với Sản phẩm & Danh mục**
- `Categories`: Bổ sung field `taxClass` (Relation to `Taxes`).
- `Products`: Bổ sung field `taxClass` (Relation to `Taxes` - Ghi đè lên hạng mục nếu có).

### 3.2 Quy trình Resolution Thuế (Thứ tự ưu tiên)
Khi tính thuế cho 1 line-item trong giỏ hàng, `applyCartDiscounts` sẽ dò tìm Thuế suất (`rate`) theo thứ tự ưu tiên sau:
1. `Product.taxClass` (Nếu Sp này có set riêng thuế, VD: Rượu 20%) -> Lấy % này.
2. `Category.taxClass` (Nếu Sản phẩm không có, lấy theo Category cha của nó).
3. `TaxSettings.defaultTaxClass` (Lấy từ global Tax Settings nếu có).
4. `0%` (Nếu không tìm thấy gì cả).

---

## 4. Công thức tính và Mở rộng Carts & Orders

### 4.1 Quy tắc Toán học & Phân bổ chiết khấu (Proration)
- **Chế độ**: Tax **exclusive** (giá chưa thuế; thuế cộng thêm) - *Phù hợp luật thuế năm 2026*.
- Vì Voucher và User Level trừ thẳng vào Subtotal, hệ thống bắt buộc phải **phân bổ rải đều (Prorate)** tổng số tiền giảm giá cho từng đối tượng trước khi áp thuế.

Quy trình tính cho mỗi dòng sản phẩm (Line Item):
1. Khởi tạo thuế suất dòng: `itemTaxRate = resolveRate(product, category, defaultTax)`
2. Tỉ trọng đóng góp của dòng: `itemWeight = (itemPrice × quantity) / originalSubtotal`
3. Mức giảm giá phân bổ cho dòng: `itemDiscount = totalDiscount × itemWeight`
4. Cơ sở tính thuế (Taxable Amount): `itemTaxableAmount = Math.max(0, (itemPrice × quantity) - itemDiscount)`
5. Tiền thuế của dòng: `itemTaxAmount = Math.round(itemTaxableAmount × itemTaxRate / 100)`

Cuối cùng:
- `taxAmount` (Giỏ hàng/Đơn hàng) = Tổng các `itemTaxAmount` cấu thành nên.
- `totalPayable` = `TaxableAmount` + `taxAmount` + `shippingFee` (Nếu shipping tham gia). *(Lưu ý: Stripe payment cũng thay đổi để charge = totalPayable).*

### 4.2 Mở rộng Fields
| Schema | Fields Bổ sung |
| ------ | ------------- |
| `Carts` | `taxAmount` (Tổng thuế), `taxBreakdown` (Tuỳ chọn lưu chi tiết) |
| `Orders`| `taxAmount`, `taxRates` (Snapshot lưu cấu trúc % thuế vào thời điểm thanh toán) |

*Mặc dù Tax Settings có thể đổi, nhưng Orders snapshot giúp kế toán duy trì hồ sơ lịch sử không bị thay đổi.*

---

## 5. Kế hoạch phát triển (Sprint)

### Sprint 1: Data model & Config
1. **Xóa `defaultTaxRate`** trong global `TaxSettings.ts`.
2. Tạo collection mới **`src/collections/Taxes.ts`** (Schema `name`, `rate`, `isDefault`). Đăng ký vào `payload.config.ts`.
3. Override plugin: Bổ sung logic `taxAmount`, `taxRates` cho Carts / Orders. Bổ sung field `taxClass` vào `Products` và `Categories` sử dụng plugin override.

### Sprint 2: Backend Logic & Phân bổ (Proration)
1. Cấu hình lại hook `applyCartDiscounts.ts` để đọc bảng cấu hình Thuế, truy vấn logic `resolveRate` cho từng line item.
2. Tính toán `totalDiscount`, phân bổ (Proration) để xác định `taxAmount` cuối.
3. Hook `copyVoucherToOrder`: chèn thêm lệnh copy snapshot `taxAmount` sang Đơn hàng chốt.

### Sprint 3: UI & Edge Cases
1. `PriceBreakdown.tsx` & `CartModal`: Render dòng VAT dựa vào logic tổng. (Ví dụ: `Thuế: + 10,000đ`).
2. Tối đa hoá tốc độ: Gom Query các sản phẩm, category, default tax 1 lần trên database thay vì từng item.

---

*Tài liệu solution Tax — Daisy Flower. Kiến trúc nâng cao Tax Classes. Cập nhật mới nhất*
