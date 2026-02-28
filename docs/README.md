# Daisy Flower — Tài liệu dự án

**SDLC Version**: 6.1.0  
**Tier**: LITE  
**Dự án**: Ecommerce kinh doanh hoa và sản phẩm liên quan đến hoa

---

## Tổng quan

Dự án **Daisy Flower** là nền tảng thương mại điện tử (ecommerce) dùng để bán hoa tươi và các sản phẩm liên quan (quà tặng, phụ kiện, dịch vụ giao hoa). Tài liệu dự án tuân theo cấu trúc **SDLC 6.1.0 LITE** (5 giai đoạn chính).

**Lưu ý**: Tech stack (Payload CMS, Next.js, SQLite), bộ blocks và kiến trúc đã được chọn và setup sẵn. Tài liệu **bám sát kiến trúc hiện có** — mô tả đúng collections, blocks, seed (homepage layout) và cách trang build động từ Payload. **Đã bổ sung** yêu cầu và thiết kế cho **Voucher** (mã giảm giá) và **User levels** (cấp độ thành viên); chưa implement — xem [01-planning](01-planning/requirements.md) (US8, US9), [02-design § 11](02-design/architecture-decisions.md#11-voucher--user-levels-theo-docs--chưa-implement), [04-build](04-build/sprint-plan.md) (nhóm Voucher & User levels).

Phương pháp SDLC đầy đủ nằm tại **[docs/sdlc/](sdlc/README.md)** (MTS-SDLC-Lite).

---

## Cấu trúc tài liệu (LITE tier)

| Thư mục | Giai đoạn | Nội dung chính |
|--------|-----------|----------------|
| [00-foundation/](00-foundation/) | **WHY** — Nền tảng | Bài toán, đối tượng, lý do xây dựng |
| [01-planning/](01-planning/) | **WHAT** — Kế hoạch | Yêu cầu, user stories, phạm vi |
| [02-design/](02-design/) | **HOW** — Thiết kế | Kiến trúc, công nghệ, quyết định kỹ thuật |
| [03-integrate/](03-integrate/) | **WITH WHAT** — Tích hợp | API, bên thứ ba (khi có) |
| [04-build/](04-build/) | **BUILD** — Xây dựng | Sprint, ghi chú triển khai |

---

## Điểm bắt đầu nhanh

1. **Hiểu bài toán**: [00-foundation/problem-statement.md](00-foundation/problem-statement.md) — personas, kịch bản, tiêu chí thành công, rủi ro  
2. **Yêu cầu & phạm vi**: [01-planning/requirements.md](01-planning/requirements.md) — user stories chi tiết, acceptance criteria, mapping routes/collections, glossary  
3. **Stack & kiến trúc**: [02-design/architecture-decisions.md](02-design/architecture-decisions.md) — collections, blocks, routes, job, cấu trúc thư mục  
4. **Tích hợp**: [03-integrate/README.md](03-integrate/README.md) — Stripe ([api-payments-stripe.md](03-integrate/api-payments-stripe.md)), [env-vars.md](03-integrate/env-vars.md)  
5. **Tiến độ build**: [04-build/sprint-plan.md](04-build/sprint-plan.md) — task ↔ file mapping, **seed & layout homepage**, convention, troubleshooting, Gate G3  
6. **Giám sát tiến độ**: [04-build/project-progress.md](04-build/project-progress.md) — feature nào xong/đang làm/chưa làm, ưu tiên tiếp theo (cập nhật khi thay đổi)  
7. **Cho AI Agent — Skills**: [04-build/agent-skills.md](04-build/agent-skills.md) — dùng skill **Payload** khi sửa collections/hooks/API, skill **Daisy layout** khi sửa layout/responsive; tìm skill cần thiết trước khi code.

**Homepage & trang động**: Layout trang chủ (hero + thứ tự blocks) định nghĩa trong seed → [02-design](02-design/architecture-decisions.md#7-trang-động--homepage-layout-theo-seed), [04-build](04-build/sprint-plan.md#8-seed--homepage-layout).

---

## Tham chiếu SDLC

- **10 giai đoạn vòng đời**: [sdlc/01-core-concepts/10-stage-lifecycle.md](sdlc/01-core-concepts/10-stage-lifecycle.md)  
- **LITE Quickstart**: [sdlc/03-playbooks/lite-quickstart.md](sdlc/03-playbooks/lite-quickstart.md)  
- **Cấu trúc thư mục dự án**: [sdlc/04-templates/project-folder-structure.md](sdlc/04-templates/project-folder-structure.md)  
- **Gate Checklist (tự đánh giá LITE)**: [sdlc/04-templates/gate-checklist-template.md](sdlc/04-templates/gate-checklist-template.md) — dùng để kiểm tra G0.1, G1, G2, G3 trước khi chuyển giai đoạn.

---

## Đối chiếu với SDLC 6.1.0 LITE

Bộ tài liệu dự án **bám sát** cấu trúc và quy ước LITE tier trong [project-folder-structure](sdlc/04-templates/project-folder-structure.md) và [4-tier-classification](sdlc/01-core-concepts/4-tier-classification.md).

| Yêu cầu SDLC LITE | Trạng thái Daisy Flower |
|-------------------|--------------------------|
| **5 thư mục** 00-foundation → 04-build | ✅ Đủ; không tạo 05–09 (LITE chỉ 5 stage). |
| **00-foundation**: problem-statement.md | ✅ Có; header SDLC Version, Stage, Status; Gate G0.1 checklist. |
| **01-planning**: requirements.md | ✅ Có; user stories + acceptance criteria; scope in/out; Gate G1. |
| **02-design**: architecture-decisions.md | ✅ Có; quyết định kiến trúc, collections, blocks, routes; Gate G2. |
| **03-integrate**: contracts / API (khi có) | ✅ Có README + api-payments-stripe.md + env-vars.md. |
| **04-build**: sprint-plan.md | ✅ Có; task ↔ file mapping, convention, Gate G3 checklist. |
| **Naming**: kebab-case, không date/version trong tên file | ✅ Đúng. |
| **Header**: SDLC Version, Stage, Status trên mỗi doc | ✅ Các doc stage đều có. |
| **.sdlc-config.json** (optional) | ✅ Có tại root; tier LITE, active_stages 00–04. |
| **Gate formality**: Self-assessed (2 phút) | ✅ LITE; dùng [gate-checklist-template](sdlc/04-templates/gate-checklist-template.md) khi cần. |

**Chưa có (theo LITE không bắt buộc)**: 05-test, 06-deploy, 07-operate, 08-learn, 09-govern — bổ sung khi nâng tier (STANDARD+).

---

*Tài liệu dự án — Daisy Flower. Cập nhật theo SDLC 6.1.0.*
