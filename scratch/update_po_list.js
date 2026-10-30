const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('frontend/src/components/Procurement/PurchaseOrderList.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update search logic to also match color, width, rate
const oldSearchBlock = `    const matchesSearch =
      searchTerm === '' ||
      poId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.items || []).some((it) => String(it.fabricName || it.fabricQuality || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCol =
      poId.toLowerCase().includes((colFilters.id || '').toLowerCase()) &&
      poDate.includes(colFilters.date || '') &&
      (vName.toLowerCase().includes((colFilters.vendor || '').toLowerCase()) ||
        vId.toLowerCase().includes((colFilters.vendor || '').toLowerCase())) &&
      (!colFilters.expected || expDate.includes(colFilters.expected)) &&
      (!colFilters.status || po.status === colFilters.status);`;

const newSearchBlock = `    const matchesSearch =
      searchTerm === '' ||
      poId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.items || []).some((it) =>
        String(it.fabricName || it.fabricQuality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(it.colorName || it.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(it.width || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(it.rate || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCol =
      poId.toLowerCase().includes((colFilters.id || '').toLowerCase()) &&
      poDate.includes(colFilters.date || '') &&
      (vName.toLowerCase().includes((colFilters.vendor || '').toLowerCase()) ||
        vId.toLowerCase().includes((colFilters.vendor || '').toLowerCase())) &&
      (!colFilters.status || po.status === colFilters.status);`;

if (content.includes(oldSearchBlock.replace(/\r?\n/g, '\r\n'))) {
  content = content.replace(oldSearchBlock.replace(/\r?\n/g, '\r\n'), newSearchBlock.replace(/\r?\n/g, '\r\n'));
} else if (content.includes(oldSearchBlock.replace(/\r?\n/g, '\n'))) {
  content = content.replace(oldSearchBlock.replace(/\r?\n/g, '\n'), newSearchBlock.replace(/\r?\n/g, '\n'));
} else {
  console.log('Search block not matched directly, using regex replacement');
  content = content.replace(
    /\(po\.items \|\| \[\]\)\.some\(\(it\) => String\(it\.fabricName \|\| it\.fabricQuality \|\| ''\)\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\);/g,
    `(po.items || []).some((it) =>
        String(it.fabricName || it.fabricQuality || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(it.colorName || it.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(it.width || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(it.rate || '').toLowerCase().includes(searchTerm.toLowerCase())
      );`
  );
}

// 2. Update Table Header
const oldHeader = `<thead className="text-secondary" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '9%' }}>PO No.</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '8%' }}>Date</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '12%' }}>Vendor</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '21%' }}>Fabrics / Qualities</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '8%' }}>Expected Date</th>
                <th className="text-center" style={{ padding: '7px 4px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '6%' }}>Buffer %</th>
                <th className="text-end" style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '10%' }}>Total Amount</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '13%' }}>Status</th>
                <th className="text-end" style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '13%' }}>Actions</th>
              </tr>
            </thead>`;

const newHeader = `<thead className="text-secondary" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '10%' }}>PO No.</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '9%' }}>Date</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '13%' }}>Vendor</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '18%' }}>Fabric Quality</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '9%' }}>Fabric Width</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '12%' }}>Fab Color</th>
                <th className="text-end" style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', width: '10%' }}>Rate</th>
                <th style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '10%' }}>Status</th>
                <th className="text-end" style={{ padding: '7px 6px', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em', width: '9%' }}>Actions</th>
              </tr>
            </thead>`;

if (content.includes(oldHeader.replace(/\r?\n/g, '\r\n'))) {
  content = content.replace(oldHeader.replace(/\r?\n/g, '\r\n'), newHeader.replace(/\r?\n/g, '\r\n'));
} else if (content.includes(oldHeader.replace(/\r?\n/g, '\n'))) {
  content = content.replace(oldHeader.replace(/\r?\n/g, '\n'), newHeader.replace(/\r?\n/g, '\n'));
} else {
  console.log('Old header not matched directly');
}

// 3. Update Table Row Body Cells
const oldRowCells = `                      <td style={{ padding: '6px 6px', fontSize: '10.5px' }}>
                        <div className="d-flex flex-column gap-0.5">
                          {(po.items || []).map((it, idx) => (
                            <div key={idx} className="text-dark text-truncate" style={{ maxWidth: '230px' }} title={\`\${it.fabricName || it.fabricQuality || 'Fabric'} \${it.colorName ? \`(\${it.colorName})\` : ''} (\${Number(it.quantity || 0).toLocaleString()}m @ ₹\${it.rate || 0})\`}>
                              <span className="fw-medium">{it.fabricName || it.fabricQuality || 'Fabric'}</span> {it.colorName ? \`(\${it.colorName})\` : ''} <span className="text-secondary">({Number(it.quantity || 0).toLocaleString()}m @ ₹{it.rate || 0})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '6px 6px', whiteSpace: 'nowrap', fontSize: '11px' }}>{po.expectedDeliveryDate ? (typeof po.expectedDeliveryDate === 'string' && po.expectedDeliveryDate.includes('T') ? po.expectedDeliveryDate.split('T')[0] : String(po.expectedDeliveryDate)) : '-'}</td>
                      <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px' }}>
                        {po.bufferAllowed ? (
                          <span className="badge bg-info-subtle text-info py-0.5 px-1.5 fs-10">±{po.bufferPercent}%</span>
                        ) : (
                          <span className="text-muted fs-10">None</span>
                        )}
                      </td>
                      <td className="text-end fw-bold text-dark" style={{ padding: '6px 6px', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        ₹
                        {(Number(po.totalAmount) || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>`;

const newRowCells = `                      {/* Fabric Quality */}
                      <td style={{ padding: '6px 6px', fontSize: '10.5px' }}>
                        <div className="d-flex flex-column gap-1">
                          {(po.items && po.items.length > 0 ? po.items : [{ fabricName: po.fabricName, fabricQuality: po.fabricQuality }]).map((it, idx) => {
                            const qName = it.fabricName || it.fabricQuality || po.fabricName || po.fabricQuality || '-';
                            return (
                              <div
                                key={idx}
                                className="fw-medium text-dark text-truncate"
                                style={{ maxWidth: '180px', minHeight: '18px', lineHeight: '18px' }}
                                title={qName}
                              >
                                {qName}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Fabric Width */}
                      <td style={{ padding: '6px 6px', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                        <div className="d-flex flex-column gap-1">
                          {(po.items && po.items.length > 0 ? po.items : [{ width: po.width }]).map((it, idx) => {
                            const rawW = it.width !== undefined && it.width !== null && it.width !== '' ? it.width : po.width;
                            const formattedW = rawW ? (String(rawW).trim().endsWith('"') ? String(rawW).trim() : \`\${String(rawW).trim()}"\`) : '-';
                            return (
                              <div
                                key={idx}
                                className="text-secondary fw-medium"
                                style={{ minHeight: '18px', lineHeight: '18px' }}
                              >
                                {formattedW}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Fab Color */}
                      <td style={{ padding: '6px 6px', fontSize: '10.5px' }}>
                        <div className="d-flex flex-column gap-1">
                          {(po.items && po.items.length > 0 ? po.items : [{ colorName: po.colorName, color: po.color }]).map((it, idx) => {
                            const col = it.colorName || it.color || po.colorName || po.color || '-';
                            return (
                              <div
                                key={idx}
                                className="text-dark text-truncate"
                                style={{ maxWidth: '130px', minHeight: '18px', lineHeight: '18px' }}
                                title={col}
                              >
                                {col}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="text-end" style={{ padding: '6px 6px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        <div className="d-flex flex-column align-items-end gap-1">
                          {(po.items && po.items.length > 0 ? po.items : [{ rate: po.rate }]).map((it, idx) => {
                            const r = it.rate !== undefined && it.rate !== null && it.rate !== '' ? it.rate : po.rate;
                            const formattedRate = (r !== undefined && r !== null && r !== '')
                              ? \`₹\${Number(r).toLocaleString('en-IN', { minimumFractionDigits: Number(r) % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}\`
                              : '-';
                            const qty = it.quantity || po.quantity;
                            return (
                              <div
                                key={idx}
                                className="fw-bold text-dark"
                                style={{ minHeight: '18px', lineHeight: '18px' }}
                                title={qty ? \`\${Number(qty).toLocaleString()}m @ \${formattedRate}\` : formattedRate}
                              >
                                {formattedRate}
                              </div>
                            );
                          })}
                        </div>
                      </td>`;

if (content.includes(oldRowCells.replace(/\r?\n/g, '\r\n'))) {
  content = content.replace(oldRowCells.replace(/\r?\n/g, '\r\n'), newRowCells.replace(/\r?\n/g, '\r\n'));
} else if (content.includes(oldRowCells.replace(/\r?\n/g, '\n'))) {
  content = content.replace(oldRowCells.replace(/\r?\n/g, '\n'), newRowCells.replace(/\r?\n/g, '\n'));
} else {
  console.log('Old row cells not matched directly');
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated PurchaseOrderList.jsx');

