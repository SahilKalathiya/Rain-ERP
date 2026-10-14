const express = require('express');
const router = express.Router();
const controller = require('../controllers/salesMastersController');

// Customers
router.get('/customers', controller.getCustomers);
router.post('/customers', controller.createCustomer);
router.put('/customers/:id', controller.updateCustomer);
router.delete('/customers/:id', controller.deleteCustomer);

// Colors
router.get('/colors', controller.getColors);
router.post('/colors', controller.createColor);

// Articles
router.get('/articles', controller.getArticles);
router.post('/articles', controller.createArticle);

// Size Series
router.get('/size-series', controller.getSizeSeries);
router.post('/size-series', controller.createSizeSeries);

// Accessories
router.get('/accessories', controller.getAccessories);
router.post('/accessories', controller.createAccessory);

// Thread Masters
router.get('/thread-sizes', controller.getThreadSizes);
router.get('/thread-colors', controller.getThreadColors);

module.exports = router;
