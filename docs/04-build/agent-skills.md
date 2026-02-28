# Skills cho AI Agent — Daisy Flower

**SDLC Version**: 6.1.0  
**Stage**: 04 - BUILD  
**Status**: Active

---

## 1. Mục đích

Dự án có **skills** (tài liệu hướng dẫn chuyên biệt) để agent dùng khi làm việc với Payload, layout, hoặc cần tìm thêm skill. **Khi làm task liên quan**, agent nên **tìm và áp dụng skill tương ứng** — đọc file SKILL.md trước khi code để tuân thủ convention và tránh lỗi thường gặp.

---

## 2. Skills có sẵn trong repo

| Skill | Đường dẫn | Khi nào dùng |
|-------|-----------|---------------|
| **Payload** | `.agents/skills/payload/SKILL.md` | Làm việc với Payload: `payload.config.ts`, collections, fields, hooks, access control, Local API. Debug validation, security (overrideAccess, req trong hooks), relationship/join, transactions, hook loops, jobs, custom endpoints. |
| **Daisy layout & responsive** | `.cursor/skills/daisy-layout-responsive/SKILL.md` | Sửa layout, container, spacing, responsive trong JSX/TSX: blocks (`src/blocks/**`), trang frontend (`src/app/(app)/**`), Tailwind (container, grid, flex, gap, margin, padding, breakpoints). |

---

## 3. Cách dùng

- **Trước khi sửa code** liên quan đến Payload (collection, hook, access, API): đọc **Payload** skill để áp dụng pattern (vd. `overrideAccess: false` khi có user, truyền `req` trong hooks).
- **Trước khi sửa layout/UI** (blocks, trang, spacing, responsive): đọc **Daisy layout** skill để dùng đúng container và breakpoints.
- **Khi cần làm việc chưa có skill trong repo**: có thể dùng skill **find-skills** (nếu có) để tìm skill phù hợp; hoặc tham chiếu AGENTS.md và docs (requirements, architecture) để giữ đúng quy ước dự án.

---

## 4. Tham chiếu thêm

- **AGENTS.md** (root): Quy tắc Payload, security, generate:types, importmap.
- **docs/01-planning/requirements.md**: User stories, mapping file.
- **docs/02-design/architecture-decisions.md**: Collections, blocks, routes, patterns.

---

*Tài liệu skills cho agent — Daisy Flower. SDLC 6.1.0, Stage 04.*
