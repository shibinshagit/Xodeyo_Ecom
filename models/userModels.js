const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true, default: "1699808607818_userporfile.png" },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    is_verified: { type: Number, default: 0 },
    is_reseller: { type: Number, required: true, default: 0 },
    is_Admin: { type: Number, required: true, default: 0 },
    isBlocked: { type: Boolean, required: true, default: false },
    createdDate: { type: Date, default: Date.now },
    walletBalance: { type: Number, default: 0 },
    referralCode: { type: String, default: generateRandomReferralCode, unique: true },
    referredUsers: [{ type: String }],
});

function generateRandomReferralCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 6;
    return Array.from({ length: codeLength }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
}

module.exports = mongoose.model('User', userSchema);

