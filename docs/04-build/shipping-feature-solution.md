# Shipping Feature — Solution & Development Plan

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Design / Planning (chưa implement)

---

## 1. Tổng quan

Tài liệu mô tả **solution** và **kế hoạch phát triển** cho tính năng **Phí vận chuyển (Shipping Fee)** trên nền tảng Daisy Flower. Giải pháp được thiết kế mở rộng từ kiến trúc giỏ hàng hiện tại (có tích hợp Voucher, User Level Discount) và tương thích với hệ thống tính Thuế (Tax).

Dự án bán lẻ hàng B2C, do đó chính sách có các mức phí vận chuyển cố định hoặc miễn phí vận chuyển nếu đạt điều kiện.

---

## 2. Tech Stack & Bối cảnh hiện tại

### 2.1 Bối cảnh hiện tại
*   **User Level Settings (`UserLevelSettings.ts`)**: Đã có sẵn cờ `freeShipping` (boolean) dành cho các user đạt cấp bậc VIP (VD: Gold, Diamond).
*   **Các hook hiện có**: `applyCartDiscounts` đang xử lý giỏ hàng (`originalSubtotal`, `voucherDiscount`, `levelDiscount`). Hệ thống chưa có field nào để lưu `shippingFee`.
*   **Thanh toán Stripe**: Hiện tại đang trỏ vào `cart.total`. Plugin thương mại điện tử có thể cần được patch nếu như thay đổi tổng tiền thanh toán.

### 2.2 Mục tiêu của Shipping
*   Tính phí vận chuyển cố định cho toàn bộ các đơn hàng.
*   Miễn phí vận chuyển nếu tổng đơn hàng thoả mãn giá trị quy định (VD: Mua trên 500,000 VND).
*   Miễn phí vận chuyển nếu khách hàng thuộc User Level có đặc quyền `freeShipping = true`.
*   Ghi nhận số tiền phí vận chuyển vào DB `Carts` và chuyển sang DB `Orders`.
*   Tính toán đúng mức Thuế (Tax) nếu phí vận chuyển cũng nằm trong diện chịu thuế (Mở rộng).

---

## 3. Solution Design

### 3.1 Cấu hình (Global ShippingSettings)
Tạo một Global collection mới để Admin có thể sửa đổi chính sách phí vận chuyển linh hoạt:

| Field | Type | Mô tả |
|-------|------|--------|
| `defaultFee` | number | Phí vận chuyển tiêu chuẩn (VND). VD: `30000` |
| `freeShippingThreshold` | number | Mức giá trị đơn hàng tối thiểu (sau khi trừ chiết khấu) để được miễn phí vận chuyển (VND). VD: `500000` |

### 3.2 Mở rộng Carts & Orders
Sửa đổi `src/plugins/index.ts` để thêm trường lưu dữ liệu phí ship:

| Collection | Field | Type | Mô tả |
|------------|-------|------|--------|
| **Carts** | `shippingFee` | number | Phí vận chuyển áp dụng cho giỏ hàng (VND). `0` nếu được freeship. |
| **Orders** | `shippingFee` | number | Copy từ giỏ hàng sang để lưu trữ chứng từ. |

### 3.3 Logic Hook (`applyCartDiscounts.ts`)
Tích hợp thêm module tính phí ship vào sau phần tính toán Subtotal hiện tại:

1. Đọc cấu hình `ShippingSettings` (Lấy `defaultFee`, `freeShippingThreshold`).
2. Xác định tài khoản khách hàng có level hỗ trợ `freeShipping` hay không (Tra cứu thông qua `data.customer`).
3. Xác định quy tắc Freeship:
   * Nếu Khách hàng có đặc quyền Freeship `=> shippingFee = 0`
   * Nếu `data.subtotal >= freeShippingThreshold` (Sau khi đã trừ khuyến mãi) `=> shippingFee = 0`
   * Còn lại `=> shippingFee = defaultFee`
