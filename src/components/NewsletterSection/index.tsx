
type Props = {
  title?: string | null
  description?: string | null
}

export function NewsletterSection({ title, description }: Props) {
  return (
    <div className="bg-neutral-100 py-16 border-b">
      <div className="container flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="max-w-xl">
          <h3 className="text-3xl font-bold mb-3 uppercase tracking-tight">
            {title || 'Join Our Newsletter Now'}
          </h3>
          <p className="text-muted-foreground text-lg">
            {description ||
              'Get E-mail updates about our latest shop and special offers.'}
          </p>
        </div>
        <form className="w-full max-w-lg flex shadow-sm border-2 border-primary/20">
          <input
            type="email"
            placeholder="Your email address..."
            className="grow px-6 py-5 rounded-none border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-black bg-white"
          />
          <button className="bg-primary text-white px-10 py-5 font-bold hover:bg-foreground transition-all duration-300 uppercase tracking-widest text-xs">
            Subscribe
          </button>
        </form>
      </div>
    </div>
  )
}

