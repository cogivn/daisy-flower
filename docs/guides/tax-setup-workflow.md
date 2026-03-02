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

Hệ thống hỗ trợ hai cấp độ cấu hình thuế:

| Cấp độ | Mô tả | Khi nào dùng |
|--------|--------|---------------|
| **Thuế mặc định** | Một thuế suất chung cho toàn bộ đơn hàng | Shop đa số sản phẩm cùng nhóm thuế (VD: hoa 8%) |
| **Thuế theo sản phẩm/danh mục** | Thuế suất riêng cho từng sản phẩm hoặc danh mục | Có sản phẩm khác biệt (rượu 20%, hoa tươi miễn thuế, quà tặng 10%) |

Bạn có thể chỉ dùng thuế mặc định, hoặc bật thêm thuế theo sản phẩm/danh mục khi cần.

---

## 2. Workflow 1 — Thuế mặc định (US10)

### Bước 1: Vào cấu hình thuế

1. Đăng nhập **Payload Admin**.
2. Sidebar → **Globals** → **Tax Settings** (Cài đặt thuế).
3. Mở form cấu hình thuế.

### Bước 2: Điền thông tin

| Trường | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| **Thuế suất mặc định** | % thuế áp dụng cho đơn hàng | `8` (= 8% VAT) |
| **Chế độ** | Exclusive: giá chưa thuế, thuế cộng thêm. Inclusive: giá đã gồm thuế | Chọn **Exclusive** (phổ biến) |
| **Nhãn hiển thị** | Text hiển thị tại checkout | `VAT` hoặc `Thuế GTGT` |

### Bước 3: Lưu

Nhấn **Save**. Sau khi lưu, mọi đơn hàng mới sẽ tự động áp dụng thuế theo cấu hình.

### Bước 4: Xác nhận

- Vào trang **Checkout** (frontend), thêm sản phẩm vào giỏ, xem phần **Tổng tiền**.
- Sẽ thấy dòng thuế (VD: `VAT (8%)`) và **Tổng thanh toán** = Subtotal − Giảm giá + Thuế.

---

## 3. Workflow 2 — Thuế theo sản phẩm/danh mục (US10.1)

*Chỉ thực hiện sau khi đã cấu hình thuế mặc định.*

### 3.1 Miễn thuế cho sản phẩm (VD: hoa tươi)

1. Admin → **Products** → chọn sản phẩm.
2. Tìm trường **Miễn thuế** (hoặc `Tax exempt`).
3. Bật **Yes**.
4. Save.

→ Sản phẩm này sẽ không chịu thuế (0%).

### 3.2 Thuế suất riêng cho sản phẩm (VD: rượu 20%)

1. Admin → **Products** → chọn sản phẩm.
2. Tìm trường **Thuế suất riêng** (hoặc `Tax rate override`).
3. Nhập % (VD: `20`).
4. Save.

→ Sản phẩm này dùng 20% thay vì thuế mặc định.

### 3.3 Thuế suất theo danh mục

1. Admin → **Categories** → chọn danh mục (VD: "Đồ uống có cồn").
2. Tìm trường **Thuế suất danh mục** (hoặc `Tax rate override`).
3. Nhập % (VD: `20`).
4. Save.

→ Mọi sản phẩm thuộc danh mục này (chưa có thuế riêng) sẽ dùng 20%.

### 3.4 Thứ tự ưu tiên

Hệ thống chọn thuế suất theo thứ tự:

1. **Sản phẩm miễn thuế** → 0%
2. **Thuế suất riêng của sản phẩm** → dùng giá trị đã nhập
3. **Thuế suất danh mục** → dùng giá trị danh mục (nếu sản phẩm không override)
4. **Thuế mặc định** → từ Tax Settings

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

### 4.2 Công thức chi tiết

**Thuế mặc định (US10 — 1 rate/đơn):**

- `Subtotal` = tổng giá sản phẩm (sau sale) − Voucher − Level discount  
- `Thuế` = Subtotal × Thuế suất mặc định / 100 (làm tròn gần nhất)  
- `Tổng thanh toán` = Subtotal + Thuế  

**Thuế theo sản phẩm (US10.1):**

- Mỗi dòng sản phẩm có thuế suất riêng (0%, 10%, 20%, ... tùy cấu hình).
- Do giỏ hàng có thể áp dụng Voucher hoặc Chiết khấu Level, hệ thống sẽ **phân bổ đều phần tiền giảm giá** này cho tất cả các dòng sản phẩm (dựa trên tỉ trọng giá trị).
- `Giá trị chịu thuế của dòng (Taxable Amount)` = Giá gốc - Giảm giá phân bổ
- `Thuế dòng` = Taxable Amount × Thuế suất dòng / 100 (làm tròn gần nhất)
- `Thuế đơn` = tổng Thuế các dòng  
- `Tổng thanh toán` = Subtotal + Thuế đơn

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

### Thuế mặc định = 0%

- Nếu đặt **Thuế suất mặc định** = 0, đơn hàng sẽ không có thuế.
- Phù hợp khi shop chưa cần xuất hóa đơn VAT hoặc toàn bộ hàng miễn thuế.

### Thay đổi thuế suất

- Thay đổi **Tax Settings** chỉ ảnh hưởng đơn hàng **mới**.
- Đơn đã đặt giữ nguyên số thuế lúc thanh toán (snapshot).

### Sản phẩm vừa miễn thuế vừa có override

- Nếu bật **Miễn thuế**, hệ thống dùng 0% và bỏ qua **Thuế suất riêng**.

### Nhiều danh mục

- Sản phẩm thuộc nhiều danh mục: hệ thống dùng **danh mục đầu tiên** (hoặc primary) có `taxRateOverride`.
- Khuyến nghị: đặt thuế ở **sản phẩm** khi có ngoại lệ rõ ràng (VD: rượu).

### Hiển thị tại Checkout

- Khách thấy: Subtotal → Voucher − → Level − → VAT (+) → **Tổng thanh toán**.
- Đơn hàng (Admin & email) lưu `taxAmount`, `taxRate` để đối chiếu và báo cáo.

---

*Hướng dẫn thiết lập thuế — Daisy Flower. Dành cho end user / chủ shop.*
