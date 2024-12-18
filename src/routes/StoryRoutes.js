const express = require('express');
const router = express.Router();
const {
    createStory,
    getAllStories,
    getStoryById,
    deleteStory,
    updateStory,
} = require('../controllers/storyController');

// POST: Tạo câu chuyện
router.post('/stories', createStory);

// Lấy tất cả câu chuyện
router.get('/stories', getAllStories);

// Lấy câu chuyện theo ID
router.get('/stories/:id', getStoryById);

// Xóa câu chuyện theo ID
router.delete('/stories/:id', deleteStory);

// Cập nhật câu chuyện theo ID
router.put('/stories/:id', updateStory);

module.exports = router;
