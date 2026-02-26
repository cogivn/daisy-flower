---
name: daisy-layout-responsive
description: Enforces layout, container, spacing, and responsive patterns for the daisy-flower Payload/Next.js storefront. Use when modifying JSX/TSX layout, margins, padding, or responsive classes in this repo.
---

# Daisy Flower Layout & Responsive

## When to apply this skill

Use these rules whenever:

- Adding or editing blocks in `src/blocks/**`
- Changing layout / spacing in pages under `src/app/(app)/**`
- Adding or modifying Tailwind classes related to `container`, `grid`, `flex`, `gap`, `margin`, `padding`, or breakpoints (`sm:`, `md:`, `lg:`, `xl:`)

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

- **Page shell**
  - `RootLayout` wraps:
    - `<Header />`, `<main>{children}</main>`, `<Footer />`
  - Generic content pages (e.g. `[slug]/page.tsx`) should use:
    - `<article className="pt-8 pb-12 md:pt-12 md:pb-16 lg:pt-16 lg:pb-24 debug-container">`

---

## Vertical spacing (section-level)

- **Standard section spacing**
  - Use `section-spacing` for top-level sections (defined in `globals.css`):
    - `py-8 md:py-12 lg:py-16`
  - Examples:
    - `SaleOffer`: `className="container section-spacing"`
    - `ServiceFeatures`: outer wrapper `className="bg-white section-spacing border-b"` with an inner `container`.

- **Rules**
  - New strips/sections should use `section-spacing` + `container` unless intentionally different.
  - If custom spacing is needed, still follow the pattern:
    - Smaller on mobile, larger on desktop, usually steps of `8/12/16` (e.g. `py-8 md:py-12 lg:py-16`).
  - Avoid large `py-*` values on mobile (e.g. `py-20+`) except in hero sections.

---

## Margin & padding (component-level)

- **Around sections / blocks**
  - If not using `section-spacing`, use a similar pattern:
    - `my-8 md:my-12 lg:my-16` (as in `ContentBlock`).
  - Avoid stacking many large margins on top of `section-spacing` unless intentionally creating extra whitespace.

- **Inside cards / items**
  - Mobile: `px-4 py-6`
  - Tablet/desktop: `sm:px-6 sm:py-8` or equivalent.
  - Example (`ServiceFeaturesBlock` item):
    - `className="flex px-4 py-6 sm:px-6 sm:py-8 border ..."`

- **Overlay content (e.g. promo banners)**
  - Mobile: tighter inset, e.g. `inset-x-4`.
  - Desktop: more breathing room, e.g. `md:inset-x-8`.

---

## Responsive layout patterns

### General principles

- **Mobile-first**
  - Design for small screens first, then add `sm:`, `md:`, `lg:` overrides.
  - Base layout should be usable on small screens (1 column or `flex-col`).

- **Avoid dynamic Tailwind class strings**
  - Do **not** build Tailwind classes via template strings:
    - ❌ `` `lg:col-span-${colsSpanClasses[size]}` ``
  - Instead, list concrete classes in code so Tailwind can see them:
    - ✅ Use conditionals with explicit `lg:col-span-4`, `lg:col-span-6`, etc.

### Content block (text + link)

- Wrapper:
  - `className="container my-8 md:my-12 lg:my-16"`
- Grid:
  - `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-y-8 gap-x-8 lg:gap-x-16"`
- Column item classes:
  - For `size === 'full'`:
    - `col-span-1 sm:col-span-2 lg:col-span-12`
  - For other sizes (`half`, `oneThird`, `twoThirds`):
    - Base: `col-span-1 sm:col-span-2`
    - Desktop:
      - `oneThird` → `lg:col-span-4`
      - `half` → `lg:col-span-6`
      - `twoThirds` → `lg:col-span-8`

### Promo banners

- Grid columns depending on count:
  - 1 banner → `grid-cols-1`
  - 2 banners → `grid-cols-1 md:grid-cols-2`
  - 3+ banners → `grid-cols-1 md:grid-cols-3`
- Grid spacing:
  - `className={cn('grid gap-4 md:gap-8', gridCols)}`
- Card height:
  - `h-[220px] sm:h-[250px] md:h-[350px]`
- Text overlay wrapper:
  - `className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 md:inset-x-8"`

### Service features

- Outer:
  - `className="bg-white section-spacing border-b"`
- Layout:
  - `className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:justify-between gap-6 lg:gap-8"`
- Item:
  - `className="flex px-4 py-6 sm:px-6 sm:py-8 border border-transparent hover:border-primary/20 transition-all group"`
  - Icon:
    - `size={40}`, `className="text-primary group-hover:scale-110 transition-transform"`
    - `mr-4 sm:mr-5 shrink-0`

### Sale offer block

- Inside container:
  - `className="grid gap-6 md:gap-8 lg:grid-cols-2 lg:gap-12 items-start"`
- Principle:
  - Base `gap-6`, then `md:gap-8`, and largest at `lg`.

---

## Debug layout utilities

- Blocks can use:
  - `debug-outline`, `debug-grid`, `debug-container`.
- These only take effect when `<body>` has `debug-layout` (controlled via `NEXT_PUBLIC_DEBUG_LAYOUT`).
- When adding new debug CSS, always scope it under `.debug-layout` in `globals.css`.

---

## Text sizing patterns

- Headings usually scale with breakpoints:
  - Example: `text-2xl md:text-3xl` or `text-4xl md:text-5xl`.
- Body copy:
  - Base: `text-sm`
  - Tablet/desktop: upgrade to `md:text-base` where readability benefits.

---

## Example: new marketing section

- **Preferred pattern**

```tsx
<section className="bg-card section-spacing">
  <div className="container">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      {/* content */}
    </div>
  </div>
</section>
```

- **Avoid**

```tsx
// Missing container and using hard-coded, non-responsive spacing.
<section className="py-24 px-12">
  <div className="grid grid-cols-3 gap-10">
    {/* content */}
  </div>
</section>
```

---

## Checklist before finishing layout changes

- [ ] Used `container` for main (non–full-bleed) content.
- [ ] Section-level spacing uses `section-spacing` or an equivalent `py-8 md:py-12 lg:py-16` pattern.
- [ ] Mobile layout (small screens) works well (1 column or `flex-col`).
- [ ] Breakpoints rely on existing `sm:`, `md:`, `lg:`, `xl:` Tailwind classes.
- [ ] No Tailwind classes are constructed via template strings or runtime concatenation for responsive spans.
- [ ] Spacing (padding, margin, gap) uses reasonable scales (4/6/8/12/16) with mobile < desktop.
- [ ] Any debug layout helpers are scoped under `.debug-layout` and rely on `NEXT_PUBLIC_DEBUG_LAYOUT`.

