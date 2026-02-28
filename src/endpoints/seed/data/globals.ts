export const headerData = {
  navItems: [
    { link: { type: 'custom' as const, label: 'Home', url: '/' } },
    { link: { type: 'custom' as const, label: 'Shop', url: '/shop' } },
  ],
}

export const footerData = {
  brandDescription:
    'We are a team of designers and developers that create high quality plants and flower shop themes for your business.',
  sections: [
    {
      title: 'Information',
      navItems: [
        { link: { type: 'custom' as const, label: 'About Us', url: '/about' } },
        { link: { type: 'custom' as const, label: 'Checkout', url: '/checkout' } },
        { link: { type: 'custom' as const, label: 'Contact', url: '/contact' } },
        { link: { type: 'custom' as const, label: 'Frequently Questions', url: '/faq' } },
      ],
    },
    {
      title: 'My Account',
      navItems: [
        { link: { type: 'custom' as const, label: 'My Account', url: '/account' } },
        { link: { type: 'custom' as const, label: 'Shopping Cart', url: '/cart' } },
        { link: { type: 'custom' as const, label: 'Checkout', url: '/checkout' } },
        { link: { type: 'custom' as const, label: 'Shop', url: '/shop' } },
      ],
    },
  ],
  openingHours: [
    { day: 'Monday - Friday:', hours: '8AM - 10PM' },
    { day: 'Saturday:', hours: '9AM - 8PM' },
    { day: 'Sunday:', hours: 'Closed' },
  ],
  copyrightText: 'LUKANI. Made with ❤️ for plants.',
}
