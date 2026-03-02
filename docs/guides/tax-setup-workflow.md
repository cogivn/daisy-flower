# Hướng dẫn thiết lập thuế — End User

**Đối tượng**: Chủ shop / Admin  
**Phiên bản**: 1.0  
**Cập nhật**: Theo thiết kế US10 & US10.1

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Workflow 1 — Thuế mặc định (US10)](#2-workflow-1--thuế-mặc-định-us10)
3. [Workflow 2 — Thuế theo sản phẩm/danh mục (US10.1)](#3-workflow-2--thuế-theo-sản-phẩmdanh-mục-us101)
4. [Hệ thống tính thuế như thế nào](#4-hệ-thống-tính-thuế-như-thế-nào)
5. [Ví dụ minh họa](#5-ví-dụ-minh-họa)
6. [Lưu ý & FAQ](#6-lưu-ý--faq)

---

## 1. Tổng quan

Hệ thống hỗ trợ 2 lớp cấu hình thuế:

| Cấp độ | Mô tả | Khi nào dùng |
|--------|--------|---------------|
| **Tax mode (global)** | Chọn kiểu giá: `exclusive` (giá chưa thuế, thuế cộng thêm) hoặc `inclusive` (giá đã gồm thuế) | Quy ước pricing chung của shop |
| **Tax Classes (default / product / category)** | Gắn nhóm thuế cho toàn shop, cho từng danh mục, hoặc từng sản phẩm | Khi có sản phẩm/danh mục cần thuế suất khác nhau (rượu 20%, hoa 8%, v.v.) |

- Với **exclusive**: thuế sẽ được **cộng thêm** vào Subtotal ở checkout (và hiện rõ dòng thuế).  
- Với **inclusive**: giá bạn nhập đã chứa thuế; hệ thống **không cộng thêm thuế** cho khách, chỉ bóc tách nội bộ (checkout không show dòng thuế).

---

## 2. Workflow 1 — Tạo nhóm thuế (Tax Classes)

### Bước 1: Vào quản lý Thuế
1. Đăng nhập **Payload Admin**.
2. Sidebar → **Ecommerce** → **Taxes** (Quản lý Thuế).
3. Nhấn **Create New** (Tạo mới).

### Bước 2: Điền thông tin nhóm thuế
| Trường | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| **Name (Tên)** | Tên hiển thị nội bộ | `VAT Tiêu chuẩn 8%`, `Hoa tươi 0%` |
| **Rate (%)** | % thuế suất | `8` |

### Bước 3: Chọn Tax Mode & Default Tax (tuỳ chọn)

1. Sidebar → **Settings** → **Tax Settings**.
2. Chọn **Tax mode**:
   - `Exclusive` → Giá chưa thuế, thuế sẽ cộng thêm ở checkout.
   - `Inclusive` → Giá đã gồm thuế, checkout không cộng thêm thuế (vẫn có thể dùng Tax Classes để bóc tách nội bộ).
3. Nếu `Tax mode = Exclusive` và bạn muốn có **thuế mặc định toàn shop**:
   - Ở trường **Default Tax Classes**, chọn 1 hoặc nhiều nhóm thuế (VD: `VAT Tiêu chuẩn 8%`).
   - Nhấn **Save**.

- Nếu **không chọn** Default Tax Classes → hệ thống **không áp thuế mặc định**; chỉ những product/category được gắn Tax Classes mới bị tính thuế.

---

## 3. Workflow 2 — Gắn thuế riêng (Sản phẩm/Danh mục ngoại lệ)

*Áp dụng khi bạn có mặt hàng chịu mức thuế khác với nhóm mặc định (VD: Rượu 10%, Phụ kiện 5%).*

### Bước 1: Tạo nhóm thuế ngoại lệ
Giống Workflow 1, hãy vào **Taxes** tạo một nhóm mới (VD: `VAT Rượu 10%` với Rate: 10, **không bật Is Default**).

### Bước 2: Gắn thuế riêng cho Sản phẩm (Ưu tiên cao nhất)
1. Admin → **Products** → chọn sản phẩm.
2. Tại mục **Thuế (Tax Class)**, chọn nhóm thuế vừa tạo (VD: `VAT Rượu 10%`).
3. Save.

### Bước 3: Gắn thuế cho một Danh mục
1. Admin → **Categories** → chọn danh mục (VD: "Phụ kiện").
2. Tại trường **Thuế (Tax Class)**, chọn nhóm thuế tương ứng.
3. Save. *(Mọi sản phẩm thuộc danh mục này sẽ tự nhận thuế Phụ kiện, trừ khi Sản phẩm đó đã được gắn thuế riêng ở Bước 2).*

### 3.4 Thứ tự ưu tiên
Khi tính tiền, hệ thống chọn thuế suất theo thứ tự:
1. **Sản phẩm có gắn Tax Class** → Dùng % của các Tax Class đó.
2. **Danh mục có gắn Tax Class** → Dùng Tax Classes của các Category mà sản phẩm thuộc về.
3. **Nhóm thuế Default** → Chọn tại **Settings > Tax Settings > Default Tax Classes** (nếu có).
4. **0%** (Nếu không tìm thấy bất kỳ Tax Class nào).

---

## 4. Hệ thống tính thuế như thế nào

### 4.1 Luồng tính toán tổng quát

```
1. Tổng giá sản phẩm (theo giá sale nếu có)
   ↓
2. Trừ mã giảm giá (voucher)
   ↓
3. Trừ ưu đãi theo cấp độ (level discount)
   ↓
4. Subtotal (số tiền chịu thuế)
   ↓
5. Cộng Thuế = Subtotal × Thuế suất / 100
   ↓
6. Tổng thanh toán = Subtotal + Thuế
```

### 4.2 Công thức chi tiết (đơn giản hoá cho end user)

**Exclusive (giá chưa thuế):**

- `Subtotal` = tổng giá sản phẩm (sau sale) − Voucher − Level discount  
- Hệ thống sẽ nội bộ phân bổ giảm giá theo từng dòng, rồi tính thuế theo Tax Classes, nhưng về phía bạn có thể hiểu:  
  - `Thuế` ≈ Subtotal × Thuế suất hiệu dụng / 100  
  - `Tổng thanh toán` ≈ Subtotal + Thuế  

**Inclusive (giá đã gồm thuế):**

- `Subtotal` = tổng giá sản phẩm (đã bao gồm thuế) − Voucher − Level discount  
- Hệ thống vẫn có thể bóc tách để biết `Thuế` nội bộ, nhưng:
  - **Không cộng thêm thuế** cho khách,  
  - Checkout chỉ hiển thị **tổng cuối = Subtotal sau giảm**.

### 4.3 Cơ sở tính thuế

- Thuế tính trên **số tiền sau khi đã giảm giá** (voucher + level).
- Không tính thuế trên phần đã được giảm.

---

## 5. Ví dụ minh họa

### Ví dụ 1: Thuế mặc định 8%

| Hạng mục | Số tiền (VND) |
|----------|----------------|
| Tổng sản phẩm | 500.000 |
| Voucher −10% | −50.000 |
| Level Silver −5% | −22.500 |
| **Subtotal (chịu thuế)** | **427.500** |
| VAT 8% | 34.200 |
| **Tổng thanh toán** | **461.700** |

### Ví dụ 2: Thuế theo sản phẩm

Giỏ có:
- Hoa tươi 200.000 (miễn thuế)  
- Rượu 300.000 (thuế 20%)  
- Phụ kiện 100.000 (thuế mặc định 8%)  

Không voucher, không level:

| Dòng | Giá | Thuế suất | Thuế |
|------|-----|-----------|------|
| Hoa tươi | 200.000 | 0% | 0 |
| Rượu | 300.000 | 20% | 60.000 |
| Phụ kiện | 100.000 | 8% | 8.000 |
| **Tổng** | **600.000** | | **68.000** |

**Tổng thanh toán** = 600.000 + 68.000 = **668.000 VND**.

---

## 6. Lưu ý & FAQ

### Nhóm thuế mặc định vô tình bị xoá
- Nếu bạn xoá nhóm thuế đang được liên kết trong **Tax Settings**, hệ thống sẽ báo lỗi không lưu được đơn hàng (thiếu Default Tax). Hãy luôn đảm bảo đã chọn một khoản thuế mặc định.

### Thay đổi thuế suất

- Thay đổi **Tax Settings** chỉ ảnh hưởng đơn hàng **mới**.
- Đơn đã đặt giữ nguyên số thuế lúc thanh toán (snapshot).

### Sản phẩm nằm trong nhiều danh mục
- Nếu sản phẩm nằm trong nhiều Categories có mức thuế khác nhau, hệ thống luôn ưu tiên **Category đầu tiên** được lưu.
- Khuyến nghị: Nên gắn thẳng cục Thuế ở cấp **Products** nếu Sản phẩm đó có ngoại lệ đặc thù để khỏi lo nghĩ về Category trùng lặp.

### Hiển thị tại Checkout

- Khách thấy: Subtotal → Voucher − → Level − → VAT (+) → **Tổng thanh toán**.
- Đơn hàng (Admin & email) lưu `taxAmount`, `taxRate` để đối chiếu và báo cáo.

---

*Hướng dẫn thiết lập thuế — Daisy Flower. Dành cho end user / chủ shop.*
