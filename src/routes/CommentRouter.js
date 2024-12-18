const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const { authUserMiddleWare, authMiddleWare } = require('../middleware/authMiddleware');

router.post('/create/:id', authUserMiddleWare, CommentController.createComment);
router.get('/get-comment/:id', CommentController.getAllComment);
router.get('/get-comment-all', authMiddleWare, CommentController.getAll);
router.delete('/delete-comment/:id', authMiddleWare, CommentController.deleteComment);

module.exports = router;
