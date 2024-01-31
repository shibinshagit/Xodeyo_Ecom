const express = require('express')
const adminRoute = express();
const session = require('express-session')
const multer = require('multer')
const path = require('path')
const config = require('../configurations/config')
const auth = require('../middlewares/adminAuth')
const adminControllers = require('../controllers/adminControllers');
const rellersController = require('../controllers/rellersController');
const categoryControllers = require('../controllers/categoryControllers');
const productControllers = require('../controllers/productControllers');
const settingsControllers = require('../controllers/settingsControllers');
const bannerControllers = require('../controllers/bannerControllers');
const couponControllers = require('../controllers/couponControllers');
const offerControllers = require('../controllers/offerControllers');
const checkoutControllers = require('../controllers/checkoutControllers');
const accountsController = require('../controllers/accountsController');

  
// category image storage--------------------------------------------------------------------------------------------------------------

const categoryUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/assets/imgs/categoryImages')),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
  })
});

// banner image storage--------------------------------------------------------------------------------------------------------------

const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/assets/imgs/bannerImages')),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
  })
});

// product image storage-------------------------------------------------------------------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/assets/imgs/productImages')),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
]);

// ...  Middlewares-------------------------------------------------------------------

adminRoute.use(express.json(),
               express.urlencoded({ extended: true }),
               session({ secret: config.sessionSecret, resave: false, saveUninitialized: false }),
               express.static('public'),)
          .set('view engine', 'ejs').set('views', './views/Admin')     
          
// ========Dashboard====================================================================================================
adminRoute
          .get('/',adminControllers.loadAdmin)
          .get('/logout',auth.isLogin,adminControllers.logout)
          .get('/dashboard',auth.isLogin,adminControllers.LoadDashboard)
          .get('/userslist',auth.isLogin,adminControllers.loadUsers)
          .get('/blockuser',adminControllers.blockUser)
          .post('/',adminControllers.verifyAdmin)
// =====Resellers========================================================================================================


adminRoute
          .get('/resellerslist',rellersController.loadResellers)


//====Categories=====================================================================================================================

adminRoute
          .get('/category',categoryControllers.loadCategories)
          .get('/createcategories',categoryControllers.createCategories)
          .get('/unlistcategory',categoryControllers.unlistCategory)
          .get('/dltcategories',categoryControllers.dltCategories)
          .post('/createcategories',categoryUpload.single('file'),categoryControllers.insertCategories)
         

//=====Products==============================================================================================================================
adminRoute
          .get('/productlist',productControllers.loadProducts)
          .get('/addproducts',productControllers.addProducts)
          .get('/unlistproduct',productControllers.unlistProduct)
          .get('/editproduct',productControllers.editProduct)
          .get('/dltproduct',productControllers.dltProduct)
          .post('/addproducts',uploadFields,productControllers.insertProduct)
          .post('/editproduct',uploadFields,productControllers.updateProduct)

//=====Banners==============================================================================================================================
adminRoute
          .get('/showBanner',bannerControllers.listBanners)
          .get('/createbanners',bannerControllers.addBanner)
          .put('/unlistbanner',bannerControllers.unlistBanner)
          .post('/createbanners',bannerUpload.single('file'),bannerControllers.insertBanner)
          .delete('/dltbanner',bannerControllers.dltBanner)
          
//=====Coupons==============================================================================================================================
adminRoute
          .get('/coupon',couponControllers.listCoupons)
          .get('/createcoupon',couponControllers.addCoupons)
          .put('/unlistCoupon',couponControllers.unlistCoupon)
          .post('/createcoupon',couponControllers.insertCoupon)
          .delete('/dltcoupon',couponControllers.dltCoupon)

//=====Offers==============================================================================================================================
adminRoute
          .get('/offers',offerControllers.listOffers)
          .get('/createoffer',offerControllers.createOffer)
          .put('/unlistoffer',offerControllers.unlistOffer)
          .post('/createoffer',offerControllers.insertOffer)

//=====Orders==============================================================================================================================
adminRoute
          .get('/orders',checkoutControllers.listOrders)

//=====Transaction==============================================================================================================================
adminRoute
          .get('/transaction',accountsController.listTransactions)
          .get('/orderstatus',accountsController.orderStatus)
          .get('/orderdetails',accountsController.orderDetails)

//=====Sales==============================================================================================================================
adminRoute
          .get('/sales',accountsController.listSales)
         
//=====Settings==============================================================================================================================
adminRoute
          .get('/settings',settingsControllers.loadSettings)
      
         


          














  









//   .get('/home',auth.isLogin,adminControllers.LoadDashboard)
//   .get('/logout',auth.isLogin,adminControllers.logout)
//   .get('*',(req,res)=>res.redirect('/admin'))
//   .post('/',adminControllers.verifyAdmin)
       

module.exports = adminRoute;  