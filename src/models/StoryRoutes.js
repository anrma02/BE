const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        content: { type: String, required: true },
        image: { type: String },
        type: { type: String, required: false }, // Optional field
        description: { type: String,},
        author: { type: String, required: true },
        discount: { type: Number, default: 0 }, // Default value 0 if no discount provided
        age: { type: Number, required: true },
        sold: { type: Number, required: true, default: 0 }, // Default to 0 if not provided
        price: { type: Number, required: true },
        pricesale: { type: Number }, // Optional field
        rating: { type: Number, required: true, default: 0 }, // Default to 0 if not provided
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    },
);

module.exports = mongoose.model('Story', storySchema);
