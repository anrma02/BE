const mongoose = require('mongoose');
const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        content: { type: String, required: true },
        image: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String, required: true },
        author: { type: String, required: true },
        discount: { type: Number },
        sold: { type: Number, required: true },
        price: { type: Number, required: true },
        pricesale: { type: Number },

        rating: { type: Number, required: true },
    },
    {
        timestamps: true,
    },
);
const Product = mongoose.model('Products', productSchema);

module.exports = Product;
