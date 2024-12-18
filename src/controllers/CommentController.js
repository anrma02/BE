const CommentService = require('../services/CommentService');

const createComment = async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required',
            });
        }
        const response = await CommentService.createComment(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};
const getAllComment = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The productId is required',
            });
        }
        const response = await CommentService.getAllComment(productId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};
const getAll = async (req, res) => {
    try {
        const response = await CommentService.getAll();
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};
const deleteComment = async (req, res) => {
    try {
        const CommentId = req.params.id;
        if (!CommentId) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The CommentId is required',
            });
        }
        const response = await CommentService.deleteComment(CommentId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(404).json({
            message: e,
        });
    }
};

module.exports = {
    createComment,
    getAllComment,
    getAll,
    deleteComment,
};
