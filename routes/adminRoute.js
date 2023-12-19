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

// category image storage--------------------------------------------------------------------------------------------------------------

const categoryUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/assets/imgs/categoryImages')),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
  })
});



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

// ...  middlewares-------------------------------------------------------------------

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
// =====resellers========================================================================================================


adminRoute
          .get('/resellerslist',rellersController.loadResellers)


//====categories=====================================================================================================================

adminRoute
          .get('/category',categoryControllers.loadCategories)
          .get('/createcategories',categoryControllers.createCategories)
          .get('/unlistcategory',categoryControllers.unlistCategory)
          .post('/createcategories',categoryUpload.single('file'),categoryControllers.insertCategories)

//=====products==============================================================================================================================
adminRoute
          .get('/productlist',productControllers.loadProducts)
          .get('/addproducts',productControllers.addProducts)
          .get('/unlistproduct',productControllers.unlistProduct)
          .get('/editproduct',productControllers.editProduct)
          .get('/dltproduct',productControllers.dltProduct)
          .post('/addproducts',uploadFields,productControllers.insertProduct)
          .post('/editproduct',uploadFields,productControllers.updateProduct)
         


          














  









//   .get('/home',auth.isLogin,adminControllers.LoadDashboard)
//   .get('/logout',auth.isLogin,adminControllers.logout)
//   .get('*',(req,res)=>res.redirect('/admin'))
//   .post('/',adminControllers.verifyAdmin)
       

module.exports = adminRoute;  