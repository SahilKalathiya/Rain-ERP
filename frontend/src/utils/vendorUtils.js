/**
 * Vendor Type Master List & Matching Utilities
 * Supports Multi-Select Vendor Types and Filtering across all Purchase Order types:
 * - Fabric Suppliers (Procurement PO)
 * - Process Vendors (Dyeing, Printing, Processing, Embroidery, Washing)
 * - Accessories / Trims Suppliers (Buttons, Thread, Lace, Tassels, Dori, Elastic, Beads & Sequins)
 */

export const STANDARD_VENDOR_TYPES = [
  'Fabric Supplier',
  'Dyeing',
  'Printing',
  'Processing',
  'Embroidery',
  'Washing',
  'Stitching / Job Worker',
  'Buttons',
  'Thread',
  'Lace',
  'Tassels',
  'Dori',
  'Elastic',
  'Beads & Sequins',
  'Trims & Accessories',
  'Packaging Supplier',
  'Other'
];

/**
 * Returns an array of clean string vendor types for a given vendor object.
 * Handles:
 * - vendor.types: ['Dyeing', 'Processing']
 * - vendor.type: 'Dyeing, Processing' or 'Dyeing & Printing'
 * - vendor.customType
 */
export function getVendorTypes(vendor) {
  if (!vendor) return [];
  let types = [];

  const parseItem = (item) => {
    if (!item) return [];
    if (Array.isArray(item)) {
      return item.flatMap(parseItem);
    }
    if (typeof item === 'object') {
      return [item.name || item.type || item.value || ''].filter(Boolean);
    }
    if (typeof item === 'string') {
      const s = item.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try {
          const parsed = JSON.parse(s);
          return parseItem(parsed);
        } catch (e) {}
      }
      if (s.includes(',')) {
        return s.split(',').map((x) => x.trim()).filter(Boolean);
      }
      if (s.toLowerCase() === 'dyeing & printing' || s.toLowerCase() === 'dyeing and printing') {
        return ['Dyeing', 'Printing'];
      }
      return [s];
    }
    return [String(item)];
  };

  if (vendor.types) types.push(...parseItem(vendor.types));
  if (vendor.type) types.push(...parseItem(vendor.type));
  if (vendor.vendor_type) types.push(...parseItem(vendor.vendor_type));
  if (vendor.vendorType) types.push(...parseItem(vendor.vendorType));
  if (vendor.customType) types.push(...parseItem(vendor.customType));
  if (vendor.category) types.push(...parseItem(vendor.category));

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const t of types) {
    const clean = String(t).trim();
    if (!clean) continue;
    const lower = clean.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(clean);
    }
  }

  return deduped;
}

/**
 * Checks if a vendor matches a given target category or array of target categories.
 * Example target: 'Printing', 'Dyeing', 'Buttons', 'Thread', 'Fabric', etc.
 * 
 * Case-insensitive, recognizes aliases and overlaps:
 * e.g. 'buttons' matches 'Buttons' or 'Trims & Accessories'
 * e.g. 'fabric' matches 'Fabric Supplier'
 * e.g. 'dyeing' matches 'Dyeing', 'Processing', 'Dyeing & Printing'
 */
