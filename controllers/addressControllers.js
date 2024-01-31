 
const address = require('../models/addressModel')
const user = require("../models/userModels");



//======insert address==========================================================================

const addAddress = async (req, res) => {
    try {
        const userId = req.session.user_id
        const newAddress = new address({
            user: userId,
            type: req.body.type,
            phone: req.body.phone,
            houseName: req.body.houseName,
            name: req.body.name,
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
        })

        await newAddress.save();

        if (req.query.checkout) {
            res.redirect('/checkout');
        } else {
            res.redirect('/profile');
        }



    } catch (error) {
        console.log(error.message)
    }
}










module.exports= {
    addAddress
}