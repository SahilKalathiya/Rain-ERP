const express = require('express');
const router = express.Router();
const pc = require('../controllers/procurementController');

// Masters
router.get('/vendors', pc.getVendors);
router.post('/vendors', pc.saveVendor);
router.get('/fabrics', pc.getFabrics);
router.post('/fabrics', pc.saveFabric);
router.get('/transporters', pc.getTransporters);
router.post('/transporters', pc.saveTransporter);
router.get('/colors', pc.getColors);
router.post('/colors', pc.saveColor);
router.delete('/colors/:id', pc.deleteColor);

// Purchase Orders (PO)
router.get('/purchase-orders', pc.getPurchaseOrders);
router.post('/purchase-orders', pc.savePurchaseOrder);

// Goods Receipt Notes (GRN)
router.get('/grns', pc.getGRNs);
router.post('/grns', pc.saveGRN);

// Quality Checks (QC)
router.get('/quality-checks', pc.getQualityChecks);
router.post('/quality-checks', pc.saveQualityCheck);

// Rejected Stock Pool
router.get('/rejected-stock', pc.getRejectedStock);
router.post('/rejected-stock', pc.saveRejectedStock);

// Audit Logs
router.get('/audit-logs', pc.getAuditLogs);
router.post('/audit-logs', pc.saveAuditLog);

module.exports = router;
