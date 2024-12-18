const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        comment: { type: String, required: true },
        rating: { type: Number, default: 5, required: true },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    },
    {
        timestamps: true,
    },
);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
