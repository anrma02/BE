const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create', CategoryController.createCategory);
router.delete('/delete/:id', authMiddleWare, CategoryController.deleteCategory);
router.get('/getall', CategoryController.getAllCategory);
// router.post('/delete-many', authMiddleWare, CategoryController.deleteMany);

module.exports = router;
