const fs = require('fs');

const filePath = 'frontend/src/components/Orders/OrderDetailView.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Check if procurementFabrics is imported
if (!content.includes('procurementFabrics')) {
  content = content.replace(
    "import { initialVendors, initialPurchaseOrders } from '../../data/procurementData';",
    "import { initialVendors, initialPurchaseOrders, initialFabrics as procurementFabrics } from '../../data/procurementData';"
  );
}

// 2. Add helper and update consumptionRows initialization
// Look for `const [consumptionRows, setConsumptionRows] = useState(() => {`
const consumptionInitStart = content.indexOf('const [consumptionRows, setConsumptionRows] = useState(() => {');
if (consumptionInitStart === -1) {
  console.error('Could not find consumptionRows declaration');
  process.exit(1);
}

// Find `return rows;\n  });`
const returnRowsIdx = content.indexOf('return rows;\n  });', consumptionInitStart);
if (returnRowsIdx === -1) {
  console.error('Could not find return rows;\n  });');
  process.exit(1);
}

const consumptionInitEnd = returnRowsIdx + 'return rows;\n  });'.length;

const newConsumptionInit = `const [consumptionRows, setConsumptionRows] = useState(() => {
    const resolveWidth = (val) => {
      if (!val || val === '—' || val === '-') return '';
      const clean = String(val).replace(/&quot;/g, '').replace(/"/g, '').trim();
      return clean ? \`\${clean}"\` : '';
    };

    const getFabricDefaultWidth = (fq, artFab) => {
      const fromFab = resolveWidth(artFab?.width);
      if (fromFab) return fromFab;
      if (!fq) return '44"';
      const matched = procurementFabrics?.find(f => 
        f.qualityName?.toLowerCase() === fq.toLowerCase() ||
        f.id === artFab?.fabricId
      );
      if (matched?.widths?.[0]) return \`\${matched.widths[0]}"\`;
      if (fq.toLowerCase().includes('liva') || fq.toLowerCase().includes('pant') || fq.toLowerCase().includes('2.40')) return '47"';
      if (fq.toLowerCase().includes('cambryc') || fq.toLowerCase().includes('cambric')) return '';
      return '44"';
    };

    // If order already has saved fabricConsumptions, initialize from them
    if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
      return order.fabricConsumptions.map((fc, idx) => {
        const artName = fc.articleName || fc.article || (order?.articles?.[idx]?.name) || (idx === 0 ? 'Kurta' : idx === 1 ? 'Pant' : 'Dupatta');
        const artIdx = fc.articleIndex !== undefined
          ? fc.articleIndex
          : (order?.articles ? order.articles.findIndex(a => a.name === artName) : idx);
        const art = (order?.articles && order.articles[artIdx]) || {};
        const artFab = art.fabrics?.[0] || {};
        const fabQuality = fc.fabricQuality || fc.fabricName || artFab.fabricName || artFab.quality || art.fabricQuality || (idx === 0 ? '100/100 Mulmul' : idx === 1 ? '2.40/20s CF' : '60os Cambryc');
        
        // Priority for starting width: fabric's defined width from Fabric Master -> artFab.width -> art.width -> order.width -> default
        const initialWidth = resolveWidth(artFab.width) ||
          getFabricDefaultWidth(fabQuality, artFab) ||
          resolveWidth(fc.width) ||
          resolveWidth(art.width) ||
          resolveWidth(order?.width) ||
          '44"';

        const shrink = parseFloat(fc.shrinkPercent || fc.shrinkPct || artFab.shrinkagePercent || artFab.shrinkage || (idx === 1 ? 3.5 : 4));
        const buf = parseFloat(fc.bufferPercent || fc.bufferPct || artFab.bufferPercent || 10);

        return {
          key: fc.key || \`row_\${idx}\`,
          articleIndex: artIdx >= 0 ? artIdx : idx,
          articleName: artName,
          articleCode: artName.toUpperCase(),
          articleIcon: art.icon || art.emoji || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          role: fc.role || artFab.pieceLabel || artFab.role || 'Main',
          fabricQuality: fabQuality,
          source: fc.source || artFab.source || (artName.toLowerCase().includes('pant') ? 'Dyed Fabric' : 'Greige Fabric'),
          width: initialWidth,
          colorName: fc.colorName || 'Charcoal',
          colorHex: fc.colorHex || '#333333',
          dyedRate: (fc.dyedRate !== undefined && fc.dyedRate !== null && fc.dyedRate !== '') ? fc.dyedRate : (idx === 0 ? 1.5 : idx === 1 ? 3.0 : 0.0),
          shrinkPct: shrink,
          bufferPct: buf,
          pcs: parseInt(fc.pcs || fc.pieces, 10) || (idx === 0 ? 400 : 300),
          locked: fc.locked !== undefined ? !!fc.locked : false
        };
      });
    }

    // Otherwise, generate rows from order.articles and customer orders or default matching Prototype Demo (Kurta, Pant, Dupatta)
    const articles = (order?.articles && order.articles.length > 0)
      ? order.articles
      : [
          { name: 'Kurta', fabricQuality: '100/100 Mulmul', width: '44"', shrinkage: 4, bufferPercent: 10, totalPieces: 700, icon: '👘', consumption: 1.5 },
          { name: 'Pant', fabricQuality: '2.40/20s CF', width: '47"', shrinkage: 3.5, bufferPercent: 8, totalPieces: 700, icon: '👖', consumption: 3.0, sourcing: 'Dyed' },
          { name: 'Dupatta', fabricQuality: '60os Cambryc', width: '', shrinkage: 6, bufferPercent: 10, totalPieces: 400, icon: '🎀', consumption: 0.0 }
        ];

    // Colors list from customer orders
    let colors = [];
    if (order?.customerOrders && order.customerOrders.length > 0) {
      order.customerOrders.forEach(c => {
        (c.selectedColors || []).forEach(col => {
          if (!colors.includes(col)) colors.push(col);
        });
      });
    }
    if (colors.length === 0 && Array.isArray(order?.colors) && order.colors.length > 0) {
      colors = [...order.colors];
    }
    if (colors.length === 0) {
      colors = ['Charcoal', 'Green'];
    }

    const colorHexMap = {
      'Charcoal': '#333333',
      'Green': '#228B22',
      'Ivory': '#FFFFF0',
      'Maroon': '#800000',
      'Navy Blue': '#000080',
      'Rust': '#B7410E',
      'Pastel Red': '#FF6961',
      'Rama Green': '#20B2AA',
      'Sea Green': '#2E8B57',
      'Teal': '#008080',
      'Wine': '#722F37',
      'Yellow': '#FFD700'
    };

    const getCustomerPcs = (artName, colName) => {
      let sum = 0;
      if (Array.isArray(order?.customerOrders)) {
        order.customerOrders.forEach(cust => {
          Object.entries(cust.sizeConfigs || {}).forEach(([key, cfg]) => {
            const kLow = key.toLowerCase();
            const aLow = (artName || '').toLowerCase();
            const cLow = (colName || '').toLowerCase();
            if (kLow.includes(aLow) && (cLow === '' || kLow.includes(cLow))) {
              if (Array.isArray(cfg?.seriesConfigs)) {
                cfg.seriesConfigs.forEach(sc => {
                  Object.values(sc.sizeQtys || {}).forEach(q => {
                    sum += parseInt(q, 10) || 0;
                  });
                });
              } else if (cfg?.sizeQtys) {
                Object.values(cfg.sizeQtys || {}).forEach(q => {
                  sum += parseInt(q, 10) || 0;
                });
              }
            }
          });
        });
      }
      return sum;
    };

    const rows = [];
    articles.forEach((art, aIdx) => {
      const artFab = art.fabrics?.[0] || {};
      const artName = art.name || (aIdx === 0 ? 'Kurta' : aIdx === 1 ? 'Pant' : 'Dupatta');
      const fabName = artFab.fabricName || artFab.quality || art.fabricQuality || (aIdx === 0 ? '100/100 Mulmul' : aIdx === 1 ? '2.40/20s CF' : '60os Cambryc');
      const role = artFab.pieceLabel || artFab.role || 'Main';
      const source = art.sourcing || artFab.source || (artName.toLowerCase().includes('pant') ? 'Dyed Fabric' : 'Greige Fabric');
      
      const initialWidth = resolveWidth(artFab.width) ||
        getFabricDefaultWidth(fabName, artFab) ||
        resolveWidth(art.width) ||
        resolveWidth(order?.width) ||
        (aIdx === 1 ? '47"' : aIdx === 2 ? '' : '44"');

      const shrinkVal = parseFloat(artFab.shrinkagePercent || artFab.shrinkage || art.shrinkage || (aIdx === 1 ? 3.5 : aIdx === 2 ? 6 : 4));
      const bufferVal = parseFloat(artFab.bufferPercent || 10);
      const defaultDyed = art.consumption !== undefined ? art.consumption : (aIdx === 0 ? 1.5 : aIdx === 1 ? 3.0 : 0.0);

      // Dupatta might only have 1 color in sample
      const artColors = artName.toLowerCase().includes('dupatta') ? [colors[0] || 'Charcoal'] : colors;

      artColors.forEach((col, cIdx) => {
        const custPcs = getCustomerPcs(artName, col);
        const pcsVal = custPcs > 0 ? custPcs : (cIdx === 0 ? 400 : 300);

        rows.push({
          key: \`\${artName}_\${role}_\${col}\`,
          articleIndex: aIdx,
          articleName: artName,
          articleCode: (artName || '').toUpperCase(),
          articleIcon: art.icon || art.emoji || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          role: role,
          fabricQuality: fabName,
          source: source,
          width: initialWidth,
          colorName: col,
          colorHex: colorHexMap[col] || '#333333',
          dyedRate: defaultDyed,
          shrinkPct: shrinkVal,
          bufferPct: bufferVal,
          pcs: pcsVal,
          locked: false
        });
      });
    });

    return rows;
  });`;

