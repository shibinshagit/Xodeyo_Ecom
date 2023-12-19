const express = require('express');
const session = require('express-session');
const userRoute = express();
const config = require('../configurations/config')  
const auth = require('../middlewares/auth')
const userControllers = require('../controllers/userControllers');
const shopControllers = require('../controllers/shopControllers');

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

// ======shop=======================================================================================================  
userRoute.get('/shop',shopControllers.loadShop)
         .get('/showproducts',shopControllers.showProducts)












module.exports = userRoute;             