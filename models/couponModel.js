const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true
  },
  expiry: {
    type: Date,
    required: true,
  },
  minCartAmt: {
    type: Number,
    required: true,
  },
  maxRedeemableAmt: {
    type: Number,
    required: true,
  },

  usersUsed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
  ],
  is_listed: {
    type: Boolean,
    default: true,
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },
});



module.exports = mongoose.model('Coupon', couponSchema);