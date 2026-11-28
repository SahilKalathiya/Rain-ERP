const express = require('express');
const router = express.Router();
const cuttingCtrl = require('../controllers/cuttingController');

router.get('/pos', cuttingCtrl.getAllCuttingPOs);
router.post('/pos', cuttingCtrl.saveCuttingPO);

router.get('/old-stock', cuttingCtrl.getOldFabricStock);
router.post('/old-stock', cuttingCtrl.saveOldFabricStock);

module.exports = router;
