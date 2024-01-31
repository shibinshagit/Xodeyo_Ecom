const Coupon = require('../models/couponModel');
const User = require('../models/userModels');






// listCoupons====================================================================================================================

const listCoupons =  async (req, res) => {
    try {
      var search = "";
      var isListed = req.query.listed;
      const page = parseInt(req.query.page) || 1;
      const perPage = parseInt(req.query.perPage) || 5;
  
      if (req.query.search) {
        search = req.query.search;
      }
      const filter = {
        $or: [
          { code: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
      };
      
  
      if (isListed === "true") {
        filter.isListed = true;
      } else if (isListed === "false") {
        filter.isListed = false;
      } else {
      }
  
      const totalCoupons = await Coupon.countDocuments(filter);
      console.log(totalCoupons)
      const totalPages = Math.ceil(totalCoupons / perPage);
      const couponData = await Coupon.find(filter)
      .sort({ createdDate: -1 }) 
      .skip((page - 1) * perPage)
      .limit(perPage);
  
      console.log(couponData)

      res.render('listCoupons', { coupon: couponData,totalPages, currentPage: page ,totalCoupons});
    } catch (error) {
      console.log(error.message);
    }
  } 

// addCoupons============================================================================================================

const addCoupons = async (req, res) => res.render('addCoupons')

// insertCoupon===============================================================================================================================

const insertCoupon = async (req, res) => {
    try {
      const code = req.body.couponCode;
      const couponExist = await Coupon.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
      if (couponExist) {
        return res.render('addCoupons', { message: 'coupon name already exists!' });
      }
  
      const couponData = await new Coupon({
        code: code,
        discount: req.body.discount,
        type: req.body.DiscountType,
        expiry: req.body.expiryDate,
        minCartAmt: req.body.minCartAmt,
        maxRedeemableAmt: req.body.maxRedeemableAmt,
        minCartAmt: req.body.minCartAmt,
        isListed: true,
      }).save();
  
      if (couponData) {
        res.render('addCoupons', { message: 'Banner added successful' });
      } else {
        res.render('addCoupons', { message: 'failed to add Banner' });
      }
    } catch (error) {
      console.error(`Error in insertBanners: ${error.message}`);
      res.render('addBanner', { message: 'Failed to create Banner' });
    }
  };


// unlistCoupon------------------------------------------------------------------------------------------------------------------------------
const unlistCoupon = async (req, res) => {
    try {
      const id = req.query.couponId;
      const coupon = await Coupon.findById(id);
      if (coupon) {
        coupon.is_listed = !coupon.is_listed;
        await coupon.save();
        res.json({ success: true});
      } else {
        res.json({ success: false});
      }
    } catch (error) {
      console.error(`Error in unlist coupon: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  };


// dltCoupon============================================================================================================================= 

const dltCoupon = async (req, res) => {
    try {
      const id = req.query.couponId;
      console.log(id)
      const coupon = await Coupon.findByIdAndDelete(id);
      if (coupon) {
       
        res.json({ success: true});
      } else {
        res.json({ success: false});
        
      }
    } catch (error) {
      console.error(`Error in dlt coupon: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  };










module.exports = {
    listCoupons,addCoupons,insertCoupon,dltCoupon,unlistCoupon
}