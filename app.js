const mongoose = require('mongoose');
const express = require('express');
const app = express();
const userRoute = require('./routes/userRoute')
const nocache= require("nocache")
const adminRoute = require('./routes/adminRoute')
require('dotenv').config(); 


app.use(nocache())
   .use(express.static('public'))
   .set('view engine','ejs')
   .set('views','./views/users')

//_________________________DB connection-------
mongoose.connect(process.env.MONGO_URL)
  .then(() => app.listen(3000, () => console.log('database connected, server is running')))
  .catch((err) => console.error('Error connecting to the database:', err));
 

  app.use('/',userRoute)
  app.use('/admin',adminRoute) 