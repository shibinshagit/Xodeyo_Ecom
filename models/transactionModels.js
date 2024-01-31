const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  transactionId:{
    type:String,
    default:generateRandomNumberWithPrefix
  },
  amount: Number,
  type: String,
  paymentMethod: String,
  orderId: String,
  date: {
    type: Date,
    default: Date.now,
  },
  description: String
});

function generateRandomNumberWithPrefix() {
  let prefix = "TR"
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  const result = `${prefix}${randomNumber}`;
  return result;
}

module.exports = mongoose.model('Transaction', transactionSchema);