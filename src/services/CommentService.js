const Comment = require('../models/Comment');
const Product = require('../models/ProductModel');
const bcrypt = require('bcrypt');

const createComment = (newComment) => {
    return new Promise(async (resolve, reject) => {
        const { comment, user, userName, product, rating } = newComment;
        try {
            const newComment = await Comment.create({
                user,
                userName,
                comment,
                rating,
                product,
            });
            if (newComment) {
                resolve({
                    status: 'OK',
                    message: 'SUCCESS',
                    data: newComment,
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};
const getAllComment = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const comment = await Comment.find({
                product: id,
            }).sort({ createdAt: -1, updatedAt: -1 });
            if (comment === null) {
                resolve({
                    status: 'ERR',
                    message: 'The comment is not defined',
                });
            }
            resolve({
                status: 'OK',
                message: 'SUCCESS',
                data: comment,
            });
        } catch (e) {
            reject(e);
        }
    });
};
const getAll = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const allComment = await Comment.find().sort({ createdAt: -1, updatedAt: -1 });
            resolve({
                status: 'OK',
                message: 'Success',
                data: allComment,
            });
        } catch (e) {
            reject(e);
        }
    });
};
const deleteComment = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkComment = await Comment.findOne({
                _id: id,
            });
            if (checkComment === null) {
                resolve({
                    status: 'ERR',
                    message: 'The Comment is not defined',
                });
            }

            await Comment.findByIdAndDelete(id);
            resolve({
                status: 'OK',
                message: 'Delete Comment success',
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = {
    createComment,
    getAllComment,
    getAll,
    deleteComment,
};
