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

  if (Array.isArray(vendor.types) && vendor.types.length > 0) {
    types = vendor.types.map((t) => String(t).trim()).filter(Boolean);
  } else if (Array.isArray(vendor.type)) {
    types = vendor.type.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof vendor.type === 'string' && vendor.type.trim()) {
    const raw = vendor.type.trim();
    if (raw.includes(',')) {
      types = raw.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (raw.toLowerCase() === 'dyeing & printing' || raw.toLowerCase() === 'dyeing and printing') {
      types = ['Dyeing', 'Printing'];
    } else {
      types = [raw];
    }
  }

  if (vendor.customType && typeof vendor.customType === 'string' && vendor.customType.trim()) {
    const cust = vendor.customType.trim();
    if (!types.some((t) => t.toLowerCase() === cust.toLowerCase())) {
      types.push(cust);
    }
  }

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const t of types) {
    const lower = t.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(t);
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
  if (!targetType || targetType === 'All' || targetType === '*') return true;
  if (!vendor) return false;

  const vendorTypes = getVendorTypes(vendor);
  if (vendorTypes.length === 0) return false;

  const targets = (Array.isArray(targetType) ? targetType : [targetType])
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean);

  if (targets.length === 0) return true;

  return vendorTypes.some((vt) => {
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

      if (target === 'dyeing') {
        return (
          vLower.includes('dye') ||
          vLower.includes('processing') ||
          vLower.includes('process')
        );
      }

      if (target === 'printing') {
        return vLower.includes('print');
      }

      if (target === 'processing') {
        return (
          vLower.includes('process') ||
          vLower.includes('dye') ||
          vLower.includes('print')
        );
      }

      if (target === 'embroidery') {
        return (
          vLower.includes('embroid') ||
          vLower.includes('aari') ||
          vLower.includes('chikankari')
        );
      }

      if (target === 'washing') {
        return vLower.includes('wash') || vLower.includes('laundry');
      }

      if (target === 'job worker' || target === 'stitching' || target === 'stitching / job worker') {
        return vLower.includes('stitch') || vLower.includes('job worker') || vLower.includes('tailor');
      }

      return false;
    });
  });
}

