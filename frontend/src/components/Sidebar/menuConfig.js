// =========================================================================
// Rain Drop ERP - Navigation Menu Configuration
// All labels are fully translated with clean titles (no raw nav.* keys)
// =========================================================================

export const navigationMenu = [
  {
    title: 'Raw Material Procurement',
    items: [
      { label: 'Overview Dashboard', link: '/dashboard', icon: 'ti ti-layout-dashboard' },
      {
        label: 'Procurement Workflow',
        icon: 'ti ti-shopping-cart',
        open: true,
        submenu: [
          { label: 'Purchase Orders', link: '/procurement-pos' },
          { label: 'Goods Receipt (GRN)', link: '/goods-inward' },
          { label: 'Quality Check (QC)', link: '/quality-batches' },
          { label: 'Rejected Stock Pool', link: '/rejected-stock' }
        ]
      },
      {
        label: 'Master Data',
        icon: 'ti ti-database',
        open: true,
        submenu: [
          { label: 'Vendors Master', link: '/vendors' },
          { label: 'Fabrics Master', link: '/fabrics' },
          { label: 'Transporters Master', link: '/transporters' }
        ]
      }
      /* =========================================================================
       * OUT OF SCOPE FOR MODULE 1 (Deferred to Future Stages - Section 2.2 / 10)
       * =========================================================================
      {
        label: 'Processing (Dye/Print)',
        icon: 'ti ti-brush',
        submenu: [
          { label: 'Purchase Orders', link: '/processing-pos' },
          { label: 'New PO', link: '/processing-new' },
          { label: 'Record Inward', link: '/processing-inward' }
        ]
      },
      {
        label: 'Cutting',
        icon: 'ti ti-scissors',
        submenu: [
          { label: 'Purchase Orders', link: '/cutting-pos' },
          { label: 'New PO', link: '/cutting-new' },
          { label: 'Record Inward', link: '/cutting-inward' }
        ]
      },
      {
        label: 'Production',
        icon: 'ti ti-shirt',
        submenu: [
          { label: 'After-Cut Embroidery', link: '/production-embroidery' },
          { label: 'Single Cut Order', link: '/production-single-cut' },
          { label: 'Stitching Jobs', link: '/production-stitching' }
        ]
      },
      {
        label: 'Finishing',
        icon: 'ti ti-sparkles',
        submenu: [
          { label: 'Batches', link: '/finishing-batches' },
          { label: 'Inspection Reports', link: '/finishing-reports' }
        ]
      },
      {
        label: 'Dispatch',
        icon: 'ti ti-send',
        submenu: [
          { label: 'Dispatch', link: '/dispatch' },
          { label: 'Packing List', link: '/dispatch-packing' }
        ]
      }
      ========================================================================= */
    ]
  }
];
