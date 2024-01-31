const User = require('../models/userModels');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const Order = require('../models/orderModel');
const Products = require('../models/productModel');
const Categories = require('../models/categoryModel');
const Coupon = require('../models/couponModel');
const Banner = require('../models/bannerModel');
const auth = require('../middlewares/auth');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Encrypting password
const bcryptPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

// Send OTP via Twilio
const sendOtp = async (name, email, phone) => {
  try {
    const accountSid = 'ACecda62c279b9576ad7957cf209bfe32e';
    const authToken = process.env.TWILIO_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_NUMBER;

    const client = new twilio(accountSid, authToken);

    function generateOTP() {
      return Math.floor(1000 + Math.random() * 9000).toString();
    }

    async function sendOTP(phoneNumber, otp) {
      const message = await client.messages.create({
        body: `Your OTP code is: ${otp}`,
        from: twilioPhoneNumber,
        to: phoneNumber,
      });

      console.log(`SMS sent with SID: ${message.sid}`);
    }

    const userPhoneNumber = '+91' + phone;
    const otpCode = generateOTP();

    await sendOTP(userPhoneNumber, otpCode);
    console.log(`OTP sent to ${userPhoneNumber}.`);

    return otpCode;
  } catch (error) {
    console.error(`Error in sendOtp: ${error.message}`);
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const products = await Products.find()
    const categories = await Categories.find();
    const { otp, userData } = req.session;

    if (!userData) {
      return res.render('index', { message: 'User data not available. Verification failed.', categories,products:products });
    }

    const enteredOtp = req.body.enteredotp;
    const { name, email, phone, password } = userData;
    const passwordHash = await bcryptPassword(password);

    const user = new User({
      name,
      email,
      phone,
      password: passwordHash,
      is_admin: 0,
      is_verified: 1,
    });

    const users = await user.save();

    if (otp === enteredOtp) {
      const updateInfo = await User.findOneAndUpdate({ email }, { $set: { is_verified: 1 } });

      if (updateInfo) {
        return res.render('index', { message: 'Registered Successfully!!!!', categories,products:products });
      } else {
        return res.render('index', { message: 'Verification failed. Email not found.', categories,products:products });
      }
    } else {
      return res.render('index', { message: 'Verification failed. Incorrect OTP.', categories,products:products });
    }
  } catch (error) {
    const products = await Products.find()
    const categories = await Categories.find();
    console.error(`Error in verifyOtp: ${error.message}`);
    return res.render('index', { message: 'An error occurred during verification.', categories,products:products });
  }
};

// Load Login
const loadLogin = async (req, res) => {
  try {

    // delete after hosting==========
    req.session.user_id ='6582ddac9216622a54b05aa6'
    const userCart = await Cart.findOne({ user: req.session.user_id }).populate('items.product');
    const cart = userCart ? userCart.items : []; 
    req.session.cartItem = cart.length;
  

    const userWishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.product');
    const wishlist = userWishlist ? userWishlist.items : [];
    req.session.wishlistItems = wishlist.length;

// ===================================
const bannersPrimary = (await Banner.find().sort({ createdDate: -1 })).filter(item => item.position === 1);
const bannersSecondary = (await Banner.find().sort({ createdDate: -1 })).filter(item => item.position === 2);

const page = parseInt(req.query.page) || 2;
const perPage = parseInt(req.query.perPage) || 4;


const products = await Products.find().sort({ createdAt: -1 })
                               .limit(perPage*page);
    const categories = await Categories.find();
    const userData = await User.findById({_id : req.session.user_id })
    req.session.userImage = userData.image
   
      res.render('index', { categories ,products,bannersPrimary,bannersSecondary,page});
    
   
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

// Insert User
const insertUser = async (req, res) => {
  try {
    const categories = await Categories.find();
    const products = await Products.find()
    req.session.userData = req.body;
    const { name, email, phone, password } = req.body;

    const existingMail = await User.findOne({ email });

    if (existingMail) {
      console.log('existinguser');
      res.render('index', { message: 'you are an existing user please login', categories,products:products });
    } else {
      if (req.session.userData) {
        const otp = await sendOtp(name, email, phone);

        if (otp) {
          req.session.otp = otp;
          res.render('otpPage');
        }
        console.log('Generated OTP:', otp);
      } else {
        console.error('User data not available. Registration failed.');
      }
    }
  } catch (error) {
    console.error(`Error in insertUser: ${error.message}`);
  }
};

// Verify Login
const verifyLogin = async (req, res) => {
  try {
    const categories = await Categories.find();
    const products = await Products.find()
    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_verified === 0) {
          return res.render('index', { message: 'Please verify your email.', categories,products:products });
        } else {
          if (userData.isBlocked) {
            return res.render('index', { message: 'Your account is blocked.', categories,products:products });
          } else {
            if (userData.is_Admin === 1) {
              console.log('User is an admin');
              req.session.admin_id = userData._id;
              return res.redirect('/admin/dashboard');
            } else {
              req.session.user_id = userData._id;

              const userCart = await Cart.findOne({ user: req.session.user_id }).populate('items.product');
              const cart = userCart ? userCart.items : []; 
              req.session.cartItem = cart.length;

              const userWishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('items.product');
              const wishlist = userWishlist ? userWishlist.items : [];
              req.session.wishlistItems = wishlist.length;
              
              return res.render('index', { categories,products:products });
            }
          }
        }
      } else {
        return res.render('index', { message: 'Password is incorrect.', categories,products:products });
      }
    } else {
      return res.render('index', { message: 'Email is incorrect.', categories,products:products });
    }
  } catch (error) {
    console.error(`Error in verifyLogin: ${error.message}`);
  }
};

// showProfile==================================================================================================

const showProfile = async (req, res) => {
  try {
    const id = req.session.user_id 
    const coupon = await Coupon.find({})
    const userData = await User.findOne({ _id: id });
    const addresses = await Address.find({ user: id }).sort({ createdDate: -1 }).exec();
    const userOrders = await Order.find({
      user: id,     
      paymentStatus: "Payment Successful",
    });
    const totalOrders = userOrders.length;
    const totalSpending = userOrders.reduce(
      (acc, order) => acc + order.totalAmount,
      0
    );
    const uniqueProductIds = new Set(userOrders.flatMap(order => order.items.map(item => item.product)));
    const totalUniqueProducts = uniqueProductIds.size;
    const orderData = await Order.find({ user: id })
      .populate('user')
      .populate({
        path: 'address',
        model: 'Address',
      })
      .populate({
        path: 'items.product',
        model: 'Product',
      }).sort({ orderDate: -1 })

    res.render('showProfile', { userData, addresses, orderData, totalOrders, totalSpending, totalUniqueProducts,User:id,coupon })
  } catch (error) {
    console.log(error.message);
  }
}


// logOut===================================================================


const logOut = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Internal Server Error');
      }

      console.log('Session destroyed');
      res.redirect('/');
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Internal Server Error');
  }
};















module.exports = { loadLogin, insertUser, verifyOtp, verifyLogin,logOut,showProfile};
