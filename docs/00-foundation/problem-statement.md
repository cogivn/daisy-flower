# Problem Statement — Daisy Flower

**SDLC Version**: 6.1.0  
**Stage**: 00 - FOUNDATION  
**Status**: Active

---

## 1. Vấn đề (Problem)

**Chủ shop hoa / doanh nghiệp bán hoa** cần **một kênh bán hàng trực tuyến chuyên nghiệp** để tăng doanh số và phục vụ khách hàng mua hoa, quà tặng và sản phẩm liên quan đến hoa **mọi lúc**, trong khi **hiện tại** phần lớn chỉ bán qua điện thoại, fanpage hoặc form thủ công, khó quản lý đơn hàng và kho, thiếu trải nghiệm mua sắm rõ ràng.

---

## 2. Đối tượng có vấn đề (Who)

| Đối tượng | Mô tả | Nhu cầu chính |
|-----------|--------|----------------|
| **Cửa hàng hoa tươi** | Shop 1–5 nhân sự, bán hoa tươi, bó hoa, giỏ quà | Catalog rõ ràng, đơn hàng tập trung, không sót đơn |
| **Shop quà tặng có bán hoa** | Kết hợp hoa với quà, thiệp, bánh | Phân loại sản phẩm (hoa / quà), giá và khuyến mãi nhất quán |
| **Doanh nghiệp dịch vụ hoa** | Cung cấp hoa cho event, văn phòng, khách sạn | Đặt hàng số lượng lớn, giao theo lịch, hóa đơn rõ ràng |
| **Khách hàng cuối (mua hoa)** | Cá nhân, doanh nghiệp mua online | Xem giá, chọn sản phẩm, thanh toán an toàn, giao đúng hẹn |

---

## 3. Personas chi tiết

### Persona 1: Chủ shop hoa (Admin)

- **Mục tiêu**: Bán thêm qua kênh online mà không tốn quá nhiều thời gian quản lý.
- **Pain**: Bán qua tin nhắn/fanpage tốn giờ, dễ nhầm đơn, khó chạy khuyến mãi theo đợt.
- **Success**: Một nơi quản lý sản phẩm, danh mục, đơn hàng; khách tự xem giá và đặt hàng.

### Persona 2: Khách mua hoa (Customer)

- **Mục tiêu**: Tìm đúng loại hoa/bó hoa, biết giá và thời gian giao, thanh toán nhanh.
- **Pain**: Gọi điện nhiều lần, giá không rõ, không biết còn hàng hay không.
- **Success**: Duyệt catalog, lọc theo danh mục, xem chi tiết và giá (kể cả giá khuyến mãi), thêm vào giỏ và thanh toán.

---

## 4. Bằng chứng / Bối cảnh (Evidence)

- Nhu cầu mua hoa online tăng (quà tặng, sự kiện, trang trí).
- Bán qua tin nhắn/fanpage tốn thời gian, dễ sót đơn, khó tính giá và khuyến mãi nhất quán.
- Cần **catalog sản phẩm** rõ ràng (hoa, bó, giỏ, phụ kiện), **quản lý tồn kho** và **đơn hàng** tập trung.
- Các sản phẩm điển hình: hoa tươi cắm bó, giỏ hoa, hộp quà kèm hoa, phụ kiện (gói, nơ, thiệp), dịch vụ giao hoa.

---

## 5. Kịch bản sử dụng điển hình (Use scenarios)

1. **Khách vào trang chủ** → xem hero, danh mục, sản phẩm nổi bật / khuyến mãi → nhấn "Shop" hoặc một danh mục → xem danh sách, có thể tìm kiếm hoặc lọc theo category → vào trang chi tiết sản phẩm → thêm vào giỏ → checkout và thanh toán (Stripe).
2. **Admin đăng nhập** → vào Payload Admin → quản lý Categories (thêm/sửa/xóa, ảnh, mô tả) → quản lý Products (tên, mô tả, gallery, giá, danh mục, biến thể) → tạo/sửa Sale events (sản phẩm, giá sale, thời gian bắt đầu/kết thúc) → xem đơn hàng và trạng thái.
3. **Hệ thống** → job cron chạy định kỳ → cập nhật trạng thái sale event (active/expired) theo thời gian → frontend hiển thị đúng giá khuyến mãi khi sale còn hiệu lực.

