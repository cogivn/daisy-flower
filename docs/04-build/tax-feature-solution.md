# Tax Feature — Solution & Development Plan

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Design / Planning (chưa implement)

---

## 1. Tổng quan

Tài liệu mô tả **solution** và **kế hoạch phát triển** cho tính năng **thuế (VAT)** trên nền tảng Daisy Flower. Dựa trên nghiên cứu mã nguồn hiện tại (Payload ecommerce plugin, applyCartDiscounts, PriceBreakdown, copyVoucherToOrder) và quy định thuế Việt Nam.

**Tham chiếu**: [01-planning US10](01-planning/requirements.md), [02-design § 13](02-design/architecture-decisions.md#13-decision-13-tax-vat). **Hướng dẫn end user**: [guides/tax-setup-workflow.md](guides/tax-setup-workflow.md).

---

## 2. Tech Stack & Bối cảnh hiện tại

### 2.1 Tech stack

| Thành phần | Công nghệ |
|------------|-----------|
| CMS & Ecommerce | Payload CMS 3.x, @payloadcms/plugin-ecommerce |
| Frontend | Next.js 15 App Router, React Server/Client Components |
| Database | SQLite (@payloadcms/db-sqlite) |
| Payment | Stripe (stripeAdapter) |
| Currency | VND (decimals: 0 — giá lưu trực tiếp, không nhân hệ số) |

### 2.2 Luồng giá hiện tại

```
Product/Variant priceInVND
    ↓ (sale event nếu active)
Item price (VND)
    ↓ sum × quantity
originalSubtotal
    ↓ - voucherDiscount - levelDiscount
subtotal (cart)
    ↓
Order amount (plugin create order từ cart)
    ↓
Stripe PaymentIntent amount
```

- **applyCartDiscounts** (`src/hooks/carts/applyCartDiscounts.ts`): Chạy `beforeChange` trên cart; tính subtotal từ item prices (sale/product/variant), áp voucher + level discount, set `data.subtotal = baseSubtotal - totalDiscount`.
- **copyVoucherToOrder** (`src/hooks/orders/copyVoucherToOrder.ts`): Copy voucher, discountAmount, levelDiscount từ cart sang order khi create.
- **PriceBreakdown** (`src/components/checkout/PriceBreakdown.tsx`): Subtotal, Voucher −, Level −, Total.
- **Plugin ecommerce**: Cart total (= subtotal) dùng cho Stripe; order amount từ cart.

### 2.3 Điểm cần mở rộng

| Điểm | Hiện tại | Sau khi có Tax |
|------|----------|----------------|
| Cart subtotal | Số tiền sau discount (taxable amount) | Giữ nguyên; thêm taxAmount, taxRate |
| Cart total (Stripe) | = subtotal | = subtotal + taxAmount |
| Order | amount, discountAmount, levelDiscount | + taxAmount, taxRate |
| PriceBreakdown | Subtotal, discounts, Total | + dòng VAT (taxAmount) |

---

## 3. Solution Design

### 3.1 Mô hình thuế

- **Chế độ**: Tax **exclusive** (giá chưa thuế; thuế cộng thêm) - *Phù hợp luật thuế năm 2026*.
- **Cơ sở tính thuế**: `taxableAmount = subtotal` (sau voucher + level discount).
  - *Nếu shipping fee không chịu thuế*: `total = taxableAmount + taxAmount + shippingFee`.
  - *Nếu shipping fee chịu thuế*: `shippingFee` cũng được cộng trực tiếp vào `taxableAmount` trước khi nhân thuế suất.
- **Công thức gốc**:  
  `taxAmount = Math.round(taxableAmount × taxRate / 100)`  
  `total = taxableAmount + taxAmount + shippingFee (nếu có)`
- **Stripe**: Số tiền thanh toán = `total`.

### 3.2 Cấu hình (Global TaxSettings)

| Field | Type | Mô tả |
|-------|------|--------|
| `defaultTaxRate` | number | Thuế suất mặc định (0–100, VD: 8). |
| `taxMode` | select | `exclusive` \| `inclusive` — MVP chỉ dùng exclusive. |
| `label` | text | Nhãn hiển thị (VD: "VAT", "Thuế GTGT"). |

### 3.3 Mở rộng Carts

| Field | Type | Mô tả |
|-------|------|--------|
| `taxAmount` | number | Thuế tính được (VND). |
| `taxRate` | number | Snapshot thuế suất đã dùng (%). |

**Logic trong applyCartDiscounts** (cuối hook, sau khi set data.subtotal):

```ts
// taxableAmount = data.subtotal (đã trừ discount)
const taxableAmount = data.subtotal as number
const settings = await req.payload.findGlobal({ slug: 'tax-settings', req })
const rate = (settings?.defaultTaxRate as number) ?? 0
data.taxRate = rate
data.taxAmount = rate > 0 ? Math.floor((taxableAmount * rate) / 100) : 0
// Plugin cần dùng (subtotal + taxAmount) làm total — kiểm tra plugin behavior
```

**Lưu ý**: Plugin ecommerce có thể dùng `cart.subtotal` làm amount. Cần verify: nếu plugin chỉ dùng subtotal → phải patch adapter hoặc mở rộng field `total` / override logic tạo PaymentIntent để dùng `subtotal + taxAmount`.

### 3.4 Mở rộng Orders

| Field | Type | Mô tả |
|-------|------|--------|
| `taxAmount` | number | Thuế đơn hàng (VND). |
| `taxRate` | number | Snapshot thuế suất (%). |

**Logic trong copyVoucherToOrder**: Thêm copy `taxAmount`, `taxRate` từ cart sang order.
*Lưu ý*: `taxRate` và `taxAmount` được lưu dưới dạng snapshot (bản lưu cục bộ ngay tại thời điểm đặt hàng). Thay đổi `TaxSettings.defaultTaxRate` trên cấu hình của Admin sau này sẽ **chỉ ảnh hưởng đơn mới**; các đơn cũ giữ nguyên biểu thuế đã lưu.

**Order amount**: Plugin tạo order từ cart. Order `amount` cần = total (subtotal + taxAmount). Nếu plugin set amount = cart.subtotal → cần hook `beforeChange` order để set `data.amount = (data.amount ?? 0) + (cart.taxAmount ?? 0)` hoặc tương đương. **Cần đọc source plugin** để xác định chính xác.

### 3.5 Mở rộng PriceBreakdown

- Props: thêm `taxAmount`, `taxRate`, `taxLabel`.
- Hiển thị dòng "VAT (8%)" hoặc `{taxLabel} ({taxRate}%)`: `+ taxAmount`.
- Total = `originalSubtotal - voucherDiscount - levelDiscount + taxAmount` (= subtotal + taxAmount).

### 3.6 Cart drawer / header

- CartModal hiển thị total; nếu cart có taxAmount thì total = subtotal + taxAmount. Hiện tại CartModal dùng `cart.subtotal` — cần đổi thành `(cart.subtotal ?? 0) + (cart.taxAmount ?? 0)` khi có tax.

---

## 4. Phụ thuộc Plugin Ecommerce

**Rủi ro**: Plugin `@payloadcms/plugin-ecommerce` có thể:
- Dùng `cart.subtotal` làm PaymentIntent amount.
- Dùng `cart.subtotal` làm order `amount`.

Nếu vậy:
- **Option A**: Lưu `subtotal` = taxable amount (sau discount); thêm `taxAmount`. Patch hoặc override adapter để PaymentIntent amount = `subtotal + taxAmount`. Order amount tương tự.
- **Option B**: Nhập thuế vào `subtotal` (subtotal = taxable + tax). Không tách riêng — dễ hiển thị sai, không đúng chuẩn hóa đơn.
- **Khuyến nghị**: Option A — giữ subtotal là taxable, thêm taxAmount; override adapter hoặc hook nếu cần.

**Action**: Trước khi code, cần `grep` / đọc source plugin để xác định:
1. PaymentIntent amount lấy từ đâu (cart.subtotal? cart.total?).
2. Order amount set như thế nào.

### 4.2 Tối ưu query thuế

- **Global TaxSettings**:
  - Query **1 lần cho cả cart**: `findGlobal('tax-settings')`.
  - Không query lại cho từng item.
- **Product + Category**:
  - Khi đã `find` products để lấy `priceInVND`, thêm luôn các field thuế trong **cùng một query**:
    - Product: `taxExempt`, `taxRateOverride`, `categories`.
    - Category: `taxRateOverride` (thông qua `categories` nếu dùng depth/select phù hợp).
  - Như vậy, chỉ cần:
    - 1 query **global**.
    - 1 query **batch products** (nhiều id) kèm thông tin thuế.
- **Lựa chọn tối ưu hơn — `effectiveTaxRate`**:
  - Thêm field `effectiveTaxRate` trên Product (ẩn admin).
  - Hook `beforeValidate`/`beforeChange` Product:
    - Tính sẵn: `effectiveTaxRate = taxExempt ? 0 : (productOverride ?? categoryOverride ?? defaultTaxRate)`.
  - Trong `applyCartDiscounts`, chỉ cần đọc 1 field `effectiveTaxRate` (đã được batch load cùng product), không cần tra Category hay Global cho từng item.

---

## 5. Kế hoạch phát triển (Sprint)

### Sprint 1: Data model & config

| Task | File | Mô tả |
|------|------|--------|
| Global TaxSettings | `src/globals/TaxSettings.ts` | defaultTaxRate, taxMode, label. |
| Carts override | `src/plugins/index.ts` | Thêm fields taxAmount, taxRate. |
| Orders override | `src/plugins/index.ts` | Thêm fields taxAmount, taxRate. |
| Đăng ký TaxSettings | `payload.config.ts` | globals: [... existing, TaxSettings]. |
| generate:types | — | Chạy sau khi thêm schema. |

### Sprint 2: Logic tính thuế

| Task | File | Mô tả |
|------|------|--------|
| applyCartDiscounts | `src/hooks/carts/applyCartDiscounts.ts` | Cuối hook: đọc TaxSettings, tính taxAmount, taxRate; gán vào data. |
| copyVoucherToOrder | `src/hooks/orders/copyVoucherToOrder.ts` | Select thêm taxAmount, taxRate; copy sang order. |
| Order amount | Hook hoặc copyVoucherToOrder | Đảm bảo order.amount = subtotal + taxAmount (sau khi verify plugin). |
| Stripe amount | Adapter / hook | Verify và nếu cần override PaymentIntent amount = subtotal + taxAmount. |

### Sprint 3: Frontend UI

| Task | File | Mô tả |
|------|------|--------|
| PriceBreakdown | `src/components/checkout/PriceBreakdown.tsx` | Thêm dòng VAT; Total = subtotal + taxAmount. |
| CheckoutPage | `src/components/checkout/CheckoutPage.tsx` | Truyền taxAmount, taxRate từ cart xuống PriceBreakdown. |
| CartModal | `src/components/Cart/CartModal.tsx` | Total = (cart.subtotal ?? 0) + (cart.taxAmount ?? 0). |
| Order detail | `src/app/(app)/(account)/orders/[id]/page.tsx` | Hiển thị taxAmount nếu có. |

### Sprint 4: Kiểm thử & điều chỉnh

| Task | Mô tả |
|------|--------|
| Unit / integration test | Tax calculation, copy to order. |
| E2E checkout | Verify Stripe nhận đúng total (subtotal + tax). |
| Edge cases | taxRate = 0; cart rỗng; kết hợp voucher + level + tax. |
| Docs | Cập nhật architecture § 13, sprint-plan, project-progress. |

---

## 6. File mapping (tóm tắt)

| File | Thay đổi |
|------|----------|
| `src/globals/TaxSettings.ts` | **Mới** — global config. |
| `src/plugins/index.ts` | Thêm taxAmount, taxRate vào carts + orders override. |
| `src/payload.config.ts` | Đăng ký global TaxSettings. |
| `src/hooks/carts/applyCartDiscounts.ts` | Logic tính thuế cuối hook. |
| `src/hooks/orders/copyVoucherToOrder.ts` | Copy taxAmount, taxRate sang order. |
| `src/components/checkout/PriceBreakdown.tsx` | Props + UI dòng thuế. |
| `src/components/checkout/CheckoutPage.tsx` | Truyền tax từ cart. |
| `src/components/Cart/CartModal.tsx` | Total = subtotal + taxAmount. |
| `src/app/(app)/(account)/orders/[id]/page.tsx` | Hiển thị tax (tùy chọn). |

---

## 7. Quy định thuế Việt Nam (tham khảo)

- **VAT rates**: 0%, 5%, 8% (tạm), 10% (Luật 48/2024/QH15 từ 01/07/2025).
- **Hoa tươi, nông sản**: Có thể thuộc nhóm ưu đãi hoặc 5% — cần tham khảo kế toán/thuế vụ.
- **B2C**: Thường giá đã gồm VAT (inclusive) hoặc chưa (exclusive) tùy chính sách shop. Solution hỗ trợ cả hai qua `taxMode`.

---

## 8. US10.1 — Thuế theo sản phẩm / danh mục

**Phụ thuộc**: US10 (thuế mặc định) đã implement.

### 8.1 Mô hình

| Vị trí | Field | Mô tả |
|--------|-------|--------|
| **Product** | `taxExempt` | boolean — sản phẩm miễn thuế (0%). |
| **Product** | `taxRateOverride` | number (0–100) — thuế suất riêng (VD: rượu 20%). |
| **Category** | `taxRateOverride` | number (0–100) — thuế suất mặc định cho sản phẩm trong danh mục. |

### 8.2 Thứ tự ưu tiên thuế suất

```
product.taxExempt = true  → taxRate = 0
product.taxRateOverride   → dùng giá trị này
category.taxRateOverride  → dùng giá trị đầu tiên từ categories (hoặc primary)
TaxSettings.defaultTaxRate → fallback
```

### 8.3 Công thức tính

- Mỗi line item: `taxRate = resolveRate(product, category, settings)`
- `itemTaxAmount = Math.floor(itemPrice × quantity × taxRate / 100)`
- `taxAmount` (cart/order) = tổng `itemTaxAmount`

### 8.4 Tối ưu hoá tra cứu thuế suất

- Không nên query riêng từng collection cho mỗi sản phẩm:
  - TaxSettings: đọc **1 lần** ở đầu hook.
  - Products: `find` batch (theo ids trong cart) và select thêm các field `taxExempt`, `taxRateOverride` và `categories.taxRateOverride`.
- Có thể dùng trường `effectiveTaxRate` trên Product:
  - Tính trước trong hook Product (`beforeValidate`/`beforeChange`) dựa trên TaxSettings + Category.
  - Khi tính thuế cart, chỉ đọc `effectiveTaxRate` (batch load) → không cần truy vấn Category lại.

### 8.5 File mapping (US10.1)

| File | Thay đổi |
|------|----------|
| `src/collections/Products/index.ts` | Thêm `taxExempt`, `taxRateOverride` |
| `src/collections/Categories.ts` | Thêm `taxRateOverride` |
| `src/hooks/carts/applyCartDiscounts.ts` | Tính thuế theo item thay vì tổng; resolve rate từ product/category |
| `src/globals/TaxSettings.ts` | Giữ defaultTaxRate làm fallback |

---

## 9. Mở rộng tương lai (sau US10.1)

- Địa chỉ: Thuế theo tỉnh/thành nếu quy định khác vùng.
- Báo cáo: Export order kèm taxAmount, taxBreakdown cho kế toán.

---

*Tài liệu solution Tax — Daisy Flower. SDLC 6.1.0, Stage 04. Cập nhật khi có thay đổi thiết kế.*