content = content.slice(0, consumptionInitStart) + newConsumptionInit + content.slice(consumptionInitEnd);

// 3. Add Article Groups & Rate Calculations logic right after handleSaveConsumption
const saveConsumptionIdx = content.indexOf('const handleSaveConsumption = () => {');
if (saveConsumptionIdx === -1) {
  console.error('Could not find handleSaveConsumption');
  process.exit(1);
}

// Find `const handleConfirmOrder = () => {`
const confirmOrderIdx = content.indexOf('const handleConfirmOrder = () => {', saveConsumptionIdx);
if (confirmOrderIdx === -1) {
  console.error('Could not find handleConfirmOrder');
  process.exit(1);
}

const newHandlersAndMemos = `const handleSaveConsumption = () => {
    const currentScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const totalDyedCalculated = consumptionRows.reduce((sum, r) => {
      const dyedRate = parseFloat(r.dyedRate) || 0;
      const pcs = parseInt(r.pcs, 10) || 0;
      return sum + (dyedRate * pcs);
    }, 0);
    const totalGreigeCalculated = consumptionRows.reduce((sum, r) => {
      const artSourcing = (articleSourcing[r.articleName] || r.source || 'Greige').toLowerCase();
      const isDyed = artSourcing.includes('dyed');
      const dyedRate = parseFloat(r.dyedRate) || 0;
      const shrink = isDyed ? 0 : (parseFloat(r.shrinkPct) || 0);
      const greigeRate = isDyed ? dyedRate : (shrink < 100 ? dyedRate * (1 + shrink / 100) : dyedRate);
      const pcs = parseInt(r.pcs, 10) || 0;
      return sum + (greigeRate * pcs);
    }, 0);

    const updatedOrder = {
      ...order,
      fabricConsumptions: consumptionRows,
      totalFabricGreige: parseFloat(totalGreigeCalculated.toFixed(1)) || order.totalFabricGreige || 0,
      totalFabricDyed: parseFloat(totalDyedCalculated.toFixed(1)) || order.totalFabricDyed || 0,
      articleSourcing
    };

    const saved = getStoredData('erp_sales_orders_v1', []);
    const updated = [updatedOrder, ...saved.filter(o => o.id !== updatedOrder.id)];
    setStoredData('erp_sales_orders_v1', updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('erp_sales_order_updated', { detail: updatedOrder }));
    }

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }

    setIsConsumptionEditing(false);
    setToastMessage('Fabric consumption details saved successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: currentScroll, behavior: 'instant' });
      });
    }
  };

  const handleCancelConsumption = () => {
    if (Array.isArray(order?.fabricConsumptions) && order.fabricConsumptions.length > 0) {
      setConsumptionRows([...order.fabricConsumptions]);
    }
    setShowRateCalculation(false);
    setToastMessage('Changes cancelled.');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggleArticleSourcing = (artName, mode) => {
    setArticleSourcing(prev => ({ ...prev, [artName]: mode }));
    setConsumptionRows(prev => prev.map(r => {
      if (r.articleName === artName) {
        return {
          ...r,
          source: mode === 'Dyed' ? 'Dyed Fabric' : 'Greige Fabric'
        };
      }
      return r;
    }));
  };

  const handleUpdateArticleWidth = (artName, newWidth) => {
    setConsumptionRows(prev => prev.map(r => {
      if (r.articleName === artName) {
        return { ...r, width: newWidth === '—' ? '' : newWidth };
      }
      return r;
    }));
  };

  const handleUpdateArticleDyedRate = (artName, val) => {
    const num = val === '' ? '' : (parseFloat(val) || 0);
    setConsumptionRows(prev => prev.map(r => {
      if (r.articleName === artName) {
        return { ...r, dyedRate: num };
      }
      return r;
    }));
  };

  const [showRateCalculation, setShowRateCalculation] = useState(false);

  // Group consumption rows by Article for Image 3 layout (Rowspan per article)
  const articleGroups = useMemo(() => {
    const map = new Map();
    consumptionRows.forEach((row, rIdx) => {
      const artName = row.articleName || 'Article';
      if (!map.has(artName)) {
        const sourcingMode = (articleSourcing[artName] || row.source || 'Greige').toLowerCase().includes('dyed') ? 'Dyed' : 'Greige';

        map.set(artName, {
          articleName: artName,
          articleCode: (row.articleCode || artName).toUpperCase(),
          articleIndex: row.articleIndex !== undefined ? row.articleIndex : map.size,
          icon: row.articleIcon || (artName.toLowerCase().includes('kurta') ? '👘' : artName.toLowerCase().includes('pant') ? '👖' : artName.toLowerCase().includes('dupatta') ? '🎀' : '👕'),
          fabricQuality: row.fabricQuality || '',
          width: row.width || '',
          sourcing: sourcingMode,
          shrinkPct: parseFloat(row.shrinkPct) || 4,
          dyedRate: row.dyedRate,
          rows: []
        });
      }
      map.get(artName).rows.push({ ...row, originalIndex: rIdx });
    });
    return Array.from(map.values());
  }, [consumptionRows, articleSourcing]);

  // Group subtotals for bottom summary rows matching Image 4
  const fabricSummaryRows = useMemo(() => {
    const map = new Map();
    consumptionRows.forEach(r => {
      const fabName = r.fabricQuality || 'Fabric';
      const width = r.width && r.width !== '—' ? r.width : '';
      const key = \`\${fabName}_\${width}\`;
      const artSourcing = (articleSourcing[r.articleName] || r.source || 'Greige').toLowerCase();
      const isDyed = artSourcing.includes('dyed');
      const shrink = isDyed ? 0 : (parseFloat(r.shrinkPct) || 0);
      const dyed = parseFloat(r.dyedRate) || 0;
      const pcs = parseInt(r.pcs, 10) || 0;
      const greigePerPc = dyed > 0 ? (isDyed ? dyed : dyed * (1 + shrink / 100)) : 0;
      const totalDyed = dyed > 0 ? dyed * pcs : 0;
      const totalGreige = greigePerPc > 0 ? greigePerPc * pcs : 0;

      if (!map.has(key)) {
        map.set(key, {
          fabricName: fabName,
          width: width,
          pcs: 0,
          totalDyed: 0,
          totalGreige: 0,
          hasValues: false
        });
      }
      const cur = map.get(key);
      cur.pcs += pcs;
      cur.totalDyed += totalDyed;
      cur.totalGreige += totalGreige;
      if (dyed > 0) cur.hasValues = true;
    });
    return Array.from(map.values());
  }, [consumptionRows, articleSourcing]);

  // Section 8 Rate Calculations & Intelligent Recommendation Engine
  const rateCalculations = useMemo(() => {
    return fabricSummaryRows.map(fs => {
      let greigeRate = 145;
      let dyeingCost = 35;
      const fn = fs.fabricName.toLowerCase();
      if (fn.includes('rayon') || fn.includes('liva') || fn.includes('2.40')) {
        greigeRate = 165;
        dyeingCost = 45;
      } else if (fn.includes('silk') || fn.includes('tussar')) {
        greigeRate = 280;
        dyeingCost = 60;
      } else if (fn.includes('cambryc') || fn.includes('cambric')) {
        greigeRate = 125;
        dyeingCost = 35;
      }

      const matchingRows = consumptionRows.filter(r => (r.fabricQuality || '').toLowerCase() === fs.fabricName.toLowerCase());
      const isDyed = matchingRows.some(r => (articleSourcing[r.articleName] || r.source || '').toLowerCase().includes('dyed'));

      const ratePerMetre = isDyed ? (greigeRate + dyeingCost + 15) : (greigeRate + dyeingCost);
      const totalMetres = isDyed ? fs.totalDyed : fs.totalGreige;
      const totalCost = totalMetres * ratePerMetre;
      const costPerGarment = fs.pcs > 0 ? totalCost / fs.pcs : 0;

      return {
        fabricName: fs.fabricName,
        width: fs.width,
        isDyed,
        ratePerMetre,
        totalMetres,
        totalCost,
        costPerGarment,
        pcs: fs.pcs
      };
    });
  }, [fabricSummaryRows, consumptionRows, articleSourcing]);

  const rateTotals = useMemo(() => {
    const totalCost = rateCalculations.reduce((sum, r) => sum + r.totalCost, 0);
    const totalMetres = rateCalculations.reduce((sum, r) => sum + r.totalMetres, 0);
    const totalPcs = rateCalculations.reduce((sum, r) => sum + r.pcs, 0);
    
    const greigeCount = rateCalculations.filter(r => !r.isDyed).length;
    let rec = "Greige sourcing path with in-house processing saves ~8.4% margin across standard widths. Optimal marker efficiency achieved with minimal cut wastage.";
    if (greigeCount === 0) {
      rec = "Notice: All articles currently set to Ready-Dyed. Switching base garments (e.g. Kurta) to Greige sourcing can save approx ₹24.50 per garment in procurement costs.";
    }

    return { totalCost, totalMetres, totalPcs, recommendation: rec };
  }, [rateCalculations]);

  `;

