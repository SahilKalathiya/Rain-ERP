const express = require('express');
const router = express.Router();
const processCtrl = require('../controllers/processPOController');

// Process POs
router.get('/pos', processCtrl.getAllProcessPOs);
router.post('/pos', processCtrl.createProcessPO);

// Process Challans
router.get('/challans', processCtrl.getAllChallans);
router.post('/challans', processCtrl.createChallan);

// Process Returns / Inbound GRN
router.get('/returns', processCtrl.getAllReturns);

// Open Bales
router.get('/open-bales', processCtrl.getOpenBales);

// QC Records
router.get('/qc-records', processCtrl.getQCRecords);

module.exports = router;