export function vendorMatchesType(vendor, targetType) {
  if (!targetType || targetType === 'All' || targetType === '*' || targetType === 'All Processes' || targetType === 'All Job Work Processes') return true;
  if (!vendor) return false;

  const vendorTypes = getVendorTypes(vendor);
  if (vendorTypes.length === 0) return false;

  const targets = (Array.isArray(targetType) ? targetType : [targetType])
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean);

  if (targets.length === 0) return true;

  const matchedByType = vendorTypes.some((vt) => {
    const vLower = String(vt).toLowerCase().trim();

    return targets.some((target) => {
      // Direct exact or substring match
      if (vLower === target) return true;
      if (vLower.includes(target) || target.includes(vLower)) return true;

      // Category specific smart alias matches
      if (target === 'buttons' || target === 'button') {
        return (
          vLower.includes('button') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'thread' || target === 'threads') {
        return (
          vLower.includes('thread') ||
          vLower.includes('yarn') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'lace') {
        return (
          vLower.includes('lace') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'tassels' || target === 'tassel') {
        return (
          vLower.includes('tassel') ||
          vLower.includes('latkan') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'dori') {
        return (
          vLower.includes('dori') ||
          vLower.includes('cord') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'elastic') {
        return (
          vLower.includes('elastic') ||
          vLower.includes('narrow fabric') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'beads_sequins' || target === 'beads' || target === 'sequins') {
        return (
          vLower.includes('bead') ||
          vLower.includes('sequin') ||
          vLower.includes('trims') ||
          vLower.includes('accessory') ||
          vLower.includes('accessories')
        );
      }

      if (target === 'fabric' || target === 'fabric supplier') {
        return (
          vLower.includes('fabric') ||
          vLower.includes('mill') ||
          vLower.includes('textile') ||
          vLower.includes('weaving')
        );
      }

      if (target === 'dyeing' || target === 'dye') {
        return (
          vLower.includes('dye') ||
          vLower.includes('processing') ||
          vLower.includes('process') ||
          vLower.includes('color') ||
          vLower.includes('colour')
        );
      }

      if (target === 'printing' || target === 'print') {
        return (
          vLower.includes('print') ||
          vLower.includes('digital') ||
          vLower.includes('screen')
        );
      }

      if (target === 'processing' || target === 'process') {
        return (
          vLower.includes('process') ||
          vLower.includes('dye') ||
          vLower.includes('print') ||
          vLower.includes('finish')
        );
      }

      if (target === 'embroidery' || target === 'embroid') {
        return (
          vLower.includes('embroid') ||
          vLower.includes('aari') ||
          vLower.includes('chikankari') ||
          vLower.includes('thread work') ||
          vLower.includes('sequin')
        );
      }

      if (target === 'washing' || target === 'wash') {
        return (
          vLower.includes('wash') ||
          vLower.includes('laundry') ||
          vLower.includes('softener')
        );
      }

      if (
        target === 'job worker' ||
        target === 'stitching' ||
        target === 'stitching / job worker' ||
        target === 'stitch'
      ) {
        return (
          vLower.includes('stitch') ||
          vLower.includes('job worker') ||
          vLower.includes('job work') ||
          vLower.includes('tailor') ||
          vLower.includes('fabricator') ||
          vLower.includes('cmt')
        );
      }

      return false;
    });
  });

  if (matchedByType) return true;

  // Fallback: Check vendor name, category, or remarks if vendor explicitly has trade in its name
  const nameStr = String(vendor.name || vendor.vendorName || '').toLowerCase();
  const categoryStr = String(vendor.category || vendor.vendor_category || '').toLowerCase();
  const combinedInfo = `${nameStr} ${categoryStr}`;

  return targets.some((target) => {
    if (target === 'dyeing' || target === 'dye') {
      return combinedInfo.includes('dye') || combinedInfo.includes('processing');
    }
    if (target === 'printing' || target === 'print') {
      return combinedInfo.includes('print');
    }
    if (target === 'processing' || target === 'process') {
      return combinedInfo.includes('process') || combinedInfo.includes('dye') || combinedInfo.includes('print');
    }
    if (target === 'embroidery' || target === 'embroid') {
      return combinedInfo.includes('embroid') || combinedInfo.includes('aari') || combinedInfo.includes('chikankari');
    }
    if (target === 'washing' || target === 'wash') {
      return combinedInfo.includes('wash') || combinedInfo.includes('laundry');
    }
    if (
      target === 'stitching' ||
      target === 'job worker' ||
      target === 'stitching / job worker' ||
      target === 'stitch'
    ) {
      return combinedInfo.includes('stitch') || combinedInfo.includes('job work') || combinedInfo.includes('tailor');
    }
    return combinedInfo.includes(target);
  });
}

