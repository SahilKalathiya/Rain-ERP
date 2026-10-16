import React, { useState, useMemo, useEffect } from 'react';

/**
 * Default accessory suppliers for PO generation if not already in vendor master
 */
export const DEFAULT_ACCESSORY_VENDORS = [
  { id: 'VEND-ACC-01', name: 'Shree Mahavir Trims & Buttons', type: 'Accessories Supplier', city: 'Surat', phone: '9825112233' },
  { id: 'VEND-ACC-02', name: 'Rajesh Lace & Trimmings', type: 'Accessories Supplier', city: 'Surat', phone: '9825223344' },
  { id: 'VEND-ACC-03', name: 'Vardhman Yarns & Threads Ltd', type: 'Thread Supplier', city: 'Ludhiana', phone: '9814033445' },
  { id: 'VEND-ACC-04', name: 'Surat Fancy Tassels & Latkan', type: 'Accessories Supplier', city: 'Surat', phone: '9879044556' },
  { id: 'VEND-ACC-05', name: 'Royal Elastic & Narrow Fabrics', type: 'Accessories Supplier', city: 'Ahmedabad', phone: '9898055667' },
  { id: 'VEND-ACC-06', name: 'Pooja Beads & Sequins Emporium', type: 'Accessories Supplier', city: 'Jaipur', phone: '9829066778' },
  { id: 'VEND-ACC-07', name: 'Apex Dori & Cording Works', type: 'Accessories Supplier', city: 'Surat', phone: '9824077889' }
];

/**
 * 7 Distinct Accessory Categories Metadata matching live ERP & user screenshot
 */
export const ACCESSORY_PO_CATEGORIES = {
  BUTTON: {
    key: 'BUTTON',
    title: 'Generate Button PO',
    buttonText: 'Button PO',
    categoryName: 'Buttons',
    defaultUnit: 'PCS',
    icon: 'ti ti-circle-dot',
    bgClass: 'bg-indigo-600',
    hoverClass: 'hover:bg-indigo-700',
    shadowColor: 'rgba(79, 70, 229, 0.35)',
    primaryColor: '#4f46e5',
    tagColor: '#6366f1'
  },
  LACE: {
    key: 'LACE',
    title: 'Generate Lace PO',
    buttonText: 'Lace PO',
    categoryName: 'Lace',
    defaultUnit: 'METER',
    icon: 'ti ti-cut',
    bgClass: 'bg-purple-600',
    hoverClass: 'hover:bg-purple-700',
    shadowColor: 'rgba(147, 51, 234, 0.35)',
    primaryColor: '#9333ea',
    tagColor: '#a855f7'
  },
  TASSEL: {
    key: 'TASSEL',
    title: 'Generate Tassel PO',
    buttonText: 'Tassel PO',
    categoryName: 'Tassels',
    defaultUnit: 'PIECE',
    icon: 'ti ti-archive',
    bgClass: 'bg-amber-600',
    hoverClass: 'hover:bg-amber-700',
    shadowColor: 'rgba(217, 119, 6, 0.35)',
    primaryColor: '#d97706',
    tagColor: '#f59e0b'
  },
  THREAD: {
    key: 'THREAD',
    title: 'Generate Thread PO',
    buttonText: 'Thread PO',
    categoryName: 'Thread',
    defaultUnit: 'BOX',
    icon: 'ti ti-needle-thread',
    bgClass: 'bg-rose-600',
    hoverClass: 'hover:bg-rose-700',
    shadowColor: 'rgba(225, 29, 72, 0.35)',
    primaryColor: '#e11d48',
    tagColor: '#f43f5e'
  },
  DORI: {
    key: 'DORI',
    title: 'Generate Dori PO',
    buttonText: 'Dori PO',
    categoryName: 'Dori',
    defaultUnit: 'METER',
    icon: 'ti ti-wave-sine',
    bgClass: 'bg-teal-600',
    hoverClass: 'hover:bg-teal-700',
    shadowColor: 'rgba(13, 148, 136, 0.35)',
    primaryColor: '#0d9488',
    tagColor: '#14b8a6'
  },
  ELASTIC: {
    key: 'ELASTIC',
    title: 'Generate Elastic PO',
    buttonText: 'Elastic PO',
    categoryName: 'Elastic',
    defaultUnit: 'METER',
    icon: 'ti ti-arrows-horizontal',
    bgClass: 'bg-cyan-600',
    hoverClass: 'hover:bg-cyan-700',
    shadowColor: 'rgba(8, 145, 178, 0.35)',
    primaryColor: '#0891b2',
    tagColor: '#06b6d4'
  },
  BEADS_SEQUINS: {
    key: 'BEADS_SEQUINS',
    title: 'Generate Beads/Sequins PO',
    buttonText: 'Beads/Sequins PO',
    categoryName: 'Beads & Sequins',
    defaultUnit: 'GRAM',
    icon: 'ti ti-sparkles',
    bgClass: 'bg-pink-600',
    hoverClass: 'hover:bg-pink-700',
    shadowColor: 'rgba(219, 39, 119, 0.35)',
    primaryColor: '#db2777',
    tagColor: '#ec4899'
  }
};

/**
 * Calculation helpers matching live ERP formulas
 */
export function calcShrinkagePO(reqPerPc, garments, shrinkagePct, bufferQty, extraQty, rate) {
  const totalDyed = reqPerPc * garments;
  const totalGreige = totalDyed * (1 + (shrinkagePct || 0) / 100) + (bufferQty || 0);
  const totalPOQty = totalGreige + (parseFloat(extraQty) || 0);
  return {
    totalDyed,
    totalGreige,
    totalRequired: totalDyed,
    totalPOQty,
    totalFabric: 0,
    totalValue: totalPOQty * (parseFloat(rate) || 0)
  };
}

export function calcRegularPO(reqPerPc, extraPerPacking, garments, extraQty, rate) {
  const totalReq = (reqPerPc + (extraPerPacking || 0)) * garments;
  const totalPOQty = totalReq + (parseFloat(extraQty) || 0);
  return {
    totalDyed: 0,
    totalGreige: 0,
    totalRequired: totalReq,
    totalPOQty,
    totalFabric: 0,
    totalValue: totalPOQty * (parseFloat(rate) || 0)
  };
}

export function calcBeadsPO(consumptionPer100, garments, extraQty, rate) {
  const totalReq = (consumptionPer100 / 100) * garments;
  const totalPOQty = totalReq + (parseFloat(extraQty) || 0);
  return {
    totalDyed: 0,
    totalGreige: 0,
    totalRequired: totalReq,
    totalPOQty,
    totalFabric: 0,
    totalValue: totalPOQty * (parseFloat(rate) || 0)
  };
}

export function calcDoriPO(reqPerPc, extraPerPacking, bufferQty, fabricPerUnit, garments, extraQty, rate) {
  const totalReq = (reqPerPc + (extraPerPacking || 0)) * garments + (bufferQty || 0);
  const totalPOQty = totalReq + (parseFloat(extraQty) || 0);
  const totalFabric = totalPOQty * (fabricPerUnit || 0);
  return {
    totalDyed: 0,
    totalGreige: 0,
    totalRequired: totalReq,
    totalPOQty,
    totalFabric,
    totalValue: totalPOQty * (parseFloat(rate) || 0)
  };
}

