// =========================================================================
// Raindrop Garments - Module 3: Process PO (Job Work Procurement Module)
// Seed Data accurately structured per PDF Specification & Client Real Receipts
// (Raju Dyeing, PO #7611-#7613, Challan #4903, Inward #2196, QC Log)
// =========================================================================

export const initialProcessPOs = [
  {
    id: 'PPO-7611',
    po_number: '7611',
    date: '2026-08-12',
    issue_date: '2026-08-12',
    vendor_id: 'VEND-0003',
    vendor_name: 'Raju Dyeing (Krishna Dyeing)',
    linked_sales_order_id: 'ORD-2026-001',
    style_names: ['Graphic Boota Kurta', 'A-Line Festive Kurta'],
    number_of_styles: 2,
    customer_brand_name: 'Raindrop Signature',
    delivery_date: '2026-08-25',
    terms: 'Goods delivered must be strictly as per sample and specification within stipulated date.',
    total_meters: 525.00,
    total_pieces: 201,
    total_estimated_cost: 19425.00, // (25 + 12) * 525
    status: 'Partially Dispatched',
    created_by: 'Saksham Garg',
    created_at: '2026-08-12T10:00:00Z',
    items: [
      {
        id: 1,
        style_name: 'Graphic Boota Kurta',
        fabric_id: 'FAB-001',
        fabric_name: '100x100 Voile (Grey)',
        color_id: 'COL-001',
        color_name: 'Beige',
        color_hex: '#F5F5DC',
        article_id: 'ART-001',
        article_name: 'Kurta',
        width: '48',
        quantity_meters: 525.00,
        quantity_pieces: 201,
        consumption_per_piece: 2.60,
        shrinkage_percent: 4.00,
        raw_fabric_meters: 546.00,
        fabric_rate: 25.00,
        dyeing_rate: 12.00,
        total_actual_cost: 37.00,
        total_amount: 19425.00,
        remarks: 'Sample approved as per Graphic Boota swatch',
        sample_photo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=200&fit=crop',
        status: 'Partially Dispatched',
        dispatched_meters: 525.00,
        received_meters: 471.40
      }
    ]
  },
  {
    id: 'PPO-7612',
    po_number: '7612',
    date: '2026-08-12',
    issue_date: '2026-08-12',
    vendor_id: 'VEND-0003',
    vendor_name: 'Raju Dyeing (Krishna Dyeing)',
    linked_sales_order_id: 'ORD-2026-001',
    style_names: ['Graphic Boota Kurta'],
    number_of_styles: 1,
    customer_brand_name: 'Raindrop Signature',
    delivery_date: '2026-08-25',
    terms: 'Goods delivered must be strictly as per sample and specification within stipulated date.',
    total_meters: 1006.20,
    total_pieces: 387,
    total_estimated_cost: 37229.40,
    status: 'Partially Dispatched',
    created_by: 'Saksham Garg',
    created_at: '2026-08-12T10:15:00Z',
    items: [
      {
        id: 2,
        style_name: 'Graphic Boota Kurta',
        fabric_id: 'FAB-001',
        fabric_name: '100x100 Voile (Grey)',
        color_id: 'COL-002',
        color_name: 'Off White',
        color_hex: '#FAF9F6',
        article_id: 'ART-001',
        article_name: 'Kurta',
        width: '48',
        quantity_meters: 1006.20,
        quantity_pieces: 387,
        consumption_per_piece: 2.60,
        shrinkage_percent: 4.00,
        raw_fabric_meters: 1046.45,
        fabric_rate: 25.00,
        dyeing_rate: 12.00,
        total_actual_cost: 37.00,
        total_amount: 37229.40,
        remarks: 'Bleach white base before off-white tinting',
        sample_photo: null,
        status: 'Partially Dispatched',
        dispatched_meters: 1006.20,
        received_meters: 1006.20
      }
    ]
  },
  {
    id: 'PPO-7613',
    po_number: '7613',
    date: '2026-08-12',
    issue_date: '2026-08-12',
    vendor_id: 'VEND-0003',
    vendor_name: 'Raju Dyeing (Krishna Dyeing)',
    linked_sales_order_id: null, // Standalone PO!
    style_names: ['Stock Cambric Plain'],
    number_of_styles: 1,
    customer_brand_name: 'Raindrop Stock Pool',
    delivery_date: '2026-08-27',
    terms: 'General stock dyeing order, directly routes to stock pool.',
    total_meters: 887.60,
    total_pieces: 341,
    total_estimated_cost: 32841.20,
    status: 'Sent to Vendor',
    created_by: 'Saksham Garg',
    created_at: '2026-08-12T11:00:00Z',
    items: [
      {
        id: 3,
        style_name: 'Stock Cambric Plain',
        fabric_id: 'FAB-003',
        fabric_name: 'Cotton Cambric 60*60',
        color_id: 'COL-003',
        color_name: 'Dusty Rose',
        color_hex: '#DCAE96',
        article_id: 'ART-001',
        article_name: 'Kurta',
        width: '44',
        quantity_meters: 887.60,
        quantity_pieces: 341,
        consumption_per_piece: 2.60,
        shrinkage_percent: 3.50,
        raw_fabric_meters: 918.66,
        fabric_rate: 42.00,
        dyeing_rate: 10.00,
        total_actual_cost: 52.00,
        total_amount: 46155.20,
        remarks: 'Soft wash finish required',
        sample_photo: null,
        status: 'Not Ordered',
        dispatched_meters: 887.60,
        received_meters: 0.00
      }
    ]
  }
];

