const express = require('express');
const router = express.Router();
const controller = require('../controllers/salesOrderController');

router.get('/', controller.getAllOrders);
router.get('/:id', controller.getOrderDetail);
router.post('/', controller.createOrder);
router.patch('/:id/section/:section', controller.updateOrderSection);

module.exports = router;
