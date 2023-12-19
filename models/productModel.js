const mongoose = require('mongoose');

// const reviewSchema = new mongoose.Schema({
//     reviewerName: { type: String, required: true },
//     rating: { type: Number, required: true },
//     comment: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
// });

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    productCategory: { type: String, required: true },
    productDescription: { type: String, required: true },
    status: {type:String, required: true},
    price: { type: Number, required: true },
    discountRate: { type: Number, default: 0 }, 
    resellersPrice:{type:Number,required:true},
    stock: { type: Number, required: true },
    // sizes: [String],
    images: [String],
    // reviews: [reviewSchema], 
    createdAt: { type: Date, default: Date.now },
    isListed: { type: Boolean, default: true }
});

module.exports = mongoose.model('Product', productSchema);
