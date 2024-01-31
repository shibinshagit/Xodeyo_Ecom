const express = require('express');
const session = require('express-session');
const userRoute = express();
const config = require('../configurations/config')  
const auth = require('../middlewares/auth')
const userControllers = require('../controllers/userControllers');
const shopControllers = require('../controllers/shopControllers');
const cartControllers = require('../controllers/cartController');
const wishlistControllers = require('../controllers/wishlistConstroller');
const checkoutControllers = require('../controllers/checkoutControllers');
const addressControllers = require('../controllers/addressControllers');
const invoiceControllers = require('../controllers/invoiceController');
const couponController = require('../controllers/couponControllers');
const reelController = require('../controllers/reelController');

userRoute.use(express.json(), express.urlencoded({ extended: true }))  
         .use(express.static('public'))
         .use(session({secret:config.sessionSecret,resave: false , saveUninitialized: false}))
         .use((req, res, next) => {res.locals.session = req.session;next();})
         .set('view engine', 'ejs').set('views', './views/user')
   
              
// ====home========================================================================================================
userRoute.get('/',userControllers.loadLogin)
         .post('/signup', userControllers.insertUser)    
         .post('/login',userControllers.verifyLogin)
         .post('/otppage',userControllers.verifyOtp)  

// ======shop======================================================================================================  
userRoute.get('/shop',shopControllers.loadShop)
         .get('/showproducts',shopControllers.showProducts)

// ====cart=============================================================================================================  
userRoute.get('/cart',cartControllers.loadCart)
         .get('/addtoCart',cartControllers.addtoCart)
         .delete('/deleteCart',cartControllers.deleteCart)

// ====whishlist=============================================================================================================  
userRoute.get('/wishlist',wishlistControllers.loadWishlist)
         .get('/addtowishlist',wishlistControllers.addtoWishlist)
         .delete('/dltwishitem',wishlistControllers.dltWishitem)

// ====checkout=============================================================================================================  
userRoute.get('/checkout',checkoutControllers.loadcheckout)
         .get('/buynow',checkoutControllers.buyNow)
         .get('/cancelOrder',checkoutControllers.cancelOrder)
         .get('/generate-invoice/:orderId',invoiceControllers.generateInvoice)
         .get('/orderSuccess',checkoutControllers.loadOrderSuccess)        
         .get('/orderFailed',checkoutControllers.orderFailed)        
         .post('/addAddress',addressControllers.addAddress)
         .post('/applycoupon',checkoutControllers.applyCoupon)
         .post('/placeOrderCodWallet',checkoutControllers.placeOrderCodWallet)
         .post('/razorpay',checkoutControllers.razorpayOrder)
        

//=====profile======================================================================================================================
userRoute.get('/userProfile',userControllers.showProfile)
         .get('/userorderdetails',checkoutControllers.orderDetails)
         .get('/logout',userControllers.logOut)

         
// ======reelsection======================================================================================================  
userRoute.get('/reelsection',reelController.loadReels)
         
        


 








module.exports = userRoute;             