---
name: daisy-layout-responsive
description: Enforces layout, container, spacing, responsive patterns, and shared typography tokens for the daisy-flower Payload/Next.js storefront. Use when modifying JSX/TSX layout, margins, padding, responsive classes, or typography on the frontend.
---

# Daisy Flower Layout & Typography

## When to apply this skill

Use these rules whenever you work on the **storefront frontend**:

- Adding or editing blocks in `src/blocks/**`
- Changing layout / spacing in pages under `src/app/(app)/**`
- Adding or modifying Tailwind classes related to `container`, `grid`, `flex`, `gap`, `margin`, `padding`, or breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- Adjusting typography (heading sizes, body text, labels) so that sections stay visually consistent

---

## Core layout primitives

- **Container**
  - Always use `container` for main content (non–full-bleed).
  - Defined in `globals.css`:
    - Base: `width: 100%; margin-inline: auto; padding-inline: 1rem;`
    - `sm:` → `max-width: var(--breakpoint-sm);`
    - `md:` → `max-width: var(--breakpoint-md); padding-inline: 2rem;`
    - `lg:` → `max-width: var(--breakpoint-lg);`
    - `xl:` → `max-width: var(--breakpoint-xl);`
    - `2xl:` → `max-width: var(--breakpoint-2xl);`

- **Breakpoints (approx)**
  - `--breakpoint-sm: 40rem` (~640px)
  - `--breakpoint-md: 48rem` (~768px)
  - `--breakpoint-lg: 64rem` (~1024px)
  - `--breakpoint-xl: 80rem` (~1280px)
  - `--breakpoint-2xl: 86rem` (~1376px)

---

## Section spacing & component spacing

- **Standard section spacing**
  - Use `section-spacing` for top-level sections:
    - `py-8 md:py-12 lg:py-16`
  - Pattern: outer `<section className="bg-... section-spacing">` + inner `<div className="container">`.

- **Around sections / blocks**
  - If not using `section-spacing`, use a similar pattern:
    - `my-8 md:my-12 lg:my-16` (used in some content blocks).

- **Inside cards / items**
  - Mobile: `px-4 py-6`
  - Tablet/desktop: `sm:px-6 sm:py-8` or equivalent.

---

## Responsive layout principles

- **Mobile-first**
  - Base layout should be 1 column or `flex-col` and usable on small screens.
  - Add `sm:`, `md:`, `lg:` overrides only where needed.

- **Avoid dynamic Tailwind class strings**
  - Do **not** build classes like:
    - ❌ `` `lg:col-span-${colsSpan[size]}` ``
  - Instead, enumerate concrete classes:
    - ✅ conditionally apply `lg:col-span-4`, `lg:col-span-6`, etc.

---

## Shared typography tokens (toàn bộ frontend)

Use these utility classes instead of picking ad-hoc `text-*` sizes for ANY page, section, block, or component:

- `typo-page-title`
  - `font-heading font-bold leading-tight text-3xl md:text-4xl`
  - Dùng cho tiêu đề trang chính (hero/page title).

- `typo-section-title`
  - `font-heading font-extrabold leading-tight uppercase tracking-tight text-2xl md:text-3xl`
  - Dùng cho tiêu đề section/block (ShopByCategories, ProductListing, SaleOffer, BlogBento, Newsletter, checkout sections, account sections, v.v.).

- `typo-section-subtitle`
  - `text-sm md:text-base text-muted-foreground`
  - Dùng cho mô tả ngắn bên dưới section title.

- `typo-eyebrow`
  - `text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-primary`
  - Dùng cho nhãn nhỏ/eyebrow (kicker) phía trên heading.

- `typo-body`
  - `text-base leading-relaxed`
  - Dùng cho đoạn nội dung thân tiêu chuẩn.

- `typo-body-sm`
  - `text-sm md:text-base leading-relaxed`
  - Dùng cho nội dung thân kích thước nhỏ hơn, thường trong card/secondary text.

**Rules:**

- Không tự ý chọn `text-xl/2xl/3xl` cho section title mới – hãy dùng `typo-section-title`.
- Mô tả section nên dùng `typo-section-subtitle` để đảm bảo đồng bộ cỡ chữ và màu.
- Khi thêm eyebrow/kicker cho block mới, dùng `typo-eyebrow` thay vì tự khai báo lại `text-xs ... tracking-[0.18em]`.
- Body text trong nội dung dài nên ưu tiên `typo-body` hoặc `typo-body-sm`.

---

## Checklist before finishing frontend changes

- [ ] Đã dùng `container` cho nội dung chính (non–full-bleed).
- [ ] Spacing section dùng `section-spacing` hoặc pattern tương đương `py-8 md:py-12 lg:py-16`.
- [ ] Layout mobile hoạt động tốt (1 cột hoặc `flex-col`).
- [ ] Breakpoints dùng các class Tailwind chuẩn (`sm:`, `md:`, `lg:`, `xl:`).
- [ ] Không có Tailwind class được build bằng template string động cho responsive spans.
- [ ] Spacing (padding, margin, gap) dùng scale hợp lý (4/6/8/12/16) với mobile < desktop.
- [ ] Heading/section title dùng `typo-section-title` (hoặc `typo-page-title`), không tự chọn size riêng.
- [ ] Subtitle section dùng `typo-section-subtitle`, eyebrow dùng `typo-eyebrow` nếu có.