---

## 6. Giả định chính (Assumptions)

| # | Giả định | Ghi chú |
|---|----------|--------|
| 1 | Chủ shop / doanh nghiệp có nhu cầu bán online; khách chấp nhận mua hoa qua website nếu trải nghiệm đơn giản, tin cậy | Đã xác nhận qua bối cảnh thị trường |
| 2 | Ecommerce hoa và quà tặng có chỗ đứng; có thể bắt đầu với thị trường địa phương hoặc niche (hoa cao cấp, sự kiện) | Mở rộng đa vùng/đa ngôn ngữ là bước sau |
| 3 | Giải pháp headless CMS + frontend (Payload + Next.js) đủ linh hoạt để triển khai nhanh và mở rộng sau | Stack đã chọn trong kiến trúc |
| 4 | Thanh toán qua Stripe (hoặc cổng tương đương) được khách và chủ shop chấp nhận | Đã tích hợp Stripe trong dự án |
| 5 | Một shop / một brand trên một instance; không yêu cầu marketplace đa seller ở MVP | Giảm độ phức tạp |

**Lưu ý**: Tài liệu bám sát kiến trúc đã setup (Payload, Next.js, blocks, seed). Các trang build động từ collection pages; layout homepage theo seed — xem [02-design](02-design/architecture-decisions.md#7-trang-động--homepage-layout-theo-seed), [04-build](04-build/sprint-plan.md#8-seed--homepage-layout).

---

## 7. Tiêu chí thành công (Success criteria)

- Khách có thể **tìm và xem** sản phẩm (hoa, quà) theo danh mục và từ khóa, **xem chi tiết** (ảnh, mô tả, giá, giá sale nếu có), **thêm vào giỏ** và **hoàn tất thanh toán**.
- Admin có thể **quản lý** danh mục, sản phẩm, sale events và **xem đơn hàng** tại một nơi (Payload Admin).
- **Sale theo thời gian** hoạt động đúng: giá khuyến mãi hiển thị trong khoảng thời gian cấu hình; sau khi hết hạn hiển thị lại giá gốc.
- Hệ thống **ổn định** trên môi trường triển khai (staging/production), không lộ secret, access control đúng.

---

## 8. Rủi ro và giảm thiểu (Risks)

| Rủi ro | Mức | Cách giảm thiểu |
|--------|-----|------------------|
| Khách không tin thanh toán online | Trung bình | Dùng Stripe (uy tín), trang checkout rõ ràng, chính sách hoàn trả |
| Catalog quá lớn, tìm kiếm chậm | Thấp (MVP catalog vừa) | Ưu tiên filter + search đơn giản; sau có thể thêm full-text/search service |
| Sale event không cập nhật đúng giờ | Thấp | Job cron + chỉ cập nhật document cần đổi status; frontend có countdown |

---

## 9. Gate G0.1 — Problem Validated

- [x] Vấn đề thực tế (cửa hàng/doanh nghiệp cần kênh bán hoa online).
- [x] Đối tượng mục tiêu được xác định (chủ shop, doanh nghiệp, khách mua hoa).
- [x] Bối cảnh và nhu cầu được mô tả (catalog, đơn hàng, giá, khuyến mãi).
- [x] Có lý do kinh doanh (tăng doanh số, quản lý đơn và sản phẩm tốt hơn).
- [x] Personas và kịch bản sử dụng đã nêu; tiêu chí thành công và rủi ro đã ghi nhận.

---

*Tài liệu nền tảng — Daisy Flower. SDLC 6.1.0, Stage 00.*
