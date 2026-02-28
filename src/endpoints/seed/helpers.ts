import type { File, Payload } from 'payload'

// ──────────────────────────────────────────────
// SeedContext — accumulates created entities across steps
// ──────────────────────────────────────────────

export interface SeedEntity {
  id: number | string
  [key: string]: unknown
}

export interface SeedContext {
  payload: Payload
  media: Record<string, SeedEntity & { alt: string }>
  categories: Record<string, SeedEntity & { title: string; slug: string }>
  products: Record<string, SeedEntity & { title: string; slug: string }>
  users: Record<string, SeedEntity & { email: string }>
  variantTypes: Record<string, SeedEntity>
  variantOptions: Record<string, SeedEntity & { value: string }>
  forms: Record<string, SeedEntity>
  misc: Record<string, unknown>
}

export function createSeedContext(payload: Payload): SeedContext {
  return {
    payload,
    media: {},
    categories: {},
    products: {},
    users: {},
    variantTypes: {},
    variantOptions: {},
    forms: {},
    misc: {},
  }
}

// ──────────────────────────────────────────────
// Media helpers
// ──────────────────────────────────────────────

export async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, { credentials: 'include', method: 'GET' })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}

export interface MediaEntry {
  key: string
  url: string
  alt: string
}

export async function seedMediaBatch(
  ctx: SeedContext,
  entries: MediaEntry[],
): Promise<void> {
  const files = await Promise.all(entries.map((e) => fetchFileByURL(e.url)))

  const docs = await Promise.all(
    entries.map((entry, i) =>
      ctx.payload.create({
        collection: 'media',
        data: { alt: entry.alt },
        file: files[i],
      }),
    ),
  )

  for (let i = 0; i < entries.length; i++) {
    ctx.media[entries[i].key] = { id: docs[i].id, alt: entries[i].alt }
  }
}

// ──────────────────────────────────────────────
// RichText builders — replace verbose Lexical JSON
// ──────────────────────────────────────────────

type LexicalNode = { [k: string]: unknown; type: string; version: number }

export const rt = {
  root(children: LexicalNode[]) {
    return {
      root: {
        type: 'root' as const,
        children,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    }
  },

  heading(text: string, tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h1'): LexicalNode {
    return {
      type: 'heading',
      children: [rt._text(text)],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      tag,
      version: 1,
    }
  },

  paragraph(text: string): LexicalNode {
    return {
      type: 'paragraph',
      children: [rt._text(text)],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      textFormat: 0,
      version: 1,
    }
  },

  list(items: string[], listType: 'bullet' | 'number' = 'bullet'): LexicalNode {
    return {
      type: 'list',
      children: items.map((item, i) => ({
        type: 'listitem' as const,
        children: [rt._text(item)],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        value: i + 1,
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      listType,
      start: 1,
      tag: listType === 'bullet' ? 'ul' : 'ol',
    }
  },

  _text(text: string, format: number = 0): LexicalNode {
    return {
      type: 'text',
      detail: 0,
      format,
      mode: 'normal',
      style: '',
      text,
      version: 1,
    }
  },
}

// ──────────────────────────────────────────────
// SQLite retry helper
// ──────────────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e: unknown) {
      const isLocked =
        e &&
        typeof e === 'object' &&
        'cause' in e &&
        (e as { cause?: { code?: string } }).cause?.code === 'SQLITE_BUSY'
      if (isLocked && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)))
        continue
      }
      throw e
    }
  }
  throw new Error('withRetry: unreachable')
}
