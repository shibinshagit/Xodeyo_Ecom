const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema ({

Image: String,
head : String,
subHead : String,
mainHead : String,
note : String,
position : Number,
createdDate: {
    type: Date,
    default: Date.now,
},
is_Listed : {
    type : Boolean,
    default : true
}

})


module.exports = mongoose.model('Banner',bannerSchema);