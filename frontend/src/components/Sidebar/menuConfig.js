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
          { label: 'Customer Master', link: '/customers' },
          { label: 'Article Master', link: '/articles' },
          { label: 'Color Master', link: '/colors' },
          { label: 'Size Series Master', link: '/sizes' },
          { label: 'Accessories Master', link: '/accessories' },
          { label: 'Fabrics Master', link: '/fabrics' },
          { label: 'Vendors Master', link: '/vendors' },
          { label: 'Transporters Master', link: '/transporters' }
        ]
      }
    ]
  }
];
