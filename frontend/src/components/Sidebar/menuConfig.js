// =========================================================================
// Rain Drop ERP - Navigation Menu Configuration
// Exact Sidebar Hierarchy matching the system & video layout
// =========================================================================

export const navigationMenu = [
  {
    title: 'Main Navigation',
    items: [
      { label: 'Dashboard', link: '/dashboard', icon: 'ti ti-layout-dashboard' },
      { label: 'Orders', link: '/orders', icon: 'ti ti-shopping-bag' },
      {
        label: 'Procurement',
        icon: 'ti ti-shopping-cart',
        open: true,
        submenu: [
          { label: 'Purchase Orders', link: '/procurement-pos' },
          { label: 'Goods Receipt (GRN)', link: '/goods-inward' },
          { label: 'Quality Check (QC)', link: '/quality-batches' },
          { label: 'Stock Pool', link: '/stock-pool' },
          { label: 'Rejected Stock Pool', link: '/rejected-stock' }
        ]
      },
      {
        label: 'Masters',
        icon: 'ti ti-database',
        open: false,
        submenu: [
          { label: 'Customer', link: '/customers' },
          { label: 'Article', link: '/articles' },
          { label: 'Color', link: '/colors' },
          { label: 'Size Series', link: '/sizes' },
          { label: 'Accessories', link: '/accessories' },
          { label: 'Fabrics', link: '/fabrics' },
          { label: 'Vendors', link: '/vendors' },
          { label: 'Transporters', link: '/transporters' }
        ]
      }
    ]
  }
];