export const initialProcessChallans = [
  {
    id: 'PCH-4903',
    challan_number: '4903',
    date: '2026-08-12',
    vendor_id: 'VEND-0003',
    vendor_name: 'Raju Dyeing (Krishna Dyeing)',
    linked_pos: ['PPO-7611', 'PPO-7612', 'PPO-7613'],
    styles_info: ['Graphic Boota Kurta', 'Stock Cambric Plain'],
    po_link_status: 'Linked',
    admin_alert_triggered: false,
    folding_notation: 'L100',
    total_bales: 1,
    total_pieces: 7,
    grand_total_meters: 2418.80,
    remarks: 'Fab. issue for dyeing. Handed over to Raju Dyeing driver.',
    receiver_signature: 'Raju Dyeing Rep',
    company_representative: 'Anurag',
    status: 'Partially Returned',
    created_by: 'Saksham Garg',
    created_at: '2026-08-12T14:30:00Z',
    items: [
      { id: 1, bale_roll_no: 'Roll 12304', fabric_name: '100x100 Voile (Grey)', color_name: 'Off White', invoice_no: 'INV-MS-0091', original_piece_meters: 1065.50, dispatched_meters: 1065.50, is_partial_cut: false, folding: 'L100' },
      { id: 2, bale_roll_no: 'Roll 2376-A', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 119.30, dispatched_meters: 119.30, is_partial_cut: false, folding: 'L100' },
      { id: 3, bale_roll_no: 'Roll 2376-B', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 111.00, dispatched_meters: 111.00, is_partial_cut: false, folding: 'L100' },
      { id: 4, bale_roll_no: 'Roll 2376-C', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 78.40, dispatched_meters: 78.40, is_partial_cut: false, folding: 'L100' },
      { id: 5, bale_roll_no: 'Roll 2376-D', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 97.80, dispatched_meters: 97.80, is_partial_cut: false, folding: 'L100' },
      { id: 6, bale_roll_no: 'Roll 2376-E', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 113.30, dispatched_meters: 113.30, is_partial_cut: false, folding: 'L100' },
      { id: 7, bale_roll_no: 'Roll 2376-F (Cut)', fabric_name: '100x100 Voile (Grey)', color_name: 'Beige', invoice_no: 'INV-MS-0091', original_piece_meters: 134.00, dispatched_meters: 20.00, is_partial_cut: true, folding: 'L100' }
    ]
  }
];

