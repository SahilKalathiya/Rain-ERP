import {
  initialVendors,
  initialFabrics,
  initialPurchaseOrders,
  initialGRNs,
  initialQualityChecks,
  initialRejectedStock,
  initialTransporters
} from '../data/procurementData';

import {
  initialSalesOrders,
  initialSizeSeries,
  initialAccessoryMasters,
  initialCustomers,
  initialColors,
  initialArticles,
  initialThreadSizes,
  initialThreadBrandColors
} from '../data/salesOrderData';

/**
 * Resets all user-created test/example data across Masters, Purchase Orders, and Sales Orders
 * Purges all dummy fabrics, vendors, purchase orders, sales orders, GRNs, QCs, Stock Pool,
 * Article Master, Color Master, Size Master, Accessories Master, and customers.
 */
export function resetExampleDataToDefaults(force = false) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  const CLEANUP_KEY = 'erp_blank_state_clean_v12';
  if (!force && localStorage.getItem(CLEANUP_KEY) === 'true') {
    return;
  }

  try {
    // 1. Sales Orders: Empty list (no dummy orders)
    localStorage.setItem('erp_sales_orders_v1', JSON.stringify([]));

    // 2. Purchase Orders: Empty list (no dummy POs)
    localStorage.setItem('raindrop_pos_v1', JSON.stringify([]));

    // 3. Vendors Master: Empty list (no dummy vendors)
    localStorage.setItem('raindrop_vendors_v1', JSON.stringify([]));

    // 4. Fabrics Master: Empty list (no dummy fabrics)
    localStorage.setItem('raindrop_fabrics_v1', JSON.stringify([]));

    // 5. Transporters Master: Empty list
    localStorage.setItem('raindrop_transporters_v1', JSON.stringify([]));

    // 6. Customers Master: Empty list
    localStorage.setItem('erp_customers_v1', JSON.stringify([]));

    // 7. GRN, QC & Stock Pools: Empty list
    localStorage.setItem('raindrop_grns_v1', JSON.stringify([]));
    localStorage.setItem('raindrop_qcs_v1', JSON.stringify([]));
    localStorage.setItem('raindrop_rejected_stock_v1', JSON.stringify([]));
    localStorage.setItem('raindrop_stock_pool_v1', JSON.stringify([]));
    localStorage.setItem('erp_stock_pool_v1', JSON.stringify([]));
    localStorage.setItem('erp_open_bales', JSON.stringify([]));
    localStorage.setItem('raindrop_activity_logs_v1', JSON.stringify([]));
    localStorage.setItem('raindrop_audit_logs_v1', JSON.stringify([]));

    // 8. Size Series Master: Empty list (0 series)
    localStorage.setItem('erp_size_series_v1', JSON.stringify([]));

    // 9. Article, Color & Accessory Masters: Empty lists (0 records)
    localStorage.setItem('raindrop_colors_v1', JSON.stringify([]));
    localStorage.setItem('erp_colors_master_v1', JSON.stringify([]));
    localStorage.setItem('erp_accessories_master_v1', JSON.stringify([]));
    localStorage.setItem('erp_articles_v1', JSON.stringify([]));
    localStorage.setItem('erp_articles_master', JSON.stringify([]));
    localStorage.setItem('erp_thread_sizes_v1', JSON.stringify([]));
    localStorage.setItem('erp_thread_brand_colors_v1', JSON.stringify([]));

    // Mark cleanup as complete
    localStorage.setItem(CLEANUP_KEY, 'true');

    // Notify all active listeners across the app
    window.dispatchEvent(new Event('erp_sales_order_updated'));
    window.dispatchEvent(new Event('erp_size_series_updated'));
    window.dispatchEvent(new Event('erp_accessories_master_updated'));
    window.dispatchEvent(new Event('erp_articles_updated'));
    window.dispatchEvent(new Event('erp_colors_updated'));
    window.dispatchEvent(new Event('raindrop_colors_updated'));
    window.dispatchEvent(new Event('raindrop_fabrics_updated'));
    window.dispatchEvent(new Event('storage'));

    console.log('[ERP Data Cleanup] Successfully purged all sample POs, Orders, Stock Pool, and Master records.');
  } catch (err) {
    console.error('[ERP Data Cleanup Error]', err);
  }
}
