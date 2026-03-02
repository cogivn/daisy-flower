# Hướng dẫn thiết lập bó hoa / Bundle Products

**Đối tượng**: Admin / Chủ shop  
**Phiên bản**: 1.0  
**Cập nhật**: Theo thiết kế Bundle (Composite Products)

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Khái niệm: Simple product vs Bundle](#2-khái-niệm-simple-product-vs-bundle)
3. [Workflow 1 — Tạo bó hoa từ sản phẩm có sẵn](#3-workflow-1--tạo-bó-hoa-từ-sản-phẩm-có-sẵn)
4. [Workflow 2 — Quản lý tồn kho bó hoa](#4-workflow-2--quản-lý-tồn-kho-bó-hoa)
5. [Workflow 3 — Thuế & khuyến mãi cho bó hoa](#5-workflow-3--thuế--khuyến-mãi-cho-bó-hoa)
6. [Lưu ý & FAQ](#6-lưu-ý--faq)

---

## 1. Tổng quan

Hệ thống Daisy Flower cho phép bạn bán:

- **Sản phẩm đơn** (Simple product): Ví dụ 1 bó hoa hồng, 1 chậu lan, 1 hộp quà.
- **Bó hoa/bundle** (Composite product): Một sản phẩm được ghép từ **nhiều sản phẩm con** đã có trong hệ thống, ví dụ:
  - \"Bó hoa Premium\" gồm:
    - 3 x hoa lan trắng
    - 1 x hoa hồng đỏ
    - 5 x hoa cúc vàng
    - + 1 hộp quà / ribbon (nếu cũng là product riêng).

Đặc điểm:

- Mỗi sản phẩm con vẫn:
  - Có **giá** riêng.
  - Có **tồn kho** riêng.
  - Có **thuế suất** riêng (theo tax class hoặc category).
- Bó hoa:
  - Lấy hàng từ tồn kho của các sản phẩm con.
  - **Không được bán vượt quá tổng tồn kho thực tế**.
  - Khi bán, thuế & khuyến mãi vẫn **phản ánh đúng** mix sản phẩm con.

---

## 2. Khái niệm: Simple product vs Bundle

### 2.1 Simple product

Là sản phẩm đang dùng hiện tại:

- Ví dụ: 1 bó hoa hồng 10 bông, 1 chậu lan, 1 hộp quà.
- Có các thuộc tính:
  - Tên, mô tả, hình ảnh, giá (VND), tồn kho (inventory), thuế (taxClasses), v.v.
- Tồn kho:
  - Hệ thống dùng trực tiếp `inventory` (hoặc inventory theo **variant** nếu có).

### 2.2 Bundle product (bó hoa)

Là sản phẩm **ghép** từ nhiều simple product:

- Ví dụ: \"Bó Hoa Ngày Cưới\":
  - 5 x hoa hồng trắng
  - 3 x hoa baby
  - 1 x ribbon
- Trong admin, bó hoa sẽ có:
  - Loại sản phẩm: `productKind = 'bundle'`.
  - Danh sách **Bundle Items**:
    - Mỗi item trỏ tới **1 simple product** + số lượng cần dùng trong 1 bó.

---

## 3. Workflow 1 — Tạo bó hoa từ sản phẩm có sẵn

### 3.1 Chuẩn bị sản phẩm con (simple products)

Trước khi tạo bó hoa, hãy đảm bảo:

1. Tất cả thành phần trong bó hoa **đã tồn tại** trong mục Products:
   - Ví dụ:
     - `Hoa lan trắng (simple product)`
     - `Hoa hồng đỏ (simple product)`
     - `Hoa cúc vàng (simple product)`
2. Mỗi sản phẩm con đã:
   - Thiết lập **giá** (Price in VND).
   - Thiết lập **tồn kho** (Inventory).
   - Gắn **Tax Classes** đúng (nếu áp dụng VAT khác nhau cho từng loại).

### 3.2 Tạo product mới cho bó hoa

1. Vào **Admin → Products → Create New**.
2. Nhập:
   - **Title**: Tên bó hoa (VD: \"Bó Hoa Premium\").
   - **Mô tả** + hình ảnh gallery.
   - **Giá bó hoa**:
     - Bạn có thể:
       - Đặt giá bằng tổng thành phần, hoặc
       - Đặt giá ưu đãi (thấp hơn tổng lẻ), tuỳ chiến lược.
3. Chọn loại sản phẩm:
   - Ở field `Product Kind` chọn **Bundle** (khi tính năng đã được bật).

### 3.3 Thêm các sản phẩm con (Bundle Items)

Khi `Product Kind = Bundle`, màn hình sẽ xuất hiện khu vực cấu hình **Bundle Items**:

1. Trong phần **Bundle composition / Bundle items**:
   - Nhấn **Add item**.
   - Với mỗi thành phần:
     - Chọn **Product** là simple product tương ứng (VD `Hoa lan trắng`).
     - Nhập **Quantity** = số lượng dùng trong 1 bó (VD 3).
2. Lặp lại cho tất cả thành phần:
   - 3 x hoa lan
   - 1 x hoa hồng
   - 5 x hoa cúc
3. Lưu ý:
   - Không được chọn lại chính bó hoa đó làm thành phần (hệ thống sẽ chặn).
   - Nên chỉ chọn những sản phẩm con có inventory quản lý rõ ràng.

4. Nhấn **Save** để lưu bó hoa.

---

## 4. Workflow 2 — Quản lý tồn kho bó hoa

### 4.1 Cách hệ thống tính tồn kho khả dụng cho bó hoa

Hệ thống **không lưu tồn kho riêng** cho bó hoa. Thay vào đó, số bó có thể bán được được tính dựa trên tồn kho của các sản phẩm con.

Ví dụ:

- Bó A = 3 x hoa lan, 1 x hoa hồng, 5 x hoa cúc.
- Tồn kho hiện tại:
  - Hoa lan: 10
  - Hoa hồng: 1
  - Hoa cúc: 20

Số bó tối đa có thể bán:

- `floor(10 / 3) = 3` (theo hoa lan)
- `floor(1 / 1) = 1` (theo hoa hồng)
- `floor(20 / 5) = 4` (theo hoa cúc)
- **Kết quả**: hệ thống chỉ cho phép bán **1 bó**, vì hoa hồng là thành phần giới hạn.

### 4.2 Hiển thị cho admin & khách hàng

- **Trong admin**:
  - Bạn có thể thấy (hoặc hệ thống có thể hiển thị) số bó tối đa build được dựa trên tồn kho hiện tại.
- **Trên website (frontend)**:
  - Trang chi tiết bó hoa hiển thị:
    - Tình trạng còn hàng (In stock / Out of stock).
    - Thông tin: \"Có thể bán tối đa N bó dựa trên tồn kho hiện tại\" (tuỳ mức độ bạn muốn hiển thị cho khách).

### 4.3 Khi khách hàng đặt bó hoa

1. Khi khách thêm bó hoa vào giỏ:
   - Hệ thống kiểm tra tồn kho của **từng sản phẩm con**.
   - Nếu bất kỳ thành phần **không đủ số lượng**, thao tác sẽ bị chặn.
2. Khi khách thanh toán (checkout):
   - Ở bước tạo đơn, hệ thống:
     - Tổng hợp lại số lượng **thực sự cần trừ** cho từng sản phẩm con (bao gồm nhiều bó hoa, nhiều đơn hàng).
     - Chỉ tạo đơn thành công nếu tồn kho tất cả sản phẩm con **vẫn đủ**.
     - Sau đó mới trừ tồn kho thực tế.

=> Bạn không cần tự tính toán thủ công từng thành phần mỗi lần bán bó hoa; hệ thống sẽ kiểm tra và trừ tồn giúp bạn.

---

## 5. Workflow 3 — Thuế & khuyến mãi cho bó hoa

### 5.1 Thuế (VAT) cho bó hoa

Hệ thống thuế đã được cấu hình ở mức:

- **Tax Settings (global)**: chọn `taxMode` (exclusive/inclusive), default tax classes.
- **Tax Classes**: định nghĩa các nhóm thuế suất.
- **Products/Categories**: có thể gắn `taxClasses` riêng.

Với bó hoa bundle:

- Mỗi **sản phẩm con** có thể có:
  - Thuế suất khác nhau (0%, 8%, 10%…).
- Khi khách mua bó hoa:
  - Hệ thống **tách bó hoa** thành nhiều dòng sản phẩm con ở phía server (nội bộ).
  - Thuế được tính **riêng từng dòng** dựa trên `taxClasses` của sản phẩm con.
  - Tổng thuế của đơn hàng:
    - Là tổng thuế của tất cả thành phần.
    - Nếu có thành phần miễn thuế, phần đó sẽ không bị tính VAT.

### 5.2 Khuyến mãi (voucher & cấp độ thành viên)

Bó hoa bundle **tận dụng toàn bộ cơ chế khuyến mãi hiện tại**:

- **Voucher**:
  - Có thể áp dụng cho:
    - Toàn bộ giỏ hàng, hoặc
    - Chỉ một số sản phẩm (scope `specific`).
  - Vì bó hoa được tách thành các dòng sản phẩm con:
    - Nếu voucher chỉ áp dụng cho một số loại hoa, giảm giá sẽ **chỉ rơi vào** các thành phần đủ điều kiện.
- **Level discount (theo cấp độ khách hàng)**:
  - Vẫn được tính trên **tổng đơn** như hiện tại.
  - Sau đó hệ thống phân bổ discount xuống từng dòng trước khi tính thuế.

Bạn không cần cấu hình thêm khuyến mãi riêng cho bó hoa nếu không muốn; toàn bộ logic hiện tại vẫn áp dụng được.

---

## 6. Lưu ý & FAQ

### Bó hoa hết hàng dù sản phẩm con còn nhiều

- Kiểm tra thành phần nào đang là **nút thắt** (inventory thấp nhất theo công thức).
- Ví dụ:
  - Lan: 100, Hồng: 2, Cúc: 200 → bó có thể bán tối đa 2 bó do thiếu hồng.
- Giải pháp:
  - Nhập thêm tồn kho cho sản phẩm con bị thiếu.
  - Hoặc chỉnh lại BOM (giảm số lượng dùng trong 1 bó).

### Tôi có thể bán riêng sản phẩm con và bán bó hoa song song không?

- Có.
- Nhưng cần lưu ý:
  - Cả **bán lẻ** và **bán bó hoa** đều trừ tồn từ **cùng một kho** sản phẩm con.
  - Hệ thống luôn kiểm tra tổng nhu cầu trước khi tạo đơn.

### Có thể set thuế riêng cho bó hoa không?

- Mặc định, hệ thống **dùng thuế từ các sản phẩm con** (an toàn, dễ giải trình).
- Nếu sau này bạn muốn bó hoa có thuế suất đặc biệt (khác với thành phần):
  - Dev có thể mở rộng để:
    - Gắn `taxClasses` trực tiếp lên product bundle.
    - Sửa logic tính thuế tương ứng.

### Tôi muốn chuẩn bị sẵn 20 bó cho ngày lễ, trừ kho trước được không?

- Giải pháp hiện tại:
  - Bạn có thể **tạm thời trừ tồn** của các sản phẩm con thủ công (hoặc tạo một work-around).
- Kế hoạch nâng cao:
  - Hệ thống có thể hỗ trợ field `bundleAllocatedStock`:
    - Khi set 20 bó:
      - Hệ thống trừ tồn sản phẩm con ngay lập tức cho 20 bó.
      - Sau đó, đơn hàng chỉ trừ \"tồn bó\" thay vì trừ trực tiếp child.

---

*Hướng dẫn thiết lập bó hoa / bundle — Daisy Flower. Dành cho admin & chủ shop.*