export const initialProcessReturns = [
  {
    id: 'PRN-2196',
    vendor_id: 'VEND-0003',
    vendor_name: 'Raju Dyeing (Krishna Dyeing)',
    vendor_external_challan_no: '2196',
    vendor_challan_date: '2026-08-27',
    vendor_invoice_no: 'INV-RD-8841',
    vendor_invoice_date: '2026-08-27',
    vendor_invoice_value: 17731.20,
    internal_series: 'Job Work',
    linked_po_id: 'PPO-7611',
    linked_challan_id: 'PCH-4903',
    received_date: '2026-08-27',
    fabric_quality: '100x100 Voile Solid Dye',
    width: '48',
    weight: 122.5,
    folding_standard: 'Fold 100',
    total_pieces: 13,
    total_meters: 1477.60,
    vendor_declared_pieces: 13,
    vendor_declared_meters: 1477.60,
    grey_fabric_returned_meters: 40.00, // Section 5.3 Grey Fabric Return
    transport_details: {
      lr_number: 'LR-SURAT-9981',
      lr_date: '2026-08-27',
      transporter_name: 'Local Auto Tempo (Surat)',
      vehicle_no: 'GJ-05-BX-4120',
      notes: 'Direct factory delivery'
    },
    status: 'QC Completed',
    created_by: 'Saksham Garg',
    created_at: '2026-08-27T16:00:00Z',
    pieces: [
      { id: 1, piece_no: 1, meters: 104.10, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 2, piece_no: 2, meters: 107.00, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 3, piece_no: 3, meters: 108.50, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 4, piece_no: 4, meters: 104.15, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 5, piece_no: 5, meters: 104.85, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 6, piece_no: 6, meters: 153.00, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 7, piece_no: 7, meters: 109.35, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 8, piece_no: 8, meters: 104.40, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 9, piece_no: 9, meters: 100.00, color_name: 'Off White', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 10, piece_no: 10, meters: 63.10, color_name: 'Beige', folding: 'Fold 100', qc_status: 'Piece Division' }, // 63.10m split
      { id: 11, piece_no: 11, meters: 104.10, color_name: 'Beige', folding: 'Fold 100', qc_status: 'Accepted' },
      { id: 12, piece_no: 12, meters: 184.60, color_name: 'Beige', folding: 'Fold 100', qc_status: 'Lot Division' }, // Batch 2 (Lighter Shade)
      { id: 13, piece_no: 13, meters: 119.60, color_name: 'Beige', folding: 'Fold 100', qc_status: 'Rejected - Reprocess' } // Sent for reprocessing
    ]
  }
];

export const initialOpenBales = [
  {
    id: 'OB-0001',
    return_id: 'PRN-2196',
    fabric_id: 'FAB-001',
    fabric_name: '100x100 Voile (Grey)',
    original_vendor_invoice_ref: 'INV-MS-0091 (M.S. Textiles)',
    returned_meters: 40.00,
    remaining_meters: 40.00,
    audit_trail: [
      { date: '2026-08-12', action: 'Issued from INV-MS-0091 under Challan #4903' },
      { date: '2026-08-27', action: 'Returned unutilised by Raju Dyeing under Inward #2196 as Open Bale' }
    ],
    status: 'Available',
    created_at: '2026-08-27T16:15:00Z'
  }
];