content = content.slice(0, saveConsumptionIdx) + newHandlersAndMemos + content.slice(confirmOrderIdx);

// 4. Replace the Section 6 JSX block
const sec6StartComment = '{/* =========================================================================\n       * 6. FABRIC COLOUR & CONSUMPTION CARD';
let sec6Idx = content.indexOf(sec6StartComment);
if (sec6Idx === -1) {
  // Try with \r\n
  const sec6StartCommentCRLF = '{/* =========================================================================\r\n       * 6. FABRIC COLOUR & CONSUMPTION CARD';
  sec6Idx = content.indexOf(sec6StartCommentCRLF);
}
if (sec6Idx === -1) {
  console.error('Could not find Section 6 start comment');
  process.exit(1);
}

const sec11StartComment = '{/* =========================================================================\n       * 11. ACCESSORIES BOM CARD';
let sec11Idx = content.indexOf(sec11StartComment);
if (sec11Idx === -1) {
  const sec11StartCommentCRLF = '{/* =========================================================================\r\n       * 11. ACCESSORIES BOM CARD';
  sec11Idx = content.indexOf(sec11StartCommentCRLF);
}
if (sec11Idx === -1) {
  console.error('Could not find Section 11 start comment');
  process.exit(1);
}

const newSec6JSX = `{/* =========================================================================
       * 6. FABRIC COLOUR & CONSUMPTION CARD (Matching Image 3 & Image 4 Specifications)
       * ========================================================================= */}
      <div
        className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden"
        style={{
          border: '1px solid #fed7aa',
          marginBottom: '24px',
          borderRadius: '16px'
        }}
      >
        {/* Card Header (Image 3: Orange Scissor Badge, Title, Combinations count) */}
        <div
          className="d-flex align-items-center gap-3 p-3 px-4"
          style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fef3c7' }}
        >
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              backgroundColor: '#f97316',
              borderRadius: '10px'
            }}
          >
            <i className="ti ti-scissors fs-5"></i>
          </div>
          <div>
            <h5 className="fw-bold mb-0 text-dark" style={{ fontSize: '17px', letterSpacing: '-0.01em' }}>
              Fabric Colour &amp; Consumption
            </h5>
            <div className="text-muted small" style={{ fontSize: '12.5px' }}>
              {consumptionRows.length} article-colour combinations
            </div>
          </div>
        </div>

        {/* Table container */}
        <div
          className="table-responsive bg-white custom-horizontal-scroll"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            border: 'none',
            paddingBottom: '0'
          }}
        >
          <table
            className="table align-middle mb-0"
            style={{
              fontSize: '13px',
              borderCollapse: 'collapse',
              width: '100%',
              minWidth: '920px'
            }}
          >
            <thead style={{ backgroundColor: '#fafafa', borderBottom: '1.5px solid #e2e8f0' }}>
              <tr>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 14px' }}>Article</th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 14px' }}>Fabric</th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 10px', textAlign: 'center' }}>
                  Width<br/><span style={{ fontSize: '10.5px', fontWeight: 400, color: '#64748b' }}>(in)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 14px' }}>Colour</th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 10px', textAlign: 'center' }}>
                  Dyed<br/><span style={{ fontSize: '10.5px', fontWeight: 400, color: '#64748b' }}>(m/pc)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 10px', textAlign: 'center' }}>Shrink %</th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 10px', textAlign: 'center' }}>
                  Greige<br/><span style={{ fontSize: '10.5px', fontWeight: 400, color: '#64748b' }}>(m/pc)</span>
                </th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 10px', textAlign: 'center' }}>Pcs</th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 12px', textAlign: 'center' }}>Total Dyed</th>
                <th style={{ fontWeight: 600, fontSize: '12px', color: '#475569', padding: '12px 12px', textAlign: 'center' }}>Total Greige</th>
              </tr>
            </thead>
            <tbody>
              {articleGroups.map((group) => {
                const isDyedSourced = group.sourcing === 'Dyed';
                const dyedVal = parseFloat(group.dyedRate) || 0;
                const hasDyedVal = dyedVal > 0;
                const shrinkPct = isDyedSourced ? 0 : (group.shrinkPct || 0);

                const widthOptions = ['42"', '44"', '47"', '48"', '54"', '58"', '60"'];
                if (group.width && !widthOptions.includes(group.width)) {
                  widthOptions.unshift(group.width);
                }

                return group.rows.map((row, rIdx) => {
                  const isFirstRow = rIdx === 0;
                  const pcs = parseInt(row.pcs, 10) || 0;
                  const greigePerPc = hasDyedVal ? (isDyedSourced ? dyedVal : dyedVal * (1 + shrinkPct / 100)) : null;
                  const totalDyed = hasDyedVal ? dyedVal * pcs : null;
                  const totalGreige = greigePerPc !== null ? greigePerPc * pcs : null;

                  return (
                    <tr
                      key={row.key || \`\${group.articleName}_\${rIdx}\`}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        verticalAlign: 'middle',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      {/* ARTICLE (Rowspan per article) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            padding: '12px 14px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <div className="d-flex align-items-center gap-2 mb-1.5">
                            <span className="fs-5">{group.icon}</span>
                            <div>
                              <div className="fw-bold text-dark fs-14" style={{ lineHeight: 1.2 }}>
                                {group.articleName}
                              </div>
                              <div className="text-muted text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                                {group.articleCode}
                              </div>
                            </div>
                          </div>

                          {/* Toggle Buttons: [ Greige ] [ Dyed ] */}
                          <div className="d-inline-flex p-0.5 rounded-2 border bg-light" style={{ gap: '2px' }}>
                            <button
                              type="button"
                              className={\`btn btn-xs py-0.5 px-2 rounded-1 fw-semibold transition-all \${
                                !isDyedSourced ? 'text-white shadow-xs' : 'text-muted bg-transparent'
                              }\`}
                              style={{
                                fontSize: '11px',
                                backgroundColor: !isDyedSourced ? '#ea580c' : 'transparent',
                                border: 'none'
                              }}
                              onClick={() => handleToggleArticleSourcing(group.articleName, 'Greige')}
                              title="Greige Fabric (Dyed -> Greige conversion using shrinkage)"
                            >
                              Greige
                            </button>
                            <button
                              type="button"
                              className={\`btn btn-xs py-0.5 px-2 rounded-1 fw-semibold transition-all \${
                                isDyedSourced ? 'text-white shadow-xs' : 'text-muted bg-transparent'
                              }\`}
                              style={{
                                fontSize: '11px',
                                backgroundColor: isDyedSourced ? '#16a34a' : 'transparent',
                                border: 'none'
                              }}
                              onClick={() => handleToggleArticleSourcing(group.articleName, 'Dyed')}
                              title="Dyed Fabric (No shrinkage conversion, Shrink % blank)"
                            >
                              Dyed
                            </button>
                          </div>
                        </td>
                      )}

                      {/* FABRIC (Rowspan per article) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            padding: '12px 14px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <div className="fw-semibold text-dark fs-13">
                            {group.fabricQuality || 'Grey Cotton Reyon'}
                          </div>
                        </td>
                      )}

                      {/* WIDTH (IN) (Rowspan per article - comes from selected fabric) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '10px 8px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <select
                            className="form-select form-select-sm shadow-none"
                            style={{
                              width: '68px',
                              height: '32px',
                              margin: '0 auto',
                              border: '1.5px solid #facc15',
                              backgroundColor: '#ffffff',
                              borderRadius: '5px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#334155',
                              padding: '2px 6px',
                              textAlign: 'center',
                              cursor: 'pointer'
                            }}
                            value={group.width || '—'}
                            onChange={(e) => handleUpdateArticleWidth(group.articleName, e.target.value)}
                          >
                            <option value="—">—</option>
                            {widthOptions.map(w => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* COLOUR (Per row) */}
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <div className="d-flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                          <span
                            className="d-inline-block rounded-circle flex-shrink-0"
                            style={{
                              width: '11px',
                              height: '11px',
                              backgroundColor: row.colorHex || '#333333',
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                          />
                          <span className="text-dark fw-medium" style={{ fontSize: '13px' }}>
                            {row.colorName}
                          </span>
                        </div>
                      </td>

                      {/* DYED (M/PC) (Rowspan per article) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '10px 8px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            className="form-control form-control-sm shadow-none text-center font-monospace"
                            style={{
                              width: '78px',
                              height: '32px',
                              margin: '0 auto',
                              border: '1.5px solid #facc15',
                              backgroundColor: '#fffbeb',
                              borderRadius: '5px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#1e293b'
                            }}
                            placeholder="0.000"
                            value={group.dyedRate !== undefined && group.dyedRate !== null && group.dyedRate !== '' ? group.dyedRate : ''}
                            onChange={(e) => handleUpdateArticleDyedRate(group.articleName, e.target.value)}
                          />
                        </td>
                      )}

                      {/* SHRINK % (Rowspan per article - blank if Dyed) */}
                      {isFirstRow && (
                        <td
                          rowSpan={group.rows.length}
                          style={{
                            verticalAlign: 'middle',
                            textAlign: 'center',
                            padding: '10px 8px',
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #e2e8f0',
                            fontSize: '13px',
                            color: '#475569',
                            fontWeight: 500
                          }}
                        >
                          {isDyedSourced ? '—' : (group.shrinkPct ? \`\${group.shrinkPct}%\` : '—')}
                        </td>
                      )}

                      {/* GREIGE (M/PC) */}
                      <td
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#334155',
                          fontSize: '13px',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {greigePerPc !== null && greigePerPc > 0 ? greigePerPc.toFixed(2) : '—'}
                      </td>

                      {/* PCS */}
                      <td
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          color: '#1e293b',
                          fontWeight: 600,
                          fontSize: '13px',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {pcs}
                      </td>

                      {/* TOTAL DYED */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#1d4ed8',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {totalDyed !== null && totalDyed > 0 ? totalDyed.toFixed(2) : '—'}
                      </td>

                      {/* TOTAL GREIGE */}
                      <td
                        style={{
                          padding: '10px 12px',
                          textAlign: 'center',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#7e22ce',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {totalGreige !== null && totalGreige > 0 ? totalGreige.toFixed(2) : '—'}
                      </td>
                    </tr>
                  );
                });
              })}

              {/* SUMMARY ROWS AT BOTTOM (Replacing Image 2 with Image 4) */}
              {fabricSummaryRows.map((fs, idx) => (
                <tr
                  key={\`summary_\${idx}\`}
                  style={{
                    borderTop: idx === 0 ? '2px solid #cbd5e1' : '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <td
                    colSpan={7}
                    className="fw-bold text-dark ps-3 py-2.5"
                    style={{ fontSize: '13.5px' }}
                  >
                    {fs.fabricName}
                    {fs.width ? (
                      <span className="text-muted fw-normal" style={{ fontSize: '12px' }}>
                        {' '}({fs.width})
                      </span>
                    ) : ''}
                  </td>
                  <td
                    className="text-center fw-bold text-dark py-2.5"
                    style={{ fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fs.pcs}
                  </td>
                  <td
                    className="text-center fw-bold py-2.5"
                    style={{
                      fontSize: '13px',
                      color: '#1d4ed8',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fs.hasValues && fs.totalDyed > 0 ? fs.totalDyed.toFixed(2) : '—'}
                  </td>
                  <td
                    className="text-center fw-bold py-2.5"
                    style={{
                      fontSize: '13px',
                      color: '#7e22ce',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {fs.hasValues && fs.totalGreige > 0 ? fs.totalGreige.toFixed(2) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Actions Bar (Image 3: Cancel, Calculate Rate, Save) */}
        <div
          className="d-flex align-items-center justify-content-end gap-2.5 p-3 px-4 bg-white"
          style={{ borderTop: '1px solid #f1f5f9' }}
        >
          <button
            type="button"
            className="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold bg-white shadow-xs transition-all"
            style={{ borderColor: '#cbd5e1', color: '#475569' }}
            onClick={handleCancelConsumption}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn px-4 py-2 rounded-3 fw-semibold text-white shadow-sm d-flex align-items-center gap-2 transition-all"
            style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
            onClick={() => setShowRateCalculation(prev => !prev)}
            title="Calculate Rate & View Costing Breakdown (PDF Section 8)"
          >
            <i className="ti ti-calculator fs-5"></i>
            <span>Calculate Rate</span>
          </button>

          <button
            type="button"
            className="btn px-4 py-2 rounded-3 fw-semibold text-white shadow-sm d-flex align-items-center gap-2 transition-all"
            style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
            onClick={handleSaveConsumption}
          >
            <i className="ti ti-device-floppy fs-5"></i>
            <span>Save</span>
          </button>
        </div>

        {/* Section 8 Intelligent Costing & Rate Calculation Breakdown */}
        {showRateCalculation && (
          <div className="p-4 border-top" style={{ backgroundColor: '#f8fafc' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary p-2 rounded-2">
                  <i className="ti ti-chart-arrows fs-5"></i>
                </span>
                <div>
                  <h6 className="fw-bold text-dark mb-0 fs-15">Fabric Rate Calculation &amp; Procurement Costing</h6>
                  <small className="text-muted">Section 8 &bull; Market Rate, Fabric Cost per Garment &amp; Margin Optimization Engine</small>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowRateCalculation(false)}
                title="Close breakdown"
              ></button>
            </div>

            {/* Rates table */}
            <div className="table-responsive rounded-3 border bg-white mb-3 shadow-2xs">
              <table className="table table-sm align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="py-2.5 px-3">Fabric Quality</th>
                    <th className="py-2.5 px-3 text-center">Selected Width</th>
                    <th className="py-2.5 px-3 text-center">Sourcing Path</th>
                    <th className="py-2.5 px-3 text-end">Market Rate (₹/m)</th>
                    <th className="py-2.5 px-3 text-end">Total Metres</th>
                    <th className="py-2.5 px-3 text-end">Est. Fabric Cost</th>
                    <th className="py-2.5 px-3 text-end">Cost / Garment</th>
                  </tr>
                </thead>
                <tbody>
                  {rateCalculations.map((rc, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 fw-semibold text-dark">{rc.fabricName}</td>
                      <td className="py-2.5 px-3 text-center">{rc.width || 'Default'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={\`badge \${rc.isDyed ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'} px-2 py-1\`}>
                          {rc.isDyed ? 'Dyed / Stock' : 'Greige + Dyeing'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-end font-monospace">₹{rc.ratePerMetre.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-end font-monospace">{rc.totalMetres.toFixed(1)}m</td>
                      <td className="py-2.5 px-3 text-end font-monospace fw-bold text-dark">₹{rc.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-3 text-end font-monospace fw-semibold text-primary">₹{rc.costPerGarment.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light fw-bold">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-dark">Total Order Procurement Cost</td>
                    <td className="py-2.5 px-3 text-end font-monospace">{rateTotals.totalMetres.toFixed(1)}m</td>
                    <td className="py-2.5 px-3 text-end font-monospace text-success fs-14">
                      ₹{rateTotals.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-end font-monospace text-primary">
                      Avg ₹{(rateTotals.totalCost / (rateTotals.totalPcs || 1)).toFixed(2)}/pc
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Section 8 Intelligent Recommendation */}
            <div className="p-3 rounded-3 border d-flex align-items-start gap-2.5" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <i className="ti ti-bulb text-success fs-4 mt-0.5"></i>
              <div>
                <div className="fw-bold text-success fs-13 mb-1">
                  Intelligent Procurement &amp; Marker Optimization Recommendation
                </div>
                <div className="text-dark small" style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
                  {rateTotals.recommendation}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>\n\n\n\n      `;

content = content.slice(0, sec6Idx) + newSec6JSX + content.slice(sec11Idx);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated OrderDetailView.jsx with new Fabric Colour & Consumption specification!');