4. Ghi nhận vào giỏ hàng: `data.shippingFee = shippingFee`.

### 3.4 Logic Tích hợp Thuế (Tax Integration)
*Nếu Phí vận chuyển chịu thuế VAT:*
*   `Taxable Amount` cho shipping = `shippingFee`.
*   `Shipping Tax` = `Math.round(shippingFee * shippingTaxRate / 100)`.
*   Toàn bộ Tax Amount của giỏ hàng cập nhật lại thành: `Tax = Product Tax + Shipping Tax`.
*   *Lưu ý:* MVP ban đầu có thể giữ Shipping là khoản phi chịu thuế (Non-taxable) để đơn giản. Cần xác nhận với quy định kế toán thực tế của shop bán hoa (Nếu shop dùng dịch vụ ngoài Grab/Ahamove thường khách hàng tự trả cước).

### 3.5 Công thức Tính Tiền Dành Cho Stripe / Checkout
*   `Total (Stripe)` = `Subtotal` (Taxable) + `Tax Amount` (Thuế hàng hoá) + `Shipping Fee` (Phí ship) + `Shipping Tax Amount` (Thuế dịch vụ vận chuyển nếu có).

---

## 4. Kế hoạch phát triển (Sprint)

### Sprint 1: Setup Dữ Liệu
| Task | File | Mô tả |
|------|------|--------|
| Global ShippingSettings | `src/globals/ShippingSettings.ts` | Khởi tạo schema `defaultFee`, `freeShippingThreshold`. |
| Carts & Orders override | `src/plugins/index.ts` | Thêm field `shippingFee` vào schema. |
| Đăng ký ShippingSettings | `src/payload.config.ts` | Đưa globals ShippingSettings vào cấu hình. |

### Sprint 2: Backend Logic
| Task | File | Mô tả |
|------|------|--------|
| Tính lại phí Ship trong giỏ | `src/hooks/carts/applyCartDiscounts.ts` | Bổ sung hàm tính phí vận chuyển theo 3.3. |
| Chuyển số liệu sang Order | `src/hooks/orders/copyVoucherToOrder.ts` | Bổ sung lệnh trích xuất và copy `shippingFee` từ cart sang order. |

### Sprint 3: Frontend UI Checkout
| Task | File | Mô tả |
|------|------|--------|
| Cập nhật Modal Giỏ hàng | `src/components/Cart/CartModal.tsx` | Hiển thị thêm dòng tạm tính Phí vận chuyển. |
| Cập nhật form Thanh toán | `src/components/checkout/PriceBreakdown.tsx` | Thêm dòng ghi nhận phí hoặc chữ "Miễn phí". Sửa lại tổng Payment. |
| Lịch sử mua hàng | `src/app/(app)/(account)/orders/[id]/page.tsx` | Cập nhật render dòng phí ship cho User dễ theo dõi biên lai. |

---

## 5. File mapping (tóm tắt)

| File | Thay đổi |
|------|----------|
| `src/globals/ShippingSettings.ts` | **Mới** — global config cho Shipping. |
| `src/plugins/index.ts` | Thêm field `shippingFee` vào Override `carts` và `orders`. |
| `src/payload.config.ts` | Register Global `ShippingSettings`. |
| `src/hooks/carts/applyCartDiscounts.ts` | Thêm logic tự động gắn `shippingFee` cho cart dựa vào tổng hoặc tài khoản người dùng. |
| `src/hooks/orders/copyVoucherToOrder.ts` | Copy data từ cart qua. |
| `src/components/checkout/PriceBreakdown.tsx` | Hiển thị giao diện & update công thức final total. |
| `src/components/Cart/CartModal.tsx` | Dự tính phí ship. |
| `src/app/(app)/(account)/orders/[id]/page.tsx` | Biên lai chi tiết Order. |

---

*Tài liệu solution Shipping — Daisy Flower. SDLC 6.1.0, Stage 04.*