export const initialProcessQCRecords = [
  {
    id: 'PQC-0001',
    return_id: 'PRN-2196',
    piece_no: 10,
    original_length: 63.10,
    qc_outcome: 'Accepted',
    rejection_action: null,
    reprocessing_challan_id: null,
    reprocessing_loop_status: 'Cleared',
    division_type: 'Piece Division', // Stitch Cuts
    piece_splits: [
      { piece_suffix: 'A', meters: 30.00, notes: 'Continuous join cut 1' },
      { piece_suffix: 'B', meters: 33.10, notes: 'Continuous join cut 2' }
    ],
    lot_batch_id: 'Batch 1 - Standard Shade',
    paper_qc_report_photo: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=400&h=300&fit=crop',
    adjusted_yield: 24, // Original yield 25 -> lowered to 24 due to join
    color_fastness: 'Pass',
    color_fastness_proof_photo: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&h=200&fit=crop',
    inspector_name: 'Priya Sharma',
    notes: 'Roll had a middle machine stitch join at 30.00m. Split neatly into two clean cutting thans.',
    created_at: '2026-08-28T11:00:00Z'
  },
  {
    id: 'PQC-0002',
    return_id: 'PRN-2196',
    piece_no: 12,
    original_length: 184.60,
    qc_outcome: 'Accepted',
    rejection_action: null,
    reprocessing_challan_id: null,
    reprocessing_loop_status: 'Cleared',
    division_type: 'Lot Division', // Shade Variance
    piece_splits: [],
    lot_batch_id: 'Batch 2 - Lighter Beige (Isolate)',
    paper_qc_report_photo: null,
    adjusted_yield: 71,
    color_fastness: 'Pass',
    color_fastness_proof_photo: null,
    inspector_name: 'Priya Sharma',
    notes: 'Noticeable 1/2 tone lighter shade variance. Isolated as Batch 2 so cutting room does not mix with Batch 1 garments.',
    created_at: '2026-08-28T11:30:00Z'
  },
  {
    id: 'PQC-0003',
    return_id: 'PRN-2196',
    piece_no: 13,
    original_length: 119.60,
    qc_outcome: 'Full Rejection',
    rejection_action: 'Reprocess',
    reprocessing_challan_id: 'PCH-4910-REPROC',
    reprocessing_loop_status: 'In Loop',
    division_type: 'None',
    piece_splits: [],
    lot_batch_id: null,
    paper_qc_report_photo: null,
    adjusted_yield: 0,
    color_fastness: 'Fail', // Rub test failed
    color_fastness_proof_photo: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=300&h=200&fit=crop',
    inspector_name: 'Priya Sharma',
    notes: 'Color fastness rub test failed with noticeable crocking. Sent back to Raju Dyeing for re-washing/fixing under Reprocess Challan PCH-4910. No payment obligation.',
    created_at: '2026-08-28T12:00:00Z'
  }
];

// Helper functions for LocalStorage management
export const getStoredProcessPOs = () => {
  try {
    const s = localStorage.getItem('erp_process_pos');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return initialProcessPOs;
};

export const saveStoredProcessPOs = (pos) => {
  try {
    localStorage.setItem('erp_process_pos', JSON.stringify(pos));
  } catch (e) {}
};

export const getStoredProcessChallans = () => {
  try {
    const s = localStorage.getItem('erp_process_challans');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return initialProcessChallans;
};

export const saveStoredProcessChallans = (challans) => {
  try {
    localStorage.setItem('erp_process_challans', JSON.stringify(challans));
  } catch (e) {}
};

export const getStoredProcessReturns = () => {
  try {
    const s = localStorage.getItem('erp_process_returns');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return initialProcessReturns;
};

export const saveStoredProcessReturns = (returns) => {
  try {
    localStorage.setItem('erp_process_returns', JSON.stringify(returns));
  } catch (e) {}
};

export const getStoredOpenBales = () => {
  try {
    const s = localStorage.getItem('erp_open_bales');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return initialOpenBales;
};

export const saveStoredOpenBales = (bales) => {
  try {
    localStorage.setItem('erp_open_bales', JSON.stringify(bales));
  } catch (e) {}
};

export const getStoredProcessQCRecords = () => {
  try {
    const s = localStorage.getItem('erp_process_qc_records');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return initialProcessQCRecords;
};

export const saveStoredProcessQCRecords = (qc) => {
  try {
    localStorage.setItem('erp_process_qc_records', JSON.stringify(qc));
  } catch (e) {}
};