export function calcTasselPO(tasselsPerPc, garments, extraQty, rate) {
  const totalRequired = tasselsPerPc * garments;
  const totalPOQty = totalRequired + (parseFloat(extraQty) || 0);
  return {
    totalRequired,
    totalPOQty,
    totalValue: totalPOQty * (parseFloat(rate) || 0)
  };
}

export function calcThreadPO(metersPerPc, garments, boxSize, extraBoxes, rate) {
  const totalMeters = metersPerPc * garments;
  const boxesReq = boxSize > 0 ? Math.ceil(totalMeters / boxSize) : 0;
  const totalBoxes = boxesReq + (parseFloat(extraBoxes) || 0);
  return {
    totalMeters,
    boxesRequired: boxesReq,
    totalBoxes,
    totalPOQty: totalBoxes,
    totalValue: totalBoxes * (parseFloat(rate) || 0)
  };
}

/**
 * 1. Generic Accessory PO Modal:
 * For BUTTON, LACE, DORI, ELASTIC, BEADS_SEQUINS
 */
export function GenericAccessoryPOModal({
  isOpen,
  onClose,
  order,
  categoryKey,
  vendors = [],
  addedAccessories = [],
  allocatedGarments = {},
  onSavePO
}) {
  const config = ACCESSORY_PO_CATEGORIES[categoryKey] || ACCESSORY_PO_CATEGORIES.BUTTON;
  const isLaceOrElastic = categoryKey === 'LACE' || categoryKey === 'ELASTIC';
  const isBeads = categoryKey === 'BEADS_SEQUINS';
  const isDori = categoryKey === 'DORI';

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [combineArticles, setCombineArticles] = useState(false);
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [expandedAccs, setExpandedAccs] = useState(new Set());

  // Merge supplied vendors with fallback accessory vendors
  const allVendors = useMemo(() => {
    const list = [...vendors];
    DEFAULT_ACCESSORY_VENDORS.forEach(v => {
      if (!list.some(x => x.id === v.id || x.name.toLowerCase() === v.name.toLowerCase())) {
        list.push(v);
      }
    });
    return list;
  }, [vendors]);

  // Extract order articles
  const orderArticles = useMemo(() => {
    if (Array.isArray(order?.articles) && order.articles.length > 0) {
      return order.articles.map((a, idx) => ({
        id: a.id || `ART-${idx + 1}`,
        name: a.name || a.articleName || 'Kurta',
        totalQuantity: parseInt(a.totalPieces || a.totalQuantity || order?.totalGarments || 100, 10)
      }));
    }
    return [
      { id: 'ART-1', name: 'Kurta', totalQuantity: parseInt(order?.totalGarments || 100, 10) }
    ];
  }, [order]);

  // Filter accessories matching this category
  const matchingBOM = useMemo(() => {
    const targetCat = config.categoryName.toLowerCase();
    const list = (addedAccessories || []).filter(item => {
      const itemCat = (item.category || '').toLowerCase();
      if (categoryKey === 'BUTTON' && (itemCat.includes('button') || itemCat === 'buttons')) return true;
      if (categoryKey === 'LACE' && itemCat.includes('lace')) return true;
      if (categoryKey === 'TASSEL' && itemCat.includes('tassel')) return true;
      if (categoryKey === 'THREAD' && itemCat.includes('thread')) return true;
      if (categoryKey === 'DORI' && itemCat.includes('dori')) return true;
      if (categoryKey === 'ELASTIC' && itemCat.includes('elastic')) return true;
      if (categoryKey === 'BEADS_SEQUINS' && (itemCat.includes('bead') || itemCat.includes('sequin'))) return true;
      return itemCat === targetCat;
    });

    // If order has no matching BOM items yet, generate a sample item from master so modal is functional & testable
    if (list.length === 0 && isOpen) {
      if (categoryKey === 'BUTTON') {
        return [{
          id: 'acc_btn_default',
          category: 'Buttons',
          varietyName: 'Coconut',
          unit: 'PCS',
          article: orderArticles[0]?.name || 'Kurta',
          reqPerPc: 5,
          extraPerPack: 0,
          rate: 5.00
        }];
      } else if (categoryKey === 'LACE') {
        return [{
          id: 'acc_lace_default',
          category: 'Lace',
          varietyName: 'Cotton Lace',
          unit: 'METER',
          article: orderArticles[0]?.name || 'Kurta',
          reqPerPc: 1.5,
          shrinkagePct: 3.5,
          bufferQty: 2,
          rate: 18.00
        }];
      } else if (categoryKey === 'DORI') {
        return [{
          id: 'acc_dori_default',
          category: 'Dori',
          varietyName: 'Cotton Twisted Dori',
          unit: 'METER',
          article: orderArticles[0]?.name || 'Kurta',
          reqPerPc: 1.2,
          extraPerPack: 0,
          bufferQty: 5,
          fabricPerUnit: 0.1,
          rate: 4.50
        }];
      } else if (categoryKey === 'ELASTIC') {
        return [{
          id: 'acc_elastic_default',
          category: 'Elastic',
          varietyName: '1.25 inch Woven Elastic',
          unit: 'METER',
          article: orderArticles[0]?.name || 'Kurta',
          reqPerPc: 0.85,
          shrinkagePct: 2.0,
          bufferQty: 5,
          rate: 12.00
        }];
      } else if (categoryKey === 'BEADS_SEQUINS') {
        return [{
          id: 'acc_beads_default',
          category: 'Beads & Sequins',
          varietyName: 'Golden Micro Sequins',
          unit: 'GRAM',
          article: orderArticles[0]?.name || 'Kurta',
          consumptionPer100: 50,
          rate: 1.50
        }];
      }
    }
    return list;
  }, [addedAccessories, categoryKey, config, isOpen, orderArticles]);

  // Initialize modal rows whenever modal opens or BOM changes
  useEffect(() => {
    if (!isOpen) return;

    setAlertMsg(null);
    setIsSubmitting(false);

    const rows = [];
    matchingBOM.forEach((acc, aIdx) => {
      const accId = acc.id || `acc_${categoryKey}_${aIdx}`;
      const accName = acc.varietyName || acc.name || config.categoryName;
      const accUnit = acc.unit || config.defaultUnit;

      orderArticles.forEach((art) => {
        const key = `${accId}__${art.id}`;
        const alreadyAllocated = allocatedGarments[key] || 0;
        const maxGarments = Math.max(0, art.totalQuantity - alreadyAllocated);

        const reqPerPc = parseFloat(acc.reqPerPc || acc.reqPerPiece || (categoryKey === 'BUTTON' ? 5 : 1)) || 0;
        const extraPerPack = parseFloat(acc.extraPerPack || acc.extraPerPacking || 0) || 0;
        const bufferQty = parseFloat(acc.bufferQty || acc.bufferPct || 0) || 0;
        const shrinkagePct = parseFloat(acc.shrinkagePct || 0) || 0;
        const consumptionPer100 = parseFloat(acc.consumptionPer100 || 50) || 0;
        const fabricPerUnit = parseFloat(acc.fabricPerUnit || 0) || 0;
        const defaultRate = acc.rate ? String(acc.rate) : (categoryKey === 'BUTTON' ? '5.00' : '15.00');

        let calcs;
        if (isLaceOrElastic) {
          calcs = calcShrinkagePO(reqPerPc, maxGarments, shrinkagePct, bufferQty, 0, parseFloat(defaultRate) || 0);
        } else if (isBeads) {
          calcs = calcBeadsPO(consumptionPer100, maxGarments, 0, parseFloat(defaultRate) || 0);
        } else if (isDori) {
          calcs = calcDoriPO(reqPerPc, extraPerPack, bufferQty, fabricPerUnit, maxGarments, 0, parseFloat(defaultRate) || 0);
        } else {
          calcs = calcRegularPO(reqPerPc, extraPerPack, maxGarments, 0, parseFloat(defaultRate) || 0);
        }

        rows.push({
          accessoryId: accId,
          accessoryName: accName,
          accessoryUnit: accUnit,
          colour: acc.accessoryColor || acc.color || 'Natural',
          orderArticleId: art.id,
          articleName: art.name,
          maxGarments,
          noOfGarments: String(maxGarments),
          reqPerPc,
          extraPerPacking: extraPerPack,
          bufferQty,
          shrinkagePct,
          consumptionPer100,
          fabricPerUnit,
          ...calcs,
          extraQty: '',
          rate: defaultRate
        });
      });
    });

    setItems(rows);
    if (matchingBOM.length > 0) {
      setExpandedAccs(new Set(matchingBOM.map((a, i) => a.id || `acc_${categoryKey}_${i}`)));
    }
  }, [isOpen, matchingBOM, orderArticles, allocatedGarments, categoryKey, config, isLaceOrElastic, isBeads, isDori]);

  // Handle cell edits
  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx] };

      if (field === 'noOfGarments') {
        const parsed = parseInt(value, 10);
        item.noOfGarments = isNaN(parsed) ? value : String(Math.min(item.maxGarments, Math.max(0, parsed)));
      } else if (field === 'extraQty' || field === 'rate') {
        item[field] = value;
      }

      const garments = parseInt(item.noOfGarments, 10) || 0;
      const extra = parseFloat(item.extraQty) || 0;
      const rateVal = parseFloat(item.rate) || 0;

      let newCalcs;
      if (isLaceOrElastic) {
        newCalcs = calcShrinkagePO(item.reqPerPc, garments, item.shrinkagePct, item.bufferQty, extra, rateVal);
      } else if (isBeads) {
        newCalcs = calcBeadsPO(item.consumptionPer100, garments, extra, rateVal);
      } else if (isDori) {
        newCalcs = calcDoriPO(item.reqPerPc, item.extraPerPacking, item.bufferQty, item.fabricPerUnit, garments, extra, rateVal);
      } else {
        newCalcs = calcRegularPO(item.reqPerPc, item.extraPerPacking, garments, extra, rateVal);
      }

      copy[idx] = { ...item, ...newCalcs };
      return copy;
    });
  };

  // Group items by accessory for table display
  const groupedData = useMemo(() => {
    const map = new Map();
    items.forEach((row, idx) => {
      if (!map.has(row.accessoryId)) {
        map.set(row.accessoryId, {
          accessoryId: row.accessoryId,
          accessoryName: row.accessoryName,
          accessoryUnit: row.accessoryUnit,
          rows: []
        });
      }
      map.get(row.accessoryId).rows.push({ row, idx });
    });

    if (combineArticles) {
      // Return combined representation
      const combined = [];
      map.forEach(group => {
        const totalPOQty = group.rows.reduce((sum, r) => sum + (r.row.totalPOQty || 0), 0);
        const totalValue = group.rows.reduce((sum, r) => sum + (r.row.totalValue || 0), 0);
        const totalGarments = group.rows.reduce((sum, r) => sum + (parseInt(r.row.noOfGarments, 10) || 0), 0);
        const maxGarments = group.rows.reduce((sum, r) => sum + (r.row.maxGarments || 0), 0);

        combined.push({
          ...group,
          totalPOQty,
          totalValue,
          isCombined: true,
          combinedRow: {
            ...group.rows[0].row,
            articleName: 'All Articles Combined',
            noOfGarments: String(totalGarments),
            maxGarments,
            totalPOQty,
            totalValue
          }
        });
      });
      return combined;
    }

    return Array.from(map.values()).map(group => {
      const totalPOQty = group.rows.reduce((sum, r) => sum + (r.row.totalPOQty || 0), 0);
      const totalValue = group.rows.reduce((sum, r) => sum + (r.row.totalValue || 0), 0);
      return { ...group, totalPOQty, totalValue };
    });
  }, [items, combineArticles]);

  // Overall totals
  const totalPOQty = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.totalPOQty || 0), 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  }, [items]);

  // Submit & create Purchase Order
  const handleCreatePO = () => {
    if (!selectedVendorId) {
      setAlertMsg({ type: 'error', text: 'Please select a vendor' });
      return;
    }

    const validItems = items.filter(it => it.totalPOQty > 0);
    if (validItems.length === 0) {
      setAlertMsg({ type: 'error', text: 'No valid items (need quantity > 0)' });
      return;
    }

    setIsSubmitting(true);
    setAlertMsg(null);

    const vendor = allVendors.find(v => v.id === selectedVendorId) || { id: selectedVendorId, name: 'Vendor' };
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const poPrefix = categoryKey.slice(0, 3);
    const poNumber = `PO-${poPrefix}-${order?.orderNumber || order?.id || '2610'}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const newPO = {
      id: `PO-${Date.now()}`,
      po_number: poNumber,
      poNumber: poNumber,
      order_id: order?.id,
      orderId: order?.id,
      order_number: order?.orderNumber || order?.id,
      orderNumber: order?.orderNumber || order?.id,
      style_name: order?.styleName || '',
      styleName: order?.styleName || '',
      po_type: `${config.buttonText}`,
      po_type_display: `${config.buttonText}`,
      poType: `${config.buttonText}`,
      category: categoryKey,
      vendor_id: vendor.id,
      vendorId: vendor.id,
      vendor_name: vendor.name,
      vendorName: vendor.name,
      po_date: dateFormatted,
      date: dateFormatted,
      status: 'DRAFT',
      status_display: 'DRAFT',
      total_amount: grandTotal,
      totalAmount: grandTotal,
      totalQuantity: totalPOQty,
      items: validItems.map(it => ({
        accessory_id: it.accessoryId,
        accessory_name: it.accessoryName,
        order_article_id: it.orderArticleId,
        article_name: it.articleName,
        no_of_garments: parseInt(it.noOfGarments, 10) || 0,
        extra_qty: parseFloat(it.extraQty) || 0,
        total_qty: it.totalPOQty,
        rate: parseFloat(it.rate) || 0,
        total_value: it.totalValue,
        colour: it.colour
      }))
    };

    setTimeout(() => {
      if (onSavePO) {
        onSavePO(newPO);
      }
      setAlertMsg({ type: 'success', text: `Purchase Order ${poNumber} created successfully!` });
      setIsSubmitting(false);
      setTimeout(() => {
        onClose();
      }, 900);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden transition-all"
        style={{
          width: '100%',
          maxWidth: '1100px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc'
          }}
        >
          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: config.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <i className="ti ti-shopping-cart" style={{ fontSize: '20px' }}></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {config.title}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5" style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                {order?.orderNumber || order?.id || 'RD-2610'} &mdash; {order?.styleName || 'Style Order'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="p-6 space-y-5 overflow-y-auto"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Alert Message */}
          {alertMsg && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                alertMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                marginBottom: '16px'
              }}
            >
              <i className={alertMsg.type === 'success' ? 'ti ti-circle-check text-base' : 'ti ti-alert-circle text-base'}></i>
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* Top Controls: Vendor Selection & Combine Articles */}
          <div
            className="flex items-center gap-4 flex-wrap"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <div className="flex-1 min-w-[280px]" style={{ flex: 1, minWidth: '280px' }}>
              <label className="block text-xs font-semibold text-gray-700 mb-1" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Vendor *
              </label>
              <select
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-xs outline-none"
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  fontSize: '13.5px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#1e293b'
                }}
              >
                <option value="">Select vendor...</option>
                {allVendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.city ? `(${v.city})` : ''} &mdash; {v.type || 'Supplier'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setCombineArticles(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                combineArticles
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '10px',
                border: combineArticles ? '1.5px solid #c7d2fe' : '1.5px solid #cbd5e1',
                backgroundColor: combineArticles ? '#eef2ff' : '#ffffff',
                color: combineArticles ? '#4338ca' : '#475569',
                cursor: 'pointer',
                marginTop: '18px'
              }}
            >
              <i className={combineArticles ? 'ti ti-eye text-base' : 'ti ti-eye-off text-base'}></i>
              <span>Combine all articles</span>
            </button>
          </div>

          {/* Items Accordion / Table */}
          {groupedData.length === 0 ? (
            <div
              className="py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200"
              style={{
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '2px dashed #e2e8f0'
              }}
            >
              <i className="ti ti-shopping-cart text-gray-300" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }}></i>
              <p className="text-gray-500 font-medium text-sm" style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                No {config.categoryName.toLowerCase()} items found in BOM for this order
              </p>
            </div>
          ) : (
            <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {groupedData.map((group) => {
                const isExpanded = expandedAccs.has(group.accessoryId);
                return (
                  <div
                    key={group.accessoryId}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs"
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {/* Accessory Accordion Header */}
                    <div
                      onClick={() => {
                        setExpandedAccs(prev => {
                          const next = new Set(prev);
                          if (next.has(group.accessoryId)) next.delete(group.accessoryId);
                          else next.add(group.accessoryId);
                          return next;
                        });
                      }}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50/70 cursor-pointer hover:bg-gray-100/70 transition-colors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer',
                        borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                      }}
                    >
                      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`ti ${isExpanded ? 'ti-chevron-down' : 'ti-chevron-right'} text-gray-400`} style={{ fontSize: '15px' }}></i>
                        <span className="font-semibold text-gray-800 text-sm" style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                          {group.accessoryName}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold"
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca'
                          }}
                        >
                          {group.accessoryUnit}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-medium" style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: '#64748b' }}>
                        <span>Qty: <strong style={{ color: '#0f172a' }}>{group.totalPOQty.toFixed(1)}</strong></span>
                        <span>Value: <strong style={{ color: '#4338ca' }}>{group.totalValue.toFixed(2)}</strong></span>
                      </div>
                    </div>

                    {/* Table of Articles */}
                    {isExpanded && (
                      <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                        <table className="w-full text-sm" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr
                              className="bg-gray-50/50 border-b border-gray-200"
                              style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
                            >
                              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                                Article
                              </th>
                              <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                                No. of Garments
                              </th>

                              {/* Lace & Elastic Specific Columns */}
                              {isLaceOrElastic && (
                                <>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Dyed/Pc</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total Dyed</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Shrinkage%</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Buffer</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total Greige</th>
                                </>
                              )}

                              {/* Beads & Sequins Columns */}
                              {isBeads && (
                                <>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>g/100pc</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>g/pc</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total g</th>
                                </>
                              )}

                              {/* Dori Columns */}
                              {isDori && (
                                <>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Req/Pc (m)</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Extra/Pack</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Buffer</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total Dori</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Fabric/m</th>
                                </>
                              )}

                              {/* Standard Columns (Button etc) */}
                              {!isLaceOrElastic && !isBeads && !isDori && (
                                <>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Req/Pc</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Extra/Pack</th>
                                  <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total Req</th>
                                </>
                              )}

                              <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                                Extra Qty
                              </th>
                              <th
                                className="text-center px-3 py-2.5 font-semibold text-indigo-700 bg-indigo-50/70 text-xs"
                                style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#4338ca', backgroundColor: '#eef2ff' }}
                              >
                                Total PO Qty
                              </th>

                              {isDori && (
                                <th className="text-center px-3 py-2.5 font-semibold text-purple-700 bg-purple-50/70 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#7e22ce', backgroundColor: '#faf5ff' }}>
                                  Total Fabric (m)
                                </th>
                              )}

                              <th className="text-center px-3 py-2.5 font-semibold text-gray-600 text-xs" style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                                Rate
                              </th>
                              <th
                                className="text-center px-3 py-2.5 font-semibold text-indigo-700 bg-indigo-50/70 text-xs"
                                style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#4338ca', backgroundColor: '#eef2ff' }}
                              >
                                Total Value
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(group.isCombined ? [group.combinedRow] : group.rows.map(r => ({ ...r.row, originIdx: r.idx }))).map((row, rIdx) => {
                              const editIdx = group.isCombined ? group.rows[0].idx : row.originIdx;
                              return (
                                <tr
                                  key={rIdx}
                                  className="border-b border-gray-100 hover:bg-gray-50/50"
                                  style={{ borderBottom: '1px solid #f1f5f9' }}
                                >
                                  <td className="px-3 py-2.5 font-medium text-gray-900" style={{ padding: '10px 14px', color: '#1e293b' }}>
                                    {row.articleName}
                                  </td>
                                  <td className="px-3 py-2.5 text-center min-w-[110px]" style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={group.isCombined}
                                      value={row.noOfGarments}
                                      onChange={e => handleItemChange(editIdx, 'noOfGarments', e.target.value)}
                                      className="w-20 px-2 py-1 text-center font-medium text-sm border border-amber-300 rounded-lg bg-amber-50/40 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      style={{
                                        width: '80px',
                                        padding: '4px 8px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        border: '1.5px solid #fcd34d',
                                        borderRadius: '8px',
                                        backgroundColor: '#fffbeb',
                                        outline: 'none'
                                      }}
                                    />
                                    <div className="text-[10px] text-gray-400 mt-0.5" style={{ fontSize: '10px', color: '#94a3b8' }}>
                                      max {row.maxGarments}
                                    </div>
                                  </td>

                                  {/* Lace/Elastic Values */}
                                  {isLaceOrElastic && (
                                    <>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.reqPerPc}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.totalDyed?.toFixed(1)}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.shrinkagePct}%</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.bufferQty}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-800 font-medium" style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.totalGreige?.toFixed(1)}</td>
                                    </>
                                  )}

                                  {/* Beads Values */}
                                  {isBeads && (
                                    <>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.consumptionPer100}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{(row.consumptionPer100 / 100).toFixed(2)}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-800 font-medium" style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.totalRequired?.toFixed(1)}</td>
                                    </>
                                  )}

                                  {/* Dori Values */}
                                  {isDori && (
                                    <>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.reqPerPc}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.extraPerPacking}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.bufferQty}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-800 font-medium" style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.totalRequired?.toFixed(1)}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.fabricPerUnit}</td>
                                    </>
                                  )}

                                  {/* Button Regular Values */}
                                  {!isLaceOrElastic && !isBeads && !isDori && (
                                    <>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.reqPerPc}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-600" style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.extraPerPacking}</td>
                                      <td className="px-3 py-2.5 text-center text-gray-800 font-medium" style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.totalRequired?.toFixed(1)}</td>
                                    </>
                                  )}

                                  {/* Extra Qty Input (with yellow border matching screenshot) */}
                                  <td className="px-3 py-2.5 text-center" style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      disabled={group.isCombined}
                                      value={row.extraQty}
                                      placeholder="0"
                                      onChange={e => handleItemChange(editIdx, 'extraQty', e.target.value)}
                                      className="w-20 px-2 py-1 text-center font-medium text-sm border border-amber-300 rounded-lg bg-amber-50/40 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      style={{
                                        width: '80px',
                                        padding: '4px 8px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        border: '1.5px solid #fcd34d',
                                        borderRadius: '8px',
                                        backgroundColor: '#fffbeb',
                                        outline: 'none'
                                      }}
                                    />
                                  </td>

                                  {/* Total PO Qty (Highlighted blue cell) */}
                                  <td
                                    className="px-3 py-2.5 text-center font-bold text-indigo-700 bg-indigo-50/50"
                                    style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#4338ca', backgroundColor: '#eef2ff' }}
                                  >
                                    {row.totalPOQty?.toFixed(1)}
                                  </td>

                                  {/* Dori Fabric Result */}
                                  {isDori && (
                                    <td className="px-3 py-2.5 text-center font-semibold text-purple-700 bg-purple-50/50" style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#7e22ce', backgroundColor: '#faf5ff' }}>
                                      {row.totalFabric?.toFixed(1)}
                                    </td>
                                  )}

                                  {/* Rate Input (with yellow border matching screenshot) */}
                                  <td className="px-3 py-2.5 text-center" style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={row.rate}
                                      onChange={e => handleItemChange(editIdx, 'rate', e.target.value)}
                                      className="w-20 px-2 py-1 text-center font-medium text-sm border border-amber-300 rounded-lg bg-amber-50/40 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      style={{
                                        width: '80px',
                                        padding: '4px 8px',
                                        textAlign: 'center',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        border: '1.5px solid #fcd34d',
                                        borderRadius: '8px',
                                        backgroundColor: '#fffbeb',
                                        outline: 'none'
                                      }}
                                    />
                                  </td>

                                  {/* Total Value (Highlighted blue cell) */}
                                  <td
                                    className="px-3 py-2.5 text-center font-bold text-indigo-700 bg-indigo-50/50"
                                    style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#4338ca', backgroundColor: '#eef2ff' }}
                                  >
                                    {row.totalValue?.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/70"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc'
          }}
        >
          <div className="flex items-center gap-6 text-sm" style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13.5px' }}>
            <span className="text-gray-500" style={{ color: '#64748b' }}>
              Total PO Qty: <strong className="text-gray-900" style={{ color: '#0f172a', fontWeight: 700 }}>{totalPOQty.toFixed(1)}</strong>
            </span>
            <span className="text-gray-500" style={{ color: '#64748b' }}>
              Grand Total: <strong className="text-indigo-600 text-base" style={{ color: '#4338ca', fontWeight: 700, fontSize: '16px' }}>₹{grandTotal.toFixed(2)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
              style={{
                padding: '8px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePO}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-sm transition-all"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                backgroundColor: config.primaryColor,
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: `0 4px 12px ${config.shadowColor}`
              }}
            >
              <i className={isSubmitting ? 'ti ti-loader animate-spin' : 'ti ti-shopping-cart'} style={{ fontSize: '16px' }}></i>
              <span>{isSubmitting ? 'Creating PO...' : 'Create PO'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Tassel PO Modal:
 * Supports Ready-Made vs Handmade Jobwork tabs
 */
export function TasselPOModal({
  isOpen,
  onClose,
  order,
  vendors = [],
  addedAccessories = [],
  allocatedGarments = {},
  onSavePO
}) {
  const config = ACCESSORY_PO_CATEGORIES.TASSEL;
  const [procurementType, setProcurementType] = useState('READY_MADE'); // 'READY_MADE' or 'HANDMADE_JOBWORK'
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [combineArticles, setCombineArticles] = useState(false);
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [expandedAccs, setExpandedAccs] = useState(new Set());

  const allVendors = useMemo(() => {
    const list = [...vendors];
    DEFAULT_ACCESSORY_VENDORS.forEach(v => {
      if (!list.some(x => x.id === v.id || x.name.toLowerCase() === v.name.toLowerCase())) {
        list.push(v);
      }
    });
    return list;
  }, [vendors]);

  const orderArticles = useMemo(() => {
    if (Array.isArray(order?.articles) && order.articles.length > 0) {
      return order.articles.map((a, idx) => ({
        id: a.id || `ART-${idx + 1}`,
        name: a.name || a.articleName || 'Kurta',
        totalQuantity: parseInt(a.totalPieces || a.totalQuantity || order?.totalGarments || 100, 10)
      }));
    }
    return [
      { id: 'ART-1', name: 'Kurta', totalQuantity: parseInt(order?.totalGarments || 100, 10) }
    ];
  }, [order]);

  const matchingBOM = useMemo(() => {
    const list = (addedAccessories || []).filter(item => {
      const itemCat = (item.category || '').toLowerCase();
      return itemCat.includes('tassel');
    });

    if (list.length === 0 && isOpen) {
      return [{
        id: 'acc_tassel_default',
        category: 'Tassels',
        varietyName: 'Silk Latkan Tassel',
        unit: 'PIECE',
        article: orderArticles[0]?.name || 'Kurta',
        reqPerPc: 2,
        rate: 25.00
      }];
    }
    return list;
  }, [addedAccessories, isOpen, orderArticles]);

  useEffect(() => {
    if (!isOpen) return;
    setAlertMsg(null);
    setIsSubmitting(false);

    const rows = [];
    matchingBOM.forEach((acc, aIdx) => {
      const accId = acc.id || `acc_tassel_${aIdx}`;
      const accName = acc.varietyName || acc.name || 'Tassels';
      const accUnit = acc.unit || 'PIECE';

      orderArticles.forEach((art) => {
        const key = `${accId}__${art.id}`;
        const alreadyAllocated = allocatedGarments[key] || 0;
        const maxGarments = Math.max(0, art.totalQuantity - alreadyAllocated);
        const tasselsPerPc = parseFloat(acc.reqPerPc || acc.tasselsPerPc || 2) || 1;
        const defaultRate = acc.rate ? String(acc.rate) : '25.00';
        const calcs = calcTasselPO(tasselsPerPc, maxGarments, 0, parseFloat(defaultRate) || 0);

        rows.push({
          accessoryId: accId,
          accessoryName: accName,
          accessoryUnit: accUnit,
          colour: acc.accessoryColor || acc.color || 'Multi-Color',
          orderArticleId: art.id,
          articleName: art.name,
          maxGarments,
          noOfGarments: String(maxGarments),
          tasselsPerPc,
          ...calcs,
          extraQty: '',
          rate: defaultRate
        });
      });
    });

    setItems(rows);
    if (matchingBOM.length > 0) {
      setExpandedAccs(new Set(matchingBOM.map((a, i) => a.id || `acc_tassel_${i}`)));
    }
  }, [isOpen, matchingBOM, orderArticles, allocatedGarments]);

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx] };

      if (field === 'noOfGarments') {
        const parsed = parseInt(value, 10);
        item.noOfGarments = isNaN(parsed) ? value : String(Math.min(item.maxGarments, Math.max(0, parsed)));
      } else if (field === 'extraQty' || field === 'rate') {
        item[field] = value;
      }

      const garments = parseInt(item.noOfGarments, 10) || 0;
      const extra = parseFloat(item.extraQty) || 0;
      const rateVal = parseFloat(item.rate) || 0;
      const newCalcs = calcTasselPO(item.tasselsPerPc, garments, extra, rateVal);

      copy[idx] = { ...item, ...newCalcs };
      return copy;
    });
  };

  const totalPOQty = useMemo(() => items.reduce((sum, item) => sum + (item.totalPOQty || 0), 0), [items]);
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + (item.totalValue || 0), 0), [items]);

  const handleCreatePO = () => {
    if (!selectedVendorId) {
      setAlertMsg({ type: 'error', text: 'Please select a vendor' });
      return;
    }
    const validItems = items.filter(it => it.totalPOQty > 0);
    if (validItems.length === 0) {
      setAlertMsg({ type: 'error', text: 'No valid items (need quantity > 0)' });
      return;
    }

    setIsSubmitting(true);
    setAlertMsg(null);

    const vendor = allVendors.find(v => v.id === selectedVendorId) || { id: selectedVendorId, name: 'Vendor' };
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const poNumber = `PO-TSL-${order?.orderNumber || order?.id || '2610'}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const newPO = {
      id: `PO-${Date.now()}`,
      po_number: poNumber,
      poNumber: poNumber,
      order_id: order?.id,
      orderId: order?.id,
      order_number: order?.orderNumber || order?.id,
      orderNumber: order?.orderNumber || order?.id,
      style_name: order?.styleName || '',
      styleName: order?.styleName || '',
      po_type: `Tassel PO (${procurementType === 'READY_MADE' ? 'Ready Made' : 'Job Work'})`,
      po_type_display: 'Tassel PO',
      poType: 'Tassel PO',
      category: 'TASSEL',
      vendor_id: vendor.id,
      vendorId: vendor.id,
      vendor_name: vendor.name,
      vendorName: vendor.name,
      po_date: dateFormatted,
      date: dateFormatted,
      status: 'DRAFT',
      status_display: 'DRAFT',
      total_amount: grandTotal,
      totalAmount: grandTotal,
      totalQuantity: totalPOQty,
      items: validItems.map(it => ({
        accessory_id: it.accessoryId,
        accessory_name: it.accessoryName,
        order_article_id: it.orderArticleId,
        article_name: it.articleName,
        no_of_garments: parseInt(it.noOfGarments, 10) || 0,
        extra_qty: parseFloat(it.extraQty) || 0,
        total_qty: it.totalPOQty,
        rate: parseFloat(it.rate) || 0,
        total_value: it.totalValue,
        colour: it.colour
      }))
    };

    setTimeout(() => {
      if (onSavePO) onSavePO(newPO);
      setAlertMsg({ type: 'success', text: `Tassel Purchase Order ${poNumber} created successfully!` });
      setIsSubmitting(false);
      setTimeout(() => onClose(), 900);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '1100px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc'
          }}
        >
          <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: config.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <i className="ti ti-shopping-cart" style={{ fontSize: '20px' }}></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {config.title}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5" style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                {order?.orderNumber || order?.id || 'RD-2610'} &mdash; {order?.styleName || 'Style Order'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Procurement Type Toggle Tabs */}
        <div
          className="px-6 pt-4 border-b border-gray-100 flex gap-2"
          style={{
            padding: '16px 24px 0',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px'
          }}
        >
          <button
            type="button"
            onClick={() => setProcurementType('READY_MADE')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              procurementType === 'READY_MADE'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            style={{
              padding: '8px 16px',
              fontSize: '13.5px',
              fontWeight: 600,
              border: 'none',
              borderBottom: procurementType === 'READY_MADE' ? '2.5px solid #d97706' : '2.5px solid transparent',
              color: procurementType === 'READY_MADE' ? '#b45309' : '#64748b',
              backgroundColor: procurementType === 'READY_MADE' ? '#fffbeb' : 'transparent',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Ready Made
          </button>
          <button
            type="button"
            onClick={() => setProcurementType('HANDMADE_JOBWORK')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              procurementType === 'HANDMADE_JOBWORK'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            style={{
              padding: '8px 16px',
              fontSize: '13.5px',
              fontWeight: 600,
              border: 'none',
              borderBottom: procurementType === 'HANDMADE_JOBWORK' ? '2.5px solid #d97706' : '2.5px solid transparent',
              color: procurementType === 'HANDMADE_JOBWORK' ? '#b45309' : '#64748b',
              backgroundColor: procurementType === 'HANDMADE_JOBWORK' ? '#fffbeb' : 'transparent',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Handmade Jobwork
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {alertMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                marginBottom: '16px'
              }}
            >
              <i className={alertMsg.type === 'success' ? 'ti ti-circle-check text-base' : 'ti ti-alert-circle text-base'}></i>
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Vendor *
              </label>
              <select
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  fontSize: '13.5px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#1e293b'
                }}
              >
                <option value="">Select vendor...</option>
                {allVendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.city ? `(${v.city})` : ''} &mdash; {v.type || 'Supplier'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>Article</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>No. of Garments</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Tassels/Pc</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total Required</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Extra Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#b45309', backgroundColor: '#fef3c7' }}>Total PO Qty</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Colour</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Rate</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#b45309', backgroundColor: '#fef3c7' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{row.articleName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        value={row.noOfGarments}
                        onChange={e => handleItemChange(idx, 'noOfGarments', e.target.value)}
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: '1.5px solid #fcd34d',
                          borderRadius: '8px',
                          backgroundColor: '#fffbeb',
                          outline: 'none'
                        }}
                      />
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>max {row.maxGarments}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.tasselsPerPc}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.totalRequired}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        placeholder="0"
                        value={row.extraQty}
                        onChange={e => handleItemChange(idx, 'extraQty', e.target.value)}
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: '1.5px solid #fcd34d',
                          borderRadius: '8px',
                          backgroundColor: '#fffbeb',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#b45309', backgroundColor: '#fffbeb' }}>
                      {row.totalPOQty}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.colour}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        value={row.rate}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                        style={{
                          width: '80px',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: '1.5px solid #fcd34d',
                          borderRadius: '8px',
                          backgroundColor: '#fffbeb',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#b45309', backgroundColor: '#fffbeb' }}>
                      {row.totalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13.5px' }}>
            <span style={{ color: '#64748b' }}>
              Total PO Qty: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{totalPOQty}</strong>
            </span>
            <span style={{ color: '#64748b' }}>
              Grand Total: <strong style={{ color: '#b45309', fontWeight: 700, fontSize: '16px' }}>₹{grandTotal.toFixed(2)}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePO}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                backgroundColor: config.primaryColor,
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 12px ${config.shadowColor}`
              }}
            >
              <i className={isSubmitting ? 'ti ti-loader animate-spin' : 'ti ti-shopping-cart'}></i>
              <span>{isSubmitting ? 'Creating PO...' : 'Create Tassel PO'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Thread PO Modal:
 * Supports Box Size (m), Total m, Boxes Req, Brand, Colour #
 */
export function ThreadPOModal({
  isOpen,
  onClose,
  order,
  vendors = [],
  addedAccessories = [],
  allocatedGarments = {},
  onSavePO
}) {
  const config = ACCESSORY_PO_CATEGORIES.THREAD;
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const allVendors = useMemo(() => {
    const list = [...vendors];
    DEFAULT_ACCESSORY_VENDORS.forEach(v => {
      if (!list.some(x => x.id === v.id || x.name.toLowerCase() === v.name.toLowerCase())) {
        list.push(v);
      }
    });
    return list;
  }, [vendors]);

  const orderArticles = useMemo(() => {
    if (Array.isArray(order?.articles) && order.articles.length > 0) {
      return order.articles.map((a, idx) => ({
        id: a.id || `ART-${idx + 1}`,
        name: a.name || a.articleName || 'Kurta',
        totalQuantity: parseInt(a.totalPieces || a.totalQuantity || order?.totalGarments || 100, 10)
      }));
    }
    return [
      { id: 'ART-1', name: 'Kurta', totalQuantity: parseInt(order?.totalGarments || 100, 10) }
    ];
  }, [order]);

  const matchingBOM = useMemo(() => {
    const list = (addedAccessories || []).filter(item => {
      const itemCat = (item.category || '').toLowerCase();
      return itemCat.includes('thread');
    });

    if (list.length === 0 && isOpen) {
      return [{
        id: 'acc_thread_default',
        category: 'Thread',
        varietyName: 'Stitching Thread (Spun Poly)',
        unit: 'BOX',
        article: orderArticles[0]?.name || 'Kurta',
        reqPerPc: 120, // 120m per piece
        rate: 65.00,
        boxSize: 400,
        purpose: 'Main Stitching',
        brand: 'Vardhman',
        colourNumber: 'Matching Base'
      }];
    }
    return list;
  }, [addedAccessories, isOpen, orderArticles]);

  useEffect(() => {
    if (!isOpen) return;
    setAlertMsg(null);
    setIsSubmitting(false);

    const rows = [];
    matchingBOM.forEach((acc, aIdx) => {
      const accId = acc.id || `acc_thread_${aIdx}`;
      const accName = acc.varietyName || acc.name || 'Thread';
      const boxSize = parseFloat(acc.boxSize || 400) || 400;

      orderArticles.forEach((art) => {
        const key = `${accId}__${art.id}`;
        const alreadyAllocated = allocatedGarments[key] || 0;
        const maxGarments = Math.max(0, art.totalQuantity - alreadyAllocated);
        const metersPerPc = parseFloat(acc.reqPerPc || 120) || 120;
        const defaultRate = acc.rate ? String(acc.rate) : '65.00';
        const calcs = calcThreadPO(metersPerPc, maxGarments, boxSize, 0, parseFloat(defaultRate) || 0);

        rows.push({
          accessoryId: accId,
          accessoryName: accName,
          accessoryUnit: 'BOX',
          colour: acc.accessoryColor || acc.color || 'Matching Base',
          colourNumber: acc.colourNumber || 'Matching',
          brand: acc.brand || 'Vardhman',
          purpose: acc.purpose || 'Main Stitching',
          orderArticleId: art.id,
          articleName: art.name,
          maxGarments,
          noOfGarments: String(maxGarments),
          metersPerPc,
          boxSize,
          ...calcs,
          extraBoxes: '',
          rate: defaultRate
        });
      });
    });

    setItems(rows);
  }, [isOpen, matchingBOM, orderArticles, allocatedGarments]);

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx] };

      if (field === 'noOfGarments') {
        const parsed = parseInt(value, 10);
        item.noOfGarments = isNaN(parsed) ? value : String(Math.min(item.maxGarments, Math.max(0, parsed)));
      } else if (field === 'boxSize' || field === 'extraBoxes' || field === 'rate') {
        item[field] = value;
      }

      const garments = parseInt(item.noOfGarments, 10) || 0;
      const bSize = parseFloat(item.boxSize) || 400;
      const extra = parseFloat(item.extraBoxes) || 0;
      const rateVal = parseFloat(item.rate) || 0;
      const newCalcs = calcThreadPO(item.metersPerPc, garments, bSize, extra, rateVal);

      copy[idx] = { ...item, ...newCalcs };
      return copy;
    });
  };

  const totalPOBoxes = useMemo(() => items.reduce((sum, item) => sum + (item.totalBoxes || 0), 0), [items]);
  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + (item.totalValue || 0), 0), [items]);

  const handleCreatePO = () => {
    if (!selectedVendorId) {
      setAlertMsg({ type: 'error', text: 'Please select a vendor' });
      return;
    }
    const validItems = items.filter(it => it.totalBoxes > 0);
    if (validItems.length === 0) {
      setAlertMsg({ type: 'error', text: 'No valid items (need boxes > 0)' });
      return;
    }

    setIsSubmitting(true);
    setAlertMsg(null);

    const vendor = allVendors.find(v => v.id === selectedVendorId) || { id: selectedVendorId, name: 'Vendor' };
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const poNumber = `PO-THD-${order?.orderNumber || order?.id || '2610'}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const newPO = {
      id: `PO-${Date.now()}`,
      po_number: poNumber,
      poNumber: poNumber,
      order_id: order?.id,
      orderId: order?.id,
      order_number: order?.orderNumber || order?.id,
      orderNumber: order?.orderNumber || order?.id,
      style_name: order?.styleName || '',
      styleName: order?.styleName || '',
      po_type: 'Thread PO',
      po_type_display: 'Thread PO',
      poType: 'Thread PO',
      category: 'THREAD',
      vendor_id: vendor.id,
      vendorId: vendor.id,
      vendor_name: vendor.name,
      vendorName: vendor.name,
      po_date: dateFormatted,
      date: dateFormatted,
      status: 'DRAFT',
      status_display: 'DRAFT',
      total_amount: grandTotal,
      totalAmount: grandTotal,
      totalQuantity: totalPOBoxes,
      items: validItems.map(it => ({
        accessory_id: it.accessoryId,
        accessory_name: it.accessoryName,
        order_article_id: it.orderArticleId,
        article_name: it.articleName,
        no_of_garments: parseInt(it.noOfGarments, 10) || 0,
        extra_qty: parseFloat(it.extraBoxes) || 0,
        total_qty: it.totalBoxes,
        rate: parseFloat(it.rate) || 0,
        total_value: it.totalValue,
        colour: it.colourNumber || it.colour
      }))
    };

    setTimeout(() => {
      if (onSavePO) onSavePO(newPO);
      setAlertMsg({ type: 'success', text: `Thread Purchase Order ${poNumber} created successfully!` });
      setIsSubmitting(false);
      setTimeout(() => onClose(), 900);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          width: '100%',
          maxWidth: '1100px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: config.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <i className="ti ti-shopping-cart" style={{ fontSize: '20px' }}></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{config.title}</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                {order?.orderNumber || order?.id || 'RD-2610'} &mdash; {order?.styleName || 'Style Order'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {alertMsg && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                marginBottom: '16px'
              }}
            >
              <i className={alertMsg.type === 'success' ? 'ti ti-circle-check text-base' : 'ti ti-alert-circle text-base'}></i>
              <span>{alertMsg.text}</span>
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Vendor *
              </label>
              <select
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  fontSize: '13.5px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#1e293b'
                }}
              >
                <option value="">Select vendor...</option>
                {allVendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.city ? `(${v.city})` : ''} &mdash; {v.type || 'Supplier'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>Article</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Garments</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>m/Pc</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Total m</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Box Size (m)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Boxes Req</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Extra Boxes</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#e11d48', backgroundColor: '#ffe4e6' }}>Total Boxes</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#475569' }}>Brand / Colour #</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#475569' }}>Rate/Box</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#e11d48', backgroundColor: '#ffe4e6' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>{row.articleName}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        value={row.noOfGarments}
                        onChange={e => handleItemChange(idx, 'noOfGarments', e.target.value)}
                        style={{
                          width: '70px',
                          padding: '4px 6px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: '1.5px solid #fcd34d',
                          borderRadius: '8px',
                          backgroundColor: '#fffbeb',
                          outline: 'none'
                        }}
                      />
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>max {row.maxGarments}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{row.metersPerPc}m</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.totalMeters}m</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        value={row.boxSize}
                        onChange={e => handleItemChange(idx, 'boxSize', e.target.value)}
                        style={{
                          width: '60px',
                          padding: '4px 6px',
                          textAlign: 'center',
                          fontSize: '12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#1e293b', fontWeight: 600 }}>{row.boxesRequired}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        placeholder="0"
                        value={row.extraBoxes}
                        onChange={e => handleItemChange(idx, 'extraBoxes', e.target.value)}
                        style={{
                          width: '60px',
                          padding: '4px 6px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: '1.5px solid #fcd34d',
                          borderRadius: '8px',
                          backgroundColor: '#fffbeb',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#e11d48', backgroundColor: '#fff1f2' }}>
                      {row.totalBoxes}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontSize: '12px' }}>
                      <div>{row.brand}</div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>{row.colourNumber}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input
                        type="text"
                        value={row.rate}
                        onChange={e => handleItemChange(idx, 'rate', e.target.value)}
                        style={{
                          width: '70px',
                          padding: '4px 6px',
                          textAlign: 'center',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: '1.5px solid #fcd34d',
                          borderRadius: '8px',
                          backgroundColor: '#fffbeb',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#e11d48', backgroundColor: '#fff1f2' }}>
                      {row.totalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13.5px' }}>
            <span style={{ color: '#64748b' }}>
              Total Boxes: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{totalPOBoxes}</strong>
            </span>
            <span style={{ color: '#64748b' }}>
              Grand Total: <strong style={{ color: '#e11d48', fontWeight: 700, fontSize: '16px' }}>₹{grandTotal.toFixed(2)}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePO}
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                backgroundColor: config.primaryColor,
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 12px ${config.shadowColor}`
              }}
            >
              <i className={isSubmitting ? 'ti ti-loader animate-spin' : 'ti ti-shopping-cart'}></i>
              <span>{isSubmitting ? 'Creating PO...' : 'Create Thread PO'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Purchase Orders Summary Card rendered below buttons
 */
export function OrderPurchaseOrdersCard({
  orderPos = [],
  onViewPO
}) {
  if (!orderPos || orderPos.length === 0) return null;

  return (
    <div
      className="card border-0 shadow-sm rounded-4 bg-white mb-4"
      style={{
        border: '1px solid #e2e8f0',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        marginTop: '20px',
        marginBottom: '24px'
      }}
    >
      <div
        className="d-flex align-items-center justify-content-between mb-3"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <i className="ti ti-shopping-cart" style={{ fontSize: '18px' }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-0" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Purchase Orders ({orderPos.length})
          </h6>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {orderPos.map((po, idx) => {
          const status = (po.status_display || po.status || 'DRAFT').toUpperCase();
          const badgeBg =
            status === 'DRAFT' ? '#f1f5f9' :
            status === 'SENT' ? '#eff6ff' :
            status === 'RECEIVED' ? '#f0fdf4' :
            status === 'CANCELLED' ? '#fef2f2' : '#fef3c7';
          const badgeColor =
            status === 'DRAFT' ? '#475569' :
            status === 'SENT' ? '#1d4ed8' :
            status === 'RECEIVED' ? '#15803d' :
            status === 'CANCELLED' ? '#b91c1c' : '#b45309';

          return (
            <div
              key={po.id || idx}
              onClick={() => onViewPO && onViewPO(po)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb'
                  }}
                >
                  <i className="ti ti-shopping-cart" style={{ fontSize: '18px' }}></i>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {po.po_number || po.poNumber || po.id}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: badgeBg,
                        color: badgeColor
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    <span>{po.vendor_name || po.vendorName || 'Vendor'}</span>
                    <span>&bull;</span>
                    <span>{po.po_date || po.date || 'Today'}</span>
                    <span>&bull;</span>
                    <span style={{ color: '#94a3b8' }}>{po.po_type || po.category || 'Accessory PO'}</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  ₹{parseFloat(po.total_amount || po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                  <i className="ti ti-chevron-right"></i>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 5. The Row of 7 Buttons:
 * Matching user screenshot & live ERP layout
 */
export function AccessoryPOButtonsBar({
  onOpenModal,
  style = {}
}) {
  const categories = Object.values(ACCESSORY_PO_CATEGORIES);

  return (
    <div
      className="d-flex justify-content-center align-items-center flex-wrap my-4"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        margin: '24px 0',
        ...style
      }}
    >
      {categories.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onClick={() => onOpenModal && onOpenModal(cat.key)}
          className="btn transition-all shadow-sm"
          style={{
            backgroundColor: cat.primaryColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '11px 22px',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: `0 8px 18px -4px ${cat.shadowColor}`,
            transition: 'all 0.2s ease',
            letterSpacing: '0.2px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 12px 22px -3px ${cat.shadowColor}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 8px 18px -4px ${cat.shadowColor}`;
          }}
        >
          <i className="ti ti-shopping-cart" style={{ fontSize: '16px', lineHeight: 1 }}></i>
          <span>{cat.buttonText}</span>
        </button>
      ))}
    </div>
  );
}
