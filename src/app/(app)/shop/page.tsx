import { Grid } from '@/components/Grid'
import { ProductCard } from '@/components/product/ProductCard'
import { createUrl } from '@/utilities/createUrl'
import { sorting } from '@/lib/constants'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category, minPrice, maxPrice, page } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const currentPage = Math.max(1, Number(page) || 1)
  const limit = 12

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    page: currentPage,
    limit,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInVND: true,
      saleEvents: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category || minPrice || maxPrice
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          description: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(category
                ? [
                    {
                      categories: {
                        contains: category,
                      },
                    },
                  ]
                : []),
              ...(minPrice || maxPrice
                ? [
                    {
                      priceInVND: {
                        ...(minPrice && Number.isFinite(Number(minPrice))
                          ? { greater_than_equal: Number(minPrice) }
                          : {}),
                        ...(maxPrice && Number.isFinite(Number(maxPrice))
                          ? { less_than_equal: Number(maxPrice) }
                          : {}),
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'
  const hasActiveFilters = Boolean(searchValue || category || sort || minPrice || maxPrice)

  const activeSortLabel =
    sort && typeof sort === 'string'
      ? sorting.find((s) => s.slug === sort)?.title ?? null
      : null

  const buildShopHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams({
      ...(searchValue ? { q: String(searchValue) } : {}),
      ...(sort ? { sort: String(sort) } : {}),
      ...(category ? { category: String(category) } : {}),
      ...(minPrice ? { minPrice: String(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: String(maxPrice) } : {}),
      ...Object.fromEntries(Object.entries(overrides).filter(([, v]) => typeof v === 'string' && v.length)),
    })

    return createUrl('/shop', params)
  }

  return (
    <div>
      {hasActiveFilters ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Filters
            </span>
            {searchValue ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                <span className="font-medium">Search:</span>
                <span className="truncate">&quot;{searchValue}&quot;</span>
              </span>
            ) : null}
            {category ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                <span className="font-medium">Category</span>
              </span>
            ) : null}
            {activeSortLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                <span className="font-medium">Sort:</span>
                <span>{activeSortLabel}</span>
              </span>
            ) : null}
            {minPrice || maxPrice ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs">
                <span className="font-medium">Price:</span>
                <span>
                  {minPrice ? Number(minPrice).toLocaleString('de-DE') : '0'} -{' '}
                  {maxPrice ? Number(maxPrice).toLocaleString('de-DE') : '∞'}
                </span>
              </span>
            ) : null}
          </div>
          <Link
            className="text-sm underline underline-offset-4 hover:text-primary transition-colors"
            href="/shop"
          >
            Clear filters
          </Link>
        </div>
      ) : null}

      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <div className="mb-4">
          <p>No products found. Please try different filters.</p>
          {hasActiveFilters ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link className="underline underline-offset-4" href="/shop">
                Clear filters
              </Link>{' '}
              to see all products.
            </p>
          ) : null}
        </div>
      )}

      {products?.docs.length > 0 ? (
        <>
          <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.docs.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </Grid>

          {products.totalPages && products.totalPages > 1 ? (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {products.hasPrevPage ? (
                <Link
                  className="px-4 py-2 border border-border hover:bg-muted transition-colors text-sm"
                  href={buildShopHref({ page: String(currentPage - 1) })}
                  scroll
                >
                  Prev
                </Link>
              ) : null}

              {(() => {
                const totalPages = products.totalPages || 1
                const start = Math.max(1, currentPage - 2)
                const end = Math.min(totalPages, currentPage + 2)
                const pages: number[] = []
                for (let p = start; p <= end; p++) pages.push(p)

                const showFirst = start > 1
                const showLast = end < totalPages

                return (
                  <>
                    {showFirst ? (
                      <>
                        <Link
                          className={`px-3 py-2 border text-sm transition-colors ${
                            currentPage === 1
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:bg-muted'
                          }`}
                          href={buildShopHref({ page: '1' })}
                          scroll
                        >
                          1
                        </Link>
                        {start > 2 ? <span className="px-2 text-sm text-muted-foreground">…</span> : null}
                      </>
                    ) : null}

                    {pages.map((p) => {
                      const isActive = p === currentPage
                      return (
                        <Link
                          key={p}
                          className={`px-3 py-2 border text-sm transition-colors ${
                            isActive
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:bg-muted'
                          }`}
                          href={buildShopHref({ page: String(p) })}
                          scroll
                        >
                          {p}
                        </Link>
                      )
                    })}

                    {showLast ? (
                      <>
                        {end < totalPages - 1 ? <span className="px-2 text-sm text-muted-foreground">…</span> : null}
                        <Link
                          className={`px-3 py-2 border text-sm transition-colors ${
                            currentPage === totalPages
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:bg-muted'
                          }`}
                          href={buildShopHref({ page: String(totalPages) })}
                          scroll
                        >
                          {totalPages}
                        </Link>
                      </>
                    ) : null}
                  </>
                )
              })()}

              {products.hasNextPage ? (
                <Link
                  className="px-4 py-2 border border-border hover:bg-muted transition-colors text-sm"
                  href={buildShopHref({ page: String(currentPage + 1) })}
                  scroll
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
