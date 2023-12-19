const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    isListed: { type: Boolean, default: true },
    discountPercentage: String,
    startDate: Date,
    endDate: Date,
    discountStatus: Boolean,
});

module.exports = mongoose.model('Category', categorySchema);
